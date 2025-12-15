import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { authGuard } from "../../utils/authGuard.js";
import { loadLeaflet, initMapForm } from "../../utils/mapConfig.js";

// Halaman Upgrade Anggota
export async function upgradeAnggotaPage() {
  const app = document.getElementById("app");
  const user = await authGuard();

  if (!user) {
    alert("Silakan login terlebih dahulu!");
    window.location.hash = "#/login";
    return;
  }

  // Cek role
  if (user.role !== "tamu") {
    alert("Hanya Tamu yang bisa melakukan upgrade anggota.");
    window.location.hash = "#/dashboard";
    return;
  }

  // Fetch data user lengkap untuk mendapatkan nama
  let userData = { ...user };
  try {
    const response = await fetch(`${API.users}${user.id}/`, {
      headers: getAuthHeaders()
    });
    if (response.ok) {
      const data = await response.json();
      userData = data;
    }
  } catch (error) {
    console.error("Error fetching user details:", error);
  }

  app.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1>Upgrade Menjadi Anggota CleanUp</h1>
      <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p><strong>💰 Hanya Rp 50.000/bulan</strong></p>
        <p>Dengan menjadi anggota, Anda akan mendapatkan:</p>
        <ul>
          <li>📅 Layanan angkut sampah <strong>4 kali sebulan</strong></li>
          <li>🏠 Penjemputan langsung di depan rumah</li>
          <li>🌱 Kontribusi menjaga kebersihan Kota Kupang</li>
          <li>📊 Akses ke dashboard anggota khusus</li>
        </ul>
      </div>
      
      <hr>

      <form id="formUpgrade" class="form-upgrade">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <label><strong>Nama Lengkap</strong></label>
            <input type="text" id="nama" required value="${userData.first_name || userData.username || ''}" 
                   style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-top: 5px;">
          </div>
          
          <div>
            <label><strong>Nomor WhatsApp</strong></label>
            <input type="text" id="noWA" maxlength="15" required placeholder="Contoh: 081234567890"
                   style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-top: 5px;">
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <label><strong>Alamat Lengkap</strong></label>
          <textarea id="alamat" required rows="3" placeholder="Alamat lengkap termasuk RT/RW, kelurahan, kecamatan"
                    style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-top: 5px;"></textarea>
        </div>

        <div style="margin-bottom: 20px;">
          <label><strong>Lokasi Rumah (Klik pada peta untuk menandai)</strong></label>
          <div id="mapSelect" style="height: 300px; width: 100%; border:1px solid #ccc; border-radius: 4px; margin-top: 5px;"></div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <label><strong>Latitude</strong></label>
            <input type="number" id="latitude" step="0.00000001" readonly required 
                   style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-top: 5px; background: #f5f5f5;">
          </div>
          
          <div>
            <label><strong>Longitude</strong></label>
            <input type="number" id="longitude" step="0.00000001" readonly required 
                   style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-top: 5px; background: #f5f5f5;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <label><strong>Tanggal Mulai Keanggotaan</strong></label>
            <input type="date" id="tanggalStart" required 
                   style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-top: 5px;">
          </div>
          
          <div>
            <label><strong>Tanggal Berakhir</strong></label>
            <input type="date" id="tanggalEnd" required 
                   style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-top: 5px;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <label><strong>Jenis Sampah</strong></label>
            <select id="jenisSampah" required 
                    style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-top: 5px;">
              <option value="">-- Pilih Jenis Sampah --</option>
              <option value="rumah_tangga">Rumah Tangga</option>
              <option value="tempat_usaha">Tempat Usaha</option>
              <option value="campuran">Campuran</option>
            </select>
          </div>
          
          <div>
            <label><strong>Status Keanggotaan</strong></label>
            <select id="status" required 
                    style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-top: 5px;">
              <option value="aktif">Aktif</option>
              <option value="pending">Pending (Menunggu Konfirmasi)</option>
            </select>
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="submit" 
                  style="flex: 1; background: #4CAF50; color: white; padding: 12px; border: none; border-radius: 4px; font-size: 16px; cursor: pointer;">
            📋 Ajukan Upgrade
          </button>
          <button type="button" id="btnBack" 
                  style="flex: 1; background: #757575; color: white; padding: 12px; border: none; border-radius: 4px; font-size: 16px; cursor: pointer;">
            ← Kembali ke Dashboard
          </button>
        </div>
        
        <div id="formMessage" style="margin-top: 15px;"></div>
      </form>
    </div>
  `;

  // Tombol kembali
  document.getElementById("btnBack").onclick = () => {
    window.location.hash = "#/dashboard";
  };

  // Load peta dengan marker default
  loadLeaflet(() => {
    // Default location: Kupang
    const defaultLat = -10.1772;
    const defaultLng = 123.6070;
    
    initMapForm("mapSelect", "latitude", "longitude", defaultLat, defaultLng);
    
    // Set default values
    document.getElementById("latitude").value = defaultLat;
    document.getElementById("longitude").value = defaultLng;
    
    // Set default dates
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);
    
    document.getElementById("tanggalStart").valueAsDate = today;
    document.getElementById("tanggalEnd").valueAsDate = nextMonth;
  });

  // Submit form
  document.getElementById("formUpgrade").onsubmit = handleSubmitUpgrade;
}

// Handle form submission
async function handleSubmitUpgrade(e) {
  e.preventDefault();
  
  const user = await authGuard();
  if (!user || user.role !== "tamu") {
    showMessage("Hanya Tamu yang bisa melakukan upgrade anggota.", "error");
    return;
  }

  // Validate form
  const nama = document.getElementById("nama").value.trim();
  const alamat = document.getElementById("alamat").value.trim();
  const noWA = document.getElementById("noWA").value.trim();
  const latitude = parseFloat(document.getElementById("latitude").value);
  const longitude = parseFloat(document.getElementById("longitude").value);
  const tanggalStart = document.getElementById("tanggalStart").value;
  const tanggalEnd = document.getElementById("tanggalEnd").value;
  const status = document.getElementById("status").value;
  const jenisSampah = document.getElementById("jenisSampah").value;

  if (!nama || !alamat || !noWA || !latitude || !longitude || !tanggalStart || !tanggalEnd || !jenisSampah) {
    showMessage("Harap lengkapi semua field yang wajib diisi.", "error");
    return;
  }

  // Validate phone number
  if (!/^[0-9]{10,15}$/.test(noWA)) {
    showMessage("Nomor WhatsApp harus 10-15 digit angka.", "error");
    return;
  }

  // Validate dates
  const startDate = new Date(tanggalStart);
  const endDate = new Date(tanggalEnd);
  if (endDate <= startDate) {
    showMessage("Tanggal berakhir harus setelah tanggal mulai.", "error");
    return;
  }

  const payload = {
    nama: nama,
    alamat: alamat,
    noWA: noWA,
    latitude: latitude,
    longitude: longitude,
    tanggalStart: tanggalStart,
    tanggalEnd: tanggalEnd,
    status: status,
    jenisSampah: jenisSampah,
    idUser: user.id
  };

  console.log("Submitting upgrade data:", payload);

  // Show loading
  showMessage("Mengirim permohonan upgrade...", "info");
  const submitBtn = document.querySelector('#formUpgrade button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = "⏳ Mengirim...";

  try {
    // PERBAIKI: Gunakan getAuthHeaders() bukan authHeader()
    const response = await fetch(`${API.upgradeAnggota}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    let data;
    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.log("Non-JSON response:", text.substring(0, 200));
      data = { message: text };
    }

    if (!response.ok) {
      throw new Error(data.detail || data.message || `HTTP ${response.status}`);
    }

    // Success
    showMessage("✅ Permohonan upgrade berhasil dikirim! Status Anda akan diubah menjadi anggota setelah verifikasi.", "success");
    
    // Update user role in localStorage
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    currentUser.role = 'pending_anggota'; // atau 'anggota' tergantung backend
    localStorage.setItem('user', JSON.stringify(currentUser));
    
    // Redirect after 3 seconds
    setTimeout(() => {
      window.location.hash = "#/dashboard";
    }, 3000);

  } catch (error) {
    console.error("Upgrade error:", error);
    showMessage(`❌ Gagal mengirim permohonan: ${error.message}`, "error");
    
    // Enable button
    submitBtn.disabled = false;
    submitBtn.innerHTML = "📋 Ajukan Upgrade";
  }
}

