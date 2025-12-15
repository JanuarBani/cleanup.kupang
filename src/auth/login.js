// auth/login.js
import { API, fetchAPI, getAuthHeaders } from '../api.js';
import { authGuard } from '../utils/authGuard.js';

// =============================
// PAGE LOGIN
// =============================
export function loginPage() {
    console.log("📱 Rendering login page...");

    document.getElementById("app").innerHTML = `
        <div class="login-container" style="max-width: 400px; margin: 50px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="text-align: center; color: #333;">Login</h2>

            <form id="loginForm" style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label for="username">Username</label>
                    <input type="text" id="username" required>
                </div>
                
                <div>
                    <label for="password">Password</label>
                    <input type="password" id="password" required>
                </div>
                
                <button type="submit">Login</button>
            </form>

            <div style="text-align:center;margin-top:10px;">
                <a href="#/register" style="color: #4CAF50; text-decoration: none;">Daftar disini</a>
            </div>

            <div id="loginMessage" style="margin-top:15px;"></div>
        </div>
    `;

    document.getElementById("loginForm").addEventListener("submit", handleLoginSubmit);
    document.getElementById("username").focus();
}

// =============================
// SUBMIT HANDLER
// =============================
async function handleLoginSubmit(event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    showMessage("Memproses login...", "info");

    const btn = event.target.querySelector("button");
    btn.disabled = true;
    btn.textContent = "Memproses...";

    try {
        await login(username, password);
    } catch (err) {
        btn.disabled = false;
        btn.textContent = "Login";
    }
}

// =============================
// LOGIN FUNCTION
// =============================
async function login(username, password) {
    try {
        // 1. Ambil token
        const response = await fetch(API.login, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const err = await response.json();
            showMessage(err.detail || "Login gagal!", "error");
            throw new Error(err.detail);
        }

        const data = await response.json();

        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);

        // 2. Decode user_id dari token
        const tokenData = JSON.parse(atob(data.access.split(".")[1]));
        const userId = tokenData.user_id;

        // 3. Fetch data user
        const userUrl = API.users.replace(/\/$/, '') + `/${userId}/`;
        const userRes = await fetch(userUrl, {
            headers: { "Authorization": `Bearer ${data.access}` }
        });

        const userData = await userRes.json();
        localStorage.setItem("user", JSON.stringify(userData));

        showMessage(`Login berhasil! Selamat datang ${userData.username} (${userData.role})`, "success");

        // 4. Ambil idAnggota lalu simpan
        try {
            await loadAnggotaId();
        } catch (anggotaError) {
            console.warn("⚠ Tidak bisa load data anggota:", anggotaError);
            console.log("ℹ Login tetap berhasil, user bisa daftar anggota nanti");
        }
        
        // 5. Tampilkan pesan sukses
        const roleMsg = userData.role === 'anggota' ? ' (Anggota)' : '';
        showMessage(`Login berhasil! Selamat datang ${userData.username}${roleMsg}`, "success");


        // 5. Redirect
        setTimeout(() => {
            window.location.hash = "#/dashboard";
        }, 800);

    } catch (err) {
        showMessage(err.message, "error");
        throw err;
    }
}

// =============================
// LOAD idAnggota
// =============================
// DI login.js - PERBAIKAN loadAnggotaId
async function loadAnggotaId() {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
        console.log("⚠ No user data found");
        return null;
    }
    
    try {
        const user = JSON.parse(userStr);
        const token = localStorage.getItem("access");
        
        console.log(`🔍 Searching anggota for user ID: ${user.id}, Role: ${user.role}`);
        
        // Hanya cari anggota jika user role = "anggota"
        if (user.role !== "anggota") {
            console.log(`ℹ User role is "${user.role}", skipping anggota lookup`);
            return null;
        }
        
        // Fetch dari API dengan query user ID
        const response = await fetch(`${API.anggota}?user=${user.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📊 Response status: ${response.status}`);
        
        if (!response.ok) {
            console.warn(`⚠ API error ${response.status} when fetching anggota`);
            return null;
        }
        
        const data = await response.json();
        console.log(`📦 Data received:`, data);
        
        if (data.length > 0) {
            const anggotaId = data[0].idAnggota || data[0].id;
            localStorage.setItem("idAnggota", anggotaId);
            console.log(`✅ idAnggota ditemukan: ${anggotaId}`);
            return anggotaId;
        } else {
            console.log(`ℹ Tidak ada data anggota untuk user ID ${user.id}`);
            console.log(`ℹ Silakan daftar sebagai anggota atau hubungi admin`);
            return null;
        }
        
    } catch (error) {
        console.error("❌ Gagal load anggota:", error);
        console.log("ℹ Error ini tidak mengganggu login, melanjutkan...");
        return null;
    }
}

