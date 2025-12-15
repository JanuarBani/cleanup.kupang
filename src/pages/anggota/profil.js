import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { authGuard } from "../../utils/authGuard.js";
import { loadLeaflet, initMapForm } from "../../utils/mapConfig.js";

// Variabel untuk map
let map = null;
let marker = null;

export async function profilPage() {
    const user = await authGuard();
    const main = document.getElementById("mainContent");

    if (!user) {
        alert("Silakan login terlebih dahulu!");
        window.location.hash = "#/login";
        return;
    }

    // Validate role
    if (user.role !== "anggota") {
        main.innerHTML = `
            <div class="alert alert-warning">
                <h3><i class="bi bi-exclamation-triangle me-2"></i>Akses Ditolak</h3>
                <p>Halaman ini hanya untuk anggota. Role Anda: <strong>${user.role}</strong></p>
                <button onclick="window.location.hash='#/dashboard'" class="btn btn-primary mt-2">
                    Kembali ke Dashboard
                </button>
            </div>
        `;
        return;
    }

    let anggotaData = {};
    let fullUserData = { ...user };

    try {
        console.log("📡 Fetching user data...");
        
        // Fetch user data
        const resUser = await fetch(`${API.users}${user.id}/`, { 
            headers: getAuthHeaders() 
        });
        
        if (resUser.ok) {
            fullUserData = await resUser.json();
            console.log("✅ User data fetched");
        } else {
            console.warn("⚠️ Failed to fetch user data");
        }

        // Fetch anggota data
        console.log("📡 Fetching anggota data...");
        const resAnggota = await fetch(`${API.anggota}?user=${user.id}`, { 
            headers: getAuthHeaders() 
        });
        
        if (resAnggota.ok) {
            const data = await resAnggota.json();
            console.log("📊 Anggota data:", data);
            
            if (Array.isArray(data)) {
                anggotaData = data.length ? data[0] : {};
            } else {
                anggotaData = data;
            }
        } else {
            console.warn("⚠️ Failed to fetch anggota data");
        }
    } catch (err) {
        console.error("❌ Error fetching data:", err);
    }

    // Render halaman
    renderProfilePage(user, fullUserData, anggotaData);
}

