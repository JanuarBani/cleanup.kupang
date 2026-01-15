import { API, getAuthHeaders, fetchAPI } from "../api.js";
import { authGuard } from "../utils/authGuard.js";
import {
  loadLeaflet,
  initMap,
  addMarker,
  initMapForm,
} from "../utils/mapConfig.js";
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
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- Navigation Bar -->
    <nav class="navbar navbar-expand-lg navbar-dark" style="background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%); box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div class="container-fluid" style="max-width: 1300px; margin: 0 auto; padding: 0 15px;">
            <a class="navbar-brand fw-bold d-flex align-items-center" href="#/dashboard">
                <!-- LOGO CLEANUP KUPANG -->
                <div class="d-flex align-items-center">
                    <img src="/logo/logo_3d.png" 
                         alt="CleanUp Kupang Logo" 
                         style="height: 40px; width: auto; margin-right: 10px;">
                    <span>CleanUp Kupang</span>
                </div>
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
                        <a class="nav-link" id="btnBuatLaporanNav" href="#/buat-laporan">
                            <i class="bi bi-list-check me-1"></i>Buat Laporan Sampah
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#/upgrade-anggota">
                            <i class="bi bi-star-fill me-1"></i>Upgrade Anggota
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#/analisis-dampak">
                            <i class="bi bi-graph-up me-1"></i> Analisis Sistem
                        </a>
                    </li>
                    <!-- Menu Bantuan dan Tentang dihapus sesuai permintaan -->
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
                            <li><a class="dropdown-item" onclick="showProfileModal(); return false;">
                                <i class="bi bi-person-gear me-2"></i>Lihat Profil
                            </a></li>
                            
                            <!-- Tambahkan notifikasi dropdown -->
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <a class="dropdown-item" href="#" id="tamu-toggleNotificationsBtn">
                                    <i class="bi bi-bell-slash me-2" id="tamu-bellIcon"></i>
                                    <span id="tamu-bellText">Aktifkan Notifikasi</span>
                                </a>
                            </li>

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
        <!-- Welcome Card dengan informasi CleanUp -->
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
                    <small class="d-block mt-2">
                        <i class="bi bi-quote me-1"></i>
                        <em>🚮 INGAT SAMPAH INGAT CleanUp</em>
                    </small>
                </div>
                <div class="d-flex gap-2">
                    <button id="btnBuatLaporanHeader" class="btn btn-warning btn-sm">
                        <i class="bi bi-plus-circle me-1"></i> Buat Laporan
                    </button>
                </div>
            </div>
        </div>

        <!-- Banner Informasi CleanUp DENGAN LOGO -->
        <div class="card mb-4 shadow-sm" style="border-left: 5px solid #2e7d32;">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-2 text-center mb-3 mb-md-0">
                        <!-- LOGO CLEANUP di Banner -->
                        <div class="bg-success p-3 rounded-circle d-inline-block">
                            <img src="/logo/logo_3d.png" 
                                 alt="CleanUp Kupang Logo" 
                                 style="height:60px; object-fit:contain;">
                        </div>
                    </div>
                    <div class="col-md-10">
                        <h4 class="card-title text-success mb-2">
                            <strong>CleanUp Kupang</strong> - Jasa Angkut Sampah Depan Rumah Anda
                        </h4>
                        <p class="card-text mb-2">
                            <i class="bi bi-quote text-success me-1"></i>
                            Kami mulai dari kesadaran kami melihat <strong>SAMPAH KOTA KUPANG</strong> yang semakin parah setiap hari.
                            <strong class="text-danger">EST 2025</strong>
                        </p>
                        <div class="d-flex flex-wrap gap-2 mt-3">
                            <span class="badge bg-success">"Kaka Buang, Beta Angkut"</span>
                            <span class="badge bg-warning text-dark">Sampah dibuang langsung ke TPA</span>
                            <span class="badge bg-info">Tanpa menumpuk di kotak sampah</span>
                        </div>
                    </div>
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

        <!-- Daftar Laporan Sampah Terbaru DENGAN PAGINATION -->
        <div class="card mb-4 border-success shadow-sm">
            <div class="card-header bg-success text-white d-flex align-items-center">
                <i class="bi bi-list-ul me-2 fs-5"></i>
                <h2 class="card-title h5 mb-0 fw-bold">Laporan Terbaru</h2>
            </div>
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <p class="text-muted small mb-0">
                        <i class="bi bi-info-circle me-1"></i>
                        Daftar laporan sampah terbaru yang dibuat oleh warga (10 laporan per halaman)
                    </p>
                    <div class="d-flex gap-2">
                        <button onclick="loadLaporanGrid(1)" class="btn btn-outline-success btn-sm">
                            <i class="bi bi-arrow-clockwise me-1"></i> Refresh
                        </button>
                        <a href="#/semua-laporan" class="btn btn-success btn-sm">
                            <i class="bi bi-list-stars me-1"></i> Lihat Semua
                        </a>
                    </div>
                </div>
                <div id="laporanGrid" class="row g-3"></div>
                
                <!-- Pagination Controls -->
                <div class="row mt-4">
                    <div class="col-12">
                        <nav aria-label="Laporan pagination">
                            <ul class="pagination justify-content-center mb-0" id="laporanPagination">
                                <!-- Pagination akan diisi oleh JavaScript -->
                            </ul>
                        </nav>
                        <div class="text-center mt-2">
                            <small class="text-muted" id="paginationInfo">Menampilkan 0-0 dari 0 laporan</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Upgrade Banner dengan informasi lengkap CleanUp -->
        <div class="card mb-4 shadow-sm"
        style="background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
                color: white; border: none; cursor: pointer;"
        onclick="window.location.hash = '#/upgrade-anggota'">
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
                
                <!-- Informasi Keunggulan CleanUp -->
                <div class="alert alert-light mt-4" style="background: rgba(255,255,255,0.9);">
                    <h6 class="fw-bold text-success mb-3">
                        <i class="bi bi-star-fill me-2"></i>Mengapa harus CleanUp Kupang?
                    </h6>
                    <div class="row g-2">
                        <div class="col-md-6">
                            <div class="d-flex align-items-start mb-2">
                                <div class="bg-success bg-opacity-10 p-2 rounded me-2">
                                    <i class="bi bi-award text-success"></i>
                                </div>
                                <div>
                                    <small class="fw-semibold text-dark">Sertifikasi dan Izin</small>
                                    <p class="mb-0 small">CleanUp memiliki sertifikasi dan izin resmi untuk pengangkutan sampah</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="d-flex align-items-start mb-2">
                                <div class="bg-success bg-opacity-10 p-2 rounded me-2">
                                    <i class="bi bi-building text-success"></i>
                                </div>
                                <div>
                                    <small class="fw-semibold text-dark">Turut Membangun Daerah</small>
                                    <p class="mb-0 small">Bergabung bersama CleanUp, Anda ikut membayar Retribusi daerah (Perda No. 1 Tahun 2024)</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="d-flex align-items-start mb-2">
                                <div class="bg-success bg-opacity-10 p-2 rounded me-2">
                                    <i class="bi bi-truck text-success"></i>
                                </div>
                                <div>
                                    <small class="fw-semibold text-dark">Armada Memadai</small>
                                    <p class="mb-0 small">CleanUp memiliki armada yang memadai dan terawat untuk mengangkut sampah</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="d-flex align-items-start mb-2">
                                <div class="bg-success bg-opacity-10 p-2 rounded me-2">
                                    <i class="bi bi-tree text-success"></i>
                                </div>
                                <div>
                                    <small class="fw-semibold text-dark">Pedili Lingkungan</small>
                                    <p class="mb-0 small">CleanUp berkomitmen mengurangi dampak lingkungan dari pengangkutan sampah</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Peringatan Sampah Menumpuk -->
                <div class="alert alert-warning mt-3" style="background: rgba(255,193,7,0.1); border-left: 4px solid #ffc107;">
                    <div class="d-flex align-items-start">
                        <i class="bi bi-exclamation-triangle-fill text-warning fs-5 me-3"></i>
                        <div>
                            <h6 class="fw-bold mb-2 text-dark">Kasian kan kalo sampah sampai numpuk begini di komplek atau halaman kita?</h6>
                            <p class="mb-0 small text-dark">
                                Jangan biarkan sampah menumpuk! Bergabung dengan CleanUp untuk lingkungan yang lebih bersih dan sehat.
                            </p>
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

        <!-- Footer dengan kontak CleanUp dan LOGO -->
        <div class="card border-success shadow-sm">
            <div class="card-header bg-success text-white d-flex align-items-center">
                <i class="bi bi-telephone me-2 fs-5"></i>
                <h2 class="card-title h5 mb-0 fw-bold">Kontak & Informasi CleanUp Kupang</h2>
            </div>
            <div class="card-body">
                <!-- Header Footer dengan Logo -->
                <div class="text-center mb-4">
                    <img src="/logo/logo_3d.png" 
                         alt="CleanUp Kupang Logo" 
                         style="height: 80px; width: auto; margin-bottom: 15px;">
                    <h4 class="text-success fw-bold mb-2">CleanUp Kupang</h4>
                    <p class="text-muted mb-0">Layanan Angkut Sampah Rumah Tangga Langsung ke TPA</p>
                </div>
                
                <!-- Kontak Utama -->
                <div class="row mb-4">
                    <div class="col-md-6 mb-3">
                        <div class="d-flex align-items-center p-3 bg-light rounded-3 h-100">
                            <div class="bg-success bg-opacity-10 p-3 rounded me-3">
                                <i class="bi bi-whatsapp text-success fs-4"></i>
                            </div>
                            <div>
                                <small class="text-muted d-block fw-semibold">WhatsApp Langsung</small>
                                <strong class="text-dark">082-341-743-886</strong>
                                <p class="small text-muted mb-0 mt-1">Klik untuk chat langsung via WhatsApp</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <div class="d-flex align-items-center p-3 bg-light rounded-3 h-100">
                            <div class="bg-success bg-opacity-10 p-3 rounded me-3">
                                <i class="bi bi-envelope text-success fs-4"></i>
                            </div>
                            <div>
                                <small class="text-muted d-block fw-semibold">Email</small>
                                <strong class="text-dark">admin@cleanupkupang.id</strong>
                                <p class="small text-muted mb-0 mt-1">Untuk pertanyaan dan informasi</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Sosial Media -->
                <div class="row mb-4">
                    <div class="col-12">
                        <h6 class="fw-bold text-success mb-3">
                            <i class="bi bi-globe me-2"></i>Ikuti Kami di Sosial Media
                        </h6>
                        <div class="d-flex flex-wrap gap-3">
                            <!-- Instagram -->
                            <a href="https://instagram.com/cleanUp_officiall" target="_blank" class="btn btn-outline-success btn-sm d-flex align-items-center">
                                <i class="bi bi-instagram me-2"></i> @cleanUp_officiall
                            </a>
                            <!-- Facebook (Link diperbaiki) -->
                            <a href="https://facebook.com/CleanUpKupang" target="_blank" class="btn btn-outline-primary btn-sm d-flex align-items-center">
                                <i class="bi bi-facebook me-2"></i> CleanUp Kupang
                            </a>
                            <!-- TikTok (Ditambahkan) -->
                            <a href="https://www.tiktok.com/@cleanp.kupang5" target="_blank" class="btn btn-outline-dark btn-sm d-flex align-items-center">
                                <i class="bi bi-tiktok me-2"></i> @cleanp.kupang5
                            </a>
                        </div>
                    </div>
                </div>
                
                <!-- Jam Operasional -->
                <div class="alert alert-success mt-3">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-clock-history me-2 fs-4"></i>
                        <div>
                            <strong class="d-block">Jam Operasional:</strong>
                            <span class="small">Senin - Rabu (08:00 - 18:00 WITA)</span>
                        </div>
                    </div>
                </div>
                
                <!-- Motto dan Slogan -->
                <div class="text-center mt-4 p-3 bg-light rounded-3">
                    <h5 class="text-success fw-bold mb-2">
                        <i class="bi bi-quote me-2"></i>INGAT SAMPAH INGAT CLEANUP
                    </h5>
                    <p class="text-muted small mb-0">
                        "Kaka Buang, Beta Angkut" - Layanan angkut sampah rumah tangga langsung ke TPA
                    </p>
                    <div class="mt-3">
                        <span class="badge bg-success">CleanUp Kupang</span>
                        <span class="badge bg-warning text-dark">EST 2025</span>
                        <span class="badge bg-info">Jasa Angkut Sampah</span>
                    </div>
                </div>
                
                <!-- Footer Hak Cipta dengan Logo Kecil -->
                <div class="text-center mt-4 pt-3 border-top">
                    <div class="d-flex align-items-center justify-content-center mb-3">
                        <img src="/logo/logo_3d.png" 
                             alt="CleanUp Kupang Logo" 
                             style="height: 30px; width: auto; margin-right: 10px;">
                        <p class="text-muted small mb-0">
                            &copy; 2025 CleanUp Kupang. Semua hak dilindungi undang-undang.
                        </p>
                    </div>
                    <div class="d-flex justify-content-center gap-3 flex-wrap">
                        <a href="#/syarat-ketentuan" class="text-success text-decoration-none small">Syarat & Ketentuan</a>
                        <a href="#/kebijakan-privasi" class="text-success text-decoration-none small">Kebijakan Privasi</a>
                        <a href="#/faq" class="text-success text-decoration-none small">FAQ</a>
                        <a href="#/tentang" class="text-success text-decoration-none small">Tentang Kami</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

  // TAMBAHKAN INI: Buat modalContainer setelah render HTML
  if (!document.getElementById("modalContainer")) {
    const modalContainer = document.createElement("div");
    modalContainer.id = "modalContainer";
    document.body.appendChild(modalContainer);
  }

  // Event handlers setup
  setupEventHandlers(user);

  // Load Leaflet dan peta dashboard
  loadLeaflet(() => {
    initMapAndMarkers();
  });

  // Load grid laporan pertama kali (halaman 1)
  loadLaporanGrid(1);

  // Update stats setelah semua data dimuat
  setTimeout(updateStats, 1500);

  // Tambahkan kode setup notifikasi di akhir dashboardTamu():
  async function setupTamuNotifications() {
    try {
      // Import dan initialize
      const { tamuNotifications } = await import(
        "../utils/tamuNotifications.js"
      );
      await tamuNotifications.setupDashboardIntegration();

      console.log("✅ Tamu notifications setup complete");
    } catch (error) {
      console.error("❌ Error setting up tamu notifications:", error);
    }
  }

  // Panggil setelah semua DOM selesai di-render
  setTimeout(() => {
    setupTamuNotifications();
  }, 1000);
}

