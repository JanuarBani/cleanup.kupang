import { API, getAuthHeaders } from "../../api.js";
import { showModal, showConfirmModal, closeModal } from "../../utils/modal.js";

export async function pembayaranTimPage() {
  const mainContent = document.getElementById("mainContent");
  
  mainContent.innerHTML = `
    <div class="pembayaran-tim-page">
      <!-- Header dengan gradient hijau -->
      <div class="card border-success mb-4 shadow-sm">
        <div class="card-body p-4">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="text-success fw-bold mb-1">
                <i class="bi bi-cash-coin me-2"></i>Manajemen Pembayaran
              </h2>
              <p class="text-muted mb-0">Kelola pembayaran bulanan anggota</p>
            </div>
            <button id="btnExportExcel" class="btn btn-outline-success">
              <i class="bi bi-file-earmark-excel me-1"></i>Export Excel
            </button>
          </div>
        </div>
      </div>
      
      <!-- Filter dan Search -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0">
                  <i class="bi bi-search text-success"></i>
                </span>
                <input type="text" id="searchPembayaran" class="form-control border-start-0" placeholder="Cari nama anggota...">
              </div>
            </div>
            <div class="col-md-3">
              <select id="filterStatus" class="form-select">
                <option value="">Semua Status</option>
                <option value="lunas">Lunas</option>
                <option value="pending">Pending</option>
                <option value="gagal">Gagal</option>
                <option value="expired">Kadaluarsa</option>
              </select>
            </div>
            <div class="col-md-3">
              <input type="month" id="filterMonth" class="form-control" placeholder="Bulan">
            </div>
            <div class="col-md-2">
              <button id="btnFilter" class="btn btn-success w-100">
                <i class="bi bi-funnel me-1"></i>Filter
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Statistik -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card border-success border-2 shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="bg-success bg-opacity-10 p-3 rounded me-3">
                  <i class="bi bi-check-circle text-success fs-4"></i>
                </div>
                <div>
                  <h5 class="card-title mb-1">Lunas</h5>
                  <p class="card-text text-muted mb-0">
                    <span id="countLunas" class="fw-bold fs-4">0</span> anggota
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card border-warning border-2 shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="bg-warning bg-opacity-10 p-3 rounded me-3">
                  <i class="bi bi-clock text-warning fs-4"></i>
                </div>
                <div>
                  <h5 class="card-title mb-1">Pending</h5>
                  <p class="card-text text-muted mb-0">
                    <span id="countPending" class="fw-bold fs-4">0</span> anggota
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card border-danger border-2 shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="bg-danger bg-opacity-10 p-3 rounded me-3">
                  <i class="bi bi-x-circle text-danger fs-4"></i>
                </div>
                <div>
                  <h5 class="card-title mb-1">Gagal</h5>
                  <p class="card-text text-muted mb-0">
                    <span id="countGagal" class="fw-bold fs-4">0</span> anggota
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card border-info border-2 shadow-sm">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="bg-info bg-opacity-10 p-3 rounded me-3">
                  <i class="bi bi-cash-stack text-info fs-4"></i>
                </div>
                <div>
                  <h5 class="card-title mb-1">Total Bulan Ini</h5>
                  <p class="card-text text-muted mb-0">
                    Rp <span id="totalBulanIni" class="fw-bold fs-4">0</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Tabel Pembayaran -->
      <div class="card border-0 shadow-sm">
        <div class="card-body p-0">
          <div id="pembayaranContainer" class="table-responsive">
            <div class="text-center py-5">
              <div class="spinner-border text-success" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-3 text-muted">Memuat data pembayaran...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Event listeners
  document.getElementById("filterStatus").addEventListener("change", loadPembayaran);
  document.getElementById("filterMonth").addEventListener("change", loadPembayaran);
  document.getElementById("searchPembayaran").addEventListener("input", debounce(loadPembayaran, 300));
  document.getElementById("btnFilter").addEventListener("click", loadPembayaran);
  document.getElementById("btnExportExcel").addEventListener("click", exportToExcel);

  // Load initial data
  loadPembayaran();
  
  // Tambahkan fungsi ke window
  window.loadPembayaran = loadPembayaran;
  window.viewPembayaran = viewPembayaran;
  window.updateStatusPembayaran = updateStatusPembayaran;
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

async function loadPembayaran() {
  const filterStatus = document.getElementById("filterStatus")?.value || "";
  const filterMonth = document.getElementById("filterMonth")?.value || "";
  const search = document.getElementById("searchPembayaran")?.value || "";

  try {
    let url = API.pembayaran;
    const params = [];

    if (filterStatus) params.push(`status=${filterStatus}`);
    if (filterMonth) params.push(`bulan=${filterMonth}`);
    if (search) params.push(`search=${search}`);

    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }

    console.log("Fetching pembayaran from:", url);

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`Gagal mengambil data pembayaran: ${response.status}`);
    }

    const responseData = await response.json();
    console.log("Response data:", responseData);
    
    // Perbaikan: Handle berbagai format respons
    let pembayaranList = [];
    
    if (Array.isArray(responseData)) {
      pembayaranList = responseData;
    } else if (responseData.data && Array.isArray(responseData.data)) {
      pembayaranList = responseData.data;
    } else if (responseData.results && Array.isArray(responseData.results)) {
      pembayaranList = responseData.results;
    } else if (responseData.pembayaran && Array.isArray(responseData.pembayaran)) {
      pembayaranList = responseData.pembayaran;
    } else {
      console.warn("Format data tidak dikenali:", responseData);
    }

    console.log("Processed pembayaranList:", pembayaranList);
    renderPembayaranTable(pembayaranList);
    updateStatistics(pembayaranList);

  } catch (error) {
    console.error("Error loading pembayaran:", error);
    document.getElementById("pembayaranContainer").innerHTML = `
      <div class="alert alert-danger m-3">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        Gagal memuat data: ${error.message}
      </div>
    `;
  }
}

function updateStatistics(pembayaranList) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const stats = {
    lunas: 0,
    pending: 0,
    gagal: 0,
    totalBulanIni: 0
  };

  pembayaranList.forEach(p => {
    const status = String(p.status || p.statusBayar || '').toLowerCase();
    
    if (status === 'paid' || status === 'lunas') {
      stats.lunas++;
    } else if (status === 'pending') {
      stats.pending++;
    } else if (status === 'failed' || status === 'gagal') {
      stats.gagal++;
    }
    
    // Hitung total bulan ini
    const tanggalBayar = p.tanggal_bayar || p.tanggalBayar;
    if (tanggalBayar && tanggalBayar.startsWith(currentMonth)) {
      const jumlah = parseFloat(p.jumlah || p.jumlahBayar || 0);
      stats.totalBulanIni += jumlah;
    }
  });

  // Update UI
  document.getElementById('countLunas').textContent = stats.lunas;
  document.getElementById('countPending').textContent = stats.pending;
  document.getElementById('countGagal').textContent = stats.gagal;
  document.getElementById('totalBulanIni').textContent = 
    stats.totalBulanIni.toLocaleString('id-ID');
}

function renderPembayaranTable(pembayaranList) {
  const container = document.getElementById("pembayaranContainer");

  if (!pembayaranList || pembayaranList.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-receipt text-muted mb-3" style="font-size: 3rem;"></i>
        <h5 class="text-muted">Tidak ada data pembayaran</h5>
        <p class="text-muted">Coba ubah filter pencarian</p>
      </div>
    `;
    return;
  }

  const tableHTML = `
    <table class="table table-hover mb-0">
      <thead class="table-light">
        <tr>
          <th scope="col" class="ps-4">ID</th>
          <th scope="col">Anggota</th>
          <th scope="col">Tanggal</th>
          <th scope="col">Jumlah</th>
          <th scope="col">Metode</th>
          <th scope="col">Status</th>
          <th scope="col" class="text-center pe-4">Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${pembayaranList.map((p) => {
          const id = p.idPembayaran || p.id || 'N/A';
          const nama = p.nama_anggota || p.anggota?.nama || p.nama || 'N/A';
          const tanggal = p.tanggal_bayar || p.tanggalBayar || p.tanggal;
          const jumlah = p.jumlah || p.jumlahBayar || 0;
          const metode = p.metode_bayar || p.metodeBayar || 'N/A';
          const status = p.status || p.statusBayar || 'pending';
          const bulan = p.bulan || 'N/A';
          
          return `
          <tr>
            <td class="ps-4 fw-semibold">${id}</td>
            <td>
              <div class="d-flex align-items-center">
                <div class="bg-success bg-opacity-10 p-2 rounded me-2">
                  <i class="bi bi-person-circle text-success"></i>
                </div>
                <div>
                  <div class="fw-medium">${nama}</div>
                  <small class="text-muted">Bulan: ${bulan}</small>
                </div>
              </div>
            </td>
            <td>
              ${formatDate(tanggal)}
            </td>
            <td class="fw-bold text-success">
              Rp ${parseInt(jumlah).toLocaleString('id-ID')}
            </td>
            <td>
              ${getPaymentMethodIcon(metode)}
            </td>
            <td>
              ${getPaymentStatusBadge(status)}
            </td>
            <td class="text-center pe-4">
              <div class="btn-group btn-group-sm" role="group">
                <button onclick="viewPembayaran('${id}')" 
                        class="btn btn-outline-success">
                  <i class="bi bi-eye"></i>
                </button>
                <button onclick="updateStatusPembayaran('${id}')" 
                        class="btn btn-outline-warning">
                  <i class="bi bi-pencil"></i>
                </button>
              </div>
            </td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  container.innerHTML = tableHTML;
}

