// auth/register.js
import { API } from "../api.js";

let usernameTaken = false;

export function registerPage() {
    const app = document.getElementById("app");
    app.innerHTML = `
        <!-- Bootstrap 5 CSS -->
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
            .card-body-large {
                padding: 2.5rem !important;
                min-height: 500px;
            }
            .btn-back-dashboard {
                margin-top: 1.5rem;
                padding: 0.75rem 1.5rem;
                font-weight: 600;
            }
            .feature-card {
                height: 100%;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .feature-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
            }
            .validation-feedback {
                display: none;
                font-size: 0.85rem;
                margin-top: 0.25rem;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
            }
            .validation-feedback.error {
                display: block;
                color: #dc3545;
                background-color: rgba(220, 53, 69, 0.1);
            }
            .validation-feedback.success {
                display: block;
                color: #198754;
                background-color: rgba(25, 135, 84, 0.1);
            }
            .validation-feedback.warning {
                display: block;
                color: #ffc107;
                background-color: rgba(255, 193, 7, 0.1);
            }
            .is-invalid {
                border-color: #dc3545 !important;
            }
            .is-valid {
                border-color: #198754 !important;
            }
            .field-validation {
                min-height: 1.5rem;
            }
            @media (max-width: 768px) {
                .card-body-large {
                    padding: 1.5rem !important;
                }
            }
        </style>
        
        <div class="container-fluid bg-light" style="min-height: 100vh;">
            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-xl-10">
                        <div class="card border-success shadow-lg">
                            <div class="card-header bg-success text-white py-3">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h4 class="mb-1">
                                            <i class="bi bi-person-plus me-2"></i>
                                            Daftar Akun Tamu CleanUp Kupang
                                        </h4>
                                        <p class="mb-0 opacity-90 small">Bergabunglah dengan komunitas peduli lingkungan</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="card-body card-body-large">
                                <!-- Tombol Kembali ke Dashboard di dalam Card Body -->
                                <div class="mb-4">
                                    <button onclick="window.location.hash='#/'"
                                            class="btn btn-outline-secondary btn-back-dashboard">
                                        <i class="bi bi-speedometer2 me-2"></i>
                                        Kembali ke Dashboard
                                    </button>
                                </div>

                                <!-- Informasi Penting -->
                                <div class="alert alert-info mb-4">
                                    <div class="d-flex align-items-start">
                                        <i class="bi bi-info-circle-fill me-3 fs-4 mt-1"></i>
                                        <div>
                                            <h5 class="alert-heading">Informasi Pendaftaran</h5>
                                            <p class="mb-2">Pendaftaran ini untuk akun <strong class="text-success">TAMU</strong>. 
                                            Dengan akun tamu, Anda dapat melaporkan titik sampah secara gratis dan membantu 
                                            menjaga kebersihan Kota Kupang.</p>
                                            <p class="mb-0">Ingin layanan lengkap? <a href="#/register-anggota" class="alert-link fw-bold">Upgrade ke Anggota</a> 
                                            untuk mendapatkan layanan angkut sampah rumah tangga.</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Form Registrasi -->
                                <form id="registerForm">
                                    <h5 class="fw-bold mb-4 text-success border-bottom pb-2">
                                        <i class="bi bi-person-circle me-2"></i>
                                        Data Pribadi
                                    </h5>
                                    
                                    <div class="row">
                                        <!-- Username -->
                                        <div class="col-md-6 mb-2">
                                            <label class="form-label fw-semibold">
                                                <i class="bi bi-person me-1"></i> Username <span class="text-danger">*</span>
                                            </label>
                                            <input type="text" class="form-control form-control-lg" id="username" 
                                                   placeholder="Masukkan username unik" required>
                                            <div class="form-text small text-muted">Contoh: budi_kupang, siti123</div>
                                            <div class="field-validation">
                                                <div id="usernameValidation" class="validation-feedback"></div>
                                            </div>
                                        </div>
                                        
                                        <!-- Password -->
                                        <div class="col-md-6 mb-2">
                                            <label class="form-label fw-semibold">
                                                <i class="bi bi-lock me-1"></i> Password <span class="text-danger">*</span>
                                            </label>
                                            <input type="password" class="form-control form-control-lg" id="password" 
                                                   placeholder="Minimal 6 karakter" required minlength="6">
                                            <div class="form-text small text-muted">Gunakan kombinasi huruf dan angka</div>
                                            <div class="field-validation">
                                                <div id="passwordValidation" class="validation-feedback"></div>
                                            </div>
                                        </div>
                                        
                                        <!-- Email -->
                                        <div class="col-md-6 mb-2">
                                            <label class="form-label fw-semibold">
                                                <i class="bi bi-envelope me-1"></i> Email
                                            </label>
                                            <input type="email" class="form-control form-control-lg" id="email" 
                                                   placeholder="nama@email.com" required>
                                            <div class="form-text small text-muted">Digunakan untuk notifikasi dan reset password</div>
                                            <div class="field-validation">
                                                <div id="emailValidation" class="validation-feedback"></div>
                                            </div>
                                        </div>
                                        
                                        <!-- Nama Lengkap -->
                                        <div class="col-md-6 mb-2">
                                            <label class="form-label fw-semibold">
                                                <i class="bi bi-card-text me-1"></i> Nama Lengkap <span class="text-danger">*</span>
                                            </label>
                                            <input type="text" class="form-control form-control-lg" id="nama" 
                                                   placeholder="Nama lengkap Anda" required>
                                            <div class="form-text small text-muted">Contoh: Budi Santoso</div>
                                            <div class="field-validation">
                                                <div id="namaValidation" class="validation-feedback"></div>
                                            </div>
                                        </div>
                                        
                                        <!-- Jenis Kelamin -->
                                        <div class="col-md-6 mb-2">
                                            <label class="form-label fw-semibold">
                                                <i class="bi bi-gender-ambiguous me-1"></i> Jenis Kelamin <span class="text-danger">*</span>
                                            </label>
                                            <select class="form-select form-select-lg" id="jk" required>
                                                <option value="">Pilih Jenis Kelamin</option>
                                                <option value="L">Laki-laki</option>
                                                <option value="P">Perempuan</option>
                                            </select>
                                            <div class="field-validation">
                                                <div id="jkValidation" class="validation-feedback"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Perbandingan Fitur -->
                                    <h5 class="fw-bold mb-4 text-success border-bottom pb-2 mt-5">
                                        <i class="bi bi-grid-3x3-gap me-2"></i>
                                        Pilihan Akun
                                    </h5>
                                    
                                    <div class="row mb-5">
                                        <div class="col-md-6 mb-4">
                                            <div class="card h-100 border-success feature-card">
                                                <div class="card-header bg-success text-white">
                                                    <h5 class="mb-0">
                                                        <i class="bi bi-person me-2"></i>
                                                        Akun Tamu (GRATIS)
                                                    </h5>
                                                </div>
                                                <div class="card-body">
                                                    <div class="text-center mb-4">
                                                        <div class="bg-success bg-opacity-10 p-4 rounded-circle d-inline-block">
                                                            <i class="bi bi-person text-success fs-1"></i>
                                                        </div>
                                                    </div>
                                                    <ul class="list-unstyled">
                                                        <li class="mb-3">
                                                            <i class="bi bi-check-circle-fill text-success me-2"></i>
                                                            <strong>Lapor sampah gratis</strong>
                                                        </li>
                                                        <li class="mb-3">
                                                            <i class="bi bi-check-circle-fill text-success me-2"></i>
                                                            <strong>Lihat peta laporan sampah</strong>
                                                        </li>
                                                        <li class="mb-3">
                                                            <i class="bi bi-check-circle-fill text-success me-2"></i>
                                                            <strong>Pantau status laporan</strong>
                                                        </li>
                                                        <li class="mb-3">
                                                            <i class="bi bi-check-circle-fill text-success me-2"></i>
                                                            <strong>Notifikasi real-time</strong>
                                                        </li>
                                                        <li>
                                                            <i class="bi bi-check-circle-fill text-success me-2"></i>
                                                            <strong>Upgrade ke Anggota kapan saja</strong>
                                                        </li>
                                                    </ul>
                                                    <div class="text-center mt-4">
                                                        <div class="badge bg-success fs-6 py-2 px-3">
                                                            <i class="bi bi-currency-exchange me-1"></i>
                                                            GRATIS SELAMANYA
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="col-md-6 mb-4">
                                            <div class="card h-100 border-warning feature-card">
                                                <div class="card-header bg-warning text-dark">
                                                    <h5 class="mb-0">
                                                        <i class="bi bi-star-fill me-2"></i>
                                                        Akun Anggota (PREMIUM)
                                                    </h5>
                                                </div>
                                                <div class="card-body">
                                                    <div class="text-center mb-4">
                                                        <div class="bg-warning bg-opacity-10 p-4 rounded-circle d-inline-block">
                                                            <i class="bi bi-star-fill text-warning fs-1"></i>
                                                        </div>
                                                    </div>
                                                    <ul class="list-unstyled">
                                                        <li class="mb-3">
                                                            <i class="bi bi-truck text-warning me-2"></i>
                                                            <strong>Layanan angkut sampah rumah tangga</strong>
                                                        </li>
                                                        <li class="mb-3">
                                                            <i class="bi bi-calendar-check text-warning me-2"></i>
                                                            <strong>Penjadwalan online fleksibel</strong>
                                                        </li>
                                                        <li class="mb-3">
                                                            <i class="bi bi-geo-alt text-warning me-2"></i>
                                                            <strong>Penjemputan depan rumah</strong>
                                                        </li>
                                                        <li class="mb-3">
                                                            <i class="bi bi-shield-check text-warning me-2"></i>
                                                            <strong>Prioritas layanan</strong>
                                                        </li>
                                                        <li>
                                                            <i class="bi bi-gift text-warning me-2"></i>
                                                            <strong>Bonus dan diskon eksklusif</strong>
                                                        </li>
                                                    </ul>
                                                    <div class="text-center mt-4">
                                                        <div class="badge bg-warning text-dark fs-6 py-2 px-3 mb-2">
                                                            <i class="bi bi-currency-exchange me-1"></i>
                                                            Rp 50.000 / bulan
                                                        </div>
                                                        <div class="d-grid">
                                                            <a href="#/register-anggota" class="btn btn-warning btn-lg">
                                                                <i class="bi bi-arrow-right-circle me-2"></i>
                                                                Daftar sebagai Anggota
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Summary Validation Message -->
                                    <div id="summaryValidation" class="alert alert-info d-none">
                                        <div class="d-flex align-items-center">
                                            <i class="bi bi-info-circle-fill me-3 fs-5"></i>
                                            <div>
                                                <strong>Periksa kembali form Anda</strong>
                                                <div id="summaryContent" class="mt-1 small"></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Tombol Submit -->
                                    <div class="d-grid gap-3 mt-3">
                                        <button type="submit" class="btn btn-success btn-lg py-3 fw-bold" id="regBtn">
                                            <i class="bi bi-person-plus me-2"></i> Daftar Akun Tamu
                                        </button>
                                        
                                        <div class="text-center">
                                            <p class="text-muted mb-2">
                                                Dengan mendaftar, Anda menyetujui 
                                                <a href="#/syarat-ketentuan" class="text-success fw-semibold">Syarat & Ketentuan</a> dan 
                                                <a href="#/kebijakan-privasi" class="text-success fw-semibold">Kebijakan Privasi</a>
                                            </p>
                                            <p class="text-muted mb-0">
                                                Sudah punya akun? 
                                                <a href="#/login" class="text-success fw-semibold text-decoration-none">
                                                    <i class="bi bi-box-arrow-in-right me-1"></i> Login di sini
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                </form>
                                
                                <!-- Message Area -->
                                <div id="registerMessage" class="mt-5"></div>

                                <!-- Tombol Kembali ke Dashboard di bagian bawah -->
                                <div class="mt-5 pt-4 border-top text-center">
                                    <button onclick="window.location.hash='#/dashboard'"
                                            class="btn btn-link text-decoration-none">
                                        <i class="bi bi-arrow-return-left me-1"></i>
                                        Kembali ke Dashboard
                                    </button>
                                    <div class="mt-2">
                                        <a href="#/" class="text-success text-decoration-none small">
                                            <i class="bi bi-house me-1"></i> Kembali ke Beranda
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </row>
            </div>
        </div>
    `;

    // Tambahkan event listener untuk validasi real-time
    setupRealTimeValidation();
    
    document.getElementById("registerForm").onsubmit = register;
}

