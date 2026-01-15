// auth/login.js
import { API } from '../api.js';
import { showToast } from '../utils/toast.js';

export function loginPage() {
    console.log("📱 Rendering login page...");

    document.getElementById("app").innerHTML = `
        <!-- Bootstrap 5 CSS -->
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <div class="container-fluid bg-light" style="min-height: 100vh;">
            <!-- Header dengan tombol kembali -->
            <div class="container py-3">
                <button onclick="window.location.hash='#/'" 
                        class="btn btn-outline-success btn-sm mb-3">
                    <i class="bi bi-arrow-left me-1"></i> Kembali ke Beranda
                </button>
            </div>
            
            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-md-6 col-lg-5">
                        <div class="card border-success shadow-lg">
                            <div class="card-header bg-success text-white text-center py-4">
                                <h3 class="fw-bold mb-2">
                                    <i class="bi bi-tree-fill me-2"></i>Login CleanUp
                                </h3>
                                <p class="mb-0 opacity-75">Masuk ke akun Anda</p>
                            </div>
                            
                            <div class="card-body p-4">
                                <form id="loginForm" novalidate>
                                    <!-- Username -->
                                    <div class="mb-4">
                                        <label class="form-label fw-semibold">
                                            <i class="bi bi-person me-2"></i>Username
                                        </label>
                                        <input type="text" 
                                               class="form-control form-control-lg" 
                                               id="username" 
                                               name="username"
                                               placeholder="Masukkan username" 
                                               minlength="3"
                                               maxlength="50"
                                               pattern="^[a-zA-Z0-9_.-]{3,50}$"
                                               title="Username 3-50 karakter, hanya huruf, angka, underscore, titik, dan dash"
                                               required>
                                        <div class="invalid-feedback" id="usernameError">
                                            Username harus 3-50 karakter dan hanya boleh mengandung huruf, angka, underscore, titik, atau dash
                                        </div>
                                        <div class="valid-feedback">
                                            Username valid
                                        </div>
                                    </div>
                                    
                                    <!-- Password -->
                                    <div class="mb-4">
                                        <label class="form-label fw-semibold">
                                            <i class="bi bi-lock me-2"></i>Password
                                        </label>
                                        <div class="input-group">
                                            <input type="password" 
                                                   class="form-control form-control-lg" 
                                                   id="password" 
                                                   name="password"
                                                   placeholder="Masukkan password" 
                                                   minlength="6"
                                                   maxlength="100"
                                                   pattern="^.{6,}$"
                                                   title="Password minimal 6 karakter"
                                                   required>
                                            <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                                <i class="bi bi-eye"></i>
                                            </button>
                                        </div>
                                        <div class="invalid-feedback" id="passwordError">
                                            Password minimal 6 karakter
                                        </div>
                                        <div class="valid-feedback">
                                            Password valid
                                        </div>
                                        <small class="text-muted mt-1 d-block">
                                            <i class="bi bi-info-circle me-1"></i>
                                            Minimal 6 karakter
                                        </small>
                                    </div>
                                    
                                    <!-- Checkbox Remember Me -->
                                    <div class="mb-4 form-check">
                                        <input type="checkbox" class="form-check-input" id="rememberMe">
                                        <label class="form-check-label" for="rememberMe">
                                            Ingat saya di perangkat ini
                                        </label>
                                    </div>
                                    
                                    <!-- Tombol Login -->
                                    <div class="d-grid mb-4">
                                        <button type="submit" 
                                                class="btn btn-success btn-lg fw-bold py-3"
                                                id="loginBtn">
                                            <i class="bi bi-box-arrow-in-right me-2"></i>
                                            Login
                                        </button>
                                    </div>
                                    
                                    <!-- Link Register -->
                                    <div class="text-center">
                                        <p class="text-muted mb-2">
                                            Belum punya akun?
                                            <a href="#/register" class="text-success fw-semibold text-decoration-none">
                                                Daftar di sini
                                            </a>
                                        </p>
                                        <a href="#/" class="text-success text-decoration-none small">
                                            <i class="bi bi-house me-1"></i> Kembali ke Beranda
                                        </a>
                                    </div>
                                </form>
                                
                                <!-- Message Area -->
                                <div id="loginMessage" class="mt-4"></div>
                                
                                <!-- Attempt Counter (hidden) -->
                                <div id="loginAttempts" class="small text-muted text-end mt-2" style="display: none;">
                                    Percobaan login: <span id="attemptCount">0</span>/5
                                </div>
                            </div>
                            
                            <div class="card-footer bg-transparent border-top-0 text-center py-3">
                                <small class="text-muted">
                                    <i class="bi bi-shield-check me-1"></i>
                                    Data Anda aman bersama kami
                                </small>
                            </div>
                        </div>
                        
                        <!-- Info Tambahan -->
                        <div class="alert alert-info mt-4">
                            <div class="d-flex">
                                <div class="me-3">
                                    <i class="bi bi-info-circle fs-4"></i>
                                </div>
                                <div>
                                    <h6 class="alert-heading mb-2">Peran Akun:</h6>
                                    <p class="mb-1 small"><strong>Tamu:</strong> Lapor sampah & lihat peta</p>
                                    <p class="mb-1 small"><strong>Anggota:</strong> Angkut sampah rutin</p>
                                    <p class="mb-1 small"><strong>Tim Angkut:</strong> Petugas pengangkut</p>
                                    <p class="mb-0 small"><strong>Admin:</strong> Kelola sistem</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize
    setupLoginForm();
}

function setupLoginForm() {
    const form = document.getElementById("loginForm");
    const togglePasswordBtn = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("password");
    
    // Toggle password visibility
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.innerHTML = type === 'password' ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
        });
    }
    
    // Real-time validation
    const usernameInput = document.getElementById("username");
    if (usernameInput) {
        usernameInput.addEventListener('input', validateUsername);
        usernameInput.addEventListener('blur', validateUsername);
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', validatePassword);
        passwordInput.addEventListener('blur', validatePassword);
    }
    
    // Handle form submission
    form.addEventListener("submit", handleLoginSubmit);
    
    // Auto-focus pada username field
    document.getElementById("username").focus();
    
    // Load login attempts from localStorage
    updateLoginAttempts();
    
    // Load remembered username if exists
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser && usernameInput) {
        usernameInput.value = rememberedUser;
        validateUsername();
    }
}

// Real-time validation functions
function validateUsername() {
    const input = document.getElementById("username");
    const errorDiv = document.getElementById("usernameError");
    const value = input.value.trim();
    
    // Reset
    input.classList.remove('is-invalid', 'is-valid');
    
    if (!value) {
        input.classList.add('is-invalid');
        errorDiv.textContent = "Username harus diisi";
        return false;
    }
    
    if (value.length < 3 || value.length > 50) {
        input.classList.add('is-invalid');
        errorDiv.textContent = "Username harus 3-50 karakter";
        return false;
    }
    
    const usernameRegex = /^[a-zA-Z0-9_.-]{3,50}$/;
    if (!usernameRegex.test(value)) {
        input.classList.add('is-invalid');
        errorDiv.textContent = "Username hanya boleh mengandung huruf, angka, underscore, titik, atau dash";
        return false;
    }
    
    // Check for common bad patterns
    if (value.includes(' ')) {
        input.classList.add('is-invalid');
        errorDiv.textContent = "Username tidak boleh mengandung spasi";
        return false;
    }
    
    input.classList.add('is-valid');
    return true;
}

function validatePassword() {
    const input = document.getElementById("password");
    const errorDiv = document.getElementById("passwordError");
    const value = input.value;
    
    // Reset
    input.classList.remove('is-invalid', 'is-valid');
    
    if (!value) {
        input.classList.add('is-invalid');
        errorDiv.textContent = "Password harus diisi";
        return false;
    }
    
    if (value.length < 6) {
        input.classList.add('is-invalid');
        errorDiv.textContent = "Password harus minimal 6 karakter";
        return false;
    }
    
    if (value.length > 100) {
        input.classList.add('is-invalid');
        errorDiv.textContent = "Password maksimal 100 karakter";
        return false;
    }
    
    // Optional: check for very weak passwords
    // Uncomment if you want to add basic password strength check
    
    input.classList.add('is-valid');
    return true;
}

// Handle form submission
async function handleLoginSubmit(event) {
    event.preventDefault();
    
    // Validate all fields
    const isUsernameValid = validateUsername();
    const isPasswordValid = validatePassword();
    
    if (!isUsernameValid || !isPasswordValid) {
        showMessage("Harap perbaiki error di atas sebelum melanjutkan", "error");
        return;
    }
    
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const loginBtn = document.getElementById("loginBtn");
    
    // Check for excessive login attempts
    if (isLoginBlocked()) {
        showMessage("Terlalu banyak percobaan login. Coba lagi nanti.", "error");
        return;
    }
    
    // Tampilkan loading
    loginBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2"></span>
        Memproses login...
    `;
    loginBtn.disabled = true;
    
    // Add to login attempts
    addLoginAttempt();
    
    try {
        await login(username, password);
        // Reset login attempts on success
        resetLoginAttempts();
    } catch (error) {
        // Reset button
        loginBtn.innerHTML = `
            <i class="bi bi-box-arrow-in-right me-2"></i>
            Login
        `;
        loginBtn.disabled = false;
        
        // Update attempts display
        updateLoginAttempts();
        
        // Check if blocked
        if (isLoginBlocked()) {
            const blockTime = getBlockTimeRemaining();
            showMessage(`Terlalu banyak percobaan. Coba lagi dalam ${blockTime} menit.`, "error");
        }
    }
}

