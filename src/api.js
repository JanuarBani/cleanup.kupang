// src/api.js - Update dengan endpoint Web Push
const API_URL = "http://127.0.0.1:8000/api";

export const API = {
  login: `${API_URL}/login/`,
  register: `${API_URL}/register/`,
  registerAnggota: `${API_URL}/register-anggota/`,
  users: `${API_URL}/users/`,
  timPengangkut: `${API_URL}/tim-pengangkut/`,
  anggota: `${API_URL}/anggota/`,
  tamu: `${API_URL}/tamu/`,
  jadwal: `${API_URL}/jadwal/`,
  pembayaran: `${API_URL}/pembayaran/`,
  detailAnggotaJadwal: `${API_URL}/detail-anggota-jadwal/`,
  laporanSampah: `${API_URL}/laporan-sampah/`,
  upgradeAnggota: `${API_URL}/upgrade-anggota/`,

  // Reports
  reportsKeuangan: `${API_URL}/reports/keuangan/`,
  reportsAnggota: `${API_URL}/reports/anggota/`,
  reportsLaporanSampah: `${API_URL}/reports/laporan-sampah/`,
  reportsJadwal: `${API_URL}/reports/jadwal/`,
  reportsUserStats: `${API_URL}/reports/user-stats/`,
  reportsMonthly: `${API_URL}/reports/monthly/`,
  reportsDampakLingkungan: `${API_URL}/reports/dampak-lingkungan/`,
  reportsExport: `${API_URL}/reports/export/`,

  publicAnalisisLingkungan: `${API_URL}/api/public/analisis-lingkungan/`,
  publicLandingStats: `${API_URL}/api/public/landing-stats/`,
  publicQuickStats: `${API_URL}/api/public/quick-stats/`,
  publicTipsLingkungan: `${API_URL}/api/public/tips-lingkungan/`,
  publicRankingWilayah: `${API_URL}/api/public/ranking-wilayah/`,

  // Web Push Notification Endpoints
  pushSubscriptions: `${API_URL}/push-subscriptions/`,
  pushSubscriptionsVapidKey: `${API_URL}/push-subscriptions/vapid_public_key/`,
  pushSubscriptionsTest: `${API_URL}/push-subscriptions/test_notification/`,

  vapidKeyPublic: `${API_URL}/api/vapid-key/`,

  notifications: `${API_URL}/notifications/`,

  // Special endpoints
  notificationsMarkAllRead: `${API_URL}/notifications/mark_all_read/`,
  notificationsMarkRead: (id) => `${API_URL}/notifications/${id}/mark_read/`,
  notificationsTest: `${API_URL}/notifications/test/`,

  // Tambah endpoint untuk handle pembayaran sukses

  // Endpoint khusus untuk anggota
  pembayaranAnggota: `${API_URL}/pembayaran/?anggota=`, // Untuk filter by anggota,
  pembayaranSuccess: (paymentId) =>
    `${API_URL}/api/pembayaran/${paymentId}/success/`,
};

export function getAuthHeaders() {
  const token = localStorage.getItem("access");
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Tambahkan CSRF token untuk Django
  const csrfToken = getCookie("csrftoken");
  if (csrfToken) {
    headers["X-CSRFToken"] = csrfToken;
  }

  return headers;
}

// Helper untuk form data headers
export function getAuthHeadersMultipart() {
  const token = localStorage.getItem("access");
  const headers = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Tambahkan CSRF token untuk Django
  const csrfToken = getCookie("csrftoken");
  if (csrfToken) {
    headers["X-CSRFToken"] = csrfToken;
  }

  return headers;
}

// Helper untuk fetch API
export async function fetchAPI(url, options = {}) {
  const defaultOptions = {
    headers: getAuthHeaders(),
    credentials: "include", // Penting untuk session cookies Django
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, finalOptions);

    // Handle response
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Handle 204 No Content
    if (
      response.status === 204 ||
      response.headers.get("content-length") === "0"
    ) {
      return { success: true };
    }

    // Parse JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return await response.text();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// Helper untuk DELETE
export async function deleteAPI(url) {
  return fetchAPI(url, { method: "DELETE" });
}

// Auth guard helper
export function authGuard() {
  const token = localStorage.getItem("access");
  if (!token) {
    alert("Silakan login terlebih dahulu!");
    window.location.hash = "#/login";
    return null;
  }

  try {
    // Decode JWT token
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Token decode error:", error);
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.hash = "#/login";
    return null;
  }
}

// Helper untuk mendapatkan cookie
export function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export function getPublicHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };

  // Tambahkan CSRF token jika ada (untuk form submissions)
  const csrfToken = getCookie("csrftoken");
  if (csrfToken) {
    headers["X-CSRFToken"] = csrfToken;
  }

  return headers;
}

/**
 * Fetch analisis data dengan parameter
 * @param {number} days - Jumlah hari (7, 30, 90)
 * @returns {Promise}
 */
export async function fetchAnalisisDampakData(days = 30) {
  try {
    const url = `${API.publicAnalisisLingkungan}?days=${days}`;
    const response = await fetch(url, {
      headers: getPublicHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching analisis dampak data:', error);
    throw error;
  }
}

/**
 * Fetch quick stats untuk card
 * @returns {Promise}
 */
export async function fetchQuickStats() {
  try {
    const response = await fetch(API.publicQuickStats, {
      headers: getPublicHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching quick stats:', error);
    throw error;
  }
}