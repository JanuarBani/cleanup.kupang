import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showModal } from "../../utils/modal.js";

export async function detailTimPage() {
  const mainContent = document.getElementById("mainContent");
  mainContent.innerHTML = `
    <div class="detail-tim-container">
      <div class="header-section">
        <h2><i class="bi bi-truck"></i> Detail Pengangkutan Anggota</h2>
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
      }
    </style>
  `;

  // Set default filter date ke hari ini
  const today = new Date().toISOString().split("T")[0];
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
    const detail = await fetchAPI(API.detailAnggotaJadwal, {
      headers: getAuthHeaders(),
    });

    console.log("Data pengangkutan:", detail);
    
    // Filter berdasarkan tanggalJadwal dan status
    const filteredDetail = detail.filter((d) => {
      // Filter berdasarkan status
      const matchStatus = !filterStatus || 
        (d.status_pengangkutan || d.status) === filterStatus;
      
      // Filter berdasarkan tanggalJadwal
      let matchDate = true;
      if (filterDate) {
        // Gunakan tanggalJadwal jika ada
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
      
      return matchStatus && matchDate;
    });

    console.log("Filtered data:", filteredDetail);
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

function renderDetailTable(detailList) {
  const container = document.getElementById("detailContainer");

  if (!detailList || detailList.length === 0) {
    container.innerHTML = `
      <div class="no-data">
        <i class="bi bi-calendar-x"></i>
        <h4>Tidak ada data pengangkutan</h4>
        <p class="text-muted">Tidak ada jadwal pengangkutan untuk tanggal yang dipilih.</p>
        <button onclick="resetFilter()" class="btn btn-outline-success mt-2">
          <i class="bi bi-arrow-clockwise"></i> Reset Filter
        </button>
      </div>
    `;
    return;
  }

  // Header untuk mobile view
  const headerHTML = `
    <div class="table-header">
      <div>
        <h5 class="mb-0"><i class="bi bi-list-task me-2"></i>Jadwal Pengangkutan</h5>
        <small>${detailList.length} data ditemukan</small>
      </div>
      <div class="text-end">
        <small>${document.getElementById("filterDate").value || "Semua tanggal"}</small>
      </div>
    </div>
  `;

  // Rows
  const rowsHTML = detailList.map((d) => {
    // Ambil tanggalJadwal
    const jadwalDate = d.tanggalJadwal || d.tanggal_jadwal || d.tanggal || d.created_at;
    const formattedDate = formatJadwalDate(jadwalDate);
    
    // Ambil status
    const status = d.status_pengangkutan || d.status || 'terjadwal';
    const statusClass = `status-${status.toLowerCase().replace(' ', '_')}`;
    const statusText = formatStatusText(status);
    
    // Ambil data anggota untuk tombol
    const anggotaId = d.idAnggota || d.anggotaId;
    const namaAnggota = d.nama_anggota || d.nama || 'Anggota';
    const hasLocation = d.latitude && d.longitude;
    
    return `
      <div class="detail-row">
        <div class="anggota-info">
          <div class="anggota-name">${namaAnggota}</div>
          <div class="anggota-wa">
            <i class="bi bi-whatsapp text-success"></i>
            ${d.noWA || d.no_wa || '-'}
          </div>
          <div class="anggota-actions">
            ${anggotaId ? `
              <button onclick="viewAnggotaDetail('${anggotaId}')" 
                      class="anggota-action-btn member" title="Lihat Detail Anggota">
                <i class="bi bi-person"></i> Anggota
              </button>
            ` : ''}
            
            ${hasLocation ? `
              <button onclick="openAnggotaMap(${d.latitude}, ${d.longitude}, '${namaAnggota.replace(/'/g, "\\'")}')" 
                      class="anggota-action-btn map" title="Lihat Peta">
                <i class="bi bi-map"></i> Peta
              </button>
            ` : ''}
          </div>
        </div>
        
        <div class="jadwal-date">
          <i class="bi bi-calendar-check"></i>
          ${formattedDate}
        </div>
        
        <div class="address-text">
          ${(d.alamat || 'Alamat tidak tersedia').substring(0, 60)}
          ${d.alamat && d.alamat.length > 60 ? '...' : ''}
        </div>
        
        <div>
          <span class="status-badge ${statusClass}">
            ${statusText}
          </span>
        </div>
        
        <div class="catatan-text">
          ${d.catatan || d.note || d.notes || '-'}
        </div>
        
        <div class="action-buttons">
          <button onclick="updateDetailStatus('${d.id}')" 
                  class="action-btn update" title="Ubah Status">
            <i class="bi bi-pencil"></i> Ubah
          </button>
          <button onclick="viewDetail('${d.id}')" 
                  class="action-btn view" title="Lihat Detail Lengkap">
            <i class="bi bi-eye"></i> Detail
          </button>
          ${hasLocation ? `
            <button onclick="openAnggotaMap(${d.latitude}, ${d.longitude}, '${namaAnggota.replace(/'/g, "\\'")}')" 
                    class="action-btn location" title="Buka di Peta">
              <i class="bi bi-geo-alt"></i> Lokasi
            </button>
          ` : ''}
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
    </div>
  `;

  // Expose functions ke window
  window.updateDetailStatus = updateDetailStatus;
  window.viewDetail = viewDetail;
  window.viewAnggotaDetail = viewAnggotaDetail;
  window.openAnggotaMap = openAnggotaMap;
  window.resetFilter = resetFilter;
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

async function viewDetail(detailId) {
  try {
    const detail = await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
      headers: getAuthHeaders(),
    });

    // Format tanggal
    const jadwalDate = detail.tanggalJadwal || detail.tanggal_jadwal || detail.tanggal;
    const formattedJadwal = formatJadwalDate(jadwalDate);
    const createdDate = formatJadwalDate(detail.created_at);
    const updatedDate = formatJadwalDate(detail.updated_at);

    const status = detail.status_pengangkutan || detail.status || 'terjadwal';
    const statusClass = `status-${status.toLowerCase().replace(' ', '_')}`;
    const statusText = formatStatusText(status);

    const hasLocation = detail.latitude && detail.longitude;
    const anggotaId = detail.idAnggota || detail.anggotaId;

    const detailHTML = `
      <div class="detail-modal-content">
        <div class="card mb-3 border-success">
          <div class="card-header bg-success bg-opacity-10 d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0 text-success">
              <i class="bi bi-truck me-2"></i>Detail Pengangkutan
            </h5>
            <span class="status-badge ${statusClass}">${statusText}</span>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <table class="table table-borderless">
                  <tr>
                    <td width="40%"><strong>Anggota</strong></td>
                    <td>
                      ${detail.nama_anggota || detail.nama || 'N/A'}
                      ${anggotaId ? `
                        <button onclick="viewAnggotaDetail('${anggotaId}')" 
                                class="btn btn-sm btn-outline-success ms-2">
                          <i class="bi bi-person"></i> Profil
                        </button>
                      ` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>No. WhatsApp</strong></td>
                    <td>
                      <i class="bi bi-whatsapp text-success me-1"></i>
                      ${detail.noWA || detail.no_wa || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Alamat</strong></td>
                    <td>${detail.alamat || '-'}</td>
                  </tr>
                  <tr>
                    <td><strong>Koordinat</strong></td>
                    <td>
                      ${hasLocation ? `
                        <div>
                          ${detail.latitude}, ${detail.longitude}
                          <div class="coordinate-actions">
                            <button onclick="openAnggotaMap(${detail.latitude}, ${detail.longitude}, '${(detail.nama_anggota || '').replace(/'/g, "\\'")}')" 
                                    class="btn btn-sm btn-outline-primary">
                              <i class="bi bi-map"></i> Google Maps
                            </button>
                            <button onclick="showLocationMap(${detail.latitude}, ${detail.longitude}, '${(detail.nama_anggota || '').replace(/'/g, "\\'")}', '${(detail.alamat || '').replace(/'/g, "\\'")}')" 
                                    class="btn btn-sm btn-outline-info">
                              <i class="bi bi-geo-alt"></i> Peta Interaktif
                            </button>
                            <button onclick="copyToClipboard('${detail.latitude}, ${detail.longitude}')" 
                                    class="btn btn-sm btn-outline-secondary">
                              <i class="bi bi-clipboard"></i> Salin
                            </button>
                          </div>
                        </div>
                      ` : '-'}
                    </td>
                  </tr>
                </table>
              </div>
              <div class="col-md-6">
                <table class="table table-borderless">
                  <tr>
                    <td width="40%"><strong>Tanggal Jadwal</strong></td>
                    <td>
                      <i class="bi bi-calendar-check text-success me-1"></i>
                      ${formattedJadwal}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Tim</strong></td>
                    <td>
                      <i class="bi bi-people text-info me-1"></i>
                      ${detail.nama_tim || detail.tim || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Catatan</strong></td>
                    <td>${detail.catatan || detail.note || '-'}</td>
                  </tr>
                  <tr>
                    <td><strong>ID Anggota</strong></td>
                    <td>${anggotaId || '-'}</td>
                  </tr>
                </table>
              </div>
            </div>
            
            <div class="alert alert-light mt-3">
              <small class="text-muted">
                <i class="bi bi-clock-history me-1"></i>
                Dibuat: ${createdDate} | 
                Diperbarui: ${updatedDate}
              </small>
            </div>
          </div>
        </div>
      </div>
    `;

    showModal("Detail Pengangkutan", detailHTML);
    
    // Expose fungsi ke window
    window.copyToClipboard = copyToClipboard;
    window.openAnggotaMap = openAnggotaMap;
    window.showLocationMap = showLocationMap;
    if (anggotaId) {
      window.viewAnggotaDetail = viewAnggotaDetail;
    }
  } catch (error) {
    console.error("Error loading detail:", error);
    showNotification(`❌ Gagal memuat detail: ${error.message}`, "error");
  }
}