function renderProfilePage(user, userData, anggotaData) {
    const main = document.getElementById("mainContent");
    
    main.innerHTML = `
        <!-- Bootstrap CSS -->
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">
        
        <div class="container-fluid py-4">
            <!-- Header -->
            <div class="card border-success shadow-sm mb-4">
                <div class="card-body bg-success bg-opacity-10">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h1 class="text-success mb-1">
                                <i class="bi bi-person-circle me-2"></i>Profil Anggota
                            </h1>
                            <p class="text-muted mb-0">
                                ID: <strong>#${anggotaData.id ? anggotaData.id.toString().padStart(4, '0') : '-'}</strong> | 
                                ${anggotaData.nama || userData.first_name || user.username}
                            </p>
                        </div>
                        <span class="badge bg-success fs-6">
                            ${anggotaData.status || 'Anggota'}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <!-- Kolom Kiri - Info Pribadi -->
                <div class="col-lg-6">
                    <div class="card shadow-sm mb-4">
                        <div class="card-header bg-light">
                            <h5 class="mb-0">
                                <i class="bi bi-info-circle me-2"></i>Informasi Pribadi
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-borderless">
                                    <tbody>
                                        <tr>
                                            <th style="width: 40%; color: #666;">Username:</th>
                                            <td class="fw-bold">${user.username}</td>
                                        </tr>
                                        <tr>
                                            <th style="color: #666;">Nama Lengkap:</th>
                                            <td class="fw-bold">${anggotaData.nama || userData.first_name || '-'}</td>
                                        </tr>
                                        <tr>
                                            <th style="color: #666;">Email:</th>
                                            <td class="fw-bold">${userData.email || '-'}</td>
                                        </tr>
                                        <tr>
                                            <th style="color: #666;">No. WhatsApp:</th>
                                            <td class="fw-bold">${anggotaData.noWA || anggotaData.no_wa || '-'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Kolom Kanan - Info Keanggotaan -->
                <div class="col-lg-6">
                    <div class="card shadow-sm mb-4">
                        <div class="card-header bg-light">
                            <h5 class="mb-0">
                                <i class="bi bi-card-checklist me-2"></i>Informasi Keanggotaan
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-borderless">
                                    <tbody>
                                        <tr>
                                            <th style="width: 40%; color: #666;">Alamat:</th>
                                            <td class="fw-bold">${anggotaData.alamat || '-'}</td>
                                        </tr>
                                        <tr>
                                            <th style="color: #666;">Jenis Sampah:</th>
                                            <td class="fw-bold">${anggotaData.jenisSampah || anggotaData.jenis_sampah || '-'}</td>
                                        </tr>
                                        <tr>
                                            <th style="color: #666;">ID Anggota:</th>
                                            <td class="fw-bold">#${anggotaData.id ? anggotaData.id.toString().padStart(4, '0') : '-'}</td>
                                        </tr>
                                        <tr>
                                            <th style="color: #666;">Tanggal Bergabung:</th>
                                            <td class="fw-bold">${formatDate(anggotaData.tanggalStart || anggotaData.created_at)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Peta Lokasi -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-light">
                    <h5 class="mb-0">
                        <i class="bi bi-geo-alt me-2"></i>Lokasi Rumah
                    </h5>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">
                                <i class="bi bi-geo-alt-fill me-1"></i>Latitude
                            </label>
                            <div class="form-control bg-light">
                                ${anggotaData.latitude || 'Belum ditentukan'}
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">
                                <i class="bi bi-geo-alt-fill me-1"></i>Longitude
                            </label>
                            <div class="form-control bg-light">
                                ${anggotaData.longitude || 'Belum ditentukan'}
                            </div>
                        </div>
                    </div>
                    
                    <div id="mapContainer" style="height: 350px; border-radius: 8px; overflow: hidden; position: relative;">
                        <!-- Peta akan dimuat di sini -->
                        ${anggotaData.latitude && anggotaData.longitude ? 
                            '<div id="mapProfil" style="height: 100%;"></div>' : 
                            `
                            <div class="h-100 d-flex flex-column align-items-center justify-content-center bg-light">
                                <i class="bi bi-map display-1 text-muted mb-3"></i>
                                <h5 class="text-muted">Lokasi belum ditentukan</h5>
                                <p class="text-muted mb-3">Tambahkan lokasi saat mengedit profil</p>
                                <button onclick="document.getElementById('btnEditProfil').click()" 
                                        class="btn btn-primary btn-sm">
                                    <i class="bi bi-plus-circle me-1"></i>Tambah Lokasi
                                </button>
                            </div>
                            `
                        }
                    </div>
                </div>
            </div>
            
            <!-- Tombol Aksi -->
            <div class="card shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <button onclick="window.location.hash='#/dashboard-anggota'" 
                                class="btn btn-secondary">
                            <i class="bi bi-arrow-left me-1"></i>Kembali ke Dashboard
                        </button>
                        <div>
                            <button id="btnEditProfil" class="btn btn-success me-2">
                                <i class="bi bi-pencil-square me-1"></i>Edit Profil
                            </button>
                            <button id="btnRefresh" class="btn btn-outline-primary">
                                <i class="bi bi-arrow-clockwise me-1"></i>Refresh Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Event listeners
    document.getElementById("btnEditProfil").onclick = () => {
        showEditProfileForm(user, userData, anggotaData);
    };
    
    document.getElementById("btnRefresh").onclick = async () => {
        const btn = document.getElementById("btnRefresh");
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Memuat...';
        btn.disabled = true;
        
        await profilPage();
        
        btn.innerHTML = originalText;
        btn.disabled = false;
    };
    
    // Load peta jika ada koordinat
    if (anggotaData.latitude && anggotaData.longitude) {
        setTimeout(() => {
            loadMap(anggotaData);
        }, 500);
    }
}

// Fungsi untuk load map dengan error handling
async function loadMap(anggotaData) {
    try {
        // Load Leaflet
        await new Promise((resolve, reject) => {
            loadLeaflet(() => {
                resolve();
            });
        });
        
        // Tunggu container map tersedia
        await waitForElement("#mapProfil");
        
        // Inisialisasi map
        const mapContainer = document.getElementById("mapProfil");
        if (!mapContainer) {
            throw new Error("Map container not found");
        }
        
        // Clear any existing map
        if (map) {
            map.remove();
            map = null;
        }
        
        // Parse koordinat
        const lat = parseFloat(anggotaData.latitude) || -10.1935921;
        const lng = parseFloat(anggotaData.longitude) || 123.6149376;
        
        console.log(`📍 Initializing map at ${lat}, ${lng}`);
        
        // Buat map
        map = window.L.map("mapProfil").setView([lat, lng], 15);
        
        // Tambahkan tile layer
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);
        
        // Tambahkan marker
        marker = window.L.marker([lat, lng]).addTo(map);
        
        // Tambahkan popup
        const popupContent = `
            <div style="text-align: center;">
                <strong>${anggotaData.nama || 'Anggota'}</strong><br>
                <small>${anggotaData.alamat || ''}</small><br>
                <small class="text-muted">${lat.toFixed(6)}, ${lng.toFixed(6)}</small>
            </div>
        `;
        
        marker.bindPopup(popupContent).openPopup();
        
        console.log("✅ Map loaded successfully");
        
    } catch (error) {
        console.error("❌ Error loading map:", error);
        
        // Fallback jika map gagal
        document.getElementById("mapContainer").innerHTML = `
            <div class="alert alert-warning h-100 d-flex align-items-center justify-content-center">
                <div class="text-center">
                    <i class="bi bi-exclamation-triangle display-4 text-warning mb-3"></i>
                    <h5>Peta tidak dapat dimuat</h5>
                    <p class="text-muted">Koordinat: ${anggotaData.latitude}, ${anggotaData.longitude}</p>
                    <button onclick="loadMap(${JSON.stringify(anggotaData)})" class="btn btn-warning btn-sm mt-2">
                        <i class="bi bi-arrow-clockwise me-1"></i>Coba Lagi
                    </button>
                </div>
            </div>
        `;
    }
}

// Helper untuk menunggu element tersedia
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const checkElement = () => {
            const element = document.querySelector(selector);
            
            if (element) {
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Element ${selector} not found after ${timeout}ms`));
            } else {
                setTimeout(checkElement, 100);
            }
        };
        
        checkElement();
    });
}

