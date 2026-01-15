// src/utils/webPush.js
import { API, getAuthHeaders } from '../api.js';
import { showToast } from './toast.js';

class WebPushManager {
    constructor() {
        this.publicKey = null;
        this.isSubscribed = false;
        this.registration = null;
        this.subscription = null;
        
        // Check browser support
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    }

    // Convert VAPID key untuk browser
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Request permission untuk notifications
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            throw new Error('Browser ini tidak mendukung notifikasi');
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            throw new Error('Izin notifikasi telah ditolak. Harap aktifkan manual di pengaturan browser.');
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    // Register service worker
    // Register service worker
    async registerServiceWorker() {
        if (!this.isSupported) {
            throw new Error('Browser ini tidak mendukung Service Worker');
        }

        try {
            // Cek apakah sudah ada registration yang aktif
            if (navigator.serviceWorker.controller) {
                console.log('Service Worker sudah aktif');
                this.registration = await navigator.serviceWorker.getRegistration();
                return this.registration;
            }

            // Register service worker dari root
            this.registration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            });
            
            console.log('Service Worker registered:', this.registration);
            
            // Tunggu hingga service worker aktif dengan pendekatan yang lebih aman
            if (this.registration.active) {
                console.log('Service Worker aktif');
                return this.registration;
            }
            
            // Gunakan pendekatan yang lebih robust untuk menunggu aktivasi
            const sw = this.registration.installing || this.registration.waiting || this.registration.active;
            
            if (sw) {
                await new Promise((resolve, reject) => {
                    // Handler untuk state change
                    const stateChangeHandler = () => {
                        console.log('Service Worker state:', sw.state);
                        
                        if (sw.state === 'activated') {
                            sw.removeEventListener('statechange', stateChangeHandler);
                            resolve();
                        } else if (sw.state === 'redundant') {
                            sw.removeEventListener('statechange', stateChangeHandler);
                            reject(new Error('Service Worker menjadi redundant'));
                        }
                    };
                    
                    sw.addEventListener('statechange', stateChangeHandler);
                    
                    // Jika sudah activated, langsung resolve
                    if (sw.state === 'activated') {
                        resolve();
                    }
                    
                    // Timeout untuk mencegah infinite waiting
                    setTimeout(() => {
                        sw.removeEventListener('statechange', stateChangeHandler);
                        reject(new Error('Timeout menunggu Service Worker aktif'));
                    }, 10000); // 10 detik timeout
                });
            } else {
                console.warn('Tidak ada Service Worker instance yang ditemukan');
            }
            
