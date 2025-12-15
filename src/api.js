// api.js - Versi sederhana
const API_URL = "http://127.0.0.1:8000/api";

export const API = {
    login: `${API_URL}/login/`,
    register: `${API_URL}/register/`,
    users: `${API_URL}/users/`,
    timPengangkut: `${API_URL}/tim-pengangkut/`,
    anggota: `${API_URL}/anggota/`,
    tamu: `${API_URL}/tamu/`,
    jadwal: `${API_URL}/jadwal/`,
    pembayaran: `${API_URL}/pembayaran/`,
    detailAnggotaJadwal: `${API_URL}/detail-anggota-jadwal/`,
    laporanSampah: `${API_URL}/laporan-sampah/`,
    upgradeAnggota: `${API_URL}/upgrade-anggota/`,

    // Reports - TAMBAHKAN INI
    reportsKeuangan: `${API_URL}/reports/keuangan/`,
    reportsAnggota: `${API_URL}/reports/anggota/`,
    reportsLaporanSampah: `${API_URL}/reports/laporan-sampah/`,
    reportsJadwal: `${API_URL}/reports/jadwal/`,
    reportsUserStats: `${API_URL}/reports/user-stats/`,
    reportsMonthly: `${API_URL}/reports/monthly/`,
    reportsExport: `${API_URL}/reports/export/`,
};

export function authHeader() {
    const token = localStorage.getItem("access");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Helper untuk headers
export function getAuthHeaders() {
    const token = localStorage.getItem('access');
    if (token) {
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
    return { 'Content-Type': 'application/json' };
}

// Helper untuk multipart (file upload)
export function getAuthHeadersMultipart() {
    const token = localStorage.getItem('access');
    if (token) {
        return { 'Authorization': `Bearer ${token}` };
    }
    return {};
}

// Helper function untuk fetch API
export async function fetchAPI(url, options = {}) {
    try {
        const response = await fetch(url, options);
        
        // Periksa status response
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch {
                // Jika tidak bisa parse JSON, gunakan status text
                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        // Untuk DELETE biasanya return 204 No Content, tidak ada body
        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return { success: true, message: 'Successfully deleted' };
        }
        
        // Coba parse JSON, jika gagal return text atau object kosong
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            const text = await response.text();
            return text || { success: true };
        }
        
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

export async function deleteAPI(url) {
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Delete failed with status: ${response.status}`);
        }
        
        // DELETE biasanya return 204 No Content
        if (response.status === 204) {
            return { success: true, message: 'Item deleted successfully' };
        }
        
        // Jika ada response body, coba parse
        try {
            return await response.json();
        } catch {
            return { success: true };
        }
        
    } catch (error) {
        console.error('Delete API Error:', error);
        throw error;
    }
}

// Auth guard helper
export function authGuard() {
    const token = localStorage.getItem('access');
    if (!token) {
        alert("Silakan login terlebih dahulu!");
        window.location.hash = "#/login";
        return null;
    }
    
    try {
        // Decode JWT token
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Token decode error:', error);
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        window.location.hash = "#/login";
        return null;
    }
}


// const API_URL = "http://127.0.0.1:8000/api";

// export const API = {
//     login: `${API_URL}/auth/login/`,
//     register: `${API_URL}/register/`,
//     user: `${API_URL}/users`,            // <<< endpoint user
//     getProfile: `${API_URL}/user/profile`,
//     updateProfile: `${API_URL}/api/user/update`,
//     laporan: `${API_URL}/laporan-sampah/`,
//     upgradeAnggota: `${API_URL}/upgrade-anggota/`,
//     tamu: `${API_URL}/tamu`,           // <<< endpoint tamu
//     anggota: `${API_URL}/anggota`,
//     jadwal: `${API_URL}/jadwal/`,
//     pembayaran: `${API_URL}/pembayaran`,
//     detailAnggotaJadwal: `${API_URL}/detail-anggota-jadwal/`,
//     tim: `${API_URL}/tim-pengangkut`,
// };