// Form edit profil
function showEditProfileForm(user, userData, anggotaData) {
    const main = document.getElementById("mainContent");
    
    main.innerHTML = `
        <div class="container-fluid py-4">
            <!-- Header -->
            <div class="card border-primary shadow-sm mb-4">
                <div class="card-body bg-primary bg-opacity-10">
                    <h1 class="text-primary mb-1">
                        <i class="bi bi-pencil-square me-2"></i>Edit Profil Anggota
                    </h1>
                    <p class="text-muted mb-0">Perbarui informasi profil Anda</p>
                </div>
            </div>
            
            <form id="formEditProfil">
                <div class="row">
                    <!-- Kolom Kiri - Data Pribadi -->
                    <div class="col-lg-6">
                        <div class="card shadow-sm mb-4">
                            <div class="card-header">
                                <h5 class="mb-0">
                                    <i class="bi bi-person-lines-fill me-2"></i>Data Pribadi
                                </h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label class="form-label">
                                        <i class="bi bi-person me-1"></i>Nama Lengkap *
                                    </label>
                                    <input type="text" id="editNama" class="form-control" 
                                           value="${anggotaData.nama || userData.first_name || ''}" 
                                           required>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">
                                        <i class="bi bi-envelope me-1"></i>Email *
                                    </label>
                                    <input type="email" id="editEmail" class="form-control" 
                                           value="${userData.email || ''}" 
                                           required>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">
                                        <i class="bi bi-house me-1"></i>Alamat Lengkap *
                                    </label>
                                    <textarea id="editAlamat" class="form-control" rows="3" required>${anggotaData.alamat || ''}</textarea>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">
                                        <i class="bi bi-whatsapp me-1"></i>Nomor WhatsApp *
                                    </label>
                                    <input type="tel" id="editNoWA" class="form-control" 
                                           value="${anggotaData.noWA || anggotaData.no_wa || ''}" 
                                           required>
                                    <small class="text-muted">Contoh: 081234567890</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Kolom Kanan - Lokasi -->
                    <div class="col-lg-6">
                        <div class="card shadow-sm mb-4">
                            <div class="card-header">
                                <h5 class="mb-0">
                                    <i class="bi bi-geo-alt me-2"></i>Lokasi Rumah
                                </h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label class="form-label d-block">
                                        <i class="bi bi-map me-1"></i>Pilih Lokasi di Peta
                                    </label>
                                    <div id="mapEditContainer" style="height: 250px; border-radius: 6px; border: 1px solid #ddd; position: relative;">
                                        <div id="mapEdit" style="height: 100%;"></div>
                                    </div>
                                    <small class="text-muted mt-2 d-block">
                                        <i class="bi bi-info-circle me-1"></i>
                                        Klik pada peta untuk memilih lokasi
                                    </small>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">
                                            <i class="bi bi-geo-alt-fill me-1"></i>Latitude *
                                        </label>
                                        <input type="number" step="0.000001" id="editLatitude" 
                                               class="form-control" 
                                               value="${anggotaData.latitude || -10.1935921}" 
                                               required>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">
                                            <i class="bi bi-geo-alt-fill me-1"></i>Longitude *
                                        </label>
                                        <input type="number" step="0.000001" id="editLongitude" 
                                               class="form-control" 
                                               value="${anggotaData.longitude || 123.6149376}" 
                                               required>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">
                                        <i class="bi bi-trash me-1"></i>Jenis Sampah
                                    </label>
                                    <select id="editJenisSampah" class="form-select">
                                        <option value="Rumah Tangga" ${(anggotaData.jenisSampah === 'Rumah Tangga' || anggotaData.jenis_sampah === 'Rumah Tangga') ? 'selected' : ''}>
                                            Rumah Tangga
                                        </option>
                                        <option value="Tempat Usaha" ${(anggotaData.jenisSampah === 'Tempat Usaha' || anggotaData.jenis_sampah === 'Tempat Usaha') ? 'selected' : ''}>
                                            Tempat Usaha
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Tombol Aksi -->
                <div class="card shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <button type="button" id="btnCancel" class="btn btn-secondary">
                                <i class="bi bi-x-circle me-1"></i>Batal
                            </button>
                            <div>
                                <button type="button" id="btnReset" class="btn btn-outline-warning me-2">
                                    <i class="bi bi-arrow-clockwise me-1"></i>Reset
                                </button>
                                <button type="submit" id="btnSave" class="btn btn-success">
                                    <i class="bi bi-save me-1"></i>Simpan Perubahan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="formMessage" class="mt-3"></div>
            </form>
        </div>
    `;
    
    // Setup event listeners
    document.getElementById("btnCancel").onclick = () => {
        profilPage();
    };
    
    document.getElementById("btnReset").onclick = () => {
        if (confirm("Reset semua perubahan?")) {
            document.getElementById("editNama").value = anggotaData.nama || userData.first_name || '';
            document.getElementById("editEmail").value = userData.email || '';
            document.getElementById("editAlamat").value = anggotaData.alamat || '';
            document.getElementById("editNoWA").value = anggotaData.noWA || anggotaData.no_wa || '';
            document.getElementById("editLatitude").value = anggotaData.latitude || -10.1935921;
            document.getElementById("editLongitude").value = anggotaData.longitude || 123.6149376;
            document.getElementById("editJenisSampah").value = anggotaData.jenisSampah || anggotaData.jenis_sampah || 'Rumah Tangga';
        }
    };
    
    document.getElementById("formEditProfil").onsubmit = async (e) => {
        e.preventDefault();
        await handleEditProfile(user, userData, anggotaData);
    };
    
    // Load map untuk edit form
    setTimeout(() => {
        loadEditMap(anggotaData);
    }, 500);
}

