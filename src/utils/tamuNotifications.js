// utils/tamuNotifications.js
import webPushManager from "./webPush.js";
import { showToast } from "./toast.js";
import { API, getAuthHeaders } from "../api.js";

export class TamuNotifications {
    constructor() {
        this.notificationSubscription = null;
        this.notificationInterval = null;
        this.webPushInitialized = false;
        this.user = null;
    }

    // ==================== INITIALIZATION ====================

    async initialize() {
        try {
            console.log("🔔 Initializing Tamu Notifications...");
            
            // Get user from localStorage
            this.user = JSON.parse(localStorage.getItem('user') || '{}');
            
            // Only initialize for tamu and anggota users
            const allowedRoles = ['tamu', 'anggota'];
            if (!allowedRoles.includes(this.user.role)) {
                console.log(`ℹ️ User role ${this.user.role} doesn't need tamu notifications`);
                return false;
            }
            
            if (!webPushManager.isSupported) {
                console.log("⚠️ Web Push not supported in this browser");
                this.updateNotificationUI('not-supported');
                return false;
            }
            
            // Initialize web push
            try {
                await webPushManager.initialize();
                this.webPushInitialized = true;
                webPushManager.setupPushEventListener();
                console.log("✅ Web Push initialized for tamu");
            } catch (initError) {
                console.error("Web Push init failed:", initError);
                this.updateNotificationUI('service-worker-error');
                return false;
            }
            
            // Check subscription status
            const isSubscribed = await webPushManager.checkSubscription();
            
            if (isSubscribed) {
                console.log("✅ Tamu is subscribed to push notifications");
                this.notificationSubscription = webPushManager.subscription;
                await this.updateNotificationUI('subscribed');
                
                // Start polling for new notifications
                this.startNotificationPolling();
            } else {
                console.log("ℹ️ Tamu is not subscribed to push notifications");
                await this.updateNotificationUI('unsubscribed');
            }
            
            return isSubscribed;
            
        } catch (error) {
            console.error('❌ Error initializing tamu notifications:', error);
            this.updateNotificationUI('error');
            return false;
        }
    }

    // ==================== NOTIFICATION CONTROLS ====================

    async enableNotifications() {
        try {
            console.log("🔄 Enabling tamu notifications...");
            
            // Show loading state
            this.updateNotificationUI('loading');
            
            // Check browser support
            if (!webPushManager.isSupported) {
                throw new Error('Browser tidak mendukung Web Push Notifications');
            }
            
            // Check permission
            if (Notification.permission === 'denied') {
                throw new Error('Permission untuk notifikasi telah ditolak. Mohon aktifkan di pengaturan browser.');
            }
            
            // Request permission if not granted
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    throw new Error('Izin notifikasi ditolak oleh pengguna');
                }
            }
            
            // Enable notifications using webPushManager
            const result = await webPushManager.enableNotifications();
            
