import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showModal, showConfirmModal } from "../../utils/modal.js";

import { showToast } from "../../utils/toast.js";

function showFormToast(message, type = "info") {
  if (typeof showToast === "function") {
    showToast(message, type, 5000);
  } else {
    alert(`${type.toUpperCase()}: ${message}`);
  }
}

function validatePembayaranInput({
  idAnggota,
  tanggalBayar,
  jumlahBayar,
  metodeBayar,
  statusBayar,
  buktiFile = null,
}) {
  const errors = [];

  if (!idAnggota) {
    errors.push("Anggota wajib dipilih");
  }

  if (!tanggalBayar) {
    errors.push("Tanggal bayar wajib diisi");
  }

  if (!jumlahBayar || isNaN(jumlahBayar) || Number(jumlahBayar) <= 0) {
    errors.push("Jumlah bayar harus berupa angka lebih dari 0");
  }

  if (!["Transfer", "Tunai"].includes(metodeBayar)) {
    errors.push("Metode bayar tidak valid");
  }

  if (!["pending", "lunas", "gagal"].includes(statusBayar)) {
    errors.push("Status bayar tidak valid");
  }

  // Validasi file (opsional)
  if (buktiFile) {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(buktiFile.type)) {
      errors.push("Bukti bayar harus berupa gambar (JPG, PNG, GIF)");
    }

    if (buktiFile.size > maxSize) {
      errors.push("Ukuran bukti bayar maksimal 5MB");
    }
  }

  return errors.length > 0 ? errors : null;
}

let pembayaranAllData = [];
let pembayaranCurrentPage = 1;
const pembayaranPerPage = 10;

