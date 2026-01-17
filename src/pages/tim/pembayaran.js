import { API, getAuthHeaders } from "../../api.js";
import { showModal, showConfirmModal, closeModal } from "../../utils/modal.js";
import { showToast } from "../../utils/toast.js";

let currentPage = 1;
const pageSize = 10;
let allPembayaran = [];

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

    // PERBAIKAN: Pastikan endpoint API benar dan params diteruskan dengan benar
    console.log("Fetching pembayaran from:", url);
    console.log("Filter params:", params);

    // Fetch data tanpa filter dulu untuk debugging
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`Gagal mengambil data pembayaran: ${response.status}`);
    }

    let responseData = await response.json();
    console.log("Raw response data:", responseData);
    
    // PERBAIKAN: Handle berbagai format respons
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
      pembayaranList = [];
    }

    console.log("Raw pembayaranList (before filtering):", pembayaranList);

    // PERBAIKAN: Filter data secara manual di frontend jika API tidak mendukung filter
    let filteredPembayaran = pembayaranList.filter(p => {
      // Status filter
      let statusMatch = true;
      if (filterStatus) {
        const status = String(p.status || p.statusBayar || '').toLowerCase();
        const filterStatusLower = filterStatus.toLowerCase();
        statusMatch = status === filterStatusLower;
      }

      // Month filter
      let monthMatch = true;
      if (filterMonth) {
        const tanggalBayar = p.tanggal_bayar || p.tanggalBayar || p.tanggal || '';
        const paymentMonth = tanggalBayar.substring(0, 7); // YYYY-MM
        monthMatch = paymentMonth === filterMonth;
      }

      // Search filter
      let searchMatch = true;
      if (search) {
        const searchLower = search.toLowerCase();
        const nama = p.nama_anggota || p.anggota?.nama || p.nama || '';
        const id = p.idPembayaran || p.id || '';
        const metode = p.metode_bayar || p.metodeBayar || '';
        
        searchMatch = 
          nama.toLowerCase().includes(searchLower) ||
          String(id).includes(search) ||
          metode.toLowerCase().includes(searchLower);
      }

      return statusMatch && monthMatch && searchMatch;
    });

    console.log("Filtered pembayaranList:", filteredPembayaran);

    // PERBAIKAN: SIMPAN DATA KE GLOBAL TAPI JANGAN RENDER LANGSUNG
    allPembayaran = sortPembayaran(filteredPembayaran);
    currentPage = 1;
    
    // RENDER DARI FUNGSI PAGINATION
    renderCurrentPage();
    updateStatistics(filteredPembayaran);

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

// PERBAIKAN: Tambahkan fungsi untuk reset filter
function resetFilters() {
  document.getElementById("filterStatus").value = "";
  document.getElementById("filterMonth").value = "";
  document.getElementById("searchPembayaran").value = "";
  loadPembayaran();
}

