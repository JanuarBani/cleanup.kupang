import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showModal, showConfirmModal } from "../../utils/modal.js";

let jadwalAllData = [];
let jadwalCurrentPage = 1;
const jadwalPerPage = 10;

let filterMonth = '';

export async function jadwalAdminPage() {
  const mainContent = document.getElementById("mainContent");
  
  // Pastikan mainContent ada
  if (!mainContent) {
    console.error("mainContent element not found");
    return;
  }
  
  // Buat modal container jika belum ada
  if (!document.getElementById('modalContainer')) {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modalContainer';
    document.body.appendChild(modalContainer);
  }
  
  mainContent.innerHTML = `
        <div class="container-fluid">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="mb-0">Manajemen Jadwal</h2>
                <button id="addJadwalBtn" class="btn btn-success">
                    <i class="bi bi-plus-circle me-2"></i>Tambah Jadwal
                </button>
            </div>
            
            <div class="card mb-4">
                <div class="card-header bg-light">
                    <h5 class="card-title mb-0">Filter Jadwal</h5>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label for="filterDate" class="form-label">Tanggal</label>
                            <input type="date" id="filterDate" class="form-control">
                        </div>
                        <div class="col-md-3">
                            <label for="filterMonth" class="form-label">Bulan</label>
                            <select id="filterMonth" class="form-select">
                                <option value="">Semua Bulan</option>
                                <option value="01">Januari</option>
                                <option value="02">Februari</option>
                                <option value="03">Maret</option>
                                <option value="04">April</option>
                                <option value="05">Mei</option>
                                <option value="06">Juni</option>
                                <option value="07">Juli</option>
                                <option value="08">Agustus</option>
                                <option value="09">September</option>
                                <option value="10">Oktober</option>
                                <option value="11">November</option>
                                <option value="12">Desember</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="filterTim" class="form-label">Tim Pengangkut</label>
                            <select id="filterTim" class="form-select">
                                <option value="">Semua Tim</option>
                            </select>
                        </div>
                        <div class="col-md-3 d-flex align-items-end">
                            <button id="resetFilter" class="btn btn-secondary w-100">
                                <i class="bi bi-arrow-counterclockwise me-2"></i>Reset Filter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header bg-light d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">Daftar Jadwal</h5>
                    <div class="spinner-border spinner-border-sm text-primary d-none" role="status" id="loadingSpinner">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Info Pagination -->
                    <div id="paginationInfo" class="mb-3 text-muted small"></div>
                    
                    <!-- Table Container -->
                    <div id="jadwalTableContainer">
                        <div class="text-center py-4">
                            <div class="spinner-border text-primary mb-3" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p>Memuat data jadwal...</p>
                        </div>
                    </div>
                    
                    <!-- Pagination Container -->
                    <div id="paginationContainer" class="mt-4"></div>
                </div>
            </div>
        </div>
    `;

  // Reset variabel pagination
  jadwalCurrentPage = 1;
  jadwalAllData = [];
  filterMonth = '';

  // Setup event listeners dengan pengecekan null
  const addJadwalBtn = document.getElementById("addJadwalBtn");
  if (addJadwalBtn) {
    addJadwalBtn.onclick = () => showAddJadwalForm();
  }

  const filterDate = document.getElementById("filterDate");
  if (filterDate) {
    filterDate.onchange = loadJadwal;
  }

  const filterMonthSelect = document.getElementById("filterMonth");
  if (filterMonthSelect) {
    filterMonthSelect.onchange = () => {
      filterMonth = filterMonthSelect.value;
      loadJadwal();
    };
  }

  const filterTim = document.getElementById("filterTim");
  if (filterTim) {
    filterTim.onchange = loadJadwal;
  }

  const resetFilter = document.getElementById("resetFilter");
  if (resetFilter) {
    resetFilter.onclick = () => {
      if (filterDate) filterDate.value = "";
      if (filterMonthSelect) {
        filterMonthSelect.value = "";
        filterMonth = '';
      }
      if (filterTim) filterTim.value = "";
      loadJadwal();
    };
  }

  loadTimOptions();
  loadJadwal();
}

// Tambahkan fungsi-fungsi yang diperlukan di bagian atas atau tempat yang sesuai

function getMonthName(monthIndex) {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return monthNames[monthIndex];
}

// Fungsi untuk mendapatkan bulan dari angka
function getMonthFromNumber(monthNumber) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[parseInt(monthNumber) - 1] || '';
}

function getMonthIndex(monthName) {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return monthNames.indexOf(monthName);
}

// Tambahkan fungsi showToast jika belum ada
function showToast(type, message) {
  // Cek apakah toast container sudah ada
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 350px;
    `;
    document.body.appendChild(toastContainer);
  }

  // Buat ID unik untuk toast
  const toastId = 'toast-' + Date.now();
  
  // Tentukan warna berdasarkan type
  const colors = {
    'success': 'bg-success',
    'error': 'bg-danger',
    'warning': 'bg-warning',
    'info': 'bg-info'
  };

  const icon = {
    'success': 'bi-check-circle',
    'error': 'bi-exclamation-triangle',
    'warning': 'bi-exclamation-circle',
    'info': 'bi-info-circle'
  };

  // Buat toast element
  const toastHTML = `
    <div id="${toastId}" class="toast align-items-center text-white ${colors[type] || 'bg-primary'} border-0 mb-2" 
         role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi ${icon[type]} me-2"></i>
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML('afterbegin', toastHTML);
  
  // Inisialisasi dan show toast
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, {
    delay: 3000
  });
  toast.show();

  // Hapus toast dari DOM setelah selesai
  toastElement.addEventListener('hidden.bs.toast', function () {
    this.remove();
  });
}