export async function pembayaranAdminPage() {
  const mainContent = document.getElementById("mainContent");
  if (!document.getElementById("modalContainer")) {
    const modalContainer = document.createElement("div");
    modalContainer.id = "modalContainer";
    document.body.appendChild(modalContainer);
  }

  mainContent.innerHTML = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Manajemen Pembayaran</h2>
                <button id="addPembayaranBtn" class="btn btn-success">
                    <i class="bi bi-plus-circle"></i> Tambah Pembayaran
                </button>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-3">
                    <label for="filterDate" class="form-label">Tanggal</label>
                    <input type="date" id="filterDate" class="form-control">
                </div>
                <div class="col-md-3">
                    <label for="filterStatus" class="form-label">Status</label>
                    <select id="filterStatus" class="form-select">
                        <option value="">Semua Status</option>
                        <option value="pending">Pending</option>
                        <option value="lunas">Lunas</option>
                        <option value="gagal">Gagal</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label for="filterMetode" class="form-label">Metode</label>
                    <select id="filterMetode" class="form-select">
                        <option value="">Semua Metode</option>
                        <option value="Transfer">Transfer</option>
                        <option value="Tunai">Tunai</option>
                    </select>
                </div>
                <div class="col-md-3 d-flex align-items-end">
                    <button id="resetFilter" class="btn btn-secondary w-100">
                        <i class="bi bi-arrow-clockwise"></i> Reset Filter
                    </button>
                </div>
            </div>
            
            <!-- Info Pagination -->
            <div id="paginationInfo" class="mb-2 text-muted"></div>
            
            <!-- Tabel Container -->
            <div id="pembayaranTableContainer" class="table-responsive">
                <p>Loading data...</p>
            </div>
            
            <!-- Pagination Container -->
            <div id="paginationContainer" class="mt-3 d-flex justify-content-center"></div>
        </div>
    `;

  // Reset variabel pagination
  pembayaranCurrentPage = 1;
  pembayaranAllData = [];

  document.getElementById("addPembayaranBtn").onclick = () =>
    showAddPembayaranForm();
  document.getElementById("filterDate").onchange = loadPembayaran;
  document.getElementById("filterStatus").onchange = loadPembayaran;
  document.getElementById("filterMetode").onchange = loadPembayaran;
  document.getElementById("resetFilter").onclick = () => {
    document.getElementById("filterDate").value = "";
    document.getElementById("filterStatus").value = "";
    document.getElementById("filterMetode").value = "";
    loadPembayaran();
  };

  loadPembayaran();
}

// Fungsi untuk validasi Bootstrap dengan styling
function setupBootstrapValidation(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  // Reset semua pesan validasi
  const invalidFeedbacks = form.querySelectorAll(".invalid-feedback");
  invalidFeedbacks.forEach((feedback) => {
    feedback.style.display = "none";
  });

  // Hapus kelas validasi sebelumnya
  const inputs = form.querySelectorAll("input, select");
  inputs.forEach((input) => {
    input.classList.remove("is-valid", "is-invalid");
  });

  // Validasi real-time
  inputs.forEach((input) => {
    input.addEventListener("blur", function () {
      validateSingleField(this);
    });
  });
}

function validateSingleField(field) {
  // Hapus kelas validasi sebelumnya
  field.classList.remove("is-valid", "is-invalid");

  const feedbackElement = field.nextElementSibling;

  if (field.checkValidity()) {
    field.classList.add("is-valid");
    if (
      feedbackElement &&
      feedbackElement.classList.contains("valid-feedback")
    ) {
      feedbackElement.style.display = "block";
    }
  } else {
    field.classList.add("is-invalid");
    if (
      feedbackElement &&
      feedbackElement.classList.contains("invalid-feedback")
    ) {
      feedbackElement.style.display = "block";
    }
  }
}

function validateForm(formId) {
  const form = document.getElementById(formId);
  let isValid = true;

  // Validasi semua field required
  const requiredFields = form.querySelectorAll("[required]");
  requiredFields.forEach((field) => {
    validateSingleField(field);

    if (!field.checkValidity()) {
      isValid = false;
    }
  });

  // Validasi custom
  if (formId === "pembayaranForm" || formId === "editPembayaranForm") {
    const jumlahBayar = document.getElementById("jumlahBayar");
    if (jumlahBayar) {
      const value = parseFloat(jumlahBayar.value);
      if (isNaN(value) || value <= 0) {
        jumlahBayar.classList.add("is-invalid");
        let feedback = jumlahBayar.nextElementSibling;
        if (!feedback || !feedback.classList.contains("invalid-feedback")) {
          feedback = document.createElement("div");
          feedback.className = "invalid-feedback";
          jumlahBayar.parentNode.insertBefore(
            feedback,
            jumlahBayar.nextSibling
          );
        }
        feedback.textContent = "Jumlah bayar harus lebih dari 0";
        feedback.style.display = "block";
        isValid = false;
      }
    }
  }

  return isValid;
}

async function loadPembayaran() {
  const filterDate = document.getElementById("filterDate").value;
  const filterStatus = document.getElementById("filterStatus").value;
  const filterMetode = document.getElementById("filterMetode").value;

  try {
    const pembayaran = await fetchAPI(API.pembayaran, {
      headers: getAuthHeaders(),
    });

    const filteredPembayaran = pembayaran.filter((p) => {
      const matchDate = !filterDate || p.tanggalBayar === filterDate;
      const matchStatus = !filterStatus || p.statusBayar === filterStatus;
      const matchMetode = !filterMetode || p.metodeBayar === filterMetode;
      return matchDate && matchStatus && matchMetode;
    });

    // Simpan data ke variabel global dan render dengan pagination
    pembayaranAllData = filteredPembayaran;
    pembayaranCurrentPage = 1;
    renderPembayaranTableWithPagination();
  } catch (error) {
    document.getElementById("pembayaranTableContainer").innerHTML =
      `<p style="color: red; padding: 20px; text-align: center;">Error loading pembayaran: ${error.message}</p>`;
    document.getElementById("paginationContainer").innerHTML = "";
    document.getElementById("paginationInfo").innerHTML = "";
  }
}

function renderPembayaranTableWithPagination() {
  const container = document.getElementById("pembayaranTableContainer");
  const paginationInfo = document.getElementById("paginationInfo");

  if (!pembayaranAllData || pembayaranAllData.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
        <div style="font-size: 48px; color: #ddd;">💰</div>
        <h3 style="color: #666;">Tidak ada data pembayaran</h3>
        <p style="color: #888;">Coba ubah filter pencarian</p>
      </div>
    `;
    paginationInfo.innerHTML = "";
    document.getElementById("paginationContainer").innerHTML = "";
    return;
  }

  // Hitung data untuk halaman saat ini
  const startIndex = (pembayaranCurrentPage - 1) * pembayaranPerPage;
  const endIndex = Math.min(
    startIndex + pembayaranPerPage,
    pembayaranAllData.length
  );
  const currentPageData = pembayaranAllData.slice(startIndex, endIndex);

  // Update info pagination
  paginationInfo.innerHTML = `
    Menampilkan <strong>${startIndex + 1} - ${endIndex}</strong> dari <strong>${
      pembayaranAllData.length
    }</strong> pembayaran
  `;

  // Render tabel dengan data halaman saat ini
  renderPembayaranTable(currentPageData);

  // Render pagination controls
  renderPaginationControls();
}

