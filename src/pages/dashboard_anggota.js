import { authGuard } from "../utils/authGuard.js";
import { profilPage } from "./anggota/profil.js";
import { laporanPage } from "./anggota/laporan.js";
import { pembayaranPage } from "./anggota/pembayaran.js";
import { detailAnggotaJadwalPage } from "./anggota/jadwal.js";
import { showModal } from "../utils/modal.js";
import { fetchAPI, API, getAuthHeaders } from "../api.js";

let currentUserData = null;
let paymentStatus = {
    hasActivePayment: false,
    showPaymentReminder: false,
    currentPayment: null
};

// Fungsi untuk refresh status pembayaran
async function refreshPaymentStatus() {
    try {
        // Reset status
        paymentStatus.hasActivePayment = false;
        paymentStatus.showPaymentReminder = false;
        paymentStatus.currentPayment = null;
        
        if (!currentUserData) {
            currentUserData = JSON.parse(localStorage.getItem("user") || "{}");
        }
        
        const anggotaResponse = await fetchAPI(`${API.anggota}?user=${currentUserData.id}`, {
            headers: getAuthHeaders(),
        });

        if (anggotaResponse && anggotaResponse.length > 0) {
            const anggota = anggotaResponse[0];
            currentUserData.idAnggota = anggota.idAnggota;
            
            // Fetch status pembayaran terbaru
            const pembayaranResponse = await fetchAPI(`${API.pembayaran}?anggota=${anggota.idAnggota}&ordering=-created_at`, {
                headers: getAuthHeaders(),
            });

            if (pembayaranResponse && pembayaranResponse.length > 0) {
                paymentStatus.currentPayment = pembayaranResponse[0];
                
                if (paymentStatus.currentPayment.status === 'paid' || 
                    paymentStatus.currentPayment.status === 'success' || 
                    paymentStatus.currentPayment.statusBayar === 'lunas' ||
                    paymentStatus.currentPayment.statusBayar === 'success') {
                    paymentStatus.hasActivePayment = true;
                    paymentStatus.showPaymentReminder = false;
                } else if (paymentStatus.currentPayment.status === 'pending') {
                    paymentStatus.hasActivePayment = false;
                    paymentStatus.showPaymentReminder = true;
                }
            } else {
                paymentStatus.hasActivePayment = false;
                paymentStatus.showPaymentReminder = true;
            }
        } else {
            console.error("Anggota tidak ditemukan untuk user ini");
            paymentStatus.hasActivePayment = false;
            paymentStatus.showPaymentReminder = true;
        }
        
        console.log("🔄 Payment status refreshed:", paymentStatus);
        return paymentStatus;
        
    } catch (error) {
        console.error("Error refreshing payment status:", error);
        return paymentStatus;
    }
}

// Helper untuk format tanggal
function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (error) {
        return '';
    }
}

