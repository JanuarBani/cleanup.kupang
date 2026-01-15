// public/service-worker.js

const CACHE_NAME = 'sampah-app-v1';

// ===============================
// 🔔 PUSH NOTIFICATION HANDLER
// ===============================
self.addEventListener('push', event => {
    let data = {};

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { body: event.data.text() };
        }
    }

    const title = data.title || 'Notifikasi';
    const options = {
        body: data.body || '',
        icon: data.icon || '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        data: data.data || {},
        vibrate: [100, 50, 100],
        actions: [
            { action: 'open', title: 'Buka' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// ===============================
// 👉 KLIK NOTIFIKASI
// ===============================
self.addEventListener('notificationclick', event => {
    event.notification.close();

    const url = event.notification.data?.url || '/dashboard';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                for (const client of clientList) {
                    if (client.url.includes(url) && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

// ===============================
// 🔄 SUBSCRIPTION CHANGE
// ===============================
self.addEventListener('pushsubscriptionchange', event => {
    console.log('🔄 Push subscription changed');

    event.waitUntil(
        self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: self.VAPID_PUBLIC_KEY
        }).then(subscription => {
            const key = subscription.getKey('p256dh');
            const auth = subscription.getKey('auth');

            const subscriptionData = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
                    auth: btoa(String.fromCharCode(...new Uint8Array(auth)))
                }
            };

            return fetch('/api/push-subscriptions/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscriptionData),
                credentials: 'include'
            });
        }).catch(err => {
            console.error('❌ Subscription update failed:', err);
        })
    );
});