// Fungsi untuk setup validasi real-time
function setupRealTimeValidation() {
    const inputs = [
        { id: 'username', validator: validateUsername },
        { id: 'password', validator: validatePassword },
        { id: 'email', validator: validateEmail },
        { id: 'nama', validator: validateNama },
        { id: 'jk', validator: validateJK }
    ];
    
    inputs.forEach(input => {
        const element = document.getElementById(input.id);
        if (element) {
            element.addEventListener('input', () => {
                input.validator();
                updateSubmitButton();
                updateSummary();
            });
            element.addEventListener('blur', () => {
                input.validator();
                updateSubmitButton();
                updateSummary();
            });
            element.addEventListener('input', () => {
                if (input.id === 'username') {
                    usernameTaken = false; // ⬅️ reset status backend
                }
                input.validator();
                updateSubmitButton();
                updateSummary();
            });

        }
    });
    
    // Validasi awal
    inputs.forEach(input => input.validator());
    updateSubmitButton();
    updateSummary();
}

function validateUsername() {
    const username = document.getElementById("username").value.trim();
    const validationDiv = document.getElementById("usernameValidation");
    const input = document.getElementById("username");

    // reset class
    input.classList.remove("is-valid", "is-invalid");

    if (!username) {
        showValidation(validationDiv, "error", "Username harus diisi");
        input.classList.add("is-invalid");
        return false;
    }

    if (username.length < 3) {
        showValidation(validationDiv, "error", "Username minimal 3 karakter");
        input.classList.add("is-invalid");
        return false;
    }

    const regex = /^[a-zA-Z0-9_.-]+$/;
    if (!regex.test(username)) {
        showValidation(validationDiv, "error", "Hanya huruf, angka, titik, underscore, dan dash");
        input.classList.add("is-invalid");
        return false;
    }

    // 🔴 HASIL DARI BACKEND
    if (usernameTaken) {
        showValidation(validationDiv, "error", "Username sudah digunakan");
        input.classList.add("is-invalid");
        return false;
    }

    showValidation(validationDiv, "success", "✓ Username valid");
    input.classList.add("is-valid");
    return true;
}

