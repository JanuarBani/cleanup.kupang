import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showModal, showConfirmModal, closeModal } from "../../utils/modal.js";
import { showToast } from "../../utils/toast.js";

let detailAllData = [];
let detailCurrentPage = 1;
let detailPerPage = 10;

let selectedJadwalMapGlobal = new Map();
let selectedJadwalIdsGlobal = [];

function showFormToast(message, type = 'info') {
    // Pastikan showToast sudah tersedia secara global
    if (typeof showToast === 'function') {
        showToast(message, type, 5000);
    } else {
        // Fallback ke alert jika showToast tidak tersedia
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

export async function detailAnggotaJadwalAdminPage() {
  // Tambahkan event listeners global untuk pagination
  window.changeDetailPage = changeDetailPage;
  window.changeDetailPerPage = changeDetailPerPage;
  window.setupJadwalGridListeners = setupJadwalGridListeners;
  window.removeSelectedJadwal = removeSelectedJadwal;
  window.editDetailJadwal = editDetailJadwal;
  window.viewDetailJadwal = viewDetailJadwal;
  window.deleteDetailJadwal = deleteDetailJadwal;

  const mainContent = document.getElementById("mainContent");
  mainContent.innerHTML = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Detail Jadwal Anggota</h2>
                <button id="addDetailBtn" style="padding: 8px 16px; background: #28a745; color: white;">+ Tambah Detail</button>
            </div>
            
            <div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                <input type="text" id="searchDetail" placeholder="Cari anggota/jadwal..." style="padding: 8px; width: 250px;">
                <select id="filterStatus" style="padding: 8px;">
                    <option value="">Semua Status</option>
                    <option value="terjadwal">Terjadwal</option>
                    <option value="dalam_proses">Dalam Proses</option>
                    <option value="selesai">Selesai</option>
                    <option value="dibatalkan">Dibatalkan</option>
                </select>
                <select id="filterAnggota" style="padding: 8px; width: 200px;">
                    <option value="">Semua Anggota</option>
                </select>
                <select id="filterJadwal" style="padding: 8px; width: 200px;">
                    <option value="">Semua Jadwal</option>
                </select>
            </div>
            
            <div id="detailTableContainer">
                <p>Loading data...</p>
            </div>
        </div>
    `;

  document.getElementById("addDetailBtn").onclick = () => showAddDetailForm();
  document.getElementById("searchDetail").oninput = loadDetailAnggotaJadwal;
  document.getElementById("filterStatus").onchange = loadDetailAnggotaJadwal;

  // Load dropdown data
  loadDropdownData();

  // Load data
  loadDetailAnggotaJadwal();
}

async function loadDropdownData() {
  try {
    // Load anggota
    const anggota = await fetchAPI(API.anggota, { headers: getAuthHeaders() });
    const anggotaSelect = document.getElementById("filterAnggota");

    // Clear existing options except first one
    while (anggotaSelect.options.length > 1) {
      anggotaSelect.remove(1);
    }

    anggota.forEach((a) => {
      const option = document.createElement("option");
      option.value = a.idAnggota; // idAnggota adalah number
      option.textContent = `${a.idAnggota} - ${a.nama}`;
      anggotaSelect.appendChild(option);
    });

    // Load jadwal
    const jadwal = await fetchAPI(API.jadwal, { headers: getAuthHeaders() });
    const jadwalSelect = document.getElementById("filterJadwal");

    // Clear existing options except first one
    while (jadwalSelect.options.length > 1) {
      jadwalSelect.remove(1);
    }

    jadwal.forEach((j) => {
      const option = document.createElement("option");
      const id = j.idJadwal; // idJadwal adalah number
      const tanggal = j.tanggalJadwal || "N/A";
      const namaTim = j.nama_tim || "N/A";

      option.value = id;
      option.textContent = `${id} - ${tanggal} (${namaTim})`;
      jadwalSelect.appendChild(option);
    });

    // Add event listeners setelah data dimuat
    document.getElementById("filterAnggota").onchange = loadDetailAnggotaJadwal;
    document.getElementById("filterJadwal").onchange = loadDetailAnggotaJadwal;
  } catch (error) {
    console.error("Error loading dropdown data:", error);
  }
}

function renderDetailPagination(totalPages) {
  const paginationContainer = document.getElementById("detailPagination");
  
  if (!paginationContainer) return;
  
  if (totalPages <= 1) {
    paginationContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <small class="text-muted">Menampilkan semua data (${detailAllData.length} detail)</small>
      </div>
    `;
    return;
  }
  
  const startData = (detailCurrentPage - 1) * detailPerPage + 1;
  const endData = Math.min(detailCurrentPage * detailPerPage, detailAllData.length);
  
  // Tentukan halaman yang akan ditampilkan (maksimal 5 halaman)
  let startPage = Math.max(1, detailCurrentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }
  
  let paginationHTML = `
    <div>
      <small style="color: #666;">
        Menampilkan ${startData} - ${endData} dari ${detailAllData.length} detail
      </small>
    </div>
    
    <div style="display: flex; align-items: center; gap: 5px;">
  `;
  
  // Previous button
  if (detailCurrentPage > 1) {
    paginationHTML += `
      <button data-page="${detailCurrentPage - 1}" class="pagination-btn"
              style="padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">
        ←
      </button>
    `;
  }
  
  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    if (i === detailCurrentPage) {
      paginationHTML += `
        <button style="padding: 5px 10px; border: 1px solid #007bff; background: #007bff; color: white; font-weight: bold; border-radius: 4px;">
          ${i}
        </button>
      `;
    } else {
      paginationHTML += `
        <button data-page="${i}" class="pagination-btn"
                style="padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">
          ${i}
        </button>
      `;
    }
  }
  
  // Next button
  if (detailCurrentPage < totalPages) {
    paginationHTML += `
      <button data-page="${detailCurrentPage + 1}" class="pagination-btn"
              style="padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">
        →
      </button>
    `;
  }
  
  // Items per page dropdown
  paginationHTML += `
    </div>
    
    <div style="display: flex; align-items: center; gap: 10px;">
      <small style="color: #666;">Items per page:</small>
      <select id="detailPerPageSelect" 
              style="padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
        <option value="5" ${detailPerPage === 5 ? 'selected' : ''}>5</option>
        <option value="10" ${detailPerPage === 10 ? 'selected' : ''}>10</option>
        <option value="20" ${detailPerPage === 20 ? 'selected' : ''}>20</option>
        <option value="50" ${detailPerPage === 50 ? 'selected' : ''}>50</option>
      </select>
    </div>
  `;
  
  paginationContainer.innerHTML = paginationHTML;
  
  // Setup event listeners
  setTimeout(() => {
    setupPaginationEventListeners();
  }, 50);
}

