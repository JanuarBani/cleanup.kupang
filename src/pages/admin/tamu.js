import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showModal, showConfirmModal } from "../../utils/modal.js";
import { showToast } from '../../utils/toast.js';

// Pagination variables
let tamuAllData = [];
let tamuCurrentPage = 1;
let tamuPerPage = 10;

// ===== FUNGSI VALIDASI FORM =====
function setupFormValidation() {
  // Cegah submit default
  const forms = document.querySelectorAll('.needs-validation');
  
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      form.classList.add('was-validated');
    }, false);
  });
  
  // Setup real-time validation
  setupRealTimeValidation();
}

function setupRealTimeValidation() {
  const forms = document.querySelectorAll('.needs-validation');
  
  forms.forEach(form => {
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        validateField(input);
      });
      
      input.addEventListener('input', () => {
        if (input.classList.contains('is-invalid')) {
          validateField(input);
        }
      });
    });
  });
}

function validateField(field) {
  if (field.checkValidity()) {
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
  } else {
    field.classList.remove('is-valid');
    field.classList.add('is-invalid');
  }
}

// Fungsi untuk reset validation state
function resetFormValidation(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.classList.remove('was-validated');
    const inputs = form.querySelectorAll('.is-valid, .is-invalid');
    inputs.forEach(input => {
      input.classList.remove('is-valid', 'is-invalid');
    });
  }
}

export async function tamuAdminPage() {
  const mainContent = document.getElementById("mainContent");
  
  if (!document.getElementById('modalContainer')) {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modalContainer';
    document.body.appendChild(modalContainer);
  }
  
  mainContent.innerHTML = `
    <div class="tamu-admin-page">
      <!-- Header -->
      <div class="card border-primary mb-4 shadow-sm">
        <div class="card-body p-4">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="text-primary fw-bold mb-1">
                <i class="bi bi-people-fill me-2"></i>Manajemen Tamu
              </h2>
              <p class="text-muted mb-0">Kelola data tamu yang mengunjungi sistem</p>
            </div>
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
                  <i class="bi bi-search text-primary"></i>
                </span>
                <input type="text" id="searchTamu" class="form-control border-start-0" placeholder="Cari nama tamu...">
              </div>
            </div>
            <div class="col-md-3">
              <select id="filterJK" class="form-select">
                <option value="">Semua Jenis Kelamin</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div class="col-md-3">
              <select id="filterUser" class="form-select">
                <option value="">Semua Status</option>
                <option value="withUser">Sudah Punya User</option>
                <option value="withoutUser">Belum Punya User</option>
              </select>
            </div>
            <div class="col-md-2">
              <button id="clearFilters" class="btn btn-outline-secondary w-100">
                <i class="bi bi-x-circle me-1"></i>Reset
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Tabel Tamu -->
      <div class="card border-0 shadow-sm">
        <div class="card-body p-0">
          <div id="tamuTableContainer" class="table-responsive">
            <div class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-3 text-muted">Memuat data tamu...</p>
            </div>
          </div>
          <div id="tamuPagination" class="p-3 border-top"></div>
        </div>
      </div>
    </div>
  `;

  // Event listeners
  document.getElementById("searchTamu").oninput = loadTamu;
  document.getElementById("filterJK").onchange = loadTamu;
  document.getElementById("filterUser").onchange = loadTamu;
  document.getElementById("clearFilters").onclick = clearFilters;

  // Load initial data
  loadTamu();
}

function clearFilters() {
  document.getElementById("searchTamu").value = "";
  document.getElementById("filterJK").value = "";
  document.getElementById("filterUser").value = "";
  tamuCurrentPage = 1; // Reset to first page
  loadTamu();
}

async function loadTamu() {
  const search = document.getElementById("searchTamu").value;
  const filterJK = document.getElementById("filterJK").value;
  const filterUser = document.getElementById("filterUser").value;

  try {
    const tamu = await fetchAPI(API.tamu, {
      headers: getAuthHeaders(),
    });

    // Simpan semua data ke variabel global
    tamuAllData = tamu.filter((t) => {
      const matchSearch = t.nama?.toLowerCase().includes(search.toLowerCase());
      const matchJK = !filterJK || t.jk === filterJK;
      const matchUser =
        !filterUser ||
        (filterUser === "withUser" && t.idUser) ||
        (filterUser === "withoutUser" && !t.idUser);
      return matchSearch && matchJK && matchUser;
    });

    // Reset ke halaman 1 saat filter berubah
    tamuCurrentPage = 1;

    // Render tabel dan pagination
    renderTamuTable();
  } catch (error) {
    console.error("Error loading tamu:", error);
    document.getElementById("tamuTableContainer").innerHTML = `
      <div class="alert alert-danger m-3">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        Error loading tamu: ${error.message}
      </div>
    `;
    document.getElementById("tamuPagination").innerHTML = "";
  }
}

