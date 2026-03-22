<?php
require_once "db.php";

// ======================================
// 📥 GET JSON INPUT
// ======================================
$data = getJSONInput();


// ======================================
// 🧼 VALIDATE INPUT
// ======================================
if (!isset($data['symptom'])) {
    sendResponse("error", "Symptom is required");
}

$symptom = cleanInput($data['symptom']);

if (empty($symptom)) {
    sendResponse("error", "Symptom cannot be empty");
}


// ======================================
// 🧠 OPTIONAL: DETECT SEVERITY
// ======================================
$severity = "normal";

$criticalKeywords = ["lump", "severe pain", "bleeding", "extreme pain", "infection"];

foreach ($criticalKeywords as $word) {
    if (stripos($symptom, $word) !== false) {
        $severity = "critical";
        break;
    }
}


// ======================================
// 💾 INSERT INTO DATABASE
// ======================================
try {
    $sql = "INSERT INTO symptoms (symptom) VALUES (?)";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception("Prepare failed");
    }

    $stmt->bind_param("s", $symptom);

    if (!$stmt->execute()) {
        throw new Exception("Execute failed");
    }

    // ======================================
    // ✅ SUCCESS RESPONSE
    // ======================================
    sendResponse("success", "Symptom saved successfully", [
        "symptom" => $symptom,
        "severity" => $severity
    ]);

} catch (Exception $e) {
    error_log("SAVE SYMPTOM ERROR: " . $e->getMessage());
    sendResponse("error", "Failed to save symptom");
}
?>