// utils/timNotifications.js
import webPushManager from "./webPush.js";
import { showToast } from "./toast.js";
import { showModal, closeModal } from "./modal.js";
import { API, getAuthHeaders } from "../api.js";

export class TimNotifications {
    constructor() {
        this.notificationSubscription = null;
        this.unreadNotifications = 0;
        this.notificationInterval = null;
        this.lastNotificationCheck = null;
        this.webPushInitialized = false;
        this.user = null;
    }

    // ==================== INITIALIZATION ====================

    async initialize() {
        try {
            console.log("🔔 Initializing Tim Angkut Notifications...");
            
            // Get user from localStorage
            this.user = JSON.parse(localStorage.getItem('user') || '{}');

            await this.setupScheduleChecker();
            
            // Only initialize for tim_angkut users
            if (this.user.role !== 'tim_angkut') {
                console.log(`ℹ️ User role ${this.user.role} doesn't need tim notifications`);
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
                console.log("✅ Web Push initialized for tim angkut");
            } catch (initError) {
                console.error("Web Push init failed:", initError);
                this.updateNotificationUI('service-worker-error');
                return false;
            }
            
            // Check subscription status
            const isSubscribed = await webPushManager.checkSubscription();
            
            if (isSubscribed) {
                console.log("✅ Tim Angkut is subscribed to push notifications");
                this.notificationSubscription = webPushManager.subscription;
                await this.updateUnreadNotificationsCount();
                await this.updateNotificationUI('subscribed');
                
                // Start polling for new notifications
                this.startNotificationPolling();
            } else {
                console.log("ℹ️ Tim Angkut is not subscribed to push notifications");
                await this.updateNotificationUI('unsubscribed');
            }
            
            return isSubscribed;
            
        } catch (error) {
            console.error('❌ Error initializing tim notifications:', error);
            this.updateNotificationUI('error');
            return false;
        }
    }

    // ==================== NOTIFICATION CONTROLS ====================

    async enableNotifications() {
        try {
            console.log("🔄 Enabling tim angkut notifications...");
            
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.role !== 'tim_angkut') {
                showToast('Hanya tim angkut yang dapat mengaktifkan notifikasi', 'error');
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
                console.log("✅ Tim Angkut notifications enabled successfully");
                this.notificationSubscription = webPushManager.subscription;
                
                // Update UI
                await this.updateNotificationUI('subscribed');
                
                // Start polling
                this.startNotificationPolling();
                
                showToast('Notifikasi tim angkut telah diaktifkan! Anda akan mendapatkan pemberitahuan tentang jadwal dan tugas.', 'success');
                
                return true;
            } else {
                console.error("❌ Failed to enable tim notifications:", result.error);
                await this.updateNotificationUI('error');
                showToast('Gagal mengaktifkan notifikasi', 'error');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error enabling tim notifications:', error);
            
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
            showToast(errorMessage, 'error');
            return false;
        }
    }