function renderPembayaranTable(pembayaranList) {
  const container = document.getElementById("pembayaranTableContainer");

  const tableHTML = `
        <table style="width: 100%; border-collapse: collapse; background: white;">
            <thead>
                <tr style="background: #f2f2f2;">
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">ID</th>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Anggota</th>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Tanggal</th>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Jumlah</th>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Metode</th>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Status</th>
                    <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                ${pembayaranList
                  .map(
                    (p) => `
                    <tr>
                        <td style="padding: 12px; border: 1px solid #ddd;">${
                          p.idPembayaran
                        }</td>
                        <td style="padding: 12px; border: 1px solid #ddd;">${
                          p.nama_anggota || "N/A"
                        }</td>
                        <td style="padding: 12px; border: 1px solid #ddd;">${
                          p.tanggalBayar
                        }</td>
                        <td style="padding: 12px; border: 1px solid #ddd;">Rp ${p.jumlahBayar.toLocaleString()}</td>
                        <td style="padding: 12px; border: 1px solid #ddd;">${
                          p.metodeBayar
                        }</td>
                        <td style="padding: 12px; border: 1px solid #ddd;">
                            <span style="
                                padding: 6px 12px;
                                border-radius: 20px;
                                background: ${getStatusColor(p.statusBayar)};
                                color: white;
                                font-size: 12px;
                                font-weight: bold;
                                display: inline-block;
                                text-transform: uppercase;
                            ">${p.statusBayar}</span>
                        </td>
                        <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">
                            <button onclick="viewDetailPembayaran(${
                              p.idPembayaran
                            })" style="padding: 6px 12px; margin-right: 5px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                <i class="bi bi-eye"></i> Detail
                            </button>
                            <button onclick="editPembayaran(${
                              p.idPembayaran
                            })" style="padding: 6px 12px; margin-right: 5px; background: #ffc107; color: #000; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                <i class="bi bi-pencil"></i> Edit
                            </button>
                            <button onclick="deletePembayaran(${
                              p.idPembayaran
                            })" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                <i class="bi bi-trash"></i> Hapus
                            </button>
                        </td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
    `;

  container.innerHTML = tableHTML;
}

function renderPaginationControls() {
  const container = document.getElementById("paginationContainer");
  if (!container) return;

  const totalPages = Math.ceil(pembayaranAllData.length / pembayaranPerPage);

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = `
    <div style="display: flex; gap: 5px; align-items: center; flex-wrap: wrap;">
      <!-- Previous Button -->
      <button ${pembayaranCurrentPage === 1 ? "disabled" : ""}
        onclick="goToPembayaranPage(${pembayaranCurrentPage - 1})"
        style="padding: 8px 16px; border: 1px solid #ddd; background: ${
          pembayaranCurrentPage === 1 ? "#f5f5f5" : "white"
        }; 
               color: ${
                 pembayaranCurrentPage === 1 ? "#999" : "#333"
               }; border-radius: 4px; cursor: ${
                 pembayaranCurrentPage === 1 ? "not-allowed" : "pointer"
               };">
        ← Prev
      </button>
  `;

  // Tampilkan maksimal 5 nomor halaman
  let startPage = Math.max(1, pembayaranCurrentPage - 2);
  let endPage = Math.min(totalPages, pembayaranCurrentPage + 2);

  // Adjust if near start
  if (pembayaranCurrentPage <= 3) {
    endPage = Math.min(5, totalPages);
  }

  // Adjust if near end
  if (pembayaranCurrentPage >= totalPages - 2) {
    startPage = Math.max(1, totalPages - 4);
  }

  // First page
  if (startPage > 1) {
    html += `
      <button onclick="goToPembayaranPage(1)"
        style="padding: 8px 16px; border: 1px solid #ddd; background: white; color: #333; border-radius: 4px; cursor: pointer;">
        1
      </button>
    `;
    if (startPage > 2) {
      html += `<span style="padding: 8px 4px;">...</span>`;
    }
  }

  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    html += `
      <button onclick="goToPembayaranPage(${i})"
        style="padding: 8px 16px; border: 1px solid #ddd; 
               background: ${
                 i === pembayaranCurrentPage ? "#007bff" : "white"
               }; 
               color: ${i === pembayaranCurrentPage ? "white" : "#333"}; 
               border-radius: 4px; cursor: pointer; font-weight: ${
                 i === pembayaranCurrentPage ? "bold" : "normal"
               };">
        ${i}
      </button>
    `;
  }

  // Last page
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<span style="padding: 8px 4px;">...</span>`;
    }
    html += `
      <button onclick="goToPembayaranPage(${totalPages})"
        style="padding: 8px 16px; border: 1px solid #ddd; background: white; color: #333; border-radius: 4px; cursor: pointer;">
        ${totalPages}
      </button>
    `;
  }

  html += `
      <!-- Next Button -->
      <button ${pembayaranCurrentPage === totalPages ? "disabled" : ""}
        onclick="goToPembayaranPage(${pembayaranCurrentPage + 1})"
        style="padding: 8px 16px; border: 1px solid #ddd; background: ${
          pembayaranCurrentPage === totalPages ? "#f5f5f5" : "white"
        }; 
               color: ${
                 pembayaranCurrentPage === totalPages ? "#999" : "#333"
               }; border-radius: 4px; cursor: ${
                 pembayaranCurrentPage === totalPages
                   ? "not-allowed"
                   : "pointer"
               };">
        Next →
      </button>
    </div>
  `;

  container.innerHTML = html;
}

