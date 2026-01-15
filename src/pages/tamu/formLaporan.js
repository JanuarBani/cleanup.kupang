import { API, getAuthHeadersMultipart } from "../../api.js";
import { initMapForm } from "../../utils/mapConfig.js";
import { authGuard } from "../../utils/authGuard.js";
import { showModal, showConfirmModal } from "../../utils/modal.js";
import { showToast } from "../../utils/toast.js";

let locationFromGPS = false;
let gpsMarker = null;

/**
 * Tampilkan form laporan sampah di modal
 */
export async function showFormLaporan(user, container, onSuccess = null) {
    if (!user || !user.id) {
        showModal("Akses Ditolak", "User tidak valid. Silakan login ulang.");
        window.location.hash = "#/login";
        return;
    }

    const access = localStorage.getItem('access');
    if (!access) {
        showModal('Session Expired', `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; color: #ff9800; margin-bottom: 20px;">⚠️</div>
                <h3 style="color: #c62828; margin-bottom: 10px;">Session Expired</h3>
                <p style="color: #666; margin-bottom: 20px;">Silakan login kembali untuk melanjutkan.</p>
                <button onclick="window.location.hash='#/login'" 
                        style="background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                    Login Kembali
                </button>
            </div>
        `, null, null);
        return;
    }

    // Fetch user data
    let userFullName = user.username;
    try {
        const response = await fetch(`${API.users}${user.id}/`, {
            headers: {
                'Authorization': `Bearer ${access}`,
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            userFullName = userData.first_name || userData.username || user.username;
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }

    // HTML content
    // HTML content
    const formContent = `
        <div id="formLaporanModalContent">
            <div style="margin-bottom: 20px;">
                <p style="color: #666; margin-bottom: 20px;">
                    <i class="bi bi-info-circle" style="color: #2196F3; margin-right: 5px;"></i>
                    Laporkan lokasi sampah untuk membantu kebersihan Kota Kupang
                </p>
            </div>
            
            <!-- INFO JENIS LIMBAH -->
            <div class="alert alert-info mb-4" style="border-left: 4px solid #17a2b8;">
                <div class="d-flex align-items-start">
                    <i class="bi bi-info-circle-fill me-2" style="color: #17a2b8; font-size: 1.2rem;"></i>
                    <div>
                        <h6 class="alert-heading mb-2" style="color: #0c5460;">
                            <i class="bi bi-trash me-1"></i>Informasi Jenis Sampah
                        </h6>
                        <div class="row small g-2">
                            <div class="col-12 col-md-6">
                                <div class="d-flex align-items-center mb-1">
                                    <span class="badge bg-danger me-2" style="font-size: 0.7rem;">B3</span>
                                    <span><strong>Limbah B3 (Berbahaya & Beracun)</strong></span>
                                </div>
                                <p class="mb-2 ps-4" style="font-size: 0.85rem; color: #495057;">
                                    • Baterai, aki, elektronik rusak<br>
                                    • Sisa cat, oli, bahan kimia<br>
                                    • Obat kadaluarsa, pestisida
                                </p>
                            </div>
                            <div class="col-12 col-md-6">
                                <div class="d-flex align-items-center mb-1">
                                    <span class="badge bg-warning me-2" style="font-size: 0.7rem;">PLASTIK</span>
                                    <span><strong>Sampah Plastik</strong></span>
                                </div>
                                <p class="mb-2 ps-4" style="font-size: 0.85rem; color: #495057;">
                                    • Botol, kemasan plastik<br>
                                    • Kantong kresek, sedotan<br>
                                    • Peralatan plastik rusak
                                </p>
                            </div>
                            <div class="col-12 col-md-6">
                                <div class="d-flex align-items-center mb-1">
                                    <span class="badge bg-success me-2" style="font-size: 0.7rem;">ORGANIK</span>
                                    <span><strong>Sampah Organik</strong></span>
                                </div>
                                <p class="mb-2 ps-4" style="font-size: 0.85rem; color: #495057;">
                                    • Sisa makanan, sayuran<br>
                                    • Daun, ranting, rumput<br>
                                    • Kotoran hewan ternak
                                </p>
                            </div>
                            <div class="col-12 col-md-6">
                                <div class="d-flex align-items-center mb-1">
                                    <span class="badge bg-primary me-2" style="font-size: 0.7rem;">LOGAM</span>
                                    <span><strong>Sampah Logam</strong></span>
                                </div>
                                <p class="mb-2 ps-4" style="font-size: 0.85rem; color: #495057;">
                                    • Kaleng minuman, besi<br>
                                    • Peralatan rumah tangga<br>
                                    • Kawat, rangka besi
                                </p>
                            </div>
                            <div class="col-12 col-md-6">
                                <div class="d-flex align-items-center mb-1">
                                    <span class="badge bg-secondary me-2" style="font-size: 0.7rem;">KACA</span>
                                    <span><strong>Sampah Kaca</strong></span>
                                </div>
                                <p class="mb-2 ps-4" style="font-size: 0.85rem; color: #495057;">
                                    • Botol kaca, beling<br>
                                    • Kaca jendela/piring<br>
                                    • Lampu bohlam/neon
                                </p>
                            </div>
                            <div class="col-12 col-md-6">
                                <div class="d-flex align-items-center mb-1">
                                    <span class="badge bg-info me-2" style="font-size: 0.7rem;">KERTAS</span>
                                    <span><strong>Sampah Kertas</strong></span>
                                </div>
                                <p class="mb-2 ps-4" style="font-size: 0.85rem; color: #495057;">
                                    • Koran, kardus, karton<br>
                                    • Buku, majalah, dokumen<br>
                                    • Kemasan kertas
                                </p>
                            </div>
                        </div>
                        <hr class="my-2">
                        <p class="mb-0 small text-muted">
                            <i class="bi bi-lightbulb me-1"></i>
                            <strong>Tips:</strong> Sebutkan jenis sampah dalam deskripsi untuk membantu analisis dampak lingkungan
                        </p>
                    </div>
                </div>
            </div>
            
            <form id="formLaporan">
                <!-- Loading untuk peta -->
                <div id="mapLoading" class="text-center py-4" style="display: none;">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="text-muted mt-2">Menyiapkan peta...</p>
                </div>
                
                <!-- Nama dan Tanggal -->
                <div class="row g-3 mb-3">
                    <div class="col-md-6">
                        <label class="form-label fw-bold">
                            <i class="bi bi-person me-1"></i>Nama Pelapor
                        </label>
                        <input type="text" class="form-control" id="nama" value="${userFullName}" readonly>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold">
                            <i class="bi bi-calendar me-1"></i>Tanggal Laporan
                        </label>
                        <input type="text" class="form-control" id="tanggal" value="${new Date().toLocaleDateString('id-ID')}" readonly>
                    </div>
                </div>

                <!-- Alamat -->
                <div class="mb-3">
                    <label class="form-label fw-bold">
                        <i class="bi bi-house-door me-1"></i>Kelurahan Lokasi Sampah
                    </label>
                    <input type="text" class="form-control" id="alamat" 
                        placeholder="Contoh: Kelurahan Oebobo" required>
                </div>

                <!-- Deskripsi dengan contoh yang lebih jelas -->
                <div class="mb-3">
                    <label class="form-label fw-bold">
                        <i class="bi bi-chat-text me-1"></i>Deskripsi Sampah
                    </label>
                    <textarea class="form-control" id="deskripsi" rows="3"
                            placeholder="Contoh: 'Tumpukan sampah plastik (botol, kresek) di pinggir jalan, volume sekitar 1m³, dekat saluran air'
                            atau 'Limbah B3 (baterai bekas, aki) dibuang sembarangan di tanah kosong'
                            
                            Mohon sebutkan: 
                            1. Jenis sampah (plastik/organik/logam/kaca/B3/dll)
                            2. Perkiraan volume/banyaknya
                            3. Kondisi sekitar (berbau, mengganggu jalan, dll)" required></textarea>
                    <div class="form-text small">
                        <i class="bi bi-info-circle"></i> Sebutkan jenis sampah dengan jelas untuk membantu analisis dampak lingkungan
                    </div>
                </div>
                
                <!-- Peta -->
                <div class="mb-3">
                    <label class="form-label fw-bold">
                        <i class="bi bi-map me-1"></i>Lokasi di Peta
                    </label>
                    <div class="alert alert-info py-2 mb-2">
                        <small>
                            <i class="bi bi-info-circle me-1"></i>
                            Klik pada peta untuk menentukan lokasi sampah
                        </small>
                    </div>
                    <div id="mapForm" style="height: 250px; width: 100%; border-radius: 6px; border: 1px solid #ced4da;"></div>
                    <!-- Tombol GPS -->
                    <div class="mb-3">
                        <button type="button" id="btnGetLocation" class="btn btn-outline-primary w-100">
                            📍 Gunakan Lokasi Saya (GPS)
                        </button>
                        <small class="text-muted d-block mt-1">
                            Izinkan akses lokasi pada browser Anda
                        </small>
                    </div>
                </div>

                <!-- Koordinat -->
                <div class="row g-3 mb-3">
                    <div class="col-md-6">
                        <label class="form-label fw-bold">
                            <i class="bi bi-geo-alt me-1"></i>Latitude
                        </label>
                        <input type="number" step="0.00000001" class="form-control" id="latitude" 
                            placeholder="-10.1935921" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold">
                            <i class="bi bi-geo-alt me-1"></i>Longitude
                        </label>
                        <input type="number" step="0.00000001" class="form-control" id="longitude" 
                            placeholder="123.6149376" required>
                    </div>
                </div>

                <!-- Foto -->
                <div class="mb-4">
                    <label class="form-label fw-bold">
                        <i class="bi bi-camera me-1"></i>Foto Bukti
                    </label>
                    <input type="file" class="form-control" id="foto_bukti" accept="image/*" required>
                    <div class="form-text text-danger">
                        <i class="bi bi-exclamation-triangle me-1"></i>
                        Foto bukti <strong>wajib</strong> sebagai acuan validitas laporan
                    </div>
                    
                    <!-- Preview -->
                    <div id="previewContainer" class="mt-2" style="display: none;">
                        <div class="card">
                            <div class="card-body p-2">
                                <p class="small mb-1"><strong>Pratinjau:</strong></p>
                                <img id="imagePreview" class="img-fluid rounded" style="max-height: 150px;">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Status koordinat -->
                <div id="coordinatesAlert" class="alert alert-warning" style="display: none;">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <span id="coordinatesMessage">Silakan pilih lokasi di peta terlebih dahulu!</span>
                </div>

                <!-- Pesan -->
                <div id="formMessage" class="mt-3"></div>
            </form>
        </div>
    `;

    // Simpan callback onSuccess ke variabel global
    window.__onLaporanSuccess = onSuccess;

    // Tampilkan modal
    showModal('📝 Buat Laporan Sampah Baru', formContent, async () => {
        return await submitLaporan(user);
    }, () => {
        // Cleanup saat modal ditutup
        if (window.__formLaporanMap) {
            window.__formLaporanMap.remove();
            delete window.__formLaporanMap;
        }
        delete window.__onLaporanSuccess;
    });

    // Setelah modal ditampilkan, inisialisasi
    setTimeout(() => {
        // Set default values
        const defaultLat = -10.1935921;
        const defaultLng = 123.6149376;
        
        document.getElementById("latitude").value = defaultLat;
        document.getElementById("longitude").value = defaultLng;
        
        // Inisialisasi peta
        initMapForm("mapForm", "latitude", "longitude", defaultLat, defaultLng)
            .then((map) => {
                window.__formLaporanMap = map;

                // 🔑 FIX Leaflet di modal
                setTimeout(() => {
                    map.invalidateSize();
                }, 300);
            })
            .catch(err => {
                console.error("Gagal inisialisasi peta:", err);
            });

        // Ganti bagian ini di dalam showFormLaporan function
        const btnGetLocation = document.getElementById("btnGetLocation");

        if (btnGetLocation) {
            btnGetLocation.addEventListener("click", async () => {
                // 1️⃣ Cek dukungan Geolocation API
                if (!("geolocation" in navigator)) {
                    showMessageInModal("❌ Browser Anda tidak mendukung GPS", "error");
                    return;
                }

                // 2️⃣ UX: disable tombol saat proses
                btnGetLocation.disabled = true;
                btnGetLocation.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mencari lokasi...';

                // 3️⃣ Tampilkan feedback bahwa GPS sedang mencari
                showMessageInModal("🔍 Mencari sinyal GPS... Mohon tunggu", "info");

                try {
                    const position = await getCurrentPositionWithTimeout(15000); // Timeout 15 detik
                    
                    const { latitude, longitude, accuracy } = position.coords;

                    // 4️⃣ Validasi akurasi
                    let accuracyMessage = "";
                    if (accuracy > 100) {
                        accuracyMessage = `⚠️ Akurasi GPS rendah (±${Math.round(accuracy)} m).`;
                    }

                    // 5️⃣ Set ke input form
                    const latInput = document.getElementById("latitude");
                    const lngInput = document.getElementById("longitude");

                    if (latInput && lngInput) {
                        latInput.value = latitude.toFixed(7);
                        lngInput.value = longitude.toFixed(7);
                    }

                    // 6️⃣ Update peta Leaflet jika tersedia
                    if (window.__formLaporanMap) {
                        const map = window.__formLaporanMap;

                        map.setView([latitude, longitude], 17);

                        if (!gpsMarker) {
                            gpsMarker = L.marker([latitude, longitude], {
                                icon: L.divIcon({
                                    className: 'gps-marker',
                                    html: '<div style="background: #4CAF50; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>',
                                    iconSize: [20, 20],
                                    iconAnchor: [10, 10]
                                })
                            }).addTo(map);
                        } else {
                            gpsMarker.setLatLng([latitude, longitude]);
                        }

                        gpsMarker.bindPopup(`
                            <strong>📍 Lokasi Anda (GPS)</strong><br>
                            Lat: ${latitude.toFixed(6)}<br>
                            Lng: ${longitude.toFixed(6)}<br>
                            Akurasi: ±${Math.round(accuracy)} m
                        `).openPopup();

                        // 🔑 WAJIB DI MODAL
                        setTimeout(() => {
                            map.invalidateSize();
                        }, 200);
                    }

                    // 7️⃣ Feedback ke user
                    showMessageInModal(
                        `✅ Lokasi berhasil ditemukan<br>
                        <small>Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}<br>
                        ${accuracyMessage} ${accuracyMessage ? 'Coba pindah ke area terbuka.' : ''}</small>`,
                        "success"
                    );

                    // Flag lokasi dari GPS
                    window.locationFromGPS = true;

                } catch (error) {
                    let msg = "❌ Gagal mengambil lokasi";
                    let errorType = "error";

                    switch (error.code || error.name) {
                        case 1: // PERMISSION_DENIED
                        case 'PERMISSION_DENIED':
                            msg = `
                                ❌ Izin lokasi ditolak<br>
                                <small>Silakan:</small><br>
                                1. Klik ikon <strong>🔒</strong> di address bar<br>
                                2. Izinkan akses lokasi<br>
                                3. Coba lagi
                            `;
                            break;
                        case 2: // POSITION_UNAVAILABLE
                        case 'POSITION_UNAVAILABLE':
                            msg = "❌ GPS tidak tersedia. Pastikan GPS diaktifkan pada perangkat Anda.";
                            break;
                        case 3: // TIMEOUT
                        case 'TIMEOUT':
                            msg = `
                                ⏱️ Pencarian lokasi timeout<br>
                                <small>Tips:</small><br>
                                1. Buka jendela/keluar dari gedung<br>
                                2. Pastikan sinyal GPS aktif<br>
                                3. Coba aktifkan High Accuracy Mode<br>
                                4. Tunggu beberapa detik lalu coba lagi
                            `;
                            errorType = "warning";
                            break;
                        case 'TimeoutError':
                            msg = "⏱️ Pencarian terlalu lama. Pastikan Anda di area terbuka dengan sinyal GPS baik.";
                            errorType = "warning";
                            break;
                        default:
                            msg = `❌ Error: ${error.message || "Tidak diketahui"}`;
                    }

                    showMessageInModal(msg, errorType);
                    
                    // Jika timeout, tawarkan pilihan lain
                    if (error.code === 3 || error.name === 'TIMEOUT' || error.name === 'TimeoutError') {
                        setTimeout(() => {
                            showMessageInModal(
                                `💡 <strong>Alternatif:</strong> Anda bisa klik langsung di peta untuk menentukan lokasi`,
                                "info"
                            );
                        }, 3000);
                    }
                } finally {
                    // 8️⃣ Kembalikan tombol
                    btnGetLocation.disabled = false;
                    btnGetLocation.innerHTML = '<i class="bi bi-geo-alt me-1"></i>Gunakan Lokasi Saya (GPS)';
                }
            });
        } else {
            console.warn("Tombol btnGetLocation tidak ditemukan di DOM");
        }

        
        // Image preview
        document.getElementById("foto_bukti").onchange = function(e) {
            const file = e.target.files[0];
            const previewContainer = document.getElementById("previewContainer");
            const imagePreview = document.getElementById("imagePreview");
            
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    showMessageInModal("Ukuran file maksimal 5MB", "error");
                    e.target.value = '';
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    imagePreview.src = event.target.result;
                    previewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                previewContainer.style.display = 'none';
            }
        };

        // Update coordinates alert
        const latInput = document.getElementById("latitude");
        const lngInput = document.getElementById("longitude");
        
        const updateCoordinatesAlert = () => {
            const lat = latInput.value;
            const lng = lngInput.value;
            const alertDiv = document.getElementById("coordinatesAlert");
            const messageSpan = document.getElementById("coordinatesMessage");
            
            if (lat && lng) {
                alertDiv.className = "alert alert-success";
                alertDiv.style.display = 'block';
                messageSpan.innerHTML = `
                    <strong>Lokasi terpilih:</strong> ${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}
                `;
            } else {
                alertDiv.className = "alert alert-warning";
                alertDiv.style.display = 'block';
                messageSpan.textContent = "Silakan pilih lokasi di peta terlebih dahulu!";
            }
        };

        latInput.addEventListener('input', updateCoordinatesAlert);
        lngInput.addEventListener('input', updateCoordinatesAlert);
        updateCoordinatesAlert();
    }, 100);
}

/**
 * Helper function untuk getCurrentPosition dengan timeout yang lebih baik
 */
function getCurrentPositionWithTimeout(timeout = 10000) {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation tidak didukung'));
            return;
        }

        let timeoutId = null;
        let positionReceived = false;

        // Success callback
        const success = (position) => {
            if (positionReceived) return;
            positionReceived = true;
            
            if (timeoutId) clearTimeout(timeoutId);
            
            // Validasi data GPS
            if (!position.coords || 
                typeof position.coords.latitude !== 'number' || 
                typeof position.coords.longitude !== 'number') {
                reject(new Error('Data GPS tidak valid'));
                return;
            }
            
            resolve(position);
        };

        // Error callback
        const error = (error) => {
            if (positionReceived) return;
            positionReceived = true;
            
            if (timeoutId) clearTimeout(timeoutId);
            reject(error);
        };

        // Options untuk GPS
        const options = {
            enableHighAccuracy: true,
            timeout: timeout,
            maximumAge: 0 // Jangan gunakan cache
        };

        // Request GPS
        navigator.geolocation.getCurrentPosition(success, error, options);

        // Timeout tambahan
        timeoutId = setTimeout(() => {
            if (positionReceived) return;
            positionReceived = true;
            
            reject(new Error('TimeoutError'));
        }, timeout + 2000); // Tambah buffer 2 detik
    });
}

