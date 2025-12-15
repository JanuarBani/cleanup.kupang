import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showModal, showConfirmModal } from "../../utils/modal.js";

export async function pembayaranAdminPage() {
  const mainContent = document.getElementById("mainContent");
  if (!document.getElementById('modalContainer')) {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modalContainer';
    document.body.appendChild(modalContainer);
  }
  mainContent.innerHTML = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Manajemen Pembayaran</h2>
                <button id="addPembayaranBtn" style="padding: 8px 16px; background: #28a745; color: white;">+ Tambah Pembayaran</button>
            </div>
            
            <div style="margin-bottom: 20px; display: flex; gap: 10px;">
                <input type="date" id="filterDate" style="padding: 8px;">
                <select id="filterStatus" style="padding: 8px;">
                    <option value="">Semua Status</option>
                    <option value="pending">Pending</option>
                    <option value="lunas">Lunas</option>
                    <option value="gagal">Gagal</option>
                </select>
                <select id="filterMetode" style="padding: 8px;">
                    <option value="">Semua Metode</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Tunai">Tunai</option>
                    <option value="QRIS">QRIS</option>
                </select>
                <button id="resetFilter" style="padding: 8px 16px; background: #6c757d; color: white;">Reset Filter</button>
            </div>
            
            <div id="pembayaranTableContainer">
                <p>Loading data...</p>
            </div>
        </div>
    `;

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

    renderPembayaranTable(filteredPembayaran);
  } catch (error) {
    document.getElementById(
      "pembayaranTableContainer"
    ).innerHTML = `<p style="color: red;">Error loading pembayaran: ${error.message}</p>`;
  }
}

function renderPembayaranTable(pembayaranList) {
  const container = document.getElementById("pembayaranTableContainer");

  if (pembayaranList.length === 0) {
    container.innerHTML = `<p>Tidak ada data pembayaran</p>`;
    return;
  }

  const tableHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f2f2f2;">
                    <th style="padding: 10px; border: 1px solid #ddd;">ID</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Anggota</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Tanggal</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Jumlah</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Metode</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Status</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                ${pembayaranList
                  .map(
                    (p) => `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">${
                          p.idPembayaran
                        }</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${
                          p.nama_anggota || "N/A"
                        }</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${
                          p.tanggalBayar
                        }</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">Rp ${p.jumlahBayar.toLocaleString()}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${
                          p.metodeBayar
                        }</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">
                            <span style="
                                padding: 4px 8px;
                                border-radius: 4px;
                                background: ${getStatusColor(p.statusBayar)};
                                color: white;
                                font-size: 12px;
                            ">${p.statusBayar}</span>
                        </td>
                        <td style="padding: 10px; border: 1px solid #ddd;">
                            <button onclick="viewDetail(${
                              p.idPembayaran
                            })" style="padding: 4px 8px; margin-right: 5px; background: #17a2b8; color: white;">Detail</button>
                            <button onclick="editPembayaran(${
                              p.idPembayaran
                            })" style="padding: 4px 8px; margin-right: 5px; background: #ffc107;">Edit</button>
                            <button onclick="deletePembayaran(${
                              p.idPembayaran
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

  window.viewDetail = viewDetail;
  window.editPembayaran = editPembayaran;
  window.deletePembayaran = deletePembayaran;
}

function getStatusColor(status) {
  const colors = {
    lunas: "#28a745",
    pending: "#ffc107",
    gagal: "#dc3545",
  };
  return colors[status] || "#6c757d";
}

