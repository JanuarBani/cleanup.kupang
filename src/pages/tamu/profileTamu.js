// pages/tamu/profileTamu.js
import { API, getAuthHeaders, showToast } from "../api.js";
import { authGuard } from "../utils/authGuard.js";

export async function profileTamu() {
  const app = document.getElementById("app");
  const user = await authGuard();

  if (!user) {
    alert("Silakan login terlebih dahulu!");
    window.location.hash = "#/login";
    return;
  }

  // Ambil data tamu dari API
  let tamuData = {};
  try {
    const response = await fetch(`${API.base}/api/tamu/`, {
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(data);
      // Cari data tamu untuk user saat ini
      tamuData = data.find((t) => t.idUser === user.id) || {};
    }
  } catch (error) {
    console.error("Error fetching tamu data:", error);
  }

  // Simpan data original untuk validasi perubahan
  const originalData = {
    nama: tamuData.nama || "",
    jk: tamuData.jk || "",
    email: user.email || "",
    password: "",
  };

  app.innerHTML = `
    <style>
      .validation-error {
        color: #dc3545;
        font-size: 0.875rem;
        margin-top: 0.25rem;
        display: none;
      }
      .is-invalid {
        border-color: #dc3545 !important;
      }
      .is-valid {
        border-color: #28a745 !important;
      }
      .form-control:read-only {
        background-color: #f8f9fa;
        opacity: 0.8;
      }
      .field-container {
        margin-bottom: 1rem;
      }
      .no-change-alert {
        animation: fadeIn 0.3s ease-in;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    </style>
    
    <div class="container py-4" style="max-width: 800px;">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1 class="h2 fw-bold text-success">
                    <i class="bi bi-person-gear me-2"></i>Ubah Profil
                </h1>
                <p class="text-muted mb-0">Kelola informasi profil Anda</p>
            </div>
            <a href="#/dashboard" class="btn btn-outline-success">
                <i class="bi bi-arrow-left me-2"></i>Kembali ke Dashboard
            </a>
        </div>

        <!-- Alert jika tidak ada perubahan -->
        <div id="noChangeAlert" class="alert alert-warning alert-dismissible fade show mb-3" style="display: none;">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <span id="noChangeMessage">Tidak ada perubahan yang dilakukan. Silakan ubah data terlebih dahulu.</span>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>

        <!-- Form Ubah Profil -->
        <div class="card shadow-sm border-success">
            <div class="card-header bg-success text-white">
                <h5 class="card-title mb-0">
                    <i class="bi bi-person-circle me-2"></i>Informasi Profil
                </h5>
            </div>
            <div class="card-body">
                <form id="profileForm">
                    <!-- Informasi Akun -->
                    <div class="mb-4">
                        <h6 class="text-success border-bottom pb-2 mb-3">
                            <i class="bi bi-person-badge me-2"></i>Informasi Akun
                        </h6>
                        <div class="row">
                            <div class="col-md-6 mb-3 field-container">
                                <label for="username" class="form-label">Username</label>
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="bi bi-at"></i>
                                    </span>
                                    <input type="text" class="form-control" id="username" 
                                           value="${user.username}" readonly>
                                </div>
                                <div class="form-text text-muted">Username tidak dapat diubah</div>
                            </div>
                            <div class="col-md-6 mb-3 field-container">
                                <label for="email" class="form-label">Email <span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="bi bi-envelope"></i>
                                    </span>
                                    <input type="email" class="form-control" id="email" 
                                           value="${user.email || ""}" 
                                           placeholder="contoh@email.com"
                                           data-original="${user.email || ""}">
                                </div>
                                <div id="emailError" class="validation-error"></div>
                                <div class="form-text text-muted">Digunakan untuk notifikasi</div>
                            </div>
                        </div>
                    </div>

                    <!-- Informasi Pribadi -->
                    <div class="mb-4">
                        <h6 class="text-success border-bottom pb-2 mb-3">
                            <i class="bi bi-person-vcard me-2"></i>Informasi Pribadi
                        </h6>
                        <div class="row">
                            <div class="col-md-6 mb-3 field-container">
                                <label for="nama" class="form-label">Nama Lengkap <span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="bi bi-person"></i>
                                    </span>
                                    <input type="text" class="form-control" id="nama" 
                                           value="${tamuData.nama || ""}" 
                                           placeholder="Masukkan nama lengkap"
                                           data-original="${
                                             tamuData.nama || ""
                                           }">
                                </div>
                                <div id="namaError" class="validation-error"></div>
                                <div class="form-text text-muted">Minimal 3 karakter</div>
                            </div>
                            <div class="col-md-6 mb-3 field-container">
                                <label for="jk" class="form-label">Jenis Kelamin <span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="bi bi-gender-ambiguous"></i>
                                    </span>
                                    <select class="form-select" id="jk" data-original="${
                                      tamuData.jk || ""
                                    }">
                                        <option value="">Pilih Jenis Kelamin</option>
                                        <option value="L" ${
                                          tamuData.jk === "L" ? "selected" : ""
                                        }>Laki-laki</option>
                                        <option value="P" ${
                                          tamuData.jk === "P" ? "selected" : ""
                                        }>Perempuan</option>
                                    </select>
                                </div>
                                <div id="jkError" class="validation-error"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Password (Opsional) -->
                    <div class="mb-4">
                        <h6 class="text-success border-bottom pb-2 mb-3">
                            <i class="bi bi-shield-lock me-2"></i>Ubah Password (Opsional)
                        </h6>
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            Kosongkan jika tidak ingin mengubah password
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3 field-container">
                                <label for="password" class="form-label">Password Baru</label>
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="bi bi-key"></i>
                                    </span>
                                    <input type="password" class="form-control" id="password"
                                           placeholder="Minimal 6 karakter"
                                           data-original="">
                                    <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                </div>
                                <div id="passwordError" class="validation-error"></div>
                                <div class="form-text text-muted">Kosongkan jika tidak ingin ubah password</div>
                            </div>
                            <div class="col-md-6 mb-3 field-container">
                                <label for="confirmPassword" class="form-label">Konfirmasi Password</label>
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="bi bi-key-fill"></i>
                                    </span>
                                    <input type="password" class="form-control" id="confirmPassword"
                                           placeholder="Ulangi password baru"
                                           data-original="">
                                </div>
                                <div id="confirmPasswordError" class="validation-error"></div>
                                <div class="form-text text-muted">Harus sama dengan password baru</div>
                            </div>
                        </div>
                    </div>

                    <!-- Summary Validation -->
                    <div id="summaryValidation" class="alert alert-warning mb-4" style="display: none;">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-exclamation-triangle-fill me-3"></i>
                            <div>
                                <strong class="d-block mb-1">Perbaiki data berikut:</strong>
                                <ul id="summaryErrors" class="mb-0 small"></ul>
                            </div>
                        </div>
                    </div>

                    <!-- Tombol Aksi -->
                    <div class="d-flex justify-content-between pt-3 border-top">
                        <button type="button" class="btn btn-outline-secondary" onclick="window.history.back()">
                            <i class="bi bi-x-circle me-2"></i>Batal
                        </button>
                        <div class="d-flex gap-2">
                            <button type="button" class="btn btn-outline-success" id="btnReset">
                                <i class="bi bi-arrow-clockwise me-2"></i>Reset
                            </button>
                            <button type="submit" class="btn btn-success" id="btnSave">
                                <i class="bi bi-check-circle me-2"></i>Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- Informasi Tambahan -->
        <div class="mt-4">
            <div class="alert alert-success">
                <div class="d-flex align-items-center">
                    <i class="bi bi-info-circle fs-4 me-3"></i>
                    <div>
                        <h6 class="alert-heading mb-2">Informasi Penting</h6>
                        <ul class="mb-0 small">
                            <li>Pastikan data yang Anda isi akurat dan valid</li>
                            <li>Data dengan tanda <span class="text-danger">*</span> wajib diisi</li>
                            <li>Email diperlukan untuk notifikasi dan reset password</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

  setupProfileForm(user, tamuData, originalData);
}

// ================================
// FUNGSI VALIDASI LENGKAP
// ================================
function setupValidation() {
  const fields = [
    "nama",
    "jk",
    "email",
    "password",
    "confirmPassword",
  ];

  fields.forEach((fieldId) => {
    const input = document.getElementById(fieldId);
    if (input) {
      // Validasi real-time saat mengetik
      input.addEventListener("input", () => {
        validateField(fieldId);
        // Validasi terkait untuk password
        if (fieldId === "password") {
          validateField("confirmPassword");
        }
        if (fieldId === "confirmPassword") {
          validateField("password");
        }
      });

      // Validasi saat kehilangan fokus
      input.addEventListener("blur", () => {
        validateField(fieldId);
      });
    }
  });

  // Validasi awal saat halaman dimuat
  setTimeout(() => {
    validateAllFields();
  }, 100);
}

function validateField(fieldId) {
  const input = document.getElementById(fieldId);
  const errorDiv = document.getElementById(`${fieldId}Error`);
  const value = input.value.trim();

  if (!errorDiv) return true;

  let isValid = true;
  let errorMessage = "";

  switch (fieldId) {
    case "nama":
      if (!value) {
        errorMessage = "Nama lengkap harus diisi";
        isValid = false;
      } else if (value.length < 3) {
        errorMessage = "Nama minimal 3 karakter";
        isValid = false;
      }
      break;

    case "jk":
      if (!value) {
        errorMessage = "Pilih jenis kelamin";
        isValid = false;
      }
      break;

    case "email":
      if (!value) {
        errorMessage = "Email harus diisi";
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errorMessage = "Format email tidak valid (contoh: nama@email.com)";
        isValid = false;
      }
      break;

    case "password":
      if (value) {
        if (value.length < 6) {
          errorMessage = "Password minimal 6 karakter";
          isValid = false;
        }

        const confirmValue = document
          .getElementById("confirmPassword")
          .value.trim();
        if (confirmValue && value !== confirmValue) {
          errorMessage = "Password tidak cocok dengan konfirmasi";
          isValid = false;
        }
      }
      break;

    case "confirmPassword":
      const passwordValue = document.getElementById("password").value.trim();
      if (passwordValue && value && value !== passwordValue) {
        errorMessage = "Konfirmasi password tidak cocok";
        isValid = false;
      } else if (!value && passwordValue) {
        errorMessage = "Konfirmasi password harus diisi";
        isValid = false;
      }
      break;
  }

  // Update UI berdasarkan hasil validasi
  if (isValid) {
    errorDiv.style.display = "none";
    errorDiv.textContent = "";
    input.classList.remove("is-invalid");
    if (value) {
      input.classList.add("is-valid");
    }
  } else {
    errorDiv.style.display = "block";
    errorDiv.textContent = errorMessage;
    input.classList.add("is-invalid");
    input.classList.remove("is-valid");
  }

  return isValid;
}

function validateAllFields() {
  const requiredFields = ["nama", "jk", "email"];
  let allValid = true;
  let errorMessages = [];

  requiredFields.forEach((fieldId) => {
    const isValid = validateField(fieldId);
    if (!isValid) {
      allValid = false;
      const input = document.getElementById(fieldId);
      const label = document
        .querySelector(`label[for="${fieldId}"]`)
        .textContent.replace(" *", "");
      const errorDiv = document.getElementById(`${fieldId}Error`);
      const errorText = errorDiv.textContent;

      if (errorText) {
        errorMessages.push(`${label}: ${errorText}`);
      }
    }
  });

  // Validasi password jika diisi
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document
    .getElementById("confirmPassword")
    .value.trim();

  if (password || confirmPassword) {
    const isPasswordValid = validateField("password");
    const isConfirmValid = validateField("confirmPassword");

    if (!isPasswordValid || !isConfirmValid) {
      allValid = false;
    }

    // Validasi kesamaan password
    if (password && confirmPassword && password !== confirmPassword) {
      allValid = false;
      errorMessages.push("Password: Password dan konfirmasi tidak cocok");
    }
  }

  // Tampilkan summary jika ada error
  const summaryDiv = document.getElementById("summaryValidation");
  const summaryList = document.getElementById("summaryErrors");

  if (!allValid && summaryDiv && summaryList) {
    summaryList.innerHTML = "";
    errorMessages.forEach((msg) => {
      const li = document.createElement("li");
      li.textContent = msg;
      summaryList.appendChild(li);
    });
    summaryDiv.style.display = "block";
  } else if (summaryDiv) {
    summaryDiv.style.display = "none";
  }

  return allValid;
}

// ================================
// FUNGSI UTILITAS BARU: Validasi Perubahan
// ================================

/**
 * Cek apakah ada perubahan data dari original
 */
function hasDataChanged() {
  const fieldsToCheck = [
    "nama",
    "jk",
    "email",
    "password",
  ];

  for (const fieldId of fieldsToCheck) {
    const input = document.getElementById(fieldId);
    if (input) {
      const currentValue = input.value.trim();
      const originalValue = input.getAttribute("data-original") || "";

      // Untuk select element
      if (input.tagName === "SELECT") {
        if (currentValue !== originalValue) {
          return true;
        }
      }
      // Untuk input lain
      else if (currentValue !== originalValue) {
        // Khusus password, anggap ada perubahan jika ada isinya
        if (fieldId === "password" && currentValue !== "") {
          return true;
        }
        // Untuk field lain
        else if (fieldId !== "password") {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Tampilkan alert jika tidak ada perubahan
 */
function showNoChangeAlert() {
  const alertDiv = document.getElementById("noChangeAlert");
  const messageSpan = document.getElementById("noChangeMessage");

  if (alertDiv) {
    alertDiv.style.display = "block";
    messageSpan.textContent =
      "Tidak ada perubahan yang dilakukan. Silakan ubah data terlebih dahulu.";

    // Auto-hide setelah 5 detik
    setTimeout(() => {
      alertDiv.style.display = "none";
    }, 5000);
  }
}

/**
 * Reset alert tidak ada perubahan
 */
function resetNoChangeAlert() {
  const alertDiv = document.getElementById("noChangeAlert");
  if (alertDiv) {
    alertDiv.style.display = "none";
  }
}

// ================================
// FUNGSI SETUP PROFILE FORM
// ================================
function setupProfileForm(user, tamuData, originalData) {
  const form = document.getElementById("profileForm");
  const togglePasswordBtn = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  const btnSave = document.getElementById("btnSave");
  const btnReset = document.getElementById("btnReset");

  // Setup validasi real-time
  setupValidation();

  // Toggle password visibility
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", function () {
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      this.innerHTML =
        type === "password"
          ? '<i class="bi bi-eye"></i>'
          : '<i class="bi bi-eye-slash"></i>';
    });
  }

  // Reset form
  if (btnReset) {
    btnReset.addEventListener("click", function () {
      if (confirm("Apakah Anda yakin ingin mengembalikan data ke semula?")) {
        // Reset semua field ke original
        document.getElementById("username").value = user.username;

        // Reset semua field yang memiliki data-original
        const fields = [
          "nama",
          "email",
          "password",
          "confirmPassword",
        ];

        fields.forEach((fieldId) => {
          const input = document.getElementById(fieldId);
          if (input) {
            const originalValue = input.getAttribute("data-original") || "";
            if (input.tagName === "SELECT") {
              input.value = originalValue;
            } else {
              input.value = originalValue;
            }
          }
        });

        // Reset select khusus
        const jkSelect = document.getElementById("jk");
        if (jkSelect) {
          jkSelect.value = jkSelect.getAttribute("data-original") || "";
        }

        // Reset semua validasi visual
        const allFields = [
          "nama",
          "jk",
          "email",
          "password",
          "confirmPassword",
        ];
        allFields.forEach((fieldId) => {
          const errorDiv = document.getElementById(`${fieldId}Error`);
          const input = document.getElementById(fieldId);
          if (errorDiv) {
            errorDiv.style.display = "none";
            errorDiv.textContent = "";
          }
          if (input) {
            input.classList.remove("is-invalid", "is-valid");
          }
        });

        // Sembunyikan summary validation
        const summaryDiv = document.getElementById("summaryValidation");
        if (summaryDiv) {
          summaryDiv.style.display = "none";
        }

        // Reset alert tidak ada perubahan
        resetNoChangeAlert();

        // Validasi ulang
        setTimeout(() => {
          validateAllFields();
        }, 100);

        showToast("info", "Form telah direset ke data semula");
      }
    });
  }

  // Submit form dengan validasi ketat
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!btnSave) return;

    // 0. CEK APAKAH ADA PERUBAHAN DATA
    if (!hasDataChanged()) {
      showNoChangeAlert();
      // Scroll ke alert
      const alertDiv = document.getElementById("noChangeAlert");
      if (alertDiv) {
        alertDiv.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // 1. VALIDASI SEMUA FIELD SEBELUM SUBMIT - TAMPILKAN ERROR DI INPUT
    const isValid = validateAllFields();

    if (!isValid) {
      // Scroll ke summary atau field pertama yang error
      const summaryDiv = document.getElementById("summaryValidation");
      if (summaryDiv && summaryDiv.style.display === "block") {
        summaryDiv.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        // Cari field pertama yang error
        const errorFields = [
          "nama",
          "jk",
          "email",
          "password",
          "confirmPassword",
        ];
        for (const fieldId of errorFields) {
          const errorDiv = document.getElementById(`${fieldId}Error`);
          if (errorDiv && errorDiv.style.display === "block") {
            document.getElementById(fieldId).scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            break;
          }
        }
      }

      showToast("error", "Harap perbaiki data yang salah sebelum menyimpan");
      return;
    }

    // 2. DISABLE BUTTON DAN TAMPILKAN LOADING
    const originalText = btnSave.innerHTML;
    btnSave.disabled = true;
    btnSave.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';

    try {
      // Data yang akan dikirim
      const tamuDataToUpdate = {
        nama: document.getElementById("nama").value.trim(),
        jk: document.getElementById("jk").value,
      };

      const userDataToUpdate = {
        email: document.getElementById("email").value.trim()
      };
      
      const password = document.getElementById("password").value.trim();

      // Debug logging
      console.log("📤 Data yang akan dikirim ke backend:");
      console.log("👤 User Data:", userDataToUpdate);
      console.log("👥 Tamu Data:", tamuDataToUpdate);
      console.log("🔑 Password:", password ? "***" : "(tidak diubah)");

      // 3. Cek apakah ada perubahan data Tamu
      const hasTamuChanges = 
        tamuDataToUpdate.nama !== originalData.nama || 
        tamuDataToUpdate.jk !== originalData.jk;

      // 4. Cek apakah ada perubahan data User
      const hasUserChanges = 
        userDataToUpdate.email !== originalData.email || 
        password !== "";

      let userUpdated = false;
      let tamuUpdated = false;
      let errors = [];

      // 5. UPDATE USER TERLEBIH DAHULU (jika ada perubahan)
      if (hasUserChanges) {
        try {
          const userUpdatePayload = {};
          
          if (userDataToUpdate.email !== originalData.email) {
            userUpdatePayload.email = userDataToUpdate.email;
          }
          
          if (password) {
            userUpdatePayload.password = password;
          }

          console.log("🔄 Mengirim PATCH ke user endpoint:", userUpdatePayload);

          const userResponse = await fetch(
            `${API.base}/api/users/${user.id}/`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
              },
              body: JSON.stringify(userUpdatePayload),
            }
          );

          console.log("📥 Response status user:", userResponse.status);

          if (!userResponse.ok) {
            let errorMessage = "Gagal mengupdate data user";
            try {
              const errorData = await userResponse.json();
              console.error("❌ Error data user:", errorData);
              
              if (errorData.email) {
                document.getElementById("emailError").style.display = "block";
                document.getElementById("emailError").textContent =
                  errorData.email[0];
                document.getElementById("email").classList.add("is-invalid");
                errorMessage = `Email: ${errorData.email[0]}`;
              } else if (errorData.password) {
                document.getElementById("passwordError").style.display = "block";
                document.getElementById("passwordError").textContent =
                  errorData.password[0];
                document.getElementById("password").classList.add("is-invalid");
                errorMessage = `Password: ${errorData.password[0]}`;
              } else if (errorData.detail) {
                errorMessage = errorData.detail;
              }
            } catch (parseError) {
              console.error("❌ Error parsing user response:", parseError);
            }
            
            errors.push(errorMessage);
            throw new Error(errorMessage);
          } else {
            const result = await userResponse.json();
            console.log("✅ User update success:", result);
            userUpdated = true;
            
            // Update localStorage jika email berubah
            if (userDataToUpdate.email !== originalData.email) {
              const updatedUser = { ...user, email: userDataToUpdate.email };
              localStorage.setItem("user", JSON.stringify(updatedUser));
              console.log("💾 User data updated in localStorage");
            }
          }
        } catch (error) {
          console.error("❌ User update failed:", error);
          errors.push(error.message);
        }
      }

      // 6. UPDATE DATA TAMU (jika ada perubahan)
      if (hasTamuChanges && errors.length === 0) {
        try {
          // Cari ID tamu berdasarkan user ID
          console.log("🔍 Mencari data tamu untuk user ID:", user.id);
          
          const tamuResponse = await fetch(`${API.base}/api/tamu/`, {
            headers: getAuthHeaders(),
          });

          if (!tamuResponse.ok) {
            console.error("❌ Gagal mengambil data tamu:", tamuResponse.status);
            throw new Error("Gagal mengambil data tamu");
          }

          const tamuList = await tamuResponse.json();
          console.log("📋 Daftar tamu:", tamuList);
          
          const currentTamu = tamuList.find((t) => t.idUser === user.id);
          console.log("👤 Tamu ditemukan:", currentTamu);

          if (currentTamu && currentTamu.idTamu) {
            console.log("🔄 Mengirim PATCH ke tamu endpoint:", {
              url: `${API.base}/api/tamu/${currentTamu.idTamu}/`,
              data: tamuDataToUpdate
            });

            const tamuUpdateResponse = await fetch(
              `${API.base}/api/tamu/${currentTamu.idTamu}/`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  ...getAuthHeaders(),
                },
                body: JSON.stringify(tamuDataToUpdate),
              }
            );

            console.log("📥 Response status tamu:", tamuUpdateResponse.status);

            if (!tamuUpdateResponse.ok) {
              let errorMessage = "Gagal mengupdate data tamu";
              try {
                const errorData = await tamuUpdateResponse.json();
                console.error("❌ Error data tamu:", errorData);
                
                if (errorData.nama) {
                  document.getElementById("namaError").style.display = "block";
                  document.getElementById("namaError").textContent =
                    errorData.nama[0];
                  document.getElementById("nama").classList.add("is-invalid");
                  errorMessage = `Nama: ${errorData.nama[0]}`;
                } else if (errorData.jk) {
                  document.getElementById("jkError").style.display = "block";
                  document.getElementById("jkError").textContent =
                    errorData.jk[0];
                  document.getElementById("jk").classList.add("is-invalid");
                  errorMessage = `Jenis Kelamin: ${errorData.jk[0]}`;
                } else if (errorData.detail) {
                  errorMessage = errorData.detail;
                }
              } catch (parseError) {
                console.error("❌ Error parsing tamu response:", parseError);
              }
              
              errors.push(errorMessage);
              throw new Error(errorMessage);
            } else {
              const result = await tamuUpdateResponse.json();
              console.log("✅ Tamu update success:", result);
              tamuUpdated = true;
            }
          }
        } catch (error) {
          console.error("❌ Tamu update failed:", error);
          errors.push(error.message);
        }
      }

      // 7. EVALUASI HASIL
      if (errors.length > 0) {
        // Tampilkan semua error
        showToast("error", errors.join(" | "));
        
        // Scroll ke field pertama yang error
        const errorFields = ["email", "nama", "jk", "password"];
        for (const fieldId of errorFields) {
          const errorDiv = document.getElementById(`${fieldId}Error`);
          if (errorDiv && errorDiv.style.display === "block") {
            document.getElementById(fieldId).scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            break;
          }
        }
      } else if (userUpdated || tamuUpdated) {
        // BERHASIL - Update data-original attribute
        const allFields = document.querySelectorAll("[data-original]");
        allFields.forEach((field) => {
          const currentValue = field.value;
          field.setAttribute("data-original", currentValue);
        });

        // Update jk select khusus
        const jkSelect = document.getElementById("jk");
        if (jkSelect) {
          jkSelect.setAttribute("data-original", jkSelect.value);
        }

        showToast("success", "✅ Profil berhasil diperbarui!");

        // Redirect setelah 2 detik
        setTimeout(() => {
          window.location.hash = "#/dashboard";
        }, 2000);
      } else {
        // Tidak ada perubahan yang dilakukan
        showNoChangeAlert();
      }

    } catch (error) {
      // Tangani error umum
      console.error("❌ Error in form submission:", error);
      showToast("error", error.message || "Terjadi kesalahan saat menyimpan");
    } finally {
      // Enable button kembali
      btnSave.disabled = false;
      btnSave.innerHTML = originalText;
    }
  });

  // Tambahkan event listener untuk reset alert saat ada perubahan
  const inputFields = form.querySelectorAll("input, select, textarea");
  inputFields.forEach((field) => {
    field.addEventListener("input", resetNoChangeAlert);
    field.addEventListener("change", resetNoChangeAlert);
  });
}