function setupPaginationEventListeners() {
  // Handler untuk dropdown items per page
  const perPageSelect = document.getElementById('detailPerPageSelect');
  if (perPageSelect) {
    perPageSelect.onchange = function() {
      changeDetailPerPage(this.value);
    };
  }
  
  // Handler untuk tombol pagination
  const paginationButtons = document.querySelectorAll('#detailPagination .pagination-btn');
  paginationButtons.forEach(button => {
    button.addEventListener('click', function() {
      const pageNum = parseInt(this.getAttribute('data-page'));
      if (!isNaN(pageNum)) {
        changeDetailPage(pageNum);
      }
    });
  });
}

function changeDetailPage(pageNumber) {
  detailCurrentPage = pageNumber;
  renderDetailTable();
  
  // Scroll ke atas tabel
  const tableContainer = document.getElementById("detailTableContainer");
  if (tableContainer) {
    tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function changeDetailPerPage(perPage) {
  detailPerPage = parseInt(perPage);
  detailCurrentPage = 1;
  renderDetailTable();
}

// Ekspos ke window
window.changeDetailPage = changeDetailPage;
window.changeDetailPerPage = changeDetailPerPage;

// ================ FUNGSI BANTU BARU ================
function updateSelectedJadwalInfoFromGlobal(selectedIds) {
    // Gunakan global map
    updateSelectedJadwalInfo(selectedIds, selectedJadwalMapGlobal);
}

function setupBootstrapValidation(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  // Hapus validasi built-in browser
  form.setAttribute('novalidate', true);
  
  // Hapus class was-validated jika ada
  form.classList.remove('was-validated');
  
  // Reset semua feedback
  form.querySelectorAll('.form-control, .form-select, .form-check-input').forEach(element => {
    element.classList.remove('is-invalid', 'is-valid');
  });
  
  form.querySelectorAll('.invalid-feedback, .valid-feedback').forEach(element => {
    element.style.display = 'none';
  });
}

function validateForm(formId) {
  const form = document.getElementById(formId);
  let isValid = true;
  
  // Reset semua validasi sebelumnya
  form.querySelectorAll('.form-control, .form-select').forEach(element => {
    element.classList.remove('is-invalid', 'is-valid');
    const feedback = element.nextElementSibling;
    if (feedback && feedback.classList.contains('invalid-feedback')) {
      feedback.style.display = 'none';
    }
  });
  
  // Validasi setiap input required
  form.querySelectorAll('[required]').forEach(element => {
    if (element.tagName === 'SELECT') {
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
    else if (element.type === 'hidden') {
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
  });
  
  // Jika tidak valid, tampilkan toast warning
  if (!isValid) {
    showToast('Harap lengkapi semua field yang wajib diisi!', 'warning');
  }
  
  return isValid;
}

// === PERBAIKI showAddDetailForm() DENGAN BOOTSTRAP VALIDATION ===
function showAddDetailForm() {
  // Load data untuk dropdown
  Promise.all([
    fetchAPI(API.anggota, { headers: getAuthHeaders() }),
    fetchAPI(API.jadwal, { headers: getAuthHeaders() }),
  ])
    .then(([anggota, jadwal]) => {
      // URUTKAN JADWAL: Tanggal terbaru ke terlama
      const sortedJadwal = jadwal.sort((a, b) => {
        const dateA = new Date(a.tanggalJadwal || a.tanggal);
        const dateB = new Date(b.tanggalJadwal || b.tanggal);
        return dateB - dateA; // Descending (terbaru ke terlama)
      });

      const anggotaOptions = anggota
        .map(
          (a) =>
            `<option value="${a.idAnggota}">${a.idAnggota} - ${
              a.nama
            } (${(a.alamat || '').substring(0, 20)}...)</option>`
        )
        .join("");

      const jadwalGrid = createMultiSelectJadwalGrid(sortedJadwal);

      const formHTML = `
            <form id="detailForm" novalidate>
                <div class="mb-3">
                    <label for="idAnggota" class="form-label">Anggota *</label>
                    <select id="idAnggota" class="form-select" required>
                        <option value="">Pilih Anggota</option>
                        ${anggotaOptions}
                    </select>
                    <div class="invalid-feedback">Harap pilih anggota.</div>
                </div>
                
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <label class="form-label mb-0 fw-bold">Pilih Jadwal (Maksimal 4) *</label>
                        <div class="text-muted small">
                            <span id="selectedCount">0</span>/4 jadwal terpilih
                        </div>
                    </div>
                    <div class="border rounded p-3 mb-2" style="max-height: 300px; overflow-y: auto;">
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;" id="jadwalGrid">
                            ${jadwalGrid}
                        </div>
                    </div>
                    <input type="hidden" id="selectedJadwalIds" required>
                    <div class="invalid-feedback">Harap pilih minimal 1 jadwal.</div>
                    <div id="selectedJadwalInfo" class="mt-2 p-3 bg-light rounded">
                        <strong>Jadwal terpilih:</strong> 
                        <div id="selectedJadwalList" class="mt-2 d-flex flex-wrap gap-2"></div>
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="status_pengangkutan" class="form-label">Status Pengangkutan *</label>
                    <select id="status_pengangkutan" class="form-select" required>
                        <option value="terjadwal">Terjadwal</option>
                        <option value="dalam_proses">Dalam Proses</option>
                        <option value="selesai">Selesai</option>
                        <option value="dibatalkan">Dibatalkan</option>
                    </select>
                    <div class="invalid-feedback">Harap pilih status pengangkutan.</div>
                </div>
                
                <div class="mb-3">
                    <label for="catatan" class="form-label">Catatan</label>
                    <textarea id="catatan" class="form-control" rows="3" placeholder="Catatan tambahan..."></textarea>
                </div>
            </form>
        `;

      showModal("Tambah Detail Jadwal Anggota", formHTML, async () => {
          // Lakukan validasi Bootstrap
          if (!validateForm('detailForm')) {
            return false;
          }

          const selectedJadwalIds = document.getElementById("selectedJadwalIds").value;
          const jadwalIds = selectedJadwalIds
              .split(",")
              .filter((id) => id !== "");
          
          if (jadwalIds.length === 0) {
            // Tampilkan error pada input jadwal
            const hiddenInput = document.getElementById("selectedJadwalIds");
            hiddenInput.classList.add('is-invalid');
            const feedback = hiddenInput.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
              feedback.style.display = 'block';
            }
            showToast('Harap pilih minimal 1 jadwal!', 'warning');
            return false;
          }

          // Validasi maksimal 4 jadwal
          if (jadwalIds.length > 4) {
            showToast('Maksimal hanya bisa memilih 4 jadwal!', 'error');
            return false;
          }

          const idAnggota = parseInt(document.getElementById("idAnggota").value);
          const status_pengangkutan = document.getElementById("status_pengangkutan").value;
          const catatan = document.getElementById("catatan").value || "";
              
          let successCount = 0;
          let errorCount = 0;

          // Tampilkan loading toast
          showToast('Sedang menyimpan data...', 'info');

          try {
              const promises = jadwalIds.map((jadwalId) => {
                  const detailData = {
                      idAnggota: idAnggota,
                      idJadwal: parseInt(jadwalId),
                      status_pengangkutan: status_pengangkutan,
                      catatan: catatan,
                  };

                  return fetchAPI(API.detailAnggotaJadwal, {
                      method: "POST",
                      headers: getAuthHeaders(),
                      body: JSON.stringify(detailData),
                  })
                      .then(() => {
                          successCount++;
                      })
                      .catch((error) => {
                          errorCount++;
                          throw error;
                      });
              });

              await Promise.allSettled(promises);

              if (successCount > 0) {
                  // Tampilkan pesan sukses menggunakan toast
                  showToast(
                      `Berhasil menambahkan ${successCount} dari ${jadwalIds.length} jadwal!`, 'success', 5000
                  );
                  
                  // Refresh data setelah 2 detik
                  setTimeout(() => {
                      loadDetailAnggotaJadwal();
                      closeModal();
                  }, 2000);
                  
                  return true;
              }

              if (errorCount > 0) {
                  showToast(`Gagal menambahkan ${errorCount} jadwal`, 'error');
                  return false;
              }

          } catch (error) {
              showToast(`Error: ${error.message}`, 'error');
              return false;
          }
          
          return true;
      });

      setTimeout(() => {
        setupMultiSelectJadwalGridListeners();
        
        // Tambahkan real-time validation untuk select
        const idAnggotaSelect = document.getElementById('idAnggota');
        const statusSelect = document.getElementById('status_pengangkutan');
        
        if (idAnggotaSelect) {
          idAnggotaSelect.addEventListener('change', function() {
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
        
        if (statusSelect) {
          statusSelect.addEventListener('change', function() {
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
      showToast("Error loading data: " + error.message, 'error');
    });
}

async function editDetailJadwal(detailId) {
  try {
    const detail = await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
      headers: getAuthHeaders(),
    });

    const [anggota, jadwal] = await Promise.all([
      fetchAPI(API.anggota, { headers: getAuthHeaders() }),
      fetchAPI(API.jadwal, { headers: getAuthHeaders() }),
    ]);

    // URUTKAN JADWAL: Tanggal terbaru ke terlama
    const sortedJadwal = jadwal.sort((a, b) => {
      const dateA = new Date(a.tanggalJadwal || a.tanggal);
      const dateB = new Date(b.tanggalJadwal || b.tanggal);
      return dateB - dateA; // Descending (terbaru ke terlama)
    });

    const anggotaOptions = anggota
      .map(
        (a) =>
          `<option value="${a.idAnggota}" ${
            a.idAnggota == detail.idAnggota ? "selected" : ""
          }>
                ${a.idAnggota} - ${a.nama}
            </option>`
      )
      .join("");

    const selectedJadwal = sortedJadwal.find(j => j.idJadwal == detail.idJadwal);
    const selectedJadwalText = selectedJadwal 
      ? `${formatDate(selectedJadwal.tanggalJadwal)} - ${selectedJadwal.nama_tim}` 
      : "Belum dipilih";

    // Simpan nilai awal untuk komparasi nanti
    const initialValues = {
      idAnggota: detail.idAnggota,
      idJadwal: detail.idJadwal,
      status_pengangkutan: detail.status_pengangkutan,
      catatan: detail.catatan || ""
    };

    const formHTML = `
            <form id="editDetailForm" novalidate>
                <div class="mb-3">
                    <label for="idAnggota" class="form-label">Anggota *</label>
                    <select id="idAnggota" class="form-select" required>
                        <option value="">Pilih Anggota</option>
                        ${anggotaOptions}
                    </select>
                    <div class="invalid-feedback">Harap pilih anggota.</div>
                </div>
                
                <div class="mb-3">
                    <label class="form-label mb-2 fw-bold">Pilih Jadwal *</label>
                    <div class="border rounded p-3 mb-2" style="max-height: 300px; overflow-y: auto;">
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;" id="jadwalGridEdit">
                            ${createJadwalGridEdit(sortedJadwal, detail.idJadwal)}
                        </div>
                    </div>
                    <input type="hidden" id="idJadwal" required value="${detail.idJadwal || ""}">
                    <div class="invalid-feedback">Harap pilih jadwal.</div>
                    <div id="selectedJadwalInfo" class="mt-2 p-3 bg-light rounded ${detail.idJadwal ? '' : 'd-none'}">
                        <strong>Jadwal terpilih:</strong> <span id="selectedJadwalText">${selectedJadwalText}</span>
                        ${
                          selectedJadwal 
                            ? `<br><small class="text-muted">Tanggal: ${formatDate(selectedJadwal.tanggalJadwal)} | Tim: ${selectedJadwal.nama_tim}</small>`
                            : ''
                        }
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="status_pengangkutan" class="form-label">Status Pengangkutan *</label>
                    <select id="status_pengangkutan" class="form-select" required>
                        <option value="terjadwal" ${detail.status_pengangkutan === "terjadwal" ? "selected" : ""}>Terjadwal</option>
                        <option value="dalam_proses" ${detail.status_pengangkutan === "dalam_proses" ? "selected" : ""}>Dalam Proses</option>
                        <option value="selesai" ${detail.status_pengangkutan === "selesai" ? "selected" : ""}>Selesai</option>
                        <option value="dibatalkan" ${detail.status_pengangkutan === "dibatalkan" ? "selected" : ""}>Dibatalkan</option>
                    </select>
                    <div class="invalid-feedback">Harap pilih status pengangkutan.</div>
                </div>
                
                <div class="mb-3">
                    <label for="catatan" class="form-label">Catatan</label>
                    <textarea id="catatan" class="form-control" rows="3" placeholder="Catatan tambahan...">${detail.catatan || ""}</textarea>
                </div>
            </form>
        `;

    showModal("Edit Detail Jadwal Anggota", formHTML, async () => {
      // Lakukan validasi Bootstrap
      if (!validateForm('editDetailForm')) {
        return false;
      }

      const idAnggota = document.getElementById("idAnggota").value;
      const selectedJadwalId = document.getElementById("idJadwal").value;
      const statusPengangkutan = document.getElementById("status_pengangkutan").value;
      const catatan = document.getElementById("catatan").value || "";
      
      // Validasi: Cek apakah ada perubahan data
      const hasChanges = 
        parseInt(idAnggota) !== parseInt(initialValues.idAnggota) ||
        parseInt(selectedJadwalId) !== parseInt(initialValues.idJadwal) ||
        statusPengangkutan !== initialValues.status_pengangkutan ||
        catatan !== initialValues.catatan;
      
      if (!hasChanges) {
        // Tampilkan toast info tapi JANGAN tutup modal
        showFormToast('Tidak ada perubahan data yang dilakukan.', 'info');
        return false; // Kembalikan false agar modal tidak ditutup
      }
      
      const detailData = {
        idAnggota: parseInt(idAnggota),
        idJadwal: parseInt(selectedJadwalId),
        status_pengangkutan: statusPengangkutan,
        catatan: catatan,
      };

      try {
        // Tampilkan loading state di tombol submit
        const submitBtn = document.querySelector('.modal-footer .btn-primary');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
        submitBtn.disabled = true;
        
        await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify(detailData),
        });

        showToast('Detail jadwal berhasil diupdate!', 'success', 5000);
        
        // Refresh data setelah 1.5 detik dan tutup modal
        setTimeout(() => {
          loadDetailAnggotaJadwal();
          closeModal();
        }, 1500);
        
        return true;
      } catch (error) {
        // Reset tombol submit
        const submitBtn = document.querySelector('.modal-footer .btn-primary');
        if (submitBtn) {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }
        
        if (error.message && error.message.includes("sudah ada") || 
            error.message && error.message.includes("already exists")) {
          showToast('Kombinasi anggota dan jadwal ini sudah ada dalam sistem!', 'error');
        } else {
          showToast('error', 'Error: ' + error.message);
        }
        
        return false; // Jangan tutup modal jika ada error
      }
    });

    setTimeout(() => {
      setupJadwalGridEditListeners(detail.idJadwal);
      
      // Tambahkan real-time validation
      const idAnggotaSelect = document.getElementById('idAnggota');
      const statusSelect = document.getElementById('status_pengangkutan');
      
      if (idAnggotaSelect) {
        // Set initial valid state jika sudah ada value
        if (idAnggotaSelect.value) {
          idAnggotaSelect.classList.add('is-valid');
        }
        
        idAnggotaSelect.addEventListener('change', function() {
          if (this.value) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
            const feedback = this.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
              feedback.style.display = 'none';
            }
          } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
            const feedback = this.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
              feedback.style.display = 'block';
            }
          }
        });
      }
      
      if (statusSelect) {
        // Set initial valid state
        statusSelect.classList.add('is-valid');
        
        statusSelect.addEventListener('change', function() {
          this.classList.remove('is-invalid', 'is-valid');
          this.classList.add('is-valid');
          const feedback = this.nextElementSibling;
          if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.style.display = 'none';
          }
        });
      }
      
      // Set initial valid state untuk hidden input jadwal
      const idJadwalInput = document.getElementById('idJadwal');
      if (idJadwalInput && idJadwalInput.value) {
        idJadwalInput.classList.add('is-valid');
      }
      
      // Tambahkan event listener untuk catatan untuk memantau perubahan
      const catatanTextarea = document.getElementById('catatan');
      if (catatanTextarea) {
        catatanTextarea.addEventListener('input', function() {
          // Tidak perlu visual validation untuk catatan karena tidak required
        });
      }
    }, 100);
    
  } catch (error) {
    showToast('error', "Error loading data: " + error.message);
  }
}

// === UPDATE FUNGSI loadDetailAnggotaJadwal() UNTUK MENGURUTKAN ===
async function loadDetailAnggotaJadwal() {
  const search = document.getElementById("searchDetail")?.value || "";
  const filterStatus = document.getElementById("filterStatus")?.value || "";
  const filterAnggota = document.getElementById("filterAnggota")?.value || "";
  const filterJadwal = document.getElementById("filterJadwal")?.value || "";

  try {
    const details = await fetchAPI(API.detailAnggotaJadwal, {
      headers: getAuthHeaders(),
    });

    // URUTKAN DATA: Berdasarkan tanggal jadwal terbaru ke terlama
    const sortedDetails = details.sort((a, b) => {
      // Coba dapatkan tanggal dari jadwal
      let dateA = new Date(a.tanggal_jadwal || a.created_at || 0);
      let dateB = new Date(b.tanggal_jadwal || b.created_at || 0);
      
      // Jika ada informasi jadwal lengkap, ambil dari jadwal itu sendiri
      if (a.jadwal && a.jadwal.tanggalJadwal) {
        dateA = new Date(a.jadwal.tanggalJadwal);
      }
      if (b.jadwal && b.jadwal.tanggalJadwal) {
        dateB = new Date(b.jadwal.tanggalJadwal);
      }
      
      return dateB - dateA; // Descending (terbaru ke terlama)
    });

    // Simpan semua data ke variabel global
    detailAllData = sortedDetails.filter((detail) => {
      const namaAnggota = detail.nama_anggota || "";
      const tanggalJadwal = detail.tanggal_jadwal || "";
      const namaTim = detail.nama_tim || "";
      const status = detail.status_pengangkutan || "";

      const matchSearch =
        !search ||
        namaAnggota.toLowerCase().includes(search.toLowerCase()) ||
        tanggalJadwal.includes(search) ||
        namaTim.toLowerCase().includes(search.toLowerCase()) ||
        status.toLowerCase().includes(search.toLowerCase());

      const matchStatus = !filterStatus || status === filterStatus;
      const matchAnggota = !filterAnggota || detail.idAnggota == filterAnggota;
      const matchJadwal = !filterJadwal || detail.idJadwal == filterJadwal;

      return matchSearch && matchStatus && matchAnggota && matchJadwal;
    });

    // Reset ke halaman 1 saat filter berubah
    detailCurrentPage = 1;
    
    // Render tabel dengan pagination
    renderDetailTable();
  } catch (error) {
    document.getElementById(
      "detailTableContainer"
    ).innerHTML = `<div class="alert alert-danger">Error loading data: ${error.message}</div>`;
  }
}

// === PERBAIKI createMultiSelectJadwalGrid() UNTUK MENGURUTKAN ===
function createMultiSelectJadwalGrid(jadwalList) {
  // Group jadwal by bulan untuk organisasi yang lebih baik
  const groupedByMonth = {};

  jadwalList.forEach((j) => {
    const id = j.idJadwal || j.id;
    const tanggal = j.tanggalJadwal || j.tanggal;
    const namaTim = j.nama_tim || "Tim";

    if (tanggal) {
      const date = new Date(tanggal);
      const monthYear = date.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });

      if (!groupedByMonth[monthYear]) {
        groupedByMonth[monthYear] = [];
      }

      groupedByMonth[monthYear].push({
        id,
        tanggal,
        namaTim,
        dateObj: date,
        formattedDate: date.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
      });
    }
  });

  let gridHTML = "";

  // URUTKAN BULAN: Dari terbaru ke terlama
  const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => {
    const dateA = new Date(a.split(' ')[1] + '-' + getMonthNumber(a.split(' ')[0]));
    const dateB = new Date(b.split(' ')[1] + '-' + getMonthNumber(b.split(' ')[0]));
    return dateB - dateA; // Descending (terbaru ke terlama)
  });

  sortedMonths.forEach((monthYear) => {
    const jadwals = groupedByMonth[monthYear];

    // URUTKAN JADWAL DALAM BULAN: Tanggal terbaru ke terlama
    jadwals.sort((a, b) => b.dateObj - a.dateObj);

    gridHTML += `
            <div style="grid-column: 1 / -1; margin-bottom: 10px;">
                <h4 class="h6 mb-2 pb-1 border-bottom" style="border-bottom: 2px solid #007bff !important;">
                    ${monthYear}
                </h4>
            </div>
        `;

    jadwals.forEach((j) => {
      gridHTML += `
                <div class="jadwal-card border rounded p-2 text-center" 
                     data-jadwal-id="${j.id}" 
                     style="cursor: pointer; transition: all 0.2s; background: white; position: relative;">
                    <div class="fw-bold text-primary mb-1">
                        ${j.formattedDate}
                    </div>
                    <div class="small text-muted">
                        ${j.namaTim}
                    </div>
                    <div class="checkmark position-absolute" 
                         style="top: 5px; right: 5px; width: 20px; height: 20px; border-radius: 50%; 
                                background: #28a745; color: white; font-size: 12px;
                                display: none; align-items: center; justify-content: center;">
                        ✓
                    </div>
                </div>
            `;
    });
  });

  return gridHTML;
}

