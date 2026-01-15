// auth/registerAnggota.js
import { API } from "../api.js";
import { loadLeaflet, initMapForm } from "../utils/mapConfig.js";

let mapInstance = null;

/* ===========================
   REGEX & HELPER VALIDASI
=========================== */
const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const regexWA = /^0\d{11}$/; // 0 + 11 angka = 12 digit
const regexNama = /^[a-zA-ZÀ-ÿ\s']+$/;
const regexAlamat = /^[a-zA-Z0-9À-ÿ\s.,\-\/#()]+$/;
const regexPassword = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;

function setInvalid(el, message) {
    el.classList.add("is-invalid");
    el.classList.remove("is-valid");

    if (el.nextElementSibling && el.nextElementSibling.classList.contains('invalid-feedback')) {
        el.nextElementSibling.innerHTML = `<small>${message}</small>`;
    }
}

function setValid(el, message = "✓ Valid") {
    el.classList.remove("is-invalid");
    el.classList.add("is-valid");

    if (el.nextElementSibling && el.nextElementSibling.classList.contains('invalid-feedback')) {
        el.nextElementSibling.innerHTML = `<small class="text-success">${message}</small>`;
    }
}


export function registerAnggotaPage() {
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
            .username-feedback {
                font-size: 0.875rem;
                margin-top: 0.25rem;
            }
            @media (max-width: 768px) {
                .card-body-large {
                    padding: 1.5rem !important;
                }
            }
        </style>
        
        <div class="container-fluid bg-light" style="min-height:100vh">
            <div class="container py-4">
                <div class="row justify-content-center">
                    <div class="col-xl-10">
                        <div class="card border-success shadow-lg">
                            <div class="card-header bg-success text-white py-3">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h4 class="mb-1">
                                            <i class="bi bi-geo-alt-fill me-2"></i>
                                            Daftar Anggota CleanUp Kupang
                                        </h4>
                                        <small class="opacity-90">Pilih lokasi rumah (GPS / klik peta)</small>
                                    </div>
                                </div>
                            </div>

                            <div class="card-body card-body-large">
                                <button onclick="window.location.hash='#/'"
                                        class="btn btn-outline-dark btn-sm margin-bottom-10">
                                        <i class="bi bi-arrow-left me-1"></i> Kembali ke Beranda
                                    </button>
                                <form id="registerForm">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label fw-semibold">Username *</label>
                                            <input id="username" class="form-control form-control-lg" 
                                                   placeholder="Masukkan username" required
                                                   autocomplete="username">
                                            <div id="usernameFeedback" class="username-feedback">
                                                <small class="text-muted">Username minimal 3 karakter</small>
                                            </div>
                                        </div>

                                        <div class="col-md-6 mb-3">
                                            <label class="form-label fw-semibold">Password *</label>
                                            <input id="password" type="password"
                                                class="form-control form-control-lg" 
                                                placeholder="Minimal 6 karakter" required minlength="6">
                                            <div class="invalid-feedback"></div>
                                        </div>

                                        <div class="col-md-6 mb-3">
                                            <label class="form-label fw-semibold">Email</label>
                                            <input id="email" type="email" class="form-control form-control-lg"
                                                   placeholder="nama@email.com">
                                            <div class="invalid-feedback"></div>
                                        </div>

                                        <div class="col-md-6 mb-3">
                                            <label class="form-label fw-semibold">Nama Lengkap *</label>
                                            <input id="nama" class="form-control form-control-lg" 
                                                   placeholder="Nama lengkap" required>
                                            <div class="invalid-feedback"></div>
                                        </div>

                                        <div class="col-md-6 mb-3">
                                            <label class="form-label fw-semibold">No WhatsApp</label>
                                            <input id="noWA" maxlength="12" class="form-control form-control-lg"
                                                   placeholder="0812-3456-7890">
                                            <div class="invalid-feedback"></div>
                                        </div>

                                        <!-- JENIS SAMPAH (DROPDOWN BARU) -->
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label fw-semibold">Jenis Sampah *</label>
                                            <select id="jenisSampah" class="form-control form-control-lg" required>
                                                <option value="">Pilih jenis sampah...</option>
                                                <option value="Rumah Tangga">Rumah Tangga</option>
                                                <option value="Tempat Usaha">Tempat Usaha</option>
                                            </select>
                                            <div class="invalid-feedback">Pilih jenis sampah</div>
                                        </div>

                                        <div class="col-12 mb-4">
                                            <label class="form-label fw-semibold">Alamat *</label>
                                            <textarea id="alamat" class="form-control" 
                                                      rows="3" placeholder="Alamat lengkap" required></textarea>
                                            <div class="invalid-feedback"></div>
                                        </div>

                                        <!-- MAP SECTION -->
                                        <div class="col-12 mb-4">
                                            <div class="border rounded p-3 bg-light">
                                                <label class="form-label fw-bold text-success mb-3">
                                                    <i class="bi bi-map me-2"></i>
                                                    Lokasi Rumah (klik peta / GPS)
                                                </label>
                                                <div id="mapForm"
                                                    style="height:450px;border-radius:8px;border:2px solid #ddd">
                                                </div>
                                                <div class="d-flex justify-content-between align-items-center mt-3">
                                                    <button type="button"
                                                        id="btnGetGPS"
                                                        class="btn btn-primary">
                                                        <i class="bi bi-crosshair me-1"></i>
                                                        Ambil Lokasi GPS
                                                    </button>
                                                    <small class="text-muted">
                                                        <i class="bi bi-info-circle me-1"></i>
                                                        Izinkan akses lokasi di browser
                                                    </small>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="col-md-6 mb-3">
                                            <label class="form-label fw-semibold">Latitude</label>
                                            <input id="latitude" class="form-control form-control-lg" 
                                                   readonly placeholder="-10.1935921">
                                        </div>

                                        <div class="col-md-6 mb-3">
                                            <label class="form-label fw-semibold">Longitude</label>
                                            <input id="longitude" class="form-control form-control-lg" 
                                                   readonly placeholder="123.6149376">
                                        </div>
                                    </div>

                                    <div class="d-grid gap-3 mt-4">
                                        <button id="regBtn"
                                            class="btn btn-success btn-lg py-3 fw-bold">
                                            <i class="bi bi-person-plus me-2"></i>
                                            Daftar Sebagai Anggota
                                        </button>
                                        
                                        <div class="text-center">
                                            <small class="text-muted">
                                                Dengan mendaftar, Anda menyetujui 
                                                <a href="#/syarat-ketentuan" class="text-success">Syarat & Ketentuan</a>
                                            </small>
                                        </div>
                                    </div>
                                </form>

                                <div id="registerMessage" class="mt-4"></div>

                                <!-- Tombol Kembali ke Dashboard di bagian bawah -->
                                <div class="mt-5 pt-4 border-top text-center">
                                    <p class="text-muted mb-3">Sudah memiliki akun?</p>
                                    <a href="#/login" class="btn btn-outline-success">
                                        <i class="bi bi-box-arrow-in-right me-2"></i>
                                        Login ke Akun Anda
                                    </a>
                                    <div class="mt-3">
                                        <button onclick="window.location.hash='#/dashboard'"
                                            class="btn btn-link text-decoration-none">
                                            <i class="bi bi-arrow-return-left me-1"></i>
                                            Kembali ke Dashboard
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById("registerForm").onsubmit = register;
    
    // Tambahkan validasi client-side sederhana untuk username
    setupUsernameValidation();
    setupRealtimeValidation();

    // === LOAD MAP + GPS ===
    loadLeaflet(() => initMapWithGPS());
}

let gpsMarker = null;

/* ===========================
   VALIDASI USERNAME CLIENT-SIDE SEDERHANA
=========================== */
function setupUsernameValidation() {
    const usernameInput = document.getElementById("username");
    const feedback = document.getElementById("usernameFeedback");
    
    // Validasi saat user mengetik
    usernameInput.addEventListener("input", function() {
        const username = this.value.trim();
        
        // Clear any previous styling
        usernameInput.classList.remove("is-valid", "is-invalid");
        
        if (!username) {
            feedback.innerHTML = `<small class="text-muted">Username minimal 3 karakter</small>`;
            return;
        }
        
        if (username.length < 3) {
            feedback.innerHTML = `<small class="text-warning">⚠️ Username minimal 3 karakter</small>`;
            usernameInput.classList.add("is-invalid");
            return;
        }
        
        // Validasi karakter yang diperbolehkan
        const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
        if (!usernameRegex.test(username)) {
            feedback.innerHTML = `<small class="text-warning">⚠️ Hanya huruf, angka, titik, underscore, dash</small>`;
            usernameInput.classList.add("is-invalid");
            return;
        }
        
        feedback.innerHTML = `<small class="text-success">✓ Username valid</small>`;
        usernameInput.classList.add("is-valid");
    });
    
    // Validasi saat user selesai (blur)
    usernameInput.addEventListener("blur", function() {
        const username = this.value.trim();
        
        if (!username) {
            feedback.innerHTML = `<small class="text-danger">❌ Username wajib diisi</small>`;
            usernameInput.classList.add("is-invalid");
            return;
        }
        
        if (username.length < 3) {
            feedback.innerHTML = `<small class="text-danger">❌ Username minimal 3 karakter</small>`;
            usernameInput.classList.add("is-invalid");
            return;
        }
        
        const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
        if (!usernameRegex.test(username)) {
            feedback.innerHTML = `<small class="text-danger">❌ Hanya huruf, angka, titik, underscore, dash</small>`;
            usernameInput.classList.add("is-invalid");
            return;
        }
    });
}

function setupRealtimeValidation() {
    const email = document.getElementById("email");
    const noWA = document.getElementById("noWA");
    const password = document.getElementById("password");
    const nama = document.getElementById("nama");
    const alamat = document.getElementById("alamat");

    // EMAIL
    email.addEventListener("input", () => {
        if (!email.value) {
            email.classList.remove("is-valid", "is-invalid");
            return;
        }
        regexEmail.test(email.value)
            ? setValid(email)
            : setInvalid(email, "Email harus mengandung @ dan domain valid");
    });

    // NO WA
    noWA.addEventListener("input", () => {
        noWA.value = noWA.value.replace(/\D/g, "");
        regexWA.test(noWA.value)
            ? setValid(noWA)
            : setInvalid(noWA, "No WA harus diawali 0 dan 12 digit");
    });

    alamat.addEventListener("input", () => {
        const value = alamat.value.trim();

        // kosong → reset
        if (!value) {
            alamat.classList.remove("is-valid", "is-invalid");
            return;
        }

        // minimal panjang
        if (value.length < 10) {
            setInvalid(alamat, "Alamat minimal 10 karakter");
            return;
        }

        // tidak boleh hanya angka
        if (/^\d+$/.test(value)) {
            setInvalid(alamat, "Alamat tidak boleh hanya angka");
            return;
        }

        // karakter aman
        if (!regexAlamat.test(value)) {
            setInvalid(alamat, "Alamat mengandung karakter tidak valid");
            return;
        }

        setValid(alamat);
    });

    // PASSWORD
    password.addEventListener("input", () => {
        regexPassword.test(password.value)
            ? setValid(password)
            : setInvalid(password, "Min 6 karakter, ada huruf & angka");
    });

    // NAMA
    nama.addEventListener("input", () => {
        const value = nama.value.trim();

        // kosong → reset state
        if (!value) {
            nama.classList.remove("is-valid", "is-invalid");
            return;
        }

        // minimal 3 karakter
        if (value.length < 3) {
            setInvalid(nama, "Nama minimal 3 karakter");
            return;
        }

        // hanya huruf & spasi
        if (!regexNama.test(value)) {
            setInvalid(nama, "Nama hanya boleh huruf dan spasi");
            return;
        }

        // valid
        setValid(nama);
    });
}


/* ===========================
   VALIDASI FORM SEBELUM SUBMIT
=========================== */
function validateFormBeforeSubmit() {
    const email = document.getElementById("email");
    const noWA = document.getElementById("noWA");
    const password = document.getElementById("password");
    const nama = document.getElementById("nama");
    const jenisSampah = document.getElementById("jenisSampah");
    const alamat = document.getElementById("alamat");
    const lat = document.getElementById("latitude").value;
    const lng = document.getElementById("longitude").value;

    if (email.value && !regexEmail.test(email.value)) {
        setInvalid(email, "Format email tidak valid");
        return false;
    }

    if (noWA.value && !regexWA.test(noWA.value)) {
        setInvalid(noWA, "No WA harus diawali 0 dan 12 digit");
        return false;
    }

    if (!regexPassword.test(password.value)) {
        setInvalid(password, "Min 6 karakter, huruf & angka");
        return false;
    }

    if (!regexNama.test(nama.value)) {
        setInvalid(nama, "Nama hanya huruf dan spasi Min 2 karakter");
        return false;
    }

    if (alamat.value.trim().length < 10) {
        alamat.classList.add("is-invalid");
        return false;
    }

    // VALIDASI JENIS SAMPAH
    if (!jenisSampah.value) {
        setInvalid(jenisSampah, "Pilih jenis sampah");
        jenisSampah.focus();
        return false;
    }

    const validJenis = ['Rumah Tangga', 'Tempat Usaha'];
    if (!validJenis.includes(jenisSampah.value)) {
        setInvalid(jenisSampah, "Pilih jenis sampah yang valid");
        jenisSampah.focus();
        return false;
    }

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        alert("Lokasi GPS wajib dipilih");
        return false;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        alert("Koordinat GPS tidak valid");
        return false;
    }

    if (alamat.value.trim().length < 10) {
        setInvalid(alamat, "Alamat minimal 10 karakter");
        alamat.focus();
        return false;
    }

    if (/^\d+$/.test(alamat.value.trim())) {
        setInvalid(alamat, "Alamat tidak boleh hanya angka");
        alamat.focus();
        return false;
    }

    if (!regexAlamat.test(alamat.value.trim())) {
        setInvalid(alamat, "Alamat mengandung karakter tidak valid");
        alamat.focus();
        return false;
    }

    return true;
}


/* ===========================
   MAP + AUTO GPS
=========================== */
function initMapWithGPS() {
    const defaultLat = -10.1935921;
    const defaultLng = 123.6149376;

    initMapForm("mapForm", "latitude", "longitude", defaultLat, defaultLng, 14)
        .then(map => {
            mapInstance = map;

            // ❌ HAPUS BARIS INI - AUTO GPS saat load
            // setTimeout(() => {
            //     detectGPS(map);
            // }, 600);

            // tombol GPS manual
            const btnGPS = document.getElementById("btnGetGPS");
            if (btnGPS) {
                btnGPS.addEventListener("click", () => {
                    btnGPS.innerHTML =
                        `<span class="spinner-border spinner-border-sm me-2"></span>Mengambil GPS...`;
                    btnGPS.disabled = true;

                    detectGPS(map, () => {
                        btnGPS.innerHTML =
                            `<i class="bi bi-crosshair me-1"></i> Ambil Lokasi GPS`;
                        btnGPS.disabled = false;
                    });
                });
            }
        })
        .catch(err => console.error("Map error:", err));
}

function detectGPS(map, done = () => {}) {
    if (!navigator.geolocation) {
        alert("Browser tidak mendukung GPS");
        done();
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            // isi input
            document.getElementById("latitude").value = lat.toFixed(8);
            document.getElementById("longitude").value = lng.toFixed(8);

            // center map
            map.setView([lat, lng], 16);

            // hapus marker GPS lama
            if (gpsMarker) {
                map.removeLayer(gpsMarker);
            }

            // Icon GPS Biru
            const gpsIcon = L.icon({
                iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                iconSize: [38, 38],
                iconAnchor: [19, 38],
                popupAnchor: [0, -35]
            });

            // 🔵 marker GPS biru
            gpsMarker = L.marker([lat, lng], { icon: gpsIcon })
                .addTo(map)
                .bindPopup("📡 Lokasi GPS Anda")
                .openPopup();

            done();
        },
        (err) => {
            alert("Gagal mengambil GPS: " + err.message);
            done();
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}

/* ===========================
   SUBMIT FORM DENGAN ERROR HANDLING YANG BAIK
=========================== */
async function register(e) {
    e.preventDefault();

    // Validasi client-side sebelum submit
    if (!validateFormBeforeSubmit()) {
        return;
    }

    const btn = document.getElementById("regBtn");
    const msg = document.getElementById("registerMessage");
    const originalText = btn.innerHTML;

    try {
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Mendaftar...`;
        btn.disabled = true;

        // Clear previous messages
        msg.innerHTML = "";

        const tanggalStartObj = new Date();

        const tanggalEndObj = new Date(tanggalStartObj);
        tanggalEndObj.setMonth(tanggalEndObj.getMonth() + 1);

        const payload = {
            username: document.getElementById("username").value.trim(),
            password: document.getElementById("password").value,
            email: document.getElementById("email").value.trim(),
            nama: document.getElementById("nama").value.trim(),
            alamat: document.getElementById("alamat").value.trim(),
            noWA: document.getElementById("noWA").value.trim(),
            latitude: parseFloat(document.getElementById("latitude").value),
            longitude: parseFloat(document.getElementById("longitude").value),
            tanggalStart: formatTanggalIndonesia(tanggalStartObj),
            tanggalEnd: formatTanggalIndonesia(tanggalEndObj),
            status: "aktif",
            jenisSampah: document.getElementById("jenisSampah").value
        };

        const res = await fetch(API.registerAnggota, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            // CEK APAKAH ERROR USERNAME DUPLIKAT
            let isUsernameError = false;
            let usernameErrorMessage = "";
            
            if (data.username && Array.isArray(data.username)) {
                usernameErrorMessage = data.username[0];
                isUsernameError = true;
            } else if (typeof data === 'object') {
                // Cari error field pertama
                for (const [key, value] of Object.entries(data)) {
                    if (Array.isArray(value) && value.length > 0) {
                        if (key === 'username') {
                            usernameErrorMessage = value[0];
                            isUsernameError = true;
                        }
                        break;
                    }
                }
            }
            
            // JIKA ERROR USERNAME DUPLIKAT, TAMPILKAN SEBAGAI VALIDASI BUKAN ERROR
            if (isUsernameError) {
                // Highlight username field
                document.getElementById("username").classList.add("is-invalid");
                document.getElementById("usernameFeedback").innerHTML = 
                    `<small class="text-danger">❌ ${usernameErrorMessage}</small>`;
                
                // Fokus ke username field
                document.getElementById("username").focus();
                
                // Scroll ke username field
                document.getElementById("username").scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                
                // Tampilkan pesan info kecil (bukan error)
                msg.innerHTML = `
                    <div class="alert alert-info alert-dismissible fade show mt-3">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-info-circle me-2"></i>
                            <div>
                                <p class="mb-0">Silakan perbaiki username Anda dan coba lagi.</p>
                            </div>
                        </div>
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                `;
                
                // JANGAN THROW ERROR, return saja
                return;
            }
            
            // JIKA BUKAN ERROR USERNAME, TAMPILKAN ERROR GLOBAL
            let errorMessage = "Registrasi gagal";
            if (data.detail) {
                errorMessage = data.detail;
            }
            
            throw new Error(errorMessage);
            console.log(errorMessage)
        }

        alert("Registrasi Anggota Berhasil!");

        // SUCCESS
        msg.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show">
                <div class="d-flex align-items-center">
                    <i class="bi bi-check-circle-fill fs-4 me-3"></i>
                    <div>
                        <h5 class="alert-heading mb-1">Registrasi Berhasil 🎉</h5>
                        <p class="mb-2"><b>Username:</b> ${data.username}</p>
                        <p class="mb-0"><b>Status:</b> <span class="badge bg-success">Anggota Aktif</span></p>
                    </div>
                </div>
                <hr>
                <p class="mb-0">Anda akan dialihkan ke halaman login dalam 3 detik...</p>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        // Reset form
        document.getElementById("registerForm").reset();
        document.getElementById("username").classList.remove("is-valid", "is-invalid");
        document.getElementById("usernameFeedback").innerHTML = 
            `<small class="text-muted">Username minimal 3 karakter</small>`;

        // Redirect ke login
        setTimeout(() => {
            window.location.hash = "#/login";
        }, 3000);

    } catch (err) {
        // Ini hanya untuk error global (bukan username duplikat)
        msg.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show">
                <div class="d-flex align-items-center">
                    <div class="bg-danger bg-opacity-10 p-3 rounded-circle me-4">
                        <i class="bi bi-exclamation-triangle-fill text-danger fs-2"></i>
                    </div>
                    <div class="flex-grow-1">
                        <h5 class="alert-heading mb-2">Gagal Mendaftar!</h5>
                        <p class="mb-0">${err.message}</p>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        // Scroll ke error message
        msg.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function formatTanggalIndonesia(date) {
    // Format ISO untuk Django: YYYY-MM-DD
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;  // Contoh: "2026-01-09"
}
