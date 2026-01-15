// src/pages/anggota/notificationSettings.js
import webPushManager from '../../utils/webPush.js';
import { showToast } from '../../utils/toast.js';

export function renderNotificationSettings() {
    return `
        <div class="notification-settings">
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i>
                Aktifkan notifikasi untuk mendapatkan update status pembayaran dan jadwal pengangkutan secara real-time.
            </div>
            
            <div class="mb-4">
                <h6>Status Notifikasi</h6>
                <div class="d-flex align-items-center mb-3">
                    <span id="notification-status-badge" class="badge bg-secondary me-2">
                        Memeriksa...
                    </span>
                    <span id="notification-status-text">
                        Memuat status notifikasi...
                    </span>
                </div>
                
                <div id="browser-support" class="alert alert-warning d-none">
                    <i class="bi bi-exclamation-triangle"></i>
                    Browser Anda tidak mendukung notifikasi push.
                </div>
                
                <div id="permission-denied" class="alert alert-danger d-none">
                    <i class="bi bi-x-circle"></i>
                    Izin notifikasi ditolak. Harap aktifkan manual di pengaturan browser.
                </div>
            </div>
            
            <div class="mb-4">
                <h6>Jenis Notifikasi</h6>
                <div class="list-group">
                    <div class="list-group-item">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="payment-notifications" checked disabled>
                            <label class="form-check-label" for="payment-notifications">
                                Update Status Pembayaran
                            </label>
                            <small class="text-muted d-block">Notifikasi ketika status pembayaran diperbarui</small>
                        </div>
                    </div>
                    <div class="list-group-item">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="pickup-notifications" checked disabled>
                            <label class="form-check-label" for="pickup-notifications">
                                Update Status Pengangkutan
                            </label>
                            <small class="text-muted d-block">Notifikasi ketika jadwal pengangkutan diperbarui</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="d-flex gap-2 flex-wrap">
                <button id="enable-notifications-btn" class="btn btn-primary">
                    <i class="bi bi-bell"></i> Aktifkan Notifikasi
                </button>
                <button id="disable-notifications-btn" class="btn btn-outline-danger d-none">
                    <i class="bi bi-bell-slash"></i> Nonaktifkan Notifikasi
                </button>
                <button id="test-notification-btn" class="btn btn-outline-secondary">
                    <i class="bi bi-bell"></i> Test Notifikasi
                </button>
                <button id="refresh-status-btn" class="btn btn-outline-info">
                    <i class="bi bi-arrow-clockwise"></i> Refresh Status
                </button>
            </div>
            
            <div class="mt-4">
                <small class="text-muted">
                    <i class="bi bi-shield-check"></i>
                    Data notifikasi Anda disimpan dengan aman dan dapat diubah kapan saja.
                </small>
            </div>
        </div>
    `;
}

export async function setupNotificationSettings() {
    await initializeWebPush();
    
    document.getElementById('enable-notifications-btn')?.addEventListener('click', enableNotifications);
    document.getElementById('disable-notifications-btn')?.addEventListener('click', disableNotifications);
    document.getElementById('test-notification-btn')?.addEventListener('click', testNotification);
    document.getElementById('refresh-status-btn')?.addEventListener('click', refreshStatus);
}

async function initializeWebPush() {
    if (!webPushManager.isSupported) {
        document.getElementById('browser-support')?.classList.remove('d-none');
        document.getElementById('enable-notifications-btn')?.setAttribute('disabled', 'true');
        updateStatusUI('not-supported', 'Browser tidak mendukung notifikasi push');
        return;
    }
    
    try {
        await webPushManager.initialize();
        
        const isSubscribed = await webPushManager.checkSubscription();
        
        updateStatusUI(isSubscribed ? 'subscribed' : 'unsubscribed');
        
        if (Notification.permission === 'denied') {
            document.getElementById('permission-denied')?.classList.remove('d-none');
            document.getElementById('enable-notifications-btn')?.setAttribute('disabled', 'true');
        }
        
    } catch (error) {
        updateStatusUI('error', 'Gagal memuat status notifikasi');
    }
}

