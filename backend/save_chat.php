<?php
require_once "db.php";

// ======================================
// 📥 GET JSON INPUT
// ======================================
$data = getJSONInput();


// ======================================
// 🧼 VALIDATE INPUT
// ======================================
if (!isset($data['user']) || !isset($data['bot'])) {
    sendResponse("error", "Missing required fields");
}

$user = cleanInput($data['user']);
$bot = cleanInput($data['bot']);

// Prevent empty messages
if (empty($user) || empty($bot)) {
    sendResponse("error", "Message cannot be empty");
}


// ======================================
// 💾 INSERT INTO DATABASE
// ======================================
try {

    $chat_id = $data['chat_id'] ?? uniqid("chat_");

    $sql = "INSERT INTO chats (chat_id, user_message, bot_response) VALUES (?, ?, ?)";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception("Prepare failed");
    }

    $stmt->bind_param("sss", $chat_id, $user, $bot);

    if (!$stmt->execute()) {
        throw new Exception("Execute failed");
    }

    // ======================================
    // ✅ SUCCESS RESPONSE
    // ======================================
    sendResponse("success", "Chat saved", [
        "chat_id" => $chat_id
    ]);

} catch (Exception $e) {

    error_log("SAVE CHAT ERROR: " . $e->getMessage());

    sendResponse("error", "Failed to save chat");
}
?>