function validatePassword() {
    const password = document.getElementById("password").value;
    const validationDiv = document.getElementById("passwordValidation");
    const input = document.getElementById("password");
    
    if (!password) {
        showValidation(validationDiv, "error", "Password harus diisi");
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        return false;
    } else if (password.length < 6) {
        showValidation(validationDiv, "error", "Password minimal 6 karakter");
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        return false;
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
        showValidation(validationDiv, "warning", "Sebaiknya kombinasi huruf dan angka");
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        return true;
    } else {
        showValidation(validationDiv, "success", "✓ Password kuat");
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        return true;
    }
}

function validateEmail() {
    const email = document.getElementById("email").value.trim();
    const validationDiv = document.getElementById("emailValidation");
    const input = document.getElementById("email");
    
    // Reset classes
    input.classList.remove('is-invalid', 'is-valid');
    
    if (!email) {
        showValidation(validationDiv, "error", "Email harus diisi");
        input.classList.add('is-invalid');
        return false;
    }
    
    // Validasi format email dasar
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showValidation(validationDiv, "error", "Format email tidak valid. Contoh: nama@domain.com");
        input.classList.add('is-invalid');
        return false;
    }
    
    // Validasi panjang
    if (email.length > 254) {
        showValidation(validationDiv, "error", "Email terlalu panjang (maksimal 254 karakter)");
        input.classList.add('is-invalid');
        return false;
    }
    
    showValidation(validationDiv, "success", "✓ Email valid");
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    return true;
}