// === FUNGSI BANTU UNTUK KONVERSI NAMA BULAN KE ANGKA ===
function getMonthNumber(monthName) {
  const monthNames = {
    'Januari': '01',
    'Februari': '02', 
    'Maret': '03',
    'April': '04',
    'Mei': '05',
    'Juni': '06',
    'Juli': '07',
    'Agustus': '08',
    'September': '09',
    'Oktober': '10',
    'November': '11',
    'Desember': '12'
  };
  return monthNames[monthName] || '01';
}

// === PERBAIKI setupMultiSelectJadwalGridListeners() UNTUK VALIDASI REAL-TIME ===
function setupMultiSelectJadwalGridListeners() {
  const jadwalCards = document.querySelectorAll(".jadwal-card");
  
  if (jadwalCards.length === 0) return;
  
  // Reset variabel global
  selectedJadwalIdsGlobal.length = 0;
  selectedJadwalMapGlobal.clear();
  
  jadwalCards.forEach((card) => {
    const clickHandler = function() {
      const jadwalId = this.getAttribute("data-jadwal-id");
      const tanggal = this.querySelector("div:first-child").textContent;
      const namaTim = this.querySelector("div:nth-child(2)").textContent;
      const checkmark = this.querySelector(".checkmark");

      if (selectedJadwalIdsGlobal.includes(jadwalId)) {
        // Unselect
        const index = selectedJadwalIdsGlobal.indexOf(jadwalId);
        selectedJadwalIdsGlobal.splice(index, 1);
        selectedJadwalMapGlobal.delete(jadwalId);

        this.classList.remove('border-primary', 'bg-light');
        checkmark.style.display = "none";
      } else {
        // Cek apakah sudah mencapai batas maksimal (4)
        if (selectedJadwalIdsGlobal.length >= 4) {
          showToast('Maksimal hanya bisa memilih 4 jadwal!', 'warning');
          return;
        }

        // Select
        selectedJadwalIdsGlobal.push(jadwalId);
        selectedJadwalMapGlobal.set(jadwalId, {
          tanggal,
          namaTim,
          id: jadwalId,
        });

        this.classList.add('border-primary', 'bg-light');
        checkmark.style.display = "flex";
        
        // Update validation state untuk hidden input
        const hiddenInput = document.getElementById("selectedJadwalIds");
        if (hiddenInput) {
          hiddenInput.classList.remove('is-invalid');
          hiddenInput.classList.add('is-valid');
          const feedback = hiddenInput.nextElementSibling;
          if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.style.display = 'none';
          }
        }
      }

      // Update counter dan list
      updateSelectedJadwalInfo(selectedJadwalIdsGlobal, selectedJadwalMapGlobal);
    };
    
    card._clickHandler = clickHandler;
    card.addEventListener("click", clickHandler);

    // Hover effects
    card.addEventListener("mouseenter", function () {
      const jadwalId = this.getAttribute("data-jadwal-id");
      if (!selectedJadwalIdsGlobal.includes(jadwalId)) {
        this.classList.add('border-info', 'shadow-sm');
      }
    });

    card.addEventListener("mouseleave", function () {
      const jadwalId = this.getAttribute("data-jadwal-id");
      if (!selectedJadwalIdsGlobal.includes(jadwalId)) {
        this.classList.remove('border-info', 'shadow-sm');
      }
    });
  });
}