    async disableNotifications() {
        try {
            console.log("🔄 Disabling tim angkut notifications...");
            
            // Show loading state
            this.updateNotificationUI('loading');
            
            // Disable notifications using webPushManager
            const result = await webPushManager.disableNotifications();
            
            if (result.success) {
                console.log("✅ Tim Angkut notifications disabled successfully");
                this.notificationSubscription = null;
                this.unreadNotifications = 0;
                
                // Stop polling
                this.stopNotificationPolling();
                
                // Update UI
                await this.updateNotificationUI('unsubscribed');
                
                showToast('Notifikasi tim angkut telah dinonaktifkan', 'info');
                
                return true;
            } else {
                console.error("❌ Failed to disable tim notifications:", result.error);
                await this.updateNotificationUI('error');
                showToast('Gagal menonaktifkan notifikasi', 'error');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error disabling tim notifications:', error);
            await this.updateNotificationUI('error');
            showToast('Terjadi kesalahan saat menonaktifkan notifikasi', 'error');
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
            console.error('❌ Error toggling tim notifications:', error);
            showToast('Gagal mengubah pengaturan notifikasi', 'error');
            return false;
        }
    }

    // ==================== NOTIFICATION FETCHING ====================

    async fetchTimNotifications() {
        try {
            console.log("📥 Fetching tim angkut notifications...");
            
            const authHeaders = getAuthHeaders();
            
            // Gunakan URL yang benar dari API
            const url = API.notifications;
            if (!url) {
                console.error('Notification API endpoint not configured');
                return this.getMockTimNotifications();
            }
            
            // Tambahkan query parameters untuk tim angkut
            const queryParams = new URLSearchParams({
                user: this.user.id,
                notification_type: 'schedule,alert,system',
                // read: 'false',
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
                // Jika server error, gunakan mock data sementara
                if (response.status >= 500) {
                    console.error('Server error - menggunakan mock notifications');
                    return this.getMockTimNotifications();
                }
                
                const errorText = await response.text();
                console.error(`API Error ${response.status}:`, errorText.substring(0, 200));
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
            
            console.log(`📊 Received ${notifications.length} notifications for tim angkut ${this.user.username}`);
            
            // Update unread count
            this.unreadNotifications = notifications.filter(n => !n.read).length;
            
            // Update last check time
            this.lastNotificationCheck = new Date();
            
            // Update UI
            this.updateNotificationBadge();
            
            return notifications;
            
        } catch (error) {
            console.error('❌ Error fetching tim notifications:', error.message);
            
            // Return mock data untuk development
            console.log('Using mock notifications for development');
            return this.getMockTimNotifications();
        }
    }

    async checkForNewTimNotifications() {
        try {
            // Cek koneksi internet
            if (!navigator.onLine) {
                console.log('🌐 Offline - Skipping notification check');
                return [];
            }
            
            const notifications = await this.fetchTimNotifications();
            
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
            console.error('❌ Error checking for new tim notifications:', error);
            return [];
        }
    }

    async updateUnreadNotificationsCount() {
        try {
            const notifications = await this.fetchTimNotifications();
            this.unreadNotifications = notifications.filter(n => !n.read).length;
            this.updateNotificationBadge();
        } catch (error) {
            console.error('Error updating unread count:', error);
        }
    }

    // ==================== NOTIFICATION ACTIONS ====================

    async sendTimTestNotification() {
        try {
            console.log("🚀 Sending tim angkut test notification...");
            
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.role !== 'tim_angkut') {
                showToast('Hanya tim angkut yang dapat mengirim notifikasi test', 'error');
                return;
            }
            
            // Cek subscription dulu
            const isSubscribed = await webPushManager.checkSubscription();
            if (!isSubscribed) {
                showToast('Harap aktifkan notifikasi terlebih dahulu', 'warning');
                return;
            }
            
            // Kirim test notification menggunakan webPushManager
            const result = await webPushManager.sendTestNotification();
            
            if (result.success) {
                showToast('Notifikasi test berhasil dikirim!', 'success', 5000);
                console.log("✅ Test notification sent successfully");
            } else {
                console.error("❌ Failed to send test notification:", result.message);
                showToast('error', result.message || 'Gagal mengirim notifikasi test');
            }
            
        } catch (error) {
            console.error('❌ Error sending tim test notification:', error);
            
            let errorMessage = 'Gagal mengirim notifikasi test';
            if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = 'Server notifikasi tidak dapat dijangkau';
            } else if (error.message.includes('401') || error.message.includes('Authentication')) {
                errorMessage = 'Sesi login telah habis. Silakan login ulang.';
            }
            
            showToast(errorMessage, 'error');
        }
    }

    // async markAllTimNotificationsAsRead() {
    //     try {
    //         console.log("📝 Marking all tim notifications as read...");
            
    //         const user = JSON.parse(localStorage.getItem('user') || '{}');
    //         const authHeaders = getAuthHeaders();
            
    //         // Gunakan endpoint yang benar sesuai Django ViewSet
    //         const markAllReadUrl = `${API.notifications}mark-all-read/`;
    //         console.log('Using URL:', markAllReadUrl);
            
    //         // Kirim POST request
    //         const response = await fetch(markAllReadUrl, {
    //             method: 'POST',
    //             headers: {
    //                 ...authHeaders,
    //                 'Content-Type': 'application/json'
    //             },
    //             credentials: 'include'
    //         });
            
    //         console.log('Response status:', response.status);
            
    //         if (!response.ok) {
    //             // Debug: coba lihat response body untuk info lebih lanjut
    //             const errorText = await response.text();
    //             console.error('Error response body:', errorText);
                
    //             throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
    //         }
            
    //         const data = await response.json();
    //         console.log('Response data:', data);
            
    //         // Update UI lokal
    //         this.unreadNotifications = 0;
    //         this.updateNotificationBadge();
            
    //         showToast(`Semua notifikasi (${data.count || 0}) telah ditandai sebagai dibaca`, 'success', 5000);
    //         return true;

    //     } catch (error) {
    //         console.error('Error marking all notifications as read:', error);
            
    //         // Coba fallback: update individual notifications
    //         try {
    //             console.log('🔄 Trying fallback: marking individual notifications...');
                
    //             const notifications = await this.fetchTimNotifications();
    //             const unreadNotifications = notifications.filter(n => !n.read);
                
    //             if (unreadNotifications.length > 0) {
    //                 const authHeaders = getAuthHeaders();
                    
    //                 // Update setiap notifikasi yang belum dibaca
    //                 for (const notification of unreadNotifications) {
    //                     try {
    //                         const markReadUrl = `${API.notificationsMarkRead}${notification.id}/mark_read/`;
    //                         await fetch(markReadUrl, {
    //                             method: 'POST',
    //                             headers: authHeaders,
    //                             credentials: 'include'
    //                         });
    //                     } catch (error) {
    //                         console.warn(`Failed to mark notification ${notification.id} as read:`, error.message);
    //                     }
    //                 }
    //             }
                
    //             // Update UI lokal
    //             this.unreadNotifications = 0;
    //             this.updateNotificationBadge();
                
    //             showToast('Semua notifikasi telah ditandai sebagai dibaca (fallback)', 'success');
    //             return true;
                
    //         } catch (fallbackError) {
    //             console.error('Fallback also failed:', fallbackError);
                
    //             // Ultimate fallback: hanya update lokal
    //             this.unreadNotifications = 0;
    //             this.updateNotificationBadge();
    //             showToast('Notifikasi ditandai sebagai dibaca secara lokal', 'info');
    //             return true;
    //         }
    //     }
    // }

    async markAllTimNotificationsAsRead() {
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
                
                showToast(`Semua notifikasi (${data.count || 0}) telah ditandai sebagai dibaca`, 'success');
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
                    
                    showToast('Semua notifikasi telah ditandai sebagai dibaca (fallback)', 'success');
                    return true;
                    
                } catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError);
                    