function validateNama() {
    const nama = document.getElementById("nama").value.trim();
    const validationDiv = document.getElementById("namaValidation");
    const input = document.getElementById("nama");
    
    if (!nama) {
        showValidation(validationDiv, "error", "Nama lengkap harus diisi");
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        return false;
    } else if (nama.length < 2) {
        showValidation(validationDiv, "warning", "Nama terlalu pendek");
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        return true;
    } else {
        showValidation(validationDiv, "success", "✓ Nama valid");
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        return true;
    }
}

function validateJK() {
    const jk = document.getElementById("jk").value;
    const validationDiv = document.getElementById("jkValidation");
    const input = document.getElementById("jk");
    
    if (!jk) {
        showValidation(validationDiv, "error", "Jenis kelamin harus dipilih");
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        return false;
    } else {
        showValidation(validationDiv, "success", "✓ Jenis kelamin dipilih");
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        return true;
    }
}

// Fungsi helper untuk menampilkan validasi
function showValidation(element, type, message) {
    element.textContent = message;
    element.className = `validation-feedback ${type}`;
}

function hideValidation(element) {
    element.textContent = '';
    element.className = 'validation-feedback';
}

// Update tombol submit berdasarkan validasi
function updateSubmitButton() {
    const isValid = 
        validateUsername() && 
        validatePassword() && 
        validateEmail() && 
        validateNama() && 
        validateJK();
    
    const regBtn = document.getElementById("regBtn");
    regBtn.disabled = !isValid;
    regBtn.className = isValid ? 
        'btn btn-success btn-lg py-3 fw-bold' : 
        'btn btn-secondary btn-lg py-3 fw-bold';
}

