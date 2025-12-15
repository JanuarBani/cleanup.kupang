import { API, getAuthHeadersMultipart } from "../../api.js";
import { initMapForm } from "../../utils/mapConfig.js";
import { authGuard } from "../../utils/authGuard.js";
import { showModal, showConfirmModal } from "../../utils/modal.js"; // Import modal functions

/**
 * Tampilkan form laporan sampah di modal
 * @param {object} user - User yang sedang login
 * @param {HTMLElement} container - Elemen container untuk form (tidak digunakan dalam modal)
 * @param {function} onSuccess - Callback ketika laporan berhasil disimpan
 */
export async function showFormLaporan(user, container, onSuccess = null) {
    // PERTAMA: Verifikasi access sebelum melanjutkan
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

    // Fetch user data lengkap untuk mendapatkan nama asli
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

    // HTML content untuk modal
    const formContent = `
        <div id="formLaporanModalContent">
            <div style="margin-bottom: 20px;">
                <p style="color: #666; margin-bottom: 20px;">
                    <i class="bi bi-info-circle" style="color: #2196F3; margin-right: 5px;"></i>
                    Laporkan lokasi sampah untuk membantu kebersihan Kota Kupang
                </p>
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
                        <i class="bi bi-house-door me-1"></i>Alamat Lokasi Sampah
                    </label>
                    <input type="text" class="form-control" id="alamat" 
                           placeholder="Contoh: Jl. Sudirman No. 10, Kelurahan Oebobo" required>
                </div>

                <!-- Deskripsi -->
                <div class="mb-3">
                    <label class="form-label fw-bold">
                        <i class="bi bi-chat-text me-1"></i>Deskripsi Sampah
                    </label>
                    <textarea class="form-control" id="deskripsi" rows="3"
                              placeholder="Jelaskan kondisi sampah (jenis, volume, kondisi sekitar)" required></textarea>
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
                        <i class="bi bi-camera me-1"></i>Foto Bukti (Opsional)
                    </label>
                    <input type="file" class="form-control" id="foto_bukti" accept="image/*">
                    <div class="form-text">
                        Maksimal 5MB. Format: JPG, PNG, JPEG. Gunakan untuk dokumentasi visual.
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

    // Tampilkan modal dengan form
    showModal('📝 Buat Laporan Sampah Baru', formContent, async () => {
        // Fungsi ketika tombol Simpan ditekan
        return await submitLaporan(user, onSuccess);
    }, () => {
        // Fungsi ketika modal ditutup
        console.log('Modal laporan ditutup');
    });

    // Setelah modal ditampilkan, inisialisasi peta dan event listeners
    setTimeout(() => {
        // Inisialisasi peta
        const defaultLat = -10.1935921;
        const defaultLng = 123.6149376;
        
        // Set default values untuk input koordinat
        document.getElementById("latitude").value = defaultLat;
        document.getElementById("longitude").value = defaultLng;
        
        // Inisialisasi peta di modal
        initMapForm("mapForm", "latitude", "longitude", defaultLat, defaultLng);
        
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

        // Update coordinates alert ketika peta diklik
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

        // Event listeners untuk input koordinat
        latInput.addEventListener('input', updateCoordinatesAlert);
        lngInput.addEventListener('input', updateCoordinatesAlert);
        
        // Initial update
        updateCoordinatesAlert();
    }, 100);
}

/**
 * Submit laporan sampah dari modal
 */
async function submitLaporan(user, onSuccess = null) {
    // Validasi access
    const access = localStorage.getItem('access');
    if (!access) {
        showMessageInModal("Session expired. Silakan login kembali.", "error");
        setTimeout(() => window.location.hash = "#/login", 2000);
        return false;
    }
    
    // Validasi form
    const alamat = document.getElementById("alamat").value.trim();
    const latitude = document.getElementById("latitude").value;
    const longitude = document.getElementById("longitude").value;
    const deskripsi = document.getElementById("deskripsi").value.trim();
    
    if (!alamat || !latitude || !longitude || !deskripsi) {
        showMessageInModal("Harap lengkapi semua field yang wajib diisi", "error");
        return false;
    }
    
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        showMessageInModal("Koordinat tidak valid", "error");
        return false;
    }

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

    const foto = document.getElementById("foto_bukti").files[0];
    if (foto) {
        formData.append("foto_bukti", foto);
    }

    // Tampilkan loading di modal
    const submitBtn = document.querySelector('#saveBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mengirim...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(API.laporanSampah, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${access}`
            },
            body: formData
        });

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            data = { message: responseText };
        }

        if (!response.ok) {
            let errorMessage = "Gagal mengirim laporan";
            if (data.detail) {
                errorMessage = data.detail;
            } else if (typeof data === 'object') {
                const errors = [];
                for (const [field, messages] of Object.entries(data)) {
                    if (Array.isArray(messages)) {
                        errors.push(`${field}: ${messages.join(', ')}`);
                    } else {
                        errors.push(`${field}: ${messages}`);
                    }
                }
                if (errors.length > 0) {
                    errorMessage = errors.join('; ');
                }
            }
            throw new Error(`HTTP ${response.status}: ${errorMessage}`);
        }

        // Success
        showMessageInModal("✅ Laporan berhasil dikirim!", "success");
        
        // Call success callback jika ada
        if (onSuccess && typeof onSuccess === 'function') {
            onSuccess();
        }
        
        return true;

    } catch (error) {
        console.error("Error submitting report:", error);
        
        if (error.message.includes("401") || error.message.includes("Unauthorized")) {
            showMessageInModal("Session expired. Silakan login kembali.", "error");
            localStorage.clear();
            setTimeout(() => window.location.hash = "#/login", 2000);
        } else {
            showMessageInModal(`❌ ${error.message}`, "error");
        }
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return false;
    }
}

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