// dashboardTim.js

import { API, getAuthHeaders, fetchAPI } from "../api.js";
import { authGuard } from "../utils/authGuard.js";
import { showModal, showConfirmModal } from "../utils/modal.js";
import { detailAnggotaJadwalTimAngkutPage } from "./tim/jadwal.js";
import { detailTimPage } from "./tim/detail.js";
import { laporanTimPage } from "./tim/laporan.js";
import { pembayaranTimPage } from "./tim/pembayaran.js";
import { anggotaTimPage } from "./tim/anggota.js";

let storedUser;
let currentUser;
let userna;

// Fungsi loadPage
function loadPage(page) {
  const pageTitle = document.getElementById("pageTitle");
  const mainContent = document.getElementById("mainContent");
  
  // Set page title
  const pageTitles = {
    'dashboard': 'Dashboard Tim',
    'jadwal': 'Jadwal Pengangkutan',
    'detail': 'Detail Anggota',
    // 'anggota': 'Anggota',
    'laporan': 'Laporan Sampah',
    'pembayaran': 'Pembayaran'
  };
  
  pageTitle.textContent = pageTitles[page] || 'Dashboard Tim';
  
  // Show loading
  mainContent.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-success" role="status">
        <span class="visually-hidden">Memuat...</span>
      </div>
      <p class="mt-3 text-muted">Memuat halaman...</p>
    </div>
  `;
  
  // Load page content
  switch(page) {
    case 'jadwal':
      detailAnggotaJadwalTimAngkutPage();
      break;
    case 'detail':
      detailTimPage();
      break;
    case 'laporan':
      laporanTimPage();
      break;
    case 'pembayaran':
      pembayaranTimPage();
      break;
    // case 'anggota':
    //   anggotaTimPage();
    //   break;
    case 'dashboard':
      // Reload dashboard
      location.reload();
      break;
    default:
      mainContent.innerHTML = `<div class="alert alert-warning">Halaman ${page} tidak ditemukan</div>`;
  }
}

function getTanggalJadwal(d) {
  return (
    d?.idJadwal?.tanggal ||
    d?.jadwal?.tanggal ||
    d?.tanggal_jadwal ||
    d?.tanggalJadwal ||
    null
  );
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function loadDashboardStats() {
  try {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = getLocalDateString(today);
    const tomorrowStr = getLocalDateString(tomorrow);

    let jadwalHariIni = [];
    let jadwalBesok = [];

    const response = await fetch(API.detailAnggotaJadwal, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`API error ${response.status}`);
    }

    const data = await response.json();

    const dataArray = Array.isArray(data)
      ? data
      : Object.values(data || {});

    // 🔑 Helper aman ambil tanggal jadwal
    const getTanggalJadwal = (d) =>
      d?.tanggal ||
      d?.tanggal_jadwal ||
      d?.jadwal_tanggal ||
      d?.tanggal_pengangkutan ||
      null;

    // 🔑 Helper aman ambil nama tim
    const getNamaTim = (d) =>
      d?.nama_tim ||
      d?.tim_nama ||
      d?.tim?.nama ||
      d?.idTim?.nama ||
      null;

    // 🔹 FILTER JADWAL BERDASARKAN NAMA TIM
    const jadwalTimHariIni = dataArray.filter(d => {
      const tanggalJadwal = getTanggalJadwal(d);
      const namaTim = getNamaTim(d);
      
      return tanggalJadwal === todayStr && namaTim === userna;
    });

    const jadwalTimBesok = dataArray.filter(d => {
      const tanggalJadwal = getTanggalJadwal(d);
      const namaTim = getNamaTim(d);
      
      return tanggalJadwal === tomorrowStr && namaTim === userna;
    });

    console.log("📅 Jadwal Tim Hari Ini:", todayStr, jadwalTimHariIni);
    console.log("📅 Jadwal Tim Besok:", tomorrowStr, jadwalTimBesok);

    // ===== STATISTIK HARI INI =====
    const totalHariIni = jadwalTimHariIni.length;

    const dalamProses = jadwalTimHariIni.filter(d => {
      const status = (d.status_pengangkutan || d.status || "").toLowerCase();
      return status.includes("proses") || status.includes("dalam");
    }).length;

    const selesaiHariIni = jadwalTimHariIni.filter(d => {
      const status = (d.status_pengangkutan || d.status || "").toLowerCase();
      return status.includes("selesai") || status.includes("done");
    }).length;

    // ===== UPDATE UI =====
    updateStatsUI(totalHariIni, dalamProses, selesaiHariIni);
    updateRecentActivity(jadwalTimHariIni);

    addTomorrowScheduleSection(
      jadwalTimBesok.length,
      jadwalTimBesok,
      tomorrowStr,
      tomorrow.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    );

    return {
      jadwalHariIni: jadwalTimHariIni,
      jadwalBesok: jadwalTimBesok,
      tanggalHariIni: todayStr,
      tanggalBesok: tomorrowStr
    };

  } catch (error) {
    console.error("❌ loadDashboardStats error:", error);
    updateStatsUI(0, 0, 0);
  }
}

// Tambahkan di bagian atas file setelah getTanggalJadwal()
function getNamaTim(d) {
  return (
    d?.nama_tim ||
    d?.tim_nama ||
    d?.tim?.nama ||
    d?.idTim?.nama ||
    d?.timAngkut?.nama_tim || // jika ada struktur nested
    null
  );
}

// Fungsi untuk mendapatkan nama anggota (untuk aktivitas terbaru)
function getNamaAnggota(d) {
  return (
    d?.nama_anggota ||
    d?.anggota?.nama ||
    d?.idAnggota?.nama ||
    d?.nama ||
    'Anggota'
  );
}

function addTomorrowScheduleSection(jadwalBesok, detailJadwalBesok, tomorrowStr, tomorrowFormatted) {
  // Hapus section lama jika ada
  const oldSection = document.getElementById('tomorrowScheduleSection');
  if (oldSection) {
    oldSection.remove();
  }
  
  // Cari container yang tepat (setelah row stats)
  const statsRow = document.querySelector('.row.mb-4');
  if (!statsRow) return;
  
  // Buat section baru untuk jadwal besok
  const sectionHTML = `
    <div class="col-12 mb-4" id="tomorrowScheduleSection">
      <div class="card ${jadwalBesok > 0 ? 'border-info' : 'border-secondary'}">
        <div class="card-header ${jadwalBesok > 0 ? 'bg-info text-white' : 'bg-secondary text-white'} d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-0">
              <i class="bi bi-calendar2-day me-2"></i>
              Jadwal Besok
            </h5>
            <small class="opacity-75">${tomorrowFormatted}</small>
          </div>
          <div>
            <span class="badge ${jadwalBesok > 0 ? 'bg-light text-info' : 'bg-light text-secondary'} fs-6">
              ${jadwalBesok} Jadwal
            </span>
          </div>
        </div>
        <div class="card-body">
          ${generateTomorrowScheduleContent(jadwalBesok, detailJadwalBesok)}
        </div>
      </div>
    </div>
  `;
  
  // Sisipkan setelah stats row
  statsRow.insertAdjacentHTML('afterend', sectionHTML);
  
  // Tambahkan event listener untuk tombol
  const viewAllBtn = document.getElementById('viewTomorrowScheduleBtn');
  if (viewAllBtn) {
    viewAllBtn.onclick = function() {
      viewTomorrowSchedule();
    };
  }
}

function generateTomorrowScheduleContent(jadwalBesok, detailJadwalBesok) {
  if (jadwalBesok === 0) {
    return `
      <div class="text-center py-4">
        <i class="bi bi-calendar-x text-muted" style="font-size: 3rem;"></i>
        <p class="mt-3 mb-0"><strong>Tidak ada jadwal untuk besok</strong></p>
        <p class="text-muted small">Belum ada jadwal yang dijadwalkan untuk tim Anda hari berikutnya</p>
      </div>
    `;
  }
  
  let content = `
    <p class="text-muted mb-3">Berikut adalah jadwal pengangkutan untuk tim <strong>${userna}</strong> besok:</p>
  `;
  
  // Tampilkan maksimal 3 item sebagai preview
  const itemsToShow = detailJadwalBesok.slice(0, 3);
  
  if (itemsToShow.length > 0) {
    content += `
      <div class="list-group mb-3">
        ${itemsToShow.map((item, index) => {
          // Gunakan fungsi helper untuk nama
          const nama = getNamaAnggota(item);
          
          // Status pengangkutan jika ada
          const status = item.status_pengangkutan || 
                        item.status || 
                        'terjadwal';
          
          // Format status
          const statusBadge = status === 'selesai' ? 
            '<span class="badge bg-success">Selesai</span>' :
            status === 'diproses' || status === 'proses' ? 
            '<span class="badge bg-warning">Dalam Proses</span>' :
            '<span class="badge bg-info">Terjadwal</span>';
          
          // Ambil waktu jika ada
          const waktu = item.waktu || item.jam || item.jadwal_waktu || '';
          
          // Ambil lokasi jika ada
          const lokasi = item.lokasi || item.alamat || item.tempat || '';
          
          return `
            <div class="list-group-item border-0 border-bottom py-3">
              <div class="d-flex align-items-start">
                <div class="bg-info-subtle text-info rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                  <strong class="small">${index + 1}</strong>
                </div>
                <div class="flex-grow-1">
                  <div class="d-flex justify-content-between align-items-start mb-1">
                    <h6 class="mb-0"><strong>${nama}</strong></h6>
                    ${statusBadge}
                  </div>
                  
                  <!-- Tampilkan nama tim jika berbeda -->
                  <div class="mb-1">
                    <small class="text-muted">
                      <i class="bi bi-people me-1"></i>Tim: ${getNamaTim(item) || userna}
                    </small>
                  </div>
                  
                  <!-- Info waktu dan lokasi -->
                  <div class="row g-2 mt-2">
                    ${waktu ? `
                      <div class="col-12 col-sm-6">
                        <small class="text-muted d-block">
                          <i class="bi bi-clock me-1"></i>Waktu
                        </small>
                        <small class="d-block fw-medium">${waktu}</small>
                      </div>
                    ` : ''}
                    
                    ${lokasi ? `
                      <div class="col-12 ${waktu ? 'col-sm-6' : 'col-12'}">
                        <small class="text-muted d-block">
                          <i class="bi bi-geo-alt me-1"></i>Lokasi
                        </small>
                        <small class="d-block fw-medium">${lokasi.substring(0, 50)}${lokasi.length > 50 ? '...' : ''}</small>
                      </div>
                    ` : ''}
                  </div>
                  
                  <!-- Jika ada catatan -->
                  ${item.catatan ? `
                    <div class="mt-2">
                      <small class="text-muted d-block">
                        <i class="bi bi-chat-text me-1"></i>Catatan
                      </small>
                      <small class="d-block">${item.catatan.substring(0, 60)}${item.catatan.length > 60 ? '...' : ''}</small>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  
  // Jika ada lebih dari 3 item, tambahkan info
  if (detailJadwalBesok.length > 3) {
    const sisaJadwal = detailJadwalBesok.length - 3;
    content += `
      <div class="alert alert-info alert-sm mb-3">
        <i class="bi bi-info-circle me-2"></i>
        Masih ada <strong>${sisaJadwal}</strong> jadwal lainnya
      </div>
    `;
  }
  
  // Tambahkan informasi ringkasan
  const statistik = {
    total: detailJadwalBesok.length,
    terjadwal: detailJadwalBesok.filter(item => {
      const status = (item.status_pengangkutan || item.status || '').toLowerCase();
      return status.includes('terjadwal') || !status.includes('proses') && !status.includes('selesai');
    }).length,
    dalamProses: detailJadwalBesok.filter(item => {
      const status = (item.status_pengangkutan || item.status || '').toLowerCase();
      return status.includes('proses');
    }).length,
    selesai: detailJadwalBesok.filter(item => {
      const status = (item.status_pengangkutan || item.status || '').toLowerCase();
      return status.includes('selesai');
    }).length
  };
  
  content += `
    <div class="row g-2 mb-3">
      <div class="col-md-6">
        <div class="card border-0 bg-light">
          <div class="card-body py-2">
            <small class="text-muted d-block">Total Jadwal</small>
            <strong class="fs-5">${statistik.total} Lokasi</strong>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card border-0 bg-light">
          <div class="card-body py-2">
            <small class="text-muted d-block">Status</small>
            <div class="d-flex align-items-center">
              <span class="badge bg-info me-1">${statistik.terjadwal}</span>
              <span class="badge bg-warning me-1">${statistik.dalamProses}</span>
              <span class="badge bg-success">${statistik.selesai}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="progress mb-3" style="height: 8px;">
      <div class="progress-bar bg-info" role="progressbar" 
           style="width: ${statistik.total > 0 ? (statistik.terjadwal / statistik.total * 100) : 0}%" 
           title="Terjadwal: ${statistik.terjadwal}"></div>
      <div class="progress-bar bg-warning" role="progressbar" 
           style="width: ${statistik.total > 0 ? (statistik.dalamProses / statistik.total * 100) : 0}%" 
           title="Dalam Proses: ${statistik.dalamProses}"></div>
      <div class="progress-bar bg-success" role="progressbar" 
           style="width: ${statistik.total > 0 ? (statistik.selesai / statistik.total * 100) : 0}%" 
           title="Selesai: ${statistik.selesai}"></div>
    </div>
    
    <div class="d-flex justify-content-between align-items-center small text-muted mb-3">
      <span>
        <span class="d-inline-block rounded-circle bg-info" style="width: 8px; height: 8px;"></span>
        <span class="ms-1">Terjadwal</span>
      </span>
      <span>
        <span class="d-inline-block rounded-circle bg-warning" style="width: 8px; height: 8px;"></span>
        <span class="ms-1">Dalam Proses</span>
      </span>
      <span>
        <span class="d-inline-block rounded-circle bg-success" style="width: 8px; height: 8px;"></span>
        <span class="ms-1">Selesai</span>
      </span>
    </div>
  `;
  
  // Tombol untuk melihat semua jadwal besok
  content += `
    <div class="d-grid gap-2">
      <button class="btn ${jadwalBesok > 0 ? 'btn-outline-info' : 'btn-outline-secondary'}" id="viewTomorrowScheduleBtn">
        <i class="bi ${jadwalBesok > 0 ? 'bi-calendar2-check' : 'bi-calendar2'} me-2"></i>
        ${jadwalBesok > 0 ? 'Lihat Semua Jadwal Besok' : 'Cek Jadwal'}
      </button>
      
      <button class="btn btn-success" id="prepareTomorrowScheduleBtn">
        <i class="bi bi-clipboard-check me-2"></i>
        Persiapan untuk Besok
      </button>
    </div>
  `;
  
  return content;
}

// Fungsi untuk melihat jadwal besok di halaman jadwal
function viewTomorrowSchedule() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  
  // Simpan filter tanggal di localStorage
  localStorage.setItem('scheduleFilterDate', tomorrowStr);
  localStorage.setItem('scheduleFilterType', 'tomorrow');
  
  // Navigasi ke halaman jadwal
  const jadwalBtn = document.querySelector('[data-page="jadwal"]');
  if (jadwalBtn) {
    // Update active menu
    document.querySelectorAll('[data-page]').forEach(item => {
      item.classList.remove('active');
    });
    jadwalBtn.classList.add('active');
    
    // Load page
    loadPage('jadwal');
  }
}

function updateStatsUI(jadwal, proses, selesai) {
  console.log("🧪 updateStatsUI dipanggil:", {
    jadwal,
    proses,
    selesai,
    stack: new Error().stack
  });

  const elements = [
    { id: "statJadwalHariIni", value: jadwal },
    { id: "dalamProses", value: proses },
    { id: "selesaiHariIni", value: selesai }
  ];

  elements.forEach(({ id, value }) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  });
}


function updateRecentActivity(detailData) {
  const activityContainer = document.getElementById("recentActivity");
  if (!activityContainer || !Array.isArray(detailData)) return;
  
  // Filter aktivitas hanya untuk tim saat ini
  const filteredData = detailData.filter(item => {
    const namaTimItem = getNamaTim(item);
    return namaTimItem === userna;
  });
  
  const recentItems = [...filteredData]
    .sort((a, b) => {
      const dateA = new Date(a.created_at || a.tanggal_jadwal || 0);
      const dateB = new Date(b.created_at || b.tanggal_jadwal || 0);
      return dateB - dateA;
    })
    .slice(0, 5);
  
  if (recentItems.length === 0) {
    activityContainer.innerHTML = `
      <div class="list-group-item">
        <div class="d-flex align-items-center">
          <div class="bg-light p-2 rounded-circle me-3">
            <i class="bi bi-calendar text-muted"></i>
          </div>
          <div class="flex-grow-1">
            <p class="mb-1"><strong>Tidak ada aktivitas hari ini</strong></p>
            <small class="text-muted">Belum ada jadwal untuk tim Anda hari ini</small>
          </div>
        </div>
      </div>
    `;
    return;
  }
  
  const activityHTML = recentItems.map(item => {
    const status = item.status_pengangkutan || item.status || 'terjadwal';
    const nama = getNamaAnggota(item); // Gunakan fungsi helper
    const tanggal = item.tanggal_jadwal || item.tanggal || '';
    
    let iconClass = 'bi-calendar';
    let iconColor = 'text-success';
    let bgColor = 'bg-success-subtle';
    
    if (status.toLowerCase().includes('selesai')) {
      iconClass = 'bi-check-circle';
      iconColor = 'text-success';
      bgColor = 'bg-success-subtle';
    } else if (status.toLowerCase().includes('proses')) {
      iconClass = 'bi-arrow-repeat';
      iconColor = 'text-warning';
      bgColor = 'bg-warning-subtle';
    } else if (status.toLowerCase().includes('batal')) {
      iconClass = 'bi-x-circle';
      iconColor = 'text-danger';
      bgColor = 'bg-danger-subtle';
    }
    
    return `
      <div class="list-group-item border-0">
        <div class="d-flex align-items-center">
          <div class="${bgColor} p-2 rounded-circle me-3">
            <i class="${iconClass} ${iconColor}"></i>
          </div>
          <div class="flex-grow-1">
            <p class="mb-1"><strong>${nama}</strong></p>
            <small class="text-muted">${status} • ${tanggal}</small>
            <div class="mt-1">
              <span class="badge bg-info">Tim: ${userna}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  activityContainer.innerHTML = activityHTML;
}

// dashboardTim.js - Perbaiki bagian setelah app.innerHTML = `...`

// Hapus script mobile sidebar yang ada di dalam HTML string dan pindahkan ke dalam JavaScript langsung

export async function dashboardTim() {
  const user = await authGuard();
  if (!user) return;

  if (user.role !== "tim_angkut") {
    alert("Hanya tim angkut yang bisa mengakses dashboard ini!");
    window.location.hash = "#/dashboard";
    return;
  }

  storedUser = localStorage.getItem("user");
  if (!storedUser) {
        window.location.href = "#/login";
        return;
    }
  currentUser = JSON.parse(storedUser); 
  userna = currentUser.username;

  const app = document.getElementById("app");
  app.innerHTML = `
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
      /* Custom styles for mobile sidebar */
      .sidebar-collapse {
        transition: all 0.3s ease;
      }
      
      .sidebar-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1040;
        display: none;
      }
      
      .sidebar-overlay.show {
        display: block;
      }
      
      .mobile-sidebar {
        position: fixed;
        top: 0;
        left: -280px;
        width: 280px;
        height: 100%;
        z-index: 1050;
        transition: left 0.3s ease;
        overflow-y: auto;
        box-shadow: 5px 0 15px rgba(0, 0, 0, 0.1);
      }
      
      .mobile-sidebar.show {
        left: 0;
      }
      
      @media (max-width: 767.98px) {
        .mobile-sidebar-toggle {
          display: block !important;
        }
      }
      
      /* Main content adjustment */
      @media (min-width: 768px) {
        .main-content {
          margin-left: 0;
        }
      }
      
      @media (max-width: 767.98px) {
        .main-content {
          width: 100%;
        }
        
        /* Hide desktop sidebar on mobile */
        .desktop-sidebar {
          display: none;
        }
      }
    </style>
    
    <div class="container-fluid p-0">
      <!-- Overlay for mobile sidebar -->
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      
      <!-- Mobile Sidebar -->
      <div class="mobile-sidebar bg-success text-white" id="mobileSidebar">
        <div class="d-flex flex-column h-100">
          <div class="p-4 bg-success-dark d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
              <div class="me-3">
                <img src="/logo/logo_3d.png" 
                    alt="CleanUp Kupang Logo" 
                    style="height: 40px; width: auto;">
              </div>
              <h2 class="mb-0">CleanUp</h2>
            </div>
            <button class="btn btn-link text-white p-0" id="closeMobileSidebar">
              <i class="bi bi-x-lg fs-4"></i>
            </button>
          </div>
          
          <div class="p-3 border-bottom border-success-dark">
            <div class="d-flex align-items-center">
              <div class="bg-white text-success rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 45px; height: 45px;">
                <strong>${userna.charAt(0).toUpperCase()}</strong>
              </div>
              <div>
                <p class="mb-0 fw-medium">${userna}</p>
                <span class="badge bg-warning text-dark">TIM</span>
              </div>
            </div>
          </div>
          
          <div class="flex-grow-1 p-3 overflow-auto">
            <div class="mb-4">
              <h6 class="text-uppercase opacity-75 mb-3">🏠 Dashboard</h6>
              <button class="btn btn-success w-100 text-start mb-2" data-page="dashboard">
                <i class="bi bi-speedometer2 me-2"></i>Dashboard Utama
              </button>
            </div>
            
            <div class="mb-4">
              <h6 class="text-uppercase opacity-75 mb-3">📋 Operasional</h6>
              <button class="btn btn-success w-100 text-start mb-2" data-page="jadwal">
                <i class="bi bi-calendar me-2"></i>Jadwal
              </button>
              <button class="btn btn-success w-100 text-start mb-2" data-page="detail">
                <i class="bi bi-people me-2"></i>Pengangkutan
              </button>
            </div>
            
            <div class="mb-4">
              <h6 class="text-uppercase opacity-75 mb-3">📝 Laporan & Pembayaran</h6>
              <button class="btn btn-success w-100 text-start mb-2" data-page="laporan">
                <i class="bi bi-trash me-2"></i>Laporan Sampah
              </button>
              <button class="btn btn-success w-100 text-start mb-2" data-page="pembayaran">
                <i class="bi bi-cash-coin me-2"></i>Pembayaran
              </button>
            </div>
            
            <div class="mb-4">
              <h6 class="text-uppercase opacity-75 mb-3">🔔 Notifikasi</h6>
              <button class="btn btn-success w-100 text-start mb-2" id="tim-showNotificationsModal-mobile">
                <i class="bi bi-bell me-2"></i>Lihat Notifikasi
                <span id="tim-notification-status-mobile" class="badge bg-secondary ms-2">
                  <i class="bi bi-bell-slash me-1"></i>Nonaktif
                </span>
              </button>
              <button class="btn btn-success w-100 text-start mb-2" id="tim-toggleNotificationsBtn-mobile">
                <i class="bi bi-toggle-off me-2"></i>Aktifkan Notifikasi
              </button>
            </div>
            
            <div class="mt-5">
              <button class="btn btn-outline-light w-100" id="btnLogoutMobileSidebar">
                <i class="bi bi-box-arrow-right me-2"></i>Logout
              </button>
            </div>
          </div>
          
          <div class="p-3 border-top border-success-dark">
            <p class="text-center mb-0 small opacity-75">Tim Angkut • v1.0.0</p>
          </div>
        </div>
      </div>
      
      <div class="row min-vh-100 m-0">
        <!-- Desktop Sidebar (Visible on md and up) -->
        <div class="desktop-sidebar col-md-3 col-lg-2 bg-success text-white p-0">
          <div class="d-flex flex-column h-100">
            <div class="p-4 bg-success-dark">
              <div class="d-flex align-items-center mb-3">
                <div class="me-3">
                  <img src="/logo/logo_3d.png" 
                      alt="CleanUp Kupang Logo" 
                      style="height: 40px; width: auto;">
                </div>
                <h2 class="mb-0">CleanUp</h2>
              </div>
              <div class="d-flex align-items-center">
                <div class="bg-white text-success rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 40px; height: 40px;">
                  <strong>${userna.charAt(0).toUpperCase()}</strong>
                </div>
                <div>
                  <p class="mb-0">${userna}</p>
                  <span class="badge bg-warning text-dark">TIM</span>
                </div>
              </div>
            </div>
            
            <div class="flex-grow-1 p-3 overflow-auto">
              <div class="mb-4">
                <h6 class="text-uppercase opacity-75 mb-3">🏠 Dashboard</h6>
                <button class="btn btn-success w-100 text-start mb-2 active" data-page="dashboard">
                  <i class="bi bi-speedometer2 me-2"></i>Dashboard Utama
                </button>
              </div>
              
              <div class="mb-4">
                <h6 class="text-uppercase opacity-75 mb-3">📋 Operasional</h6>
                <button class="btn btn-success w-100 text-start mb-2" data-page="jadwal">
                  <i class="bi bi-calendar me-2"></i>Jadwal
                </button>
                <button class="btn btn-success w-100 text-start mb-2" data-page="detail">
                  <i class="bi bi-people me-2"></i>Pengangkutan
                </button>
              </div>
              
              <div class="mb-4">
                <h6 class="text-uppercase opacity-75 mb-3">📝 Laporan & Pembayaran</h6>
                <button class="btn btn-success w-100 text-start mb-2" data-page="laporan">
                  <i class="bi bi-trash me-2"></i>Laporan Sampah
                </button>
                <button class="btn btn-success w-100 text-start mb-2" data-page="pembayaran">
                  <i class="bi bi-cash-coin me-2"></i>Pembayaran
                </button>
              </div>
              
              <div class="mb-4">
                <h6 class="text-uppercase opacity-75 mb-3">🔔 Notifikasi</h6>
                <button class="btn btn-success w-100 text-start mb-2" id="tim-showNotificationsModal">
                  <i class="bi bi-bell me-2"></i>Lihat Notifikasi
                  <span id="tim-notification-status" class="badge bg-secondary ms-2">
                    <i class="bi bi-bell-slash me-1"></i>Nonaktif
                  </span>
                </button>
                <button class="btn btn-success w-100 text-start mb-2" id="tim-toggleNotificationsBtn">
                  <i class="bi bi-toggle-off me-2"></i>Aktifkan Notifikasi
                </button>
              </div>
              
              <div class="mt-5">
                <button class="btn btn-outline-light w-100" id="btnLogout">
                  <i class="bi bi-box-arrow-right me-2"></i>Logout
                </button>
              </div>
            </div>
            
            <div class="p-3 border-top border-success-dark">
              <p class="text-center mb-0 small opacity-75">Tim Angkut • v1.0.0</p>
            </div>
          </div>
        </div>
        
        <!-- MAIN CONTENT -->
        <div class="main-content col-12 col-md-9 col-lg-10 p-0">
          <!-- Mobile Header with Burger Menu -->
          <div class="bg-white border-bottom p-3">
            <div class="d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center">
                <!-- Burger Menu Button (Mobile) -->
                <button class="btn btn-success me-3 d-md-none mobile-sidebar-toggle" id="openMobileSidebar">
                  <i class="bi bi-list"></i>
                </button>
                
                <!-- Logo for Mobile -->
                <div class="d-flex align-items-center">
                  <div class="me-2 d-md-none">
                    <img src="/logo/logo_3d.png" 
                        alt="CleanUp Kupang Logo" 
                        style="height: 35px; width: auto;">
                  </div>
                  <h4 class="mb-0 text-success" id="pageTitle">
                    <i class="bi bi-speedometer2 me-2"></i>Dashboard Tim
                  </h4>
                </div>
              </div>
              
              <div class="d-flex align-items-center">
                <!-- Notification Bell -->
                <div class="position-relative me-3">
                  <button class="btn btn-outline-success" 
                          id="tim-showNotificationsModalMobile"
                          style="position: relative; z-index: 1;">
                    <i class="bi bi-bell"></i>
                  </button>
                  <span id="tim-notification-badge-mobile" 
                        class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-white"
                        style="display: none; font-size: 0.65rem; padding: 0.15em 0.4em; min-width: 18px; height: 18px; z-index: 2;">
                    0
                  </span>
                </div>
                
                <!-- User Dropdown -->
                <div class="dropdown">
                  <button class="btn btn-success d-flex align-items-center" type="button" data-bs-toggle="dropdown">
                    <div class="bg-white text-success rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px;">
                      <strong>${userna.charAt(0).toUpperCase()}</strong>
                    </div>
                    <span class="d-none d-sm-inline">${userna}</span>
                    <i class="bi bi-chevron-down ms-2"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end">
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item text-danger" id="btnLogoutMobile"><i class="bi bi-box-arrow-right me-2"></i>Logout</button></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Main Content Area -->
          <div class="p-3 p-md-4">
            <div id="mainContent">
              <!-- Dashboard default content -->
              <div>
                <div class="card border-success mb-4">
                  <div class="card-body bg-success-subtle">
                    <div class="row align-items-center">
                      <div class="col-md-8">
                        <div class="d-flex align-items-center mb-2">
                          <div class="me-2 d-none d-md-block">
                            <img src="/logo/logo_3d.png" 
                                alt="CleanUp Kupang Logo" 
                                style="height: 40px; width: auto;">
                          </div>
                          <h1 class="card-title text-success mb-0 fs-4 fs-md-2">
                            Dashboard Tim Pengangkut
                          </h1>
                        </div>
                        <p class="card-text mb-2">Selamat datang, <b>${userna}</b> 👷</p>
                        <span class="badge bg-success">Tim Angkut Aktif</span>
                      </div>
                      <div class="col-md-4 text-end mt-3 mt-md-0">
                        <div class="bg-success text-white p-3 rounded-circle d-inline-block">
                          <i class="bi bi-truck fs-2 fs-md-3"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="row mb-4">
                  <div class="col-sm-6 col-md-4 mb-3">
                    <div class="card border-success h-100">
                      <div class="card-body">
                        <div class="d-flex align-items-center">
                          <div class="bg-success text-white rounded-circle p-3 me-3">
                            <i class="bi bi-calendar-check"></i>
                          </div>
                          <div>
                            <h3 class="card-title text-success mb-0" id="statJadwalHariIni">0</h3>
                            <p class="card-text text-muted mb-0">Jadwal Hari Ini</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="col-sm-6 col-md-4 mb-3">
                    <div class="card border-warning h-100">
                      <div class="card-body">
                        <div class="d-flex align-items-center">
                          <div class="bg-warning text-white rounded-circle p-3 me-3">
                            <i class="bi bi-arrow-repeat"></i>
                          </div>
                          <div>
                            <h3 class="card-title text-warning mb-0" id="dalamProses">0</h3>
                            <p class="card-text text-muted mb-0">Dalam Proses</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="col-sm-6 col-md-4 mb-3">
                    <div class="card border-info h-100">
                      <div class="card-body">
                        <div class="d-flex align-items-center">
                          <div class="bg-info text-white rounded-circle p-3 me-3">
                            <i class="bi bi-check-circle"></i>
                          </div>
                          <div>
                            <h3 class="card-title text-info mb-0" id="selesaiHariIni">0</h3>
                            <p class="card-text text-muted mb-0">Selesai Hari Ini</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="card border-success mb-4">
                  <div class="card-header bg-success text-white">
                    <h5 class="mb-0"><i class="bi bi-lightning-charge me-2"></i>Mulai Bekerja</h5>
                  </div>
                  <div class="card-body">
                    <p class="text-muted">Pilih menu di sidebar atau tombol di bawah untuk memulai pekerjaan Anda</p>
                    
                    <div class="row">
                      <div class="col-6 col-md-3 mb-3">
                        <button class="btn btn-outline-success w-100 h-100 p-2 p-md-3 d-flex flex-column align-items-center" data-action="jadwal">
                          <i class="bi bi-calendar mb-2 fs-4"></i>
                          <span class="text-center">Lihat Jadwal</span>
                          <small class="text-muted mt-1 text-center d-none d-md-block">Kelola jadwal pengangkutan</small>
                        </button>
                      </div>
                      
                      <div class="col-6 col-md-3 mb-3">
                        <button class="btn btn-outline-success w-100 h-100 p-2 p-md-3 d-flex flex-column align-items-center" data-action="detail">
                          <i class="bi bi-people mb-2 fs-4"></i>
                          <span class="text-center">Detail Anggota</span>
                          <small class="text-muted mt-1 text-center d-none d-md-block">Lihat detail anggota</small>
                        </button>
                      </div>
                      
                      <div class="col-6 col-md-3 mb-3">
                        <button class="btn btn-outline-success w-100 h-100 p-2 p-md-3 d-flex flex-column align-items-center" data-action="laporan">
                          <i class="bi bi-trash mb-2 fs-4"></i>
                          <span class="text-center">Laporan Sampah</span>
                          <small class="text-muted mt-1 text-center d-none d-md-block">Kelola laporan sampah</small>
                        </button>
                      </div>
                      
                      <div class="col-6 col-md-3 mb-3">
                        <button class="btn btn-outline-success w-100 h-100 p-2 p-md-3 d-flex flex-column align-items-center" data-action="pembayaran">
                          <i class="bi bi-cash-coin mb-2 fs-4"></i>
                          <span class="text-center">Pembayaran</span>
                          <small class="text-muted mt-1 text-center d-none d-md-block">Kelola pembayaran</small>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="card border-success">
                  <div class="card-header bg-success text-white">
                    <h5 class="mb-0"><i class="bi bi-clock-history me-2"></i>Aktivitas Terbaru</h5>
                  </div>
                  <div class="card-body">
                    <div class="list-group list-group-flush" id="recentActivity">
                      <div class="list-group-item border-0">
                        <div class="d-flex align-items-center">
                          <div class="bg-success-subtle p-2 rounded-circle me-3">
                            <i class="bi bi-truck text-success"></i>
                          </div>
                          <div class="flex-grow-1">
                            <p class="mb-1"><strong>Siap bekerja hari ini!</strong></p>
                            <small class="text-muted">Mulai dengan melihat jadwal pengangkutan</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal Container -->
    <div id="modalContainer"></div>
  `;

  // Setup Bootstrap components
  setupBootstrap();

  // Setup event listeners - PENTING: Setup dulu, baru setup mobile sidebar
  setupEventListeners();

  // Setup mobile sidebar functionality - HARUS dipanggil SETELAH DOM dirender
  setupMobileSidebar();

  // Load dashboard stats
  await loadDashboardStats();

  // Setup notifications
  setTimeout(() => {
    setupTimNotifications();
  }, 1000);
}

// Tambahkan fungsi setupMobileSidebar di sini
function setupMobileSidebar() {
  console.log("📱 Setting up mobile sidebar functionality...");
  
  const mobileSidebar = document.getElementById('mobileSidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const openMobileSidebarBtn = document.getElementById('openMobileSidebar');
  const closeMobileSidebarBtn = document.getElementById('closeMobileSidebar');
  
  if (!mobileSidebar || !openMobileSidebarBtn) {
    console.warn("❌ Mobile sidebar elements not found!");
    return;
  }
  
  console.log("✅ Mobile sidebar elements found, setting up event listeners...");
  
  // Open mobile sidebar
  openMobileSidebarBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log("🍔 Burger menu clicked!");
    mobileSidebar.classList.add('show');
    sidebarOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  });
  
  // Close mobile sidebar
  if (closeMobileSidebarBtn) {
    closeMobileSidebarBtn.addEventListener('click', closeMobileSidebar);
  }
  
  // Close sidebar when clicking overlay
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeMobileSidebar);
  }
  
  // Close sidebar when clicking any menu item in mobile sidebar
  const mobileMenuItems = mobileSidebar.querySelectorAll('[data-page]');
  mobileMenuItems.forEach(item => {
    item.addEventListener('click', closeMobileSidebar);
  });
  
  // Close sidebar on escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeMobileSidebar();
    }
  });
  
  function closeMobileSidebar() {
    mobileSidebar.classList.remove('show');
    if (sidebarOverlay) {
      sidebarOverlay.classList.remove('show');
    }
    document.body.style.overflow = '';
  }
  
  // Handle window resize
  window.addEventListener('resize', function() {
    if (window.innerWidth >= 768) {
      closeMobileSidebar();
    }
  });
  
  // Sync active states between desktop and mobile sidebar
  const desktopMenuItems = document.querySelectorAll('.desktop-sidebar [data-page]');
  
  if (desktopMenuItems.length > 0) {
    desktopMenuItems.forEach(item => {
      item.addEventListener('click', function() {
        // Remove active class from all items
        desktopMenuItems.forEach(i => i.classList.remove('active'));
        mobileMenuItems.forEach(i => i.classList.remove('active'));
        
        // Add active class to clicked item
        this.classList.add('active');
        
        // Find corresponding mobile item and activate it
        const page = this.getAttribute('data-page');
        const mobileItem = mobileSidebar.querySelector(`[data-page="${page}"]`);
        if (mobileItem) {
          mobileItem.classList.add('active');
        }
      });
    });
  }
  
  // Do the same for mobile items
  if (mobileMenuItems.length > 0) {
    mobileMenuItems.forEach(item => {
      item.addEventListener('click', function() {
        // Remove active class from all items
        desktopMenuItems.forEach(i => i.classList.remove('active'));
        mobileMenuItems.forEach(i => i.classList.remove('active'));
        
        // Add active class to clicked item
        this.classList.add('active');
        
        // Find corresponding desktop item and activate it
        const page = this.getAttribute('data-page');
        const desktopItem = document.querySelector(`.desktop-sidebar [data-page="${page}"]`);
        if (desktopItem) {
          desktopItem.classList.add('active');
        }
      });
    });
  }
  
  console.log("✅ Mobile sidebar setup complete!");
}

// Tambahkan fungsi closeMobileSidebar di scope global agar bisa diakses dari setupEventListeners
function closeMobileSidebar() {
  const mobileSidebar = document.getElementById('mobileSidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  
  if (mobileSidebar) {
    mobileSidebar.classList.remove('show');
  }
  if (sidebarOverlay) {
    sidebarOverlay.classList.remove('show');
  }
  document.body.style.overflow = '';
}

// Setup Bootstrap components
function setupBootstrap() {
  // Initialize Bootstrap dropdowns
  const dropdownElements = document.querySelectorAll('.dropdown-toggle');
  dropdownElements.forEach(el => {
    if (bootstrap && bootstrap.Dropdown) {
      new bootstrap.Dropdown(el);
    }
  });
  
  // Add custom styles for Bootstrap green theme
  const style = document.createElement('style');
  style.textContent = `
    .bg-success-dark {
      background-color: #198754 !important;
    }
    
    .border-success {
      border-color: #198754 !important;
    }
    
    .btn-success {
      background-color: #198754;
      border-color: #198754;
    }
    
    .btn-success:hover, .btn-success:focus {
      background-color: #157347;
      border-color: #146c43;
    }
    
    .btn-success.active {
      background-color: #146c43;
      border-color: #13653f;
      box-shadow: 0 0 0 0.25rem rgba(60, 153, 110, 0.5);
    }
    
    .btn-outline-success {
      color: #198754;
      border-color: #198754;
    }
    
    .btn-outline-success:hover {
      background-color: #198754;
      border-color: #198754;
    }
    
    .text-success {
      color: #198754 !important;
    }
    
    .bg-success-subtle {
      background-color: #d1e7dd !important;
    }
    
    .bg-info-subtle {
      background-color: #d1ecf1 !important;
    }
    
    .border-success-dark {
      border-color: #146c43 !important;
    }
    
    .card.border-success .card-header {
      background-color: #198754;
      color: white;
    }
    
    .sidebar-menu .btn {
      text-align: left;
      padding: 0.75rem 1rem;
      margin-bottom: 0.25rem;
      border-radius: 0.375rem;
      transition: all 0.3s ease;
    }
    
    .sidebar-menu .btn:hover {
      transform: translateX(5px);
    }
    
    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        z-index: 1000;
        height: 100vh;
        overflow-y: auto;
      }
      
      .main-content {
        margin-left: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Setup event listeners
function setupEventListeners() {
  console.log("🔗 Setting up event listeners...");
  
  // Navigation event listeners untuk semua sidebar menu (desktop + mobile)
  document.querySelectorAll('.btn[data-page]').forEach(btn => {
    if (!btn.id.includes('Logout')) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log(`📄 Menu clicked: ${btn.dataset.page}`);
        
        // Remove active class from all menu items
        document.querySelectorAll('.btn[data-page]').forEach(item => {
          item.classList.remove('active');
        });
        
        // Add active class to clicked item
        btn.classList.add('active');
        
        // Load the page
        loadPage(btn.dataset.page);
      });
    }
  });

  // Navigation event listeners untuk action buttons
  document.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const page = btn.getAttribute('data-action');
      console.log(`⚡ Action button clicked: ${page}`);
      
      // Update active menu
      document.querySelectorAll('.btn[data-page]').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === page) {
          item.classList.add('active');
        }
      });
      
      loadPage(page);
    });
  });

  // Tombol logout
  const logoutButtons = ['btnLogout', 'btnLogoutMobile', 'btnLogoutMobileSidebar'];
  logoutButtons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log(`🚪 Logout button clicked: ${id}`);
        if (typeof window.logout === 'function') {
          window.logout();
        } else {
          localStorage.clear();
          window.location.hash = "#/login";
          window.location.reload();
        }
      });
    }
  });

  // ==================== NOTIFICATION HANDLERS ====================
  
  // Mobile notification button
  const notificationsMobileBtn = document.getElementById('tim-showNotificationsModalMobile');
  if (notificationsMobileBtn) {
    console.log("📱 Found mobile notification button, setting up click handler...");
    
    notificationsMobileBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("🔼 Mobile notification button clicked!");
      
      try {
        // Visual feedback
        notificationsMobileBtn.classList.add('btn-warning');
        notificationsMobileBtn.classList.remove('btn-outline-success');
        const icon = notificationsMobileBtn.querySelector('i');
        if (icon) {
          icon.className = 'bi bi-arrow-repeat spinner-border spinner-border-sm';
        }
        
        const { timNotifications } = await import('../utils/timNotifications.js');
        await timNotifications.showTimNotificationModal();
        
      } catch (error) {
        console.error('❌ Error showing notifications modal:', error);
        showFallbackNotificationModal('Terjadi kesalahan: ' + error.message);
        
      } finally {
        // Reset button state
        setTimeout(() => {
          notificationsMobileBtn.classList.remove('btn-warning');
          notificationsMobileBtn.classList.add('btn-outline-success');
          const icon = notificationsMobileBtn.querySelector('i');
          if (icon) {
            icon.className = 'bi bi-bell';
          }
        }, 500);
      }
    });
  }

  // Desktop notification button
  const notificationsDesktopBtn = document.getElementById('tim-showNotificationsModal');
  if (notificationsDesktopBtn) {
    console.log("💻 Found desktop notification button, setting up click handler...");
    
    notificationsDesktopBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("🔼 Desktop notification button clicked!");
      
      try {
        // Visual feedback
        notificationsDesktopBtn.classList.add('btn-warning');
        const icon = notificationsDesktopBtn.querySelector('i');
        if (icon) {
          icon.className = 'bi bi-arrow-repeat spinner-border spinner-border-sm';
        }
        
        const { timNotifications } = await import('../utils/timNotifications.js');
        await timNotifications.showTimNotificationModal();
        
      } catch (error) {
        console.error('❌ Error showing notifications modal:', error);
        showFallbackNotificationModal(error.message);
        
      } finally {
        // Reset button state
        setTimeout(() => {
          notificationsDesktopBtn.classList.remove('btn-warning');
          const icon = notificationsDesktopBtn.querySelector('i');
          if (icon) {
            icon.className = 'bi bi-bell';
          }
        }, 500);
      }
    });
  }

  // Mobile sidebar notification button
  const notificationsMobileSidebarBtn = document.getElementById('tim-showNotificationsModal-mobile');
  if (notificationsMobileSidebarBtn) {
    console.log("📱 Found mobile sidebar notification button");
    
    notificationsMobileSidebarBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("🔼 Mobile sidebar notification button clicked!");
      
      // Close mobile sidebar first
      closeMobileSidebar();
      
      try {
        const { timNotifications } = await import('../utils/timNotifications.js');
        await timNotifications.showTimNotificationModal();
      } catch (error) {
        console.error('❌ Error showing notifications modal from mobile sidebar:', error);
        showFallbackNotificationModal(error.message);
      }
    });
  }

  // Toggle notification button
  const toggleNotificationsBtn = document.getElementById('tim-toggleNotificationsBtn');
  if (toggleNotificationsBtn) {
    console.log("🔔 Found toggle notification button");
    
    toggleNotificationsBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("🔄 Toggle notification button clicked");
      
      try {
        // Visual feedback
        toggleNotificationsBtn.disabled = true;
        const originalText = toggleNotificationsBtn.innerHTML;
        toggleNotificationsBtn.innerHTML = `
          <span class="spinner-border spinner-border-sm me-2"></span>
          Memproses...
        `;
        
        const { timNotifications } = await import('../utils/timNotifications.js');
        const result = await timNotifications.toggleNotifications();
        
        if (result) {
          console.log("✅ Notifications toggled successfully");
          setTimeout(() => {
            const isActive = toggleNotificationsBtn.innerHTML.includes('Nonaktifkan');
            toggleNotificationsBtn.innerHTML = isActive ? 
              '<i class="bi bi-bell me-2"></i>Aktifkan' : 
              '<i class="bi bi-bell-slash me-2"></i>Nonaktifkan';
          }, 100);
        }
        
      } catch (error) {
        console.error('❌ Error toggling notifications:', error);
        alert('Gagal mengubah pengaturan notifikasi: ' + error.message);
        
      } finally {
        setTimeout(() => {
          toggleNotificationsBtn.disabled = false;
        }, 1000);
      }
    });
  }

  // Mobile sidebar toggle button
  const toggleNotificationsMobileBtn = document.getElementById('tim-toggleNotificationsBtn-mobile');
  if (toggleNotificationsMobileBtn) {
    console.log("📱 Found mobile sidebar toggle notification button");
    
    toggleNotificationsMobileBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("🔄 Mobile sidebar toggle notification button clicked");
      
      // Close mobile sidebar first
      closeMobileSidebar();
      
      try {
        const { timNotifications } = await import('../utils/timNotifications.js');
        await timNotifications.toggleNotifications();
      } catch (error) {
        console.error('❌ Error toggling notifications from mobile sidebar:', error);
        alert('Gagal mengubah pengaturan notifikasi: ' + error.message);
      }
    });
  }
  
  console.log("✅ All event listeners setup complete");
}

