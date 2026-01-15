import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { authGuard } from "../../utils/authGuard.js";
import { loadLeaflet, initMapForm } from "../../utils/mapConfig.js";

let gpsMarker = null;
let locationFromGPS = false;
let clickMarker = null; // Marker untuk klik peta

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
      headers: getAuthHeaders(),
    });
    if (response.ok) {
      const data = await response.json();
      userData = data;
    }
  } catch (error) {
    console.error("Error fetching user details:", error);
  }

  app.innerHTML = `
    <style>
      .validation-error {
        color: #dc3545;
        font-size: 0.875rem;
        margin-top: 0.25rem;
        display: none;
      }
      .is-invalid {
        border-color: #dc3545 !important;
      }
      .form-control:disabled {
        background-color: #f8f9fa;
        opacity: 0.8;
        cursor: not-allowed;
      }
      .date-info {
        font-size: 0.85rem;
        color: #6c757d;
        margin-top: 0.25rem;
      }
    </style>
    
    <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
      <h3>Upgrade Menjadi Anggota CleanUp</h3>
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
            <label><strong>Nama Lengkap *</strong></label>
            <input type="text" id="nama" required value="${
              userData.first_name || userData.username || ""
            }" 
                   style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-top: 5px;">
            <div id="namaError" class="validation-error"></div>
          </div>
          
          <div>
            <label><strong>Nomor WhatsApp *</strong></label>
            <input type="text" id="noWA" maxlength="12" required placeholder="Contoh: 081234567890" value="08"
                   style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-top: 5px;">
            <div id="noWAError" class="validation-error"></div>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <label><strong>Alamat Lengkap *</strong></label>
          <textarea id="alamat" required rows="3" placeholder="Alamat lengkap termasuk RT/RW, kelurahan, kecamatan"
                    style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-top: 5px;"></textarea>
          <div id="alamatError" class="validation-error"></div>
        </div>

        <div style="margin-bottom: 20px;">
          <label><strong>Lokasi Rumah (Klik pada peta untuk menandai) *</strong></label>
          <div id="mapSelect" style="height: 300px; width: 100%; border:1px solid #ccc; border-radius: 4px; margin-top: 5px;"></div>
          <div style="margin-top: 10px; display: flex; gap: 10px;">
            <button type="button" id="btnGetLocation"
              style="
                background:#2196F3;
                color:white;
                padding:10px 14px;
                border:none;
                border-radius:4px;
                cursor:pointer;
                font-size:14px;
                flex: 1;
              ">
              📍 Gunakan Lokasi Saya (GPS)
            </button>
            <button type="button" id="btnClearMarker"
              style="
                background:#f44336;
                color:white;
                padding:10px 14px;
                border:none;
                border-radius:4px;
                cursor:pointer;
                font-size:14px;
                flex: 1;
              ">
              🗑️ Hapus Marker
            </button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <label><strong>Latitude *</strong></label>
            <input type="number" id="latitude" step="0.00000001" readonly required 
                   style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-top: 5px; background: #f5f5f5;">
            <div id="latitudeError" class="validation-error"></div>
          </div>
          
          <div>
            <label><strong>Longitude *</strong></label>
            <input type="number" id="longitude" step="0.00000001" readonly required 
                   style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-top: 5px; background: #f5f5f5;">
            <div id="longitudeError" class="validation-error"></div>
          </div>
        </div>

        <div style="margin-bottom: 20px; display: none;">
          <label><strong>Tanggal Mulai Keanggotaan *</strong></label>
          <div style="display: flex; gap: 10px; align-items: center;">
            <input type="date" id="tanggalStart" required 
                   style="display:none;">
            <button type="button" id="btnSetToday" 
                    style="background: #6c757d; color: white; padding: 10px 14px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; margin-top: 5px;">
              📅 Set Hari Ini
            </button>
          </div>
          <div class="date-info" id="tanggalStartInfo">Tanggal mulai keanggotaan</div>
          <div id="tanggalStartError" class="validation-error"></div>
        </div>

        <div style="margin-bottom: 20px; display: none;">
          <label><strong>Tanggal Berakhir *</strong></label>
          <input type="date" id="tanggalEnd" readonly required 
                 style="display: none;">
          <div class="date-info" id="tanggalEndInfo">Otomatis dihitung 1 bulan dari tanggal mulai</div>
          <div id="tanggalEndError" class="validation-error"></div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <label><strong>Jenis Sampah *</strong></label>
            <select id="jenisSampah" required 
                    style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-top: 5px;">
              <option value="">-- Pilih Jenis Sampah --</option>
              <option value="rumah_tangga">Rumah Tangga</option>
              <option value="tempat_usaha">Tempat Usaha</option>
            </select>
            <div id="jenisSampahError" class="validation-error"></div>
          </div>
          
          <div>
            <label><strong>Status Keanggotaan *</strong></label>
            <select id="status" required disabled
                    style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-top: 5px; background: #f5f5f5;">
              <option value="aktif">Aktif</option>
            </select>
            <div class="date-info">Status akan otomatis "Aktif"</div>
          </div>
        </div>

        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 5px solid #ffc107; margin-bottom: 20px;">
          <h4 style="color: #856404; margin-top: 0; margin-bottom: 10px;">
            <i class="bi bi-info-circle"></i> Informasi Keanggotaan
          </h4>
          <ul style="margin-bottom: 0; color: #856404;">
            <li>Durasi keanggotaan: <strong>1 bulan</strong> (30 hari)</li>
            <li>Biaya: <strong>Rp 50.000 per bulan</strong></li>
            <li>Layanan: <strong>4 kali angkut sampah per bulan</strong></li>
            <li>Status: <strong>Aktif</strong></li>
            <li>Verifikasi: <strong>1x24 jam</strong> setelah pengajuan</li>
          </ul>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="submit" id="submitBtn"
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

  // Set default dates otomatis
  setupAutoDates();

  // Tombol "Set Hari Ini"
  document.getElementById("btnSetToday").onclick = () => {
    setTodayDate();
  };

  // Setup real-time validation
  setupValidation();

  // Load peta dengan marker default
  loadLeaflet(() => {
    // Default location: Kupang
    const defaultLat = -10.1772;
    const defaultLng = 123.607;

    initMapForm("mapSelect", "latitude", "longitude", defaultLat, defaultLng)
      .then((map) => {
        window.__upgradeMap = map;

        // Tambahkan event listener untuk klik pada peta
        map.on("click", function (e) {
          const { lat, lng } = e.latlng;

          // Update input fields
          document.getElementById("latitude").value = lat.toFixed(7);
          document.getElementById("longitude").value = lng.toFixed(7);

          // Hapus marker GPS jika ada
          if (gpsMarker) {
            gpsMarker.remove();
            Marker = null;
            locationFromGPS = false;
          }

          // Tambah atau update marker klik
          if (!clickMarker) {
            // Buat custom icon hijau untuk marker klik
            const greenIcon = L.divIcon({
              html: `<div style="
                background-color: #4CAF50;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 10px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
              ">
                <i class="bi bi-house" style="font-size: 12px;"></i>
              </div>`,
              className: "custom-marker-icon",
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            });

            clickMarker = L.marker([lat, lng], { icon: greenIcon }).addTo(map);
          } else {
            clickMarker.setLatLng([lat, lng]);
          }

          // Update popup
          clickMarker
            .bindPopup(
              `
            <div style="font-size: 14px;">
              <strong>📍 Lokasi Rumah</strong><br>
              Lat: ${lat.toFixed(6)}<br>
              Lng: ${lng.toFixed(6)}
            </div>
          `
            )
            .openPopup();

          // Zoom ke lokasi
          map.setView([lat, lng], 17);

          // Validasi koordinat
          validateField("latitude");
          validateField("longitude");
          updateSubmitButton();

          showMessage("✅ Lokasi berhasil dipilih dengan klik peta", "success");
        });

        setTimeout(() => {
          map.invalidateSize();
        }, 300);
      })
      .catch((err) => {
        console.error("Gagal inisialisasi peta:", err);
      });

    // Set default values
    document.getElementById("latitude").value = defaultLat;
    document.getElementById("longitude").value = defaultLng;

    // Validasi awal
    validateAllFields();
    updateSubmitButton();
  });

  // ================================
  // GPS BUTTON - GUNAKAN LOKASI SAYA
  // ================================
  const btnGetLocation = document.getElementById("btnGetLocation");

  btnGetLocation.addEventListener("click", () => {
    if (!("geolocation" in navigator)) {
      showMessage("❌ Browser Anda tidak mendukung GPS", "error");
      return;
    }

    btnGetLocation.disabled = true;
    btnGetLocation.innerHTML = "⏳ Mengambil lokasi...";

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // Update input fields
        document.getElementById("latitude").value = latitude.toFixed(7);
        document.getElementById("longitude").value = longitude.toFixed(7);

        // Update map
        if (window.__upgradeMap) {
          const map = window.__upgradeMap;

          // Set view ke lokasi GPS
          map.setView([latitude, longitude], 17);

          // Hapus marker klik jika ada
          if (clickMarker) {
            clickMarker.remove();
            clickMarker = null;
          }

          // Buat custom icon biru untuk GPS
          const blueIcon = L.divIcon({
            html: `<div style="
              background-color: #2196F3;
              width: 35px;
              height: 35px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 0 10px rgba(33, 150, 243, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
            ">
              <i class="bi bi-geo-alt-fill" style="font-size: 16px;"></i>
            </div>`,
            className: "gps-marker-icon",
            iconSize: [35, 35],
            iconAnchor: [17.5, 17.5],
          });

          // Tambah atau update marker GPS
          if (!gpsMarker) {
            gpsMarker = L.marker([latitude, longitude], {
              icon: blueIcon,
            }).addTo(map);
          } else {
            gpsMarker.setLatLng([latitude, longitude]);
          }

          // Update popup
          gpsMarker
            .bindPopup(
              `
            <div style="font-size: 14px;">
              <strong>📍 Lokasi GPS Anda</strong><br>
              Lat: ${latitude.toFixed(6)}<br>
              Lng: ${longitude.toFixed(6)}<br>
              <small>Akurasi: ±${Math.round(accuracy)} meter</small>
            </div>
          `
            )
            .openPopup();

          setTimeout(() => {
            map.invalidateSize();
          }, 200);
        }

        // Validasi koordinat
        validateField("latitude");
        validateField("longitude");
        updateSubmitButton();

        showMessage(
          `📍 Lokasi GPS berhasil diambil<br>
          <small>Akurasi ±${Math.round(accuracy)} meter</small>`,
          "success"
        );

        locationFromGPS = true;

        btnGetLocation.disabled = false;
        btnGetLocation.innerHTML = "📍 Gunakan Lokasi Saya (GPS)";
      },
      (error) => {
        let msg = "Gagal mengambil lokasi GPS";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg =
              "❌ Izin lokasi ditolak. Izinkan akses lokasi di browser Anda.";
            break;
          case error.POSITION_UNAVAILABLE:
            msg = "❌ Lokasi tidak tersedia. Pastikan GPS aktif.";
            break;
          case error.TIMEOUT:
            msg = "⏱️ Waktu tunggu habis. Coba lagi.";
            break;
        }

        showMessage(msg, "error");
        btnGetLocation.disabled = false;
        btnGetLocation.innerHTML = "📍 Gunakan Lokasi Saya (GPS)";
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });

  // ================================
  // TOMBOL HAPUS MARKER
  // ================================
  const btnClearMarker = document.getElementById("btnClearMarker");
  btnClearMarker.addEventListener("click", () => {
    // Hapus semua marker
    if (gpsMarker) {
      gpsMarker.remove();
      gpsMarker = null;
      locationFromGPS = false;
    }

    if (clickMarker) {
      clickMarker.remove();
      clickMarker = null;
    }

    // Reset koordinat ke default
    const defaultLat = -10.1772;
    const defaultLng = 123.607;

    document.getElementById("latitude").value = defaultLat;
    document.getElementById("longitude").value = defaultLng;

    // Reset view peta ke default
    if (window.__upgradeMap) {
      window.__upgradeMap.setView([defaultLat, defaultLng], 13);
    }

    // Validasi koordinat
    validateField("latitude");
    validateField("longitude");
    updateSubmitButton();

    showMessage("🗑️ Semua marker telah dihapus", "info");
  });

  // Submit form
  document.getElementById("formUpgrade").onsubmit = handleSubmitUpgrade;
}

// ================================
// FUNGSI TANGGAL OTOMATIS
// ================================
function setupAutoDates() {
  // Set default: hari ini sebagai tanggal mulai
  const today = new Date();
  setDateToInput("tanggalStart", today);

  // Hitung tanggal berakhir (1 bulan dari hari ini)
  const oneMonthLater = new Date(today);
  oneMonthLater.setMonth(today.getMonth() + 1);
  setDateToInput("tanggalEnd", oneMonthLater);

  // Update info text
  updateDateInfoText();

  // Event listener untuk tanggal mulai
  document
    .getElementById("tanggalStart")
    .addEventListener("change", function () {
      const startDate = new Date(this.value);

      // Validasi: tanggal tidak boleh sebelum hari ini
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        showMessage("❌ Tanggal mulai tidak boleh sebelum hari ini", "error");
        setTodayDate();
        return;
      }

      // Hitung tanggal berakhir (1 bulan dari tanggal mulai)
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + 1);

      setDateToInput("tanggalEnd", endDate);
      updateDateInfoText();
      validateField("tanggalStart");
      validateField("tanggalEnd");
      updateSubmitButton();
    });
}

function setTodayDate() {
  const today = new Date();
  setDateToInput("tanggalStart", today);

  // Hitung tanggal berakhir
  const oneMonthLater = new Date(today);
  oneMonthLater.setMonth(today.getMonth() + 1);
  setDateToInput("tanggalEnd", oneMonthLater);

  updateDateInfoText();
  showMessage("✅ Tanggal mulai diatur ke hari ini", "success");

  // Validasi
  validateField("tanggalStart");
  validateField("tanggalEnd");
  updateSubmitButton();
}

function setDateToInput(inputId, date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;

  document.getElementById(inputId).value = dateString;
}

function updateDateInfoText() {
  const startDate = new Date(document.getElementById("tanggalStart").value);
  const endDate = new Date(document.getElementById("tanggalEnd").value);

  // Format tanggal untuk display
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const startFormatted = startDate.toLocaleDateString("id-ID", options);
  const endFormatted = endDate.toLocaleDateString("id-ID", options);

  // Hitung durasi dalam hari
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Update info text
  document.getElementById(
    "tanggalStartInfo"
  ).textContent = `Mulai: ${startFormatted}`;
  document.getElementById(
    "tanggalEndInfo"
  ).textContent = `Berakhir: ${endFormatted} (${diffDays} hari)`;
}

// ================================
// VALIDASI FORM
// ================================
function setupValidation() {
  const inputs = [
    "nama",
    "noWA",
    "alamat",
    "latitude",
    "longitude",
    "tanggalStart",
    "jenisSampah",
  ];

  inputs.forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("input", () => {
        validateField(id);
        updateSubmitButton();
      });
      input.addEventListener("blur", () => {
        validateField(id);
        updateSubmitButton();
      });
    }
  });

  // Khusus untuk select
  document.getElementById("jenisSampah").addEventListener("change", () => {
    validateField("jenisSampah");
    updateSubmitButton();
  });
}

// Fungsi validasi tunggal untuk semua field
function validateField(fieldId) {
  const input = document.getElementById(fieldId);
  const errorDiv = document.getElementById(`${fieldId}Error`);
  const value = input.value.trim();

  if (!errorDiv) return true;

  let isValid = true;
  let errorMessage = "";

  switch (fieldId) {
    case "nama":
      if (!value) {
        errorMessage = "Nama lengkap harus diisi";
        isValid = false;
      } else if (value.length < 3) {
        errorMessage = "Nama minimal 3 karakter";
        isValid = false;
      }
      break;

    case "noWA":
      if (!value) {
        errorMessage = "Nomor WhatsApp harus diisi";
        isValid = false;
        break;
      }

      // Ambil angka saja
      const cleanNumber = value.replace(/[^0-9]/g, "");

      // Harus diawali 08
      if (!cleanNumber.startsWith("08")) {
        errorMessage = "Nomor WhatsApp harus diawali 08";
        isValid = false;
      }
      // Panjang 10–15 digit
      else if (cleanNumber.length < 10 || cleanNumber.length > 12) {
        errorMessage = "Nomor WhatsApp harus 12 digit";
        isValid = false;
      }

      break;

    case "alamat":
      if (!value) {
        errorMessage = "Alamat harus diisi";
        isValid = false;
      } else if (value.length < 6) {
        errorMessage = "Alamat terlalu pendek";
        isValid = false;
      }
      break;

    case "latitude":
    case "longitude":
      if (!value) {
        errorMessage = "Pilih lokasi di peta atau gunakan GPS";
        isValid = false;
      }
      break;

    case "tanggalStart":
      if (!value) {
        errorMessage = "Tanggal mulai harus diisi";
        isValid = false;
      } else {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
          errorMessage = "Tanggal tidak boleh sebelum hari ini";
          isValid = false;
        }
      }
      break;

    case "tanggalEnd":
      // Validasi otomatis, tidak perlu error message spesifik
      break;

    case "jenisSampah":
      if (!value) {
        errorMessage = "Pilih jenis sampah";
        isValid = false;
      }
      break;
  }

  // Update UI
  if (isValid) {
    errorDiv.style.display = "none";
    errorDiv.textContent = "";
    input.classList.remove("is-invalid");
  } else {
    errorDiv.style.display = "block";
    errorDiv.textContent = errorMessage;
    input.classList.add("is-invalid");
  }

  return isValid;
}

// Validasi semua field sekaligus
function validateAllFields() {
  const fields = [
    "nama",
    "noWA",
    "alamat",
    "latitude",
    "longitude",
    "tanggalStart",
    "jenisSampah",
  ];
  let allValid = true;

  fields.forEach((fieldId) => {
    if (!validateField(fieldId)) {
      allValid = false;
    }
  });

  return allValid;
}

// Update tombol submit
function updateSubmitButton() {
  const isValid = validateAllFields();
  const submitBtn = document.getElementById("submitBtn");

  submitBtn.disabled = !isValid;
  submitBtn.style.backgroundColor = isValid ? "#4CAF50" : "#cccccc";
  submitBtn.style.cursor = isValid ? "pointer" : "not-allowed";

  // Update text pada tombol
  if (isValid) {
    submitBtn.innerHTML = "📋 Ajukan Upgrade";
  } else {
    submitBtn.innerHTML = "⚠️ Lengkapi Data";
  }
}

// ================================
// HANDLE FORM SUBMISSION
// ================================
async function handleSubmitUpgrade(e) {
  e.preventDefault();

  // Validasi sebelum submit
  if (!validateAllFields()) {
    showMessage("Periksa kembali data yang Anda masukkan", "error");
    return;
  }

  // Cek session
  const access = localStorage.getItem("access");
  if (!access) {
    handleSessionExpiredSimple();
    return;
  }

  const user = await authGuard();
  if (!user || user.role !== "tamu") {
    showMessage("Hanya Tamu yang bisa melakukan upgrade anggota.", "error");
    return;
  }

  const nama = document.getElementById("nama").value.trim();
  const alamat = document.getElementById("alamat").value.trim();
  const noWA = document.getElementById("noWA").value.trim();
  const latitude = parseFloat(document.getElementById("latitude").value);
  const longitude = parseFloat(document.getElementById("longitude").value);
  const tanggalStart = document.getElementById("tanggalStart").value;
  const tanggalEnd = document.getElementById("tanggalEnd").value;
  const jenisSampah = document.getElementById("jenisSampah").value;

  // Status otomatis "aktify"
  const status = "aktif";

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
    idUser: user.id,
  };

  console.log("Submitting upgrade data:", payload);

  // Show loading
  showMessage("Mengirim permohonan upgrade...", "info");
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Mengirim...';

  try {
    const response = await fetch(`${API.upgradeAnggota}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    console.log("Response status:", response.status);

    // CEK JIKA UNAUTHORIZED
    if (response.status === 401 || response.status === 403) {
      handleSessionExpiredSimple();
      return;
    }

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
    showMessage(
      "✅ Permohonan upgrade berhasil dikirim! Status Anda Sekarang Aktif. ",
      "success"
    );

    // Update user role in localStorage
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    currentUser.role = "anggota";
    localStorage.setItem("user", JSON.stringify(currentUser));

    // Redirect setelah 3 detik
    setTimeout(() => {
      window.location.hash = "#/login";
    }, 3000);
  } catch (error) {
    console.error("Upgrade error:", error);

    // CEK JIKA ERROR TERKAIT AUTH
    if (
      error.message.includes("401") ||
      error.message.includes("Unauthorized") ||
      error.message.includes("403") ||
      error.message.includes("Forbidden")
    ) {
      handleSessionExpiredSimple();
      return;
    }

    showMessage(`❌ Gagal mengirim permohonan: ${error.message}`, "error");

    // Enable button
    submitBtn.disabled = false;
    submitBtn.innerHTML = "📋 Upgrade";
    updateSubmitButton();
  }
}

