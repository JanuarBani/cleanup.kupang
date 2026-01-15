// utils/adminNotifications.js - PERBAIKAN MENGIKUTI PATTERN timNotifications.js
import webPushManager from "./webPush.js";
import { showToast } from "./toast.js";
import { showModal, closeModal } from "./modal.js";
import { API, getAuthHeaders } from "../api.js";

export class AdminNotifications {
    constructor() {
        this.notificationSubscription = null;
        this.unreadNotifications = 0;
        this.notificationInterval = null;
        this.lastNotificationCheck = null;
        this.webPushInitialized = false;
        this.user = null; // Tambah properti user
    }

    // ==================== INITIALIZATION ====================

    async initialize() {
        try {
            console.log("🔔 Initializing Admin Notifications...");
            
            // Get user from localStorage
            this.user = JSON.parse(localStorage.getItem('user') || '{}');
            
            // Only initialize for admin users
            if (this.user.role !== 'admin') {
                console.log(`ℹ️ User role ${this.user.role} doesn't need admin notifications`);
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
                console.log("✅ Web Push initialized for admin");
            } catch (initError) {
                console.error("Web Push init failed:", initError);
                this.updateNotificationUI('service-worker-error');
                return false;
            }
            
            // Check subscription status
            const isSubscribed = await webPushManager.checkSubscription();
            
            if (isSubscribed) {
                console.log("✅ Admin is subscribed to push notifications");
                this.notificationSubscription = webPushManager.subscription;
                await this.updateUnreadNotificationsCount();
                await this.updateNotificationUI('subscribed');
                
                // Start polling for new notifications
                this.startNotificationPolling();
            } else {
                console.log("ℹ️ Admin is not subscribed to push notifications");
                await this.updateNotificationUI('unsubscribed');
            }
            
            return isSubscribed;
            
        } catch (error) {
            console.error('❌ Error initializing admin notifications:', error);
            this.updateNotificationUI('error');
            return false;
        }
    }

    // ==================== NOTIFICATION CONTROLS ====================

    async enableNotifications() {
        try {
            console.log("🔄 Enabling admin notifications...");
            
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.role !== 'admin') {
                showToast('error', 'Hanya admin yang dapat mengaktifkan notifikasi');
                return false;
            }
            
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
                console.log("✅ Admin notifications enabled successfully");
                this.notificationSubscription = webPushManager.subscription;
                
                // Update UI
                await this.updateNotificationUI('subscribed');
                
                // Start polling
                this.startNotificationPolling();
                
                showToast('success', 'Notifikasi admin telah diaktifkan!');
                
                return true;
            } else {
                console.error("❌ Failed to enable admin notifications:", result.error);
                await this.updateNotificationUI('error');
                showToast('error', 'Gagal mengaktifkan notifikasi');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error enabling admin notifications:', error);
            
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
            console.log("🔄 Disabling admin notifications...");
            
            // Show loading state
            this.updateNotificationUI('loading');
            
            // Disable notifications using webPushManager
            const result = await webPushManager.disableNotifications();
            
            if (result.success) {
                console.log("✅ Admin notifications disabled successfully");
                this.notificationSubscription = null;
                this.unreadNotifications = 0;
                
                // Stop polling
                this.stopNotificationPolling();
                
                // Update UI
                await this.updateNotificationUI('unsubscribed');
                
                showToast('info', 'Notifikasi admin telah dinonaktifkan');
                
                return true;
            } else {
                console.error("❌ Failed to disable admin notifications:", result.error);
                await this.updateNotificationUI('error');
                showToast('error', 'Gagal menonaktifkan notifikasi');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error disabling admin notifications:', error);
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
            console.error('❌ Error toggling admin notifications:', error);
            showToast('error', 'Gagal mengubah pengaturan notifikasi');
            return false;
        }
    }

    // ==================== NOTIFICATION FETCHING ====================

