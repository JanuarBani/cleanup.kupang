import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showModal, showConfirmModal } from "../../utils/modal.js";
import {
  loadLeaflet,
  initMap,
  addMarker,
  createCustomIcon,
} from "../../utils/mapConfig.js";

import { showToast } from "../../utils/toast.js";

function showFormToast(message, type = 'info') {
  if (typeof showToast === 'function') {
    showToast(message, type, 5000);
  } else {
    alert(`${type.toUpperCase()}: ${message}`);
  }
}

let mapAll = null;
let markersLayer = null;
let laporanAllData = [];
let laporanCurrentPage = 1;
const laporanPerPage = 10;

// Variabel untuk map edit laporan
let editLaporanMap = null;
let editLaporanMarker = null;
let editLaporanGPSMarker = null;

// Variabel untuk map tambah laporan
let addLaporanMap = null;
let addLaporanMarker = null;
let addLaporanGPSMarker = null;

export async function laporanAdminPage() {
  const mainContent = document.getElementById("mainContent");
  if (!document.getElementById('modalContainer')) {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modalContainer';
    document.body.appendChild(modalContainer);
  }
  
  mainContent.innerHTML = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Manajemen Laporan Sampah</h2>
                <button id="addLaporanBtn" class="btn btn-success">
                    <i class="bi bi-plus-circle"></i> Tambah Laporan
                </button>
            </div>

            <!-- PETA BESAR -->
            <div id="mapAllLaporan" style="
                width: 100%;
                height: 350px;
                border-radius: 10px;
                margin: 20px 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            "></div>
            
            <!-- FILTER DAN PENCARIAN -->
            <div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                <input type="text" id="searchLaporan" placeholder="Cari laporan..." style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 250px;">
                <input type="date" id="filterDate" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <select id="filterStatus" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="">Semua Status</option>
                    <option value="pending">Pending</option>
                    <option value="proses">Proses</option>
                    <option value="selesai">Selesai</option>
                    <option value="ditolak">Ditolak</option>
                    <option value="diterima">Diterima</option>
                </select>
                <button id="resetFilter" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Reset Filter</button>
            </div>
            
            <!-- Info Pagination -->
            <div id="paginationInfo" style="margin-bottom: 10px; font-size: 14px; color: #666;"></div>
            
            <!-- Tabel Container -->
            <div id="laporanTableContainer" style="overflow-x: auto;">
                <p>Loading data...</p>
            </div>
            
            <!-- Pagination Container -->
            <div id="paginationContainer" style="margin-top: 20px; display: flex; justify-content: center;"></div>
        </div>
    `;

  // Reset variabel pagination
  laporanCurrentPage = 1;
  laporanAllData = [];

  // Event listener untuk tombol tambah
  document.getElementById("addLaporanBtn").onclick = () => showAddLaporanForm();
  document.getElementById("searchLaporan").oninput = loadLaporan;
  document.getElementById("filterDate").onchange = loadLaporan;
  document.getElementById("filterStatus").onchange = loadLaporan;
  document.getElementById("resetFilter").onclick = () => {
    document.getElementById("searchLaporan").value = "";
    document.getElementById("filterDate").value = "";
    document.getElementById("filterStatus").value = "";
    loadLaporan();
  };

  loadLaporan();
}

// FUNGSI UNTUK TAMBAH LAPORAN BARU
async function showAddLaporanForm() {
  try {
    // Ambil data user dari localStorage untuk mendapatkan user yang login
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const idUser = currentUser?.id || 1; // Default to 1 if not available
    
    const formHTML = `
            <form id="addLaporanForm" class="needs-validation" novalidate>
                <div class="mb-3">
                    <label for="nama" class="form-label">Nama Pelapor *</label>
                    <input type="text" class="form-control" id="nama" value="${currentUser.username || ''}" required>
                    <div class="valid-feedback">Valid.</div>
                    <div class="invalid-feedback">Nama pelapor wajib diisi.</div>
                </div>
                
                <div class="mb-3">
                    <label for="alamat" class="form-label">Alamat Lengkap *</label>
                    <textarea class="form-control" id="alamat" required rows="3" placeholder="Masukkan alamat lengkap tempat sampah"></textarea>
                    <div class="valid-feedback">Valid.</div>
                    <div class="invalid-feedback">Alamat wajib diisi.</div>
                </div>
                
                <!-- PETA LOKASI -->
                <div class="mb-3">
                    <label class="form-label">
                        <i class="bi bi-geo-alt me-1"></i>Pilih Lokasi di Peta
                    </label>
                    
                    <!-- Tombol GPS -->
                    <div class="d-flex gap-2 mb-2">
                        <button type="button" id="btnGetGPSLocationAdd" class="btn btn-success">
                            <i class="bi bi-crosshair me-1"></i> Dapatkan Lokasi GPS
                        </button>
                        <button type="button" id="btnResetMapLocationAdd" class="btn btn-secondary">
                            <i class="bi bi-arrow-clockwise me-1"></i> Reset Peta
                        </button>
                    </div>
                    
                    <!-- Status GPS -->
                    <div id="gpsStatusAdd" class="mb-2">
                        <div id="gpsLoadingAdd" class="alert alert-primary d-none py-1" role="alert">
                            <i class="bi bi-hourglass-split me-1"></i> Mendapatkan lokasi...
                        </div>
                        <div id="gpsSuccessAdd" class="alert alert-success d-none py-1" role="alert">
                            <i class="bi bi-check-circle me-1"></i> Lokasi berhasil didapatkan
                        </div>
                        <div id="gpsErrorAdd" class="alert alert-danger d-none py-1" role="alert">
                            <i class="bi bi-exclamation-circle me-1"></i> Gagal mendapatkan lokasi
                        </div>
                    </div>
                    
                    <!-- Peta -->
                    <div id="mapAddLaporan" style="
                        width: 100%;
                        height: 250px;
                        border: 1px solid #ddd;
                        border-radius: 6px;
                        margin-bottom: 10px;
                        background: #f8f9fa;
                    "></div>
                    
                    <small class="text-muted">
                        <i class="bi bi-info-circle me-1"></i>
                        Klik pada peta untuk memilih lokasi atau gunakan tombol GPS
                    </small>
                </div>
                
                <!-- Koordinat Input -->
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="latitude" class="form-label">
                            <i class="bi bi-geo-alt-fill me-1"></i>Latitude *
                        </label>
                        <div class="input-group">
                            <input type="number" step="any" class="form-control" id="latitude" value="-10.1711872" required>
                            <button type="button" class="btn btn-outline-secondary" onclick="copyLaporanAddValue('latitude')">
                                <i class="bi bi-clipboard"></i>
                            </button>
                            <div class="valid-feedback">Valid.</div>
                            <div class="invalid-feedback">Latitude harus angka antara -90 sampai 90.</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <label for="longitude" class="form-label">
                            <i class="bi bi-geo-alt-fill me-1"></i>Longitude *
                        </label>
                        <div class="input-group">
                            <input type="number" step="any" class="form-control" id="longitude" value="123.6149376" required>
                            <button type="button" class="btn btn-outline-secondary" onclick="copyLaporanAddValue('longitude')">
                                <i class="bi bi-clipboard"></i>
                            </button>
                            <div class="valid-feedback">Valid.</div>
                            <div class="invalid-feedback">Longitude harus angka antara -180 sampai 180.</div>
                        </div>
                    </div>
                </div>
                
                <!-- Lokasi Cepat -->
                <div class="mb-3">
                    <label class="form-label">
                        <i class="bi bi-lightning-charge me-1"></i>Lokasi Cepat
                    </label>
                    <div class="d-flex flex-wrap gap-2">
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="setLaporanAddLocation(-10.1711872, 123.6149376, 'Lokasi Tetap')">
                            <i class="bi bi-house me-1"></i> Lokasi Tetap
                        </button>
                        <button type="button" class="btn btn-outline-success btn-sm" onclick="setLaporanAddLocation(-10.1935921, 123.6149376, 'Kota Kupang')">
                            <i class="bi bi-geo-alt me-1"></i> Kota Kupang
                        </button>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="deskripsi" class="form-label">Deskripsi Masalah *</label>
                    <textarea class="form-control" id="deskripsi" required rows="4" placeholder="Deskripsikan kondisi sampah di lokasi tersebut"></textarea>
                    <div class="valid-feedback">Valid.</div>
                    <div class="invalid-feedback">Deskripsi masalah wajib diisi.</div>
                </div>
                
                <div class="mb-3">
                    <label for="status" class="form-label">Status Laporan *</label>
                    <select class="form-select" id="status" required>
                        <option value="" selected disabled>Pilih status...</option>
                        <option value="pending">⏳ Pending</option>
                        <option value="proses">🔄 Proses</option>
                        <option value="selesai">✅ Selesai</option>
                    </select>
                    <div class="valid-feedback">Valid.</div>
                    <div class="invalid-feedback">Status laporan wajib dipilih.</div>
                </div>
                
                <div class="mb-3">
                    <label for="foto_bukti" class="form-label">Foto Bukti *</label>
                    <input type="file" class="form-control" id="foto_bukti" accept="image/*" required>
                    <div class="form-text">Maksimal 5MB. Format: JPG, PNG, GIF.</div>
                    
                    <div id="previewContainerAdd" class="mt-2 d-none">
                        <p class="mb-1">Preview:</p>
                        <img id="fotoPreviewAdd" class="img-thumbnail" style="max-width: 200px;">
                    </div>
                </div>
            </form>
        `;

    showModal("Tambah Laporan Sampah", formHTML, async () => {
      // Validasi form dengan Bootstrap
      const form = document.getElementById('addLaporanForm');
      form.classList.add('was-validated');
      
      // Periksa validitas form
      if (!form.checkValidity()) {
        showFormToast("Harap isi semua field yang wajib diisi dengan benar", "error");
        return false;
      }

      // Validasi koordinat secara manual
      const latitude = parseFloat(document.getElementById("latitude").value);
      const longitude = parseFloat(document.getElementById("longitude").value);
      
      if (isNaN(latitude) || latitude < -90 || latitude > 90) {
        document.getElementById("latitude").classList.add('is-invalid');
        document.getElementById("latitude").classList.remove('is-valid');
        showFormToast("Latitude harus angka antara -90 sampai 90", "error");
        return false;
      } else {
        document.getElementById("latitude").classList.add('is-valid');
        document.getElementById("latitude").classList.remove('is-invalid');
      }
      
      if (isNaN(longitude) || longitude < -180 || longitude > 180) {
        document.getElementById("longitude").classList.add('is-invalid');
        document.getElementById("longitude").classList.remove('is-valid');
        showFormToast("Longitude harus angka antara -180 sampai 180", "error");
        return false;
      } else {
        document.getElementById("longitude").classList.add('is-valid');
        document.getElementById("longitude").classList.remove('is-invalid');
      }
      
      // Validasi file wajib
      const fotoInput = document.getElementById("foto_bukti");
      if (fotoInput.files.length === 0) {
        fotoInput.classList.add('is-invalid');
        fotoInput.classList.remove('is-valid');
        showFormToast("Foto bukti wajib diunggah", "error");
        return false;
      }
      
      const file = fotoInput.files[0];
      const maxSize = 5 * 1024 * 1024; // 5MB
        
      // Cek tipe file
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        fotoInput.classList.add('is-invalid');
        fotoInput.classList.remove('is-valid');
        showFormToast("File harus berupa gambar (JPG, PNG, GIF)", "error");
        return false;
      }
      
      // Cek ukuran file
      if (file.size > maxSize) {
        fotoInput.classList.add('is-invalid');
        fotoInput.classList.remove('is-valid');
        showFormToast("Ukuran file maksimal 5MB", "error");
        return false;
      } else {
        fotoInput.classList.add('is-valid');
        fotoInput.classList.remove('is-invalid');
      }

      // Collect form data
      const formData = new FormData();
      formData.append("nama", document.getElementById("nama").value.trim());
      formData.append("alamat", document.getElementById("alamat").value.trim());
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
      formData.append("deskripsi", document.getElementById("deskripsi").value.trim());
      formData.append("status", document.getElementById("status").value);
      formData.append("tanggal_lapor", new Date().toISOString().split("T")[0]); // Today's date
      formData.append("idUser", idUser); // User ID from current user
      
      if (fotoInput.files.length > 0) {
        formData.append("foto_bukti", fotoInput.files[0]);
      }

      try {
        const token = localStorage.getItem("access");
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // Tampilkan loading
        const submitBtn = document.querySelector('.modal-footer .btn-primary');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
        submitBtn.disabled = true;

        // Kirim data menggunakan POST
        const response = await fetch(API.laporanSampah, {
          method: "POST",
          headers: headers,
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP ${response.status}`);
        }

        showFormToast("Laporan berhasil ditambahkan!", "success");
        loadLaporan();
        return true;
      } catch (error) {
        console.error("Error adding laporan:", error);
        showFormToast("Gagal menambahkan laporan: " + error.message, "error");
        return false;
      }
    });

    // Setup event listeners setelah modal terbuka
    setTimeout(() => {
      // Setup map untuk tambah laporan
      setupAddLaporanMap();
      
      // Setup event listeners untuk tombol GPS
      const btnGPS = document.getElementById("btnGetGPSLocationAdd");
      const btnResetMap = document.getElementById("btnResetMapLocationAdd");
      
      if (btnGPS) {
        btnGPS.onclick = () => getGPSCurrentLocationForAddLaporan();
      }
      
      if (btnResetMap) {
        btnResetMap.onclick = () => resetAddLaporanMap();
      }

      // Setup validasi real-time
      const inputs = document.querySelectorAll('#addLaporanForm input, #addLaporanForm textarea, #addLaporanForm select');
      inputs.forEach(input => {
        input.addEventListener('input', function() {
          if (this.checkValidity()) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
          } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
          }
        });
        
        input.addEventListener('change', function() {
          if (this.checkValidity()) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
          } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
          }
        });
      });

      // Validasi koordinat khusus
      const latInput = document.getElementById('latitude');
      const lngInput = document.getElementById('longitude');
      
      if (latInput) {
        latInput.addEventListener('input', function() {
          const value = parseFloat(this.value);
          if (!isNaN(value) && value >= -90 && value <= 90) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
          } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
          }
        });
      }
      
      if (lngInput) {
        lngInput.addEventListener('input', function() {
          const value = parseFloat(this.value);
          if (!isNaN(value) && value >= -180 && value <= 180) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
          } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
          }
        });
      }

      // Event listener untuk preview foto
      const fileInput = document.getElementById("foto_bukti");
      const previewContainer = document.getElementById("previewContainerAdd");
      const fotoPreview = document.getElementById("fotoPreviewAdd");

      if (fileInput) {
        fileInput.addEventListener("change", function () {
          if (this.files && this.files[0]) {
            const file = this.files[0];
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            const maxSize = 5 * 1024 * 1024;
            
            if (!allowedTypes.includes(file.type)) {
              this.classList.remove('is-valid');
              this.classList.add('is-invalid');
              return;
            }
            
            if (file.size > maxSize) {
              this.classList.remove('is-valid');
              this.classList.add('is-invalid');
              return;
            }
            
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
            
            const reader = new FileReader();
            reader.onload = function (e) {
              fotoPreview.src = e.target.result;
              previewContainer.classList.remove("d-none");
              previewContainer.classList.add("d-block");
            };
            reader.readAsDataURL(file);
          } else {
            previewContainer.classList.remove("d-block");
            previewContainer.classList.add("d-none");
            this.classList.remove('is-valid');
          }
        });
      }
    }, 100);
  } catch (error) {
    showFormToast("Error loading form: " + error.message, "danger");
  }
}

