import { registerSW } from "virtual:pwa-register";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

// expose ke global (WAJIB supaya bisa dipakai di users.js)
window.L = L;

registerSW({
  immediate: true,
});


console.log("🚀 MAIN.JS STARTING...");

// Update loading status if function exists
if (typeof updateStatus === 'function') {
    updateStatus('Loading application...');
}

// Import router dengan error handling
let router;

async function loadRouter() {
    try {
        console.log("📦 Importing router...");
        const module = await import("./router.js");
        router = module.router;
        console.log("✅ Router imported");
        
        if (typeof updateStatus === 'function') {
            updateStatus('Router loaded');
        }
    } catch (error) {
        console.error("❌ Failed to import router:", error);
        
        // Show error to user
        document.getElementById("app").innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <h1 style="color: #f44336;">Application Error</h1>
                <p>Failed to load application modules.</p>
                <p><strong>Error:</strong> ${error.message}</p>
                <div style="margin-top: 20px;">
                    <button onclick="window.location.reload()">Reload Application</button>
                    <button onclick="clearStorage()" style="margin-left: 10px; background: #ff9800;">
                        Clear Storage & Reload
                    </button>
                </div>
            </div>
        `;
        
        // Hide loading screen
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
        
        throw error;
    }
}

// Wrapper untuk router dengan error handling
async function safeRouter() {
    if (!router) {
        console.log("⏳ Router not loaded yet, waiting...");
        return;
    }
    
    console.log("🔄 Executing router...");
    try {
        await router();
        
        // Hide loading screen setelah router selesai
        setTimeout(() => {
            const loading = document.getElementById('loading');
            if (loading) {
                loading.style.opacity = '0';
                setTimeout(() => {
                    loading.style.display = 'none';
                }, 500);
            }
        }, 300);
        
    } catch (error) {
        console.error("❌ Router execution error:", error);
        
        // Show error in app container
        document.getElementById("app").innerHTML = `
            <div style="padding: 20px; color: red;">
                <h2>Navigation Error</h2>
                <p>${error.message}</p>
                <button onclick="window.location.hash='#/'">Go Home</button>
                <button onclick="window.location.reload()" style="margin-left: 10px;">Reload</button>
            </div>
        `;
    }
}

// Initialize application
async function initApp() {
    console.log("🔧 Initializing application...");
    
    // Check authentication status
    const hasToken = !!localStorage.getItem("access");
    const hasUser = !!localStorage.getItem("user");
    
    console.log("📊 Auth Status:");
    console.log("- Token:", hasToken ? "✅ Found" : "❌ Not found");
    console.log("- User:", hasUser ? "✅ Found" : "❌ Not found");
    
    if (typeof updateStatus === 'function') {
        updateStatus(hasToken ? 'User authenticated' : 'No session found');
    }
    
    // Load router module
    await loadRouter();
    
    // Set initial hash jika kosong
    if (!window.location.hash) {
        console.log("📍 No hash found, setting default...");
        if (hasToken) {
            // Jika sudah login, redirect ke dashboard berdasarkan role
            try {
                const userStr = localStorage.getItem("user");
                if (userStr) {
                    const user = JSON.parse(userStr);
                    console.log(`🎯 Redirecting ${user.role} to dashboard`);
                    // Router akan handle redirect di dalamnya
                }
            } catch {
                // Jika error parsing user, tetap ke home
                window.location.hash = "#/";
            }
        } else {
            window.location.hash = "#/";
        }
    }
    
    // Run initial router
    await safeRouter();
    
    console.log("✅ Application initialized");
}

// Event listeners
window.addEventListener("DOMContentLoaded", async function() {
    console.log("📄 DOM Content Loaded");
    
    // Delay sedikit untuk pastikan semua siap
    setTimeout(async () => {
        try {
            await initApp();
        } catch (error) {
            console.error("❌ Application initialization failed:", error);
        }
    }, 100);
});

window.addEventListener("hashchange", async function() {
    console.log("🔗 Hash changed to:", window.location.hash);
    await safeRouter();
});

// Fungsi logout global - DIPERBAIKI
// window.logout = () => {
//     console.log("🚪 Logging out...");
    
//     // Clear all auth data
//     localStorage.removeItem("access");
//     localStorage.removeItem("refresh");
//     localStorage.removeItem("user");
//     localStorage.removeItem("idAnggota");
    
//     // Redirect to login - PERBAIKI PATH INI
//     window.location.hash = "#/login";
    
//     // Force reload untuk reset state
//     setTimeout(() => {
//         window.location.reload();
//     }, 100);
// };

// Debug functions
window.debugAuth = () => {
    console.log("🔍 DEBUG AUTH STATUS:");
    console.log("Token:", localStorage.getItem("access"));
    console.log("User:", localStorage.getItem("user"));
    
    const token = localStorage.getItem("access");
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log("Token payload:", payload);
            console.log("Expires:", new Date(payload.exp * 1000));
            console.log("User ID:", payload.user_id);
            
            const expiry = payload.exp * 1000;
            const remaining = expiry - Date.now();
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            
            console.log(`Valid for: ${hours}h ${minutes}m`);
        } catch(e) {
            console.error("Token decode error:", e);
        }
    }
};

// Auto debug on load
setTimeout(() => {
    console.log("🕐 Auto-debug after load");
    window.debugAuth();
}, 2000);

window.logout = async function() {
    console.log("🚪 LOGOUT - Starting logout process...");
    
    try {
        // Konfirmasi logout dengan SweetAlert2
        const result = await Swal.fire({
            title: 'Konfirmasi Logout',
            html: `
                <div style="text-align: center;">
                    <div style="font-size: 60px; color: #ff6b6b; margin-bottom: 15px;">
                        <i class="bi bi-box-arrow-right"></i>
                    </div>
                    <p style="font-size: 16px; color: #666;">
                        Anda akan keluar dari sistem dan diarahkan ke halaman login.
                    </p>
                    <p style="font-size: 14px; color: #999; margin-top: 10px;">
                        Yakin ingin logout?
                    </p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: `
                <i class="bi bi-box-arrow-right me-2"></i>
                Ya, Logout
            `,
            cancelButtonText: `
                <i class="bi bi-x-circle me-2"></i>
                Batal
            `,
            reverseButtons: true,
            focusCancel: true,
            backdrop: true,
            allowOutsideClick: false,
            customClass: {
                popup: 'rounded-4',
                title: 'fw-bold',
                confirmButton: 'shadow-sm',
                cancelButton: 'shadow-sm'
            }
        });
        
        // Jika user membatalkan
        if (!result.isConfirmed) {
            console.log("🚪 LOGOUT - User canceled logout");
            return;
        }
        
        // Tampilkan loading saat proses logout
        await Swal.fire({
            title: 'Sedang Logout...',
            html: `
                <div style="text-align: center;">
                    <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3" style="color: #666;">
                        Menghapus sesi login...
                    </p>
                </div>
            `,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            timer: 1500,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Hapus semua data dari localStorage
        console.log("🚪 LOGOUT - Clearing localStorage...");
        
        const storageItems = [
            'access', 'refresh', 'user', 'idAnggota', 
            'anggota', 'payment_cache', 'last_login'
        ];
        
        storageItems.forEach(item => {
            localStorage.removeItem(item);
        });
        
        console.log("🚪 LOGOUT - Storage cleared successfully");
        
        // Tampilkan pesan sukses
        await Swal.fire({
            title: 'Logout Berhasil!',
            html: `
                <div style="text-align: center;">
                    <div style="font-size: 60px; color: #4CAF50; margin-bottom: 15px;">
                        <i class="bi bi-check-circle"></i>
                    </div>
                    <p style="font-size: 16px; color: #666;">
                        Anda telah berhasil logout.
                    </p>
                    <p style="font-size: 14px; color: #999; margin-top: 10px;">
                        Mengarahkan ke halaman login...
                    </p>
                </div>
            `,
            icon: 'success',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            allowOutsideClick: false
        });
        
        // Redirect ke halaman login
        console.log("🚪 LOGOUT - Redirecting to login...");
        window.location.hash = "#/login";
        
        // Force reload untuk membersihkan state aplikasi
        setTimeout(() => {
            window.location.reload();
        }, 500);
        
    } catch (error) {
        console.error("🚪 LOGOUT - Error:", error);
        
        // Tampilkan error
        await Swal.fire({
            title: 'Logout Gagal!',
            html: `
                <div style="text-align: center;">
                    <div style="font-size: 60px; color: #dc3545; margin-bottom: 15px;">
                        <i class="bi bi-exclamation-triangle"></i>
                    </div>
                    <p style="font-size: 16px; color: #666;">
                        Terjadi kesalahan saat logout.
                    </p>
                    <p style="font-size: 14px; color: #999; margin-top: 10px;">
                        ${error.message || 'Silakan coba lagi.'}
                    </p>
                </div>
            `,
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc3545',
            customClass: {
                popup: 'rounded-4'
            }
        });
        
        // Fallback: coba logout manual
        try {
            localStorage.clear();
            window.location.hash = "#/login";
        } catch (fallbackError) {
            console.error("Fallback logout error:", fallbackError);
        }
    }
};