function updateSummary() {
    const summaryDiv = document.getElementById("summaryValidation");
    const summaryContent = document.getElementById("summaryContent");
    
    // Cek semua validasi
    const fields = [
        { name: "Username", valid: validateUsername() },
        { name: "Password", valid: validatePassword() },
        { name: "Email", valid: validateEmail() }, // Sekarang required
        { name: "Nama Lengkap", valid: validateNama() },
        { name: "Jenis Kelamin", valid: validateJK() }
    ];
    
    const invalidFields = fields.filter(field => !field.valid);
    
    if (invalidFields.length > 0) {
        summaryDiv.className = "alert alert-warning";
        summaryContent.innerHTML = `
            <span class="text-danger fw-semibold">${invalidFields.length} field perlu diperbaiki:</span>
            <ul class="mb-0 mt-2">
                ${invalidFields.map(field => `<li>${field.name}</li>`).join('')}
            </ul>
        `;
        summaryDiv.classList.remove('d-none');
    } else {
        summaryDiv.className = "alert alert-success";
        summaryContent.innerHTML = `
            <span class="text-success fw-semibold">✓ Semua data sudah valid!</span>
            <p class="mb-0 mt-1 small">Anda dapat melanjutkan pendaftaran.</p>
        `;
        summaryDiv.classList.remove('d-none');
    }
}

// Fungsi untuk validasi form (digunakan saat submit)
function validateForm() {
    const isUsernameValid = validateUsername();
    const isPasswordValid = validatePassword();
    const isEmailValid = validateEmail();
    const isNamaValid = validateNama();
    const isJKValid = validateJK();
    
    return isUsernameValid && isPasswordValid && isEmailValid && isNamaValid && isJKValid;
}