            return this.registration;
        } catch (error) {
            console.error('Gagal register Service Worker:', error);
            throw error;
        }
    }

    // Get VAPID public key dari server
    async getPublicKey() {
    // Return cached key jika sudah ada
    if (this.publicKey) {
        console.log('📋 Using cached VAPID key');
        return this.publicKey;
    }
    
    try {
        console.log('🔑 Fetching VAPID key...');
        
        // Daftar endpoint yang akan dicoba (dengan prioritas)
        const endpoints = [
            {
                url: API.vapidKeyPublic,  // 1. Public endpoint (/api/vapid-key/)
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                requiresAuth: false,
                description: 'Public VAPID endpoint'
            },
            {
                url: API.pushSubscriptionsVapidKey,  // 2. Viewset endpoint
                method: 'GET', 
                headers: { 'Content-Type': 'application/json' },
                requiresAuth: true,
                description: 'PushSubscription viewset endpoint'
            },
            {
                url: API.pushSubscriptionsVapidKey,  // 3. Coba tanpa auth juga
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                requiresAuth: false,
                description: 'Viewset endpoint without auth'
            }
        ];
        
        let response = null;
        let successfulEndpoint = null;
        let errorLogs = [];
        
        // Coba setiap endpoint
        for (const endpoint of endpoints) {
            try {
                console.log(`   Trying: ${endpoint.description} (${endpoint.url})`);
                
                // Siapkan headers
                let headers = { ...endpoint.headers };
                if (endpoint.requiresAuth) {
                    const authHeaders = getAuthHeaders();
                    headers = { ...headers, ...authHeaders };
                }
                
                // Buat request
                response = await fetch(endpoint.url, {
                    method: endpoint.method,
                    headers: headers,
                    credentials: endpoint.requiresAuth ? 'include' : 'omit'
                });
                
                console.log(`   Response: ${response.status} ${response.statusText}`);
                
                if (response.ok) {
                    successfulEndpoint = endpoint;
                    console.log(`✅ Success with: ${endpoint.description}`);
                    break;
                } else {
                    // Simpan error untuk debugging
                    const errorText = await response.text();
                    errorLogs.push({
                        endpoint: endpoint.url,
                        status: response.status,
                        error: errorText.substring(0, 100)
                    });
                    console.log(`   Failed: ${response.status} - ${errorText.substring(0, 50)}...`);
                }
                
            } catch (error) {
                errorLogs.push({
                    endpoint: endpoint.url,
                    error: error.message
                });
                console.log(`   Error: ${error.message}`);
                continue;
            }
        }
        
        // Jika semua endpoint gagal
        if (!response || !response.ok) {
            console.warn('⚠️ All VAPID endpoints failed:', errorLogs);
            
            // Coba fallback URL langsung ke localhost
            try {
                console.log('🔄 Trying direct localhost URL...');
                const directUrl = 'http://127.0.0.1:8000/api/vapid-key/';
                response = await fetch(directUrl, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (response.ok) {
                    console.log('✅ Success with direct URL');
                } else {
                    throw new Error(`Direct URL failed: ${response.status}`);
                }
            } catch (directError) {
                console.log('❌ Direct URL also failed');
                
                // Gunakan hardcoded fallback key
                console.log('🔄 Using hardcoded fallback VAPID key');
                this.publicKey = this.FALLBACK_PUBLIC_KEY;
                
                // Simpan di localStorage untuk cache
                localStorage.setItem('vapid_public_key', this.publicKey);
                
                return this.publicKey;
            }
        }
        
        // Parse response
        const data = await response.json();
        console.log('📊 VAPID response:', data);
        
        // Extract key dari berbagai format response
        let key = null;
        if (data.public_key) {
            key = data.public_key;
        } else if (data.publicKey) {
            key = data.publicKey;
        } else if (data.key) {
            key = data.key;
        } else if (typeof data === 'string') {
            key = data;
        } else if (data.public_key_base64) {
            key = data.public_key_base64;
        } else {
            console.error('❌ Unknown VAPID key format:', data);
            throw new Error('Format VAPID key tidak dikenal dalam response');
        }
        
        if (!key) {
            throw new Error('Public key tidak ditemukan dalam response');
        }
        
        // Validasi key
        key = key.trim();
        if (key.length < 80 || key.length > 100) {
            console.warn(`⚠️ VAPID key length suspicious: ${key.length} chars`);
        }
        
        // Simpan key
        this.publicKey = key;
        console.log(`✅ VAPID public key berhasil didapatkan (${key.length} chars)`);
        
        // Cache di localStorage untuk future use
        localStorage.setItem('vapid_public_key', key);
        localStorage.setItem('vapid_source', successfulEndpoint?.url || 'unknown');
        
        return this.publicKey;
        
    } catch (error) {
        console.error('❌ Gagal mendapatkan VAPID public key:', error);
        
        // Coba gunakan cached key dari localStorage
        try {
            const cachedKey = localStorage.getItem('vapid_public_key');
            if (cachedKey && cachedKey.length > 80) {
                console.log('🔄 Using cached VAPID key from localStorage');
                this.publicKey = cachedKey;
                return this.publicKey;
            }
        } catch (cacheError) {
            console.log('   Could not read from localStorage');
        }
        
        // Terakhir, gunakan fallback hardcoded
        console.log('🔄 Using hardcoded fallback VAPID key');
        this.publicKey = this.FALLBACK_PUBLIC_KEY;
        
        return this.publicKey;
    }
}

    // Subscribe ke push notifications
    async subscribe() {
        if (!this.registration) {
            await this.registerServiceWorker();
        }

        const publicKey = await this.getPublicKey();
        
        try {
            this.subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(publicKey)
            });

            return this.subscription;
        } catch (error) {
            console.error('Gagal subscribe push notifications:', error);
            
            // Fallback untuk browser yang membutuhkan user gesture
            if (error.name === 'NotAllowedError') {
                throw new Error('Izin ditolak. Harap aktifkan notifikasi di pengaturan browser.');
            }
            
            throw error;
        }
    }

    // Helper function untuk convert subscription ke format yang bisa dikirim
    convertSubscriptionToData(subscription) {
        const p256dh = subscription.getKey('p256dh');
        const auth = subscription.getKey('auth');

        return {
            endpoint: subscription.endpoint,
            p256dh: p256dh
                ? btoa(String.fromCharCode(...new Uint8Array(p256dh)))
                : null,
            auth: auth
                ? btoa(String.fromCharCode(...new Uint8Array(auth)))
                : null
        };
    }


    // Save subscription ke server
    async saveSubscription(subscription) {
        const p256dh = subscription.getKey('p256dh');
        const auth = subscription.getKey('auth');

        if (!p256dh || !auth) {
            console.warn('❌ Subscription key tidak lengkap, batal simpan');
            return false;
        }

        const payload = {
            endpoint: subscription.endpoint,
            p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
            auth: btoa(String.fromCharCode(...new Uint8Array(auth)))
        };

        const response = await fetch(API.pushSubscriptions, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gagal menyimpan subscription: ${response.status} - ${errorText}`);
        }

        console.log('✅ Subscription berhasil disimpan');
        return true;
    }

    // Get all subscriptions untuk user saat ini
    async getSubscriptions() {
        try {
            const response = await fetch(API.pushSubscriptions, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Gagal mendapatkan subscriptions: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Gagal mendapatkan subscriptions:', error);
            throw error;
        }
    }

    // Unsubscribe dari push notifications
    async unsubscribe() {
        if (!this.registration) return;

        const subscription = await this.registration.pushManager.getSubscription();
        if (subscription) {
            await subscription.unsubscribe();
            
            // Hapus dari server
            try {
                // Ambil semua subscriptions
                const subscriptions = await this.getSubscriptions();
                
                // Cari subscription yang sesuai
                const currentSubscription = subscriptions.find(sub => 
                    sub.endpoint === subscription.endpoint
                );
                
                if (currentSubscription) {
                    const response = await fetch(`${API.pushSubscriptions}${currentSubscription.id}/`, {
                        method: 'DELETE',
                        headers: getAuthHeaders()
                    });

                    if (!response.ok) {
                        console.warn('Gagal menghapus subscription dari server:', response.status);
                    }
                }
            } catch (error) {
                console.error('Gagal menghapus subscription dari server:', error);
            }
            
            this.subscription = null;
            this.isSubscribed = false;
        }
    }

    // Check subscription status
    async checkSubscription() {
        if (!this.registration) {
            return false;
        }
        
        const subscription = await this.registration.pushManager.getSubscription();
        this.subscription = subscription;
        this.isSubscribed = !!subscription;
        return this.isSubscribed;
    }

    // Initialize web push
    async initialize() {
        if (!this.isSupported) {
            console.log('Web push tidak didukung di browser ini');
            return false;
        }

        try {
            // Register service worker
            await this.registerServiceWorker();
            
            // Check existing subscription
            await this.checkSubscription();
            
            // Jika sudah subscribed, update ke server
            if (this.isSubscribed && this.subscription) {
                try {
                    await this.saveSubscription(this.subscription);
                } catch (error) {
                    console.warn('Gagal update subscription ke server:', error);
                }
            }
            
            console.log('Web Push initialized. Subscribed:', this.isSubscribed);
            return true;
        } catch (error) {
            console.error('Gagal initialize web push:', error);
            return false;
        }
    }

    // Enable notifications (untuk dipanggil dari UI)
    async enableNotifications() {
        try {
            // Request permission
            const hasPermission = await this.requestNotificationPermission();
            if (!hasPermission) {
                throw new Error('Izin notifikasi ditolak');
            }

            // Subscribe
            const subscription = await this.subscribe();
            
            // Save to server
            await this.saveSubscription(subscription);
            
            this.isSubscribed = true;
            this.subscription = subscription;
            
            return {
                success: true,
                message: 'Notifikasi berhasil diaktifkan'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Disable notifications
    async disableNotifications() {
        try {
            await this.unsubscribe();
            this.isSubscribed = false;
            
            return {
                success: true,
                message: 'Notifikasi berhasil dinonaktifkan'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Send test notification
    async sendTestNotification() {
        try {
            // Periksa apakah sudah subscribe
            const isSubscribed = await this.checkSubscription();
            if (!isSubscribed) {
                return {
                    success: false,
                    message: 'Anda belum berlangganan notifikasi. Silakan aktifkan terlebih dahulu.'
                };
            }
            
            console.log('🧪 Sending test notification...');
            
            // Dapatkan auth headers
            const authHeaders = getAuthHeaders();
            
            // Cek apakah ada token
            if (!authHeaders.Authorization && !authHeaders['X-CSRFToken']) {
                console.warn('⚠️ No authentication credentials found');
                return {
                    success: false,
                    message: 'Sesi login telah habis. Silakan login ulang.'
                };
            }
            
            console.log('📤 Sending request to:', API.pushSubscriptionsTest);
            console.log('🔑 Auth headers:', authHeaders);
            
            const response = await fetch(API.pushSubscriptionsTest, {
                method: 'POST',
                headers: {
                    ...authHeaders,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: 'Test Notifikasi - Admin',
                    body: 'Ini adalah notifikasi test dari panel admin CleanUp',
                    type: 'test',
                    icon: '/icon-192.png',
                    badge: '/badge-72.png',
                    timestamp: new Date().toISOString()
                }),
                credentials: 'include'
            });

            console.log('📥 Test notification response status:', response.status);
            
            // Baca response sebelum memeriksa status
            let responseData;
            try {
                const responseText = await response.text();
                console.log('📋 Response text:', responseText);
                
                if (responseText) {
                    responseData = JSON.parse(responseText);
                }
            } catch (parseError) {
                console.error('❌ Cannot parse response:', parseError);
            }
            
            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: Gagal mengirim test notification`;
                
                if (responseData) {
                    if (responseData.message) {
                        errorMessage = responseData.message;
                    } else if (responseData.detail) {
                        errorMessage = responseData.detail;
                    }
                }
                
                // Tambahkan debugging info
                if (response.status === 500) {
                    errorMessage += ' (Server error - check Django logs)';
                }
                
                throw new Error(errorMessage);
            }

            console.log('✅ Test notification response:', responseData);
            
            // Tampilkan notifikasi lokal juga
            if (Notification.permission === 'granted' && responseData && responseData.success) {
                const notification = new Notification('✅ Test Berhasil - CleanUp Admin', {
                    body: 'Notifikasi test berhasil dikirim!',
                    icon: '/icon-192.png',
                    badge: '/badge-72.png',
                    tag: 'test-notification-success'
                });
                
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
            }
            
            return {
                success: true,
                message: responseData?.message || 'Notifikasi test berhasil dikirim',
                data: responseData
            };
            
        } catch (error) {
            console.error('❌ Error sending test notification:', error);
            return {
                success: false,
                message: error.message || 'Gagal mengirim notifikasi test'
            };
        }
    }

    // Check if user has subscription
    async hasSubscription() {
        try {
            const subscriptions = await this.getSubscriptions();
            return subscriptions.length > 0;
        } catch (error) {
            console.error('Error checking subscription:', error);
            return false;
        }
    }

    // Setup event listener untuk push messages
    setupPushEventListener() {
        if (!this.registration) return;

        // Listen for push events
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
                this.handleNotificationClick(event.data);
            }
        });
    }

    handleNotificationClick(data) {
        console.log('Notification clicked:', data);
        
        // Navigate based on notification type
        switch (data.type) {
            case 'payment_update':
                window.location.href = `/pembayaran/${data.pembayaran_id || ''}`;
                break;
            case 'pickup_update':
                window.location.href = `/jadwal/${data.jadwal_id || ''}`;
                break;
            default:
                window.location.href = data.url || '/';
        }
    }
}

// Buat global instance
const webPushManager = new WebPushManager();

export default webPushManager;