async function showAddPembayaranForm() {
  try {
    const anggota = await fetchAPI(API.anggota, { headers: getAuthHeaders() });

    const anggotaOptions = anggota
      .map((a) => `<option value="${a.idAnggota}">${a.nama}</option>`)
      .join("");

    const today = new Date().toISOString().split("T")[0];

    const formHTML = `
            <form id="pembayaranForm">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Anggota *</label>
                    <select id="idAnggota" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">Pilih Anggota</option>
                        ${anggotaOptions}
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Tanggal Bayar *</label>
                    <input type="date" id="tanggalBayar" value="${today}" required 
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Jumlah Bayar (Rp) *</label>
                    <input type="number" id="jumlahBayar" required 
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;" 
                           placeholder="50000" min="1">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Metode Bayar *</label>
                    <select id="metodeBayar" required 
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="Transfer">Transfer</option>
                        <option value="Tunai">Tunai</option>
                        <option value="QRIS">QRIS</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Status Bayar *</label>
                    <select id="statusBayar" required 
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="pending">Pending</option>
                        <option value="lunas">Lunas</option>
                        <option value="gagal">Gagal</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Bukti Bayar (Opsional)</label>
                    <input type="file" id="buktiBayar" accept="image/*" 
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    <small style="color: #666;">Format: JPG, PNG, GIF (max 5MB)</small>
                </div>
            </form>
        `;

    showModal("Tambah Pembayaran", formHTML, async () => {
      const formData = new FormData();

      // Tambahkan data ke FormData
      formData.append("idAnggota", document.getElementById("idAnggota").value);
      formData.append(
        "tanggalBayar",
        document.getElementById("tanggalBayar").value
      );
      formData.append(
        "jumlahBayar",
        document.getElementById("jumlahBayar").value
      );
      formData.append(
        "metodeBayar",
        document.getElementById("metodeBayar").value
      );
      formData.append(
        "statusBayar",
        document.getElementById("statusBayar").value
      );

      // Handle file upload
      const fileInput = document.getElementById("buktiBayar");
      if (fileInput.files.length > 0) {
        formData.append("buktiBayar", fileInput.files[0]);
      }

      try {
        const token = localStorage.getItem("access");
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        // JANGAN set Content-Type untuk FormData

        const response = await fetch(API.pembayaran, {
          method: "POST",
          headers: headers,
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP ${response.status}`);
        }

        alert("Pembayaran berhasil ditambahkan!");
        loadPembayaran();
      } catch (error) {
        alert("Error adding pembayaran: " + error.message);
      }
    });
  } catch (error) {
    alert("Error loading anggota: " + error.message);
  }
}

async function viewDetail(pembayaranId) {
  try {
    const pembayaran = await fetchAPI(`${API.pembayaran}${pembayaranId}/`, {
      headers: getAuthHeaders(),
    });

    const buktiHTML = pembayaran.bukti_bayar_url
      ? `<div style="margin-top: 10px;">
                <strong>Bukti Bayar:</strong><br>
                <img src="${pembayaran.bukti_bayar_url}" 
                     alt="Bukti Pembayaran"
                     style="max-width: 100%; max-height: 300px; margin-top: 10px; border: 1px solid #ddd; border-radius: 4px;">
            </div>`
      : "<p>Tidak ada bukti bayar</p>";

    const detailHTML = `
            <div>
                <h3>Detail Pembayaran</h3>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                    <p><strong>ID:</strong> ${pembayaran.idPembayaran}</p>
                    <p><strong>Anggota:</strong> ${
                      pembayaran.nama_anggota || "N/A"
                    }</p>
                    <p><strong>Tanggal Bayar:</strong> ${
                      pembayaran.tanggalBayar
                    }</p>
                    <p><strong>Jumlah Bayar:</strong> Rp ${pembayaran.jumlahBayar.toLocaleString()}</p>
                    <p><strong>Metode Bayar:</strong> ${
                      pembayaran.metodeBayar
                    }</p>
                    <p><strong>Status:</strong> ${pembayaran.statusBayar}</p>
                    ${buktiHTML}
                </div>
            </div>
        `;

    showModal("Detail Pembayaran", detailHTML);
  } catch (error) {
    alert("Error loading detail: " + error.message);
  }
}

async function editPembayaran(pembayaranId) {
  try {
    const pembayaran = await fetchAPI(`${API.pembayaran}${pembayaranId}/`, {
      headers: getAuthHeaders(),
    });

    const formHTML = `
            <form id="editPembayaranForm">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Tanggal Bayar *</label>
                    <input type="date" id="tanggalBayar" value="${
                      pembayaran.tanggalBayar
                    }" required 
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Jumlah Bayar (Rp) *</label>
                    <input type="number" id="jumlahBayar" value="${
                      pembayaran.jumlahBayar
                    }" required 
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Metode Bayar *</label>
                    <select id="metodeBayar" required 
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="Transfer" ${
                          pembayaran.metodeBayar === "Transfer"
                            ? "selected"
                            : ""
                        }>Transfer</option>
                        <option value="Tunai" ${
                          pembayaran.metodeBayar === "Tunai" ? "selected" : ""
                        }>Tunai</option>
                        <option value="QRIS" ${
                          pembayaran.metodeBayar === "QRIS" ? "selected" : ""
                        }>QRIS</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Status Bayar *</label>
                    <select id="statusBayar" required 
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="pending" ${
                          pembayaran.statusBayar === "pending" ? "selected" : ""
                        }>Pending</option>
                        <option value="lunas" ${
                          pembayaran.statusBayar === "lunas" ? "selected" : ""
                        }>Lunas</option>
                        <option value="gagal" ${
                          pembayaran.statusBayar === "gagal" ? "selected" : ""
                        }>Gagal</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Bukti Bayar Saat Ini:</label>
                    ${
                      pembayaran.bukti_bayar_url
                        ? `<img src="${pembayaran.bukti_bayar_url}" 
                             alt="Bukti Saat Ini"
                             style="max-width: 200px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px;"><br>
                         <a href="${pembayaran.bukti_bayar_url}" target="_blank" style="color: #007bff;">Buka di tab baru</a>`
                        : "<p>Tidak ada bukti bayar</p>"
                    }
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Ubah Bukti Bayar (Opsional):</label>
                    <input type="file" id="buktiBayar" accept="image/*" 
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    <small style="color: #666;">Biarkan kosong jika tidak ingin mengubah</small>
                </div>
            </form>
        `;

    showModal("Edit Pembayaran", formHTML, async () => {
      const formData = new FormData();

      // Tambahkan data ke FormData
      formData.append(
        "tanggalBayar",
        document.getElementById("tanggalBayar").value
      );
      formData.append(
        "jumlahBayar",
        document.getElementById("jumlahBayar").value
      );
      formData.append(
        "metodeBayar",
        document.getElementById("metodeBayar").value
      );
      formData.append(
        "statusBayar",
        document.getElementById("statusBayar").value
      );

      // Handle file upload jika ada
      const fileInput = document.getElementById("buktiBayar");
      if (fileInput.files.length > 0) {
        formData.append("buktiBayar", fileInput.files[0]);
      }

      try {
        const token = localStorage.getItem("access");
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API.pembayaran}${pembayaranId}/`, {
          method: "PATCH",
          headers: headers,
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP ${response.status}`);
        }

        alert("Pembayaran berhasil diupdate!");
        loadPembayaran();
      } catch (error) {
        alert("Error updating pembayaran: " + error.message);
      }
    });
  } catch (error) {
    alert("Error loading pembayaran data: " + error.message);
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

        alert("Pembayaran berhasil dihapus!");
        loadPembayaran();
      } catch (error) {
        alert("Error deleting pembayaran: " + error.message);
      }
    }
  );
}
