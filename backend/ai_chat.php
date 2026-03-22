<?php
require_once "db.php";

// ======================================
// 🔐 SECURITY & RATE LIMITING
// ======================================
// Rate limiting: 5 requests per minute per IP
$client_ip = $_SERVER['REMOTE_ADDR'];
$rate_limit_key = "ai_chat_" . md5($client_ip);

// Simple in-memory rate limiting (for production, use Redis)
if (!isset($_SESSION['ai_requests'])) {
    $_SESSION['ai_requests'] = [];
}

$current_time = time();
$_SESSION['ai_requests'] = array_filter($_SESSION['ai_requests'], function($timestamp) use ($current_time) {
    return $current_time - $timestamp < 60; // Keep only last minute
});

if (count($_SESSION['ai_requests']) >= 5) {
    sendResponse("error", "Too many requests. Please wait a moment before trying again.");
}

$_SESSION['ai_requests'][] = $current_time;

// ======================================
// 🔐 LOAD GEMINI API KEY FROM ENV
// ======================================
$API_KEY = getenv("GEMINI_API_KEY");

if (!$API_KEY) {
    error_log("GEMINI_API_KEY not found in environment");
    sendResponse("error", "AI service temporarily unavailable. Please try again later.");
}

// ======================================
// 📥 GET USER MESSAGE
// ======================================
$data = getJSONInput();

if (!isset($data['message'])) {
    sendResponse("error", "Message is required");
}

$message = cleanInput($data['message']);
$user_id = $data['user_id'] ?? null;
$session_id = $data['session_id'] ?? session_id();

// Validate message length
if (strlen($message) < 3) {
    sendResponse("error", "Message must be at least 3 characters long");
}

if (strlen($message) > 1000) {
    sendResponse("error", "Message is too long. Please keep it under 1000 characters");
}

// Content filtering
$blocked_words = ['suicide', 'kill myself', 'harm', 'self harm', 'end my life'];
foreach ($blocked_words as $word) {
    if (stripos($message, $word) !== false) {
        sendResponse("error", "If you're having thoughts of self-harm, please reach out to a crisis hotline immediately. In the US: 988, UK: 111, or contact local emergency services.");
    }
}

// ======================================
// 🧠 BUILD CONTEXTUAL ALERA PROMPT
// ======================================
$current_page = $data['page'] ?? 'general';
$chat_history = $data['chat_history'] ?? [];

$prompt = "You are Dr. Alera, a compassionate female AI health assistant specialized in women's healthcare.

Your expertise includes:
- Breast health and self-examinations
- Vaginal health and infections  
- Menstrual cycle and period care
- General women's wellness

IMPORTANT GUIDELINES:
- NEVER provide medical diagnoses
- ALWAYS include: 'This advice is for guidance only and does not replace a medical professional.'
- Be empathetic, supportive, and professional
- Encourage professional medical care when appropriate
- Keep responses clear and easy to understand
- For serious symptoms, always recommend seeing a doctor

Current context: User is on the {$current_page} page
Chat history: " . implode(" | ", array_slice($chat_history, -3)) . "

User message: {$message}

Please provide a helpful, safe response following these guidelines.";

// ======================================
// 🌐 CALL GEMINI API (SERVER SIDE)
// ======================================
$url = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=" . $API_KEY;

$payload = json_encode([
    "contents" => [
        [
            "parts" => [
                ["text" => $prompt]
            ]
        ]
    ],
    "generationConfig" => [
        "temperature" => 0.7,
        "topK" => 40,
        "topP" => 0.95,
        "maxOutputTokens" => 1000
    ],
    "safetySettings" => [
        [
            "category" => "HARM_CATEGORY_HARASSMENT",
            "threshold" => "BLOCK_MEDIUM_AND_ABOVE"
        ],
        [
            "category" => "HARM_CATEGORY_HATE_SPEECH", 
            "threshold" => "BLOCK_MEDIUM_AND_ABOVE"
        ],
        [
            "category" => "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold" => "BLOCK_MEDIUM_AND_ABOVE"
        ],
        [
            "category" => "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold" => "BLOCK_MEDIUM_AND_ABOVE"
        ]
    ]
]);