function goToPembayaranPage(page) {
  if (
    page < 1 ||
    page > Math.ceil(pembayaranAllData.length / pembayaranPerPage)
  ) {
    return;
  }

  pembayaranCurrentPage = page;
  renderPembayaranTableWithPagination();

  // Scroll ke atas tabel
  document.getElementById("pembayaranTableContainer").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function getStatusColor(status) {
  if (!status) return "#6c757d";

  const statusLower = String(status).toLowerCase();
  const colors = {
    lunas: "#28a745",
    paid: "#28a745",
    selesai: "#28a745",
    pending: "#ffc107",
    waiting: "#ffc107",
    gagal: "#dc3545",
    failed: "#dc3545",
    expired: "#6c757d",
    canceled: "#6c757d",
  };

  return colors[statusLower] || "#6c757d";
}

async function showAddPembayaranForm() {
  try {
    const anggota = await fetchAPI(API.anggota, { headers: getAuthHeaders() });

    const anggotaOptions = anggota
      .map((a) => `<option value="${a.idAnggota}">${a.nama}</option>`)
      .join("");

    const today = new Date().toISOString().split("T")[0];

    const formHTML = `
            <form id="pembayaranForm" class="needs-validation" novalidate>
                <div class="mb-3">
                    <label for="idAnggota" class="form-label">Anggota *</label>
                    <select id="idAnggota" class="form-select" required>
                        <option value="">Pilih Anggota</option>
                        ${anggotaOptions}
                    </select>
                    <div class="invalid-feedback">Silakan pilih anggota.</div>
                </div>
                
                <div class="mb-3">
                    <label for="tanggalBayar" class="form-label">Tanggal Bayar *</label>
                    <input type="date" id="tanggalBayar" class="form-control" value="${today}" required>
                    <div class="invalid-feedback">Silakan isi tanggal bayar.</div>
                </div>
                
                <div class="mb-3">
                    <label for="jumlahBayar" class="form-label">Jumlah Bayar (Rp) *</label>
                    <input type="number" id="jumlahBayar" class="form-control" placeholder="50000" min="1" required>
                    <div class="invalid-feedback">Jumlah bayar harus lebih dari 0.</div>
                </div>
                
                <div class="mb-3">
                    <label for="metodeBayar" class="form-label">Metode Bayar *</label>
                    <select id="metodeBayar" class="form-select" required>
                        <option value="Transfer">Transfer</option>
                        <option value="Tunai">Tunai</option>
                    </select>
                    <div class="invalid-feedback">Silakan pilih metode bayar.</div>
                </div>
                
                <div class="mb-3">
                    <label for="statusBayar" class="form-label">Status Bayar *</label>
                    <select id="statusBayar" class="form-select" required>
                        <option value="pending">Pending</option>
                        <option value="lunas">Lunas</option>
                        <option value="gagal">Gagal</option>
                    </select>
                    <div class="invalid-feedback">Silakan pilih status bayar.</div>
                </div>
                
                <div class="mb-3">
                    <label for="buktiBayar" class="form-label">Bukti Bayar (Opsional)</label>
                    <input type="file" id="buktiBayar" class="form-control" accept="image/*">
                    <div class="form-text">Format: JPG, PNG, GIF (max 5MB)</div>
                    <div class="invalid-feedback" id="fileError"></div>
                </div>
            </form>
        `;

    showModal(
      "Tambah Pembayaran",
      formHTML,
      async () => {
        // Setup validasi Bootstrap
        setupBootstrapValidation("pembayaranForm");

        // Validasi form
        if (!validateForm("pembayaranForm")) {
          return false;
        }

        const idAnggota = document.getElementById("idAnggota").value;
        const tanggalBayar = document.getElementById("tanggalBayar").value;
        const jumlahBayar = document.getElementById("jumlahBayar").value;
        const metodeBayar = document.getElementById("metodeBayar").value;
        const statusBayar = document.getElementById("statusBayar").value;
        const fileInput = document.getElementById("buktiBayar");
        const buktiFile = fileInput.files[0] || null;

        // ✅ Validasi file jika ada
        if (buktiFile) {
          const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/gif",
          ];
          const maxSize = 5 * 1024 * 1024; // 5MB

          if (!allowedTypes.includes(buktiFile.type)) {
            fileInput.classList.add("is-invalid");
            document.getElementById("fileError").textContent =
              "Bukti bayar harus berupa gambar (JPG, PNG, GIF)";
            document.getElementById("fileError").style.display = "block";
            return false;
          }

          if (buktiFile.size > maxSize) {
            fileInput.classList.add("is-invalid");
            document.getElementById("fileError").textContent =
              "Ukuran bukti bayar maksimal 5MB";
            document.getElementById("fileError").style.display = "block";
            return false;
          }
        }

        const formData = new FormData();
        formData.append("idAnggota", idAnggota);
        formData.append("tanggalBayar", tanggalBayar);
        formData.append("jumlahBayar", jumlahBayar);
        formData.append("metodeBayar", metodeBayar);
        formData.append("statusBayar", statusBayar);

        if (buktiFile) {
          formData.append("buktiBayar", buktiFile);
        }

        try {
          const headers = {};
          const token = localStorage.getItem("access");
          if (token) headers.Authorization = `Bearer ${token}`;

          const response = await fetch(API.pembayaran, {
            method: "POST",
            headers,
            body: formData,
          });

          if (!response.ok) {
            const err = await response.text();
            throw new Error(err || "Gagal menambah pembayaran");
          }

          showFormToast("Pembayaran berhasil ditambahkan", "success");
          pembayaranCurrentPage = 1;
          loadPembayaran();
          return true;
        } catch (error) {
          showFormToast(error.message, "danger");
          return false;
        }
      },
      () => {
        // Setup validasi setelah modal ditampilkan
        setTimeout(() => setupBootstrapValidation("pembayaranForm"), 100);
      }
    );
  } catch (error) {
    showFormToast("Error loading anggota: " + error.message, "danger");
  }
}