// =============================
// SHOW MESSAGE
// =============================
function showMessage(message, type = "info") {
    const div = document.getElementById("loginMessage");
    div.textContent = message;

    if (type === "error") {
        div.style.color = "red";
    } else if (type === "success") {
        div.style.color = "green";
    } else {
        div.style.color = "#333";
    }
}

export { login };



// // auth/login.js
// import { API } from '../api.js';  // Import API object

// // Export function untuk page login
// export function loginPage() {
//     console.log("📱 Rendering login page...");
    
//     // Render login form
//     document.getElementById("app").innerHTML = `
//         <div class="login-container" style="max-width: 400px; margin: 50px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
//             <h2 style="text-align: center; color: #333;">Login</h2>
            
//             <form id="loginForm" style="display: flex; flex-direction: column; gap: 15px;">
//                 <div>
//                     <label for="username" style="display: block; margin-bottom: 5px;">Username</label>
//                     <input type="text" id="username" placeholder="Masukkan username" required 
//                            style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
//                 </div>
                
//                 <div>
//                     <label for="password" style="display: block; margin-bottom: 5px;">Password</label>
//                     <input type="password" id="password" placeholder="Masukkan password" required 
//                            style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
//                 </div>
                
//                 <button type="submit" 
//                         style="background-color: #4CAF50; color: white; padding: 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
//                     Login
//                 </button>
//             </form>
            
//             <div style="text-align: center; margin-top: 20px;">
//                 <p style="color: #666;">
//                     Belum punya akun? 
//                     <a href="#/register" style="color: #4CAF50; text-decoration: none;">Daftar disini</a>
//                 </p>
//             </div>
            
//             <div id="loginMessage" style="margin-top: 15px;"></div>
//         </div>
//     `;
    
//     // Add event listener untuk form
//     document.getElementById("loginForm").addEventListener("submit", handleLoginSubmit);
    
//     // Auto-focus pada username field
//     document.getElementById("username").focus();
// }

// // Handle form submission
// async function handleLoginSubmit(event) {
//     event.preventDefault();
    
//     const username = document.getElementById("username").value.trim();
//     const password = document.getElementById("password").value;
    
//     if (!username || !password) {
//         showMessage("Username dan password harus diisi!", "error");
//         return;
//     }
    
//     // Tampilkan loading
//     showMessage("Memproses login...", "info");
    
//     // Disable button
//     const submitBtn = event.target.querySelector('button[type="submit"]');
//     submitBtn.disabled = true;
//     submitBtn.textContent = "Memproses...";
    
//     try {
//         await login(username, password);
//     } catch (error) {
//         // Enable button kembali
//         submitBtn.disabled = false;
//         submitBtn.textContent = "Login";
//     }
// }

// // Login function
// async function login(username, password) {
//     console.log('🔍 LOGIN DEBUG');
//     console.log('Username:', username);
//     console.log('Password:', password);
    
//     try {
//         // 1. Login untuk dapat token - PERBAIKI INI
//         console.log('Login URL:', API.login);
//         const response = await fetch(API.login, {  // API.login sudah string URL
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Accept': 'application/json'
//             },
//             body: JSON.stringify({ username, password })
//         });
        
//         console.log('HTTP Status:', response.status);
        
