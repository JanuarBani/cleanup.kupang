import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showModal, showConfirmModal } from "../../utils/modal.js";

export async function tamuAdminPage() {
  const mainContent = document.getElementById("mainContent");
  if (!document.getElementById('modalContainer')) {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modalContainer';
    document.body.appendChild(modalContainer);
  }
  mainContent.innerHTML = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Manajemen Tamu</h2>
                <button id="tambahTamuBtn" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px;">
                    + Tambah Tamu
                </button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <input type="text" id="searchTamu" placeholder="Cari tamu..." style="padding: 8px; width: 300px;">
                <select id="filterJK" style="padding: 8px; margin-left: 10px;">
                    <option value="">Semua Jenis Kelamin</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                </select>
                <select id="filterUser" style="padding: 8px; margin-left: 10px;">
                    <option value="">Semua Status</option>
                    <option value="withUser">Sudah Punya User</option>
                    <option value="withoutUser">Belum Punya User</option>
                </select>
            </div>
            
            <div id="tamuTableContainer">
                <p>Loading data...</p>
            </div>
        </div>
    `;

  document.getElementById("searchTamu").oninput = loadTamu;
  document.getElementById("filterJK").onchange = loadTamu;
  document.getElementById("filterUser").onchange = loadTamu;
  document.getElementById("tambahTamuBtn").onclick = tambahTamu;

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

    const filteredTamu = tamu.filter((t) => {
      const matchSearch = t.nama.toLowerCase().includes(search.toLowerCase());
      const matchJK = !filterJK || t.jk === filterJK;
      const matchUser =
        !filterUser ||
        (filterUser === "withUser" && t.idUser) ||
        (filterUser === "withoutUser" && !t.idUser);
      return matchSearch && matchJK && matchUser;
    });

    renderTamuTable(filteredTamu);
  } catch (error) {
    document.getElementById(
      "tamuTableContainer"
    ).innerHTML = `<p style="color: red;">Error loading tamu: ${error.message}</p>`;
  }
}

function renderTamuTable(tamuList) {
  const container = document.getElementById("tamuTableContainer");

  if (tamuList.length === 0) {
    container.innerHTML = `<p>Tidak ada data tamu</p>`;
    return;
  }

  const tableHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f2f2f2;">
                    <th style="padding: 10px; border: 1px solid #ddd;">ID</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Nama</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Jenis Kelamin</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">User ID</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                ${tamuList
                  .map(
                    (tamu) => `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">${
                          tamu.idTamu
                        }</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${
                          tamu.nama
                        }</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">
                            ${tamu.jk === "L" ? "Laki-laki" : "Perempuan"}
                        </td>
                        <td style="padding: 10px; border: 1px solid #ddd;">
                            ${
                              tamu.idUser
                                ? tamu.idUser
                                : '<span style="color: #999;">Tidak ada</span>'
                            }
                        </td>
                        <td style="padding: 10px; border: 1px solid #ddd;">
                            <button class="edit-btn" data-id="${
                              tamu.idTamu
                            }" style="padding: 4px 8px; margin-right: 5px; background: #ffc107;">Edit</button>
                            <button class="delete-btn" data-id="${
                              tamu.idTamu
                            }" style="padding: 4px 8px; background: #dc3545; color: white;">Hapus</button>
                        </td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
    `;

  container.innerHTML = tableHTML;

  // Attach event listeners
  attachEventListeners();
}

function attachEventListeners() {
  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const tamuId = this.getAttribute("data-id");
      editTamu(parseInt(tamuId));
    });
  });

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const tamuId = this.getAttribute("data-id");
      deleteTamu(parseInt(tamuId));
    });
  });
}

async function tambahTamu() {
  const formHTML = `
        <form id="tambahTamuForm">
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 5px;">Nama *</label>
                <input type="text" id="nama" required style="width: 100%; padding: 8px;">
            </div>
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 5px;">Jenis Kelamin *</label>
                <select id="jk" required style="width: 100%; padding: 8px;">
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                </select>
            </div>
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 5px;">User ID (Opsional)</label>
                <input type="number" id="idUser" placeholder="Kosongkan jika belum ada user" 
                       style="width: 100%; padding: 8px;">
                <small style="color: #666;">Isi hanya jika tamu sudah memiliki akun user</small>
            </div>
        </form>
    `;

  showModal("Tambah Tamu Baru", formHTML, async () => {
    const idUserInput = document.getElementById("idUser").value;

    const tamuData = {
      nama: document.getElementById("nama").value,
      jk: document.getElementById("jk").value,
    };

    if (idUserInput.trim() !== "") {
      tamuData.idUser = parseInt(idUserInput);
    }

    try {
      await fetchAPI(API.tamu, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(tamuData),
      });

      alert("Tamu berhasil ditambahkan!");
      loadTamu();
    } catch (error) {
      alert("Error menambah tamu: " + error.message);
    }
  });
}

async function editTamu(tamuId) {
  try {
    const tamu = await fetchAPI(`${API.tamu}${tamuId}/`, {
      headers: getAuthHeaders(),
    });

    const formHTML = `
            <form id="editTamuForm">
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px;">Nama *</label>
                    <input type="text" id="nama" value="${
                      tamu.nama
                    }" required style="width: 100%; padding: 8px;">
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px;">Jenis Kelamin *</label>
                    <select id="jk" required style="width: 100%; padding: 8px;">
                        <option value="L" ${
                          tamu.jk === "L" ? "selected" : ""
                        }>Laki-laki</option>
                        <option value="P" ${
                          tamu.jk === "P" ? "selected" : ""
                        }>Perempuan</option>
                    </select>
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px;">User ID (Opsional)</label>
                    <input type="number" id="idUser" value="${
                      tamu.idUser || ""
                    }" 
                           placeholder="Kosongkan jika belum ada user" 
                           style="width: 100%; padding: 8px;">
                    <small style="color: #666;">Isi hanya jika tamu sudah memiliki akun user</small>
                </div>
            </form>
        `;

    showModal("Edit Tamu", formHTML, async () => {
      const idUserInput = document.getElementById("idUser").value;

      const tamuData = {
        nama: document.getElementById("nama").value,
        jk: document.getElementById("jk").value,
      };

      if (idUserInput.trim() !== "") {
        tamuData.idUser = parseInt(idUserInput);
      }

      await fetchAPI(`${API.tamu}${tamuId}/`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(tamuData),
      });

      alert("Tamu berhasil diupdate!");
      loadTamu();
    });
  } catch (error) {
    alert("Error loading tamu data: " + error.message);
  }
}

async function deleteTamu(tamuId) {
  showConfirmModal("Apakah Anda yakin ingin menghapus tamu ini?", async () => {
    try {
      await fetchAPI(`${API.tamu}${tamuId}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      alert("Tamu berhasil dihapus!");
      loadTamu();
    } catch (error) {
      alert("Error deleting tamu: " + error.message);
    }
  });
}
