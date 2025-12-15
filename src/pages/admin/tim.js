import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showModal, showConfirmModal } from "../../utils/modal.js";

export async function timAdminPage() {
  const mainContent = document.getElementById("mainContent");
  if (!document.getElementById('modalContainer')) {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modalContainer';
    document.body.appendChild(modalContainer);
  }
  mainContent.innerHTML = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Manajemen Tim Pengangkut</h2>
                <button id="addTimBtn" style="padding: 8px 16px; background: #28a745; color: white;">+ Tambah Tim</button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <input type="text" id="searchTim" placeholder="Cari tim..." style="padding: 8px; width: 300px;">
            </div>
            
            <div id="timTableContainer">
                <p>Loading data...</p>
            </div>
        </div>
    `;

  document.getElementById("addTimBtn").onclick = () => showAddTimForm();
  document.getElementById("searchTim").oninput = loadTim;

  loadTim();
}

async function loadTim() {
  const search = document.getElementById("searchTim").value;

  try {
    const response = await fetchAPI(API.timPengangkut, {
      headers: getAuthHeaders(),
    });

    const timList = response.data || response;
    const filteredTim = timList.filter((tim) =>
      tim.namaTim.toLowerCase().includes(search.toLowerCase())
    );

    renderTimTable(filteredTim);
  } catch (error) {
    document.getElementById(
      "timTableContainer"
    ).innerHTML = `<p style="color: red;">Error loading tim: ${error.message}</p>`;
  }
}

function renderTimTable(timList) {
  const container = document.getElementById("timTableContainer");

  if (!timList || timList.length === 0) {
    container.innerHTML = `<p>Tidak ada data tim</p>`;
    return;
  }

  const tableHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f2f2f2;">
                    <th style="padding: 10px; border: 1px solid #ddd;">ID</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Nama Tim</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">No WhatsApp</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Jumlah Anggota</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                ${timList
                  .map(
                    (tim) => `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">${
                          tim.idTim || tim.id
                        }</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${
                          tim.namaTim
                        }</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${
                          tim.noWhatsapp
                        }</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${
                          tim.jumlah_anggota || 0
                        }</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">
                            <button onclick="editTim(${
                              tim.idTim || tim.id
                            })" style="padding: 4px 8px; margin-right: 5px; background: #ffc107;">Edit</button>
                            <button onclick="deleteTim(${
                              tim.idTim || tim.id
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

  window.editTim = editTim;
  window.deleteTim = deleteTim;
}

function showAddTimForm() {
  const formHTML = `
        <form id="timForm">
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 5px;">Nama Tim *</label>
                <input type="text" id="namaTim" required style="width: 100%; padding: 8px;">
            </div>
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 5px;">No WhatsApp *</label>
                <input type="text" id="noWhatsapp" required style="width: 100%; padding: 8px;" placeholder="08123456789">
            </div>
        </form>
    `;

  showModal("Tambah Tim Baru", formHTML, async () => {
    const timData = {
      namaTim: document.getElementById("namaTim").value,
      noWhatsapp: document.getElementById("noWhatsapp").value,
    };

    await fetchAPI(API.timPengangkut, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(timData),
    });

    alert("Tim berhasil ditambahkan!");
    loadTim();
  });
}

async function editTim(timId) {
  try {
    const response = await fetchAPI(`${API.timPengangkut}${timId}/`, {
      headers: getAuthHeaders(),
    });

    const tim = response.data || response;

    const formHTML = `
            <form id="editTimForm">
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px;">Nama Tim *</label>
                    <input type="text" id="namaTim" value="${tim.namaTim}" required style="width: 100%; padding: 8px;">
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px;">No WhatsApp *</label>
                    <input type="text" id="noWhatsapp" value="${tim.noWhatsapp}" required style="width: 100%; padding: 8px;">
                </div>
            </form>
        `;

    showModal("Edit Tim", formHTML, async () => {
      const timData = {
        namaTim: document.getElementById("namaTim").value,
        noWhatsapp: document.getElementById("noWhatsapp").value,
      };

      await fetchAPI(`${API.timPengangkut}${timId}/`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(timData),
      });

      alert("Tim berhasil diupdate!");
      loadTim();
    });
  } catch (error) {
    alert("Error loading tim data: " + error.message);
  }
}

async function deleteTim(timId) {
  showConfirmModal("Apakah Anda yakin ingin menghapus tim ini?", async () => {
    try {
      await fetchAPI(`${API.timPengangkut}${timId}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      alert("Tim berhasil dihapus!");
      loadTim();
    } catch (error) {
      alert("Error deleting tim: " + error.message);
    }
  });
}