// PERBAIKAN: Tambahkan event listener untuk reset button di pembayaranTimPage()
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
              </select>
            </div>
            <div class="col-md-3">
              <input type="month" id="filterMonth" class="form-control" placeholder="Bulan">
            </div>
            <div class="col-md-2">
              <button id="btnResetFilter" class="btn btn-outline-secondary w-100">
                <i class="bi bi-x-circle me-1"></i>Reset
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
        <div id="paginationContainer" class="card-footer bg-white border-0"></div>
      </div>
    </div>
  `;

  document.head.insertAdjacentHTML('beforeend', responsiveCSS);

  // PERBAIKAN: Event listeners yang benar
  document.getElementById("filterStatus").addEventListener("change", loadPembayaran);
  document.getElementById("filterMonth").addEventListener("change", loadPembayaran);
  document.getElementById("searchPembayaran").addEventListener("input", debounce(loadPembayaran, 300));
  document.getElementById("btnResetFilter").addEventListener("click", resetFilters);
  document.getElementById("btnExportExcel").addEventListener("click", exportToExcel);

  // Load initial data
  loadPembayaran();
  
  // Tambahkan fungsi ke window
  window.loadPembayaran = loadPembayaran;
  window.viewPembayaran = viewPembayaran;
  window.updateStatusPembayaran = updateStatusPembayaran;
  window.editBuktiPembayaran = editBuktiPembayaran;
  window.resetFilters = resetFilters; // Tambah fungsi reset filter
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

function sortPembayaran(pembayaranList) {
  const priority = {
    pending: 0,
    proses: 1,
    berhasil: 2,
    sukses: 2,
    gagal: 3
  };

  return pembayaranList.slice().sort((a, b) => {
    const statusA = (a.status || a.statusBayar || 'pending').toLowerCase();
    const statusB = (b.status || b.statusBayar || 'pending').toLowerCase();

    return (priority[statusA] ?? 99) - (priority[statusB] ?? 99);
  });
}

function paginate(data, page, size) {
  const start = (page - 1) * size;
  return data.slice(start, start + size);
}

function renderCurrentPage() {
  if (!allPembayaran || allPembayaran.length === 0) {
    document.getElementById("pembayaranContainer").innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-receipt text-muted mb-3" style="font-size: 3rem;"></i>
        <h5 class="text-muted">Tidak ada data pembayaran</h5>
        <p class="text-muted">Coba ubah filter pencarian</p>
      </div>
    `;
    document.getElementById("paginationContainer").innerHTML = "";
    return;
  }

  const pagedData = paginate(allPembayaran, currentPage, pageSize);
  renderPembayaranTable(pagedData);
  renderPagination(allPembayaran.length);
}