async function updateNotificationUI() {
  const icon = document.getElementById("tamu-bellIcon");
  const text = document.getElementById("tamu-bellText");

  if (!icon || !text) return;

  try {
    const isSubscribed = await webPushManager.checkSubscription();

    if (isSubscribed) {
      icon.className = "bi bi-bell-fill me-2 text-warning";
      text.textContent = "Nonaktifkan Notifikasi";
    } else {
      icon.className = "bi bi-bell-slash me-2";
      text.textContent = "Aktifkan Notifikasi";
    }
  } catch (err) {
    console.error("❌ Gagal cek status notifikasi", err);
  }
}

document.addEventListener("DOMContentLoaded", updateNotificationUI);

// ===== Setup Event Handlers =====
function setupEventHandlers(user) {
  // Simpan user ke window untuk akses global
  window.userData = user;

  // Tombol logout
  const navLogout = document.getElementById("navLogout");
  if (navLogout) {
    navLogout.onclick = () => {
      if (typeof window.logout === "function") {
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
      showFormLaporanInModal(user);
    };
  }

  const btnEditTamu = document.getElementById("btnEditTamu");
  if (btnEditTamu) {
    btnEditTamu.onclick = () => {
      window.location.hash = "#/profile";
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

  const btnBuatLaporanNav = document.getElementById("btnBuatLaporanNav");
  if (btnBuatLaporanNav) {
    btnBuatLaporanNav.onclick = (e) => {
      showFormLaporanInModal(user);
      e.preventDefault();
    };
  }

  // Tombol WhatsApp
  const whatsappButtons = document.querySelectorAll(
    '[href*="082-341-743-886"]'
  );
  whatsappButtons.forEach((btn) => {
    btn.onclick = (e) => {
      e.preventDefault();
      window.open(
        `https://wa.me/6282341743886?text=Halo%20CleanUp%20Kupang,%20saya%20ingin%20bertanya%20tentang%20layanan%20angkut%20sampah`,
        "_blank"
      );
    };
  });
}

// ===== Function untuk show form laporan di modal =====
function showFormLaporanInModal(user) {
  const modalContainer =
    document.getElementById("modalContainer") ||
    (() => {
      const div = document.createElement("div");
      div.id = "modalContainer";
      document.body.appendChild(div);
      return div;
    })();

  showFormLaporan(user, modalContainer, () => {
    console.log("Form laporan selesai, refreshing grid...");
    loadLaporanGrid(window.currentPage || 1);
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
    window.dashboardMarkers.forEach((marker) => marker.remove());
    window.dashboardMarkers = [];
  }

  // TAMBAHKAN: Simpan data laporan global
  window.allLaporanData = [];

  try {
    const response = await fetch(API.laporanSampah, {
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      const laporan = await response.json();
      window.dashboardMarkers = [];

      // Simpan data lengkap ke window global
      window.allLaporanData = laporan;

      laporan.forEach((item, index) => {
        if (!item.latitude || !item.longitude) return;

        // Tentukan warna marker berdasarkan status (hanya 3 status)
        const status = (item.status || "pending").toLowerCase();
        let markerColor = "#ffc107"; // default untuk pending (warning/kuning)
        let statusLabel = "MENUNGGU";

        // Hanya ada 3 status: pending, proses, selesai
        if (status === "selesai") {
          markerColor = "#28a745"; // green (lebih terang dari #198754)
          statusLabel = "SELESAI";
        } else if (status === "proses") {
          markerColor = "#17a2b8"; // cyan (lebih cocok untuk lingkungan)
          statusLabel = "DIPROSES";
        } else if (status === "pending") {
          markerColor = "#ffc107"; // yellow/warning
          statusLabel = "MENUNGGU";
        }

        // Format tanggal
        const tanggal = item.tanggal_lapor
          ? new Date(item.tanggal_lapor).toLocaleDateString("id-ID", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Tanggal tidak tersedia";

        // Simpan index di atribut data untuk referensi
        const dataIndex = index;

        // Buat konten popup dengan tema hijau
        const popupContent = `
                    <div style="max-width: 300px; font-family: 'Segoe UI', Arial, sans-serif;">
                        <div style="display: flex; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 2px solid #e9ecef;">
                            <div style="width: 14px; height: 14px; background-color: ${markerColor}; border-radius: 50%; margin-right: 10px; border: 2px solid white; box-shadow: 0 0 0 1px ${markerColor}"></div>
                            <strong style="font-size: 15px; color: #2e7d32; flex-grow: 1;">${
                              item.nama || "Anonim"
                            }</strong>
                        </div>
                        
                        <div style="margin-bottom: 12px;">
                            <span style="background-color: ${markerColor}; color: ${
          status === "pending" ? "#212529" : "#fff"
        }; 
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
                            ${
                              item.nama_user
                                ? `
                                <div style="margin-bottom: 6px; display: flex; align-items: center;">
                                    <i class="bi bi-person" style="color: #6c757d; margin-right: 8px; width: 16px;"></i>
                                    <span><strong>Pelapor:</strong> ${item.nama_user}</span>
                                </div>
                            `
                                : ""
                            }
                        </div>
                        
                        
                        ${
                          item.deskripsi
                            ? `
                            <div style="font-size: 13px; color: #495057; margin-bottom: 12px;">
                                <div style="display: flex; align-items: flex-start;">
                                    <i class="bi bi-chat-text" style="color: #6c757d; margin-right: 8px; width: 16px; margin-top: 2px;"></i>
                                    <div>
                                        <strong style="color: #2e7d32;">Deskripsi:</strong><br>
                                        <div style="margin-top: 2px; color: #343a40; font-style: italic; background-color: #f8f9fa; padding: 8px; border-radius: 4px; border-left: 3px solid ${markerColor};">
                                            "${item.deskripsi.substring(
                                              0,
                                              100
                                            )}${
                                item.deskripsi.length > 100 ? "..." : ""
                              }"
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `
                            : ""
                        }
                        
                        ${
                          item.foto_bukti_url || item.foto_bukti
                            ? `
                            <div style="margin-bottom: 12px; text-align: center;">
                                <div style="font-size: 12px; color: #6c757d; margin-bottom: 5px;">
                                    <i class="bi bi-image me-1"></i>Foto Bukti:
                                </div>
                                <img src="${
                                  item.foto_bukti_url || item.foto_bukti
                                }" 
                                     alt="Foto bukti" 
                                     style="width: 100%; max-height: 150px; object-fit: cover; border-radius: 6px; border: 2px solid #dee2e6; cursor: pointer;"
                                     onclick="this.style.maxHeight = this.style.maxHeight === 'none' ? '150px' : 'none'">
                            </div>
                        `
                            : ""
                        }
                        
                        <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 2px solid #e9ecef;">
                            <button onclick="showLaporanDetail(${dataIndex})" 
                                    style="background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%); color: white; border: none; padding: 8px 20px; border-radius: 6px; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 3px 6px rgba(46, 125, 50, 0.2);">
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
          // Simpan data ke marker untuk referensi
          marker.dataIndex = dataIndex;
          window.dashboardMarkers.push(marker);
        }
      });

      // Tambahkan legenda untuk 3 status
      addMapLegend();

      console.log(
        `✅ Loaded ${window.dashboardMarkers.length} markers to map (3 status colors)`
      );
    }
  } catch (error) {
    console.error("Error refreshing map markers:", error);
  }
}

// ===== Fungsi untuk menambahkan legenda di peta =====
function addMapLegend() {
  if (!window.dashboardMap) return;

  // Hapus legenda sebelumnya jika ada
  if (window.mapLegend) {
    window.mapLegend.remove();
  }

  const legend = L.control({ position: "bottomright" });

  legend.onAdd = function (map) {
    const div = L.DomUtil.create("div", "info legend");
    div.style.backgroundColor = "white";
    div.style.padding = "12px 15px";
    div.style.borderRadius = "8px";
    div.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    div.style.fontSize = "13px";
    div.style.fontFamily = "'Segoe UI', Arial, sans-serif";
    div.style.border = "2px solid #2e7d32";
    div.style.maxWidth = "220px";

    const statusColors = [
      {
        status: "SELESAI",
        color: "#28a745",
        icon: "✅",
        desc: "Laporan sudah ditangani",
      },
      {
        status: "DIPROSES",
        color: "#17a2b8",
        icon: "🔄",
        desc: "Sedang dalam penanganan",
      },
      {
        status: "MENUNGGU",
        color: "#ffc107",
        icon: "⏳",
        desc: "Menunggu penanganan",
      },
    ];

    let html = `
            <div style="display: flex; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 2px solid #e9ecef;">
                <div style="background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%); color: white; padding: 6px 10px; border-radius: 6px; margin-right: 10px;">
                    <i class="bi bi-info-circle"></i>
                </div>
                <strong style="color: #2e7d32; font-size: 14px;">Legenda Status Laporan</strong>
            </div>
        `;

    statusColors.forEach((item) => {
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

// ===== Grid laporan sampah dengan PAGINATION =====
async function loadLaporanGrid(page = 1) {
  const grid = document.getElementById("laporanGrid");
  if (!grid) return;

  // Simpan halaman saat ini di window
  window.currentPage = page;

  // Tampilkan loading
  grid.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-success" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-muted mt-3">Memuat data laporan...</p>
        </div>
    `;

  // Reset pagination info
  const paginationInfo = document.getElementById("paginationInfo");
  if (paginationInfo) {
    paginationInfo.textContent = "Memuat...";
  }

  try {
    const response = await fetch(API.laporanSampah, {
      headers: getAuthHeaders(),
    });

    console.log("Laporan response status:", response.status);

    // Cek jika response bukan JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Response is not JSON:", text.substring(0, 200));

      grid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger text-center">
                        <h4 class="alert-heading">
                            <i class="bi bi-exclamation-triangle me-2"></i>Error Loading Data
                        </h4>
                        <p>Server returned non-JSON response. Status: ${response.status}</p>
                        <button onclick="loadLaporanGrid(${page})" class="btn btn-success mt-2">
                            <i class="bi bi-arrow-clockwise me-2"></i> Coba Lagi
                        </button>
                    </div>
                </div>
            `;
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server error:", errorText);

      grid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger text-center">
                        <h4 class="alert-heading">
                            <i class="bi bi-exclamation-triangle me-2"></i>Error ${
                              response.status
                            }
                        </h4>
                        <p>${errorText || response.statusText}</p>
                        <button onclick="loadLaporanGrid(${page})" class="btn btn-success mt-2">
                            <i class="bi bi-arrow-clockwise me-2"></i> Coba Lagi
                        </button>
                    </div>
                </div>
            `;
      return;
    }

    const laporan = await response.json();
    console.log("✅ Laporan loaded:", laporan.length, "items");

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

      // Reset pagination
      updatePaginationControls(0, page);
      return;
    }

    // Sort by date (newest first)
    const sortedLaporan = [...laporan].sort(
      (a, b) => new Date(b.tanggal_lapor || 0) - new Date(a.tanggal_lapor || 0)
    );

    // Setup pagination
    const itemsPerPage = 9;
    const totalItems = sortedLaporan.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Validasi halaman
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    // Hitung item yang akan ditampilkan
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const pageItems = sortedLaporan.slice(startIndex, endIndex);

    // Kosongkan grid
    grid.innerHTML = "";

    // Render each report dengan Bootstrap
    pageItems.forEach((item, index) => {
      const isNew = index < 3;
      const tanggal = item.tanggal_lapor
        ? new Date(item.tanggal_lapor).toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Tanggal tidak tersedia";

      // Status badge color - PERBAIKAN untuk tema hijau
      const status = (item.status || "pending").toLowerCase();
      let statusClass = "bg-warning text-dark"; // default untuk pending
      let statusIcon = "⏳";

      if (status === "selesai") {
        statusClass = "bg-success text-white";
        statusIcon = "✅";
      } else if (status === "proses") {
        statusClass = "bg-info text-white";
        statusIcon = "🔄";
      }

      const col = document.createElement("div");
      col.className = "col-md-6 col-lg-4";
      col.innerHTML = `
                <div class="card h-100 ${
                  isNew
                    ? "border-success border-3 shadow"
                    : "border-light shadow-sm"
                } hover-shadow" 
                     style="transition: transform 0.2s, box-shadow 0.2s;" 
                     onmouseover="this.style.transform='translateY(-5px)';" 
                     onmouseout="this.style.transform='translateY(0)';">
                    ${
                      item.foto_bukti_url || item.foto_bukti
                        ? `
                        <div style="position: relative;">
                            <img src="${
                              item.foto_bukti_url || item.foto_bukti
                            }" 
                                 class="card-img-top" 
                                 alt="Foto bukti"
                                 style="height: 200px; object-fit: cover; border-top-left-radius: 6px; border-top-right-radius: 6px;">
                            ${
                              isNew
                                ? `
                                <div style="position: absolute; top: 10px; left: 10px; background: rgba(46, 125, 50, 0.9); color: white; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                                    <i class="bi bi-star-fill me-1"></i>BARU
                                </div>
                            `
                                : ""
                            }
                        </div>
                    `
                        : `
                        <div class="card-img-top d-flex align-items-center justify-content-center bg-light" 
                             style="height: 200px; border-top-left-radius: 6px; border-top-right-radius: 6px;">
                            <div class="text-center">
                                <div class="bg-success bg-opacity-10 p-3 rounded-circle d-inline-block mb-2">
                                    <i class="bi bi-image text-success fs-1"></i>
                                </div>
                                <p class="text-muted small mb-0">Tidak ada foto</p>
                            </div>
                        </div>
                    `
                    }
                    
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title mb-0 text-success fw-bold">
                                ${item.nama || "Anonim"}
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
                            ${
                              item.nama_user
                                ? `<small class="text-muted">
                                    <i class="bi bi-person me-1"></i> ${item.nama_user}
                                </small>`
                                : ""
                            }
                        </div>
                        
                        <div class="mb-3">
                            <h6 class="small text-muted mb-1">
                                <i class="bi bi-geo-alt me-1"></i> Lokasi
                            </h6>
                            <p class="card-text small mb-0" style="color: #495057;">${
                              item.alamat || "Tidak ada alamat"
                            }</p>
                        </div>
                        
                        ${
                          item.deskripsi
                            ? `
                            <div class="mb-3">
                                <h6 class="small text-muted mb-1">
                                    <i class="bi bi-chat-text me-1"></i> Deskripsi
                                </h6>
                                <p class="card-text small mb-0" style="color: #495057;">${item.deskripsi.substring(
                                  0,
                                  100
                                )}${
                                item.deskripsi.length > 100 ? "..." : ""
                              }</p>
                            </div>
                        `
                            : ""
                        }
                        
                        <div class="mt-auto pt-3">
                            ${
                              item.latitude && item.longitude
                                ? `
                                <button onclick="showLaporanOnMap(${
                                  item.latitude
                                }, ${item.longitude}, '${
                                    item.deskripsi?.replace(/'/g, "\\'") || ""
                                  }')" 
                                        class="btn btn-outline-success btn-sm w-100 d-flex align-items-center justify-content-center">
                                    <i class="bi bi-map me-2"></i> Lihat di Peta
                                </button>
                            `
                                : `
                                <div class="alert alert-warning py-2 mb-0 text-center small">
                                    <i class="bi bi-exclamation-triangle me-1"></i> Tidak ada lokasi
                                </div>
                            `
                            }
                        </div>
                    </div>
                </div>
            `;

      grid.appendChild(col);
    });

    // Update pagination controls
    updatePaginationControls(totalItems, page, itemsPerPage, totalPages);

    // Update info pagination
    if (paginationInfo) {
      paginationInfo.textContent = `Menampilkan ${
        startIndex + 1
      }-${endIndex} dari ${totalItems} laporan`;
    }

    // Add timestamp dengan tema hijau
    const timestampDiv = document.createElement("div");
    timestampDiv.className = "col-12";
    timestampDiv.innerHTML = `
            <div class="text-center mt-4 p-3 bg-light rounded-3 border-start border-5 border-success">
                <div class="d-flex align-items-center justify-content-center">
                    <div class="bg-success bg-opacity-10 p-2 rounded me-3">
                        <i class="bi bi-clock-history text-success"></i>
                    </div>
                    <div>
                        <small class="text-muted d-block">Halaman ${page} dari ${totalPages}</small>
                        <small class="text-success fw-semibold">Diperbarui: ${new Date().toLocaleTimeString(
                          "id-ID",
                          { hour: "2-digit", minute: "2-digit" }
                        )} WITA</small>
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
                        <button onclick="loadLaporanGrid(${page})" class="btn btn-success">
                            <i class="bi bi-list-ul me-2"></i> Load Laporan
                        </button>
                    </div>
                </div>
            </div>
        `;

    // Reset pagination
    updatePaginationControls(0, page);
  }
}

// ===== Fungsi untuk update pagination controls =====
function updatePaginationControls(
  totalItems,
  currentPage,
  itemsPerPage = 10,
  totalPages = 1
) {
  const paginationContainer = document.getElementById("laporanPagination");
  if (!paginationContainer) return;

  if (totalItems === 0) {
    paginationContainer.innerHTML = "";
    return;
  }

  // Hitung halaman jika belum dihitung
  if (totalPages === 1) {
    totalPages = Math.ceil(totalItems / itemsPerPage);
  }

  // Tentukan halaman yang akan ditampilkan
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);

  // Adjust jika dekat akhir
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  let paginationHTML = "";

  // Previous button
  paginationHTML += `
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link ${currentPage === 1 ? "" : "text-success"}" 
               href="#" 
               onclick="loadLaporanGrid(${currentPage - 1}); return false;">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;

  // First page
  if (startPage > 1) {
    paginationHTML += `
            <li class="page-item">
                <a class="page-link text-success" href="#" onclick="loadLaporanGrid(1); return false;">1</a>
            </li>
        `;
    if (startPage > 2) {
      paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }

  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
            <li class="page-item ${i === currentPage ? "active" : ""}">
                <a class="page-link ${
                  i === currentPage
                    ? "bg-success border-success"
                    : "text-success"
                }" 
                   href="#" 
                   onclick="loadLaporanGrid(${i}); return false;">
                    ${i}
                </a>
            </li>
        `;
  }

  // Last page
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    paginationHTML += `
            <li class="page-item">
                <a class="page-link text-success" href="#" onclick="loadLaporanGrid(${totalPages}); return false;">${totalPages}</a>
            </li>
        `;
  }

  // Next button
  paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link ${
              currentPage === totalPages ? "" : "text-success"
            }" 
               href="#" 
               onclick="loadLaporanGrid(${currentPage + 1}); return false;">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;

  paginationContainer.innerHTML = paginationHTML;
}

