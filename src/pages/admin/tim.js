import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showModal, showConfirmModal } from "../../utils/modal.js";
import { showToast } from "../../utils/toast.js";

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

function showFormToast(message, type = 'info') {
  if (typeof showToast === 'function') {
    showToast(message, type, 5000);
  } else {
    alert(`${type.toUpperCase()}: ${message}`);
  }
}

function validateTimInput(namaTim, noWhatsapp) {
  const errors = [];
  
  if (!namaTim || namaTim.trim().length < 3) {
    errors.push("Nama tim wajib diisi dan minimal 3 karakter.");
  }

  if (!noWhatsapp) {
    errors.push("No WhatsApp wajib diisi.");
  } else {
    if (!/^[0-9]+$/.test(noWhatsapp)) {
      errors.push("No WhatsApp hanya boleh berisi angka.");
    }

    if (noWhatsapp.length < 9 || noWhatsapp.length > 12) {
      errors.push("No WhatsApp harus 9–12 digit.");
    }
  }

  return errors.length > 0 ? errors.join(" ") : null;
}

function validatePhoneNumber(noWhatsapp) {
  if (!noWhatsapp) {
    return { 
      valid: false, 
      message: 'Nomor WhatsApp wajib diisi',
      cleanNoWA: ''
    };
  }
  
  // Hapus semua karakter non-digit
  const cleanNoWA = noWhatsapp.toString().replace(/\D/g, '');
  
  // Validasi panjang nomor (9-12 digit untuk berbagai format)
  if (cleanNoWA.length < 9 ) {
    return { 
      valid: false, 
      message: 'Nomor WhatsApp terlalu pendek (minimal 9 digit)',
      cleanNoWA: cleanNoWA
    };
  }
  
  if (cleanNoWA.length > 12) {
    return { 
      valid: false, 
      message: 'Nomor WhatsApp terlalu panjang (maksimal 12 digit)',
      cleanNoWA: cleanNoWA
    };
  }
  
  return { valid: true, cleanNoWA: cleanNoWA };
}

