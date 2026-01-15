import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showModal } from "../../utils/modal.js";
import { initMapForm } from "../../utils/mapConfig.js";

export async function anggotaTimPage() {
  const mainContent = document.getElementById("mainContent");
  mainContent.innerHTML = `
    <div class="anggota-container">
      <div class="header-section">
        <h2><i class="bi bi-people-fill"></i> Data Anggota</h2>
        <div class="filter-section">
          <div class="input-group search-box">
            <span class="input-group-text bg-light border-end-0">
              <i class="bi bi-search text-success"></i>
            </span>
            <input type="text" id="searchAnggota" class="form-control border-start-0" placeholder="Cari nama atau alamat...">
          </div>
          <select id="filterStatus" class="form-select">
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="non-aktif">Non-Aktif</option>
          </select>
        </div>
      </div>
      
      <div id="anggotaContainer">
        <div class="text-center py-5">
          <div class="spinner-border text-success" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3 text-muted">Memuat data anggota...</p>
        </div>
      </div>
      
      <!-- Container untuk detail anggota (akan ditampilkan di sini) -->
      <div id="anggotaDetailContainer" style="display: none;"></div>
    </div>
    
    <style>
      .anggota-container {
        padding: 20px;
      }
      
      .header-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
        flex-wrap: wrap;
        gap: 15px;
      }
      
      .header-section h2 {
        color: #2c3e50;
        margin: 0;
        font-weight: 600;
      }
      
      .filter-section {
        display: flex;
        gap: 15px;
        align-items: center;
      }
      
      .search-box {
        width: 300px;
      }
      
      .anggota-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 20px;
      }
      
      .anggota-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.08);
        border: 1px solid #e9ecef;
        transition: all 0.3s ease;
        overflow: hidden;
      }
      
      .anggota-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 5px 20px rgba(0,0,0,0.12);
        border-color: #20c997;
      }
      
      .card-header {
        padding: 20px;
        border-bottom: 1px solid #e9ecef;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      }
      
      .member-name {
        font-size: 1.25rem;
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 5px;
      }
      
      .member-wa {
        color: #6c757d;
        font-size: 0.9rem;
      }
      
      .status-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .status-aktif {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }
      
      .status-nonaktif {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
      
      .card-body {
        padding: 20px;
      }
      
      .address-text {
        color: #495057;
        line-height: 1.5;
        margin-bottom: 15px;
        font-size: 0.95rem;
      }
      
      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        font-size: 0.85rem;
      }
      
      .info-label {
        color: #6c757d;
        font-weight: 500;
      }
      
      .info-value {
        color: #495057;
        font-weight: 600;
      }
      
      .detail-btn {
        width: 100%;
        padding: 10px;
        background: linear-gradient(135deg, #20c997 0%, #17a2b8 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      
      .detail-btn:hover {
        background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
        transform: translateY(-1px);
      }
      
      /* Styling untuk detail view */
      .detail-view {
        background: white;
        border-radius: 12px;
        box-shadow: 0 5px 25px rgba(0,0,0,0.1);
        padding: 30px;
        margin-bottom: 30px;
        animation: fadeIn 0.5s ease;
      }
      
      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #f1f3f4;
      }
      
      .back-button {
        padding: 8px 16px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
      }
      
      .back-button:hover {
        background: #5a6268;
        transform: translateX(-3px);
      }
      
      .member-title {
        font-size: 1.8rem;
        font-weight: 600;
        color: #2c3e50;
        margin: 0;
      }
      
      .detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 30px;
        margin-bottom: 30px;
      }
      
      .info-card {
        background: #f8f9fa;
        border-radius: 10px;
        padding: 20px;
        border: 1px solid #e9ecef;
      }
      
      .info-card h5 {
        color: #20c997;
        margin-bottom: 15px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .info-card h5 i {
        font-size: 1.2rem;
      }
      
      .info-item {
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px dashed #dee2e6;
      }
      
      .info-item:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
      }
      
      .info-label-lg {
        color: #6c757d;
        font-weight: 500;
        display: block;
        margin-bottom: 4px;
        font-size: 0.9rem;
      }
      
      .info-value-lg {
        color: #495057;
        font-weight: 600;
        font-size: 1rem;
      }
      
      .map-container {
        margin-top: 25px;
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid #dee2e6;
        height: 400px;
        position: relative;
      }
      
      .map-loading {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(248, 249, 250, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        z-index: 100;
      }
      
      .map-controls {
        position: absolute;
        top: 15px;
        right: 15px;
        z-index: 1000;
        display: flex;
        gap: 10px;
      }
      
      .map-btn {
        background: white;
        border: none;
        border-radius: 6px;
        padding: 8px 12px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        color: #495057;
        font-weight: 500;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.3s ease;
        cursor: pointer;
      }
      
      .map-btn:hover {
        background: #20c997;
        color: white;
        transform: translateY(-1px);
      }
      
      .action-buttons {
        display: flex;
        gap: 15px;
        justify-content: center;
        margin-top: 25px;
        flex-wrap: wrap;
      }
      
      .action-btn {
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        text-decoration: none;
        transition: all 0.3s ease;
      }
      
      .action-btn.primary {
        background: #20c997;
        color: white;
        border: none;
      }
      
      .action-btn.primary:hover {
        background: #17a2b8;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(32, 201, 151, 0.3);
      }
      
      .action-btn.secondary {
        background: #6c757d;
        color: white;
        border: none;
      }
      
      .action-btn.secondary:hover {
        background: #5a6268;
        transform: translateY(-2px);
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @media (max-width: 768px) {
        .header-section {
          flex-direction: column;
          align-items: stretch;
        }
        
        .filter-section {
          flex-direction: column;
        }
        
        .search-box {
          width: 100%;
        }
        
        .anggota-grid {
          grid-template-columns: 1fr;
        }
        
        .detail-grid {
          grid-template-columns: 1fr;
        }
        
        .action-buttons {
          flex-direction: column;
        }
        
        .action-btn {
          width: 100%;
          justify-content: center;
        }
      }
    </style>
  `;

  document.getElementById("searchAnggota").addEventListener("input", loadAnggota);
  document.getElementById("filterStatus").addEventListener("change", loadAnggota);

  loadAnggota();
}