// Helper untuk menampilkan alert
function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '1050';
    alertDiv.style.minWidth = '300px';
    alertDiv.innerHTML = `
        <div>${message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Modal untuk pembayaran required
function showPaymentRequiredModal() {
    showModal(
        "Pembayaran Diperlukan",
        `
        <div class="text-center py-4">
            <div class="display-1 text-warning mb-3">
                <i class="bi bi-credit-card"></i>
            </div>
            <h4 class="text-warning mb-3">Fitur Ini Membutuhkan Pembayaran</h4>
            <p class="text-muted mb-4">
                Untuk dapat mengakses fitur pengangkutan sampah, Anda perlu menyelesaikan pembayaran bulanan terlebih dahulu.
                Setelah pembayaran lunas, semua fitur akan terbuka untuk Anda.
            </p>
            <div class="row g-3 mt-4">
                <div class="col-md-6">
                    <div class="card border-warning">
                        <div class="card-body">
                            <h5 class="card-title text-warning">
                                <i class="bi bi-info-circle me-2"></i>Informasi Pembayaran
                            </h5>
                            <ul class="text-start mt-3">
                                <li class="mb-2">Biaya bulanan: <strong>Rp 50.000</strong></li>
                                <li class="mb-2">Layanan: Pengangkutan 4x sebulan</li>
                                <li class="mb-2">Pembayaran via Transfer Bank/QRIS</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-success">
                        <div class="card-body">
                            <h5 class="card-title text-success">
                                <i class="bi bi-check-circle me-2"></i>Manfaat Setelah Bayar
                            </h5>
                            <ul class="text-start mt-3">
                                <li class="mb-2"><i class="bi bi-check text-success me-2"></i>Akses laporan sampah</li>
                                <li class="mb-2"><i class="bi bi-check text-success me-2"></i>Jadwal pengangkutan</li>
                                <li class="mb-2"><i class="bi bi-check text-success me-2"></i>Tim pengangkut datang</li>
                                <li class="mb-2"><i class="bi bi-check text-success me-2"></i>Lingkungan lebih bersih</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mt-4">
                <button id="modalBayarSekarang" class="btn btn-success btn-lg">
                    <i class="bi bi-credit-card me-2"></i>Bayar Sekarang
                </button>
            </div>
        </div>
        `,
        null
    );
    
    // Event listener untuk tombol di modal
    setTimeout(() => {
        const modalBtn = document.getElementById('modalBayarSekarang');
        if (modalBtn) {
            modalBtn.addEventListener('click', () => {
                const pembayaranBtn = document.getElementById('btnPembayaran');
                if (pembayaranBtn) {
                    pembayaranBtn.click();
                }
            });
        }
    }, 100);
}

// Fungsi untuk menangani klik menu
function createMenuHandler(handler, requiresPayment = false) {
    return async function(event) {
        const currentHasActivePayment = paymentStatus.hasActivePayment;
        
        if (requiresPayment && !currentHasActivePayment) {
            // Cek ulang status pembayaran sebelum menolak
            await refreshPaymentStatus();
            
            if (!paymentStatus.hasActivePayment) {
                showPaymentRequiredModal();
                return;
            }
        }
        
        // Update active state
        document.querySelectorAll('.nav-link.btn').forEach(btn => {
            btn.classList.remove('active');
        });
        if (event.target.closest('.nav-link.btn')) {
            event.target.closest('.nav-link.btn').classList.add('active');
        }
        
        // Show loading
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
            mainContent.style.opacity = "0.5";
            mainContent.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p>Memuat...</p>
                </div>
            `;
            
            try {
                await handler();
            } catch (error) {
                console.error(`Error loading page:`, error);
                mainContent.innerHTML = `
                    <div class="alert alert-danger">
                        <h4 class="alert-heading"><i class="bi bi-exclamation-triangle me-2"></i>Terjadi Kesalahan</h4>
                        <p>${error.message}</p>
                        <button onclick="location.reload()" class="btn btn-primary mt-2">
                            Muat Ulang
                        </button>
                    </div>
                `;
            } finally {
                mainContent.style.opacity = "1";
            }
        }
    };
}

// Fungsi untuk setup event listeners
function setupEventListeners() {
    const buttons = {
        btnProfil: { handler: profilPage, requiresPayment: false },
        btnLaporan: { handler: laporanPage, requiresPayment: true },
        btnPembayaran: { handler: pembayaranPage, requiresPayment: false },
        btnJadwal: { handler: detailAnggotaJadwalPage, requiresPayment: true }
    };

    Object.entries(buttons).forEach(([btnId, config]) => {
        const button = document.getElementById(btnId);
        if (button) {
            button.onclick = createMenuHandler(config.handler, config.requiresPayment);
        }
    });
    
    // Tombol bayar sekarang di banner
    const btnBayarSekarang = document.getElementById('btnBayarSekarang');
    if (btnBayarSekarang) {
        btnBayarSekarang.onclick = () => {
            const pembayaranBtn = document.getElementById('btnPembayaran');
            if (pembayaranBtn) {
                pembayaranBtn.click();
            }
        };
    }
    
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

// Fungsi untuk mengecek status pembayaran (global)
window.checkPaymentStatus = async function(forceRefresh = false) {
    const btn = event?.target || document.querySelector('[onclick*="checkPaymentStatus"]');
    const originalHTML = btn?.innerHTML;
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Checking...';
    }
    
    try {
        await refreshPaymentStatus();
        
        if (paymentStatus.hasActivePayment && forceRefresh) {
            // Jika status berubah menjadi aktif, reload dashboard
            showAlert('success', '✅ Status pembayaran telah aktif! Memuat ulang dashboard...');
            setTimeout(() => {
                // Refresh halaman
                window.location.reload();
            }, 1000);
        } else if (!paymentStatus.hasActivePayment && forceRefresh) {
            // Status masih belum aktif
            showAlert('info', 'Status pembayaran masih menunggu. Silakan selesaikan pembayaran.');
        }
        
    } catch (error) {
        console.error("Error checking payment status:", error);
        showAlert('danger', 'Gagal memeriksa status pembayaran');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    }
};

