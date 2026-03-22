<?php
session_start();
$conn = new mysqli("localhost","root","","alera");
if($conn->connect_error){
    die("Connection failed: ".$conn->connect_error);
}

$error = '';
if(isset($_POST['login'])){
    $email = $conn->real_escape_string($_POST['email']);
    $password = $_POST['password'];

    $result = $conn->query("SELECT * FROM users WHERE email='$email'");
    if($result->num_rows > 0){
        $user = $result->fetch_assoc();
        if(password_verify($password, $user['password_hash'])){
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
            $_SESSION['email'] = $user['email'];
            header("Location: dashboard.php");
            exit();
        } else {
            $error = "Invalid password!";
        }
    } else {
        $error = "Email not registered!";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Login | Alera - Women's Health</title>
<link rel="stylesheet" href="../assets/css/style.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <!-- Navigation Bar -->
    <nav class="navbar" role="navigation" aria-label="Main navigation">
        <div class="navbar-container">
            <!-- Logo/Brand -->
            <div class="navbar-brand">
                <a href="index.html" class="logo">
                    <div class="logo-icon">
                        <i class="fas fa-heart-pulse"></i>
                        <div class="pulse-ring"></div>
                    </div>
                    <span class="logo-text">Alera</span>
                </a>
            </div>

            <!-- Hamburger Menu (Mobile) -->
            <div class="hamburger" onclick="toggleMobileMenu()">
                <span></span>
                <span></span>
                <span></span>
            </div>

            <!-- Navigation Links -->
            <ul class="nav-links" id="nav-links">
                <li><a href="index.html">Home</a></li>
                <li><a href="about.html">About</a></li>
                <li><a href="breast.html">Breast Health</a></li>
                <li><a href="vaginal_health.html">Vaginal Health</a></li>
                <li><a href="menstrual_health.html">Period Health</a></li>
                <li><a href="dashboard.php">Dashboard</a></li>
            </ul>

            <!-- Action Buttons -->
            <div class="nav-actions">
                <button class="chat-btn" onclick="toggleAIChat()">
                    <i class="fas fa-robot"></i>
                    <span>AI Chat</span>
                </button>
                <a href="login.php" class="signin-btn active">Sign In</a>
            </div>
        </div>

        <!-- Animated Background Elements -->
        <div class="navbar-bg-elements">
            <div class="bg-element element-1"></div>
            <div class="bg-element element-2"></div>
            <div class="bg-element element-3"></div>
        </div>
    </nav>

<div class="auth-container">
    <h2>Login</h2>
    <?php if($error) echo '<p class="error">'.$error.'</p>'; ?>
    <form method="POST">
        <input type="email" name="email" placeholder="Email" required>
        <input type="password" name="password" placeholder="Password" required>
        <button type="submit" name="login" class="signup-btn">Login</button>
    </form>
    <p>Don't have an account? <a href="register.php">Register here</a></p>
</div>

<script>
    // Mobile Navigation
    function toggleMobileMenu() {
        const navLinks = document.getElementById('nav-links');
        const hamburger = document.querySelector('.hamburger');

        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const navLinks = document.getElementById('nav-links');
        const hamburger = document.querySelector('.hamburger');
        const navbar = document.querySelector('.navbar');

        if (navbar && !navbar.contains(event.target) && navLinks && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });

    function toggleAIChat() {
        const widget = document.getElementById('ai-chat-widget');
        if (widget) widget.classList.toggle('active');
    }
</script>
</body>
</html>