                    // Ultimate fallback: hanya update lokal
                    this.unreadNotifications = 0;
                    this.updateNotificationBadge();
                    showToast('Notifikasi ditandai sebagai dibaca secara lokal', 'info');
                    return true;
                }
            }
        }

    // ==================== NOTIFICATION ACTIONS ====================

    async deleteTimNotification(notificationId) {
        try {
            console.log(`🗑️ Deleting tim notification ${notificationId}...`);
            
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
            console.log('Delete URL for tim:', deleteUrl);
            
            const response = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: authHeaders,
                credentials: 'include'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Delete failed ${response.status}:`, errorText.substring(0, 200));
                
                // Coba alternatif jika 404 atau 500
                return await this.tryAlternativeDeleteTim(notificationId);
            }
            
            // Update unread count
            if (this.unreadNotifications > 0) {
                this.unreadNotifications--;
                this.updateNotificationBadge();
            }
            
            showToast('Notifikasi berhasil dihapus', 'success');
            console.log(`✅ Tim notification ${notificationId} deleted successfully`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting tim notification:', error);
            
            // Fallback untuk development
            const mockDeleted = this.handleLocalTimDelete(notificationId);
            if (mockDeleted) {
                showToast('Notifikasi dihapus (mode pengembangan)', 'info');
                return true;
            }
            
            let errorMessage = 'Gagal menghapus notifikasi';
            if (error.message.includes('404')) {
                errorMessage = 'Notifikasi tidak ditemukan';
            } else if (error.message.includes('401') || error.message.includes('403')) {
                errorMessage = 'Anda tidak memiliki izin untuk menghapus notifikasi';
            }
            
            showToast(errorMessage, 'error');
            return false;
        }
    }

    async tryAlternativeDeleteTim(notificationId) {
        try {
            console.log('🔄 Mencoba alternatif delete untuk tim...');
            
            const authHeaders = getAuthHeaders();
            
            // Coba berbagai format URL
            const urlFormats = [
                // Format standar Django
                `${API.notifications}${notificationId}/`,
                `${API.notifications}/${notificationId}/`,
                
                // Format dengan base
                `${API.base}/notifications/${notificationId}/`,
                `${API.base}/tim/notifications/${notificationId}/`,
                `${API.base}/tim-angikut/notifications/${notificationId}/`
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
            console.error('❌ Semua percobaan delete tim gagal:', error);
            throw error;
        }
    }

    async deleteAllTimNotifications() {
        try {
            console.log("🗑️ Deleting all tim notifications...");
            
            if (!this.user || !this.user.id) {
                throw new Error('User not found');
            }
            
            // Konfirmasi sebelum menghapus semua
            const confirmDelete = await this.showTimDeleteConfirmationModal();
            if (!confirmDelete) {
                return false;
            }
            
            // Tampilkan loading
            showToast('Menghapus semua notifikasi tim...', 'info', 3000);
            
            const authHeaders = getAuthHeaders();
            
            // Coba endpoint delete all untuk tim
            let deleteAllUrl;
            if (API.notifications) {
                deleteAllUrl = API.notifications.endsWith('/') 
                    ? `${API.notifications}tim/all/` 
                    : `${API.notifications}/tim/all/`;
            } else {
                deleteAllUrl = `${API.base}/tim/notifications/all/`;
            }
            
            console.log('Delete all URL for tim:', deleteAllUrl);
            
            const response = await fetch(deleteAllUrl, {
                method: 'DELETE',
                headers: authHeaders,
                credentials: 'include'
            });
            
            if (response.ok) {
                // Reset semua notifikasi
                this.unreadNotifications = 0;
                this.updateNotificationBadge();
                
                showToast('Semua riwayat notifikasi tim telah dihapus', 'success', 3000);
                console.log("✅ All tim notifications deleted successfully");
                
                return true;
            } else if (response.status === 404) {
                // Jika endpoint tidak ditemukan, gunakan fallback
                console.log('Endpoint /tim/all tidak ditemukan, menggunakan fallback...');
                return await this.deleteAllTimNotificationsFallback();
            } else {
                const errorText = await response.text();
                console.error(`Delete all tim failed ${response.status}:`, errorText.substring(0, 200));
                
                // Coba fallback
                return await this.deleteAllTimNotificationsFallback();
            }
            
        } catch (error) {
            console.error('❌ Error deleting all tim notifications:', error);
            
            // Coba fallback
            try {
                const fallbackResult = await this.deleteAllTimNotificationsFallback();
                if (fallbackResult) {
                    return true;
                }
            } catch (fallbackError) {
                console.error('Fallback juga gagal:', fallbackError);
            }
            
            // Ultimate fallback - reset lokal
            this.unreadNotifications = 0;
            this.updateNotificationBadge();
            
            showToast('Riwayat notifikasi tim direset (mode pengembangan)', 'info');
            return true;
        }
    }

    async deleteAllTimNotificationsFallback() {
        try {
            console.log("🔄 Menggunakan fallback untuk delete all tim...");
            
            // Ambil semua notifikasi tim
            const notifications = await this.fetchTimNotifications();
            
            if (notifications.length === 0) {
                console.log('Tidak ada notifikasi tim untuk dihapus');
                showToast('Tidak ada notifikasi untuk dihapus','info');
                return true;
            }
            
            // Hapus satu per satu
            let successCount = 0;
            let failCount = 0;
            
            for (const notification of notifications) {
                try {
                    await this.deleteTimNotification(notification.id);
                    successCount++;
                    
                    // Delay kecil untuk tidak membebani server
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                } catch (err) {
                    console.warn(`Gagal menghapus notifikasi tim ${notification.id}:`, err.message);
                    failCount++;
                }
            }
            
            // Reset
            this.unreadNotifications = 0;
            this.updateNotificationBadge();
            
            // Tampilkan hasil
            let message = `Berhasil menghapus ${successCount} notifikasi tim`;
            if (failCount > 0) {
                message += `, ${failCount} gagal`;
            }
            
            showToast(message, 'success');
            console.log(`✅ Deleted ${successCount} tim notifications (${failCount} failed)`);
            
            return successCount > 0;
            
        } catch (error) {
            console.error('❌ Error in tim fallback delete all:', error);
            
            // Reset lokal
            this.unreadNotifications = 0;
            this.updateNotificationBadge();
            showToast('Notifikasi tim direset secara lokal', 'info');
            
            return true;
        }
    }

    async showTimNotificationModal() {
        try {
            console.log("📋 Showing tim angkut notification modal...");
            
            // Fetch notifications
            const notifications = await this.fetchTimNotifications();
            
            // Generate modal content
            const modalContent = `
                <div class="notification-modal-tim">
                    ${this.generateNotificationModalContent(notifications)}
                </div>
            `;
            
            // Display modal
            showModal('Notifikasi Tim Angkut', modalContent, 'modal-lg');
            
            // Setup event listeners
            this.setupNotificationModalEventListeners();
            
        } catch (error) {
            console.error('❌ Error showing tim notification modal:', error);
            showToast('Gagal memuat notifikasi', 'error');
        }
    }

    handleLocalTimDelete(notificationId) {
        // Fungsi untuk development/testing
        console.log(`🔧 Local delete for tim notification ${notificationId} (mock)`);
        
        // Simulasi hapus
        const mockNotifications = this.getMockTimNotifications();
        console.log(`Mock: Menghapus notifikasi ${notificationId} dari ${mockNotifications.length} total`);
        
        // Update UI
        if (this.unreadNotifications > 0) {
            this.unreadNotifications = Math.max(0, this.unreadNotifications - 1);
            this.updateNotificationBadge();
        }
        
        return true;
    }

    // ==================== UI UPDATES ====================

    async updateNotificationUI(status) {
        const statusElement = document.getElementById('tim-notification-status');
        const toggleBtn = document.getElementById('tim-toggleNotificationsBtn');
        const mobileStatus = document.getElementById('tim-notification-status-mobile');
        
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
        updateElement(mobileStatus, config.badge);
        
        if (toggleBtn) {
            toggleBtn.innerHTML = config.buttonText;
            toggleBtn.disabled = config.disabled;
        }
        
        this.updateNotificationBadge();
    }

    updateNotificationBadge() {
        const badgeElement = document.getElementById('tim-notification-badge');
        const mobileBadge = document.getElementById('tim-notification-badge-mobile');
        
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

    // ==================== NOTIFICATION MODAL ====================

    async showSingleDeleteConfirmationModal() {
        return new Promise((resolve) => {
            const modalContent = `
                <div class="confirmation-modal-single">
                    <div class="text-center mb-3">
                        <i class="bi bi-trash text-danger fs-2"></i>
                    </div>
                    <h6 class="text-center mb-3">Hapus Notifikasi</h6>
                    <p class="text-center text-muted mb-0">
                        Apakah Anda yakin ingin menghapus notifikasi ini?
                    </p>
                    <div class="d-flex justify-content-center gap-3 mt-4">
                        <button type="button" class="btn btn-outline-secondary" 
                                data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-danger" id="confirmSingleDeleteBtn">
                            <i class="bi bi-trash me-1"></i>Hapus
                        </button>
                    </div>
                </div>
            `;
            
            // Gunakan showModal dengan size 'modal-sm'
            showModal('Konfirmasi Hapus', modalContent, 'modal-sm');
            
            setTimeout(() => {
                const confirmBtn = document.getElementById('confirmSingleDeleteBtn');
                
                if (confirmBtn) {
                    confirmBtn.addEventListener('click', () => {
                        // Hanya resolve dengan true, modal akan ditutup oleh Bootstrap
                        resolve(true);
                    });
                }
            }, 100);
        });
    }

    // Tambahkan fungsi baru untuk refresh modal tanpa menutupnya
    async refreshNotificationModal() {
        try {
            console.log("🔄 Refreshing notification modal...");
            
            // Fetch notifications terbaru
            const notifications = await this.fetchTimNotifications();
            
            // Update konten modal yang sedang terbuka
            const modalBody = document.querySelector('.modal-body .notification-modal-tim');
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

    // Fungsi untuk generate content modal notifications
    generateNotificationModalContent(notifications) {
        let modalContent = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">
                    <i class="bi bi-truck text-primary me-2"></i>
                    Notifikasi Tim Angkut
                    ${this.unreadNotifications > 0 ? `
                        <span class="badge bg-danger ms-2">${this.unreadNotifications} baru</span>
                    ` : ''}
                </h5>
                <div>
                    <button class="btn btn-sm btn-outline-primary" id="refreshTimNotifications">
                        <i class="bi bi-arrow-clockwise"></i> Refresh
                    </button>
                    ${notifications.length > 0 ? `
                        <button class="btn btn-sm btn-outline-success ms-2" id="markAllAsReadTim">
                            <i class="bi bi-check-all"></i> Tandai Semua Dibaca
                        </button>
                        <button class="btn btn-sm btn-outline-danger ms-2" id="deleteAllTimNotifications">
                            <i class="bi bi-trash"></i> Hapus Semua
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        if (notifications.length > 0) {
            modalContent += `
                <div class="notification-list-tim" style="max-height: 400px; overflow-y: auto;">
            `;
            
            notifications.forEach((notification, index) => {
                const isHighPriority = notification.priority === 'high';
                const isRead = notification.read;
                const bgClass = isHighPriority ? 'bg-danger bg-opacity-10' : (isRead ? 'bg-light' : 'bg-primary bg-opacity-10');
                const borderClass = isHighPriority ? 'border-danger' : (isRead ? 'border-light' : 'border-primary');
                
                modalContent += `
                    <div class="notification-item-tim border rounded p-3 mb-2 ${borderClass} ${bgClass}">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1 me-3">
                                <div class="d-flex align-items-center mb-1">
                                    ${this.getTimNotificationIcon(notification.notification_type || notification.type)}
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
                                    <button class="btn btn-sm btn-outline-success mark-as-read-tim me-1" data-id="${notification.id || index}">
                                        <i class="bi bi-check"></i> Tandai Dibaca
                                    </button>
                                ` : ''}
                                <button class="btn btn-sm btn-outline-danger delete-tim-notification" data-id="${notification.id || index}">
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
                    <i class="bi bi-truck fs-1 text-muted mb-3"></i>
                    <p class="text-muted">Tidak ada notifikasi</p>
                    <small class="text-muted">Notifikasi akan muncul di sini saat ada jadwal baru atau pembaruan</small>
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

    // Fungsi untuk setup event listeners di modal
    setupNotificationModalEventListeners() {
        // Setup event listeners untuk semua button di dalam modal
        // (sama seperti di showTimNotificationModal)
        setTimeout(() => {
            // Refresh button
            const refreshBtn = document.getElementById('refreshTimNotifications');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', async () => {
                    await this.refreshNotificationModal();
                });
            }
            
            // Mark all as read button
            const markAllBtn = document.getElementById('markAllAsReadTim');
            if (markAllBtn) {
                markAllBtn.addEventListener('click', async () => {
                    const success = await this.markAllTimNotificationsAsRead();
                    if (success) {
                        await this.refreshNotificationModal();
                    }
                });
            }
            
            // Delete all button
            const deleteAllBtn = document.getElementById('deleteAllTimNotifications');
            if (deleteAllBtn) {
                deleteAllBtn.addEventListener('click', async () => {
                    const success = await this.deleteAllTimNotifications();
                    if (success) {
                        await this.refreshNotificationModal();
                    }
                });
            }
            
            // Mark individual as read buttons
            document.querySelectorAll('.mark-as-read-tim').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const button = e.target.closest('.mark-as-read-tim');
                    const notificationId = button.dataset.id;
                    
                    button.disabled = true;
                    button.innerHTML = '<i class="bi bi-hourglass"></i> Memproses...';
                    
                    const success = await this.markTimNotificationAsRead(notificationId);
                    
                    if (success) {
                        // Refresh modal untuk update UI
                        await this.refreshNotificationModal();
                    } else {
                        button.disabled = false;
                        button.innerHTML = '<i class="bi bi-check"></i> Tandai Dibaca';
                        showToast('Gagal menandai notifikasi sebagai dibaca', 'error');
                    }
                });
            });
            
            // Delete individual notification buttons
            document.querySelectorAll('.delete-tim-notification').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const button = e.target.closest('.delete-tim-notification');
                    const notificationId = button.dataset.id;
                    
                    const confirmDelete = await this.showSingleDeleteConfirmationModal();
                    if (!confirmDelete) return;
                    
                    button.disabled = true;
                    button.innerHTML = '<i class="bi bi-hourglass"></i> Menghapus...';
                    
                    const success = await this.deleteTimNotification(notificationId);
                    
                    if (success) {
                        // Refresh modal untuk update UI
                        await this.refreshNotificationModal();
                    } else {
                        button.disabled = false;
                        button.innerHTML = '<i class="bi bi-trash"></i> Hapus';
                        showToast('Gagal menghapus notifikasi', 'error');
                    }
                });
            });
        }, 100);
    }

    // PERBAIKAN: Update fungsi markTimNotificationAsRead untuk menangani UI dengan benar
    async markTimNotificationAsRead(notificationId) {
        try {
            console.log(`📝 Marking tim notification ${notificationId} as read...`);
            
            // 1. Update di server jika ada
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
            
            // 2. Update state lokal
            if (this.unreadNotifications > 0) {
                this.unreadNotifications--;
            }
            
            console.log(`✅ Local: Notification ${notificationId} marked as read`);
            
            // 3. Update badge
            this.updateNotificationBadge();
            
            return true;
            
        } catch (error) {
            console.error('❌ Error marking tim notification as read:', error);
            
            // Fallback: Update lokal saja
            if (this.unreadNotifications > 0) {
                this.unreadNotifications--;
                this.updateNotificationBadge();
            }
            
            return false;
        }
    }

    // ==================== HELPER FUNCTIONS ====================

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
                tag: `tim-notification-${notification.id || Date.now()}`,
                requireInteraction: notification.priority === 'high',
                data: notification,
                silent: false
            };
            
            const desktopNotification = new Notification(
                `Tim Angkut - ${notification.title || 'Notifikasi'}`,
                options
            );
            
            desktopNotification.onclick = () => {
                window.focus();
                desktopNotification.close();
                this.showTimNotificationModal();
            };
            
            desktopNotification.onclose = () => {
                console.log('Desktop notification closed');
            };
            
            // Auto-close setelah 10 detik untuk non-high priority
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
                await this.checkForNewTimNotifications();
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 5 * 60 * 1000);
        
        console.log("🔄 Started tim notification polling (every 5 minutes)");
        
        // Initial check
        setTimeout(() => {
            this.checkForNewTimNotifications();
        }, 3000);
    }

    stopNotificationPolling() {
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
            this.notificationInterval = null;
            console.log("🛑 Stopped tim notification polling");
        }
    }

    getTimNotificationIcon(type) {
        const icons = {
            'schedule': '<i class="bi bi-calendar-check text-primary fs-5"></i>',
            'schedule_new': '<i class="bi bi-calendar-plus text-success fs-5"></i>',
            'schedule_reminder': '<i class="bi bi-alarm text-warning fs-5"></i>',
            'pickup_update': '<i class="bi bi-truck text-info fs-5"></i>',
            'alert': '<i class="bi bi-exclamation-triangle text-danger fs-5"></i>',
            'system': '<i class="bi bi-gear text-secondary fs-5"></i>',
            'test': '<i class="bi bi-bell text-muted fs-5"></i>',
            'payment': '<i class="bi bi-cash-coin text-success fs-5"></i>',
            'report': '<i class="bi bi-clipboard-data text-warning fs-5"></i>'
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

    getMockTimNotifications() {
        const now = new Date();
        return [
            {
                id: 1,
                title: 'Jadwal Pengangkutan Baru',
                message: 'Ada 3 lokasi baru untuk diangkut besok',
                notification_type: 'schedule_new',
                priority: 'high',
                read: false,
                created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
                data: { schedule_count: 3, date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
            },
            {
                id: 2,
                title: 'Anggota Menunggu',
                message: 'Anggota Pak Budi menunggu pengangkutan di Jl. Merdeka No. 10',
                notification_type: 'schedule_reminder',
                priority: 'normal',
                read: true,
                created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
                data: { anggota_name: 'Pak Budi', address: 'Jl. Merdeka No. 10', status: 'waiting' }
            },
            {
                id: 3,
                title: 'Laporan Sampah Baru',
                message: 'Ada laporan sampah baru di area operasional Anda',
                notification_type: 'report',
                priority: 'normal',
                read: false,
                created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
                data: { report_id: 45, address: 'Jl. Kebersihan No. 5', status: 'pending' }
            }
        ];
    }

    // ==================== DASHBOARD INTEGRATION ====================

    async setupDashboardIntegration() {
        try {
            console.log("🔧 Setting up tim dashboard integration...");
            
            // Inisialisasi notifikasi
            await this.initialize();
            
            // Setup event listeners untuk tombol
            this.setupEventListeners();
            
            // Update dropdown status
            await this.updateDropdownStatus();
            
            console.log("✅ Tim dashboard integration complete");
            
        } catch (error) {
            console.error('❌ Error setting up tim dashboard integration:', error);
        }
    }

    setupEventListeners() {
        console.log("🔗 Setting up tim event listeners...");
        
        // Tombol toggle notifications
        const toggleBtn = document.getElementById('tim-toggleNotificationsBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.toggleNotifications();
            });
            console.log("✅ Toggle button listener added");
        }
        
        // Tombol test notification
        const testBtn = document.getElementById('tim-testNotificationBtn');
        if (testBtn) {
            testBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.sendTimTestNotification();
            });
            console.log("✅ Test button listener added");
        }
        
        // Tombol show notification modal
        const showModalBtn = document.getElementById('tim-showNotificationsModal');
        if (showModalBtn) {
            showModalBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.showTimNotificationModal();
            });
            console.log("✅ Show modal button listener added");
        }
    }

    async updateDropdownStatus() {
        const dropdownStatus = document.getElementById('tim-notification-dropdown-status');
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

async checkTomorrowSchedule() {
    try {
        console.log("📅 Checking tomorrow's schedule for tim angkut...");
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role !== 'tim_angkut') {
            return 0;
        }
        
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Debug: Tampilkan waktu lokal
        console.log('🕐 Waktu sekarang (WITA):', now.toLocaleString('id-ID', { 
            timeZone: 'Asia/Makassar',
            hour12: false 
        }));
        
        // Format tanggal untuk API (gunakan format YYYY-MM-DD)
        const tomorrowFormatted = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
        
        console.log('📅 Tanggal besok untuk query:', tomorrowFormatted);
        
        // Query API untuk jadwal besok
        const response = await fetch(`${API.detailAnggotaJadwal}?tanggal_jadwal=${tomorrowFormatted}`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            console.error('❌ Failed to fetch schedule:', response.status);
            return 0;
        }
        
        const data = await response.json();
        const scheduleData = Array.isArray(data) ? data : [];
        
        // Filter manual untuk memastikan
        const filteredData = scheduleData.filter(item => {
            if (!item.tanggal_jadwal) return false;
            
            try {
                const itemDate = new Date(item.tanggal_jadwal);
                const itemDateStr = itemDate.toISOString().split('T')[0];
                return itemDateStr === tomorrowFormatted;
            } catch {
                return false;
            }
        });
        
        const scheduleCount = filteredData.length;
        console.log(`📊 Found ${scheduleCount} schedules for tomorrow`);
        
        if (scheduleCount > 0) {
            // Cek apakah sudah membuat notifikasi hari ini
            const notificationSent = await this.checkNotificationSentToday();
            
            // Tentukan waktu notifikasi
            const currentHourWITA = new Date().toLocaleTimeString('id-ID', {
                timeZone: 'Asia/Makassar',
                hour12: false,
                hour: '2-digit'
            }).split(':')[0];
            
            const currentMinute = new Date().getMinutes();
            const currentTime = parseInt(currentHourWITA) * 60 + currentMinute;
            
            // Notifikasi pertama: 07:00 WITA (pagi)
            // Notifikasi kedua: 17:00 WITA (sore)
            const firstNotificationTime = 7 * 60;   // 07:00
            const secondNotificationTime = 17 * 60; // 17:00
            
            console.log(`🕐 Waktu saat ini (WITA): ${currentHourWITA}:${currentMinute} (total menit: ${currentTime})`);
            
            // Cek apakah sudah lewat waktu notifikasi kedua
            if (currentTime >= secondNotificationTime) {
                console.log('✅ Sudah lewat waktu notifikasi kedua (17:00 WITA)');
                return scheduleCount;
            }
            
            // Cek apakah sudah lewat waktu notifikasi pertama
            if (currentTime >= firstNotificationTime) {
                if (!notificationSent.first) {
                    console.log('🕐 Waktu untuk notifikasi pertama (07:00 WITA)');
                    await this.createTomorrowScheduleNotification(scheduleCount, 'morning');
                    this.showDesktopScheduleNotification(scheduleCount, 'morning');
                    this.updateScheduleUI(scheduleCount);
                    return scheduleCount;
                } else {
                    console.log('✅ Notifikasi pertama sudah dikirim hari ini');
                }
            }
            
            // Cek apakah waktunya untuk notifikasi kedua
            if (currentTime >= secondNotificationTime - 30 && currentTime < secondNotificationTime + 30) {
                if (!notificationSent.second) {
                    console.log('🕐 Waktu untuk notifikasi kedua (17:00 WITA)');
                    await this.createTomorrowScheduleNotification(scheduleCount, 'evening');
                    this.showDesktopScheduleNotification(scheduleCount, 'evening');
                    this.updateScheduleUI(scheduleCount);
                    return scheduleCount;
                } else {
                    console.log('✅ Notifikasi kedua sudah dikirim hari ini');
                }
            }
            
            console.log('⏳ Belum waktunya untuk notifikasi jadwal besok');
            return scheduleCount;
            
        } else {
            // Tidak ada jadwal untuk besok
            console.log('📭 Tidak ada jadwal untuk besok');
            await this.clearScheduleNotifications();
            this.clearScheduleUI();
            return 0;
        }
        
    } catch (error) {
        console.error('❌ Error checking tomorrow schedule:', error);
        return 0;
    }
}

