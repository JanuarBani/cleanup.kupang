import { API, getAuthHeaders, fetchAPI } from "../api.js";
import { authGuard } from "../utils/authGuard.js";
import { loadLeaflet, initMap, addMarker, initMapForm } from "../utils/mapConfig.js";
import { showFormLaporan } from "./tamu/formLaporan.js";

export async function dashboardTamu() {
    const app = document.getElementById("app");
    const user = await authGuard();

    if (!user) {
        alert("Silakan login terlebih dahulu!");
        window.location.hash = "#/login";
        return;
    }

    app.innerHTML = `
    <!-- Navigation Bar -->
    <nav class="navbar navbar-expand-lg navbar-dark" style="background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%); box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div class="container-fluid" style="max-width: 1300px; margin: 0 auto; padding: 0 15px;">
            <a class="navbar-brand fw-bold" href="#/dashboard">
                <i class="bi bi-tree-fill me-2"></i>CleanUp Kupang
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link active" href="#/dashboard">
                            <i class="bi bi-house-door me-1"></i>Dashboard
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#/laporan-saya">
                            <i class="bi bi-list-check me-1"></i>Laporan Saya
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#/upgrade-anggota">
                            <i class="bi bi-star-fill me-1"></i>Upgrade Anggota
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#/bantuan">
                            <i class="bi bi-question-circle me-1"></i>Bantuan
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#/tentang">
                            <i class="bi bi-info-circle me-1"></i>Tentang
                        </a>
                    </li>
                </ul>
                <div class="navbar-nav">
                    <div class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown">
                            <div class="bg-light rounded-circle p-2 me-2">
                                <i class="bi bi-person text-success"></i>
                            </div>
                            <div class="d-flex flex-column">
                                <span class="fw-bold">${user.username}</span>
                                <small class="text-white opacity-75">${user.role}</small>
                            </div>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="#/profile">
                                <i class="bi bi-person-gear me-2"></i>Ubah Profil
                            </a></li>
                            <li><a class="dropdown-item" href="#/upgrade-anggota">
                                <i class="bi bi-star-fill me-2"></i>Upgrade Akun
                            </a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" id="navLogout">
                                <i class="bi bi-box-arrow-right me-2"></i>Logout
                            </a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content Container -->
    <div style="margin: 5px auto; max-width: 1300px; padding: 0 10px;">
        <!-- Welcome Card -->
        <div class="bg-success text-white p-4 rounded-3 mb-4 mt-3 shadow-sm" style="background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%);">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h1 class="h2 mb-2 fw-bold">
                        <i class="bi bi-house-door me-2"></i>Dashboard Tamu
                    </h1>
                    <p class="mb-0 opacity-90">
                        Selamat datang kembali, <b class="text-warning">${user.username}</b>! 
                        Anda masuk sebagai <b class="text-warning">${user.role}</b>.
                    </p>
                </div>
                <div class="d-flex gap-2">
                    <button id="btnEditTamu" class="btn btn-light btn-sm">
                        <i class="bi bi-person-gear me-1"></i> Ubah Profil
                    </button>
                    <button id="btnBuatLaporanHeader" class="btn btn-warning btn-sm">
                        <i class="bi bi-plus-circle me-1"></i> Buat Laporan
                    </button>
                </div>
            </div>
        </div>

        <!-- Quick Stats -->
        <div class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="card border-success shadow-sm h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="bg-success bg-opacity-10 p-3 rounded me-3">
                                <i class="bi bi-map text-success fs-3"></i>
                            </div>
                            <div>
                                <h5 class="card-title text-muted small mb-1">Laporan Aktif</h5>
                                <h2 class="card-text text-success mb-0 fw-bold" id="activeReports">0</h2>
                                <small class="text-muted">di peta saat ini</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card border-info shadow-sm h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="bg-info bg-opacity-10 p-3 rounded me-3">
                                <i class="bi bi-check-circle text-info fs-3"></i>
                            </div>
                            <div>
                                <h5 class="card-title text-muted small mb-1">Laporan Selesai</h5>
                                <h2 class="card-text text-info mb-0 fw-bold" id="completedReports">0</h2>
                                <small class="text-muted">telah ditangani</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card border-warning shadow-sm h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="bg-warning bg-opacity-10 p-3 rounded me-3">
                                <i class="bi bi-clock-history text-warning fs-3"></i>
                            </div>
                            <div>
                                <h5 class="card-title text-muted small mb-1">Dalam Proses</h5>
                                <h2 class="card-text text-warning mb-0 fw-bold" id="pendingReports">0</h2>
                                <small class="text-muted">menunggu penanganan</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Peta Laporan Sampah -->
        <div class="card mb-4 border-success shadow-sm">
            <div class="card-header bg-success text-white d-flex align-items-center">
                <i class="bi bi-map me-2 fs-5"></i>
                <h2 class="card-title h5 mb-0 fw-bold">Peta Laporan Sampah Kota Kupang</h2>
            </div>
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <p class="text-muted small mb-0">
                        <i class="bi bi-info-circle me-1"></i>
                        Peta interaktif menunjukkan lokasi-lokasi laporan sampah di Kota Kupang
                    </p>
                    <div class="d-flex gap-2">
                        <button onclick="refreshMapMarkers()" class="btn btn-outline-success btn-sm">
                            <i class="bi bi-arrow-clockwise me-1"></i> Refresh Peta
                        </button>
                    </div>
                </div>
                <div id="map" style="height: 500px; border-radius: 8px; overflow: hidden; border: 1px solid #dee2e6;"></div>
            </div>
        </div>

        <!-- Tombol Utama -->
        <div class="d-grid mb-4">
            <button id="btnBuatLaporanUtama" class="btn btn-success btn-lg py-3 shadow" 
                    style="background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%); border: none;">
                <i class="bi bi-plus-circle me-2"></i> Buat Laporan Sampah Baru
            </button>
        </div>

        <!-- Form Container -->
        <div id="formContainer"></div>

        <!-- Daftar Laporan Sampah Terbaru -->
        <div class="card mb-4 border-success shadow-sm">
            <div class="card-header bg-success text-white d-flex align-items-center">
                <i class="bi bi-list-ul me-2 fs-5"></i>
                <h2 class="card-title h5 mb-0 fw-bold">Laporan Terbaru</h2>
            </div>
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <p class="text-muted small mb-0">
                        <i class="bi bi-info-circle me-1"></i>
                        Daftar laporan sampah terbaru yang dibuat oleh warga
                    </p>
                    <div class="d-flex gap-2">
                        <button onclick="loadLaporanGrid()" class="btn btn-outline-success btn-sm">
                            <i class="bi bi-arrow-clockwise me-1"></i> Refresh
                        </button>
                        <a href="#/semua-laporan" class="btn btn-success btn-sm">
                            <i class="bi bi-list-stars me-1"></i> Lihat Semua
                        </a>
                    </div>
                </div>
                <div id="laporanGrid" class="row g-3"></div>
            </div>
        </div>

        <!-- Upgrade Banner -->
        <div class="card mb-4 shadow-sm" style="background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%); color: white; border: none;">
            <div class="card-body">
                <h2 class="card-title h4 mb-3 fw-bold">
                    <i class="bi bi-gem me-2"></i> Upgrade ke Anggota CleanUp Kupang
                </h2>
                <p class="mb-3">
                    😍🥳 Hallo Bapa, Mama, Kaka, Adik semua! Nikmati kemudahan layanan angkut sampah 
                    dengan menjadi anggota CleanUp Kupang. Hanya <b class="text-warning">Rp 50.000/bulan</b>, 
                    Anda sudah berkontribusi menjaga kebersihan kota.
                </p>
                
                <div class="row g-3 mb-3">
                    <div class="col-md-4">
                        <div class="bg-success bg-opacity-10 p-3 rounded-3 h-100 border border-success border-opacity-25">
                            <h5 class="mb-2 text-dark fw-bold">
                                <i class="bi bi-check-circle-fill text-success me-2"></i> 4x Angkut/Bulan
                            </h5>
                            <p class="mb-0 small text-dark">Layanan dijemput langsung di depan rumah Anda</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="bg-warning bg-opacity-10 p-3 rounded-3 h-100 border border-warning border-opacity-25">
                            <h5 class="mb-2 text-dark fw-bold">
                                <i class="bi bi-currency-exchange text-warning me-2"></i> Rp 50.000
                            </h5>
                            <p class="mb-0 small text-dark">Biaya terjangkau untuk lingkungan bersih</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="bg-success bg-opacity-10 p-3 rounded-3 h-100 border border-success border-opacity-25">
                            <h5 class="mb-2 text-dark fw-bold">
                                <i class="bi bi-tree-fill text-success me-2"></i> Kota Bersih
                            </h5>
                            <p class="mb-0 small text-dark">Berkontribusi untuk Kota Kupang yang lebih indah</p>
                        </div>
                    </div>
                </div>
                
                <div class="text-center mt-4">
                    <button id="btnUpgradeNow" class="btn btn-warning btn-lg px-5 shadow">
                        <i class="bi bi-star-fill me-2"></i> Upgrade Sekarang
                    </button>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="card border-success shadow-sm">
            <div class="card-header bg-success text-white d-flex align-items-center">
                <i class="bi bi-telephone me-2 fs-5"></i>
                <h2 class="card-title h5 mb-0 fw-bold">Kontak & Informasi</h2>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <div class="d-flex align-items-center p-3 bg-light rounded-3 h-100">
                            <div class="bg-success bg-opacity-10 p-3 rounded me-3">
                                <i class="bi bi-envelope text-success fs-4"></i>
                            </div>
                            <div>
                                <small class="text-muted d-block fw-semibold">Email</small>
                                <strong class="text-dark">admin@cleanupkupang.id</strong>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="d-flex align-items-center p-3 bg-light rounded-3 h-100">
                            <div class="bg-success bg-opacity-10 p-3 rounded me-3">
                                <i class="bi bi-telephone text-success fs-4"></i>
                            </div>
                            <div>
                                <small class="text-muted d-block fw-semibold">Telepon/WA</small>
                                <strong class="text-dark">(0380) 8123-4567</strong>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="d-flex align-items-center p-3 bg-light rounded-3 h-100">
                            <div class="bg-success bg-opacity-10 p-3 rounded me-3">
                                <i class="bi bi-geo-alt text-success fs-4"></i>
                            </div>
                            <div>
                                <small class="text-muted d-block fw-semibold">Alamat Kantor</small>
                                <strong class="text-dark">Jl. Kebersihan No. 1, Kota Kupang</strong>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="alert alert-success mt-3">
                    <i class="bi bi-clock-history me-2"></i>
                    <strong>Jam Operasional:</strong> Senin - Jumat (08:00 - 17:00 WITA) | Sabtu (08:00 - 12:00 WITA)
                </div>
                
                <div class="text-center mt-4 pt-3 border-top">
                    <p class="text-muted small mb-2">
                        &copy; 2024 CleanUp Kupang. Semua hak dilindungi undang-undang.
                    </p>
                    <div class="d-flex justify-content-center gap-3">
                        <a href="#/syarat-ketentuan" class="text-success text-decoration-none small">Syarat & Ketentuan</a>
                        <a href="#/kebijakan-privasi" class="text-success text-decoration-none small">Kebijakan Privasi</a>
                        <a href="#/faq" class="text-success text-decoration-none small">FAQ</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

    // TAMBAHKAN INI: Buat modalContainer setelah render HTML
    if (!document.getElementById('modalContainer')) {
        const modalContainer = document.createElement('div');
        modalContainer.id = 'modalContainer';
        document.body.appendChild(modalContainer);
    }

    // Event handlers setup
    setupEventHandlers(user);
    
    // Load Leaflet dan peta dashboard
    loadLeaflet(() => {
        initMapAndMarkers();
    });

    // Load grid laporan pertama kali
    loadLaporanGrid();
    
    // Update stats setelah semua data dimuat
    setTimeout(updateStats, 1500);
}

// ===== Setup Event Handlers =====
function setupEventHandlers(user) {
    // Tombol logout
    const navLogout = document.getElementById("navLogout");
    if (navLogout) {
        navLogout.onclick = () => {
            if (typeof window.logout === 'function') {
                window.logout();
            } else {
                // Fallback jika fungsi global belum ada
                localStorage.clear();
                window.location.hash = "#/login";
                window.location.reload();
            }
        };
    }

    // Tombol upgrade
    const btnUpgradeNow = document.getElementById("btnUpgradeNow");
    if (btnUpgradeNow) {
        btnUpgradeNow.onclick = () => {
            window.location.hash = "#/upgrade-anggota";
        };
    }

    // Tombol ubah profil di header
    const btnEditTamu = document.getElementById("btnEditTamu");
    if (btnEditTamu) {
        btnEditTamu.onclick = async () => {
            // ... (kode edit profil tetap sama)
            alert("Fitur ubah profil akan segera hadir!");
        };
    }

    // Tombol buat laporan utama (besar)
    const btnBuatLaporanUtama = document.getElementById("btnBuatLaporanUtama");
    if (btnBuatLaporanUtama) {
        btnBuatLaporanUtama.onclick = () => {
            showFormLaporanInModal(user);
        };
    }

    // Tombol buat laporan di header (kecil)
    const btnBuatLaporanHeader = document.getElementById("btnBuatLaporanHeader");
    if (btnBuatLaporanHeader) {
        btnBuatLaporanHeader.onclick = () => {
            showFormLaporanInModal(user);
        };
    }
}

// ===== Function untuk show form laporan di modal =====
function showFormLaporanInModal(user) {
    const modalContainer = document.getElementById('modalContainer') || 
                          (() => {
                              const div = document.createElement('div');
                              div.id = 'modalContainer';
                              document.body.appendChild(div);
                              return div;
                          })();
    
    showFormLaporan(user, modalContainer, () => {
        console.log('Form laporan selesai, refreshing grid...');
        loadLaporanGrid();
        refreshMapMarkers();
        updateStats();
    });
}

// ===== Function untuk init map dan markers =====
function initMapAndMarkers() {
    const map = initMap("map");
    window.dashboardMap = map;
    refreshMapMarkers();
}

// ===== Function untuk refresh markers di peta =====
async function refreshMapMarkers() {
    if (!window.dashboardMap) return;
    
    // Clear existing markers
    if (window.dashboardMarkers) {
        window.dashboardMarkers.forEach(marker => marker.remove());
        window.dashboardMarkers = [];
    }
    
    try {
        const response = await fetch(API.laporanSampah, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const laporan = await response.json();
            window.dashboardMarkers = [];
            
            laporan.forEach(item => {
                if (!item.latitude || !item.longitude) return;
                
                // Tentukan warna marker berdasarkan status (hanya 3 status)
                const status = (item.status || 'pending').toLowerCase();
                let markerColor = '#ffc107'; // default untuk pending (warning/kuning)
                let statusLabel = 'MENUNGGU';
                
                // Hanya ada 3 status: pending, proses, selesai
                if (status === 'selesai') {
                    markerColor = '#28a745'; // green (lebih terang dari #198754)
                    statusLabel = 'SELESAI';
                } else if (status === 'proses') {
                    markerColor = '#17a2b8'; // cyan (lebih cocok untuk lingkungan)
                    statusLabel = 'DIPROSES';
                } else if (status === 'pending') {
                    markerColor = '#ffc107'; // yellow/warning
                    statusLabel = 'MENUNGGU';
                }
                
                // Format tanggal
                const tanggal = item.tanggal_lapor ? 
                    new Date(item.tanggal_lapor).toLocaleDateString('id-ID', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    }) : 'Tanggal tidak tersedia';
                
                // Buat konten popup dengan tema hijau
                const popupContent = `
                    <div style="max-width: 300px; font-family: 'Segoe UI', Arial, sans-serif;">
                        <div style="display: flex; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 2px solid #e9ecef;">
                            <div style="width: 14px; height: 14px; background-color: ${markerColor}; border-radius: 50%; margin-right: 10px; border: 2px solid white; box-shadow: 0 0 0 1px ${markerColor}"></div>
                            <strong style="font-size: 15px; color: #2e7d32; flex-grow: 1;">${item.nama || 'Anonim'}</strong>
                        </div>
                        
                        <div style="margin-bottom: 12px;">
                            <span style="background-color: ${markerColor}; color: ${status === 'pending' ? '#212529' : '#fff'}; 
                                   padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; 
                                   display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <i class="bi bi-circle-fill" style="font-size: 8px; vertical-align: middle; margin-right: 5px;"></i>
                                ${statusLabel}
                            </span>
                        </div>
                        
                        <div style="font-size: 13px; color: #495057; margin-bottom: 12px; line-height: 1.5;">
                            <div style="margin-bottom: 6px; display: flex; align-items: center;">
                                <i class="bi bi-calendar" style="color: #6c757d; margin-right: 8px; width: 16px;"></i>
                                <span><strong>Tanggal:</strong> ${tanggal}</span>
                            </div>
                            ${item.nama_user ? `
                                <div style="margin-bottom: 6px; display: flex; align-items: center;">
                                    <i class="bi bi-person" style="color: #6c757d; margin-right: 8px; width: 16px;"></i>
                                    <span><strong>Pelapor:</strong> ${item.nama_user}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div style="font-size: 13px; color: #495057; margin-bottom: 12px;">
                            <div style="display: flex; align-items: flex-start; margin-bottom: 4px;">
                                <i class="bi bi-geo-alt" style="color: #6c757d; margin-right: 8px; width: 16px; margin-top: 2px;"></i>
                                <div>
                                    <strong style="color: #2e7d32;">Lokasi:</strong><br>
                                    <div style="margin-top: 2px; color: #343a40;">${item.alamat || 'Tidak ada alamat'}</div>
                                </div>
                            </div>
                        </div>
                        
                        ${item.deskripsi ? `
                            <div style="font-size: 13px; color: #495057; margin-bottom: 12px;">
                                <div style="display: flex; align-items: flex-start;">
                                    <i class="bi bi-chat-text" style="color: #6c757d; margin-right: 8px; width: 16px; margin-top: 2px;"></i>
                                    <div>
                                        <strong style="color: #2e7d32;">Deskripsi:</strong><br>
                                        <div style="margin-top: 2px; color: #343a40; font-style: italic; background-color: #f8f9fa; padding: 8px; border-radius: 4px; border-left: 3px solid ${markerColor};">
                                            "${item.deskripsi.substring(0, 100)}${item.deskripsi.length > 100 ? '...' : ''}"
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${item.foto_bukti_url || item.foto_bukti ? `
                            <div style="margin-bottom: 12px; text-align: center;">
                                <div style="font-size: 12px; color: #6c757d; margin-bottom: 5px;">
                                    <i class="bi bi-image me-1"></i>Foto Bukti:
                                </div>
                                <img src="${item.foto_bukti_url || item.foto_bukti}" 
                                     alt="Foto bukti" 
                                     style="width: 100%; max-height: 150px; object-fit: cover; border-radius: 6px; border: 2px solid #dee2e6; cursor: pointer;"
                                     onclick="this.style.maxHeight = this.style.maxHeight === 'none' ? '150px' : 'none'">
                            </div>
                        ` : ''}
                        
                        <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 2px solid #e9ecef;">
                            <button onclick="
                                if (window.showLaporanOnMap) {
                                    window.showLaporanOnMap(${item.latitude}, ${item.longitude}, '${item.deskripsi?.replace(/'/g, "\\'") || ''}');
                                }
                            " style="background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%); color: white; border: none; padding: 8px 20px; border-radius: 6px; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 3px 6px rgba(46, 125, 50, 0.2);">
                                <i class="bi bi-map"></i> Lihat Detail di Peta
                            </button>
                        </div>
                    </div>
                `;
                
                // Buat marker dengan warna sesuai status
                const marker = addMarker(
                    window.dashboardMap, 
                    item.latitude, 
                    item.longitude, 
                    popupContent,
                    markerColor
                );
                
                if (marker) {
                    window.dashboardMarkers.push(marker);
                }
            });
            
            // Tambahkan legenda untuk 3 status
            addMapLegend();
            
            console.log(`✅ Loaded ${window.dashboardMarkers.length} markers to map (3 status colors)`);
        }
    } catch (error) {
        console.error('Error refreshing map markers:', error);
    }
}

// ===== Fungsi untuk menambahkan legenda di peta =====
function addMapLegend() {
    if (!window.dashboardMap) return;
    
    // Hapus legenda sebelumnya jika ada
    if (window.mapLegend) {
        window.mapLegend.remove();
    }
    
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.backgroundColor = 'white';
        div.style.padding = '12px 15px';
        div.style.borderRadius = '8px';
        div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        div.style.fontSize = '13px';
        div.style.fontFamily = "'Segoe UI', Arial, sans-serif";
        div.style.border = '2px solid #2e7d32';
        div.style.maxWidth = '220px';
        
        const statusColors = [
            { status: 'SELESAI', color: '#28a745', icon: '✅', desc: 'Laporan sudah ditangani' },
            { status: 'DIPROSES', color: '#17a2b8', icon: '🔄', desc: 'Sedang dalam penanganan' },
            { status: 'MENUNGGU', color: '#ffc107', icon: '⏳', desc: 'Menunggu penanganan' }
        ];
        
        let html = `
            <div style="display: flex; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 2px solid #e9ecef;">
                <div style="background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%); color: white; padding: 6px 10px; border-radius: 6px; margin-right: 10px;">
                    <i class="bi bi-info-circle"></i>
                </div>
                <strong style="color: #2e7d32; font-size: 14px;">Legenda Status Laporan</strong>
            </div>
        `;
        
        statusColors.forEach(item => {
            html += `
                <div style="display: flex; align-items: flex-start; margin: 10px 0; padding: 8px 0;">
                    <div style="width: 18px; height: 18px; background-color: ${item.color}; border-radius: 50%; margin-right: 12px; margin-top: 2px; border: 2px solid white; box-shadow: 0 0 0 1px ${item.color};"></div>
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; margin-bottom: 3px;">
                            <span style="font-weight: 600; color: #343a40; margin-right: 8px;">${item.status}</span>
                            <span style="font-size: 14px;">${item.icon}</span>
                        </div>
                        <div style="font-size: 11px; color: #6c757d;">${item.desc}</div>
                    </div>
                </div>
            `;
        });
        
        html += `
            <div style="margin-top: 15px; padding-top: 12px; border-top: 2px solid #e9ecef; font-size: 11px; color: #495057; text-align: center;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; color: #2e7d32;">
                        <i class="bi bi-pin-map me-1"></i>Total:
                    </span>
                    <span style="background: #2e7d32; color: white; padding: 2px 10px; border-radius: 12px; font-weight: bold;">
                        ${window.dashboardMarkers?.length || 0} laporan
                    </span>
                </div>
                <div style="margin-top: 8px; font-size: 10px; color: #6c757d;">
                    <i class="bi bi-info-circle me-1"></i>Klik marker untuk detail
                </div>
            </div>
        `;
        
        div.innerHTML = html;
        return div;
    };
    
    legend.addTo(window.dashboardMap);
    window.mapLegend = legend;
}

// ===== Grid laporan sampah dengan tema hijau =====
async function loadLaporanGrid() {
    const grid = document.getElementById("laporanGrid");
    if (!grid) return;

    // Tampilkan loading
    grid.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-success" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-muted mt-3">Memuat data laporan...</p>
        </div>
    `;
    
    try {
        const response = await fetch(API.laporanSampah, {
            headers: getAuthHeaders()
        });
        
        console.log('Laporan response status:', response.status);
        
        // Cek jika response bukan JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Response is not JSON:', text.substring(0, 200));
            
            grid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger text-center">
                        <h4 class="alert-heading">
                            <i class="bi bi-exclamation-triangle me-2"></i>Error Loading Data
                        </h4>
                        <p>Server returned non-JSON response. Status: ${response.status}</p>
                        <button onclick="loadLaporanGrid()" class="btn btn-success mt-2">
                            <i class="bi bi-arrow-clockwise me-2"></i> Coba Lagi
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error:', errorText);
            
            grid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger text-center">
                        <h4 class="alert-heading">
                            <i class="bi bi-exclamation-triangle me-2"></i>Error ${response.status}
                        </h4>
                        <p>${errorText || response.statusText}</p>
                        <button onclick="loadLaporanGrid()" class="btn btn-success mt-2">
                            <i class="bi bi-arrow-clockwise me-2"></i> Coba Lagi
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        const laporan = await response.json();
        console.log('✅ Laporan loaded:', laporan.length, 'items');

        if (!laporan || !Array.isArray(laporan) || laporan.length === 0) {
            grid.innerHTML = `
                <div class="col-12">
                    <div class="text-center py-5 bg-light rounded-3">
                        <div class="bg-success bg-opacity-10 p-4 rounded-circle d-inline-block mb-3">
                            <i class="bi bi-inbox text-success display-4"></i>
                        </div>
                        <h3 class="text-muted mb-3">Belum Ada Laporan</h3>
                        <p class="text-muted mb-4">
                            Jadilah yang pertama melaporkan lokasi sampah di sekitar Anda!
                        </p>
                        <button onclick="showFormLaporanInModal(window.userData)" class="btn btn-success btn-lg">
                            <i class="bi bi-plus-circle me-2"></i> Buat Laporan Pertama
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        // Kosongkan grid
        grid.innerHTML = "";
        
        // Sort by date (newest first)
        const sortedLaporan = [...laporan].sort((a, b) => 
            new Date(b.tanggal_lapor || 0) - new Date(a.tanggal_lapor || 0)
        );
        
        // Render each report dengan Bootstrap
        sortedLaporan.forEach((item, index) => {
            const isNew = index < 3;
            const tanggal = item.tanggal_lapor ? 
                new Date(item.tanggal_lapor).toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                }) : 'Tanggal tidak tersedia';
            
            // Status badge color - PERBAIKAN untuk tema hijau
            const status = (item.status || 'pending').toLowerCase();
            let statusClass = 'bg-warning text-dark'; // default untuk pending
            let statusIcon = '⏳';
            
            if (status === 'selesai') {
                statusClass = 'bg-success text-white';
                statusIcon = '✅';
            } else if (status === 'proses') {
                statusClass = 'bg-info text-white';
                statusIcon = '🔄';
            }
            
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4';
            col.innerHTML = `
                <div class="card h-100 ${isNew ? 'border-success border-3 shadow' : 'border-light shadow-sm'} hover-shadow" 
                     style="transition: transform 0.2s, box-shadow 0.2s;" 
                     onmouseover="this.style.transform='translateY(-5px)';" 
                     onmouseout="this.style.transform='translateY(0)';">
                    ${item.foto_bukti_url || item.foto_bukti ? `
                        <div style="position: relative;">
                            <img src="${item.foto_bukti_url || item.foto_bukti}" 
                                 class="card-img-top" 
                                 alt="Foto bukti"
                                 style="height: 200px; object-fit: cover; border-top-left-radius: 6px; border-top-right-radius: 6px;">
                            ${isNew ? `
                                <div style="position: absolute; top: 10px; left: 10px; background: rgba(46, 125, 50, 0.9); color: white; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                                    <i class="bi bi-star-fill me-1"></i>BARU
                                </div>
                            ` : ''}
                        </div>
                    ` : `
                        <div class="card-img-top d-flex align-items-center justify-content-center bg-light" 
                             style="height: 200px; border-top-left-radius: 6px; border-top-right-radius: 6px;">
                            <div class="text-center">
                                <div class="bg-success bg-opacity-10 p-3 rounded-circle d-inline-block mb-2">
                                    <i class="bi bi-image text-success fs-1"></i>
                                </div>
                                <p class="text-muted small mb-0">Tidak ada foto</p>
                            </div>
                        </div>
                    `}
                    
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title mb-0 text-success fw-bold">
                                ${item.nama || 'Anonim'}
                            </h5>
                            <span class="badge ${statusClass} d-flex align-items-center">
                                <span style="font-size: 12px; margin-right: 4px;">${statusIcon}</span>
                                ${status.toUpperCase()}
                            </span>
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <small class="text-muted">
                                <i class="bi bi-calendar me-1"></i> ${tanggal}
                            </small>
                            ${item.nama_user ? 
                                `<small class="text-muted">
                                    <i class="bi bi-person me-1"></i> ${item.nama_user}
                                </small>` 
                                : ''
                            }
                        </div>
                        
                        <div class="mb-3">
                            <h6 class="small text-muted mb-1">
                                <i class="bi bi-geo-alt me-1"></i> Lokasi
                            </h6>
                            <p class="card-text small mb-0" style="color: #495057;">${item.alamat || 'Tidak ada alamat'}</p>
                        </div>
                        
                        ${item.deskripsi ? `
                            <div class="mb-3">
                                <h6 class="small text-muted mb-1">
                                    <i class="bi bi-chat-text me-1"></i> Deskripsi
                                </h6>
                                <p class="card-text small mb-0" style="color: #495057;">${item.deskripsi.substring(0, 100)}${item.deskripsi.length > 100 ? '...' : ''}</p>
                            </div>
                        ` : ''}
                        
                        <div class="mt-auto pt-3">
                            ${item.latitude && item.longitude ? `
                                <button onclick="showLaporanOnMap(${item.latitude}, ${item.longitude}, '${item.deskripsi?.replace(/'/g, "\\'") || ''}')" 
                                        class="btn btn-outline-success btn-sm w-100 d-flex align-items-center justify-content-center">
                                    <i class="bi bi-map me-2"></i> Lihat di Peta
                                </button>
                            ` : `
                                <div class="alert alert-warning py-2 mb-0 text-center small">
                                    <i class="bi bi-exclamation-triangle me-1"></i> Tidak ada lokasi
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            `;
            
            grid.appendChild(col);
        });
        
        // Add timestamp dengan tema hijau
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'col-12';
        timestampDiv.innerHTML = `
            <div class="text-center mt-4 p-3 bg-light rounded-3 border-start border-5 border-success">
                <div class="d-flex align-items-center justify-content-center">
                    <div class="bg-success bg-opacity-10 p-2 rounded me-3">
                        <i class="bi bi-clock-history text-success"></i>
                    </div>
                    <div>
                        <small class="text-muted d-block">Menampilkan ${sortedLaporan.length} laporan</small>
                        <small class="text-success fw-semibold">Diperbarui: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA</small>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(timestampDiv);
        
    } catch (err) { 
        console.error("Gagal load grid laporan:", err); 
        grid.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning text-center">
                    <div class="bg-warning bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                        <i class="bi bi-wifi-off text-warning fs-1"></i>
                    </div>
                    <h4 class="alert-heading text-dark">
                        <i class="bi bi-exclamation-triangle me-2"></i> Koneksi Error
                    </h4>
                    <p class="text-dark">${err.message}</p>
                    <div class="mt-3">
                        <button onclick="location.reload()" class="btn btn-outline-success me-2">
                            <i class="bi bi-arrow-clockwise me-2"></i> Refresh Page
                        </button>
                        <button onclick="loadLaporanGrid()" class="btn btn-success">
                            <i class="bi bi-list-ul me-2"></i> Load Laporan
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// ===== Fungsi untuk update stats =====
async function updateStats() {
    try {
        const response = await fetch(API.laporanSampah, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const laporan = await response.json();
            const completed = laporan.filter(item => item.status === 'selesai').length;
            const pending = laporan.filter(item => item.status === 'pending').length;
            const active = laporan.length;
            
            const activeEl = document.getElementById('activeReports');
            const completedEl = document.getElementById('completedReports');
            const pendingEl = document.getElementById('pendingReports');
            
            if (activeEl) activeEl.textContent = active;
            if (completedEl) completedEl.textContent = completed;
            if (pendingEl) pendingEl.textContent = pending;
        }
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// ===== Helper function untuk showLaporanOnMap dengan tema hijau =====
window.showLaporanOnMap = function(latitude, longitude, deskripsi = '') {
    const modal = document.createElement('div');
    modal.id = 'mapModal';
    modal.innerHTML = `
        <div class="modal fade" id="staticMapModal" tabindex="-1" aria-labelledby="mapModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content border-success border-3">
                    <div class="modal-header text-white" style="background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%);">
                        <h5 class="modal-title" id="mapModalLabel">
                            <i class="bi bi-geo-alt-fill me-2"></i> Lokasi Laporan Sampah
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${deskripsi ? `
                            <div class="alert alert-info mb-3 border-start border-5 border-info">
                                <i class="bi bi-info-circle me-2"></i>
                                <strong>Deskripsi:</strong> ${deskripsi}
                            </div>
                        ` : ''}
                        <div id="detailMap" style="height: 400px; border-radius: 8px; overflow: hidden; border: 1px solid #dee2e6;"></div>
                        <div class="mt-3 text-center">
                            <div class="badge bg-success p-2">
                                <i class="bi bi-geo-alt me-1"></i>
                                Koordinat: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-2"></i> Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Initialize modal
    const mapModal = new bootstrap.Modal(document.getElementById('staticMapModal'));
    mapModal.show();
    
    // Load map after modal is shown
    document.getElementById('staticMapModal').addEventListener('shown.bs.modal', function () {
        loadLeaflet(() => {
            const map = initMap("detailMap", latitude, longitude, 15);
            addMarker(map, latitude, longitude, deskripsi || "Lokasi Laporan", '#28a745');
        });
    });
    
    // Cleanup modal after hidden
    document.getElementById('staticMapModal').addEventListener('hidden.bs.modal', function () {
        modal.remove();
    });
};

// ===== Export function agar bisa dipanggil dari luar =====
window.loadLaporanGrid = loadLaporanGrid;
window.refreshLaporanGrid = loadLaporanGrid;
window.refreshMapMarkers = refreshMapMarkers;