// Tambahkan CSS untuk multi-select calendar
const multiSelectCalendarStyle = document.createElement('style');
multiSelectCalendarStyle.textContent = `
  .calendar-grid.multi-select {
    background: white;
    border-radius: 10px;
    padding: 15px;
    box-shadow: 0 3px 12px rgba(0,0,0,0.08);
    border: 1px solid #e9ecef;
  }
  
  .calendar-header {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    padding: 10px 15px;
    border-radius: 8px;
    margin-bottom: 15px;
  }
  
  .days-of-week {
    padding: 8px 0;
    border-bottom: 2px solid #dee2e6;
    margin-bottom: 10px;
  }
  
  .day-header {
    font-weight: 600;
    color: #495057;
    padding: 8px 0;
  }
  
  .calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
  }
  
  .day {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    user-select: none;
    border: 2px solid transparent;
  }
  
  .day.empty {
    visibility: hidden;
  }
  
  .day.selectable {
    background: #f8f9fa;
    color: #495057;
  }
  
  .day.selectable:hover {
    background: #e9ecef;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  .day.selectable.hover {
    background: #e3f2fd;
    border-color: #0d6efd;
  }
  
  .day.selected {
    background: #0d6efd;
    color: white;
    font-weight: bold;
    border-color: #0a58ca;
    transform: scale(1.05);
  }
  
  .day.selected .day-checkmark {
    display: block;
  }
  
  .day.today {
    background: #fff3cd;
    color: #856404;
    font-weight: bold;
    border-color: #ffeaa7;
  }
  
  .day.past {
    background: #f8f9fa;
    color: #adb5bd;
    cursor: not-allowed;
    opacity: 0.5;
  }
  
  .day-checkmark {
    position: absolute;
    top: 2px;
    right: 2px;
    display: none;
    font-size: 12px;
  }
  
  .calendar-container.multi-select-mode::before {
    content: "Mode Multi-select (CTRL) Aktif";
    position: absolute;
    top: -30px;
    left: 0;
    right: 0;
    background: #0d6efd;
    color: white;
    padding: 5px;
    text-align: center;
    font-size: 12px;
    border-radius: 4px;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
  
  #selectedDatesDisplay .badge {
    padding: 0.5em 0.8em;
    border-radius: 20px;
  }
  
  #selectedDatesDisplay .btn-close-sm {
    padding: 0.25rem;
    font-size: 0.7rem;
  }
  
  .btn-close-sm:hover {
    background-color: rgba(0,0,0,0.1);
  }
  
  .multi-select-mode .day.selectable:hover {
    background: #d1e7ff;
  }
`;
document.head.appendChild(multiSelectCalendarStyle);

// Export fungsi-fungsi yang dibutuhkan
window.getMonthName = getMonthName;
window.getMonthIndex = getMonthIndex;
window.showToast = showToast;

