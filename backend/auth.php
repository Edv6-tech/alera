<?php
require_once "db.php";

// ======================================
// 🔐 AUTHENTICATION MIDDLEWARE
// ======================================

/**
 * Generate JWT Token
 */
function generateJWT($user_id, $email) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'user_id' => $user_id,
        'email' => $email,
        'iat' => time(),
        'exp' => time() + (24 * 60 * 60) // 24 hours
    ]);
    
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, getenv('JWT_SECRET'), true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

/**
 * Verify JWT Token
 */
function verifyJWT($token) {
    if (!$token) {
        return false;
    }
    
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }
    
    $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[0]));
    $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1]));
    $signature = $parts[2];
    
    $payload_obj = json_decode($payload);
    if (!$payload_obj || time() > $payload_obj->exp) {
        return false;
    }
    
    $expected_signature = hash_hmac('sha256', $parts[0] . "." . $parts[1], getenv('JWT_SECRET'), true);
    $base64UrlExpectedSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($expected_signature));
    
    return hash_equals($signature, $base64UrlExpectedSignature) ? $payload_obj : false;
}

/**
 * Get current authenticated user
 */
function getCurrentUser() {
    $headers = getallheaders();
    $auth_header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (!$auth_header) {
        return null;
    }
    
    if (preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
        $token = $matches[1];
        return verifyJWT($token);
    }
    
    return null;
}

/**
 * Require authentication
 */
function requireAuth() {
    $user = getCurrentUser();
    
    if (!$user) {
        sendResponse("error", "Authentication required", [
            "code" => "AUTH_REQUIRED"
        ]);
    }
    
    return $user;
}

/**
 * Hash password securely
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_ARGON2ID);
}

/**
 * Verify password
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * User registration
 */
function registerUser($email, $password, $first_name, $last_name, $date_of_birth = null) {
    global $conn;
    
    // Check if user already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        sendResponse("error", "User with this email already exists");
    }
    
    // Hash password and create user
    $password_hash = hashPassword($password);
    
    $stmt = $conn->prepare("INSERT INTO users (email, password_hash, first_name, last_name, date_of_birth) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $email, $password_hash, $first_name, $last_name, $date_of_birth);
    
    if ($stmt->execute()) {
        $user_id = $conn->insert_id;
        $token = generateJWT($user_id, $email);
        
        sendResponse("success", "User registered successfully", [
            "user_id" => $user_id,
            "token" => $token,
            "user" => [
                "id" => $user_id,
                "email" => $email,
                "first_name" => $first_name,
                "last_name" => $last_name
            ]
        ]);
    } else {
        sendResponse("error", "Registration failed");
    }
}

/**
 * User login
 */
function loginUser($email, $password) {
    global $conn;
    
    $stmt = $conn->prepare("SELECT id, email, password_hash, first_name, last_name FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendResponse("error", "Invalid email or password");
    }
    
    $user = $result->fetch_assoc();
    
    if (!verifyPassword($password, $user['password_hash'])) {
        sendResponse("error", "Invalid email or password");
    }
    
    $token = generateJWT($user['id'], $user['email']);
    
    // Update last login
    $update_stmt = $conn->prepare("UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    $update_stmt->bind_param("i", $user['id']);
    $update_stmt->execute();
    
    sendResponse("success", "Login successful", [
        "user_id" => $user['id'],
        "token" => $token,
        "user" => [
            "id" => $user['id'],
            "email" => $user['email'],
            "first_name" => $user['first_name'],
            "last_name" => $user['last_name']
        ]
    ]);
}

/**
 * Handle auth requests
 */
function handleAuthRequest() {
    $method = $_SERVER['REQUEST_METHOD'];
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    
    // CORS preflight
    if ($method === 'OPTIONS') {
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");
        exit(0);
    }
    
    switch ($path) {
        case '/backend/auth.php/register':
            if ($method === 'POST') {
                $data = getJSONInput();
                registerUser(
                    $data['email'] ?? '',
                    $data['password'] ?? '',
                    $data['first_name'] ?? '',
                    $data['last_name'] ?? '',
                    $data['date_of_birth'] ?? null
                );
            }
            break;
            
        case '/backend/auth.php/login':
            if ($method === 'POST') {
                $data = getJSONInput();
                loginUser($data['email'] ?? '', $data['password'] ?? '');
            }
            break;
            
        case '/backend/auth.php/me':
            if ($method === 'GET') {
                $user = requireAuth();
                global $conn;
                $stmt = $conn->prepare("SELECT id, email, first_name, last_name, date_of_birth, created_at FROM users WHERE id = ?");
                $stmt->bind_param("i", $user->user_id);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($user_data = $result->fetch_assoc()) {
                    sendResponse("success", "User data retrieved", $user_data);
                } else {
                    sendResponse("error", "User not found");
                }
            }
            break;
            
        case '/backend/auth.php/logout':
            if ($method === 'POST') {
                // In a real implementation, you might want to blacklist the token
                sendResponse("success", "Logged out successfully");
            }
            break;
            
        default:
            sendResponse("error", "Endpoint not found");
    }
}

// Auto-handle if this file is accessed directly
if (basename($_SERVER['PHP_SELF']) === 'auth.php') {
    handleAuthRequest();
}
?>