export async function timAdminPage() {
  const mainContent = document.getElementById("mainContent");
  
  if (!document.getElementById('modalContainer')) {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modalContainer';
    document.body.appendChild(modalContainer);
  }
  
  mainContent.innerHTML = `
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="text-success">
          <i class="bi bi-people-fill me-2"></i>Manajemen Tim Pengangkut
        </h2>
      </div>
      
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="input-group">
            <span class="input-group-text bg-success text-white border-success">
              <i class="bi bi-search"></i>
            </span>
            <input type="text" id="searchTim" class="form-control border-success" 
                   placeholder="Cari nama tim...">
          </div>
        </div>
      </div>
      
      <div class="card border-success shadow-sm">
        <div class="card-header bg-success bg-opacity-10 border-success">
          <h5 class="mb-0 text-success">
            <i class="bi bi-list-ul me-2"></i>Daftar Tim Saya
          </h5>
        </div>
        <div class="card-body">
          <div id="timTableContainer">
            <div class="text-center py-5">
              <div class="spinner-border text-success" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2 text-muted">Memuat data tim...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("searchTim").oninput = loadTim;

  loadTim();
}

async function loadTim() {
  const search = document.getElementById("searchTim")?.value || "";

  try {
    const response = await fetchAPI(API.timPengangkut, {
      headers: getAuthHeaders(),
    });

    const timList = response.data || response || [];
    
    // Filter berdasarkan pencarian
    const filteredTim = timList.filter((tim) =>
      tim.namaTim.toLowerCase().includes(search.toLowerCase()) ||
      (tim.user_username && tim.user_username.toLowerCase().includes(search.toLowerCase()))
    );

    renderTimTable(filteredTim);
  } catch (error) {
    console.error("Error loading tim:", error);
    document.getElementById("timTableContainer").innerHTML = `
      <div class="alert alert-danger alert-dismissible fade show">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <strong>Error:</strong> Gagal memuat data tim: ${error.message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>`;
  }
}

function renderTimTable(timList) {
  const container = document.getElementById("timTableContainer");

  const tableHTML = `
    <div class="table-responsive">
      <table class="table table-hover">
        <thead class="table-success">
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Nama Tim</th>
            <th scope="col">No WhatsApp</th>
            <th scope="col" class="text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${timList.map((tim) => `
            <tr>
              <td class="align-middle">
                <span class="badge bg-secondary">${tim.idTim || tim.id}</span>
              </td>
              <td class="align-middle fw-bold">
                <div class="d-flex align-items-center">
                  <div class="bg-success bg-opacity-10 p-2 rounded me-2">
                    <i class="bi bi-people-fill text-success"></i>
                  </div>
                  ${tim.namaTim}
                </div>
              </td>
              <td class="align-middle">
                <a href="https://wa.me/${tim.noWhatsapp}" target="_blank" 
                   class="badge bg-success text-decoration-none">
                  <i class="bi bi-whatsapp me-1"></i> ${tim.noWhatsapp}
                </a>
              </td>
              <td class="text-center">
                <div class="btn-group btn-group-sm" role="group">
                  <button onclick="window.editTim(${tim.idTim || tim.id})" 
                          class="btn btn-outline-warning" title="Edit">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button onclick="window.deleteTim(${tim.idTim || tim.id})" 
                          class="btn btn-outline-danger" title="Hapus">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = tableHTML;
}

async function editTim(timId) {
  try {
    const response = await fetchAPI(`${API.timPengangkut}${timId}/`, {
      headers: getAuthHeaders(),
    });

    const tim = response.data || response;
    const originalNamaTim = tim.namaTim;
    const originalNoWhatsapp = tim.noWhatsapp;

    const formHTML = `
      <div class="tim-form-container">
        <form id="editTimForm" class="needs-validation" novalidate>
          <div class="mb-4">
            <label for="namaTim" class="form-label">
              <i class="bi bi-card-text text-warning me-1"></i>Nama Tim *
            </label>
            <input type="text" class="form-control" 
                   id="namaTim" 
                   value="${tim.namaTim}" 
                   placeholder="Contoh: Tim Pengangkut Utara"
                   required
                   minlength="3">
            <div class="valid-feedback">
              <i class="bi bi-check-circle-fill me-1"></i> Nama tim valid.
            </div>
            <div class="invalid-feedback">
              <i class="bi bi-exclamation-circle-fill me-1"></i> Nama tim wajib diisi dan minimal 3 karakter.
            </div>
          </div>
          
          <div class="mb-4">
            <label for="noWhatsapp" class="form-label">
              <i class="bi bi-whatsapp text-warning me-1"></i>No WhatsApp *
            </label>
            <div class="input-group">
              <input type="tel"
                     class="form-control" 
                     id="noWhatsapp"
                     maxlength = "12"
                     value="${tim.noWhatsapp}"
                     required
                     placeholder="Contoh: 081234567890"
                     oninput="this.value=this.value.replace(/[^0-9]/g,'')">
            </div>
            <div class="valid-feedback">
              <i class="bi bi-check-circle-fill me-1"></i> Nomor WhatsApp valid.
            </div>
            <div class="invalid-feedback">
              <i class="bi bi-exclamation-circle-fill me-1"></i> Masukkan nomor WhatsApp yang valid.
            </div>
            <small class="text-muted mt-1">
              <i class="bi bi-info-circle me-1"></i> Format: 081234567890
            </small>
          </div>
        </form>
        
        <!-- Error Message Area -->
        <div id="formMessageEdit" class="mt-3"></div>
      </div>
    `;

    showModal(`Edit Tim: ${tim.namaTim}`, formHTML, async () => {
      const form = document.getElementById('editTimForm');
      
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

      const namaTim = document.getElementById("namaTim").value.trim();
      const noWhatsapp = document.getElementById("noWhatsapp").value.trim();

      // Validasi tambahan untuk nomor WhatsApp - PERUBAHAN: validasi yang lebih fleksibel
      const phoneValidation = validatePhoneNumber(noWhatsapp);
      if (!phoneValidation.valid) {
        showFormToast(phoneValidation.message, "danger");
        const whatsappInput = document.getElementById('noWhatsapp');
        whatsappInput.classList.add('is-invalid');
        whatsappInput.focus();
        return false;
      }

      // Cek apakah ada perubahan
      if (namaTim === originalNamaTim && noWhatsapp === originalNoWhatsapp) {
        showFormToast("Tidak ada perubahan data yang dilakukan.", "info");
        return false; // Jangan tutup modal
      }

      // Tampilkan loading state
      showFormToast("Menyimpan perubahan data...", "info");

      try {
        await fetchAPI(`${API.timPengangkut}${timId}/`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ 
            namaTim, 
            noWhatsapp: phoneValidation.cleanNoWA
          }),
        });

        // Tutup modal dan tampilkan toast sukses
        setTimeout(() => {
          showFormToast(`✅ Tim "${namaTim}" berhasil diperbarui`, "success");
          loadTim();
        }, 500);
        
        return true;
      } catch (error) {
        console.error("Error updating tim:", error);
        
        // Tampilkan error di dalam form
        const formMessage = document.getElementById('formMessageEdit');
        if (formMessage) {
          formMessage.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>Error:</strong> ${error.message || "Gagal memperbarui tim"}
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
          `;
        }
        
        showFormToast(error.message || "Gagal memperbarui tim", "danger");
        return false;
      }
    }, true, "modal-lg");

    // Setup validation setelah modal ditampilkan
    setTimeout(() => {
      setupFormValidation();
    }, 300);
    
  } catch (error) {
    console.error("Error loading tim data:", error);
    showFormToast(`❌ Gagal memuat data tim: ${error.message}`, "danger");
  }
}

async function deleteTim(timId) {
  try {
    // Ambil data tim terlebih dahulu untuk mendapatkan nama
    const response = await fetchAPI(`${API.timPengangkut}${timId}/`, {
      headers: getAuthHeaders(),
    });

    const tim = response.data || response;

    showConfirmModal(
      `
        <div class="text-center py-3">
          <i class="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
          <h5 class="text-danger fw-bold">Hapus Tim</h5>
          <p class="text-muted">Apakah Anda yakin ingin menghapus tim ini?</p>
          <div class="alert alert-danger mt-3">
            <div class="d-flex align-items-center">
              <div class="bg-danger bg-opacity-10 p-3 rounded-circle me-3">
                <i class="bi bi-people-fill text-danger fs-4"></i>
              </div>
              <div class="text-start">
                <strong class="d-block">${tim.namaTim}</strong>
                <small class="text-muted">
                  <i class="bi bi-whatsapp me-1"></i>+62${tim.noWhatsapp} | 
                  ID: ${tim.idTim || tim.id}
                </small>
              </div>
            </div>
          </div>
          <small class="text-muted d-block mt-3">
            <i class="bi bi-exclamation-circle me-1"></i>
            Data yang telah dihapus tidak dapat dikembalikan.
          </small>
        </div>
      `,
      async () => {
        try {
          await fetchAPI(`${API.timPengangkut}${timId}/`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });

          showFormToast(`✅ Tim "${tim.namaTim}" berhasil dihapus`, "success");
          
          // Tunggu sebentar sebelum refresh
          setTimeout(() => {
            loadTim();
          }, 500);
        } catch (error) {
          console.error("Error deleting tim:", error);
          showFormToast(`❌ Gagal menghapus tim: ${error.message}`, "danger");
        }
      }
    );
  } catch (error) {
    console.error("Error loading tim for deletion:", error);
    showFormToast(`❌ Gagal memuat data tim: ${error.message}`, "danger");
  }
}

// Ekspos fungsi ke window object
window.editTim = editTim;
window.deleteTim = deleteTim;