function getPaymentMethodIcon(method) {
  if (!method || method === 'N/A') return '<span class="text-muted">-</span>';
  
  const icons = {
    'bank': '<i class="bi bi-bank text-primary me-1"></i>',
    'qris': '<i class="bi bi-qr-code text-success me-1"></i>',
    'cash': '<i class="bi bi-cash text-success me-1"></i>',
    'transfer': '<i class="bi bi-arrow-left-right text-info me-1"></i>',
    'ewallet': '<i class="bi bi-phone text-info me-1"></i>'
  };
  
  const key = String(method).toLowerCase();
  const icon = icons[key] || '<i class="bi bi-credit-card text-secondary me-1"></i>';
  
  return `${icon}${method}`;
}

function getPaymentStatusBadge(status) {
  if (!status) {
    return '<span class="badge bg-secondary">Unknown</span>';
  }

  const safeStatus = String(status).toLowerCase();

  const statusMap = {
    'paid': { text: 'Lunas', class: 'bg-success' },
    'lunas': { text: 'Lunas', class: 'bg-success' },
    'pending': { text: 'Pending', class: 'bg-warning' },
    'failed': { text: 'Gagal', class: 'bg-danger' },
    'gagal': { text: 'Gagal', class: 'bg-danger' },
    'expired': { text: 'Kadaluarsa', class: 'bg-secondary' },
    'success': { text: 'Sukses', class: 'bg-success' },
    'canceled': { text: 'Dibatalkan', class: 'bg-danger' }
  };

  const statusInfo = statusMap[safeStatus] || {
    text: safeStatus,
    class: 'bg-secondary'
  };

  return `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

function formatDate(dateString) {
  if (!dateString) return '<span class="text-muted">-</span>';
  try {
    const date = new Date(dateString);
    // Handle invalid date
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

async function viewPembayaran(pembayaranId) {
  try {
    console.log("Fetching detail pembayaran ID:", pembayaranId);
    
    const response = await fetch(`${API.pembayaran}${pembayaranId}/`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Gagal mengambil detail: ${response.status}`);
    }

    const pembayaran = await response.json();
    console.log("Detail pembayaran:", pembayaran);

    // Debug: Log semua properti untuk verifikasi
    console.log("All properties:", Object.keys(pembayaran));
    console.log("idPembayaran:", pembayaran.idPembayaran);
    console.log("id:", pembayaran.id);
    console.log("nama_anggota:", pembayaran.nama_anggota);
    console.log("anggota:", pembayaran.anggota);
    console.log("tanggal_bayar:", pembayaran.tanggal_bayar);
    console.log("tanggalBayar:", pembayaran.tanggalBayar);

    // Ekstrak data dengan fallback yang lebih baik
    const id = pembayaran.idPembayaran || pembayaran.id || 'N/A';
    const nama = pembayaran.nama_anggota || 
                 pembayaran.anggota?.nama || 
                 pembayaran.nama || 
                 'N/A';
    const tanggal = pembayaran.tanggal_bayar || pembayaran.tanggalBayar || pembayaran.tanggal;
    const jumlah = pembayaran.jumlah || pembayaran.jumlahBayar || 0;
    const metode = pembayaran.metode_bayar || pembayaran.metodeBayar || 'N/A';
    const status = pembayaran.status || pembayaran.statusBayar || 'pending';
    const bulan = pembayaran.bulan || 'N/A';
    const keterangan = pembayaran.keterangan || pembayaran.catatan || '';
    
    // Handle bukti bayar
    const buktiBayar = pembayaran.bukti_bayar_url || 
                       pembayaran.bukti_bayar || 
                       pembayaran.buktiBayar || 
                       pembayaran.bukti || 
                       '';
    
    const buktiHTML = buktiBayar 
      ? `
        <div class="text-center mt-3">
          <img src="${buktiBayar}" 
               class="img-fluid rounded border" 
               style="max-height: 300px;" 
               alt="Bukti Bayar">
          <div class="mt-2">
            <a href="${buktiBayar}" 
               target="_blank" 
               class="btn btn-sm btn-outline-primary">
              <i class="bi bi-box-arrow-up-right me-1"></i>Buka Full Size
            </a>
          </div>
        </div>
      `
      : '<p class="text-muted text-center">Tidak ada bukti bayar</p>';

    const detailHTML = `
      <div class="detail-pembayaran">
        <div class="row">
          <div class="col-md-6">
            <div class="card border-success mb-3">
              <div class="card-header bg-success bg-opacity-10">
                <h6 class="card-title mb-0 text-success">
                  <i class="bi bi-info-circle me-2"></i>Informasi Pembayaran
                </h6>
              </div>
              <div class="card-body">
                <table class="table table-borderless">
                  <tr>
                    <td width="40%"><strong>ID Pembayaran</strong></td>
                    <td>#${id}</td>
                  </tr>
                  <tr>
                    <td><strong>Nama Anggota</strong></td>
                    <td>${nama}</td>
                  </tr>
                  <tr>
                    <td><strong>Tanggal Bayar</strong></td>
                    <td>${formatDate(tanggal)}</td>
                  </tr>
                  <tr>
                    <td><strong>Bulan</strong></td>
                    <td>${bulan}</td>
                  </tr>
                  <tr>
                    <td><strong>Jumlah</strong></td>
                    <td class="fw-bold text-success">
                      Rp ${parseInt(jumlah).toLocaleString('id-ID')}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Metode Bayar</strong></td>
                    <td>${getPaymentMethodIcon(metode)}</td>
                  </tr>
                  <tr>
                    <td><strong>Status</strong></td>
                    <td>${getPaymentStatusBadge(status)}</td>
                  </tr>
                  ${keterangan ? `
                  <tr>
                    <td><strong>Keterangan</strong></td>
                    <td>${keterangan}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="card border-info">
              <div class="card-header bg-info bg-opacity-10">
                <h6 class="card-title mb-0 text-info">
                  <i class="bi bi-receipt me-2"></i>Bukti Pembayaran
                </h6>
              </div>
              <div class="card-body">
                ${buktiHTML}
              </div>
            </div>
          </div>
        </div>
        
        ${pembayaran.created_at || pembayaran.createdAt ? `
        <div class="alert alert-light mt-3">
          <small class="text-muted">
            <i class="bi bi-clock-history me-1"></i>
            Dibuat: ${formatDate(pembayaran.created_at || pembayaran.createdAt)} | 
            Diperbarui: ${formatDate(pembayaran.updated_at || pembayaran.updatedAt)}
          </small>
        </div>
        ` : ''}
      </div>
    `;

    // Gunakan showModal tanpa callback (view only)
    showModal(
      "Detail Pembayaran",
      detailHTML,
      null // Tidak ada tombol simpan
    );

  } catch (error) {
    console.error("Error loading detail:", error);
    showModal(
      "Error",
      `
        <div class="text-center py-4">
          <i class="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
          <h5 class="text-danger">Gagal Memuat Detail</h5>
          <p class="text-muted">${error.message}</p>
        </div>
      `,
      null
    );
  }
}

async function updateStatusPembayaran(pembayaranId) {
  console.group("🧪 DEBUG updateStatusPembayaran");
  console.log("ID Pembayaran:", pembayaranId);

  try {
    /* =========================
       1. FETCH DATA DETAIL
    ========================= */
    const response = await fetch(`${API.pembayaran}${pembayaranId}/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    console.log("GET response status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error("GET error body:", text);
      throw new Error(`GET gagal (${response.status})`);
    }

    const pembayaran = await response.json();
    console.log("DATA PEMBAYARAN:", pembayaran);

    const currentStatus = String(
      pembayaran.status || pembayaran.statusBayar || ""
    ).toLowerCase();

    console.log("Current Status (normalized):", currentStatus);

    /* =========================
       2. FORM MODAL
    ========================= */
    const formHTML = `
      <div class="update-status-form">
        <table class="table table-borderless">
          <tr>
            <td><strong>Anggota</strong></td>
            <td>${pembayaran.nama_anggota || pembayaran.anggota?.nama || 'N/A'}</td>
          </tr>
          <tr>
            <td><strong>Jumlah</strong></td>
            <td>Rp ${parseInt(pembayaran.jumlah || pembayaran.jumlahBayar || 0).toLocaleString("id-ID")}</td>
          </tr>
          <tr>
            <td><strong>Status Saat Ini</strong></td>
            <td>${getPaymentStatusBadge(currentStatus)}</td>
          </tr>
        </table>

        <div class="mb-3">
          <label class="form-label">Status Baru</label>
          <select id="newStatus" class="form-select">
            <option value="">-- Pilih --</option>
            <option value="lunas" ${currentStatus === 'lunas' || currentStatus === 'paid' ? 'selected' : ''}>Lunas</option>
            <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="gagal" ${currentStatus === 'gagal' || currentStatus === 'failed' ? 'selected' : ''}>Gagal</option>
            <option value="expired" ${currentStatus === 'expired' ? 'selected' : ''}>Kadaluarsa</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">Keterangan (Opsional)</label>
          <textarea id="keterangan" class="form-control" rows="3" placeholder="Masukkan keterangan perubahan status...">${pembayaran.keterangan || ''}</textarea>
        </div>

        <div id="statusMessage"></div>
      </div>
    `;

    // Gunakan showModal dengan callback untuk simpan
    showModal(
      "Ubah Status Pembayaran", 
      formHTML,
      async () => {
        // Callback ketika tombol Simpan diklik
        const newStatus = document.getElementById("newStatus").value;
        const keterangan = document.getElementById("keterangan").value;
        const messageDiv = document.getElementById("statusMessage");

        console.log("New Status dipilih:", newStatus);

        if (!newStatus) {
          showAlert(messageDiv, "❌ Status baru harus dipilih", "danger");
          return false; // Mencegah modal ditutup
        }

        if (newStatus === currentStatus) {
          showAlert(messageDiv, "⚠️ Status sama dengan sebelumnya", "warning");
          return false; // Mencegah modal ditutup
        }

        /* =========================
           3. PATCH UPDATE
        ========================= */
        try {
          const payload = { 
            statusBayar: newStatus 
          };
          
          // Tambahkan keterangan jika ada
          if (keterangan.trim()) {
            payload.keterangan = keterangan;
          }
          
          console.log("PATCH payload:", payload);

          const patchResponse = await fetch(`${API.pembayaran}${pembayaranId}/`, {
            method: "PATCH",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          console.log("PATCH status:", patchResponse.status);

          if (!patchResponse.ok) {
            const errorText = await patchResponse.text();
            throw new Error(`PATCH gagal (${patchResponse.status}): ${errorText}`);
          }

          showAlert(messageDiv, "✅ Status berhasil diupdate", "success");

          // Refresh data setelah sukses
          setTimeout(() => {
            loadPembayaran();
          }, 500);

          return true; // Izinkan modal ditutup

        } catch (err) {
          console.error("PATCH ERROR:", err);
          showAlert(messageDiv, `❌ ${err.message}`, "danger");
          return false; // Mencegah modal ditutup
        }
      }
    );

  } catch (error) {
    console.error("FATAL ERROR:", error);
    // Gunakan showModal untuk error
    showModal(
      "Error",
      `
        <div class="text-center py-4">
          <i class="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
          <h5 class="text-danger">Gagal Memuat Data</h5>
          <p class="text-muted">${error.message}</p>
        </div>
      `,
      null
    );
  } finally {
    console.groupEnd();
  }
}

