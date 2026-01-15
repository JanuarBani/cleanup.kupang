import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showModal } from "../../utils/modal.js";
import { loadLeaflet } from "../../utils/mapConfig.js"; // Tambahkan import ini

let laporanAllData = [];
let laporanCurrentPage = 1;
const laporanPerPage = 9;

// Tambahkan variabel global untuk menyimpan kedua marker
let laporanDetailMap = null;
let laporanMarker = null; // Marker untuk lokasi laporan
let userMarker = null;    // Marker untuk lokasi GPS pengguna
let distanceLine = null;  // Garis penghubung

let laporanDetailMarker = null;

export async function laporanTimPage() {
  const mainContent = document.getElementById("mainContent");

  mainContent.innerHTML = `
    <div>
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:20px;
        flex-wrap:wrap;
        gap:10px;
      ">
        <h2>🗑️ Laporan Sampah</h2>

        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <input type="text" id="searchLaporan"
            placeholder="Cari laporan..."
            style="padding:8px;border:1px solid #ddd;border-radius:4px;width:200px;">

          <select id="filterStatus"
            style="padding:8px;border:1px solid #ddd;border-radius:4px;">
            <option value="">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="proses">Dalam Proses</option>
            <option value="selesai">Selesai</option>
          </select>

          <input type="date" id="filterDate"
            style="padding:8px;border:1px solid #ddd;border-radius:4px;">
        </div>
      </div>

      <!-- GRID CARD -->
      <div id="laporanContainer"></div>

      <!-- PAGINATION (WAJIB DI LUAR GRID) -->
      <div id="laporanPagination"
        style="
          margin-top:20px;
          display:flex;
          justify-content:center;
          gap:6px;
          flex-wrap:wrap;
        ">
      </div>
    </div>
  `;

  document.getElementById("searchLaporan").oninput = loadLaporan;
  document.getElementById("filterStatus").onchange = loadLaporan;
  document.getElementById("filterDate").onchange = loadLaporan;

  loadLaporan();
}

async function loadLaporan() {
  const search = document.getElementById("searchLaporan").value;
  const filterStatus = document.getElementById("filterStatus").value;
  const filterDate = document.getElementById("filterDate").value;

  try {
    const laporan = await fetchAPI(API.laporanSampah, {
      headers: getAuthHeaders(),
    });

    const filteredLaporan = laporan.filter((l) => {
      const matchSearch =
        l.nama?.toLowerCase().includes(search.toLowerCase()) ||
        l.alamat?.toLowerCase().includes(search.toLowerCase()) ||
        l.deskripsi?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || l.status === filterStatus;
      const matchDate = !filterDate || l.tanggal_lapor === filterDate;
      return matchSearch && matchStatus && matchDate;
    });

    laporanAllData = filteredLaporan;
    laporanCurrentPage = 1;

    renderLaporanPageTim(laporanCurrentPage);

  } catch (error) {
    document.getElementById(
      "laporanContainer"
    ).innerHTML = `<p style="color: red;">Error loading laporan: ${error.message}</p>`;
  }
}