    async fetchNotifications() {
        try {
            console.log("📥 Fetching admin notifications...");
            
            const authHeaders = getAuthHeaders();
            
            const url = API.notifications;
            if (!url) {
                console.error('Notification API endpoint not configured');
                return this.getMockNotifications();
            }
            
            // Tambahkan query parameters untuk admin
            const queryParams = new URLSearchParams({
                user: this.user?.id || '',
                user_role: 'admin',
                notification_type: 'payment,report,alert,system',
                limit: '30',
                ordering: '-created_at'
            });
            
            const fullUrl = `${url}?${queryParams}`;
            console.log(`Fetching from: ${fullUrl}`);
            
            const response = await fetch(fullUrl, {
                headers: authHeaders,
                credentials: 'include'
            });
            
            if (!response.ok) {
                if (response.status >= 500) {
                    console.error('Server error - menggunakan mock notifications');
                    return this.getMockNotifications();
                }
                
                throw new Error(`HTTP ${response.status}: Server error`);
            }
            
            const data = await response.json();
            
            // Handle different response formats
            let notifications = [];
            if (Array.isArray(data)) {
                notifications = data;
            } else if (data && data.results) {
                notifications = data.results;
            } else if (data && data.notifications) {
                notifications = data.notifications;
            }
            
            console.log(`📊 Received ${notifications.length} notifications for admin ${this.user?.username || 'admin'}`);
            
            // Update unread count
            this.unreadNotifications = notifications.filter(n => !n.read).length;
            
            // Update last check time
            this.lastNotificationCheck = new Date();
            
            // Update UI
            this.updateNotificationBadge();
            
            return notifications;
            
        } catch (error) {
            console.error('❌ Error fetching admin notifications:', error.message);
            return this.getMockNotifications();
        }
    }

    async checkForNewNotifications() {
        try {
            if (!navigator.onLine) {
                console.log('🌐 Offline - Skipping notification check');
                return [];
            }
            
            const notifications = await this.fetchNotifications();
            
            // Filter notifications dari last 5 menit
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const newNotifications = notifications.filter(notification => {
                try {
                    const notificationDate = new Date(notification.created_at || notification.timestamp || Date.now());
                    return notificationDate > fiveMinutesAgo;
                } catch {
                    return false;
                }
            });
            
            // Show desktop notifications untuk new alerts
            if (newNotifications.length > 0 && Notification.permission === 'granted') {
                newNotifications.forEach(notification => {
                    if (notification.priority === 'high' || notification.notification_type === 'alert') {
                        this.showDesktopNotification(notification);
                    }
                });
            }
            
            return newNotifications;
            
        } catch (error) {
            console.error('❌ Error checking for new notifications:', error);
            return [];
        }
    }

    async updateUnreadNotificationsCount() {
        try {
            const notifications = await this.fetchNotifications();
            this.unreadNotifications = notifications.filter(n => !n.read).length;
            this.updateNotificationBadge();
        } catch (error) {
            console.error('Error updating unread count:', error);
        }
    }

    // ==================== NOTIFICATION ACTIONS ====================

