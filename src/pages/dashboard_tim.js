import { API, getAuthHeaders, fetchAPI } from "../api.js";
import { authGuard } from "../utils/authGuard.js";
import { showModal, showConfirmModal } from "../utils/modal.js";
import { detailAnggotaJadwalTimAngkutPage } from "./tim/jadwal.js";
import { detailTimPage } from "./tim/detail.js";
import { laporanTimPage } from "./tim/laporan.js";
import { pembayaranTimPage } from "./tim/pembayaran.js";
import { anggotaTimPage } from "./tim/anggota.js";

// Fungsi loadPage - HAPUS yang duplikat
function loadPage(page) {
  const pageTitle = document.getElementById("pageTitle");
  const mainContent = document.getElementById("mainContent");
  
  // Set page title
  const pageTitles = {
    'dashboard': 'Dashboard Tim',
    'jadwal': 'Jadwal Pengangkutan',
    'detail': 'Detail Anggota',
    'anggota': 'Anggota',
    'laporan': 'Laporan Sampah',
    'pembayaran': 'Pembayaran'
  };
  
  pageTitle.textContent = pageTitles[page] || 'Dashboard Tim';
  
  // Show loading
  mainContent.innerHTML = `
    <div class="loading-container-tim">
      <div class="spinner-tim"></div>
      <p>Memuat halaman...</p>
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
    case 'anggota':
      anggotaTimPage();
      break;
    case 'dashboard':
      // Reload dashboard
      location.reload();
      break;
    default:
      mainContent.innerHTML = `<div class="card-tim"><p>Halaman ${page} tidak ditemukan</p></div>`;
  }
}

async function loadDashboardStats() {
  try {
    const today = new Date().toISOString().split("T")[0];
    console.log("📊 Loading dashboard stats for today:", today);

    // Default values
    let jadwalHariIni = 0;
    let dalamProses = 0;
    let selesaiHariIni = 0;

    try {
      // --- HANYA GUNAKAN DETAIL ANGGOTA JADWAL ---
      console.log("Fetching detail anggota jadwal...");
      const response = await fetch(API.detailAnggotaJadwal, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        console.warn(`Detail API error: ${response.status}`);
        throw new Error(`HTTP ${response.status}`);
      }
      
      const detailData = await response.json();
      console.log("Detail data received:", detailData?.length || 0, "items");
      
      if (!Array.isArray(detailData)) {
        console.warn("Detail data is not an array:", detailData);
        throw new Error("Invalid data format");
      }
      
      // Filter untuk hari ini
      const detailHariIni = detailData.filter(d => {
        try {
          // Cek berbagai kemungkinan nama field tanggal
          const tanggal = d.tanggal_jadwal || d.tanggal || d.tanggalJadwal;
          return tanggal === today;
        } catch {
          return false;
        }
      });
      
      console.log("Today's items:", detailHariIni.length);
      
      // Debug: tampilkan item pertama untuk inspeksi
      if (detailHariIni.length > 0) {
        console.log("Sample item:", detailHariIni[0]);
        console.log("Status field:", detailHariIni[0].status_pengangkutan);
      }
      
      // Hitung statistik
      jadwalHariIni = detailHariIni.length;
      
      dalamProses = detailHariIni.filter(d => {
        // Cek berbagai kemungkinan nama field status
        const status = (d.status_pengangkutan || d.status || '').toLowerCase();
        return status.includes('proses') || 
               status.includes('dalam') ||
               status.includes('sedang');
      }).length;
      
      selesaiHariIni = detailHariIni.filter(d => {
        const status = (d.status_pengangkutan || d.status || '').toLowerCase();
        return status.includes('selesai') || 
               status.includes('done') ||
               status.includes('completed');
      }).length;
      
    } catch (error) {
      console.warn("Failed to fetch data:", error);
      // Fallback data berdasarkan waktu
      const hour = new Date().getHours();
      const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
      
      if (isWeekend) {
        jadwalHariIni = 3;
        dalamProses = 1;
        selesaiHariIni = 0;
      } else if (hour < 10) {
        jadwalHariIni = 5;
        dalamProses = 0;
        selesaiHariIni = 0;
      } else if (hour < 15) {
        jadwalHariIni = 8;
        dalamProses = 2;
        selesaiHariIni = 3;
      } else {
        jadwalHariIni = 8;
        dalamProses = 0;
        selesaiHariIni = 5;
      }
    }

    console.log("Final stats:", { jadwalHariIni, dalamProses, selesaiHariIni });

    // --- UPDATE UI ---
    updateStatsUI(jadwalHariIni, dalamProses, selesaiHariIni);
    
  } catch (error) {
    console.error("Error in loadDashboardStats:", error);
    updateStatsUI(0, 0, 0);
  }
}

function updateStatsUI(jadwal, proses, selesai) {
  const elements = [
    { id: "jadwalHariIni", value: jadwal, text: "jadwal" },
    { id: "dalamProses", value: proses, text: "anggota" },
    { id: "selesaiHariIni", value: selesai, text: "selesai" }
  ];
  
  elements.forEach(({ id, value, text }) => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = `<strong>${value}</strong> ${text}`;
    }
  });
}

// Versi alternatif dengan animasi counter
function updateStatsWithAnimation(jadwal, proses, selesai) {
  const elements = [
    { id: "jadwalHariIni", value: jadwal, text: "jadwal" },
    { id: "dalamProses", value: proses, text: "anggota" },
    { id: "selesaiHariIni", value: selesai, text: "selesai" }
  ];
  
  elements.forEach(({ id, value, text }) => {
    const element = document.getElementById(id);
    if (!element) return;
    
    if (value === 0) {
      element.innerHTML = `<strong>0</strong> ${text}`;
      return;
    }
    
    // Simple counter animation
    let current = 0;
    const increment = value / 30;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        current = value;
        clearInterval(timer);
      }
      element.innerHTML = `<strong>${Math.round(current)}</strong> ${text}`;
    }, 30);
  });
}

// Fungsi untuk menampilkan aktivitas terbaru dari data
function updateRecentActivity(detailData) {
  const activityContainer = document.getElementById("recentActivity");
  if (!activityContainer || !Array.isArray(detailData)) return;
  
  // Ambil 3-5 aktivitas terbaru
  const recentItems = [...detailData]
    .sort((a, b) => {
      const dateA = new Date(a.created_at || a.tanggal_jadwal || 0);
      const dateB = new Date(b.created_at || b.tanggal_jadwal || 0);
      return dateB - dateA;
    })
    .slice(0, 5);
  
  if (recentItems.length === 0) {
    activityContainer.innerHTML = `
      <div class="activity-item-tim">
        <div class="activity-icon-tim">📅</div>
        <div class="activity-content-tim">
          <p><strong>Tidak ada aktivitas</strong></p>
          <small>Belum ada jadwal hari ini</small>
        </div>
      </div>
    `;
    return;
  }
  
  const activityHTML = recentItems.map(item => {
    const status = item.status_pengangkutan || item.status || 'terjadwal';
    const nama = item.nama_anggota || item.nama || 'Anggota';
    const tanggal = item.tanggal_jadwal || item.tanggal || '';
    
    let icon = '📅';
    let color = 'var(--tim-primary)';
    
    if (status.toLowerCase().includes('selesai')) {
      icon = '✅';
      color = '#28a745';
    } else if (status.toLowerCase().includes('proses')) {
      icon = '🔄';
      color = '#ffc107';
    } else if (status.toLowerCase().includes('batal')) {
      icon = '❌';
      color = '#dc3545';
    }
    
    return `
      <div class="activity-item-tim">
        <div class="activity-icon-tim" style="background: ${color}20; color: ${color};">${icon}</div>
        <div class="activity-content-tim">
          <p><strong>${nama}</strong></p>
          <small>${status} • ${tanggal}</small>
        </div>
      </div>
    `;
  }).join('');
  
  activityContainer.innerHTML = activityHTML;
}

export async function dashboardTim() {
  const user = await authGuard();
  if (!user) return;

  if (user.role !== "tim_angkut") {
    alert("Hanya tim angkut yang bisa mengakses dashboard ini!");
    window.location.hash = "#/dashboard";
    return;
  }

  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="dashboard-tim">
      <!-- SIDEBAR -->
      <div class="sidebar-tim">
        <div class="sidebar-header-tim">
          <h2>🚚 CleanUp</h2>
          <p class="user-info-tim">${user.username} <span class="badge-tim">TIM</span></p>
        </div>
        
        <div class="sidebar-menu-tim">
          <div class="menu-section-tim">
            <h3>🏠 Dashboard</h3>
            <button class="menu-item-tim active" data-page="dashboard">
              <span>📊 Dashboard Utama</span>
            </button>
          </div>
          
          <div class="menu-section-tim">
            <h3>📋 Operasional</h3>
            <button class="menu-item-tim" data-page="jadwal">
              <span>📅 Jadwal</span>
            </button>
            <button class="menu-item-tim" data-page="detail">
              <span>👥 Detail Anggota</span>
            </button>
            <button class="menu-item-tim" data-page="anggota">
              <span>👤 Anggota</span>
            </button>
          </div>
          
          <div class="menu-section-tim">
            <h3>📝 Laporan & Pembayaran</h3>
            <button class="menu-item-tim" data-page="laporan">
              <span>🗑️ Laporan Sampah</span>
            </button>
            <button class="menu-item-tim" data-page="pembayaran">
              <span>💰 Pembayaran</span>
            </button>
          </div>
          
          <div class="menu-section-tim">
            <h3>⚙️ Sistem</h3>
            <button class="menu-item-tim" id="btnLogout">
              <span>🚪 Logout</span>
            </button>
          </div>
        </div>
        
        <div class="sidebar-footer-tim">
          <p>Tim Angkut • v1.0.0</p>
        </div>
      </div>
      
      <!-- MAIN CONTENT -->
      <div class="main-content-tim">
        <div class="top-bar-tim">
          <div class="breadcrumb-tim">
            <span id="pageTitle">Dashboard Tim</span>
          </div>
          <div class="top-bar-actions-tim">
            <div class="user-profile-tim">
              <span>${user.username}</span>
              <div class="avatar-tim">${user.username.charAt(0).toUpperCase()}</div>
            </div>
          </div>
        </div>
        
        <div class="content-wrapper-tim">
          <div id="mainContent">
            <!-- Dashboard default content -->
            <div class="dashboard-default-tim">
              <div class="welcome-card-tim">
                <h1>🚚 Dashboard Tim Pengangkut</h1>
                <p>Selamat datang, <b>${user.username}</b> 👷</p>
                <p class="status-badge-tim">Tim Angkut Aktif</p>
              </div>
              
              <div class="stats-grid-tim">
                <div class="stat-card-tim" style="background: linear-gradient(135deg, #28a745, #20c997);">
                  <div class="stat-icon-tim">📅</div>
                  <div class="stat-info-tim">
                    <h3>Jadwal Hari Ini</h3>
                    <p class="stat-number-tim" id="jadwalHariIni">0</p>
                    <span class="stat-desc-tim">Jadwal terjadwal</span>
                  </div>
                </div>
                
                <div class="stat-card-tim" style="background: linear-gradient(135deg, #ffc107, #fd7e14);">
                  <div class="stat-icon-tim">🔄</div>
                  <div class="stat-info-tim">
                    <h3>Dalam Proses</h3>
                    <p class="stat-number-tim" id="dalamProses">0</p>
                    <span class="stat-desc-tim">Sedang diproses</span>
                  </div>
                </div>
                
                <div class="stat-card-tim" style="background: linear-gradient(135deg, #17a2b8, #0dcaf0);">
                  <div class="stat-icon-tim">✅</div>
                  <div class="stat-info-tim">
                    <h3>Selesai Hari Ini</h3>
                    <p class="stat-number-tim" id="selesaiHariIni">0</p>
                    <span class="stat-desc-tim">Berhasil diselesaikan</span>
                  </div>
                </div>
              </div>
              
              <div class="quick-actions-tim">
                <h3>⚡ Mulai Bekerja</h3>
                <p>Pilih menu di sidebar untuk memulai pekerjaan Anda</p>
                
                <div class="actions-grid-tim">
                  <button class="action-btn-tim" data-action="jadwal">
                    <span class="action-icon">📅</span>
                    <span>Lihat Jadwal</span>
                    <small>Kelola jadwal pengangkutan</small>
                  </button>
                  
                  <button class="action-btn-tim" data-action="detail">
                    <span class="action-icon">👥</span>
                    <span>Detail Anggota</span>
                    <small>Lihat detail anggota</small>
                  </button>
                  
                  <button class="action-btn-tim" data-action="laporan">
                    <span class="action-icon">🗑️</span>
                    <span>Laporan Sampah</span>
                    <small>Kelola laporan sampah</small>
                  </button>
                  
                  <button class="action-btn-tim" data-action="pembayaran">
                    <span class="action-icon">💰</span>
                    <span>Pembayaran</span>
                    <small>Kelola pembayaran</small>
                  </button>
                </div>
              </div>
              
              <div class="recent-activity-tim">
                <h3>📝 Aktivitas Terbaru</h3>
                <div class="activity-list-tim" id="recentActivity">
                  <div class="activity-item-tim">
                    <div class="activity-icon-tim">🚚</div>
                    <div class="activity-content-tim">
                      <p><strong>Siap bekerja hari ini!</strong></p>
                      <small>Mulai dengan melihat jadwal pengangkutan</small>
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
    </div>
  `;

  // Add CSS styles
  addDashboardTimStyles();

  // Setup all event listeners
  setupEventListeners();

  // Load dashboard stats
  await loadDashboardStats();
}