async function viewLaporan(laporanId) {
  try {
    const laporan = await fetchAPI(`${API.laporanSampah}${laporanId}/`, {
      headers: getAuthHeaders(),
    });

    // Badge status dengan warna yang sesuai
    const statusColors = getStatusColor(laporan.status);
    const statusBadge = `
      <span style="
        padding: 6px 14px;
        background: ${statusColors.background};
        color: ${statusColors.text};
        border: 1px solid ${statusColors.border};
        border-radius: 20px;
        font-size: 13px;
        font-weight: bold;
        text-transform: uppercase;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      ">
        ${getStatusIcon(laporan.status)} ${laporan.status}
      </span>
    `;

    // Foto bukti
    const fotoHTML = laporan.foto_bukti
      ? `
        <div style="margin-top: 15px; text-align:center;">
          <img src="${laporan.foto_bukti}" alt="Foto Bukti"
            style="
              width: 100%;
              max-height: 260px;
              object-fit: cover;
              border-radius: 10px;
              border: 1px solid #ccc;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            ">
        </div>
      `
      : `
        <div style="
          margin-top:15px; 
          padding:20px; 
          background:#f0f0f0; 
          text-align:center; 
          border-radius:8px;
          color:#777;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        ">
          <i class="bi bi-image" style="font-size: 20px;"></i>
          Tidak ada foto bukti
        </div>
      `;

    // Timeline status
    const timelineHTML = `
      <div style="margin-top: 20px;">
        <h4 style="margin-bottom: 15px; color: #555;">📋 Timeline Status</h4>
        <div style="position: relative; padding-left: 30px;">
          <div style="position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: #e0e0e0;"></div>
          
          <!-- Step Dilaporkan -->
          <div style="position: relative; margin-bottom: 25px;">
            <div style="position: absolute; left: -25px; top: 0; width: 16px; height: 16px; border-radius: 50%; background: #9C27B0; border: 3px solid white; z-index: 1;"></div>
            <div>
              <div style="font-weight: 500; color: #333;">Dilaporkan</div>
              <div style="font-size: 13px; color: #666;">${formatTanggalDetail(
                laporan.tanggal_lapor
              )}</div>
            </div>
          </div>
          
          <!-- Status Saat Ini -->
          ${getStatusTimeline(laporan)}
        </div>
      </div>
    `;

    // Koordinat laporan
    const lat = parseFloat(laporan.latitude) || -10.1772;
    const lng = parseFloat(laporan.longitude) || 123.6070;

    const detailHTML = `
      <div style="font-family: Arial;">

        <h2 style="margin-bottom: 15px; color:#333; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
          <i class="bi bi-file-earmark-text me-2"></i> Detail Laporan Sampah
        </h2>

        <div style="
          background: #ffffff;
          padding: 20px;
          border-radius: 10px;
          border: 1px solid #e5e5e5;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        ">

          <!-- Header dengan Status -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap: wrap; gap: 10px;">
            <div>
              <h3 style="margin:0; color:#222; font-size: 20px;">${
                laporan.nama || "Laporan Tanpa Nama"
              }</h3>
              <p style="margin:5px 0 0 0; color:#666; font-size: 14px;">
                <i class="bi bi-person me-1"></i> ${
                  laporan.nama_user || "Tidak diketahui"
                }
              </p>
            </div>
            ${statusBadge}
          </div>

          <!-- Informasi Utama -->
          <div style="margin-bottom: 20px;">
            <div class="row" style="display: flex; flex-wrap: wrap; gap: 15px; margin: 0 -7px;">
              <div style="flex: 1; min-width: 200px; padding: 0 7px;">
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid #4285F4;">
                  <p style="margin:0; color:#666; font-size: 13px; font-weight: 500;">
                    <i class="bi bi-calendar me-2"></i> Tanggal Lapor
                  </p>
                  <p style="margin:5px 0 0 0; color:#333; font-size: 15px; font-weight: 600;">
                    ${formatTanggalDetail(laporan.tanggal_lapor)}
                  </p>
                </div>
              </div>
              <div style="flex: 1; min-width: 200px; padding: 0 7px;">
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid #34A853;">
                  <p style="margin:0; color:#666; font-size: 13px; font-weight: 500;">
                    <i class="bi bi-geo-alt me-2"></i> ID Laporan
                  </p>
                  <p style="margin:5px 0 0 0; color:#333; font-size: 15px; font-weight: 600;">
                    #${laporan.idLaporan || laporan.id}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Alamat -->
          <div style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #555; font-size: 16px;">
              <i class="bi bi-geo-alt-fill me-2"></i> Alamat Lokasi
            </h4>
            <div style="
              padding: 15px;
              background: #f8f9fa;
              border-radius: 8px;
              border-left: 4px solid #FBBC05;
            ">
              <p style="margin:0; color:#333; line-height: 1.5;">
                ${laporan.alamat || "Tidak ada alamat"}
              </p>
            </div>
          </div>

          <!-- MAP SECTION - DENGAN 2 MARKER DAN GARIS -->
          <div style="margin: 20px 0;">
            <h4 style="margin-bottom: 15px; color: #555; font-size: 16px;">
              <i class="bi bi-map me-2"></i> Lokasi di Peta
            </h4>

            <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
              <button onclick="getCurrentLocationForLaporan()" 
                class="btn btn-primary btn-sm"
                style="display: flex; align-items: center; gap: 5px;">
                <i class="bi bi-geo-alt"></i> Ambil Lokasi Saya (GPS)
              </button>
              
              ${laporan.latitude && laporan.longitude ? `
                <a href="https://www.google.com/maps?q=${lat},${lng}" 
                   target="_blank" 
                   class="btn btn-success btn-sm"
                   style="display: flex; align-items: center; gap: 5px;">
                  <i class="bi bi-google"></i> Buka di Google Maps
                </a>
                
                <button onclick="copyCoordinates(${lat}, ${lng})" 
                  class="btn btn-outline-secondary btn-sm"
                  style="display: flex; align-items: center; gap: 5px;">
                  <i class="bi bi-clipboard"></i> Salin Koordinat
                </button>
              ` : ''}
              
              <button onclick="clearUserMarker()" 
                class="btn btn-outline-danger btn-sm"
                style="display: flex; align-items: center; gap: 5px;">
                <i class="bi bi-x-circle"></i> Hapus Marker GPS
              </button>
            </div>

            <!-- Info Jarak -->
            <div id="distanceInfo" style="
              padding: 10px 15px;
              background: #e8f5e9;
              border-radius: 6px;
              border-left: 4px solid #4CAF50;
              margin-bottom: 15px;
              display: none;
            ">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="color: #2e7d32;">📍 Informasi Jarak:</strong>
                  <div style="margin-top: 5px;">
                    <span id="distanceValue" style="font-weight: 600; color: #333;"></span>
                    <span id="distanceUnit" style="color: #666;"></span>
                  </div>
                </div>
                <div style="color: #666; font-size: 12px;">
                  <i class="bi bi-arrows-move me-1"></i>
                  Garis penghubung
                </div>
              </div>
            </div>

            <div id="mapDetailContainer"
              style="
                width: 100%;
                height: 300px;
                border: 1px solid #ddd;
                border-radius: 8px;
                margin-bottom: 15px;
                position: relative;
                overflow: hidden;
              ">
              <div id="mapLoading" style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: #f8f9fa;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
              ">
                <div style="text-align: center;">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  <p style="margin-top: 10px; color: #666;">Memuat peta...</p>
                </div>
              </div>
              
              <div id="mapDetail" 
                style="width: 100%; height: 100%; display: none;"></div>
            </div>

            <!-- Legenda Marker -->
            <div style="
              padding: 12px 15px;
              background: #f8f9fa;
              border-radius: 6px;
              border: 1px solid #e0e0e0;
              margin-top: 10px;
            ">
              <div style="font-size: 13px; font-weight: 600; color: #555; margin-bottom: 10px;">
                <i class="bi bi-info-circle me-1"></i> Legenda Marker:
              </div>
              <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: ${getStatusColor(laporan.status).background};
                    border: 2px solid white;
                    box-shadow: 0 0 5px rgba(0,0,0,0.2);
                  "></div>
                  <span style="font-size: 12px; color: #666;">Lokasi Laporan</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #2196F3;
                    border: 2px solid white;
                    box-shadow: 0 0 5px rgba(0,0,0,0.2);
                  "></div>
                  <span style="font-size: 12px; color: #666;">Lokasi Anda (GPS)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="
                    width: 20px;
                    height: 3px;
                    background: #FF5722;
                  "></div>
                  <span style="font-size: 12px; color: #666;">Garis Jarak</span>
                </div>
              </div>
            </div>

            <!-- Koordinat Display -->
            <div style="
              padding: 10px 15px;
              background: #f8f9fa;
              border-radius: 6px;
              border-left: 4px solid #0d6efd;
              margin-top: 10px;
            ">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div>
                  <small style="color: #666;">Koordinat Laporan:</small>
                  <div style="font-weight: 600; color: #333;">
                    ${lat.toFixed(6)}, ${lng.toFixed(6)}
                  </div>
                </div>
                <div id="userCoordinates" style="display: none;">
                  <small style="color: #666;">Koordinat Anda:</small>
                  <div style="font-weight: 600; color: #2196F3;">
                    <span id="userLat">-</span>, <span id="userLng">-</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- END MAP SECTION -->

          <!-- Deskripsi -->
          <div style="margin: 20px 0;">
            <h4 style="margin-bottom: 10px; color: #555; font-size: 16px;">
              <i class="bi bi-chat-text me-2"></i> Deskripsi Laporan
            </h4>
            <div style="
              padding: 15px;
              background:#f8f9fa;
              border-left:4px solid #0d6efd;
              border-radius:8px;
            ">
              <p style="margin:0; color:#555; line-height:1.6;">
                ${laporan.deskripsi || "Tidak ada deskripsi"}
              </p>
            </div>
          </div>

          <!-- Foto Bukti -->
          <div style="margin: 20px 0;">
            <h4 style="margin-bottom: 15px; color: #555; font-size: 16px;">
              <i class="bi bi-image me-2"></i> Foto Bukti
            </h4>
            ${fotoHTML}
          </div>

          <!-- Timeline -->
          ${timelineHTML}

        </div>
      </div>
    `;

    showModal("Detail Laporan", detailHTML, null, "modal-lg");

    // Inisialisasi peta dengan 2 marker
    setTimeout(() => {
      initDualMarkerMap(laporan);
    }, 300);
  } catch (error) {
    showNotification("Error loading detail: " + error.message, "error");
  }
}