function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const container = document.getElementById("paginationContainer");

  if (!container || totalPages <= 1) {
    if (container) container.innerHTML = "";
    return;
  }

  let html = `<nav><ul class="pagination justify-content-center mt-3">`;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <li class="page-item ${i === currentPage ? "active" : ""}">
        <button class="page-link" onclick="goToPage(${i})">${i}</button>
      </li>
    `;
  }

  html += `</ul></nav>`;
  container.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  renderCurrentPage();
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

// Ganti fungsi renderPembayaranTable dengan yang ini:
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

  // Hitung info pagination
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, allPembayaran.length);
  const totalItems = allPembayaran.length;

  const tableHTML = `
    <div class="mb-3 d-flex justify-content-between align-items-center">
      <small class="text-muted">
        Menampilkan ${startIndex}-${endIndex} dari ${totalItems} pembayaran
      </small>
      <div class="d-none d-md-block">
        <small class="text-muted">
          <i class="bi bi-info-circle me-1"></i>Geser untuk melihat lebih banyak
        </small>
      </div>
    </div>
    
    <!-- Tabel untuk Desktop/Laptop -->
    <div class="d-none d-md-block">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col" width="60">No</th>
              <th scope="col">Anggota</th>
              <th scope="col" width="100">Tanggal</th>
              <th scope="col" width="120">Jumlah</th>
              <th scope="col" width="100">Metode</th>
              <th scope="col" width="100">Status</th>
              <th scope="col" width="90" class="text-center">Bukti</th>
              <th scope="col" width="150" class="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${pembayaranList.map((p, index) => {
              const no = index + 1;
              const id = p.idPembayaran || p.id || 'N/A';
              const nama = p.nama_anggota || p.anggota?.nama || p.nama || 'N/A';
              const tanggal = p.tanggal_bayar || p.tanggalBayar || p.tanggal;
              const jumlah = p.jumlah || p.jumlahBayar || 0;
              const metode = p.metode_bayar || p.metodeBayar || 'N/A';
              const status = p.status || p.statusBayar || 'pending';
              const buktiBayar = p.bukti_bayar || p.buktiBayar || '';
              
              return `
              <tr>
                <td class="text-muted fw-semibold">${no}</td>
                <td>
                  <div class="d-flex align-items-center">
                    <div class="bg-success bg-opacity-10 p-2 rounded me-2">
                      <i class="bi bi-person-circle text-success"></i>
                    </div>
                    <div>
                      <div class="fw-medium text-truncate" style="max-width: 150px;">${nama}</div>
                      <small class="text-muted">${formatDate(tanggal)}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <small>${formatDate(tanggal)}</small>
                </td>
                <td class="fw-bold text-success">
                  Rp ${parseInt(jumlah).toLocaleString('id-ID')}
                </td>
                <td>
                  <div class="d-flex align-items-center">
                    ${getPaymentMethodIcon(metode)}
                    <span class="ms-1 d-none d-lg-inline">${metode}</span>
                  </div>
                </td>
                <td>
                  ${getPaymentStatusBadge(status)}
                </td>
                <td class="text-center">
                  ${getBuktiBadge(buktiBayar)}
                </td>
                <td class="text-center">
                  <div class="btn-group btn-group-sm" role="group">
                    <button onclick="viewPembayaran('${id}')" 
                            class="btn btn-outline-success" title="Lihat Detail">
                      <i class="bi bi-eye"></i>
                    </button>
                    <button onclick="updateStatusPembayaran('${id}')" 
                            class="btn btn-outline-warning" title="Ubah Status">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button onclick="editBuktiPembayaran('${id}')" 
                            class="btn btn-outline-info" title="Edit Bukti">
                      <i class="bi bi-image"></i>
                    </button>
                  </div>
                </td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Card View untuk Mobile -->
    <div class="d-md-none">
      <div class="row g-3">
        ${pembayaranList.map((p, index) => {
          const id = p.idPembayaran || p.id || 'N/A';
          const nama = p.nama_anggota || p.anggota?.nama || p.nama || 'N/A';
          const tanggal = p.tanggal_bayar || p.tanggalBayar || p.tanggal;
          const jumlah = p.jumlah || p.jumlahBayar || 0;
          const metode = p.metode_bayar || p.metodeBayar || 'N/A';
          const status = p.status || p.statusBayar || 'pending';
          const buktiBayar = p.bukti_bayar || p.buktiBayar || '';
          
          return `
          <div class="col-12">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <!-- Header dengan ID dan Status -->
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <span class="badge bg-secondary">#${id}</span>
                    ${getPaymentStatusBadge(status)}
                  </div>
                  <div class="text-end">
                    <div class="fw-bold text-success">
                      Rp ${parseInt(jumlah).toLocaleString('id-ID')}
                    </div>
                    <small class="text-muted">${formatDate(tanggal)}</small>
                  </div>
                </div>
                
                <!-- Info Anggota -->
                <div class="d-flex align-items-center mb-3">
                  <div class="bg-success bg-opacity-10 p-2 rounded me-3">
                    <i class="bi bi-person-circle text-success fs-5"></i>
                  </div>
                  <div class="flex-grow-1">
                    <div class="fw-medium">${nama}</div>
                    <div class="d-flex align-items-center mt-1">
                      ${getPaymentMethodIcon(metode)}
                      <small class="text-muted ms-1">${metode}</small>
                    </div>
                  </div>
                </div>
                
                <!-- Bukti dan Aksi -->
                <div class="d-flex justify-content-between align-items-center border-top pt-3">
                  <div>
                    ${getBuktiBadge(buktiBayar)}
                  </div>
                  <div class="btn-group btn-group-sm" role="group">
                    <button onclick="viewPembayaran('${id}')" 
                            class="btn btn-outline-success btn-sm" title="Lihat Detail">
                      <i class="bi bi-eye"></i>
                      <span class="d-none d-sm-inline ms-1">Lihat</span>
                    </button>
                    <button onclick="updateStatusPembayaran('${id}')" 
                            class="btn btn-outline-warning btn-sm" title="Ubah Status">
                      <i class="bi bi-pencil"></i>
                      <span class="d-none d-sm-inline ms-1">Status</span>
                    </button>
                    <button onclick="editBuktiPembayaran('${id}')" 
                            class="btn btn-outline-info btn-sm" title="Edit Bukti">
                      <i class="bi bi-image"></i>
                      <span class="d-none d-sm-inline ms-1">Bukti</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </div>
    
    <!-- Info untuk Mobile -->
    <div class="d-md-none mt-3">
      <div class="alert alert-info alert-sm py-2 mb-0">
        <i class="bi bi-phone me-1"></i>
        <small>Ketuk tombol aksi untuk melihat detail, ubah status, atau edit bukti</small>
      </div>
    </div>
  `;

  container.innerHTML = tableHTML;
}

// Tambahkan CSS untuk responsivitas di bagian atas file atau di fungsi pembayaranTimPage
const responsiveCSS = `
  <style>
    /* Mobile Responsive Styles */
    @media (max-width: 767.98px) {
      .pembayaran-tim-page .card {
        margin-bottom: 15px;
      }
      
      .pembayaran-tim-page .btn-group .btn {
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
      }
      
      .pembayaran-tim-page .badge {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
      }
      
      /* Status badge mobile */
      .badge-mobile {
        font-size: 0.7rem;
        padding: 0.2rem 0.4rem;
      }
    }
    
    /* Small mobile devices */
    @media (max-width: 575.98px) {
      .pembayaran-tim-page .btn-group {
        flex-wrap: wrap;
      }
      
      .pembayaran-tim-page .btn-group .btn {
        margin: 2px;
        flex: 1;
        min-width: 70px;
      }
      
      .pembayaran-tim-page .card-body {
        padding: 1rem;
      }
    }
    
    /* Very small devices */
    @media (max-width: 375px) {
      .pembayaran-tim-page .fw-medium {
        font-size: 0.95rem;
      }
      
      .pembayaran-tim-page .text-success {
        font-size: 0.9rem;
      }
    }
    
    /* Print styles */
    @media print {
      .btn, .btn-group, .badge {
        display: none !important;
      }
      
      .card {
        border: 1px solid #000 !important;
        margin-bottom: 10px !important;
      }
    }
  </style>