// ===== Fungsi untuk update stats =====
async function updateStats() {
  try {
    const response = await fetch(API.laporanSampah, {
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      const laporan = await response.json();
      const completed = laporan.filter(
        (item) => item.status === "selesai"
      ).length;
      const pending = laporan.filter(
        (item) => item.status === "pending"
      ).length;
      const active = laporan.length;

      const activeEl = document.getElementById("activeReports");
      const completedEl = document.getElementById("completedReports");
      const pendingEl = document.getElementById("pendingReports");

      if (activeEl) activeEl.textContent = active;
      if (completedEl) completedEl.textContent = completed;
      if (pendingEl) pendingEl.textContent = pending;
    }
  } catch (error) {
    console.error("Error updating stats:", error);
  }
}

window.showLaporanDetail = function (dataIndex) {
  // Ambil data dari window.allLaporanData berdasarkan index
  const laporanData = window.allLaporanData?.[dataIndex];

  if (!laporanData) {
    console.error("Laporan data not found for index:", dataIndex);
    alert("Data laporan tidak ditemukan");
    return;
  }

  // Panggil showLaporanOnMap dengan data lengkap
  showFullLaporanOnMap(laporanData);
};

function showFullLaporanOnMap(laporanData) {
  const {
    nama,
    tanggal_lapor,
    alamat,
    latitude,
    longitude,
    deskripsi,
    foto_bukti,
    foto_bukti_url,
    status,
    nama_user,
  } = laporanData;

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  // Format tanggal
  const tanggalFormatted = new Date(tanggal_lapor).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Status badge dengan warna
  const statusColors = {
    pending: "warning",
    proses: "info",
    selesai: "success",
  };

  const statusTexts = {
    pending: "Menunggu",
    proses: "Diproses",
    selesai: "Selesai",
  };

  const statusColor = statusColors[status] || "secondary";
  const statusText = statusTexts[status] || status;

  // Buat modal HTML dengan data lengkap
  const modal = document.createElement("div");
  modal.id = "mapDetailModal";
  modal.innerHTML = `
        <div class="modal fade" id="staticMapDetailModal" tabindex="-1" aria-labelledby="mapModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content border-success border-3">
                    <div class="modal-header text-white" style="background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%);">
                        <h5 class="modal-title" id="mapModalLabel">
                            <i class="bi bi-geo-alt-fill me-2"></i> Detail Lengkap Laporan Sampah
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    
                    <div class="modal-body">
                        <!-- Row untuk informasi dan foto -->
                        <div class="row mb-4">
                            <!-- Informasi Laporan -->
                            <div class="col-md-8">
                                <div class="card border-0 shadow-sm mb-3">
                                    <div class="card-body">
                                        <h6 class="card-title text-success mb-3">
                                            <i class="bi bi-info-circle me-2"></i>Informasi Laporan
                                        </h6>
                                        
                                        <div class="row">
                                            <div class="col-6 mb-2">
                                                <small class="text-muted d-block">Nama Pelapor</small>
                                                <strong>${nama || "-"}</strong>
                                            </div>
                                            <div class="col-6 mb-2">
                                                <small class="text-muted d-block">Tanggal Lapor</small>
                                                <strong>${tanggalFormatted}</strong>
                                            </div>
                                            <div class="col-12 mb-2">
                                                <small class="text-muted d-block">Alamat Lengkap</small>
                                                <strong class="text-break">${
                                                  alamat || "-"
                                                }</strong>
                                            </div>
                                            <div class="col-12 mb-2">
                                                <small class="text-muted d-block">Deskripsi Laporan</small>
                                                <div class="bg-light p-3 rounded border">
                                                    ${deskripsi || "-"}
                                                </div>
                                            </div>
                                            <div class="col-6 mb-2">
                                                <small class="text-muted d-block">Status</small>
                                                <span class="badge bg-${statusColor}">${statusText}</span>
                                            </div>
                                            <div class="col-6 mb-2">
                                                <small class="text-muted d-block">Koordinat</small>
                                                <strong>${lat.toFixed(
                                                  6
                                                )}, ${lng.toFixed(6)}</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Foto Bukti -->
                            <div class="col-md-4">
                                <div class="card border-0 shadow-sm h-100">
                                    <div class="card-body d-flex flex-column">
                                        <h6 class="card-title text-success mb-3">
                                            <i class="bi bi-camera me-2"></i>Foto Bukti
                                        </h6>
                                        
                                        ${
                                          foto_bukti || foto_bukti_url
                                            ? `
                                            <div class="text-center mb-3 flex-grow-1">
                                                <img src="${
                                                  foto_bukti || foto_bukti_url
                                                }" 
                                                     class="img-fluid rounded shadow-sm" 
                                                     alt="Foto Bukti Laporan"
                                                     style="max-height: 200px; cursor: pointer; object-fit: cover;"
                                                     onclick="window.open('${
                                                       foto_bukti ||
                                                       foto_bukti_url
                                                     }', '_blank')">
                                            </div>
                                            <div class="text-center">
                                                <small class="text-muted">Klik gambar untuk memperbesar</small>
                                            </div>
                                        `
                                            : `
                                            <div class="text-center py-4 flex-grow-1 d-flex flex-column justify-content-center">
                                                <i class="bi bi-image text-muted mb-3" style="font-size: 3rem;"></i>
                                                <p class="text-muted">Tidak ada foto bukti</p>
                                            </div>
                                        `
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Peta -->
                        <div class="card border-0 shadow-sm">
                            <div class="card-header bg-transparent border-0">
                                <h6 class="card-title text-success mb-0">
                                    <i class="bi bi-map me-2"></i>Lokasi di Peta
                                </h6>
                            </div>
                            <div class="card-body p-0">
                                <div id="detailMapModal" style="height: 400px; border-radius: 8px; overflow: hidden;"></div>
                                <div class="p-3 border-top">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <span class="badge bg-success p-2 me-2">
                                                <i class="bi bi-geo-alt me-1"></i>
                                                Latitude: ${lat.toFixed(6)}
                                            </span>
                                            <span class="badge bg-primary p-2">
                                                <i class="bi bi-geo-alt me-1"></i>
                                                Longitude: ${lng.toFixed(6)}
                                            </span>
                                        </div>
                                        <button type="button" class="btn btn-sm btn-outline-success" onclick="copyCoordinates(${lat}, ${lng})">
                                            <i class="bi bi-clipboard me-1"></i> Salin Koordinat
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-2"></i> Tutup
                        </button>
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" 
                           target="_blank" 
                           class="btn btn-success">
                            <i class="bi bi-arrow-right-circle me-2"></i> Buka di Google Maps
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  // Initialize modal
  const mapModal = new bootstrap.Modal(
    document.getElementById("staticMapDetailModal")
  );

  // Event handler untuk shown modal
  const modalElement = document.getElementById("staticMapDetailModal");
  const shownHandler = function () {
    // Load map
    loadLeaflet(() => {
      const map = initMap("detailMapModal", lat, lng, 16);

      // Custom icon
      const customIcon = L.divIcon({
        html: `<div style="
                    background-color: #28a745;
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 0 10px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                ">
                    <i class="bi bi-trash-fill" style="font-size: 14px;"></i>
                </div>`,
        className: "custom-marker-icon",
        iconSize: [35, 35],
        iconAnchor: [17.5, 17.5],
      });

      // Add marker
      L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(
          `
                    <div style="min-width: 200px;">
                        <strong>${nama || "Pelapor"}</strong><br/>
                        <small class="text-muted">Status: ${statusText}</small><br/>
                        <small>${
                          alamat
                            ? alamat.substring(0, 50) + "..."
                            : "Tidak ada alamat"
                        }</small>
                    </div>
                `
        )
        .openPopup();
    });
  };

  modalElement.addEventListener("shown.bs.modal", shownHandler);

  // Cleanup saat modal ditutup
  const hiddenHandler = function () {
    modalElement.removeEventListener("shown.bs.modal", shownHandler);
    modalElement.removeEventListener("hidden.bs.modal", hiddenHandler);

    setTimeout(() => {
      if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 300);
  };

  modalElement.addEventListener("hidden.bs.modal", hiddenHandler);

  // Tampilkan modal
  mapModal.show();
}

async function showProfileModal() {
  const user = window.userData;
  if (!user) return;

  const modalContainer =
    document.getElementById("modalContainer") ||
    (() => {
      const div = document.createElement("div");
      div.id = "modalContainer";
      document.body.appendChild(div);
      return div;
    })();

  // Simpan data original untuk validasi perubahan
  let originalProfileData = {};
  let originalTamuData = {};

  modalContainer.innerHTML = `
        <div class="modal fade" id="profileModal" tabindex="-1" aria-labelledby="profileModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content border-success border-3">
                    <div class="modal-header text-white" style="background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%);">
                        <h5 class="modal-title" id="profileModalLabel">
                            <i class="bi bi-person-gear me-2"></i> Profil Tamu
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    
                    <div class="modal-body">
                        <!-- Loading Spinner -->
                        <div id="profileLoading" class="text-center py-4">
                            <div class="spinner-border text-success" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="text-muted mt-2">Memuat data profil...</p>
                        </div>
                        
                        <!-- Alert Tidak Ada Perubahan -->
                        <div id="noChangeAlertModal" class="alert alert-warning alert-dismissible fade show mb-3" style="display: none;">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>
                            <span id="noChangeMessageModal">Tidak ada perubahan yang dilakukan. Silakan ubah data terlebih dahulu.</span>
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        </div>
                        
                        <!-- Profile Display -->
                        <div id="profileDisplay" style="display: none;">
                            <!-- Informasi Dasar -->
                            <div class="card border-0 shadow-sm mb-4">
                                <div class="card-header bg-light d-flex justify-content-between align-items-center">
                                    <h6 class="mb-0 text-success">
                                        <i class="bi bi-person-circle me-2"></i> Informasi Profil
                                    </h6>
                                    <button type="button" class="btn btn-sm btn-success" id="editProfileBtn">
                                        <i class="bi bi-pencil me-1"></i> Edit Profil
                                    </button>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label text-muted">Username</label>
                                            <div class="form-control-plaintext fw-bold" id="displayUsername">${
                                              user.username
                                            }</div>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label text-muted">Email</label>
                                            <div class="form-control-plaintext" id="displayEmail">Memuat...</div>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label text-muted">Nama Lengkap</label>
                                            <div class="form-control-plaintext fw-bold" id="displayNama">Memuat...</div>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label text-muted">Jenis Kelamin</label>
                                            <div class="form-control-plaintext" id="displayJk">Memuat...</div>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label text-muted">Role</label>
                                            <div class="form-control-plaintext">
                                                <span class="badge bg-success">${
                                                  user.role || "Tamu"
                                                }</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Profile Form -->
                        <div id="profileFormContainer" style="display: none;">
                            <form id="profileForm" novalidate>
                                <!-- Informasi Dasar -->
                                <div class="card border-0 shadow-sm mb-4">
                                    <div class="card-header bg-light d-flex justify-content-between align-items-center">
                                        <h6 class="mb-0 text-success">
                                            <i class="bi bi-person-circle me-2"></i> Edit Informasi Profil
                                        </h6>
                                        <button type="button" class="btn btn-sm btn-outline-secondary" id="cancelEditBtn">
                                            <i class="bi bi-x me-1"></i> Batal Edit
                                        </button>
                                    </div>
                                    <div class="card-body">
                                        <div class="alert alert-info">
                                            <i class="bi bi-info-circle me-2"></i>
                                            <small>Untuk menyimpan perubahan, Anda harus mengubah minimal satu data.</small>
                                        </div>
                                        
                                        <div class="row">
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label fw-semibold">Username</label>
                                                <input type="text" class="form-control" id="profileUsername" 
                                                       value="${
                                                         user.username
                                                       }" readonly disabled>
                                                <div class="form-text text-muted">Username tidak dapat diubah</div>
                                            </div>
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label fw-semibold">Email <span class="text-danger">*</span></label>
                                                <input type="email" class="form-control" id="profileEmail" 
                                                       data-original="" required>
                                                <div id="profileEmailError" class="validation-error small"></div>
                                                <div class="form-text text-muted">Contoh: nama@email.com</div>
                                            </div>
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label fw-semibold">Nama Lengkap <span class="text-danger">*</span></label>
                                                <input type="text" class="form-control" id="profileNama" 
                                                       data-original="" required>
                                                <div id="profileNamaError" class="validation-error small"></div>
                                                <div class="form-text text-muted">Minimal 3 karakter</div>
                                            </div>
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label fw-semibold">Jenis Kelamin <span class="text-danger">*</span></label>
                                                <select class="form-select" id="profileJk" data-original="" required>
                                                    <option value="">Pilih Jenis Kelamin</option>
                                                    <option value="L">Laki-laki</option>
                                                    <option value="P">Perempuan</option>
                                                </select>
                                                <div id="profileJkError" class="validation-error small"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Password (Opsional) -->
                                <div class="card border-0 shadow-sm mb-4">
                                    <div class="card-header bg-light">
                                        <h6 class="mb-0 text-success">
                                            <i class="bi bi-shield-lock me-2"></i> Ubah Password (Opsional)
                                        </h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="alert alert-info">
                                            <i class="bi bi-info-circle me-2"></i>
                                            Kosongkan jika tidak ingin mengubah password
                                        </div>
                                        <div class="row">
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label fw-semibold">Password Baru</label>
                                                <input type="password" class="form-control" id="profilePasswordBaru" 
                                                       placeholder="Minimal 6 karakter">
                                                <div id="profilePasswordBaruError" class="validation-error small"></div>
                                                <div class="form-text text-muted">Kosongkan jika tidak ingin ubah password</div>
                                            </div>
                                            <div class="col-md-6 mb-3">
                                                <label class="form-label fw-semibold">Konfirmasi Password Baru</label>
                                                <input type="password" class="form-control" id="profilePasswordKonfirmasi" 
                                                       placeholder="Ulangi password baru">
                                                <div id="profilePasswordKonfirmasiError" class="validation-error small"></div>
                                                <div class="form-text text-muted">Harus sama dengan password baru</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Summary Validation -->
                                <div id="profileSummaryValidation" class="alert alert-warning mb-4" style="display: none;">
                                    <div class="d-flex align-items-center">
                                        <i class="bi bi-exclamation-triangle-fill me-3"></i>
                                        <div>
                                            <strong class="d-block mb-1">Perbaiki data berikut:</strong>
                                            <ul id="profileSummaryErrors" class="mb-0 small"></ul>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Save Button -->
                                <div class="d-flex justify-content-end gap-2 mt-4">
                                    <button type="button" class="btn btn-outline-secondary" id="cancelEditFormBtn">
                                        <i class="bi bi-x-circle me-2"></i> Batal
                                    </button>
                                    <button type="submit" class="btn btn-success" id="saveProfileBtn">
                                        <i class="bi bi-check-circle me-2"></i> Simpan Perubahan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    
                    <div class="modal-footer" id="profileModalFooter">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-2"></i> Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Initialize modal
  const profileModal = new bootstrap.Modal(
    document.getElementById("profileModal")
  );

  // Load user data on modal shown
  document
    .getElementById("profileModal")
    .addEventListener("shown.bs.modal", async function () {
      try {
        await loadTamuDataForModal();
      } catch (error) {
        console.warn("Error loading tamu data:", error);
        loadFromLocalStorageForModal();
      }
    });

  async function loadTamuDataForModal() {
    try {
      const userId = user.id;
      const response = await fetch(`/api/tamu/?idUser=${userId}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        let tamuData;

        if (Array.isArray(data)) {
          tamuData = data[0] || {};
        } else if (data.results && Array.isArray(data.results)) {
          tamuData = data.results[0] || {};
        } else {
          tamuData = data || {};
        }

        // Simpan data original
        originalProfileData = {
          email: user.email || "",
          nama: tamuData.nama || "",
          jk: tamuData.jk || "",
          password: "",
        };

        originalTamuData = { ...tamuData };

        // Update display fields
        updateDisplayFields(originalProfileData);

        // Update form fields dengan data-original
        updateFormFieldsWithOriginalData(originalProfileData);

        // Hide loading, show profile display
        document.getElementById("profileLoading").style.display = "none";
        document.getElementById("profileDisplay").style.display = "block";

        // Setup event handlers setelah data dimuat
        setupProfileEventHandlersForModal();
      }
    } catch (error) {
      console.error("Error loading tamu data:", error);
      throw error;
    }
  }

  function loadFromLocalStorageForModal() {
    // Load data dari localStorage/userData
    originalProfileData = {
      email: user.email || "",
      nama: user.nama || user.first_name || user.username,
      jk: user.jk || "",
      password: "",
    };

    // Update display fields
    updateDisplayFields(originalProfileData);

    // Update form fields dengan data-original
    updateFormFieldsWithOriginalData(originalProfileData);

    // Hide loading, show profile display
    setTimeout(() => {
      document.getElementById("profileLoading").style.display = "none";
      document.getElementById("profileDisplay").style.display = "block";
      setupProfileEventHandlersForModal();
    }, 500);
  }

  function updateDisplayFields(data) {
    document.getElementById("displayEmail").textContent = data.email;
    document.getElementById("displayNama").textContent = data.nama || "-";
    document.getElementById("displayJk").textContent =
      data.jk === "L" ? "Laki-laki" : data.jk === "P" ? "Perempuan" : "-";
  }

  function updateFormFieldsWithOriginalData(data) {
    const fields = {
      profileEmail: data.email,
      profileNama: data.nama,
      profileJk: data.jk,
    };

    Object.entries(fields).forEach(([id, value]) => {
      const field = document.getElementById(id);
      if (field) {
        field.value = value || "";
        field.setAttribute("data-original", value || "");
      }
    });
  }

  function setupProfileEventHandlersForModal() {
    // Edit button handler
    document
      .getElementById("editProfileBtn")
      .addEventListener("click", function () {
        // Switch from display to form
        document.getElementById("profileDisplay").style.display = "none";
        document.getElementById("profileFormContainer").style.display = "block";
        document.getElementById("profileModalFooter").style.display = "none";

        // Setup real-time validation
        setupRealTimeValidationForModal();
      });

    // Cancel edit button handlers
    document
      .getElementById("cancelEditBtn")
      .addEventListener("click", function () {
        switchToDisplayView();
      });

    document
      .getElementById("cancelEditFormBtn")
      .addEventListener("click", function () {
        switchToDisplayView();
      });

    // Handle save button
    document
      .getElementById("saveProfileBtn")
      .addEventListener("click", async function (e) {
        e.preventDefault();
        await saveProfileChangesInModal();
      });

    // Handle form submission
    document
      .getElementById("profileForm")
      .addEventListener("submit", async function (e) {
        e.preventDefault();
        await saveProfileChangesInModal();
      });
  }

  function switchToDisplayView() {
    // Reset form fields ke original
    updateFormFieldsWithOriginalData(originalProfileData);

    // Clear validation
    clearValidationFeedbackForModal();

    // Switch back to display
    document.getElementById("profileFormContainer").style.display = "none";
    document.getElementById("profileDisplay").style.display = "block";
    document.getElementById("profileModalFooter").style.display = "flex";
  }

  function setupRealTimeValidationForModal() {
    const fields = [
      "profileEmail",
      "profileNama",
      "profileJk",
      "profilePasswordBaru",
      "profilePasswordKonfirmasi",
    ];

    fields.forEach((fieldId) => {
      const input = document.getElementById(fieldId);
      if (input) {
        input.addEventListener("input", () => validateFieldInModal(fieldId));
        input.addEventListener("blur", () => validateFieldInModal(fieldId));
      }
    });
  }

  function validateFieldInModal(fieldId) {
    const input = document.getElementById(fieldId);
    const errorDiv = document.getElementById(`${fieldId}Error`);
    const value = input.value.trim();

    if (!errorDiv) return true;

    let isValid = true;
    let errorMessage = "";

    switch (fieldId) {
      case "profileEmail":
        if (!value) {
          errorMessage = "Email harus diisi";
          isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errorMessage = "Format email tidak valid";
          isValid = false;
        }
        break;

      case "profileNama":
        if (!value) {
          errorMessage = "Nama lengkap harus diisi";
          isValid = false;
        } else if (value.length < 3) {
          errorMessage = "Nama minimal 3 karakter";
          isValid = false;
        }
        break;

      case "profileJk":
        if (!value) {
          errorMessage = "Pilih jenis kelamin";
          isValid = false;
        }
        break;

      case "profilePasswordBaru":
        if (value) {
          if (value.length < 6) {
            errorMessage = "Password minimal 6 karakter";
            isValid = false;
          }

          const confirmValue = document
            .getElementById("profilePasswordKonfirmasi")
            .value.trim();
          if (confirmValue && value !== confirmValue) {
            errorMessage = "Password tidak cocok dengan konfirmasi";
            isValid = false;
          }
        }
        break;

      case "profilePasswordKonfirmasi":
        const passwordValue = document
          .getElementById("profilePasswordBaru")
          .value.trim();
        if (passwordValue && value && value !== passwordValue) {
          errorMessage = "Konfirmasi password tidak cocok";
          isValid = false;
        } else if (!value && passwordValue) {
          errorMessage = "Konfirmasi password harus diisi";
          isValid = false;
        }
        break;
    }

    // Update UI
    if (isValid) {
      errorDiv.style.display = "none";
      input.classList.remove("is-invalid");
      if (value) {
        input.classList.add("is-valid");
      }
    } else {
      errorDiv.style.display = "block";
      errorDiv.textContent = errorMessage;
      input.classList.add("is-invalid");
      input.classList.remove("is-valid");
    }

    return isValid;
  }

  function clearValidationFeedbackForModal() {
    const fields = [
      "profileEmail",
      "profileNama",
      "profileJk",
      "profilePasswordBaru",
      "profilePasswordKonfirmasi",
    ];

    fields.forEach((fieldId) => {
      const input = document.getElementById(fieldId);
      const errorDiv = document.getElementById(`${fieldId}Error`);

      if (input) {
        input.classList.remove("is-invalid", "is-valid");
      }
      if (errorDiv) {
        errorDiv.style.display = "none";
        errorDiv.textContent = "";
      }
    });

    // Hide summary
    const summaryDiv = document.getElementById("profileSummaryValidation");
    if (summaryDiv) {
      summaryDiv.style.display = "none";
    }

    // Hide no change alert
    const noChangeAlert = document.getElementById("noChangeAlertModal");
    if (noChangeAlert) {
      noChangeAlert.style.display = "none";
    }
  }

  function hasDataChangedInModal() {
    const fieldsToCheck = [
      { id: "profileEmail", name: "Email" },
      { id: "profileNama", name: "Nama" },
      { id: "profileJk", name: "Jenis Kelamin" },
      { id: "profilePasswordBaru", name: "Password" },
    ];

    let hasChanged = false;
    let changedFields = [];

    for (const field of fieldsToCheck) {
      const input = document.getElementById(field.id);
      if (input) {
        const currentValue = input.value.trim();
        const originalValue = input.getAttribute("data-original") || "";

        if (currentValue !== originalValue) {
          // Khusus password, anggap ada perubahan jika ada isinya
          if (field.id === "profilePasswordBaru" && currentValue !== "") {
            hasChanged = true;
            changedFields.push(field.name);
          }
          // Untuk field lain
          else if (field.id !== "profilePasswordBaru") {
            hasChanged = true;
            changedFields.push(field.name);
          }
        }
      }
    }

    return { hasChanged, changedFields };
  }

  function showNoChangeAlertInModal() {
    const alertDiv = document.getElementById("noChangeAlertModal");
    if (alertDiv) {
      alertDiv.style.display = "block";
      alertDiv.scrollIntoView({ behavior: "smooth", block: "start" });

      // Auto-hide setelah 5 detik
      setTimeout(() => {
        alertDiv.style.display = "none";
      }, 5000);
    }
  }

  function validateAllFieldsInModal() {
    const requiredFields = ["profileEmail", "profileNama", "profileJk"];
    let allValid = true;
    let errorMessages = [];

    requiredFields.forEach((fieldId) => {
      const isValid = validateFieldInModal(fieldId);
      if (!isValid) {
        allValid = false;
        const label =
          document
            .querySelector(`label[for="${fieldId}"]`)
            ?.textContent.replace(" *", "") || fieldId;
        const errorDiv = document.getElementById(`${fieldId}Error`);
        const errorText = errorDiv.textContent;

        if (errorText) {
          errorMessages.push(`${label}: ${errorText}`);
        }
      }
    });

    // Validasi password jika diisi
    const password = document
      .getElementById("profilePasswordBaru")
      .value.trim();
    const confirmPassword = document
      .getElementById("profilePasswordKonfirmasi")
      .value.trim();

    if (password || confirmPassword) {
      const isPasswordValid = validateFieldInModal("profilePasswordBaru");
      const isConfirmValid = validateFieldInModal("profilePasswordKonfirmasi");

      if (!isPasswordValid || !isConfirmValid) {
        allValid = false;
      }

      if (password && confirmPassword && password !== confirmPassword) {
        allValid = false;
        errorMessages.push("Password: Password dan konfirmasi tidak cocok");
      }
    }

    // Tampilkan summary jika ada error
    const summaryDiv = document.getElementById("profileSummaryValidation");
    const summaryList = document.getElementById("profileSummaryErrors");

    if (!allValid && summaryDiv && summaryList) {
      summaryList.innerHTML = "";
      errorMessages.forEach((msg) => {
        const li = document.createElement("li");
        li.textContent = msg;
        summaryList.appendChild(li);
      });
      summaryDiv.style.display = "block";
    } else if (summaryDiv) {
      summaryDiv.style.display = "none";
    }

    return allValid;
  }

  async function saveProfileChangesInModal() {
    const saveBtn = document.getElementById("saveProfileBtn");
    const originalText = saveBtn.innerHTML;

    try {
      // 1. CEK APAKAH ADA PERUBAHAN DATA
      const changeCheck = hasDataChangedInModal();
      const hasChanged = changeCheck.hasChanged;
      const changedFields = changeCheck.changedFields;

      if (!hasChanged) {
        showNoChangeAlertInModal();
        return;
      }

      // 2. VALIDASI SEMUA FIELD
      const isValid = validateAllFieldsInModal();
      if (!isValid) {
        return;
      }

      // 3. DISABLE BUTTON DAN TAMPILKAN LOADING
      saveBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
      saveBtn.disabled = true;

      // 4. SIAPKAN DATA UNTUK DIKIRIM
      const profileData = {
        nama: document.getElementById("profileNama").value.trim(),
        jk: document.getElementById("profileJk").value,
      };

      const userData = {
        email: document.getElementById("profileEmail").value.trim(),
      };

      const password = document
        .getElementById("profilePasswordBaru")
        .value.trim();

      // 5. UPDATE DATA USER (EMAIL DAN PASSWORD)
      let userUpdated = false;

      // Cek perubahan user data
      const userHasChanges =
        userData.email !== originalProfileData.email || password;

      if (userHasChanges) {
        const userDataToUpdate = {};

        if (userData.email !== originalProfileData.email) {
          userDataToUpdate.email = userData.email;
        }

        if (password) {
          userDataToUpdate.password = password;
        }

        try {
          // Ambil user ID dari localStorage
          const userFromStorage = JSON.parse(localStorage.getItem("user"));
          const userId = userFromStorage.id;
          console.log("User ID from localStorage:", userId);

          // UPDATE USER - gunakan fetch biasa
          const userResponse = await fetch(`${API.users}${userId}/`, {
            method: "PATCH",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify(userDataToUpdate),
          });

          console.log("User response status:", userResponse.status);

          if (!userResponse.ok) {
            let errorMessage = "Gagal mengupdate data user";

            try {
              const errorData = await userResponse.json();
              console.log("User error data:", errorData);

              if (errorData.email && Array.isArray(errorData.email)) {
                document.getElementById("profileEmailError").style.display =
                  "block";
                document.getElementById("profileEmailError").textContent =
                  errorData.email[0];
                document
                  .getElementById("profileEmail")
                  .classList.add("is-invalid");
                errorMessage = `Email: ${errorData.email[0]}`;
              } else if (errorData.detail) {
                errorMessage = errorData.detail;
              }
            } catch (parseError) {
              console.warn("Cannot parse user error response:", parseError);
              const errorText = await userResponse.text();
              errorMessage = `HTTP ${userResponse.status}: ${
                errorText || userResponse.statusText
              }`;
            }

            throw new Error(errorMessage);
          }

          const userResult = await userResponse.json();
          console.log("User update success:", userResult);
          userUpdated = true;

          // Update localStorage
          if (userData.email !== originalProfileData.email) {
            const currentUser = JSON.parse(
              localStorage.getItem("user") || "{}"
            );
            const updatedUser = {
              ...currentUser,
              email: userData.email,
              ...userResult,
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            window.userData = updatedUser;
          }
        } catch (error) {
          console.error("User update error:", error);
          saveBtn.disabled = false;
          saveBtn.innerHTML =
            '<i class="bi bi-check-circle me-2"></i>Simpan Perubahan';
          showToast(
            "error",
            error.message || "Terjadi kesalahan saat menyimpan"
          );
          return;
        }
      }

      // 6. UPDATE DATA TAMU
      let tamuUpdated = false;

      // Cek perubahan tamu data
      const tamuHasChanges =
        profileData.nama !== originalProfileData.nama ||
        profileData.jk !== originalProfileData.jk;

      if (tamuHasChanges) {
        try {
          // Cari tamu ID terlebih dahulu
          const tamuListResponse = await fetch(`${API.tamu}`, {
            headers: getAuthHeaders(),
          });

          console.log("Tamu list response status:", tamuListResponse.status);

          if (!tamuListResponse.ok) {
            throw new Error("Gagal mengambil data tamu");
          }

          const tamuList = await tamuListResponse.json();
          console.log("Tamu list:", tamuList);

          // Ambil user ID untuk mencari tamu
          const userFromStorage = JSON.parse(localStorage.getItem("user"));
          const userId = userFromStorage.id;

          // Cari tamu berdasarkan idUser
          let currentTamu = null;
          if (Array.isArray(tamuList)) {
            currentTamu = tamuList.find((t) => t.idUser === userId);
          } else if (tamuList.results && Array.isArray(tamuList.results)) {
            currentTamu = tamuList.results.find((t) => t.idUser === userId);
          } else if (tamuList.idUser === userId) {
            currentTamu = tamuList;
          }

          console.log("Current tamu found:", currentTamu);

          if (currentTamu && currentTamu.idTamu) {
            console.log("Updating tamu ID:", currentTamu.idTamu);
            console.log("Update data:", profileData);

            // PERBAIKAN: Gunakan fetch biasa, bukan fetchAPI
            const tamuUpdateResponse = await fetch(
              `${API.tamu}${currentTamu.idTamu}/`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  ...getAuthHeaders(),
                },
                body: JSON.stringify(profileData),
              }
            );

            console.log(
              "Tamu update response status:",
              tamuUpdateResponse.status
            );

            if (!tamuUpdateResponse.ok) {
              let errorMessage = "Gagal mengupdate data tamu";

              try {
                const errorData = await tamuUpdateResponse.json();
                console.log("Tamu update error data:", errorData);

                if (errorData.nama && Array.isArray(errorData.nama)) {
                  document.getElementById("profileNamaError").style.display =
                    "block";
                  document.getElementById("profileNamaError").textContent =
                    errorData.nama[0];
                  document
                    .getElementById("profileNama")
                    .classList.add("is-invalid");
                  errorMessage = `Nama: ${errorData.nama[0]}`;
                }
                if (errorData.jk && Array.isArray(errorData.jk)) {
                  const jkErrorElement =
                    document.getElementById("profileJkError");
                  if (jkErrorElement) {
                    jkErrorElement.style.display = "block";
                    jkErrorElement.textContent = errorData.jk[0];
                  }
                  document
                    .getElementById("profileJk")
                    .classList.add("is-invalid");
                  errorMessage += errorMessage.includes("Nama:")
                    ? `, JK: ${errorData.jk[0]}`
                    : `JK: ${errorData.jk[0]}`;
                }
              } catch (parseError) {
                console.warn("Cannot parse tamu error:", parseError);
                const errorText = await tamuUpdateResponse.text();
                console.log("Raw error text:", errorText);
                errorMessage = `HTTP ${tamuUpdateResponse.status}: ${errorText}`;
              }

              throw new Error(errorMessage);
            }

            const tamuResult = await tamuUpdateResponse.json();
            console.log("Tamu update success:", tamuResult);
            tamuUpdated = true;
          } else {
            console.log("No tamu found for user ID:", userId);
            // Tidak ada tamu? Mungkin tidak perlu membuat baru jika hanya update profile
          }
        } catch (error) {
          console.error("Tamu update error:", error);
          saveBtn.disabled = false;
          saveBtn.innerHTML =
            '<i class="bi bi-check-circle me-2"></i>Simpan Perubahan';
          showToast(
            "error",
            error.message || "Terjadi kesalahan saat menyimpan data tamu"
          );
          return;
        }
      }

      // 7. TAMPILKAN HASIL SUKSES
      saveBtn.disabled = false;
      saveBtn.innerHTML =
        '<i class="bi bi-check-circle me-2"></i>Simpan Perubahan';

      if (userUpdated || tamuUpdated) {
        // Update original data untuk next validation
        originalProfileData = {
          ...originalProfileData,
          nama: profileData.nama,
          jk: profileData.jk,
          email: userData.email,
          password: "",
        };

        // Update display fields
        updateDisplayFields({
          email: userData.email,
          nama: profileData.nama,
          jk: profileData.jk,
        });

        // Update form fields dengan data-original
        updateFormFieldsWithOriginalData(originalProfileData);

        // Switch back to display view
        switchToDisplayView();

        // Show success notification
        showProfileSuccessNotificationForModal(changedFields);

        // Update navbar jika diperlukan
        if (typeof updateNavbarProfile === "function") {
          updateNavbarProfile(window.userData);
        }

        // Show success toast
        setTimeout(() => {
          if (typeof showToast === "function") {
            showToast("success", "Profil berhasil diperbarui!");
          }
        }, 500);
      } else {
        showNoChangeAlertInModal();
      }
    } catch (error) {
      console.error("General save error:", error);
      // Enable button dan tampilkan error
      saveBtn.disabled = false;
      saveBtn.innerHTML =
        '<i class="bi bi-check-circle me-2"></i>Simpan Perubahan';

      // Tampilkan toast error
      if (typeof showToast === "function") {
        showToast("error", error.message || "Terjadi kesalahan saat menyimpan");
      } else {
        alert("Error: " + error.message);
      }
    }
  }

  function showProfileSuccessNotificationForModal(changedFields) {
    const notification = document.createElement("div");
    notification.className = "position-fixed top-0 end-0 p-3";
    notification.style.zIndex = "1060";

    let changedText =
      changedFields.length > 0
        ? `Data yang berubah: ${changedFields.join(", ")}`
        : "Data berhasil diperbarui";

    notification.innerHTML = `
            <div id="profileSuccessToastModal" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-success text-white">
                    <i class="bi bi-check-circle me-2"></i>
                    <strong class="me-auto">Berhasil!</strong>
                    <small>Baru saja</small>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    <div class="d-flex align-items-center">
                        <div class="bg-success bg-opacity-10 p-2 rounded me-3">
                            <i class="bi bi-person-check text-success"></i>
                        </div>
                        <div>
                            <strong>Profil berhasil diperbarui!</strong>
                            <p class="mb-0 small">${changedText}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(notification);

    const toastElement = document.getElementById("profileSuccessToastModal");
    const toast = new bootstrap.Toast(toastElement, { delay: 4000 });
    toast.show();

    toastElement.addEventListener("hidden.bs.toast", function () {
      notification.remove();
    });
  }

  // Show modal
  profileModal.show();

  // Cleanup modal after hidden
  document
    .getElementById("profileModal")
    .addEventListener("hidden.bs.modal", function () {
      if (modalContainer && modalContainer.parentNode) {
        modalContainer.innerHTML = "";
      }
    });
}

// ===== Helper function untuk update navbar =====
function updateNavbarProfile(updatedUser) {
  // Update nama di welcome card
  const welcomeElements = document.querySelectorAll(
    ".bg-success.text-white .text-warning"
  );
  welcomeElements.forEach((el) => {
    if (el.textContent.includes(updatedUser.username)) {
      // Tampilkan nama dari profil
      const displayName = updatedUser.nama || updatedUser.username;
      el.textContent = displayName;
    }
  });

  // Update dropdown toggle - tampilkan nama
  const userSpan = document.querySelector(
    ".navbar-nav .dropdown-toggle .fw-bold"
  );
  if (userSpan) {
    const displayName = updatedUser.nama || updatedUser.username;
    userSpan.textContent = displayName;
  }

  // Update status di navbar
  const roleSpan = document.querySelector(".navbar-nav .dropdown-toggle small");
  if (roleSpan) {
    roleSpan.textContent = updatedUser.role || "Tamu";
  }
}

// ===== Function untuk menampilkan notifikasi sukses =====
function showProfileSuccessNotification() {
  // Cek jika sudah ada notifikasi
  const existingToast = document.getElementById("profileSuccessToast");
  if (existingToast) {
    existingToast.remove();
  }

  const notification = document.createElement("div");
  notification.className = "position-fixed top-0 end-0 p-3";
  notification.style.zIndex = "1060";
  notification.innerHTML = `
        <div id="profileSuccessToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-success text-white">
                <i class="bi bi-check-circle me-2"></i>
                <strong class="me-auto">Berhasil!</strong>
                <small>Baru saja</small>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                <div class="d-flex align-items-center">
                    <div class="bg-success bg-opacity-10 p-2 rounded me-3">
                        <i class="bi bi-person-check text-success"></i>
                    </div>
                    <div>
                        <strong>Profil berhasil diperbarui!</strong>
                        <p class="mb-0 small">Perubahan sudah disimpan</p>
                    </div>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(notification);

  const toastElement = document.getElementById("profileSuccessToast");
  const toast = new bootstrap.Toast(toastElement, {
    delay: 3000,
  });
  toast.show();

  // Remove notification after hidden
  toastElement.addEventListener("hidden.bs.toast", function () {
    if (notification.parentNode) {
      notification.remove();
    }
  });
}

// Fungsi untuk tombol GPS di peta utama
window.getCurrentLocationView = function () {
  if (!navigator.geolocation) {
    showFormToast("Browser tidak mendukung GPS", "danger");
    return;
  }

  showFormToast("Mendeteksi lokasi GPS...", "info");

  navigator.geolocation.getCurrentPosition(
    function (position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy; // meter

      if (window.profileMap) {
        window.profileMap.setView([latitude, longitude], 17);

        // Buat / update marker GPS
        if (!window.profileGPSMarker) {
          window.profileGPSMarker = window.L.marker([latitude, longitude], {
            icon: window.L.icon({
              iconUrl:
                "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
              shadowUrl:
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            }),
            title: "LOKASI SAYA (GPS)",
            draggable: false,
            zIndexOffset: 1000,
          }).addTo(window.profileMap);
        } else {
          window.profileGPSMarker.setLatLng([latitude, longitude]);
        }

        window.profileGPSMarker
          .bindPopup(
            `
                    <div style="max-width: 250px;">
                        <strong style="color: #4CAF50;">📍 LOKASI SAYA (GPS)</strong><br>
                        <small>
                            <b>Lat:</b> ${latitude.toFixed(6)}<br>
                            <b>Lng:</b> ${longitude.toFixed(6)}<br>
                            <b>Akurasi:</b> ±${Math.round(accuracy)} meter<br>
                            <i>Lokasi dari GPS perangkat</i>
                        </small>
                    </div>
                `
          )
          .openPopup();

        showFormToast(
          `Lokasi ditemukan: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          "success"
        );
      }
    },
    function (error) {
      let message = "Gagal mendapatkan lokasi GPS";

      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = "Izin lokasi ditolak";
          break;
        case error.POSITION_UNAVAILABLE:
          message = "Informasi lokasi tidak tersedia";
          break;
        case error.TIMEOUT:
          message = "Permintaan lokasi timeout";
          break;
      }

      showFormToast(message, "danger");
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  );
};