//         if (!response.ok) {
//             // Coba parse error message
//             try {
//                 const errorData = await response.json();
//                 const errorMsg = errorData.detail || 'Username/password salah';
//                 showMessage(`Login gagal: ${errorMsg}`, "error");
//                 throw new Error(errorMsg);
//             } catch {
//                 showMessage(`Login gagal: HTTP ${response.status}`, "error");
//                 throw new Error(`HTTP ${response.status}`);
//             }
//         }
        
//         const data = await response.json();
//         console.log('Login Response:', data);
        
//         if (!data.access) {
//             showMessage('Login gagal: Tidak menerima token', "error");
//             throw new Error('No access token received');
//         }
        
//         // Simpan token
//         localStorage.setItem('access', data.access);
//         localStorage.setItem('refresh', data.refresh);
        
//         console.log('✅ Token saved');
//         showMessage('Token berhasil didapatkan...', "success");
        
//         // 2. Decode user_id dari token
//         const tokenData = JSON.parse(atob(data.access.split('.')[1]));
//         const userId = tokenData.user_id;
//         console.log('🔑 User ID from token:', userId);
        
//         // 3. Fetch user data dari API - PERBAIKI INI
//         showMessage('Mengambil data pengguna...', "info");
//         console.log('🔄 Fetching user data...');
        
//         // Gunakan API.users dan replace {id} dengan userId
//         const userUrl = API.users.replace(/\/$/, '') + `/${userId}/`;
//         console.log('User URL:', userUrl);
        
//         const userResponse = await fetch(userUrl, {
//             headers: {
//                 'Authorization': `Bearer ${data.access}`,
//                 'Accept': 'application/json'
//             }
//         });
        
//         if (!userResponse.ok) {
//             throw new Error(`Failed to fetch user data: ${userResponse.status}`);
//         }
        
//         const userData = await userResponse.json();
//         console.log('✅ User data fetched:', userData);
        
//         // Simpan user data ke localStorage
//         localStorage.setItem('user', JSON.stringify(userData));
        
//         // 4. Tampilkan pesan sukses dan redirect
//         showMessage(`Login berhasil! Selamat datang ${userData.username} (${userData.role})`, "success");
        
//         console.log(`🎯 Redirecting to ${userData.role} dashboard...`);
        
//         // Redirect setelah 1 detik
//         setTimeout(() => {
//             window.location.hash = "#/dashboard";
//         }, 1000);
        
//     } catch (error) {
//         console.error('Login error:', error);
//         showMessage(`Terjadi kesalahan: ${error.message}`, "error");
//         throw error;
//     }
// }

// // Helper untuk menampilkan pesan
// function showMessage(message, type = "info") {
//     const messageDiv = document.getElementById("loginMessage");
    
//     // Reset styles
//     messageDiv.innerHTML = "";
//     messageDiv.style.padding = "10px";
//     messageDiv.style.borderRadius = "4px";
//     messageDiv.style.marginTop = "15px";
    
//     // Set style berdasarkan type
//     if (type === "error") {
//         messageDiv.style.backgroundColor = "#ffebee";
//         messageDiv.style.color = "#c62828";
//         messageDiv.style.border = "1px solid #ffcdd2";
//     } else if (type === "success") {
//         messageDiv.style.backgroundColor = "#e8f5e9";
//         messageDiv.style.color = "#2e7d32";
//         messageDiv.style.border = "1px solid #c8e6c9";
//     } else {
//         messageDiv.style.backgroundColor = "#e3f2fd";
//         messageDiv.style.color = "#1565c0";
//         messageDiv.style.border = "1px solid #bbdefb";
//     }
    
//     messageDiv.textContent = message;
    
//     // Auto-hide untuk pesan sukses
//     if (type === "success") {
//         setTimeout(() => {
//             messageDiv.style.opacity = "0";
//             messageDiv.style.transition = "opacity 0.5s";
//             setTimeout(() => {
//                 messageDiv.innerHTML = "";
//                 messageDiv.style = "";
//             }, 500);
//         }, 3000);
//     }
// }

// // Export juga function login untuk digunakan di tempat lain
// export { login };