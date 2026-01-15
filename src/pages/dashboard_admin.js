// pages/dashboard_admin.js - DENGAN BOOTSTRAP 5 MURNI
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
import { adminNotifications } from "../utils/adminNotifications.js";
import { showToast } from "../utils/toast.js";

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
        
        <div class="container-fluid p-0" style="min-height: 100vh;">
            <div class="d-flex">
                <!-- Desktop Sidebar (LG ke atas) -->
                <aside class="d-none d-lg-flex flex-column flex-shrink-0 bg-success text-white" 
                    style="width: 280px; min-height: 100vh; position: sticky; top: 0;">
                    
                    <!-- Header dengan LOGO -->
                    <div class="bg-success text-white border-bottom border-white-20 p-3">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <div class="d-flex align-items-center">
                                <!-- LOGO CleanUp di Sidebar -->
                                <div class="me-3">
                                    <img src="/logo/logo_3d.png" 
                                         alt="CleanUp Kupang Logo" 
                                         style="height: 40px; width: auto;">
                                </div>
                                <div>
                                    <h5 class="mb-0">${user.username}</h5>
                                    <small class="text-white-50">ADMIN</small>
                                </div>
                            </div>
                            <!-- Close button hanya untuk konsistensi visual -->
                            <button type="button" class="btn-close btn-close-white opacity-50" disabled></button>
                        </div>
                        
                        <!-- Brand centered -->
                        <div class="d-flex align-items-center justify-content-center pt-2">
                            <span class="fs-4 fw-bold text-white">
                                <i class="bi bi-recycle me-2"></i>CleanUp Kupang
                            </span>
                        </div>
                    </div>
                    
                    <!-- Navigation dengan padding seperti mobile -->
                    <ul class="nav nav-pills flex-column mb-auto p-3" id="sidebarMenuDesktop">
                        <li class="nav-item mb-2">
                            <button class="nav-link active text-white bg-white-10 w-100 d-flex align-items-center" data-page="dashboard">
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
                            <button class="nav-link text-white bg-white-10 w-100 d-flex align-items-center" data-page="users">
                                <i class="bi bi-person me-2"></i>
                                <span>Users</span>
                            </button>
                        </li>
                        <li class="nav-item mb-1">
                            <button class="nav-link text-white bg-white-10 w-100 d-flex align-items-center" data-page="anggota">
                                <i class="bi bi-people-fill me-2"></i>
                                <span>Anggota</span>
                            </button>
                        </li>
                        <li class="nav-item mb-1">
                            <button class="nav-link text-white bg-white-10 w-100 d-flex align-items-center" data-page="tamu">
                                <i class="bi bi-person-plus me-2"></i>
                                <span>Tamu</span>
                            </button>
                        </li>

                        <!-- Notifikasi Section -->
                        <li class="nav-item">
                            <p class="small text-uppercase text-white-50 mt-4 mb-2 fw-semibold">
                                <i class="bi bi-bell me-1"></i> NOTIFIKASI
                            </p>
                        </li>

                        
                        <!-- Operasional Section -->
                        <li class="nav-item">
                            <p class="small text-uppercase text-white-50 mt-4 mb-2 fw-semibold">
                                <i class="bi bi-truck me-1"></i> Operasional
                            </p>
                        </li>
                        <li class="nav-item mb-1">
                            <button class="nav-link text-white bg-white-10 w-100 d-flex align-items-center" data-page="tim">
                                <i class="bi bi-truck me-2"></i>
                                <span>Tim Pengangkut</span>
                            </button>
                        </li>
                        <li class="nav-item mb-1">
                            <button class="nav-link text-white bg-white-10 w-100 d-flex align-items-center" data-page="jadwal">
                                <i class="bi bi-calendar-check me-2"></i>
                                <span>Jadwal</span>
                            </button>
                        </li>
                        <li class="nav-item mb-1">
                            <button class="nav-link text-white bg-white-10 w-100 d-flex align-items-center" data-page="detailJadwal">
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
                            <button class="nav-link text-white bg-white-10 w-100 d-flex align-items-center" data-page="pembayaran">
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
                            <button class="nav-link text-white bg-white-10 w-100 d-flex align-items-center" data-page="laporan">
                                <i class="bi bi-trash me-2"></i>
                                <span>Laporan Sampah</span>
                            </button>
                        </li>
                        <li class="nav-item mb-1">
                            <button class="nav-link text-white bg-white-10 w-100 d-flex align-items-center" data-page="reports">
                                <i class="bi bi-graph-up me-2"></i>
                                <span>Analitik & Laporan</span>
                            </button>
                        </li>
                    </ul>
                    
                    <!-- Footer dengan border seperti mobile -->
                    <div class="p-3 border-top border-white-20 mt-auto">
                        <button class="btn btn-outline-light w-100 d-flex align-items-center justify-content-center" id="btnLogout">
                            <i class="bi bi-box-arrow-right me-2"></i>
                            Logout
                        </button>
                        <div class="text-center mt-3">
                            <small class="text-white-50">v1.0.0 • CleanUp System</small>
                        </div>
                    </div>
                </aside>
                
                <!-- Mobile Sidebar (Offcanvas) -->
                <div class="offcanvas offcanvas-start d-lg-none" tabindex="-1" id="sidebarOffcanvas" style="width: 280px;">
                    <div class="offcanvas-header bg-success text-white border-bottom border-white-20">
                        <div class="d-flex align-items-center">
                            <!-- LOGO CleanUp di Offcanvas -->
                            <div class="me-3">
                                <img src="/logo/logo_3d.png" 
                                     alt="CleanUp Kupang Logo" 
                                     style="height: 35px; width: auto;">
                            </div>
                            <div>
                                <h5 class="offcanvas-title mb-0">${user.username}</h5>
                                <small class="text-white-50">ADMIN</small>
                            </div>
                        </div>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
                    </div>
                    
                    <div class="offcanvas-body p-0 bg-success">
                        <div class="d-flex align-items-center justify-content-center p-3 border-bottom border-white-20">
                            <!-- Logo dan Brand -->
                            <div class="d-flex align-items-center">
                                <img src="/logo/logo_3d.png" 
                                     alt="CleanUp Kupang Logo" 
                                     style="height: 40px; width: auto; margin-right: 10px;">
                                <span class="fs-4 fw-bold text-white">
                                    CleanUp Kupang
                                </span>
                            </div>
                        </div>
                        
                        <ul class="nav nav-pills flex-column mb-auto p-3" id="sidebarMenuMobile">
                            <li class="nav-item mb-2">
                                <button class="nav-link active text-white bg-white-10 w-100 d-flex align-items-center" 
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
                                <button class="nav-link text-white bg-white-10 w-100 d-flex align-items-center" 
                                        data-page="users" data-bs-dismiss="offcanvas">
                                    <i class="bi bi-person me-2"></i>
                                    <span>Users</span>
                                </button>
                            </li>
                            <li class="nav-item mb-1">
                                <button class="nav-link text-white bg-white-10 w-100 d-flex align-items-center" 
                                        data-page="anggota" data-bs-dismiss="offcanvas">
                                    <i class="bi bi-people-fill me-2"></i>
                                    <span>Anggota</span>
                                </button>
                            </li>
                            <li class="nav-item mb-1">
                                <button class="nav-link text-white bg-white-10 w-100 d-flex align-items-center" 
                                        data-page="tamu" data-bs-dismiss="offcanvas">
                                    <i class="bi bi-person-plus me-2"></i>
                                    <span>Tamu</span>
                                </button>
                            </li>

                            <!-- Notifikasi Section -->
                            <li class="nav-item">
                                <p class="small text-uppercase text-white-50 mt-4 mb-2 fw-semibold">
                                    <i class="bi bi-bell me-1"></i> NOTIFIKASI
                                </p>
                            </li>
                            
                            <!-- Operasional Section -->
                            <li class="nav-item">
                                <p class="small text-uppercase text-white-50 mt-4 mb-2 fw-semibold">
                                    <i class="bi bi-truck me-1"></i> Operasional
                                </p>
                            </li>
                            <li class="nav-item mb-1">
                                <button class="nav-link text-white bg-white-10 w-100 d-flex align-items-center" 
                                        data-page="tim" data-bs-dismiss="offcanvas">
                                    <i class="bi bi-truck me-2"></i>
                                    <span>Tim Pengangkut</span>
                                </button>
                            </li>
                            <li class="nav-item mb-1">
                                <button class="nav-link text-white bg-white-10 w-100 d-flex align-items-center" 
                                        data-page="jadwal" data-bs-dismiss="offcanvas">
                                    <i class="bi bi-calendar-check me-2"></i>
                                    <span>Jadwal</span>
                                </button>
                            </li>
                            <li class="nav-item mb-1">
                                <button class="nav-link text-white bg-white-10 w-100 d-flex align-items-center" 
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
                                <button class="nav-link text-white bg-white-10 w-100 d-flex align-items-center" 
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
                                <button class="nav-link text-white bg-white-10 w-100 d-flex align-items-center" 
                                        data-page="laporan" data-bs-dismiss="offcanvas">
                                    <i class="bi bi-trash me-2"></i>
                                    <span>Laporan Sampah</span>
                                </button>
                            </li>
                            <li class="nav-item mb-1">
                                <button class="nav-link text-white bg-white-10 w-100 d-flex align-items-center" 
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
                <main class="flex-grow-1 bg-light">
                    <!-- Top Navigation Bar dengan LOGO -->
                    <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm sticky-top" style="z-index: 999;">
                        <div class="container-fluid">
                            <!-- Mobile Toggle Button -->
                            <button class="btn btn-success d-lg-none me-2" type="button" data-bs-toggle="offcanvas" 
                                    data-bs-target="#sidebarOffcanvas">
                                <i class="bi bi-list fs-5"></i>
                            </button>
                            
                            <!-- Page Title dengan LOGO -->
                            <div class="d-flex align-items-center">
                                <!-- Logo untuk desktop -->
                                <div class="d-none d-md-block me-3">
                                    <img src="/logo/logo_3d.png" 
                                         alt="CleanUp Kupang Logo" 
                                         style="height: 35px; width: auto;">
                                </div>
                                <h5 class="mb-0 text-success fw-bold" id="pageTitle">
                                    <i class="bi bi-speedometer2 me-2"></i>Dashboard Admin
                                </h5>
                            </div>
                            
                            <!-- User Info & Notifications -->
                            <div class="d-flex align-items-center">
                                <!-- Desktop Notification Bell -->
                                <div class="dropdown me-3 d-none d-md-block">
                                    <button class="btn btn-outline-success position-relative" 
                                            id="notification-bell" 
                                            type="button" 
                                            data-bs-toggle="dropdown">
                                        <i class="bi bi-bell fs-5"></i>
                                        <span id="notification-badge" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-none">0</span>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end" style="min-width: 300px;">
                                        <li><h6 class="dropdown-header">Notifikasi Admin</h6></li>
                                        <li>
                                            <div class="px-3 py-2">
                                                <small class="text-muted d-block mb-1">Status:</small>
                                                <div id="notification-status">
                                                    <span class="badge bg-secondary">Memuat...</span>
                                                </div>
                                            </div>
                                        </li>
                                        <li><hr class="dropdown-divider"></li>
                                        <li>
                                            <button class="dropdown-item" id="viewNotificationsBtn">
                                                <i class="bi bi-bell me-2"></i> Lihat Semua Notifikasi
                                            </button>
                                        </li>
                                        <li>
                                            <button class="dropdown-item" id="toggleNotificationsBtn">
                                                <i class="bi bi-bell me-2"></i> Aktif/Nonaktif Notifikasi
                                            </button>
                                        </li>
                                        <li><hr class="dropdown-divider"></li>
                                        <li>
                                            <small class="text-muted px-3">Terakhir diperbarui: <span id="last-notification-check">-</span></small>
                                        </li>
                                    </ul>
                                </div>
                                
                                <!-- Mobile Notification Bell -->
                                <div class="dropdown me-2 d-md-none">
                                    <button class="btn btn-outline-success btn-sm position-relative" 
                                            id="notification-bell-mobile" 
                                            type="button" 
                                            data-bs-toggle="dropdown">
                                        <i class="bi bi-bell"></i>
                                        <span id="notification-badge-mobile" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-none">0</span>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end" style="min-width: 280px;">
                                        <li><h6 class="dropdown-header">Notifikasi</h6></li>
                                        <li>
                                            <div class="px-3 py-2">
                                                <small class="text-muted d-block mb-1">Status:</small>
                                                <div id="notification-status-mobile">
                                                    <span class="badge bg-secondary">Memuat...</span>
                                                </div>
                                            </div>
                                        </li>
                                        <li><hr class="dropdown-divider"></li>
                                        <li>
                                            <button class="dropdown-item" id="viewNotificationsBtnMobile">
                                                <i class="bi bi-bell me-2"></i> Lihat Notifikasi
                                            </button>
                                        </li>
                                        <li>
                                            <button class="dropdown-item" id="toggleNotificationsBtnMobile">
                                                <i class="bi bi-bell-slash me-2"></i> Pengaturan
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                                
                                <!-- User Info -->
                                <div class="d-flex align-items-center">
                                    <!-- Logo kecil untuk mobile -->
                                    <div class="d-md-none me-2">
                                        <img src="/logo/logo_3d.png" 
                                             alt="CleanUp Kupang Logo" 
                                             style="height: 25px; width: auto;">
                                    </div>
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
                    
                    <!-- Main Content Container dengan LOGO di tengah -->
                    <div class="container-fluid py-4 px-3 px-md-4">
                        <div class="row">
                            <div class="col-12">
                                <div id="mainContent">
                                    <!-- Welcome Content dengan LOGO -->
                                    <div class="text-center py-5">
                                        <!-- Logo Besar di Tengah Dashboard -->
                                        <div class="mb-4">
                                            <img src="/logo/logo_3d.png" 
                                                 alt="CleanUp Kupang Logo" 
                                                 style="height: 100px; width: auto; margin-bottom: 20px;">
                                        </div>
                                        
                                        <div class="display-1 text-success mb-4">
                                            <i class="bi bi-speedometer2"></i>
                                        </div>
                                        <h3 class="mb-3">Dashboard Admin CleanUp Kupang</h3>
                                        <p class="text-muted">Selamat datang di sistem manajemen CleanUp Kupang</p>
                                        
                                        <!-- Notification Alert -->
                                        <div id="notification-alert" class="alert alert-info alert-dismissible fade show mt-4 mx-auto" style="max-width: 600px;">
                                            <div class="d-flex align-items-center">
                                                <i class="bi bi-bell-fill fs-4 me-3"></i>
                                                <div>
                                                    <h5 class="alert-heading mb-2">Aktifkan Notifikasi Real-time</h5>
                                                    <p class="mb-2">Dapatkan notifikasi langsung untuk pembayaran baru, laporan menunggu, jadwal, dan aktivitas penting lainnya.</p>
                                                    <div class="d-flex flex-wrap gap-2">
                                                        <button class="btn btn-primary btn-sm" id="enableNotificationsAlert">
                                                            <i class="bi bi-bell me-1"></i> Aktifkan Sekarang
                                                        </button>
                                                        <button class="btn btn-outline-secondary btn-sm" data-bs-dismiss="alert">
                                                            Nanti Saja
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
        
        <!-- Bootstrap JS Bundle with Popper -->
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
        <!-- Animate.css -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
        
        <!-- Custom CSS untuk logo -->
        <style>
            /* Styling untuk logo di sidebar */
            .sidebar-logo {
                filter: brightness(0) invert(1);
                transition: transform 0.3s ease;
            }
            
            .sidebar-logo:hover {
                transform: scale(1.05);
            }
            
            /* Styling untuk logo di navbar */
            .navbar-logo {
                transition: opacity 0.3s ease;
            }
            
            .navbar-logo:hover {
                opacity: 0.8;
            }
            
            /* Styling untuk logo besar di dashboard */
            .dashboard-logo {
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.05);
                }
                100% {
                    transform: scale(1);
                }
            }
            
            /* Styling untuk logo mobile */
            .mobile-logo {
                filter: brightness(0) saturate(100%) invert(27%) sepia(98%) saturate(1500%) hue-rotate(130deg) brightness(90%) contrast(90%);
            }
            
            /* Sidebar Styles */
            .sidebar-link {
                transition: all 0.3s ease;
            }
            
            .sidebar-link:hover {
                background-color: rgba(255, 255, 255, 0.15);
                transform: translateX(5px);
            }
            
            .sidebar-link.active {
                background-color: rgba(255, 255, 255, 0.25);
                border-left: 4px solid #ffc107;
            }
            
            /* Offcanvas Custom */
            .offcanvas-start {
                background: linear-gradient(180deg, #198754 0%, #146c43 100%);
            }
            
            .bg-white-10 {
                background-color: rgba(255, 255, 255, 0.1) !important;
            }
            
            .bg-white-10:hover {
                background-color: rgba(255, 255, 255, 0.2) !important;
            }
            
            /* Stats Cards */
            .stats-card {
                border-radius: 12px;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                border: none;
                overflow: hidden;
            }
            
            .stats-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
            }
            
            .stats-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 5px;
                height: 100%;
            }
            
            .stats-card-success::before { background: linear-gradient(to bottom, #198754, #2ecc71); }
            .stats-card-primary::before { background: linear-gradient(to bottom, #0d6efd, #3498db); }
            .stats-card-warning::before { background: linear-gradient(to bottom, #ffc107, #f39c12); }
            .stats-card-info::before { background: linear-gradient(to bottom, #0dcaf0, #1abc9c); }
            .stats-card-danger::before { background: linear-gradient(to bottom, #dc3545, #e74c3c); }
            .stats-card-secondary::before { background: linear-gradient(to bottom, #6c757d, #7f8c8d); }
            
            .stats-icon {
                width: 70px;
                height: 70px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
            }
            
            /* Trend Chart */
            .trend-bar {
                transition: all 0.3s ease;
                min-height: 10px;
                border-radius: 4px 4px 0 0;
            }
            
            .trend-bar:hover {
                opacity: 0.9;
            }
            
            /* Activity Items */
            .activity-item {
                transition: all 0.3s ease;
                border-left: 3px solid transparent;
            }
            
            .activity-item:hover {
                background-color: rgba(25, 135, 84, 0.05);
                border-left-color: #198754;
                transform: translateX(5px);
            }
            
            /* Quick Actions */
            .quick-action-btn {
                transition: all 0.3s ease;
                border: 2px solid rgba(25, 135, 84, 0.1);
            }
            
            .quick-action-btn:hover {
                background: linear-gradient(135deg, #198754, #146c43);
                color: white;
                border-color: transparent;
                transform: translateY(-3px);
            }
            
            /* Scrollbar */
            .custom-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: #198754 transparent;
            }
            
            .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.05);
                border-radius: 3px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(25, 135, 84, 0.5);
                border-radius: 3px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(25, 135, 84, 0.7);
            }
            
            /* Animation */
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
            
            .animate-fadeInUp {
                animation: fadeInUp 0.6s ease-out;
            }
        </style>
    `;

    // Setup event listeners
    setupNavigation();
    setupLogoutListeners();
    setupNotificationEventListeners();
    
    // Initialize Web Push for admin
    await adminNotifications.initialize();
    
    // Check initial notifications
    await adminNotifications.checkForNewNotifications();
    
    // Update last check time
    updateLastCheckTime();

    // Load default page
    await showDashboardStats();
}

function setupNavigation() {
    // Ganti selector ini untuk mencakup kedua sidebar (desktop dan mobile)
    const menuButtons = document.querySelectorAll('#sidebarMenuDesktop button[data-page], #sidebarMenuMobile button[data-page]');
    
    menuButtons.forEach(btn => {
        btn.onclick = () => {
            // Remove active class from all buttons in both sidebars
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

function setupLogoutListeners() {
    const btnLogout = document.getElementById("btnLogout");
    if (btnLogout) {
        btnLogout.onclick = () => {
            console.log("🔄 Admin: Logout button clicked");
            if (typeof window.logout === 'function') {
                window.logout();
            } else {
                console.error("❌ window.logout function not found");
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
                localStorage.clear();
                window.location.hash = "#/login";
                window.location.reload();
            }
        };
    }
}

function setupNotificationEventListeners() {
    // Desktop notification buttons
    const viewNotificationsBtn = document.getElementById('viewNotificationsBtn');
    if (viewNotificationsBtn) {
        viewNotificationsBtn.addEventListener('click', () => {
            adminNotifications.showNotificationModal();
        });
    }
    
    const toggleNotificationsBtn = document.getElementById('toggleNotificationsBtn');
    if (toggleNotificationsBtn) {
        toggleNotificationsBtn.addEventListener('click', async () => {
            const originalText = toggleNotificationsBtn.innerHTML;
            toggleNotificationsBtn.disabled = true;
            toggleNotificationsBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Memproses...';
            
            try {
                await adminNotifications.toggleNotifications();
            } finally {
                toggleNotificationsBtn.disabled = false;
                toggleNotificationsBtn.innerHTML = originalText;
            }
        });
    }
    
    // Mobile notification buttons
    const viewNotificationsBtnMobile = document.getElementById('viewNotificationsBtnMobile');
    if (viewNotificationsBtnMobile) {
        viewNotificationsBtnMobile.addEventListener('click', () => {
            adminNotifications.showNotificationModal();
        });
    }
    
    const toggleNotificationsBtnMobile = document.getElementById('toggleNotificationsBtnMobile');
    if (toggleNotificationsBtnMobile) {
        toggleNotificationsBtnMobile.addEventListener('click', async () => {
            const originalText = toggleNotificationsBtnMobile.innerHTML;
            toggleNotificationsBtnMobile.disabled = true;
            toggleNotificationsBtnMobile.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Memproses...';
            
            try {
                await adminNotifications.toggleNotifications();
            } finally {
                toggleNotificationsBtnMobile.disabled = false;
                toggleNotificationsBtnMobile.innerHTML = originalText;
            }
        });
    }
    
    // Alert button
    const enableNotificationsAlert = document.getElementById('enableNotificationsAlert');
    if (enableNotificationsAlert) {
        enableNotificationsAlert.addEventListener('click', async () => {
            await adminNotifications.enableNotifications();
            const alertElement = document.getElementById('notification-alert');
            if (alertElement) {
                alertElement.classList.add('d-none');
            }
        });
    }
    
    // Notification bell click
    const notificationBell = document.getElementById('notification-bell');
    if (notificationBell) {
        notificationBell.addEventListener('click', async () => {
            await adminNotifications.updateUnreadNotificationsCount();
        });
    }
    
    const notificationBellMobile = document.getElementById('notification-bell-mobile');
    if (notificationBellMobile) {
        notificationBellMobile.addEventListener('click', async () => {
            await adminNotifications.updateUnreadNotificationsCount();
        });
    }
}

function updateLastCheckTime() {
    const lastCheckElement = document.getElementById('last-notification-check');
    if (lastCheckElement) {
        lastCheckElement.textContent = new Date().toLocaleTimeString('id-ID');
    }
}

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
        'notifications': '<i class="bi bi-bell me-2"></i>Manajemen Notifikasi',
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
            case 'notifications':
                await notificationAdminPage();
                break;
            case 'push-subscriptions':
                await pushSubscriptionAdminPage();
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
                    <div class="card animate-fadeInUp">
                        <div class="card-body text-center py-5">
                            <h4 class="text-danger">
                                <i class="bi bi-exclamation-triangle me-2"></i>Halaman tidak ditemukan
                            </h4>
                            <p class="text-muted">Halaman ${page} tidak tersedia</p>
                            <button onclick="loadPage('dashboard')" class="btn btn-success mt-3">
                                <i class="bi bi-house me-1"></i> Kembali ke Dashboard
                            </button>
                        </div>
                    </div>
                `;
        }
    } catch (error) {
        console.error('Error loading page:', error);
        mainContent.innerHTML = `
            <div class="card border-danger animate-fadeInUp">
                <div class="card-body text-center py-5">
                    <div class="text-danger mb-3">
                        <i class="bi bi-exclamation-triangle-fill" style="font-size: 3rem;"></i>
                    </div>
                    <h4 class="text-danger">Terjadi Kesalahan</h4>
                    <p class="text-muted">Gagal memuat halaman: ${error.message}</p>
                    <button onclick="location.reload()" class="btn btn-outline-success mt-3">
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
    
    // Show loading
    mainContent.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center py-5 animate-fadeInUp">
            <div class="spinner-border text-success" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3 text-muted">Memuat statistik dashboard...</p>
        </div>
    `;
    
    try {
        const [stats, trendData] = await Promise.all([
            fetchDashboardStats(),
            fetchTrendData()
        ]);
        
        const formatRupiah = (number) => {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(number);
        };
        
        mainContent.innerHTML = `
            <div class="animate-fadeInUp">
                <!-- Header -->
                <div class="mb-4">
                    <h3 class="text-success fw-bold">📊 Dashboard Utama</h3>
                    <p class="text-muted mb-1">Selamat datang di panel administrasi CleanUp System</p>
                    <small class="text-muted">
                        <i class="bi bi-clock-history me-1"></i>Terakhir diperbarui: ${new Date().toLocaleTimeString('id-ID')}
                    </small>
                </div>
                
                <!-- Stats Cards Grid (2 rows × 3 columns) -->
                <div class="row g-3 mb-4">
                    <!-- Row 1 -->
                    <div class="col-xl-4 col-lg-4 col-md-6">
                        <div class="card stats-card stats-card-success h-100 shadow-sm border-0">
                            <div class="card-body p-4">
                                <div class="d-flex align-items-center">
                                    <div class="stats-icon bg-success bg-opacity-10 text-success me-3">
                                        <i class="bi bi-people-fill"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h6 class="text-muted text-uppercase small fw-semibold mb-2">Total Users</h6>
                                        <h3 class="text-success fw-bold mb-2">${stats.totalUsers.toLocaleString()}</h3>
                                        <small class="text-muted">Semua pengguna terdaftar</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-xl-4 col-lg-4 col-md-6">
                        <div class="card stats-card stats-card-primary h-100 shadow-sm border-0">
                            <div class="card-body p-4">
                                <div class="d-flex align-items-center">
                                    <div class="stats-icon bg-primary bg-opacity-10 text-primary me-3">
                                        <i class="bi bi-person-check-fill"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h6 class="text-muted text-uppercase small fw-semibold mb-2">Anggota Aktif</h6>
                                        <h3 class="text-primary fw-bold mb-2">${stats.anggotaAktif.toLocaleString()}</h3>
                                        <small class="text-muted">
                                            ${stats.totalUsers > 0 ? 
                                                `${((stats.anggotaAktif / stats.totalUsers) * 100).toFixed(1)}% dari total` : 
                                                '0% dari total'
                                            }
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-xl-4 col-lg-4 col-md-6">
                        <div class="card stats-card stats-card-warning h-100 shadow-sm border-0">
                            <div class="card-body p-4">
                                <div class="d-flex align-items-center">
                                    <div class="stats-icon bg-warning bg-opacity-10 text-warning me-3">
                                        <i class="bi bi-truck"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h6 class="text-muted text-uppercase small fw-semibold mb-2">Tim Pengangkut</h6>
                                        <h3 class="text-warning fw-bold mb-2">1</h3>
                      Export Laporan                  <small class="text-muted">Tim aktif hari ini</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Row 2 -->
                    <div class="col-xl-4 col-lg-4 col-md-6">
                        <div class="card stats-card stats-card-info h-100 shadow-sm border-0">
                            <div class="card-body p-4">
                                <div class="d-flex align-items-center">
                                    <div class="stats-icon bg-info bg-opacity-10 text-info me-3">
                                        <i class="bi bi-cash-coin"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h6 class="text-muted text-uppercase small fw-semibold mb-2">Pembayaran Bulan Ini</h6>
                                        <h3 class="text-info fw-bold mb-2">${formatRupiah(stats.totalPembayaranBulanIni)}</h3>
                                        <small class="text-muted">Status lunas</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-xl-4 col-lg-4 col-md-6">
                        <div class="card stats-card stats-card-danger h-100 shadow-sm border-0">
                            <div class="card-body p-4">
                                <div class="d-flex align-items-center">
                                    <div class="stats-icon bg-danger bg-opacity-10 text-danger me-3">
                                        <i class="bi bi-trash"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h6 class="text-muted text-uppercase small fw-semibold mb-2">Laporan Sampah</h6>
                                        <h3 class="text-danger fw-bold mb-2">${stats.totalLaporan.toLocaleString()}</h3>
                                        <small class="text-muted">Total semua laporan</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-xl-4 col-lg-4 col-md-6">
                        <div class="card stats-card stats-card-secondary h-100 shadow-sm border-0">
                            <div class="card-body p-4">
                                <div class="d-flex align-items-center">
                                    <div class="stats-icon bg-secondary bg-opacity-10 text-secondary me-3">
                                        <i class="bi bi-calendar-check"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h6 class="text-muted text-uppercase small fw-semibold mb-2">Jadwal Hari Ini</h6>
                                        <h3 class="text-secondary fw-bold mb-2">${stats.jadwalHariIni.toLocaleString()}</h3>
                                        <small class="text-muted">Pengangkutan terjadwal</small>
                                    </div>
                                </div>
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
                                <div class="card h-100 shadow-sm border-0">
                                    <div class="card-header bg-success bg-opacity-10 border-0">
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
                                <div class="card h-100 shadow-sm border-0">
                                    <div class="card-header bg-primary bg-opacity-10 border-0">
                                        <h5 class="card-title mb-0">
                                            <i class="bi bi-pie-chart me-2"></i>Distribusi User per Role
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        ${renderUserChart(stats.userRoles)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Activity Column -->
                    <div class="col-lg-4">
                        <div class="card h-100 shadow-sm border-0">
                            <div class="card-header bg-warning bg-opacity-10 border-0 d-flex justify-content-between align-items-center">
                                <h5 class="card-title mb-0">
                                    <i class="bi bi-activity me-2"></i>Aktivitas Terbaru
                                </h5>
                                <button class="btn btn-sm btn-outline-success" id="refreshActivity">
                                    <i class="bi bi-arrow-clockwise"></i>
                                </button>
                            </div>
                            <div class="card-body p-0 custom-scrollbar" style="max-height: 400px;">
                                <div class="list-group list-group-flush">
                                    ${stats.recentActivities.length > 0 ? 
                                        stats.recentActivities.map(activity => `
                                            <div class="list-group-item activity-item border-0">
                                                <div class="d-flex align-items-start">
                                                    <div class="me-3">
                                                        <span class="fs-5">${activity.icon}</span>
                                                    </div>
                                                    <div class="flex-grow-1">
                                                        <h6 class="mb-1 fw-semibold">${activity.title}</h6>
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
                            
                            <div class="card-footer bg-transparent border-0">
                                <h6 class="mb-3">
                                    <i class="bi bi-lightning-fill me-2 text-success"></i>Aksi Cepat
                                </h6>
                                <div class="row g-2">
                                    <div class="col-6">
                                        <button class="btn btn-outline-success w-100 quick-action-btn" data-page="users">
                                            <i class="bi bi-person-plus me-1"></i>Tambah User
                                        </button>
                                    </div>
                                    <div class="col-6">
                                        <button class="btn btn-outline-primary w-100 quick-action-btn" data-page="jadwal">
                                            <i class="bi bi-calendar-plus me-1"></i>Buat Jadwal
                                        </button>
                                    </div>
                                    <div class="col-6">
                                        <button class="btn btn-outline-warning w-100 quick-action-btn" data-page="reports">
                                            <i class="bi bi-file-earmark-text me-1"></i>Lihat Laporan
                                        </button>
                                    </div>
                                    <div class="col-6">
                                        <button class="btn btn-outline-info w-100 quick-action-btn" id="refreshDashboard">
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

        // Add event listeners
        setTimeout(() => {
            // Quick action buttons
            document.querySelectorAll('.quick-action-btn[data-page]').forEach(btn => {
                btn.addEventListener('click', () => {
                    loadPage(btn.getAttribute('data-page'));
                });
            });
            
            // Refresh buttons
            const refreshBtn = document.getElementById('refreshDashboard');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    showDashboardStats();
                });
            }
            
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
            <div class="card border-danger animate-fadeInUp">
                <div class="card-body text-center py-5">
                    <div class="text-danger mb-3">
                        <i class="bi bi-exclamation-triangle-fill" style="font-size: 3rem;"></i>
                    </div>
                    <h4 class="text-danger">Gagal Memuat Dashboard</h4>
                    <p class="text-muted">${error.message || 'Terjadi kesalahan saat mengambil data'}</p>
                    <button onclick="showDashboardStats()" class="btn btn-success mt-3">
                        <i class="bi bi-arrow-clockwise me-1"></i> Coba Lagi
                    </button>
                </div>
            </div>
        `;
    }
}

function renderTrendChart(trendData) {
    // Generate dummy data for example
    const labels = ["12/07", "12/08", "12/09", "12/10", "12/11", "12/12", "12/13"];
    const data = [0, 3, 2, 0, 0, 0, 0];
    const colors = ['#198754', '#28a745', '#20c997', '#17a2b8', '#007bff', '#6f42c1', '#e83e8c'];
    
    const maxValue = Math.max(...data, 1);
    
    return `
        <div>
            <div class="d-flex justify-content-between mb-4">
                <div>
                    <h6 class="text-muted mb-1">Total Laporan</h6>
                    <h3 class="text-success fw-bold">${data.reduce((a, b) => a + b, 0)}</h3>
                </div>
                <div>
                    <h6 class="text-muted mb-1">Rata-rata/hari</h6>
                    <h3 class="text-primary fw-bold">${(data.reduce((a, b) => a + b, 0) / data.length).toFixed(1)}</h3>
                </div>
                <div>
                    <h6 class="text-muted mb-1">Puncak</h6>
                    <h3 class="text-warning fw-bold">${maxValue}</h3>
                </div>
            </div>
            
            <div class="d-flex align-items-end justify-content-between" style="height: 180px;">
                ${data.map((value, index) => {
                    const height = value === 0 ? 10 : (value / maxValue * 100);
                    const barColor = value === 0 ? '#e9ecef' : colors[index];
                    const isToday = labels[index] === "12/13";
                    
                    return `
                        <div class="d-flex flex-column align-items-center" style="width: 14%;">
                            <div class="position-relative mb-2">
                                <div class="trend-bar rounded-top ${isToday ? 'border border-2 border-success shadow-sm' : ''}" 
                                     style="height: ${height}px; background-color: ${barColor}; width: 35px;"
                                     data-bs-toggle="tooltip" title="${labels[index]}: ${value} laporan">
                                </div>
                                <div class="position-absolute top-0 start-50 translate-middle-x mt-1 small fw-bold">
                                    ${value}
                                </div>
                            </div>
                            <small class="text-muted">${labels[index]}</small>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function renderUserChart(userRoles) {
    const roles = Object.keys(userRoles);
    const counts = Object.values(userRoles);
    const total = counts.reduce((a, b) => a + b, 0);
    
    if (roles.length === 0) {
        return `
            <div class="text-center py-4">
                <i class="bi bi-pie-chart fs-1 text-muted mb-3"></i>
                <p class="text-muted">Belum ada data user</p>
            </div>
        `;
    }
    
    const roleColors = {
        'admin': '#198754',
        'anggota': '#0d6efd',
        'tamu': '#fd7e14',
        'tim_angkut': '#6f42c1'
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
                            <div class="d-flex align-items-center mb-1">
                                <div class="rounded-circle me-2" style="width: 12px; height: 12px; background-color: ${color};"></div>
                                <span class="fw-semibold">${roleName}</span>
                                <span class="ms-auto fw-bold">${count}</span>
                            </div>
                            <div class="progress" style="height: 8px;">
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
        
        const last7Days = Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();
        
        return last7Days.map(date => ({
            date: date.split('-').slice(1).join('/'),
            count: laporan.filter(l => l.tanggal_lapor === date).length
        }));
    } catch {
        return Array.from({length: 7}, (_, i) => ({ date: '0', count: 0 }));
    }
}