async function editPembayaran(pembayaranId) {
  try {
    const pembayaran = await fetchAPI(`${API.pembayaran}${pembayaranId}/`, {
      headers: getAuthHeaders(),
    });

    const anggotaId =
      pembayaran.anggota || pembayaran.anggota_id || pembayaran.idAnggota;

    const formHTML = `
      <form id="editPembayaranForm" class="needs-validation" novalidate>

        <div class="mb-3">
          <label class="form-label">Tanggal Bayar *</label>
          <input type="date" id="tanggalBayar" class="form-control"
                 value="${pembayaran.tanggalBayar || ""}" required>
          <div class="invalid-feedback">Silakan isi tanggal bayar</div>
        </div>

        <div class="mb-3">
          <label class="form-label">Jumlah Bayar *</label>
          <input type="number" id="jumlahBayar" class="form-control"
                 value="${pembayaran.jumlahBayar || 0}" required min="1">
        </div>

        <div class="mb-3">
          <label class="form-label">Metode Bayar *</label>
          <select id="metodeBayar" class="form-select" required>
            <option value="Transfer" ${pembayaran.metodeBayar === "Transfer" ? "selected" : ""}>Transfer</option>
            <option value="Tunai" ${pembayaran.metodeBayar === "Tunai" ? "selected" : ""}>Tunai</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">Status Bayar *</label>
          <select id="statusBayar" class="form-select" required>
            <option value="pending" ${pembayaran.statusBayar === "pending" ? "selected" : ""}>Pending</option>
            <option value="lunas" ${pembayaran.statusBayar === "lunas" ? "selected" : ""}>Lunas</option>
            <option value="gagal" ${pembayaran.statusBayar === "gagal" ? "selected" : ""}>Gagal</option>
          </select>
        </div>

        <div class="form-check mb-3" id="perpanjangContainer" style="display:none;">
          <input class="form-check-input" type="checkbox" id="perpanjangAnggota" checked>
          <label class="form-check-label">
            Perpanjang keanggotaan 1 bulan
          </label>
        </div>

        <div class="mb-3">
          <label class="form-label">Ubah Bukti Bayar</label>
          <input type="file" id="buktiBayar" class="form-control" accept="image/*">
        </div>
      </form>
    `;

    showModal(
      "Edit Pembayaran",
      formHTML,
      async () => {
        if (!validateForm("editPembayaranForm")) return false;

        const statusBayar = document.getElementById("statusBayar").value;
        const statusLama = pembayaran.statusBayar;

        const formData = new FormData();
        formData.append("tanggalBayar", document.getElementById("tanggalBayar").value);
        formData.append("jumlahBayar", document.getElementById("jumlahBayar").value);
        formData.append("metodeBayar", document.getElementById("metodeBayar").value);
        formData.append("statusBayar", statusBayar);

        const buktiFile = document.getElementById("buktiBayar").files[0];
        if (buktiFile) formData.append("buktiBayar", buktiFile);

        await fetch(`${API.pembayaran}${pembayaranId}/`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
          body: formData,
        });

        /* =========================
          PERPANJANG KEANGGOTAAN
        ========================= */
        if (
          statusBayar === "lunas" &&
          statusLama !== "lunas" &&
          anggotaId &&
          document.getElementById("perpanjangAnggota")?.checked
        ) {
          try {
            const res = await fetch(`${API.anggota}${anggotaId}/`, {
              headers: getAuthHeaders(),
            });

            if (!res.ok) return;

            const anggota = await res.json();

            // =====================
            // HITUNG TANGGAL END BARU
            // =====================
            const now = new Date();
            let baseDate = now;

            if (anggota.tanggalEnd) {
              const oldEnd = new Date(anggota.tanggalEnd);
              if (oldEnd > now) baseDate = oldEnd;
            }

            baseDate.setMonth(baseDate.getMonth() + 1);
            const tanggalEnd = baseDate.toISOString().split("T")[0];

            // =====================
            // PAYLOAD UPDATE
            // =====================
            const payload = {
              tanggalEnd,
            };

            // 👉 hanya aktifkan jika sebelumnya non-aktif
            if (anggota.status === "non-aktif") {
              payload.status = "aktif";
            }

            await fetch(`${API.anggota}${anggotaId}/`, {
              method: "PATCH",
              headers: {
                ...getAuthHeaders(),
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });

            console.log(
              `✅ Anggota diperpanjang sampai ${tanggalEnd}, status: ${
                payload.status || anggota.status
              }`
            );

          } catch (err) {
            console.warn("⚠️ Gagal update anggota:", err);
          }
        }

        loadPembayaran();
        showFormToast("Pembayaran berhasil diperbarui", "success");
        return true;
      }
    );

    /* =========================
       🔥 OBSERVER (KUNCI MASALAH)
    ========================= */
    const observer = new MutationObserver(() => {
      const statusSelect = document.getElementById("statusBayar");
      const container = document.getElementById("perpanjangContainer");

      if (!statusSelect || !container) return;

      const toggle = () => {
        if (statusSelect.value === "lunas" && anggotaId) {
          container.style.display = "block";
        } else {
          container.style.display = "none";
          const cb = document.getElementById("perpanjangAnggota");
          if (cb) cb.checked = false;
        }
      };

      statusSelect.addEventListener("change", toggle);
      toggle(); // init awal

      observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });

  } catch (err) {
    showFormToast("Gagal memuat data pembayaran", "danger");
    console.error(err);
  }
}