    async markAllNotificationsAsRead() {
        try {
            console.log("📝 Marking all admin notifications as read...");
            
            if (!this.user || !this.user.id) {
                throw new Error('User not found');
            }
            
            const authHeaders = getAuthHeaders();
            
            // Gunakan endpoint yang benar
            const markAllReadUrl = API.notificationsMarkAllRead || `${API.notifications}mark-all-read/`;
            console.log('Using URL:', markAllReadUrl);
            
            // Kirim POST request
            const response = await fetch(markAllReadUrl, {
                method: 'POST',
                headers: {
                    ...authHeaders,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Response data:', data);
            
            // Update UI lokal
            this.unreadNotifications = 0;
            this.updateNotificationBadge();
            
            showToast('success', `Semua notifikasi (${data.count || 0}) telah ditandai sebagai dibaca`);
            return true;

        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            
            // Fallback: update individual notifications
            try {
                console.log('🔄 Trying fallback: marking individual notifications...');
                
                const notifications = await this.fetchNotifications();
                const unreadNotifications = notifications.filter(n => !n.read);
                
                if (unreadNotifications.length > 0) {
                    const authHeaders = getAuthHeaders();
                    
                    // Update setiap notifikasi yang belum dibaca
                    for (const notification of unreadNotifications) {
                        try {
                            const markReadUrl = `${API.notifications}${notification.id}/mark_read/`;
                            await fetch(markReadUrl, {
                                method: 'POST',
                                headers: authHeaders,
                                credentials: 'include'
                            });
                        } catch (error) {
                            console.warn(`Failed to mark notification ${notification.id} as read:`, error.message);
                        }
                    }
                }
                
                // Update UI lokal
                this.unreadNotifications = 0;
                this.updateNotificationBadge();
                
                showToast('success', 'Semua notifikasi telah ditandai sebagai dibaca (fallback)');
                return true;
                
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                
                // Ultimate fallback: hanya update lokal
                this.unreadNotifications = 0;
                this.updateNotificationBadge();
                showToast('info', 'Notifikasi ditandai sebagai dibaca secara lokal');
                return true;
            }
        }
    }

    async markNotificationAsRead(notificationId) {
        try {
            console.log(`📝 Marking admin notification ${notificationId} as read...`);
            
            // Update di server jika ada
            const authHeaders = getAuthHeaders();
            if (API.notifications) {
                const markReadUrl = API.notifications.endsWith('/') 
                    ? `${API.notifications}${notificationId}/mark_read/` 
                    : `${API.notifications}/${notificationId}/mark_read/`;
                
                try {
                    const response = await fetch(markReadUrl, {
                        method: 'POST',
                        headers: authHeaders,
                        credentials: 'include'
                    });
                    
                    if (response.ok) {
                        console.log(`✅ Server: Notification ${notificationId} marked as read`);
                    } else {
                        console.warn(`⚠️ Server: Failed to mark notification ${notificationId} as read`);
                    }
                } catch (serverError) {
                    console.warn('Server update failed, using local only:', serverError.message);
                }
            }
            
            // Update state lokal
            if (this.unreadNotifications > 0) {
                this.unreadNotifications--;
            }
            
            console.log(`✅ Local: Notification ${notificationId} marked as read`);
            
            // Update badge
            this.updateNotificationBadge();
            
            return true;
            
        } catch (error) {
            console.error('❌ Error marking notification as read:', error);
            
            // Fallback: Update lokal saja
            if (this.unreadNotifications > 0) {
                this.unreadNotifications--;
                this.updateNotificationBadge();
            }
            
            return false;
        }
    }

    async deleteNotification(notificationId) {
        try {
            console.log(`🗑️ Deleting admin notification ${notificationId}...`);
            
            if (!this.user || !this.user.id) {
                throw new Error('User not found');
            }
            
            const authHeaders = getAuthHeaders();
            
            // Build URL dengan trailing slash untuk Django
            let apiEndpoint = API.notifications;
            if (!apiEndpoint) {
                throw new Error('Notification API endpoint not configured');
            }
            
            // Pastikan URL berakhir dengan slash
            if (!apiEndpoint.endsWith('/')) {
                apiEndpoint += '/';
            }
            
            const deleteUrl = `${apiEndpoint}${notificationId}/`;
            console.log('Delete URL:', deleteUrl);
            
            const response = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: authHeaders,
                credentials: 'include'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Delete failed ${response.status}:`, errorText.substring(0, 200));
                
                // Coba alternatif jika 404 atau 500
                return await this.tryAlternativeDelete(notificationId);
            }
            
            // Update unread count
            if (this.unreadNotifications > 0) {
                this.unreadNotifications--;
                this.updateNotificationBadge();
            }
            
            showToast('success', 'Notifikasi berhasil dihapus');
            console.log(`✅ Admin notification ${notificationId} deleted successfully`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting admin notification:', error);
            
            // Fallback untuk development
            const mockDeleted = this.handleLocalDelete(notificationId);
            if (mockDeleted) {
                showToast('info', 'Notifikasi dihapus (mode pengembangan)');
                return true;
            }
            
            let errorMessage = 'Gagal menghapus notifikasi';
            if (error.message.includes('404')) {
                errorMessage = 'Notifikasi tidak ditemukan';
            } else if (error.message.includes('401') || error.message.includes('403')) {
                errorMessage = 'Anda tidak memiliki izin untuk menghapus notifikasi';
            }
            
            showToast('error', errorMessage);
            return false;
        }
    }

    async tryAlternativeDelete(notificationId) {
        try {
            console.log('🔄 Mencoba alternatif delete untuk admin...');
            
            const authHeaders = getAuthHeaders();
            
            // Coba berbagai format URL
            const urlFormats = [
                // Format standar Django
                `${API.notifications}${notificationId}/`,
                `${API.notifications}/${notificationId}/`,
                
                // Format dengan base
                `${API.base}/notifications/${notificationId}/`,
                `${API.base}/admin/notifications/${notificationId}/`
            ];
            
            for (const url of urlFormats) {
                try {
                    console.log(`Mencoba: ${url}`);
                    const response = await fetch(url, {
                        method: 'DELETE',
                        headers: authHeaders,
                        credentials: 'include'
                    });
                    
                    if (response.ok) {
                        console.log(`✅ Delete berhasil via ${url}`);
                        
                        // Update UI
                        if (this.unreadNotifications > 0) {
                            this.unreadNotifications--;
                            this.updateNotificationBadge();
                        }
                        
                        return true;
                    }
                } catch (err) {
                    console.log(`URL ${url} gagal:`, err.message);
                    continue;
                }
            }
            
            throw new Error('Semua alternatif gagal');
            
        } catch (error) {
            console.error('❌ Semua percobaan delete admin gagal:', error);
            throw error;
        }
    }

    async deleteAllNotifications() {
        try {
            console.log("🗑️ Deleting all admin notifications...");
            
            if (!this.user || !this.user.id) {
                throw new Error('User not found');
            }
            
            // Konfirmasi sebelum menghapus semua
            const confirmDelete = await this.showDeleteConfirmationModal();
            if (!confirmDelete) {
                return false;
            }
            
            // Tampilkan loading
            showToast('info', 'Menghapus semua notifikasi admin...', 3000);
            
            const authHeaders = getAuthHeaders();
            
            // Coba endpoint delete all untuk admin
            let deleteAllUrl;
            if (API.notifications) {
                deleteAllUrl = API.notifications.endsWith('/') 
                    ? `${API.notifications}admin/all/` 
                    : `${API.notifications}/admin/all/`;
            } else {
                deleteAllUrl = `${API.base}/admin/notifications/all/`;
            }
            
            console.log('Delete all URL for admin:', deleteAllUrl);
            
            const response = await fetch(deleteAllUrl, {
                method: 'DELETE',
                headers: authHeaders,
                credentials: 'include'
            });
            
            if (response.ok) {
                // Reset semua notifikasi
                this.unreadNotifications = 0;
                this.updateNotificationBadge();
                
                showToast('success', 'Semua riwayat notifikasi admin telah dihapus');
                console.log("✅ All admin notifications deleted successfully");
                
                return true;
            } else if (response.status === 404) {
                // Jika endpoint tidak ditemukan, gunakan fallback
                console.log('Endpoint /admin/all tidak ditemukan, menggunakan fallback...');
                return await this.deleteAllNotificationsFallback();
            } else {
                // Coba fallback
                return await this.deleteAllNotificationsFallback();
            }
            
        } catch (error) {
            console.error('❌ Error deleting all admin notifications:', error);
            
            // Coba fallback
            try {
                const fallbackResult = await this.deleteAllNotificationsFallback();
                if (fallbackResult) {
                    return true;
                }
            } catch (fallbackError) {
                console.error('Fallback juga gagal:', fallbackError);
            }
            
            // Ultimate fallback - reset lokal
            this.unreadNotifications = 0;
            this.updateNotificationBadge();
            
            showToast('info', 'Riwayat notifikasi admin direset (mode pengembangan)');
            return true;
        }
    }

    async deleteAllNotificationsFallback() {
        try {
            console.log("🔄 Menggunakan fallback untuk delete all admin...");
            
            // Ambil semua notifikasi admin
            const notifications = await this.fetchNotifications();
            
            if (notifications.length === 0) {
                console.log('Tidak ada notifikasi admin untuk dihapus');
                showToast('info', 'Tidak ada notifikasi untuk dihapus');
                return true;
            }
            
            // Hapus satu per satu
            let successCount = 0;
            let failCount = 0;
            
            for (const notification of notifications) {
                try {
                    await this.deleteNotification(notification.id);
                    successCount++;
                    
                    // Delay kecil untuk tidak membebani server
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                } catch (err) {
                    console.warn(`Gagal menghapus notifikasi admin ${notification.id}:`, err.message);
                    failCount++;
                }
            }
            
            // Reset
            this.unreadNotifications = 0;
            this.updateNotificationBadge();
            
            // Tampilkan hasil
            let message = `Berhasil menghapus ${successCount} notifikasi admin`;
            if (failCount > 0) {
                message += `, ${failCount} gagal`;
            }
            
            showToast('success', message);
            console.log(`✅ Deleted ${successCount} admin notifications (${failCount} failed)`);
            
            return successCount > 0;
            
        } catch (error) {
            console.error('❌ Error in admin fallback delete all:', error);
            
            // Reset lokal
            this.unreadNotifications = 0;
            this.updateNotificationBadge();
            showToast('info', 'Notifikasi admin direset secara lokal');
            
            return true;
        }
    }

    // ==================== MODAL FUNCTIONS ====================

    async showDeleteConfirmationModal() {
        return new Promise((resolve) => {
            const modalContent = `
                <div class="confirmation-modal">
                    <div class="text-center mb-4">
                        <i class="bi bi-exclamation-triangle text-warning fs-1"></i>
                    </div>
                    <h5 class="text-center mb-3">Hapus Semua Notifikasi</h5>
                    <p class="text-center text-muted mb-4">
                        Apakah Anda yakin ingin menghapus <strong>SEMUA</strong> riwayat notifikasi?<br>
                        <small>Tindakan ini tidak dapat dibatalkan.</small>
                    </p>
                    <div class="d-flex justify-content-center gap-3">
                        <button class="btn btn-outline-secondary" id="cancelDelete">
                            <i class="bi bi-x-lg me-2"></i>Batal
                        </button>
                        <button class="btn btn-danger" id="confirmDeleteAll">
                            <i class="bi bi-trash me-2"></i>Ya, Hapus Semua
                        </button>
                    </div>
                </div>
            `;
            
            // Gunakan showModal tanpa tombol save (hanya content)
            showModal('Konfirmasi Hapus', modalContent, null, () => {
                resolve(false);
            });
            
            // Setup event listeners setelah modal muncul
            setTimeout(() => {
                const cancelBtn = document.getElementById('cancelDelete');
                const confirmBtn = document.getElementById('confirmDeleteAll');
                
                if (cancelBtn) {
                    cancelBtn.onclick = () => {
                        closeModal();
                        resolve(false);
                    };
                }
                
                if (confirmBtn) {
                    confirmBtn.onclick = () => {
                        closeModal();
                        resolve(true);
                    };
                }
            }, 100);
        });
    }

    async showSingleDeleteConfirmationModal() {
        return new Promise((resolve) => {
            const modalContent = `
                <div class="confirmation-modal-single">
                    <div class="text-center mb-3">
                        <i class="bi bi-trash text-danger fs-2"></i>
                    </div>
                    <h6 class="text-center mb-3">Hapus Notifikasi</h6>
                    <p class="text-center text-muted mb-4">
                        Apakah Anda yakin ingin menghapus notifikasi ini?
                    </p>
                    <div class="d-flex justify-content-center gap-3">
                        <button class="btn btn-outline-secondary" id="cancelSingleDelete">
                            Batal
                        </button>
                        <button class="btn btn-danger" id="confirmSingleDelete">
                            <i class="bi bi-trash me-1"></i>Hapus
                        </button>
                    </div>
                </div>
            `;
            
            showModal('Konfirmasi Hapus', modalContent, null, () => {
                resolve(false);
            });
            
            setTimeout(() => {
                const cancelBtn = document.getElementById('cancelSingleDelete');
                const confirmBtn = document.getElementById('confirmSingleDelete');
                
                if (cancelBtn) {
                    cancelBtn.onclick = () => {
                        closeModal();
                        resolve(false);
                    };
                }
                
                if (confirmBtn) {
                    confirmBtn.onclick = () => {
                        closeModal();
                        resolve(true);
                    };
                }
            }, 100);
        });
    }

    // ==================== NOTIFICATION MODAL ====================

    async showNotificationModal() {
        try {
            console.log("📋 Showing admin notification modal...");
            
            // Fetch notifications
            const notifications = await this.fetchNotifications();
            
            // Generate modal content
            const modalContent = `
                <div class="notification-modal-admin">
                    ${this.generateNotificationModalContent(notifications)}
                </div>
            `;
            
            // Display modal - gunakan 'modal-lg' untuk size besar
            showModal('Notifikasi Admin', modalContent, 'modal-lg');
            
            // Setup event listeners
            this.setupNotificationModalEventListeners();
            
        } catch (error) {
            console.error('❌ Error showing admin notification modal:', error);
            showToast('error', 'Gagal memuat notifikasi');
        }
    }

    generateNotificationModalContent(notifications) {
        let modalContent = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">
                    <i class="bi bi-shield-check text-primary me-2"></i>
                    Notifikasi Admin
                    ${this.unreadNotifications > 0 ? `
                        <span class="badge bg-danger ms-2">${this.unreadNotifications} baru</span>
                    ` : ''}
                </h5>
                <div>
                    <button class="btn btn-sm btn-outline-primary" id="refreshAdminNotifications">
                        <i class="bi bi-arrow-clockwise"></i> Refresh
                    </button>
                    ${notifications.length > 0 ? `
                        <button class="btn btn-sm btn-outline-success ms-2" id="markAllAsReadAdmin">
                            <i class="bi bi-check-all"></i> Tandai Semua Dibaca
                        </button>
                        <button class="btn btn-sm btn-outline-danger ms-2" id="deleteAllAdminNotifications">
                            <i class="bi bi-trash"></i> Hapus Semua
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        if (notifications.length > 0) {
            modalContent += `
                <div class="notification-list-admin" style="max-height: 400px; overflow-y: auto;">
            `;
            
            notifications.forEach((notification, index) => {
                const isHighPriority = notification.priority === 'high';
                const isRead = notification.read;
                const bgClass = isHighPriority ? 'bg-danger bg-opacity-10' : (isRead ? 'bg-light' : 'bg-primary bg-opacity-10');
                const borderClass = isHighPriority ? 'border-danger' : (isRead ? 'border-light' : 'border-primary');
                
                modalContent += `
                    <div class="notification-item-admin border rounded p-3 mb-2 ${borderClass} ${bgClass}">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1 me-3">
                                <div class="d-flex align-items-center mb-1">
                                    ${this.getNotificationIcon(notification.notification_type || notification.type)}
                                    <h6 class="mb-0 ms-2 ${isHighPriority ? 'text-danger fw-bold' : (isRead ? 'text-muted' : 'text-dark')}">
                                        ${notification.title || 'Notifikasi'}
                                    </h6>
                                    ${isHighPriority ? `
                                        <span class="badge bg-danger ms-2">PENTING</span>
                                    ` : ''}
                                    ${!isRead ? `
                                        <span class="badge bg-success ms-2">BARU</span>
                                    ` : ''}
                                </div>
                                <p class="mb-1 ${isRead ? 'text-muted' : 'text-dark'}">${notification.message || ''}</p>
                                <small class="text-muted">
                                    <i class="bi bi-clock me-1"></i>
                                    ${this.formatTimeAgo(notification.created_at || notification.timestamp)}
                                </small>
                            </div>
                            <div>
                                ${!isRead ? `
                                    <button class="btn btn-sm btn-outline-success mark-as-read-admin me-1" 
                                            data-id="${notification.id || index}"
                                            data-type="mark-read">
                                        <i class="bi bi-check"></i> Baca
                                    </button>
                                ` : ''}
                                <button class="btn btn-sm btn-outline-danger delete-admin-notification" 
                                        data-id="${notification.id || index}"
                                        data-type="delete">
                                    <i class="bi bi-trash"></i> Hapus
                                </button>
                            </div>
                        </div>
                `;
                
                if (notification.data) {
                    modalContent += `
                        <div class="mt-2 p-2 bg-light rounded">
                            <small class="text-muted">Informasi:</small>
                            <pre class="mb-0 small" style="max-height: 100px; overflow: auto; white-space: pre-wrap;">${JSON.stringify(notification.data, null, 2)}</pre>
                        </div>
                    `;
                }
                
                modalContent += `</div>`;
            });
            
            modalContent += `</div>`;
        } else {
            modalContent += `
                <div class="text-center py-5">
                    <i class="bi bi-bell-slash fs-1 text-muted mb-3"></i>
                    <p class="text-muted">Tidak ada notifikasi</p>
                    <small class="text-muted">Notifikasi akan muncul di sini saat ada pembaruan</small>
                </div>
            `;
        }
        
        modalContent += `
            <div class="mt-3 border-top pt-3">
                <small class="text-muted">
                    <i class="bi bi-info-circle me-1"></i>
                    Notifikasi diperbarui setiap 5 menit. Terakhir: ${this.lastNotificationCheck ? this.lastNotificationCheck.toLocaleTimeString('id-ID') : 'Belum pernah'}
                </small>
            </div>
        `;
        
        return modalContent;
    }

    async refreshNotificationModal() {
        try {
            console.log("🔄 Refreshing admin notification modal...");
            
            // Fetch notifications terbaru
            const notifications = await this.fetchNotifications();
            
            // Update konten modal yang sedang terbuka
            const modalBody = document.querySelector('.modal-body .notification-modal-admin');
            if (modalBody) {
                const modalContent = this.generateNotificationModalContent(notifications);
                modalBody.innerHTML = modalContent;
                
                // Setup event listeners kembali
                this.setupNotificationModalEventListeners();
            }
            
            // Update badge di luar modal juga
            this.updateNotificationBadge();
            
        } catch (error) {
            console.error('❌ Error refreshing modal:', error);
        }
    }

    setupNotificationModalEventListeners() {
        setTimeout(() => {
            // Refresh button
            const refreshBtn = document.getElementById('refreshAdminNotifications');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await this.refreshNotificationModal();
                });
            }
            
            // Mark all as read button
            const markAllBtn = document.getElementById('markAllAsReadAdmin');
            if (markAllBtn) {
                markAllBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const success = await this.markAllNotificationsAsRead();
                    if (success) {
                        await this.refreshNotificationModal();
                    }
                });
            }
            
            // Delete all button
            const deleteAllBtn = document.getElementById('deleteAllAdminNotifications');
            if (deleteAllBtn) {
                deleteAllBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const success = await this.deleteAllNotifications();
                    if (success) {
                        await this.refreshNotificationModal();
                    }
                });
            }
            