            if (result.success) {
                console.log("✅ Tamu notifications enabled successfully");
                this.notificationSubscription = webPushManager.subscription;
                
                // Update UI
                await this.updateNotificationUI('subscribed');
                
                // Start polling
                this.startNotificationPolling();
                
                showToast('success', 'Notifikasi telah diaktifkan! Anda akan mendapatkan pemberitahuan tentang laporan dan pembaruan.');
                
                return true;
            } else {
                console.error("❌ Failed to enable tamu notifications:", result.error);
                await this.updateNotificationUI('error');
                showToast('error', 'Gagal mengaktifkan notifikasi');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error enabling tamu notifications:', error);
            
            let errorMessage = 'Terjadi kesalahan saat mengaktifkan notifikasi';
            let uiStatus = 'error';
            
            if (error.message.includes('Permission') || error.message.includes('Izin')) {
                errorMessage = 'Izin notifikasi ditolak. Mohon aktifkan di pengaturan browser.';
                uiStatus = 'permission-denied';
            } else if (error.message.includes('Service Worker')) {
                errorMessage = 'Service Worker tidak tersedia. Pastikan Anda mengakses melalui HTTPS.';
                uiStatus = 'service-worker-error';
            } else if (error.message.includes('VAPID') || error.message.includes('fetch')) {
                errorMessage = 'Server notifikasi tidak dapat dijangkau. Coba lagi nanti.';
                uiStatus = 'server-unavailable';
            }
            
            await this.updateNotificationUI(uiStatus);
            showToast('error', errorMessage);
            return false;
        }
    }

    async disableNotifications() {
        try {
            console.log("🔄 Disabling tamu notifications...");
            
            // Show loading state
            this.updateNotificationUI('loading');
            
            // Disable notifications using webPushManager
            const result = await webPushManager.disableNotifications();
            
            if (result.success) {
                console.log("✅ Tamu notifications disabled successfully");
                this.notificationSubscription = null;
                
                // Stop polling
                this.stopNotificationPolling();
                
                // Update UI
                await this.updateNotificationUI('unsubscribed');
                
                showToast('info', 'Notifikasi telah dinonaktifkan');
                
                return true;
            } else {
                console.error("❌ Failed to disable tamu notifications:", result.error);
                await this.updateNotificationUI('error');
                showToast('error', 'Gagal menonaktifkan notifikasi');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error disabling tamu notifications:', error);
            await this.updateNotificationUI('error');
            showToast('error', 'Terjadi kesalahan saat menonaktifkan notifikasi');
            return false;
        }
    }

    async toggleNotifications() {
        try {
            const isSubscribed = await webPushManager.checkSubscription();
            
            if (isSubscribed) {
                await this.disableNotifications();
            } else {
                await this.enableNotifications();
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Error toggling tamu notifications:', error);
            showToast('error', 'Gagal mengubah pengaturan notifikasi');
            return false;
        }
    }

    // ==================== UI UPDATES ====================

    async updateNotificationUI(status) {
        const statusElement = document.getElementById('tamu-notification-status');
        const toggleBtn = document.getElementById('tamu-toggleNotificationsBtn');
        
        const updateElement = (element, html) => {
            if (element) {
                element.innerHTML = html;
            }
        };
        
        const statusConfigs = {
            'loading': {
                badge: `<span class="badge bg-warning">
                    <i class="bi bi-arrow-repeat spinner-border spinner-border-sm me-1"></i> Memuat...
                </span>`,
                buttonText: `<i class="bi bi-arrow-repeat me-2"></i>Memuat...`,
                disabled: true
            },
            'subscribed': {
                badge: `<span class="badge bg-success">
                    <i class="bi bi-bell-fill me-1"></i> Aktif
                </span>`,
                buttonText: `<i class="bi bi-bell-slash me-2"></i>Nonaktifkan`,
                disabled: false
            },
            'unsubscribed': {
                badge: `<span class="badge bg-secondary">
                    <i class="bi bi-bell-slash me-1"></i> Nonaktif
                </span>`,
                buttonText: `<i class="bi bi-bell me-2"></i>Aktifkan`,
                disabled: false
            },
            'not-supported': {
                badge: `<span class="badge bg-warning">
                    <i class="bi bi-exclamation-triangle me-1"></i> Tidak Didukung
                </span>`,
                buttonText: `<i class="bi bi-ban me-2"></i>Tidak Didukung`,
                disabled: true
            },
            'permission-denied': {
                badge: `<span class="badge bg-danger">
                    <i class="bi bi-slash-circle me-1"></i> Izin Ditolak
                </span>`,
                buttonText: `<i class="bi bi-slash-circle me-2"></i>Izin Ditolak`,
                disabled: true
            },
            'service-worker-error': {
                badge: `<span class="badge bg-danger">
                    <i class="bi bi-gear me-1"></i> Service Worker Error
                </span>`,
                buttonText: `<i class="bi bi-exclamation-triangle me-2"></i>Error SW`,
                disabled: true
            },
            'server-unavailable': {
                badge: `<span class="badge bg-warning">
                    <i class="bi bi-cloud-slash me-1"></i> Server Offline
                </span>`,
                buttonText: `<i class="bi bi-cloud-slash me-2"></i>Server Offline`,
                disabled: true
            },
            'error': {
                badge: `<span class="badge bg-danger">
                    <i class="bi bi-exclamation-circle me-1"></i> Error
                </span>`,
                buttonText: `<i class="bi bi-exclamation-triangle me-2"></i>Error`,
                disabled: false
            }
        };
        
        const config = statusConfigs[status] || statusConfigs.error;
        
        updateElement(statusElement, config.badge);
        
        if (toggleBtn) {
            toggleBtn.innerHTML = config.buttonText;
            toggleBtn.disabled = config.disabled;
        }
    }

    // ==================== NOTIFICATION POLLING ====================

    startNotificationPolling() {
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
        }
        
        // Poll setiap 5 menit
        this.notificationInterval = setInterval(async () => {
            try {
                await this.checkForNewNotifications();
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 5 * 60 * 1000);
        
        console.log("🔄 Started notification polling (every 5 minutes)");
        
        // Initial check
        setTimeout(() => {
            this.checkForNewNotifications();
        }, 3000);
    }

    stopNotificationPolling() {
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
            this.notificationInterval = null;
            console.log("🛑 Stopped notification polling");
        }
    }

    async checkForNewNotifications() {
        try {
            // Cek koneksi internet
            if (!navigator.onLine) {
                console.log('🌐 Offline - Skipping notification check');
                return [];
            }
            
            // Hanya cek status, tidak perlu menampilkan apa-apa
            console.log("🔔 Checking for notification status...");
            
            return [];
            
        } catch (error) {
            console.error('❌ Error checking for new notifications:', error);
            return [];
        }
    }

    // ==================== DASHBOARD INTEGRATION ====================

    async setupDashboardIntegration() {
        try {
            console.log("🔧 Setting up tamu dashboard integration...");
            
            // Inisialisasi notifikasi
            await this.initialize();
            
            // Setup event listeners untuk tombol
            this.setupEventListeners();
            
            console.log("✅ Tamu dashboard integration complete");
            
        } catch (error) {
            console.error('❌ Error setting up dashboard integration:', error);
        }
    }

    setupEventListeners() {
        console.log("🔗 Setting up tamu event listeners...");
        
        // Tombol toggle notifications
        const toggleBtn = document.getElementById('tamu-toggleNotificationsBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.toggleNotifications();
            });
            console.log("✅ Toggle button listener added");
        }
    }
}

// Export singleton instance
export const tamuNotifications = new TamuNotifications();