// Login function with improved error handling
async function login(username, password) {
    console.log('🔍 LOGIN DEBUG');
    console.log('Username:', username);
    console.log('Login URL:', API.login);
    
    // Additional client-side validation
    if (!username || !password) {
        throw new Error("Username dan password harus diisi");
    }
    
    try {
        // 1. Login untuk dapat token
        const response = await fetch(API.login, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                username: username, 
                password: password 
            })
        });
        
        console.log('HTTP Status:', response.status);
        
        let errorMsg = 'Terjadi kesalahan pada server';
        
        if (!response.ok) {
            try {
                const errorData = await response.json();
                
                // Handle specific error cases
                switch(response.status) {
                    case 400:
                        errorMsg = errorData.detail || 'Data login tidak valid';
                        break;
                    case 401:
                        errorMsg = 'Username atau password salah';
                        break;
                    case 403:
                        errorMsg = 'Akun dinonaktifkan atau tidak memiliki akses';
                        break;
                    case 404:
                        errorMsg = 'Endpoint tidak ditemukan';
                        break;
                    case 429:
                        errorMsg = 'Terlalu banyak percobaan. Coba lagi nanti.';
                        break;
                    case 500:
                        errorMsg = 'Server mengalami masalah. Coba lagi nanti.';
                        break;
                    default:
                        errorMsg = errorData.detail || `Login gagal (${response.status})`;
                }
                
                // Log detailed error for debugging
                console.error('Login error details:', errorData);
                
            } catch (parseError) {
                errorMsg = `Login gagal dengan status ${response.status}`;
            }
            
            showMessage(errorMsg, "error");
            throw new Error(errorMsg);
        }
        
        const data = await response.json();
        console.log('Login Response:', data);
        
        if (!data.access) {
            showMessage('Login gagal: Tidak menerima token', "error");
            throw new Error('No access token received');
        }
        
        // Validate token structure
        try {
            const tokenParts = data.access.split('.');
            if (tokenParts.length !== 3) {
                throw new Error('Token tidak valid');
            }
            
            const tokenData = JSON.parse(atob(tokenParts[1]));
            console.log('🔑 Token payload:', tokenData);
            
            // Check token expiration
            if (tokenData.exp && Date.now() >= tokenData.exp * 1000) {
                showMessage('Token sudah kadaluarsa', "error");
                throw new Error('Token expired');
            }
            
            const userId = tokenData.user_id;
            if (!userId) {
                showMessage('Token tidak berisi user_id', "error");
                throw new Error('Invalid token payload');
            }
            
            console.log('✅ User ID from token:', userId);
            
            // 3. Fetch user data dari API
            const userUrl = API.users.replace(/\/$/, '') + `/${userId}/`;
            console.log('User URL:', userUrl);
            
            const userResponse = await fetch(userUrl, {
                headers: {
                    'Authorization': `Bearer ${data.access}`,
                    'Accept': 'application/json'
                }
            });
            
            if (!userResponse.ok) {
                throw new Error(`Failed to fetch user data: ${userResponse.status}`);
            }
            
            const userData = await userResponse.json();
            console.log('✅ User data fetched:', userData);
            
            // Validate user data
            if (!userData.id || !userData.username || !userData.role) {
                throw new Error('Data pengguna tidak lengkap');
            }
            
            // Check if account is active
            if (userData.is_active === false) {
                showMessage('Akun dinonaktifkan. Hubungi administrator.', "error");
                throw new Error('Account disabled');
            }
            
            // Save to localStorage
            localStorage.setItem('access', data.access);
            localStorage.setItem('refresh', data.refresh);
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Remember me option
            const rememberMe = document.getElementById('rememberMe').checked;
            if (rememberMe) {
                localStorage.setItem('rememberedUser', username);
                console.log('✅ Remembering user');
            } else {
                localStorage.removeItem('rememberedUser');
            }
            
            // 4. Load idAnggota jika role = anggota
            if (userData.role === 'anggota') {
                await loadAnggotaId(userData.id, data.access);
            }
            
            // 5. Tampilkan pesan sukses
            showMessage(`Login berhasil! Selamat datang ${userData.username}`, "success");
            
            // Tampilkan toast jika tersedia
            if (typeof showToast === 'function') {
                showToast('success', `Selamat datang ${userData.username}!`);
            }
            
            // 6. Redirect ke dashboard sesuai role
            setTimeout(() => {
                console.log(`🎯 Redirecting ${userData.role}...`);
                window.location.hash = `#/dashboard-${userData.role}`;
            }, 1500);
            
        } catch (tokenError) {
            console.error('Token validation error:', tokenError);
            showMessage('Token tidak valid. Coba login kembali.', "error");
            throw tokenError;
        }
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Network error
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showMessage('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', "error");
        } else if (error.message.includes('Failed to fetch')) {
            showMessage('Server tidak merespon. Coba lagi nanti.', "error");
        }
        
        throw error;
    }
}