// Fungsi untuk membuka detail anggota (simulasi - sesuaikan dengan aplikasi Anda)
async function viewAnggotaDetail(anggotaId) {
  try {
    // Fetch data anggota
    const anggota = await fetchAPI(`${API.anggota}${anggotaId}/`, {
      headers: getAuthHeaders(),
    });

    const detailHTML = `
      <div class="anggota-detail-modal">
        <div class="card border-info">
          <div class="card-header bg-info bg-opacity-10">
            <h5 class="card-title mb-0 text-info">
              <i class="bi bi-person-circle me-2"></i>Detail Anggota
            </h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <table class="table table-borderless">
                  <tr>
                    <td width="40%"><strong>Nama</strong></td>
                    <td>${anggota.nama || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>No. WhatsApp</strong></td>
                    <td>${anggota.noWA || '-'}</td>
                  </tr>
                  <tr>
                    <td><strong>Alamat</strong></td>
                    <td>${anggota.alamat || '-'}</td>
                  </tr>
                </table>
              </div>
              <div class="col-md-6">
                <table class="table table-borderless">
                  <tr>
                    <td><strong>Status</strong></td>
                    <td>
                      <span class="badge ${anggota.status === 'aktif' ? 'bg-success' : 'bg-danger'}">
                        ${anggota.status || '-'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Jenis Sampah</strong></td>
                    <td>${anggota.jenisSampah || '-'}</td>
                  </tr>
                  <tr>
                    <td><strong>Periode</strong></td>
                    <td>${anggota.tanggalStart || '-'} s/d ${anggota.tanggalEnd || '-'}</td>
                  </tr>
                </table>
              </div>
            </div>
            
            ${anggota.latitude && anggota.longitude ? `
              <div class="mt-3">
                <h6><i class="bi bi-geo-alt me-2"></i>Lokasi Anggota</h6>
                <div class="coordinate-actions">
                  <button onclick="openAnggotaMap(${anggota.latitude}, ${anggota.longitude}, '${(anggota.nama || '').replace(/'/g, "\\'")}')" 
                          class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-map"></i> Google Maps
                  </button>
                  <button onclick="showLocationMap(${anggota.latitude}, ${anggota.longitude}, '${(anggota.nama || '').replace(/'/g, "\\'")}', '${(anggota.alamat || '').replace(/'/g, "\\'")}')" 
                          class="btn btn-sm btn-outline-info">
                    <i class="bi bi-geo-alt"></i> Peta Interaktif
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    showModal("Detail Anggota", detailHTML);
  } catch (error) {
    console.error("Error loading anggota detail:", error);
    showNotification(`❌ Gagal memuat detail anggota: ${error.message}`, "error");
  }
}