function renderTamuTable() {
  const container = document.getElementById("tamuTableContainer");
  const paginationContainer = document.getElementById("tamuPagination");

  if (!container) return;

  // Hitung data yang akan ditampilkan
  const totalData = tamuAllData.length;
  const totalPages = Math.ceil(totalData / tamuPerPage);

  // Validasi halaman saat ini
  if (tamuCurrentPage > totalPages && totalPages > 0) {
    tamuCurrentPage = totalPages;
  }
  
  // Jika tidak ada data, reset ke halaman 1
  if (totalData === 0) {
    tamuCurrentPage = 1;
  }

  // Ambil data untuk halaman saat ini
  const startIndex = (tamuCurrentPage - 1) * tamuPerPage;
  const endIndex = Math.min(startIndex + tamuPerPage, totalData);
  const currentPageData = tamuAllData.slice(startIndex, endIndex);

  // Hitung angka untuk display
  const startData = totalData > 0 ? startIndex + 1 : 0;
  const endData = endIndex;

  // Tampilkan pesan jika tidak ada data
  if (totalData === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-people text-muted mb-3" style="font-size: 3rem;"></i>
        <h5 class="text-muted">Tidak ada data tamu</h5>
        <p class="text-muted">Coba ubah filter pencarian</p>
      </div>
    `;
    paginationContainer.innerHTML = "";
    return;
  }

  // Buat tabel HTML
  const tableHTML = `
    <table class="table table-hover mb-0">
      <thead class="table-light">
        <tr>
          <th scope="col" class="ps-4">No</th>
          <th scope="col">ID Tamu</th>
          <th scope="col">Nama</th>
          <th scope="col">Jenis Kelamin</th>
          <th scope="col">User ID</th>
          <th scope="col">Status User</th>
          <th scope="col" class="text-center pe-4">Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${currentPageData
          .map(
            (tamu, index) => `
          <tr>
            <td class="ps-4 fw-semibold">${startIndex + index + 1}</td>
            <td>
              <span class="badge bg-primary">${tamu.idTamu}</span>
            </td>
            <td>
              <div class="d-flex align-items-center">
                <div class="bg-primary bg-opacity-10 p-2 rounded me-2">
                  <i class="bi bi-person-circle text-primary"></i>
                </div>
                <div>
                  <div class="fw-medium">${tamu.nama}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="badge ${tamu.jk === "L" ? "bg-info" : "bg-warning"}">
                ${tamu.jk === "L" ? "Laki-laki" : "Perempuan"}
              </span>
            </td>
            <td>
              ${tamu.idUser ? 
                `<span class="font-monospace">${tamu.idUser}</span>` : 
                '<span class="text-muted">-</span>'
              }
            </td>
            <td>
              ${tamu.idUser ? 
                `<span class="badge bg-success">Sudah Punya User</span>` : 
                '<span class="badge bg-warning">Belum Punya User</span>'
              }
            </td>
            <td class="text-center pe-4">
              <div class="btn-group btn-group-sm" role="group">
                <button onclick="editTamu(${tamu.idTamu})" class="btn btn-outline-warning">
                  <i class="bi bi-pencil"></i>
                </button>
                <button onclick="deleteTamu(${tamu.idTamu})" class="btn btn-outline-danger">
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
    <div class="table-footer p-3 border-top bg-light">
      <div class="row align-items-center">
        <div class="col-md-6">
          <small class="text-muted">
            Menampilkan ${startData} - ${endData} dari ${totalData} tamu
          </small>
        </div>
        <div class="col-md-6 text-md-end">
          <small class="text-muted">
            Halaman ${tamuCurrentPage} dari ${totalPages}
          </small>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = tableHTML;

  // Render pagination
  renderTamuPagination(totalPages, startData, endData, totalData);
}

function renderTamuPagination(totalPages, startData, endData, totalData) {
  const paginationContainer = document.getElementById("tamuPagination");

  if (totalPages <= 1) {
    paginationContainer.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <small class="text-muted">Menampilkan semua data (${totalData} tamu)</small>
        <div class="dropdown d-none d-md-block">
          <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" 
                  id="tamuPerPageDropdown" data-bs-toggle="dropdown">
            ${tamuPerPage} per halaman
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item ${tamuPerPage === 5 ? 'active' : ''}" 
                   onclick="changeTamuPerPage(5)">5 per halaman</a></li>
            <li><a class="dropdown-item ${tamuPerPage === 10 ? 'active' : ''}" 
                   onclick="changeTamuPerPage(10)">10 per halaman</a></li>
            <li><a class="dropdown-item ${tamuPerPage === 20 ? 'active' : ''}" 
                   onclick="changeTamuPerPage(20)">20 per halaman</a></li>
            <li><a class="dropdown-item ${tamuPerPage === 50 ? 'active' : ''}" 
                   onclick="changeTamuPerPage(50)">50 per halaman</a></li>
          </ul>
        </div>
      </div>
    `;
    return;
  }

  // Tentukan halaman yang akan ditampilkan (maksimal 5 halaman)
  let startPage = Math.max(1, tamuCurrentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);

  // Adjust jika di akhir
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  const pageButtons = [];

  // Tombol First dan Previous
  if (tamuCurrentPage > 1) {
    pageButtons.push(`
      <li class="page-item">
        <button class="page-link" onclick="changeTamuPage(1)" title="Halaman pertama">
          <i class="bi bi-chevron-double-left"></i>
        </button>
      </li>
      <li class="page-item">
        <button class="page-link" onclick="changeTamuPage(${tamuCurrentPage - 1})" title="Halaman sebelumnya">
          <i class="bi bi-chevron-left"></i>
        </button>
      </li>
    `);
  } else {
    pageButtons.push(`
      <li class="page-item disabled">
        <span class="page-link">
          <i class="bi bi-chevron-double-left"></i>
        </span>
      </li>
      <li class="page-item disabled">
        <span class="page-link">
          <i class="bi bi-chevron-left"></i>
        </span>
      </li>
    `);
  }

  // Tombol ellipsis awal jika perlu
  if (startPage > 1) {
    pageButtons.push(`
      <li class="page-item disabled">
        <span class="page-link">...</span>
      </li>
    `);
  }

  // Tombol halaman
  for (let i = startPage; i <= endPage; i++) {
    if (i === tamuCurrentPage) {
      pageButtons.push(`
        <li class="page-item active">
          <span class="page-link">${i}</span>
        </li>
      `);
    } else {
      pageButtons.push(`
        <li class="page-item">
          <button class="page-link" onclick="changeTamuPage(${i})">${i}</button>
        </li>
      `);
    }
  }

  // Tombol ellipsis akhir jika perlu
  if (endPage < totalPages) {
    pageButtons.push(`
      <li class="page-item disabled">
        <span class="page-link">...</span>
      </li>
    `);
  }

  // Tombol Next dan Last
  if (tamuCurrentPage < totalPages) {
    pageButtons.push(`
      <li class="page-item">
        <button class="page-link" onclick="changeTamuPage(${tamuCurrentPage + 1})" title="Halaman berikutnya">
          <i class="bi bi-chevron-right"></i>
        </button>
      </li>
      <li class="page-item">
        <button class="page-link" onclick="changeTamuPage(${totalPages})" title="Halaman terakhir">
          <i class="bi bi-chevron-double-right"></i>
        </button>
      </li>
    `);
  } else {
    pageButtons.push(`
      <li class="page-item disabled">
        <span class="page-link">
          <i class="bi bi-chevron-right"></i>
        </span>
      </li>
      <li class="page-item disabled">
        <span class="page-link">
          <i class="bi bi-chevron-double-right"></i>
        </span>
      </li>
    `);
  }

  paginationContainer.innerHTML = `
    <div class="d-flex flex-wrap justify-content-between align-items-center">
      <div class="mb-2 mb-md-0">
        <small class="text-muted">
          Menampilkan <span class="fw-semibold">${startData} - ${endData}</span> dari 
          <span class="fw-semibold">${totalData}</span> tamu | 
          Halaman <span class="fw-semibold">${tamuCurrentPage}</span> dari 
          <span class="fw-semibold">${totalPages}</span>
        </small>
      </div>
      
      <div class="d-flex align-items-center">
        <!-- Dropdown untuk pilih jumlah data per halaman -->
        <div class="dropdown me-3">
          <button class="btn btn-sm btn-outline-primary dropdown-toggle" type="button" 
                  id="tamuPerPageDropdown" data-bs-toggle="dropdown">
            ${tamuPerPage} per halaman
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item ${tamuPerPage === 5 ? 'active' : ''}" 
                   onclick="changeTamuPerPage(5)">5 per halaman</a></li>
            <li><a class="dropdown-item ${tamuPerPage === 10 ? 'active' : ''}" 
                   onclick="changeTamuPerPage(10)">10 per halaman</a></li>
            <li><a class="dropdown-item ${tamuPerPage === 20 ? 'active' : ''}" 
                   onclick="changeTamuPerPage(20)">20 per halaman</a></li>
            <li><a class="dropdown-item ${tamuPerPage === 50 ? 'active' : ''}" 
                   onclick="changeTamuPerPage(50)">50 per halaman</a></li>
            <li><a class="dropdown-item ${tamuPerPage === 100 ? 'active' : ''}" 
                   onclick="changeTamuPerPage(100)">100 per halaman</a></li>
          </ul>
        </div>
        
        <!-- Navigasi halaman -->
        <nav>
          <ul class="pagination pagination-sm mb-0">
            ${pageButtons.join("")}
          </ul>
        </nav>
      </div>
    </div>
  `;

  // Tambahkan tooltip jika belum ada
  if (typeof bootstrap !== 'undefined') {
    const tooltipTriggerList = [].slice.call(paginationContainer.querySelectorAll('[title]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
}

// Fungsi untuk ganti halaman
window.changeTamuPage = function(pageNumber) {
  if (pageNumber < 1 || pageNumber > Math.ceil(tamuAllData.length / tamuPerPage)) {
    return;
  }
  
  tamuCurrentPage = pageNumber;
  
  // Scroll ke atas tabel dengan smooth animation
  const tableContainer = document.getElementById("tamuTableContainer");
  if (tableContainer) {
    // Gunakan smooth scrolling jika tersedia
    if ('scrollBehavior' in document.documentElement.style) {
      tableContainer.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    } else {
      tableContainer.scrollIntoView();
    }
  }
  
  // Render ulang tabel
  renderTamuTable();
};

// Fungsi untuk ganti jumlah data per halaman
window.changeTamuPerPage = function(perPage) {
  tamuPerPage = perPage;
  tamuCurrentPage = 1; // Reset ke halaman 1
  
  // Simpan preference ke localStorage jika tersedia
  try {
    localStorage.setItem('tamuPerPage', perPage.toString());
  } catch (e) {
    console.log('LocalStorage not available');
  }
  
  renderTamuTable();
};

// Load perPage preference dari localStorage saat pertama kali
document.addEventListener('DOMContentLoaded', function() {
  try {
    const savedPerPage = localStorage.getItem('tamuPerPage');
    if (savedPerPage) {
      tamuPerPage = parseInt(savedPerPage);
    }
  } catch (e) {
    console.log('LocalStorage not available');
  }
});

async function editTamu(tamuId) {
  try {
    const tamu = await fetchAPI(`${API.tamu}${tamuId}/`, {
      headers: getAuthHeaders(),
    });

    const formHTML = `
      <div class="tamu-form-container">
        <form id="editTamuForm" class="needs-validation" novalidate>
          <div class="mb-3">
            <label for="nama" class="form-label">Nama Lengkap *</label>
            <input type="text" id="nama" class="form-control" 
                   placeholder="Masukkan nama lengkap" 
                   value="${tamu.nama || ''}" required>
            <div class="valid-feedback">Valid.</div>
            <div class="invalid-feedback">Silakan isi nama lengkap.</div>
          </div>
          
          <div class="mb-3">
            <label for="jk" class="form-label">Jenis Kelamin *</label>
            <select id="jk" class="form-select" required>
              <option value="">Pilih Jenis Kelamin</option>
              <option value="L" ${tamu.jk === "L" ? "selected" : ""}>Laki-laki</option>
              <option value="P" ${tamu.jk === "P" ? "selected" : ""}>Perempuan</option>
            </select>
            <div class="valid-feedback">Valid.</div>
            <div class="invalid-feedback">Silakan pilih jenis kelamin.</div>
          </div>
          
          <div class="mb-4">
            <label class="form-label">Informasi User</label>
            <div class="card ${tamu.idUser ? 'border-success' : 'border-warning'}">
              <div class="card-body">
                ${
                  tamu.idUser 
                    ? `<div class="text-success">
                         <i class="bi bi-check-circle-fill me-2"></i>
                         <strong>Sudah terhubung dengan User</strong>
                         <div class="mt-2">
                           <small class="text-muted">User ID:</small>
                           <div class="font-monospace bg-success bg-opacity-10 p-2 rounded mt-1">
                             ${tamu.idUser}
                           </div>
                         </div>
                       </div>`
                    : `<div class="text-warning">
                         <i class="bi bi-exclamation-triangle-fill me-2"></i>
                         <strong>Belum terhubung dengan akun user</strong>
                       </div>`
                }
                <small class="text-muted d-block mt-2">
                  <i class="bi bi-info-circle me-1"></i>
                  ID User tidak dapat diubah melalui form ini.
                </small>
              </div>
            </div>
          </div>
        </form>
        
        <!-- Error Message -->
        <div id="formMessageEdit" class="mt-3"></div>
      </div>
    `;

    showModal(`Edit Tamu: ${tamu.nama}`, formHTML, async () => {
      // Dapatkan form
      const form = document.getElementById('editTamuForm');
      
      // Reset validation state
      form.classList.remove('was-validated');
      
      // Check validity
      if (!form.checkValidity()) {
        // Add validation styles
        form.classList.add('was-validated');
        // Scroll ke field pertama yang invalid
        const invalidField = form.querySelector(':invalid');
        if (invalidField) {
          invalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          invalidField.focus();
        }
        return false;
      }

      const tamuData = {
        nama: document.getElementById("nama").value,
        jk: document.getElementById("jk").value,
      };

      // Cek apakah ada perubahan
      if (tamuData.nama === tamu.nama && tamuData.jk === tamu.jk) {
        showToast("Tidak ada perubahan data yang dilakukan.", 'info', 3000);
        return false; // Jangan tutup modal
      }

      try {
        // Tampilkan loading
        showToast("Menyimpan perubahan data...", 'info', 2000);
        
        // Gunakan PATCH method untuk partial update
        await fetchAPI(`${API.tamu}${tamuId}/`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify(tamuData),
        });

        // Tampilkan toast sukses
        showToast(`✅ Data tamu "${tamuData.nama}" berhasil diperbarui`, 'success', 5000);
        
        // Tunggu sebentar sebelum refresh data
        setTimeout(() => {
          loadTamu();
        }, 500);
        
        return true;
      } catch (error) {
        // Tampilkan pesan error di dalam form
        const formMessage = document.getElementById('formMessageEdit');
        if (formMessage) {
          formMessage.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>Error:</strong> ${error.message}
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
          `;
        }
        return false;
      }
    }, true); // Parameter true untuk modal besar

    // Setup validation setelah modal ditampilkan
    setTimeout(() => {
      setupFormValidation();
    }, 300);
    
  } catch (error) {
    showToast(`❌ Gagal memuat data tamu: ${error.message}`, 'danger', 3000);
  }
}

async function deleteTamu(tamuId) {
  // Ambil data tamu terlebih dahulu untuk mendapatkan nama
  try {
    const tamu = await fetchAPI(`${API.tamu}${tamuId}/`, {
      headers: getAuthHeaders(),
    });

    showConfirmModal(
      `
        <div class="text-center py-3">
          <i class="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
          <h5 class="text-danger">Hapus Tamu</h5>
          <p class="text-muted">Apakah Anda yakin ingin menghapus data tamu ini?</p>
          <div class="alert alert-warning mt-3">
            <div class="d-flex align-items-center">
              <div class="bg-danger bg-opacity-10 p-2 rounded-circle me-3">
                <i class="bi bi-person text-danger"></i>
              </div>
              <div>
                <strong>${tamu.nama}</strong><br>
                <small class="text-muted">ID: ${tamu.idTamu} | ${tamu.jk === "L" ? "Laki-laki" : "Perempuan"}</small>
              </div>
            </div>
          </div>
          <small class="text-muted d-block mt-3">Data yang telah dihapus tidak dapat dikembalikan.</small>
        </div>
      `,
      async () => {
        try {
          await fetchAPI(`${API.tamu}${tamuId}/`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });

          // Tampilkan toast sukses
          showToast(`✅ Tamu "${tamu.nama}" berhasil dihapus`, 'success', 5000);
          
          // Reset ke halaman 1 setelah delete
          tamuCurrentPage = 1;
          
          // Tunggu sebentar sebelum refresh
          setTimeout(() => {
            loadTamu();
          }, 500);
        } catch (error) {
          showToast(`❌ Gagal menghapus tamu: ${error.message}`, 'danger', 3000);
        }
      }
    );
  } catch (error) {
    showToast(`❌ Gagal memuat data tamu: ${error.message}`, 'danger', 3000);
  }
}

// Export functions
window.editTamu = editTamu;
window.deleteTamu = deleteTamu;
window.changeTamuPage = changeTamuPage;
window.changeTamuPerPage = changeTamuPerPage;