async function register(e) {
    e.preventDefault();
    
    // Validasi sebelum submit
    if (!validateForm()) {
        // Tampilkan summary dan scroll ke atas form
        updateSummary();
        document.getElementById("summaryValidation").scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        return;
    }
    
    const regBtn = document.getElementById("regBtn");
    const originalText = regBtn.innerHTML;
    const messageDiv = document.getElementById("registerMessage");
    
    try {
        regBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mendaftar...';
        regBtn.disabled = true;
        
        // Clear previous messages
        messageDiv.innerHTML = '';
        
        // Ambil semua nilai form
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const email = document.getElementById("email").value.trim();
        const nama = document.getElementById("nama").value.trim();
        const jk = document.getElementById("jk").value;
        
        // Validasi tambahan untuk email (double-check)
        if (!email) {
            throw new Error("Email harus diisi");
        }
        
        // Validasi format email lagi untuk memastikan
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error("Format email tidak valid. Harus menggunakan format: nama@domain.com");
        }
        
        // Buat payload dengan email yang sudah divalidasi
        const payload = {
            username: username,
            password: password,
            email: email, // Email sekarang required
            nama: nama,
            jk: jk
        };
        
        console.log('Payload registrasi:', payload);
        
        // Kirim request
        const res = await fetch(API.register, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        
        if (res.ok) {
            alert("Registrasi Berhasil!");
            // Tampilkan pesan sukses
            messageDiv.innerHTML = `
                <div class="alert alert-success alert-dismissible fade show">
                    <div class="d-flex align-items-center">
                        <div class="bg-success bg-opacity-10 p-3 rounded-circle me-4">
                            <i class="bi bi-check-circle-fill text-success fs-2"></i>
                        </div>
                        <div class="flex-grow-1">
                            <h5 class="alert-heading mb-2">🎉 Registrasi Berhasil!</h5>
                            <div class="row">
                                <div class="col-md-6">
                                    <p class="mb-2"><strong>Username:</strong> ${data.username}</p>
                                    <p class="mb-2"><strong>Nama:</strong> ${data.nama}</p>
                                </div>
                                <div class="col-md-6">
                                    <p class="mb-2"><strong>Email:</strong> ${data.email || '-'}</p>
                                    <p class="mb-0"><strong>Status:</strong> <span class="badge bg-success">Tamu</span></p>
                                </div>
                            </div>
                            <hr class="my-3">
                            <div class="alert alert-info mb-0">
                                <i class="bi bi-info-circle me-2"></i>
                                Anda akan diarahkan ke halaman login dalam 3 detik...
                            </div>
                        </div>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                </div>
            `;
            
            // Kosongkan form dan reset validasi
            document.getElementById("registerForm").reset();
            
            // Reset semua validasi visual
            const inputs = ['username', 'password', 'email', 'nama', 'jk'];
            inputs.forEach(id => {
                const input = document.getElementById(id);
                const validation = document.getElementById(`${id}Validation`);
                if (input) {
                    input.classList.remove('is-invalid', 'is-valid');
                }
                if (validation) {
                    hideValidation(validation);
                }
            });
            
            // Sembunyikan summary
            document.getElementById("summaryValidation").classList.add('d-none');
            
            // Redirect ke login setelah 3 detik
            setTimeout(() => {
                window.location.hash = "#/login";
            }, 3000);
            
        } else {
            // ===== HANDLING ERROR SERVER =====
            // KHUSUS USERNAME DUPLIKAT
            if (data && typeof data === 'object' && data.username) {
                const usernameInput = document.getElementById("username");
                const usernameValidation = document.getElementById("usernameValidation");

                usernameTaken = true;

                // Tandai invalid
                usernameInput.classList.add("is-invalid");
                usernameInput.classList.remove("is-valid");

                // Tampilkan pesan validasi
                if (usernameValidation) {
                    usernameValidation.innerHTML = `
                        <i class="bi bi-x-circle-fill me-1"></i>
                        ${data.username[0]}
                    `;
                    usernameValidation.classList.remove("d-none");
                }

                // Fokus & scroll ke field
                usernameInput.focus();
                usernameInput.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                // Pesan info kecil
                messageDiv.innerHTML = `
                    <div class="alert alert-info alert-dismissible fade show mt-3">
                        <i class="bi bi-info-circle me-2"></i>
                        Silakan gunakan username lain dan coba kembali.
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                `;

                return;
            }
            
            // KHUSUS EMAIL DUPLIKAT
            if (data && typeof data === 'object' && data.email) {
                const emailInput = document.getElementById("email");
                const emailValidation = document.getElementById("emailValidation");

                // Tandai invalid
                emailInput.classList.add("is-invalid");
                emailInput.classList.remove("is-valid");

                // Tampilkan pesan validasi
                if (emailValidation) {
                    emailValidation.innerHTML = `
                        <i class="bi bi-x-circle-fill me-1"></i>
                        ${data.email[0]}
                    `;
                    emailValidation.classList.remove("d-none");
                }

                // Fokus & scroll ke field
                emailInput.focus();
                emailInput.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                // Pesan info
                messageDiv.innerHTML = `
                    <div class="alert alert-info alert-dismissible fade show mt-3">
                        <i class="bi bi-info-circle me-2"></i>
                        Email sudah terdaftar. Silakan gunakan email lain atau login.
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                `;

                return;
            }
            
            // ===== ERROR LAIN =====
            let errorMessage = "Gagal mendaftar";

            if (data.detail) {
                errorMessage = data.detail;
            } else if (data.non_field_errors) {
                errorMessage = data.non_field_errors[0];
            } else if (data.password) {
                errorMessage = `Password: ${data.password[0]}`;
                document.getElementById("password").classList.add("is-invalid");
            } else if (data.nama) {
                errorMessage = `Nama: ${data.nama[0]}`;
                document.getElementById("nama").classList.add("is-invalid");
            } else if (data.jk) {
                errorMessage = `Jenis kelamin: ${data.jk[0]}`;
                document.getElementById("jk").classList.add("is-invalid");
            }

            throw new Error(errorMessage);
        }
        
    } catch (error) {
        console.error("Error registrasi:", error);
        
        // Tampilkan pesan error
        messageDiv.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show">
                <div class="d-flex align-items-center">
                    <div class="bg-danger bg-opacity-10 p-3 rounded-circle me-4">
                        <i class="bi bi-exclamation-triangle-fill text-danger fs-2"></i>
                    </div>
                    <div class="flex-grow-1">
                        <h5 class="alert-heading mb-2">Gagal Mendaftar!</h5>
                        <p class="mb-0">${error.message}</p>
                        ${error.message.includes('email') ? 
                            '<p class="mt-2 small"><i class="bi bi-info-circle me-1"></i>Pastikan email menggunakan format: nama@domain.com</p>' : 
                            ''}
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        // Scroll ke pesan error
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
    } finally {
        regBtn.innerHTML = originalText;
        regBtn.disabled = false;
        // Validasi ulang untuk update status tombol
        updateSubmitButton();
    }
}