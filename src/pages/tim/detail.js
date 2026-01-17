import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showModal } from "../../utils/modal.js";
import { showInteractiveRouteMap } from "./peta.js";

let allAnggotaData = [];


let user;
let username;


export async function detailTimPage() {

  const rawUser = localStorage.getItem("user");

    if (!rawUser) {
        window.location.href = "#/login";
        return; // ✅ LEGAL
    }

    user = JSON.parse(rawUser);
    username = user.username;

  if (!username) {
    console.error("User not found in localStorage");
    return;
  }
  
  const mainContent = document.getElementById("mainContent");
  mainContent.innerHTML = `
    <!-- Tambahkan di head atau sebelum script utama -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />

    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">

    <style>
    .marker-blue {
      filter: hue-rotate(200deg) saturate(150%);
    }
    </style>
    <div class="detail-tim-container">
      <div class="header-section">
        <h2><i class="bi bi-truck"></i> Jadwal Pengangkutan Tim ${username}</h2>
        <div class="filter-section">
          <div class="input-group">
            <span class="input-group-text bg-light">
              <i class="bi bi-calendar-event text-success"></i>
            </span>
            <input type="date" id="filterDate" class="form-control" 
                   placeholder="Filter tanggal jadwal">
          </div>
          <select id="filterStatus" class="form-select">
            <option value="">Semua Status</option>
            <option value="terjadwal">Terjadwal</option>
            <option value="dalam_proses">Dalam Proses</option>
            <option value="selesai">Selesai</option>
            <option value="dibatalkan">Dibatalkan</option>
          </select>
          <button id="resetFilter" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-clockwise"></i> Reset
          </button>
        </div>
      </div>
      
      <div id="detailContainer">
        <div class="text-center py-5">
          <div class="spinner-border text-success" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3 text-muted">Memuat data pengangkutan...</p>
        </div>
      </div>
    </div>
    
    <style>
      .detail-tim-container {
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
        gap: 10px;
        align-items: center;
      }
      
      .input-group {
        width: 180px;
      }
      
      .detail-table {
        width: 100%;
        background: white;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      }
      
      .table-header {
        background: linear-gradient(135deg, #20c997 0%, #17a2b8 100%);
        color: white;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .table-body {
        max-height: 600px;
        overflow-y: auto;
      }
      
      .detail-row {
        display: grid;
        grid-template-columns: 1.5fr 1fr 1.5fr 1fr 1.5fr 1.5fr;
        gap: 12px;
        padding: 15px 20px;
        border-bottom: 1px solid #e9ecef;
        align-items: center;
        transition: background-color 0.2s;
      }
      
      .detail-row:hover {
        background-color: #f8f9fa;
      }
      
      .detail-row:last-child {
        border-bottom: none;
      }
      
      .anggota-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .anggota-name {
        font-weight: 600;
        color: #2c3e50;
        margin: 0;
      }
      
      .anggota-actions {
        display: flex;
        gap: 6px;
        margin-top: 4px;
      }
      
      .anggota-action-btn {
        padding: 3px 8px;
        font-size: 0.7rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s;
      }
      
      .anggota-action-btn.member {
        background: #20c997;
        color: white;
      }
      
      .anggota-action-btn.member:hover {
        background: #17a2b8;
        transform: translateY(-1px);
      }
      
      .anggota-action-btn.map {
        background: #6f42c1;
        color: white;
      }
      
      .anggota-action-btn.map:hover {
        background: #5a32a3;
        transform: translateY(-1px);
      }
      
      .anggota-wa {
        font-size: 0.8rem;
        color: #6c757d;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      
      .jadwal-date {
        font-weight: 500;
        color: #495057;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .jadwal-date i {
        color: #20c997;
      }
      
      .address-text {
        color: #495057;
        font-size: 0.85rem;
        line-height: 1.4;
      }
      
      .status-badge {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 500;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .status-terjadwal {
        background: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
      }
      
      .status-dalam_proses {
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
      }
      
      .status-selesai {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }
      
      .status-dibatalkan {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
      
      .catatan-text {
        color: #6c757d;
        font-size: 0.85rem;
        max-height: 40px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      
      .action-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      .action-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
        transition: all 0.2s;
      }
      
      .action-btn.update {
        background: #ffc107;
        color: #212529;
      }
      
      .action-btn.update:hover {
        background: #e0a800;
        transform: translateY(-1px);
      }
      
      .action-btn.view {
        background: #17a2b8;
        color: white;
      }
      
      .action-btn.view:hover {
        background: #138496;
        transform: translateY(-1px);
      }
      
      .action-btn.location {
        background: #6f42c1;
        color: white;
      }
      
      .action-btn.location:hover {
        background: #5a32a3;
        transform: translateY(-1px);
      }
      
      .no-data {
        text-align: center;
        padding: 60px 20px;
        color: #6c757d;
      }
      
      .no-data i {
        font-size: 3rem;
        margin-bottom: 15px;
        opacity: 0.5;
      }
      
      /* Modal Styling untuk Detail */
      .detail-modal-content {
        max-width: 800px;
      }
      
      .coordinate-actions {
        display: flex;
        gap: 10px;
        margin-top: 10px;
      }

      /* Tambahkan di bagian style */
      .marker-blue {
        filter: hue-rotate(200deg) saturate(150%) brightness(0.9);
      }

      .all-anggota-map-modal {
        min-width: 90vw;
      }
      
      @media (max-width: 1200px) {
        .detail-row {
          grid-template-columns: 1fr;
          gap: 15px;
          padding: 20px;
        }
        
        .anggota-actions {
          justify-content: flex-start;
        }
        
        .action-buttons {
          justify-content: flex-start;
        }
        
        .filter-section {
          flex-direction: column;
          width: 100%;
        }
        
        .input-group {
          width: 100%;
        }
        
        .form-select {
          width: 100%;
        }
        
        #resetFilter {
          width: 100%;
        }
      }
      
      @media (max-width: 768px) {
        .header-section {
          flex-direction: column;
          align-items: stretch;
        }
        
        .filter-section {
          width: 100%;
        }

        .all-anggota-map-modal {
          min-width: 70vw;
        }
      }
    </style>
  `;

  // Set default filter date ke hari ini
  const today = getLocalDateString();
  document.getElementById("filterDate").value = today;

  // Event listeners
  document.getElementById("filterStatus").addEventListener("change", loadDetail);
  document.getElementById("filterDate").addEventListener("change", loadDetail);
  document.getElementById("resetFilter").addEventListener("click", resetFilter);

  // Load initial data
  loadDetail();
}

