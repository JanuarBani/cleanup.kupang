// import { loginPage } from "./auth/login.js";
// import { registerPage } from "./auth/register.js";

// import { dashboardAdmin } from "./pages/dashboard_admin.js";
// import { dashboardAnggota } from "./pages/dashboard_anggota.js";
// import { dashboardTim } from "./pages/dashboard_tim.js";
// import { dashboardTamu } from "./pages/dashboard_tamu.js";

// import { upgradeAnggotaPage } from "./pages/tamu/upgrade_anggota.js";

// import { authGuard } from "./utils/authGuard.js";

// export function router() {
//     const path = window.location.hash;
//     const user = await authGuard();

//     console.log("🔄 ROUTER: path =", path);
//     console.log("👤 USER =", user);

//     // === PUBLIC ROUTES ===
//     if (path === "#/login") return loginPage();
//     if (path === "#/register") return registerPage();

//     // Upgrade hanya boleh diakses TAMU yang SUDAH login
//     if (path === "#/upgrade-anggota") {
//         if (!user) return loginPage(); // harus login
//         if (user.role !== "tamu") {
//             alert("Hanya tamu yang bisa upgrade akun!");
//             return redirectByRole(user.role);
//         }
//         return upgradeAnggotaPage();
//     }

//     // === PROTECTED ROUTES ===
//     if (!user) {
//         window.location.hash = "#/login";
//         return loginPage();
//     }

//     // root → redirect by role
//     if (path === "" || path === "#/" || path === "#/home") {
//         return redirectByRole(user.role);
//     }

//     // default → selalu arahkan berdasarkan role
//     return redirectByRole(user.role);
// }

// function redirectByRole(role) {
//     console.log("➡ Redirecting role:", role);

//     switch (role) {
//         case "admin":
//             return dashboardAdmin();
//         case "anggota":
//             return dashboardAnggota();
//         case "tim_angkut":
//             return dashboardTim();
//         case "tamu":
//             return dashboardTamu();
//         default:
//             return loginPage();
//     }
// }

// router.js
import { loginPage } from "./auth/login.js";
import { registerPage } from "./auth/register.js";
import { dashboardAdmin } from "./pages/dashboard_admin.js";
import { dashboardAnggota } from "./pages/dashboard_anggota.js";
import { dashboardTim } from "./pages/dashboard_tim.js";
import { dashboardTamu } from "./pages/dashboard_tamu.js";
import { upgradeAnggotaPage } from "./pages/tamu/upgrade_anggota.js";
import { authGuard } from "./utils/authGuard.js";

// Buat router async
export async function router() {
    const path = window.location.hash;
    const user = await authGuard();  // await karena authGuard async

    console.log("🔄 ROUTER: path =", path);
    console.log("👤 USER =", user);

    // === PUBLIC ROUTES ===
    if (path === "#/login") return loginPage();
    if (path === "#/register") return registerPage();

    // Upgrade hanya boleh diakses TAMU yang SUDAH login
    if (path === "#/upgrade-anggota") {
        if (!user) {
            window.location.hash = "#/login";
            return loginPage();
        }
        if (user.role !== "tamu") {
            alert("Hanya tamu yang bisa upgrade akun!");
            return redirectByRole(user.role);
        }
        return upgradeAnggotaPage();
    }

    // === PROTECTED ROUTES ===
    if (!user) {
        window.location.hash = "#/login";
        return loginPage();
    }

    // root → redirect by role
    if (path === "" || path === "#/" || path === "#/home") {
        return redirectByRole(user.role);
    }

    // default → selalu arahkan berdasarkan role
    return redirectByRole(user.role);
}

function redirectByRole(role) {
    console.log("➡ Redirecting role:", role);

    switch (role) {
        case "admin":
            return dashboardAdmin();
        case "anggota":
            return dashboardAnggota();
        case "tim_angkut":
            return dashboardTim();
        case "tamu":
            return dashboardTamu();
        default:
            return loginPage();
    }
}