            // Mark individual as read buttons
            document.querySelectorAll('.mark-as-read-admin[data-type="mark-read"]').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const notificationId = btn.dataset.id;
                    btn.disabled = true;
                    btn.innerHTML = '<i class="bi bi-hourglass"></i> Memproses...';
                    
                    const success = await this.markNotificationAsRead(notificationId);
                    
                    if (success) {
                        // Refresh modal untuk update UI
                        await this.refreshNotificationModal();
                    } else {
                        btn.disabled = false;
                        btn.innerHTML = '<i class="bi bi-check"></i> Baca';
                        showToast('error', 'Gagal menandai notifikasi sebagai dibaca');
                    }
                });
            });
            
            // Delete individual notification buttons
            document.querySelectorAll('.delete-admin-notification[data-type="delete"]').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const notificationId = btn.dataset.id;
                    
                    const confirmDelete = await this.showSingleDeleteConfirmationModal();
                    if (!confirmDelete) return;
                    
                    btn.disabled = true;
                    btn.innerHTML = '<i class="bi bi-hourglass"></i> Menghapus...';
                    
                    const success = await this.deleteNotification(notificationId);
                    
                    if (success) {
                        // Refresh modal untuk update UI
                        await this.refreshNotificationModal();
                    } else {
                        btn.disabled = false;
                        btn.innerHTML = '<i class="bi bi-trash"></i> Hapus';
                        showToast('error', 'Gagal menghapus notifikasi');
                    }
                });
            });
        }, 100);
    }

    // ==================== HELPER FUNCTIONS ====================

    handleLocalDelete(notificationId) {
        console.log(`🔧 Local delete for admin notification ${notificationId} (mock)`);
        
        // Simulasi hapus
        if (this.unreadNotifications > 0) {
            this.unreadNotifications = Math.max(0, this.unreadNotifications - 1);
            this.updateNotificationBadge();
        }
        
        return true;
    }

    showDesktopNotification(notification) {
        try {
            if (!('Notification' in window)) {
                console.log('⚠️ Desktop notifications not supported');
                return;
            }
            
            if (Notification.permission !== 'granted') {
                console.log('⚠️ Notification permission not granted');
                return;
            }
            
            const options = {
                body: notification.message || 'Anda memiliki notifikasi baru',
                icon: '/static/icon-192x192.png',
                badge: '/static/icon-72x72.png',
                tag: `admin-notification-${notification.id || Date.now()}`,
                requireInteraction: notification.priority === 'high',
                data: notification,
                silent: false
            };
            
            const desktopNotification = new Notification(
                `Admin - ${notification.title || 'Notifikasi'}`,
                options
            );
            
            desktopNotification.onclick = () => {
                window.focus();
                desktopNotification.close();
                this.showNotificationModal();
            };
            
            desktopNotification.onclose = () => {
                console.log('Desktop notification closed');
            };
            
            if (notification.priority !== 'high') {
                setTimeout(() => {
                    desktopNotification.close();
                }, 10000);
            }
            
        } catch (error) {
            console.error('❌ Error showing desktop notification:', error);
        }
    }

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
        
        console.log("🔄 Started admin notification polling (every 5 minutes)");
        
        // Initial check
        setTimeout(() => {
            this.checkForNewNotifications();
        }, 3000);
    }

    stopNotificationPolling() {
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
            this.notificationInterval = null;
            console.log("🛑 Stopped admin notification polling");
        }
    }

    getNotificationIcon(type) {
        const icons = {
            'payment': '<i class="bi bi-cash-coin text-success fs-5"></i>',
            'report': '<i class="bi bi-clipboard-data text-warning fs-5"></i>',
            'alert': '<i class="bi bi-exclamation-triangle text-danger fs-5"></i>',
            'system': '<i class="bi bi-gear text-secondary fs-5"></i>',
            'test': '<i class="bi bi-bell text-muted fs-5"></i>',
            'user': '<i class="bi bi-person-plus text-info fs-5"></i>'
        };
        
        return icons[type] || '<i class="bi bi-bell text-muted fs-5"></i>';
    }

    formatTimeAgo(dateString) {
        if (!dateString) return 'Baru saja';
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffSecs = Math.floor(diffMs / 1000);
            const diffMins = Math.floor(diffSecs / 60);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);
            
            if (diffSecs < 10) return 'Baru saja';
            if (diffSecs < 60) return `${diffSecs} detik lalu`;
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

    getMockNotifications() {
        const now = new Date();
        return [
            {
                id: 1,
                title: 'Pembayaran Baru',
                message: 'Anggota #1234 telah melakukan pembayaran bulanan Rp 50,000',
                notification_type: 'payment',
                priority: 'normal',
                read: false,
                created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
                data: { amount: 50000, member_id: 1234, status: 'success' }
            },
            {
                id: 2,
                title: 'Laporan Sampah Menunggu',
                message: '3 laporan sampah baru menunggu verifikasi',
                notification_type: 'report',
                priority: 'high',
                read: false,
                created_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
                data: { count: 3, status: 'pending', location: 'Area A' }
            },
            {
                id: 3,
                title: 'Jadwal Besok',
                message: '5 jadwal pengangkutan untuk besok perlu dipersiapkan',
                notification_type: 'schedule',
                priority: 'normal',
                read: true,
                created_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
                data: { schedule_count: 5, date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
            }
        ];
    }

    // ==================== UI UPDATES ====================

    async updateNotificationUI(status) {
        const statusElement = document.getElementById('notification-status');
        const statusMobileElement = document.getElementById('notification-status-mobile');
        const toggleBtn = document.getElementById('toggleNotificationsBtn');
        const toggleMobileBtn = document.getElementById('toggleNotificationsBtnMobile');
        
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
        updateElement(statusMobileElement, config.badge);
        
        if (toggleBtn) {
            toggleBtn.innerHTML = config.buttonText;
            toggleBtn.disabled = config.disabled;
        }
        if (toggleMobileBtn) {
            toggleMobileBtn.innerHTML = config.buttonText;
            toggleMobileBtn.disabled = config.disabled;
        }
        
        this.updateNotificationBadge();
    }

    updateNotificationBadge() {
        const badgeElement = document.getElementById('notification-badge');
        const mobileBadge = document.getElementById('notification-badge-mobile');
        
        const updateBadge = (element) => {
            if (element) {
                if (this.unreadNotifications > 0) {
                    element.innerHTML = `
                        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size: 0.6em;">
                            ${this.unreadNotifications > 99 ? '99+' : this.unreadNotifications}
                            <span class="visually-hidden">unread notifications</span>
                        </span>
                    `;
                    element.classList.add('position-relative');
                } else {
                    element.innerHTML = '';
                    element.classList.remove('position-relative');
                }
            }
        };
        
        updateBadge(badgeElement);
        updateBadge(mobileBadge);
    }

    // ==================== DASHBOARD INTEGRATION ====================

    async setupDashboardIntegration() {
        try {
            console.log("🔧 Setting up admin dashboard integration...");
            
            // Inisialisasi notifikasi
            await this.initialize();
            
            // Setup event listeners untuk tombol
            this.setupEventListeners();
            
            // Update dropdown status
            await this.updateDropdownStatus();
            
            console.log("✅ Admin dashboard integration complete");
            
        } catch (error) {
            console.error('❌ Error setting up admin dashboard integration:', error);
        }
    }

    setupEventListeners() {
        console.log("🔗 Setting up admin event listeners...");
        
        // Tombol toggle notifications
        const toggleBtn = document.getElementById('toggleNotificationsBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.toggleNotifications();
            });
        }
        
        // Tombol show notification modal
        const showModalBtn = document.getElementById('showNotificationsModal');
        if (showModalBtn) {
            showModalBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.showNotificationModal();
            });
        }
    }

    async updateDropdownStatus() {
        const dropdownStatus = document.getElementById('notification-dropdown-status');
        if (!dropdownStatus) return;
        
        try {
            const isSubscribed = await webPushManager.checkSubscription();
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
            console.error("Error updating dropdown status:", error);
            dropdownStatus.innerHTML = `
                <span class="badge bg-warning">
                    <i class="bi bi-exclamation-circle"></i> Gagal
                </span>
            `;
        }
    }
}

// Export singleton instance
export const adminNotifications = new AdminNotifications();