async function loadTimOptions() {
  try {
    const response = await fetchAPI(API.timPengangkut, {
      headers: getAuthHeaders(),
    });

    const timList = response.data || response;
    const select = document.getElementById("filterTim");

    if (select) {
      // Clear existing options except first
      while (select.options.length > 1) {
        select.remove(1);
      }

      timList.forEach((tim) => {
        const option = document.createElement("option");
        option.value = tim.idTim || tim.id;
        option.textContent = tim.namaTim;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error loading tim options:", error);
  }
}

async function loadJadwal() {
  const filterDate = document.getElementById("filterDate")?.value || "";
  const filterTim = document.getElementById("filterTim")?.value || "";

  // Show loading spinner
  const loadingSpinner = document.getElementById("loadingSpinner");
  if (loadingSpinner) {
    loadingSpinner.classList.remove("d-none");
  }

  try {
    const jadwal = await fetchAPI(API.jadwal, {
      headers: getAuthHeaders(),
    });

    // Urutkan data berdasarkan tanggal dari yang terbaru ke terlama
    const sortedJadwal = jadwal.sort((a, b) => {
      const dateA = new Date(a.tanggalJadwal);
      const dateB = new Date(b.tanggalJadwal);
      return dateB - dateA; // Descending (terbaru ke terlama)
    });

    // Filter data berdasarkan filter yang dipilih
    const filteredJadwal = sortedJadwal.filter((j) => {
      const matchDate = !filterDate || j.tanggalJadwal === filterDate;
      
      // Filter bulan (format: YYYY-MM-DD, ambil bagian bulan MM)
      let matchMonth = true;
      if (filterMonth) {
        const jadwalMonth = j.tanggalJadwal ? j.tanggalJadwal.split('-')[1] : '';
        matchMonth = jadwalMonth === filterMonth;
      }
      
      const matchTim = !filterTim || j.idTim == filterTim;
      
      return matchDate && matchMonth && matchTim;
    });

    // Sortir ulang berdasarkan tanggal untuk tampilan yang berurutan
    const finalSortedJadwal = filteredJadwal.sort((a, b) => {
      const dateA = new Date(a.tanggalJadwal);
      const dateB = new Date(b.tanggalJadwal);
      return dateA - dateB; // Ascending (terlama ke terbaru)
    });

    // Simpan data ke variabel global dan render dengan pagination
    jadwalAllData = finalSortedJadwal;
    jadwalCurrentPage = 1;
    renderJadwalTableWithPagination();
    
  } catch (error) {
    console.error("Error loading jadwal:", error);
    const container = document.getElementById("jadwalTableContainer");
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger">
          <h5 class="alert-heading"><i class="bi bi-exclamation-triangle me-2"></i>Error Loading Data</h5>
          <p>${error.message || 'Gagal memuat data jadwal'}</p>
          <button onclick="loadJadwal()" class="btn btn-danger btn-sm">
            <i class="bi bi-arrow-clockwise me-1"></i>Coba Lagi
          </button>
        </div>
      `;
    }
    // Clear pagination on error
    document.getElementById("paginationContainer").innerHTML = "";
    document.getElementById("paginationInfo").innerHTML = "";
  } finally {
    // Hide loading spinner
    if (loadingSpinner) {
      loadingSpinner.classList.add("d-none");
    }
  }
}

function renderJadwalTable(jadwalList) {
  const container = document.getElementById("jadwalTableContainer");
  
  if (!container) {
    console.error("jadwalTableContainer element not found");
    return;
  }

  // Kelompokkan data berdasarkan bulan
  const groupedByMonth = {};
  jadwalList.forEach(jadwal => {
    if (!jadwal.tanggalJadwal) return;
    
    const date = new Date(jadwal.tanggalJadwal);
    const monthYear = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    
    if (!groupedByMonth[monthYear]) {
      groupedByMonth[monthYear] = [];
    }
    
    groupedByMonth[monthYear].push(jadwal);
  });

  // Urutkan bulan dari yang terbaru ke terlama
  const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => {
    const dateA = new Date(a.split(' ')[1], getMonthIndex(a.split(' ')[0]));
    const dateB = new Date(b.split(' ')[1], getMonthIndex(b.split(' ')[0]));
    return dateB - dateA; // Descending
  });

  let tableHTML = '';

  sortedMonths.forEach(monthYear => {
    const jadwalsInMonth = groupedByMonth[monthYear];
    
    // Urutkan jadwal dalam bulan berdasarkan tanggal
    jadwalsInMonth.sort((a, b) => {
      const dateA = new Date(a.tanggalJadwal);
      const dateB = new Date(b.tanggalJadwal);
      return dateA - dateB; // Ascending
    });

    tableHTML += `
      <div class="mb-4">
        <div class="card bg-light border-0 mb-2">
          <div class="card-body py-2">
            <h6 class="mb-0 fw-bold">
              <i class="bi bi-calendar-month me-2"></i>${monthYear}
              <span class="badge bg-secondary ms-2">${jadwalsInMonth.length} Jadwal</span>
            </h6>
          </div>
        </div>
        
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 50px;">No</th>
                <th>Tanggal</th>
                <th>Nama Tim</th>
                <th>Jumlah Anggota</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${jadwalsInMonth
                .map(
                  (jadwal, index) => `
                <tr>
                  <td class="text-center fw-semibold">${index + 1}</td>
                  <td>
                    <div class="fw-semibold">${formatDate(jadwal.tanggalJadwal)}</div>
                    <small class="text-muted">${getDayName(jadwal.tanggalJadwal)}</small>
                  </td>
                  <td>
                    <div class="fw-medium">${jadwal.nama_tim || "Tim"}</div>
                    <small class="text-muted">ID: ${jadwal.idTim}</small>
                  </td>
                  <td>
                    <span class="badge bg-secondary" id="count-${jadwal.idJadwal || jadwal.id}">
                      <i class="bi bi-people me-1"></i>
                      Loading...
                    </span>
                  </td>
                  <td>
                    <div class="btn-group" role="group">
                      <button onclick="viewDetailJadwal('${jadwal.idJadwal || jadwal.id}')" class="btn btn-sm btn-info" title="Detail">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button onclick="editJadwal('${jadwal.idJadwal || jadwal.id}')" class="btn btn-sm btn-warning" title="Edit">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button onclick="deleteJadwal('${jadwal.idJadwal || jadwal.id}')" class="btn btn-sm btn-danger" title="Hapus">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });

  container.innerHTML = tableHTML;

  // Load jumlah anggota untuk setiap jadwal
  jadwalList.forEach(jadwal => {
    loadAnggotaCount(jadwal.idJadwal || jadwal.id);
  });
}

function renderJadwalTableWithPagination() {
  const container = document.getElementById("jadwalTableContainer");
  const paginationInfo = document.getElementById("paginationInfo");
  
  if (!container) {
    console.error("jadwalTableContainer element not found");
    return;
  }

  if (!jadwalAllData || jadwalAllData.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-calendar-x fs-1 text-muted mb-3"></i>
        <h5 class="text-muted">Tidak ada data jadwal</h5>
        <p class="text-muted">Gunakan filter atau tambah jadwal baru</p>
      </div>
    `;
    paginationInfo.innerHTML = "";
    document.getElementById("paginationContainer").innerHTML = "";
    return;
  }

  // Hitung data untuk halaman saat ini
  const startIndex = (jadwalCurrentPage - 1) * jadwalPerPage;
  const endIndex = Math.min(startIndex + jadwalPerPage, jadwalAllData.length);
  const currentPageData = jadwalAllData.slice(startIndex, endIndex);
  
  // Update info pagination
  paginationInfo.innerHTML = `
    Menampilkan <strong>${startIndex + 1} - ${endIndex}</strong> dari <strong>${jadwalAllData.length}</strong> jadwal
  `;

  // Render tabel dengan data halaman saat ini
  renderJadwalTable(currentPageData);
  
  // Render pagination controls
  renderJadwalPaginationControls();
}

function renderJadwalPaginationControls() {
  const container = document.getElementById("paginationContainer");
  if (!container) return;

  const totalPages = Math.ceil(jadwalAllData.length / jadwalPerPage);
  
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = `
    <nav aria-label="Page navigation">
      <ul class="pagination justify-content-center mb-0">
        <!-- Previous Button -->
        <li class="page-item ${jadwalCurrentPage === 1 ? 'disabled' : ''}">
          <a class="page-link" href="javascript:void(0)" onclick="goToJadwalPage(${jadwalCurrentPage - 1})" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
          </a>
        </li>
  `;

  // Tampilkan maksimal 5 nomor halaman
  let startPage = Math.max(1, jadwalCurrentPage - 2);
  let endPage = Math.min(totalPages, jadwalCurrentPage + 2);
  
  // Adjust if near start
  if (jadwalCurrentPage <= 3) {
    endPage = Math.min(5, totalPages);
  }
  
  // Adjust if near end
  if (jadwalCurrentPage >= totalPages - 2) {
    startPage = Math.max(1, totalPages - 4);
  }
  
  // First page
  if (startPage > 1) {
    html += `
      <li class="page-item">
        <a class="page-link" href="javascript:void(0)" onclick="goToJadwalPage(1)">1</a>
      </li>
    `;
    if (startPage > 2) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }
  
  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    html += `
      <li class="page-item ${i === jadwalCurrentPage ? 'active' : ''}">
        <a class="page-link" href="javascript:void(0)" onclick="goToJadwalPage(${i})">${i}</a>
      </li>
    `;
  }
  
  // Last page
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
    html += `
      <li class="page-item">
        <a class="page-link" href="javascript:void(0)" onclick="goToJadwalPage(${totalPages})">${totalPages}</a>
      </li>
    `;
  }

  html += `
        <!-- Next Button -->
        <li class="page-item ${jadwalCurrentPage === totalPages ? 'disabled' : ''}">
          <a class="page-link" href="javascript:void(0)" onclick="goToJadwalPage(${jadwalCurrentPage + 1})" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
          </a>
        </li>
      </ul>
    </nav>
  `;

  container.innerHTML = html;
}

function goToJadwalPage(page) {
  if (page < 1 || page > Math.ceil(jadwalAllData.length / jadwalPerPage)) {
    return;
  }
  
  jadwalCurrentPage = page;
  renderJadwalTableWithPagination();
  
  // Scroll ke atas tabel
  document.getElementById("jadwalTableContainer").scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

async function loadAnggotaCount(jadwalId) {
  try {
    const detailAnggota = await fetchAPI(API.detailAnggotaJadwal, {
      headers: getAuthHeaders(),
    });

    const count = detailAnggota.filter((d) => d.idJadwal == jadwalId).length;
    const badge = document.getElementById(`count-${jadwalId}`);
    
    if (badge) {
      badge.innerHTML = `<i class="bi bi-people me-1"></i>${count}`;
      badge.className = `badge ${count === 0 ? 'bg-secondary' : 'bg-success'}`;
    }
  } catch (error) {
    console.error(`Error loading count for jadwal ${jadwalId}:`, error);
    const badge = document.getElementById(`count-${jadwalId}`);
    if (badge) {
      badge.innerHTML = `<i class="bi bi-exclamation-triangle me-1"></i>Error`;
      badge.className = 'badge bg-danger';
    }
  }
}

// Fungsi untuk format tanggal dengan hari
function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = getMonthName(date.getMonth());
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
}

function getDayName(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { weekday: 'long' });
  } catch {
    return '';
  }
}

function setupBootstrapValidation(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  // Hapus validasi built-in browser
  form.setAttribute('novalidate', true);
  
  // Hapus class was-validated jika ada
  form.classList.remove('was-validated');
  
  // Reset semua feedback
  form.querySelectorAll('.form-control, .form-select').forEach(element => {
    element.classList.remove('is-invalid', 'is-valid');
  });
  
  form.querySelectorAll('.invalid-feedback, .valid-feedback').forEach(element => {
    element.style.display = 'none';
  });
}

// Tambahkan fungsi untuk validasi manual
function validateForm(formId) {
  const form = document.getElementById(formId);
  let isValid = true;
  
  // Reset semua validasi sebelumnya
  form.querySelectorAll('.form-control, .form-select, .form-check-input').forEach(element => {
    element.classList.remove('is-invalid', 'is-valid');
    const feedback = element.nextElementSibling;
    if (feedback && (feedback.classList.contains('invalid-feedback') || feedback.classList.contains('valid-feedback'))) {
      feedback.style.display = 'none';
    }
  });
  
  // Validasi setiap input
  form.querySelectorAll('[required]').forEach(element => {
    // Skip hidden inputs jika tidak ada value
    if (element.type === 'hidden' && !element.value) {
      const nextFeedback = element.nextElementSibling;
      if (nextFeedback && nextFeedback.classList.contains('invalid-feedback')) {
        element.classList.add('is-invalid');
        nextFeedback.style.display = 'block';
        isValid = false;
      }
    } 
    // Validasi select
    else if (element.tagName === 'SELECT') {
      if (!element.value) {
        element.classList.add('is-invalid');
        const feedback = element.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
          feedback.style.display = 'block';
        }
        isValid = false;
      } else {
        element.classList.add('is-valid');
      }
    }
    // Validasi checkbox
    else if (element.type === 'checkbox') {
      if (!element.checked) {
        element.classList.add('is-invalid');
        const feedback = element.closest('.form-check').querySelector('.invalid-feedback');
        if (feedback) {
          feedback.style.display = 'block';
        }
        isValid = false;
      } else {
        element.classList.add('is-valid');
      }
    }
    // Validasi input lainnya
    else if (element.type !== 'hidden') {
      if (!element.value.trim()) {
        element.classList.add('is-invalid');
        const feedback = element.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
          feedback.style.display = 'block';
        }
        isValid = false;
      } else {
        element.classList.add('is-valid');
      }
    }
  });
  
  return isValid;
}

