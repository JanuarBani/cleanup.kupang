// pages/dashboard_admin.js - PERBAIKAN LENGKAP DENGAN BOOTSTRAP 5
import { authGuard } from "../utils/authGuard.js";
import { userAdminPage } from "./admin/users.js";
import { timAdminPage } from "./admin/tim.js";
import { anggotaAdminPage } from "./admin/anggota.js";
import { tamuAdminPage } from "./admin/tamu.js";
import { jadwalAdminPage } from "./admin/jadwal.js";
import { pembayaranAdminPage } from "./admin/pembayaran.js";
import { laporanAdminPage } from "./admin/laporan.js";
import { detailAnggotaJadwalAdminPage } from "./admin/detailAnggotaJadwal.js";
import { reportsAdminPage } from "./admin/reports.js"; 
import { API, getAuthHeaders } from "../api.js";

export async function dashboardAdmin() {
    const user = await authGuard();
    if (!user) return;
    
    console.log("👑 Admin Dashboard - User:", user);
    
    if (user.role !== 'admin') {
        alert("Hanya admin yang bisa mengakses dashboard ini!");
        window.location.hash = "#/dashboard";
        return;
    }

    const app = document.getElementById("app");
    app.innerHTML = `
        <!-- Bootstrap 5 CSS -->
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        
        <div class="container-fluid p-0 g-0" style="min-height: 100vh;">
            <!-- Sidebar dengan Bootstrap Offcanvas untuk semua device -->
            <div class="d-flex">
                <!-- Desktop Sidebar (LG ke atas) -->
                <div class="d-none d-lg-flex flex-column flex-shrink-0 p-3 bg-success text-white" 
                    style="width: 280px; min-height: 100vh; position: sticky; top: 0;">
                    <div class="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
                        <span class="fs-4 fw-bold">
                            <i class="bi bi-recycle me-2"></i>CleanUp
                        </span>
                    </div>
                    
                    <div class="mb-4 mt-4">
                        <div class="d-flex align-items-center mb-3">
                            <div class="rounded-circle bg-white text-success d-flex align-items-center justify-content-center" 
                                style="width: 40px; height: 40px; font-weight: bold; font-size: 18px;">
                                ${user.username.charAt(0).toUpperCase()}
                            </div>
                            <div class="ms-3">
                                <p class="mb-1 fw-semibold">${user.username}</p>
                                <span class="badge bg-warning text-dark">ADMIN</span>
                            </div>
                        </div>
                    </div>
                    
                    <hr class="bg-white">
                    
                    <ul class="nav nav-pills flex-column mb-auto" id="sidebarMenuDesktop">
                        <li class="nav-item mb-2">
                            <button class="nav-link active text-start w-100 d-flex align-items-center" data-page="dashboard">
                                <i class="bi bi-speedometer2 me-2"></i>
                                <span>Dashboard Utama</span>
                            </button>
                        </li>
                        
                        <!-- Manajemen User Section -->
                        <li class="nav-item">
                            <p class="small text-uppercase text-white-50 mt-4 mb-2 fw-semibold">
                                <i class="bi bi-people me-1"></i> MANAJEMEN USER
                            </p>
                        </li>
                        <li class="nav-item mb-1">
                            <button class="nav-link text-start w-100 d-flex align-items-center" data-page="users">
                                <i class="bi bi-person me-2"></i>
                                <span>Users</span>
                            </button>
                        </li>
                        <li class="nav-item mb-1">
                            <button class="nav-link text-start w-100 d-flex align-items-center" data-page="anggota">
                                <i class="bi bi-people-fill me-2"></i>
                                <span>Anggota</span>
                            </button>
                        </li>
                        <li class="nav-item mb-1">
                            <button class="nav-link text-start w-100 d-flex align-items-center" data-page="tamu">
                                <i class="bi bi-person-plus me-2"></i>
                                <span>Tamu</span>
                            </button>
                        </li>
                        
                        <!-- Operasional Section -->
                        <li class="nav-item">
                            <p class="small text-uppercase text-white-50 mt-4 mb-2 fw-semibold">
                                <i class="bi bi-truck me-1"></i> Operasional
                            </p>
                        </li>
                        <li class="nav-item mb-1">
                            <button class="nav-link text-start w-100 d-flex align-items-center" data-page="tim">
                                <i class="bi bi-truck me-2"></i>
                                <span>Tim Pengangkut</span>
                            </button>
                        </li>
                        <li class="nav-item mb-1">
                            <button class="nav-link text-start w-100 d-flex align-items-center" data-page="jadwal">
                                <i class="bi bi-calendar-check me-2"></i>
                                <span>Jadwal</span>
                            </button>
                        </li>
                        <li class="nav-item mb-1">
                            <button class="nav-link text-start w-100 d-flex align-items-center" data-page="detailJadwal">
                                <i class="bi bi-calendar-week me-2"></i>
                                <span>Detail Jadwal</span>
                            </button>
                        </li>
                        
                        <!-- Keuangan Section -->
                        <li class="nav-item">
                            <p class="small text-uppercase text-white-50 mt-4 mb-2 fw-semibold">
                                <i class="bi bi-cash-coin me-1"></i> Keuangan
                            </p>
                        </li>
                        <li class="nav-item mb-1">
                            <button class="nav-link text-start w-100 d-flex align-items-center" data-page="pembayaran">
                                <i class="bi bi-cash-stack me-2"></i>
                                <span>Pembayaran</span>
                            </button>
                        </li>
                        
                        <!-- Laporan Section -->
                        <li class="nav-item">
                            <p class="small text-uppercase text-white-50 mt-4 mb-2 fw-semibold">
                                <i class="bi bi-clipboard-data me-1"></i> Laporan
                            </p>
                        </li>
                        <li class="nav-item mb-1">
                            <button class="nav-link text-start w-100 d-flex align-items-center" data-page="laporan">
                                <i class="bi bi-trash me-2"></i>
                                <span>Laporan Sampah</span>
                            </button>
                        </li>
                        <li class="nav-item mb-1">
                            <button class="nav-link text-start w-100 d-flex align-items-center" data-page="reports">
                                <i class="bi bi-graph-up me-2"></i>
                                <span>Analitik & Laporan</span>
                            </button>
                        </li>
                    </ul>
                    
                    <hr class="bg-white">
                    
                    <div class="mt-auto">
                        <button class="btn btn-outline-light w-100 d-flex align-items-center justify-content-center" id="btnLogout">
                            <i class="bi bi-box-arrow-right me-2"></i>
                            Logout
                        </button>
                        <div class="text-center mt-3">
                            <small class="text-white-50">v1.0.0 • CleanUp System</small>
                        </div>
                    </div>
                </div>
                
                <!-- Mobile Sidebar (Offcanvas) untuk semua device di bawah LG -->
                <div class="offcanvas offcanvas-start d-lg-none" tabindex="-1" id="sidebarOffcanvas" 
                    style="width: 280px; background: linear-gradient(180deg, #198754 0%, #146c43 100%);">
                    <div class="offcanvas-header border-bottom border-white-20">
                        <div class="d-flex align-items-center">
                            <div class="rounded-circle bg-white text-success d-flex align-items-center justify-content-center me-3" 
                                style="width: 40px; height: 40px; font-weight: bold; font-size: 18px;">
                                ${user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h5 class="offcanvas-title text-white mb-0">${user.username}</h5>
                                <small class="text-white-50">ADMIN</small>
                            </div>
                        </div>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
                    </div>
                    
                    <div class="offcanvas-body p-0">
                        <div class="d-flex align-items-center justify-content-center p-3 border-bottom border-white-20">
                            <span class="fs-4 fw-bold text-white">
                                <i class="bi bi-recycle me-2"></i>CleanUp
                            </span>
                        </div>
                        
                        <ul class="nav nav-pills flex-column mb-auto p-3" id="sidebarMenuMobile">
                            <li class="nav-item mb-2">
                                <button class="nav-link active text-start w-100 d-flex align-items-center text-white" 
                                        data-page="dashboard" data-bs-dismiss="offcanvas">
                                    <i class="bi bi-speedometer2 me-2"></i>
                                    <span>Dashboard Utama</span>
                                </button>
                            </li>
                            
                            <!-- Manajemen User Section -->
                            <li class="nav-item">
                                <p class="small text-uppercase text-white-50 mt-4 mb-2 fw-semibold">
                                    <i class="bi bi-people me-1"></i> MANAJEMEN USER
                                </p>
                            </li>
                            <li class="nav-item mb-1">
                                <button class="nav-link text-start w-100 d-flex align-items-center text-white" 
                                        data-page="users" data-bs-dismiss="offcanvas">
                                    <i class="bi bi-person me-2"></i>
                                    <span>Users</span>
                                </button>
                            </li>
                            <li class="nav-item mb-1">
                                <button class="nav-link text-start w-100 d-flex align-items-center text-white" 
                                        data-page="anggota" data-bs-dismiss="offcanvas">
                                    <i class="bi bi-people-fill me-2"></i>
                                    <span>Anggota</span>
                                </button>
                            </li>
                            <li class="nav-item mb-1">
                                <button class="nav-link text-start w-100 d-flex align-items-center text-white" 
                                        data-page="tamu" data-bs-dismiss="offcanvas">
                                    <i class="bi bi-person-plus me-2"></i>
                                    <span>Tamu</span>
                                </button>
                            </li>
                            
                            <!-- Operasional Section -->
                            <li class="nav-item">
                                <p class="small text-uppercase text-white-50 mt-4 mb-2 fw-semibold">
                                    <i class="bi bi-truck me-1"></i> Operasional
                                </p>
                            </li>
                            <li class="nav-item mb-1">
                                <button class="nav-link text-start w-100 d-flex align-items-center text-white" 
                                        data-page="tim" data-bs-dismiss="offcanvas">
                                    <i class="bi bi-truck me-2"></i>
                                    <span>Tim Pengangkut</span>
                                </button>
                            </li>
                            <li class="nav-item mb-1">
                                <button class="nav-link text-start w-100 d-flex align-items-center text-white" 
                                        data-page="jadwal" data-bs-dismiss="offcanvas">
                                    <i class="bi bi-calendar-check me-2"></i>
                                    <span>Jadwal</span>
                                </button>
                            </li>
                            <li class="nav-item mb-1">
                                <button class="nav-link text-start w-100 d-flex align-items-center text-white" 
                                        data-page="detailJadwal" data-bs-dismiss="offcanvas">
                                    <i class="bi bi-calendar-week me-2"></i>
                                    <span>Detail Jadwal</span>
                                </button>
                            </li>
                            
                            <!-- Keuangan Section -->
                            <li class="nav-item">
                                <p class="small text-uppercase text-white-50 mt-4 mb-2 fw-semibold">
                                    <i class="bi bi-cash-coin me-1"></i> Keuangan
                                </p>
                            </li>
                            <li class="nav-item mb-1">
                                <button class="nav-link text-start w-100 d-flex align-items-center text-white" 
                                        data-page="pembayaran" data-bs-dismiss="offcanvas">
                                    <i class="bi bi-cash-stack me-2"></i>
                                    <span>Pembayaran</span>
                                </button>
                            </li>
                            
                            <!-- Laporan Section -->
                            <li class="nav-item">
                                <p class="small text-uppercase text-white-50 mt-4 mb-2 fw-semibold">
                                    <i class="bi bi-clipboard-data me-1"></i> Laporan
                                </p>
                            </li>
                            <li class="nav-item mb-1">
                                <button class="nav-link text-start w-100 d-flex align-items-center text-white" 
                                        data-page="laporan" data-bs-dismiss="offcanvas">
                                    <i class="bi bi-trash me-2"></i>
                                    <span>Laporan Sampah</span>
                                </button>
                            </li>
                            <li class="nav-item mb-1">
                                <button class="nav-link text-start w-100 d-flex align-items-center text-white" 
                                        data-page="reports" data-bs-dismiss="offcanvas">
                                    <i class="bi bi-graph-up me-2"></i>
                                    <span>Analitik & Laporan</span>
                                </button>
                            </li>
                        </ul>
                        
                        <div class="p-3 border-top border-white-20 mt-auto">
                            <button class="btn btn-outline-light w-100 d-flex align-items-center justify-content-center" 
                                    id="btnLogoutMobile">
                                <i class="bi bi-box-arrow-right me-2"></i>
                                Logout
                            </button>
                            <div class="text-center mt-3">
                                <small class="text-white-50">v1.0.0 • CleanUp System</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Main Content Area -->
                <div class="flex-grow-1">
                    <!-- Top Navigation Bar -->
                    <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm sticky-top" style="z-index: 999;">
                        <div class="container-fluid">
                            <!-- Mobile Toggle Button untuk semua device di bawah LG -->
                            <button class="btn btn-success d-lg-none me-2" type="button" data-bs-toggle="offcanvas" 
                                    data-bs-target="#sidebarOffcanvas">
                                <i class="bi bi-list fs-5"></i>
                            </button>
                            
                            <!-- Page Title Area -->
                            <div class="d-flex align-items-center">
                                <h5 class="mb-0 text-success fw-bold" id="pageTitle">
                                    <i class="bi bi-speedometer2 me-2"></i>Dashboard Admin
                                </h5>
                            </div>
                            
                            <!-- User Info Area -->
                            <div class="d-flex align-items-center">
                                <div class="d-flex align-items-center me-3">
                                    <div class="rounded-circle bg-success text-white d-flex align-items-center justify-content-center" 
                                        style="width: 40px; height: 40px; font-weight: bold;">
                                        ${user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div class="ms-2 d-none d-sm-block">
                                        <p class="mb-0 fw-semibold">${user.username}</p>
                                        <small class="text-muted">Administrator</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </nav>
                    
                    <!-- Main Content Container -->
                    <div class="container-fluid py-4 px-3 px-md-4">
                        <div class="row">
                            <div class="col-12">
                                <div id="mainContent" class="animate__animated animate__fadeIn">
                                    <!-- Konten akan dimuat di sini -->
                                    <div class="text-center py-5">
                                        <div class="display-1 text-success mb-4">
                                            <i class="bi bi-speedometer2"></i>
                                        </div>
                                        <h3 class="mb-3">Dashboard Admin CleanUp</h3>
                                        <p class="text-muted">Pilih menu di sidebar untuk mengakses fitur</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Bootstrap JS Bundle with Popper -->
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
        <!-- Animate.css for animations -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
    `;

    // Add custom CSS styles
    addDashboardStyles();

    // Navigation event listeners for both desktop and mobile
    setupNavigation();
    
    // PERBAIKAN: Logout event listeners - gunakan window.logout
    const btnLogout = document.getElementById("btnLogout");
    if (btnLogout) {
        btnLogout.onclick = () => {
            console.log("🔄 Admin: Logout button clicked");
            if (typeof window.logout === 'function') {
                window.logout();
            } else {
                console.error("❌ window.logout function not found");
                // Fallback sederhana
                localStorage.clear();
                window.location.hash = "#/login";
                window.location.reload();
            }
        };
    }
    
    const btnLogoutMobile = document.getElementById("btnLogoutMobile");
    if (btnLogoutMobile) {
        btnLogoutMobile.onclick = () => {
            console.log("🔄 Admin: Mobile logout button clicked");
            if (typeof window.logout === 'function') {
                window.logout();
            } else {
                console.error("❌ window.logout function not found");
                // Fallback sederhana
                localStorage.clear();
                window.location.hash = "#/login";
                window.location.reload();
            }
        };
    }

    // Load default page (dashboard dengan statistik)
    await showDashboardStats();
}