`;


function getPaymentMethodIcon(method) {
  if (!method || method === 'N/A') return '<span class="text-muted">-</span>';
  
  const icons = {
    'bank': '<i class="bi bi-bank text-primary me-1"></i>',
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
    'success': { text: 'Sukses', class: 'bg-success' },
    'canceled': { text: 'Dibatalkan', class: 'bg-danger' }
  };

  const statusInfo = statusMap[safeStatus] || {
    text: safeStatus,
    class: 'bg-secondary'
  };

  return `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

function getBuktiBadge(buktiBayar) {
  if (buktiBayar) {
    return '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Ada</span>';
  } else {
    return '<span class="badge bg-danger"><i class="bi bi-x-circle"></i> Tidak Ada</span>';
  }
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
            class="img-fluid rounded shadow"
            style="max-height: 420px; width: 100%; object-fit: contain;">
          <div class="mt-2">
            <a href="${buktiBayar}" 
               target="_blank" 
               class="btn btn-sm btn-outline-primary">
              <i class="bi bi-box-arrow-up-right me-1"></i>Buka Full Size
            </a>
            <button onclick="editBuktiPembayaran('${pembayaranId}')" 
                    class="btn btn-sm btn-outline-info ms-2">
              <i class="bi bi-pencil me-1"></i>Edit Bukti
            </button>
          </div>
        </div>
      `
      : `
        <div class="text-center py-4">
          <i class="bi bi-image text-muted" style="font-size: 3rem;"></i>
          <p class="text-muted mt-2">Tidak ada bukti bayar</p>
          <button onclick="editBuktiPembayaran('${pembayaranId}')" 
                  class="btn btn-info btn-sm">
            <i class="bi bi-plus-circle me-1"></i>Tambah Bukti
          </button>
        </div>
      `;

    const detailHTML = `
      <style>
        /* Perbesar modal khusus Detail Pembayaran */
        .modal.show .modal-dialog:has(.detail-pembayaran-lg) {
          max-width: 80vw !important;
          width: 80vw !important;
        }

        /* Tinggi & scroll biar nyaman */
        .modal.show .modal-body {
          max-height: 85vh;
          overflow-y: auto;
        }
      </style>
      <div class="detail-pembayaran detail-pembayaran-lg container-fluid">
        <div class="row gx-4 gy-3">
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
      `<div class="modal-content-lg" style="max-width: 100%; overflow-x: auto;">${detailHTML}</div>`,
      null,
      null
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

// Fungsi untuk edit/upload bukti pembayaran
async function editBuktiPembayaran(pembayaranId) {
  try {
    console.log("Edit bukti pembayaran ID:", pembayaranId);
    
    // Fetch data pembayaran untuk mendapatkan info saat ini
    const response = await fetch(`${API.pembayaran}${pembayaranId}/`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Gagal mengambil data pembayaran: ${response.status}`);
    }

    const pembayaran = await response.json();
    
    // Get current bukti bayar URL
    const currentBukti = pembayaran.bukti_bayar || pembayaran.buktiBayar || '';
    const namaAnggota = pembayaran.nama_anggota || pembayaran.anggota?.nama || 'Anggota';
    
    const modalHTML = `
      <div class="edit-bukti-form">
        <div class="alert alert-info">
          <i class="bi bi-info-circle me-2"></i>
          Anda dapat mengunggah atau mengganti bukti pembayaran untuk <strong>${namaAnggota}</strong>
        </div>
        
        ${currentBukti ? `
          <div class="current-bukti mb-4">
            <h6><i class="bi bi-image me-2"></i>Bukti Saat Ini:</h6>
            <div class="text-center">
              <img src="${currentBukti}" 
                   class="img-fluid rounded border" 
                   style="max-height: 200px;" 
                   alt="Bukti Bayar Saat Ini">
              <div class="mt-2">
                <a href="${currentBukti}" 
                   target="_blank" 
                   class="btn btn-sm btn-outline-primary">
                  <i class="bi bi-box-arrow-up-right me-1"></i>Lihat
                </a>
              </div>
            </div>
          </div>
        ` : `
          <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Saat ini belum ada bukti pembayaran yang diunggah
          </div>
        `}
        
        <div class="upload-section">
          <h6><i class="bi bi-cloud-upload me-2"></i>Unggah Bukti Baru:</h6>
          
          <div class="mb-3">
            <label class="form-label">Pilih File Bukti</label>
            <input type="file" id="buktiFile" class="form-control" 
                   accept=".jpg,.jpeg,.png,.pdf,.webp">
            <div class="form-text">
              Format yang didukung: JPG, PNG, PDF, WebP (maks. 5MB)
            </div>
          </div>
          
          <div id="uploadMessage" class="mb-3"></div>
          
          <div class="preview-section d-none mb-3">
            <h6><i class="bi bi-eye me-2"></i>Preview:</h6>
            <div id="imagePreview" class="text-center">
              <img id="previewImage" class="img-fluid rounded border" style="max-height: 200px;">
            </div>
          </div>
        </div>
      </div>
    `;

    // Show modal with save callback
    showModal(
      "Edit Bukti Pembayaran",
      modalHTML,
      async () => {
        return await saveBuktiPembayaran(pembayaranId);
      }
    );

    // Setup event listeners
    setTimeout(() => {
      const fileInput = document.getElementById('buktiFile');
      const urlInput = document.getElementById('buktiUrl');
      const previewSection = document.querySelector('.preview-section');
      const previewImage = document.getElementById('previewImage');
      
      // File input preview
      if (fileInput) {
        fileInput.addEventListener('change', function(e) {
          const file = e.target.files[0];
          if (file) {
            // Clear URL input
            if (urlInput) urlInput.value = '';
            
            // Show preview
            const reader = new FileReader();
            reader.onload = function(event) {
              previewImage.src = event.target.result;
              previewSection.classList.remove('d-none');
            };
            reader.readAsDataURL(file);
          }
        });
      }
      
      // URL input validation
      if (urlInput) {
        urlInput.addEventListener('input', function() {
          if (this.value.trim()) {
            if (fileInput) fileInput.value = '';
            
            // Simple URL validation
            if (this.value.match(/\.(jpg|jpeg|png|gif|webp|pdf)$/i)) {
              previewImage.src = this.value;
              previewSection.classList.remove('d-none');
            } else {
              previewSection.classList.add('d-none');
            }
          } else {
            previewSection.classList.add('d-none');
          }
        });
      }
    }, 100);

  } catch (error) {
    console.error("Error loading edit bukti form:", error);
    showModal(
      "Error",
      `
        <div class="text-center py-4">
          <i class="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
          <h5 class="text-danger">Gagal Memuat Form</h5>
          <p class="text-muted">${error.message}</p>
        </div>
      `,
      null
    );
  }
}

// Fungsi untuk menyimpan bukti pembayaran
async function saveBuktiPembayaran(pembayaranId) {
  const fileInput = document.getElementById('buktiFile');
  const messageDiv = document.getElementById('uploadMessage');
  
  // Clear previous messages
  messageDiv.innerHTML = '';
  
  // Check if we have a file to upload
  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showAlert(messageDiv, '❌ File terlalu besar. Maksimal 5MB', 'danger');
      return false;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showAlert(messageDiv, '❌ Format file tidak didukung', 'danger');
      return false;
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('buktiBayar', file);
    
    try {
      showAlert(messageDiv, '⏳ Mengupload file...', 'info');
      
      const response = await fetch(`${API.pembayaran}${pembayaranId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': getAuthHeaders().Authorization,
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Upload gagal: ${response.status}`);
      }
      
      showToast('✅ Bukti pembayaran berhasil diupload', 'success', 5000);
      alert("✅ Bukti pembayaran berhasil diupload");
      setTimeout(() => {
        loadPembayaran();
        closeModal();
      }, 5000);
      return true;
      
    } catch (error) {
      showAlert(messageDiv, `❌ Upload gagal: ${error.message}`, 'danger');
      return false;
    }
  }
  
  // If nothing was selected/changed
  if (fileInput) {
    showAlert(messageDiv, '⚠️ Pilih file untuk melanjutkan', 'warning');
    return false;
  }
  
  return false;
}

async function updateStatusPembayaran(pembayaranId) {
  console.group("🧪 DEBUG updateStatusPembayaran");
  console.log("ID Pembayaran:", pembayaranId);

  try {
    /* =========================
       1. FETCH DATA DETAIL PEMBAYARAN
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

    // Cek apakah pembayaran terkait dengan anggota
    const anggotaId = pembayaran.anggota || pembayaran.anggota_id || pembayaran.idAnggota;
    console.log("Anggota ID terkait:", anggotaId);

    if (!anggotaId) {
      console.warn("⚠️ Tidak ada ID anggota terkait dengan pembayaran ini");
    }

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
          </select>
        </div>

        <div class="form-check mb-3" id="updateTanggalContainer" style="display: none;">
          <input class="form-check-input" type="checkbox" id="updateTanggalEnd" checked>
          <label class="form-check-label" for="updateTanggalEnd">
            Perpanjang keanggotaan hingga 1 bulan ke depan
          </label>
          <small class="text-muted d-block mt-1">
            Anggota akan diperpanjang otomatis hingga 1 bulan dari tanggal pembayaran
          </small>
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
        const updateTanggalEnd = document.getElementById("updateTanggalEnd")?.checked || false;
        const messageDiv = document.getElementById("statusMessage");

        console.log("New Status dipilih:", newStatus);
        console.log("Update tanggalEnd:", updateTanggalEnd);

        if (!newStatus) {
          showAlert(messageDiv, "❌ Status baru harus dipilih", "danger");
          return false; // Mencegah modal ditutup
        }

        if (newStatus === currentStatus) {
          showAlert(messageDiv, "⚠️ Status sama dengan sebelumnya", "warning");
          return false; // Mencegah modal ditutup
        }

        /* =========================
           3. PATCH UPDATE STATUS PEMBAYARAN
        ========================= */
        try {
          // 3a. Update status pembayaran
          const payload = { 
            statusBayar: newStatus 
          };
          
          console.log("PATCH payload ke pembayaran:", payload);

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

          const updatedPembayaran = await patchResponse.json();
          console.log("✅ Pembayaran berhasil diupdate:", updatedPembayaran);
          alert(`✅ Pembayaran berhasil diupdate`, updatedPembayaran);


          /* =========================
             4. UPDATE TANGGAL END ANGGOTA JIKA STATUS LUNAS
          ========================= */
          let anggotaUpdateSuccess = false;
          
          if (newStatus === 'lunas' && updateTanggalEnd && anggotaId) {
            try {
              console.log(`🔄 Memperbarui tanggalEnd untuk anggota ID: ${anggotaId}`);
              
              // Ambil data anggota terlebih dahulu
              const anggotaResponse = await fetch(`${API.anggota}${anggotaId}/`, {
                headers: getAuthHeaders(),
              });
              
              if (anggotaResponse.ok) {
                const anggotaData = await anggotaResponse.json();
                console.log("Data anggota saat ini:", anggotaData);
                
                // Hitung tanggalEnd baru (1 bulan dari sekarang)
                const today = new Date();
                const newEndDate = new Date(today);
                newEndDate.setMonth(today.getMonth() + 1);
                
                // Format date untuk Django (YYYY-MM-DD)
                const formattedDate = newEndDate.toISOString().split('T')[0];
                
                console.log(`TanggalEnd baru: ${formattedDate}`);
                
                // Update tanggalEnd anggota
                const updateAnggotaResponse = await fetch(`${API.anggota}${anggotaId}/`, {
                  method: "PATCH",
                  headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    tanggalEnd: formattedDate,
                    status: 'aktif' // Set status anggota menjadi aktif
                  }),
                });
                
                if (updateAnggotaResponse.ok) {
                  anggotaUpdateSuccess = true;
                  console.log("✅ Anggota berhasil diperbarui");
                  alert(`✅ Perpanjang keanggotaan hingga ${formattedDate}`);
                } else {
                  console.warn("⚠️ Gagal memperbarui anggota:", await updateAnggotaResponse.text());
                }
              } else {
                console.warn("⚠️ Gagal mengambil data anggota");
              }
            } catch (error) {
              console.warn("⚠️ Error saat memperbarui anggota:", error);
            }
          }

          /* =========================
             5. TAMPILKAN HASIL
          ========================= */
          let successMessage = "✅ Status pembayaran berhasil diupdate";
          
          if (newStatus === 'lunas') {
            if (anggotaId && updateTanggalEnd) {
              if (anggotaUpdateSuccess) {
                successMessage += " dan keanggotaan telah diperpanjang 1 bulan";
              } else {
                successMessage += " (Gagal memperpanjang keanggotaan)";
              }
            } else if (!anggotaId) {
              successMessage += " (Tidak ada data anggota terkait)";
            }
          }
          
          showAlert(messageDiv, successMessage, "success");

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

    /* =========================
       EVENT LISTENER UNTUK MENAMPILKAN CHECKBOX
       HANYA JIKA STATUS YANG DIPILIH ADALAH "LUNAS"
    ========================= */
    setTimeout(() => {
      const statusSelect = document.getElementById('newStatus');
      const tanggalContainer = document.getElementById('updateTanggalContainer');
      
      if (statusSelect && tanggalContainer) {
        // Tampilkan/sembunyikan checkbox berdasarkan pilihan status
        statusSelect.addEventListener('change', function() {
          if (this.value === 'lunas' && anggotaId) {
            tanggalContainer.style.display = 'block';
          } else {
            tanggalContainer.style.display = 'none';
          }
        });
        
        // Inisialisasi tampilan awal
        if (statusSelect.value === 'lunas' && anggotaId) {
          tanggalContainer.style.display = 'block';
        }
      }
    }, 100);

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
      'Status': p.status || p.statusBayar || ''
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

window.paginate = paginate;
window.goToPage = goToPage;