// Perbaiki fungsi showAddJadwalForm untuk menggunakan Bootstrap validation
function showAddJadwalForm() {
  // Show loading state
  // showModal("Tambah Jadwal Baru", `
  //   <div class="text-center py-4">
  //     <div class="spinner-border text-primary" role="status">
  //       <span class="visually-hidden">Loading...</span>
  //     </div>
  //     <p class="mt-2">Memuat data tim...</p>
  //   </div>
  // `, null, true);

  // Get tim untuk dropdown
  fetchAPI(API.timPengangkut, { headers: getAuthHeaders() })
    .then((response) => {
      const timList = response.data || response;
      
      if (!timList || timList.length === 0) {
        showModal("Tambah Jadwal Baru", `
          <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Tidak ada tim pengangkut yang tersedia. Silakan tambah tim terlebih dahulu.
          </div>
        `, null, true);
        return;
      }

      const timOptions = timList
        .map(
          (tim) =>
            `<option value="${tim.idTim || tim.id}">${tim.namaTim}</option>`
        )
        .join("");

      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      // Generate calendar HTML untuk multi-select
      const calendarHTML = generateMultiSelectCalendar(currentYear, currentMonth);
      
      const formHTML = `
        <form id="jadwalForm" novalidate>
          <div class="mb-3">
            <label for="idTim" class="form-label">Tim Pengangkut *</label>
            <select id="idTim" class="form-select" required>
              <option value="">Pilih Tim</option>
              ${timOptions}
            </select>
            <div class="invalid-feedback">Harap pilih tim pengangkut.</div>
            <div class="form-text">Pilih tim yang akan bertugas</div>
          </div>
          
          <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="form-label mb-0">Pilih Tanggal *</label>
              <button type="button" id="clearSelection" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-x-circle me-1"></i>Hapus Pilihan
              </button>
            </div>
            
            <div class="calendar-container mb-3">
              ${calendarHTML}
            </div>
            
            <input type="hidden" id="selectedDates" required>
            <div class="invalid-feedback">Harap pilih minimal satu tanggal.</div>
            
            <div id="selectedDatesDisplay" class="mt-3">
              <div class="alert alert-primary">
                <div class="d-flex align-items-center">
                  <i class="bi bi-calendar-check fs-5 me-2"></i>
                  <div>
                    <div class="fw-bold">Tanggal Terpilih: <span id="selectedCount" class="badge bg-primary">0</span></div>
                    <div id="datesList" class="mt-1 small"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="form-text">
              <i class="bi bi-info-circle me-1"></i>
              Klik tanggal untuk memilih/deselect.
            </div>
          </div>
          
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            Sistem akan membuat jadwal untuk setiap tanggal yang dipilih.
          </div>
        </form>
      `;

      showModal("Tambah Jadwal Baru", formHTML, async () => {
        // Lakukan validasi manual
        if (!validateForm('jadwalForm')) {
          return false;
        }

        const selectedDates = document.getElementById("selectedDates");
        const idTim = document.getElementById("idTim");

        const dates = JSON.parse(selectedDates.value);
        if (dates.length === 0) {
          // Tampilkan error pada input dates
          const datesInput = document.getElementById("selectedDates");
          const feedback = datesInput.nextElementSibling;
          if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.style.display = 'block';
          }
          return false;
        }

        if (dates.length > 30) {
          showToast('error', 'Maksimal 30 tanggal dalam satu kali input!');
          return false;
        }

        const jadwalData = {
          dates: dates,
          idTim: parseInt(idTim.value),
        };

        try {
          // Tampilkan loading saat submit
          const submitBtn = document.querySelector('.modal-footer .btn-primary');
          const originalText = submitBtn.innerHTML;
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
          submitBtn.disabled = true;

          // Kirim multiple schedules
          const results = await createMultipleSchedules(jadwalData);
          
          if (results.success > 0) {
            showToast('success', `Berhasil membuat ${results.success} jadwal!`);
            if (results.failed > 0) {
              showToast('warning', `${results.failed} jadwal gagal dibuat.`);
            }
          } else {
            showToast('error', 'Gagal membuat semua jadwal');
          }
          
          loadJadwal();
          return true;
        } catch (error) {
          console.error("Error menambahkan jadwal:", error);
          showToast('error', 'Error menambahkan jadwal: ' + error.message);
          return false;
        }
      }, true);

      // Setup calendar event listeners setelah modal ditampilkan
      setTimeout(() => {
        setupMultiSelectCalendarEvents();
        
        // Tambahkan event listener untuk real-time validation
        const idTimSelect = document.getElementById('idTim');
        if (idTimSelect) {
          idTimSelect.addEventListener('change', function() {
            if (this.value) {
              this.classList.remove('is-invalid');
              this.classList.add('is-valid');
              const feedback = this.nextElementSibling;
              if (feedback && feedback.classList.contains('invalid-feedback')) {
                feedback.style.display = 'none';
              }
            }
          });
        }
      }, 100);
    })
    .catch((error) => {
      console.error("Error loading tim:", error);
      showModal("Tambah Jadwal Baru", `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Gagal memuat data tim: ${error.message}
        </div>
      `, null, true);
    });
}

