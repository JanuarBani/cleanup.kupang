import { authGuard } from "../utils/authGuard.js";
import { profilPage } from "./anggota/profil.js";
import { laporanPage } from "./anggota/laporan.js";
import { pembayaranPage } from "./anggota/pembayaran.js";
import { detailAnggotaJadwalPage } from "./anggota/jadwal.js";
import { showModal } from "../utils/modal.js";
import { API, getAuthHeaders } from "../api.js";
import webPushManager from "../utils/webPush.js";
import { showToast } from "../utils/toast.js";
import { showPaymentDetail } from "./anggota/pembayaran_detail.js";

let currentUserData = null;
let paymentStatus = {
    hasActivePayment: false,
    showPaymentReminder: false,
    currentPayment: null
};

// Helper function untuk fetch dengan error handling
async function fetchData(url, options = {}) {
    try {
        console.log(`🌐 Fetching: ${url}`);
        const response = await fetch(url, {
            headers: getAuthHeaders(),
            credentials: "include",
            ...options
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ HTTP ${response.status}: ${errorText}`);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log(`✅ Response from ${url}:`, data);
        return data;
    } catch (error) {
        console.error(`💥 Error fetching ${url}:`, error);
        throw error;
    }
}

// Fungsi untuk refresh status pembayaran
async function refreshPaymentStatus() {
    try {
        console.log("🔄 Memulai refreshPaymentStatus...");
        
        // Reset payment status
        paymentStatus = {
            hasActivePayment: false,
            showPaymentReminder: false,
            currentPayment: null,
            expiryReminder: null,
            isPending: false,
            paymentMethod: null,
            isMemberInactive: false
        };

        if (!currentUserData) {
            currentUserData = JSON.parse(localStorage.getItem("user") || "{}");
            console.log("📋 Current user data:", currentUserData);
        }

        if (!currentUserData || !currentUserData.id) {
            console.error("❌ User data tidak valid:", currentUserData);
            return paymentStatus;
        }

        // 1️⃣ Ambil data anggota
        try {
            console.log("🌐 Fetching anggota data...");
            const anggotaData = await fetchData(`${API.anggota}?user=${currentUserData.id}`);
            
            console.log("📊 Anggota data received:", anggotaData);

            if (anggotaData && anggotaData.length > 0) {
                const anggota = anggotaData[0];
                currentUserData.idAnggota = anggota.idAnggota;
                console.log("👤 Anggota ditemukan:", anggota);
                
                // Simpan data anggota untuk digunakan di halaman lain
                localStorage.setItem('currentAnggota', JSON.stringify(anggota));
                
                // 2️⃣ Cek status anggota
                if (anggota.status === 'non-aktif') {
                    console.log("⚠️ Anggota status non-aktif");
                    paymentStatus.hasActivePayment = false;
                    paymentStatus.showPaymentReminder = true;
                    paymentStatus.isMemberInactive = true;
                    
                    // Check if there's any recent payment
                    await checkRecentPayment(anggota.idAnggota);
                    return paymentStatus;
                }
                
                // 3️⃣ Cek tanggal expiry
                const today = new Date();
                const endDate = new Date(anggota.tanggalEnd);
                const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                
                console.log(`📅 Expiry check: ${daysRemaining} hari tersisa`);
                
                // Set expiry reminder jika perlu
                if (daysRemaining <= 7) {
                    paymentStatus.expiryReminder = {
                        daysRemaining: daysRemaining,
                        tanggalEnd: anggota.tanggalEnd,
                        showWarning: true
                    };
                    
                    if (daysRemaining <= 3) {
                        paymentStatus.expiryReminder.isUrgent = true;
                    }
                    
                    if (daysRemaining <= 0) {
                        paymentStatus.expiryReminder.isExpired = true;
                        paymentStatus.hasActivePayment = false;
                    }
                }

                // 4️⃣ Cek pembayaran terakhir
                await checkLatestPayment(anggota.idAnggota);

            } else {
                console.warn("⚠️ Tidak ada data anggota untuk user ini");
                paymentStatus.hasActivePayment = false;
                paymentStatus.showPaymentReminder = true;
            }

        } catch (error) {
            console.error("❌ Error mengambil data anggota:", error);
            paymentStatus.hasActivePayment = false;
            paymentStatus.showPaymentReminder = true;
        }

        console.log("🏁 Payment status akhir:", paymentStatus);
        return paymentStatus;

    } catch (error) {
        console.error("💥 refreshPaymentStatus error:", error);
        paymentStatus.hasActivePayment = false;
        paymentStatus.showPaymentReminder = true;
        showToast("error", "Gagal memuat status pembayaran. Coba refresh halaman.");
        return paymentStatus;
    }
}

async function checkLatestPayment(anggotaId) {
  try {
    console.log("💰 Checking latest payment for anggota:", anggotaId);

    // Reset state
    paymentStatus.currentPayment = null;
    paymentStatus.hasActivePayment = false;
    paymentStatus.showPaymentReminder = true;
    paymentStatus.isPending = false;
    paymentStatus.paymentMethod = null;
    paymentStatus.canAccessSchedule = false;

    const response = await fetchData(
      `${API.pembayaran}?idAnggota=${anggotaId}`
    );

    const payments = Array.isArray(response)
      ? response
      : response?.results || [];

    if (!payments.length) {
      console.log("📭 Tidak ada pembayaran");
      return;
    }

    /* 
      PRIORITAS:
      1. pending
      2. lunas
      3. gagal
    */
    const STATUS_PRIORITY = {
      pending: 0,
      lunas: 1,
      gagal: 2,
    };

    const sortedPayments = payments
      .filter(p => p.statusBayar) // pastikan valid
      .sort((a, b) => {
        const pa = STATUS_PRIORITY[a.statusBayar] ?? 99;
        const pb = STATUS_PRIORITY[b.statusBayar] ?? 99;

        // 1️⃣ status lebih penting dari tanggal
        if (pa !== pb) return pa - pb;

        // 2️⃣ jika status sama → pakai tanggal
        return new Date(b.tanggalBayar) - new Date(a.tanggalBayar);
      });

    const latestPayment = sortedPayments[0];
    paymentStatus.currentPayment = latestPayment;

    const status = latestPayment.statusBayar.toLowerCase();
    const metode = (latestPayment.metodeBayar || "").toLowerCase();

    paymentStatus.paymentMethod = metode;

    console.log("💳 Latest payment FIXED:", latestPayment);

    // ✅ LUNAS → buka jadwal
    if (status === 'lunas') {
      paymentStatus.hasActivePayment = true;
      paymentStatus.showPaymentReminder = false;
      paymentStatus.isPending = false;
      paymentStatus.canAccessSchedule = true;
      console.log("✅ LUNAS → jadwal dibuka");
      return;
    }

    // ⏳ PENDING
    if (status === 'pending') {
      paymentStatus.isPending = true;

      // 🟢 PENDING + TUNAI → BOLEH AKSES JADWAL
      if (metode === 'cash' || metode === 'tunai') {
        paymentStatus.canAccessSchedule = true;
        paymentStatus.hasActivePayment = true; // Tetap dianggap aktif untuk akses
        paymentStatus.showPaymentReminder = true; // Tapi tetap tampilkan reminder
        console.log("🟢 PENDING + TUNAI → jadwal dibuka (dengan reminder)");
      } else {
        // 🔒 PENDING NON TUNAI → JADWAL TETAP DIKUNCI
        paymentStatus.canAccessSchedule = false;
        paymentStatus.hasActivePayment = false;
        paymentStatus.showPaymentReminder = true;
        console.log("🔒 PENDING non-tunai → jadwal dikunci");
      }
      return;
    }

    // ❌ GAGAL / STATUS LAIN
    paymentStatus.canAccessSchedule = false;
    paymentStatus.showPaymentReminder = true;
    console.log("❌ GAGAL / UNKNOWN → jadwal dikunci");

  } catch (error) {
    console.error("❌ Error checking latest payment:", error);
    paymentStatus.canAccessSchedule = false;
    paymentStatus.showPaymentReminder = true;
  }
}

async function checkRecentPayment(anggotaId) {
    try {
        console.log("🔍 Checking recent payments for non-active member:", anggotaId);
        
        // Cek apakah ada pembayaran pending untuk anggota non-aktif
        const pembayaranData = await fetchData(`${API.pembayaran}?anggota=${anggotaId}`);
        
        if (pembayaranData && pembayaranData.length > 0) {
            // Cari pembayaran terbaru dengan status pending
            const pendingPayment = pembayaranData.find(p => {
                const status = p.statusBayar?.toLowerCase() || p.status?.toLowerCase();
                return ['pending', 'waiting', 'process'].includes(status);
            });
            console.log("📊 Pending payment found:", pendingPayment);
            
            if (pendingPayment) {
                paymentStatus.pendingPayment = pendingPayment;
                paymentStatus.paymentMethod = pendingPayment.metodeBayar;
                paymentStatus.isPending = true;
                console.log("🔄 Ada pembayaran pending untuk anggota non-aktif:", pendingPayment);
            }
        }
    } catch (error) {
        console.error("Error checking recent payment:", error);
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

// Fungsi untuk menangani klik menu dengan error handling
function createMenuHandler(handler, requiresPayment = false, pageName = '') {
    return async function(event) {
        console.log(`📱 Menu ${pageName} diklik, requiresPayment: ${requiresPayment}`);
        
        if (requiresPayment) {
            // Refresh payment status sebelum memeriksa
            try {
                await refreshPaymentStatus();
                console.log(`✅ Payment status refreshed: ${paymentStatus.hasActivePayment}`);
                
                // Debug info
                console.log(`📊 Payment details:`, {
                    hasActivePayment: paymentStatus.hasActivePayment,
                    isPending: paymentStatus.isPending,
                    currentPayment: paymentStatus.currentPayment
                });
                
            } catch (error) {
                console.error(`❌ Error refreshing payment status:`, error);
                showToast("warning", "Gagal memeriksa status pembayaran");
            }
            
            if (!paymentStatus.canAccessSchedule) {
                console.log("🚫 Jadwal dikunci oleh status pembayaran");
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
                    <p>Memuat ${pageName}...</p>
                </div>
            `;
            
            try {
                console.log(`🔄 Memuat halaman ${pageName}...`);
                await handler();
                console.log(`✅ Halaman ${pageName} berhasil dimuat`);
            } catch (error) {
                console.error(`❌ Error loading page ${pageName}:`, error);
                mainContent.innerHTML = `
                    <div class="alert alert-danger">
                        <h4 class="alert-heading"><i class="bi bi-exclamation-triangle me-2"></i>Terjadi Kesalahan</h4>
                        <p>${error.message || 'Gagal memuat halaman'}</p>
                        <div class="mt-3">
                            <button onclick="location.reload()" class="btn btn-primary">
                                <i class="bi bi-arrow-clockwise me-1"></i> Muat Ulang
                            </button>
                            <button onclick="window.history.back()" class="btn btn-secondary ms-2">
                                <i class="bi bi-arrow-left me-1"></i> Kembali
                            </button>
                        </div>
                    </div>
                `;
            } finally {
                mainContent.style.opacity = "1";
            }
        }
    };
}

// Fungsi untuk update status Web Push
async function updateWebPushStatus(webPushManager, status = null) {
    const statusElement = document.getElementById('webpush-status');
    if (!statusElement) return;
    
    if (status === 'not-supported') {
        statusElement.innerHTML = `
            <span class="badge bg-warning">
                <i class="bi bi-exclamation-triangle"></i> Browser tidak mendukung
            </span>
        `;
    } else if (status === 'error') {
        statusElement.innerHTML = `
            <span class="badge bg-danger">
                <i class="bi bi-x-circle"></i> Gagal inisialisasi
            </span>
        `;
    } else if (webPushManager) {
        try {
            const isSubscribed = await webPushManager.checkSubscription();
            console.log("🔄 Updating web push status, subscribed:", isSubscribed);
            
            if (isSubscribed) {
                statusElement.innerHTML = `
                    <span class="badge bg-success">
                        <i class="bi bi-check-circle"></i> Notifikasi aktif
                    </span>
                `;
            } else {
                statusElement.innerHTML = `
                    <span class="badge bg-secondary">
                        <i class="bi bi-bell-slash"></i> Notifikasi nonaktif
                    </span>
                `;
            }
        } catch (error) {
            console.error('❌ Error checking subscription:', error);
            statusElement.innerHTML = `
                <span class="badge bg-warning">
                    <i class="bi bi-exclamation-circle"></i> Gagal memeriksa
                </span>
            `;
        }
    }
}

// Fungsi untuk inisialisasi Web Push di dashboard
async function initializeDashboardWebPush() {
    try {
        console.log("🔔 Initializing Web Push...");
        if (webPushManager.isSupported) {
            await webPushManager.initialize();
            webPushManager.setupPushEventListener();
            await updateWebPushStatus(webPushManager);
            console.log("✅ Web Push initialized");
        } else {
            updateWebPushStatus(null, 'not-supported');
            console.log("⚠️ Web Push not supported");
        }
    } catch (error) {
        console.error('❌ Error initializing Web Push:', error);
        updateWebPushStatus(null, 'error');
    }
}

// Fungsi untuk mengecek status notifikasi
async function checkNotificationStatus() {
    try {
        console.log("🔔 Checking notification status...");
        
        // Periksa dukungan browser
        if (!("Notification" in window)) {
            console.warn("⚠️ Browser tidak mendukung Notification API");
            return false;
        }
        
        // Periksa permission
        const permission = Notification.permission;
        console.log("📊 Notification permission:", permission);
        
        // Periksa subscription
        const hasSubscription = await webPushManager.checkSubscription();
        console.log("📊 Has subscription:", hasSubscription);
        
        // Tampilkan/sembunyikan alert berdasarkan status
        const alertElement = document.getElementById('notification-alert');
        if (alertElement) {
            if (permission === "denied") {
                // Izin ditolak, tampilkan alert
                alertElement.classList.remove('d-none');
                alertElement.innerHTML = `
                    <div class="d-flex align-items-center">
                        <i class="bi bi-bell-slash-fill fs-4 me-3"></i>
                        <div>
                            <h5 class="alert-heading mb-2">Notifikasi Diblokir</h5>
                            <p class="mb-2">Izin notifikasi telah diblokir. Silakan aktifkan di pengaturan browser Anda.</p>
                            <div class="d-flex flex-wrap gap-2">
                                <button onclick="window.location.reload()" class="btn btn-primary btn-sm">
                                    <i class="bi bi-arrow-clockwise me-1"></i> Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            } else if (permission !== "granted" || !hasSubscription) {
                // Belum ada izin atau belum subscribe, tampilkan alert
                alertElement.classList.remove('d-none');
            } else {
                // Sudah aktif, sembunyikan alert
                alertElement.classList.add('d-none');
            }
        }
        
        return hasSubscription && permission === "granted";
    } catch (error) {
        console.error('❌ Error checking notification status:', error);
        return false;
    }
}

async function toggleNotifications() {
    const toggleBtn = document.querySelectorAll('#toggleNotificationsBtn');
    if (!toggleBtn.length) return;
    
    // Disable semua tombol toggle
    toggleBtn.forEach(btn => {
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Memproses...';
        
        // Simpan original text untuk restore nanti
        btn.dataset.originalText = originalText;
    });
    
    try {
        console.log("🔔 Checking subscription status...");
        const isSubscribed = await webPushManager.checkSubscription();
        console.log("📊 Current subscription status:", isSubscribed);
        
        let result;
        if (isSubscribed) {
            console.log("❌ Unsubscribing from notifications...");
            result = await webPushManager.disableNotifications();
            console.log("✅ Unsubscribe result:", result);
        } else {
            console.log("✅ Subscribing to notifications...");
            result = await webPushManager.enableNotifications();
            console.log("✅ Subscribe result:", result);
        }
        
        // Update UI berdasarkan hasil
        await updateWebPushStatus(webPushManager);
        await updateDropdownStatus();
        
        // Tampilkan feedback
        if (result && result.success) {
            showToast('success', result.message || 'Pengaturan notifikasi berhasil diubah');
        } else {
            showToast('warning', result?.message || 'Terjadi kesalahan saat mengubah pengaturan notifikasi');
        }
        
    } catch (error) {
        console.error('❌ Error toggling notifications:', error);
        showToast('error', 'Gagal mengubah pengaturan notifikasi: ' + error.message);
    } finally {
        // Enable semua tombol toggle
        toggleBtn.forEach(btn => {
            btn.disabled = false;
            btn.innerHTML = btn.dataset.originalText || 'Aktif/Nonaktif';
            delete btn.dataset.originalText;
        });
    }
}

async function requestNotificationPermission() {
    try {
        console.log("🔔 Requesting notification permission...");
        
        if (!("Notification" in window)) {
            return { granted: false, error: "Browser tidak mendukung notifikasi" };
        }
        
        if (Notification.permission === "granted") {
            return { granted: true };
        }
        
        if (Notification.permission === "denied") {
            return { granted: false, error: "Izin notifikasi telah diblokir" };
        }
        
        // Minta izin
        const permission = await Notification.requestPermission();
        console.log("📊 Permission result:", permission);
        
        return { granted: permission === "granted" };
    } catch (error) {
        console.error("❌ Error requesting permission:", error);
        return { granted: false, error: error.message };
    }
}

// Fungsi untuk setup event listeners
function setupEventListeners() {
    const buttons = {
        btnProfil: { handler: profilPage, requiresPayment: false, name: "Profil" },
        btnLaporan: { handler: laporanPage, requiresPayment: false, name: "Laporan Sampah" },
        btnPembayaran: { handler: pembayaranPage, requiresPayment: false, name: "Pembayaran" },
        btnJadwal: { handler: detailAnggotaJadwalPage, requiresPayment: true, name: "Jadwal Angkut" }
    };

    Object.entries(buttons).forEach(([btnId, config]) => {
        const button = document.getElementById(btnId);
        if (button) {
            button.onclick = createMenuHandler(config.handler, config.requiresPayment, config.name);
            console.log(`✅ Event listener untuk ${btnId} ditambahkan`);
        } else {
            console.warn(`⚠️ Button ${btnId} tidak ditemukan`);
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
        console.log("✅ Event listener untuk btnBayarSekarang ditambahkan");
    }
    
    // Tombol logout
    const btnLogout = document.getElementById("btnLogout");
    if (btnLogout) {
        btnLogout.onclick = () => {
            if (typeof window.logout === 'function') {
                window.logout();
            } else {
                localStorage.clear();
                window.location.hash = "#/login";
                window.location.reload();
            }
        };
        console.log("✅ Event listener untuk btnLogout ditambahkan");
    }
    
    // Tombol untuk notifikasi - cari semua karena ada 2 (alert dan dropdown)
    const toggleNotificationsBtns = document.querySelectorAll('#toggleNotificationsBtn');
    if (toggleNotificationsBtns.length > 0) {
        toggleNotificationsBtns.forEach(btn => {
            btn.onclick = toggleNotifications;
        });
        console.log(`✅ Event listener untuk ${toggleNotificationsBtns.length} toggleNotificationsBtn ditambahkan`);
    } else {
        console.warn("⚠️ toggleNotificationsBtn tidak ditemukan");
    }
}

// Fungsi untuk mengecek status pembayaran (global)
window.checkPaymentStatus = async function(forceRefresh = false) {
    console.log("🔄 checkPaymentStatus dipanggil, forceRefresh:", forceRefresh);
    
    const btn = event?.target || document.querySelector('[onclick*="checkPaymentStatus"]');
    const originalHTML = btn?.innerHTML;
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Checking...';
    }
    
    try {
        await refreshPaymentStatus();
        
        if (forceRefresh) {
            if (paymentStatus.hasActivePayment) {
                showToast('success', '✅ Status pembayaran telah aktif! Memuat ulang dashboard...');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else if (paymentStatus.isPending) {
                showToast('info', '⏳ Status pembayaran masih menunggu konfirmasi...');
            } else {
                showToast('info', 'Status pembayaran masih belum lunas. Silakan selesaikan pembayaran.');
            }
        }
        
    } catch (error) {
        console.error("Error checking payment status:", error);
        showToast('error', 'Gagal memeriksa status pembayaran');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    }
};

export async function dashboardAnggota() {
    console.log("🚀 Starting dashboardAnggota...");
    
    try {
        const user = await authGuard();
        if (!user) {
            showToast("warning", "Silakan login terlebih dahulu!");
            window.location.hash = "#/login";
            return;
        }

        console.log("👤 User authenticated:", user);

        // Validasi role
        if (user.role !== "anggota") {
            console.warn(`⚠️ User role is ${user.role}, redirecting`);
            
            switch(user.role) {
                case "admin":
                    window.location.hash = "#/dashboard";
                    return;
                case "tamu":
                case "tim_angkut":
                    window.location.hash = "#/dashboard";
                    return;
                default:
                    showToast("error", "Anda tidak memiliki akses ke dashboard anggota!");
                    window.location.hash = "#/login";
                    return;
            }
        }

        currentUserData = user;
        
        // Refresh payment status dengan timeout
        console.log("🔄 Refreshing payment status...");
        const paymentStatusPromise = refreshPaymentStatus();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout refreshing payment status")), 10000)
        );
        
        await Promise.race([paymentStatusPromise, timeoutPromise]);
        
        const { hasActivePayment, showPaymentReminder, currentPayment, isPending } = paymentStatus;
        console.log("📊 Payment status loaded:", paymentStatus);

        // Render dashboard
        renderDashboard(user, hasActivePayment, showPaymentReminder, currentPayment, isPending);

        // Setup event listeners
        setupEventListeners();

        // Setup notification alert
        setTimeout(() => {
            setupNotificationAlert();
        }, 100);
        
        // Setup btnGoToPayment
        setTimeout(() => {
            const btnGoToPayment = document.getElementById('btnGoToPayment');
            if (btnGoToPayment) {
                btnGoToPayment.onclick = () => {
                    const pembayaranBtn = document.getElementById('btnPembayaran');
                    if (pembayaranBtn) {
                        pembayaranBtn.click();
                    }
                };
                console.log("✅ Event listener untuk btnGoToPayment ditambahkan");
            }
        }, 100);

        // Inisialisasi Web Push
        await initializeDashboardWebPush();
        
        // Cek status notifikasi
        await checkNotificationStatus();
        
        // Update status notifikasi di dropdown
        await updateDropdownStatus();

        // Load laporan page by default
        console.log("📄 Loading default page (laporan)...");
        try {
            await laporanPage();
            const btnLaporan = document.getElementById("btnLaporan");
            if (btnLaporan) {
                btnLaporan.classList.add('active');
            }
            console.log("✅ Laporan page loaded successfully");
        } catch (laporanError) {
            console.error("❌ Error loading laporan page:", laporanError);
            // Fallback ke profil page
            try {
                console.log("🔄 Falling back to profil page...");
                await profilPage();
                const btnProfil = document.getElementById("btnProfil");
                if (btnProfil) {
                    btnProfil.classList.add('active');
                }
                console.log("✅ Profil page loaded successfully");
            } catch (profileError) {
                console.error("❌ Error loading profile page:", profileError);
                showToast("error", "Gagal memuat halaman. Silakan refresh.");
            }
        }
        
        console.log("🎉 Dashboard initialization complete!");

    } catch (error) {
        console.error("💥 Critical error in dashboardAnggota:", error);
        const app = document.getElementById("app");
        app.innerHTML = `
            <div class="container mt-5">
                <div class="alert alert-danger">
                    <h4 class="alert-heading"><i class="bi bi-exclamation-triangle me-2"></i>Terjadi Kesalahan</h4>
                    <p>Gagal memuat dashboard: ${error.message}</p>
                    <div class="mt-3">
                        <button onclick="location.reload()" class="btn btn-primary">
                            <i class="bi bi-arrow-clockwise me-1"></i> Muat Ulang
                        </button>
                        <button onclick="window.location.hash='#/login'" class="btn btn-secondary ms-2">
                            <i class="bi bi-box-arrow-right me-1"></i> Login Ulang
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Fungsi untuk render dashboard
// Fungsi untuk render dashboard
function renderDashboard(user, hasActivePayment, showPaymentReminder, currentPayment, isPending = false) {
    const app = document.getElementById("app");
    
    // Ambil data anggota dari localStorage atau state
    const currentAnggota = JSON.parse(localStorage.getItem('currentAnggota') || '{}');
    
    // Generate reminder berdasarkan status paymentStatus global
    let paymentReminderHTML = '';
    let expiryReminderHTML = '';
    
    // 1. Pembayaran Reminder (berdasarkan status yang sudah ada)
    if (showPaymentReminder) {
        let reminderTitle = '';
        let reminderMessage = '';
        let reminderType = 'warning';
        let reminderIcon = 'bi-exclamation-triangle-fill';
        let showActionButton = true;
        let showScheduleInfo = false;
        let showDismissButton = true; // Default tampilkan tombol "Nanti Saja"
        
        if (isPending) {
            if (paymentStatus.paymentMethod === 'cash' || paymentStatus.paymentMethod === 'tunai') {
                // KASUS KHUSUS: PENDING TUNAI → JADWAL BISA DIAKSES
                reminderTitle = '⏳ Menunggu Konfirmasi (Tunai)';
                reminderMessage = 'Pembayaran tunai Anda sedang menunggu konfirmasi petugas. Anda tetap bisa mengakses jadwal pengangkutan.';
                reminderType = 'info';
                reminderIcon = 'bi-cash-stack';
                showScheduleInfo = true; // Tambahkan info jadwal
                showActionButton = false; // Tidak perlu tombol bayar lagi
                showDismissButton = false; // HILANGKAN TOMBOL "NANTI SAJA" untuk cash
            } else {
                // PENDING NON-TUNAI
                reminderTitle = '⏳ Menunggu Konfirmasi';
                reminderMessage = 'Pembayaran Anda sedang menunggu konfirmasi. Silakan refresh halaman dan menuju ke halaman Jadwal untuk penjadwalan pengangkutan.';
                reminderType = 'info';
                reminderIcon = 'bi-clock-fill';
                showActionButton = false; // Pending non-tunai juga tidak perlu tombol bayar
            }
        } else if (paymentStatus?.isMemberInactive) {
            reminderTitle = 'Status Anggota Non-Aktif';
            reminderMessage = 'Status keanggotaan Anda saat ini non-aktif. Silakan melakukan pembayaran untuk mengaktifkan kembali layanan.';
            reminderType = 'danger';
            reminderIcon = 'bi-x-circle-fill';
        } else {
            reminderTitle = 'Pembayaran Bulanan Belum Lunas';
            reminderMessage = 'Untuk dapat menggunakan layanan pengangkutan sampah, silakan selesaikan pembayaran bulanan terlebih dahulu.';
        }
        
        // Bangun tombol-tombol yang akan ditampilkan
        let buttonsHTML = '';
        
        if (showActionButton) {
            buttonsHTML += `
                <button id="btnBayarSekarang" class="btn btn-success btn-sm">
                    <i class="bi bi-credit-card me-1"></i> Bayar Sekarang
                </button>
            `;
        }
        
        if (isPending && paymentStatus.paymentMethod !== 'cash' && paymentStatus.paymentMethod !== 'tunai') {
            buttonsHTML += `
                <button onclick="checkPaymentStatus(true)" class="btn btn-primary btn-sm">
                    <i class="bi bi-arrow-clockwise me-1"></i> Refresh Status
                </button>
            `;
        }
        
        if (isPending) {
            buttonsHTML += `
                <button onclick="showPaymentDetails()" class="btn btn-outline-info btn-sm">
                    <i class="bi bi-receipt me-1"></i> Lihat Detail Pembayaran
                </button>
            `;
        }
        
        // Hanya tambahkan tombol "Nanti Saja" jika showDismissButton true
        if (showDismissButton) {
            buttonsHTML += `
                <button class="btn btn-outline-secondary btn-sm" data-bs-dismiss="alert">
                    Nanti Saja
                </button>
            `;
        }
        
        paymentReminderHTML = `
            <div class="alert alert-${reminderType} alert-dismissible fade show mb-4 shadow-sm" role="alert">
                <div class="d-flex align-items-center">
                    <i class="bi ${reminderIcon} fs-4 me-3"></i>
                    <div class="flex-grow-1">
                        <h5 class="alert-heading mb-2">${reminderTitle}</h5>
                        <p class="mb-2">${reminderMessage}</p>
                        ${showScheduleInfo ? `
                        <div class="alert alert-warning py-2 px-3 mb-2 d-inline-block">
                            <i class="bi bi-info-circle me-1"></i>
                            <strong>Info Jadwal:</strong> Jadwal pengangkutan tetap dapat diakses di menu <strong>Jadwal Angkut</strong>
                        </div>
                        ` : ''}
                        ${buttonsHTML ? `
                        <div class="d-flex flex-wrap gap-2 mt-3">
                            ${buttonsHTML}
                        </div>
                        ` : ''}
                    </div>
                    ${showDismissButton ? `
                    <button type="button" class="btn-close ms-2" data-bs-dismiss="alert" aria-label="Close"></button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    // 2. Expiry Reminder (teks berjalan/marquee)
    if (currentAnggota?.tanggalEnd) {
        const today = new Date();
        const endDate = new Date(currentAnggota.tanggalEnd);
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining <= 7) {
            let expiryMessage = '';
            let expiryType = 'warning';
            
            if (daysRemaining <= 0) {
                expiryMessage = `⚠️ MASA BERLAKU TELAH HABIS! Keanggotaan Anda telah kadaluarsa sejak ${formatDate(currentAnggota.tanggalEnd)}. Segera perpanjang untuk melanjutkan layanan.`;
                expiryType = 'danger';
            } else if (daysRemaining <= 3) {
                expiryMessage = `⏳ MASA BERLAKU AKAN HABIS! Keanggotaan Anda tinggal ${daysRemaining} hari lagi (hingga ${formatDate(currentAnggota.tanggalEnd)}). Segera perpanjang!`;
                expiryType = 'warning';
            } else {
                expiryMessage = `📅 Masa berlaku keanggotaan Anda tinggal ${daysRemaining} hari lagi (hingga ${formatDate(currentAnggota.tanggalEnd)}).`;
                expiryType = 'info';
            }
            
            expiryReminderHTML = `
                <div class="marquee-container mb-3">
                    <div class="alert alert-${expiryType} mb-0 py-2">
                        <div class="marquee-content">
                            <i class="bi bi-clock-history me-2"></i>
                            ${expiryMessage}
                            <a href="#" id="btnGoToPaymentFromMarquee" class="ms-3 fw-bold text-decoration-underline" style="color: inherit;">
                                <i class="bi bi-credit-card me-1"></i>Perpanjang Sekarang
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    // 3. Has Active Payment Alert
    const activePaymentAlert = paymentStatus.canAccessSchedule ? `
        <div class="alert alert-success alert-dismissible fade show mb-4 shadow-sm" role="alert">
            <div class="d-flex align-items-center">
                <i class="bi bi-check-circle-fill fs-4 me-3"></i>
                <div>
                    <h5 class="alert-heading mb-2">${isPending ? '⏳ Pembayaran Sedang Diproses' : '✅ Pembayaran Lunas!'}</h5>
                    <p class="mb-0">${isPending ? 'Status anggota Anda sedang diproses. Anda dapat mengakses jadwal pengangkutan.' : 'Status anggota Anda aktif. Semua fitur kini terbuka.'}</p>
                    ${currentPayment ? `
                    <small class="text-muted">
                        ${isPending ? 'Menunggu konfirmasi' : 'Terakhir bayar'}: ${formatDate(currentPayment.tanggalBayar || currentPayment.tanggal_bayar || currentPayment.created_at)} | 
                        Metode: ${currentPayment.metodeBayar || 'N/A'}
                        ${isPending ? ' | Status: <span class="badge bg-warning">Pending</span>' : ''}
                    </small>
                    ` : ''}
                </div>
                <button type="button" class="btn-close ms-2" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        </div>
    ` : '';
    
    // 4. Tentukan apakah tombol Jadwal harus disabled
    const isJadwalDisabled = !paymentStatus.canAccessSchedule;
    const jadwalTooltip = isJadwalDisabled ? 'Fitur terkunci karena pembayaran belum lunas' : 'Akses jadwal pengangkutan';
    
    // 5. Quick Stats
    const quickStatsHTML = `
        <div class="row g-4 mb-4">
            <div class="col-md-6 col-lg-3">
                <div class="card h-100 border-0 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <div class="${paymentStatus.canAccessSchedule ? 'bg-success' : paymentStatus.isPending ? 'bg-info' : 'bg-warning'} bg-opacity-10 p-3 rounded me-3">
                                <i class="bi ${paymentStatus.canAccessSchedule ? 'bi-check-circle text-success' : paymentStatus.isPending ? 'bi-clock text-info' : 'bi-exclamation-triangle text-warning'} fs-4"></i>
                            </div>
                            <div>
                                <h5 class="card-title mb-1">Status Layanan</h5>
                                <p class="card-text text-muted mb-0">Pengangkutan Sampah</p>
                            </div>
                        </div>
                        ${paymentStatus.canAccessSchedule ? 
                            paymentStatus.isPending ? 
                                '<span class="badge bg-info">⏳ Pending (Tunai)</span>' :
                                '<span class="badge bg-success">✓ Aktif</span>' : 
                            paymentStatus.isPending ?
                                '<span class="badge bg-warning">⏳ Menunggu</span>' :
                                '<span class="badge bg-danger">❌ Belum Bayar</span>'
                        }
                        ${paymentStatus.isPending && (paymentStatus.paymentMethod === 'cash' || paymentStatus.paymentMethod === 'tunai') ? 
                            '<div class="mt-2 small text-info"><i class="bi bi-check-circle"></i> Jadwal dapat diakses</div>' : 
                            paymentStatus.isPending ?
                            '<div class="mt-2 small text-warning"><i class="bi bi-exclamation-circle"></i> Tunggu konfirmasi</div>' :
                            ''
                        }
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 col-lg-3">
                <div class="card h-100 border-0 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <div class="${paymentStatus.canAccessSchedule ? 'bg-info' : 'bg-secondary'} bg-opacity-10 p-3 rounded me-3">
                                <i class="bi ${paymentStatus.canAccessSchedule ? 'bi-truck text-info' : 'bi-truck text-secondary'} fs-4"></i>
                            </div>
                            <div>
                                <h5 class="card-title mb-1">Pengangkutan</h5>
                                <p class="card-text text-muted mb-0">${paymentStatus.canAccessSchedule ? 'Aktif' : 'Tidak Aktif'}</p>
                            </div>
                        </div>
                        <span class="badge ${paymentStatus.canAccessSchedule ? 'bg-info' : 'bg-secondary'}">
                            ${paymentStatus.canAccessSchedule ? 
                                paymentStatus.isPending ? '📦 Menunggu jadwal' : '📦 Siap diangkut' 
                                : '🔒 Tunggu pembayaran'}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 col-lg-3">
                <div class="card h-100 border-0 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <div class="bg-primary bg-opacity-10 p-3 rounded me-3">
                                <i class="bi bi-currency-dollar text-primary fs-4"></i>
                            </div>
                            <div>
                                <h5 class="card-title mb-1">Biaya Bulanan</h5>
                                <p class="card-text text-muted mb-0">Rp 50.000</p>
                            </div>
                        </div>
                        ${paymentStatus.canAccessSchedule ? 
                            paymentStatus.isPending ?
                                `<span class="badge bg-info">⏳ ${paymentStatus.paymentMethod === 'cash' ? 'Tunai - Pending' : 'Pending'}</span>` :
                                `<span class="badge bg-success">✓ Lunas</span>` :
                            paymentStatus.isPending ?
                                `<span class="badge bg-warning">⏳ Pending</span>` :
                                '<span class="badge bg-danger">❌ Belum Bayar</span>'
                        }
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
                        <span class="badge ${paymentStatus.canAccessSchedule ? 'bg-warning text-dark' : 'bg-light text-dark'}">
                            ${paymentStatus.canAccessSchedule ? 
                                paymentStatus.isPending ? '⏳ Siap berkontribusi' : '🌱 Aktif berkontribusi' 
                                : '💡 Menunggu aktivasi'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 6. Main Dashboard HTML
    app.innerHTML = `
        <!-- Bootstrap 5 CSS -->
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">
        
        <div class="container-fluid p-0">
            <!-- Header -->
            <div class="bg-success bg-gradient text-white p-4 mb-4">
                <div class="container">
                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                        <div class="mb-3 mb-md-0">
                            <div class="d-flex align-items-center mb-3">
                                <img src="/logo/logo_3d.png" 
                                     alt="CleanUp Kupang Logo" 
                                     style="height: 60px; width: auto; margin-right: 15px;">
                                <div>
                                    <h1 class="h2 mb-2"><i class="bi bi-person-circle me-2"></i>Selamat Datang, ${user.username}!</h1>
                                    <p class="mb-0 opacity-75">Anda login sebagai <strong>Anggota CleanUp</strong></p>
                                </div>
                            </div>
                            <div class="mt-2">
                                <button onclick="checkPaymentStatus(true)" class="btn btn-sm btn-light me-2">
                                    <i class="bi bi-arrow-clockwise me-1"></i>Refresh Status
                                </button>
                                <span class="ms-2 small">
                                    Status: ${paymentStatus.canAccessSchedule ? 
                                        paymentStatus.isPending ? 
                                            '<span class="badge bg-info">⏳ Pending (Tunai)</span>' :
                                            '<span class="badge bg-success">✓ Aktif</span>' : 
                                        paymentStatus.isPending ?
                                            '<span class="badge bg-warning">⏳ Menunggu</span>' :
                                            '<span class="badge bg-danger">❌ Belum Bayar</span>'
                                    }
                                </span>
                            </div>
                        </div>
                        <div class="d-flex flex-wrap gap-3">
                            <div class="bg-white bg-opacity-25 p-3 rounded">
                                <small class="d-block text-white text-opacity-75">Status</small>
                                <div class="fw-bold">
                                    ${paymentStatus.canAccessSchedule ? 
                                        paymentStatus.isPending ? 
                                            '<span class="badge bg-info">Pending Tunai</span>' :
                                            '<span class="badge bg-success">Aktif</span>' : 
                                        '<span class="badge bg-warning text-dark">Perlu Bayar</span>'
                                    }
                                </div>
                            </div>
                            <div class="bg-white bg-opacity-25 p-3 rounded">
                                <small class="d-block text-white text-opacity-75">ID Anggota</small>
                                <div class="fw-bold">#${currentUserData.idAnggota ? currentUserData.idAnggota.toString().padStart(4, '0') : '---'}</div>
                            </div>
                            <div class="bg-white bg-opacity-25 p-3 rounded">
                                <small class="d-block text-white text-opacity-75">Notifikasi</small>
                                <div class="fw-bold">
                                    <span id="webpush-status">
                                        <span class="badge bg-secondary">
                                            <i class="bi bi-clock"></i> Memuat...
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="container">
                <!-- Expiry Reminder -->
                ${expiryReminderHTML}
                
                <!-- Pembayaran Reminder Banner -->
                ${paymentReminderHTML}
                
                <!-- Notifikasi Alert -->
                <div id="notification-alert" class="alert alert-info alert-dismissible fade show mb-4 d-none shadow-sm" role="alert">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-bell-fill fs-4 me-3"></i>
                        <div>
                            <h5 class="alert-heading mb-2">Aktifkan Notifikasi Web</h5>
                            <p class="mb-2">Dapatkan notifikasi real-time tentang pembayaran, jadwal pengangkutan, dan update penting lainnya.</p>
                            <div class="d-flex flex-wrap gap-2">
                                <button id="toggleNotificationsBtn" class="btn btn-primary btn-sm">
                                    <i class="bi bi-bell me-1"></i> Aktifkan Notifikasi
                                </button>
                                <button class="btn btn-outline-secondary btn-sm" data-bs-dismiss="alert">
                                    Nanti Saja
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${activePaymentAlert}
                
                <!-- Main Card -->
                <div class="card shadow-sm mb-4">
                    <!-- Navbar -->
                    <nav class="navbar navbar-expand-lg navbar-light bg-light border-bottom">
                        <div class="container-fluid">
                            <a class="navbar-brand d-flex align-items-center" href="#">
                                <img src="/logo/logo_3d.png" 
                                     alt="CleanUp Kupang Logo" 
                                     style="height: 40px; width: auto; margin-right: 10px;">
                                <span class="fw-bold">CleanUp Kupang</span>
                            </a>
                            
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
                                        <button id="btnJadwal" class="nav-link btn btn-link ${isJadwalDisabled ? 'disabled-link' : ''}" 
                                                ${isJadwalDisabled ? 'title="' + jadwalTooltip + '"' : ''}>
                                            <i class="bi bi-calendar-event me-1"></i> Jadwal Angkut
                                            ${isJadwalDisabled ? '<span class="badge bg-secondary ms-1">🔒</span>' : ''}
                                        </button>
                                    </li>
                                    <li class="nav-item">
                                        <button id="btnPembayaran" class="nav-link btn btn-link">
                                            <i class="bi bi-credit-card me-1"></i> Pembayaran
                                        </button>
                                    </li>
                                </ul>
                                
                                <div class="d-flex flex-wrap gap-2">
                                    <div class="dropdown">
                                        <button class="btn btn-outline-info btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                            <i class="bi bi-bell me-1"></i> Notifikasi
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-end">
                                            <li><h6 class="dropdown-header">Pengaturan Notifikasi</h6></li>
                                            <li>
                                                <div class="px-3 py-2">
                                                    <small class="text-muted d-block mb-1">Status:</small>
                                                    <div id="webpush-status-dropdown">
                                                        <span class="badge bg-secondary">Memuat...</span>
                                                    </div>
                                                </div>
                                            </li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li>
                                                <button id="toggleNotificationsBtn" class="dropdown-item">
                                                    <i class="bi bi-bell me-2"></i> Aktif/Nonaktif
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                    
                                    <button onclick="checkPaymentStatus(true)" class="btn btn-outline-primary btn-sm">
                                        <i class="bi bi-arrow-clockwise me-1"></i> Refresh
                                    </button>
                                    <button id="btnLogout" class="btn btn-outline-danger btn-sm">
                                        <i class="bi bi-box-arrow-right me-1"></i> Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </nav>

                    <!-- Main Content -->
                    <div id="mainContent" class="p-4 min-vh-50">
                        <div class="text-center py-5">
                            <div class="mb-4">
                                <img src="/logo/logo_3d.png" 
                                     alt="CleanUp Kupang Logo" 
                                     style="height: 120px; width: auto; margin-bottom: 20px;">
                            </div>
                            
                            <div class="display-1 ${paymentStatus.canAccessSchedule ? 'text-success' : paymentStatus.isPending ? 'text-info' : 'text-muted'} mb-4">
                                <i class="bi bi-person-circle"></i>
                            </div>
                            <h3 class="mb-3">Dashboard Anggota CleanUp</h3>
                            <p class="text-muted">Selamat datang di dashboard anggota CleanUp Kupang</p>
                            
                            ${!paymentStatus.canAccessSchedule ? `
                            <div class="alert ${paymentStatus.isPending ? 'alert-info' : 'alert-warning'} mt-4 max-w-600 mx-auto">
                                <i class="bi ${paymentStatus.isPending ? 'bi-info-circle' : 'bi-exclamation-circle'} me-2"></i>
                                <strong>${paymentStatus.isPending ? 'Informasi:' : 'Perhatian:'}</strong> 
                                ${paymentStatus.isPending ? 
                                    'Pembayaran Anda sedang menunggu konfirmasi.' : 
                                    'Anda belum dapat mengakses fitur pengangkutan sampah karena pembayaran bulanan belum dilakukan.'
                                }
                                <div class="mt-2">
                                    <button id="btnGoToPayment" class="btn btn-success btn-sm">
                                        <i class="bi bi-credit-card me-1"></i> Bayar Sekarang
                                    </button>
                                </div>
                            </div>
                            ` : `
                            <div class="alert alert-success mt-4 max-w-600 mx-auto">
                                <i class="bi bi-check-circle me-2"></i>
                                <strong>Selamat!</strong> Status Anda ${paymentStatus.isPending ? 'sedang diproses' : 'aktif'}. ${paymentStatus.isPending ? 'Anda tetap dapat mengakses jadwal pengangkutan.' : 'Semua fitur sekarang tersedia.'}
                            </div>
                            `}
                        </div>
                    </div>
                </div>

                <!-- Quick Stats -->
                ${quickStatsHTML}

                <!-- Footer -->
                <footer class="text-center py-4 mt-4 border-top">
                    <div class="mb-3">
                        <img src="/logo/logo_3d.png" 
                             alt="CleanUp Kupang Logo" 
                             style="height: 60px; width: auto;">
                    </div>
                    
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
            transition: all 0.2s ease;
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
            opacity: 0.6;
            cursor: not-allowed !important;
            pointer-events: none;
            position: relative;
        }
        
        .disabled-link:hover::before {
            content: attr(title);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 1000;
            pointer-events: none;
        }
        
        .card {
            border-radius: 10px;
            transition: transform 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-2px);
        }
        
        .min-vh-50 {
            min-height: 400px;
        }
        
        .max-w-600 {
            max-width: 600px;
        }
        
        /* Marquee animation */
        .marquee-container {
            overflow: hidden;
            white-space: nowrap;
            position: relative;
            margin-bottom: 1rem;
        }
        
        .marquee-content {
            display: inline-block;
            padding-left: 100%;
            animation: marquee 20s linear infinite;
        }
        
        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
        }
        
        .marquee-content:hover {
            animation-play-state: paused;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .navbar-nav {
                gap: 0.5rem;
            }
            
            .nav-link.btn.active::after {
                left: 0.5rem;
                right: 0.5rem;
            }
            
            .d-flex.flex-wrap.gap-2 {
                gap: 0.5rem !important;
            }
            
            .marquee-content {
                font-size: 0.9rem;
                padding-left: 150%;
                animation: marquee 15s linear infinite;
            }
            
            @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-150%); }
            }
        }
        
        @media (max-width: 576px) {
            .marquee-content {
                font-size: 0.8rem;
                padding-left: 200%;
                animation: marquee 12s linear infinite;
            }
            
            @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-200%); }
            }
        }
        
        /* Styling khusus untuk alert payment */
        .alert .btn-sm {
            padding: 0.25rem 0.75rem;
            font-size: 0.875rem;
        }
        
        .flex-grow-1 {
            flex-grow: 1;
        }
    `;
    document.head.appendChild(style);
    
    // Setup event listeners setelah DOM selesai dirender
    setTimeout(() => {
        setupDashboardEventListeners();
    }, 100);
}

function setupDashboardEventListeners() {
    // Event listener untuk tombol Bayar Sekarang di reminder
    const btnBayarSekarang = document.getElementById('btnBayarSekarang');
    if (btnBayarSekarang) {
        btnBayarSekarang.onclick = () => {
            const pembayaranBtn = document.getElementById('btnPembayaran');
            if (pembayaranBtn) {
                pembayaranBtn.click();
            }
        };
    }
    
    // Event listener untuk tombol Go To Payment di marquee
    const btnGoToPaymentFromMarquee = document.getElementById('btnGoToPaymentFromMarquee');
    if (btnGoToPaymentFromMarquee) {
        btnGoToPaymentFromMarquee.onclick = (e) => {
            e.preventDefault();
            const pembayaranBtn = document.getElementById('btnPembayaran');
            if (pembayaranBtn) {
                pembayaranBtn.click();
            }
        };
    }
    
    // Event listener untuk tombol Go To Payment di warning box
    const btnGoToPayment = document.getElementById('btnGoToPayment');
    if (btnGoToPayment) {
        btnGoToPayment.onclick = () => {
            const pembayaranBtn = document.getElementById('btnPembayaran');
            if (pembayaranBtn) {
                pembayaranBtn.click();
            }
        };
    }
}

// Fungsi untuk update dropdown status
async function updateDropdownStatus() {
    const dropdownStatus = document.getElementById('webpush-status-dropdown');
    if (!dropdownStatus) {
        console.warn("⚠️ webpush-status-dropdown tidak ditemukan");
        return;
    }
    
    try {
        const isSubscribed = await webPushManager.checkSubscription();
        console.log("🔄 Updating dropdown status, subscribed:", isSubscribed);
        
        if (isSubscribed) {
            dropdownStatus.innerHTML = `
                <span class="badge bg-success">
                    <i class="bi bi-check-circle"></i> Aktif
                </span>
            `;
        } else {
            dropdownStatus.innerHTML = `
                <span class="badge bg-secondary">
                    <i class="bi bi-bell-slash"></i> Nonaktif
                </span>
            `;
        }
    } catch (error) {
        console.error("❌ Error updating dropdown status:", error);
        dropdownStatus.innerHTML = `
            <span class="badge bg-warning">
                <i class="bi bi-exclamation-circle"></i> Gagal memeriksa
            </span>
        `;
    }
}

function setupNotificationAlert() {
    const alertElement = document.getElementById('notification-alert');
    if (!alertElement) return;
    
    // Tambahkan event listener untuk tombol di alert
    const alertToggleBtn = alertElement.querySelector('#toggleNotificationsBtn');
    if (alertToggleBtn) {
        alertToggleBtn.onclick = async function(event) {
            event.preventDefault();
            
            try {
                // Minta izin dulu
                const permissionResult = await requestNotificationPermission();
                
                if (permissionResult.granted) {
                    // Coba aktifkan notifikasi
                    const result = await webPushManager.enableNotifications();
                    
                    if (result.success) {
                        showToast('success', 'Notifikasi berhasil diaktifkan!');
                        
                        // Update status
                        await updateWebPushStatus(webPushManager);
                        await updateDropdownStatus();
                        
                        // Sembunyikan alert
                        alertElement.classList.add('d-none');
                    } else {
                        showToast('warning', result.message || 'Gagal mengaktifkan notifikasi');
                    }
                } else {
                    showToast('error', permissionResult.error || 'Izin notifikasi ditolak');
                }
            } catch (error) {
                console.error('❌ Error activating notifications from alert:', error);
                showToast('error', 'Gagal mengaktifkan notifikasi: ' + error.message);
            }
        };
    }
}

function showPaymentDetails() {
    const currentPayment = paymentStatus.currentPayment;
    
    console.log("📊 Current payment data:", currentPayment);
    
    if (!currentPayment) {
        showToast('info', 'Tidak ada data pembayaran yang tersedia');
        return;
    }
    
    // Ambil payment ID dengan benar
    const paymentId = currentPayment.idPembayaran || currentPayment.id;
    
    console.log("🔍 Payment ID to show:", paymentId);
    
    if (!paymentId) {
        console.error("❌ No payment ID found in:", currentPayment);
        showToast('warning', 'ID pembayaran tidak ditemukan');
        return;
    }
    
    // Panggil fungsi showPaymentDetailForAnggota dengan ID yang valid
    if (typeof window.showPaymentDetailForAnggota === 'function') {
        console.log("✅ Calling showPaymentDetailForAnggota with ID:", paymentId);
        window.showPaymentDetailForAnggota(paymentId);
    } else {
        console.error("❌ showPaymentDetailForAnggota function not found");
        showToast('error', 'Fitur detail pembayaran tidak tersedia');
    }
}

window.showPaymentDetails = showPaymentDetails;