// === PERBAIKI updateSelectedJadwalInfo() UNTUK VALIDASI ===
function updateSelectedJadwalInfo(selectedIds, selectedMap) {
  try {
    // Update counter
    const counterEl = document.getElementById("selectedCount");
    if (counterEl) {
      counterEl.textContent = selectedIds.length;
    }

    // Update hidden input dengan comma-separated IDs
    const hiddenInput = document.getElementById("selectedJadwalIds");
    if (hiddenInput) {
      hiddenInput.value = selectedIds.join(",");
      
      // Update validation state
      if (selectedIds.length > 0) {
        hiddenInput.classList.remove('is-invalid');
        hiddenInput.classList.add('is-valid');
        const feedback = hiddenInput.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
          feedback.style.display = 'none';
        }
      } else {
        hiddenInput.classList.remove('is-valid');
        hiddenInput.classList.add('is-invalid');
        const feedback = hiddenInput.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
          feedback.style.display = 'block';
        }
      }
    }

    // Update list jadwal terpilih
    const selectedList = document.getElementById("selectedJadwalList");
    if (!selectedList) return;

    if (selectedIds.length === 0) {
      selectedList.innerHTML = '<span class="text-muted fst-italic">Belum ada jadwal yang dipilih</span>';
      return;
    }

    let listHTML = '';

    selectedIds.forEach((id) => {
      const jadwal = selectedMap.get(id);
      if (jadwal) {
        listHTML += `
                <span class="badge bg-primary d-inline-flex align-items-center gap-1">
                    ${jadwal.tanggal}
                    <button type="button" onclick="removeSelectedJadwal('${id}')" 
                            class="btn-close btn-close-white" 
                            style="padding: 0; font-size: 8px;"></button>
                </span>
            `;
      }
    });

    selectedList.innerHTML = listHTML;
  } catch (error) {
    console.error("Error updating selected jadwal info:", error);
  }
}

