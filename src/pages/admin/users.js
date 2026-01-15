import { API, getAuthHeaders } from "../../api.js";
import { showModal, showConfirmModal } from "../../utils/modal.js";
import { showToast } from "../../utils/toast.js";

// Variabel global untuk pagination
let currentPage = 1;
let totalPages = 1;
let allUsers = [];

// Helper untuk validasi form
function setupFormValidation(formId) {
  const form = document.getElementById(formId);
  if (form) {
    // Reset semua field invalid
    const invalidFields = form.querySelectorAll(".is-invalid");
    invalidFields.forEach((field) => {
      field.classList.remove("is-invalid");
      const feedback = field.nextElementSibling;
      if (feedback && feedback.classList.contains("invalid-feedback")) {
        feedback.textContent = "";
      }
    });
  }
}

// Function untuk menampilkan error pada field tertentu
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.classList.add("is-invalid");
    field.classList.remove("is-valid");

    // Cari atau buat invalid feedback
    let feedback = field.nextElementSibling;
    if (!feedback || !feedback.classList.contains("invalid-feedback")) {
      feedback = document.createElement("div");
      feedback.className = "invalid-feedback";
      field.parentNode.insertBefore(feedback, field.nextSibling);
    }
    feedback.textContent = message;
  }
}

// Function untuk menampilkan success pada field
function showFieldSuccess(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.classList.remove("is-invalid");
    field.classList.add("is-valid");
  }
}

// Function untuk reset validasi field
function resetFieldValidation(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.classList.remove("is-invalid", "is-valid");
  }
}

async function checkUsernameUnique(username, currentUserId = null) {
  try {
    // Cek melalui API
    const response = await fetch(
      `${API.users}?username=${encodeURIComponent(username)}`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      return { unique: true, message: "" };
    }

    const users = await response.json();
    const existingUser = Array.isArray(users)
      ? users.find((u) => u.username === username)
      : null;

    if (existingUser) {
      // Jika currentUserId diberikan (edit mode), cek apakah ini user yang sama
      if (currentUserId && existingUser.id === parseInt(currentUserId)) {
        return { unique: true, message: "" };
      }
      return {
        unique: false,
        message: "Username sudah digunakan. Silakan pilih username lain.",
      };
    }

    return { unique: true, message: "" };
  } catch (error) {
    console.error("Error checking username:", error);
    return { unique: true, message: "" };
  }
}

// Validasi add user dengan field dinamis
function validateAddUser(data) {
  const errors = {};

  // Validasi dasar
  if (!data.username || data.username.trim().length < 3) {
    errors.username = "Username minimal 3 karakter";
  } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
    errors.username = "Username hanya boleh huruf, angka, dan underscore";
  }

  if (!data.password) {
    errors.password = "Password wajib diisi";
  } else if (data.password.length < 8) {
    errors.password = "Password minimal 8 karakter";
  }

  if (data.password !== data.password2) {
    errors.password2 = "Password dan konfirmasi password tidak sama";
  }

  if (!data.role) {
    errors.role = "Role wajib dipilih";
  }

  if (!data.email || !data.email.trim()) {
    errors.email = "Email wajib diisi";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Format email tidak valid";
  }

  // Validasi berdasarkan role
  const role = data.role;

  if (role === "anggota") {
    if (!data.nama || data.nama.trim().length < 2) {
      errors.nama = "Nama anggota wajib diisi";
    }
    if (!data.alamat || data.alamat.trim().length < 10) {
      errors.alamat = "Alamat wajib diisi (minimal 10 karakter)";
    }
    if (!data.noWA || !/^[0-9]{10,12}$/.test(data.noWA)) {
      errors.noWA = "No. WhatsApp harus 10-12 digit angka";
    }
    if (!data.jenisSampah) {
      errors.jenisSampah = "Jenis sampah wajib dipilih";
    }
    if (!data.latitude || isNaN(data.latitude)) {
      errors.latitude = "Latitude wajib diisi";
    }
    if (!data.longitude || isNaN(data.longitude)) {
      errors.longitude = "Longitude wajib diisi";
    }
    if (!data.tanggalStart) {
      errors.tanggalStart = "Tanggal mulai wajib diisi";
    }
    if (!data.tanggalEnd) {
      errors.tanggalEnd = "Tanggal berakhir wajib diisi";
    }
    if (
      data.tanggalStart &&
      data.tanggalEnd &&
      new Date(data.tanggalStart) > new Date(data.tanggalEnd)
    ) {
      errors.tanggalEnd = "Tanggal berakhir harus setelah tanggal mulai";
    }
    // Anggota TIDAK pakai gender/jk
  }

  if (role === "tim_angkut") {
    if (!data.namaTim || data.namaTim.trim().length < 2) {
      errors.namaTim = "Nama tim wajib diisi";
    }
    if (!data.noWhatsapp || !/^[0-9]{10,12}$/.test(data.noWhatsapp)) {
      errors.noWhatsapp = "No. WhatsApp harus 10-12 digit angka";
    }
    // Tim Angkut TIDAK pakai gender/jk
  }

  if (role === "tamu") {
    if (!data.nama_tamu || data.nama_tamu.trim().length < 2) {
      errors.nama_tamu = "Nama tamu wajib diisi";
    }
    // Hanya Tamu yang wajib memiliki JK
    if (!data.jk) {
      errors.jk = "Jenis kelamin wajib dipilih";
    }
  }

  // Admin juga TIDAK pakai gender/jk

  return errors;
}

// Validasi edit user dengan field dinamis
function validateEditUser(data, isPasswordChange = false) {
  const errors = {};

  // Validasi dasar
  if (!data.username || data.username.trim().length < 3) {
    errors.username = "Username minimal 3 karakter";
  } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
    errors.username = "Username hanya boleh huruf, angka, dan underscore";
  }

  if (!data.role) {
    errors.role = "Role wajib dipilih";
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Format email tidak valid";
  }

  if (isPasswordChange) {
    if (data.password && data.password.length < 8) {
      errors.password = "Password minimal 8 karakter";
    }
    if (data.password && data.password2 && data.password !== data.password2) {
      errors.password2 = "Password dan konfirmasi password tidak sama";
    }
  }

  // Validasi berdasarkan role
  const role = data.role;

  if (role === "anggota") {
    if (data.nama && data.nama.trim().length < 2) {
      errors.nama = "Nama anggota minimal 2 karakter";
    }
    if (data.alamat && data.alamat.trim().length < 10) {
      errors.alamat = "Alamat minimal 10 karakter";
    }
    if (data.noWA && !/^[0-9]{10,12}$/.test(data.noWA)) {
      errors.noWA = "No. WhatsApp harus 10-12 digit angka";
    }
    if (
      data.tanggalStart &&
      data.tanggalEnd &&
      new Date(data.tanggalStart) > new Date(data.tanggalEnd)
    ) {
      errors.tanggalEnd = "Tanggal berakhir harus setelah tanggal mulai";
    }
    // Anggota TIDAK validasi gender/jk
  }

  if (role === "tim_angkut") {
    if (data.namaTim && data.namaTim.trim().length < 2) {
      errors.namaTim = "Nama tim minimal 2 karakter";
    }
    if (data.noWhatsapp && !/^[0-9]{10,12}$/.test(data.noWhatsapp)) {
      errors.noWhatsapp = "No. WhatsApp harus 10-12 digit angka";
    }
    // Tim Angkut TIDAK validasi gender/jk
  }

  if (role === "tamu") {
    if (data.nama_tamu && data.nama_tamu.trim().length < 2) {
      errors.nama_tamu = "Nama tamu minimal 2 karakter";
    }
    // Hanya Tamu yang validasi jk (karena wajib)
    if (!data.jk) {
      errors.jk = "Jenis kelamin wajib dipilih";
    }
  }

  return errors;
}

