<?php
require_once "db.php";

// ======================================
// 📥 GET CHAT ID
// ======================================
$chat_id = $_GET['chat_id'] ?? null;


// ======================================
// 📜 GET CHAT LIST (WITH TITLES)
// ======================================
if (!$chat_id) {

    $sql = "SELECT chat_id, 
                   MIN(title) as title, 
                   MAX(created_at) as last_time 
            FROM chats 
            GROUP BY chat_id 
            ORDER BY last_time DESC";

    $result = $conn->query($sql);

    if (!$result) {
        sendResponse("error", "Failed to fetch chat list");
    }

    $chats = [];

    while ($row = $result->fetch_assoc()) {
        $chats[] = [
            "chat_id" => $row['chat_id'],
            "title" => $row['title'] ?: "New Chat",
            "last_time" => $row['last_time']
        ];
    }

    sendResponse("success", "Chat list retrieved", $chats);
}


// ======================================
// 💬 GET MESSAGES FOR ONE CHAT
// ======================================
else {

    try {

        $sql = "SELECT user_message, bot_response, created_at 
                FROM chats 
                WHERE chat_id = ?
                ORDER BY id ASC";

        $stmt = $conn->prepare($sql);

        if (!$stmt) {
            throw new Exception("Prepare failed");
        }

        $stmt->bind_param("s", $chat_id);
        $stmt->execute();

        $result = $stmt->get_result();

        $messages = [];

        while ($row = $result->fetch_assoc()) {
            $messages[] = [
                "user" => $row['user_message'],
                "bot" => $row['bot_response'],
                "time" => $row['created_at']
            ];
        }

        sendResponse("success", "Messages retrieved", $messages);

    } catch (Exception $e) {
        error_log("GET CHAT ERROR: " . $e->getMessage());
        sendResponse("error", "Failed to load chat messages");
    }
}
?>