async function loadDetail() {
  const filterStatus = document.getElementById("filterStatus")?.value || "";
  const filterDate = document.getElementById("filterDate")?.value || "";

  const container = document.getElementById("detailContainer");
  
  // Show loading
  container.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-success" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Memuat data pengangkutan...</p>
    </div>
  `;

  try {
    // 1. Fetch detail jadwal
    const detail = await fetchAPI(API.detailAnggotaJadwal, {
      headers: getAuthHeaders(),
    });

    console.log("Semua data jadwal:", detail);
    console.log("Username yang login:", username);

    // 2. Fetch semua anggota
    const semuaAnggota = await fetchAllAnggotaWithLocation();
    
    // =============== PERBAIKAN UTAMA ===============
    // Filter hanya data yang nama_tim sama dengan username yang login
    const filteredDetail = detail.filter((d) => {
      const namaTim = d.nama_tim || '';
      
      // Filter utama: hanya tampilkan jika nama_tim sama dengan username
      const matchTim = namaTim === username;
      
      if (!matchTim) {
        console.log(`Data ${d.id} tidak sesuai: nama_tim="${namaTim}", username="${username}"`);
        return false;
      }
      
      // Filter berdasarkan status
      const matchStatus = !filterStatus || 
        (d.status_pengangkutan || d.status) === filterStatus;
      
      // Filter berdasarkan tanggalJadwal
      let matchDate = true;
      if (filterDate) {
        const jadwalDate = d.tanggalJadwal || d.tanggal_jadwal || d.tanggal || d.created_at;
        if (jadwalDate) {
          try {
            const dateObj = new Date(jadwalDate);
            const dateString = dateObj.toISOString().split("T")[0];
            matchDate = dateString === filterDate;
          } catch (e) {
            console.warn("Error parsing date:", jadwalDate, e);
            matchDate = false;
          }
        } else {
          matchDate = false;
        }
      }
      
      return matchTim && matchStatus && matchDate;
    });

    console.log("Data setelah filter:", filteredDetail);

    // SIMPAN DATA GLOBAL untuk peta dari data ANGGOTA
    allAnggotaData = [];
    
    filteredDetail.forEach(detailItem => {
      const anggotaId = detailItem.idAnggota || detailItem.anggotaId;
      
      if (anggotaId) {
        // Cari data anggota lengkap dari semuaAnggota
        const anggotaLengkap = semuaAnggota.find(a => 
          a.id === anggotaId || a.idAnggota === anggotaId
        );
        
        if (anggotaLengkap && anggotaLengkap.latitude && anggotaLengkap.longitude) {
          // Gabungkan data detail dengan data anggota
          allAnggotaData.push({
            ...anggotaLengkap,
            status_pengangkutan: detailItem.status_pengangkutan || detailItem.status,
            tanggalJadwal: detailItem.tanggalJadwal || detailItem.tanggal_jadwal,
            catatan: detailItem.catatan
          });
        }
      }
    });
    
    console.log("📍 Data untuk peta:", allAnggotaData.length, "anggota");
    console.log("🔍 Detail data peta:", allAnggotaData);

    renderDetailTable(filteredDetail);
  } catch (error) {
    console.error("Error loading detail:", error);
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        Error loading detail: ${error.message}
      </div>
    `;
  }
}