// Login attempts management
function addLoginAttempt() {
    let attempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
    const now = Date.now();
    
    // Remove attempts older than 15 minutes
    attempts = attempts.filter(time => now - time < 15 * 60 * 1000);
    
    // Add current attempt
    attempts.push(now);
    localStorage.setItem('loginAttempts', JSON.stringify(attempts));
    
    // Log last attempt time
    localStorage.setItem('lastLoginAttempt', now);
    
    updateLoginAttempts();
}

function resetLoginAttempts() {
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('lastLoginAttempt');
    updateLoginAttempts();
}

function updateLoginAttempts() {
    const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
    const attemptsDiv = document.getElementById('loginAttempts');
    const countSpan = document.getElementById('attemptCount');
    
    if (attemptsDiv && countSpan) {
        if (attempts.length > 0) {
            attemptsDiv.style.display = 'block';
            countSpan.textContent = attempts.length;
            
            // Change color based on attempts
            if (attempts.length >= 3) {
                attemptsDiv.className = 'small text-warning text-end mt-2';
            }
            if (attempts.length >= 5) {
                attemptsDiv.className = 'small text-danger text-end mt-2';
            }
        } else {
            attemptsDiv.style.display = 'none';
        }
    }
}

function isLoginBlocked() {
    const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
    const now = Date.now();
    
    // More than 5 attempts in last 15 minutes = blocked
    const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000);
    return recentAttempts.length >= 5;
}