// Function untuk mendapatkan warna badge berdasarkan role
function getRoleColor(role) {
  const colors = {
    admin: "bg-danger",
    anggota: "bg-success",
    tim_angkut: "bg-primary",
    tamu: "bg-secondary",
  };
  return colors[role] || "bg-info";
}

export async function userAdminPage() {
  const mainContent = document.getElementById("mainContent");

  mainContent.innerHTML = `
    <div class="container-fluid py-3">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0">
          <i class="bi bi-people-fill text-primary me-2"></i>
          Manajemen Users
        </h2>
        <button id="addUserBtn" class="btn btn-primary">
          <i class="bi bi-plus-lg me-2"></i>Tambah User
        </button>
      </div>
      
      <!-- PERBAIKAN: Filter section yang benar -->
      <div class="row mb-4">
        <div class="col-md-4">
          <div class="input-group">
            <span class="input-group-text bg-primary text-white">
              <i class="bi bi-search"></i>
            </span>
            <input type="text" id="searchUser" class="form-control" 
                   placeholder="Cari username atau email...">
          </div>
        </div>
        
        <div class="col-md-3">
          <select id="filterRole" class="form-select">
            <option value="">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="anggota">Anggota</option>
            <option value="tim_angkut">Tim Angkut</option>
            <option value="tamu">Tamu</option>
          </select>
        </div>
        
        <div class="col-md-3">
          <select id="filterStatus" class="form-select">
            <option value="">Semua Status</option>
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
        </div>
      </div>
      
      <!-- Refresh button dipisah -->
      <div class="mb-3">
        <button id="refreshBtn" class="btn btn-outline-secondary btn-sm">
          <i class="bi bi-arrow-clockwise me-1"></i>Refresh Data
        </button>
      </div>
      
      <div id="usersTableContainer" class="bg-white rounded shadow-sm p-3">
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2 text-muted">Memuat data user...</p>
        </div>
      </div>
      
      <div id="paginationContainer" class="mt-4"></div>
    </div>
  `;

  // Setup event listeners - PERBAIKAN: Gunakan event yang tepat
  document.getElementById("addUserBtn").onclick = showAddUserForm;

  // Input search dengan debounce
  document
    .getElementById("searchUser")
    .addEventListener("input", debounce(loadUsers, 300));

  // Filter dropdown langsung trigger load
  document.getElementById("filterRole").addEventListener("change", () => {
    currentPage = 1;
    loadUsers(true);
  });

  document.getElementById("filterStatus").addEventListener("change", () => {
    currentPage = 1;
    loadUsers(true);
  });

  document.getElementById("refreshBtn").onclick = () => {
    // Reset semua filter
    document.getElementById("searchUser").value = "";
    document.getElementById("filterRole").value = "";
    document.getElementById("filterStatus").value = "";
    currentPage = 1;
    loadUsers(true);
    showToast("Data direfresh, semua filter direset", "success");
  };

  // Load initial data
  loadUsers();
}

// Debounce helper
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

// Load users data dengan filter lengkap
async function loadUsers(forceRefresh = false) {
  try {
    const tableContainer = document.getElementById("usersTableContainer");

    if (!tableContainer) {
      console.error("ERROR: usersTableContainer tidak ditemukan");
      return;
    }

    // Dapatkan nilai filter
    const search = document.getElementById("searchUser")?.value || "";
    const role = document.getElementById("filterRole")?.value || "";
    const status = document.getElementById("filterStatus")?.value || "";

    // Tampilkan loading
    tableContainer.innerHTML = `
      <div class="text-center py-3">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <span class="ms-2">Memuat data user...</span>
      </div>
    `;

    // Buat parameter pencarian
    const currentSearch = JSON.stringify({ search, role, status });
    const lastSearch = window.lastUserSearch || "";

    // Jika parameter pencarian sama dan bukan force refresh, gunakan data yang ada
    if (!forceRefresh && allUsers.length > 0 && currentSearch === lastSearch) {
      console.log("Menggunakan data yang sudah ada untuk pagination");
    } else {
      // Fetch data baru dengan filter
      let url = API.users;
      const params = new URLSearchParams();

      // Tambahkan parameter filter
      if (search) params.append("search", search);
      if (role) params.append("role", role);
      if (status !== "") params.append("is_active", status);

      // Tambahkan parameter untuk sorting (opsional)
      params.append("ordering", "date_joined");

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log("Fetching URL:", url); // Debug

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Gagal memuat data user`);
      }

      const responseData = await response.json();

      // Handle berbagai format response
      if (Array.isArray(responseData)) {
        allUsers = responseData;
      } else if (responseData.results || responseData.data) {
        // Jika API mengembalikan format paginated
        allUsers = responseData.results || responseData.data || [];
      } else {
        allUsers = [];
      }

      window.lastUserSearch = currentSearch; // Simpan parameter pencarian
    }

    // Reset currentPage ke 1 jika pencarian berubah
    if (currentSearch !== lastSearch || forceRefresh) {
      currentPage = 1;
    }

    // Filter tambahan di client-side untuk memastikan
    let filteredUsers = allUsers.filter((user) => {
      let match = true;

      // Filter by role
      if (role && user.role !== role) {
        match = false;
      }

      // Filter by status
      if (status !== "" && String(user.is_active) !== status) {
        match = false;
      }

      // Filter by search (username atau email)
      if (search) {
        const searchLower = search.toLowerCase();
        const usernameMatch =
          user.username?.toLowerCase().includes(searchLower) || false;
        const emailMatch =
          user.email?.toLowerCase().includes(searchLower) || false;

        if (!usernameMatch && !emailMatch) {
          match = false;
        }
      }

      return match;
    });

    // Sort by date_joined descending (terbaru dulu)
    filteredUsers.sort((a, b) => {
      const dateA = new Date(a.date_joined || 0);
      const dateB = new Date(b.date_joined || 0);
      return dateB - dateA;
    });

    // Pagination logic
    const usersPerPage = 10;
    totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    // Validasi currentPage
    if (totalPages === 0) {
      currentPage = 1;
    } else if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    // Dapatkan data untuk halaman saat ini
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Render tabel dan pagination
    renderUsersTable(paginatedUsers, filteredUsers.length);
    renderPagination(filteredUsers.length);
  } catch (error) {
    console.error("Error loading users:", error);
    const errorContainer = document.getElementById("usersTableContainer");
    if (errorContainer) {
      errorContainer.innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>
          <strong>Error:</strong> ${error.message}
          <div class="mt-2">
            <button onclick="loadUsers(true)" class="btn btn-sm btn-danger">
              <i class="bi bi-arrow-clockwise me-1"></i>Coba Lagi
            </button>
          </div>
        </div>
      `;
    }
  }
}

