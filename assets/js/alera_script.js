// ======================================
// INTERACTIVE AI HEALTH ASSISTANT - CHATGPT STYLE
// ======================================

// ======================================
// API CONFIGURATION
// ======================================
const API_CONFIG = {
    // Add your API key here
    OPENAI_API_KEY: '', // Replace with your actual OpenAI API key
    
    // Alternative API options
    ANTHROPIC_API_KEY: 'YOUR_ANTHROPIC_KEY_HERE', // Optional: Claude API key
    GOOGLE_API_KEY: 'AIzaSyA0dJKmFJ6czom5MdcRQUcUcJrtK6ChQZ0', // Optional: Gemini API key
    
    // API endpoints
    OPENAI_ENDPOINT: 'https://api.openai.com/v1/chat/completions',
    ANTHROPIC_ENDPOINT: 'https://api.anthropic.com/v1/messages',
    GOOGLE_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    
    // Model configurations
    MODEL: 'gemini-pro', // or 'gpt-4', 'claude-3-sonnet', 'gemini-pro'
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7
};

// ======================================
// AI ASSISTANT STATE
// ======================================
let aiState = {
    isOpen: false,
    messages: [],
    currentUserMessage: '',
    context: 'general',
    userHistory: [],
    recommendedDoctors: [],
    currentSymptoms: [],
    healthProfile: {
        age: null,
        gender: 'female',
        concerns: [],
        lastCheckup: null,
        medications: [],
        allergies: []
    }
};

// Doctor Database
const doctorDatabase = [
    {
        id: 1,
        name: "Dr. Sarah Johnson",
        specialty: "Breast Health Specialist",
        experience: "15 years",
        rating: 4.9,
        location: "New York, NY",
        availability: "Available today",
        price: "$250 consultation",
        image: "https://images.unsplash.com/photo-1559839731-1a6b5d4e8d6b?w=100&h=100&fit=crop&crop=face",
        conditions: ["Breast Cancer", "Fibrocystic Changes", "Mastitis", "Breast Pain"],
        languages: ["English", "Spanish"],
        education: "Harvard Medical School",
        hospital: "Memorial Sloan Kettering Cancer Center"
    },
    {
        id: 2,
        name: "Dr. Maria Rodriguez",
        specialty: "Gynecologist & Breast Health",
        experience: "12 years",
        rating: 4.8,
        location: "Los Angeles, CA",
        availability: "Available tomorrow",
        price: "$200 consultation",
        image: "https://images.unsplash.com/photo-1594824475065-af19db263f5a?w=100&h=100&fit=crop&crop=face",
        conditions: ["General Breast Health", "Preventive Care", "Hormonal Issues", "Breast Screening"],
        languages: ["English", "Spanish", "French"],
        education: "UCLA School of Medicine",
        hospital: "Cedars-Sinai Medical Center"
    },
    {
        id: 3,
        name: "Dr. Emily Chen",
        specialty: "Oncologist",
        experience: "18 years",
        rating: 4.9,
        location: "Boston, MA",
        availability: "Available this week",
        price: "$300 consultation",
        image: "https://images.unsplash.com/photo-1559839731-1a6b5d4e8d6b?w=100&h=100&fit=crop&crop=face",
        conditions: ["Breast Cancer", "High-Risk Patients", "Genetic Testing", "Preventive Surgery"],
        languages: ["English", "Mandarin"],
        education: "Johns Hopkins School of Medicine",
        hospital: "Massachusetts General Hospital"
    },
    {
        id: 4,
        name: "Dr. Lisa Thompson",
        specialty: "Radiologist",
        experience: "10 years",
        rating: 4.7,
        location: "Chicago, IL",
        availability: "Available today",
        price: "$180 consultation",
        image: "https://images.unsplash.com/photo-1559839731-1a6b5d4e8d6b?w=100&h=100&fit=crop&crop=face",
        conditions: ["Mammography", "Breast Imaging", "Biopsy", "Screening"],
        languages: ["English"],
        education: "Northwestern University Feinberg School of Medicine",
        hospital: "Northwestern Memorial Hospital"
    },
    {
        id: 5,
        name: "Dr. Amanda Foster",
        specialty: "Breast Surgeon",
        experience: "14 years",
        rating: 4.8,
        location: "Houston, TX",
        availability: "Available tomorrow",
        price: "$350 consultation",
        image: "https://images.unsplash.com/photo-1559839731-1a6b5d4e8d6b?w=100&h=100&fit=crop&crop=face",
        conditions: ["Breast Surgery", "Lumpectomy", "Mastectomy", "Reconstruction"],
        languages: ["English", "German"],
        education: "Baylor College of Medicine",
        hospital: "MD Anderson Cancer Center"
    }
];