function setupAddLaporanMap() {
  const mapContainer = document.getElementById("mapAddLaporan");
  if (!mapContainer) {
    console.error('Add laporan map container not found');
    return;
  }
  
  const defaultLat = -10.1711872;
  const defaultLng = 123.6149376;
  
  loadLeaflet(() => {
    try {
      // Hapus map lama jika ada
      if (addLaporanMap) {
        addLaporanMap.remove();
        addLaporanMap = null;
      }
      
      // Reset marker
      addLaporanMarker = null;
      addLaporanGPSMarker = null;
      
      // Inisialisasi map secara langsung
      addLaporanMap = L.map("mapAddLaporan").setView([defaultLat, defaultLng], 15);
      
      // Tambahkan tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        noWrap: true
      }).addTo(addLaporanMap);
      
      // MARKER BAWAAN LEAFLET - bisa didrag
      addLaporanMarker = L.marker([defaultLat, defaultLng], {
        draggable: true
      }).addTo(addLaporanMap);
      
      // Tambahkan popup
      addLaporanMarker.bindPopup(`
        <div style="font-size: 14px;">
          <strong>📍 Lokasi Laporan</strong><br>
          <small>
            Lat: ${defaultLat.toFixed(6)}<br>
            Lng: ${defaultLng.toFixed(6)}<br>
            <em>Drag untuk mengubah lokasi</em>
          </small>
        </div>
      `).openPopup();
      
      // Event untuk drag marker
      addLaporanMarker.on("dragend", function(e) {
        const position = addLaporanMarker.getLatLng();
        updateAddLaporanCoordinates(position.lat, position.lng);
        
        // Hapus marker GPS jika ada
        if (addLaporanGPSMarker && addLaporanMap.hasLayer(addLaporanGPSMarker)) {
          addLaporanMap.removeLayer(addLaporanGPSMarker);
          addLaporanGPSMarker = null;
        }
        
        // Update GPS status
        updateAddLaporanGPSStatus('manual');
      });
      
      // Event untuk klik peta
      addLaporanMap.on("click", function(e) {
        const { lat, lng } = e.latlng;
        updateAddLaporanCoordinates(lat, lng);
        
        // Pindahkan marker
        addLaporanMarker.setLatLng([lat, lng]);
        
        // Hapus marker GPS jika ada
        if (addLaporanGPSMarker && addLaporanMap.hasLayer(addLaporanGPSMarker)) {
          addLaporanMap.removeLayer(addLaporanGPSMarker);
          addLaporanGPSMarker = null;
        }
        
        // Update GPS status
        updateAddLaporanGPSStatus('manual');
      });
      
      // Update input fields dengan koordinat default
      updateAddLaporanCoordinates(defaultLat, defaultLng);
      
      // Refresh map size
      setTimeout(() => {
        if (addLaporanMap) {
          addLaporanMap.invalidateSize(true);
        }
      }, 200);
      
    } catch (error) {
      console.error('Error setting up add laporan map:', error);
      mapContainer.innerHTML = `
        <div style="
          width: 100%;
          height: 250px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 6px;
          color: #666;
          text-align: center;
          padding: 20px;
        ">
          <div style="font-size: 36px; margin-bottom: 10px;">⚠️</div>
          <p style="margin: 0;">Peta tidak dapat dimuat: ${error.message}</p>
          <button onclick="setupAddLaporanMap()" 
                  style="margin-top: 10px; padding: 8px 16px; background: #0d6efd; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Coba Lagi
          </button>
        </div>
      `;
    }
  });
}