window.resetMapView = function () {
  if (window.profileMap) {
    window.profileMap.setView([-10.1935921, 123.6149376], 13);

    // Hapus marker GPS jika ada
    if (window.profileGPSMarker) {
      window.profileMap.removeLayer(window.profileGPSMarker);
      window.profileGPSMarker = null;
    }

    showFormToast("Peta direset ke lokasi default Kupang", "info");
  }
};

// Fungsi untuk copy ke clipboard di form edit
window.copyEditToClipboard = function (inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.select();
    document.execCommand("copy");

    // Tampilkan feedback
    const originalValue = input.value;
    input.value = "✓ Disalin!";
    setTimeout(() => {
      input.value = originalValue;
    }, 1000);

    // Tampilkan toast
    showFormToast("✅ Berhasil disalin ke clipboard!", "success");
  }
};

// Fungsi untuk set lokasi tetap di form edit
window.setEditFixedLocation = function (lat, lng, label) {
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
    updateEditGPSStatus("manual");

    // Refresh peta
    setTimeout(() => {
      editMap.invalidateSize();
    }, 100);
  }

  showFormToast(`Lokasi diterapkan: ${label}`, "info");
};

// ===== Export function agar bisa dipanggil dari luar =====
window.loadLaporanGrid = loadLaporanGrid;
window.refreshLaporanGrid = loadLaporanGrid;
window.refreshMapMarkers = refreshMapMarkers;
window.showProfileModal = showProfileModal;