// AI Response Templates
const aiResponses = {
    greetings: [
        "Hello! I'm your AI health assistant. How can I help you with your breast health concerns today?",
        "Hi there! I'm here to provide personalized guidance on breast health. What questions do you have?",
        "Welcome! I'm your AI health companion. Feel free to ask me anything about breast health, self-exams, or concerns.",
        "Hello! I'm here to support your breast health journey. What would you like to discuss today?"
    ],
    symptomConcerns: [
        "I understand you're experiencing symptoms. Let me help you assess the situation. Can you tell me more about what you're feeling?",
        "It's good that you're being attentive to changes in your body. Let's work through this together.",
        "Thank you for sharing your concerns. I'm here to help you understand what might be happening.",
        "I appreciate you reaching out about your symptoms. Let's gather some more information to better assist you."
    ],
    doctorRecommendations: [
        "Based on your symptoms, I recommend consulting with a specialist. Let me find the right doctor for you.",
        "Your concerns warrant professional medical attention. I'll help you find the best specialist.",
        "It's important to have these symptoms evaluated by a healthcare professional. Let me connect you with an expert.",
        "I recommend seeing a specialist for your concerns. Let me find the most suitable doctor for your situation."
    ],
    selfExam: [
        "I'd be happy to guide you through a breast self-exam. This is an important part of breast health awareness.",
        "Let's walk through the breast self-examination process together. It's simpler than you might think!",
        "I can guide you step-by-step through a proper breast self-exam. When would you like to start?",
        "Breast self-exams are crucial for early detection. Let me show you the proper technique."
    ],
    generalHealth: [
        "That's a great question about breast health. Let me provide you with accurate, helpful information.",
        "I'm glad you're taking an active role in your health. Here's what you need to know.",
        "Breast health education is so important. Let me share some key information with you.",
        "Thank you for asking about this important topic. Here's what you should know."
    ]
};

// ======================================
// CHAT WIDGET FUNCTIONS
// ======================================

function toggleAIChat() {
    const chatWidget = document.getElementById('ai-chat-widget');
    aiState.isOpen = !aiState.isOpen;
    
    if (aiState.isOpen) {
        chatWidget.classList.add('active');
        if (aiState.messages.length === 0) {
            initializeChat();
        }
    } else {
        chatWidget.classList.remove('active');
    }
}

function initializeChat() {
    const currentPage = getCurrentPage();
    let initialMessage = getPersonalizedGreeting(currentPage);
    
    addMessage('ai', initialMessage);
    aiState.messages.push({ type: 'ai', content: initialMessage });
}

function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('breast.html')) return 'breast';
    if (path.includes('vaginal_health.html')) return 'vaginal';
    if (path.includes('menstrual_health.html')) return 'menstrual';
    if (path.includes('dashboard.html')) return 'dashboard';
    if (path.includes('about.html')) return 'about';
    return 'general';
}

function getPersonalizedGreeting(page) {
    const greetings = {
        breast: "Hello! I'm your AI breast health specialist. I can help you with self-exam techniques, answer questions about breast changes, discuss screening guidelines, or connect you with breast health specialists. What would you like to explore today?",
        vaginal: "Hi! I'm here to help with vaginal health concerns. I can provide information about infections, hygiene, discomfort, or help you find a gynecologist. How can I assist you today?",
        menstrual: "Hello! I'm your menstrual health assistant. I can help with period tracking, pain management, irregular cycles, or connect you with specialists. What period health questions do you have?",
        dashboard: "Welcome back! I can help you interpret your health data, set goals, or answer any health questions. What would you like to work on today?",
        about: "Welcome to Alera! I'm here to tell you about our mission to revolutionize women's healthcare through AI-powered assessments and personalized guidance. Ask me about our story, team, impact, or how we can help you take control of your health journey!",
        general: "Hello! I'm your AI health companion. I can provide personalized guidance on women's health, recommend doctors, or answer your health questions. How can I help you today?"
    };
    
    return greetings[page] || greetings.general;
}

function sendMessage() {
    const inputField = document.getElementById('chat-input-field');
    const message = inputField.value.trim();
    
    if (message === '') return;
    
    // Add user message
    addMessage('user', message);
    aiState.messages.push({ type: 'user', content: message });
    aiState.userHistory.push(message);
    
    // Clear input
    inputField.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Generate AI response (try API first, fallback to local)
    if (API_CONFIG.OPENAI_API_KEY && API_CONFIG.OPENAI_API_KEY !== '') {
        callOpenAI(message);
    } else if (API_CONFIG.ANTHROPIC_API_KEY && API_CONFIG.ANTHROPIC_API_KEY !== 'YOUR_ANTHROPIC_KEY_HERE') {
        callAnthropic(message);
    } else if (API_CONFIG.GOOGLE_API_KEY && API_CONFIG.GOOGLE_API_KEY !== '') {
        callGoogleAI(message);
    } else {
        // Fallback to local responses
        setTimeout(() => {
            hideTypingIndicator();
            const response = generateLocalAIResponse(message);
            addMessage('ai', response);
            aiState.messages.push({ type: 'ai', content: response });
        }, 1000);
    }
}