// Perbaiki fungsi editJadwal untuk menggunakan Bootstrap validation
async function editJadwal(jadwalId) {
  try {
    // // Show loading modal
    // showModal("Edit Jadwal", `
    //   <div class="text-center py-4">
    //     <div class="spinner-border text-primary" role="status">
    //       <span class="visually-hidden">Loading...</span>
    //     </div>
    //     <p class="mt-2">Memuat data jadwal...</p>
    //   </div>
    // `, null, true);

    // Ambil data jadwal dan tim secara bersamaan
    const [jadwalResponse, timResponse] = await Promise.all([
      fetchAPI(`${API.jadwal}${jadwalId}/`, {
        headers: getAuthHeaders(),
      }),
      fetchAPI(API.timPengangkut, {
        headers: getAuthHeaders(),
      })
    ]);

    const jadwal = jadwalResponse;
    const timList = timResponse.data || timResponse;

    if (!timList || timList.length === 0) {
      showModal("Edit Jadwal", `
        <div class="alert alert-warning">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Tidak ada tim pengangkut yang tersedia.
        </div>
      `, null, true);
      return;
    }

    // Format tanggal untuk input date (YYYY-MM-DD)
    const tanggalJadwal = jadwal.tanggalJadwal ? 
      jadwal.tanggalJadwal.split('T')[0] : 
      new Date().toISOString().split('T')[0];
    
    // Parse tanggal untuk kalender
    const jadwalDate = new Date(tanggalJadwal);
    const jadwalYear = jadwalDate.getFullYear();
    const jadwalMonth = jadwalDate.getMonth();
    const jadwalDay = jadwalDate.getDate();

    // Buat options untuk tim pengangkut
    const timOptions = timList
      .map((tim) => {
        const timId = tim.idTim || tim.id;
        const isSelected = timId == jadwal.idTim;
        return `<option value="${timId}" ${isSelected ? 'selected' : ''}>${tim.namaTim}</option>`;
      })
      .join("");

    // Generate calendar untuk SINGLE DATE SELECTION
    const calendarHTML = generateSingleSelectCalendar(jadwalYear, jadwalMonth, tanggalJadwal);

    // Form untuk edit SATU tanggal saja dengan Bootstrap validation
    const formHTML = `
      <form id="editJadwalForm" novalidate>
        <input type="hidden" id="jadwalId" value="${jadwalId}">
        
        <div class="mb-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <label class="form-label mb-0">Pilih Tanggal Baru *</label>
            <small class="text-muted">Klik tanggal untuk memilih</small>
          </div>
          
          <div class="calendar-container mb-3">
            ${calendarHTML}
          </div>
          
          <input type="hidden" id="selectedDate" value="${tanggalJadwal}" required>
          <div class="invalid-feedback">Harap pilih tanggal.</div>
          
          <div id="selectedDateDisplay" class="mt-3">
            <div class="alert alert-primary">
              <div class="d-flex align-items-center">
                <i class="bi bi-calendar-check fs-5 me-2"></i>
                <div>
                  <div class="fw-bold">Tanggal Terpilih:</div>
                  <div id="dateValue" class="mt-1 fw-semibold">
                    ${formatDate(tanggalJadwal)} (${getDayName(tanggalJadwal)})
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="mb-3">
          <label for="idTim" class="form-label">Tim Pengangkut *</label>
          <select id="idTim" class="form-select" required>
            <option value="">Pilih Tim Pengangkut</option>
            ${timOptions}
          </select>
          <div class="invalid-feedback">Harap pilih tim pengangkut.</div>
          <div class="form-text">Pilih tim yang akan bertugas pada tanggal tersebut</div>
        </div>
        
        <div class="alert alert-info">
          <i class="bi bi-info-circle me-2"></i>
          Anda hanya mengedit <strong>satu jadwal</strong> ini saja. Tanggal yang dipilih akan menggantikan tanggal sebelumnya.
        </div>
      </form>
    `;

    // Show modal dengan form
    showModal("Edit Jadwal", formHTML, async () => {
      // Lakukan validasi manual
      if (!validateForm('editJadwalForm')) {
        return false;
      }

      const selectedDateInput = document.getElementById("selectedDate");
      const idTimSelect = document.getElementById("idTim");

      // Cek apakah ada perubahan
      const originalDate = tanggalJadwal;
      const originalTim = jadwal.idTim;
      const newDate = selectedDateInput.value;
      const newTim = parseInt(idTimSelect.value);

      if (originalDate === newDate && originalTim == newTim) {
        showToast('info', 'Tidak ada perubahan yang dilakukan.');
        return false;
      }

      // Buat data untuk update
      const jadwalData = {
        tanggalJadwal: newDate,
        idTim: newTim,
      };

      try {
        // Tampilkan loading saat menyimpan
        const submitBtn = document.querySelector('.modal-footer .btn-primary');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
        submitBtn.disabled = true;

        // Kirim request update
        await fetchAPI(`${API.jadwal}${jadwalId}/`, {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(jadwalData),
        });

        // Tampilkan pesan sukses menggunakan toast
        showToast('success', 'Jadwal berhasil diperbarui!');
        
        // Refresh data jadwal
        loadJadwal();
        
        return true;
      } catch (error) {
        console.error("Error updating jadwal:", error);
        showToast('error', 'Gagal memperbarui jadwal: ' + error.message);
        return false;
      }
    }, true);

    // Setup event listener untuk kalender single select
    setTimeout(() => {
      setupSingleSelectCalendarEvents(tanggalJadwal);
      
      // Tambahkan real-time validation untuk select
      const idTimSelect = document.getElementById('idTim');
      if (idTimSelect) {
        idTimSelect.addEventListener('change', function() {
          if (this.value) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
            const feedback = this.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
              feedback.style.display = 'none';
            }
          }
        });
      }
    }, 100);

  } catch (error) {
    console.error("Error loading jadwal data:", error);
    showModal("Edit Jadwal", `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Gagal memuat data jadwal: ${error.message}
      </div>
    `, null, true);
  }
}