export async function dashboardAnggota() {
    const user = await authGuard();
    if (!user) {
        alert("Silakan login terlebih dahulu!");
        window.location.hash = "#/login";
        return;
    }

    // Validasi role
    if (user.role !== "anggota") {
        console.warn(`User role is ${user.role}, redirecting to appropriate dashboard`);
        
        switch(user.role) {
            case "admin":
                window.location.hash = "#/dashboard";
                return;
            case "tamu":
            case "tim_angkut":
                window.location.hash = "#/dashboard";
                return;
            default:
                alert("Anda tidak memiliki akses ke dashboard anggota!");
                window.location.hash = "#/login";
                return;
        }
    }

    currentUserData = user;
    
    // Refresh payment status
    await refreshPaymentStatus();
    
    const { hasActivePayment, showPaymentReminder, currentPayment } = paymentStatus;

    const app = document.getElementById("app");
    app.innerHTML = `
        <!-- Bootstrap 5 CSS -->
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">
        
        <div class="container-fluid p-0">
            <!-- Header dengan gradient -->
            <div class="bg-success bg-gradient text-white p-4 mb-4">
                <div class="container">
                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                        <div class="mb-3 mb-md-0">
                            <h1 class="h2 mb-2"><i class="bi bi-person-circle me-2"></i>Selamat Datang, ${user.username}!</h1>
                            <p class="mb-0 opacity-75">Anda login sebagai <strong>Anggota CleanUp</strong></p>
                            <div class="mt-2">
                                <button onclick="checkPaymentStatus(true)" class="btn btn-sm btn-light">
                                    <i class="bi bi-arrow-clockwise me-1"></i>Refresh Status
                                </button>
                                <span class="ms-2 small">
                                    Status: ${hasActivePayment ? 
                                        '<span class="badge bg-success">✓ Aktif</span>' : 
                                        '<span class="badge bg-warning">⏳ Menunggu</span>'
                                    }
                                </span>
                            </div>
                        </div>
                        <div class="d-flex flex-wrap gap-3">
                            <div class="bg-white bg-opacity-25 p-3 rounded">
                                <small class="d-block text-white text-opacity-75">Status</small>
                                <div class="fw-bold">
                                    ${hasActivePayment ? 
                                        '<span class="badge bg-success">Aktif</span>' : 
                                        '<span class="badge bg-warning text-dark">Perlu Bayar</span>'
                                    }
                                </div>
                            </div>
                            <div class="bg-white bg-opacity-25 p-3 rounded">
                                <small class="d-block text-white text-opacity-75">ID Anggota</small>
                                <div class="fw-bold">#${user.idAnggota ? user.idAnggota.toString().padStart(4, '0') : '---'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="container">
                <!-- Pembayaran Reminder Banner -->
                ${showPaymentReminder ? `
                <div class="alert alert-warning alert-dismissible fade show mb-4 shadow-sm" role="alert">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                        <div>
                            <h5 class="alert-heading mb-2">Pembayaran Bulanan Belum Lunas</h5>
                            <p class="mb-2">Untuk dapat menggunakan layanan pengangkutan sampah, silakan selesaikan pembayaran bulanan terlebih dahulu.</p>
                            <div class="d-flex flex-wrap gap-2">
                                <button id="btnBayarSekarang" class="btn btn-success btn-sm">
                                    <i class="bi bi-credit-card me-1"></i> Bayar Sekarang
                                </button>
                                <button class="btn btn-outline-secondary btn-sm" data-bs-dismiss="alert">
                                    Nanti Saja
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                ${hasActivePayment ? `
                <div class="alert alert-success alert-dismissible fade show mb-4 shadow-sm" role="alert">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-check-circle-fill fs-4 me-3"></i>
                        <div>
                            <h5 class="alert-heading mb-2">✅ Pembayaran Lunas!</h5>
                            <p class="mb-0">Status anggota Anda aktif. Semua fitur kini terbuka.</p>
                            ${currentPayment ? `
                            <small class="text-muted">
                                Terakhir bayar: ${formatDate(currentPayment.tanggal_bayar || currentPayment.created_at)} | 
                                ID: #${currentPayment.idPembayaran || currentPayment.id}
                            </small>
                            ` : ''}
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <!-- Main Card -->
                <div class="card shadow-sm mb-4">
                    <!-- Navbar dengan Bootstrap 5 -->
                    <nav class="navbar navbar-expand-lg navbar-light bg-light border-bottom">
                        <div class="container-fluid">
                            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#dashboardNavbar" aria-controls="dashboardNavbar" aria-expanded="false" aria-label="Toggle navigation">
                                <span class="navbar-toggler-icon"></span>
                            </button>
                            
                            <div class="collapse navbar-collapse" id="dashboardNavbar">
                                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                                    <li class="nav-item">
                                        <button id="btnLaporan" class="nav-link btn btn-link">
                                            <i class="bi bi-clipboard-check me-1"></i> Laporan Sampah
                                        </button>
                                    </li>
                                    <li class="nav-item">
                                        <button id="btnProfil" class="nav-link btn btn-link">
                                            <i class="bi bi-person me-1"></i> Profil
                                        </button>
                                    </li>
                                    <li class="nav-item">
                                        <button id="btnJadwal" class="nav-link btn btn-link ${!hasActivePayment ? 'disabled-link' : ''}">
                                            <i class="bi bi-calendar-event me-1"></i> Jadwal Angkut
                                            ${!hasActivePayment ? '<span class="badge bg-secondary ms-1">🔒</span>' : ''}
                                        </button>
                                    </li>
                                    <li class="nav-item">
                                        <button id="btnPembayaran" class="nav-link btn btn-link">
                                            <i class="bi bi-credit-card me-1"></i> Pembayaran
                                        </button>
                                    </li>
                                </ul>
                                
                                <div class="d-flex">
                                    <button onclick="checkPaymentStatus(true)" class="btn btn-outline-primary btn-sm me-2">
                                        <i class="bi bi-arrow-clockwise me-1"></i> Refresh
                                    </button>
                                    <button id="btnLogout" class="btn btn-outline-danger">
                                        <i class="bi bi-box-arrow-right me-1"></i> Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </nav>

                    <!-- Main Content Area -->
                    <div id="mainContent" class="p-4 min-vh-50">
                        <!-- Konten akan dimuat di sini -->
                        <div class="text-center py-5">
                            <div class="display-1 ${hasActivePayment ? 'text-success' : 'text-muted'} mb-4">
                                <i class="bi bi-person-circle"></i>
                            </div>
                            <h3 class="mb-3">Dashboard Anggota CleanUp</h3>
                            <p class="text-muted">Pilih menu di atas untuk mengakses fitur</p>
                            
                            ${!hasActivePayment ? `
                            <div class="alert alert-warning mt-4 max-w-600 mx-auto">
                                <i class="bi bi-exclamation-circle me-2"></i>
                                <strong>Perhatian:</strong> Anda belum dapat mengakses fitur pengangkutan sampah karena pembayaran bulanan belum dilakukan.
                                <div class="mt-2">
                                    <button id="btnGoToPayment" class="btn btn-success btn-sm">
                                        <i class="bi bi-credit-card me-1"></i> Bayar Sekarang
                                    </button>
                                </div>
                            </div>
                            ` : `
                            <div class="alert alert-success mt-4 max-w-600 mx-auto">
                                <i class="bi bi-check-circle me-2"></i>
                                <strong>Selamat!</strong> Status Anda aktif. Semua fitur sekarang tersedia.
                            </div>
                            `}
                        </div>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="row g-4 mb-4">
                    <div class="col-md-6 col-lg-3">
                        <div class="card h-100 border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex align-items-center mb-3">
                                    <div class="${hasActivePayment ? 'bg-success' : 'bg-warning'} bg-opacity-10 p-3 rounded me-3">
                                        <i class="bi ${hasActivePayment ? 'bi-check-circle text-success' : 'bi-clock text-warning'} fs-4"></i>
                                    </div>
                                    <div>
                                        <h5 class="card-title mb-1">Status Layanan</h5>
                                        <p class="card-text text-muted mb-0">Pengangkutan Sampah</p>
                                    </div>
                                </div>
                                ${hasActivePayment ? 
                                    '<span class="badge bg-success">✓ Aktif</span>' : 
                                    '<span class="badge bg-warning text-dark">⏳ Menunggu Pembayaran</span>'
                                }
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6 col-lg-3">
                        <div class="card h-100 border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex align-items-center mb-3">
                                    <div class="bg-warning bg-opacity-10 p-3 rounded me-3">
                                        <i class="bi bi-currency-dollar text-warning fs-4"></i>
                                    </div>
                                    <div>
                                        <h5 class="card-title mb-1">Biaya Bulanan</h5>
                                        <p class="card-text text-muted mb-0">Rp 50.000</p>
                                    </div>
                                </div>
                                ${currentPayment && (currentPayment.status === 'paid' || currentPayment.statusBayar === 'lunas') ? 
                                    `<span class="badge bg-success">✓ Lunas (${formatDate(currentPayment.tanggal_bayar || currentPayment.created_at)})</span>` :
                                    '<span class="badge bg-danger">❌ Belum Bayar</span>'
                                }
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6 col-lg-3">
                        <div class="card h-100 border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex align-items-center mb-3">
                                    <div class="bg-info bg-opacity-10 p-3 rounded me-3">
                                        <i class="bi bi-truck text-info fs-4"></i>
                                    </div>
                                    <div>
                                        <h5 class="card-title mb-1">Pengangkutan</h5>
                                        <p class="card-text text-muted mb-0">${hasActivePayment ? 'Aktif' : 'Tidak Aktif'}</p>
                                    </div>
                                </div>
                                <span class="badge ${hasActivePayment ? 'bg-info' : 'bg-secondary'}">
                                    ${hasActivePayment ? '📦 Siap diangkut' : '🔒 Tunggu pembayaran'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6 col-lg-3">
                        <div class="card h-100 border-0 shadow-sm">
                            <div class="card-body">
                                <div class="d-flex align-items-center mb-3">
                                    <div class="bg-success bg-opacity-10 p-3 rounded me-3">
                                        <i class="bi bi-star text-success fs-4"></i>
                                    </div>
                                    <div>
                                        <h5 class="card-title mb-1">Kontribusi Anda</h5>
                                        <p class="card-text text-muted mb-0">Lingkungan Bersih</p>
                                    </div>
                                </div>
                                <span class="badge bg-warning text-dark">
                                    ${hasActivePayment ? '🌱 Aktif berkontribusi' : '💡 Siap berkontribusi'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <footer class="text-center py-4 mt-4 border-top">
                    <p class="mb-2">
                        <strong>CleanUp Kupang</strong> - Layanan Angkut Sampah Profesional<br>
                        <small class="text-muted">
                            <i class="bi bi-telephone me-1"></i> (0380) 123456 | 
                            <i class="bi bi-envelope ms-2 me-1"></i> info@cleanupkupang.id
                        </small>
                    </p>
                    <small class="text-muted">© 2024 CleanUp. Semua hak dilindungi.</small>
                </footer>
            </div>
        </div>

        <!-- Bootstrap 5 JS Bundle -->
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
    `;

    // Custom CSS
    const style = document.createElement('style');
    style.textContent = `
        .nav-link.btn {
            color: #495057;
            text-decoration: none;
            border-radius: 0;
            padding: 0.5rem 1rem;
            position: relative;
        }
        
        .nav-link.btn:hover {
            color: #0d6efd;
            background-color: rgba(13, 110, 253, 0.05);
        }
        
        .nav-link.btn.active {
            color: #0d6efd;
            font-weight: 600;
        }
        
        .nav-link.btn.active::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 1rem;
            right: 1rem;
            height: 3px;
            background-color: #0d6efd;
            border-radius: 3px 3px 0 0;
        }
        
        .disabled-link {
            opacity: 0.5;
            cursor: not-allowed !important;
            pointer-events: none;
        }
        
        .card {
            border-radius: 10px;
        }
        
        .min-vh-50 {
            min-height: 400px;
        }
        
        .max-w-600 {
            max-width: 600px;
        }
        
        @media (max-width: 768px) {
            .navbar-nav {
                gap: 0.5rem;
            }
            
            .nav-link.btn.active::after {
                left: 0.5rem;
                right: 0.5rem;
            }
        }
    `;
    document.head.appendChild(style);

    // Setup event listeners
    setupEventListeners();
    
    // Tambahkan event listener untuk btnGoToPayment
    setTimeout(() => {
        const btnGoToPayment = document.getElementById('btnGoToPayment');
        if (btnGoToPayment) {
            btnGoToPayment.onclick = () => {
                const pembayaranBtn = document.getElementById('btnPembayaran');
                if (pembayaranBtn) {
                    pembayaranBtn.click();
                }
            };
        }
    }, 100);

    // Load laporan page by default
    try {
        await laporanPage();
        const btnLaporan = document.getElementById("btnLaporan");
        if (btnLaporan) {
            btnLaporan.classList.add('active');
        }
    } catch (error) {
        console.error("Error loading default page:", error);
        // Fallback ke profil page
        try {
            await profilPage();
            const btnProfil = document.getElementById("btnProfil");
            if (btnProfil) {
                btnProfil.classList.add('active');
            }
        } catch (profileError) {
            console.error("Error loading profile page:", profileError);
        }
    }
}