// === PERBAIKI renderDetailTable() UNTUK TAMPILAN YANG LEBIH BAIK ===
function renderDetailTable() {
  const container = document.getElementById("detailTableContainer");
  
  if (!container) return;
  
  const totalData = detailAllData.length;
  const totalPages = Math.ceil(totalData / detailPerPage);
  
  if (totalPages === 0) {
    detailCurrentPage = 1;
  } else if (detailCurrentPage > totalPages) {
    detailCurrentPage = totalPages;
  }
  
  const startIndex = (detailCurrentPage - 1) * detailPerPage;
  const endIndex = startIndex + detailPerPage;
  const currentPageData = detailAllData.slice(startIndex, endIndex);
  
  if (!currentPageData || currentPageData.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info">
        <i class="bi bi-info-circle me-2"></i>
        Tidak ada data detail jadwal anggota
      </div>
    `;
    return;
  }

  // Gunakan Bootstrap classes untuk styling yang lebih baik
  const tableHTML = `
    <div class="table-responsive">
      <table class="table table-hover table-striped">
        <thead class="table-light">
          <tr>
            <th style="width: 50px;">No</th>
            <th>Anggota</th>
            <th>Jadwal</th>
            <th>Status</th>
            <th>Catatan</th>
            <th>Dibuat</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${currentPageData
            .map((detail, index) => {
              const nomor = startIndex + index + 1;
              const detailId = detail.idDetailAnggotaJadwal || detail.id;
              const namaAnggota = detail.nama_anggota || `Anggota ID: ${detail.idAnggota}`;
              const tanggalJadwal = detail.tanggal_jadwal || `Jadwal ID: ${detail.idJadwal}`;
              const namaTim = detail.nama_tim || "N/A";
              const catatan = detail.catatan || "";
              const catatanDisplay = catatan
                ? catatan.substring(0, 50) + (catatan.length > 50 ? "..." : "")
                : "-";
              const createdAt = detail.created_at
                ? new Date(detail.created_at).toLocaleDateString("id-ID")
                : "-";

              return `
                <tr>
                  <td class="text-center fw-semibold">${nomor}</td>
                  <td>
                    <div class="fw-medium">${namaAnggota}</div>
                    <small class="text-muted">ID: ${detail.idAnggota}</small>
                  </td>
                  <td>
                    <div class="fw-semibold">${formatDate(tanggalJadwal)}</div>
                    <small class="text-muted">Tim: ${namaTim}</small>
                  </td>
                  <td>
                    ${getStatusBadge(detail.status_pengangkutan)}
                  </td>
                  <td style="max-width: 200px;">
                    <div class="text-truncate" title="${catatan}">${catatanDisplay}</div>
                  </td>
                  <td>
                    <small class="text-muted">${createdAt}</small>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm" role="group">
                      <button onclick="viewDetailJadwal(${detailId})" class="btn btn-info" title="Detail">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button onclick="editDetailJadwal(${detailId})" class="btn btn-warning" title="Edit">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button onclick="deleteDetailJadwal(${detailId})" class="btn btn-danger" title="Hapus">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
    <div id="detailPagination" class="mt-3 pt-3 border-top"></div>
  `;

  container.innerHTML = tableHTML;
  renderDetailPagination(totalPages);
}

// === PERBAIKI getStatusBadge() UNTUK BOOTSTRAP BADGES ===
function getStatusBadge(status) {
  const statusConfig = {
    terjadwal: { class: "bg-info", label: "Terjadwal" },
    dalam_proses: { class: "bg-warning", label: "Dalam Proses" },
    selesai: { class: "bg-success", label: "Selesai" },
    dibatalkan: { class: "bg-danger", label: "Dibatalkan" },
  };

  const config = statusConfig[status] || { class: "bg-secondary", label: status };

  return `<span class="badge ${config.class}">${config.label}</span>`;
}

// Fungsi untuk cleanup listeners
function cleanupMultiSelectListeners() {
  const jadwalCards = document.querySelectorAll(".jadwal-card");
  jadwalCards.forEach(card => {
    if (card._clickHandler) {
      card.removeEventListener('click', card._clickHandler);
      delete card._clickHandler;
    }
  });
}

// ================ FUNGSI BANTUAN UNTUK MODAL KONFIRMASI PROMISE ================
function showConfirmModalPromise(message, title = "Konfirmasi") {
    return new Promise((resolve) => {
        const modalHTML = `
            <div style="padding: 20px;">
                <p style="margin-bottom: 20px; white-space: pre-line;">${message}</p>
                <div style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button id="cancelBtn" style="padding: 8px 16px; background: #6c757d; color: white;">Batal</button>
                    <button id="confirmBtn" style="padding: 8px 16px; background: #dc3545; color: white;">Lanjutkan</button>
                </div>
            </div>
        `;
        
        showModal(title, modalHTML, () => {
            resolve(true);
            return true;
        }, () => {
            resolve(false);
            return false;
        });
        
        // Tambahkan event listeners untuk tombol
        setTimeout(() => {
            document.getElementById('cancelBtn').onclick = () => {
                if (typeof closeModal === 'function') closeModal();
                resolve(false);
            };
            document.getElementById('confirmBtn').onclick = () => {
                if (typeof closeModal === 'function') closeModal();
                resolve(true);
            };
        }, 100);
    });
}

// Fungsi untuk remove jadwal dari list
function removeSelectedJadwal(jadwalId) {
  try {
    const card = document.querySelector(
      `.jadwal-card[data-jadwal-id="${jadwalId}"]`
    );
    if (card) {
      // Gunakan klik programatik yang lebih aman
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      card.dispatchEvent(clickEvent);
    }
  } catch (error) {
    console.error("Error removing selected jadwal:", error);
  }
}

function createJadwalGrid(jadwalList) {
  // Group jadwal by bulan untuk organisasi yang lebih baik
  const groupedByMonth = {};

  jadwalList.forEach((j) => {
    const id = j.idJadwal || j.id;
    const tanggal = j.tanggalJadwal || j.tanggal;
    const namaTim = j.nama_tim || "Tim";

    if (tanggal) {
      const date = new Date(tanggal);
      const monthYear = date.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });

      if (!groupedByMonth[monthYear]) {
        groupedByMonth[monthYear] = [];
      }

      groupedByMonth[monthYear].push({
        id,
        tanggal,
        namaTim,
        dateObj: date,
        formattedDate: date.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
      });
    }
  });

  let gridHTML = "";

  // Urutkan bulan
  const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => {
    return new Date(a) - new Date(b);
  });

  sortedMonths.forEach((monthYear) => {
    const jadwals = groupedByMonth[monthYear];

    // Urutkan jadwal dalam bulan berdasarkan tanggal
    jadwals.sort((a, b) => a.dateObj - b.dateObj);

    gridHTML += `
            <div style="grid-column: 1 / -1; margin-bottom: 10px;">
                <h4 style="margin: 0; padding-bottom: 5px; border-bottom: 2px solid #007bff; color: #333;">
                    ${monthYear}
                </h4>
            </div>
        `;

    jadwals.forEach((j) => {
      gridHTML += `
                <div class="jadwal-card" data-jadwal-id="${j.id}" 
                     style="border: 1px solid #ddd; border-radius: 8px; padding: 10px; 
                            cursor: pointer; transition: all 0.2s; text-align: center;
                            background: white;">
                    <div style="font-weight: bold; color: #007bff; margin-bottom: 5px;">
                        ${j.formattedDate}
                    </div>
                    <div style="font-size: 12px; color: #666;">
                        ${j.namaTim}
                    </div>
                </div>
            `;
    });
  });

  return gridHTML;
}

function setupJadwalGridListeners() {
  const jadwalCards = document.querySelectorAll(".jadwal-card");
  let selectedCard = null;

  jadwalCards.forEach((card) => {
    card.addEventListener("click", function () {
      const jadwalId = this.getAttribute("data-jadwal-id");
      const tanggal = this.querySelector("div:first-child").textContent;
      const namaTim = this.querySelector("div:last-child").textContent;

      // Reset selected card sebelumnya
      if (selectedCard) {
        selectedCard.style.background = "white";
        selectedCard.style.borderColor = "#ddd";
        selectedCard.style.boxShadow = "none";
      }

      // Set selected card baru
      this.style.background = "#e3f2fd";
      this.style.borderColor = "#007bff";
      this.style.boxShadow = "0 0 0 2px rgba(0, 123, 255, 0.25)";
      selectedCard = this;

      // Update hidden input dan info
      document.getElementById("idJadwal").value = jadwalId;
      document.getElementById(
        "selectedJadwalText"
      ).textContent = `${tanggal} - ${namaTim}`;
      document.getElementById("selectedJadwalInfo").style.display = "block";
    });

    // Hover effects
    card.addEventListener("mouseenter", function () {
      if (this !== selectedCard) {
        this.style.background = "#f8f9fa";
        this.style.transform = "translateY(-2px)";
        this.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
      }
    });

    card.addEventListener("mouseleave", function () {
      if (this !== selectedCard) {
        this.style.background = "white";
        this.style.transform = "translateY(0)";
        this.style.boxShadow = "none";
      }
    });
  });
}

// Fungsi untuk membuat grid jadwal khusus untuk edit dengan highlight
function createJadwalGridEdit(jadwalList, selectedJadwalId) {
  // Group jadwal by bulan untuk organisasi yang lebih baik
  const groupedByMonth = {};

  jadwalList.forEach((j) => {
    const id = j.idJadwal || j.id;
    const tanggal = j.tanggalJadwal || j.tanggal;
    const namaTim = j.nama_tim || "Tim";
    const isSelected = id == selectedJadwalId;

    if (tanggal) {
      const date = new Date(tanggal);
      const monthYear = date.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });

      if (!groupedByMonth[monthYear]) {
        groupedByMonth[monthYear] = [];
      }

      groupedByMonth[monthYear].push({
        id,
        tanggal,
        namaTim,
        dateObj: date,
        formattedDate: date.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
        isSelected
      });
    }
  });

  let gridHTML = "";

  // Urutkan bulan
  const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => {
    return new Date(a) - new Date(b);
  });

  sortedMonths.forEach((monthYear) => {
    const jadwals = groupedByMonth[monthYear];

    // Urutkan jadwal dalam bulan berdasarkan tanggal
    jadwals.sort((a, b) => a.dateObj - b.dateObj);

    gridHTML += `
            <div style="grid-column: 1 / -1; margin-bottom: 10px;">
                <h4 style="margin: 0; padding-bottom: 5px; border-bottom: 2px solid #007bff; color: #333;">
                    ${monthYear}
                </h4>
            </div>
        `;

    jadwals.forEach((j) => {
      const cardStyle = j.isSelected 
        ? "background: #e3f2fd; border-color: #007bff; box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);"
        : "background: white;";
      
      const checkmarkStyle = j.isSelected ? "display: flex;" : "display: none;";

      gridHTML += `
                <div class="jadwal-card-edit" data-jadwal-id="${j.id}" 
                     style="border: 1px solid #ddd; border-radius: 8px; padding: 10px; 
                            cursor: pointer; transition: all 0.2s; text-align: center;
                            ${cardStyle} position: relative;">
                    <div style="font-weight: bold; color: #007bff; margin-bottom: 5px;">
                        ${j.formattedDate}
                    </div>
                    <div style="font-size: 12px; color: #666;">
                        ${j.namaTim}
                    </div>
                    <div class="checkmark-edit" style="position: absolute; top: 5px; right: 5px; 
                          width: 20px; height: 20px; border-radius: 50%; 
                          background: #28a745; color: white; font-size: 12px;
                          ${checkmarkStyle} align-items: center; justify-content: center;">
                        ✓
                    </div>
                </div>
            `;
    });
  });

  return gridHTML;
}