// Helper function untuk menampilkan pesan
function showMessage(message, type = "info") {
  const messageDiv = document.getElementById("formMessage");
  if (!messageDiv) return;
  
  messageDiv.innerHTML = "";
  messageDiv.style.padding = "10px 15px";
  messageDiv.style.borderRadius = "4px";
  messageDiv.style.marginTop = "10px";
  messageDiv.style.fontSize = "14px";
  
  if (type === "error") {
    messageDiv.style.backgroundColor = "#ffebee";
    messageDiv.style.color = "#c62828";
    messageDiv.style.border = "1px solid #ffcdd2";
  } else if (type === "success") {
    messageDiv.style.backgroundColor = "#e8f5e9";
    messageDiv.style.color = "#2e7d32";
    messageDiv.style.border = "1px solid #c8e6c9";
  } else {
    messageDiv.style.backgroundColor = "#e3f2fd";
    messageDiv.style.color = "#1565c0";
    messageDiv.style.border = "1px solid #bbdefb";
  }
  
  messageDiv.textContent = message;
  
  // Auto-hide info messages after 5 seconds
  if (type === "info") {
    setTimeout(() => {
      if (messageDiv.textContent === message) {
        messageDiv.innerHTML = "";
        messageDiv.style = "";
      }
    }, 5000);
  }
}

// Test endpoint function
window.testUpgradeEndpoint = async function() {
  console.log("Testing endpoint:", API.upgradeAnggota);
  console.log("Token:", localStorage.getItem('access')?.substring(0, 20) + '...');
  
  try {
    const response = await fetch(API.upgradeAnggota, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    console.log('GET Response status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    const text = await response.text();
    console.log('Response (first 300 chars):', text.substring(0, 300));
  } catch (error) {
    console.error('Test failed:', error);
  }
};