async function loadAnggota() {
  const search = document.getElementById("searchAnggota")?.value || "";
  const filterStatus = document.getElementById("filterStatus")?.value || "";
  
  const container = document.getElementById("anggotaContainer");
  
  // Show loading
  container.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-success" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Memuat data anggota...</p>
    </div>
  `;

  try {
    const anggota = await fetchAPI(API.anggota, {
      headers: getAuthHeaders(),
    });

    const filteredAnggota = anggota.filter((a) => {
      const matchSearch =
        (a.nama?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (a.alamat?.toLowerCase() || '').includes(search.toLowerCase());
      const matchStatus = !filterStatus || a.status === filterStatus;
      return matchSearch && matchStatus;
    });

    renderAnggotaCards(filteredAnggota);
  } catch (error) {
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        Error loading anggota: ${error.message}
      </div>
    `;
  }
}

function renderAnggotaCards(anggotaList) {
  const container = document.getElementById("anggotaContainer");

  if (anggotaList.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-people text-muted" style="font-size: 4rem;"></i>
        <h4 class="mt-3 text-muted">Tidak ada data anggota</h4>
        <p class="text-muted">Coba ubah kata kunci pencarian atau filter status</p>
      </div>
    `;
    return;
  }

  const cardsHTML = anggotaList.map((a) => {
    const statusClass = a.status === 'aktif' ? 'status-aktif' : 'status-nonaktif';
    const statusText = a.status === 'aktif' ? 'Aktif' : 'Non-Aktif';
    
    return `
      <div class="anggota-card">
        <div class="card-header">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div class="member-name">${a.nama || 'N/A'}</div>
              <div class="member-wa"><i class="bi bi-whatsapp text-success"></i> ${a.noWA || '-'}</div>
            </div>
            <span class="status-badge ${statusClass}">${statusText}</span>
          </div>
        </div>
        <div class="card-body">
          <div class="address-text">
            <i class="bi bi-geo-alt text-muted me-2"></i>
            ${(a.alamat || 'Alamat tidak tersedia').substring(0, 80)}${a.alamat && a.alamat.length > 80 ? '...' : ''}
          </div>
          
          <div class="info-row">
            <span class="info-label">Periode:</span>
            <span class="info-value">${a.tanggalStart || '-'} s/d ${a.tanggalEnd || '-'}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Jenis Sampah:</span>
            <span class="info-value">${a.jenisSampah || '-'}</span>
          </div>
          
          <button onclick="showAnggotaDetail('${a.idAnggota || a.id}')" 
                  class="detail-btn mt-3">
            <i class="bi bi-eye-fill"></i> Lihat Detail
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="anggota-grid">
      ${cardsHTML}
    </div>
  `;
  
  // Expose fungsi ke window
  window.showAnggotaDetail = showAnggotaDetail;
}

async function showAnggotaDetail(anggotaId) {
  try {
    // Sembunyikan list dan tampilkan loading
    document.getElementById("anggotaContainer").style.display = "none";
    const detailContainer = document.getElementById("anggotaDetailContainer");
    
    detailContainer.style.display = "block";
    detailContainer.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Memuat detail anggota...</p>
      </div>
    `;

    const anggota = await fetchAPI(`${API.anggota}${anggotaId}/`, {
      headers: getAuthHeaders(),
    });

    // Format data
    const lat = parseFloat(anggota.latitude) || null;
    const lng = parseFloat(anggota.longitude) || null;
    const latDisplay = lat ? lat.toFixed(6) : "Belum diatur";
    const lngDisplay = lng ? lng.toFixed(6) : "Belum diatur";
    
    const statusClass = anggota.status === 'aktif' ? 'status-aktif' : 'status-nonaktif';
    const statusText = anggota.status === 'aktif' ? 'Aktif' : 'Non-Aktif';

    const detailHTML = `
      <div class="detail-view">
        <div class="detail-header">
          <button onclick="hideAnggotaDetail()" class="back-button">
            <i class="bi bi-arrow-left"></i> Kembali ke Daftar
          </button>
          <h2 class="member-title">Detail Anggota</h2>
          <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
        
        <div class="detail-grid">
          <div class="info-card">
            <h5><i class="bi bi-person-circle"></i> Informasi Pribadi</h5>
            <div class="info-item">
              <span class="info-label-lg">Nama Lengkap</span>
              <span class="info-value-lg">${anggota.nama || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label-lg">No. WhatsApp</span>
              <span class="info-value-lg">
                <i class="bi bi-whatsapp text-success me-2"></i>
                ${anggota.noWA || '-'}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label-lg">Alamat Lengkap</span>
              <span class="info-value-lg">${anggota.alamat || 'Alamat tidak tersedia'}</span>
            </div>
          </div>
          
          <div class="info-card">
            <h5><i class="bi bi-calendar-check"></i> Informasi Langganan</h5>
            <div class="info-item">
              <span class="info-label-lg">Tanggal Mulai</span>
              <span class="info-value-lg">${anggota.tanggalStart || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label-lg">Tanggal Berakhir</span>
              <span class="info-value-lg">${anggota.tanggalEnd || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label-lg">Jenis Sampah</span>
              <span class="info-value-lg">${anggota.jenisSampah || '-'}</span>
            </div>
          </div>
          
          <div class="info-card">
            <h5><i class="bi bi-geo-alt"></i> Informasi Lokasi</h5>
            <div class="info-item">
              <span class="info-label-lg">Koordinat</span>
              <span class="info-value-lg">
                ${latDisplay}, ${lngDisplay}
                ${lat && lng ? `
                  <button onclick="copyToClipboard('${latDisplay}, ${lngDisplay}')" 
                          class="btn btn-sm btn-outline-secondary ms-2">
                    <i class="bi bi-clipboard"></i> Salin
                  </button>
                ` : ''}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label-lg">Status GPS</span>
              <span class="info-value-lg">
                ${lat && lng ? 
                  '<span class="badge bg-success">Lokasi valid</span>' : 
                  '<span class="badge bg-warning">Lokasi belum diatur</span>'}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Map Section -->
        <div class="map-container">
          <div id="map-loading-${anggotaId}" class="map-loading">
            <div class="spinner-border text-success" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3 text-muted">Memuat peta...</p>
          </div>
          <div id="map-${anggotaId}" style="width: 100%; height: 100%;"></div>
          
          ${lat && lng ? `
            <div class="map-controls">
              <button
                onclick="showLocationMap(${anggota.latitude}, ${anggota.longitude}, '${(anggota.nama || "").replace(/'/g, "\\'")}', '${(anggota.alamat || "").replace(/'/g, "\\'")}')"
                class="btn btn-sm btn-outline-success">
                <i class="bi bi-map"></i> Peta & Rute
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    detailContainer.innerHTML = detailHTML;
    
    // Expose fungsi ke window
    window.hideAnggotaDetail = hideAnggotaDetail;
    window.copyToClipboard = copyToClipboard;
    window.openInGoogleMaps = openInGoogleMaps;
    
    // Load peta jika ada koordinat
    if (lat && lng) {
      setTimeout(() => loadAnggotaMap(anggotaId, lat, lng, anggota.nama, anggota.alamat), 500);
    } else {
      // Hide loading jika tidak ada peta
      const loadingDiv = document.getElementById(`map-loading-${anggotaId}`);
      if (loadingDiv) {
        loadingDiv.style.display = 'none';
      }
    }

  } catch (error) {
    const detailContainer = document.getElementById("anggotaDetailContainer");
    detailContainer.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <h5>Gagal Memuat Detail</h5>
        <p>${error.message}</p>
        <button onclick="hideAnggotaDetail()" class="btn btn-secondary mt-2">
          <i class="bi bi-arrow-left"></i> Kembali
        </button>
      </div>
    `;
  }
}

function hideAnggotaDetail() {
  document.getElementById("anggotaDetailContainer").style.display = "none";
  document.getElementById("anggotaDetailContainer").innerHTML = "";
  document.getElementById("anggotaContainer").style.display = "block";
  
  // Hapus semua peta yang aktif
  if (window.anggotaMaps) {
    Object.values(window.anggotaMaps).forEach(map => {
      if (map && map.remove) {
        map.remove();
      }
    });
    window.anggotaMaps = {};
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => {
      showNotification('✅ Berhasil disalin ke clipboard', 'success');
    })
    .catch(err => {
      // Fallback untuk browser lama
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showNotification('✅ Berhasil disalin ke clipboard', 'success');
    });
}

function openInGoogleMaps(latitude, longitude, locationName = "") {
  try {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      showNotification('❌ Koordinat tidak valid', 'error');
      return;
    }

    let googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    if (locationName) {
      googleMapsUrl += `&q=${encodeURIComponent(locationName)}`;
    }

    window.open(googleMapsUrl, "_blank");
    showNotification('🌍 Membuka di Google Maps...', 'info');
  } catch (error) {
    console.error("Error opening Google Maps:", error);
    showNotification('❌ Gagal membuka Google Maps', 'error');
  }
}

async function loadAnggotaMap(anggotaId, latitude, longitude, nama, alamat) {
  const mapId = `map-${anggotaId}`;
  const loadingId = `map-loading-${anggotaId}`;
  
  try {
    // Cek apakah Leaflet sudah dimuat
    if (!window.L) {
      await loadLeaflet();
    }
    
    // Hapus loading
    const loadingDiv = document.getElementById(loadingId);
    if (loadingDiv) {
      loadingDiv.style.display = 'none';
    }
    
    // Inisialisasi peta
    const map = L.map(mapId).setView([latitude, longitude], 15);
    
    // Tambahkan tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);
    
    // Tambahkan marker
    const marker = L.marker([latitude, longitude]).addTo(map);
    marker.bindPopup(`
      <div style="padding: 10px; min-width: 250px;">
        <h6 style="margin: 0 0 10px 0; color: #20c997;">
          <i class="bi bi-geo-alt-fill"></i> ${nama}
        </h6>
        <p style="margin: 0; font-size: 12px; color: #666;">
          ${alamat || 'Alamat tidak tersedia'}
        </p>
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #888;">
          <strong>Koordinat:</strong> ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
        </p>
      </div>
    `).openPopup();
    
    // Tambahkan kontrol
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale().addTo(map);
    
    // Simpan reference
    if (!window.anggotaMaps) window.anggotaMaps = {};
    window.anggotaMaps[anggotaId] = map;
    
  } catch (error) {
    console.error("Error loading map:", error);
    const loadingDiv = document.getElementById(loadingId);
    if (loadingDiv) {
      loadingDiv.innerHTML = `
        <div style="color: #dc3545; text-align: center;">
          <i class="bi bi-exclamation-triangle-fill" style="font-size: 2rem;"></i>
          <p style="margin: 10px 0;">Gagal memuat peta</p>
          <button onclick="retryLoadMap('${anggotaId}', ${latitude}, ${longitude})" 
                  class="btn btn-sm btn-outline-danger">
            <i class="bi bi-arrow-clockwise"></i> Coba Lagi
          </button>
        </div>
      `;
    }
  }
}

async function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve();
      return;
    }
    
    // Load CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const leafletCSS = document.createElement('link');
      leafletCSS.rel = 'stylesheet';
      leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      leafletCSS.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      leafletCSS.crossOrigin = '';
      document.head.appendChild(leafletCSS);
    }
    
    // Load JS
    const scriptId = 'leaflet-anggota-script';
    if (document.getElementById(scriptId)) {
      const checkLoaded = setInterval(() => {
        if (window.L) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);
      return;
    }
    
    const leafletScript = document.createElement('script');
    leafletScript.id = scriptId;
    leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    leafletScript.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    leafletScript.crossOrigin = '';
    
    leafletScript.onload = () => {
      // Fix Leaflet icon paths
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
      });
      resolve();
    };
    
    leafletScript.onerror = reject;
    document.body.appendChild(leafletScript);
  });
}

function retryLoadMap(anggotaId, latitude, longitude) {
  // Untuk implementasi, Anda perlu mendapatkan kembali data anggota
  // Ini adalah simplifikasi
  console.log("Retry map load for:", anggotaId);
  // Dalam implementasi nyata, Anda perlu menyimpan data anggota
}

// Fungsi notifikasi sederhana
function showNotification(message, type = 'info') {
  const existing = document.querySelector('.custom-notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = 'custom-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
    max-width: 300px;
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  
  // Set warna
  if (type === 'success') {
    notification.style.backgroundColor = '#28a745';
  } else if (type === 'error') {
    notification.style.backgroundColor = '#dc3545';
  } else if (type === 'warning') {
    notification.style.backgroundColor = '#ffc107';
    notification.style.color = '#212529';
  } else {
    notification.style.backgroundColor = '#17a2b8';
  }
  
  // Icon
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  
  notification.innerHTML = `
    <span style="font-size: 16px;">${icon}</span>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  // Auto hide
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Tambahkan CSS animation jika belum ada
if (!document.querySelector('#notification-animations')) {
  const style = document.createElement('style');
  style.id = 'notification-animations';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// Expose fungsi ke global scope
window.showAnggotaDetail = showAnggotaDetail;
window.hideAnggotaDetail = hideAnggotaDetail;
window.copyToClipboard = copyToClipboard;
window.openInGoogleMaps = openInGoogleMaps;
window.retryLoadMap = retryLoadMap;