// ===== Helper function untuk showLaporanOnMap dengan tema hijau =====
window.showLaporanOnMap = function (latitude, longitude, deskripsi = "") {
  // Fungsi ini tetap ada untuk kompatibilitas dengan kode lama
  // Tapi kita gunakan fungsi baru untuk data lengkap jika tersedia

  console.log("showLaporanOnMap called with lat, lng:", latitude, longitude);

  // Coba cari data laporan yang cocok berdasarkan koordinat
  if (window.allLaporanData && window.allLaporanData.length > 0) {
    const laporan = window.allLaporanData.find(
      (item) =>
        Math.abs(parseFloat(item.latitude) - latitude) < 0.0001 &&
        Math.abs(parseFloat(item.longitude) - longitude) < 0.0001
    );

    if (laporan) {
      showFullLaporanOnMap(laporan);
      return;
    }
  }

  // Jika tidak ditemukan, tampilkan modal sederhana dengan parameter yang ada
  const modal = document.createElement("div");
  modal.id = "mapModal";
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
                        ${
                          deskripsi
                            ? `
                            <div class="alert alert-info mb-3 border-start border-5 border-info">
                                <i class="bi bi-info-circle me-2"></i>
                                <strong>Deskripsi:</strong> ${deskripsi}
                            </div>
                        `
                            : ""
                        }
                        <div id="detailMap" style="height: 400px; border-radius: 8px; overflow: hidden; border: 1px solid #dee2e6;"></div>
                        <div class="mt-3 text-center">
                            <div class="badge bg-success p-2">
                                <i class="bi bi-geo-alt me-1"></i>
                                Koordinat: ${latitude.toFixed(
                                  6
                                )}, ${longitude.toFixed(6)}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-2"></i> Tutup
                        </button>
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}" 
                           target="_blank" 
                           class="btn btn-success">
                            <i class="bi bi-arrow-right-circle me-2"></i> Buka di Google Maps
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(modal);

  // Initialize modal
  const mapModal = new bootstrap.Modal(
    document.getElementById("staticMapModal")
  );
  mapModal.show();

  // Load map after modal is shown
  document
    .getElementById("staticMapModal")
    .addEventListener("shown.bs.modal", function () {
      loadLeaflet(() => {
        const map = initMap("detailMap", latitude, longitude, 15);
        addMarker(
          map,
          latitude,
          longitude,
          deskripsi || "Lokasi Laporan",
          "#28a745"
        );
      });
    });

  // Cleanup modal after hidden
  document
    .getElementById("staticMapModal")
    .addEventListener("hidden.bs.modal", function () {
      modal.remove();
    });
};

// ===== Fungsi untuk menyalin koordinat =====
window.copyCoordinates = function (lat, lng) {
  const coordinates = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  navigator.clipboard
    .writeText(coordinates)
    .then(() => {
      // Tampilkan feedback
      const button = event?.target?.closest("button");
      if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="bi bi-check2 me-1"></i>Tersalin!';
        button.classList.remove("btn-outline-success");
        button.classList.add("btn-success");

        setTimeout(() => {
          button.innerHTML = originalText;
          button.classList.remove("btn-success");
          button.classList.add("btn-outline-success");
        }, 2000);
      } else {
        alert("Koordinat berhasil disalin: " + coordinates);
      }
    })
    .catch((err) => {
      console.error("Failed to copy coordinates: ", err);
      alert("Gagal menyalin koordinat. Silakan salin manual: " + coordinates);
    });
};
