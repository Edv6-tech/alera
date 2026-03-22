-- ======================================
-- 🏥 ALERA HEALTH APP - DATABASE SCHEMA
-- ======================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS alera;
USE alera;

-- ======================================
-- 👤 USERS TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    phone VARCHAR(20),
    profile_image VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_created (created_at)
);

-- ======================================
-- 💬 CHATS TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id VARCHAR(50) NOT NULL,
    user_id INT,
    title VARCHAR(255),
    user_message TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_chat_id (chat_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created (created_at)
);

-- ======================================
-- 🩺 SYMPTOMS TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS symptoms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    symptom TEXT NOT NULL,
    severity ENUM('normal', 'moderate', 'critical') DEFAULT 'normal',
    body_part ENUM('breast', 'vaginal', 'menstrual', 'general') NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_severity (severity),
    INDEX idx_body_part (body_part),
    INDEX idx_created (created_at)
);

-- ======================================
-- 📅 PERIODS TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS periods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    last_period DATE NOT NULL,
    cycle_length INT DEFAULT 28,
    flow_intensity ENUM('light', 'moderate', 'heavy') DEFAULT 'moderate',
    symptoms JSON,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_last_period (last_period)
);

-- ======================================
-- 📊 HEALTH_RECORDS TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS health_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    record_type ENUM('weight', 'blood_pressure', 'temperature', 'mood', 'exercise') NOT NULL,
    value DECIMAL(10,2),
    unit VARCHAR(20),
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_record_type (record_type),
    INDEX idx_recorded_at (recorded_at)
);

-- ======================================
-- 🏥 APPOINTMENTS TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    doctor_name VARCHAR(255) NOT NULL,
    specialty VARCHAR(100),
    appointment_date DATETIME NOT NULL,
    location VARCHAR(255),
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_status (status)
);

-- ======================================
-- 🔔 NOTIFICATIONS TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('reminder', 'alert', 'info') DEFAULT 'info',
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_is_read (is_read)
);

-- ======================================
-- 📝 USER_PREFERENCES TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_preference (user_id, preference_key),
    INDEX idx_user_id (user_id)
);

-- ======================================
-- 🔄 SESSIONS TABLE (for authentication)
-- ======================================
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_expires_at (expires_at)
);

-- ======================================
-- 📈 ANALYTICS TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    event_type VARCHAR(50) NOT NULL,
    event_data JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created (created_at)
);

-- ======================================
-- 📝 SAMPLE DATA (for development)
-- ======================================

-- Insert sample user (password: password123)
INSERT IGNORE INTO users (email, password_hash, first_name, last_name, date_of_birth) VALUES 
('demo@alera.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Demo', 'User', '1990-01-01');

-- Insert sample preferences
INSERT IGNORE INTO user_preferences (user_id, preference_key, preference_value) VALUES 
(1, 'theme', 'light'),
(1, 'notifications_enabled', 'true'),
(1, 'language', 'en');

-- Insert sample health record
INSERT IGNORE INTO health_records (user_id, record_type, value, unit, notes) VALUES 
(1, 'weight', '65.5', 'kg', 'Morning weight after breakfast'),
(1, 'blood_pressure', '120.80', 'mmHg', 'Normal reading');

-- ======================================
-- 🎯 VIEWS FOR COMMON QUERIES
-- ======================================

-- View for user's recent health summary
CREATE OR REPLACE VIEW user_health_summary AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    COUNT(DISTINCT c.chat_id) as total_chats,
    COUNT(DISTINCT s.id) as total_symptoms,
    COUNT(DISTINCT h.id) as total_health_records,
    MAX(c.created_at) as last_chat_date,
    MAX(s.created_at) as last_symptom_date
FROM users u
LEFT JOIN chats c ON u.id = c.user_id
LEFT JOIN symptoms s ON u.id = s.user_id
LEFT JOIN health_records h ON u.id = h.user_id
GROUP BY u.id, u.first_name, u.last_name;

-- View for upcoming appointments
CREATE OR REPLACE VIEW upcoming_appointments AS
SELECT 
    a.id,
    u.first_name,
    u.last_name,
    a.doctor_name,
    a.specialty,
    a.appointment_date,
    a.location,
    a.notes,
    DATEDIFF(a.appointment_date, NOW()) as days_until
FROM appointments a
JOIN users u ON a.user_id = u.id
WHERE a.status = 'scheduled' 
AND a.appointment_date > NOW()
ORDER BY a.appointment_date ASC;

-- ======================================
-- 🔧 STORED PROCEDURES
-- ======================================

DELIMITER //

-- Procedure to get user's health insights
CREATE PROCEDURE GetUserHealthInsights(IN user_id_param INT)
BEGIN
    SELECT 
        COUNT(*) as total_symptoms,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_symptoms,
        COUNT(CASE WHEN body_part = 'breast' THEN 1 END) as breast_symptoms,
        COUNT(CASE WHEN body_part = 'menstrual' THEN 1 END) as menstrual_symptoms,
        DATE(created_at) as symptom_date
    FROM symptoms 
    WHERE user_id = user_id_param 
    AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE(created_at)
    ORDER BY symptom_date DESC
    LIMIT 10;
END //

-- Procedure to calculate next period prediction
CREATE PROCEDURE PredictNextPeriod(IN user_id_param INT)
BEGIN
    SELECT 
        last_period,
        cycle_length,
        DATE_ADD(last_period, INTERVAL cycle_length DAY) as predicted_next_period,
        DATE_ADD(last_period, INTERVAL (cycle_length + 7) DAY) as latest_expected,
        DATEDIFF(DATE_ADD(last_period, INTERVAL cycle_length DAY), CURDATE()) as days_until_next
    FROM periods 
    WHERE user_id = user_id_param 
    ORDER BY created_at DESC 
    LIMIT 1;
END //

DELIMITER ;

-- ======================================
-- 📊 TRIGGERS FOR DATA INTEGRITY
-- ======================================

DELIMITER //

-- Trigger to update user's updated_at when preferences change
CREATE TRIGGER update_user_timestamp 
AFTER UPDATE ON user_preferences
FOR EACH ROW
BEGIN
    UPDATE users 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.user_id;
END //

-- Trigger to log chat analytics
CREATE TRIGGER log_chat_analytics
AFTER INSERT ON chats
FOR EACH ROW
BEGIN
    INSERT INTO analytics (user_id, event_type, event_data)
    VALUES (NEW.user_id, 'chat_sent', JSON_OBJECT('chat_id', NEW.chat_id, 'message_length', LENGTH(NEW.user_message)));
END //

DELIMITER ;

-- ======================================
-- ✅ SCHEMA COMPLETION
-- ======================================

-- Show database status
SELECT 'Database schema created successfully!' as status;