async function viewDetailPembayaran(pembayaranId) {
  try {
    console.log("Fetching detail pembayaran dengan ID:", pembayaranId);

    const pembayaran = await fetchAPI(`${API.pembayaran}${pembayaranId}/`, {
      headers: getAuthHeaders(),
    });

    console.log("Data pembayaran yang diterima:", pembayaran);

    // Validasi data
    if (!pembayaran) {
      throw new Error("Data pembayaran tidak ditemukan");
    }

    // Buat URL bukti bayar yang aman
    let buktiBayarUrl = "";
    if (pembayaran.bukti_bayar_url) {
      buktiBayarUrl = pembayaran.bukti_bayar_url;
    } else if (pembayaran.buktiBayar) {
      buktiBayarUrl = pembayaran.buktiBayar;
    } else if (
      typeof pembayaran.bukti_bayar === "string" &&
      pembayaran.bukti_bayar.startsWith("http")
    ) {
      buktiBayarUrl = pembayaran.bukti_bayar;
    }

    const buktiHTML = buktiBayarUrl
      ? `<div style="margin-top: 15px;">
                <strong>Bukti Bayar:</strong><br>
                <img src="${buktiBayarUrl}" 
                     alt="Bukti Pembayaran"
                     style="max-width: 100%; max-height: 300px; margin-top: 10px; border: 1px solid #ddd; border-radius: 4px; object-fit: contain;">
                <div style="margin-top: 10px;">
                  <a href="${buktiBayarUrl}" target="_blank" 
                     style="color: #007bff; text-decoration: none;">
                    <i class="bi bi-box-arrow-up-right"></i> Buka di tab baru
                  </a>
                </div>
            </div>`
      : "<p style='color: #666; font-style: italic;'>Tidak ada bukti bayar</p>";

    // Format tanggal
    const formatDate = (dateString) => {
      if (!dateString) return "-";
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      } catch {
        return dateString;
      }
    };

    const detailHTML = `
      <div style="max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h3 style="margin: 0; display: flex; align-items: center; gap: 10px;">
            <i class="bi bi-receipt"></i> Detail Pembayaran
          </h3>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">ID: #${
            pembayaran.idPembayaran || pembayaranId
          }</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #28a745;">
              <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Anggota</div>
              <div style="font-weight: 600; color: #333;">${
                pembayaran.nama_anggota || "N/A"
              }</div>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #17a2b8;">
              <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Tanggal Bayar</div>
              <div style="font-weight: 600; color: #333;">${formatDate(
                pembayaran.tanggalBayar
              )}</div>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107;">
              <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Jumlah Bayar</div>
              <div style="font-weight: 600; color: #28a745;">
                Rp ${(pembayaran.jumlahBayar || 0).toLocaleString("id-ID")}
              </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #6f42c1;">
              <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Metode Bayar</div>
              <div style="font-weight: 600; color: #333;">${
                pembayaran.metodeBayar || "N/A"
              }</div>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Status Bayar</div>
              <span style="
                padding: 6px 16px;
                border-radius: 20px;
                background: ${getStatusColor(pembayaran.statusBayar)};
                color: white;
                font-size: 14px;
                font-weight: bold;
                text-transform: uppercase;
                display: inline-block;
              ">
                ${pembayaran.statusBayar || "pending"}
              </span>
            </div>
          </div>
          
          <div style="margin-top: 20px;">
            <h4 style="margin-bottom: 15px; color: #333; display: flex; align-items: center; gap: 8px;">
              <i class="bi bi-image"></i> Bukti Bayar
            </h4>
            ${buktiHTML}
          </div>
          
          ${
            pembayaran.keterangan
              ? `
            <div style="margin-top: 20px;">
              <h4 style="margin-bottom: 10px; color: #333; display: flex; align-items: center; gap: 8px;">
                <i class="bi bi-chat-left-text"></i> Keterangan
              </h4>
              <div style="background: #e9ecef; padding: 12px; border-radius: 6px; font-size: 14px; color: #495057;">
                ${pembayaran.keterangan}
              </div>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;

    showModal("Detail Pembayaran", detailHTML);
  } catch (error) {
    console.error("Error loading detail:", error);

    const errorHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <div style="font-size: 48px; color: #dc3545; margin-bottom: 20px;">
          <i class="bi bi-exclamation-triangle"></i>
        </div>
        <h3 style="color: #dc3545; margin-bottom: 10px;">Gagal Memuat Detail</h3>
        <p style="color: #666; margin-bottom: 5px;">Terjadi kesalahan saat mengambil data pembayaran.</p>
        <p style="color: #999; font-size: 14px;">${error.message}</p>
        <button onclick="viewDetailPembayaran(${pembayaranId})" 
                style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          <i class="bi bi-arrow-clockwise"></i> Coba Lagi
        </button>
      </div>
    `;

    showModal("Error", errorHTML);
  }
}

async function deletePembayaran(pembayaranId) {
  showConfirmModal(
    "Apakah Anda yakin ingin menghapus pembayaran ini?",
    async () => {
      try {
        const response = await fetch(`${API.pembayaran}${pembayaranId}/`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP ${response.status}`);
        }

        showFormToast("Pembayaran berhasil dihapus!", "success");
        pembayaranCurrentPage = 1;
        loadPembayaran();
      } catch (error) {
        alert("Error deleting pembayaran: " + error.message);
      }
    }
  );
}

window.goToPembayaranPage = goToPembayaranPage;
window.viewDetailPembayaran = viewDetailPembayaran;
window.editPembayaran = editPembayaran;
window.deletePembayaran = deletePembayaran;
window.showAddPembayaranForm = showAddPembayaranForm;
window.loadPembayaran = loadPembayaran;