/**
 * Submit laporan sampah dari modal
 */
async function submitLaporan(user) {
    console.log("=== SUBMIT LAPORAN STARTED ===");
    
    const access = localStorage.getItem('access');
    if (!access) {
        showMessageInModal("Session expired. Silakan login kembali.", "error");
        setTimeout(() => window.location.hash = "#/login", 2000);
        return false;
    }
    
    // Hapus pesan error sebelumnya
    clearFormValidationMessages();
    
    // Validasi form per field
    const alamat = document.getElementById("alamat")?.value.trim();
    const latitude = document.getElementById("latitude")?.value;
    const longitude = document.getElementById("longitude")?.value;
    const deskripsi = document.getElementById("deskripsi")?.value.trim();
    const foto = document.getElementById("foto_bukti")?.files[0];
    
    console.log("Form values:", { alamat, latitude, longitude, deskripsi, foto });
    
    let isValid = true;
    
    // Validasi alamat
    if (!alamat) {
        showFieldError("alamat", "Alamat harus diisi");
        isValid = false;
    }
    
    // Validasi lokasi
    const hasLocation = latitude && longitude && !isNaN(latitude) && !isNaN(longitude);
    const hasValidLocation = hasLocation && 
                           latitude >= -90 && latitude <= 90 && 
                           longitude >= -180 && longitude <= 180;
    
    if (!hasLocation) {
        showFieldError("latitude", "Silakan tentukan lokasi di peta");
        isValid = false;
    } else if (!hasValidLocation) {
        showFieldError("latitude", "Koordinat tidak valid");
        isValid = false;
    }
    
    // Validasi deskripsi
    if (!deskripsi) {
        showFieldError("deskripsi", "Deskripsi harus diisi");
        isValid = false;
    } else if (deskripsi.length < 10) {
        showFieldError("deskripsi", "Deskripsi minimal 10 karakter");
        isValid = false;
    }

    // ✅ VALIDASI FOTO WAJIB
    if (!foto) {
        showFieldError("foto_bukti", "Foto bukti wajib diunggah sebagai acuan validitas laporan");
        isValid = false;
    } else {
        // Validasi ukuran file
        if (foto.size > 5 * 1024 * 1024) {
            showFieldError("foto_bukti", "Ukuran file maksimal 5MB");
            isValid = false;
        }
        // Validasi tipe file
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(foto.type)) {
            showFieldError("foto_bukti", "Format file harus JPG, JPEG, atau PNG");
            isValid = false;
        }
    }
    
    if (!isValid) {
        console.log("Validation failed");
        showGeneralMessage("Harap perbaiki field yang masih error", "error");
        return false;
    }
    
    console.log("Validation passed, preparing form data...");

    // Prepare FormData
    const formData = new FormData();
    formData.append("nama", document.getElementById("nama").value);
    formData.append("alamat", alamat);
    formData.append("latitude", parseFloat(latitude));
    formData.append("longitude", parseFloat(longitude));
    formData.append("deskripsi", deskripsi);
    formData.append("tanggal_lapor", new Date().toISOString().split("T")[0]);
    formData.append("idUser", parseInt(user.id));
    formData.append("status", "pending");
    formData.append("foto_bukti", foto);

    // PERBAIKAN: Cari tombol save dengan cara yang benar
    let submitBtn = null;
    
    // Cara 1: Cari tombol dengan ID yang mengandung 'saveModalBtn'
    const allButtons = document.querySelectorAll('button[id*="saveModalBtn"]');
    
    if (allButtons.length > 0) {
        submitBtn = allButtons[0];
    }
    
    // Cara 2: Jika tidak ditemukan, cari tombol dengan text 'Simpan' di modal footer
    if (!submitBtn) {
        const modalFooterButtons = document.querySelectorAll('.modal-footer button');
        modalFooterButtons.forEach(btn => {
            if (btn.textContent.includes('Simpan') && !submitBtn) {
                submitBtn = btn;
                console.log("Found button by text:", btn.textContent);
            }
        });
    }
    
    // Cara 3: Cari tombol primary di modal footer
    if (!submitBtn) {
        const primaryBtn = document.querySelector('.modal-footer .btn-primary');
        if (primaryBtn) {
            submitBtn = primaryBtn;
            console.log("Found primary button in modal footer");
        }
    }
    
    // Debug: tampilkan semua tombol di modal
    if (!submitBtn) {
        console.log("Debug - All buttons in modal:");
        const modal = document.querySelector('.modal.show');
        if (modal) {
            modal.querySelectorAll('button').forEach(btn => {
                console.log(`- Button: text="${btn.textContent}", id="${btn.id}", class="${btn.className}"`);
            });
        }
    }
    
    if (!submitBtn) {
        console.error("Tombol simpan TIDAK DITEMUKAN!");
        showGeneralMessage("System error: Tombol tidak ditemukan", "error");
        return false;
    }
    
    console.log("Submit button found:", submitBtn);
    
    const originalText = submitBtn.innerHTML;
    const originalDisabled = submitBtn.disabled;
    
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mengirim...';
    submitBtn.disabled = true;

    try {
        console.log("Sending request to:", API.laporanSampah);
        
        const response = await fetch(API.laporanSampah, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${access}`
            },
            body: formData
        });
        const responseText = await response.text();
        console.log("Response text (first 200 chars):", responseText.substring(0, 200));
        
        let data;
        try {
            data = JSON.parse(responseText);
            console.log("Parsed data:", data);
        } catch (e) {
            console.log("Response is not JSON");
            data = { message: responseText };
        }

        if (!response.ok) {
            let fieldErrors = {};
            let generalMessage = "Gagal mengirim laporan";
            
            if (data.detail) {
                generalMessage = data.detail;
            } else if (typeof data === 'object') {
                for (const [field, messages] of Object.entries(data)) {
                    if (Array.isArray(messages)) {
                        const fieldId = getFieldIdByName(field);
                        if (fieldId) {
                            fieldErrors[fieldId] = messages.join(', ');
                        } else {
                            generalMessage = `${field}: ${messages.join(', ')}`;
                        }
                    } else {
                        generalMessage = `${field}: ${messages}`;
                    }
                }
            }
            
            Object.keys(fieldErrors).forEach(fieldId => {
                showFieldError(fieldId, fieldErrors[fieldId]);
            });
            
            if (Object.keys(fieldErrors).length === 0) {
                showGeneralMessage(generalMessage, "error");
            }
            
            throw new Error(`HTTP ${response.status}: ${generalMessage}`);
        }

        // Success
        console.log("Submission successful!");
        alert("✅ Laporan berhasil dikirim!");
        showGeneralMessage("✅ Laporan berhasil dikirim!", "success");
        showToast("Laporan berhasil dikirim. Terima kasih atas partisipasi Anda!", "success");
        
        // Call success callback jika ada
        const onSuccess = window.__onLaporanSuccess;
        if (onSuccess && typeof onSuccess === 'function') {
            setTimeout(() => {
                try {
                    onSuccess();
                } catch (error) {
                    console.error("Error in success callback:", error);
                }
            }, 1500);
        }
        
        // Kembalikan tombol dan tutup modal setelah delay
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = originalDisabled;
            
            // Tutup modal setelah 2 detik agar user bisa lihat pesan sukses
            setTimeout(() => {
                // Cari modal aktif
                const activeModal = document.querySelector('.modal.show');
                if (activeModal) {
                    const modalInstance = bootstrap.Modal.getInstance(activeModal);
                    if (modalInstance) {
                        modalInstance.hide();
                    } else {
                        // Fallback: sembunyikan manual
                        activeModal.style.display = 'none';
                        document.body.classList.remove('modal-open');
                        const backdrop = document.querySelector('.modal-backdrop');
                        if (backdrop) backdrop.remove();
                    }
                }
            }, 2000);
        }, 1000);
        
        return true;

    } catch (error) {
        console.error("Error submitting report:", error);
        
        // Kembalikan tombol ke semula
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = originalDisabled;
        
        if (error.message.includes("401") || error.message.includes("Unauthorized")) {
            showGeneralMessage("Session expired. Silakan login kembali.", "error");
            localStorage.clear();
            setTimeout(() => window.location.hash = "#/login", 2000);
        } else if (!error.message.includes("Gagal mengirim laporan")) {
            showGeneralMessage(`❌ ${error.message}`, "error");
        }
        
        return false;
    } finally {
        console.log("=== SUBMIT LAPORAN FINISHED ===");
    }
}

// Helper functions untuk validasi form
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Tambahkan class error pada field
    field.classList.add('is-invalid');
    field.classList.remove('is-valid');
    
    // Hapus feedback sebelumnya jika ada
    const existingFeedback = field.parentNode.querySelector(`#${fieldId}-feedback`);
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    // Tambahkan feedback element
    const feedbackDiv = document.createElement('div');
    feedbackDiv.id = `${fieldId}-feedback`;
    feedbackDiv.className = 'invalid-feedback d-block';
    feedbackDiv.innerHTML = `
        <i class="bi bi-exclamation-circle me-1"></i>
        ${message}
    `;
    
    // Tempatkan setelah field
    field.parentNode.appendChild(feedbackDiv);
    
    // Scroll ke field yang error
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showFieldSuccess(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    field.classList.add('is-valid');
    field.classList.remove('is-invalid');
    
    const existingFeedback = field.parentNode.querySelector(`#${fieldId}-feedback`);
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    const feedbackDiv = document.createElement('div');
    feedbackDiv.id = `${fieldId}-feedback`;
    feedbackDiv.className = 'valid-feedback d-block';
    feedbackDiv.innerHTML = `
        <i class="bi bi-check-circle me-1"></i>
        ${message}
    `;
    
    field.parentNode.appendChild(feedbackDiv);
}

function clearFormValidationMessages() {
    // Hapus semua class validasi
    const form = document.getElementById("formLaporan"); // PERBAIKAN DI SINI
    if (!form) {
        console.warn("Form dengan ID 'formLaporan' tidak ditemukan");
        return;
    }
    
    // Hapus class validasi dari semua input dan textarea
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(field => {
        field.classList.remove('is-invalid', 'is-valid');
        
        // Hapus feedback message
        const feedbackId = `${field.id}-feedback`;
        const feedback = document.getElementById(feedbackId);
        if (feedback) {
            feedback.remove();
        }
        
        // Juga coba hapus dengan cara lain
        const invalidFeedback = field.parentNode.querySelector('.invalid-feedback');
        if (invalidFeedback) {
            invalidFeedback.remove();
        }
        const validFeedback = field.parentNode.querySelector('.valid-feedback');
        if (validFeedback) {
            validFeedback.remove();
        }
    });
    
    // Hapus pesan umum
    const generalMessage = document.getElementById('formGeneralMessage');
    if (generalMessage) {
        generalMessage.innerHTML = '';
        generalMessage.className = '';
    }
    
    // Juga hapus pesan di formMessage
    const formMessage = document.getElementById("formMessage");
    if (formMessage) {
        formMessage.innerHTML = '';
        formMessage.className = '';
    }
}

function showGeneralMessage(message, type = "info") {
    const messageDiv = document.getElementById('formGeneralMessage') || 
                      (() => {
                          const div = document.createElement('div');
                          div.id = 'formGeneralMessage';
                          const form = document.querySelector('#formLaporanModal form, #formLaporanForm');
                          if (form) {
                              form.insertBefore(div, form.firstChild);
                          }
                          return div;
                      })();
    
    messageDiv.innerHTML = "";
    messageDiv.className = `alert alert-${type === "error" ? "danger" : type === "success" ? "success" : "info"} alert-dismissible fade show mt-2`;
    messageDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi ${type === "error" ? "bi-exclamation-triangle" : type === "success" ? "bi-check-circle" : "bi-info-circle"} me-2"></i>
            <div>${message}</div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Auto-hide info messages
    if (type === "info") {
        setTimeout(() => {
            if (messageDiv.textContent.includes(message)) {
                messageDiv.innerHTML = "";
                messageDiv.className = "";
            }
        }, 5000);
    }
    
    // Scroll ke pesan
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getFieldIdByName(fieldName) {
    // Mapping nama field dari backend ke input id di frontend
    const fieldMap = {
        'nama': 'nama',
        'alamat': 'alamat',
        'latitude': 'latitude',
        'longitude': 'longitude',
        'deskripsi': 'deskripsi',
        'foto_bukti': 'foto_bukti',
        'idUser': 'idUser'
    };
    
    return fieldMap[fieldName] || fieldName.toLowerCase();
}

// Fungsi untuk real-time validation (bisa ditambahkan ke event listeners)
function setupFormRealTimeValidation() {
    const alamatField = document.getElementById("alamat");
    const deskripsiField = document.getElementById("deskripsi");
    const fotoField = document.getElementById("foto_bukti");
    
    if (alamatField) {
        alamatField.addEventListener('blur', function() {
            const value = this.value.trim();
            if (!value) {
                showFieldError('alamat', 'Alamat harus diisi');
            } else if (value.length < 10) {
                showFieldError('alamat', 'Alamat minimal 10 karakter');
            } else {
                showFieldSuccess('alamat', 'Alamat valid');
            }
        });
    }
    
    if (deskripsiField) {
        deskripsiField.addEventListener('blur', function() {
            const value = this.value.trim();
            if (!value) {
                showFieldError('deskripsi', 'Deskripsi harus diisi');
            } else if (value.length < 10) {
                showFieldError('deskripsi', 'Deskripsi minimal 10 karakter');
            } else {
                showFieldSuccess('deskripsi', 'Deskripsi valid');
            }
        });
    }
    
    if (fotoField) {
        fotoField.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validasi ukuran
                if (file.size > 5 * 1024 * 1024) {
                    showFieldError('foto_bukti', 'Ukuran file maksimal 5MB');
                    e.target.value = '';
                    return;
                }
                
                // Validasi tipe
                const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
                if (!validTypes.includes(file.type)) {
                    showFieldError('foto_bukti', 'Format file harus JPG, JPEG, atau PNG');
                    e.target.value = '';
                    return;
                }
                
                showFieldSuccess('foto_bukti', 'File valid');
            }
        });
    }
}

