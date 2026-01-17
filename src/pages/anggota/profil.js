import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { authGuard } from "../../utils/authGuard.js";
import { loadLeaflet, initMapForm } from "../../utils/mapConfig.js";
import { showToast } from '../../utils/toast.js';

// Variabel untuk map
let map = null;
let marker = null;

// Variabel global untuk map edit
let editMap = null;
let editMarker = null;
let editGPSMarker = null;

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
            <div class="alert alert-warning shadow-sm">
                <div class="d-flex align-items-center">
                    <i class="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                    <div>
                        <h5 class="alert-heading mb-1">Akses Ditolak</h5>
                        <p class="mb-0">Halaman ini hanya untuk anggota. Role Anda: <strong>${user.role}</strong></p>
                    </div>
                </div>
                <div class="mt-3">
                    <button onclick="window.location.hash='#/dashboard'" class="btn btn-outline-warning btn-sm">
                        <i class="bi bi-arrow-left me-1"></i>Kembali ke Dashboard
                    </button>
                </div>
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
        
        <div class="container-fluid px-2 px-md-3 py-3">
            <!-- Header Profil -->
            <div class="bg-success bg-gradient text-white rounded-3 shadow-sm mb-3 p-3">
                <div class="row align-items-center">
                    <div class="col-8 col-md-9">
                        <div class="d-flex align-items-center">
                            <div class="bg-white text-success rounded-2 p-2 me-2">
                                <i class="bi bi-person-fill fs-2"></i>
                            </div>
                            <div>
                                <h1 class="h5 fw-bold mb-1">Profil Anggota</h1>
                                <div class="d-flex flex-wrap align-items-center gap-1">
                                    <span class="fs-6 fw-medium">${anggotaData.nama || userData.first_name || user.username}</span>
                                    <span class="badge bg-white text-success">${anggotaData.status || 'Anggota'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-4 col-md-3 text-end">
                        <div class="badge bg-white bg-opacity-25 text-white p-1 px-2 mb-1">
                            <i class="bi bi-calendar3 me-1"></i>
                            ${formatDate(anggotaData.tanggalStart || anggotaData.created_at)}
                        </div>
                        ${anggotaData.tanggalEnd ? `
                            <div class="badge ${getDateStatusBadge(anggotaData.tanggalEnd)} bg-opacity-25 p-1 px-2">
                                <i class="bi bi-calendar-x me-1"></i>
                                ${formatDate(anggotaData.tanggalEnd)}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Statistik Ringkas -->
            <div class="row g-2 mb-3">
                <div class="col-6 col-md-3">
                    <div class="card border-success h-100 shadow-sm">
                        <div class="card-body p-2">
                            <div class="d-flex align-items-center">
                                <div class="me-2">
                                    <i class="bi bi-check-circle-fill text-success fs-4"></i>
                                </div>
                                <div>
                                    <small class="text-muted d-block">Status</small>
                                    <h6 class="mb-0 fw-bold text-success">${anggotaData.status || 'Aktif'}</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card border-primary h-100 shadow-sm">
                        <div class="card-body p-2">
                            <div class="d-flex align-items-center">
                                <div class="me-2">
                                    <i class="bi bi-trash-fill text-primary fs-4"></i>
                                </div>
                                <div>
                                    <small class="text-muted d-block">Jenis Sampah</small>
                                    <h6 class="mb-0 fw-bold text-primary">${anggotaData.jenisSampah || anggotaData.jenis_sampah || '-'}</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card border-info h-100 shadow-sm">
                        <div class="card-body p-2">
                            <div class="d-flex align-items-center">
                                <div class="me-2">
                                    <i class="bi bi-clock-history text-info fs-4"></i>
                                </div>
                                <div>
                                    <small class="text-muted d-block">Bergabung</small>
                                    <h6 class="mb-0 fw-bold text-info">${formatDate(anggotaData.tanggalStart || anggotaData.created_at)}</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card border-warning h-100 shadow-sm">
                        <div class="card-body p-2">
                            <div class="d-flex align-items-center">
                                <div class="me-2">
                                    <i class="bi bi-whatsapp text-warning fs-4"></i>
                                </div>
                                <div>
                                    <small class="text-muted d-block">WhatsApp</small>
                                    <h6 class="mb-0 fw-bold text-warning">
                                        ${anggotaData.noWA || anggotaData.no_wa ? 'Tersedia' : '-'}
                                    </h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Informasi Detail -->
            <div class="row g-3">
                <!-- Kolom Kiri - Info Pribadi -->
                <div class="col-lg-6">
                    <div class="card shadow-sm h-100">
                        <div class="card-header bg-light py-2">
                            <h5 class="mb-0 fw-bold fs-6">
                                <i class="bi bi-person-lines-fill text-success me-2"></i>Informasi Pribadi
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row g-2 mb-2">
                                <div class="col-md-6">
                                    <div class="bg-light rounded-2 p-2">
                                        <small class="text-muted d-block mb-1">
                                            <i class="bi bi-person-badge me-1"></i>Username
                                        </small>
                                        <div class="fw-bold font-monospace">${user.username}</div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="bg-light rounded-2 p-2">
                                        <small class="text-muted d-block mb-1">
                                            <i class="bi bi-envelope me-1"></i>Email
                                        </small>
                                        <div class="fw-bold">${userData.email || '-'}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label fw-bold text-muted mb-1">
                                    <i class="bi bi-person-vcard me-2"></i>Nama Lengkap
                                </label>
                                <div class="bg-light rounded-2 p-2">
                                    <h6 class="mb-0 fw-bold">${anggotaData.nama || userData.first_name || '-'}</h6>
                                </div>
                            </div>
                            
                            <div class="mb-2">
                                <label class="form-label fw-bold text-muted mb-1">
                                    <i class="bi bi-whatsapp me-2"></i>Nomor WhatsApp
                                </label>
                                <div class="bg-light rounded-2 p-2">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 class="mb-0 fw-bold">${anggotaData.noWA || anggotaData.no_wa || 'Belum diisi'}</h6>
                                            <small class="${anggotaData.noWA || anggotaData.no_wa ? 'text-success' : 'text-warning'}">
                                                <i class="bi bi-${anggotaData.noWA || anggotaData.no_wa ? 'check-circle' : 'exclamation-circle'} me-1"></i>
                                                ${anggotaData.noWA || anggotaData.no_wa ? 'Tersedia' : 'Belum diisi'}
                                            </small>
                                        </div>
                                        ${anggotaData.noWA || anggotaData.no_wa ? 
                                            `<a href="https://wa.me/${anggotaData.noWA || anggotaData.no_wa}" 
                                                target="_blank" 
                                                class="btn btn-success btn-sm">
                                                <i class="bi bi-whatsapp me-1"></i>Chat
                                            </a>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Kolom Kanan - Info Keanggotaan & Lokasi -->
                <div class="col-lg-6">
                    <div class="card shadow-sm h-100">
                        <div class="card-header bg-light py-2">
                            <h5 class="mb-0 fw-bold fs-6">
                                <i class="bi bi-house-fill text-primary me-2"></i>Informasi Keanggotaan
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label fw-bold text-muted mb-1">
                                    <i class="bi bi-house-door me-2"></i>Alamat Lengkap
                                </label>
                                <div class="bg-light rounded-2 p-2">
                                    <p class="mb-0">${anggotaData.alamat || '-'}</p>
                                </div>
                            </div>
                            
                            <div class="row g-2 mb-3">
                                <div class="col-md-6">
                                    <div class="bg-light rounded-2 p-2">
                                        <small class="text-muted d-block mb-1">
                                            <i class="bi bi-geo-alt-fill text-danger me-1"></i>Jenis Sampah
                                        </small>
                                        <div class="fw-bold">${anggotaData.jenisSampah || anggotaData.jenis_sampah || '-'}</div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="bg-light rounded-2 p-2">
                                        <small class="text-muted d-block mb-1">
                                            <i class="bi bi-calendar-check me-1"></i>ID Anggota
                                        </small>
                                        <div class="fw-bold font-monospace">
                                            #${anggotaData.idAnggota ? anggotaData.idAnggota.toString().padStart(4, '0') : '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Koordinat Lokasi -->
                            <div class="mb-2">
                                <label class="form-label fw-bold text-muted mb-1 d-flex justify-content-between align-items-center">
                                    <span><i class="bi bi-geo-alt me-2"></i>Koordinat Lokasi</span>
                                    ${anggotaData.latitude && anggotaData.longitude ? 
                                        `<span class="badge bg-success">Lokasi Tersedia</span>` : 
                                        `<span class="badge bg-warning">Belum Ditentukan</span>`}
                                </label>
                                <div class="row g-2">
                                    <div class="col-md-6">
                                        <div class="input-group input-group-sm">
                                            <span class="input-group-text">
                                                <i class="bi bi-globe-asia-australia"></i>
                                            </span>
                                            <input type="text" 
                                                class="form-control" 
                                                value="${anggotaData.latitude || 'Belum ditentukan'}" 
                                                readonly>
                                            ${anggotaData.latitude ? 
                                                `<button class="btn btn-outline-secondary btn-sm" 
                                                        onclick="copyToClipboardValue('${anggotaData.latitude}')">
                                                    <i class="bi bi-clipboard"></i>
                                                </button>` : ''}
                                        </div>
                                        <small class="text-muted">Latitude</small>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="input-group input-group-sm">
                                            <span class="input-group-text">
                                                <i class="bi bi-globe"></i>
                                            </span>
                                            <input type="text" 
                                                class="form-control" 
                                                value="${anggotaData.longitude || 'Belum ditentukan'}" 
                                                readonly>
                                            ${anggotaData.longitude ? 
                                                `<button class="btn btn-outline-secondary btn-sm" 
                                                        onclick="copyToClipboardValue('${anggotaData.longitude}')">
                                                    <i class="bi bi-clipboard"></i>
                                                </button>` : ''}
                                        </div>
                                        <small class="text-muted">Longitude</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Peta Lokasi -->
            <div class="card shadow-sm mt-3">
                <div class="card-header bg-light py-2">
                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                        <h5 class="mb-1 mb-md-0 fw-bold fs-6">
                            <i class="bi bi-map-fill text-danger me-2"></i>Peta Lokasi Rumah
                        </h5>
                        <div class="d-flex gap-1">
                            ${anggotaData.latitude && anggotaData.longitude ? 
                                `<button onclick="showLocationInMaps(${anggotaData.latitude}, ${anggotaData.longitude})" 
                                        class="btn btn-outline-primary btn-sm">
                                    <i class="bi bi-compass me-1"></i>Buka di Maps
                                </button>` : 
                                `<button onclick="useDefaultLocation()" 
                                        class="btn btn-outline-primary btn-sm">
                                    <i class="bi bi-geo-alt me-1"></i>Lokasi Default
                                </button>`
                            }
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div style="height: 250px; min-height: 180px;" class="position-relative">
                        ${anggotaData.latitude && anggotaData.longitude ? 
                            `
                            <div id="mapProfil" style="height: 100%;"></div>
                            ` : 
                            `
                            <div class="h-100 d-flex flex-column align-items-center justify-content-center bg-light p-2">
                                <div class="text-center">
                                    <i class="bi bi-geo-alt-fill text-muted fs-2 mb-2"></i>
                                    <h6 class="text-muted mb-1">Lokasi Belum Ditentukan</h6>
                                    <p class="text-muted mb-2 small">Tambahkan lokasi rumah untuk memudahkan koordinasi</p>
                                    <div class="d-flex flex-wrap gap-1 justify-content-center">
                                        <button onclick="document.getElementById('btnEditProfil').click()" 
                                                class="btn btn-success btn-sm">
                                            <i class="bi bi-plus-circle me-1"></i>Tambah Lokasi
                                        </button>
                                        <button onclick="useDefaultLocation()" 
                                                class="btn btn-outline-primary btn-sm">
                                            <i class="bi bi-geo-alt me-1"></i>Lokasi Default
                                        </button>
                                    </div>
                                </div>
                            </div>
                            `
                        }
                    </div>
                </div>
            </div>
            
            <!-- Tombol Aksi -->
            <div class="card shadow-sm mt-3">
                <div class="card-body py-2">
                    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
                        <div class="d-flex gap-2">
                            <button id="btnRefresh" 
                                    class="btn btn-outline-primary btn-sm">
                                <i class="bi bi-arrow-clockwise me-1"></i>Refresh
                            </button>
                            <button id="btnEditProfil" 
                                    class="btn btn-success btn-sm">
                                <i class="bi bi-pencil-square me-1"></i>Edit Profil
                            </button>
                        </div>
                        <button onclick="window.location.hash='#/dashboard'" 
                                class="btn btn-outline-secondary btn-sm">
                            <i class="bi bi-arrow-left me-1"></i>Kembali
                        </button>
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
        
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Memuat...';
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

// Fungsi untuk load map dengan error handling - PERBAIKAN
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
        if (window.profileMap) {
            window.profileMap.remove();
            window.profileMap = null;
        }
        
        // Parse koordinat
        const lat = parseFloat(anggotaData.latitude) || -10.1935921;
        const lng = parseFloat(anggotaData.longitude) || 123.6149376;
        
        console.log(`📍 Initializing map at ${lat}, ${lng}`);
        
        // Buat map dan simpan ke window
        window.profileMap = window.L.map("mapProfil").setView([lat, lng], 15);
        
        // Tambahkan tile layer
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(window.profileMap);
        
        // Tambahkan marker
        window.profileMarker = window.L.marker([lat, lng]).addTo(window.profileMap);
        
        // Tambahkan popup
        const popupContent = `
            <div style="text-align: center;">
                <strong>${anggotaData.nama || 'Anggota'}</strong><br>
                <small>${anggotaData.alamat || ''}</small><br>
                <small class="text-muted">${lat.toFixed(6)}, ${lng.toFixed(6)}</small>
            </div>
        `;
        
        window.profileMarker.bindPopup(popupContent).openPopup();
        
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
                                           value="${anggotaData.nama || userData.first_name || ''}">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">
                                        <i class="bi bi-envelope me-1"></i>Email *
                                    </label>
                                    <input type="email" id="editEmail" class="form-control" 
                                           value="${userData.email || ''}">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">
                                        <i class="bi bi-house me-1"></i>Alamat Lengkap *
                                    </label>
                                    <textarea id="editAlamat" class="form-control" rows="3">${anggotaData.alamat || ''}</textarea>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">
                                        <i class="bi bi-whatsapp me-1"></i>Nomor WhatsApp *
                                    </label>
                                    <input type="tel" id="editNoWA" maxlength="12" class="form-control" 
                                           value="${anggotaData.noWA || anggotaData.no_wa || ''}">
                                    <small class="text-muted">Contoh: 081234567890</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Kolom Kanan - Lokasi -->
                    <div class="col-lg-6">
                        <div class="card shadow-sm mb-4">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">
                                    <i class="bi bi-geo-alt me-2"></i>Lokasi Rumah
                                </h5>
                                <button type="button" id="btnGetCurrentLocation" 
                                        class="btn btn-success btn-sm">
                                    <i class="bi bi-crosshair me-1"></i>Gunakan Lokasi Saya
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label class="form-label d-block">
                                        <i class="bi bi-map me-1"></i>Pilih Lokasi di Peta
                                    </label>
                                    
                                    <!-- Status GPS -->
                                    <div id="gpsStatus" class="mb-2">
                                        <div id="gpsLoading" style="display: none;">
                                            <span class="spinner-border spinner-border-sm text-primary me-2"></span>
                                            <small class="text-primary">Mendapatkan lokasi GPS...</small>
                                        </div>
                                        <div id="gpsSuccess" style="display: none;">
                                            <i class="bi bi-check-circle-fill text-success me-1"></i>
                                            <small class="text-success">Lokasi GPS berhasil didapatkan!</small>
                                        </div>
                                        <div id="gpsError" style="display: none;">
                                            <i class="bi bi-exclamation-circle-fill text-danger me-1"></i>
                                            <small class="text-danger">Gagal mendapatkan lokasi GPS</small>
                                        </div>
                                    </div>
                                    
                                    <!-- Peta -->
                                    <div id="mapEditContainer" style="height: 250px; border-radius: 6px; border: 1px solid #ddd; position: relative;">
                                        <div id="mapEdit" style="height: 100%;"></div>
                                    </div>
                                    <small class="text-muted mt-2 d-block">
                                        <i class="bi bi-info-circle me-1"></i>
                                        Klik pada peta untuk memilih lokasi atau gunakan GPS
                                    </small>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">
                                            <i class="bi bi-geo-alt-fill me-1"></i>Latitude *
                                        </label>
                                        <div class="input-group">
                                            <input type="number" step="0.00000001" id="editLatitude" 
                                                   class="form-control" 
                                                   value="${anggotaData.latitude || -10.1711872}">
                                            <button type="button" class="btn btn-outline-secondary" 
                                                    onclick="copyEditToClipboard('editLatitude')">
                                                <i class="bi bi-clipboard"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">
                                            <i class="bi bi-geo-alt-fill me-1"></i>Longitude *
                                        </label>
                                        <div class="input-group">
                                            <input type="number" step="0.00000001" id="editLongitude" 
                                                   class="form-control" 
                                                   value="${anggotaData.longitude || 123.6149376}">
                                            <button type="button" class="btn btn-outline-secondary" 
                                                    onclick="copyEditToClipboard('editLongitude')">
                                                <i class="bi bi-clipboard"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Tombol Lokasi Cepat -->
                                <div class="mb-3">
                                    <label class="form-label">
                                        <i class="bi bi-lightning-charge me-1"></i>Lokasi Cepat
                                    </label>
                                    <div class="d-flex flex-wrap gap-2">
                                        <button type="button" class="btn btn-outline-primary btn-sm"
                                                onclick="setEditFixedLocation(-10.1711872, 123.6149376, 'Lokasi Saya')">
                                            <i class="bi bi-house me-1"></i>Lokasi Saya
                                        </button>
                                        <button type="button" class="btn btn-outline-success btn-sm"
                                                onclick="setEditFixedLocation(-10.1935921, 123.6149376, 'Kota Kupang')">
                                            <i class="bi bi-geo-alt me-1"></i>Kota Kupang
                                        </button>
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

    // Di dalam fungsi showEditProfileForm, tambahkan:
    window.__originalProfileData = {
        nama: anggotaData?.nama,
        email: userData?.email || "",
        alamat: anggotaData?.alamat || "",
        noWA: anggotaData?.noWA || anggotaData?.no_wa || "",
        latitude: anggotaData?.latitude || -10.1711872,
        longitude: anggotaData?.longitude || 123.6149376,
        jenisSampah: anggotaData?.jenisSampah || anggotaData?.jenis_sampah || "Rumah Tangga"
    };

    console.log("💾 Saved original profile data:", window.__originalProfileData);
    
    // Setup event listeners
    document.getElementById("btnCancel").onclick = () => {
        profilPage();
    };
    
    document.getElementById("btnReset").onclick = () => {
        // Reset form values
        document.getElementById("editNama").value = anggotaData.nama || userData.first_name || '';
        document.getElementById("editEmail").value = userData.email || '';
        document.getElementById("editAlamat").value = anggotaData.alamat || '';
        document.getElementById("editNoWA").value = anggotaData.noWA || anggotaData.no_wa || '';
        document.getElementById("editLatitude").value = anggotaData.latitude || -10.1711872;
        document.getElementById("editLongitude").value = anggotaData.longitude || 123.6149376;
        document.getElementById("editJenisSampah").value = anggotaData.jenisSampah || anggotaData.jenis_sampah || 'Rumah Tangga';
        
        // Reset peta
        resetEditMap();
        
        // Tampilkan pesan sukses
        showEditFormMessage(`
            <div class="alert alert-info alert-dismissible fade show">
                <i class="bi bi-arrow-clockwise me-2"></i>
                <strong>Form telah direset</strong> ke nilai semula
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
    };
    
    document.getElementById("formEditProfil").onsubmit = async (e) => {
        e.preventDefault();
        await handleEditProfile(user, userData, anggotaData);
    };
    
    // Setup event listener untuk tombol GPS
    document.getElementById("btnGetCurrentLocation").onclick = getCurrentLocationEdit;
    
    // Load map untuk edit form
    setTimeout(() => {
        loadEditMap(anggotaData);
    }, 500);
}

// Fungsi untuk load map edit dengan GPS support
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
        const defaultLat = parseFloat(anggotaData.latitude) || -10.1711872;
        const defaultLng = parseFloat(anggotaData.longitude) || 123.6149376;
        
        // Buat map jika belum ada
        if (!editMap) {
            editMap = window.L.map("mapEdit").setView([defaultLat, defaultLng], 13);
            
            // Tambahkan tile layer
            window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(editMap);
        }
        
        // Hapus marker lama jika ada
        if (editMarker && editMap.hasLayer(editMarker)) {
            editMap.removeLayer(editMarker);
        }
        
        // Tambahkan marker awal
        editMarker = window.L.marker([defaultLat, defaultLng], {
            draggable: true,
            title: "Lokasi Anda",
            zIndexOffset: 100
        }).addTo(editMap);
        
        // Tambahkan popup awal
        editMarker.bindPopup(`
            <div style="max-width: 200px;">
                <strong>📍 Lokasi Saat Ini</strong><br>
                <small>
                    Lat: ${defaultLat.toFixed(6)}<br>
                    Lng: ${defaultLng.toFixed(6)}
                </small>
            </div>
        `).openPopup();
        
        // Event untuk klik map
        editMap.on("click", (e) => {
            const { lat, lng } = e.latlng;
            
            // Hapus marker GPS jika ada (karena manual selection)
            if (editGPSMarker && editMap.hasLayer(editGPSMarker)) {
                editMap.removeLayer(editGPSMarker);
                editGPSMarker = null;
            }
            
            updateLocationInputs(lat, lng);
            updateEditMarker(lat, lng);
            
            // Update GPS status
            updateEditGPSStatus('manual');
        });
        
        // Event untuk drag marker
        editMarker.on("dragend", (e) => {
            const position = editMarker.getLatLng();
            
            // Hapus marker GPS jika ada
            if (editGPSMarker && editMap.hasLayer(editGPSMarker)) {
                editMap.removeLayer(editGPSMarker);
                editGPSMarker = null;
            }
            
            updateLocationInputs(position.lat, position.lng);
            
            // Update GPS status
            updateEditGPSStatus('manual');
            
            editMarker.bindPopup(`
                <div style="max-width: 200px;">
                    <strong>📍 Lokasi Manual</strong><br>
                    <small>
                        Lat: ${position.lat.toFixed(6)}<br>
                        Lng: ${position.lng.toFixed(6)}
                    </small>
                </div>
            `).openPopup();
        });
        
        // Event untuk update marker saat input berubah
        document.getElementById("editLatitude").addEventListener("input", updateMarkerFromInputs);
        document.getElementById("editLongitude").addEventListener("input", updateMarkerFromInputs);
        
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

function getRealGPSLocation() {
    return new Promise((resolve, reject) => {
        console.log("🔍 Meminta izin GPS...");
        
        // Cek apakah browser support geolocation
        if (!navigator.geolocation) {
            console.error("❌ Browser tidak mendukung geolocation");
            reject(new Error("Browser Anda tidak mendukung GPS"));
            return;
        }
        
        // OPTIONS YANG LEBIH BAIK:
        const options = {
            enableHighAccuracy: true,    // TRUE untuk akurasi tinggi (GPS)
            timeout: 30000,              // TIMEOUT 30 DETIK (lebih lama)
            maximumAge: 0                // Tidak gunakan cache
        };
        
        // ALTERNATIF: Gunakan false untuk kecepatan (jaringan/WiFi)
        const fastOptions = {
            enableHighAccuracy: false,   // FALSE untuk kecepatan
            timeout: 10000,              // 10 detik
            maximumAge: 30000            // Gunakan cache 30 detik
        };
        
        navigator.geolocation.getCurrentPosition(
            // Success callback
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                
                console.log("✅ GPS Berhasil:", { 
                    lat, 
                    lng, 
                    accuracy: `${accuracy}m`,
                    source: position.coords.altitude ? 'GPS' : 'Network'
                });
                
                resolve({
                    lat: lat,
                    lng: lng,
                    accuracy: accuracy
                });
            },
            
            // Error callback dengan fallback strategy
            (error) => {
                console.error("❌ GPS Error:", error);
                
                let errorMsg = "Gagal mendapatkan lokasi GPS";
                let errorType = "unknown";
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg = "Izin GPS ditolak. Silakan izinkan akses lokasi di browser Anda.";
                        errorType = "permission";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg = "GPS tidak tersedia. Pastikan GPS perangkat aktif.";
                        errorType = "unavailable";
                        break;
                    case error.TIMEOUT:
                        errorMsg = "Waktu tunggu GPS habis. Coba lagi atau gunakan lokasi manual.";
                        errorType = "timeout";
                        break;
                    default:
                        errorMsg = "Error GPS tidak diketahui.";
                        errorType = "unknown";
                }
                
                // Coba fallback ke metode cepat (network based)
                console.log("🔄 Mencoba fallback ke network location...");
                
                // JANGAN reject langsung, coba alternatif
                if (error.code === error.TIMEOUT) {
                    // Fallback ke network location (kurang akurat tapi cepat)
                    const fallbackOptions = {
                        enableHighAccuracy: false,  // Network based
                        timeout: 5000,              // Cepat
                        maximumAge: 60000           // Cache 1 menit
                    };
                    
                    navigator.geolocation.getCurrentPosition(
                        (fallbackPosition) => {
                            const lat = fallbackPosition.coords.latitude;
                            const lng = fallbackPosition.coords.longitude;
                            const accuracy = fallbackPosition.coords.accuracy;
                            
                            console.log("✅ Network Location Berhasil (fallback):", { lat, lng, accuracy });
                            
                            resolve({
                                lat: lat,
                                lng: lng,
                                accuracy: accuracy,
                                source: "network",
                                note: "Lokasi dari jaringan (kurang akurat)"
                            });
                        },
                        (fallbackError) => {
                            // Jika fallback juga gagal, baru reject
                            reject({
                                message: `${errorMsg} | Fallback juga gagal`,
                                type: errorType,
                                code: error.code
                            });
                        },
                        fallbackOptions
                    );
                } else {
                    // Untuk error selain timeout, langsung reject
                    reject({
                        message: errorMsg,
                        type: errorType,
                        code: error.code
                    });
                }
            },
            
            // Gunakan options pertama (GPS akurat)
            options
        );
    });
}

async function getCurrentLocationEdit() {
    const btn = document.getElementById("btnGetCurrentLocation");
    if (!btn) return;
    
    // Update UI
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Memuat...';
    updateEditGPSStatus('loading');
    
    try {
        // Dapatkan GPS REAL
        const { lat, lng } = await getRealGPSLocation();
        
        console.log("📍 GPS Real Location Found:", lat, lng);
        
        // Update input fields dengan GPS real
        updateLocationInputs(lat, lng);
        
        // Update peta dengan GPS real
        if (editMap) {
            editMap.setView([lat, lng], 17);
            
            // Hapus marker GPS lama jika ada
            if (editGPSMarker && editMap.hasLayer(editGPSMarker)) {
                editMap.removeLayer(editGPSMarker);
            }
            
            // Buat custom GPS icon hijau
            const gpsIcon = window.L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
            
            // Buat marker GPS baru dengan lokasi REAL
            editGPSMarker = window.L.marker([lat, lng], {
                icon: gpsIcon,
                title: "LOKASI SAYA (GPS REAL)",
                zIndexOffset: 1000
            }).addTo(editMap);
            
            // Tambahkan popup GPS dengan info real
            editGPSMarker.bindPopup(`
                <div style="max-width: 250px;">
                    <div style="background: linear-gradient(135deg, #198754, #146c43); color: white; padding: 10px 15px; border-radius: 8px 8px 0 0; margin: -10px -15px 10px -15px;">
                        <strong style="font-size: 0.9rem;">
                            <i class="bi bi-crosshair"></i> LOKASI GPS REAL
                        </strong>
                    </div>
                    <div style="padding: 10px 0;">
                        <div style="font-family: monospace; font-size: 0.8rem; background: #f8f9fa; padding: 8px; border-radius: 4px;">
                            <span style="color: #198754;">Lat:</span> ${lat.toFixed(6)}<br>
                            <span style="color: #198754;">Lng:</span> ${lng.toFixed(6)}
                        </div>
                        <small class="text-muted d-block mt-2">
                            <i class="bi bi-info-circle"></i> Lokasi GPS dari perangkat Anda
                        </small>
                    </div>
                </div>
            `).openPopup();
            
            // Tambahkan circle hijau
            window.L.circle([lat, lng], {
                color: '#198754',
                fillColor: '#198754',
                fillOpacity: 0.15,
                radius: 50
            }).addTo(editMap);
            
            // Refresh peta
            setTimeout(() => {
                editMap.invalidateSize();
            }, 100);
        }
        
        // Update status
        updateEditGPSStatus('success');
        
        // Reset tombol
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-crosshair me-1"></i>Lokasi Saya';
        
        // Tampilkan pesan sukses
        showEditFormMessage(`
            <div class="alert alert-success alert-dismissible fade show border-0 shadow-sm">
                <div class="d-flex align-items-center">
                    <i class="bi bi-check-circle-fill fs-4 me-3"></i>
                    <div>
                        <strong class="d-block">GPS Real Ditemukan!</strong>
                        <small class="text-muted">Lokasi: ${lat.toFixed(6)}, ${lng.toFixed(6)}</small>
                    </div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
        
    } catch (error) {
        console.error("GPS Real Error:", error);
        
        // Fallback ke lokasi tetap jika GPS gagal
        console.log("⚠️ Menggunakan lokasi tetap sebagai fallback");
        
        // Lokasi tetap fallback
        const FALLBACK_LAT = -10.1711872;
        const FALLBACK_LNG = 123.6149376;
        
        updateLocationInputs(FALLBACK_LAT, FALLBACK_LNG);
        
        // Update status error
        updateEditGPSStatus('error');
        
        // Reset tombol
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-crosshair me-1"></i>Lokasi Saya';
        
        // Tampilkan pesan error dengan fallback
        showEditFormMessage(`
            <div class="alert alert-warning alert-dismissible fade show border-0 shadow-sm">
                <div class="d-flex align-items-center">
                    <i class="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                    <div>
                        <strong class="d-block">${error.message}</strong>
                        <small class="text-muted">Menggunakan lokasi default sebagai pengganti</small>
                    </div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
    }
}

// Fungsi reset peta edit
function resetEditMap() {
    if (editMap) {
        const defaultLat = -10.1935921;
        const defaultLng = 123.6149376;
        
        // Reset ke default
        editMap.setView([defaultLat, defaultLng], 13);
        
        // Hapus marker GPS jika ada
        if (editGPSMarker && editMap.hasLayer(editGPSMarker)) {
            editMap.removeLayer(editGPSMarker);
            editGPSMarker = null;
        }
        
        // Reset marker default
        if (editMarker && editMap.hasLayer(editMarker)) {
            editMarker.setOpacity(1);
            editMarker.setLatLng([defaultLat, defaultLng]);
            editMarker.bindPopup(`
                <div style="max-width: 200px;">
                    <strong>📍 Lokasi Default</strong><br>
                    <small>
                        Lat: ${defaultLat}<br>
                        Lng: ${defaultLng}
                    </small>
                </div>
            `).openPopup();
        }
        
        // Update input
        updateLocationInputs(defaultLat, defaultLng);
        
        // Update status
        updateEditGPSStatus('manual');
        
        // Refresh peta
        setTimeout(() => {
            editMap.invalidateSize();
        }, 200);
        
        showEditFormMessage(`
            <div class="alert alert-info alert-dismissible fade show">
                <i class="bi bi-info-circle-fill me-2"></i>
                <strong>Peta direset</strong> ke lokasi default
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
    }
}

// Fungsi untuk update status GPS di halaman edit
// Fungsi untuk update status GPS di form edit
function updateEditGPSStatus(status) {
    const loadingEl = document.getElementById("gpsLoading");
    const successEl = document.getElementById("gpsSuccess");
    const errorEl = document.getElementById("gpsError");
    
    if (!loadingEl || !successEl || !errorEl) return;
    
    // Reset semua status
    loadingEl.style.display = 'none';
    successEl.style.display = 'none';
    errorEl.style.display = 'none';
    
    // Tampilkan status yang sesuai
    switch (status) {
        case 'loading':
            loadingEl.style.display = 'block';
            break;
        case 'success':
            successEl.innerHTML = `
                <i class="bi bi-check-circle-fill text-success me-1"></i>
                <small class="text-success">📍 Lokasi GPS Anda diterapkan!</small>
            `;
            successEl.style.display = 'block';
            break;
        case 'error':
            errorEl.innerHTML = `
                <i class="bi bi-exclamation-circle-fill text-danger me-1"></i>
                <small class="text-danger">Gagal mendapatkan lokasi GPS</small>
            `;
            errorEl.style.display = 'block';
            break;
        case 'manual':
            successEl.innerHTML = `
                <i class="bi bi-geo-alt-fill text-primary me-1"></i>
                <small class="text-primary">📍 Lokasi dipilih manual di peta</small>
            `;
            successEl.style.display = 'block';
            break;
    }
}

// Helper functions untuk halaman edit
function updateLocationInputs(lat, lng) {
    const latInput = document.getElementById("editLatitude");
    const lngInput = document.getElementById("editLongitude");
    
    if (latInput && lngInput) {
        latInput.value = lat;
        lngInput.value = lng;
    }
}

function updateEditMarker(lat, lng) {
    if (editMarker && editMap.hasLayer(editMarker)) {
        editMarker.setLatLng([lat, lng]);
        editMarker.setOpacity(1);
        editMarker.bindPopup(`
            <div style="max-width: 200px;">
                <strong>📍 Lokasi Manual</strong><br>
                <small>
                    Lat: ${lat.toFixed(6)}<br>
                    Lng: ${lng.toFixed(6)}
                </small>
            </div>
        `).openPopup();
    }
}

function updateMarkerFromInputs() {
    if (!editMap) return;
    
    const lat = parseFloat(document.getElementById("editLatitude").value);
    const lng = parseFloat(document.getElementById("editLongitude").value);
    
    if (isNaN(lat) || isNaN(lng)) return;
    
    // Update marker position
    updateEditMarker(lat, lng);
    
    // Center map
    editMap.setView([lat, lng], editMap.getZoom());
}

// Fungsi untuk set lokasi tetap
window.setFixedLocation = function(lat, lng, label) {
    updateLocationInputs(lat, lng);
    
    if (editMap) {
        editMap.setView([lat, lng], 17);
        
        // Hapus marker GPS jika ada
        if (editGPSMarker && editMap.hasLayer(editGPSMarker)) {
            editMap.removeLayer(editGPSMarker);
            editGPSMarker = null;
        }
        
        // Update marker
        updateEditMarker(lat, lng);
        
        // Update status
        updateEditGPSStatus('manual');
        
        // Refresh peta
        setTimeout(() => {
            editMap.invalidateSize();
        }, 100);
    }
    
    showEditFormMessage(`
        <div class="alert alert-info alert-dismissible fade show">
            <i class="bi bi-check-circle-fill me-2"></i>
            <strong>Lokasi diterapkan:</strong> ${label}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);
};
// Fungsi untuk copy ke clipboard di form edit
window.copyEditToClipboard = function(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.select();
        document.execCommand('copy');
        
        // Tampilkan feedback
        const originalValue = input.value;
        input.value = '✓ Disalin!';
        setTimeout(() => {
            input.value = originalValue;
        }, 1000);
        
        // Tampilkan toast
        showEditFormMessage(`
            <div class="alert alert-success alert-dismissible fade show">
                <i class="bi bi-check-circle-fill me-2"></i>
                <strong>Berhasil disalin!</strong>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
    }
};

window.copyToClipboardValue = function(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.select();
        document.execCommand('copy');
        
        // Tampilkan feedback
        const originalValue = input.value;
        input.value = '✓ Disalin!';
        setTimeout(() => {
            input.value = originalValue;
        }, 1000);
        
        // Tampilkan toast
        showEditFormMessage(`
            <div class="alert alert-success alert-dismissible fade show">
                <i class="bi bi-check-circle-fill me-2"></i>
                <strong>Berhasil disalin!</strong>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
    }
};

// Fungsi untuk set lokasi tetap di form edit
window.setEditFixedLocation = function(lat, lng, label) {
    updateLocationInputs(lat, lng);
    
    if (editMap) {
        editMap.setView([lat, lng], 17);
        
        // Hapus marker GPS jika ada
        if (editGPSMarker && editMap.hasLayer(editGPSMarker)) {
            editMap.removeLayer(editGPSMarker);
            editGPSMarker = null;
        }
        
        // Update marker
        updateEditMarker(lat, lng);
        
        // Update status
        updateEditGPSStatus('manual');
        
        // Refresh peta
        setTimeout(() => {
            editMap.invalidateSize();
        }, 100);
    }
    
    showEditFormMessage(`
        <div class="alert alert-info alert-dismissible fade show">
            <i class="bi bi-check-circle-fill me-2"></i>
            <strong>Lokasi diterapkan:</strong> ${label}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);
};

// Fungsi untuk tombol GPS di peta utama
window.getCurrentLocationView = function() {
    // Lokasi tetap Anda
    const YOUR_FIXED_LATITUDE = -10.1711872;
    const YOUR_FIXED_LONGITUDE = 123.6149376;
    
    if (window.profileMap) {
        window.profileMap.setView([YOUR_FIXED_LATITUDE, YOUR_FIXED_LONGITUDE], 17);
        
        // Buat marker GPS jika belum ada
        if (!window.profileGPSMarker) {
            window.profileGPSMarker = window.L.marker([YOUR_FIXED_LATITUDE, YOUR_FIXED_LONGITUDE], {
                icon: window.L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                }),
                title: "LOKASI SAYA (GPS)",
                draggable: false,
                zIndexOffset: 1000
            }).addTo(window.profileMap);
            
            window.profileGPSMarker.bindPopup(`
                <div style="max-width: 250px;">
                    <strong style="color: #4CAF50;">📍 LOKASI SAYA</strong><br>
                    <small>
                        <b>Lat:</b> ${YOUR_FIXED_LATITUDE}<br>
                        <b>Lng:</b> ${YOUR_FIXED_LONGITUDE}<br>
                        <i>Lokasi tetap Anda</i>
                    </small>
                </div>
            `).openPopup();
        } else {
            window.profileGPSMarker.setLatLng([YOUR_FIXED_LATITUDE, YOUR_FIXED_LONGITUDE]);
            window.profileGPSMarker.openPopup();
        }
        
        // Tampilkan toast
        showToast('Menggunakan lokasi Anda: -10.1711872, 123.6149376', 'success');
    }
};

window.resetMapView = function() {
    if (window.profileMap) {
        window.profileMap.setView([-10.1935921, 123.6149376], 13);
        
        // Hapus marker GPS jika ada
        if (window.profileGPSMarker) {
            window.profileMap.removeLayer(window.profileGPSMarker);
            window.profileGPSMarker = null;
        }
        
        showToast('Peta direset ke lokasi default Kupang', 'info');
    }
};

// Fungsi untuk menampilkan pesan di form edit
function showEditFormMessage(message) {
    const formMessage = document.getElementById("formMessage");
    if (formMessage) {
        formMessage.innerHTML = message;
        
        // Auto dismiss setelah 3 detik
        setTimeout(() => {
            if (formMessage.innerHTML === message) {
                formMessage.innerHTML = '';
            }
        }, 3000);
    }
}

// Fungsi untuk menampilkan pesan validasi langsung di form
function showValidationMessage(elementId, message, isValid = false) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Hapus pesan sebelumnya
    const existingMsg = element.parentElement.querySelector('.validation-feedback');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    // Hapus class validasi sebelumnya
    element.classList.remove('is-valid', 'is-invalid');
    
    if (message) {
        // Tambahkan pesan validasi
        const feedback = document.createElement('div');
        feedback.className = `validation-feedback ${isValid ? 'valid-feedback' : 'invalid-feedback'}`;
        feedback.innerHTML = `<i class="bi ${isValid ? 'bi-check-circle' : 'bi-exclamation-circle'} me-1"></i>${message}`;
        
        // Tambahkan class ke input
        element.classList.add(isValid ? 'is-valid' : 'is-invalid');
        
        // Tambahkan pesan setelah input
        element.parentElement.appendChild(feedback);
    }
}