// Render users table dengan parameter total filtered
function renderUsersTable(users, totalFiltered = allUsers.length) {
  const container = document.getElementById("usersTableContainer");

  if (!container) {
    console.error("ERROR: usersTableContainer tidak ditemukan!");
    return;
  }

  if (!users || users.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info">
        <i class="bi bi-info-circle me-2"></i>
        <strong>Tidak ada data user yang ditemukan</strong>
        <p class="mb-0 mt-2">Coba ubah filter pencarian Anda.</p>
      </div>
    `;
    return;
  }

  try {
    // Hitung nomor urut yang benar berdasarkan halaman
    const startNumber = (currentPage - 1) * 10 + 1;

    const tableHTML = `
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th class="text-center" width="60">No</th>
              <th class="text-center">ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Bergabung</th>
              <th class="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${users
              .map(
                (user, index) => `
              <tr>
                <td class="text-center text-muted fw-semibold">${
                  startNumber + index
                }</td>
                <td class="text-center">${user.id}</td>
                <td>
                  <strong>${user.username}</strong>
                  ${
                    user.nama
                      ? `<br><small class="text-muted">${user.nama}</small>`
                      : ""
                  }
                  ${
                    user.nama_tamu
                      ? `<br><small class="text-muted">${user.nama_tamu}</small>`
                      : ""
                  }
                  ${
                    user.namaTim
                      ? `<br><small class="text-muted">${user.namaTim}</small>`
                      : ""
                  }
                </td>
                <td>${user.email || '<span class="text-muted">-</span>'}</td>
                <td>
                  <span class="badge ${getRoleColor(user.role)}">
                    ${user.role}
                  </span>
                </td>
                <td>
                  <span class="badge ${
                    user.is_active ? "bg-success" : "bg-secondary"
                  }">
                    ${user.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td>
                  <small class="text-muted">
                    ${
                      user.date_joined
                        ? new Date(user.date_joined).toLocaleDateString("id-ID")
                        : "-"
                    }
                  </small>
                </td>
                <td class="text-center">
                  <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-warning btn-edit-user" 
                            data-user-id="${user.id}"
                            title="Edit user">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="btn btn-danger btn-delete-user" 
                            data-user-id="${user.id}"
                            ${
                              user.role === "admin"
                                ? 'disabled title="Admin tidak bisa dihapus"'
                                : 'title="Hapus user"'
                            }
                            onclick="return confirm('Yakin hapus user ${
                              user.username
                            }?') ? deleteUser(${user.id}) : false">
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
      <div class="text-muted mt-2">
        <i class="bi bi-info-circle me-1"></i>
        Menampilkan ${users.length} user (filtered: ${totalFiltered}, total: ${
      allUsers.length
    })
      </div>
    `;

    container.innerHTML = tableHTML;

    // Setup event listeners untuk tombol aksi
    setupTableActionListeners();
  } catch (error) {
    console.error("Error rendering users table:", error);
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Error rendering table: ${error.message}
        </div>
      `;
    }
  }
}

// PERBAIKAN: Event delegation untuk tombol aksi di tabel
function setupTableActionListeners() {
  const container = document.getElementById("usersTableContainer");
  if (!container) return;

  // Hapus event listener lama jika ada
  if (container._tableActionHandler) {
    container.removeEventListener("click", container._tableActionHandler);
  }

  // Tambahkan event listener baru untuk tombol edit/delete
  const handleTableAction = (e) => {
    const editBtn = e.target.closest(".btn-edit-user");
    const deleteBtn = e.target.closest(".btn-delete-user");

    if (editBtn) {
      const userId = editBtn.getAttribute("data-user-id");
      if (userId) {
        editUser(userId);
      }
    }

    if (deleteBtn) {
      const userId = deleteBtn.getAttribute("data-user-id");
      if (userId) {
        deleteUser(userId);
      }
    }
  };

  container.addEventListener("click", handleTableAction);
  container._tableActionHandler = handleTableAction;
}

// Render pagination
function renderPagination() {
  const container = document.getElementById("paginationContainer");

  if (!container) {
    console.warn("paginationContainer tidak ditemukan");
    return;
  }

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  try {
    // PERBAIKAN: Gunakan event delegation untuk semua tombol
    let paginationHTML = `
      <nav aria-label="Page navigation">
        <ul class="pagination justify-content-center mb-0">
          <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link pagination-link" href="#" data-page="prev">
              <i class="bi bi-chevron-left"></i>
            </a>
          </li>
    `;

    // Show page numbers - maksimal 7 page number
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page
    if (startPage > 1) {
      paginationHTML += `
        <li class="page-item">
          <a class="page-link pagination-link" href="#" data-page="1">1</a>
        </li>
        ${
          startPage > 2
            ? '<li class="page-item disabled"><span class="page-link">...</span></li>'
            : ""
        }
      `;
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <a class="page-link pagination-link" href="#" data-page="${i}">${i}</a>
        </li>
      `;
    }

    // Last page
    if (endPage < totalPages) {
      paginationHTML += `
        ${
          endPage < totalPages - 1
            ? '<li class="page-item disabled"><span class="page-link">...</span></li>'
            : ""
        }
        <li class="page-item">
          <a class="page-link pagination-link" href="#" data-page="${totalPages}">${totalPages}</a>
        </li>
      `;
    }

    paginationHTML += `
          <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link pagination-link" href="#" data-page="next">
              <i class="bi bi-chevron-right"></i>
            </a>
          </li>
        </ul>
      </nav>
      <div class="text-center text-muted mt-2">
        Halaman ${currentPage} dari ${totalPages} • Total ${
      allUsers.length
    } user
      </div>
    `;

    container.innerHTML = paginationHTML;

    // PERBAIKAN: Setup event delegation untuk semua tombol pagination
    setupPaginationEventListeners(container);
  } catch (error) {
    console.error("Error rendering pagination:", error);
    container.innerHTML = "";
  }
}

// PERBAIKAN: Event delegation untuk pagination
function setupPaginationEventListeners(container) {
  // Hapus event listener lama jika ada
  if (container._paginationHandler) {
    container.removeEventListener("click", container._paginationHandler);
  }

  // Tambahkan event listener baru
  const handlePaginationClick = (e) => {
    e.preventDefault();

    const link = e.target.closest(".pagination-link");
    if (!link) return;

    const pageAction = link.getAttribute("data-page");
    let newPage;

    switch (pageAction) {
      case "prev":
        if (currentPage > 1) {
          newPage = currentPage - 1;
        }
        break;
      case "next":
        if (currentPage < totalPages) {
          newPage = currentPage + 1;
        }
        break;
      default:
        newPage = parseInt(pageAction);
    }

    // PERBAIKAN: Validasi halaman baru
    if (
      newPage &&
      newPage >= 1 &&
      newPage <= totalPages &&
      newPage !== currentPage
    ) {
      // Simpan posisi scroll
      const scrollPosition = window.scrollY;

      // Update halaman dan render
      currentPage = newPage;
      loadUsers(); // Parameter false = tidak refresh data

      // Restore scroll position setelah render
      setTimeout(() => {
        window.scrollTo({ top: scrollPosition, behavior: "smooth" });
      }, 100);
    }
  };

  container.addEventListener("click", handlePaginationClick);
  container._paginationHandler = handlePaginationClick; // Simpan reference
}