// Tambahkan event listener untuk form validation saat form dibuka
document.addEventListener('DOMContentLoaded', function() {
    const formModal = document.getElementById('formLaporanModal');
    if (formModal) {
        formModal.addEventListener('shown.bs.modal', function() {
            setTimeout(() => {
                setupFormRealTimeValidation();
            }, 500);
        });
    }
});

/**
 * Tampilkan pesan di dalam modal
 */
function showMessageInModal(message, type = "info") {
    const messageDiv = document.getElementById("formMessage");
    if (!messageDiv) return;
    
    messageDiv.innerHTML = "";
    messageDiv.className = `alert alert-${type === "error" ? "danger" : type === "success" ? "success" : "info"} mt-3`;
    messageDiv.innerHTML = `
        <div class="d-flex align-items-center">
            ${type === "error" ? "❌" : type === "success" ? "✅" : "ℹ️"}
            <span class="ms-2">${message}</span>
        </div>
    `;
    
    // Auto-hide info messages
    if (type === "info") {
        setTimeout(() => {
            if (messageDiv.textContent === message) {
                messageDiv.innerHTML = "";
                messageDiv.className = "";
            }
        }, 5000);
    }
}

/**
 * Fungsi helper untuk menampilkan konfirmasi
 */
export function confirmDeleteLaporan(id, onConfirm) {
    showConfirmModal(
        "Apakah Anda yakin ingin menghapus laporan ini?",
        async () => {
            try {
                const access = localStorage.getItem('access');
                const response = await fetch(`${API.laporanSampah}${id}/`, {
                    method: "DELETE",
                    headers: {
                        'Authorization': `Bearer ${access}`
                    }
                });
                
                if (response.ok) {
                    alert("✅ Laporan berhasil dihapus");
                    if (onConfirm) onConfirm();
                } else {
                    throw new Error("Gagal menghapus laporan");
                }
            } catch (error) {
                alert("❌ Gagal menghapus laporan: " + error.message);
            }
        }
    );
}