function showAlert(element, message, type = "info") {
  element.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

// Fungsi untuk menampilkan toast notification
function showNotification(message, type = "success") {
  // Cek apakah Bootstrap Toast tersedia
  if (typeof bootstrap === 'undefined' || !bootstrap.Toast) {
    console.warn("Bootstrap Toast tidak tersedia");
    alert(message);
    return;
  }

  // Buat notifikasi toast
  const toastId = 'notification-toast-' + Date.now();
  const toastHTML = `
    <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi ${type === 'success' ? 'bi-check-circle' : 'bi-info-circle'} me-2"></i>
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  // Tambahkan ke container toast
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }

  toastContainer.innerHTML += toastHTML;

  // Tampilkan toast
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
  toast.show();

  // Hapus setelah ditutup
  toastElement.addEventListener('hidden.bs.toast', function () {
    toastElement.remove();
  });
}

async function exportToExcel() {
  try {
    const response = await fetch(API.pembayaran, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Gagal mengambil data: ${response.status}`);
    }

    const responseData = await response.json();
    
    // Handle berbagai format respons
    let pembayaranList = [];
    
    if (Array.isArray(responseData)) {
      pembayaranList = responseData;
    } else if (responseData.data && Array.isArray(responseData.data)) {
      pembayaranList = responseData.data;
    } else if (responseData.results && Array.isArray(responseData.results)) {
      pembayaranList = responseData.results;
    } else if (responseData.pembayaran && Array.isArray(responseData.pembayaran)) {
      pembayaranList = responseData.pembayaran;
    } else {
      throw new Error("Format data tidak dikenali");
    }

    if (pembayaranList.length === 0) {
      showNotification("Tidak ada data untuk diexport", "warning");
      return;
    }

    // Format data untuk CSV
    const data = pembayaranList.map(p => ({
      'ID': p.idPembayaran || p.id || '',
      'Nama Anggota': p.nama_anggota || p.anggota?.nama || p.nama || '',
      'Tanggal Bayar': p.tanggal_bayar || p.tanggalBayar || p.tanggal || '',
      'Jumlah': p.jumlah || p.jumlahBayar || 0,
      'Metode Bayar': p.metode_bayar || p.metodeBayar || '',
      'Status': p.status || p.statusBayar || '',
      'Bulan': p.bulan || '',
      'Keterangan': p.keterangan || ''
    }));

    // Convert ke CSV
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','), // Header
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape quotes dan wrap dalam quotes jika mengandung koma
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Buat link download
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pembayaran_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification("Data berhasil diexport ke CSV", "success");

  } catch (error) {
    console.error("Error exporting data:", error);
    showNotification(`Gagal mengexport data: ${error.message}`, "danger");
  }
}