// Add user form
function showAddUserForm() {
  const formId = "addUserForm";

  // Form HTML dasar (tanpa field gender/jk dulu)
  const formHTML = `
    <form id="${formId}" class="needs-validation" novalidate>
      <div class="row g-3">
        <div class="col-md-6">
          <label for="username" class="form-label">Username <span class="text-danger">*</span></label>
          <input type="text" 
                 class="form-control" 
                 id="username" 
                 name="username"
                 placeholder="contoh: budi123" 
                 required
                 minlength="3"
                 maxlength="30">
          <div class="invalid-feedback">
            Username minimal 3 karakter dan hanya boleh huruf, angka, underscore
          </div>
          <div class="valid-feedback">
            Username valid
          </div>
        </div>
        
        <div class="col-md-6">
          <label for="role" class="form-label">Role <span class="text-danger">*</span></label>
          <select class="form-select" 
                  id="role" 
                  name="role" 
                  required>
            <option value="">-- Pilih Role --</option>
            <option value="admin">Admin</option>
            <option value="anggota">Anggota</option>
            <option value="tim_angkut">Tim Angkut</option>
            <option value="tamu" selected>Tamu</option>
          </select>
          <div class="invalid-feedback">
            Silakan pilih role
          </div>
        </div>
        
        <div class="col-md-6">
          <label for="email" class="form-label">Email <span class="text-danger">*</span></label>
          <input type="email" 
                 class="form-control" 
                 id="email" 
                 name="email"
                 placeholder="contoh: user@email.com" 
                 required>
          <div class="invalid-feedback">
            Format email tidak valid
          </div>
          <div class="valid-feedback">
            Email valid
          </div>
        </div>
        
        <!-- Gender field akan ditambahkan berdasarkan role -->
        <div id="gender-field-container"></div>
        
        <div class="col-md-6">
          <label for="password" class="form-label">Password <span class="text-danger">*</span></label>
          <input type="password" 
                 class="form-control" 
                 id="password" 
                 name="password"
                 placeholder="Minimal 8 karakter" 
                 required
                 minlength="8">
          <div class="invalid-feedback">
            Password minimal 8 karakter
          </div>
          <div class="valid-feedback">
            Password valid
          </div>
        </div>
        
        <div class="col-md-6">
          <label for="password2" class="form-label">Konfirmasi Password <span class="text-danger">*</span></label>
          <input type="password" 
                 class="form-control" 
                 id="password2" 
                 name="password2"
                 placeholder="Ketik ulang password" 
                 required
                 minlength="8">
          <div class="invalid-feedback">
            Password tidak sama
          </div>
          <div class="valid-feedback">
            Password cocok
          </div>
        </div>
        
        <div class="col-12">
          <div class="form-check">
            <input class="form-check-input" 
                   type="checkbox" 
                   id="is_active" 
                   name="is_active" 
                   checked>
            <label class="form-check-label" for="is_active">
              User Aktif
            </label>
          </div>
        </div>
      </div>
    </form>
  `;

  showModal(
    "Tambah User Baru",
    formHTML,
    async () => {
      try {
        // Setup validation
        setupFormValidation(formId);

        // Get ALL form data including dynamic fields
        const formData = {
          username: document.getElementById("username")?.value.trim() || "",
          password: document.getElementById("password")?.value || "",
          password2: document.getElementById("password2")?.value || "",
          email: document.getElementById("email")?.value.trim() || "",
          role: document.getElementById("role")?.value || "",
          is_active: document.getElementById("is_active")?.checked || true,
        };

        // Get additional fields based on role
        const role = formData.role;

        // // Field untuk Admin, Anggota, Tim Angkut: pakai "gender"
        // if (role === 'admin' || role === 'anggota' || role === 'tim_angkut') {
        //   // formData.gender = document.getElementById("gender")?.value || '';
        // }

        // Field untuk Tamu: pakai "jk"
        if (role === "tamu") {
          formData.jk = document.getElementById("jk")?.value || "";
        }

        // Get role-specific fields
        if (role === "anggota") {
          formData.nama = document.getElementById("nama")?.value.trim() || "";
          formData.alamat =
            document.getElementById("alamat")?.value.trim() || "";
          formData.noWA = document.getElementById("noWA")?.value.trim() || "";
          formData.jenisSampah =
            document.getElementById("jenisSampah")?.value || "";
          formData.latitude = document.getElementById("latitude")?.value || "";
          formData.longitude =
            document.getElementById("longitude")?.value || "";
          formData.tanggalStart =
            document.getElementById("tanggalStart")?.value || "";
          formData.tanggalEnd =
            document.getElementById("tanggalEnd")?.value || "";
        } else if (role === "tim_angkut") {
          formData.namaTim =
            document.getElementById("namaTim")?.value.trim() || "";
          formData.noWhatsapp =
            document.getElementById("noWhatsapp")?.value.trim() || "";
        } else if (role === "tamu") {
          formData.nama_tamu =
            document.getElementById("nama_tamu")?.value.trim() || "";
        }

        // Frontend validation
        const errors = validateAddUser(formData);

        // Check username uniqueness (khusus untuk admin dan tim_angkut karena menggunakan API.users)
        if (!errors.username && (role === "admin" || role === "tim_angkut")) {
          const usernameCheck = await checkUsernameUnique(formData.username);
          if (!usernameCheck.unique) {
            errors.username = usernameCheck.message;
          }
        }

        // Jika ada errors, tampilkan di field yang sesuai
        let hasErrors = false;
        for (const [field, message] of Object.entries(errors)) {
          showFieldError(field, message);
          hasErrors = true;
        }

        if (hasErrors) {
          showToast("Harap perbaiki error pada form", "danger");
          console.log("Validation errors:", errors);
          return false;
        }

        // Semua valid, tampilkan success feedback
        Object.keys(formData).forEach((key) => {
          if (document.getElementById(key)) {
            showFieldSuccess(key);
          }
        });

        // Show loading
        const modalSaveBtn = document.querySelector("#modalSaveBtn");
        if (modalSaveBtn) {
          const originalText = modalSaveBtn.innerHTML;
          modalSaveBtn.innerHTML =
            '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
          modalSaveBtn.disabled = true;
        }

        let response;
        let result;

        // Proses berdasarkan role
        switch (role) {
          case "tamu":
            // Registrasi tamu - pakai "jk"
            const tamuPayload = {
              username: formData.username,
              password: formData.password,
              email: formData.email,
              nama: formData.nama_tamu,
              jk: formData.jk,
            };

            response = await fetch(API.register, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(tamuPayload),
            });
            alert("User Tamu Berhasil di Buat");
            break;

          case "anggota":
            // Registrasi anggota - pakai "gender" untuk user model
            const anggotaPayload = {
              username: formData.username,
              password: formData.password,
              email: formData.email,
              nama: formData.nama,
              alamat: formData.alamat,
              noWA: formData.noWA,
              latitude: parseFloat(formData.latitude),
              longitude: parseFloat(formData.longitude),
              tanggalStart:
                formData.tanggalStart || new Date().toISOString().slice(0, 10),
              tanggalEnd: formData.tanggalEnd || "2025-12-31",
              status: "aktif",
              jenisSampah: formData.jenisSampah || "Rumah Tangga",
            };

            response = await fetch(API.registerAnggota, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(anggotaPayload),
            });
            alert("User Anggota Berhasil di Buat");
            break;

          case "tim_angkut":
            // 1. Create user di API.users terlebih dahulu
            const userPayload = {
              username: formData.username,
              password: formData.password,
              email: formData.email,
              role: "tim_angkut",
              is_active: formData.is_active,
            };

            const userResponse = await fetch(API.users, {
              method: "POST",
              headers: {
                ...getAuthHeaders(),
                "Content-Type": "application/json",
              },
              body: JSON.stringify(userPayload),
            });

            if (!userResponse.ok) {
              const userResult = await userResponse.json();
              throw new Error(
                userResult.detail || "Gagal membuat user untuk tim angkut"
              );
            }

            const userData = await userResponse.json();

            // 2. Create tim pengangkut dengan idUser yang didapat
            const timPayload = {
              namaTim: formData.namaTim,
              noWhatsapp: formData.noWhatsapp,
              idUser: userData.id, // id dari user yang baru dibuat
            };

            response = await fetch(API.timPengangkut, {
              method: "POST",
              headers: {
                ...getAuthHeaders(),
                "Content-Type": "application/json",
              },
              body: JSON.stringify(timPayload),
            });
            alert("User Tim angkut Berhasil di Buat");
            console.log("Tim angkut creation response:", response);
            break;

          case "admin":
            const adminPayload = {
              username: formData.username,
              password: formData.password,
              email: formData.email,
              role: "admin",
              is_active: formData.is_active,
            };

            response = await fetch(API.users, {
              method: "POST",
              headers: {
                ...getAuthHeaders(),
                "Content-Type": "application/json",
              },
              body: JSON.stringify(adminPayload),
            });

            alert("User Admin Berhasil di Buat");
            break;

          default:
            throw new Error("Role tidak valid");
        }

        // Get result dari response terakhir
        if (response) {
          result = await response.json();
        }

        // Reset button
        if (modalSaveBtn) {
          modalSaveBtn.innerHTML = "Simpan";
          modalSaveBtn.disabled = false;
        }

        if (response && !response.ok) {
          // Handle backend errors
          let errorMessage = "Gagal menambahkan user";
          if (result) {
            // Check for common backend errors
            if (result.username && Array.isArray(result.username)) {
              if (
                result.username.includes(
                  "user with this username already exists"
                )
              ) {
                errorMessage = "Username sudah digunakan";
                showFieldError("username", "Username sudah digunakan");
              }
            }

            if (typeof result === "object") {
              const errorMessages = [];
              for (const [key, value] of Object.entries(result)) {
                if (Array.isArray(value)) {
                  errorMessages.push(`${key}: ${value.join(", ")}`);
                } else {
                  errorMessages.push(`${key}: ${value}`);
                }
              }
              if (errorMessages.length > 0) {
                errorMessage = errorMessages.join("; ");
              }
            }
          }

          showToast(errorMessage, "danger");
          console.log("Backend errors:", result);
          return false;
        }

        // Success
        showToast("User berhasil ditambahkan", "success");
        loadUsers();
        return true;
      } catch (error) {
        console.error("Error creating user:", error);
        showToast("Terjadi kesalahan jaringan", "danger");
        console.log(error);

        // Reset button
        const modalSaveBtn = document.querySelector("#modalSaveBtn");
        if (modalSaveBtn) {
          modalSaveBtn.innerHTML = "Simpan";
          modalSaveBtn.disabled = false;
        }

        return false;
      }
    },
    true
  );

  // Setup dynamic fields after modal is shown
  setTimeout(() => {
    const form = document.getElementById(formId);
    if (form) {
      // Function untuk update gender/jk field berdasarkan role
      const updateGenderField = (role) => {
        const container = document.getElementById("gender-field-container");
        if (!container) return;

        let fieldHTML = "";

        if (role === "tamu") {
          // Untuk tamu: pakai "jk"
          fieldHTML = `
            <div data-role-specific class="col-md-6">
              <label for="jk" class="form-label">Jenis Kelamin <span class="text-danger">*</span></label>
              <select class="form-select" id="jk" name="jk" required>
                <option value="">-- Pilih Jenis Kelamin --</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
              <div class="invalid-feedback">
                Jenis kelamin wajib dipilih
              </div>
            </div>
          `;
        } else if (role === "tamu" || role === "tamu" || role === "tamu") {
          // Untuk admin, anggota, tim_angkut: pakai "gender"
          fieldHTML = `
            <div data-role-specific class="col-md-6">
              <label for="gender" class="form-label">Jenis Kelamin</label>
              <select class="form-select" id="gender" name="gender">
                <option value="">-- Pilih Jenis Kelamin --</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          `;
        } else {
          // Untuk role lain, kosongkan
          fieldHTML = "";
        }

        container.innerHTML = fieldHTML;
        setupFormValidation(formId);
      };

      // Setup dynamic fields based on role
      const roleSelect = document.getElementById("role");
      if (roleSelect) {
        roleSelect.addEventListener("change", function () {
          const role = this.value;
          // Update gender/jk field terlebih dahulu
          updateGenderField(role);
          // Kemudian update field lainnya
          updateFormFieldsBasedOnRole(role, formId);
          // Setup validation
          setTimeout(() => setupFormValidation(formId), 50);
        });

        // Trigger initial setup
        const initialRole = roleSelect.value;
        updateGenderField(initialRole);
        updateFormFieldsBasedOnRole(initialRole, formId);

        // Setup validation for initial fields
        setTimeout(() => setupFormValidation(formId), 50);
      }

      // Real-time validation for username
      const usernameInput = document.getElementById("username");
      if (usernameInput) {
        let usernameTimeout;
        usernameInput.addEventListener("input", async () => {
          clearTimeout(usernameTimeout);
          const username = usernameInput.value.trim();

          if (username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username)) {
            usernameTimeout = setTimeout(async () => {
              const check = await checkUsernameUnique(username);
              if (!check.unique) {
                showFieldError("username", check.message);
              } else {
                showFieldSuccess("username");
              }
            }, 500);
          }
        });
      }

      // Real-time validation for password match
      const passwordInput = document.getElementById("password");
      const password2Input = document.getElementById("password2");

      if (passwordInput && password2Input) {
        const validatePasswordMatch = () => {
          if (
            password2Input.value &&
            passwordInput.value !== password2Input.value
          ) {
            showFieldError("password2", "Password tidak sama");
          } else if (
            password2Input.value &&
            passwordInput.value === password2Input.value
          ) {
            showFieldSuccess("password2");
            resetFieldValidation("password2");
          }
        };

        passwordInput.addEventListener("input", validatePasswordMatch);
        password2Input.addEventListener("input", validatePasswordMatch);
      }

      // Real-time validation for email
      const emailInput = document.getElementById("email");
      if (emailInput) {
        emailInput.addEventListener("input", () => {
          const email = emailInput.value.trim();
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showFieldError("email", "Format email tidak valid");
          } else if (email) {
            showFieldSuccess("email");
          }
        });
      }

      // Auto validate on blur
      const inputs = form.querySelectorAll("input, select");
      inputs.forEach((input) => {
        input.addEventListener("blur", () => {
          if (input.value && input.checkValidity()) {
            showFieldSuccess(input.id);
          }
        });
      });
    }
  }, 100);
}

