import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showModal, showConfirmModal } from "../../utils/modal.js";

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
                        <div class="col-md-4">
                            <label for="filterDate" class="form-label">Tanggal</label>
                            <input type="date" id="filterDate" class="form-control">
                        </div>
                        <div class="col-md-4">
                            <label for="filterTim" class="form-label">Tim Pengangkut</label>
                            <select id="filterTim" class="form-select">
                                <option value="">Semua Tim</option>
                            </select>
                        </div>
                        <div class="col-md-4 d-flex align-items-end">
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
                    <div id="jadwalTableContainer">
                        <div class="text-center py-4">
                            <div class="spinner-border text-primary mb-3" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p>Memuat data jadwal...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Setup event listeners dengan pengecekan null
  const addJadwalBtn = document.getElementById("addJadwalBtn");
  if (addJadwalBtn) {
    addJadwalBtn.onclick = () => showAddJadwalForm();
  }

  const filterDate = document.getElementById("filterDate");
  if (filterDate) {
    filterDate.onchange = loadJadwal;
  }

  const filterTim = document.getElementById("filterTim");
  if (filterTim) {
    filterTim.onchange = loadJadwal;
  }

  const resetFilter = document.getElementById("resetFilter");
  if (resetFilter) {
    resetFilter.onclick = () => {
      if (filterDate) filterDate.value = "";
      if (filterTim) filterTim.value = "";
      loadJadwal();
    };
  }

  loadTimOptions();
  loadJadwal();
}

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

    const filteredJadwal = jadwal.filter((j) => {
      const matchDate = !filterDate || j.tanggalJadwal === filterDate;
      const matchTim = !filterTim || j.idTim == filterTim;
      return matchDate && matchTim;
    });

    renderJadwalTable(filteredJadwal);
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

  if (!jadwalList || jadwalList.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-calendar-x fs-1 text-muted mb-3"></i>
        <h5 class="text-muted">Tidak ada data jadwal</h5>
        <p class="text-muted">Gunakan filter atau tambah jadwal baru</p>
      </div>
    `;
    return;
  }

  const tableHTML = `
    <div class="table-responsive">
      <table class="table table-hover table-striped">
        <thead class="table-light">
          <tr>
            <th>ID</th>
            <th>Tanggal</th>
            <th>Nama Tim</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${jadwalList
            .map(
              (jadwal) => `
            <tr>
              <td class="fw-semibold">#${jadwal.idJadwal || jadwal.id}</td>
              <td>
                <div class="fw-semibold">${formatDate(jadwal.tanggalJadwal)}</div>
                <small class="text-muted">${getDayName(jadwal.tanggalJadwal)}</small>
              </td>
              <td>
                <div class="fw-medium">${jadwal.nama_tim || "Tim"}</div>
                <small class="text-muted">ID: ${jadwal.idTim}</small>
              </td>
              <td>
                <span class="badge ${getStatusBadge(jadwal.status)}">
                  ${jadwal.status || "terjadwal"}
                </span>
              </td>
              <td>
                <div class="btn-group" role="group">
                  <button onclick="viewDetail('${jadwal.idJadwal || jadwal.id}')" class="btn btn-sm btn-info" title="Detail">
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
  `;

  container.innerHTML = tableHTML;

  // Export functions to window
  window.viewDetail = viewDetail;
  window.editJadwal = editJadwal;
  window.deleteJadwal = deleteJadwal;
}

function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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

function getStatusBadge(status) {
  switch(status?.toLowerCase()) {
    case 'selesai':
      return 'bg-success';
    case 'berlangsung':
      return 'bg-warning';
    case 'dibatalkan':
      return 'bg-danger';
    default:
      return 'bg-primary';
  }
}

function showAddJadwalForm() {
  // Show loading state
  showModal("Tambah Jadwal Baru", `
    <div class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Memuat data tim...</p>
    </div>
  `, null, true);

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

      const today = new Date().toISOString().split("T")[0];

      const formHTML = `
        <form id="jadwalForm">
          <div class="mb-3">
            <label for="tanggalJadwal" class="form-label">Tanggal *</label>
            <input type="date" id="tanggalJadwal" class="form-control" value="${today}" required>
          </div>
          <div class="mb-3">
            <label for="idTim" class="form-label">Tim Pengangkut *</label>
            <select id="idTim" class="form-select" required>
              <option value="">Pilih Tim</option>
              ${timOptions}
            </select>
          </div>
          <div class="mb-3">
            <label for="keterangan" class="form-label">Keterangan (Opsional)</label>
            <textarea id="keterangan" class="form-control" rows="3" placeholder="Tambahkan keterangan jika perlu..."></textarea>
          </div>
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            Jadwal akan langsung aktif setelah dibuat. Anda dapat menambahkan anggota ke jadwal ini nanti.
          </div>
        </form>
      `;

      showModal("Tambah Jadwal Baru", formHTML, async () => {
        const tanggalJadwal = document.getElementById("tanggalJadwal");
        const idTim = document.getElementById("idTim");

        if (!tanggalJadwal?.value || !idTim?.value) {
          alert("Harap isi semua field yang wajib!");
          return false; // Prevent modal from closing
        }

        const jadwalData = {
          tanggalJadwal: tanggalJadwal.value,
          idTim: parseInt(idTim.value),
          keterangan: document.getElementById("keterangan")?.value || "",
          status: "terjadwal"
        };

        try {
          await fetchAPI(API.jadwal, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(jadwalData),
          });

          alert("Jadwal berhasil ditambahkan!");
          loadJadwal();
          return true; // Allow modal to close
        } catch (error) {
          alert("Error menambahkan jadwal: " + error.message);
          return false; // Prevent modal from closing
        }
      }, true);
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

async function viewDetail(jadwalId) {
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
                  
                  <dt>Status</dt>
                  <dd class="mb-3">
                    <span class="badge ${getStatusBadge(jadwal.status)}">
                      ${jadwal.status || "terjadwal"}
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
            
            ${jadwal.keterangan ? `
            <div class="mt-3">
              <dt>Keterangan</dt>
              <dd class="border rounded p-3 bg-light">
                ${jadwal.keterangan}
              </dd>
            </div>
            ` : ''}
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
      
      // Load anggota data
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
                <th>Alamat</th>
                <th>Status</th>
                <th>Waktu</th>
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
                    <td>${d.alamat || "-"}</td>
                    <td>
                      <span class="badge ${getStatusAnggotaBadge(d.status_pengangkutan)}">
                        ${d.status_pengangkutan || "terjadwal"}
                      </span>
                    </td>
                    <td>
                      <small class="text-muted">
                        ${d.waktu_pengangkutan || "-"}
                      </small>
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

async function editJadwal(jadwalId) {
  try {
    // Show loading modal
    showModal("Edit Jadwal", `
      <div class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Memuat data jadwal...</p>
      </div>
    `, null, true);

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

    const timOptions = timList
      .map(
        (tim) =>
          `<option value="${tim.idTim || tim.id}" ${
            tim.idTim == jadwal.idTim ? "selected" : ""
          }>${tim.namaTim}</option>`
      )
      .join("");

    const formHTML = `
      <form id="editJadwalForm">
        <div class="mb-3">
          <label for="tanggalJadwal" class="form-label">Tanggal *</label>
          <input type="date" id="tanggalJadwal" class="form-control" value="${jadwal.tanggalJadwal || ''}" required>
        </div>
        <div class="mb-3">
          <label for="idTim" class="form-label">Tim Pengangkut *</label>
          <select id="idTim" class="form-select" required>
            <option value="">Pilih Tim</option>
            ${timOptions}
          </select>
        </div>
        <div class="mb-3">
          <label for="keterangan" class="form-label">Keterangan</label>
          <textarea id="keterangan" class="form-control" rows="3">${jadwal.keterangan || ''}</textarea>
        </div>
        <div class="mb-3">
          <label for="status" class="form-label">Status</label>
          <select id="status" class="form-select">
            <option value="terjadwal" ${jadwal.status === 'terjadwal' ? 'selected' : ''}>Terjadwal</option>
            <option value="berlangsung" ${jadwal.status === 'berlangsung' ? 'selected' : ''}>Berlangsung</option>
            <option value="selesai" ${jadwal.status === 'selesai' ? 'selected' : ''}>Selesai</option>
            <option value="dibatalkan" ${jadwal.status === 'dibatalkan' ? 'selected' : ''}>Dibatalkan</option>
          </select>
        </div>
      </form>
    `;

    showModal("Edit Jadwal", formHTML, async () => {
      const tanggalJadwal = document.getElementById("tanggalJadwal");
      const idTim = document.getElementById("idTim");

      if (!tanggalJadwal?.value || !idTim?.value) {
        alert("Harap isi semua field yang wajib!");
        return false;
      }

      const jadwalData = {
        tanggalJadwal: tanggalJadwal.value,
        idTim: parseInt(idTim.value),
        keterangan: document.getElementById("keterangan")?.value || "",
        status: document.getElementById("status")?.value || "terjadwal"
      };

      try {
        await fetchAPI(`${API.jadwal}${jadwalId}/`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(jadwalData),
        });

        alert("Jadwal berhasil diperbarui!");
        loadJadwal();
        return true;
      } catch (error) {
        alert("Error memperbarui jadwal: " + error.message);
        return false;
      }
    }, true);
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

async function deleteJadwal(jadwalId) {
  showConfirmModal(
    "Konfirmasi Hapus Jadwal",
    `
    <div class="alert alert-warning">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      <strong>Perhatian!</strong>
      <p class="mt-2 mb-0">Apakah Anda yakin ingin menghapus jadwal ini?</p>
      <p class="mb-0">Semua data anggota yang terkait dengan jadwal ini juga akan dihapus.</p>
    </div>
    <p class="text-muted">Aksi ini tidak dapat dibatalkan.</p>
    `,
    async () => {
      try {
        await fetchAPI(`${API.jadwal}${jadwalId}/`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        showModal("Berhasil", `
          <div class="text-center py-4">
            <i class="bi bi-check-circle text-success fs-1 mb-3"></i>
            <h5>Jadwal berhasil dihapus!</h5>
          </div>
        `, null, true);
        
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
    }
  );
}