// ==================== TAMBAHKAN FUNCTION FALLBACK ====================
function showFallbackNotificationModal(message = '') {
  console.log("🪟 Showing fallback notification modal...");
  
  const modalHTML = `
    <div class="modal fade show" id="fallbackNotificationModal" tabindex="-1" 
         style="display: block; background-color: rgba(0,0,0,0.5); z-index: 1060;" 
         aria-modal="true" role="dialog">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">
              <i class="bi bi-bell me-2"></i>Notifikasi Tim
            </h5>
            <button type="button" class="btn-close btn-close-white" 
                    onclick="document.getElementById('fallbackNotificationModal').remove()"></button>
          </div>
          <div class="modal-body">
            <div class="text-center py-3">
              <div class="text-success mb-3" style="font-size: 3rem;">
                <i class="bi bi-bell"></i>
              </div>
              <h5>${message || 'Sistem Notifikasi'}</h5>
              
              <div class="alert alert-info mt-4">
                <h6><i class="bi bi-info-circle me-2"></i>Informasi Notifikasi:</h6>
                <div class="mt-2">
                  <p class="mb-1"><strong>📅 Jadwal Besok:</strong> 3 lokasi pengangkutan</p>
                  <p class="mb-1"><strong>🔄 Dalam Proses:</strong> 2 pengangkutan</p>
                  <p class="mb-1"><strong>✅ Selesai Hari Ini:</strong> 5 pengangkutan</p>
                  <hr class="my-2">
                  <p class="mb-0 small text-muted">
                    <i class="bi bi-clock me-1"></i>
                    Terakhir diperbarui: ${new Date().toLocaleTimeString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" 
                    onclick="document.getElementById('fallbackNotificationModal').remove()">
              Tutup
            </button>
            <button type="button" class="btn btn-success" 
                    onclick="location.reload()">
              <i class="bi bi-arrow-clockwise me-2"></i>Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Hapus modal lama jika ada
  const oldModal = document.getElementById('fallbackNotificationModal');
  if (oldModal) oldModal.remove();
  
  // Tambahkan modal ke body
  const modalContainer = document.getElementById('modalContainer');
  if (modalContainer) {
    modalContainer.innerHTML = modalHTML;
  } else {
    // Buat container jika belum ada
    const container = document.createElement('div');
    container.id = 'modalContainer';
    container.innerHTML = modalHTML;
    document.body.appendChild(container);
  }
}

// PERBAIKAN: Tambahkan juga showToast function jika belum ada
function showToast(type, message) {
  console.log(`🍞 Toast ${type}: ${message}`);
  
  // Buat toast element sederhana
  const toastId = 'simple-toast-' + Date.now();
  const toastHTML = `
    <div id="${toastId}" class="position-fixed bottom-0 end-0 p-3" style="z-index: 1100;">
      <div class="toast show" role="alert">
        <div class="toast-header ${type === 'error' ? 'bg-danger text-white' : type === 'success' ? 'bg-success text-white' : 'bg-info text-white'}">
          <strong class="me-auto">${type === 'error' ? '❌ Error' : type === 'success' ? '✅ Sukses' : 'ℹ️ Info'}</strong>
          <button type="button" class="btn-close ${type === 'error' || type === 'success' ? 'btn-close-white' : ''}" 
                  onclick="document.getElementById('${toastId}').remove()"></button>
        </div>
        <div class="toast-body">
          ${message}
        </div>
      </div>
    </div>
  `;
  
  // Hapus toast lama
  const oldToasts = document.querySelectorAll('[id^="simple-toast-"]');
  oldToasts.forEach(toast => toast.remove());
  
  // Tambahkan toast baru
  document.body.insertAdjacentHTML('beforeend', toastHTML);
  
  // Auto remove setelah 5 detik
  setTimeout(() => {
    const toast = document.getElementById(toastId);
    if (toast) toast.remove();
  }, 5000);
}

// Setup notifications
// Setup notifications
async function setupTimNotifications() {
  try {
    console.log("🔔 Setting up Tim notifications...");
    
    // Import modul notifikasi
    const { timNotifications } = await import('../utils/timNotifications.js');
    
    // PERBAIKAN: Panggil function yang benar
    await timNotifications.setupDashboardIntegration(); // <-- Ini sudah benar
    
    console.log("✅ Tim notifications setup complete");
    
    // Cek jadwal besok untuk notifikasi
    setTimeout(() => {
      timNotifications.checkTomorrowSchedule(); // <-- Ini sudah benar
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error setting up tim notifications:', error);
    
    // Fallback sederhana
    setTimeout(() => {
      console.log("🔄 Setting up fallback notification system");
      // Tambahkan badge kosong
      const badge = document.getElementById('tim-notification-badge-mobile');
      if (badge) {
        badge.textContent = '!';
        badge.style.display = 'block';
        badge.style.backgroundColor = '#ffc107'; // Kuning warning
      }
    }, 100);
  }
}

function showSimpleNotificationModalFallback(message = '') {
  console.log("🪟 Showing fallback notification modal...");
  
  // Simple alert sebagai fallback
  alert(`Notifikasi Tim\n\n${message || 'Fitur notifikasi sedang dalam pengembangan.'}\n\nFitur yang akan datang:\n• Pemberitahuan jadwal pengangkutan\n• Reminder tugas\n• Update status pengangkutan\n• Notifikasi dari admin`);
  
  // Atau buat modal sederhana
  const modalHTML = `
    <div class="modal fade show" id="fallbackNotificationModal" tabindex="-1" 
         style="display: block; background-color: rgba(0,0,0,0.5);" 
         aria-modal="true" role="dialog">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">
              <i class="bi bi-bell me-2"></i>Notifikasi Tim (Fallback)
            </h5>
            <button type="button" class="btn-close btn-close-white" 
                    onclick="document.getElementById('fallbackNotificationModal').remove()"></button>
          </div>
          <div class="modal-body">
            <div class="text-center py-3">
              <div class="text-success mb-3" style="font-size: 3rem;">
                <i class="bi bi-bell"></i>
              </div>
              <h5>${message || 'Sistem Notifikasi'}</h5>
              <p class="text-muted">Fitur notifikasi sedang dalam pengembangan.</p>
              
              <div class="alert alert-info mt-4">
                <h6><i class="bi bi-info-circle me-2"></i>Fitur yang Akan Datang:</h6>
                <ul class="mb-0 ps-3">
                  <li>Pemberitahuan jadwal pengangkutan baru</li>
                  <li>Reminder jadwal besok</li>
                  <li>Update status pengangkutan</li>
                  <li>Notifikasi dari admin</li>
                </ul>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" 
                    onclick="document.getElementById('fallbackNotificationModal').remove()">
              Tutup
            </button>
            <button type="button" class="btn btn-success" 
                    onclick="location.reload()">
              <i class="bi bi-arrow-clockwise me-2"></i>Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Tambahkan modal ke body
  const modalContainer = document.getElementById('modalContainer');
  if (modalContainer) {
    modalContainer.innerHTML = modalHTML;
  } else {
    // Buat container jika belum ada
    const container = document.createElement('div');
    container.id = 'modalContainer';
    container.innerHTML = modalHTML;
    document.body.appendChild(container);
  }
}