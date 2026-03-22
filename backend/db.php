<?php
// ======================================
// 🌍 LOAD ENV FILE (SECURE)
// ======================================
function loadEnv($filepath) {
    if (!file_exists($filepath)) {
        die("Error: .env file not found at " . $filepath);
    }
    
    $lines = file($filepath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue; // Skip comments
        if (strpos($line, '=') === false) continue;
        
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        
        putenv("$key=$value");
        $_ENV[$key] = $value;
    }
}

// Load .env from parent directory
loadEnv(__DIR__ . "/../.env");


// ======================================
// 🌍 GLOBAL HEADERS (API READY)
// ======================================
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");


// ======================================
// ⚙️ ENV CONFIG (BEST PRACTICE)
// ======================================
define("DB_HOST", getenv("DB_HOST") ?: "localhost");
define("DB_USER", getenv("DB_USER") ?: "root");
define("DB_PASS", getenv("DB_PASS") ?: "");
define("DB_NAME", getenv("DB_NAME") ?: "alera");


// ======================================
// 🧠 RESPONSE HANDLER (CLEAN OUTPUT)
// ======================================
function sendResponse($status, $message, $data = null) {
    echo json_encode([
        "status" => $status,
        "message" => $message,
        "data" => $data
    ]);
    exit();
}


// ======================================
// 🔌 DATABASE CONNECTION CLASS
// ======================================
class Database {
    private $conn;

    public function connect() {
        $this->conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

        if ($this->conn->connect_error) {
            error_log("DB ERROR: " . $this->conn->connect_error);
            sendResponse("error", "Database connection failed");
        }

        $this->conn->set_charset("utf8mb4");

        return $this->conn;
    }
}


// ======================================
// 🚀 INITIALIZE CONNECTION
// ======================================
try {
    $database = new Database();
    $conn = $database->connect();
} catch (Exception $e) {
    error_log("SYSTEM ERROR: " . $e->getMessage());
    sendResponse("error", "Something went wrong");
}


// ======================================
// 🧰 HELPER FUNCTIONS (ADVANCED)
// ======================================

// Sanitize input
function cleanInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

// Get JSON request body safely
function getJSONInput() {
    $input = json_decode(file_get_contents("php://input"), true);

    if (!$input) {
        sendResponse("error", "Invalid JSON input");
    }

    return $input;
}

// Optional debug mode (turn OFF in production)
define("DEBUG_MODE", true);

function debugLog($message) {
    if (DEBUG_MODE) {
        error_log("[DEBUG] " . $message);
    }
}
?>