function setupNavigation() {
    const menuButtons = document.querySelectorAll('#sidebarMenu button[data-page], #sidebarMenuMobile button[data-page]');
    
    menuButtons.forEach(btn => {
        btn.onclick = () => {
            // Remove active class from all buttons
            menuButtons.forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Load the page
            loadPage(btn.dataset.page);
        };
    });
}

// ==================== HAPUS FUNGSI handleLogout() LAMA ====================
// Hapus atau komentari fungsi ini karena kita menggunakan window.logout
/*
function handleLogout() {
    // ... fungsi lama dihapus ...
}
*/

async function loadPage(page) {
    const mainContent = document.getElementById("mainContent");
    const pageTitle = document.getElementById("pageTitle");
    
    // Set page title
    const pageTitles = {
        'dashboard': '<i class="bi bi-speedometer2 me-2"></i>Dashboard Utama',
        'users': '<i class="bi bi-person me-2"></i>Manajemen Users',
        'tim': '<i class="bi bi-truck me-2"></i>Tim Pengangkut',
        'anggota': '<i class="bi bi-people-fill me-2"></i>Anggota',
        'tamu': '<i class="bi bi-person-plus me-2"></i>Tamu',
        'jadwal': '<i class="bi bi-calendar-check me-2"></i>Jadwal Pengangkutan',
        'detailJadwal': '<i class="bi bi-calendar-week me-2"></i>Detail Jadwal Anggota',
        'pembayaran': '<i class="bi bi-cash-stack me-2"></i>Pembayaran',
        'laporan': '<i class="bi bi-trash me-2"></i>Laporan Sampah',
        'reports': '<i class="bi bi-graph-up me-2"></i>Analitik & Laporan'
    };
    
    pageTitle.innerHTML = pageTitles[page] || 'Dashboard Admin';
    
    // Show loading
    mainContent.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center py-5">
            <div class="spinner-border text-success" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3 text-muted">Memuat halaman...</p>
        </div>
    `;
    
    try {
        switch(page) {
            case 'users':
                await userAdminPage();
                break;
            case 'tim':
                await timAdminPage();
                break;
            case 'anggota':
                await anggotaAdminPage();
                break;
            case 'tamu':
                await tamuAdminPage();
                break;
            case 'jadwal':
                await jadwalAdminPage();
                break;
            case 'detailJadwal':
                await detailAnggotaJadwalAdminPage();
                break;
            case 'pembayaran':
                await pembayaranAdminPage();
                break;
            case 'laporan':
                await laporanAdminPage();
                break;
            case 'reports':
                await reportsAdminPage();
                break;
            case 'dashboard':
                await showDashboardStats();
                break;
            default:
                mainContent.innerHTML = `
                    <div class="card">
                        <div class="card-body text-center py-5">
                            <h4 class="text-danger">
                                <i class="bi bi-exclamation-triangle me-2"></i>Halaman tidak ditemukan
                            </h4>
                            <p class="text-muted">Halaman ${page} tidak tersedia</p>
                            <button onclick="loadPage('dashboard')" class="btn btn-success">
                                <i class="bi bi-house me-1"></i> Kembali ke Dashboard
                            </button>
                        </div>
                    </div>
                `;
        }
    } catch (error) {
        console.error('Error loading page:', error);
        mainContent.innerHTML = `
            <div class="card border-danger">
                <div class="card-body text-center py-5">
                    <div class="text-danger mb-3">
                        <i class="bi bi-exclamation-triangle-fill" style="font-size: 3rem;"></i>
                    </div>
                    <h4 class="text-danger">Terjadi Kesalahan</h4>
                    <p class="text-muted">Gagal memuat halaman: ${error.message}</p>
                    <button onclick="location.reload()" class="btn btn-outline-success">
                        <i class="bi bi-arrow-clockwise me-1"></i> Coba Lagi
                    </button>
                </div>
            </div>
        `;
    }
}

// ==================== DASHBOARD STATISTICS ====================

async function fetchDashboardStats() {
    try {
        console.log("📊 Fetching dashboard stats...");
        
        // Fetch all data in parallel
        const [usersRes, anggotaRes, timRes, pembayaranRes, laporanRes, jadwalRes] = await Promise.allSettled([
            fetch(API.users, { headers: getAuthHeaders() }),
            fetch(API.anggota, { headers: getAuthHeaders() }),
            fetch(API.timPengangkut, { headers: getAuthHeaders() }),
            fetch(API.pembayaran, { headers: getAuthHeaders() }),
            fetch(API.laporanSampah, { headers: getAuthHeaders() }),
            fetch(API.jadwal, { headers: getAuthHeaders() })
        ]);

        // Process responses
        const users = usersRes.status === 'fulfilled' ? await usersRes.value.json() : [];
        const anggota = anggotaRes.status === 'fulfilled' ? await anggotaRes.value.json() : [];
        const tim = timRes.status === 'fulfilled' ? await timRes.value.json() : [];
        const pembayaran = pembayaranRes.status === 'fulfilled' ? await pembayaranRes.value.json() : [];
        const laporan = laporanRes.status === 'fulfilled' ? await laporanRes.value.json() : [];
        const jadwal = jadwalRes.status === 'fulfilled' ? await jadwalRes.value.json() : [];

        // Calculate statistics
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        // Total Users
        const totalUsers = users.length || 0;
        
        // Active Members
        const anggotaAktif = anggota.filter(a => a.status === 'aktif').length || 0;
        
        // Total Teams
        const totalTim = tim.length || 0;
        
        // Monthly Payments
        const pembayaranBulanIni = pembayaran
            .filter(p => {
                try {
                    const bayarDate = new Date(p.tanggalBayar);
                    return bayarDate.getMonth() + 1 === currentMonth && 
                           bayarDate.getFullYear() === currentYear && 
                           p.statusBayar === 'lunas';
                } catch {
                    return false;
                }
            })
            .reduce((sum, p) => sum + (p.jumlahBayar || 0), 0);
        
        // Total Reports
        const totalLaporan = laporan.length || 0;
        
        // Today's Schedules
        const jadwalHariIni = jadwal.filter(j => j.tanggalJadwal === today).length || 0;
        
        // User Roles Distribution
        const userRoles = {};
        users.forEach(user => {
            userRoles[user.role] = (userRoles[user.role] || 0) + 1;
        });
        
        // Report Status Distribution
        const laporanStatus = {};
        laporan.forEach(report => {
            laporanStatus[report.status] = (laporanStatus[report.status] || 0) + 1;
        });
        
        // Recent Activities
        const recentActivities = await fetchRecentActivities();
        
        return {
            totalUsers,
            anggotaAktif,
            totalTim,
            totalPembayaranBulanIni: pembayaranBulanIni,
            totalLaporan,
            jadwalHariIni,
            userRoles,
            laporanStatus,
            recentActivities
        };
        
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
            totalUsers: 0,
            anggotaAktif: 0,
            totalTim: 0,
            totalPembayaranBulanIni: 0,
            totalLaporan: 0,
            jadwalHariIni: 0,
            userRoles: {},
            laporanStatus: {},
            recentActivities: []
        };
    }
}

async function fetchRecentActivities() {
    try {
        console.log("📝 Fetching recent activities...");
        
        const [laporanRes, pembayaranRes, anggotaRes] = await Promise.allSettled([
            fetch(API.laporanSampah + '?ordering=-tanggal_lapor', { headers: getAuthHeaders() }),
            fetch(API.pembayaran + '?ordering=-tanggalBayar', { headers: getAuthHeaders() }),
            fetch(API.anggota + '?ordering=-tanggalStart', { headers: getAuthHeaders() })
        ]);

        const laporan = laporanRes.status === 'fulfilled' ? await laporanRes.value.json() : [];
        const pembayaran = pembayaranRes.status === 'fulfilled' ? await pembayaranRes.value.json() : [];
        const anggota = anggotaRes.status === 'fulfilled' ? await anggotaRes.value.json() : [];

        const activities = [];
        
        // Add recent reports
        laporan.slice(0, 3).forEach(l => {
            activities.push({
                type: 'laporan',
                icon: '🗑️',
                title: `Laporan baru dari ${l.nama || 'Anonymous'}`,
                desc: `Status: ${l.status || 'pending'}`,
                time: l.tanggal_lapor ? formatTimeAgo(l.tanggal_lapor) : 'Baru saja'
            });
        });
        
        // Add recent payments
        pembayaran.slice(0, 3).forEach(p => {
            activities.push({
                type: 'pembayaran',
                icon: '💰',
                title: `Pembayaran diterima`,
                desc: `Rp ${(p.jumlahBayar || 0).toLocaleString()} - ${p.statusBayar || 'pending'}`,
                time: p.tanggalBayar ? formatTimeAgo(p.tanggalBayar) : 'Baru saja'
            });
        });
        
        // Add new members
        anggota.slice(0, 2).forEach(a => {
            activities.push({
                type: 'anggota',
                icon: '👤',
                title: `Anggota baru: ${a.nama || 'Tanpa nama'}`,
                desc: `Jenis: ${a.jenisSampah || 'Rumah Tangga'}`,
                time: a.tanggalStart ? formatTimeAgo(a.tanggalStart) : 'Baru saja'
            });
        });

        // Sort by time (newest first) and limit to 5
        return activities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);
        
    } catch (error) {
        console.error('Error fetching activities:', error);
        return [];
    }
}

function formatTimeAgo(dateString) {
    if (!dateString) return 'Baru saja';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays === 1) return 'Kemarin';
        if (diffDays < 7) return `${diffDays} hari lalu`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
        return `${Math.floor(diffDays / 30)} bulan lalu`;
    } catch {
        return 'Baru saja';
    }
}

async function showDashboardStats() {
    const mainContent = document.getElementById("mainContent");
    
    // Show loading dengan animasi
    mainContent.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center py-5">
            <div class="spinner-border text-success" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3 text-muted">Memuat statistik dashboard...</p>
        </div>
    `;
    
    try {
        // Fetch semua data sekaligus
        const [stats, trendData] = await Promise.all([
            fetchDashboardStats(),
            fetchTrendData()
        ]);
        
        // Format angka dengan locale Indonesia
        const formatRupiah = (number) => {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(number);
        };
        
        mainContent.innerHTML = `
            <div class="dashboard-stats">
                <!-- Header -->
                <div class="mb-4">
                    <h3 class="text-success fw-bold">📊 Dashboard Utama</h3>
                    <p class="text-muted mb-1">Selamat datang di panel administrasi CleanUp System</p>
                    <small class="text-muted">
                        <i class="bi bi-clock-history me-1"></i>Terakhir diperbarui: ${new Date().toLocaleTimeString('id-ID')}
                    </small>
                </div>
                
                <!-- Alert Cards -->
                ${stats.alerts && stats.alerts.length > 0 ? renderAlertCards(stats) : ''}
                
                <!-- Stats Cards - PERBAIKAN: 2 baris × 3 kolom -->
                <div class="row g-3 mb-4">
                    <!-- Baris 1 -->
                    <div class="col-xl-4 col-lg-4 col-md-6 col-sm-6">
                        <div class="card h-100 border-0 shadow-sm hover-card">
                            <div class="card-body p-4">
                                <div class="d-flex align-items-center">
                                    <div class="bg-success bg-opacity-10 p-3 rounded me-3 flex-shrink-0">
                                        <i class="bi bi-people-fill text-success fs-3"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h6 class="card-subtitle text-muted mb-2 text-truncate">Total Users</h6>
                                        <h3 class="card-title text-success fw-bold mb-2">${stats.totalUsers ? stats.totalUsers.toLocaleString() : '0'}</h3>
                                        <small class="text-muted d-block text-truncate">Semua pengguna terdaftar</small>
                                    </div>
                                </div>
                            </div>
                            <div class="card-footer bg-transparent border-top-0 pt-0 pb-3 px-4">
                                <small class="text-muted">
                                    <i class="bi bi-info-circle me-1"></i>Total semua role
                                </small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-xl-4 col-lg-4 col-md-6 col-sm-6">
                        <div class="card h-100 border-0 shadow-sm hover-card">
                            <div class="card-body p-4">
                                <div class="d-flex align-items-center">
                                    <div class="bg-primary bg-opacity-10 p-3 rounded me-3 flex-shrink-0">
                                        <i class="bi bi-person-check-fill text-primary fs-3"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h6 class="card-subtitle text-muted mb-2 text-truncate">Anggota Aktif</h6>
                                        <h3 class="card-title text-primary fw-bold mb-2">${stats.anggotaAktif ? stats.anggotaAktif.toLocaleString() : '0'}</h3>
                                        <small class="text-muted d-block text-truncate">
                                            ${stats.totalUsers && stats.totalUsers > 0 ? 
                                                `${((stats.anggotaAktif / stats.totalUsers) * 100 || 0).toFixed(1)}% dari total` : 
                                                '0% dari total'
                                            }
                                        </small>
                                    </div>
                                </div>
                            </div>
                            <div class="card-footer bg-transparent border-top-0 pt-0 pb-3 px-4">
                                <small class="text-muted">
                                    <i class="bi bi-check-circle me-1"></i>Status aktif
                                </small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-xl-4 col-lg-4 col-md-6 col-sm-6">
                        <div class="card h-100 border-0 shadow-sm hover-card">
                            <div class="card-body p-4">
                                <div class="d-flex align-items-center">
                                    <div class="bg-warning bg-opacity-10 p-3 rounded me-3 flex-shrink-0">
                                        <i class="bi bi-truck text-warning fs-3"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h6 class="card-subtitle text-muted mb-2 text-truncate">Tim Pengangkut</h6>
                                        <h3 class="card-title text-warning fw-bold mb-2">${stats.totalTim ? stats.totalTim.toLocaleString() : '0'}</h3>
                                        <small class="text-muted d-block text-truncate">Tim aktif hari ini</small>
                                    </div>
                                </div>
                            </div>
                            <div class="card-footer bg-transparent border-top-0 pt-0 pb-3 px-4">
                                <small class="text-muted">
                                    <i class="bi bi-clock me-1"></i>Status operasional
                                </small>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Baris 2 -->
                    <div class="col-xl-4 col-lg-4 col-md-6 col-sm-6">
                        <div class="card h-100 border-0 shadow-sm hover-card">
                            <div class="card-body p-4">
                                <div class="d-flex align-items-center">
                                    <div class="bg-info bg-opacity-10 p-3 rounded me-3 flex-shrink-0">
                                        <i class="bi bi-cash-coin text-info fs-3"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h6 class="card-subtitle text-muted mb-2 text-truncate">Pembayaran Bulan Ini</h6>
                                        <h3 class="card-title text-info fw-bold mb-2">${formatRupiah(stats.totalPembayaranBulanIni || 0)}</h3>
                                        <small class="text-muted d-block text-truncate">Status lunas</small>
                                    </div>
                                </div>
                            </div>
                            <div class="card-footer bg-transparent border-top-0 pt-0 pb-3 px-4">
                                <small class="text-muted">
                                    <i class="bi bi-calendar-month me-1"></i>Bulan berjalan
                                </small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-xl-4 col-lg-4 col-md-6 col-sm-6">
                        <div class="card h-100 border-0 shadow-sm hover-card">
                            <div class="card-body p-4">
                                <div class="d-flex align-items-center">
                                    <div class="bg-danger bg-opacity-10 p-3 rounded me-3 flex-shrink-0">
                                        <i class="bi bi-trash text-danger fs-3"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h6 class="card-subtitle text-muted mb-2 text-truncate">Laporan Sampah</h6>
                                        <h3 class="card-title text-danger fw-bold mb-2">${stats.totalLaporan ? stats.totalLaporan.toLocaleString() : '0'}</h3>
                                        <small class="text-muted d-block text-truncate">Total semua laporan</small>
                                    </div>
                                </div>
                            </div>
                            <div class="card-footer bg-transparent border-top-0 pt-0 pb-3 px-4">
                                <small class="text-muted">
                                    <i class="bi bi-clipboard-data me-1"></i>Semua periode
                                </small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-xl-4 col-lg-4 col-md-6 col-sm-6">
                        <div class="card h-100 border-0 shadow-sm hover-card">
                            <div class="card-body p-4">
                                <div class="d-flex align-items-center">
                                    <div class="bg-secondary bg-opacity-10 p-3 rounded me-3 flex-shrink-0">
                                        <i class="bi bi-calendar-check text-secondary fs-3"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h6 class="card-subtitle text-muted mb-2 text-truncate">Jadwal Hari Ini</h6>
                                        <h3 class="card-title text-secondary fw-bold mb-2">${stats.jadwalHariIni ? stats.jadwalHariIni.toLocaleString() : '0'}</h3>
                                        <small class="text-muted d-block text-truncate">Pengangkutan terjadwal</small>
                                    </div>
                                </div>
                            </div>
                            <div class="card-footer bg-transparent border-top-0 pt-0 pb-3 px-4">
                                <small class="text-muted">
                                    <i class="bi bi-calendar-day me-1"></i>${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Charts and Activity Row -->
                <div class="row g-4">
                    <!-- Charts Column -->
                    <div class="col-lg-8">
                        <div class="row g-4">
                            <!-- Trend Chart -->
                            <div class="col-12">
                                <div class="card h-100">
                                    <div class="card-header bg-success bg-opacity-10">
                                        <h5 class="card-title mb-0">
                                            <i class="bi bi-graph-up me-2"></i>Trend Laporan 7 Hari Terakhir
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        ${renderTrendChart(trendData)}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- User Distribution Chart -->
                            <div class="col-12">
                                <div class="card h-100">
                                    <div class="card-header bg-primary bg-opacity-10">
                                        <h5 class="card-title mb-0">
                                            <i class="bi bi-pie-chart me-2"></i>Distribusi User per Role
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        ${renderUserChart(stats.userRoles || {})}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Activity Column -->
                    <div class="col-lg-4">
                        <div class="card h-100">
                            <div class="card-header bg-warning bg-opacity-10 d-flex justify-content-between align-items-center">
                                <h5 class="card-title mb-0">
                                    <i class="bi bi-activity me-2"></i>Aktivitas Terbaru
                                </h5>
                                <button class="btn btn-sm btn-outline-success" id="refreshActivity">
                                    <i class="bi bi-arrow-clockwise"></i>
                                </button>
                            </div>
                            <div class="card-body p-0">
                                <div class="list-group list-group-flush" style="max-height: 400px; overflow-y: auto;">
                                    ${stats.recentActivities && stats.recentActivities.length > 0 ? 
                                        stats.recentActivities.map(activity => `
                                            <div class="list-group-item border-0">
                                                <div class="d-flex align-items-start">
                                                    <div class="me-3">
                                                        <span class="fs-5">${activity.icon}</span>
                                                    </div>
                                                    <div class="flex-grow-1">
                                                        <h6 class="mb-1">${activity.title}</h6>
                                                        <p class="mb-1 text-muted small">${activity.desc}</p>
                                                    </div>
                                                    <small class="text-muted">${activity.time}</small>
                                                </div>
                                            </div>
                                        `).join('') : 
                                        `<div class="text-center py-4">
                                            <i class="bi bi-inbox fs-1 text-muted mb-3"></i>
                                            <p class="text-muted">Belum ada aktivitas terbaru</p>
                                        </div>`
                                    }
                                </div>
                            </div>
                            
                            <div class="card-footer bg-transparent">
                                <h6 class="mb-3">
                                    <i class="bi bi-lightning-fill me-2 text-success"></i>Aksi Cepat
                                </h6>
                                <div class="row g-2">
                                    <div class="col-6">
                                        <button class="btn btn-outline-success w-100" data-page="users">
                                            <i class="bi bi-person-plus me-1"></i>Tambah User
                                        </button>
                                    </div>
                                    <div class="col-6">
                                        <button class="btn btn-outline-primary w-100" data-page="jadwal">
                                            <i class="bi bi-calendar-plus me-1"></i>Buat Jadwal
                                        </button>
                                    </div>
                                    <div class="col-6">
                                        <button class="btn btn-outline-warning w-100" data-page="reports">
                                            <i class="bi bi-file-earmark-text me-1"></i>Lihat Laporan
                                        </button>
                                    </div>
                                    <div class="col-6">
                                        <button class="btn btn-outline-info w-100" id="refreshDashboard">
                                            <i class="bi bi-arrow-repeat me-1"></i>Refresh
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // ===== TEMPATKAN EVENT LISTENERS DI SINI (SETELAH HTML DI-RENDER) =====
        setTimeout(() => {
            // Event listeners untuk aksi cepat
            document.querySelectorAll('.card-footer button[data-page]').forEach(btn => {
                btn.addEventListener('click', () => {
                    loadPage(btn.getAttribute('data-page'));
                });
            });
            
            // Refresh dashboard button
            const refreshBtn = document.getElementById('refreshDashboard');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    showDashboardStats();
                });
            }
            
            // Refresh activity button
            const refreshActivityBtn = document.getElementById('refreshActivity');
            if (refreshActivityBtn) {
                refreshActivityBtn.addEventListener('click', () => {
                    showDashboardStats();
                });
            }
        }, 50);

    } catch (error) {
        console.error('Error showing dashboard:', error);
        mainContent.innerHTML = `
            <div class="card border-danger">
                <div class="card-body text-center py-5">
                    <div class="text-danger mb-3">
                        <i class="bi bi-exclamation-triangle-fill" style="font-size: 3rem;"></i>
                    </div>
                    <h4 class="text-danger">Gagal Memuat Dashboard</h4>
                    <p class="text-muted">${error.message || 'Terjadi kesalahan saat mengambil data'}</p>
                    <button onclick="showDashboardStats()" class="btn btn-success">
                        <i class="bi bi-arrow-clockwise me-1"></i> Coba Lagi
                    </button>
                </div>
            </div>
        `;
    }
}

// ==================== HELPER FUNCTIONS ====================

function renderAlertCards(stats) {
    const alerts = [];
    
    // Aturan alert
    if (stats.laporanStatus['pending'] > 10) {
        alerts.push({
            type: 'danger',
            icon: 'bi-exclamation-triangle-fill',
            title: 'Laporan Menumpuk',
            message: `${stats.laporanStatus['pending']} laporan masih pending (>10)`,
            action: 'loadPage("laporan")'
        });
    }
    
    if (stats.jadwalHariIni === 0) {
        alerts.push({
            type: 'warning',
            icon: 'bi-calendar-x',
            title: 'Tidak Ada Jadwal',
            message: 'Tidak ada jadwal pengangkutan hari ini',
            action: 'loadPage("jadwal")'
        });
    }
    
    if (stats.totalPembayaranBulanIni < 50000) {
        alerts.push({
            type: 'info',
            icon: 'bi-cash-coin',
            title: 'Pembayaran Rendah',
            message: 'Pembayaran bulan ini masih rendah',
            action: 'loadPage("pembayaran")'
        });
    }
    
    if (stats.anggotaAktif === 0) {
        alerts.push({
            type: 'warning',
            icon: 'bi-people',
            title: 'Tidak Ada Anggota Aktif',
            message: 'Semua anggota status non-aktif',
            action: 'loadPage("anggota")'
        });
    }
    
    if (alerts.length === 0) {
        return `
            <div class="alert alert-success d-flex align-items-center mb-4" role="alert">
                <i class="bi bi-check-circle-fill fs-4 me-3"></i>
                <div>
                    <strong>Semua Sistem Normal</strong>
                    <div class="small">Tidak ada masalah kritis yang terdeteksi</div>
                </div>
            </div>
        `;
    }
    
    return alerts.map(alert => `
        <div class="alert alert-${alert.type} d-flex align-items-center justify-content-between mb-3" role="alert" 
             style="cursor: pointer;" onclick="${alert.action}">
            <div class="d-flex align-items-center">
                <i class="bi ${alert.icon} fs-4 me-3"></i>
                <div>
                    <strong>${alert.title}</strong>
                    <div class="small">${alert.message}</div>
                </div>
            </div>
            <i class="bi bi-chevron-right"></i>
        </div>
    `).join('');
}

function renderTrendChart(trendData) {
    // Data dummy untuk contoh
    const data = [0, 3, 2, 0, 0, 0, 0];
    const labels = ["12/07", "12/08", "12/09", "12/10", "12/11", "12/12", "12/13"];
    
    const total = data.reduce((sum, value) => sum + value, 0);
    const average = (total / data.length).toFixed(1);
    const maxValue = Math.max(...data, 1);
    
    return `
        <div>
            <div class="d-flex justify-content-between mb-4">
                <div>
                    <h6 class="text-muted mb-1">Total Laporan</h6>
                    <h3 class="text-success fw-bold">${total}</h3>
                </div>
                <div>
                    <h6 class="text-muted mb-1">Rata-rata/hari</h6>
                    <h3 class="text-primary fw-bold">${average}</h3>
                </div>
                <div>
                    <h6 class="text-muted mb-1">Puncak</h6>
                    <h3 class="text-warning fw-bold">${maxValue}</h3>
                </div>
            </div>
            
            <div class="trend-chart-container">
                <div class="d-flex align-items-end justify-content-between" style="height: 200px;">
                    ${data.map((value, index) => {
                        const height = value === 0 ? 10 : (value / maxValue * 100);
                        const isToday = labels[index] === "12/13";
                        const barColor = value === 0 ? "#e0e0e0" : 
                                        value >= 3 ? "#f44336" : 
                                        value >= 2 ? "#ff9800" : "#4caf50";
                        
                        return `
                            <div class="d-flex flex-column align-items-center" style="width: 14%;">
                                <div class="position-relative mb-2">
                                    <div class="trend-bar ${isToday ? 'border border-2 border-success' : ''}" 
                                         style="height: ${height}px; background-color: ${barColor}; width: 40px; border-radius: 4px 4px 0 0;"
                                         data-bs-toggle="tooltip" data-bs-placement="top" 
                                         title="${labels[index]}: ${value} laporan">
                                    </div>
                                    <div class="position-absolute top-0 start-50 translate-middle-x mt-1" style="font-size: 12px; font-weight: bold;">
                                        ${value}
                                    </div>
                                </div>
                                <small class="text-muted">${labels[index]}</small>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <div class="mt-4 pt-3 border-top">
                <div class="row">
                    <div class="col-6">
                        <small class="text-muted">
                            <i class="bi bi-graph-up me-1"></i>Puncak: ${maxValue} laporan pada ${labels[data.indexOf(maxValue)]}
                        </small>
                    </div>
                    <div class="col-6 text-end">
                        <small class="text-muted">
                            <i class="bi bi-graph-down me-1"></i>${data.filter(val => val === 0).length} hari tanpa laporan
                        </small>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderUserChart(userRoles) {
    const roles = Object.keys(userRoles);
    const counts = Object.values(userRoles);
    
    if (roles.length === 0) {
        return `
            <div class="text-center py-4">
                <i class="bi bi-pie-chart fs-1 text-muted mb-3"></i>
                <p class="text-muted">Belum ada data user</p>
            </div>
        `;
    }
    
    const total = counts.reduce((a, b) => a + b, 0);
    
    // Colors for different roles
    const roleColors = {
        'admin': '#198754', // green
        'anggota': '#0d6efd', // blue
        'tamu': '#fd7e14', // orange
        'tim_angkut': '#6f42c1' // purple
    };
    
    return `
        <div>
            <div class="row mb-4">
                ${roles.map((role, index) => {
                    const count = counts[index];
                    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                    const color = roleColors[role] || '#6c757d';
                    const roleName = role === 'admin' ? 'Admin' :
                                   role === 'anggota' ? 'Anggota' :
                                   role === 'tamu' ? 'Tamu' :
                                   role === 'tim_angkut' ? 'Tim Angkut' : role;
                    
                    return `
                        <div class="col-6 mb-3">
                            <div class="d-flex align-items-center">
                                <div class="rounded-circle me-2" style="width: 12px; height: 12px; background-color: ${color};"></div>
                                <span class="fw-semibold">${roleName}</span>
                                <span class="ms-auto fw-bold">${count}</span>
                            </div>
                            <div class="progress mt-1" style="height: 8px;">
                                <div class="progress-bar" role="progressbar" 
                                     style="width: ${percentage}%; background-color: ${color};" 
                                     aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">
                                </div>
                            </div>
                            <small class="text-muted">${percentage}%</small>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="mt-4 pt-3 border-top">
                <div class="text-center">
                    <h6 class="text-success fw-bold">${total}</h6>
                    <small class="text-muted">Total Pengguna Terdaftar</small>
                </div>
            </div>
        </div>
    `;
}

async function fetchTrendData() {
    try {
        const laporanRes = await fetch(API.laporanSampah, { headers: getAuthHeaders() });
        const laporan = await laporanRes.json();
        
        // 7 hari terakhir
        const last7Days = Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();
        
        return last7Days.map(date => ({
            date: date.split('-').slice(1).join('/'), // Format: MM/DD
            count: laporan.filter(l => l.tanggal_lapor === date).length
        }));
    } catch {
        return Array.from({length: 7}, (_, i) => ({ date: '0', count: 0 }));
    }
}

function addDashboardStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Custom Dashboard Styles */
        :root {
            --bs-success: #198754;
            --bs-success-rgb: 25, 135, 84;
            --bs-success-bg-subtle: #d1e7dd;
            --bs-primary: #0d6efd;
            --bs-warning: #ffc107;
            --bs-info: #0dcaf0;
            --bs-danger: #dc3545;
            --bs-secondary: #6c757d;
            --bs-light: #f8f9fa;
            --bs-dark: #212529;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background-color: #f8f9fa;
            overflow-x: hidden;
        }
        
        /* Sidebar Customizations */
        .sidebar {
            background: linear-gradient(180deg, #198754 0%, #146c43 100%);
            box-shadow: 3px 0 15px rgba(0, 0, 0, 0.1);
            z-index: 1000;
        }
        
        .sidebar .nav-link {
            color: rgba(255, 255, 255, 0.85);
            border-radius: 8px;
            margin: 2px 0;
            padding: 0.75rem 1rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 500;
        }
        
        .sidebar .nav-link:hover {
            color: white;
            background-color: rgba(255, 255, 255, 0.15);
            transform: translateX(8px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .sidebar .nav-link.active {
            color: white;
            background-color: rgba(255, 255, 255, 0.25);
            font-weight: 600;
            border-left: 4px solid #ffc107;
        }
        
        .sidebar .nav-link i {
            width: 24px;
            text-align: center;
            font-size: 1.1rem;
        }
        
        /* GRID LAYOUT UNTUK 6 CARDS (2 BARIS × 3 KOLOM) */
        .stats-grid-2x3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.25rem;
            margin: 1.5rem 0;
        }

        /* Responsive breakpoints untuk 2x3 grid */
        @media (max-width: 1200px) {
            .stats-grid-2x3 {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 768px) {
            .stats-grid-2x3 {
                grid-template-columns: 1fr;
                gap: 1rem;
            }
        }

        /* Card styling untuk grid 2x3 */
        .stats-card-grid {
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            display: flex;
            align-items: center;
            gap: 1.25rem;
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(0, 0, 0, 0.05);
            min-height: 130px;
            position: relative;
            overflow: hidden;
        }

        .stats-card-grid:hover {
            transform: translateY(-6px);
            box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
        }

        .stats-card-grid::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 6px;
            height: 100%;
        }

        /* Warna border untuk setiap card dalam grid */
        .stats-card-grid:nth-child(1)::before { background: linear-gradient(to bottom, #198754, #2ecc71); }
        .stats-card-grid:nth-child(2)::before { background: linear-gradient(to bottom, #0d6efd, #3498db); }
        .stats-card-grid:nth-child(3)::before { background: linear-gradient(to bottom, #ffc107, #f39c12); }
        .stats-card-grid:nth-child(4)::before { background: linear-gradient(to bottom, #0dcaf0, #1abc9c); }
        .stats-card-grid:nth-child(5)::before { background: linear-gradient(to bottom, #dc3545, #e74c3c); }
        .stats-card-grid:nth-child(6)::before { background: linear-gradient(to bottom, #6c757d, #7f8c8d); }

        /* Card content dalam grid */
        .stats-card-content {
            display: flex;
            align-items: center;
            gap: 1.25rem;
            width: 100%;
        }

        .stats-card-icon {
            width: 70px;
            height: 70px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: white;
            flex-shrink: 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .stats-card-icon.bg-success { background: linear-gradient(135deg, #198754, #2ecc71); }
        .stats-card-icon.bg-primary { background: linear-gradient(135deg, #0d6efd, #3498db); }
        .stats-card-icon.bg-warning { background: linear-gradient(135deg, #ffc107, #f39c12); }
        .stats-card-icon.bg-info { background: linear-gradient(135deg, #0dcaf0, #1abc9c); }
        .stats-card-icon.bg-danger { background: linear-gradient(135deg, #dc3545, #e74c3c); }
        .stats-card-icon.bg-secondary { background: linear-gradient(135deg, #6c757d, #7f8c8d); }

        .stats-card-text {
            flex: 1;
            min-width: 0;
        }

        .stats-card-title {
            margin: 0 0 0.5rem 0;
            font-size: 0.875rem;
            color: #6c757d;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .stats-card-value {
            font-size: 2.25rem;
            font-weight: 800;
            color: #2c3e50;
            margin: 0 0 0.25rem 0;
            line-height: 1.2;
        }

        .stats-card-desc {
            font-size: 0.875rem;
            color: #7f8c8d;
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* Responsive untuk grid cards */
        @media (max-width: 992px) {
            .stats-card-grid {
                padding: 1.25rem;
                gap: 1rem;
                min-height: 120px;
            }
            
            .stats-card-icon {
                width: 60px;
                height: 60px;
                font-size: 28px;
            }
            
            .stats-card-value {
                font-size: 2rem;
            }
        }

        @media (max-width: 576px) {
            .stats-card-grid {
                padding: 1rem;
                flex-direction: column;
                text-align: center;
                gap: 0.75rem;
                min-height: auto;
            }
            
            .stats-card-content {
                flex-direction: column;
                text-align: center;
            }
            
            .stats-card-icon {
                width: 50px;
                height: 50px;
                font-size: 24px;
            }
            
            .stats-card-value {
                font-size: 1.75rem;
            }
            
            .stats-card-title {
                font-size: 0.8125rem;
            }
            
            .stats-card-desc {
                font-size: 0.8125rem;
            }
        }

        .stat-icon {
            width: 70px;
            height: 70px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: white;
            flex-shrink: 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .stat-icon.bg-success { background: linear-gradient(135deg, #198754, #2ecc71); }
        .stat-icon.bg-primary { background: linear-gradient(135deg, #0d6efd, #3498db); }
        .stat-icon.bg-warning { background: linear-gradient(135deg, #ffc107, #f39c12); }
        .stat-icon.bg-info { background: linear-gradient(135deg, #0dcaf0, #1abc9c); }
        .stat-icon.bg-danger { background: linear-gradient(135deg, #dc3545, #e74c3c); }
        .stat-icon.bg-secondary { background: linear-gradient(135deg, #6c757d, #7f8c8d); }
        
        .stat-info {
            flex: 1;
            min-width: 0; /* Penting untuk text-truncate */
        }
        
        .stat-info h3 {
            margin: 0 0 0.5rem 0;
            font-size: 0.875rem;
            color: #6c757d;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .stat-number {
            font-size: 2.25rem;
            font-weight: 800;
            color: #2c3e50;
            margin: 0 0 0.25rem 0;
            line-height: 1.2;
        }
        
        .stat-desc {
            font-size: 0.875rem;
            color: #7f8c8d;
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        /* Card Customizations untuk konten lainnya */
        .card {
            border: none;
            border-radius: 16px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.07);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
            border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.12);
        }
        
        .card-header {
            border-radius: 16px 16px 0 0 !important;
            border-bottom: none;
            padding: 1.25rem 1.5rem;
            background: linear-gradient(135deg, #19875415, #146c4310);
        }
        
        .card-header h5 {
            margin: 0;
            font-weight: 700;
            color: #2c3e50;
        }
        
        .card-body {
            padding: 1.5rem;
        }
        
        /* Trend Chart Styling */
        .trend-chart-container {
            padding: 1rem 0;
        }
        
        .trend-bars-container {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            height: 200px;
            padding: 0 1rem;
            margin: 2rem 0;
        }
        
        .trend-bar-column {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            height: 100%;
            max-width: 60px;
            margin: 0 0.5rem;
        }
        
        .trend-bar-wrapper {
            flex: 1;
            width: 100%;
            display: flex;
            align-items: flex-end;
            position: relative;
        }
        
        .trend-bar {
            width: 40px;
            border-radius: 8px 8px 0 0;
            transition: all 0.3s ease;
            position: relative;
            min-height: 10px;
            margin: 0 auto;
        }
        
        .trend-bar:hover {
            opacity: 0.9;
            transform: scaleY(1.1);
        }
        
        .trend-bar.today {
            border: 2px solid white;
            box-shadow: 0 0 0 2px var(--bs-success);
        }
        
        .bar-value {
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.875rem;
            font-weight: 700;
            color: #2c3e50;
            white-space: nowrap;
        }
        
        .trend-label {
            margin-top: 0.75rem;
            font-size: 0.875rem;
            color: #6c757d;
            font-weight: 500;
            text-align: center;
        }
        
        /* Scrollbar Styling */
        .list-group {
            scrollbar-width: thin;
            scrollbar-color: var(--bs-success) transparent;
        }
        
        .list-group::-webkit-scrollbar {
            width: 8px;
        }
        
        .list-group::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 4px;
        }
        
        .list-group::-webkit-scrollbar-thumb {
            background-color: var(--bs-success);
            border-radius: 4px;
            border: 2px solid transparent;
            background-clip: padding-box;
        }
        
        .list-group::-webkit-scrollbar-thumb:hover {
            background-color: #146c43;
        }
        
        /* Activity List */
        .activity-list {
            max-height: 350px;
            overflow-y: auto;
        }
        
        .activity-item {
            display: flex;
            align-items: center;
            padding: 1rem;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;
        }
        
        .activity-item:hover {
            background-color: rgba(25, 135, 84, 0.05);
            transform: translateX(5px);
        }
        
        .activity-item:last-child {
            border-bottom: none;
        }
        
        .activity-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #19875415, #146c4310);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            color: var(--bs-success);
            margin-right: 1rem;
            flex-shrink: 0;
        }
        
        .activity-content {
            flex: 1;
            min-width: 0;
        }
        
        .activity-content p {
            margin: 0 0 0.25rem 0;
            font-weight: 600;
            color: #2c3e50;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .activity-content small {
            color: #6c757d;
            font-size: 0.875rem;
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .activity-time {
            margin-left: 1rem;
            font-size: 0.75rem;
            color: #95a5a6;
            white-space: nowrap;
            flex-shrink: 0;
        }
        
        /* Quick Actions */
        .actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 0.75rem;
        }
        
        .action-btn {
            background: white;
            border: 2px solid rgba(25, 135, 84, 0.1);
            color: #198754;
            padding: 0.875rem 1rem;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 600;
            font-size: 0.875rem;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        
        .action-btn:hover {
            background: linear-gradient(135deg, #198754, #146c43);
            color: white;
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(25, 135, 84, 0.2);
            border-color: transparent;
        }
        
        /* Alert Styling */
        .alert-container {
            margin: 1.5rem 0;
        }
        
        .alert-card {
            display: flex;
            align-items: center;
            padding: 1.25rem;
            border-radius: 12px;
            margin-bottom: 0.75rem;
            cursor: pointer;
            transition: all 0.3s ease;
            border-left: 5px solid;
            background: white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        .alert-card:hover {
            transform: translateX(5px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }
        
        .alert-danger {
            border-left-color: #dc3545;
            background: linear-gradient(to right, #ffebee, white);
        }
        
        .alert-warning {
            border-left-color: #ffc107;
            background: linear-gradient(to right, #fff3e0, white);
        }
        
        .alert-info {
            border-left-color: #0dcaf0;
            background: linear-gradient(to right, #e3f2fd, white);
        }
        
        .alert-success {
            border-left-color: #198754;
            background: linear-gradient(to right, #e8f5e9, white);
        }
        
        .alert-icon {
            font-size: 1.75rem;
            margin-right: 1rem;
            flex-shrink: 0;
        }
        
        .alert-content {
            flex: 1;
            min-width: 0;
        }
        
        .alert-content strong {
            display: block;
            margin-bottom: 0.25rem;
            color: #2c3e50;
            font-weight: 700;
        }
        
        .alert-content small {
            font-size: 0.875rem;
            color: #6c757d;
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .alert-action {
            font-size: 1.5rem;
            color: #95a5a6;
            margin-left: 1rem;
            flex-shrink: 0;
        }
        
        /* Progress Bar Custom */
        .progress-container {
            height: 10px;
            background-color: rgba(0, 0, 0, 0.05);
            border-radius: 5px;
            overflow: hidden;
            margin: 0.5rem 0;
        }
        
        .progress-bar {
            height: 100%;
            border-radius: 5px;
            transition: width 0.6s ease;
            position: relative;
            overflow: hidden;
        }
        
        .progress-bar::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: linear-gradient(
                45deg,
                rgba(255, 255, 255, 0.15) 25%,
                transparent 25%,
                transparent 50%,
                rgba(255, 255, 255, 0.15) 50%,
                rgba(255, 255, 255, 0.15) 75%,
                transparent 75%,
                transparent
            );
            background-size: 1rem 1rem;
            animation: progress-stripes 1s linear infinite;
        }
        
        @keyframes progress-stripes {
            from {
                background-position: 1rem 0;
            }
            to {
                background-position: 0 0;
            }
        }
        
        /* Button Customizations */
        .btn-success {
            background: linear-gradient(135deg, #198754, #146c43);
            border: none;
            border-radius: 10px;
            padding: 0.625rem 1.5rem;
            font-weight: 600;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 12px rgba(25, 135, 84, 0.2);
        }
        
        .btn-success:hover {
            background: linear-gradient(135deg, #146c43, #115c38);
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(25, 135, 84, 0.3);
        }
        
        .btn-success:active {
            transform: translateY(0);
            box-shadow: 0 2px 8px rgba(25, 135, 84, 0.2);
        }
        
        /* Navbar Customizations */
        .navbar {
            padding: 1rem 0;
            background: white;
            box-shadow: 0 2px 15px rgba(0, 0, 0, 0.08);
            position: sticky;
            top: 0;
            z-index: 999;
        }
        
        /* Dashboard Stats Container */
        .dashboard-stats {
            animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Dashboard Header */
        .dashboard-header {
            margin-bottom: 2rem;
            padding: 1.5rem;
            background: linear-gradient(135deg, #19875405, #146c4302);
            border-radius: 16px;
            border: 1px solid rgba(25, 135, 84, 0.1);
        }
        
        .dashboard-header h2 {
            color: #2c3e50;
            font-weight: 800;
            margin-bottom: 0.5rem;
            font-size: 1.75rem;
        }
        
        .dashboard-header p {
            color: #6c757d;
            margin-bottom: 0.5rem;
            font-size: 1rem;
        }
        
        .last-update {
            font-size: 0.875rem;
            color: #95a5a6;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        /* Grid untuk layout dashboard */
        .charts-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }
        
        @media (max-width: 991px) {
            .charts-row {
                grid-template-columns: 1fr;
            }
        }
        
        .chart-container {
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.07);
            border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .chart-container h3 {
            margin: 0 0 1.5rem 0;
            color: #2c3e50;
            font-size: 1.25rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .chart-placeholder {
            height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #95a5a6;
            font-size: 1rem;
        }
        
        /* Responsive Adjustments */
        @media (max-width: 768px) {
            .stat-card {
                padding: 1.25rem;
                gap: 1rem;
            }
            
            .stat-icon {
                width: 60px;
                height: 60px;
                font-size: 28px;
            }
            
            .stat-number {
                font-size: 1.875rem;
            }
            
            .card-body {
                padding: 1.25rem;
            }
            
            .card-header {
                padding: 1rem 1.25rem;
            }
            
            .trend-bar {
                width: 30px;
            }
            
            .charts-row {
                margin: 1.5rem 0;
            }
        }
        
        @media (max-width: 576px) {
            .stats-grid {
                gap: 1rem;
            }
            
            .stat-card {
                padding: 1rem;
                flex-direction: column;
                text-align: center;
                gap: 0.75rem;
            }
            
            .stat-icon {
                width: 50px;
                height: 50px;
                font-size: 24px;
            }
            
            .stat-number {
                font-size: 1.75rem;
            }
            
            .stat-info h3 {
                font-size: 0.8125rem;
            }
            
            .stat-desc {
                font-size: 0.8125rem;
            }
            
            .actions-grid {
                grid-template-columns: 1fr;
            }
        }
        
        /* Loading Animation */
        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            color: #198754;
        }
        
        .spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(25, 135, 84, 0.1);
            border-top: 4px solid #198754;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1.5rem;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Error State */
        .error-state {
            text-align: center;
            padding: 3rem 1.5rem;
            background: white;
            border-radius: 16px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.07);
        }
        
        .retry-btn {
            background: linear-gradient(135deg, #198754, #146c43);
            color: white;
            border: none;
            padding: 0.875rem 2rem;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
            margin-top: 1.5rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(25, 135, 84, 0.2);
        }
        
        .retry-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(25, 135, 84, 0.3);
        }
        
        /* Utility Classes untuk spacing */
        .mb-0 { margin-bottom: 0 !important; }
        .mb-1 { margin-bottom: 0.25rem !important; }
        .mb-2 { margin-bottom: 0.5rem !important; }
        .mb-3 { margin-bottom: 1rem !important; }
        .mb-4 { margin-bottom: 1.5rem !important; }
        .mb-5 { margin-bottom: 2rem !important; }
        
        .mt-0 { margin-top: 0 !important; }
        .mt-1 { margin-top: 0.25rem !important; }
        .mt-2 { margin-top: 0.5rem !important; }
        .mt-3 { margin-top: 1rem !important; }
        .mt-4 { margin-top: 1.5rem !important; }
        .mt-5 { margin-top: 2rem !important; }
        
        .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .py-3 { padding-top: 1rem; padding-bottom: 1rem; }
        .py-4 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
        .py-5 { padding-top: 2rem; padding-bottom: 2rem; }
        
        /* Typography enhancements */
        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            font-weight: 700;
        }
        
        .text-muted {
            color: #6c757d !important;
        }
        
        .text-success { color: #198754 !important; }
        .text-primary { color: #0d6efd !important; }
        .text-warning { color: #ffc107 !important; }
        .text-info { color: #0dcaf0 !important; }
        .text-danger { color: #dc3545 !important; }
        .text-secondary { color: #6c757d !important; }
        
        /* Background colors dengan opacity */
        .bg-success-bg-subtle { background-color: rgba(25, 135, 84, 0.1) !important; }
        .bg-primary-bg-subtle { background-color: rgba(13, 110, 253, 0.1) !important; }
        .bg-warning-bg-subtle { background-color: rgba(255, 193, 7, 0.1) !important; }
        .bg-info-bg-subtle { background-color: rgba(13, 202, 240, 0.1) !important; }
        .bg-danger-bg-subtle { background-color: rgba(220, 53, 69, 0.1) !important; }
        .bg-secondary-bg-subtle { background-color: rgba(108, 117, 125, 0.1) !important; }
        
        /* Modern scrollbar untuk seluruh halaman */
        ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 5px;
        }
        
        ::-webkit-scrollbar-thumb {
            background: rgba(25, 135, 84, 0.5);
            border-radius: 5px;
            transition: background 0.3s ease;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(25, 135, 84, 0.7);
        }
        
        /* Focus styles untuk accessibility */
        *:focus {
            outline: 2px solid rgba(25, 135, 84, 0.5);
            outline-offset: 2px;
        }
        
        *:focus:not(.focus-visible) {
            outline: none;
        }
    `;
    
    document.head.appendChild(style);
}