// export function authGuard() {
//     const user = localStorage.getItem("user");
//     console.log("Auth Guard - User:", user);
//     if (!user) return null;
//     return JSON.parse(user);
// }


// // utils/authGuard.js
// import { API } from '../api.js';  // Import API object

// export async function authGuard() {
//     const token = localStorage.getItem("access");
//     if (!token) {
//         console.log("❌ No token found");
//         return null;
//     }
    
//     // Cek jika sudah ada user data
//     const userStr = localStorage.getItem("user");
//     if (userStr && userStr !== "undefined") {
//         try {
//             const user = JSON.parse(userStr);
//             console.log("✅ User from localStorage:", user);
//             return user;
//         } catch (error) {
//             console.warn("Invalid user data in localStorage:", error);
//         }
//     }
    
//     // Jika tidak ada, fetch dari API
//     try {
//         // Decode user_id dari token
//         const tokenData = JSON.parse(atob(token.split('.')[1]));
//         const userId = tokenData.user_id;
        
//         console.log(`🔄 Fetching fresh user data for ID: ${userId}`);
        
//         // Build user URL dari API.users
//         const userUrl = API.users.replace(/\/$/, '') + `/${userId}/`;
//         console.log('Fetching from:', userUrl);
        
//         const response = await fetch(userUrl, {
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Accept': 'application/json'
//             }
//         });
        
//         if (response.ok) {
//             const userData = await response.json();
//             console.log("✅ User data fetched:", userData);
            
//             // Simpan ke localStorage
//             localStorage.setItem("user", JSON.stringify(userData));
            
//             return userData;
//         } else {
//             console.error("Failed to fetch user data:", response.status);
//             return null;
//         }
        
//     } catch (error) {
//         console.error("Auth Guard Error:", error);
//         return null;
//     }
// }

// utils/authGuard.js - DIPERBAIKI
import { apiRequest } from './apiRequest.js';
import { showToast } from './toast.js';

// utils/authGuard.js - VERSI SEDERHANA

export async function authGuard() {
    // Cek route saat ini
    const currentPath = window.location.hash.substring(1) || "/";
    console.log("🔐 AuthGuard - Path:", currentPath);
    
    // Daftar halaman yang TIDAK perlu auth (public)
    const publicRoutes = ["/login", "/register", "/", "/about", "/contact"];
    
    // Jika di halaman public, return null (tidak perlu token)
    if (publicRoutes.includes(currentPath)) {
        console.log("✅ Public page, no auth required");
        return null; // Tidak ada user, tapi tidak error
    }
    
    // Cek token untuk halaman yang butuh auth
    const token = localStorage.getItem("access");
    if (!token) {
        console.log("❌ No token for protected page, redirecting to login");
        // Redirect ke login hanya jika bukan di public route
        setTimeout(() => {
            window.location.hash = "#/login";
        }, 100);
        return null;
    }
    
    // Cek user data di localStorage
    const userStr = localStorage.getItem("user");
    if (userStr && userStr !== "undefined") {
        try {
            const user = JSON.parse(userStr);
            console.log("✅ User found:", user.username);
            
            // Cek token masih valid
            try {
                const tokenData = JSON.parse(atob(token.split('.')[1]));
                const expiry = tokenData.exp * 1000;
                
                if (Date.now() > expiry) {
                    console.log("⚠ Token expired");
                    localStorage.clear();
                    window.location.hash = "#/login";
                    return null;
                }
            } catch {
                // Token decode gagal, tetap lanjut dengan user dari localStorage
            }
            
            return user;
        } catch {
            // User data invalid
            localStorage.removeItem("user");
        }
    }
    
    // Jika ada token tapi tidak ada user, coba fetch dari API
    try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const userId = tokenData.user_id;
        
        console.log(`🔄 Fetching user ${userId} from API`);
        
        const response = await fetch(`http://127.0.0.1:8000/api/users/${userId}/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            localStorage.setItem("user", JSON.stringify(userData));
            console.log("✅ User loaded from API");
            return userData;
        } else {
            // Jika gagal fetch, clear dan redirect
            localStorage.clear();
            window.location.hash = "#/login";
            return null;
        }
        
    } catch (error) {
        console.error("Auth error:", error);
        localStorage.clear();
        window.location.hash = "#/login";
        return null;
    }
}

// Fungsi helper sederhana
export function getCurrentUser() {
    try {
        const userStr = localStorage.getItem("user");
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
}

export function isAuthenticated() {
    return !!localStorage.getItem("access");
}

export function logout() {
    localStorage.clear();
    window.location.hash = "#/login";
}

export function hasRole(role) {
    const user = getCurrentUser();
    return user && user.role === role;
}

// Export fungsi-fungsi yang diperlukan
export { apiRequest, showToast };