// Load map untuk edit form
async function loadEditMap(anggotaData) {
    try {
        // Load Leaflet
        await new Promise((resolve, reject) => {
            loadLeaflet(() => {
                resolve();
            });
        });
        
        // Tunggu container map tersedia
        await waitForElement("#mapEdit");
        
        // Parse koordinat
        const defaultLat = parseFloat(anggotaData.latitude) || -10.1935921;
        const defaultLng = parseFloat(anggotaData.longitude) || 123.6149376;
        
        // Buat map
        const editMap = window.L.map("mapEdit").setView([defaultLat, defaultLng], 13);
        
        // Tambahkan tile layer
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(editMap);
        
        // Tambahkan marker awal
        const editMarker = window.L.marker([defaultLat, defaultLng], {
            draggable: true
        }).addTo(editMap);
        
        // Event untuk klik map
        editMap.on("click", (e) => {
            const { lat, lng } = e.latlng;
            
            // Update input fields
            document.getElementById("editLatitude").value = lat.toFixed(6);
            document.getElementById("editLongitude").value = lng.toFixed(6);
            
            // Update marker position
            editMarker.setLatLng([lat, lng]);
            
            // Tampilkan popup
            editMarker.bindPopup(`📍 Lokasi: ${lat.toFixed(6)}, ${lng.toFixed(6)}`).openPopup();
        });
        
        // Event untuk drag marker
        editMarker.on("dragend", (e) => {
            const position = editMarker.getLatLng();
            
            // Update input fields
            document.getElementById("editLatitude").value = position.lat.toFixed(6);
            document.getElementById("editLongitude").value = position.lng.toFixed(6);
            
            // Tampilkan popup
            editMarker.bindPopup(`📍 Lokasi: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`).openPopup();
        });
        
        // Event untuk update marker saat input berubah
        document.getElementById("editLatitude").addEventListener("input", updateMarkerPosition);
        document.getElementById("editLongitude").addEventListener("input", updateMarkerPosition);
        
        function updateMarkerPosition() {
            const lat = parseFloat(document.getElementById("editLatitude").value) || defaultLat;
            const lng = parseFloat(document.getElementById("editLongitude").value) || defaultLng;
            
            editMarker.setLatLng([lat, lng]);
            editMap.setView([lat, lng]);
        }
        
        console.log("✅ Edit map loaded successfully");
        
    } catch (error) {
        console.error("❌ Error loading edit map:", error);
        
        // Fallback jika map gagal
        document.getElementById("mapEditContainer").innerHTML = `
            <div class="alert alert-warning h-100 d-flex align-items-center justify-content-center">
                <div class="text-center">
                    <i class="bi bi-exclamation-triangle display-4 text-warning mb-3"></i>
                    <h5>Peta tidak dapat dimuat</h5>
                    <p class="text-muted">Gunakan input manual untuk koordinat</p>
                </div>
            </div>
        `;
    }
}