function isDataChanged(original, current) {
    if (!original || !current) return true;
    
    return Object.keys(current).some(key => {
        const originalValue = original[key];
        const currentValue = current[key];

        // Handle null/undefined/empty string comparison
        const orig = originalValue !== null && originalValue !== undefined ? String(originalValue) : "";
        const curr = currentValue !== null && currentValue !== undefined ? String(currentValue) : "";
        
        console.log(`🔍 Comparing ${key}: "${orig}" vs "${curr}"`);
        
        return orig.trim() !== curr.trim();
    });
}

// Update fungsi handleEditProfile - PERBAIKAN URUTAN
async function handleEditProfile(user, userData, anggotaData) {
    const btnSave = document.getElementById("btnSave");
    const formMessage = document.getElementById("formMessage");
    
    // Hapus semua pesan validasi sebelumnya
    const allFeedback = document.querySelectorAll('.validation-feedback');
    allFeedback.forEach(fb => fb.remove());
    
    // Hapus class validasi sebelumnya
    const allInputs = document.querySelectorAll('#formEditProfil input, #formEditProfil textarea, #formEditProfil select');
    allInputs.forEach(input => {
        input.classList.remove('is-valid', 'is-invalid');
    });

    // ==============================
    // 1. AMBIL VALUE DARI FORM (Harus di awal!)
    // ==============================
    const nama = document.getElementById("editNama").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const alamat = document.getElementById("editAlamat").value.trim();
    const noWA = document.getElementById("editNoWA").value.trim();
    const latitude = parseFloat(document.getElementById("editLatitude").value);
    const longitude = parseFloat(document.getElementById("editLongitude").value);
    const jenisSampah = document.getElementById("editJenisSampah").value;
    
    // Bersihkan nomor WA
    const cleanedNoWA = noWA.replace(/\D/g, '');
    
    // ==============================
    // 2. CEK APAKAH ADA PERUBAHAN DATA (setelah ambil value)
    // ==============================
    const currentData = {
        nama: nama,
        email: email,
        alamat: alamat,
        noWA: cleanedNoWA,
        latitude: latitude,
        longitude: longitude,
        jenisSampah: jenisSampah
    };
    
    // Pastikan original data ada
    if (!window.__originalProfileData) {
        window.__originalProfileData = {
            nama: anggotaData?.nama || "",
            email: userData?.email || "",
            alamat: anggotaData?.alamat || "",
            noWA: anggotaData?.noWA || anggotaData?.no_wa || "",
            latitude: anggotaData?.latitude || -10.1711872,
            longitude: anggotaData?.longitude || 123.6149376,
            jenisSampah: anggotaData?.jenisSampah || anggotaData?.jenis_sampah || "Rumah Tangga"
        };
    }
    
    const originalData = window.__originalProfileData || {};
    
    // Debug log untuk cek data
    console.log("📊 Original Data:", originalData);
    console.log("📊 Current Data:", currentData);
    
    const hasChanged = isDataChanged(originalData, currentData);
    console.log("🔄 Has changed?", hasChanged);
    
    if (!hasChanged) {
        if (formMessage) {
            formMessage.innerHTML = `
                <div class="alert alert-warning alert-dismissible fade show border-0 shadow-sm">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-info-circle-fill fs-4 me-3"></i>
                        <div>
                            <strong class="d-block">Tidak ada perubahan data</strong>
                            <small class="text-muted">
                                Silakan ubah minimal satu field sebelum menyimpan
                            </small>
                        </div>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
        }
        
        return; // ⛔ STOP SAVE
    }
    
    // ==============================
    // 3. VALIDASI FIELD (Hanya jika ada perubahan)
    // ==============================
    let isValid = true;
    
    // Validasi Nama
    if (!nama) {
        showValidationMessage('editNama', 'Nama lengkap harus diisi');
        isValid = false;
    } else if (nama.length < 3) {
        showValidationMessage('editNama', 'Nama minimal 3 karakter');
        isValid = false;
    } else {
        showValidationMessage('editNama', 'Nama valid', true);
    }
    
    // Validasi Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        showValidationMessage('editEmail', 'Email harus diisi');
        isValid = false;
    } else if (!emailRegex.test(email)) {
        showValidationMessage('editEmail', 'Format email tidak valid');
        isValid = false;
    } else {
        showValidationMessage('editEmail', 'Email valid', true);
    }
    
    // Validasi Alamat
    if (!alamat) {
        showValidationMessage('editAlamat', 'Alamat harus diisi');
        isValid = false;
    } else if (alamat.length < 4) {
        showValidationMessage('editAlamat', 'Alamat terlalu pendek');
        isValid = false;
    } else {
        showValidationMessage('editAlamat', 'Alamat valid', true);
    }
    
    // Validasi WhatsApp
    if (!noWA) {
        showValidationMessage('editNoWA', 'Nomor WhatsApp harus diisi');
        isValid = false;
    } else if (cleanedNoWA.length < 10 || cleanedNoWA.length > 12) {
        showValidationMessage('editNoWA', 'Nomor WhatsApp harus 10-12 digit');
        isValid = false;
    } else if (!/^[0-9]+$/.test(cleanedNoWA)) {
        showValidationMessage('editNoWA', 'Hanya angka yang diperbolehkan');
        isValid = false;
    } else {
        showValidationMessage('editNoWA', 'Nomor WhatsApp valid', true);
    }
    
    // Jika ada yang tidak valid, hentikan proses
    if (!isValid) {
        // Scroll ke field pertama yang error
        const firstInvalid = document.querySelector('.is-invalid');
        if (firstInvalid) {
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalid.focus();
        }
        
        // Tampilkan pesan di bagian atas
        if (formMessage) {
            formMessage.innerHTML = `
                <div class="alert alert-warning alert-dismissible fade show border-0 shadow-sm">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                        <div>
                            <strong class="d-block">Terdapat kesalahan dalam pengisian form</strong>
                            <small class="text-muted">Silakan perbaiki field yang ditandai dengan warna merah</small>
                        </div>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
        }
        
        return;
    }
    
    // ==============================
    // 4. PERSIAPKAN PAYLOAD DAN KIRIM
    // ==============================
    // Persiapkan payload
    const payloadUser = { email: email };
    const payloadAnggota = {
        user: user.id,
        nama: nama,
        alamat: alamat,
        noWA: cleanedNoWA,
        latitude: latitude,
        longitude: longitude,
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
    const originalBtnText = btnSave.innerHTML;
    btnSave.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
    showToast('Menyimpan perubahan profil...', 'info');
    
    // Tampilkan pesan loading
    if (formMessage) {
        formMessage.innerHTML = `
            <div class="alert alert-info alert-dismissible fade show border-0 shadow-sm">
                <div class="d-flex align-items-center">
                    <span class="spinner-border spinner-border-sm me-3"></span>
                    <div>
                        <strong class="d-block">Menyimpan perubahan...</strong>
                        <small class="text-muted">Mohon tunggu sebentar</small>
                    </div>
                </div>
            </div>
        `;
    }
    
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
        
        showToast('Anggota Berhasil di Perbarui', 'success');
        alert("✓ Anggota Berhasil di Perbarui");
        
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
        
        // Tampilkan pesan sukses
        if (formMessage) {
            formMessage.innerHTML = `
                <div class="alert alert-success alert-dismissible fade show border-0 shadow-sm">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-check-circle-fill fs-4 me-3"></i>
                        <div>
                            <strong class="d-block">Profil Berhasil Diperbarui!</strong>
                            <small class="text-muted">Halaman akan dimuat ulang...</small>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Ubah tombol menjadi success state
        btnSave.innerHTML = '<i class="bi bi-check-circle me-1"></i>Berhasil!';
        btnSave.classList.remove('btn-success');
        btnSave.classList.add('btn-success', 'disabled');
        
        // Refresh page after 2 seconds
        setTimeout(() => {
            profilPage();
        }, 2000);
        
    } catch (error) {
        console.error("Update error:", error);
        
        // Reset button state
        btnSave.disabled = false;
        btnSave.innerHTML = originalBtnText;
        
        let errorMsg = "Gagal memperbarui profil";
        let errorDetail = error.message;
        
        if (error.message.includes("401") || error.message.includes("403")) {
            errorMsg = "Akses ditolak";
            errorDetail = "Silakan login ulang untuk melanjutkan";
        } else if (error.message.includes("404")) {
            errorMsg = "Data tidak ditemukan";
            errorDetail = "Data yang ingin diperbarui tidak ditemukan di server";
        } else if (error.message.includes("400")) {
            errorMsg = "Data tidak valid";
            errorDetail = "Periksa kembali data yang Anda masukkan";
        }
        
        // Tampilkan pesan error
        if (formMessage) {
            formMessage.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show border-0 shadow-sm">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                        <div>
                            <strong class="d-block">${errorMsg}</strong>
                            <small class="text-muted">${errorDetail}</small>
                        </div>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
        }
    }
}

// Tambahkan CSS untuk validasi inline di bagian atas file atau dalam tag style
const style = document.createElement('style');
style.textContent = `
    .validation-feedback {
        display: block;
        margin-top: 0.25rem;
        font-size: 0.875em;
    }
    .valid-feedback {
        color: #198754;
    }
    .invalid-feedback {
        color: #dc3545;
    }
    .is-valid {
        border-color: #198754;
        padding-right: calc(1.5em + 0.75rem);
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%23198754' d='M2.3 6.73L.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right calc(0.375em + 0.1875rem) center;
        background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
    }
    .is-invalid {
        border-color: #dc3545;
        padding-right: calc(1.5em + 0.75rem);
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right calc(0.375em + 0.1875rem) center;
        background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
    }
    .is-valid:focus, .is-invalid:focus {
        box-shadow: 0 0 0 0.25rem rgba(var(--bs-success-rgb), 0.25);
    }
    .is-invalid:focus {
        box-shadow: 0 0 0 0.25rem rgba(var(--bs-danger-rgb), 0.25);
    }
`;
document.head.appendChild(style);

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

// Tambahkan fungsi ini setelah fungsi formatDate
function getDateStatusBadge(dateString) {
    if (!dateString) return 'bg-secondary';
    
    try {
        const today = new Date();
        const endDate = new Date(dateString);
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining <= 0) {
            return 'bg-danger';
        } else if (daysRemaining <= 7) {
            return 'bg-warning';
        } else {
            return 'bg-info';
        }
    } catch {
        return 'bg-secondary';
    }
}