// Fungsi untuk mendapatkan GPS lokasi asli untuk tambah laporan
function getGPSCurrentLocationForAddLaporan() {
  const btnGPS = document.getElementById("btnGetGPSLocationAdd");
  if (!btnGPS) return;
  
  // Update UI
  btnGPS.disabled = true;
  btnGPS.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Mendapatkan lokasi...';
  updateAddLaporanGPSStatus('loading');
  
  // Cek apakah browser mendukung geolocation
  if (!navigator.geolocation) {
    updateAddLaporanGPSStatus('error');
    showFormToast("Browser tidak mendukung Geolocation", "error");
    btnGPS.disabled = false;
    btnGPS.innerHTML = '<i class="bi bi-crosshair me-1"></i> Dapatkan Lokasi GPS';
    return;
  }
  
  // Opsi untuk geolocation
  const geolocationOptions = {
    enableHighAccuracy: true, // Gunakan GPS jika tersedia
    timeout: 15000, // Maksimal 15 detik
    maximumAge: 0 // Tidak gunakan cache
  };
  
  // Panggil Geolocation API
  navigator.geolocation.getCurrentPosition(
    // Success callback
    function(position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy; // Akurasi dalam meter
      
      console.log("GPS Location Retrieved:", { latitude, longitude, accuracy });
      
      // Update input fields
      updateAddLaporanCoordinates(latitude, longitude);
      
      // Update peta
      if (addLaporanMap) {
        // Pindah ke lokasi pengguna
        addLaporanMap.setView([latitude, longitude], 17);
        
        // Hapus marker GPS lama jika ada
        if (addLaporanGPSMarker && addLaporanMap.hasLayer(addLaporanGPSMarker)) {
          addLaporanMap.removeLayer(addLaporanGPSMarker);
        }
        
        // Buat marker GPS baru
        addLaporanGPSMarker = L.marker([latitude, longitude], {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          }),
          title: "LOKASI GPS ANDA",
          draggable: false,
          zIndexOffset: 1000
        }).addTo(addLaporanMap);
        
        // Tambahkan popup dengan informasi akurasi
        const accuracyText = accuracy < 100 ? 
          `Akurasi: ±${Math.round(accuracy)} meter (Tinggi)` :
          accuracy < 500 ? 
          `Akurasi: ±${Math.round(accuracy)} meter (Sedang)` :
          `Akurasi: ±${Math.round(accuracy)} meter (Rendah)`;
        
        addLaporanGPSMarker.bindPopup(`
          <div style="max-width: 250px;">
            <strong style="color: #28a745;">📍 LOKASI GPS ANDA</strong><br>
            <small>
              <b>Lat:</b> ${latitude.toFixed(6)}<br>
              <b>Lng:</b> ${longitude.toFixed(6)}<br>
              <b>${accuracyText}</b><br>
              <i>Lokasi GPS asli Anda</i>
            </small>
          </div>
        `).openPopup();
        
        // Tambahkan accuracy circle jika akurasi rendah
        if (accuracy > 50) {
          L.circle([latitude, longitude], {
            radius: accuracy,
            color: '#28a745',
            fillColor: '#28a745',
            fillOpacity: 0.1,
            weight: 1
          }).addTo(addLaporanMap).bindPopup(`Rentang akurasi: ±${Math.round(accuracy)} meter`);
        }
        
        // Pindahkan marker biasa ke posisi yang sama tapi lebih transparan
        if (addLaporanMarker) {
          addLaporanMarker.setLatLng([latitude, longitude]);
          addLaporanMarker.setOpacity(0.5);
        }
        
        // Refresh peta
        setTimeout(() => {
          addLaporanMap.invalidateSize();
        }, 100);
      }
      
      // Update status dengan informasi akurasi
      const statusMsg = accuracy < 100 ? 
        `Lokasi GPS ditemukan! (Akurasi tinggi: ±${Math.round(accuracy)}m)` :
        accuracy < 500 ? 
        `Lokasi GPS ditemukan! (Akurasi sedang: ±${Math.round(accuracy)}m)` :
        `Lokasi GPS ditemukan! (Akurasi rendah: ±${Math.round(accuracy)}m)`;
      
      updateAddLaporanGPSStatus('success', statusMsg);
      
      // Reset tombol
      btnGPS.disabled = false;
      btnGPS.innerHTML = '<i class="bi bi-crosshair me-1"></i> Dapatkan Lokasi GPS';
      
      // Tampilkan toast sukses
      showFormToast(statusMsg, "success");
      
    },
    // Error callback
    function(error) {
      console.error("Geolocation Error:", error);
      
      let errorMessage = "Gagal mendapatkan lokasi GPS";
      
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Akses GPS ditolak. Harap izinkan akses lokasi di browser Anda.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Informasi lokasi tidak tersedia. Pastikan GPS aktif.";
          break;
        case error.TIMEOUT:
          errorMessage = "Waktu permintaan lokasi habis. Coba lagi.";
          break;
        default:
          errorMessage = "Terjadi kesalahan saat mengambil lokasi.";
      }
      
      // Update status error
      updateAddLaporanGPSStatus('error', errorMessage);
      
      // Reset tombol
      btnGPS.disabled = false;
      btnGPS.innerHTML = '<i class="bi bi-crosshair me-1"></i> Dapatkan Lokasi GPS';
      
      // Tampilkan toast error
      showFormToast(errorMessage, "error");
      
      // Fallback ke lokasi tetap jika GPS gagal
      const fallbackLat = -10.1711872;
      const fallbackLng = 123.6149376;
      
      // Update ke lokasi fallback
      updateAddLaporanCoordinates(fallbackLat, fallbackLng);
      
      if (addLaporanMap) {
        addLaporanMap.setView([fallbackLat, fallbackLng], 15);
        if (addLaporanMarker) {
          addLaporanMarker.setLatLng([fallbackLat, fallbackLng]);
        }
      }
      
      showFormToast("Menggunakan lokasi fallback sebagai alternatif", "warning");
    },
    // Options
    geolocationOptions
  );
}

// Fungsi reset peta untuk tambah laporan
function resetAddLaporanMap() {
  if (addLaporanMap) {
    const defaultLat = -10.1711872;
    const defaultLng = 123.6149376;
    
    // Reset ke lokasi default
    addLaporanMap.setView([defaultLat, defaultLng], 15);
    
    // Hapus marker GPS jika ada
    if (addLaporanGPSMarker && addLaporanMap.hasLayer(addLaporanGPSMarker)) {
      addLaporanMap.removeLayer(addLaporanGPSMarker);
      addLaporanGPSMarker = null;
    }
    
    // Reset marker biasa
    if (addLaporanMarker) {
      addLaporanMarker.setLatLng([defaultLat, defaultLng]);
      addLaporanMarker.setOpacity(1);
      addLaporanMarker.bindPopup(`
        <div style="max-width: 200px;">
          <strong>📍 Lokasi Laporan</strong><br>
          <small>
            Lat: ${defaultLat.toFixed(6)}<br>
            Lng: ${defaultLng.toFixed(6)}
          </small>
        </div>
      `).openPopup();
    }
    
    // Update input
    updateAddLaporanCoordinates(defaultLat, defaultLng);
    
    // Update status
    updateAddLaporanGPSStatus('manual');
    
    // Refresh peta
    setTimeout(() => {
      addLaporanMap.invalidateSize();
    }, 200);
  }
}

// Fungsi untuk update koordinat di form tambah laporan
function updateAddLaporanCoordinates(lat, lng) {
  const latInput = document.getElementById("latitude");
  const lngInput = document.getElementById("longitude");
  
  if (latInput && lngInput) {
    latInput.value = lat;
    lngInput.value = lng;
  }
}

// Perbarui fungsi updateAddLaporanGPSStatus untuk menerima pesan custom
function updateAddLaporanGPSStatus(status, message = '') {
  const loadingEl = document.getElementById("gpsLoadingAdd");
  const successEl = document.getElementById("gpsSuccessAdd");
  const errorEl = document.getElementById("gpsErrorAdd");
  
  if (!loadingEl || !successEl || !errorEl) return;
  
  // Reset semua status
  loadingEl.style.display = 'none';
  successEl.style.display = 'none';
  errorEl.style.display = 'none';
  
  // Tampilkan status yang sesuai
  switch (status) {
    case 'loading':
      loadingEl.style.display = 'block';
      break;
    case 'success':
      successEl.innerHTML = `
        <i class="bi bi-check-circle me-1"></i> ${message || 'Lokasi GPS ditemukan!'}
      `;
      successEl.style.display = 'block';
      break;
    case 'error':
      errorEl.innerHTML = `
        <i class="bi bi-exclamation-circle me-1"></i> ${message || 'Gagal mendapatkan lokasi GPS'}
      `;
      errorEl.style.display = 'block';
      break;
    case 'manual':
      successEl.innerHTML = `
        <i class="bi bi-geo-alt-fill me-1"></i> Lokasi dipilih manual di peta
      `;
      successEl.style.display = 'block';
      break;
  }
}

// Fungsi untuk update marker dari input (tambah laporan)
function updateAddMarkerFromInputs() {
  if (!addLaporanMap) return;
  
  const lat = parseFloat(document.getElementById("latitude").value);
  const lng = parseFloat(document.getElementById("longitude").value);
  
  if (isNaN(lat) || isNaN(lng)) return;
  
  // Update marker position
  if (addLaporanMarker) {
    addLaporanMarker.setLatLng([lat, lng]);
  }
  
  // Center map
  addLaporanMap.setView([lat, lng], addLaporanMap.getZoom());
}

// Fungsi global untuk set lokasi cepat (tambah laporan)
window.setLaporanAddLocation = function(lat, lng, label) {
  updateAddLaporanCoordinates(lat, lng);
  
  if (addLaporanMap) {
    addLaporanMap.setView([lat, lng], 17);
    
    // Hapus marker GPS jika ada
    if (addLaporanGPSMarker && addLaporanMap.hasLayer(addLaporanGPSMarker)) {
      addLaporanMap.removeLayer(addLaporanGPSMarker);
      addLaporanGPSMarker = null;
    }
    
    // Update marker
    if (addLaporanMarker) {
      addLaporanMarker.setLatLng([lat, lng]);
      addLaporanMarker.setOpacity(1);
      addLaporanMarker.bindPopup(`
        <div style="max-width: 200px;">
          <strong>📍 ${label}</strong><br>
          <small>
            Lat: ${lat.toFixed(6)}<br>
            Lng: ${lng.toFixed(6)}
          </small>
        </div>
      `).openPopup();
    }
    
    // Update status
    updateAddLaporanGPSStatus('manual');
    
    // Refresh peta
    setTimeout(() => {
      addLaporanMap.invalidateSize();
    }, 100);
  }
};