// Handle edit profile
async function handleEditProfile(user, userData, anggotaData) {
    const btnSave = document.getElementById("btnSave");
    const formMessage = document.getElementById("formMessage");
    
    // Validasi form
    const nama = document.getElementById("editNama").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const alamat = document.getElementById("editAlamat").value.trim();
    const noWA = document.getElementById("editNoWA").value.trim();
    const latitude = parseFloat(document.getElementById("editLatitude").value);
    const longitude = parseFloat(document.getElementById("editLongitude").value);
    const jenisSampah = document.getElementById("editJenisSampah").value;
    
    if (!nama || !email || !alamat || !noWA) {
        showMessage("Harap lengkapi semua field yang wajib diisi", "error", formMessage);
        return;
    }
    
    if (!/^[0-9]{10,15}$/.test(noWA.replace(/\D/g, ''))) {
        showMessage("Nomor WhatsApp harus 10-15 digit angka", "error", formMessage);
        return;
    }
    
    const payloadUser = { email: email };
    const payloadAnggota = {
        user: user.id,
        nama: nama,
        alamat: alamat,
        noWA: noWA,
        latitude: isNaN(latitude) ? null : latitude,
        longitude: isNaN(longitude) ? null : longitude,
        jenisSampah: jenisSampah
    };
    
    // Cari ID anggota
    let anggotaId = null;
    if (anggotaData) {
        if (anggotaData.idAnggota) {
            anggotaId = anggotaData.idAnggota;
        } else if (anggotaData.id) {
            anggotaId = anggotaData.id;
        }
    }
    
    console.log("Anggota ID:", anggotaId);
    
    // Show loading
    btnSave.disabled = true;
    btnSave.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
    showMessage("Menyimpan perubahan...", "info", formMessage);
    
    try {
        // Update user data
        console.log("Updating user data...");
        const userResponse = await fetch(`${API.users}${user.id}/`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(payloadUser)
        });
        
        if (!userResponse.ok) {
            throw new Error(`Gagal update user: ${userResponse.status}`);
        }
        
        console.log("User updated successfully");
        
        // Update atau create anggota data
        let anggotaResponse;
        
        if (anggotaId) {
            // Update existing
            console.log(`Updating existing anggota: ${anggotaId}`);
            anggotaResponse = await fetch(`${API.anggota}${anggotaId}/`, {
                method: "PATCH",
                headers: getAuthHeaders(),
                body: JSON.stringify(payloadAnggota)
            });
        } else {
            // Create new
            console.log("Creating new anggota");
            anggotaResponse = await fetch(API.anggota, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(payloadAnggota)
            });
        }
        
        if (!anggotaResponse.ok) {
            throw new Error(`Gagal update anggota: ${anggotaResponse.status}`);
        }
        
        console.log("Anggota updated successfully");
        
        // Update localStorage
        try {
            // Update user
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            currentUser.email = email;
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            // Update anggota
            const updatedAnggota = await anggotaResponse.json();
            localStorage.setItem('anggota', JSON.stringify(updatedAnggota));
            
            console.log("LocalStorage updated");
        } catch (storageError) {
            console.warn("Failed to update localStorage:", storageError);
        }
        
        // Show success message
        showMessage(`
            <div class="text-center">
                <i class="bi bi-check-circle display-4 text-success mb-3"></i>
                <h5>Profil Berhasil Diperbarui!</h5>
                <p class="text-muted">Halaman akan dimuat ulang...</p>
            </div>
        `, "success", formMessage);
        
        btnSave.innerHTML = '<i class="bi bi-check-circle me-1"></i>Berhasil!';
        btnSave.style.backgroundColor = "#10b981";
        
        // Refresh page after 2 seconds
        setTimeout(() => {
            profilPage();
        }, 2000);
        
    } catch (error) {
        console.error("Update error:", error);
        
        let errorMsg = "Gagal memperbarui profil";
        if (error.message.includes("401") || error.message.includes("403")) {
            errorMsg = "Akses ditolak. Silakan login ulang.";
        } else if (error.message.includes("404")) {
            errorMsg = "Data tidak ditemukan.";
        }
        
        showMessage(`
            <div class="text-center">
                <i class="bi bi-exclamation-triangle display-4 text-danger mb-3"></i>
                <h5>${errorMsg}</h5>
                <p class="text-muted">${error.message.substring(0, 200)}</p>
            </div>
        `, "danger", formMessage);
        
        // Enable button kembali
        btnSave.disabled = false;
        btnSave.innerHTML = '<i class="bi bi-save me-1"></i>Simpan Perubahan';
        btnSave.style.backgroundColor = "";
    }
}

// Helper functions
function showMessage(message, type = "info", element) {
    if (!element) return;
    
    element.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show">
            <div>${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // Auto dismiss setelah 5 detik
    setTimeout(() => {
        const alert = element.querySelector('.alert');
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch {
        return dateString;
    }
}