// SIMPLE SESSION EXPIRED HANDLER
function handleSessionExpiredSimple() {
  // Hapus semua data auth
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");

  // Tampilkan alert
  alert("Session expired. Silakan login kembali.");

  // Redirect langsung ke login
  window.location.hash = "#/login";

  // Force reload untuk clear semua state
  setTimeout(() => {
    window.location.reload();
  }, 100);
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

  messageDiv.innerHTML = message; // Menggunakan innerHTML untuk mendukung tag <small>

  // Auto-hide info messages after 5 seconds
  if (type === "info") {
    setTimeout(() => {
      if (messageDiv.innerHTML === message) {
        messageDiv.innerHTML = "";
        messageDiv.style = "";
      }
    }, 5000);
  }
}

// Test endpoint function
window.testUpgradeEndpoint = async function () {
  console.log("Testing endpoint:", API.upgradeAnggota);
  console.log(
    "Token:",
    localStorage.getItem("access")?.substring(0, 20) + "..."
  );

  try {
    const response = await fetch(API.upgradeAnggota, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    console.log("GET Response status:", response.status);
    console.log("Content-Type:", response.headers.get("content-type"));

    const text = await response.text();
    console.log("Response (first 300 chars):", text.substring(0, 300));
  } catch (error) {
    console.error("Test failed:", error);
  }
};