function addMessage(type, content) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = type === 'ai' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    if (type === 'ai') {
        messageContent.innerHTML = formatAIResponse(content);
    } else {
        messageContent.textContent = content;
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatAIResponse(content) {
    // Convert markdown-style formatting to HTML
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
    content = content.replace(/\n/g, '<br>');
    
    // Add doctor recommendations if present
    if (content.includes('[DOCTOR_RECOMMENDATIONS]')) {
        const doctorCards = generateDoctorCards();
        content = content.replace('[DOCTOR_RECOMMENDATIONS]', doctorCards);
    }
    
    // Add action buttons if present
    if (content.includes('[ACTION_BUTTONS]')) {
        const actionButtons = generateActionButtons();
        content = content.replace('[ACTION_BUTTONS]', actionButtons);
    }
    
    return content;
}

function generateAIResponse(userMessage) {
    const message = userMessage.toLowerCase();
    const currentPage = getCurrentPage();
    
    // Handle about page specific questions
    if (currentPage === 'about') {
        if (message.includes('story') || message.includes('founded') || message.includes('history')) {
            return handleAboutStory(message);
        }
        if (message.includes('team') || message.includes('who') || message.includes('founder')) {
            return handleAboutTeam(message);
        }
        if (message.includes('mission') || message.includes('values') || message.includes('purpose')) {
            return handleAboutMission(message);
        }
        if (message.includes('impact') || message.includes('statistics') || message.includes('numbers')) {
            return handleAboutImpact(message);
        }
        if (message.includes('partner') || message.includes('collaboration') || message.includes('organization')) {
            return handleAboutPartners(message);
        }
    }
    
    // Check for symptom-related keywords
    if (message.includes('pain') || message.includes('lump') || message.includes('discharge') || 
        message.includes('change') || message.includes('swelling') || message.includes('concern')) {
        return handleSymptomConcern(message, currentPage);
    }
    
    // Check for doctor-related keywords
    if (message.includes('doctor') || message.includes('specialist') || message.includes('recommend') ||
        message.includes('help') || message.includes('serious') || message.includes('worry')) {
        return handleDoctorRequest(message, currentPage);
    }
    
    // Check for self-exam keywords
    if (message.includes('self-exam') || message.includes('check') || message.includes('examination') ||
        message.includes('how to') || message.includes('guide')) {
        return handleSelfExamRequest(message, currentPage);
    }
    
    // Check for general health questions
    if (message.includes('what') || message.includes('why') || message.includes('how') ||
        message.includes('information') || message.includes('learn')) {
        return handleGeneralHealthQuestion(message, currentPage);
    }
    
    // Check for screening/prevention
    if (message.includes('screening') || message.includes('mammogram') || message.includes('prevention') ||
        message.includes('check-up') || message.includes('early detection')) {
        return handleScreeningQuestion(message, currentPage);
    }
    
    // Default response
    return getDefaultResponse(message, currentPage);
}

function handleSymptomConcern(message, page) {
    aiState.currentSymptoms.push(message);
    
    let response = getRandomResponse(aiResponses.symptomConcerns) + "\n\n";
    
    if (page === 'breast') {
        response += "Based on what you've described, it's important to take this seriously. While many breast changes are benign, **any new symptom should be evaluated by a healthcare professional**.\n\n";
        response += "I recommend scheduling an appointment with a breast health specialist. Early detection is key to successful treatment.\n\n";
        response += "[DOCTOR_RECOMMENDATIONS]\n\n";
        response += "In the meantime, here are some steps you can take:\n";
        response += "• Continue monthly breast self-exams\n";
        response += "• Note any changes in size, shape, or texture\n";
        response += "• Keep a symptom diary\n";
        response += "• Avoid internet self-diagnosis\n\n";
        response += "Would you like me to help you prepare for your doctor's appointment?";
    } else {
        response += "I recommend consulting with a healthcare professional about your symptoms. It's always better to be cautious when it comes to your health.\n\n";
        response += "[DOCTOR_RECOMMENDATIONS]\n\n";
        response += "Is there anything specific about your symptoms you'd like to discuss?";
    }
    
    return response;
}

function handleDoctorRequest(message, page) {
    let response = getRandomResponse(aiResponses.doctorRecommendations) + "\n\n";
    
    // Find relevant doctors based on page
    let relevantDoctors = [];
    if (page === 'breast') {
        relevantDoctors = doctorDatabase.filter(doc => 
            doc.conditions.some(condition => 
                condition.toLowerCase().includes('breast') || 
                condition.toLowerCase().includes('cancer') ||
                condition.toLowerCase().includes('fibrocystic')
            )
        );
    } else {
        relevantDoctors = doctorDatabase.slice(0, 3); // Show top 3 for other pages
    }
    
    aiState.recommendedDoctors = relevantDoctors;
    
    response += "[DOCTOR_RECOMMENDATIONS]\n\n";
    response += "These specialists have excellent ratings and are available soon. Would you like me to help you prepare questions for your appointment?";
    
    return response;
}

function handleSelfExamRequest(message, page) {
    let response = getRandomResponse(aiResponses.selfExam) + "\n\n";
    
    if (page === 'breast') {
        response += "Here's a step-by-step guide to breast self-examination:\n\n";
        response += "**Step 1: Visual Inspection**\n";
        response += "• Stand in front of a mirror, shirtless\n";
        response += "• Look for changes in size, shape, or symmetry\n";
        response += "• Check for skin dimpling, puckering, or nipple changes\n\n";
        response += "**Step 2: Physical Examination**\n";
        response += "• Use the pads of your three middle fingers\n";
        response += "• Apply light, medium, and firm pressure\n";
        response += "• Examine in circular motions\n";
        response += "• Cover entire breast area and armpit\n\n";
        response += "**Step 3: Check Different Positions**\n";
        response += "• Standing with arms at sides\n";
        response += "• Standing with arms raised\n";
        response += "• Lying down with a pillow under shoulder\n\n";
        response += "**Best Time:** 7-10 days after your period starts\n\n";
        response += "[ACTION_BUTTONS]\n\n";
        response += "Would you like me to explain any of these steps in more detail?";
    } else {
        response += "Self-examination is an important part of health awareness. The specific techniques vary depending on what you're examining.\n\n";
        response += "For the most accurate guidance, I'd recommend consulting with a healthcare professional who can show you the proper technique.\n\n";
        response += "[DOCTOR_RECOMMENDATIONS]\n\n";
        response += "Is there a specific type of self-exam you'd like to learn about?";
    }
    
    return response;
}

function handleGeneralHealthQuestion(message, page) {
    let response = getRandomResponse(aiResponses.generalHealth) + "\n\n";
    
    if (page === 'breast') {
        if (message.includes('anatomy')) {
            response += "Breasts are made up of several types of tissue:\n\n";
            response += "• **Glandular tissue:** Milk-producing glands\n";
            response += "• **Fatty tissue:** Gives breasts their size and shape\n";
            response += "• **Connective tissue:** Provides support and structure\n";
            response += "• **Lymph nodes:** Part of the immune system\n\n";
            response += "Understanding normal breast anatomy helps you recognize changes that might need medical attention.";
        } else if (message.includes('risk')) {
            response += "Common breast health risk factors include:\n\n";
            response += "• **Age:** Risk increases with age\n";
            response += "• **Family history:** Genetic factors\n";
            response += "• **Lifestyle:** Diet, exercise, alcohol consumption\n";
            response += "• **Reproductive history:** Age at first pregnancy, breastfeeding\n";
            response += "• **Hormonal factors:** Hormone therapy, birth control\n\n";
            response += "Remember: Most women with breast cancer have no known risk factors.";
        } else {
            response += "Breast health is an important part of overall wellness. Regular self-exams, professional screenings, and healthy lifestyle choices all contribute to maintaining breast health.\n\n";
            response += "Key points:\n";
            response += "• Know what's normal for your breasts\n";
            response += "• Report changes to your doctor promptly\n";
            response += "• Follow recommended screening guidelines\n";
            response += "• Maintain a healthy lifestyle\n\n";
            response += "Is there something specific about breast health you'd like to learn more about?";
        }
    } else {
        response += "That's an important question about women's health. Every woman's health journey is unique, and it's great that you're seeking information.\n\n";
        response += "For personalized advice tailored to your specific situation, I'd recommend consulting with a healthcare professional.\n\n";
        response += "[DOCTOR_RECOMMENDATIONS]\n\n";
        response += "What other aspects of women's health would you like to discuss?";
    }
    
    return response;
}

function handleScreeningQuestion(message, page) {
    let response = "Screening and early detection are crucial for breast health.\n\n";
    
    if (page === 'breast') {
        response += "**Recommended Screening Guidelines:**\n\n";
        response += "• **Women 40-49:** Annual mammogram (discuss with doctor)\n";
        response += "• **Women 50-74:** Annual mammogram recommended\n";
        response += "• **Women 75+:** Continue screening based on health\n";
        response += "• **High-risk women:** Earlier and more frequent screening\n\n";
        response += "**Additional Screening Methods:**\n";
        response += "• **Clinical breast exam:** Annual professional examination\n";
        response += "• **Breast MRI:** For high-risk individuals\n";
        response += "• **Breast ultrasound:** When mammograms are inconclusive\n\n";
        response += "**Remember:** These are general guidelines. Your doctor may recommend different screening based on your personal risk factors.\n\n";
        response += "[DOCTOR_RECOMMENDATIONS]\n\n";
        response += "Would you like help finding a screening center near you?";
    } else {
        response += "Regular screening is important for early detection of health issues. The specific recommendations vary depending on your age, risk factors, and health history.\n\n";
        response += "I'd recommend discussing screening guidelines with a healthcare professional who can provide personalized recommendations.\n\n";
        response += "[DOCTOR_RECOMMENDATIONS]\n\n";
        response += "What type of screening are you interested in learning about?";
    }
    
    return response;
}

function getDefaultResponse(message, page) {
    let response = getRandomResponse(aiResponses.greetings) + "\n\n";
    
    response += "I'm here to help with your health questions and concerns. I can:\n\n";
    response += "• Answer questions about symptoms and changes\n";
    response += "• Guide you through self-examination techniques\n";
    response += "• Explain screening and prevention\n";
    response += "• Recommend qualified specialists\n";
    response += "• Help you prepare for doctor appointments\n\n";
    
    if (page === 'breast') {
        response += "For breast health specifically, I can help with self-exams, understanding breast changes, or finding breast health specialists.\n\n";
    }
    
    response += "What would you like to know more about?";
    
    return response;
}

function generateDoctorCards() {
    let html = '<div class="doctor-recommendations">\n';
    html += '<h4>Recommended Specialists:</h4>\n';
    html += '<div class="doctor-cards">\n';
    
    aiState.recommendedDoctors.forEach(doctor => {
        html += `
            <div class="doctor-card" onclick="selectDoctor(${doctor.id})">
                <div class="doctor-image">
                    <img src="${doctor.image}" alt="${doctor.name}">
                    <div class="doctor-rating">
                        <i class="fas fa-star"></i> ${doctor.rating}
                    </div>
                </div>
                <div class="doctor-info">
                    <h5>${doctor.name}</h5>
                    <p class="specialty">${doctor.specialty}</p>
                    <p class="experience">${doctor.experience} experience</p>
                    <p class="location"><i class="fas fa-map-marker-alt"></i> ${doctor.location}</p>
                    <p class="availability"><i class="fas fa-calendar-check"></i> ${doctor.availability}</p>
                    <p class="price">${doctor.price}</p>
                    <div class="doctor-tags">
                        ${doctor.languages.map(lang => `<span class="tag">${lang}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>\n';
    html += '<button class="btn btn-secondary" onclick="showMoreDoctors()">View More Specialists</button>\n';
    html += '</div>\n';
    
    return html;
}

function generateActionButtons() {
    let html = '<div class="action-buttons">\n';
    
    if (getCurrentPage() === 'breast') {
        html += '<button class="btn btn-primary" onclick="startInteractiveExam()">Start Interactive Exam</button>\n';
        html += '<button class="btn btn-secondary" onclick="downloadExamGuide()">Download Exam Guide</button>\n';
        html += '<button class="btn btn-outline" onclick="setExamReminder()">Set Monthly Reminder</button>\n';
    }
    
    html += '<button class="btn btn-outline" onclick="scheduleAppointment()">Schedule Appointment</button>\n';
    html += '</div>\n';
    
    return html;
}

function selectDoctor(doctorId) {
    const doctor = doctorDatabase.find(doc => doc.id === doctorId);
    if (doctor) {
        let response = `Great choice! **${doctor.name}** is an excellent ${doctor.specialty} with ${doctor.experience} of experience.\n\n`;
        response += `**Details:**\n`;
        response += `• **Hospital:** ${doctor.hospital}\n`;
        response += `• **Education:** ${doctor.education}\n`;
        response += `• **Languages:** ${doctor.languages.join(', ')}\n`;
        response += `• **Rating:** ${doctor.rating}/5.0\n`;
        response += `• **Availability:** ${doctor.availability}\n`;
        response += `• **Consultation Fee:** ${doctor.price}\n\n`;
        response += `**Specializes in:** ${doctor.conditions.join(', ')}\n\n`;
        response += `Would you like me to help you:\n`;
        response += `• Prepare questions for your appointment?\n`;
        response += `• Check your insurance coverage?\n`;
        response += `• Schedule the appointment?\n`;
        
        addMessage('ai', response);
        aiState.messages.push({ type: 'ai', content: response });
    }
}

function showMoreDoctors() {
    let response = "Here are more excellent specialists:\n\n";
    
    // Show remaining doctors
    const remainingDoctors = doctorDatabase.filter(doc => 
        !aiState.recommendedDoctors.some(rec => rec.id === doc.id)
    );
    
    aiState.recommendedDoctors = doctorDatabase; // Update to all doctors
    
    response += "[DOCTOR_RECOMMENDATIONS]\n\n";
    response += "All of these specialists have excellent credentials and availability. Is there a particular specialty or location you prefer?";
    
    addMessage('ai', response);
    aiState.messages.push({ type: 'ai', content: response });
}

function startInteractiveExam() {
    let response = "Perfect! Let's start your interactive breast self-exam.\n\n";
    response += "**Before we begin:**\n";
    response += "• Find a private, well-lit space\n";
    response += "• Have a mirror available\n";
    response += "• Remove your top and bra\n";
    response += "• Relax - this should take about 5-10 minutes\n\n";
    response += "**Step 1: Visual Inspection**\n";
    response += "Stand in front of the mirror with your arms at your sides. Look for:\n";
    response += "• Changes in breast size or shape\n";
    response += "• Skin dimpling or puckering\n";
    response += "• Nipple changes or discharge\n";
    response += "• Any visible lumps or swelling\n\n";
    response += "**Ready to proceed?** Type 'yes' when you're ready for Step 2, or ask me any questions about what you're seeing.";
    
    addMessage('ai', response);
    aiState.messages.push({ type: 'ai', content: response });
}

function downloadExamGuide() {
    let response = "I'll prepare a comprehensive breast self-exam guide for you!\n\n";
    response += "**Your guide will include:**\n";
    response += "• Step-by-step illustrated instructions\n";
    response += "• Monthly exam calendar\n";
    response += "• Symptom tracking worksheet\n";
    response += "• Questions to ask your doctor\n";
    response += "• Emergency contact information\n\n";
    response += "The guide will be downloaded as a PDF to your device. Would you also like me to:\n";
    response += "• Set up monthly exam reminders?\n";
    response += "• Create a symptom tracking log?\n";
    response += "• Find local screening centers?\n";
    response += "• Provide additional resources for breast health?"; // New line added
    
    addMessage('ai', response);
    aiState.messages.push({ type: 'ai', content: response });
}

function setExamReminder() {
    let response = "Excellent! Setting up regular self-exam reminders is one of the best things you can do for your breast health.\n\n";
    response += "**Recommended Schedule:**\n";
    response += "• **Best time:** 7-10 days after your period starts\n";
    response += "• **Frequency:** Monthly\n";
    response += "• **Duration:** 5-10 minutes\n\n";
    response += "**I can set up reminders for:**\n";
    response += "• Email notifications\n";
    response += "• SMS text messages\n";
    response += "• Calendar alerts\n";
    response += "• Push notifications\n\n";
    response += "What's your preferred reminder method, and what day works best for your monthly exam?";
    
    addMessage('ai', response);
    aiState.messages.push({ type: 'ai', content: response });
}

function scheduleAppointment() {
    let response = "I'd be happy to help you schedule an appointment!\n\n";
    response += "**To find the best match for you, I need to know:**\n";
    response += "• Your location or preferred area\n";
    response += "• Insurance provider (if any)\n";
    response += "• Preferred days/times\n";
    response += "• Urgency level (routine vs. urgent)\n";
    response += "• Specific concerns you want addressed\n\n";
    response += "Once I have this information, I can:\n";
    response += "• Find in-network providers\n";
    response += "• Check availability\n";
    response += "• Estimate costs\n";
    response += "• Help you prepare for the visit\n\n";
    response += "What's your preferred location and when would you like to be seen?";
    
    addMessage('ai', response);
    aiState.messages.push({ type: 'ai', content: response });
}

// ======================================
// MISSING HELPER FUNCTIONS
// ======================================

function getRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
}

function generateLocalAIResponse(userMessage) {
    return generateAIResponse(userMessage);
}

function callOpenAI(message) {
    // Placeholder for OpenAI API call
    setTimeout(() => {
        hideTypingIndicator();
        const response = generateLocalAIResponse(message);
        addMessage('ai', response);
        aiState.messages.push({ type: 'ai', content: response });
    }, 1500);
}

function callAnthropic(message) {
    // Placeholder for Anthropic API call
    setTimeout(() => {
        hideTypingIndicator();
        const response = generateLocalAIResponse(message);
        addMessage('ai', response);
        aiState.messages.push({ type: 'ai', content: response });
    }, 1500);
}

function callGoogleAI(message) {
    console.log('Calling Google AI with message:', message);
    
    const requestBody = {
        contents: [{
            parts: [{
                text: `You are a helpful AI health assistant specializing in women's health, particularly breast health. Provide accurate, empathetic, and informative responses. Always include a disclaimer that you're not a substitute for professional medical advice.

User message: ${message}

Current page context: ${getCurrentPage()}
Chat history: ${aiState.messages.slice(-3).map(m => m.content).join('\n')}

Please provide a helpful response.`
            }]
        }],
        generationConfig: {
            temperature: API_CONFIG.TEMPERATURE,
            maxOutputTokens: API_CONFIG.MAX_TOKENS,
            topK: 40,
            topP: 0.95,
        }
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    console.log('API endpoint:', `${API_CONFIG.GOOGLE_ENDPOINT}?key=${API_CONFIG.GOOGLE_API_KEY}`);

    fetch(`${API_CONFIG.GOOGLE_ENDPOINT}?key=${API_CONFIG.GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        console.log('API response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('API response data:', data);
        hideTypingIndicator();
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const response = data.candidates[0].content.parts[0].text;
            console.log('AI response:', response);
            addMessage('ai', response);
            aiState.messages.push({ type: 'ai', content: response });
        } else {
            console.log('API response format unexpected, using fallback');
            // Fallback to local response if API fails
            const fallbackResponse = generateLocalAIResponse(message);
            addMessage('ai', fallbackResponse);
            aiState.messages.push({ type: 'ai', content: fallbackResponse });
        }
    })
    .catch(error => {
        console.error('Google AI API Error:', error);
        console.log('Using local fallback due to API error');
        hideTypingIndicator();
        // Fallback to local response on error
        const fallbackResponse = generateLocalAIResponse(message);
        addMessage('ai', fallbackResponse);
        aiState.messages.push({ type: 'ai', content: fallbackResponse });
    });
}

// ======================================
// API INTEGRATION FUNCTIONS
// ======================================

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator active';
    typingDiv.id = 'typing-indicator';
    
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chat-input-field');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});

// ======================================
// MOBILE MENU TOGGLE
// ======================================

function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

// ======================================
// STYLES FOR AI COMPONENTS
// ======================================

const aiStyles = `
<style>
.doctor-recommendations {
    margin: 15px 0;
    padding: 15px;
    background: rgba(255, 77, 148, 0.05);
    border-radius: 15px;
    border: 1px solid rgba(255, 77, 148, 0.1);
}

.doctor-recommendations h4 {
    color: #ff4d94;
    margin-bottom: 15px;
    font-weight: 600;
}

.doctor-cards {
    display: grid;
    grid-template-columns: 1fr;
    gap: 15px;
    margin-bottom: 15px;
}

.doctor-card {
    display: flex;
    gap: 15px;
    padding: 15px;
    background: white;
    border-radius: 15px;
    border: 1px solid rgba(255, 77, 148, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
}

.doctor-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 77, 148, 0.15);
}

.doctor-image {
    position: relative;
    width: 60px;
    height: 60px;
    flex-shrink: 0;
}

.doctor-image img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
}

.doctor-rating {
    position: absolute;
    bottom: -5px;
    right: -5px;
    background: #ff4d94;
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 0.7em;
    font-weight: 600;
}

.doctor-info h5 {
    margin: 0 0 5px 0;
    color: #333;
    font-weight: 600;
}

.doctor-info .specialty {
    color: #ff4d94;
    font-weight: 600;
    margin: 0 0 5px 0;
}

.doctor-info p {
    margin: 3px 0;
    font-size: 0.85em;
    color: #666;
}

.doctor-tags {
    display: flex;
    gap: 5px;
    margin-top: 8px;
    flex-wrap: wrap;
}

.tag {
    background: rgba(255, 77, 148, 0.1);
    color: #ff4d94;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.7em;
    font-weight: 600;
}

.action-buttons {
    display: flex;
    gap: 10px;
    margin: 15px 0;
    flex-wrap: wrap;
}

.action-buttons button {
    padding: 8px 16px;
    border-radius: 20px;
    border: 1px solid rgba(255, 77, 148, 0.2);
    background: white;
    color: #ff4d94;
    font-weight: 600;
    font-size: 0.85em;
    cursor: pointer;
    transition: all 0.3s ease;
}

.action-buttons button:hover {
    background: #ff4d94;
    color: white;
    transform: translateY(-2px);
}

.btn-secondary {
    background: transparent !important;
    color: #ff4d94 !important;
}

.btn-outline {
    background: transparent !important;
    border: 2px solid #ff4d94 !important;
    color: #ff4d94 !important;
}

@media (max-width: 480px) {
    .doctor-card {
        flex-direction: column;
        text-align: center;
    }
    
    .doctor-image {
        margin: 0 auto;
    }
    
    .action-buttons {
        flex-direction: column;
    }
    
    .action-buttons button {
        width: 100%;
    }
}
</style>
`;

// Inject styles into the page
document.head.insertAdjacentHTML('beforeend', aiStyles);

// ======================================
// ABOUT PAGE HANDLERS
// ======================================

function handleAboutStory(message) {
    let response = "I'd love to share Alera's story with you!\n\n";
    response += "**Our Beginning:**\n";
    response += "Alera was born in 2022 from a simple yet powerful observation: women deserve better access to personalized health information. Our founder, Emma Thompson, recognized that traditional healthcare often leaves women waiting for answers about their most intimate health concerns.\n\n";
    response += "**The Problem We Solved:**\n";
    response += "• Long wait times for health information\n";
    response += "• Lack of personalized guidance\n";
    response += "• Limited access to quality resources\n";
    response += "• Privacy concerns with sensitive health topics\n\n";
    response += "**Our Growth:**\n";
    response += "What started as a small initiative has grown into a comprehensive platform serving thousands of women worldwide. We've combined cutting-edge AI technology with medical expertise to create a safe, private, and empowering space.\n\n";
    response += "**Today:**\n";
    response += "We've completed over 1M health assessments and achieved an 85% early detection rate through our AI-powered assessments and personalized guidance.\n\n";
    response += "Would you like to know more about our team, mission, or the impact we're making?";
    
    return response;
}

function handleAboutTeam(message) {
    let response = "Let me introduce you to the amazing team behind Alera!\n\n";
    response += "**Our Leadership Team:**\n\n";
    response += "**Dr. Sarah Chen - Chief Medical Officer**\n";
    response += "• Board-certified OB/GYN with 15+ years of experience\n";
    response += "• Specializes in women's health and reproductive medicine\n";
    response += "• Ensures all our medical guidance is evidence-based\n";
    response += "• Harvard Medical School educated\n\n";
    response += "**Dr. Michael Rodriguez - Head of AI Research**\n";
    response += "• AI specialist focused on medical diagnostics\n";
    response += "• Leads our predictive analytics for early detection\n";
    response += "• Ensures our AI is ethical and accurate\n";
    response += "• PhD in Machine Learning from MIT\n\n";
    response += "**Emma Thompson - CEO & Founder**\n";
    response += "• Passionate about accessible healthcare\n";
    response += "• Founded Alera after witnessing healthcare gaps\n";
    response += "• Leads our mission and vision\n";
    response += "• Background in healthcare technology\n\n";
    response += "**Our Values:**\n";
    response += "• **Privacy First:** Your data is sacred\n";
    response += "• **Empathy-Driven:** Every feature designed with compassion\n";
    response += "• **Science-Based:** All recommendations medically reviewed\n";
    response += "• **Accessible Care:** Quality healthcare for everyone\n\n";
    response += "Our team combines decades of medical expertise with cutting-edge technology to serve you better. Would you like to know more about our mission or impact?";
    
    return response;
}

function handleAboutMission(message) {
    let response = "Our mission is at the heart of everything we do at Alera!\n\n";
    response += "**Our Core Mission:**\n";
    response += "To revolutionize women's healthcare through AI-powered assessments and personalized guidance, putting you in control of your wellness journey.\n\n";
    response += "**Our Guiding Values:**\n\n";
    response += "**🛡️ Privacy First**\n";
    response += "Your health data is sacred. We use military-grade encryption and never share your personal information without explicit consent.\n\n";
    response += "**❤️ Empathy-Driven**\n";
    response += "We understand the sensitive nature of women's health. Every feature is designed with compassion and understanding.\n\n";
    response += "**🔬 Science-Based**\n";
    response += "All our assessments and recommendations are backed by medical research and reviewed by healthcare professionals.\n\n";
    response += "**🌍 Accessible Care**\n";
    response += "Quality healthcare should be accessible to everyone, regardless of location, income, or background.\n\n";
    response += "**What This Means For You:**\n";
    response += "• 24/7 access to health guidance\n";
    response += "• Personalized recommendations based on your unique situation\n";
    response += "• Privacy-protected health assessments\n";
    response += "• Connection to qualified specialists when needed\n";
    response += "• Educational resources to empower your health decisions\n\n";
    response += "We're committed to making women's healthcare more accessible, personalized, and empowering. How can we help you take control of your health journey today?";
    
    return response;
}

function handleAboutImpact(message) {
    let response = "I'm proud to share the real impact Alera is making in women's lives!\n\n";
    response += "**Our Global Impact:**\n\n";
    response += "**📊 1M+ Health Assessments Completed**\n";
    response += "Women worldwide have used our platform to better understand their health and take proactive steps toward wellness.\n\n";
    response += "**🎯 85% Early Detection Rate**\n";
    response += "Our AI-powered assessments have helped identify potential health issues early, significantly improving treatment outcomes.\n\n";
    response += "**🌍 50+ Countries Served**\n";
    response += "We've made quality health guidance accessible to women across the globe, breaking down geographical barriers.\n\n";
    response += "**⭐ 95% User Satisfaction**\n";
    response += "Our users report feeling more empowered and knowledgeable about their health after using Alera.\n\n";
    response += "**👥 50K+ Women Helped**\n";
    response += "From symptom assessment to specialist connections, we've supported thousands of women on their health journeys.\n\n";
    response += "**24/7 AI Support**\n";
    response += "Round-the-clock access to health guidance means women never have to wait for answers to their health concerns.\n\n";
    response += "**Real Stories, Real Impact:**\n";
    response += "• Women finding specialists faster\n";
    response += "• Early detection of serious conditions\n";
    response += "• Reduced anxiety through education\n";
    response += "• Empowered health decision-making\n";
    response += "• Improved health outcomes\n\n";
    response += "Every number represents a woman who took control of her health journey. Ready to start yours?";
    
    return response;
}

function handleAboutPartners(message) {
    let response = "Alera's success is built on strong partnerships with leading healthcare organizations!\n\n";
    response += "**Our Trusted Partners:**\n\n";
    response += "**🏥 Major Hospitals**\n";
    response += "We partner with leading medical centers to ensure our users have access to the best specialist care when needed. Our hospital partners provide:\n";
    response += "• Specialist consultations\n";
    response += "• Advanced diagnostic services\n";
    response += "• Treatment coordination\n";
    response += "• Second opinions\n\n";
    response += "**🎓 Medical Schools**\n";
    response += "Academic institutions help us stay at the forefront of medical research and ensure our content is evidence-based:\n";
    response += "• Research collaboration\n";
    response += "• Clinical validation\n";
    response += "• Medical student training\n";
    response += "• Latest medical insights\n\n";
    response += "**🔬 Research Labs**\n";
    response += "Our research partners help us improve our AI algorithms and develop new diagnostic capabilities:\n";
    response += "• AI algorithm development\n";
    response += "• Clinical studies\n";
    response += "• Data analysis\n";
    response += "• Innovation testing\n\n";
    response += "**🤝 Health NGOs**\n";
    response += "Nonprofit organizations help us reach underserved communities and promote health education:\n";
    response += "• Community outreach\n";
    response += "• Health education programs\n";
    response += "• Access initiatives\n";
    response += "• Support services\n\n";
    response += "**Why Partnerships Matter:**\n";
    response += "• **Quality Assurance:** Medical expertise validates our AI\n";
    response += "• **Access:** Partners expand our specialist network\n";
    response += "• **Innovation:** Collaborative research drives improvements\n";
    response += "• **Trust:** Reputable partners build user confidence\n\n";
    response += "Together, we're creating a comprehensive ecosystem for women's health. Would you like to know how our partnerships benefit you directly?";
    
    return response;
}