async function showAllAnggotaMap() {
  if (!allAnggotaData || allAnggotaData.length === 0) {
    showNotification("⚠️ Tidak ada lokasi anggota untuk ditampilkan", "warning");
    return;
  }

  const filterDate = document.getElementById("filterDate")?.value;
  const dateText = filterDate 
    ? new Date(filterDate).toLocaleDateString('id-ID') 
    : 'Hari Ini';

  const mapHTML = `
    <div class="all-anggota-map-modal" 
         style="width: 90vw; max-width: 1200px; height: 80vh; display: flex; flex-direction: column; padding: 20px; overflow: hidden;">
      <h5><i class="bi bi-geo-alt-fill me-2"></i>Peta Lokasi Anggota Tim ${username}</h5>
      <p class="text-muted" style="flex-shrink: 0;">
        <i class="bi bi-calendar me-1"></i> Jadwal: ${dateText} |
        <i class="bi bi-person me-1"></i> ${allAnggotaData.length} anggota |
        <i class="bi bi-building me-1"></i> Tim: ${username}
      </p>
      
      <div id="allMapContainer" style="
        flex: 1 1 auto;
        width: 100%; 
        border-radius: 8px; 
        border: 1px solid #dee2e6; 
        margin: 15px 0;
        min-height: 300px;
      ">
        <div class="text-center py-5">
          <div class="spinner-border text-success" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3 text-muted">Memuat peta semua lokasi...</p>
        </div>
      </div>
      
      <div class="row mt-3 flex-shrink-0 flex-wrap">
        <!-- Legenda -->
        <div class="col-12 col-md-6 mb-2 mb-md-0" style="max-width: 300px;">
          <div class="card bg-light h-100" style="font-size: 0.85rem;">
            <div class="card-body p-2">
              <h6 class="card-title mb-2" style="font-size: 0.9rem;">
                <i class="bi bi-info-circle text-primary me-2"></i>
                Legenda Peta
              </h6>
              <div class="d-flex align-items-center mb-2">
                <div style="width: 16px; height: 16px; background-color: #007bff; border-radius: 50%; margin-right: 8px;"></div>
                <small>Anggota (${allAnggotaData.length})</small>
              </div>
              <div class="d-flex align-items-center">
                <div style="width: 16px; height: 16px; background-color: #28a745; border-radius: 50%; margin-right: 8px;"></div>
                <small>Tim Angkut (GPS saat ini)</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  showModal(`Peta ${allAnggotaData.length} Lokasi Anggota Tim ${username}`, mapHTML);

  setTimeout(() => {
    loadAllAnggotaMap();
  }, 300);
}


async function loadAllAnggotaMap() { 
  try {
    if (!window.L) await loadLeafletLibrary();

    const mapContainer = document.getElementById('allMapContainer');
    if (!mapContainer) return;

    // ===============================
    // Responsive modal adjustments
    // ===============================
    const modalEl = window.currentModalElement;
    if (modalEl) {
      const dialog = modalEl.querySelector('.modal-dialog');
      if (dialog) {
        dialog.style.maxWidth = '70vw';
        dialog.style.width = '70vw';
        dialog.style.height = '150vh';
        dialog.style.margin = '5vh auto';
      }
      const modalContent = modalEl.querySelector('.modal-content');
      if (modalContent) {
        modalContent.style.height = '70%';
        modalContent.style.display = 'flex';
        modalContent.style.flexDirection = 'column';
      }
    }

    // ===============================
    // Map container responsive
    // ===============================
    mapContainer.style.flex = '1 1 auto';
    mapContainer.style.width = '72%';
    mapContainer.style.height = '75%';
    mapContainer.style.minHeight = '300px';
    mapContainer.style.margin = '0';
    mapContainer.style.borderRadius = '8px';
    mapContainer.style.border = '1px solid #dee2e6';

    // ===============================
    // Initialize map
    // ===============================
    const bounds = L.latLngBounds([]);
    const map = L.map('allMapContainer');

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // ====== MARKER ANGGOTA ======
    allAnggotaData.forEach((anggota) => {
      const lat = parseFloat(anggota.latitude);
      const lng = parseFloat(anggota.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        const anggotaMarker = L.marker([lat, lng], {
          icon: L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [35, 55],
            iconAnchor: [17, 55],
            popupAnchor: [1, -45],
            shadowSize: [55, 55]
          })
        }).addTo(map);

        anggotaMarker.bindPopup(`
          <b>📍 ${anggota.nama_anggota || anggota.nama || 'Anggota'}</b><br>
          <small>${anggota.alamat || anggota.address || ''}</small><br>
          <small>Status: ${formatStatusText(anggota.status_pengangkutan || anggota.status)}</small>
        `);

        bounds.extend([lat, lng]);
      }
    });

    // ====== MARKER TIM ANGKUT ======
    try {
      const timAngkut = await getTimAngkutGPS(10000);
      const blueIcon = L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [35, 55],
        iconAnchor: [17, 55],
        popupAnchor: [1, -45],
        shadowSize: [55, 55],
        className: 'marker-blue'
      });

      L.marker([timAngkut.latitude, timAngkut.longitude], { icon: blueIcon })
        .addTo(map)
        .bindPopup(`<b>🚛 Lokasi Tim ${username}</b><br><small>GPS Real-time</small>`);

      bounds.extend([timAngkut.latitude, timAngkut.longitude]);
    } catch (err) {
      console.warn("GPS Tim Angkut tidak tersedia:", err);
    }

    // Fit bounds & invalidate size
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([-6.2, 106.8], 10);
    }

    setTimeout(() => map.invalidateSize(), 300);

    L.control.zoom({ position: 'topright' }).addTo(map);
    L.control.scale().addTo(map);

    window.recenterMap = function() {
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });
    };
    window.printMap = function() { window.print(); };

  } catch (err) {
    console.error("Error loading all anggota map:", err);
    const mapContainer = document.getElementById('allMapContainer');
    if (mapContainer) {
      mapContainer.innerHTML = `<div class="alert alert-danger m-3">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Gagal memuat peta: ${err.message}
      </div>`;
    }
  }
}



function renderDetailTable(detailList) {
  const container = document.getElementById("detailContainer");

  if (!detailList || detailList.length === 0) {
    container.innerHTML = `
      <div class="no-data">
        <i class="bi bi-calendar-x"></i>
        <h4>Tidak ada data pengangkutan</h4>
        <p class="text-muted">Tidak ada jadwal pengangkutan untuk tim Anda (${username}) pada tanggal yang dipilih.</p>
        <button onclick="resetFilter()" class="btn btn-outline-success mt-2">
          <i class="bi bi-arrow-clockwise"></i> Reset Filter
        </button>
      </div>
    `;
    return;
  }

  const headerHTML = `
  <div class="card border-light shadow-sm mb-3">
    <div class="card-body py-3">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h5 class="mb-0 text-success">
            <i class="bi bi-list-task me-2"></i>Jadwal Pengangkutan Tim ${username}
          </h5>
          <small class="text-muted">${detailList.length} data ditemukan</small>
        </div>
        <div class="text-end">
          <!-- Tombol Peta All Anggota -->
          <button onclick="showAllAnggotaMap()" 
                  class="btn btn-primary btn-sm me-2">
            <i class="bi bi-map me-1"></i> Lihat Peta Semua Lokasi
          </button>
          <div class="badge bg-light text-dark">
            <i class="bi bi-calendar me-1"></i>
            ${document.getElementById("filterDate").value || "Semua tanggal"}
          </div>
        </div>
      </div>
      
      <!-- Column Headers -->
      <div class="row mt-3 border-bottom pb-2 text-muted small fw-bold d-none d-md-flex">
        <div class="col-md-2">
          <i class="bi bi-person me-1"></i> Info Diri
        </div>
        <div class="col-md-2">
          <i class="bi bi-calendar-check me-1"></i> Jadwal
        </div>
        <div class="col-md-2">
          <i class="bi bi-calendar-plus me-1"></i> Dibuat
        </div>
        <div class="col-md-2">
          <i class="bi bi-flag me-1"></i> Status
        </div>
        <div class="col-md-2">
          <i class="bi bi-chat-text me-1"></i> Catatan
        </div>
        <div class="col-md-2">
          <i class="bi bi-gear me-1"></i> Aksi
        </div>
      </div>
    </div>
  </div>
`;

// Rows dengan grid yang selaras
const rowsHTML = detailList.map((d) => {
  // Ambil tanggalJadwal
  const jadwalDate = d.tanggalJadwal || d.tanggal_jadwal || d.tanggal || d.created_at;
  const formattedDate = formatJadwalDate(jadwalDate);
  const createdAt = formatJadwalDate(d.created_at);
  
  // Ambil status
  const status = d.status_pengangkutan || d.status || 'terjadwal';
  const statusClass = getStatusBadgeClass(status);
  const statusText = formatStatusText(status);
  
  // Ambil data anggota
  const anggotaId = d.idAnggota || d.anggotaId;
  const namaAnggota = d.nama_anggota || d.nama || 'Anggota';
  const hasLocation = d.latitude && d.longitude;
  const alamat = d.alamat || d.address || 'Alamat tidak tersedia';
  
  return `
    <div class="card border-light shadow-sm mb-2">
      <div class="card-body py-2">
        <!-- Desktop View (6 kolom) -->
        <div class="row align-items-center d-none d-md-flex">
          <!-- Kolom 1: Info Diri -->
          <div class="col-md-2">
            <div class="fw-bold">${namaAnggota}</div>
            <div class="mt-1">
              ${anggotaId ? `
                <button onclick="viewAnggotaDetail('${anggotaId}')" 
                        class="btn btn-sm btn-outline-secondary btn-xs">
                  <i class="bi bi-person"></i>
                </button>
              ` : ''}
            </div>
          </div>
          
          <!-- Kolom 2: Jadwal Pengangkutan -->
          <div class="col-md-2">
            <div class="text-muted small">
              <i class="bi bi-calendar-check me-1"></i>
              ${formattedDate}
            </div>
          </div>
          
          <!-- Kolom 3: Tanggal Dibuat -->
          <div class="col-md-2">
            <div class="text-muted small">
              <i class="bi bi-calendar-plus me-1"></i>
              ${createdAt || '-'}
            </div>
          </div>
          
          <!-- Kolom 4: Status -->
          <div class="col-md-2">
            <span class="badge ${statusClass}">
              ${statusText}
            </span>
          </div>
          
          <!-- Kolom 5: Catatan -->
          <div class="col-md-2">
            <div class="small text-truncate" title="${d.catatan || d.note || d.notes || ''}">
              ${d.catatan || d.note || d.notes || '-'}
            </div>
          </div>
          
          <!-- Kolom 6: Aksi -->
          <div class="col-md-2">
            <div class="d-flex gap-1 flex-wrap">
              ${status === 'terjadwal' ? `
                <button onclick="mulaiPengangkutan('${d.id}')" 
                        class="btn btn-success btn-sm btn-xs" title="Mulai">
                  <i class="bi bi-play-circle"></i>
                </button>
              ` : ''}

              ${status === 'dalam_proses' ? `
                <button onclick="selesaikanPengangkutan('${d.id}')" 
                        class="btn btn-primary btn-sm btn-xs" title="Selesai">
                  <i class="bi bi-check-circle"></i>
                </button>
              ` : ''}

              ${(status === 'terjadwal' || status === 'dalam_proses') ? `
                <button onclick="batalkanPengangkutan('${d.id}')" 
                        class="btn btn-danger btn-sm btn-xs" title="Batalkan">
                  <i class="bi bi-x-circle"></i>
                </button>
              ` : ''}

              ${status === 'selesai' ? `
                <button onclick="ubahStatusPengangkutan('${d.id}')" 
                        class="btn btn-warning btn-sm btn-xs" title="Ubah Status">
                  <i class="bi bi-arrow-repeat"></i>
                </button>
              ` : ''}
              
              <button onclick="editCatatan('${d.id}')" 
                      class="btn btn-info btn-sm btn-xs" title="Catatan">
                <i class="bi bi-pencil"></i>
              </button>
              
              <button onclick="viewDetailTim('${d.id}')" 
                      class="btn btn-secondary btn-sm btn-xs" title="Detail">
                <i class="bi bi-eye"></i>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Mobile View (card layout) -->
        <div class="d-block d-md-none">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <div class="fw-bold">${namaAnggota}</div>
              <div class="small text-muted">
                <i class="bi bi-calendar-check me-1"></i> ${formattedDate}
              </div>
            </div>
            <span class="badge ${statusClass}">
              ${statusText}
            </span>
          </div>
          
          <div class="small text-muted mb-2">
            <i class="bi bi-geo-alt me-1"></i>
            ${alamat.substring(0, 60)}${alamat.length > 60 ? '...' : ''}
          </div>
          
          <div class="small mb-2">
            <i class="bi bi-chat-text me-1"></i>
            ${d.catatan || d.note || d.notes || '-'}
          </div>
          
          <div class="d-flex flex-wrap gap-1">
            ${status === 'terjadwal' ? `
              <button onclick="mulaiPengangkutan('${d.id}')" 
                      class="btn btn-success btn-sm">
                🚚 Mulai
              </button>
            ` : ''}

            ${status === 'dalam_proses' ? `
              <button onclick="selesaikanPengangkutan('${d.id}')" 
                      class="btn btn-primary btn-sm">
                ✅ Selesai
              </button>
            ` : ''}

            ${(status === 'terjadwal' || status === 'dalam_proses') ? `
              <button onclick="batalkanPengangkutan('${d.id}')" 
                      class="btn btn-danger btn-sm">
                ❌ Batalkan
              </button>
            ` : ''}
            
            <button onclick="editCatatan('${d.id}')" 
                    class="btn btn-info btn-sm">
              📝 Catatan
            </button>
            
            <button onclick="viewDetailTim('${d.id}')" 
                    class="btn btn-secondary btn-sm">
              <i class="bi bi-eye"></i>
            </button>
            
            ${anggotaId ? `
              <button onclick="viewAnggotaDetail('${anggotaId}')" 
                      class="btn btn-outline-warning btn-sm">
                <i class="bi bi-person"></i>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}).join('');

  container.innerHTML = `
    <div class="detail-table">
      ${headerHTML}
      <div class="table-body">
        ${rowsHTML}
      </div>
      <div id="inlineDetailContainer" class="mt-3"></div>
    </div>
  `;

  // Expose functions ke window
  window.updateDetailStatus = updateDetailStatus;
  window.viewDetailTim = viewDetailTim;
  window.viewAnggotaDetail = viewAnggotaDetail;
  window.resetFilter = resetFilter;
}

// Fungsi helper untuk status badge class
function getStatusBadgeClass(status) {
  const statusMap = {
    'terjadwal': 'bg-warning text-dark',
    'dalam_proses': 'bg-info text-white',
    'selesai': 'bg-success text-white',
    'dibatalkan': 'bg-danger text-white'
  };
  return statusMap[status.toLowerCase()] || 'bg-secondary text-white';
}

async function ubahStatusPengangkutan(id) {
  try {
    // Ambil data detail
    const detail = await fetchAPI(`${API.detailAnggotaJadwal}${id}/`, {
      headers: getAuthHeaders(),
    });

    // Tampilkan form untuk mengubah status
    const formHTML = `
      <div id="validationMessageContainer"></div>
      
      <div class="alert alert-info">
        <div class="d-flex align-items-center">
          <i class="bi bi-info-circle-fill fs-4 me-3"></i>
          <div>
            <strong class="d-block">Ubah Status Pengangkutan</strong>
            <small class="text-muted">Mengubah status dari "${detail.status_pengangkutan}" ke status baru</small>
          </div>
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label">
          <strong>Status Baru</strong>
          <small class="text-muted">Pilih status yang sesuai</small>
        </label>
        <select id="statusBaru" class="form-select">
          <option value="terjadwal" ${detail.status_pengangkutan === 'terjadwal' ? 'selected' : ''}>
            Terjadwal
          </option>
          <option value="dalam_proses" ${detail.status_pengangkutan === 'dalam_proses' ? 'selected' : ''}>
            Dalam Proses
          </option>
          <option value="selesai" ${detail.status_pengangkutan === 'selesai' ? 'selected' : ''}>
            Selesai
          </option>
          <option value="dibatalkan" ${detail.status_pengangkutan === 'dibatalkan' ? 'selected' : ''}>
            Dibatalkan
          </option>
        </select>
      </div>

      <div class="mb-3">
        <label class="form-label">
          <strong>Alasan Perubahan</strong>
          <small class="text-muted">Wajib diisi untuk alasan perubahan status</small>
        </label>
        <textarea 
          id="alasanPerubahan" 
          class="form-control" 
          rows="4"
          placeholder="Ketikkan alasan mengubah status (contoh: salah tekan, ada perubahan jadwal, dll.)"
          required></textarea>
        <div class="invalid-feedback">
          Alasan perubahan wajib diisi minimal 10 karakter.
        </div>
      </div>
      
      <div class="card border-light bg-light">
        <div class="card-body p-3">
          <h6 class="card-title mb-2">
            <i class="bi bi-info-circle text-primary me-2"></i>
            Detail Saat Ini
          </h6>
          <div class="row small text-muted">
            <div class="col-md-6">
              <div><strong>ID:</strong> ${detail.id}</div>
              <div><strong>Anggota:</strong> ${detail.nama_anggota || detail.nama || 'N/A'}</div>
            </div>
            <div class="col-md-6">
              <div><strong>Status:</strong> ${detail.status_pengangkutan}</div>
              <div><strong>Tanggal:</strong> ${formatJadwalDate(detail.tanggal_jadwal || detail.tanggalJadwal)}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="alert alert-warning mt-3">
        <i class="bi bi-exclamation-triangle me-2"></i>
        <strong>Perhatian:</strong> Perubahan status akan tercatat dalam catatan.
      </div>
    `;

    let modalInstance; // Simpan reference ke modal

    showModal("Ubah Status Pengangkutan", formHTML, async () => {
      const validationContainer = document.querySelector('#validationMessageContainer');
      
      // Reset pesan validasi sebelumnya
      if (validationContainer) {
        validationContainer.innerHTML = '';
      }

      const statusBaru = document.getElementById("statusBaru")?.value;
      const alasan = document.getElementById("alasanPerubahan")?.value.trim() || '';
      const alasanInput = document.getElementById("alasanPerubahan");

      // Validasi
      if (!alasan || alasan.length < 10) {
        const statusLama = detail.status_pengangkutan;

        // 1️⃣ TIDAK ADA PERUBAHAN SAMA SEKALI
        if (statusBaru === statusLama && !alasan) {
          if (validationContainer) {
            validationContainer.innerHTML = `
              <div class="alert alert-warning fade show">
                <div class="d-flex align-items-center">
                  <i class="bi bi-info-circle-fill fs-4 me-3"></i>
                  <div>
                    <strong class="d-block">Tidak ada perubahan</strong>
                    <small class="text-muted">
                      Anda belum mengubah status dan belum mengisi alasan.
                    </small>
                  </div>
                </div>
              </div>
            `;
            validationContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return false;
        }

        // 2️⃣ STATUS SAMA TAPI ADA ALASAN
        if (statusBaru === statusLama) {
          if (validationContainer) {
            validationContainer.innerHTML = `
              <div class="alert alert-warning fade show">
                <div class="d-flex align-items-center">
                  <i class="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                  <div>
                    <strong class="d-block">Status tidak berubah</strong>
                    <small class="text-muted">
                      Pilih status yang berbeda atau klik Batal.
                    </small>
                  </div>
                </div>
              </div>
            `;
            validationContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return false;
        }

        // 3️⃣ STATUS BERUBAH TAPI ALASAN KURANG
        if (alasan.length < 10) {
          if (alasanInput) {
            alasanInput.classList.add('is-invalid');
            alasanInput.focus();
          }

          if (validationContainer) {
            validationContainer.innerHTML = `
              <div class="alert alert-danger fade show">
                <div class="d-flex align-items-center">
                  <i class="bi bi-x-circle-fill fs-4 me-3"></i>
                  <div>
                    <strong class="d-block">Alasan terlalu singkat</strong>
                    <small class="text-muted">
                      Minimal 10 karakter untuk alasan perubahan status.
                    </small>
                  </div>
                </div>
              </div>
            `;
            validationContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return false;
        }

        // ✅ LOLOS VALIDASI
        if (alasanInput) {
          alasanInput.classList.remove('is-invalid');
        }
      }

      // Validasi: cek apakah status sama dengan sebelumnya
      if (statusBaru === detail.status_pengangkutan) {
        if (validationContainer) {
          validationContainer.innerHTML = `
            <div class="alert alert-warning fade show">
              <div class="d-flex align-items-center">
                <i class="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                <div>
                  <strong class="d-block">Status tidak berubah!</strong>
                  <small class="text-muted">Status baru sama dengan status saat ini. Pilih status yang berbeda atau batalkan.</small>
                </div>
              </div>
            </div>
          `;
          validationContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
      }

      // Tampilkan loading - gunakan modal content yang ada
      const modalBody = document.querySelector('.modal-body') || document.querySelector('[style*="padding: 20px"]');
      if (modalBody) {
        const originalContent = modalBody.innerHTML;
        
        modalBody.innerHTML = `
          <div class="text-center py-5">
            <div class="spinner-border text-primary mb-3" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <h5>Mengubah status...</h5>
            <p class="text-muted">Mohon tunggu sebentar</p>
          </div>
        `;

        try {
          // Gabungkan catatan lama dengan catatan perubahan
          const timestamp = new Date().toLocaleString('id-ID');
          const catatanBaru = `🔄 [Perubahan Status] ${timestamp}:\n- Dari: ${detail.status_pengangkutan}\n- Ke: ${statusBaru}\n- Alasan: ${alasan}`;
          
          const catatanGabung = detail.catatan 
            ? `${detail.catatan}\n\n${catatanBaru}`
            : catatanBaru;

          await fetchAPI(`${API.detailAnggotaJadwal}${id}/`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              status_pengangkutan: statusBaru,
              catatan: catatanGabung
            })
          });

          alert(`Status telah diubah menjadi: ${statusBaru}`);

          // Tampilkan sukses
          modalBody.innerHTML = `
            <div class="text-center py-5">
              <div class="mb-3" style="font-size: 4rem; color: #28a745;">
                <i class="bi bi-check-circle-fill"></i>
              </div>
              <h4 class="text-success">✅ Status Diubah!</h4>
              <p class="text-muted">Status telah diubah menjadi "${statusBaru}"</p>
              <div class="alert alert-success mt-4">
                <i class="bi bi-info-circle me-2"></i>
                Halaman akan diperbarui...
              </div>
            </div>
          `;

          // Reload data setelah 1.5 detik
          setTimeout(() => {
            loadDetail();
            // Tutup modal secara manual jika modalInstance ada
            if (modalInstance && modalInstance.close) {
              modalInstance.close();
            }
          }, 1500);

          return true; // Tutup modal

        } catch (error) {
          console.error("Error changing status:", error);
          
          // Tampilkan error
          modalBody.innerHTML = originalContent;
          
          if (validationContainer) {
            validationContainer.innerHTML = `
              <div class="alert alert-danger fade show">
                <div class="d-flex align-items-center">
                  <i class="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                  <div>
                    <strong class="d-block">Gagal mengubah status!</strong>
                    <small class="text-muted">${error.message}</small>
                  </div>
                </div>
              </div>
            `;
          }
          
          return false; // Jangan tutup modal
        }
      }
      
      return false; // Fallback
    }, 
    'Ya, Ubah Status',
    'Batal');

    // Simpan reference ke modal jika diperlukan
    const modalElements = document.querySelectorAll('[style*="position: fixed; top: 0; left: 0; width: 100%"]');
    if (modalElements.length > 0) {
      modalInstance = {
        element: modalElements[modalElements.length - 1],
        close: () => {
          const modal = modalElements[modalElements.length - 1];
          if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
          }
        }
      };
    }

  } catch (error) {
    console.error("Error loading detail:", error);
    
    // Gunakan showNotification yang sudah ada
    if (typeof showNotification === 'function') {
      showNotification(`❌ Gagal memuat data: ${error.message}`, "error");
    } else {
      // Fallback jika showNotification tidak tersedia
      alert(`❌ Gagal memuat data: ${error.message}`);
    }
  }
}

async function mulaiPengangkutan(id) {
  showModal(
    "Mulai Pengangkutan",
    `<p>Yakin ingin <strong>memulai pengangkutan</strong> ini?</p>`,
    async () => {
      await fetchAPI(`${API.detailAnggotaJadwal}${id}/`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status_pengangkutan: "dalam_proses"
        })
      });

      showNotification("🚚 Pengangkutan dimulai", "success");
      alert("🚚 Pengangkutan dimulai");
      loadDetail();
    }
  );
}

async function selesaikanPengangkutan(id) {
  const detail = await fetchAPI(`${API.detailAnggotaJadwal}${id}/`, {
    headers: getAuthHeaders(),
  });

  showModal(
    "Selesaikan Pengangkutan",
    `
      <div class="alert alert-warning">
        ⚠️ Pastikan pengangkutan sudah selesai
      </div>

      <label class="form-label">Catatan Pengangkutan</label>
      <textarea id="catatanSelesai" class="form-control"
        placeholder="Contoh: Sampah sudah diangkut seluruhnya"></textarea>
    `,
    async () => {
      const catatanBaru = document.getElementById("catatanSelesai").value;
      const catatanGabung = detail.catatan
        ? detail.catatan + "\n- " + catatanBaru
        : catatanBaru;

      await fetchAPI(`${API.detailAnggotaJadwal}${id}/`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status_pengangkutan: "selesai",
          catatan: catatanGabung
        })
      });

      showNotification("✅ Pengangkutan selesai", "success");
      alert("✅ Pengangkutan selesai");
      loadDetail();
    }
  );
}

async function batalkanPengangkutan(id) {
  showModal(
    "Batalkan Pengangkutan",
    `
      <div class="alert alert-danger">
        ❌ Pengangkutan akan dibatalkan
      </div>

      <label class="form-label">Alasan (Wajib)</label>
      <textarea id="catatanBatal" class="form-control"
        placeholder="Contoh: Lokasi tidak dapat diakses" required></textarea>
    `,
    async () => {
      const alasan = document.getElementById("catatanBatal").value;
      if (!alasan) {
        showNotification("⚠️ Alasan wajib diisi", "warning");
        return false;
      }

      await fetchAPI(`${API.detailAnggotaJadwal}${id}/`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status_pengangkutan: "dibatalkan",
          catatan: alasan
        })
      });

      showNotification("❌ Pengangkutan dibatalkan", "success");
      alert("❌ Pengangkutan dibatalkan");
      loadDetail();
    }
  );
}

async function editCatatan(id) {
  try {
    const detail = await fetchAPI(`${API.detailAnggotaJadwal}${id}/`, {
      headers: getAuthHeaders(),
    });

    let isModalValid = false; // Flag untuk kontrol modal

    showModal(
      "Tambah Catatan",
      `
        <div class="mb-3">
          <label class="form-label">
            Catatan
            <small class="text-muted">(akan ditambahkan ke catatan sebelumnya)</small>
          </label>
          <textarea 
            id="editCatatanText" 
            class="form-control" 
            rows="4"
            placeholder="Tulis catatan tambahan..."
            autofocus></textarea>
          <div id="catatanError" class="invalid-feedback" style="display: none;">
            Catatan tidak boleh kosong
          </div>
        </div>
        <div class="alert alert-info">
          <i class="bi bi-info-circle me-1"></i>
          Catatan sebelumnya akan ditambahkan dengan format:
          <code>Catatan Lama + [Update: Catatan Baru]</code>
        </div>
      `,
      () => {
        // Callback saat tombol Simpan diklik
        const catatanBaru = document
          .getElementById("editCatatanText")
          .value
          .trim();

        const errorDiv = document.getElementById("catatanError");
        const textarea = document.getElementById("editCatatanText");

        // Reset error state
        if (errorDiv) errorDiv.style.display = 'none';
        if (textarea) textarea.classList.remove('is-invalid');

        // Validasi
        if (!catatanBaru) {
          if (errorDiv) errorDiv.style.display = 'block';
          if (textarea) {
            textarea.classList.add('is-invalid');
            textarea.focus();
          }
          showNotification("Catatan tidak boleh kosong", "warning");
          return false; // ⬅️ RETURN FALSE agar modal TETAP TERBUKA
        }

        // Jika valid, set flag dan return true
        isModalValid = true;
        return true; // ⬅️ RETURN TRUE agar modal bisa ditutup
      },
      async () => {
        // Callback kedua: setelah modal ditutup dengan true (Save)
        if (!isModalValid) return; // Jangan eksekusi jika tidak valid

        const catatanBaru = document
          .getElementById("editCatatanText")
          .value
          .trim();

        // Validasi ulang (safety check)
        if (!catatanBaru) {
          showNotification("⚠️ Catatan tidak boleh kosong", "warning");
          return;
        }

        const catatanGabungan = detail.catatan
          ? `${detail.catatan}\n\n📝 Update:\n- ${catatanBaru}`
          : `Update Tim Pengangkut:\n- ${catatanBaru}`;

        try {
          await fetchAPI(`${API.detailAnggotaJadwal}${id}/`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ catatan: catatanGabungan }),
          });

          showNotification("📝 Catatan berhasil ditambahkan", "success");
          alert("📝 Catatan berhasil ditambahkan", "success");
          loadDetail();

        } catch (error) {
          console.error("Update error:", error);
          showNotification("❌ Gagal menyimpan catatan", "error");
        }
      }
    );

  } catch (error) {
    console.error("Load error:", error);
    showNotification("❌ Gagal memuat data", "error");
  }
}

function formatJadwalDate(dateString) {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    console.warn("Error formatting date:", dateString, error);
    return dateString;
  }
}

function formatStatusText(status) {
  if (!status) return 'Tidak Diketahui';
  
  const statusMap = {
    'terjadwal': 'Terjadwal',
    'dalam_proses': 'Dalam Proses',
    'selesai': 'Selesai',
    'dibatalkan': 'Dibatalkan'
  };
  
  return statusMap[status.toLowerCase()] || status;
}

async function updateDetailStatus(detailId) {
  try {
    const detail = await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
      headers: getAuthHeaders(),
    });

    const jadwalDate = detail.tanggalJadwal || detail.tanggal_jadwal || detail.tanggal;
    const formattedJadwal = formatJadwalDate(jadwalDate);

    const formHTML = `
      <div class="update-status-form">
        <div class="alert alert-info">
          <i class="bi bi-info-circle me-2"></i>
          <strong>${detail.nama_anggota || detail.nama || 'Anggota'}</strong><br>
          Jadwal: ${formattedJadwal}
        </div>
        
        <div class="mb-3">
          <label class="form-label">Status Pengangkutan</label>
          <select id="status" class="form-select">
            <option value="terjadwal" ${(detail.status_pengangkutan || detail.status) === 'terjadwal' ? 'selected' : ''}>
              Terjadwal
            </option>
            <option value="dalam_proses" ${(detail.status_pengangkutan || detail.status) === 'dalam_proses' ? 'selected' : ''}>
              Dalam Proses
            </option>
            <option value="selesai" ${(detail.status_pengangkutan || detail.status) === 'selesai' ? 'selected' : ''}>
              Selesai
            </option>
            <option value="dibatalkan" ${(detail.status_pengangkutan || detail.status) === 'dibatalkan' ? 'selected' : ''}>
              Dibatalkan
            </option>
          </select>
        </div>
        
        <div class="mb-3">
          <label class="form-label">Catatan</label>
          <textarea id="catatan" class="form-control" rows="3" 
                    placeholder="Tambahkan catatan...">${detail.catatan || detail.note || ''}</textarea>
        </div>
        
        <div class="mb-3">
          <label class="form-label">Tanggal Jadwal (Opsional)</label>
          <input type="date" id="tanggalJadwal" class="form-control" 
                 value="${jadwalDate ? new Date(jadwalDate).toISOString().split('T')[0] : ''}">
        </div>
      </div>
    `;

    showModal("Update Status Pengangkutan", formHTML, async () => {
      const updatedData = {
        status_pengangkutan: document.getElementById("status").value,
        catatan: document.getElementById("catatan").value,
      };

      // Tambahkan tanggalJadwal jika diisi
      const tanggalJadwal = document.getElementById("tanggalJadwal").value;
      if (tanggalJadwal) {
        updatedData.tanggalJadwal = tanggalJadwal;
      }

      try {
        await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify(updatedData),
        });

        showNotification("✅ Status berhasil diupdate!", "success");
        
        setTimeout(() => {
          loadDetail();
        }, 500);
      } catch (error) {
        console.error("Error updating status:", error);
        showNotification(`❌ Gagal update: ${error.message}`, "error");
      }
    });
  } catch (error) {
    console.error("Error loading detail:", error);
    showNotification(`❌ Gagal memuat data: ${error.message}`, "error");
  }
}

async function viewDetailTim(detailId) {
  try {
    const detail = await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
      headers: getAuthHeaders(),
    });

    console.log("Detail data:", detail);

    // Format tanggal
    const jadwalDate = detail.idJadwal?.tanggal || detail.tanggal_jadwal || detail.tanggal;
    const formattedJadwal = formatJadwalDate(jadwalDate);
    const createdDate = formatJadwalDate(detail.created_at);
    const updatedDate = formatJadwalDate(detail.updated_at);

    const status = detail.status_pengangkutan || detail.status || 'terjadwal';
    const statusClass = `status-${status.toLowerCase().replace(' ', '_')}`;
    const statusText = formatStatusText(status);

    // Ambil data anggota dari relasi idAnggota
    const anggota = detail.idAnggota || {};
    const hasLocation = anggota.latitude && anggota.longitude;
    const anggotaId = anggota.idAnggota || detail.idAnggota?.idAnggota;

    const detailHTML = `
      <div class="detail-modal-content">
        <div class="card mb-3 border-success">
          <div class="card-header bg-success bg-opacity-10 d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0 text-success">
              <i class="bi bi-truck me-2"></i>Detail Pengangkutan
            </h5>
            <span class="badge ${getStatusBadgeColor(status)}">${statusText}</span>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <table class="table table-borderless">
                  <tr>
                    <td width="40%"><strong>Anggota</strong></td>
                    <td>
                      ${anggota.nama || detail.nama_anggota || 'N/A'}
                      ${anggotaId ? `
                        <button onclick="viewAnggotaDetail('${anggotaId}')" 
                                class="btn btn-sm btn-outline-success ms-2">
                          <i class="bi bi-person"></i> Profil
                        </button>
                      ` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td width="40%"><strong>Tanggal Jadwal</strong></td>
                    <td>
                      <i class="bi bi-calendar-check text-success me-1"></i>
                      ${formattedJadwal}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Nama Tim</strong></td>
                    <td>
                      <span class="badge bg-info">${detail.nama_tim || username || 'N/A'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Catatan</strong></td>
                    <td>
                      <div style="max-height: 100px; overflow-y: auto; padding: 5px; background: #f8f9fa; border-radius: 4px;">
                        ${detail.catatan ? detail.catatan.replace(/\n/g, '<br>') : '<span class="text-muted">Tidak ada catatan</span>'}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>ID Anggota</strong></td>
                    <td><code>${detail.idAnggota || '-'}</code></td>
                  </tr>
                  <tr>
                    <td><strong>ID Detail</strong></td>
                    <td><code>${detail.id || '-'}</code></td>
                  </tr>
                </table>
              </div>
            </div>
            
            <!-- Info tambahan -->
            <div class="row mt-3">
              <div class="col-12">
                <div class="alert alert-light">
                  <div class="row">
                    <div class="col-md-6 text-end">
                      <small class="text-muted">
                        <i class="bi bi-clock-history me-1"></i>
                        Dibuat: ${createdDate}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tombol aksi -->
            <div class="row mt-3">
              <div class="col-12 text-center">                
                ${anggota.noWA ? `
                  <a href="https://wa.me/${anggota.noWA.replace(/^0/, '62')}" 
                     target="_blank" 
                     class="btn btn-success me-2">
                    <i class="bi bi-whatsapp me-1"></i>WhatsApp
                  </a>
                ` : ''}
                
                ${anggotaId ? `
                  <button onclick="viewAnggotaDetail('${anggotaId}')" 
                          class="btn btn-outline-success">
                    <i class="bi bi-person me-1"></i>Profil Lengkap
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    showModal("Detail Pengangkutan", detailHTML);
    
    // Expose fungsi ke window
    window.copyToClipboard = function(text) {
      navigator.clipboard.writeText(text)
        .then(() => showNotification('✓ Koordinat disalin ke clipboard', 'success'))
        .catch(err => console.error('Gagal menyalin:', err));
    };

    if (anggotaId) {
      window.viewAnggotaDetail = function(id) {
        // Fungsi untuk melihat detail anggota
        const url = `${API.anggota}${id}/`;
        fetchAPI(url, { headers: getAuthHeaders() })
          .then(anggotaData => {
            const anggotaHTML = `
              <div class="card">
                <div class="card-header bg-success text-white">
                  <h5 class="mb-0">Profil Anggota</h5>
                </div>
                <div class="card-body">
                  <table class="table table-borderless">
                    <tr><td><strong>Nama</strong></td><td>${anggotaData.nama}</td></tr>
                    <tr><td><strong>ID Anggota</strong></td><td>${anggotaData.idAnggota}</td></tr>
                    <tr><td><strong>Alamat</strong></td><td>${anggotaData.alamat}</td></tr>
                    <tr><td><strong>No. WhatsApp</strong></td><td>${anggotaData.noWA || '-'}</td></tr>
                    <tr><td><strong>Status</strong></td><td>${anggotaData.status}</td></tr>
                    <tr><td><strong>Jenis Sampah</strong></td><td>${anggotaData.jenisSampah}</td></tr>
                    <tr><td><strong>Tanggal Aktif</strong></td><td>${formatJadwalDate(anggotaData.tanggalStart)} - ${formatJadwalDate(anggotaData.tanggalEnd)}</td></tr>
                  </table>
                </div>
              </div>
            `;
            showModal("Detail Anggota", anggotaHTML);
          })
          .catch(error => {
            showNotification(`❌ Gagal memuat profil anggota: ${error.message}`, "error");
          });
      };
    }

  } catch (error) {
    console.error("Error loading detail:", error);
    showNotification(`❌ Gagal memuat detail: ${error.message}`, "error");
  }
}

// Helper functions
function getStatusBadgeColor(status) {
  switch(status) {
    case 'selesai': return 'bg-success';
    case 'dalam_proses': return 'bg-warning text-dark';
    case 'dibatalkan': return 'bg-danger';
    case 'terjadwal': return 'bg-info';
    default: return 'bg-secondary';
  }
}

async function viewAnggotaDetail(anggotaId) {
  const container = document.getElementById("inlineDetailContainer");

  try {
    const anggota = await fetchAPI(`${API.anggota}${anggotaId}/`, {
      headers: getAuthHeaders(),
    });

    container.innerHTML = `
      <div class="card border-info shadow-sm">
        <div class="card-header bg-info bg-opacity-10 d-flex justify-content-between align-items-center">
          <h5 class="mb-0 text-info">
            <i class="bi bi-person-circle me-2"></i>Detail Anggota
          </h5>
          <button class="btn btn-sm btn-outline-secondary" onclick="closeInlineDetail()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <table class="table table-borderless">
                <tr>
                  <td width="40%"><strong>Nama</strong></td>
                  <td>${anggota.nama || "-"}</td>
                </tr>
                <tr>
                  <td><strong>No. WhatsApp</strong></td>
                  <td>${anggota.noWA || "-"}</td>
                </tr>
                <tr>
                  <td><strong>Alamat</strong></td>
                  <td>${anggota.alamat || "-"}</td>
                </tr>
              </table>
            </div>

            <div class="col-md-6">
              <table class="table table-borderless">
                <tr>
                  <td><strong>Status</strong></td>
                  <td>
                    <span class="badge ${anggota.status === "aktif" ? "bg-success" : "bg-danger"}">
                      ${anggota.status || "-"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td><strong>Jenis Sampah</strong></td>
                  <td>${anggota.jenisSampah || "-"}</td>
                </tr>
                <tr>
                  <td><strong>Periode</strong></td>
                  <td>${anggota.tanggalStart || "-"} s/d ${anggota.tanggalEnd || "-"}</td>
                </tr>
              </table>
            </div>
          </div>

          ${
            anggota.latitude && anggota.longitude
              ? `
            <hr>
            <h6><i class="bi bi-geo-alt me-2"></i>Lokasi Anggota</h6>
            <div class="d-flex gap-2 flex-wrap">
              <button
                onclick="showLocationMap(${anggota.latitude}, ${anggota.longitude}, '${(anggota.nama || "").replace(/'/g, "\\'")}', '${(anggota.alamat || "").replace(/'/g, "\\'")}')"
                class="btn btn-sm btn-outline-success">
                <i class="bi bi-map"></i> Peta & Rute
              </button>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;

    // Scroll ke detail
    container.scrollIntoView({ behavior: "smooth", block: "start" });

  } catch (error) {
    console.error("Error loading anggota detail:", error);
    showNotification(`❌ Gagal memuat detail anggota`, "error");
  }
}


// Fungsi untuk mengambil semua data anggota dengan lokasi
async function fetchAllAnggotaWithLocation() {
  try {
    const semuaAnggota = await fetchAPI(API.anggota, {
      headers: getAuthHeaders(),
    });
    
    // Filter hanya yang punya lokasi
    const anggotaDenganLokasi = semuaAnggota.filter(anggota => 
      anggota.latitude && anggota.longitude
    );
    
    console.log("📊 Semua anggota dengan lokasi:", anggotaDenganLokasi.length);
    return anggotaDenganLokasi;
  } catch (error) {
    console.error("Error fetching semua anggota:", error);
    return [];
  }
}

function showLocationMap(latitude, longitude, title = "", description = "") {
    showInteractiveRouteMap(latitude, longitude, title, description);
}

// Fungsi untuk memuat peta interaktif dengan Leaflet
async function loadInteractiveMap(latitude, longitude, title, description) {
  try {
    // ⬅️ WAJIB TUNGGU LEAFLET
    if (!window.L) {
      await loadLeafletLibrary();
    }

    const mapContainer = document.getElementById('mapContainer');
    if (!mapContainer) return;

    const map = L.map('mapContainer').setView([latitude, longitude], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // =========================
    // MARKER LAPORAN / ANGGOTA
    // =========================
    const laporanMarker = L.marker([latitude, longitude]).addTo(map);
    laporanMarker.bindPopup(`<b>${title || 'Lokasi Laporan'}</b>`);

    // =========================
    // ICON BIRU TIM ANGKUT
    // =========================
    const blueMarkerIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
      className: 'marker-blue'
    });

    // =========================
    // GPS TIM ANGKUT
    // =========================
    try {
      const timAngkut = await getTimAngkutGPS(30000);

      const timMarker = L.marker(
        [timAngkut.latitude, timAngkut.longitude],
        { icon: blueMarkerIcon }
      ).addTo(map);

      timMarker.bindPopup(`
        <b>🚛 Lokasi Tim ${username}</b><br>
        ${timAngkut.latitude.toFixed(6)}, ${timAngkut.longitude.toFixed(6)}
      `);

      // garis rute
      L.polyline(
        [
          [latitude, longitude],
          [timAngkut.latitude, timAngkut.longitude]
        ],
        { dashArray: '5,5' }
      ).addTo(map);

    } catch (gpsErr) {
      console.warn("GPS Tim Angkut tidak tersedia", gpsErr);
    }

    L.control.scale().addTo(map);

  } catch (err) {
    console.error("Map error:", err);
  }
}

// Fungsi untuk memuat library Leaflet
async function loadLeafletLibrary() {
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
    const scriptId = 'leaflet-interactive-map';
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

/**
 * Ambil lokasi GPS Tim Angkut (robust & anti-timeout)
 * @returns Promise<{ latitude, longitude, accuracy, isFallback, source }>
 */
function getTimAngkutGPS() {
  const DEFAULT_LOCATION = {
    latitude: -6.2088,   // Jakarta (fallback aman)
    longitude: 106.8456
  };

  // Helper request GPS
  const requestGPS = (options, sourceLabel) =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ pos, sourceLabel }),
        (err) => reject(err),
        options
      );
    });

  return new Promise(async (resolve) => {
    // ❌ Browser tidak support
    if (!navigator.geolocation) {
      resolve({
        ...DEFAULT_LOCATION,
        isFallback: true,
        source: "No Geolocation Support",
        message: "Browser tidak mendukung GPS"
      });
      return;
    }

    try {
      // 1️⃣ Coba HIGH accuracy (GPS real)
      const { pos } = await requestGPS(
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        },
        "High Accuracy GPS"
      );

      // Validasi koordinat
      if (
        !pos.coords ||
        typeof pos.coords.latitude !== "number" ||
        typeof pos.coords.longitude !== "number" ||
        isNaN(pos.coords.latitude) ||
        isNaN(pos.coords.longitude)
      ) {
        throw new Error("Koordinat GPS tidak valid");
      }

      // Validasi range koordinat
      if (
        Math.abs(pos.coords.latitude) > 90 ||
        Math.abs(pos.coords.longitude) > 180
      ) {
        throw new Error("Koordinat GPS di luar range");
      }

      // Validasi akurasi (opsional tapi penting)
      if (pos.coords.accuracy && pos.coords.accuracy > 1000) {
        console.warn("⚠️ Akurasi GPS rendah:", pos.coords.accuracy, "m");
      }

      resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        timestamp: pos.timestamp,
        isFallback: false,
        source: "High Accuracy GPS"
      });
    } catch (highError) {
      console.warn("⚠️ High accuracy GPS gagal:", highError.message);

      try {
        // 2️⃣ Fallback ke LOW accuracy (WiFi / IP)
        const { pos } = await requestGPS(
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000
          },
          "Low Accuracy GPS"
        );

        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          isFallback: false,
          source: "Low Accuracy (WiFi/IP)"
        });
      } catch (lowError) {
        console.warn("❌ Semua metode GPS gagal:", lowError.message);

        // 3️⃣ Fallback terakhir (default)
        resolve({
          ...DEFAULT_LOCATION,
          isFallback: true,
          source: "Hardcoded Fallback",
          message: lowError.message || "Gagal mendapatkan lokasi GPS"
        });
      }
    }
  });
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

// Fungsi ini sudah ada di kode Anda:
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resetFilter() {
  // Reset date ke hari ini
  const today = getLocalDateString();
  console.log("jajajajaaa", today);
  document.getElementById("filterDate").value = today;
  
  // Reset status filter
  document.getElementById("filterStatus").value = "";
  
  // Reload data
  loadDetail();
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = "info") {
  const existingNotification = document.querySelector(".custom-notification");
  if (existingNotification) {
    existingNotification.remove();
  }

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
    animation: slideIn 0.3s ease;
    max-width: 300px;
    display: flex;
    align-items: center;
    gap: 10px;
  `;

  // Set warna berdasarkan type
  if (type === "success") {
    notification.style.backgroundColor = "#28a745";
  } else if (type === "error") {
    notification.style.backgroundColor = "#dc3545";
  } else if (type === "warning") {
    notification.style.backgroundColor = "#ffc107";
    notification.style.color = "#212529";
  } else {
    notification.style.backgroundColor = "#17a2b8";
  }

  // Tambahkan icon
  const icon =
    type === "success"
      ? "✅"
      : type === "error"
      ? "❌"
      : type === "warning"
      ? "⚠️"
      : "ℹ️";

  notification.innerHTML = `
    <span style="font-size: 16px;">${icon}</span>
    <span>${message}</span>
  `;

  document.body.appendChild(notification);

  // Hapus setelah 3 detik
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
}

// Tambahkan CSS untuk animasi notifikasi
if (!document.querySelector("#notification-styles")) {
  const style = document.createElement("style");
  style.id = "notification-styles";
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Expose fungsi ke window
window.updateDetailStatus = updateDetailStatus;
window.viewDetailTim = viewDetailTim;
window.viewAnggotaDetail = viewAnggotaDetail;
window.showLocationMap = showLocationMap;
window.copyToClipboard = copyToClipboard;
window.resetFilter = resetFilter;
window.mulaiPengangkutan = mulaiPengangkutan;
window.selesaikanPengangkutan = selesaikanPengangkutan;
window.batalkanPengangkutan = batalkanPengangkutan;
window.editCatatan = editCatatan;
window.ubahStatusPengangkutan = ubahStatusPengangkutan;
window.showAllAnggotaMap = showAllAnggotaMap;
window.loadAllAnggotaMap = loadAllAnggotaMap;