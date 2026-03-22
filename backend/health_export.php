<?php
require_once "db.php";
require_once "auth.php";

// ======================================
// 📊 HEALTH DATA EXPORT API
// ======================================

/**
 * Export user's health data in various formats
 */
function exportHealthData($user_id, $format = 'json', $date_range = null) {
    global $conn;
    
    // Build date range filter
    $date_filter = "";
    if ($date_range && isset($date_range['start']) && isset($date_range['end'])) {
        $date_filter = " AND created_at BETWEEN ? AND ?";
    }
    
    $data = [
        'user_info' => null,
        'chats' => [],
        'symptoms' => [],
        'periods' => [],
        'health_records' => [],
        'appointments' => [],
        'export_date' => date('Y-m-d H:i:s'),
        'date_range' => $date_range ?: 'all'
    ];
    
    // Get user info
    $stmt = $conn->prepare("SELECT id, email, first_name, last_name, date_of_birth, created_at FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $data['user_info'] = $stmt->get_result()->fetch_assoc();
    
    // Get chats
    $sql = "SELECT chat_id, title, user_message, bot_response, created_at FROM chats WHERE user_id = ?" . $date_filter . " ORDER BY created_at DESC";
    $stmt = $conn->prepare($sql);
    
    if ($date_filter) {
        $stmt->bind_param("iss", $user_id, $date_range['start'], $date_range['end']);
    } else {
        $stmt->bind_param("i", $user_id);
    }
    
    $stmt->execute();
    $data['chats'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Get symptoms
    $sql = "SELECT symptom, severity, body_part, notes, created_at FROM symptoms WHERE user_id = ?" . $date_filter . " ORDER BY created_at DESC";
    $stmt = $conn->prepare($sql);
    
    if ($date_filter) {
        $stmt->bind_param("iss", $user_id, $date_range['start'], $date_range['end']);
    } else {
        $stmt->bind_param("i", $user_id);
    }
    
    $stmt->execute();
    $data['symptoms'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Get periods
    $sql = "SELECT last_period, cycle_length, flow_intensity, symptoms, notes, created_at FROM periods WHERE user_id = ?" . $date_filter . " ORDER BY created_at DESC";
    $stmt = $conn->prepare($sql);
    
    if ($date_filter) {
        $stmt->bind_param("iss", $user_id, $date_range['start'], $date_range['end']);
    } else {
        $stmt->bind_param("i", $user_id);
    }
    
    $stmt->execute();
    $data['periods'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Get health records
    $sql = "SELECT record_type, value, unit, notes, recorded_at FROM health_records WHERE user_id = ?" . $date_filter . " ORDER BY recorded_at DESC";
    $stmt = $conn->prepare($sql);
    
    if ($date_filter) {
        $stmt->bind_param("iss", $user_id, $date_range['start'], $date_range['end']);
    } else {
        $stmt->bind_param("i", $user_id);
    }
    
    $stmt->execute();
    $data['health_records'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Get appointments
    $sql = "SELECT doctor_name, specialty, appointment_date, location, notes, status FROM appointments WHERE user_id = ?" . $date_filter . " ORDER BY appointment_date DESC";
    $stmt = $conn->prepare($sql);
    
    if ($date_filter) {
        $stmt->bind_param("iss", $user_id, $date_range['start'], $date_range['end']);
    } else {
        $stmt->bind_param("i", $user_id);
    }
    
    $stmt->execute();
    $data['appointments'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Format output based on requested format
    switch (strtolower($format)) {
        case 'csv':
            return exportToCSV($data);
        case 'pdf':
            return exportToPDF($data);
        case 'json':
        default:
            return $data;
    }
}

/**
 * Export data to CSV format
 */
function exportToCSV($data) {
    $csv = "Alera Health Data Export\n";
    $csv .= "Export Date: " . $data['export_date'] . "\n";
    $csv .= "User: " . $data['user_info']['first_name'] . " " . $data['user_info']['last_name'] . " (" . $data['user_info']['email'] . ")\n\n";
    
    // Symptoms CSV
    $csv .= "=== SYMPTOMS ===\n";
    $csv .= "Date,Symptom,Severity,Body Part,Notes\n";
    foreach ($data['symptoms'] as $symptom) {
        $csv .= $symptom['created_at'] . "," . 
                 str_replace(',', ';', $symptom['symptom']) . "," . 
                 $symptom['severity'] . "," . 
                 $symptom['body_part'] . "," . 
                 str_replace(',', ';', $symptom['notes'] ?? '') . "\n";
    }
    
    // Health Records CSV
    $csv .= "\n=== HEALTH RECORDS ===\n";
    $csv .= "Date,Type,Value,Unit,Notes\n";
    foreach ($data['health_records'] as $record) {
        $csv .= $record['recorded_at'] . "," . 
                 $record['record_type'] . "," . 
                 $record['value'] . "," . 
                 $record['unit'] . "," . 
                 str_replace(',', ';', $record['notes'] ?? '') . "\n";
    }
    
    return [
        'content' => $csv,
        'filename' => 'alera_health_data_' . date('Y-m-d') . '.csv',
        'mime_type' => 'text/csv'
    ];
}

/**
 * Export data to PDF format (basic implementation)
 */
function exportToPDF($data) {
    // This is a basic text-based PDF export
    // In production, you'd use a library like TCPDF or FPDF
    $pdf_content = "ALERA HEALTH DATA REPORT\n";
    $pdf_content .= "Generated: " . $data['export_date'] . "\n\n";
    $pdf_content .= "Patient: " . $data['user_info']['first_name'] . " " . $data['user_info']['last_name'] . "\n";
    $pdf_content .= "Email: " . $data['user_info']['email'] . "\n\n";
    
    $pdf_content .= "=== SYMPTOMS ===\n";
    foreach ($data['symptoms'] as $symptom) {
        $pdf_content .= "Date: " . $symptom['created_at'] . "\n";
        $pdf_content .= "Symptom: " . $symptom['symptom'] . "\n";
        $pdf_content .= "Severity: " . $symptom['severity'] . "\n";
        $pdf_content .= "Body Part: " . $symptom['body_part'] . "\n";
        $pdf_content .= "Notes: " . ($symptom['notes'] ?? 'None') . "\n\n";
    }
    
    return [
        'content' => $pdf_content,
        'filename' => 'alera_health_data_' . date('Y-m-d') . '.txt',
        'mime_type' => 'text/plain'
    ];
}

/**
 * Handle export requests
 */
function handleExportRequest() {
    $user = requireAuth();
    
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method !== 'GET') {
        sendResponse("error", "Method not allowed");
    }
    
    $format = $_GET['format'] ?? 'json';
    $start_date = $_GET['start_date'] ?? null;
    $end_date = $_GET['end_date'] ?? null;
    
    // Validate format
    if (!in_array($format, ['json', 'csv', 'pdf'])) {
        sendResponse("error", "Invalid format. Supported formats: json, csv, pdf");
    }
    
    // Build date range
    $date_range = null;
    if ($start_date && $end_date) {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
            sendResponse("error", "Invalid date format. Use YYYY-MM-DD");
        }
        
        $date_range = [
            'start' => $start_date . ' 00:00:00',
            'end' => $end_date . ' 23:59:59'
        ];
    }
    
    try {
        $export_data = exportHealthData($user->user_id, $format, $date_range);
        
        if ($format === 'json') {
            sendResponse("success", "Health data exported", $export_data);
        } else {
            // For CSV/PDF, return file download info
            header('Content-Type: ' . $export_data['mime_type']);
            header('Content-Disposition: attachment; filename="' . $export_data['filename'] . '"');
            echo $export_data['content'];
            exit;
        }
        
    } catch (Exception $e) {
        error_log("EXPORT ERROR: " . $e->getMessage());
        sendResponse("error", "Failed to export health data");
    }
}

/**
 * Get health summary statistics
 */
function getHealthSummary() {
    $user = requireAuth();
    global $conn;
    
    try {
        $summary = [];
        
        // Symptom statistics
        $stmt = $conn->prepare("
            SELECT 
                COUNT(*) as total_symptoms,
                COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_symptoms,
                body_part,
                COUNT(*) as count
            FROM symptoms 
            WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY body_part
        ");
        $stmt->bind_param("i", $user->user_id);
        $stmt->execute();
        $summary['symptoms_by_body_part'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        
        // Recent activity
        $stmt = $conn->prepare("
            SELECT 
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as chats_this_week,
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as chats_this_month,
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as symptoms_this_week,
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as symptoms_this_month
            FROM chats 
            WHERE user_id = ?
        ");
        $stmt->bind_param("i", $user->user_id);
        $stmt->execute();
        $summary['activity'] = $stmt->get_result()->fetch_assoc();
        
        // Next period prediction
        $stmt = $conn->prepare("CALL PredictNextPeriod(?)");
        $stmt->bind_param("i", $user->user_id);
        $stmt->execute();
        $summary['period_prediction'] = $stmt->get_result()->fetch_assoc();
        
        sendResponse("success", "Health summary retrieved", $summary);
        
    } catch (Exception $e) {
        error_log("HEALTH SUMMARY ERROR: " . $e->getMessage());
        sendResponse("error", "Failed to generate health summary");
    }
}

// Auto-handle if this file is accessed directly
if (basename($_SERVER['PHP_SELF']) === 'health_export.php') {
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    
    // CORS preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");
        exit(0);
    }
    
    switch ($path) {
        case '/backend/health_export.php/export':
            handleExportRequest();
            break;
            
        case '/backend/health_export.php/summary':
            getHealthSummary();
            break;
            
        default:
            sendResponse("error", "Endpoint not found");
    }
}
?>
