// router.js
import { loginPage } from "./auth/login.js";
import { landingPage } from "./pages/landingPage.js";
import { registerPage } from "./auth/register.js";
import { registerAnggotaPage } from "./auth/registerAnggota.js";
import { dashboardAdmin } from "./pages/dashboard_admin.js";
import { dashboardAnggota } from "./pages/dashboard_anggota.js";
import { dashboardTim } from "./pages/dashboard_tim.js";
import { dashboardTamu } from "./pages/dashboard_tamu.js";
import { upgradeAnggotaPage } from "./pages/tamu/upgrade_anggota.js";
import { authGuard } from "./utils/authGuard.js";
import { analisisDampakPage } from "./pages/analisisDampak.js";

// Buat router async
export async function router() {
    const path = window.location.hash;
    
    console.log("🔄 ROUTER: path =", path);

    // === LANDING PAGE (PUBLIC) ===
    if (path === "" || path === "#/" || path === "#/landing" || path === "#/home") {
        return landingPage();
    }

    if (path === "#/analisis-dampak" || path === "#/dampak-lingkungan") {
        return analisisDampakPage();
    }

    if (path === "#/register-anggota") {
        return registerAnggotaPage();
    }

    if (path === "#/register") {
        return registerPage();
    }

    if (path === "#/login") {
        const user = await authGuard();
        if (user) return redirectByRole(user.role);
        return loginPage();
    }

    // === PROTECTED ROUTES ===
    const user = await authGuard();
    console.log("👤 USER =", user);

    if (!user) {
        // Jika tidak ada user, redirect ke landing page atau login
        window.location.hash = "#/login";
        return landingPage();
    }

    // === ROLE-SPECIFIC ROUTES ===
    switch (path) {
        case "#/upgrade-anggota":
            if (user.role !== "tamu") {
                alert("Hanya tamu yang bisa upgrade akun!");
                return redirectByRole(user.role);
            }
            return upgradeAnggotaPage();
            
        case "#/dashboard":
        case "#/dashboard-admin":
            if (user.role === "admin") {
                return dashboardAdmin();
            }
            return redirectByRole(user.role);
            
        case "#/dashboard-anggota":
            if (user.role === "anggota") {
                return dashboardAnggota();
            }
            alert("Hanya anggota yang bisa mengakses dashboard ini!");
            return redirectByRole(user.role);
            
        case "#/dashboard-tim":
            if (user.role === "tim_angkut") {
                return dashboardTim();
            }
            alert("Hanya tim angkut yang bisa mengakses dashboard ini!");
            return redirectByRole(user.role);
            
        case "#/dashboard-tamu":
            if (user.role === "tamu") {
                return dashboardTamu();
            }
            return redirectByRole(user.role);
            
        default:
            // Jika path tidak dikenali, redirect berdasarkan role
            return redirectByRole(user.role);
    }
}

function redirectByRole(role) {
    console.log("➡ Redirecting role:", role);

    switch (role) {
        case "admin":
            window.location.hash = "#/dashboard-admin";
            return dashboardAdmin();
        case "anggota":
            window.location.hash = "#/dashboard-anggota";
            return dashboardAnggota();
        case "tim_angkut":
            window.location.hash = "#/dashboard-tim";
            return dashboardTim();
        case "tamu":
            window.location.hash = "#/dashboard-tamu";
            return dashboardTamu();
        default:
            window.location.hash = "#/";
            return landingPage();
    }
}
// Fungsi untuk menangani hash changes
export function setupRouter() {
    console.log("🔧 Setting up router...");
    
    // Handle initial load
    window.addEventListener('load', () => {
        router();
    });
    
    // Handle hash changes
    window.addEventListener('hashchange', async () => {
        try {
            await router();
        } catch (error) {
            console.error('❌ Router error:', error);
            const app = document.getElementById("app");
            if (app) {
                app.innerHTML = `
                    <div class="container mt-5">
                        <div class="alert alert-danger">
                            <h4 class="alert-heading"><i class="bi bi-exclamation-triangle me-2"></i>Error</h4>
                            <p>Terjadi kesalahan: ${error.message}</p>
                            <div class="mt-3">
                                <button onclick="location.reload()" class="btn btn-primary">
                                    <i class="bi bi-arrow-clockwise me-1"></i> Refresh
                                </button>
                                <button onclick="window.location.hash='#/'" class="btn btn-secondary ms-2">
                                    <i class="bi bi-house me-1"></i> Home
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    });
    
    // Global function untuk redirect berdasarkan role
    window.redirectByRole = redirectByRole;
    
    console.log("✅ Router setup complete");
}

// Panggil setup saat file di-load
setupRouter();