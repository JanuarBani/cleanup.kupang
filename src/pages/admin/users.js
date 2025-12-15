import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showModal, showConfirmModal } from "../../utils/modal.js";

export async function userAdminPage() {
  const mainContent = document.getElementById("mainContent");

  if (!document.getElementById('modalContainer')) {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modalContainer';
    document.body.appendChild(modalContainer);
  }
  
  mainContent.innerHTML = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Manajemen Users</h2>
                <button id="addUserBtn" style="padding: 8px 16px; background: #28a745; color: white;">+ Tambah User</button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <input type="text" id="searchUser" placeholder="Cari user..." style="padding: 8px; width: 300px;">
                <select id="filterRole" style="padding: 8px; margin-left: 10px;">
                    <option value="">Semua Role</option>
                    <option value="admin">Admin</option>
                    <option value="anggota">Anggota</option>
                    <option value="tim_angkut">Tim Angkut</option>
                    <option value="tamu">Tamu</option>
                </select>
            </div>
            
            <div id="usersTableContainer">
                <p>Loading data...</p>
            </div>
        </div>
    `;

  document.getElementById("addUserBtn").onclick = () => showAddUserForm();
  document.getElementById("searchUser").oninput = loadUsers;
  document.getElementById("filterRole").onchange = loadUsers;

  loadUsers();
}

async function loadUsers() {
  const search = document.getElementById("searchUser").value;
  const filterRole = document.getElementById("filterRole").value;

  try {
    const users = await fetchAPI(API.users, {
      headers: getAuthHeaders(),
    });

    const filteredUsers = users.filter((user) => {
      const matchSearch =
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = !filterRole || user.role === filterRole;
      return matchSearch && matchRole;
    });

    renderUsersTable(filteredUsers);
  } catch (error) {
    document.getElementById(
      "usersTableContainer"
    ).innerHTML = `<p style="color: red;">Error loading users: ${error.message}</p>`;
  }
}

function renderUsersTable(users) {
  const container = document.getElementById("usersTableContainer");

  if (users.length === 0) {
    container.innerHTML = `<p>Tidak ada data user</p>`;
    return;
  }

  const tableHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f2f2f2;">
                    <th style="padding: 10px; border: 1px solid #ddd;">ID</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Username</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Email</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Role</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                ${users
                  .map(
                    (user) => `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">${
                          user.id
                        }</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${
                          user.username
                        }</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${
                          user.email || "-"
                        }</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">
                            <span style="
                                padding: 2px 8px;
                                border-radius: 4px;
                                background: ${getRoleColor(user.role)};
                                color: white;
                                font-size: 12px;
                            ">${user.role}</span>
                        </td>
                        <td style="padding: 10px; border: 1px solid #ddd;">
                            <button onclick="editUser(${
                              user.id
                            })" style="padding: 4px 8px; margin-right: 5px; background: #ffc107;">Edit</button>
                            <button onclick="deleteUser(${
                              user.id
                            })" style="padding: 4px 8px; background: #dc3545; color: white;">Hapus</button>
                        </td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
    `;

  container.innerHTML = tableHTML;

  // Tambahkan fungsi ke window untuk bisa dipanggil dari inline onclick
  window.editUser = editUser;
  window.deleteUser = deleteUser;
}

function getRoleColor(role) {
  const colors = {
    admin: "#dc3545",
    anggota: "#28a745",
    tim_angkut: "#007bff",
    tamu: "#6c757d",
  };
  return colors[role] || "#6c757d";
}

function showAddUserForm() {
  const formHTML = `
        <div style="display: flex; flex-direction: column; gap: 15px;">
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Username *</label>
                <input type="text" id="username" required 
                       placeholder="contoh: budi123"
                       style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Password *</label>
                <input type="password" id="password" required 
                       placeholder="Minimal 8 karakter"
                       style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Konfirmasi Password *</label>
                <input type="password" id="password2" required 
                       placeholder="Ketik ulang password"
                       style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Email</label>
                <input type="email" id="email" 
                       placeholder="contoh: user@email.com"
                       style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Nama Lengkap</label>
                <input type="text" id="first_name" 
                       placeholder="Nama lengkap user"
                       style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Role *</label>
                <select id="role" required 
                        style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                    <option value="">-- Pilih Role --</option>
                    <option value="admin">Admin</option>
                    <option value="anggota">Anggota</option>
                    <option value="tim_angkut">Tim Angkut</option>
                    <option value="tamu" selected>Tamu</option>
                </select>
            </div>
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Jenis Kelamin</label>
                <select id="gender" 
                        style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                    <option value="">-- Pilih Jenis Kelamin --</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                </select>
            </div>
            <div id="formMessage" style="margin-top: 10px;"></div>
        </div>
    `;

  showModal(
    "Tambah User Baru",
    formHTML,
    async () => {
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;
      const password2 = document.getElementById("password2").value;
      const email = document.getElementById("email").value.trim();
      const first_name = document.getElementById("first_name").value.trim();
      const role = document.getElementById("role").value;
      const gender = document.getElementById("gender").value;

      // Validasi
      const messageDiv = document.getElementById("formMessage");
      messageDiv.innerHTML = "";
      messageDiv.style.padding = "10px";
      messageDiv.style.borderRadius = "4px";

      // Validasi password
      if (password !== password2) {
        messageDiv.style.backgroundColor = "#ffebee";
        messageDiv.style.color = "#c62828";
        messageDiv.innerHTML = "Password dan konfirmasi password tidak sama!";
        return;
      }

      if (password.length < 8) {
        messageDiv.style.backgroundColor = "#ffebee";
        messageDiv.style.color = "#c62828";
        messageDiv.innerHTML = "Password minimal 8 karakter!";
        return;
      }

      // Validasi username
      if (!username) {
        messageDiv.style.backgroundColor = "#ffebee";
        messageDiv.style.color = "#c62828";
        messageDiv.innerHTML = "Username harus diisi!";
        return;
      }

      // Validasi role
      if (!role) {
        messageDiv.style.backgroundColor = "#ffebee";
        messageDiv.style.color = "#c62828";
        messageDiv.innerHTML = "Role harus dipilih!";
        return;
      }

      // Siapkan data sesuai format Django REST API
      const userData = {
        username: username,
        password: password,
        email: email || "",
        role: role,
      };

      // Tambahkan field opsional jika ada nilai
      if (first_name) userData.first_name = first_name;
      if (gender) userData.gender = gender;

      // Tambahkan data khusus berdasarkan role
      if (role === "tamu") {
        userData.nama = first_name || username;
        userData.jk = gender || "L";
      }

      console.log("Creating user with data:", userData);

      try {
        // Kirim request untuk membuat user
        const response = await fetch(API.users, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(userData),
        });

        const result = await response.json();

        if (!response.ok) {
          // Tampilkan error dari server
          let errorMessage = "Gagal menambahkan user";
          if (result) {
            if (typeof result === "object") {
              // Gabungkan semua error messages
              const errors = [];
              for (const [field, messages] of Object.entries(result)) {
                if (Array.isArray(messages)) {
                  errors.push(`${field}: ${messages.join(", ")}`);
                } else {
                  errors.push(`${field}: ${messages}`);
                }
              }
              if (errors.length > 0) {
                errorMessage = errors.join("; ");
              }
            } else if (typeof result === "string") {
              errorMessage = result;
            }
          }

          messageDiv.style.backgroundColor = "#ffebee";
          messageDiv.style.color = "#c62828";
          messageDiv.innerHTML = errorMessage;
          return;
        }

        // Success - tampilkan pesan sukses
        messageDiv.style.backgroundColor = "#e8f5e9";
        messageDiv.style.color = "#2e7d32";
        messageDiv.innerHTML = "✅ User berhasil ditambahkan!";

        // Tunggu 2 detik lalu tutup modal dan refresh data
        setTimeout(() => {
          closeModal();
          loadUsers();

          // Tampilkan notifikasi
          showNotification(
            `User "${username}" berhasil ditambahkan sebagai ${role}`,
            "success"
          );
        }, 2000);
      } catch (error) {
        console.error("Error creating user:", error);
        messageDiv.style.backgroundColor = "#ffebee";
        messageDiv.style.color = "#c62828";
        messageDiv.innerHTML = "Terjadi kesalahan jaringan. Coba lagi.";
      }
    },
    true
  ); // Parameter true untuk modal besar
}

async function editUser(userId) {
  try {
    // Fetch user data
    const response = await fetch(`${API.users}${userId}/`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    const user = await response.json();
    console.log("Editing user:", user);

    // Format form HTML dengan data lengkap
    const formHTML = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Username *</label>
                    <input type="text" id="username" value="${
                      user.username || ""
                    }" required 
                           placeholder="Username"
                           style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Email</label>
                    <input type="email" id="email" value="${user.email || ""}" 
                           placeholder="user@email.com"
                           style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Nama Lengkap</label>
                    <input type="text" id="first_name" value="${
                      user.first_name || ""
                    }" 
                           placeholder="Nama lengkap"
                           style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Role *</label>
                    <select id="role" required 
                            style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
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
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Jenis Kelamin</label>
                    <select id="gender" 
                            style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="">-- Pilih --</option>
                        <option value="L" ${
                          user.gender === "L" ? "selected" : ""
                        }>Laki-laki</option>
                        <option value="P" ${
                          user.gender === "P" ? "selected" : ""
                        }>Perempuan</option>
                    </select>
                </div>
                <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 6px;">
                    <h4 style="margin: 0 0 10px 0; color: #666; font-size: 14px;">⚠️ Ubah Password</h4>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-size: 13px;">Password Baru</label>
                        <input type="password" id="password" 
                               placeholder="Kosongkan jika tidak ingin mengubah"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="margin-top: 10px;">
                        <label style="display: block; margin-bottom: 5px; font-size: 13px;">Konfirmasi Password Baru</label>
                        <input type="password" id="password2" 
                               placeholder="Ketik ulang password baru"
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                </div>
                <div id="formMessage" style="margin-top: 10px;"></div>
            </div>
        `;

    showModal(
      "Edit User",
      formHTML,
      async () => {
        const username = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim();
        const first_name = document.getElementById("first_name").value.trim();
        const role = document.getElementById("role").value;
        const gender = document.getElementById("gender").value;
        const password = document.getElementById("password").value;
        const password2 = document.getElementById("password2").value;

        // Validasi
        const messageDiv = document.getElementById("formMessage");
        messageDiv.innerHTML = "";
        messageDiv.style.padding = "10px";
        messageDiv.style.borderRadius = "4px";

        // Validasi username
        if (!username) {
          messageDiv.style.backgroundColor = "#ffebee";
          messageDiv.style.color = "#c62828";
          messageDiv.innerHTML = "Username harus diisi!";
          return;
        }

        // Validasi role
        if (!role) {
          messageDiv.style.backgroundColor = "#ffebee";
          messageDiv.style.color = "#c62828";
          messageDiv.innerHTML = "Role harus dipilih!";
          return;
        }

        // Validasi password jika diisi
        if (password) {
          if (password.length < 8) {
            messageDiv.style.backgroundColor = "#ffebee";
            messageDiv.style.color = "#c62828";
            messageDiv.innerHTML = "Password minimal 8 karakter!";
            return;
          }

          if (password !== password2) {
            messageDiv.style.backgroundColor = "#ffebee";
            messageDiv.style.color = "#c62828";
            messageDiv.innerHTML =
              "Password dan konfirmasi password tidak sama!";
            return;
          }
        }

        // Siapkan data untuk update
        const userData = {
          username: username,
          email: email || "",
          role: role,
        };

        // Tambahkan field opsional jika ada nilai
        if (first_name) userData.first_name = first_name;
        if (gender) userData.gender = gender;
        if (password) userData.password = password;

        // Jika role berubah menjadi tamu, pastikan ada data tambahan
        if (role === "tamu" && !userData.nama) {
          userData.nama = first_name || username;
          if (!userData.jk && gender) userData.jk = gender;
        }

        console.log("Updating user with data:", userData);

        try {
          // Gunakan PATCH untuk partial update (biasanya lebih aman)
          const response = await fetch(`${API.users}${userId}/`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(userData),
          });

          const result = await response.json();

          if (!response.ok) {
            // Tampilkan error dari server
            let errorMessage = "Gagal mengupdate user";
            if (result) {
              if (typeof result === "object") {
                // Gabungkan semua error messages
                const errors = [];
                for (const [field, messages] of Object.entries(result)) {
                  if (Array.isArray(messages)) {
                    errors.push(`${field}: ${messages.join(", ")}`);
                  } else {
                    errors.push(`${field}: ${messages}`);
                  }
                }
                if (errors.length > 0) {
                  errorMessage = errors.join("; ");
                }
              } else if (typeof result === "string") {
                errorMessage = result;
              } else if (result.detail) {
                errorMessage = result.detail;
              }
            }

            messageDiv.style.backgroundColor = "#ffebee";
            messageDiv.style.color = "#c62828";
            messageDiv.innerHTML = errorMessage;
            return;
          }

          // Success - tampilkan pesan sukses
          messageDiv.style.backgroundColor = "#e8f5e9";
          messageDiv.style.color = "#2e7d32";
          messageDiv.innerHTML = "✅ User berhasil diupdate!";

          // Tunggu 2 detik lalu tutup modal dan refresh data
          setTimeout(() => {
            closeModal();
            loadUsers();

            // Tampilkan notifikasi
            showNotification(
              `User "${username}" berhasil diperbarui`,
              "success"
            );
          }, 2000);
        } catch (error) {
          console.error("Error updating user:", error);
          messageDiv.style.backgroundColor = "#ffebee";
          messageDiv.style.color = "#c62828";
          messageDiv.innerHTML = "Terjadi kesalahan jaringan. Coba lagi.";
        }
      },
      true
    ); // Parameter true untuk modal besar
  } catch (error) {
    console.error("Error loading user data:", error);

    // Tampilkan modal error
    showModal(
      "Error",
      `
            <div style="padding: 20px; text-align: center;">
                <div style="font-size: 48px; color: #f44336; margin-bottom: 15px;">⚠️</div>
                <h3 style="color: #c62828; margin-bottom: 10px;">Gagal Memuat Data User</h3>
                <p style="color: #666;">${error.message}</p>
                <button onclick="closeModal()" 
                        style="background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 6px; margin-top: 20px; cursor: pointer;">
                    Tutup
                </button>
            </div>
        `,
      null,
      false
    );
  }
}

async function deleteUser(userId) {
  showConfirmModal("Apakah Anda yakin ingin menghapus user ini?", async () => {
    try {
      // Gunakan fetch langsung atau deleteAPI helper
      const response = await fetch(`${API.users}${userId}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      alert("User berhasil dihapus!");
      loadUsers();
    } catch (error) {
      alert("Error deleting user: " + error.message);
    }
  });
}