// Perbaiki fungsi setupMultiSelectCalendarEvents untuk update validation
function setupMultiSelectCalendarEvents() {
  let selectedDates = new Set();
  
  // Update display
  function updateSelectedDatesDisplay() {
    const countEl = document.getElementById('selectedCount');
    const listEl = document.getElementById('datesList');
    const hiddenInput = document.getElementById('selectedDates');
    
    if (countEl) countEl.textContent = selectedDates.size;
    
    if (listEl) {
      if (selectedDates.size === 0) {
        listEl.innerHTML = '<span class="text-muted fst-italic">Belum ada tanggal dipilih</span>';
        // Tampilkan error jika belum ada tanggal yang dipilih
        if (hiddenInput) {
          hiddenInput.classList.add('is-invalid');
          const feedback = hiddenInput.nextElementSibling;
          if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.style.display = 'block';
          }
        }
      } else {
        const datesArray = Array.from(selectedDates).sort();
        const formattedDates = datesArray.map(date => {
          const d = new Date(date);
          return `
            <span class="badge bg-primary text-white me-1 mb-1">
              ${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              <button type="button" class="btn-close btn-close-white ms-1" 
                      onclick="removeDate('${date}', event)"></button>
            </span>
          `;
        }).join('');
        listEl.innerHTML = formattedDates;
        
        // Hapus error jika sudah ada tanggal yang dipilih
        if (hiddenInput) {
          hiddenInput.classList.remove('is-invalid');
          hiddenInput.classList.add('is-valid');
          const feedback = hiddenInput.nextElementSibling;
          if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.style.display = 'none';
          }
        }
      }
    }
    
    if (hiddenInput) {
      hiddenInput.value = JSON.stringify(Array.from(selectedDates));
    }
  }
  
  // Remove date function (accessible globally)
  window.removeDate = function(date, event) {
    event?.stopPropagation();
    selectedDates.delete(date);
    
    // Update UI
    const dayEl = document.querySelector(`.day[data-date="${date}"]`);
    if (dayEl) dayEl.classList.remove('selected');
    
    updateSelectedDatesDisplay();
  };
  
  // Event listener untuk pilih tanggal
  document.querySelectorAll('.calendar-days .selectable').forEach(day => {
    day.addEventListener('click', function(e) {
      const date = this.getAttribute('data-date');
      
      // Toggle selection (tambah atau hapus)
      if (selectedDates.has(date)) {
        selectedDates.delete(date);
        this.classList.remove('selected');
      } else {
        selectedDates.add(date);
        this.classList.add('selected');
      }
      
      updateSelectedDatesDisplay();
    });
    
    // Add hover effect
    day.addEventListener('mouseenter', function() {
      if (!this.classList.contains('selected')) {
        this.classList.add('hover');
      }
    });
    
    day.addEventListener('mouseleave', function() {
      this.classList.remove('hover');
    });
  });
  
  // Clear selection button
  document.getElementById('clearSelection')?.addEventListener('click', function() {
    selectedDates.clear();
    document.querySelectorAll('.calendar-days .selected').forEach(selected => {
      selected.classList.remove('selected');
    });
    updateSelectedDatesDisplay();
  });
  
  // Event listener untuk navigasi bulan
  document.querySelector('.prev-month')?.addEventListener('click', function() {
    const header = this.closest('.calendar-header').querySelector('h6');
    const [monthName, year] = header.textContent.split(' ');
    const monthIndex = getMonthIndex(monthName);
    
    let newYear = parseInt(year);
    let newMonth = monthIndex - 1;
    
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    
    // Save current selections before updating
    const currentSelections = new Set(selectedDates);
    
    updateMultiSelectCalendarGrid(newYear, newMonth, currentSelections);
    
    // Update local selectedDates dengan data yang baru
    selectedDates = currentSelections;
  });
  
  document.querySelector('.next-month')?.addEventListener('click', function() {
    const header = this.closest('.calendar-header').querySelector('h6');
    const [monthName, year] = header.textContent.split(' ');
    const monthIndex = getMonthIndex(monthName);
    
    let newYear = parseInt(year);
    let newMonth = monthIndex + 1;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    
    // Save current selections before updating
    const currentSelections = new Set(selectedDates);
    
    updateMultiSelectCalendarGrid(newYear, newMonth, currentSelections);
    
    // Update local selectedDates dengan data yang baru
    selectedDates = currentSelections;
  });
}

function generateMultiSelectCalendar(year, month) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Nama hari (Indonesia)
  const dayNames = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];
  
  let calendarHTML = `
    <div class="calendar-grid multi-select">
      <div class="calendar-header d-flex justify-content-between align-items-center mb-3">
        <button class="btn btn-sm btn-outline-secondary prev-month" type="button" title="Bulan sebelumnya">
          <i class="bi bi-chevron-left"></i>
        </button>
        <h6 class="mb-0 fw-bold">${getMonthName(month)} ${year}</h6>
        <button class="btn btn-sm btn-outline-secondary next-month" type="button" title="Bulan selanjutnya">
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
      
      <div class="days-of-week d-flex mb-2">
        ${dayNames.map(day => `
          <div class="day-header text-center fw-semibold text-muted small flex-fill py-1">${day}</div>
        `).join('')}
      </div>
      
      <div class="calendar-days">
  `;
  
  // Tambah sel kosong untuk hari-hari sebelum tanggal 1
  for (let i = 0; i < startingDay; i++) {
    calendarHTML += '<div class="day empty"></div>';
  }
  
  // Tambah hari-hari dalam bulan
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = year === currentYear && month === currentMonth && day === currentDate;
    const isPast = (year < currentYear) || 
                   (year === currentYear && month < currentMonth) || 
                   (year === currentYear && month === currentMonth && day < currentDate);
    
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    calendarHTML += `
      <div class="day ${isToday ? 'today' : ''} ${isPast ? 'past disabled' : 'selectable'}" 
           data-date="${dateStr}"
           ${isPast ? 'title="Tanggal sudah lewat"' : 'title="Klik untuk memilih"'}>
        ${day}
        <div class="day-checkmark">
          <i class="bi bi-check-circle-fill"></i>
        </div>
      </div>
    `;
  }
  
  calendarHTML += `
      </div>
    </div>
  `;
  
  return calendarHTML;
}

function updateMultiSelectCalendarGrid(year, month, selectedDatesSet) {
  const calendarHTML = generateMultiSelectCalendar(year, month);
  const calendarContainer = document.querySelector('.calendar-container');
  
  if (calendarContainer) {
    calendarContainer.innerHTML = calendarHTML;
    
    // Setup events first
    setupMultiSelectCalendarEvents();
    
    // Then restore selections
    if (selectedDatesSet && selectedDatesSet.size > 0) {
      // We need to wait a bit for DOM to be ready
      setTimeout(() => {
        selectedDatesSet.forEach(date => {
          const dayEl = document.querySelector(`.day[data-date="${date}"]`);
          if (dayEl && !dayEl.classList.contains('disabled')) {
            dayEl.classList.add('selected');
          }
        });
        
        // Update the global selected dates
        const hiddenInput = document.getElementById('selectedDates');
        if (hiddenInput) {
          hiddenInput.value = JSON.stringify(Array.from(selectedDatesSet));
        }
        
        // Update display
        const countEl = document.getElementById('selectedCount');
        const listEl = document.getElementById('datesList');
        
        if (countEl) countEl.textContent = selectedDatesSet.size;
        if (listEl) {
          const datesArray = Array.from(selectedDatesSet).sort();
          const formattedDates = datesArray.map(date => {
            const d = new Date(date);
            return `
              <span class="badge bg-primary text-white me-1 mb-1">
                ${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                <button type="button" class="btn-close btn-close-white ms-1" 
                        onclick="removeDate('${date}', event)"></button>
              </span>
            `;
          }).join('');
          listEl.innerHTML = formattedDates;
        }
      }, 50);
    }
  }
  
  return selectedDatesSet;
}