// Fungsi untuk membuka peta di Google Maps
function openAnggotaMap(latitude, longitude, locationName = "") {
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

// Fungsi untuk menampilkan peta interaktif
function showLocationMap(latitude, longitude, title = "", description = "") {
  const mapHTML = `
    <div class="interactive-map-modal">
      <h5><i class="bi bi-geo-alt-fill me-2"></i>Peta Lokasi</h5>
      <p class="text-muted">${title || ''} - ${description || ''}</p>
      
      <div id="mapContainer" style="height: 400px; border-radius: 8px; border: 1px solid #dee2e6; margin: 15px 0;">
        <div class="text-center py-5">
          <div class="spinner-border text-success" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3 text-muted">Memuat peta...</p>
        </div>
      </div>
      
      <div class="d-flex justify-content-between align-items-center mt-3">
        <div>
          <small class="text-muted">
            <i class="bi bi-info-circle me-1"></i>
            Koordinat: ${parseFloat(latitude).toFixed(6)}, ${parseFloat(longitude).toFixed(6)}
          </small>
        </div>
        <div class="btn-group">
          <button onclick="openAnggotaMap(${latitude}, ${longitude}, '${title.replace(/'/g, "\\'")}')" 
                  class="btn btn-sm btn-outline-primary">
            <i class="bi bi-google"></i> Google Maps
          </button>
          <button onclick="copyToClipboard('${latitude}, ${longitude}')" 
                  class="btn btn-sm btn-outline-secondary">
            <i class="bi bi-clipboard"></i> Salin Koordinat
          </button>
        </div>
      </div>
    </div>
  `;

  showModal("Peta Lokasi", mapHTML);
  
  // Load peta interaktif setelah modal terbuka
  setTimeout(() => {
    loadInteractiveMap(latitude, longitude, title, description);
  }, 300);
}

// Fungsi untuk memuat peta interaktif dengan Leaflet
async function loadInteractiveMap(latitude, longitude, title, description) {
  try {
    // Cek apakah Leaflet sudah dimuat
    if (!window.L) {
      await loadLeafletLibrary();
    }
    
    const mapContainer = document.getElementById('mapContainer');
    if (!mapContainer) return;
    
    // Inisialisasi peta
    const map = L.map('mapContainer').setView([latitude, longitude], 15);
    
    // Tambahkan tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Tambahkan marker
    const marker = L.marker([latitude, longitude]).addTo(map);
    
    // Tambahkan popup
    if (title || description) {
      marker.bindPopup(`
        <div style="padding: 8px;">
          <h6 style="margin: 0 0 8px 0; color: #20c997;">${title || 'Lokasi'}</h6>
          <p style="margin: 0; font-size: 12px;">${description || ''}</p>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #666;">
            <strong>Koordinat:</strong><br>
            ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
          </p>
        </div>
      `).openPopup();
    }
    
    // Tambahkan kontrol
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.control.scale().addTo(map);
    
  } catch (error) {
    console.error("Error loading interactive map:", error);
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer) {
      mapContainer.innerHTML = `
        <div class="alert alert-danger text-center py-5">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <p class="mt-2">Gagal memuat peta</p>
          <button onclick="openAnggotaMap(${latitude}, ${longitude}, '${title.replace(/'/g, "\\'")}')" 
                  class="btn btn-sm btn-outline-primary">
            Buka di Google Maps
          </button>
        </div>
      `;
    }
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

function resetFilter() {
  // Reset date ke hari ini
  const today = new Date().toISOString().split("T")[0];
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
  }, 3000);
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
window.viewDetail = viewDetail;
window.viewAnggotaDetail = viewAnggotaDetail;
window.openAnggotaMap = openAnggotaMap;
window.showLocationMap = showLocationMap;
window.copyToClipboard = copyToClipboard;
window.resetFilter = resetFilter;