async checkNotificationSentToday() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const authHeaders = getAuthHeaders();
        
        const url = `${API.notifications}?user=${user.id}&notification_type=schedule`;
        const response = await fetch(url, {
            headers: authHeaders,
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            let notifications = [];
            
            if (Array.isArray(data)) {
                notifications = data;
            } else if (data && data.results) {
                notifications = data.results;
            }
            
            // Filter notifications yang dibuat hari ini dengan type 'tomorrow_schedule'
            const todayNotifications = notifications.filter(notification => {
                try {
                    const notificationDate = new Date(notification.created_at);
                    const notificationDateStr = notificationDate.toISOString().split('T')[0];
                    const notificationData = notification.data || {};
                    return notificationDateStr === today && 
                           notificationData.type === 'tomorrow_schedule';
                } catch {
                    return false;
                }
            });
            
            // Cek apakah ada notifikasi pagi dan sore
            const hasMorningNotification = todayNotifications.some(n => 
                (n.data || {}).time_of_day === 'morning'
            );
            const hasEveningNotification = todayNotifications.some(n => 
                (n.data || {}).time_of_day === 'evening'
            );
            
            return {
                first: hasMorningNotification,
                second: hasEveningNotification,
                count: todayNotifications.length
            };
        }
    } catch (error) {
        console.error('Error checking notification sent today:', error);
    }
    
    return { first: false, second: false, count: 0 };
}

