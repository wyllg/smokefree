const API_BASE_URL = "http://localhost:5000/api";
let currentView = 'login'; // Track current view: 'login' or 'signup'

// Toggle between Login and Signup view
function showAuthView(view) {
    currentView = view;
    const title = document.getElementById('form-title');
    const subtitle = document.getElementById('form-subtitle');
    const emailGroup = document.getElementById('email-group');
    const loginActions = document.getElementById('login-actions');
    const btns = document.querySelectorAll('.toggle-btn');
    const submitBtn = document.getElementById('login-submit-btn');

    if (view === 'login') {
        title.textContent = "Login to your account";
        subtitle.textContent = "Welcome back! Please enter your details.";
        emailGroup.classList.add('hidden');
        loginActions.classList.remove('hidden');
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
        submitBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
    } else {
        title.textContent = "Create Account";
        subtitle.textContent = "Start your smoke-free journey today.";
        emailGroup.classList.remove('hidden');
        loginActions.classList.add('hidden');
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
        submitBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>';
    }
}

// Show error message
function showError(message) {
    // Remove existing error message
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // Create and show new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = 'color: #e74c3c; background: #fee; padding: 12px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #e74c3c;';
    errorDiv.textContent = message;
    
    const form = document.getElementById('auth-form');
    form.insertBefore(errorDiv, form.firstChild);
}

// Show success message
function showSuccess(message) {
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = 'color: #27ae60; background: #d4edda; padding: 12px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #27ae60;';
    successDiv.textContent = message;
    
    const form = document.getElementById('auth-form');
    form.insertBefore(successDiv, form.firstChild);
}

// Handle form submission
document.getElementById('auth-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    const email = document.getElementById('auth-email').value.trim();
    const submitBtn = document.getElementById('login-submit-btn');

    // Basic validation
    if (!username) {
        showError('Username is required');
        return;
    }
    if (!password) {
        showError('Password is required');
        return;
    }
    if (currentView === 'signup' && !email) {
        showError('Email is required for registration');
        return;
    }

    // Disable button during request
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.6';

    try {
        if (currentView === 'signup') {
            // Handle Sign Up
            const response = await fetch(`${API_BASE_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email })
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                showSuccess('Account created successfully! Redirecting to login...');
                // Switch to login view after successful signup
                setTimeout(() => {
                    showAuthView('login');
                    document.getElementById('auth-username').value = username;
                    document.getElementById('auth-password').value = '';
                    document.getElementById('auth-email').value = '';
                }, 1500);
            } else {
                showError(data.message || 'Sign up failed. Please try again.');
            }
        } else {
            // Handle Login
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                // Store username in localStorage
                localStorage.setItem('username', username);
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                // If account not found, redirect to signup
                if (data.redirect === 'signup') {
                    showError('Account not found. Please sign up first.');
                    setTimeout(() => {
                        showAuthView('signup');
                        document.getElementById('auth-username').value = username;
                        document.getElementById('auth-password').value = '';
                    }, 2000);
                } else {
                    showError(data.message || 'Login failed. Please check your credentials.');
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Network error. Please check if the server is running.');
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
    }
});

// Check if already logged in
window.onload = function() {
    if (localStorage.getItem('username')) {
        window.location.href = 'dashboard.html';
    }
};