function initDualMarkerMap(laporan) {
  const lat = parseFloat(laporan.latitude) || -10.1772;
  const lng = parseFloat(laporan.longitude) || 123.6070;
  
  loadLeaflet(() => {
    // Hilangkan loading
    const loadingDiv = document.getElementById('mapLoading');
    if (loadingDiv) {
      loadingDiv.style.display = 'none';
    }
    
    // Tampilkan peta
    const mapDiv = document.getElementById('mapDetail');
    if (mapDiv) {
      mapDiv.style.display = 'block';
    }
    
    // Inisialisasi peta
    const map = L.map('mapDetail').setView([lat, lng], 16);
    laporanDetailMap = map;
    
    // Tambahkan tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    
    // Tentukan warna marker berdasarkan status
    const statusColor = getStatusColor(laporan.status).background;
    
    // BUAT MARKER UNTUK LOKASI LAPORAN (Hijau)
    const reportIcon = L.divIcon({
      html: `
        <div style="
          background-color: ${statusColor};
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
        ">
          <i class="bi bi-trash-fill" style="font-size: 16px;"></i>
        </div>
      `,
      className: 'custom-marker-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
    
    laporanMarker = L.marker([lat, lng], { icon: reportIcon }).addTo(map);
    
    laporanMarker.bindPopup(`
      <div style="min-width: 200px;">
        <strong>📍 Lokasi Laporan</strong><br/>
        <small><strong>ID:</strong> #${laporan.idLaporan || laporan.id}</small><br/>
        <small><strong>Status:</strong> ${laporan.status}</small><br/>
        <small><strong>Koordinat:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</small><br/>
        <small><strong>Alamat:</strong> ${(laporan.alamat || '').substring(0, 60)}...</small>
      </div>
    `).openPopup();
    
    // BUAT ICON UNTUK LOKASI USER (Biru)
    const userIcon = L.divIcon({
      html: `
        <div style="
          background-color: #2196F3;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 10px rgba(33, 150, 243, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
        ">
          <i class="bi bi-person-fill" style="font-size: 16px;"></i>
        </div>
      `,
      className: 'user-marker-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
    
    // Tambahkan kontrol zoom
    L.control.zoom({ position: 'topright' }).addTo(map);
    
    // Tambahkan legenda peta
    addMapLegend(map, laporan.status);
    
    // Fit bounds untuk menampilkan semua marker (akan diupdate saat ada marker user)
    map.fitBounds([laporanMarker.getLatLng()]);
    
    // Invalidasi ukuran peta
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  });
}

// Fungsi untuk inisialisasi peta sederhana
function initSimpleMapForLaporan(laporan) {
  const lat = parseFloat(laporan.latitude) || -10.1772;
  const lng = parseFloat(laporan.longitude) || 123.6070;
  
  loadLeaflet(() => {
    // Hilangkan loading
    const loadingDiv = document.getElementById('mapLoading');
    if (loadingDiv) {
      loadingDiv.style.display = 'none';
    }
    
    // Tampilkan peta
    const mapDiv = document.getElementById('mapDetail');
    if (mapDiv) {
      mapDiv.style.display = 'block';
    }
    
    // Inisialisasi peta
    const map = L.map('mapDetail').setView([lat, lng], 16);
    laporanDetailMap = map;
    
    // Tambahkan tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    
    // Tentukan warna marker berdasarkan status
    let markerColor = '#ffc107'; // default kuning
    const status = laporan.status?.toLowerCase() || '';
    
    if (status === 'selesai') {
      markerColor = '#28a745'; // hijau
    } else if (status === 'diproses' || status === 'proses') {
      markerColor = '#17a2b8'; // biru muda
    } else if (status === 'ditolak') {
      markerColor = '#f44336'; // merah
    } else if (status === 'diterima') {
      markerColor = '#ffc107'; // kuning
    } else if (status === 'dilaporkan') {
      markerColor = '#9C27B0'; // ungu
    }
    
    // Buat custom icon sederhana
    const customIcon = L.divIcon({
      html: `
        <div style="
          background-color: ${markerColor};
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
        ">
          <i class="bi bi-trash-fill" style="font-size: 16px;"></i>
        </div>
      `,
      className: 'custom-marker-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
    
    // Tambahkan marker
    laporanDetailMarker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    
    // Bind popup sederhana
    laporanDetailMarker.bindPopup(`
      <div style="min-width: 200px;">
        <strong>${laporan.nama || 'Laporan Sampah'}</strong><br/>
        <small class="text-muted">Status: ${laporan.status}</small><br/>
        <small>${laporan.alamat ? laporan.alamat.substring(0, 50) + '...' : 'Tidak ada alamat'}</small>
      </div>
    `).openPopup();
    
    // Event listener untuk klik peta (jika ingin mengubah lokasi)
    map.on('click', function(e) {
      const { lat, lng } = e.latlng;
      
      if (laporanDetailMarker) {
        laporanDetailMarker.setLatLng([lat, lng]);
      }
      
      // Bisa ditambahkan fungsionalitas update koordinat di sini
      console.log(`Koordinat baru: ${lat}, ${lng}`);
    });
    
    // Tambahkan kontrol zoom sederhana
    L.control.zoom({ position: 'topright' }).addTo(map);
    
    // Invalidasi ukuran peta
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  });
}

// Fungsi untuk mendapatkan lokasi GPS pengguna
function getCurrentLocationForLaporan() {
  if (!navigator.geolocation) {
    showNotification("❌ Browser tidak mendukung GPS", "error");
    return;
  }
  
  showNotification("📍 Mengambil lokasi GPS Anda...", "info");
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      
      // Tampilkan koordinat user
      document.getElementById('userCoordinates').style.display = 'block';
      document.getElementById('userLat').textContent = latitude.toFixed(6);
      document.getElementById('userLng').textContent = longitude.toFixed(6);
      
      // Hapus marker user lama jika ada
      if (userMarker) {
        userMarker.remove();
      }
      
      // Hapus garis lama jika ada
      if (distanceLine) {
        distanceLine.remove();
      }
      
      // Buat marker baru untuk user
      const userIcon = L.divIcon({
        html: `
          <div style="
            background-color: #2196F3;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 10px rgba(33, 150, 243, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
          ">
            <i class="bi bi-person-fill" style="font-size: 16px;"></i>
          </div>
        `,
        className: 'user-marker-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      });
      
      userMarker = L.marker([latitude, longitude], { icon: userIcon })
        .addTo(laporanDetailMap);
      
      userMarker.bindPopup(`
        <div style="min-width: 200px;">
          <strong>📍 Lokasi Anda (GPS)</strong><br/>
          <small><strong>Koordinat:</strong> ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</small><br/>
          <small><strong>Akurasi:</strong> ±${Math.round(accuracy)} meter</small>
        </div>
      `).openPopup();
      
      // Hitung jarak antara dua marker
      if (laporanMarker) {
        const distance = calculateDistance(
          laporanMarker.getLatLng().lat,
          laporanMarker.getLatLng().lng,
          latitude,
          longitude
        );
        
        // Tampilkan informasi jarak
        const distanceInfo = document.getElementById('distanceInfo');
        const distanceValue = document.getElementById('distanceValue');
        const distanceUnit = document.getElementById('distanceUnit');
        
        if (distance < 1000) {
          distanceValue.textContent = Math.round(distance);
          distanceUnit.textContent = ' meter';
        } else {
          distanceValue.textContent = (distance / 1000).toFixed(2);
          distanceUnit.textContent = ' km';
        }
        
        distanceInfo.style.display = 'block';
        
        // Buat garis penghubung antara dua marker
        distanceLine = L.polyline([
          laporanMarker.getLatLng(),
          userMarker.getLatLng()
        ], {
          color: '#FF5722',
          weight: 3,
          opacity: 0.8,
          dashArray: '10, 10'
        }).addTo(laporanDetailMap);
        
        // Bind popup untuk garis
        distanceLine.bindPopup(`
          <div style="min-width: 200px;">
            <strong>📏 Jarak</strong><br/>
            <small><strong>Dari lokasi laporan ke Anda:</strong></small><br/>
            <small>${distance < 1000 ? Math.round(distance) + ' meter' : (distance / 1000).toFixed(2) + ' km'}</small>
          </div>
        `);
      }
      
      // Fit bounds untuk menampilkan kedua marker
      if (laporanMarker && userMarker) {
        const bounds = L.latLngBounds([
          laporanMarker.getLatLng(),
          userMarker.getLatLng()
        ]);
        laporanDetailMap.fitBounds(bounds, { padding: [50, 50] });
      }
      
      showNotification(
        `📍 Lokasi GPS ditemukan (Akurasi: ±${Math.round(accuracy)}m)`,
        "success"
      );
    },
    (error) => {
      let errorMessage = "Gagal mendapatkan lokasi";
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Izin lokasi ditolak";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Lokasi tidak tersedia";
          break;
        case error.TIMEOUT:
          errorMessage = "Waktu tunggu habis";
          break;
      }
      showNotification(`❌ ${errorMessage}`, "error");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

function clearUserMarker() {
  if (userMarker) {
    userMarker.remove();
    userMarker = null;
  }
  
  if (distanceLine) {
    distanceLine.remove();
    distanceLine = null;
  }
  
  // Sembunyikan info jarak
  const distanceInfo = document.getElementById('distanceInfo');
  if (distanceInfo) {
    distanceInfo.style.display = 'none';
  }
  
  // Sembunyikan koordinat user
  const userCoordinates = document.getElementById('userCoordinates');
  if (userCoordinates) {
    userCoordinates.style.display = 'none';
  }
  
  // Zoom kembali ke marker laporan
  if (laporanDetailMap && laporanMarker) {
    laporanDetailMap.setView(laporanMarker.getLatLng(), 16);
  }
  
  showNotification("🗑️ Marker GPS berhasil dihapus", "info");
}

// Fungsi untuk menghitung jarak antara dua koordinat (dalam meter)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Jarak dalam meter
}

// Fungsi untuk menambah legenda di peta
function addMapLegend(map, status) {
  const statusColor = getStatusColor(status).background;
  
  const legend = L.control({ position: 'bottomright' });
  
  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'info legend');
    div.style.backgroundColor = 'white';
    div.style.padding = '10px';
    div.style.borderRadius = '5px';
    div.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
    div.style.fontSize = '12px';
    div.style.maxWidth = '150px';
    
    div.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; color: #333;">Legenda:</div>
      <div style="display: flex; align-items: center; margin-bottom: 6px;">
        <div style="width: 12px; height: 12px; background: ${statusColor}; border-radius: 50%; margin-right: 8px; border: 2px solid white;"></div>
        <span>Lokasi Laporan</span>
      </div>
      <div style="display: flex; align-items: center; margin-bottom: 6px;">
        <div style="width: 12px; height: 12px; background: #2196F3; border-radius: 50%; margin-right: 8px; border: 2px solid white;"></div>
        <span>Lokasi Anda</span>
      </div>
      <div style="display: flex; align-items: center;">
        <div style="width: 12px; height: 3px; background: #FF5722; margin-right: 8px;"></div>
        <span>Jarak</span>
      </div>
    `;
    
    return div;
  };
  
  legend.addTo(map);
}

// Fungsi untuk menyalin koordinat
function copyCoordinates(lat, lng) {
  const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  navigator.clipboard.writeText(coords).then(() => {
    showNotification("✅ Koordinat laporan disalin: " + coords, "success");
  }).catch(err => {
    console.error('Gagal menyalin koordinat:', err);
    showNotification("❌ Gagal menyalin koordinat", "error");
  });
}

// [FUNGSI-FUNGSI HELPER LAINNYA TETAP SAMA...]

function renderLaporanCards(laporanList) {
  const container = document.getElementById("laporanContainer");

  if (!laporanList || laporanList.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px;background:#f8f9fa;border-radius:8px;">
        <div style="font-size:48px;color:#ddd;">📭</div>
        <h3 style="color:#666;">Tidak ada laporan</h3>
        <p style="color:#888;">Tidak ada laporan sampah yang ditemukan.</p>
      </div>
    `;
    return;
  }

  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(auto-fill, minmax(300px, 1fr))";
  container.style.gap = "20px";

  container.innerHTML = laporanList.map((l) => {
    const foto = l.foto_bukti;
    const statusColors = getStatusColor(l.status);

    return `
      <div class="laporan-card" style="border:1px solid #ddd;border-radius:12px;background:#fff;display:flex;flex-direction:column">

        <div style="padding:12px 16px;background:${statusColors.lightBackground};display:flex;justify-content:space-between">
          <strong style="color:${statusColors.text}">
            ${getStatusIcon(l.status)} ${l.nama || "Laporan"}
          </strong>
          <span style="font-size:11px;padding:4px 12px;border-radius:20px;background:${statusColors.background};color:${statusColors.text}">
            ${l.status}
          </span>
        </div>

        ${
          foto
            ? `<img src="${foto}" style="height:180px;object-fit:cover" onclick="showImageModal('${foto}')">`
            : `<div style="height:180px;display:flex;align-items:center;justify-content:center;color:#aaa">Tidak ada foto</div>`
        }

        <div style="padding:16px;flex:1">
          <p style="font-size:14px;color:#555">
            ${(l.deskripsi || "").substring(0, 100)}${l.deskripsi?.length > 100 ? "..." : ""}
          </p>
        </div>

        <div style="display:flex;gap:8px;padding:12px;background:#fafafa">
          <button onclick="viewLaporan(${l.idLaporan || l.id})"
            style="flex:1;background:#4285F4;color:#fff;border:none;border-radius:6px;padding:8px">
            Detail
          </button>
          <button onclick="updateLaporanStatus(${l.idLaporan || l.id})"
            style="flex:1;background:${statusColors.actionButton};color:#000000;border:none;border-radius:6px;padding:8px">
            Update
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function renderLaporanPageTim(page) {
  if (!laporanAllData || laporanAllData.length === 0) {
    document.getElementById("laporanContainer").innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px;background:#f8f9fa;border-radius:8px;">
        <div style="font-size:48px;color:#ddd;">📭</div>
        <h3 style="color:#666;">Tidak ada laporan</h3>
        <p style="color:#888;">Tidak ada laporan sampah yang ditemukan.</p>
      </div>
    `;
    document.getElementById("laporanPagination").innerHTML = "";
    return;
  }

  laporanCurrentPage = page;

  const start = (page - 1) * laporanPerPage;
  const end = start + laporanPerPage;

  const pageData = laporanAllData.slice(start, end);

  // RENDER CARD DENGAN DATA PAGE
  renderLaporanCards(pageData);
  
  // RENDER PAGINATION
  renderPaginationTim();
}

function renderPaginationTim() {
  const pagination = document.getElementById("laporanPagination");
  if (!pagination) return;

  const totalPages = Math.ceil(laporanAllData.length / laporanPerPage);
  
  // Jika tidak ada data atau hanya 1 halaman, sembunyikan pagination
  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  // Clear sebelumnya
  pagination.innerHTML = "";

  // Previous button
  const prevButton = document.createElement("button");
  prevButton.textContent = "⬅ Prev";
  prevButton.disabled = laporanCurrentPage === 1;
  prevButton.style.cssText = `
    padding: 8px 16px;
    border: 1px solid #ddd;
    background: ${laporanCurrentPage === 1 ? "#f5f5f5" : "white"};
    color: ${laporanCurrentPage === 1 ? "#999" : "#333"};
    border-radius: 4px;
    cursor: ${laporanCurrentPage === 1 ? "not-allowed" : "pointer"};
  `;
  if (laporanCurrentPage > 1) {
    prevButton.onclick = () => renderLaporanPageTim(laporanCurrentPage - 1);
  }
  pagination.appendChild(prevButton);

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.style.cssText = `
      padding: 8px 16px;
      border: 1px solid #ddd;
      background: ${i === laporanCurrentPage ? "#0d6efd" : "white"};
      color: ${i === laporanCurrentPage ? "white" : "#333"};
      border-radius: 4px;
      cursor: pointer;
      font-weight: ${i === laporanCurrentPage ? "bold" : "normal"};
    `;
    pageButton.onclick = () => renderLaporanPageTim(i);
    pagination.appendChild(pageButton);
  }

  // Next button
  const nextButton = document.createElement("button");
  nextButton.textContent = "Next ➡";
  nextButton.disabled = laporanCurrentPage === totalPages;
  nextButton.style.cssText = `
    padding: 8px 16px;
    border: 1px solid #ddd;
    background: ${laporanCurrentPage === totalPages ? "#f5f5f5" : "white"};
    color: ${laporanCurrentPage === totalPages ? "#999" : "#333"};
    border-radius: 4px;
    cursor: ${laporanCurrentPage === totalPages ? "not-allowed" : "pointer"};
  `;
  if (laporanCurrentPage < totalPages) {
    nextButton.onclick = () => renderLaporanPageTim(laporanCurrentPage + 1);
  }
  pagination.appendChild(nextButton);
}

// Fungsi untuk mendapatkan ikon berdasarkan status
function getStatusIcon(status) {
  const iconMap = {
    dilaporkan: "📝",
    diterima: "✅",
    diproses: "⏳",
    proses: "🔄",
    selesai: "🎉",
    ditolak: "❌",
    pending: "⏱️",
  };
  return iconMap[status] || "📋";
}

// Fungsi untuk format tanggal detail
function formatTanggalDetail(dateString) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

// Fungsi untuk timeline status
function getStatusTimeline(laporan) {
  const status = laporan.status || "dilaporkan";
  const statusOrder = [
    "dilaporkan",
    "diterima",
    "diproses",
    "selesai",
    "ditolak",
  ];
  const currentIndex = statusOrder.indexOf(status);

  let timelineHTML = "";

  statusOrder.forEach((s, index) => {
    if (index <= currentIndex) {
      const statusColors = getStatusColor(s);
      const isCurrent = s === status;

      timelineHTML += `
        <div style="position: relative; margin-bottom: 25px;">
          <div style="position: absolute; left: -25px; top: 0; width: 16px; height: 16px; border-radius: 50%; 
               background: ${statusColors.text}; 
               border: 3px solid white; 
               z-index: 1;
               ${
                 isCurrent
                   ? "box-shadow: 0 0 0 3px " +
                     statusColors.background +
                     ";"
                   : ""
               }">
          </div>
          <div>
            <div style="font-weight: 500; color: #333; display: flex; align-items: center; gap: 8px;">
              ${getStatusIcon(s)} ${s.toUpperCase()}
              ${
                isCurrent
                  ? '<span style="font-size: 11px; background: ' +
                    statusColors.background +
                    "; color: " +
                    statusColors.text +
                    '; padding: 2px 8px; border-radius: 10px;">SAAT INI</span>'
                  : ""
              }
            </div>
          </div>
        </div>
      `;
    }
  });

  return timelineHTML;
}

// Fungsi modal gambar
function showImageModal(imageUrl) {
  const modalHTML = `
    <div class="modal fade" id="imageModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Foto Bukti</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center">
            <img src="${imageUrl}" class="img-fluid" alt="Foto bukti laporan" 
                style="max-height: 70vh; object-fit: contain;">
          </div>
          <div class="modal-footer">
            <a href="${imageUrl}" download class="btn btn-primary">
              <i class="bi bi-download me-2"></i> Download
            </a>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const modalDiv = document.createElement("div");
  modalDiv.innerHTML = modalHTML;
  document.body.appendChild(modalDiv);

  const imageModal = new bootstrap.Modal(document.getElementById("imageModal"));
  imageModal.show();

  // Cleanup after modal is hidden
  document
    .getElementById("imageModal")
    .addEventListener("hidden.bs.modal", function () {
      modalDiv.remove();
    });
}

// Helper function untuk format tanggal sederhana (tetap sama)
function formatTanggalSimple(dateString) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hari ini";
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "Kemarin";
    }

    const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return `${diffDays} hari lalu`;
    }

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  } catch (e) {
    return typeof dateString === "string" ? dateString.split("T")[0] : "-";
  }
}

// Fungsi untuk membuka lokasi laporan di Google Maps
function openLaporanInGoogleMaps(latitude, longitude, locationName = "") {
  try {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      showNotification("❌ Koordinat tidak valid", "error");
      return;
    }

    // Buat URL Google Maps
    let googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    // Tambahkan nama lokasi jika ada
    if (locationName) {
      googleMapsUrl += `&q=${encodeURIComponent(locationName)}`;
    }

    // Buka di tab baru
    window.open(googleMapsUrl, "_blank");

    showNotification("🌍 Membuka lokasi di Google Maps", "info");
  } catch (error) {
    console.error("Error opening Google Maps:", error);
    showNotification("❌ Gagal membuka Google Maps", "error");
  }
}

// Fungsi untuk menyalin koordinat laporan
function copyLaporanCoordinates(latitude, longitude) {
  try {
    const lat = parseFloat(latitude).toFixed(6);
    const lng = parseFloat(longitude).toFixed(6);
    const coords = `${lat}, ${lng}`;

    navigator.clipboard
      .writeText(coords)
      .then(() => {
        showNotification("✅ Koordinat disalin: " + coords, "success");
      })
      .catch((err) => {
        // Fallback untuk browser lama
        const textArea = document.createElement("textarea");
        textArea.value = coords;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        showNotification("✅ Koordinat disalin: " + coords, "success");
      });
  } catch (error) {
    console.error("Error copying coordinates:", error);
    showNotification("❌ Gagal menyalin koordinat", "error");
  }
}

// Fungsi notifikasi
function showNotification(message, type = "info") {
  const existing = document.querySelector(".custom-notification");
  if (existing) existing.remove();

  const notification = document.createElement("div");
  notification.className = "custom-notification";
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 14px;
    font-weight: 500;
    animation: slideIn 0.3s ease;
    max-width: 300px;
    display: flex;
    align-items: center;
    gap: 10px;
  `;

  if (type === "success") notification.style.backgroundColor = "#34A853";
  else if (type === "error") notification.style.backgroundColor = "#EA4335";
  else if (type === "warning") notification.style.backgroundColor = "#FBBC05";
  else notification.style.backgroundColor = "#4285F4";

  const icon =
    type === "success"
      ? "✅"
      : type === "error"
      ? "❌"
      : type === "warning"
      ? "⚠️"
      : "ℹ️";

  notification.innerHTML = `<span style="font-size: 16px;">${icon}</span><span>${message}</span>`;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Tambahkan CSS untuk animasi jika belum ada
if (!document.querySelector("#notification-styles")) {
  const style = document.createElement("style");
  style.id = "notification-styles";
  style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
  `;
  document.head.appendChild(style);
}

// Fungsi update status
async function updateLaporanStatus(laporanId) {
  try {
    const laporan = await fetchAPI(`${API.laporanSampah}${laporanId}/`, {
      headers: getAuthHeaders(),
    });

    const currentStatus = laporan.status || "pending";
    
    const formHTML = `
      <form id="updateLaporanForm">
        <div class="alert alert-info">
          <i class="bi bi-info-circle me-2"></i>
          Status saat ini: <strong>${getStatusText(currentStatus)}</strong>
        </div>
        
        <div class="mb-3">
          <label class="form-label">Status Baru:</label>
          <select id="status" class="form-select" 
                  onchange="checkStatusChange('${currentStatus}')">
            <option value="pending" ${currentStatus === "pending" ? "selected" : ""}>
              Pending
            </option>
            <option value="proses" ${currentStatus === "proses" ? "selected" : ""}>
              Proses
            </option>
            <option value="selesai" ${currentStatus === "selesai" ? "selected" : ""}>
              Selesai
            </option>
          </select>
        </div>
        
        <div id="statusWarning" class="alert alert-warning d-none">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Status yang dipilih sama dengan status saat ini. 
          Silakan pilih status yang berbeda untuk melakukan perubahan.
        </div>
        
        <div id="statusMessage"></div>
      </form>
    `;

    showModal(
      "Update Status Laporan", 
      formHTML, 
      async () => {
        const newStatus = document.getElementById("status").value;
        const statusMessage = document.getElementById("statusMessage");
        
        // Validasi: status harus berbeda dari current status
        if (newStatus === currentStatus) {
          if (statusMessage) {
            statusMessage.innerHTML = `
              <div class="alert alert-danger">
                <i class="bi bi-x-circle me-2"></i>
                Status belum berubah. Silakan pilih status yang berbeda.
              </div>
            `;
          }
          return false; // ⬅️ Mencegah modal ditutup
        }

        const updatedData = {
          status: newStatus,
        };

        try {
          await fetchAPI(`${API.laporanSampah}${laporanId}/`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(updatedData),
          });

          showNotification("✅ Status laporan berhasil diupdate!", "success");
          alert("✅ Status laporan berhasil diupdate!, 'success'")
          loadLaporan();
          return true; // ⬅️ Izinkan modal ditutup
          
        } catch (error) {
          if (statusMessage) {
            statusMessage.innerHTML = `
              <div class="alert alert-danger">
                <i class="bi bi-x-circle me-2"></i>
                Error: ${error.message}
              </div>
            `;
          }
          return false; // ⬅️ Mencegah modal ditutup
        }
      }
    );
    
    // Inisialisasi status warning saat modal terbuka
    setTimeout(() => {
      checkStatusChange(currentStatus);
    }, 100);
    
  } catch (error) {
    showNotification(`❌ Error: ${error.message}`, "error");
  }
}

function checkStatusChange(currentStatus) {
  const statusSelect = document.getElementById('status');
  const warningDiv = document.getElementById('statusWarning');
  const messageDiv = document.getElementById('statusMessage');

  if (!statusSelect) return;

  const newStatus = statusSelect.value;

  // Reset
  if (messageDiv) messageDiv.innerHTML = '';

  if (newStatus === currentStatus) {
    if (warningDiv) warningDiv.classList.remove('d-none');
  } else {
    if (warningDiv) warningDiv.classList.add('d-none');
    if (messageDiv) {
      messageDiv.innerHTML = `
        <div class="alert alert-success">
          <i class="bi bi-check-circle me-2"></i>
          Status akan diubah dari 
          <strong>${getStatusText(currentStatus)}</strong> 
          menjadi 
          <strong>${getStatusText(newStatus)}</strong>
        </div>
      `;
    }
  }
}

function getStatusText(status) {
  const statusMap = {
    'pending': 'Pending',
    'proses': 'Proses',
    'selesai': 'Selesai'
  };
  return statusMap[status] || status;
}

function getStatusBadge(status) {
  const badgeMap = {
    'pending': 'bg-warning text-dark',
    'proses': 'bg-info text-white',
    'selesai': 'bg-success text-white'
  };
  return badgeMap[status] || 'bg-secondary text-white';
}

function getStatusColor(status) {
  const colors = {
    dilaporkan: {
      background: "#F3E5F5",
      text: "#4A148C",
      border: "#CE93D8",
      lightBackground: "#FAF5FB",
      actionButton: "#E1BEE7"
    },
    diterima: {
      background: "#E3F2FD",
      text: "#0D47A1",
      border: "#90CAF9",
      lightBackground: "#F5FAFF",
      actionButton: "#BBDEFB"
    },
    diproses: {
      background: "#FFF3E0",
      text: "#E65100",
      border: "#FFB74D",
      lightBackground: "#FFF8EE",
      actionButton: "#FFE0B2"
    },
    proses: {
      background: "#FFF3E0",
      text: "#E65100",
      border: "#FFB74D",
      lightBackground: "#FFF8EE",
      actionButton: "#FFE0B2"
    },
    selesai: {
      background: "#E8F5E9",
      text: "#1B5E20",
      border: "#A5D6A7",
      lightBackground: "#F3FBF4",
      actionButton: "#C8E6C9"
    },
    ditolak: {
      background: "#FFEBEE",
      text: "#B71C1C",
      border: "#EF9A9A",
      lightBackground: "#FFF5F6",
      actionButton: "#FFCDD2"
    },
    pending: {
      background: "#F5F5F5",
      text: "#424242",
      border: "#BDBDBD",
      lightBackground: "#FAFAFA",
      actionButton: "#E0E0E0"
    }
  };

  return colors[status] || {
    background: "#FAFAFA",
    text: "#424242",
    border: "#BDBDBD",
    lightBackground: "#FFFFFF",
    actionButton: "#EEEEEE"
  };
}


// Export fungsi ke global scope
window.viewLaporan = viewLaporan;
window.updateLaporanStatus = updateLaporanStatus;
window.openLaporanInGoogleMaps = openLaporanInGoogleMaps;
window.copyLaporanCoordinates = copyLaporanCoordinates;
window.getCurrentLocationForLaporan = getCurrentLocationForLaporan;
window.copyCoordinates = copyCoordinates;
window.showImageModal = showImageModal;
window.renderLaporanPageTim = renderLaporanPageTim;
window.renderPaginationTim = renderPaginationTim;
window.checkStatusChange = checkStatusChange;
window.clearUserMarker = clearUserMarker;