async function createMultipleSchedules(jadwalData) {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  // Tampilkan progress modal
  showModal("Membuat Jadwal", `
    <div class="text-center py-4">
      <div class="spinner-border text-primary mb-3" role="status"></div>
      <h5>Membuat Jadwal...</h5>
      <p class="text-muted">Sedang memproses ${jadwalData.dates.length} tanggal</p>
      <div class="progress mt-3" style="height: 6px;">
        <div class="progress-bar progress-bar-striped progress-bar-animated" 
             style="width: 0%" id="progressBar"></div>
      </div>
      <div class="mt-2 small text-muted" id="progressText">Memulai...</div>
    </div>
  `, null, false);
  
  try {
    for (let i = 0; i < jadwalData.dates.length; i++) {
      const date = jadwalData.dates[i];
      
      // Update progress
      const progress = Math.round((i + 1) / jadwalData.dates.length * 100);
      const progressBar = document.getElementById('progressBar');
      const progressText = document.getElementById('progressText');
      
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (progressText) {
        progressText.textContent = `Memproses ${i + 1} dari ${jadwalData.dates.length}: ${date}`;
      }
      
      try {
        const scheduleData = {
          tanggalJadwal: date,
          idTim: jadwalData.idTim,
        };
        
        await fetchAPI(API.jadwal, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(scheduleData),
        });
        
        results.success++;
      } catch (error) {
        console.error(`Error creating schedule for ${date}:`, error);
        results.failed++;
        results.errors.push({
          date: date,
          error: error.message
        });
      }
      
      // Small delay to avoid overwhelming server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Close progress modal
    document.querySelector('.modal .btn-close')?.click();
    
    return results;
  } catch (error) {
    console.error("Error in createMultipleSchedules:", error);
    document.querySelector('.modal .btn-close')?.click();
    throw error;
  }
}