function getBlockTimeRemaining() {
    const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
    if (attempts.length < 5) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const minutesPassed = Math.floor((Date.now() - oldestAttempt) / (60 * 1000));
    return Math.max(0, 15 - minutesPassed);
}

// Load idAnggota
async function loadAnggotaId(userId, token) {
    try {
        const response = await fetch(`${API.anggota}?user=${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.length > 0) {
                const anggotaId = data[0].idAnggota || data[0].id;
                localStorage.setItem("idAnggota", anggotaId);
                console.log(`✅ idAnggota ditemukan: ${anggotaId}`);
            }
        }
    } catch (error) {
        console.warn('Tidak bisa load data anggota:', error);
    }
}

// Helper untuk menampilkan pesan
function showMessage(message, type = "info") {
    const messageDiv = document.getElementById("loginMessage");
    
    // Reset styles
    messageDiv.innerHTML = "";
    messageDiv.className = "alert";
    
    // Set style berdasarkan type
    switch (type) {
        case "error":
            messageDiv.className = "alert alert-danger";
            break;
        case "success":
            messageDiv.className = "alert alert-success";
            break;
        case "warning":
            messageDiv.className = "alert alert-warning";
            break;
        default:
            messageDiv.className = "alert alert-info";
    }
    
    // Tambahkan ikon
    let icon = "";
    switch (type) {
        case "error":
            icon = '<i class="bi bi-exclamation-triangle-fill me-2"></i>';
            break;
        case "success":
            icon = '<i class="bi bi-check-circle-fill me-2"></i>';
            break;
        case "warning":
            icon = '<i class="bi bi-exclamation-circle-fill me-2"></i>';
            break;
        default:
            icon = '<i class="bi bi-info-circle-fill me-2"></i>';
    }
    
    messageDiv.innerHTML = `
        <div class="d-flex align-items-center">
            ${icon}
            <div>${message}</div>
        </div>
    `;
    
    // Auto-hide untuk pesan sukses
    if (type === "success") {
        setTimeout(() => {
            messageDiv.style.opacity = "0";
            messageDiv.style.transition = "opacity 0.5s";
            setTimeout(() => {
                messageDiv.innerHTML = "";
                messageDiv.className = "";
                messageDiv.style = "";
            }, 500);
        }, 3000);
    }
}

// Export juga function login untuk digunakan di tempat lain
export { login };