// Fungsi untuk copy koordinat (tambah laporan)
window.copyLaporanAddValue = function(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.select();
    document.execCommand('copy');
    
    // Tampilkan feedback
    const originalValue = input.value;
    input.value = '✓ Disalin!';
    setTimeout(() => {
      input.value = originalValue;
    }, 1000);
  }
};

function renderMapAllLaporan(laporanList) {
  const mapContainer = document.getElementById("mapAllLaporan");
  if (!mapContainer) {
    console.error('Map container not found!');
    return;
  }

  // Kosongkan container dulu
  mapContainer.innerHTML = '';
  
  loadLeaflet(() => {
    try {
      // Hapus map lama jika ada
      if (mapAll) {
        mapAll.remove();
        mapAll = null;
      }
      
      // Inisialisasi map secara langsung
      const defaultLat = -10.1711872;
      const defaultLng = 123.6149376;
      
      // Buat map
      mapAll = L.map("mapAllLaporan").setView([defaultLat, defaultLng], 13);
      
      // Tambahkan tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        noWrap: true
      }).addTo(mapAll);
      
      // Reset markers layer
      if (markersLayer) {
        markersLayer.clearLayers();
      }
      markersLayer = L.layerGroup().addTo(mapAll);
      
      // Filter laporan yang memiliki koordinat valid
      const validLaporan = laporanList.filter(l => {
        if (!l.latitude || !l.longitude) return false;
        const lat = parseFloat(l.latitude);
        const lng = parseFloat(l.longitude);
        return !isNaN(lat) && !isNaN(lng);
      });
      
      // Jika ada laporan dengan koordinat
      if (validLaporan.length > 0) {
        const bounds = L.latLngBounds([]);
        
        validLaporan.forEach((l, index) => {
          try {
            const lat = parseFloat(l.latitude);
            const lng = parseFloat(l.longitude);
            
            // Buat popup content
            const popupContent = `
              <div style="max-width: 250px;">
                <strong>${l.nama || 'Laporan'}</strong><br>
                <small>${l.alamat || ''}</small><br>
                <small>Status: <strong>${l.status || 'dilaporkan'}</strong></small><br>
                <small>ID: ${l.idLaporan}</small><br>
                <small>Tanggal: ${l.tanggal_lapor}</small><br>
                <button onclick="viewDetailLaporan(${l.idLaporan})" 
                        style="margin-top: 5px; padding: 5px 10px; background: #0d6efd; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                  Lihat Detail
                </button>
              </div>
            `;
            
            // MARKER BAWAAN LEAFLET
            const marker = L.marker([lat, lng]).addTo(markersLayer);
            
            // Tambahkan popup
            marker.bindPopup(popupContent);
            
            // Tambahkan ke bounds
            bounds.extend([lat, lng]);
            
          } catch (error) {
            console.error(`Error creating marker for laporan ${index}:`, error);
          }
        });
        
        // Fit bounds jika ada valid markers
        if (bounds.isValid() && bounds.getNorth() !== bounds.getSouth()) {
          try {
            mapAll.fitBounds(bounds, { 
              padding: [50, 50],
              maxZoom: 15
            });
          } catch (e) {
            console.warn('Could not fit bounds, using default view');
            mapAll.setView([defaultLat, defaultLng], 13);
          }
        } else {
          // Jika bounds tidak valid, gunakan default view
          mapAll.setView([defaultLat, defaultLng], 13);
        }
        
        
      } else {
        // Jika tidak ada marker, set view default
        mapAll.setView([defaultLat, defaultLng], 13);
        
        // Tambahkan pesan
        const noDataDiv = document.createElement('div');
        noDataDiv.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 1000;
          background: rgba(255,255,255,0.95);
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          border: 1px solid #ddd;
        `;
        noDataDiv.innerHTML = `
          <div style="font-size: 48px; margin-bottom: 10px; color: #999;">🗑️</div>
          <p style="margin: 0; color: #666; font-size: 14px;">Tidak ada data laporan dengan koordinat</p>
        `;
        mapContainer.appendChild(noDataDiv);
      }
      
      // Refresh map size
      setTimeout(() => {
        if (mapAll) {
          mapAll.invalidateSize(true);
        }
      }, 300);
      
    } catch (error) {
      console.error('Error rendering map:', error);
      
      // Fallback UI
      mapContainer.innerHTML = `
        <div style="
          width: 100%;
          height: 350px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border-radius: 10px;
          border: 2px dashed #ddd;
          color: #666;
          text-align: center;
          padding: 20px;
        ">
          <div style="font-size: 48px; margin-bottom: 10px;">🗺️</div>
          <h3 style="margin: 0 0 10px 0;">Peta Tidak Dapat Dimuat</h3>
          <p style="margin: 0; font-size: 14px;">${error.message}</p>
          <button onclick="window.location.reload()" 
                  style="margin-top: 15px; padding: 8px 16px; background: #0d6efd; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Muat Ulang Halaman
          </button>
        </div>
      `;
    }
  });
}

async function loadLaporan() {
  const search = document.getElementById("searchLaporan").value;
  const filterDate = document.getElementById("filterDate").value;
  const filterStatus = document.getElementById("filterStatus").value;

  try {
    const laporan = await fetchAPI(API.laporanSampah, {
      headers: getAuthHeaders(),
    });

    const filteredLaporan = laporan.filter((l) => {
      const matchSearch =
        l.nama.toLowerCase().includes(search.toLowerCase()) ||
        l.alamat.toLowerCase().includes(search.toLowerCase()) ||
        (l.deskripsi && l.deskripsi.toLowerCase().includes(search.toLowerCase()));
      const matchDate = !filterDate || l.tanggal_lapor === filterDate;
      const matchStatus = !filterStatus || l.status === filterStatus;
      return matchSearch && matchDate && matchStatus;
    });

    // Simpan data ke variabel global dan render dengan pagination
    laporanAllData = filteredLaporan;
    laporanCurrentPage = 1;
    renderLaporanTableWithPagination();
    renderMapAllLaporan(filteredLaporan);
    
  } catch (error) {
    document.getElementById(
      "laporanTableContainer"
    ).innerHTML = `<p style="color: red; padding: 20px; text-align: center;">Error loading laporan: ${error.message}</p>`;
    document.getElementById("paginationContainer").innerHTML = "";
    document.getElementById("paginationInfo").innerHTML = "";
  }
}

function renderLaporanTable(laporanList) {
  const container = document.getElementById("laporanTableContainer");

  const tableHTML = `
        <table style="width: 100%; border-collapse: collapse; background: white; font-size: 14px;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left; font-weight: 600;">ID</th>
                    <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left; font-weight: 600;">Nama</th>
                    <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left; font-weight: 600;">Tanggal</th>
                    <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left; font-weight: 600;">Alamat</th>
                    <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left; font-weight: 600;">Status</th>
                    <th style="padding: 12px; border: 1px solid #dee2e6; text-align: center; font-weight: 600;">Foto</th>
                    <th style="padding: 12px; border: 1px solid #dee2e6; text-align: center; font-weight: 600;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                ${laporanList
                  .map(
                    (l) => `
                    <tr style="border-bottom: 1px solid #dee2e6;">
                        <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">${
                          l.idLaporan
                        }</td>
                        <td style="padding: 12px; border: 1px solid #dee2e6;">${
                          l.nama
                        }</td>
                        <td style="padding: 12px; border: 1px solid #dee2e6;">${
                          l.tanggal_lapor
                        }</td>
                        <td style="padding: 12px; border: 1px solid #dee2e6;">${l.alamat ? l.alamat.substring(
                          0,
                          30
                        ) + (l.alamat.length > 30 ? "..." : "") : '-'}</td>
                        <td style="padding: 12px; border: 1px solid #dee2e6;">
                            <span style="
                                padding: 6px 12px;
                                border-radius: 20px;
                                background: ${getLaporanStatusColor(l.status)};
                                color: white;
                                font-size: 12px;
                                font-weight: 600;
                                display: inline-block;
                            ">${l.status}</span>
                        </td>
                        <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">
                            ${
                              l.foto_bukti_url
                                ? `<a href="${l.foto_bukti_url}" target="_blank" 
                                   style="color: #0d6efd; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                                    <i class="bi bi-image"></i> Lihat
                                  </a>`
                                : '<span style="color: #6c757d; font-style: italic;">-</span>'
                            }
                        </td>
                        <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">
                            <div style="display: flex; gap: 8px; justify-content: center;">
                                <button onclick="viewDetailLaporan(${
                                  l.idLaporan
                                })" 
                                        style="padding: 6px 12px; background: #0dcaf0; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 4px;">
                                    <i class="bi bi-eye"></i> Detail
                                </button>
                                <button onclick="editLaporan(${
                                  l.idLaporan
                                })" 
                                        style="padding: 6px 12px; background: #ffc107; color: #000; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 4px;">
                                    <i class="bi bi-pencil"></i> Edit
                                </button>
                                <button onclick="deleteLaporan(${
                                  l.idLaporan
                                })" 
                                        style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 4px;">
                                    <i class="bi bi-trash"></i> Hapus
                                </button>
                            </div>
                        </td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
    `;

  container.innerHTML = tableHTML;
}

function renderLaporanTableWithPagination() {
  const container = document.getElementById("laporanTableContainer");
  const paginationInfo = document.getElementById("paginationInfo");

  if (!laporanAllData || laporanAllData.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
        <div style="font-size: 48px; color: #ddd;">🗑️</div>
        <h3 style="color: #666;">Tidak ada data laporan</h3>
        <p style="color: #888;">Coba ubah filter pencarian</p>
      </div>
    `;
    paginationInfo.innerHTML = "";
    document.getElementById("paginationContainer").innerHTML = "";
    return;
  }

  // Hitung data untuk halaman saat ini
  const startIndex = (laporanCurrentPage - 1) * laporanPerPage;
  const endIndex = Math.min(startIndex + laporanPerPage, laporanAllData.length);
  const currentPageData = laporanAllData.slice(startIndex, endIndex);
  
  // Update info pagination
  paginationInfo.innerHTML = `
    Menampilkan <strong>${startIndex + 1} - ${endIndex}</strong> dari <strong>${laporanAllData.length}</strong> laporan
  `;

  // Render tabel dengan data halaman saat ini
  renderLaporanTable(currentPageData);
  
  // Render pagination controls
  renderLaporanPaginationControls();
}

function renderLaporanPaginationControls() {
  const container = document.getElementById("paginationContainer");
  if (!container) return;

  const totalPages = Math.ceil(laporanAllData.length / laporanPerPage);
  
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = `
    <div style="display: flex; gap: 5px; align-items: center; flex-wrap: wrap;">
      <!-- Previous Button -->
      <button ${laporanCurrentPage === 1 ? "disabled" : ""}
        onclick="goToLaporanPage(${laporanCurrentPage - 1})"
        style="padding: 8px 16px; border: 1px solid #dee2e6; background: ${laporanCurrentPage === 1 ? "#f5f5f5" : "white"}; 
               color: ${laporanCurrentPage === 1 ? "#999" : "#333"}; border-radius: 4px; cursor: ${laporanCurrentPage === 1 ? "not-allowed" : "pointer"}; font-size: 14px;">
        ← Prev
      </button>
  `;

  // Tampilkan maksimal 5 nomor halaman
  let startPage = Math.max(1, laporanCurrentPage - 2);
  let endPage = Math.min(totalPages, laporanCurrentPage + 2);
  
  // Adjust if near start
  if (laporanCurrentPage <= 3) {
    endPage = Math.min(5, totalPages);
  }
  
  // Adjust if near end
  if (laporanCurrentPage >= totalPages - 2) {
    startPage = Math.max(1, totalPages - 4);
  }
  
  // First page
  if (startPage > 1) {
    html += `
      <button onclick="goToLaporanPage(1)"
        style="padding: 8px 16px; border: 1px solid #dee2e6; background: white; color: #333; border-radius: 4px; cursor: pointer; font-size: 14px;">
        1
      </button>
    `;
    if (startPage > 2) {
      html += `<span style="padding: 8px 4px; color: #666;">...</span>`;
    }
  }
  
  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    html += `
      <button onclick="goToLaporanPage(${i})"
        style="padding: 8px 16px; border: 1px solid #dee2e6; 
               background: ${i === laporanCurrentPage ? "#0d6efd" : "white"}; 
               color: ${i === laporanCurrentPage ? "white" : "#333"}; 
               border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: ${i === laporanCurrentPage ? "bold" : "normal"};">
        ${i}
      </button>
    `;
  }
  
  // Last page
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<span style="padding: 8px 4px; color: #666;">...</span>`;
    }
    html += `
      <button onclick="goToLaporanPage(${totalPages})"
        style="padding: 8px 16px; border: 1px solid #dee2e6; background: white; color: #333; border-radius: 4px; cursor: pointer; font-size: 14px;">
        ${totalPages}
      </button>
    `;
  }

  html += `
      <!-- Next Button -->
      <button ${laporanCurrentPage === totalPages ? "disabled" : ""}
        onclick="goToLaporanPage(${laporanCurrentPage + 1})"
        style="padding: 8px 16px; border: 1px solid #dee2e6; background: ${laporanCurrentPage === totalPages ? "#f5f5f5" : "white"}; 
               color: ${laporanCurrentPage === totalPages ? "#999" : "#333"}; border-radius: 4px; cursor: ${laporanCurrentPage === totalPages ? "not-allowed" : "pointer"}; font-size: 14px;">
        Next →
      </button>
    </div>
  `;

  container.innerHTML = html;
}

function goToLaporanPage(page) {
  if (page < 1 || page > Math.ceil(laporanAllData.length / laporanPerPage)) {
    return;
  }
  
  laporanCurrentPage = page;
  renderLaporanTableWithPagination();
  
  // Scroll ke atas tabel
  document.getElementById("laporanTableContainer").scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

function getLaporanStatusColor(status) {
  const colors = {
    pending: "#ffc107",
    proses: "#17a2b8",
    selesai: "#28a745",
  };
  return colors[status] || "#6c757d";
}

async function viewDetailLaporan(laporanId) {
  try {
    const laporan = await fetchAPI(`${API.laporanSampah}${laporanId}/`, {
      headers: getAuthHeaders(),
    });

    const fotoHTML = laporan.foto_bukti_url
      ? `
            <div style="
                background:#fff;
                border-radius:10px;
                padding:12px;
                border:1px solid #eee;
                margin-top:15px;
            ">
                <div style="font-weight:600; margin-bottom:8px;">📸 Foto Bukti</div>
                <img src="${laporan.foto_bukti_url}"
                    style="
                        width:100%;
                        max-height:280px;
                        object-fit:cover;
                        border-radius:8px;
                        border:1px solid #ddd;
                    "
                >
                <div style="margin-top:8px; text-align:right;">
                    <a href="${laporan.foto_bukti_url}" target="_blank"
                        style="font-size:13px; color:#0d6efd; text-decoration:none;">
                        🔗 Lihat resolusi penuh
                    </a>
                </div>
            </div>
        `
      : `
            <div style="
                background:#fff3cd;
                color:#856404;
                padding:10px 12px;
                border-radius:8px;
                border:1px solid #ffeeba;
                margin-top:15px;
                font-size:13px;
            ">
                ⚠️ Tidak ada foto bukti
            </div>
        `;

    const statusColor = getLaporanStatusColor(laporan.status);

    const detailHTML = `
            <div>

                <h2 style="
                    margin:0 0 12px 0;
                    font-size:20px;
                    font-weight:700;
                    color:#333;
                    text-align:center;
                ">
                    Detail Laporan Sampah
                </h2>

                <!-- MAP -->
                <div style="margin: 15px 0;">
                    <div id="mapDetailLaporan" style="
                        width: 100%;
                        height: 260px;
                        border-radius: 12px;
                        background:#e0e0e0;
                        box-shadow:0 2px 8px rgba(0,0,0,0.1);
                    "></div>
                </div>

                <!-- CARD DETAIL -->
                <div style="
                    background:#ffffff;
                    padding:18px;
                    border-radius:12px;
                    border:1px solid #eee;
                    box-shadow:0 2px 6px rgba(0,0,0,0.05);
                ">
                    <p><strong>ID Laporan:</strong> ${laporan.idLaporan}</p>

                    <div style="margin:8px 0;">
                        <strong>Nama Pelapor:</strong><br>
                        <span style="
                            background:#f1f3f5;
                            padding:6px 10px;
                            border-radius:6px;
                            display:inline-block;
                            margin-top:4px;
                            color:#333;
                        ">
                            👤 ${laporan.nama}
                        </span>
                    </div>

                    <p><strong>Akun User:</strong> ${
                      laporan.nama_user || "Tidak diketahui"
                    }</p>
                    <p><strong>Tanggal Lapor:</strong> ${
                      laporan.tanggal_lapor
                    }</p>

                    <div style="margin:10px 0;">
                        <strong>Alamat Lengkap:</strong><br>
                        <span style="color:#444;">${laporan.alamat}</span>
                    </div>

                    <p><strong>Koordinat:</strong> 
                        <span style="color:#007bff;">${laporan.latitude}, ${
      laporan.longitude
    }</span>
                    </p>

                    <div style="margin:10px 0;">
                        <strong>Deskripsi:</strong>
                        <div style="
                            padding:10px;
                            background:#f8f9fa;
                            border-left:3px solid #0d6efd;
                            border-radius:6px;
                            margin-top:4px;
                        ">
                            ${laporan.deskripsi}
                        </div>
                    </div>

                    <p>
                        <strong>Status:</strong> 
                        <span style="
                            padding:4px 10px;
                            border-radius:10px;
                            font-size:12px;
                            font-weight:600;
                            color:white;
                            background:${statusColor};
                        ">
                            ${laporan.status.toUpperCase()}
                        </span>
                    </p>

                    ${fotoHTML}
                </div>
            </div>
        `;

    showModal("Detail Laporan", detailHTML);

    // delay untuk pastikan modal sudah muncul sebelum load peta
    setTimeout(() => {
      renderMapDetail(laporan);
    }, 300);
  } catch (error) {
    alert("Error loading detail: " + error.message);
  }
}

function renderMapDetail(laporan) {
  if (!laporan.latitude || !laporan.longitude) {
    console.warn('Laporan missing coordinates for detail map');
    return;
  }

  const mapContainer = document.getElementById("mapDetailLaporan");
  if (!mapContainer) {
    console.error('Detail map container not found');
    return;
  }

  // Kosongkan container dulu
  mapContainer.innerHTML = '';
  
  loadLeaflet(() => {
    try {
      // Parse koordinat
      const lat = parseFloat(laporan.latitude);
      const lng = parseFloat(laporan.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid coordinates');
      }
      
      // Inisialisasi map secara langsung
      const map = L.map("mapDetailLaporan").setView([lat, lng], 16);
      
      // Tambahkan tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        noWrap: true
      }).addTo(map);
      
      // MARKER BAWAAN LEAFLET
      const marker = L.marker([lat, lng]).addTo(map);
      
      // Buat popup content
      const popupContent = `
        <div style="max-width: 250px;">
          <b>${laporan.nama || 'Laporan'}</b><br>
          <small>${laporan.alamat || ''}</small><br>
          <small>Status: <strong>${laporan.status || 'dilaporkan'}</strong></small><br>
          <small>Deskripsi: ${laporan.deskripsi?.substring(0, 100) || ''}${laporan.deskripsi?.length > 100 ? '...' : ''}</small><br>
          <small>Tanggal: ${laporan.tanggal_lapor}</small>
        </div>
      `;
      
      marker.bindPopup(popupContent).openPopup();
      
      // Refresh map size setelah modal terbuka
      setTimeout(() => {
        map.invalidateSize(true);
      }, 300);
      
    } catch (error) {
      console.error('Error rendering detail map:', error);
      mapContainer.innerHTML = `
        <div style="
          width: 100%;
          height: 260px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border-radius: 12px;
          color: #666;
          text-align: center;
          padding: 20px;
        ">
          <div style="font-size: 36px; margin-bottom: 10px;">📍</div>
          <p style="margin: 0;">Lokasi: ${laporan.latitude}, ${laporan.longitude}</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #888;">Peta tidak dapat ditampilkan</p>
        </div>
      `;
    }
  });
}

async function editLaporan(laporanId) {
  try {
    const laporan = await fetchAPI(`${API.laporanSampah}${laporanId}/`, {
      headers: getAuthHeaders(),
    });

    const formHTML = `
            <form id="editLaporanForm" class="needs-validation" novalidate>
                <div class="mb-3">
                    <label for="nama" class="form-label">Nama Pelapor *</label>
                    <input type="text" class="form-control" id="nama" value="${laporan.nama}" required>
                    <div class="valid-feedback">Valid.</div>
                    <div class="invalid-feedback">Nama pelapor wajib diisi.</div>
                </div>
                
                <div class="mb-3">
                    <label for="alamat" class="form-label">Alamat Lengkap *</label>
                    <textarea class="form-control" id="alamat" required rows="3">${laporan.alamat}</textarea>
                    <div class="valid-feedback">Valid.</div>
                    <div class="invalid-feedback">Alamat wajib diisi.</div>
                </div>
                
                <!-- PETA LOKASI -->
                <div class="mb-3">
                    <label class="form-label">
                        <i class="bi bi-geo-alt me-1"></i>Pilih Lokasi di Peta
                    </label>
                    
                    <!-- Tombol GPS -->
                    <div class="d-flex gap-2 mb-2">
                        <button type="button" id="btnGetGPSLocation" class="btn btn-success">
                            <i class="bi bi-crosshair me-1"></i> Dapatkan Lokasi GPS
                        </button>
                        <button type="button" id="btnResetMapLocation" class="btn btn-secondary">
                            <i class="bi bi-arrow-clockwise me-1"></i> Reset Peta
                        </button>
                    </div>
                    
                    <!-- Status GPS -->
                    <div id="gpsStatus" class="mb-2">
                        <div id="gpsLoading" class="alert alert-primary d-none py-1" role="alert">
                            <i class="bi bi-hourglass-split me-1"></i> Mendapatkan lokasi...
                        </div>
                        <div id="gpsSuccess" class="alert alert-success d-none py-1" role="alert">
                            <i class="bi bi-check-circle me-1"></i> Lokasi berhasil didapatkan
                        </div>
                        <div id="gpsError" class="alert alert-danger d-none py-1" role="alert">
                            <i class="bi bi-exclamation-circle me-1"></i> Gagal mendapatkan lokasi
                        </div>
                    </div>
                    
                    <!-- Peta -->
                    <div id="mapEditLaporan" style="
                        width: 100%;
                        height: 250px;
                        border: 1px solid #ddd;
                        border-radius: 6px;
                        margin-bottom: 10px;
                        background: #f8f9fa;
                    "></div>
                    
                    <small class="text-muted">
                        <i class="bi bi-info-circle me-1"></i>
                        Klik pada peta untuk memilih lokasi atau gunakan tombol GPS
                    </small>
                </div>
                
                <!-- Koordinat Input -->
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="latitude" class="form-label">
                            <i class="bi bi-geo-alt-fill me-1"></i>Latitude *
                        </label>
                        <div class="input-group">
                            <input type="number" step="any" class="form-control" id="latitude" value="${laporan.latitude}" required>
                            <button type="button" class="btn btn-outline-secondary" onclick="copyLaporanEditValue('latitude')">
                                <i class="bi bi-clipboard"></i>
                            </button>
                            <div class="valid-feedback">Valid.</div>
                            <div class="invalid-feedback">Latitude harus angka antara -90 sampai 90.</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <label for="longitude" class="form-label">
                            <i class="bi bi-geo-alt-fill me-1"></i>Longitude *
                        </label>
                        <div class="input-group">
                            <input type="number" step="any" class="form-control" id="longitude" value="${laporan.longitude}" required>
                            <button type="button" class="btn btn-outline-secondary" onclick="copyLaporanEditValue('longitude')">
                                <i class="bi bi-clipboard"></i>
                            </button>
                            <div class="valid-feedback">Valid.</div>
                            <div class="invalid-feedback">Longitude harus angka antara -180 sampai 180.</div>
                        </div>
                    </div>
                </div>
                
                <!-- Lokasi Cepat -->
                <div class="mb-3">
                    <label class="form-label">
                        <i class="bi bi-lightning-charge me-1"></i>Lokasi Cepat
                    </label>
                    <div class="d-flex flex-wrap gap-2">
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="setLaporanEditLocation(-10.1711872, 123.6149376, 'Lokasi Tetap')">
                            <i class="bi bi-house me-1"></i> Lokasi Tetap
                        </button>
                        <button type="button" class="btn btn-outline-success btn-sm" onclick="setLaporanEditLocation(-10.1935921, 123.6149376, 'Kota Kupang')">
                            <i class="bi bi-geo-alt me-1"></i> Kota Kupang
                        </button>
                        <button type="button" class="btn btn-outline-info btn-sm" onclick="setLaporanEditLocation(${laporan.latitude || -10.1711872}, ${laporan.longitude || 123.6149376}, 'Lokasi Asli')">
                            <i class="bi bi-arrow-return-left me-1"></i> Lokasi Asli
                        </button>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="deskripsi" class="form-label">Deskripsi Masalah *</label>
                    <textarea class="form-control" id="deskripsi" required rows="4">${laporan.deskripsi}</textarea>
                    <div class="valid-feedback">Valid.</div>
                    <div class="invalid-feedback">Deskripsi masalah wajib diisi.</div>
                </div>
                
                <div class="mb-3">
                    <label for="status" class="form-label">Status Laporan *</label>
                    <select class="form-select" id="status" required>
                        <option value="" disabled>Pilih status...</option>
                        <option value="pending" ${laporan.status === "pending" ? "selected" : ""}>⏳ Pending</option>
                        <option value="proses" ${laporan.status === "proses" ? "selected" : ""}>🔄 Proses</option>
                        <option value="selesai" ${laporan.status === "selesai" ? "selected" : ""}>✅ Selesai</option>
                    </select>
                    <div class="valid-feedback">Valid.</div>
                    <div class="invalid-feedback">Status laporan wajib dipilih.</div>
                </div>
                
                <div class="mb-3">
                    <label class="form-label">Foto Bukti Saat Ini:</label>
                    ${laporan.foto_bukti_url
                        ? `<div class="mt-2">
                            <img src="${laporan.foto_bukti_url}" 
                                 alt="Foto Saat Ini"
                                 class="img-thumbnail" style="max-width: 200px;"><br>
                            <a href="${laporan.foto_bukti_url}" target="_blank" 
                               class="text-decoration-none">
                                <i class="bi bi-link-45deg"></i> Buka di tab baru
                            </a>
                        </div>`
                        : '<p class="text-muted">Tidak ada foto bukti</p>'
                    }
                </div>
                
                <div class="mb-3">
                    <label for="foto_bukti" class="form-label">Ganti Foto (Opsional):</label>
                    <input type="file" class="form-control" id="foto_bukti" accept="image/*">
                    <div class="form-text">Biarkan kosong jika tidak ingin mengganti foto. Maksimal 5MB. Format: JPG, PNG, GIF.</div>
                    
                    <div id="previewContainer" class="mt-2 d-none">
                        <p class="mb-1">Preview:</p>
                        <img id="fotoPreview" class="img-thumbnail" style="max-width: 200px;">
                    </div>
                </div>
            </form>
        `;

    showModal("Edit Laporan Sampah", formHTML, async () => {
      // Validasi form dengan Bootstrap
      const form = document.getElementById('editLaporanForm');
      form.classList.add('was-validated');
      
      // Periksa validitas form
      if (!form.checkValidity()) {
        showFormToast("Harap isi semua field yang wajib diisi dengan benar", "error");
        return false;
      }

      // Validasi koordinat secara manual
      const latitude = parseFloat(document.getElementById("latitude").value);
      const longitude = parseFloat(document.getElementById("longitude").value);
      
      if (isNaN(latitude) || latitude < -90 || latitude > 90) {
        document.getElementById("latitude").classList.add('is-invalid');
        document.getElementById("latitude").classList.remove('is-valid');
        showFormToast("Latitude harus angka antara -90 sampai 90", "error");
        return false;
      } else {
        document.getElementById("latitude").classList.add('is-valid');
        document.getElementById("latitude").classList.remove('is-invalid');
      }
      
      if (isNaN(longitude) || longitude < -180 || longitude > 180) {
        document.getElementById("longitude").classList.add('is-invalid');
        document.getElementById("longitude").classList.remove('is-valid');
        showFormToast("Longitude harus angka antara -180 sampai 180", "error");
        return false;
      } else {
        document.getElementById("longitude").classList.add('is-valid');
        document.getElementById("longitude").classList.remove('is-invalid');
      }
      
      // Validasi file jika ada
      const fotoInput = document.getElementById("foto_bukti");
      if (fotoInput.files.length > 0) {
        const file = fotoInput.files[0];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        // Cek tipe file
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          fotoInput.classList.add('is-invalid');
          fotoInput.classList.remove('is-valid');
          showFormToast("File harus berupa gambar (JPG, PNG, GIF)", "error");
          return false;
        }
        
        // Cek ukuran file
        if (file.size > maxSize) {
          fotoInput.classList.add('is-invalid');
          fotoInput.classList.remove('is-valid');
          showFormToast("Ukuran file maksimal 5MB", "error");
          return false;
        } else {
          fotoInput.classList.add('is-valid');
          fotoInput.classList.remove('is-invalid');
        }
      }

      // Handle form submission
      const formData = new FormData();
      formData.append("nama", document.getElementById("nama").value.trim());
      formData.append("alamat", document.getElementById("alamat").value.trim());
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
      formData.append("deskripsi", document.getElementById("deskripsi").value.trim());
      formData.append("status", document.getElementById("status").value);
      formData.append("tanggal_lapor", laporan.tanggal_lapor);
      formData.append("idUser", laporan.idUser);

      if (fotoInput.files.length > 0) {
        formData.append("foto_bukti", fotoInput.files[0]);
      }

      try {
        const token = localStorage.getItem("access");
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // Tampilkan loading
        const submitBtn = document.querySelector('.modal-footer .btn-primary');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
        submitBtn.disabled = true;

        const response = await fetch(`${API.laporanSampah}${laporanId}/`, {
          method: "PATCH",
          headers: headers,
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP ${response.status}`);
        }

        showFormToast("Laporan berhasil diperbarui!", "success");
        loadLaporan();
        return true;
      } catch (error) {
        console.error("Error updating laporan:", error);
        showFormToast("Gagal memperbarui laporan: " + error.message, "error");
        return false;
      }
    });

    // Setup event listeners setelah modal terbuka
    setTimeout(() => {
      // Setup map untuk edit laporan
      setupEditLaporanMap(laporan);
      
      // Setup event listeners untuk tombol GPS
      const btnGPS = document.getElementById("btnGetGPSLocation");
      const btnResetMap = document.getElementById("btnResetMapLocation");
      
      if (btnGPS) {
        btnGPS.onclick = () => getGPSCurrentLocationForLaporan(laporan);
      }
      
      if (btnResetMap) {
        btnResetMap.onclick = () => resetEditLaporanMap(laporan);
      }

      // Setup validasi real-time
      const inputs = document.querySelectorAll('#editLaporanForm input, #editLaporanForm textarea, #editLaporanForm select');
      inputs.forEach(input => {
        input.addEventListener('input', function() {
          if (this.checkValidity()) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
          } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
          }
        });
        
        input.addEventListener('change', function() {
          if (this.checkValidity()) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
          } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
          }
        });
      });

      // Validasi koordinat khusus
      const latInput = document.getElementById('latitude');
      const lngInput = document.getElementById('longitude');
      
      if (latInput) {
        latInput.addEventListener('input', function() {
          const value = parseFloat(this.value);
          if (!isNaN(value) && value >= -90 && value <= 90) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
          } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
          }
        });
      }
      
      if (lngInput) {
        lngInput.addEventListener('input', function() {
          const value = parseFloat(this.value);
          if (!isNaN(value) && value >= -180 && value <= 180) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
          } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
          }
        });
      }

      // Event listener untuk preview foto
      const fileInput = document.getElementById("foto_bukti");
      const previewContainer = document.getElementById("previewContainer");
      const fotoPreview = document.getElementById("fotoPreview");

      if (fileInput) {
        fileInput.addEventListener("change", function () {
          if (this.files && this.files[0]) {
            const file = this.files[0];
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            const maxSize = 5 * 1024 * 1024;
            
            if (!allowedTypes.includes(file.type)) {
              this.classList.remove('is-valid');
              this.classList.add('is-invalid');
              return;
            }
            
            if (file.size > maxSize) {
              this.classList.remove('is-valid');
              this.classList.add('is-invalid');
              return;
            }
            
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
            
            const reader = new FileReader();
            reader.onload = function (e) {
              fotoPreview.src = e.target.result;
              previewContainer.classList.remove("d-none");
              previewContainer.classList.add("d-block");
            };
            reader.readAsDataURL(file);
          } else {
            previewContainer.classList.remove("d-block");
            previewContainer.classList.add("d-none");
          }
        });
      }
    }, 100);
  } catch (error) {
    alert("Error loading laporan data: " + error.message);
  }
}

function setupEditLaporanMap(laporan) {
  const mapContainer = document.getElementById("mapEditLaporan");
  if (!mapContainer) return;
  
  // Parse koordinat
  const defaultLat = parseFloat(laporan.latitude) || -10.1711872;
  const defaultLng = parseFloat(laporan.longitude) || 123.6149376;
  
  loadLeaflet(() => {
    try {
      // Hapus map lama jika ada
      if (editLaporanMap) {
        editLaporanMap.remove();
        editLaporanMap = null;
      }
      
      // Reset marker
      editLaporanMarker = null;
      editLaporanGPSMarker = null;
      
      // Inisialisasi map secara langsung
      editLaporanMap = L.map("mapEditLaporan").setView([defaultLat, defaultLng], 15);
      
      // Tambahkan tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        noWrap: true
      }).addTo(editLaporanMap);
      
      // MARKER BAWAAN LEAFLET - bisa didrag
      editLaporanMarker = L.marker([defaultLat, defaultLng], {
        draggable: true
      }).addTo(editLaporanMap);
      
      // Tambahkan popup
      editLaporanMarker.bindPopup(`
        <div style="font-size: 14px;">
          <strong>📍 Lokasi Laporan</strong><br>
          <small>
            Lat: ${defaultLat.toFixed(6)}<br>
            Lng: ${defaultLng.toFixed(6)}<br>
            <em>Drag untuk mengubah lokasi</em>
          </small>
        </div>
      `).openPopup();
      
      // Event untuk drag marker
      editLaporanMarker.on("dragend", function(e) {
        const position = editLaporanMarker.getLatLng();
        updateLaporanCoordinates(position.lat, position.lng);
        
        // Hapus marker GPS jika ada
        if (editLaporanGPSMarker && editLaporanMap.hasLayer(editLaporanGPSMarker)) {
          editLaporanMap.removeLayer(editLaporanGPSMarker);
          editLaporanGPSMarker = null;
        }
        
        // Update GPS status
        updateLaporanGPSStatus('manual');
      });
      
      // Event untuk klik peta
      editLaporanMap.on("click", function(e) {
        const { lat, lng } = e.latlng;
        updateLaporanCoordinates(lat, lng);
        
        // Pindahkan marker
        editLaporanMarker.setLatLng([lat, lng]);
        
        // Hapus marker GPS jika ada
        if (editLaporanGPSMarker && editLaporanMap.hasLayer(editLaporanGPSMarker)) {
          editLaporanMap.removeLayer(editLaporanGPSMarker);
          editLaporanGPSMarker = null;
        }
        
        // Update GPS status
        updateLaporanGPSStatus('manual');
      });
      
      // Update input fields dengan koordinat default
      updateLaporanCoordinates(defaultLat, defaultLng);
      
      // Refresh map size
      setTimeout(() => {
        if (editLaporanMap) {
          editLaporanMap.invalidateSize(true);
        }
      }, 200);
      
    } catch (error) {
      console.error('Error setting up edit laporan map:', error);
      mapContainer.innerHTML = `
        <div style="
          width: 100%;
          height: 250px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 6px;
          color: #666;
          text-align: center;
          padding: 20px;
        ">
          <div style="font-size: 36px; margin-bottom: 10px;">⚠️</div>
          <p style="margin: 0;">Peta tidak dapat dimuat: ${error.message}</p>
          <button onclick="setupEditLaporanMap(${JSON.stringify(laporan).replace(/"/g, '&quot;')})" 
                  style="margin-top: 10px; padding: 8px 16px; background: #0d6efd; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Coba Lagi
          </button>
        </div>
      `;
    }
  });
}

// Fungsi untuk mendapatkan GPS lokasi asli untuk edit laporan
function getGPSCurrentLocationForLaporan(laporan) {
  const btnGPS = document.getElementById("btnGetGPSLocation");
  if (!btnGPS) return;
  
  // Update UI
  btnGPS.disabled = true;
  btnGPS.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Mendapatkan lokasi...';
  updateLaporanGPSStatus('loading');
  
  // Cek apakah browser mendukung geolocation
  if (!navigator.geolocation) {
    updateLaporanGPSStatus('error');
    showFormToast("Browser tidak mendukung Geolocation", "error");
    btnGPS.disabled = false;
    btnGPS.innerHTML = '<i class="bi bi-crosshair me-1"></i> Dapatkan Lokasi GPS';
    return;
  }
  
  // Opsi untuk geolocation
  const geolocationOptions = {
    enableHighAccuracy: true, // Gunakan GPS jika tersedia
    timeout: 15000, // Maksimal 15 detik
    maximumAge: 0 // Tidak gunakan cache
  };
  
  // Panggil Geolocation API
  navigator.geolocation.getCurrentPosition(
    // Success callback
    function(position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy; // Akurasi dalam meter
      
      console.log("GPS Location Retrieved:", { latitude, longitude, accuracy });
      
      // Update input fields
      updateLaporanCoordinates(latitude, longitude);
      
      // Update peta
      if (editLaporanMap) {
        // Pindah ke lokasi pengguna
        editLaporanMap.setView([latitude, longitude], 17);
        
        // Hapus marker GPS lama jika ada
        if (editLaporanGPSMarker && editLaporanMap.hasLayer(editLaporanGPSMarker)) {
          editLaporanMap.removeLayer(editLaporanGPSMarker);
        }
        
        // Buat marker GPS baru
        editLaporanGPSMarker = L.marker([latitude, longitude], {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          }),
          title: "LOKASI GPS ANDA",
          draggable: false,
          zIndexOffset: 1000
        }).addTo(editLaporanMap);
        
        // Tambahkan popup dengan informasi akurasi
        const accuracyText = accuracy < 100 ? 
          `Akurasi: ±${Math.round(accuracy)} meter (Tinggi)` :
          accuracy < 500 ? 
          `Akurasi: ±${Math.round(accuracy)} meter (Sedang)` :
          `Akurasi: ±${Math.round(accuracy)} meter (Rendah)`;
        
        editLaporanGPSMarker.bindPopup(`
          <div style="max-width: 250px;">
            <strong style="color: #28a745;">📍 LOKASI GPS ANDA</strong><br>
            <small>
              <b>Lat:</b> ${latitude.toFixed(6)}<br>
              <b>Lng:</b> ${longitude.toFixed(6)}<br>
              <b>${accuracyText}</b><br>
              <i>Lokasi GPS asli Anda</i>
            </small>
          </div>
        `).openPopup();
        
        // Tambahkan accuracy circle jika akurasi rendah
        if (accuracy > 50) {
          L.circle([latitude, longitude], {
            radius: accuracy,
            color: '#28a745',
            fillColor: '#28a745',
            fillOpacity: 0.1,
            weight: 1
          }).addTo(editLaporanMap).bindPopup(`Rentang akurasi: ±${Math.round(accuracy)} meter`);
        }
        
        // Pindahkan marker biasa ke posisi yang sama tapi lebih transparan
        if (editLaporanMarker) {
          editLaporanMarker.setLatLng([latitude, longitude]);
          editLaporanMarker.setOpacity(0.5);
        }
        
        // Refresh peta
        setTimeout(() => {
          editLaporanMap.invalidateSize();
        }, 100);
      }
      
      // Update status dengan informasi akurasi
      const statusMsg = accuracy < 100 ? 
        `Lokasi GPS ditemukan! (Akurasi tinggi: ±${Math.round(accuracy)}m)` :
        accuracy < 500 ? 
        `Lokasi GPS ditemukan! (Akurasi sedang: ±${Math.round(accuracy)}m)` :
        `Lokasi GPS ditemukan! (Akurasi rendah: ±${Math.round(accuracy)}m)`;
      
      updateLaporanGPSStatus('success', statusMsg);
      
      // Reset tombol
      btnGPS.disabled = false;
      btnGPS.innerHTML = '<i class="bi bi-crosshair me-1"></i> Dapatkan Lokasi GPS';
      
      // Tampilkan toast sukses
      showFormToast(statusMsg, "success");
      
    },
    // Error callback
    function(error) {
      console.error("Geolocation Error:", error);
      
      let errorMessage = "Gagal mendapatkan lokasi GPS";
      
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Akses GPS ditolak. Harap izinkan akses lokasi di browser Anda.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Informasi lokasi tidak tersedia. Pastikan GPS aktif.";
          break;
        case error.TIMEOUT:
          errorMessage = "Waktu permintaan lokasi habis. Coba lagi.";
          break;
        default:
          errorMessage = "Terjadi kesalahan saat mengambil lokasi.";
      }
      
      // Update status error
      updateLaporanGPSStatus('error', errorMessage);
      
      // Reset tombol
      btnGPS.disabled = false;
      btnGPS.innerHTML = '<i class="bi bi-crosshair me-1"></i> Dapatkan Lokasi GPS';
      
      // Tampilkan toast error
      showFormToast(errorMessage, "error");
      
      // Fallback ke lokasi asli laporan jika GPS gagal
      const fallbackLat = parseFloat(laporan.latitude) || -10.1711872;
      const fallbackLng = parseFloat(laporan.longitude) || 123.6149376;
      
      // Update ke lokasi fallback
      updateLaporanCoordinates(fallbackLat, fallbackLng);
      
      if (editLaporanMap) {
        editLaporanMap.setView([fallbackLat, fallbackLng], 15);
        if (editLaporanMarker) {
          editLaporanMarker.setLatLng([fallbackLat, fallbackLng]);
        }
      }
      
      showFormToast("Menggunakan lokasi laporan sebagai alternatif", "warning");
    },
    // Options
    geolocationOptions
  );
}

// Fungsi reset peta untuk edit laporan
function resetEditLaporanMap(laporan) {
  if (editLaporanMap) {
    const defaultLat = parseFloat(laporan.latitude) || -10.1711872;
    const defaultLng = parseFloat(laporan.longitude) || 123.6149376;
    
    // Reset ke lokasi asli
    editLaporanMap.setView([defaultLat, defaultLng], 15);
    
    // Hapus marker GPS jika ada
    if (editLaporanGPSMarker && editLaporanMap.hasLayer(editLaporanGPSMarker)) {
      editLaporanMap.removeLayer(editLaporanGPSMarker);
      editLaporanGPSMarker = null;
    }
    
    // Reset marker biasa
    if (editLaporanMarker) {
      editLaporanMarker.setLatLng([defaultLat, defaultLng]);
      editLaporanMarker.setOpacity(1);
      editLaporanMarker.bindPopup(`
        <div style="max-width: 200px;">
          <strong>📍 Lokasi Laporan</strong><br>
          <small>
            Lat: ${defaultLat.toFixed(6)}<br>
            Lng: ${defaultLng.toFixed(6)}
          </small>
        </div>
      `).openPopup();
    }
    
    // Update input
    updateLaporanCoordinates(defaultLat, defaultLng);
    
    // Update status
    updateLaporanGPSStatus('manual');
    
    // Refresh peta
    setTimeout(() => {
      editLaporanMap.invalidateSize();
    }, 200);
  }
}

// Fungsi untuk update koordinat di form edit laporan
function updateLaporanCoordinates(lat, lng) {
  const latInput = document.getElementById("latitude");
  const lngInput = document.getElementById("longitude");
  
  if (latInput && lngInput) {
    latInput.value = lat;
    lngInput.value = lng;
  }
}

// Perbarui fungsi updateLaporanGPSStatus untuk menerima pesan custom
function updateLaporanGPSStatus(status, message = '') {
  const loadingEl = document.getElementById("gpsLoading");
  const successEl = document.getElementById("gpsSuccess");
  const errorEl = document.getElementById("gpsError");
  
  if (!loadingEl || !successEl || !errorEl) return;
  
  // Reset semua status
  loadingEl.style.display = 'none';
  successEl.style.display = 'none';
  errorEl.style.display = 'none';
  
  // Tampilkan status yang sesuai
  switch (status) {
    case 'loading':
      loadingEl.style.display = 'block';
      break;
    case 'success':
      successEl.innerHTML = `
        <i class="bi bi-check-circle me-1"></i> ${message || 'Lokasi GPS ditemukan!'}
      `;
      successEl.style.display = 'block';
      break;
    case 'error':
      errorEl.innerHTML = `
        <i class="bi bi-exclamation-circle me-1"></i> ${message || 'Gagal mendapatkan lokasi GPS'}
      `;
      errorEl.style.display = 'block';
      break;
    case 'manual':
      successEl.innerHTML = `
        <i class="bi bi-geo-alt-fill me-1"></i> Lokasi dipilih manual di peta
      `;
      successEl.style.display = 'block';
      break;
  }
}

// Fungsi untuk update marker dari input
function updateMarkerFromInputs() {
  if (!editLaporanMap) return;
  
  const lat = parseFloat(document.getElementById("latitude").value);
  const lng = parseFloat(document.getElementById("longitude").value);
  
  if (isNaN(lat) || isNaN(lng)) return;
  
  // Update marker position
  if (editLaporanMarker) {
    editLaporanMarker.setLatLng([lat, lng]);
  }
  
  // Center map
  editLaporanMap.setView([lat, lng], editLaporanMap.getZoom());
}

// Fungsi global untuk set lokasi cepat
window.setLaporanEditLocation = function(lat, lng, label) {
  updateLaporanCoordinates(lat, lng);
  
  if (editLaporanMap) {
    editLaporanMap.setView([lat, lng], 17);
    
    // Hapus marker GPS jika ada
    if (editLaporanGPSMarker && editLaporanMap.hasLayer(editLaporanGPSMarker)) {
      editLaporanMap.removeLayer(editLaporanGPSMarker);
      editLaporanGPSMarker = null;
    }
    
    // Update marker
    if (editLaporanMarker) {
      editLaporanMarker.setLatLng([lat, lng]);
      editLaporanMarker.setOpacity(1);
      editLaporanMarker.bindPopup(`
        <div style="max-width: 200px;">
          <strong>📍 ${label}</strong><br>
          <small>
            Lat: ${lat.toFixed(6)}<br>
            Lng: ${lng.toFixed(6)}
          </small>
        </div>
      `).openPopup();
    }
    
    // Update status
    updateLaporanGPSStatus('manual');
    
    // Refresh peta
    setTimeout(() => {
      editLaporanMap.invalidateSize();
    }, 100);
  }
};

// Fungsi untuk copy koordinat
window.copyLaporanEditValue = function(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.select();
    document.execCommand('copy');
    
    // Tampilkan feedback
    const originalValue = input.value;
    input.value = '✓ Disalin!';
    setTimeout(() => {
      input.value = originalValue;
    }, 1000);
  }
};

async function deleteLaporan(laporanId) {
  showConfirmModal(
    "Apakah Anda yakin ingin menghapus laporan ini?",
    async () => {
      try {
        const response = await fetch(`${API.laporanSampah}${laporanId}/`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP ${response.status}`);
        }

        // alert("Laporan berhasil dihapus!");
        showFormToast("Laporan berhasil dihapus!", "success");
        loadLaporan();
      } catch (error) {
        alert("Error deleting laporan: " + error.message);
      }
    }
  );
}

window.goToLaporanPage = goToLaporanPage;
window.viewDetailLaporan = viewDetailLaporan;
window.editLaporan = editLaporan;
window.deleteLaporan = deleteLaporan;
window.showAddLaporanForm = showAddLaporanForm;