async createTomorrowScheduleNotification(scheduleCount, timeOfDay = 'morning') {
    try {
        console.log(`📝 Creating ${timeOfDay} notification for ${scheduleCount} tomorrow schedules...`);
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role !== 'tim_angkut') {
            return false;
        }
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Format tanggal dalam bahasa Indonesia
        const tomorrowFormatted = tomorrow.toLocaleDateString('id-ID', {
            timeZone: 'Asia/Makassar',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Tentukan pesan berdasarkan waktu
        let title, message;
        const currentTimeWITA = new Date().toLocaleTimeString('id-ID', {
            timeZone: 'Asia/Makassar',
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
        
        if (timeOfDay === 'morning') {
            title = '📅 Jadwal Pengangkutan Besok (Pagi)';
            message = `Selamat pagi! Anda memiliki ${scheduleCount} jadwal pengangkutan untuk besok (${tomorrowFormatted}).`;
        } else {
            title = '📅 Jadwal Pengangkutan Besok (Sore)';
            message = `Selamat sore! Anda memiliki ${scheduleCount} jadwal pengangkutan untuk besok (${tomorrowFormatted}).`;
        }
        
        // Cek apakah notifikasi dengan waktu yang sama sudah ada hari ini
        const existingNotification = await this.checkExistingScheduleNotification(timeOfDay);
        
        if (existingNotification) {
            console.log(`⚠️ ${timeOfDay} schedule notification already exists for today, skipping...`);
            return false;
        }
        
        // Data notifikasi
        const notificationData = {
            user: user.id,
            title: title,
            message: message,
            notification_type: 'schedule',
            priority: scheduleCount > 5 ? 'high' : 'normal',
            read: false,
            url: '/tim-angkut/jadwal',
            data: {
                schedule_count: scheduleCount,
                schedule_date: tomorrow.toISOString().split('T')[0],
                date_string: tomorrowFormatted,
                notification_date: new Date().toISOString().split('T')[0],
                time_of_day: timeOfDay,
                type: 'tomorrow_schedule',
                created_at_wita: currentTimeWITA
            }
        };
        
        console.log('📤 Sending notification data:', notificationData);
        
        // Simpan ke database
        const created = await this.saveNotificationToDatabase(notificationData);
        
        if (created) {
            console.log(`✅ ${timeOfDay} schedule notification created successfully`);
            return true;
        } else {
            console.error(`❌ Failed to create ${timeOfDay} notification`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Error creating ${timeOfDay} schedule notification:`, error);
        return false;
    }
}

async checkExistingScheduleNotification(timeOfDay) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const authHeaders = getAuthHeaders();
        
        const url = `${API.notifications}?user=${user.id}&notification_type=schedule`;
        const response = await fetch(url, {
            headers: authHeaders,
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            let notifications = [];
            
            if (Array.isArray(data)) {
                notifications = data;
            } else if (data && data.results) {
                notifications = data.results;
            }
            
            // Cari notifikasi dengan time_of_day yang sama hari ini
            return notifications.find(notification => {
                try {
                    const notificationDate = new Date(notification.created_at);
                    const notificationDateStr = notificationDate.toISOString().split('T')[0];
                    const notificationData = notification.data || {};
                    return notificationDateStr === today && 
                           notificationData.time_of_day === timeOfDay &&
                           notificationData.type === 'tomorrow_schedule';
                } catch {
                    return false;
                }
            });
        }
    } catch (error) {
        console.error('Error checking existing schedule notification:', error);
    }
    return null;
}

async saveNotificationToDatabase(notificationData) {
    try {
        const authHeaders = getAuthHeaders();
        
        let apiEndpoint = API.notifications;
        if (!apiEndpoint) {
            console.error('Notification API endpoint not configured');
            return false;
        }
        
        if (!apiEndpoint.endsWith('/')) {
            apiEndpoint += '/';
        }
        
        console.log('📤 Saving notification to:', apiEndpoint);
        
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                ...authHeaders,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(notificationData),
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Notification saved to database:', result.id);
            return true;
        } else {
            const errorText = await response.text();
            console.error('❌ Failed to save notification:', response.status, errorText);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error saving notification to database:', error);
        return false;
    }
}

showDesktopScheduleNotification(count, timeOfDay = 'morning') {
    if (!('Notification' in window)) {
        console.log('⚠️ Desktop notifications not supported');
        return;
    }
    
    if (Notification.permission !== 'granted') {
        console.log('⚠️ Notification permission not granted');
        return;
    }
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tomorrowFormatted = tomorrow.toLocaleDateString('id-ID', {
        timeZone: 'Asia/Makassar',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    let bodyMessage;
    if (timeOfDay === 'morning') {
        bodyMessage = `Selamat pagi! Anda memiliki ${count} jadwal pengangkutan untuk besok (${tomorrowFormatted}).`;
    } else {
        bodyMessage = `Selamat sore! Anda memiliki ${count} jadwal pengangkutan untuk besok (${tomorrowFormatted}).`;
    }
    
    const options = {
        body: bodyMessage,
        icon: '/static/icon-192x192.png',
        badge: '/static/icon-72x72.png',
        tag: `tomorrow-schedule-${timeOfDay}-${new Date().toISOString().split('T')[0]}`,
        requireInteraction: true,
        silent: false,
        timestamp: Date.now()
    };
    
    const notification = new Notification(`📅 Jadwal Besok (${timeOfDay === 'morning' ? 'Pagi' : 'Sore'})`, options);
    
    notification.onclick = () => {
        window.focus();
        notification.close();
        // Redirect ke halaman jadwal
        window.location.href = '/tim-angkut/jadwal';
    };
    
    // Auto close setelah 30 detik
    setTimeout(() => {
        notification.close();
    }, 30000);
    
    return notification;
}

updateScheduleUI(count) {
    // Update elemen UI dengan jumlah jadwal
    const scheduleElement = document.getElementById('tomorrowScheduleCount');
    if (scheduleElement) {
        scheduleElement.textContent = count;
        scheduleElement.classList.remove('d-none');
    }
    
    // Update badge notifikasi
    const badgeElement = document.getElementById('scheduleBadge');
    if (badgeElement) {
        if (count > 0) {
            badgeElement.textContent = count;
            badgeElement.classList.remove('d-none');
        } else {
            badgeElement.classList.add('d-none');
        }
    }
    
    // Update text info
    const infoElement = document.getElementById('scheduleInfo');
    if (infoElement) {
        const currentTimeWITA = new Date().toLocaleTimeString('id-ID', {
            timeZone: 'Asia/Makassar',
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
        
        if (count > 0) {
            infoElement.textContent = `📅 ${count} jadwal besok (diperbarui ${currentTimeWITA} WITA)`;
            infoElement.classList.remove('text-muted');
            infoElement.classList.add('text-success');
        } else {
            infoElement.textContent = '📅 Tidak ada jadwal untuk besok';
            infoElement.classList.remove('text-success');
            infoElement.classList.add('text-muted');
        }
    }
}

// Helper function untuk clear UI
clearScheduleUI() {
    const scheduleElement = document.getElementById('tomorrowScheduleCount');
    if (scheduleElement) {
        scheduleElement.classList.add('d-none');
    }
    
    const badgeElement = document.getElementById('scheduleBadge');
    if (badgeElement) {
        badgeElement.classList.add('d-none');
    }
    
    const infoElement = document.getElementById('scheduleInfo');
    if (infoElement) {
        infoElement.textContent = '📅 Tidak ada jadwal untuk besok';
        infoElement.classList.remove('text-success');
        infoElement.classList.add('text-muted');
    }
}

////// Battassjajajj

async clearScheduleNotifications() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const authHeaders = getAuthHeaders();
        
        const url = `${API.notifications}?user=${user.id}&notification_type=schedule`;
        const response = await fetch(url, {
            headers: authHeaders,
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            let notifications = [];
            
            if (Array.isArray(data)) {
                notifications = data;
            } else if (data && data.results) {
                notifications = data.results;
            }
            
            // Filter notifications hari ini dengan type 'tomorrow_schedule'
            const todayNotifications = notifications.filter(notification => {
                try {
                    const notificationDate = new Date(notification.created_at);
                    const notificationDateStr = notificationDate.toISOString().split('T')[0];
                    const notificationData = notification.data || {};
                    return notificationDateStr === today && 
                           notificationData.type === 'tomorrow_schedule';
                } catch {
                    return false;
                }
            });
            
            // Hapus notifikasi yang ditemukan
            for (const notification of todayNotifications) {
                try {
                    await this.deleteTimNotification(notification.id);
                } catch (error) {
                    console.warn(`Failed to delete schedule notification ${notification.id}:`, error.message);
                }
            }
            
            console.log(`🗑️ Cleared ${todayNotifications.length} schedule notifications for today`);
        }
    } catch (error) {
        console.error('Error clearing schedule notifications:', error);
    }
}

async setupScheduleChecker() {
    try {
        console.log("🔄 Setting up schedule checker...");
        
        // Cek sekarang juga
        setTimeout(async () => {
            await this.checkTomorrowSchedule();
        }, 3000);
        
        // Cek setiap 30 menit untuk memastikan tidak ketinggalan
        setInterval(async () => {
            await this.checkTomorrowSchedule();
        }, 30 * 60 * 1000); // 30 menit
        
        // Cek khusus pada jam 07:00 dan 17:00 WITA
        this.setupExactTimeScheduleChecker();
        
        console.log("✅ Schedule checker initialized");
        
    } catch (error) {
        console.error('❌ Error setting up schedule checker:', error);
    }
}

setupExactTimeScheduleChecker() {
    // Hitung waktu hingga jam 07:00 dan 17:00 WITA berikutnya
    const now = new Date();
    const nowWITA = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Makassar' }));
    
    // Jam target: 07:00 dan 17:00
    const targetTimes = [7, 17];
    
    targetTimes.forEach(targetHour => {
        const targetTime = new Date(nowWITA);
        targetTime.setHours(targetHour, 0, 0, 0);
        
        // Jika sudah lewat hari ini, set untuk besok
        if (targetTime <= nowWITA) {
            targetTime.setDate(targetTime.getDate() + 1);
        }
        
        const timeUntilTarget = targetTime.getTime() - nowWITA.getTime();
        
        console.log(`⏰ Akan cek jadwal pada ${targetHour}:00 WITA dalam ${Math.round(timeUntilTarget / 1000 / 60)} menit`);
        
        setTimeout(async () => {
            console.log(`🕐 Waktunya cek jadwal! (${targetHour}:00 WITA)`);
            await this.checkTomorrowSchedule();
            
            // Set interval untuk hari berikutnya
            setInterval(async () => {
                console.log(`🕐 Waktunya cek jadwal harian! (${targetHour}:00 WITA)`);
                await this.checkTomorrowSchedule();
            }, 24 * 60 * 60 * 1000); // 24 jam
        }, timeUntilTarget);
    });
}
}

// Export singleton instance
export const timNotifications = new TimNotifications();