<?php
require_once "db.php";

// ======================================
// 📥 GET JSON INPUT
// ======================================
$data = getJSONInput();


// ======================================
// 🧼 VALIDATE INPUT
// ======================================
if (!isset($data['date']) || !isset($data['cycle'])) {
    sendResponse("error", "Missing required fields");
}

$date = cleanInput($data['date']);
$cycle = (int) $data['cycle'];


// ======================================
// 📅 VALIDATE DATE FORMAT
// ======================================
if (!preg_match("/^\d{4}-\d{2}-\d{2}$/", $date)) {
    sendResponse("error", "Invalid date format (YYYY-MM-DD required)");
}


// ======================================
// 🔢 VALIDATE CYCLE LENGTH
// ======================================
if ($cycle < 20 || $cycle > 45) {
    sendResponse("error", "Cycle length must be between 20 and 45 days");
}


// ======================================
// 💾 INSERT INTO DATABASE
// ======================================
try {
    $sql = "INSERT INTO periods (last_period, cycle_length) VALUES (?, ?)";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception("Prepare failed");
    }

    $stmt->bind_param("si", $date, $cycle);

    if (!$stmt->execute()) {
        throw new Exception("Execute failed");
    }

    // ======================================
    // 📅 CALCULATE NEXT PERIOD
    // ======================================
    $nextPeriod = date("Y-m-d", strtotime($date . " + $cycle days"));

    // ======================================
    // ✅ SUCCESS RESPONSE
    // ======================================
    sendResponse("success", "Period saved successfully", [
        "last_period" => $date,
        "cycle_length" => $cycle,
        "next_period" => $nextPeriod
    ]);

} catch (Exception $e) {
    error_log("SAVE PERIOD ERROR: " . $e->getMessage());
    sendResponse("error", "Failed to save period data");
}
?>