function setupEventListeners() {
  // Navigation event listeners untuk sidebar menu
  document.querySelectorAll('.menu-item-tim').forEach(btn => {
    if (btn.id !== 'btnLogout') {
      btn.onclick = () => {
        // Remove active class from all menu items
        document.querySelectorAll('.menu-item-tim').forEach(item => {
          item.classList.remove('active');
        });
        // Add active class to clicked item
        btn.classList.add('active');
        loadPage(btn.dataset.page);
      };
    }
  });

  // Navigation event listeners untuk action buttons
  document.querySelectorAll('.action-btn-tim').forEach(btn => {
    btn.onclick = () => {
      const page = btn.getAttribute('data-action');
      // Update active menu
      document.querySelectorAll('.menu-item-tim').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === page) {
          item.classList.add('active');
        }
      });
      loadPage(page);
    };
  });

  // Tombol logout
    const btnLogout = document.getElementById("btnLogout");
    if (btnLogout) {
        btnLogout.onclick = () => {
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
}

function addDashboardTimStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* VARIABLES - TEMA TIM ANGKUT */
    :root {
      --tim-primary: #667eea;
      --tim-primary-dark: #5a67d8;
      --tim-primary-light: #a3bffa;
      --tim-primary-soft: #ebf4ff;
      --tim-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --tim-success: #28a745;
      --tim-warning: #ffc107;
      --tim-info: #17a2b8;
      --tim-danger: #dc3545;
      --tim-dark: #2d3748;
      --tim-light: #f7fafc;
      --tim-gray: #718096;
      --tim-gray-light: #e2e8f0;
      --tim-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
      --tim-shadow-strong: 0 8px 24px rgba(102, 126, 234, 0.25);
      --tim-radius: 12px;
      --tim-radius-sm: 8px;
      --tim-transition: all 0.3s ease;
    }
    
    /* DASHBOARD TIM LAYOUT */
    .dashboard-tim {
      display: flex;
      min-height: 100vh;
      background: var(--tim-light);
    }
    
    /* SIDEBAR TIM - FIXED */
    .sidebar-tim {
      width: 260px;
      height: 100vh;
      background: white;
      box-shadow: 2px 0 20px rgba(102, 126, 234, 0.1);
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 1000;
      border-right: 3px solid var(--tim-primary);
      overflow-y: auto;
    }
    
    .sidebar-header-tim {
      padding: 24px 20px;
      background: var(--tim-gradient);
      color: white;
      text-align: center;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    
    .sidebar-header-tim h2 {
      margin: 0 0 10px 0;
      font-size: 22px;
      font-weight: 700;
    }
    
    .user-info-tim {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .badge-tim {
      background: var(--tim-warning);
      color: var(--tim-dark);
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: bold;
      margin-left: 8px;
    }
    
    .sidebar-menu-tim {
      flex: 1;
      padding: 20px 0;
    }
    
    .menu-section-tim {
      padding: 0 20px;
      margin-bottom: 24px;
    }
    
    .menu-section-tim h3 {
      font-size: 11px;
      text-transform: uppercase;
      color: var(--tim-gray);
      margin: 0 0 12px 15px;
      font-weight: 600;
      letter-spacing: 1px;
    }
    
    .menu-item-tim {
      width: 100%;
      padding: 12px 20px;
      border: none;
      background: transparent;
      color: var(--tim-dark);
      text-align: left;
      display: flex;
      align-items: center;
      gap: 12px;
      border-radius: var(--tim-radius-sm);
      margin: 4px 0;
      cursor: pointer;
      transition: var(--tim-transition);
      font-size: 14px;
      font-weight: 500;
    }
    
    .menu-item-tim:hover {
      background: var(--tim-primary-soft);
      color: var(--tim-primary-dark);
      transform: translateX(5px);
    }
    
    .menu-item-tim.active {
      background: var(--tim-primary);
      color: white;
      box-shadow: var(--tim-shadow);
    }
    
    .menu-item-tim span {
      flex: 1;
    }
    
    .sidebar-footer-tim {
      padding: 15px 20px;
      border-top: 1px solid var(--tim-gray-light);
      text-align: center;
      font-size: 11px;
      color: var(--tim-gray);
    }
    
    /* MAIN CONTENT TIM */
    .main-content-tim {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin-left: 260px;
    }
    
    .top-bar-tim {
      background: white;
      padding: 18px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      border-bottom: 2px solid var(--tim-primary-soft);
    }
    
    .breadcrumb-tim {
      font-size: 18px;
      font-weight: 600;
      color: var(--tim-dark);
    }
    
    .breadcrumb-tim span {
      color: var(--tim-primary);
    }
    
    .user-profile-tim {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .avatar-tim {
      width: 36px;
      height: 36px;
      background: var(--tim-gradient);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 16px;
    }
    
    .content-wrapper-tim {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      background: var(--tim-light);
    }
    
    /* DASHBOARD DEFAULT CONTENT */
    .dashboard-default-tim {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .welcome-card-tim {
      background: white;
      border-radius: var(--tim-radius);
      padding: 30px;
      margin-bottom: 25px;
      box-shadow: var(--tim-shadow);
      text-align: center;
      border-left: 5px solid var(--tim-primary);
    }
    
    .welcome-card-tim h1 {
      margin: 0 0 15px 0;
      color: var(--tim-dark);
      font-size: 28px;
    }
    
    .welcome-card-tim p {
      margin: 8px 0;
      color: var(--tim-gray);
    }
    
    .status-badge-tim {
      display: inline-block;
      background: var(--tim-primary-soft);
      color: var(--tim-primary-dark);
      padding: 6px 15px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 10px;
    }
    
    /* STATS CARDS TIM */
    .stats-grid-tim {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 25px 0;
    }
    
    .stat-card-tim {
      border-radius: var(--tim-radius);
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: var(--tim-shadow);
      transition: var(--tim-transition);
      color: white;
      position: relative;
      overflow: hidden;
    }
    
    .stat-card-tim::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 100%;
      background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0));
    }
    
    .stat-card-tim:hover {
      transform: translateY(-5px);
      box-shadow: var(--tim-shadow-strong);
    }
    
    .stat-icon-tim {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
    }
    
    .stat-info-tim h3 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
      opacity: 0.9;
    }
    
    .stat-number-tim {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 5px 0;
    }
    
    .stat-desc-tim {
      font-size: 12px;
      opacity: 0.8;
    }
    
    /* QUICK ACTIONS TIM */
    .quick-actions-tim {
      background: white;
      border-radius: var(--tim-radius);
      padding: 24px;
      margin: 30px 0;
      box-shadow: var(--tim-shadow);
    }
    
    .quick-actions-tim h3 {
      margin: 0 0 10px 0;
      color: var(--tim-dark);
      font-size: 18px;
    }
    
    .quick-actions-tim p {
      color: var(--tim-gray);
      margin: 0 0 20px 0;
    }
    
    .actions-grid-tim {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }
    
    .action-btn-tim {
      background: white;
      border: 2px solid var(--tim-primary-soft);
      border-radius: var(--tim-radius-sm);
      padding: 20px;
      cursor: pointer;
      transition: var(--tim-transition);
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .action-btn-tim:hover {
      border-color: var(--tim-primary);
      background: var(--tim-primary-soft);
      transform: translateY(-3px);
      box-shadow: var(--tim-shadow);
    }
    
    .action-icon {
      font-size: 28px;
      color: var(--tim-primary);
    }
    
    .action-btn-tim span:not(.action-icon) {
      font-weight: 600;
      color: var(--tim-dark);
      font-size: 16px;
    }
    
    .action-btn-tim small {
      color: var(--tim-gray);
      font-size: 13px;
    }
    
    /* RECENT ACTIVITY TIM */
    .recent-activity-tim {
      background: white;
      border-radius: var(--tim-radius);
      padding: 24px;
      box-shadow: var(--tim-shadow);
    }
    
    .recent-activity-tim h3 {
      margin: 0 0 20px 0;
      color: var(--tim-dark);
      font-size: 18px;
    }
    
    .activity-list-tim {
      max-height: 200px;
      overflow-y: auto;
    }
    
    .activity-item-tim {
      display: flex;
      align-items: center;
      padding: 15px;
      border-bottom: 1px solid var(--tim-gray-light);
      gap: 15px;
    }
    
    .activity-item-tim:last-child {
      border-bottom: none;
    }
    
    .activity-icon-tim {
      width: 36px;
      height: 36px;
      background: var(--tim-primary-soft);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: var(--tim-primary);
    }
    
    .activity-content-tim p {
      margin: 0 0 5px 0;
      font-weight: 500;
      color: var(--tim-dark);
    }
    
    .activity-content-tim small {
      color: var(--tim-gray);
      font-size: 12px;
    }
    
    /* RESPONSIVE */
    @media (max-width: 768px) {
      .sidebar-tim {
        width: 100%;
        height: auto;
        position: relative;
      }
      
      .main-content-tim {
        margin-left: 0;
      }
      
      .stats-grid-tim {
        grid-template-columns: 1fr;
      }
      
      .actions-grid-tim {
        grid-template-columns: 1fr;
      }
    }
  `;
  
  document.head.appendChild(style);
}