function updateStatusUI(status, message = '') {
    const badge = document.getElementById('notification-status-badge');
    const text = document.getElementById('notification-status-text');
    const enableBtn = document.getElementById('enable-notifications-btn');
    const disableBtn = document.getElementById('disable-notifications-btn');
    
    if (!badge || !text) return;
    
    switch (status) {
        case 'subscribed':
            badge.className = 'badge bg-success me-2';
            badge.textContent = 'Aktif';
            text.textContent = 'Notifikasi telah diaktifkan';
            enableBtn?.classList.add('d-none');
            disableBtn?.classList.remove('d-none');
            break;
            
        case 'unsubscribed':
            badge.className = 'badge bg-secondary me-2';
            badge.textContent = 'Nonaktif';
            text.textContent = 'Notifikasi belum diaktifkan';
            enableBtn?.classList.remove('d-none');
            disableBtn?.classList.add('d-none');
            break;
            
        case 'not-supported':
            badge.className = 'badge bg-warning me-2';
            badge.textContent = 'Tidak Didukung';
            text.textContent = message || 'Browser tidak mendukung';
            break;
            
        case 'error':
            badge.className = 'badge bg-danger me-2';
            badge.textContent = 'Error';
            text.textContent = message || 'Terjadi kesalahan';
            break;
            
        default:
            badge.className = 'badge bg-secondary me-2';
            badge.textContent = 'Memeriksa...';
            text.textContent = 'Memuat status notifikasi...';
    }
}

async function enableNotifications() {
    const enableBtn = document.getElementById('enable-notifications-btn');
    const originalText = enableBtn?.innerHTML;
    
    try {
        if (enableBtn) {
            enableBtn.disabled = true;
            enableBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Memproses...';
        }
        
        const result = await webPushManager.enableNotifications();
        
        if (result.success) {
            showToast('success', result.message);
            updateStatusUI('subscribed');
            
            const webPushStatus = document.getElementById('webpush-status');
            if (webPushStatus) {
                webPushStatus.innerHTML = `
                    <span class="badge bg-success">
                        <i class="bi bi-check-circle"></i> Notifikasi aktif
                    </span>
                `;
            }
        } else {
            showToast('error', result.message);
            
            if (result.message.includes('ditolak')) {
                document.getElementById('permission-denied')?.classList.remove('d-none');
            }
        }
        
    } catch (error) {
        showToast('error', 'Gagal mengaktifkan notifikasi');
    } finally {
        if (enableBtn) {
            enableBtn.disabled = false;
            enableBtn.innerHTML = originalText;
        }
    }
}

async function disableNotifications() {
    const disableBtn = document.getElementById('disable-notifications-btn');
    const originalText = disableBtn?.innerHTML;
    
    try {
        if (disableBtn) {
            disableBtn.disabled = true;
            disableBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Memproses...';
        }
        
        const result = await webPushManager.disableNotifications();
        
        if (result.success) {
            showToast('success', result.message);
            updateStatusUI('unsubscribed');
            
            const webPushStatus = document.getElementById('webpush-status');
            if (webPushStatus) {
                webPushStatus.innerHTML = `
                    <span class="badge bg-secondary">
                        <i class="bi bi-bell-slash"></i> Notifikasi nonaktif
                    </span>
                `;
            }
        } else {
            showToast('error', result.message);
        }
        
    } catch (error) {
        showToast('error', 'Gagal menonaktifkan notifikasi');
    } finally {
        if (disableBtn) {
            disableBtn.disabled = false;
            disableBtn.innerHTML = originalText;
        }
    }
}

async function testNotification() {
    const testBtn = document.getElementById('test-notification-btn');
    const originalText = testBtn?.innerHTML;
    
    try {
        if (testBtn) {
            testBtn.disabled = true;
            testBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mengirim...';
        }
        
        const isSubscribed = await webPushManager.checkSubscription();
        
        if (!isSubscribed) {
            showToast('warning', 'Harap aktifkan notifikasi terlebih dahulu');
            return;
        }
        
        const result = await webPushManager.sendTestNotification();
        
        if (result.success) {
            showToast('success', result.message);
        } else {
            showToast('error', result.message);
        }
        
    } catch (error) {
        showToast('error', 'Gagal mengirim notifikasi test');
    } finally {
        if (testBtn) {
            testBtn.disabled = false;
            testBtn.innerHTML = originalText;
        }
    }
}

async function refreshStatus() {
    const refreshBtn = document.getElementById('refresh-status-btn');
    const originalText = refreshBtn?.innerHTML;
    
    try {
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Memuat...';
        }
        
        await initializeWebPush();
        showToast('success', 'Status notifikasi diperbarui');
        
    } catch (error) {
        showToast('error', 'Gagal memuat status');
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = originalText;
        }
    }
}