// Edit user
async function editUser(userId) {
  try {
    // Show loading
    showToast("Memuat data user...", "info");

    const response = await fetch(`${API.users}${userId}/`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gagal mengambil data user: ${errorText}`);
    }

    const user = await response.json();
    const formId = `editUserForm-${userId}`;

    // Simpan data original untuk validasi perubahan
    const originalData = {
      ...user,
      role: user.role,
      username: user.username,
      email: user.email || "",
      is_active: user.is_active || false,
    };

    // Form HTML yang SIMPLE - hanya data user
    const formHTML = `
      <form id="${formId}" class="needs-validation" novalidate>
        <div class="row g-3">
          <div class="col-md-6">
            <label for="username" class="form-label">Username <span class="text-danger">*</span></label>
            <input type="text" 
                   class="form-control" 
                   id="username" 
                   name="username"
                   value="${user.username || ""}" 
                   placeholder="contoh: budi123" 
                   required
                   minlength="3"
                   maxlength="30">
            <div class="invalid-feedback">
              Username minimal 3 karakter dan hanya boleh huruf, angka, underscore
            </div>
            <div class="valid-feedback">
              Username valid
            </div>
          </div>
          
          <div class="col-md-6">
            <label for="role" class="form-label">Role <span class="text-danger">*</span></label>
            <select class="form-select" 
                    id="role" 
                    name="role" 
                    required
                    disabled>
              <option value="">-- Pilih Role --</option>
              <option value="admin" ${
                user.role === "admin" ? "selected" : ""
              }>Admin</option>
              <option value="anggota" ${
                user.role === "anggota" ? "selected" : ""
              }>Anggota</option>
              <option value="tim_angkut" ${
                user.role === "tim_angkut" ? "selected" : ""
              }>Tim Angkut</option>
              <option value="tamu" ${
                user.role === "tamu" ? "selected" : ""
              }>Tamu</option>
            </select>
            <div class="invalid-feedback">
              Silakan pilih role
            </div>
            <small class="text-muted">Role tidak dapat diubah</small>
          </div>
          
          <div class="col-md-6">
            <label for="email" class="form-label">Email</label>
            <input type="email" 
                   class="form-control" 
                   id="email" 
                   name="email"
                   value="${user.email || ""}" 
                   placeholder="contoh: user@email.com">
            <div class="invalid-feedback">
              Format email tidak valid
            </div>
            <div class="valid-feedback">
              Email valid
            </div>
          </div>
          
          <div class="col-12">
            <hr>
            <h6 class="text-muted">Ubah Password (Opsional)</h6>
          </div>
          
          <div class="col-md-6">
            <label for="password" class="form-label">Password Baru</label>
            <input type="password" 
                   class="form-control" 
                   id="password" 
                   name="password"
                   placeholder="Kosongkan jika tidak diubah"
                   minlength="8">
            <div class="invalid-feedback">
              Password minimal 8 karakter
            </div>
            <div class="valid-feedback">
              Password valid
            </div>
          </div>
          
          <div class="col-md-6">
            <label for="password2" class="form-label">Konfirmasi Password</label>
            <input type="password" 
                   class="form-control" 
                   id="password2" 
                   name="password2"
                   placeholder="Konfirmasi password baru">
            <div class="invalid-feedback">
              Password tidak sama
            </div>
            <div class="valid-feedback">
              Password cocok
            </div>
          </div>
          
          <div class="col-12">
            <div class="form-check">
              <input class="form-check-input" 
                     type="checkbox" 
                     id="is_active" 
                     name="is_active" 
                     ${user.is_active ? "checked" : ""}>
              <label class="form-check-label" for="is_active">
                User Aktif
              </label>
            </div>
          </div>
          
          <div class="col-12">
            <div class="alert alert-info">
              <small>
                <i class="bi bi-info-circle me-1"></i>
                <strong>Note:</strong> Edit ini hanya untuk data user.<br>
                Untuk edit data spesifik (anggota, tim angkut, tamu), silakan edit dari menu masing-masing.
              </small>
            </div>
          </div>
        </div>
      </form>
    `;

    showModal(
      `Edit User: ${user.username}`,
      formHTML,
      async () => {
        try {
          // Setup validation
          setupFormValidation(formId);

          // Get ONLY user data - SEDERHANA sesuai request Anda
          const formData = {
            username: document.getElementById("username")?.value.trim() || "",
            email: document.getElementById("email")?.value.trim() || "",
            role: document.getElementById("role")?.value || originalData.role, // Role tidak bisa diubah
            password: document.getElementById("password")?.value || "",
            password2: document.getElementById("password2")?.value || "",
            is_active: document.getElementById("is_active")?.checked || false,
          };

          // Check if password is being changed
          const isPasswordChange = formData.password || formData.password2;

          // Frontend validation sederhana
          const errors = {};

          // Validasi username
          if (!formData.username || formData.username.trim().length < 3) {
            errors.username = "Username minimal 3 karakter";
          } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            errors.username = "Username hanya boleh huruf, angka, underscore";
          }

          // Validasi email (opsional, tapi jika diisi harus valid)
          if (
            formData.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
          ) {
            errors.email = "Format email tidak valid";
          }

          // Validasi password jika diubah
          if (isPasswordChange) {
            if (formData.password && formData.password.length < 8) {
              errors.password = "Password minimal 8 karakter";
            }
            if (
              formData.password &&
              formData.password2 &&
              formData.password !== formData.password2
            ) {
              errors.password2 = "Password dan konfirmasi password tidak sama";
            }
          }

          // Check username uniqueness (exclude current user)
          if (!errors.username && formData.username !== originalData.username) {
            const usernameCheck = await checkUsernameUnique(
              formData.username,
              userId
            );
            if (!usernameCheck.unique) {
              errors.username = usernameCheck.message;
            }
          }

          // Check if any changes were made
          let hasChanges = false;
          const changedFields = [];

          // Compare each field
          Object.keys(formData).forEach((key) => {
            if (key === "password" || key === "password2") return; // Skip password fields for comparison

            const currentValue = formData[key];
            const originalValue = originalData[key];

            if (currentValue !== originalValue) {
              hasChanges = true;
              changedFields.push(key);
            }
          });

          // Jika tidak ada perubahan, tampilkan warning
          if (!hasChanges && !isPasswordChange) {
            showToast("Tidak ada perubahan data", "warning");
            return true; // Tutup modal tanpa error
          }

          // Jika ada errors, tampilkan di field yang sesuai
          let hasErrors = false;
          for (const [field, message] of Object.entries(errors)) {
            showFieldError(field, message);
            hasErrors = true;
          }

          if (hasErrors) {
            showToast("Harap perbaiki error pada form", "danger");
            return false;
          }

          // Semua valid, tampilkan success feedback untuk field yang berubah
          changedFields.forEach((key) => {
            if (document.getElementById(key)) {
              showFieldSuccess(key);
            }
          });

          // Show loading
          const modalSaveBtn = document.querySelector("#modalSaveBtn");
          if (modalSaveBtn) {
            const originalText = modalSaveBtn.innerHTML;
            modalSaveBtn.innerHTML =
              '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
            modalSaveBtn.disabled = true;
          }

          // Prepare data untuk update
          const updateData = {
            username: formData.username,
            email: formData.email || null, // Jika kosong, kirim null
            is_active: formData.is_active,
          };

          // Tambahkan password jika ada perubahan
          if (formData.password) {
            updateData.password = formData.password;
          }

          // Kirim PATCH request
          const response = await fetch(`${API.users}${userId}/`, {
            method: "PATCH",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updateData),
          });

          // Get result
          const result = await response.json();
          alert("User Berhasil di Ubah");

          // Reset button
          if (modalSaveBtn) {
            modalSaveBtn.innerHTML = "Simpan";
            modalSaveBtn.disabled = false;
          }

          if (!response.ok) {
            // Handle backend errors
            let errorMessage = "Gagal mengupdate user";
            if (result) {
              if (result.username && Array.isArray(result.username)) {
                if (
                  result.username.includes(
                    "user with this username already exists"
                  )
                ) {
                  errorMessage = "Username sudah digunakan";
                  showFieldError("username", "Username sudah digunakan");
                }
              }

              if (typeof result === "object") {
                const errorMessages = [];
                for (const [key, value] of Object.entries(result)) {
                  if (Array.isArray(value)) {
                    errorMessages.push(`${key}: ${value.join(", ")}`);
                  } else {
                    errorMessages.push(`${key}: ${value}`);
                  }
                }
                if (errorMessages.length > 0) {
                  errorMessage = errorMessages.join("; ");
                }
              }
            }

            showToast(errorMessage, "danger");
            return false;
          }

          // Success
          showToast("User berhasil diperbarui", "success");
          loadUsers();
          return true;
        } catch (error) {
          console.error("Error updating user:", error);
          showToast("Terjadi kesalahan jaringan", "danger");

          // Reset button
          const modalSaveBtn = document.querySelector("#modalSaveBtn");
          if (modalSaveBtn) {
            modalSaveBtn.innerHTML = "Simpan";
            modalSaveBtn.disabled = false;
          }

          return false;
        }
      },
      true
    );

    // Setup event listeners after modal is shown
    setTimeout(() => {
      const form = document.getElementById(formId);
      if (form) {
        // Real-time validation for username
        const usernameInput = document.getElementById("username");
        if (usernameInput) {
          let usernameTimeout;
          usernameInput.addEventListener("input", async () => {
            clearTimeout(usernameTimeout);
            const username = usernameInput.value.trim();

            if (
              username.length >= 3 &&
              /^[a-zA-Z0-9_]+$/.test(username) &&
              username !== originalData.username
            ) {
              usernameTimeout = setTimeout(async () => {
                const check = await checkUsernameUnique(username, userId);
                if (!check.unique) {
                  showFieldError("username", check.message);
                } else {
                  showFieldSuccess("username");
                }
              }, 500);
            }
          });
        }

        // Real-time validation for password match
        const passwordInput = document.getElementById("password");
        const password2Input = document.getElementById("password2");

        if (passwordInput && password2Input) {
          const validatePasswordMatch = () => {
            if (
              passwordInput.value &&
              password2Input.value &&
              passwordInput.value !== password2Input.value
            ) {
              showFieldError("password2", "Password tidak sama");
            } else if (
              password2Input.value &&
              passwordInput.value === password2Input.value
            ) {
              showFieldSuccess("password2");
              resetFieldValidation("password2");
            }
          };

          passwordInput.addEventListener("input", validatePasswordMatch);
          password2Input.addEventListener("input", validatePasswordMatch);
        }

        // Real-time validation for email
        const emailInput = document.getElementById("email");
        if (emailInput) {
          emailInput.addEventListener("input", () => {
            const email = emailInput.value.trim();
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              showFieldError("email", "Format email tidak valid");
            } else if (email) {
              showFieldSuccess("email");
            }
          });
        }
      }
    }, 100);
  } catch (error) {
    console.error("Error loading user data:", error);
    showToast(error.message, "danger");
  }
}

// Fungsi untuk menampilkan alert modal dengan tambahan button ke Django Admin
function showAlertModal(title, message, type = "info", adminUrl = null) {
  // Buat modal element
  const modalHtml = `
    <div class="modal fade" id="alertModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title d-flex align-items-center">
              <i class="bi ${type === 'warning' ? 'bi-exclamation-triangle-fill text-warning' : 
                           type === 'danger' ? 'bi-x-circle-fill text-danger' : 
                           type === 'success' ? 'bi-check-circle-fill text-success' : 
                           'bi-info-circle-fill text-info'} me-2"></i>
              ${title}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body pt-1">
            <div class="alert alert-${type} border-0 bg-${type}-bg">
              ${message}
            </div>
            
            ${adminUrl ? `
            <div class="mt-3 text-center">
              <a href="${adminUrl}" target="_blank" class="btn btn-outline-secondary btn-sm">
                <i class="bi bi-gear me-1"></i> Buka Panel Admin Django
              </a>
              <small class="d-block text-muted mt-2">
                <i class="bi bi-info-circle me-1"></i>
                Akses ke panel admin untuk nonaktifkan user terlebih dahulu
              </small>
            </div>
            ` : ''}
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-${type}" data-bs-dismiss="modal">
              <i class="bi bi-check-circle me-1"></i> Mengerti
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Tambahkan ke body jika belum ada
  let modalEl = document.getElementById('alertModal');
  if (!modalEl) {
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    modalEl = document.getElementById('alertModal');
  } else {
    modalEl.innerHTML = modalHtml;
  }
  
  // Tampilkan modal
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
  
  // Hapus modal setelah ditutup
  modalEl.addEventListener('hidden.bs.modal', function () {
    modalEl.remove();
  });
}

// Delete user
async function deleteUser(userId) {
  try {
    // Ambil data user dulu untuk mendapatkan role dan status
    const userResponse = await fetch(`${API.users}${userId}/`, {
      headers: getAuthHeaders(),
    });

    if (!userResponse.ok) {
      throw new Error(`Gagal mengambil data user: ${userResponse.status}`);
    }

    const user = await userResponse.json();
    const userName = user.username || "User";
    const userRole = user.role || "User";
    
    // AMBIL STATUS AKTIF DENGAN CARA YANG LEBIH AKURAT
    // Cek beberapa kemungkinan field yang menandakan user aktif
    const isActive = (
      user.is_active === true ||
      user.active === true ||
      user.status === 'active' ||
      user.online_status === true ||
      (user.last_login && isRecentlyActive(user.last_login)) || // Jika ada last_login
      false // Default false
    );

    // CEK APAKAH USER SEDANG AKTIF - TIDAK BOLEH DIHAPUS
    if (isActive) {
      // URL Django Admin
      const adminUrl = "http://127.0.0.1:8000/admin/apk/user/";
      
      // Tampilkan alert modal dengan button ke Django Admin
      showAlertModal(
        `⚠️ User "${userName}" Sedang Aktif!`,
        `User <strong>"${userName}"</strong> (${userRole}) sedang aktif/online dan tidak dapat dihapus.<br><br>
         <small class="text-muted">
           <i class="bi bi-info-circle me-1"></i>
           Untuk menghapus user ini, tunggu hingga user logout atau nonaktifkan terlebih dahulu melalui panel admin.
         </small>`,
        "warning",
        adminUrl
      );
      return; // HENTIKAN PROSES, TIDAK BISA LANJUT
    }

    // Lanjutkan dengan proses penghapusan hanya jika user TIDAK aktif
    await proceedWithDeletion(user, userId, userName, userRole);
    
  } catch (error) {
    console.error("Error loading user data for deletion:", error);
    showToast(`Gagal memuat data user: ${error.message}`, "danger");
  }
}

// Fungsi untuk cek apakah user baru-baru ini aktif berdasarkan last_login
function isRecentlyActive(lastLoginTimestamp) {
  if (!lastLoginTimestamp) return false;

  try {
    const lastLogin = new Date(lastLoginTimestamp);
    const now = new Date();
    const diffInMinutes = (now - lastLogin) / (1000 * 60); // Selisih dalam menit

    // Jika terakhir login kurang dari 15 menit yang lalu, dianggap aktif
    return diffInMinutes < 15;
  } catch {
    return false;
  }
}

// Fungsi terpisah untuk proses penghapusan (hanya dipanggil jika user tidak aktif)
async function proceedWithDeletion(user, userId, userName, userRole) {
  // Tentukan message berdasarkan role
  let deleteMessage = `Apakah Anda yakin ingin menghapus ${userRole} "${userName}"? Tindakan ini tidak dapat dibatalkan.`;

  // Tambahan pesan khusus berdasarkan role
  switch (userRole) {
    case "anggota":
      deleteMessage +=
        "\n\nData anggota dan riwayat pengangkutan sampah juga akan dihapus.";
      break;
    case "tim_angkut":
      deleteMessage +=
        "\n\nData tim pengangkut dan riwayat penugasan juga akan dihapus.";
      break;
    case "tamu":
      deleteMessage += "\n\nData profil tamu juga akan dihapus.";
      break;
    case "admin":
      deleteMessage +=
        "\n\nHati-hati! Menghapus admin dapat mempengaruhi akses sistem.";
      break;
  }

  // Juga cek apakah ini menghapus diri sendiri
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const isDeletingSelf = currentUser.id === userId;

  if (isDeletingSelf) {
    deleteMessage +=
      "\n\n⚠️ <strong>PERINGATAN:</strong> Anda sedang menghapus akun Anda sendiri!";
  }

  showConfirmModal(deleteMessage, async () => {
    try {
      // Show loading
      showToast("Menghapus user...", "info");

      // Hapus berdasarkan role (mungkin perlu endpoint berbeda)
      let response;

      // Coba hapus melalui endpoint yang sesuai
      if (userRole === "anggota" && user.anggota && user.anggota.idAnggota) {
        // Coba hapus anggota terlebih dahulu
        response = await fetch(`${API.users}${userId}/`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
      } else if (
        userRole === "tim_angkut" &&
        user.tim_pengangkut &&
        user.tim_pengangkut.idTim
      ) {
        // Hapus tim pengangkut terlebih dahulu
        const timResponse = await fetch(
          `${API.timPengangkut}${user.tim_pengangkut.idTim}/`,
          {
            method: "DELETE",
            headers: getAuthHeaders(),
          }
        );

        if (timResponse.ok) {
          // Hapus user setelah tim dihapus
          response = await fetch(`${API.users}${userId}/`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });
        } else {
          throw new Error("Gagal menghapus data tim pengangkut");
        }
      } else {
        // Untuk admin dan tamu, hapus langsung
        response = await fetch(`${API.users}${userId}/`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      showToast("User berhasil dihapus", "success");

      // Jika menghapus diri sendiri, logout
      if (isDeletingSelf) {
        setTimeout(() => {
          logout();
          window.location.hash = "#/login";
        }, 1500);
      } else {
        currentPage = 1;
        loadUsers();
      }

      currentPage = 1;
      loadUsers();

      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      showToast(`Gagal menghapus user: ${error.message}`, "danger");
      throw error;
    }
  });
}

// Tambahkan style untuk alert modal
const style = document.createElement("style");
style.textContent = `
  .bg-warning-bg { background-color: rgba(255, 193, 7, 0.1) !important; }
  .bg-danger-bg { background-color: rgba(220, 53, 69, 0.1) !important; }
  .bg-success-bg { background-color: rgba(25, 135, 84, 0.1) !important; }
  .bg-info-bg { background-color: rgba(13, 202, 240, 0.1) !important; }
`;
document.head.appendChild(style);

// Function untuk update JK field pada edit mode
const updateJKFieldForEdit = (role, jkValue) => {
  const container = document.getElementById("jk-field-container");
  if (!container) return;

  let fieldHTML = "";

  if (role === "tamu") {
    // Hanya untuk tamu: tampilkan field JK
    fieldHTML = `
            <div data-role-specific class="col-md-6">
                <label for="jk" class="form-label">Jenis Kelamin <span class="text-danger">*</span></label>
                <select class="form-select" id="jk" name="jk" required>
                    <option value="">-- Pilih Jenis Kelamin --</option>
                    <option value="L" ${
                      jkValue === "L" ? "selected" : ""
                    }>Laki-laki</option>
                    <option value="P" ${
                      jkValue === "P" ? "selected" : ""
                    }>Perempuan</option>
                </select>
                <div class="invalid-feedback">
                    Jenis kelamin wajib dipilih
                </div>
            </div>
        `;
  } else {
    // Untuk role lain: tidak tampilkan field JK
    fieldHTML = "";
  }

  container.innerHTML = fieldHTML;
  setupFormValidation(formId);
};

// Function to update form fields based on selected role
function updateFormFieldsBasedOnRole(role, formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  // Remove existing role-specific fields (kecuali gender/jk field)
  const existingDynamicFields = form.querySelectorAll("[data-role-specific]");
  existingDynamicFields.forEach((field) => {
    // Jangan hapus gender/jk field (sudah dihandle terpisah)
    if (
      field.id !== "gender-field-container" &&
      !field.querySelector("#gender") &&
      !field.querySelector("#jk")
    ) {
      field.remove();
    }
  });

  // Container untuk fields tambahan (selain gender/jk)
  const fieldsContainer = form.querySelector(".row.g-3");
  if (!fieldsContainer) return;

  let additionalFields = "";

  switch (role) {
    case "anggota":
      additionalFields = `
                <div data-role-specific class="col-md-6">
                    <label for="nama" class="form-label">Nama Lengkap <span class="text-danger">*</span></label>
                    <input type="text" 
                           class="form-control" 
                           id="nama" 
                           name="nama"
                           placeholder="Nama lengkap anggota" 
                           required>
                    <div class="invalid-feedback">
                        Nama wajib diisi
                    </div>
                </div>
                
                <div data-role-specific class="col-md-6">
                    <label for="alamat" class="form-label">Alamat <span class="text-danger">*</span></label>
                    <textarea class="form-control" 
                              id="alamat" 
                              name="alamat"
                              placeholder="Alamat lengkap" 
                              rows="2" 
                              required></textarea>
                    <div class="invalid-feedback">
                        Alamat wajib diisi
                    </div>
                </div>
                
                <div data-role-specific class="col-md-6">
                    <label for="noWA" class="form-label">No. WhatsApp <span class="text-danger">*</span></label>
                    <input type="tel" 
                           class="form-control" 
                           id="noWA" 
                           maxlength="12"
                           name="noWA"
                           placeholder="contoh: 081234567890" 
                           pattern="[0-9]{10,13}"
                           required>
                    <div class="invalid-feedback">
                        No. WhatsApp harus 10-13 digit angka
                    </div>
                </div>
                
                <div data-role-specific class="col-md-6">
                    <label for="jenisSampah" class="form-label">Jenis Sampah <span class="text-danger">*</span></label>
                    <select class="form-select" 
                            id="jenisSampah" 
                            name="jenisSampah" 
                            required>
                        <option value="">-- Pilih Jenis Sampah --</option>
                        <option value="Rumah Tangga">Rumah Tangga</option>
                        <option value="Tempat Usaha">Tempat Usaha</option>
                    </select>
                    <div class="invalid-feedback">
                        Jenis sampah wajib dipilih
                    </div>
                </div>
                
                <div data-role-specific class="col-md-6">
                    <label for="latitude" class="form-label">Latitude <span class="text-danger">*</span></label>
                    <input type="number" 
                           class="form-control" 
                           id="latitude" 
                           name="latitude"
                           placeholder="contoh: -6.2088" 
                           step="any"
                           required>
                    <div class="invalid-feedback">
                        Latitude wajib diisi
                    </div>
                </div>
                
                <div data-role-specific class="col-md-6">
                    <label for="longitude" class="form-label">Longitude <span class="text-danger">*</span></label>
                    <input type="number" 
                           class="form-control" 
                           id="longitude" 
                           name="longitude"
                           placeholder="contoh: 106.8456" 
                           step="any"
                           required>
                    <div class="invalid-feedback">
                        Longitude wajib diisi
                    </div>
                </div>
                
                <div data-role-specific class="col-md-6">
                    <label for="tanggalStart" class="form-label">Tanggal Mulai <span class="text-danger">*</span></label>
                    <input type="date" 
                           class="form-control" 
                           id="tanggalStart" 
                           name="tanggalStart"
                           required>
                    <div class="invalid-feedback">
                        Tanggal mulai wajib diisi
                    </div>
                </div>
                
                <div data-role-specific class="col-md-6">
                    <label for="tanggalEnd" class="form-label">Tanggal Berakhir <span class="text-danger">*</span></label>
                    <input type="date" 
                           class="form-control" 
                           id="tanggalEnd" 
                           name="tanggalEnd"
                           required>
                    <div class="invalid-feedback">
                        Tanggal berakhir wajib diisi
                    </div>
                </div>
            `;
      break;

    case "tim_angkut":
      additionalFields = `
                <div data-role-specific class="col-md-6">
                    <label for="namaTim" class="form-label">Nama Tim <span class="text-danger">*</span></label>
                    <input type="text" 
                           class="form-control" 
                           id="namaTim" 
                           name="namaTim"
                           placeholder="Nama tim pengangkut" 
                           required>
                    <div class="invalid-feedback">
                        Nama tim wajib diisi
                    </div>
                </div>
                
                <div data-role-specific class="col-md-6">
                    <label for="noWhatsapp" class="form-label">No. WhatsApp Tim <span class="text-danger">*</span></label>
                    <input type="tel" 
                           class="form-control" 
                           id="noWhatsapp" maxlength="12"
                           name="noWhatsapp"
                           placeholder="contoh: 081234567890" 
                           pattern="[0-9]{10,12}"
                           required>
                    <div class="invalid-feedback">
                        No. WhatsApp harus 10-12 digit angka
                    </div>
                </div>
            `;
      break;

    case "tamu":
      additionalFields = `
                <div data-role-specific class="col-md-6">
                    <label for="nama_tamu" class="form-label">Nama Tamu <span class="text-danger">*</span></label>
                    <input type="text" 
                           class="form-control" 
                           id="nama_tamu" 
                           name="nama_tamu"
                           placeholder="Nama lengkap tamu" 
                           required>
                    <div class="invalid-feedback">
                        Nama wajib diisi
                    </div>
                </div>
            `;
      break;

    case "admin":
      // Tidak ada field tambahan untuk admin
      break;
  }

  // Insert additional fields (selain gender/jk)
  if (additionalFields) {
    // Cari posisi sebelum password field
    const passwordField = form.querySelector("#password");
    if (passwordField) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = additionalFields;
      while (tempDiv.firstChild) {
        passwordField.parentNode.parentNode.insertBefore(
          tempDiv.firstChild,
          passwordField.parentNode
        );
      }
    }
  }

  // Setup validation for new fields
  setupFormValidation(formId);
}