$options = [
    "http" => [
        "header"  => "Content-Type: application/json",
        "method"  => "POST",
        "content" => $payload,
        "timeout" => 30 // 30 second timeout
    ]
];

$context = stream_context_create($options);

// ======================================
// 🚨 ERROR HANDLING & LOGGING
// ======================================
debugLog("AI Chat Request - User: " . ($user_id ?? 'anonymous') . " - Message: " . substr($message, 0, 50));

$response = @file_get_contents($url, false, $context);

if ($response === FALSE) {
    $error = error_get_last();
    debugLog("AI API Error: " . ($error['message'] ?? 'Unknown error'));
    sendResponse("error", "AI service temporarily unavailable. Please try again later.");
}

$result = json_decode($response, true);

if (!$result) {
    debugLog("Invalid JSON response from AI API");
    sendResponse("error", "AI service returned invalid response. Please try again.");
}

// ======================================
// 🧠 EXTRACT AI RESPONSE
// ======================================
if (isset($result['candidates'][0]['content']['parts'][0]['text'])) {
    $reply = $result['candidates'][0]['content']['parts'][0]['text'];
    
    // Additional safety check
    if (empty(trim($reply))) {
        $reply = "I apologize, but I couldn't generate a proper response. Please try rephrasing your question.";
    }
    
    // Log successful response
    debugLog("AI Response generated successfully - Length: " . strlen($reply));
    
} else {
    debugLog("Unexpected AI API response structure: " . json_encode($result));
    $reply = "I apologize, but I'm having trouble understanding your request. Could you please rephrase your question?";
}

// ======================================
// 💾 SAVE CHAT TO DATABASE
// ======================================
try {
    $chat_id = $data['chat_id'] ?? uniqid("chat_", true);
    
    // Generate smart title from first message
    $title = substr($message, 0, 50);
    if (strlen($message) > 50) {
        $title .= "...";
    }
    
    $sql = "INSERT INTO chats (chat_id, user_id, title, user_message, bot_response, session_id) 
            VALUES (?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception("Database prepare failed: " . $conn->error);
    }

    $stmt->bind_param("sissss", $chat_id, $user_id, $title, $message, $reply, $session_id);

    if (!$stmt->execute()) {
        throw new Exception("Database execute failed: " . $stmt->error);
    }

    debugLog("Chat saved successfully - Chat ID: " . $chat_id);

} catch (Exception $e) {
    error_log("SAVE CHAT ERROR: " . $e->getMessage());
    // Continue without failing - the response is still valid
}

// ======================================
// 📊 LOG ANALYTICS
// ======================================
try {
    $analytics_sql = "INSERT INTO analytics (user_id, event_type, event_data, ip_address) 
                      VALUES (?, ?, ?, ?)";
    
    $analytics_stmt = $conn->prepare($analytics_sql);
    $event_data = json_encode([
        'chat_id' => $chat_id ?? 'unknown',
        'message_length' => strlen($message),
        'response_length' => strlen($reply),
        'page' => $current_page
    ]);
    
    $analytics_stmt->bind_param("issss", $user_id, 'ai_chat', $event_data, $client_ip);
    $analytics_stmt->execute();
    
} catch (Exception $e) {
    // Analytics failure shouldn't break the main functionality
    error_log("ANALYTICS ERROR: " . $e->getMessage());
}

// ======================================
// ✅ RETURN RESPONSE TO FRONTEND
// ======================================
sendResponse("success", "AI response generated", [
    "reply" => $reply,
    "chat_id" => $chat_id ?? null,
    "timestamp" => date('Y-m-d H:i:s')
]);
?>