// Fungsi untuk setup listeners dengan highlight khusus
function setupJadwalGridEditListeners(selectedJadwalId) {
  const jadwalCards = document.querySelectorAll(".jadwal-card-edit");
  let selectedCard = null;

  // Highlight card yang sudah dipilih sebelumnya
  if (selectedJadwalId) {
    selectedCard = document.querySelector(
      `.jadwal-card-edit[data-jadwal-id="${selectedJadwalId}"]`
    );
  }

  jadwalCards.forEach((card) => {
    // Pastikan event listener hanya terpasang sekali
    card.removeEventListener('click', handleCardClick);
    card.addEventListener('click', handleCardClick);
    
    function handleCardClick() {
      const jadwalId = this.getAttribute("data-jadwal-id");
      const tanggal = this.querySelector("div:first-child").textContent;
      const namaTim = this.querySelector("div:nth-child(2)").textContent;
      const checkmark = this.querySelector(".checkmark-edit");

      // Reset semua cards
      jadwalCards.forEach((c) => {
        c.style.background = "white";
        c.style.borderColor = "#ddd";
        c.style.boxShadow = "none";
        const cm = c.querySelector(".checkmark-edit");
        if (cm) cm.style.display = "none";
      });

      // Set selected card baru
      this.style.background = "#e3f2fd";
      this.style.borderColor = "#007bff";
      this.style.boxShadow = "0 0 0 2px rgba(0, 123, 255, 0.25)";
      if (checkmark) {
        checkmark.style.display = "flex";
      }
      selectedCard = this;

      // Update hidden input dan info
      document.getElementById("idJadwal").value = jadwalId;
      
      // Update text display
      const selectedJadwalText = document.getElementById("selectedJadwalText");
      if (selectedJadwalText) {
        selectedJadwalText.textContent = `${tanggal} - ${namaTim}`;
      }
      
      // Tampilkan info box jika belum ditampilkan
      const selectedJadwalInfo = document.getElementById("selectedJadwalInfo");
      if (selectedJadwalInfo) {
        selectedJadwalInfo.style.display = "block";
      }
    }

    // Hover effects
    card.addEventListener("mouseenter", function () {
      if (this !== selectedCard) {
        this.style.background = "#f8f9fa";
        this.style.transform = "translateY(-2px)";
        this.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
      }
    });

    card.addEventListener("mouseleave", function () {
      if (this !== selectedCard) {
        this.style.background = this.getAttribute("data-jadwal-id") == selectedJadwalId ? "#e3f2fd" : "white";
        this.style.transform = "translateY(0)";
        this.style.boxShadow = this.getAttribute("data-jadwal-id") == selectedJadwalId 
          ? "0 0 0 2px rgba(0, 123, 255, 0.25)" 
          : "none";
      }
    });
  });
}

