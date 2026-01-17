// pages/public/analisisDampak.js
import { API, getPublicHeaders } from '../api.js';

export async function analisisDampakPage() {
  const app = document.getElementById("app");
  
  // Show loading
  app.innerHTML = `
    <div class="container py-5">
      <div class="text-center py-5">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Memuat data analisis dampak lingkungan...</p>
      </div>
    </div>
  `;
  
  try {
    // Get days parameter from URL
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const days = urlParams.get('days') || '30';
    
    // Fetch data dari API
    const data = await fetchAnalisisData(days);
    
    // Render halaman dengan data
    renderPage(app, data, days);
    
    // Setup event handlers
    setupEventHandlers();
    
  } catch (error) {
    console.error('Error loading analisis dampak:', error);
    app.innerHTML = `
      <div class="container py-5">
        <div class="alert alert-danger">
          <h4 class="alert-heading"><i class="bi bi-exclamation-triangle me-2"></i>Gagal Memuat Data</h4>
          <p>Terjadi kesalahan saat mengambil data analisis dampak lingkungan.</p>
          <div class="mt-3">
            <button onclick="window.location.hash='#/'" class="btn btn-primary">
              <i class="bi bi-house me-1"></i> Kembali ke Beranda
            </button>
            <button onclick="analisisDampakPage()" class="btn btn-outline-secondary ms-2">
              <i class="bi bi-arrow-clockwise me-1"></i> Coba Lagi
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

async function fetchAnalisisData(days = '30') {
  try {
    // Fetch data utama
    const response = await fetch(`${API.publicAnalisisLingkungan}?days=${days}`, {
      headers: getPublicHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching analisis data:', error);
    throw error;
  }
}

function renderPage(app, data, days) {
  const periodLabel = data.period?.label || `${days} Hari Terakhir`;
  const totalLaporan = data.ringkasan?.total_laporan || 0;
  const persentaseSelesai = data.ringkasan?.persentase_selesai || 0;
  const updateTerakhir = data.ringkasan?.update_terakhir || 'Sedang diperbarui';
  
  app.innerHTML = `
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- NAVBAR -->
    <nav class="navbar navbar-expand-lg navbar-dark fixed-top" 
         style="background: rgba(27, 94, 32, 0.95); backdrop-filter: blur(10px);">
      <div class="container">
        <a class="navbar-brand fw-bold d-flex align-items-center" href="#/">
          <div class="me-2">
            <img src="/logo/logo_3d.png" 
                 alt="CleanUp Kupang Logo" 
                 style="height: 40px; width: auto;"
                 onerror="this.onerror=null; this.style.display='none';">
          </div>
          CleanUp Kupang
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <a class="nav-link" href="#/">
                <i class="bi bi-house me-1"></i> Beranda
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link active" href="#/analisis-dampak">
                <i class="bi bi-graph-up me-1"></i> Analisis
              </a>
            </li>
            <li class="nav-item ms-2">
              <a href="#/login" class="btn btn-warning btn-sm">
                <i class="bi bi-box-arrow-in-right me-1"></i> Login
              </a>
            </li>
            <li class="nav-item ms-2">
              <a href="#/register" class="btn btn-outline-light btn-sm">
                <i class="bi bi-person-plus me-1"></i> Daftar
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- MAIN CONTENT -->
    <div style="padding-top: 80px;">
      <!-- HERO SECTION -->
      <section class="text-white" 
               style="background: linear-gradient(135deg, #1b5e20 0%, #4caf50 100%);">
        <div class="container py-5">
          <div class="row align-items-center">
            <div class="col-lg-8">
              <div class="d-flex align-items-center mb-3">
                <div class="me-3">
                  <img src="/logo/logo_3d.png" 
                       alt="CleanUp Kupang Logo" 
                       style="height: 60px; width: auto;"
                       onerror="this.onerror=null; this.style.display='none';">
                </div>
                <div>
                  <h1 class="display-5 fw-bold mb-2">Analisis Dampak Lingkungan</h1>
                  <p class="lead mb-0">Dashboard Publik Pengelolaan Sampah Kota Kupang</p>
                </div>
              </div>
              <div class="d-flex flex-wrap align-items-center gap-3 mt-4">
                <div class="bg-white bg-opacity-25 px-3 py-2 rounded-pill">
                  <small>
                    <i class="bi bi-calendar me-1"></i>
                    ${periodLabel}
                  </small>
                </div>
                <div class="bg-white bg-opacity-25 px-3 py-2 rounded-pill">
                  <small>
                    <i class="bi bi-file-text me-1"></i>
                    Total: ${totalLaporan}
                  </small>
                </div>
                <div class="bg-white bg-opacity-25 px-3 py-2 rounded-pill">
                  <small>
                    <i class="bi bi-check-circle me-1"></i>
                    Selesai: ${persentaseSelesai}%
                  </small>
                </div>
              </div>
            </div>
            <div class="col-lg-4 text-center mt-4 mt-lg-0">
              <div class="bg-white bg-opacity-10 rounded-3 p-4" id="statusCard">
                <div class="display-6 fw-bold mb-1" id="statusLingkungan">-</div>
                <p class="mb-0 text-white-75">Status Lingkungan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- STATS CARDS -->
      <section class="bg-light py-4">
        <div class="container">
          <div class="row g-3" id="statsCards">
            <!-- Stats akan diisi oleh JavaScript -->
          </div>
        </div>
      </section>

      <!-- MAIN CONTENT -->
      <section class="py-5">
        <div class="container">
          <div class="row">
            <!-- LEFT COLUMN: Analisis Dampak Lingkungan -->
            <div class="col-lg-8 mb-5">
              <div class="card border-0 shadow-sm h-100">
                <div class="card-header bg-white border-0 py-3">
                  <div class="d-flex justify-content-between align-items-center">
                    <h3 class="fw-bold mb-0">
                      <i class="bi bi-graph-up text-success me-2"></i>
                      Analisis Dampak Lingkungan
                    </h3>
                    <div class="dropdown">
                      <button class="btn btn-outline-success btn-sm dropdown-toggle" type="button" 
                              data-bs-toggle="dropdown">
                        <i class="bi bi-filter me-1"></i> ${days} Hari
                      </button>
                      <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#" data-days="7">7 Hari Terakhir</a></li>
                        <li><a class="dropdown-item" href="#" data-days="30">30 Hari Terakhir</a></li>
                        <li><a class="dropdown-item" href="#" data-days="90">90 Hari Terakhir</a></li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div class="card-body">
                  <!-- Chart Container -->
                  <div class="mb-4" style="height: 300px;">
                    <canvas id="jenisSampahChart"></canvas>
                  </div>
                  
                  <!-- Jenis Sampah Detail -->
                  <div id="jenisSampahList">
                    <!-- Detail akan diisi oleh JavaScript -->
                  </div>
                </div>
              </div>
            </div>

            <!-- RIGHT COLUMN: Ranking Wilayah & Tips -->
            <div class="col-lg-4">
              <!-- Wilayah Terkotor -->
              <div class="card border-0 shadow-sm mb-4">
                <div class="card-header bg-danger bg-opacity-10 text-danger border-0 py-3">
                  <h5 class="fw-bold mb-0">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Wilayah Terkotor
                  </h5>
                </div>
                <div class="card-body p-0">
                  <div class="list-group list-group-flush" id="wilayahTerkotorList">
                    <!-- Data akan diisi oleh JavaScript -->
                  </div>
                </div>
              </div>

              <!-- Wilayah Terbersih -->
              <div class="card border-0 shadow-sm mb-4">
                <div class="card-header bg-success bg-opacity-10 text-success border-0 py-3">
                  <h5 class="fw-bold mb-0">
                    <i class="bi bi-trophy me-2"></i>
                    Wilayah Terbersih
                  </h5>
                </div>
                <div class="card-body p-0">
                  <div class="list-group list-group-flush" id="wilayahTerbersihList">
                    <!-- Data akan diisi oleh JavaScript -->
                  </div>
                </div>
              </div>

              <!-- Tips Lingkungan -->
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-info bg-opacity-10 text-info border-0 py-3">
                  <h5 class="fw-bold mb-0">
                    <i class="bi bi-lightbulb me-2"></i>
                    Tips Lingkungan
                  </h5>
                </div>
                <div class="card-body">
                  <div id="tipsLingkunganList">
                    <!-- Tips akan diisi oleh JavaScript -->
                  </div>
                  <div class="text-center mt-3">
                    <button onclick="shareTips()" class="btn btn-outline-success btn-sm">
                      <i class="bi bi-share me-1"></i> Bagikan Tips
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CALL TO ACTION -->
      <section class="py-5 bg-success bg-opacity-10">
        <div class="container">
          <div class="row align-items-center">
            <div class="col-lg-8">
              <h3 class="fw-bold mb-3">Berkontribusi untuk Kota Kupang yang Lebih Bersih</h3>
              <p class="mb-0">
                Laporkan timbunan sampah di sekitar Anda dan bantu kami memantau kondisi lingkungan.
              </p>
            </div>
            <div class="col-lg-4 text-lg-end mt-3 mt-lg-0">
              <a href="#/register" class="btn btn-success btn-lg px-4">
                <i class="bi bi-plus-circle me-2"></i> Laporkan Sampah
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- FOOTER -->
    <footer class="bg-dark text-white py-4">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-md-6">
            <div class="d-flex align-items-center">
              <div class="me-3">
                <img src="/logo/logo_3d.png" 
                     alt="CleanUp Kupang Logo" 
                     style="height: 40px; width: auto;"
                     onerror="this.onerror=null; this.style.display='none';">
              </div>
              <div>
                <p class="mb-0 text-white-50">© 2025 CleanUp Kupang</p>
                <small class="text-white-50">Dashboard Analisis Dampak Lingkungan</small>
              </div>
            </div>
          </div>
          <div class="col-md-6 text-md-end mt-3 mt-md-0">
            <small class="text-white-50">
              Update: ${updateTerakhir}
            </small>
          </div>
        </div>
      </div>
    </footer>

    <!-- Bootstrap JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Custom CSS -->
    <style>
      :root {
        --bs-success: #198754;
        --bs-success-rgb: 25, 135, 84;
      }
      
      .navbar {
        transition: all 0.3s ease;
      }
      
      .navbar.scrolled {
        background: rgba(27, 94, 32, 0.95) !important;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
      
      .stat-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        border-radius: 12px;
      }
      
      .stat-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
      }
      
      .jenis-sampah-item {
        border-left: 4px solid transparent;
        transition: all 0.3s ease;
        border-radius: 8px;
      }
      
      .jenis-sampah-item:hover {
        background-color: rgba(25, 135, 84, 0.05);
        border-left-color: var(--bs-success);
      }
      
      .ranking-badge {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-weight: bold;
        font-size: 0.875rem;
        flex-shrink: 0;
      }
      
      .rank-1 { background-color: #ff4444; color: white; }
      .rank-2 { background-color: #ff6b6b; color: white; }
      .rank-3 { background-color: #ff9999; color: #333; }
      .rank-4, .rank-5 { background-color: #ffe6e6; color: #333; }
      
      .rank-clean-1 { background-color: #4caf50; color: white; }
      .rank-clean-2 { background-color: #66bb6a; color: white; }
      .rank-clean-3 { background-color: #81c784; color: white; }
      .rank-clean-4, .rank-clean-5 { background-color: #e8f5e9; color: #333; }
      
      .danger-high { background: linear-gradient(45deg, #ff4444, #ff6b6b) !important; }
      .danger-medium { background: linear-gradient(45deg, #ffa726, #ffb74d) !important; }
      .danger-low { background: linear-gradient(45deg, #4caf50, #66bb6a) !important; }
      .danger-none { background: linear-gradient(45deg, #757575, #9e9e9e) !important; }
      
      .progress {
        height: 8px;
        border-radius: 4px;
      }
      
      body {
        font-family: 'Inter', sans-serif;
      }
      
      .card {
        border-radius: 12px;
        overflow: hidden;
      }
      
      .chart-container {
        position: relative;
        height: 300px;
      }
      
      @media (max-width: 768px) {
        .hero-section .display-5 {
          font-size: 2rem;
        }
        .stat-card .fw-bold {
          font-size: 1.5rem;
        }
      }
    </style>
  `;
  
  // Setelah DOM dirender, isi dengan data dan load Chart.js
  setTimeout(async () => {
    await loadChartJS();
    populatePageData(data);
    setupCharts(data);
    updateStatusLingkungan(data);
  }, 100);
}

// Fungsi untuk memuat Chart.js secara dinamis
async function loadChartJS() {
  // Cek apakah Chart.js sudah dimuat
  if (typeof Chart === 'undefined') {
    try {
      // Load Chart.js dari CDN
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      console.log('Chart.js loaded successfully');
    } catch (error) {
      console.error('Failed to load Chart.js:', error);
      throw error;
    }
  }
}

function populatePageData(data) {
  // 1. Stats Cards
  const statsCards = document.getElementById('statsCards');
  if (statsCards) {
    const totalLaporan = data.ringkasan?.total_laporan || 0;
    const laporanSelesai = data.ringkasan?.laporan_selesai || 0;
    const pendingLaporan = totalLaporan - laporanSelesai;
    const totalBerbahaya =
    data.analisis_dampak_lingkungan?.detail
    ?.find(item => item.jenis === "limbah_berbahaya")
    ?.jumlah || 0;

    
    const stats = [
      {
        icon: 'bi-file-text',
        title: 'Total Laporan',
        value: totalLaporan,
        color: 'primary',
        bg: 'bg-primary bg-opacity-10 text-primary',
        tooltip: 'Total laporan sampah dalam periode ini'
      },
      {
        icon: 'bi-check-circle',
        title: 'Selesai',
        value: `${data.ringkasan?.persentase_selesai || 0}%`,
        color: 'success',
        bg: 'bg-success bg-opacity-10 text-success',
        tooltip: 'Persentase laporan yang sudah ditangani'
      },
      {
        icon: 'bi-clock-history',
        title: 'Pending',
        value: pendingLaporan,
        color: 'warning',
        bg: 'bg-warning bg-opacity-10 text-warning',
        tooltip: 'Laporan yang masih dalam proses'
      },
      {
        icon: 'bi-exclamation-triangle',
        title: 'Berbahaya',
        value: totalBerbahaya,
        color: 'danger',
        bg: 'bg-danger bg-opacity-10 text-danger',
        tooltip: 'Laporan sampah berbahaya/B3'
      }
    ];
    
    statsCards.innerHTML = stats.map(stat => `
      <div class="col-md-3 col-6">
        <div class="card border-0 shadow-sm stat-card h-100" data-bs-toggle="tooltip" title="${stat.tooltip}">
          <div class="card-body text-center p-3">
            <div class="${stat.bg} rounded-circle p-3 d-inline-flex align-items-center justify-content-center mb-3" 
                 style="width: 60px; height: 60px;">
              <i class="bi ${stat.icon} fs-4"></i>
            </div>
            <h3 class="fw-bold mb-1">${formatNumber(stat.value)}</h3>
            <p class="text-muted mb-0 small">${stat.title}</p>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  // 2. Jenis Sampah List
  const jenisSampahList = document.getElementById('jenisSampahList');
  if (jenisSampahList) {
    const detail = data.analisis_dampak_lingkungan?.detail || [];
    
    if (detail.length === 0) {
      jenisSampahList.innerHTML = `
        <div class="alert alert-info">
          <i class="bi bi-info-circle me-2"></i>
          Tidak ada data jenis sampah untuk periode ini.
        </div>
      `;
    } else {
      jenisSampahList.innerHTML = detail.map((item, index) => `
        <div class="jenis-sampah-item p-3 mb-2 rounded" style="border-left-color: ${item.warna || '#666'}">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="d-flex align-items-center">
              <span class="me-3" style="font-size: 1.5rem;">${item.ikon || '📊'}</span>
              <div>
                <h6 class="fw-bold mb-0 text-capitalize">${formatJenisSampah(item.jenis)}</h6>
                <small class="text-muted">${truncateText(item.dampak_lingkungan || 'Dampak lingkungan', 60)}</small>
              </div>
            </div>
            <div class="text-end">
              <div class="fw-bold">${formatNumber(item.jumlah)} laporan</div>
              <div class="text-muted small">${item.persentase || 0}% dari total</div>
            </div>
          </div>
          <div class="progress mb-2">
            <div class="progress-bar" 
                 style="width: ${item.persentase || 0}%; background-color: ${item.warna || '#666'};"
                 role="progressbar"
                 aria-valuenow="${item.persentase || 0}"
                 aria-valuemin="0"
                 aria-valuemax="100">
            </div>
          </div>
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <small class="text-muted">
              <i class="bi ${getDangerIcon(item.tingkat_bahaya)} me-1"></i>
              ${formatTingkatBahaya(item.tingkat_bahaya)}
            </small>
            <small class="text-muted text-end"
                title="${item.rekomendasi_sederhana || ''}">
              <i class="bi bi-lightbulb me-1"></i>
              ${truncateText(item.rekomendasi_sederhana || '-', 60)}
            </small>
          </div>
        </div>
      `).join('');
    }
  }
  
  // 3. Wilayah Terkotor List
  const wilayahTerkotorList = document.getElementById('wilayahTerkotorList');
  if (wilayahTerkotorList) {
    const wilayahTerkotor = data.wilayah_terkotor || [];
    
    if (wilayahTerkotor.length === 0) {
      wilayahTerkotorList.innerHTML = `
        <div class="list-group-item border-0 py-4 text-center">
          <i class="bi bi-inbox text-muted mb-2 d-block" style="font-size: 2rem;"></i>
          <p class="text-muted small mb-0">Tidak ada data wilayah terkotor</p>
        </div>
      `;
    } else {
      wilayahTerkotorList.innerHTML = wilayahTerkotor.map((wilayah, index) => `
        <div class="list-group-item border-0 py-3">
          <div class="d-flex align-items-center">
            <div class="ranking-badge rank-${Math.min(index + 1, 5)} me-3">
              ${wilayah.peringkat || index + 1}
            </div>
            <div class="flex-grow-1">
              <div class="fw-bold mb-1 text-capitalize">${formatWilayah(wilayah.wilayah)}</div>
              <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">${formatNumber(wilayah.total_laporan)} laporan</small>
                <span class="badge bg-danger bg-opacity-25 text-danger">
                  ${wilayah.kategori || 'Kotor'}
                </span>
              </div>
              <div class="progress mt-1" style="height: 4px;">
                <div class="progress-bar bg-danger" 
                     style="width: ${Math.min(wilayah.persentase_selesai || 0, 100)}%"
                     title="${wilayah.persentase_selesai || 0}% selesai">
                </div>
              </div>
              <small class="text-muted d-block mt-1">
                <i class="bi bi-check-circle me-1"></i>
                Selesai: ${wilayah.persentase_selesai || 0}%
              </small>
              <small class="text-muted d-block">
                <i class="bi bi-calendar me-1"></i>
                ${wilayah.tanggal_terakhir || '-'}
              </small>
            </div>
          </div>
        </div>
      `).join('');
    }
  }
  
  // 4. Wilayah Terbersih List
  const wilayahTerbersihList = document.getElementById('wilayahTerbersihList');
  if (wilayahTerbersihList) {
    const wilayahTerbersih = data.wilayah_terbersih || [];
    
    if (wilayahTerbersih.length === 0) {
      wilayahTerbersihList.innerHTML = `
        <div class="list-group-item border-0 py-4 text-center">
          <i class="bi bi-inbox text-muted mb-2 d-block" style="font-size: 2rem;"></i>
          <p class="text-muted small mb-0">Tidak ada data wilayah terbersih</p>
        </div>
      `;
    } else {
      wilayahTerbersihList.innerHTML = wilayahTerbersih.map((wilayah, index) => `
        <div class="list-group-item border-0 py-3">
          <div class="d-flex align-items-center">
            <div class="ranking-badge rank-clean-${Math.min(index + 1, 5)} me-3">
              ${wilayah.peringkat || index + 1}
            </div>
            <div class="flex-grow-1">
              <div class="fw-bold mb-1 text-capitalize">${formatWilayah(wilayah.wilayah)}</div>
              <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">${formatNumber(wilayah.total_laporan)} laporan</small>
                <span class="badge bg-success bg-opacity-25 text-success">
                  ${wilayah.kategori || 'Bersih'}
                </span>
              </div>
              <div class="progress mt-1" style="height: 4px;">
                <div class="progress-bar bg-success" 
                     style="width: ${Math.min(wilayah.persentase_selesai || 0, 100)}%"
                     title="${wilayah.persentase_selesai || 0}% selesai">
                </div>
              </div>
              <small class="text-muted d-block mt-1">
                <i class="bi bi-check-circle me-1"></i>
                Selesai: ${wilayah.persentase_selesai || 0}%
              </small>
              <small class="text-muted d-block">
                <i class="bi bi-calendar me-1"></i>
                ${wilayah.tanggal_terakhir || '-'}
              </small>
            </div>
          </div>
        </div>
      `).join('');
    }
  }
  
  // 5. Tips Lingkungan
  const tipsLingkunganList = document.getElementById('tipsLingkunganList');
  if (tipsLingkunganList) {
    const tips = data.tips_lingkungan || [
      "Pilah sampah organik dan non-organik di rumah",
      "Kurangi penggunaan plastik sekali pakai",
      "Gunakan tas belanja reusable",
      "Daur ulang kertas, plastik, dan logam",
      "Buat kompos dari sampah organik"
    ];
    
    tipsLingkunganList.innerHTML = tips.map((tip, index) => `
      <div class="d-flex mb-3">
        <div class="bg-success bg-opacity-10 rounded-circle p-2 me-3 flex-shrink-0 d-flex align-items-center justify-content-center" 
             style="width: 40px; height: 40px;">
          <span class="text-success fw-bold">${index + 1}</span>
        </div>
        <div class="flex-grow-1">
          <p class="mb-0 small">${tip}</p>
        </div>
      </div>
    `).join('');
  }
}

function setupCharts(data) {
  const ctx = document.getElementById('jenisSampahChart');
  if (!ctx) {
    console.error('Canvas element not found!');
    return;
  }
  
  const chartData = data.analisis_dampak_lingkungan?.detail || [];
  
  if (chartData.length === 0) {
    ctx.parentElement.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-pie-chart text-muted mb-3" style="font-size: 3rem;"></i>
        <p class="text-muted">Tidak ada data untuk ditampilkan dalam chart</p>
      </div>
    `;
    return;
  }
  
  console.log('Setting up chart with data:', chartData);
  
  try {
    // Hancurkan chart sebelumnya jika ada
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }
    
    // Validasi data sebelum membuat chart
    const validData = chartData.filter(item => {
      const isValid = !isNaN(item.jumlah) && item.jumlah > 0;
      if (!isValid) {
        console.warn('Invalid data for chart:', item);
      }
      return isValid;
    });
    
    if (validData.length === 0) {
      throw new Error('No valid data for chart');
    }
    
    // Buat chart baru
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: validData.map(item => formatJenisSampah(item.jenis)),
        datasets: [{
          data: validData.map(item => item.jumlah),
          backgroundColor: validData.map(item => item.warna || getRandomColor()),
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 15
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle',
              font: {
                size: 11
              },
              color: '#333'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#198754',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const item = validData[context.dataIndex];
                return `${formatJenisSampah(item.jenis)}: ${formatNumber(item.jumlah)} laporan (${item.persentase || 0}%)`;
              }
            }
          }
        },
        cutout: '60%',
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 1000
        }
      }
    });
    
    console.log('Chart created successfully');
    return chart;
    
  } catch (error) {
    console.error('Error setting up chart:', error);
    
    // Fallback: tampilkan data dalam tabel
    ctx.parentElement.innerHTML = `
      <div class="alert alert-warning mb-0">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Chart tidak dapat ditampilkan. Berikut data dalam bentuk tabel:
      </div>
      <div class="table-responsive mt-3">
        <table class="table table-bordered table-hover">
          <thead class="table-light">
            <tr>
              <th>Jenis Sampah</th>
              <th>Jumlah</th>
              <th>Persentase</th>
              <th>Warna</th>
            </tr>
          </thead>
          <tbody>
            ${chartData.map(item => `
              <tr>
                <td>${formatJenisSampah(item.jenis)}</td>
                <td>${formatNumber(item.jumlah)}</td>
                <td>${item.persentase || 0}%</td>
                <td>
                  <div style="width: 20px; height: 20px; background-color: ${item.warna || '#666'}; border-radius: 3px;"></div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

function getRandomColor() {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
    '#EF476F', '#FFD166', '#06D6A0', '#118AB2', '#073B4C'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function updateStatusLingkungan(data) {
  const statusElement = document.getElementById('statusLingkungan');
  const statusCard = document.getElementById('statusCard');
  
  if (!statusElement || !statusCard) return;
  
  const status = data.analisis_dampak_lingkungan?.status_lingkungan || 'data_terbatas';
  const statusConfig = {
    'baik': { 
      text: 'BAIK', 
      class: 'text-white', 
      bg: 'danger-low',
      icon: 'bi-check-circle'
    },
    'waspada': { 
      text: 'WASPADA', 
      class: 'text-white', 
      bg: 'danger-medium',
      icon: 'bi-exclamation-triangle'
    },
    'perhatian': { 
      text: 'PERHATIAN', 
      class: 'text-white', 
      bg: 'danger-high',
      icon: 'bi-exclamation-triangle-fill'
    },
    'data_terbatas': { 
      text: 'DATA TERBATAS', 
      class: 'text-white', 
      bg: 'danger-none',
      icon: 'bi-info-circle'
    }
  };
  
  const config = statusConfig[status] || statusConfig['data_terbatas'];
  
  // Clear existing content
  statusElement.innerHTML = '';
  
  // Create icon
  const iconElement = document.createElement('i');
  iconElement.className = `bi ${config.icon} me-2`;
  
  // Create text
  const textElement = document.createElement('span');
  textElement.textContent = config.text;
  
  // Append elements
  statusElement.appendChild(iconElement);
  statusElement.appendChild(textElement);
  
  statusElement.className = `display-6 fw-bold mb-1 ${config.class}`;
  
  // Update background berdasarkan status
  statusCard.className = `${config.bg} rounded-3 p-4 text-white text-center`;
}

function setupEventHandlers() {
  // Filter dropdown
  document.querySelectorAll('[data-days]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const days = this.getAttribute('data-days');
      window.location.hash = `#/analisis-dampak?days=${days}`;
      setTimeout(() => {
        analisisDampakPage();
      }, 100);
    });
  });
  
  // Navbar scroll effect
  const scrollHandler = function() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
  };
  
  window.addEventListener('scroll', scrollHandler);
  
  // Initialize tooltips setelah semua elemen dimuat
  setTimeout(() => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      try {
        return new bootstrap.Tooltip(tooltipTriggerEl);
      } catch (e) {
        console.warn('Failed to initialize tooltip:', e);
        return null;
      }
    });
  }, 500);
  
  // Active nav link sudah diatur dalam HTML
  
  // Simpan handler untuk cleanup nanti
  window._analisisScrollHandler = scrollHandler;
}

// Helper functions
function formatNumber(num) {
  if (typeof num !== 'number') return num;
  return new Intl.NumberFormat('id-ID').format(num);
}

function formatJenisSampah(jenis) {
  if (!jenis) return 'Tidak Diketahui';
  
  const map = {
    'plastik': 'Plastik',
    'organik': 'Organik',
    'kertas': 'Kertas',
    'logam': 'Logam',
    'kaca': 'Kaca',
    'limbah_berbahaya': 'Limbah Berbahaya',
    'campuran': 'Campuran',
    'konstruksi': 'Konstruksi',
    'medis': 'Medis',
    'lainnya': 'Lainnya',
    'tidak_diketahui': 'Tidak Diketahui'
  };
  
  return map[jenis.toLowerCase()] || jenis.charAt(0).toUpperCase() + jenis.slice(1).replace(/_/g, ' ');
}

function formatWilayah(wilayah) {
  if (!wilayah) return 'Tidak Diketahui';
  return wilayah.charAt(0).toUpperCase() + wilayah.slice(1).toLowerCase();
}

function formatTingkatBahaya(tingkat) {
  if (!tingkat) return 'Tidak diketahui';
  
  const map = {
    'tinggi': 'Tinggi',
    'menengah': 'Menengah',
    'rendah': 'Rendah',
    'sangat_tinggi': 'Sangat Tinggi',
    'sedang': 'Sedang'
  };
  
  return map[tingkat.toLowerCase()] || tingkat.charAt(0).toUpperCase() + tingkat.slice(1);
}

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function getDangerIcon(tingkat) {
  if (!tingkat) return 'bi-question-circle text-secondary';
  
  switch(tingkat.toLowerCase()) {
    case 'sangat_tinggi': 
    case 'tinggi': 
      return 'bi-exclamation-triangle-fill text-danger';
    case 'menengah': 
    case 'sedang': 
      return 'bi-exclamation-triangle text-warning';
    case 'rendah': 
      return 'bi-check-circle text-success';
    default: 
      return 'bi-info-circle text-info';
  }
}

// Share function
function shareTips() {
  const tips = Array.from(document.querySelectorAll('#tipsLingkunganList p'))
    .map(p => p.textContent)
    .join('\n• ');
  
  const textToCopy = `Tips Lingkungan dari CleanUp Kupang:\n• ${tips}\n\nLihat lebih lanjut di: ${window.location.href}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'Tips Lingkungan - CleanUp Kupang',
      text: 'Tips menjaga lingkungan dari CleanUp Kupang',
      url: window.location.href
    }).catch(console.error);
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      alert('Tips telah disalin ke clipboard!');
    }).catch(() => {
      prompt('Salin tips berikut:', textToCopy);
    });
  } else {
    prompt('Salin tips berikut:', textToCopy);
  }
}

// Cleanup function
export function cleanupAnalisisPage() {
  if (window._analisisScrollHandler) {
    window.removeEventListener('scroll', window._analisisScrollHandler);
    window._analisisScrollHandler = null;
  }
  
  // Destroy charts if any
  if (typeof Chart !== 'undefined') {
    const charts = Chart.instances;
    Object.keys(charts).forEach(key => {
      try {
        charts[key].destroy();
      } catch (e) {
        console.warn('Error destroying chart:', e);
      }
    });
  }
  
  // Remove tooltips
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(element => {
    try {
      const tooltip = bootstrap.Tooltip.getInstance(element);
      if (tooltip) {
        tooltip.dispose();
      }
    } catch (e) {
      console.warn('Error disposing tooltip:', e);
    }
  });
}