async function viewDetailJadwal(jadwalId) {
  try {
    // Show loading modal
    showModal("Detail Jadwal", `
      <div class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Memuat detail jadwal...</p>
      </div>
    `, null, true);

    const jadwal = await fetchAPI(`${API.jadwal}${jadwalId}/`, {
      headers: getAuthHeaders(),
    });

    const detailHTML = `
      <div>
        <div class="card mb-4">
          <div class="card-header bg-primary text-white">
            <h5 class="card-title mb-0">Informasi Jadwal</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-6">
                <dl>
                  <dt>ID Jadwal</dt>
                  <dd class="mb-3">#${jadwal.idJadwal || jadwal.id}</dd>
                  
                  <dt>Tanggal</dt>
                  <dd class="mb-3">
                    <div class="fw-bold">${formatDate(jadwal.tanggalJadwal)}</div>
                    <small class="text-muted">${getDayName(jadwal.tanggalJadwal)}</small>
                  </dd>
                </dl>
              </div>
              <div class="col-md-6">
                <dl>
                  <dt>Tim Pengangkut</dt>
                  <dd class="mb-3">
                    <div class="fw-bold">${jadwal.nama_tim || "N/A"}</div>
                    <small class="text-muted">ID: ${jadwal.idTim}</small>
                  </dd>
                  
                  <dt>Jumlah Anggota</dt>
                  <dd class="mb-3">
                    <span class="badge bg-success" id="detailCount">
                      <i class="bi bi-people me-1"></i>
                      Loading...
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">Anggota Terjadwal</h5>
            <span class="badge bg-white text-info" id="anggotaCount">Loading...</span>
          </div>
          <div class="card-body">
            <div id="anggotaJadwalList">
              <div class="text-center py-3">
                <div class="spinner-border spinner-border-sm text-info" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted">Memuat data anggota...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Update modal with jadwal details
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) {
      modalBody.innerHTML = detailHTML;
      
      // Load count dan data anggota
      loadAnggotaCountForDetail(jadwalId);
      loadAnggotaForJadwal(jadwalId);
    }
  } catch (error) {
    console.error("Error loading detail:", error);
    showModal("Detail Jadwal", `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Gagal memuat detail jadwal: ${error.message}
      </div>
    `, null, true);
  }
}

async function loadAnggotaCountForDetail(jadwalId) {
  try {
    const detailAnggota = await fetchAPI(API.detailAnggotaJadwal, {
      headers: getAuthHeaders(),
    });

    // Filter berdasarkan idJadwal atau jadwal_id
    const count = detailAnggota.filter((d) => 
      d.idJadwal == jadwalId || d.jadwal_id == jadwalId
    ).length;
    
    const badge = document.getElementById('detailCount');
    
    if (badge) {
      badge.innerHTML = `<i class="bi bi-people me-1"></i>${count} Anggota`;
    }
  } catch (error) {
    console.error(`Error loading count for detail:`, error);
  }
}

async function loadAnggotaForJadwal(jadwalId) {
  try {
    const detailAnggota = await fetchAPI(API.detailAnggotaJadwal, {
      headers: getAuthHeaders(),
    });

    const filtered = detailAnggota.filter((d) => d.idJadwal == jadwalId);
    const container = document.getElementById("anggotaJadwalList");
    const countBadge = document.getElementById("anggotaCount");

    if (!container) return;

    if (!filtered || filtered.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4">
          <i class="bi bi-people fs-1 text-muted mb-3"></i>
          <h6 class="text-muted">Belum ada anggota terjadwal</h6>
          <p class="text-muted small">Tambahkan anggota ke jadwal ini melalui menu Detail Jadwal</p>
        </div>
      `;
      if (countBadge) {
        countBadge.textContent = "0 Anggota";
      }
    } else {
      container.innerHTML = `
        <div class="table-responsive">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Nama Anggota</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filtered
                .map(
                  (d) => `
                  <tr>
                    <td>
                      <div class="fw-medium">${d.nama_anggota || "Anggota"}</div>
                      <small class="text-muted">ID: ${d.idAnggota}</small>
                    </td>
                    <td>
                      <span class="badge ${getStatusAnggotaBadge(d.status_pengangkutan)}">
                        ${d.status_pengangkutan || "terjadwal"}
                      </span>
                    </td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
      if (countBadge) {
        countBadge.textContent = `${filtered.length} Anggota`;
      }
    }
  } catch (error) {
    console.error("Error loading anggota:", error);
    const container = document.getElementById("anggotaJadwalList");
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Gagal memuat data anggota: ${error.message}
        </div>
      `;
    }
  }
}

function getStatusAnggotaBadge(status) {
  // ⭐ KEEP - ini untuk DetailAnggotaJadwal, bukan Jadwal
  switch(status?.toLowerCase()) {
    case 'selesai':
      return 'bg-success';
    case 'dalam_proses':
      return 'bg-warning';
    case 'dibatalkan':
      return 'bg-danger';
    case 'tertunda':
      return 'bg-secondary';
    default:
      return 'bg-info';
  }
}

// Fungsi untuk membuat kalender dengan single date selection
function generateSingleSelectCalendar(year, month, selectedDate = '') {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Parse selected date jika ada
  let selectedDay = 0;
  if (selectedDate) {
    const selected = new Date(selectedDate);
    if (selected.getFullYear() === year && selected.getMonth() === month) {
      selectedDay = selected.getDate();
    }
  }
  
  // Nama hari (Indonesia)
  const dayNames = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];
  
  let calendarHTML = `
    <div class="calendar-grid single-select">
      <div class="calendar-header d-flex justify-content-between align-items-center mb-3">
        <button class="btn btn-sm btn-outline-secondary prev-month" type="button" title="Bulan sebelumnya">
          <i class="bi bi-chevron-left"></i>
        </button>
        <h6 class="mb-0 fw-bold">${getMonthName(month)} ${year}</h6>
        <button class="btn btn-sm btn-outline-secondary next-month" type="button" title="Bulan selanjutnya">
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
      
      <div class="days-of-week d-flex mb-2">
        ${dayNames.map(day => `
          <div class="day-header text-center fw-semibold text-muted small flex-fill py-1">${day}</div>
        `).join('')}
      </div>
      
      <div class="calendar-days">
  `;
  
  // Tambah sel kosong untuk hari-hari sebelum tanggal 1
  for (let i = 0; i < startingDay; i++) {
    calendarHTML += '<div class="day empty"></div>';
  }
  
  // Tambah hari-hari dalam bulan
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = year === currentYear && month === currentMonth && day === currentDate;
    const isSelected = day === selectedDay;
    const isPast = (year < currentYear) || 
                   (year === currentYear && month < currentMonth) || 
                   (year === currentYear && month === currentMonth && day < currentDate);
    
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    calendarHTML += `
      <div class="day ${isToday ? 'today' : ''} ${isPast ? 'past disabled' : 'selectable'} ${isSelected ? 'selected' : ''}" 
           data-date="${dateStr}"
           ${isPast ? 'title="Tanggal sudah lewat"' : 'title="Klik untuk memilih"'}>
        ${day}
        <div class="day-checkmark">
          <i class="bi bi-check-circle-fill"></i>
        </div>
      </div>
    `;
  }
  
  calendarHTML += `
      </div>
    </div>
  `;
  
  return calendarHTML;
}

// Setup event listener untuk kalender single select
function setupSingleSelectCalendarEvents(initialDate = '') {
  let selectedDate = initialDate || '';
  
  // Update display function
  function updateSelectedDateDisplay(date) {
    const hiddenInput = document.getElementById('selectedDate');
    const displayEl = document.getElementById('dateValue');
    
    if (hiddenInput && date) {
      hiddenInput.value = date;
    }
    
    if (displayEl && date) {
      const d = new Date(date);
      displayEl.innerHTML = `
        ${formatDate(date)}<br>
        <small class="text-muted">(${getDayName(date)})</small>
      `;
    }
  }
  
  // Event listener untuk pilih tanggal (SINGLE SELECT)
  document.querySelectorAll('.calendar-days .selectable').forEach(day => {
    day.addEventListener('click', function(e) {
      const date = this.getAttribute('data-date');
      
      // Hapus selected class dari semua tanggal
      document.querySelectorAll('.calendar-days .selected').forEach(selectedDay => {
        selectedDay.classList.remove('selected');
      });
      
      // Set selected class ke tanggal yang diklik
      this.classList.add('selected');
      selectedDate = date;
      
      updateSelectedDateDisplay(date);
    });
    
    // Add hover effect
    day.addEventListener('mouseenter', function() {
      if (!this.classList.contains('selected')) {
        this.classList.add('hover');
      }
    });
    
    day.addEventListener('mouseleave', function() {
      this.classList.remove('hover');
    });
  });
  
  // Event listener untuk navigasi bulan
  document.querySelector('.prev-month')?.addEventListener('click', function() {
    const header = this.closest('.calendar-header').querySelector('h6');
    const [monthName, year] = header.textContent.split(' ');
    const monthIndex = getMonthIndex(monthName);
    
    let newYear = parseInt(year);
    let newMonth = monthIndex - 1;
    
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    
    updateSingleSelectCalendarGrid(newYear, newMonth, selectedDate);
  });
  
  document.querySelector('.next-month')?.addEventListener('click', function() {
    const header = this.closest('.calendar-header').querySelector('h6');
    const [monthName, year] = header.textContent.split(' ');
    const monthIndex = getMonthIndex(monthName);
    
    let newYear = parseInt(year);
    let newMonth = monthIndex + 1;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    
    updateSingleSelectCalendarGrid(newYear, newMonth, selectedDate);
  });
  
  // Update display awal
  if (selectedDate) {
    updateSelectedDateDisplay(selectedDate);
  }
}

function updateSingleSelectCalendarGrid(year, month, selectedDate = '') {
  const calendarHTML = generateSingleSelectCalendar(year, month, selectedDate);
  const calendarContainer = document.querySelector('.calendar-container');
  
  if (calendarContainer) {
    calendarContainer.innerHTML = calendarHTML;
    
    // Setup events
    setupSingleSelectCalendarEvents(selectedDate);
  }
}

// CSS untuk single select calendar
const singleSelectCalendarStyle = document.createElement('style');
singleSelectCalendarStyle.textContent = `
  .calendar-grid.single-select {
    background: white;
    border-radius: 10px;
    padding: 15px;
    box-shadow: 0 3px 12px rgba(0,0,0,0.08);
    border: 1px solid #e9ecef;
  }
  
  .calendar-grid.single-select .day.selected {
    background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
    color: white;
    font-weight: bold;
    border-color: #0a58ca;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
  }
  
  .calendar-grid.single-select .day.selectable:hover:not(.selected) {
    background: #e3f2fd;
    border-color: #0d6efd;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
`;
document.head.appendChild(singleSelectCalendarStyle);

async function deleteJadwal(jadwalId) {
  // Buat message HTML yang benar
  const messageHTML = `
    <div class="alert alert-warning">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      <strong>Perhatian!</strong>
      <p class="mt-2 mb-0">Apakah Anda yakin ingin menghapus jadwal ini?</p>
      <p class="mb-0">Semua data anggota yang terkait dengan jadwal ini juga akan dihapus.</p>
    </div>
    <p class="text-muted">Aksi ini tidak dapat dibatalkan.</p>
  `;
  
  // Define the onConfirm function
  const onConfirm = async () => {
    try {
      await fetchAPI(`${API.jadwal}${jadwalId}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      showToast('success', 'Jadwal berhasil dihapus!');
      
      setTimeout(() => {
        loadJadwal();
      }, 1500);
    } catch (error) {
      console.error("Error deleting jadwal:", error);
      showModal("Error", `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Gagal menghapus jadwal: ${error.message}
        </div>
      `, null, true);
    }
  };
  
  // Panggil showConfirmModal dengan 2 parameter yang benar
  showConfirmModal(messageHTML, onConfirm);
}

window.goToJadwalPage = goToJadwalPage;
window.viewDetailJadwal = viewDetailJadwal;
window.editJadwal = editJadwal;
window.deleteJadwal = deleteJadwal;
window.showAddJadwalForm = showAddJadwalForm;
window.loadJadwal = loadJadwal;