// Helper function untuk format tanggal
function formatDate(dateString) {
  if (!dateString) return "Tidak ada tanggal";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (error) {
    return dateString;
  }
}

async function viewDetailJadwal(detailId) {
  try {
    const detail = await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
      headers: getAuthHeaders(),
    });

    console.log("Detail untuk view:", detail); // Debug

    // Jika perlu data lengkap anggota dan jadwal, fetch secara terpisah
    let anggotaDetail = null;
    let jadwalDetail = null;

    if (detail.idAnggota) {
      try {
        anggotaDetail = await fetchAPI(`${API.anggota}${detail.idAnggota}/`, {
          headers: getAuthHeaders(),
        });
      } catch (error) {
        console.warn("Tidak bisa fetch detail anggota:", error);
      }
    }

    if (detail.idJadwal) {
      try {
        jadwalDetail = await fetchAPI(`${API.jadwal}${detail.idJadwal}/`, {
          headers: getAuthHeaders(),
        });
      } catch (error) {
        console.warn("Tidak bisa fetch detail jadwal:", error);
      }
    }

    const detailHTML = `
            <div>
                <h3>Detail Jadwal Anggota</h3>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 15px;">
                    <div style="display: grid; grid-template-columns: 150px 1fr; gap: 15px; margin-bottom: 20px;">
                        <div style="font-weight: 600; color: #555;">ID:</div>
                        <div>${detail.id || "N/A"}</div>
                        
                        <div style="font-weight: 600; color: #555;">Anggota:</div>
                        <div>
                            <strong>${
                              detail.nama_anggota ||
                              anggotaDetail?.nama ||
                              "N/A"
                            }</strong><br>
                            <small>${anggotaDetail?.alamat || ""}</small><br>
                            <small>Telp: ${
                              anggotaDetail?.noWA || ""
                            }</small><br>
                            <small style="color: #666;">ID: ${
                              detail.idAnggota || "N/A"
                            }</small>
                        </div>
                        
                        <div style="font-weight: 600; color: #555;">Jadwal:</div>
                        <div>
                            <strong>Tanggal: ${
                              detail.tanggal_jadwal ||
                              jadwalDetail?.tanggalJadwal ||
                              "N/A"
                            }</strong><br>
                            <small>Tim: ${
                              detail.nama_tim || jadwalDetail?.nama_tim || "N/A"
                            }</small><br>
                            <small>ID Jadwal: ${
                              detail.idJadwal || jadwalDetail?.idJadwal || "N/A"
                            }</small>
                        </div>
                        
                        <div style="font-weight: 600; color: #555;">Status:</div>
                        <div>
                            ${getStatusBadge(detail.status_pengangkutan)}
                        </div>
                        
                        <div style="font-weight: 600; color: #555;">Catatan:</div>
                        <div style="white-space: pre-wrap; background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
                            ${detail.catatan || "-"}
                        </div>
                        
                        <div style="font-weight: 600; color: #555;">Dibuat:</div>
                        <div>${
                          detail.created_at
                            ? new Date(detail.created_at).toLocaleString(
                                "id-ID"
                              )
                            : "N/A"
                        }</div>
                    </div>
                </div>
            </div>
        `;

    showModal("Detail Jadwal Anggota", detailHTML);
  } catch (error) {
    alert("Error loading detail: " + error.message);
  }
}

async function deleteDetailJadwal(detailId) {
  showConfirmModal(
    "Apakah Anda yakin ingin menghapus detail jadwal ini?",
    async () => {
      try {
        await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        // alert("Detail jadwal berhasil dihapus!");
        showToast("Detail jadwal berhasil dihapus", "success", 5000);
        
        loadDetailAnggotaJadwal();
      } catch (error) {
        alert("Error deleting detail: " + error.message);
      }
    }
  );
}

window.changeDetailPage = changeDetailPage;
window.changeDetailPerPage = changeDetailPerPage;
window.setupJadwalGridListeners = setupJadwalGridListeners;
window.removeSelectedJadwal = removeSelectedJadwal;
window.createMultiSelectJadwalGrid = createMultiSelectJadwalGrid;
window.createJadwalGrid = createJadwalGrid;
window.editDetailJadwal = editDetailJadwal;
window.viewDetailJadwal = viewDetailJadwal;
window.deleteDetailJadwal = deleteDetailJadwal;
window.updateSelectedJadwalInfoFromGlobal = updateSelectedJadwalInfo;
