import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showModal, showConfirmModal } from "../../utils/modal.js";
import {
  loadLeaflet,
  initMap,
  addMarker,
  createCustomIcon,
} from "../../utils/mapConfig.js";

let mapAll = null;
let markersLayer = null;

export async function laporanAdminPage() {
  const mainContent = document.getElementById("mainContent");
  if (!document.getElementById('modalContainer')) {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modalContainer';
    document.body.appendChild(modalContainer);
  }
  mainContent.innerHTML = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Manajemen Laporan Sampah</h2>
            </div>

            <!-- PETA BESAR -->
            <div id="mapAllLaporan" style="
                width: 100%;
                height: 350px;
                border-radius: 10px;
                margin: 20px 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            "></div>
            
            <!-- FILTER DAN PENCARIAN -->
            <div style="margin-bottom: 20px; display: flex; gap: 10px;">
                <input type="text" id="searchLaporan" placeholder="Cari laporan..." style="padding: 8px; width: 250px;">
                <input type="date" id="filterDate" style="padding: 8px;">
                <select id="filterStatus" style="padding: 8px;">
                    <option value="">Semua Status</option>
                    <option value="pending">Pending</option>
                    <option value="proses">Proses</option>
                    <option value="selesai">Selesai</option>
                </select>
                <button id="resetFilter" style="padding: 8px 16px; background: #6c757d; color: white;">Reset Filter</button>
            </div>
            
            <div id="laporanTableContainer">
                <p>Loading data...</p>
            </div>
        </div>
    `;

  document.getElementById("searchLaporan").oninput = loadLaporan;
  document.getElementById("filterDate").onchange = loadLaporan;
  document.getElementById("filterStatus").onchange = loadLaporan;
  document.getElementById("resetFilter").onclick = () => {
    document.getElementById("searchLaporan").value = "";
    document.getElementById("filterDate").value = "";
    document.getElementById("filterStatus").value = "";
    loadLaporan();
  };

  loadLaporan();
}

function renderMapAllLaporan(laporanList) {
  loadLeaflet(() => {
    // jika map sudah ada → hapus dulu biar tidak duplicate map
    if (mapAll) {
      mapAll.remove();
    }

    mapAll = initMap("mapAllLaporan");

    // layer penampung semua marker
    markersLayer = L.featureGroup().addTo(mapAll);

    laporanList.forEach((l) => {
      if (!l.latitude || !l.longitude) return;

      const warna =
        l.status === "selesai"
          ? "#28a745"
          : l.status === "proses"
          ? "#17a2b8"
          : "#ffc107";

      const icon = createCustomIcon(warna);

      const marker = addMarker(
        mapAll,
        l.latitude,
        l.longitude,
        `<b>${l.nama}</b><br>${l.alamat}`,
        { icon }
      );

      markersLayer.addLayer(marker);
    });

    // zoom otomatis menyesuaikan semua titik
    if (laporanList.length > 0) {
      const bounds = markersLayer.getBounds();
      mapAll.fitBounds(bounds, { padding: [40, 40] });
    }
  });
}

async function loadLaporan() {
  const search = document.getElementById("searchLaporan").value;
  const filterDate = document.getElementById("filterDate").value;
  const filterStatus = document.getElementById("filterStatus").value;

  try {
    const laporan = await fetchAPI(API.laporanSampah, {
      headers: getAuthHeaders(),
    });

    const filteredLaporan = laporan.filter((l) => {
      const matchSearch =
        l.nama.toLowerCase().includes(search.toLowerCase()) ||
        l.alamat.toLowerCase().includes(search.toLowerCase()) ||
        l.deskripsi.toLowerCase().includes(search.toLowerCase());
      const matchDate = !filterDate || l.tanggal_lapor === filterDate;
      const matchStatus = !filterStatus || l.status === filterStatus;
      return matchSearch && matchDate && matchStatus;
    });

    renderLaporanTable(filteredLaporan);
    renderMapAllLaporan(filteredLaporan);
  } catch (error) {
    document.getElementById(
      "laporanTableContainer"
    ).innerHTML = `<p style="color: red;">Error loading laporan: ${error.message}</p>`;
  }
}

function renderLaporanTable(laporanList) {
  const container = document.getElementById("laporanTableContainer");

  if (laporanList.length === 0) {
    container.innerHTML = `<p>Tidak ada data laporan</p>`;
    return;
  }

  const tableHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f2f2f2;">
                    <th style="padding: 10px; border: 1px solid #ddd;">ID</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Nama</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Tanggal</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Alamat</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Status</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Foto</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                ${laporanList
                  .map(
                    (l) => `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">${
                          l.idLaporan
                        }</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${
                          l.nama
                        }</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${
                          l.tanggal_lapor
                        }</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${l.alamat.substring(
                          0,
                          30
                        )}...</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">
                            <span style="
                                padding: 4px 8px;
                                border-radius: 4px;
                                background: ${getLaporanStatusColor(l.status)};
                                color: white;
                                font-size: 12px;
                            ">${l.status}</span>
                        </td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                            ${
                              l.foto_bukti_url
                                ? `<a href="${l.foto_bukti_url}" target="_blank" style="color: #007bff; text-decoration: none;">📷 Lihat</a>`
                                : '<span style="color: #888;">-</span>'
                            }
                        </td>
                        <td style="padding: 10px; border: 1px solid #ddd;">
                            <button onclick="viewDetail(${
                              l.idLaporan
                            })" style="padding: 4px 8px; margin-right: 5px; background: #17a2b8; color: white;">Detail</button>
                            <button onclick="editLaporan(${
                              l.idLaporan
                            })" style="padding: 4px 8px; margin-right: 5px; background: #ffc107;">Edit</button>
                            <button onclick="deleteLaporan(${
                              l.idLaporan
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
  window.editLaporan = editLaporan;
  window.deleteLaporan = deleteLaporan;
}

function getLaporanStatusColor(status) {
  const colors = {
    pending: "#ffc107",
    proses: "#17a2b8",
    selesai: "#28a745",
  };
  return colors[status] || "#6c757d";
}

async function viewDetail(laporanId) {
  try {
    const laporan = await fetchAPI(`${API.laporanSampah}${laporanId}/`, {
      headers: getAuthHeaders(),
    });

    const fotoHTML = laporan.foto_bukti_url
      ? `
            <div style="
                background:#fff;
                border-radius:10px;
                padding:12px;
                border:1px solid #eee;
                margin-top:15px;
            ">
                <div style="font-weight:600; margin-bottom:8px;">📸 Foto Bukti</div>
                <img src="${laporan.foto_bukti_url}"
                    style="
                        width:100%;
                        max-height:280px;
                        object-fit:cover;
                        border-radius:8px;
                        border:1px solid #ddd;
                    "
                >
                <div style="margin-top:8px; text-align:right;">
                    <a href="${laporan.foto_bukti_url}" target="_blank"
                        style="font-size:13px; color:#0d6efd; text-decoration:none;">
                        🔗 Lihat resolusi penuh
                    </a>
                </div>
            </div>
        `
      : `
            <div style="
                background:#fff3cd;
                color:#856404;
                padding:10px 12px;
                border-radius:8px;
                border:1px solid #ffeeba;
                margin-top:15px;
                font-size:13px;
            ">
                ⚠️ Tidak ada foto bukti
            </div>
        `;

    const statusColor = getLaporanStatusColor(laporan.status);

    const detailHTML = `
            <div>

                <h2 style="
                    margin:0 0 12px 0;
                    font-size:20px;
                    font-weight:700;
                    color:#333;
                    text-align:center;
                ">
                    Detail Laporan Sampah
                </h2>

                <!-- MAP -->
                <div style="margin: 15px 0;">
                    <div id="mapDetailLaporan" style="
                        width: 100%;
                        height: 260px;
                        border-radius: 12px;
                        background:#e0e0e0;
                        box-shadow:0 2px 8px rgba(0,0,0,0.1);
                    "></div>
                </div>

                <!-- CARD DETAIL -->
                <div style="
                    background:#ffffff;
                    padding:18px;
                    border-radius:12px;
                    border:1px solid #eee;
                    box-shadow:0 2px 6px rgba(0,0,0,0.05);
                ">
                    <p><strong>ID Laporan:</strong> ${laporan.idLaporan}</p>

                    <div style="margin:8px 0;">
                        <strong>Nama Pelapor:</strong><br>
                        <span style="
                            background:#f1f3f5;
                            padding:6px 10px;
                            border-radius:6px;
                            display:inline-block;
                            margin-top:4px;
                            color:#333;
                        ">
                            👤 ${laporan.nama}
                        </span>
                    </div>

                    <p><strong>Akun User:</strong> ${
                      laporan.nama_user || "Tidak diketahui"
                    }</p>
                    <p><strong>Tanggal Lapor:</strong> ${
                      laporan.tanggal_lapor
                    }</p>

                    <div style="margin:10px 0;">
                        <strong>Alamat Lengkap:</strong><br>
                        <span style="color:#444;">${laporan.alamat}</span>
                    </div>

                    <p><strong>Koordinat:</strong> 
                        <span style="color:#007bff;">${laporan.latitude}, ${
      laporan.longitude
    }</span>
                    </p>

                    <div style="margin:10px 0;">
                        <strong>Deskripsi:</strong>
                        <div style="
                            padding:10px;
                            background:#f8f9fa;
                            border-left:3px solid #0d6efd;
                            border-radius:6px;
                            margin-top:4px;
                        ">
                            ${laporan.deskripsi}
                        </div>
                    </div>

                    <p>
                        <strong>Status:</strong> 
                        <span style="
                            padding:4px 10px;
                            border-radius:10px;
                            font-size:12px;
                            font-weight:600;
                            color:white;
                            background:${statusColor};
                        ">
                            ${laporan.status.toUpperCase()}
                        </span>
                    </p>

                    ${fotoHTML}
                </div>
            </div>
        `;

    showModal("Detail Laporan", detailHTML);

    // delay untuk pastikan modal sudah muncul sebelum load peta
    setTimeout(() => {
      renderMapDetail(laporan);
    }, 300);
  } catch (error) {
    alert("Error loading detail: " + error.message);
  }
}

function renderMapDetail(laporan) {
  if (!laporan.latitude || !laporan.longitude) return;

  loadLeaflet(() => {
    const map = initMap(
      "mapDetailLaporan",
      laporan.latitude,
      laporan.longitude,
      16
    );

    const warna =
      laporan.status === "selesai"
        ? "#28a745"
        : laporan.status === "proses"
        ? "#17a2b8"
        : "#ffc107";

    const icon = createCustomIcon(warna);

    addMarker(
      map,
      laporan.latitude,
      laporan.longitude,
      `<b>${laporan.nama}</b><br>${laporan.alamat}`,
      { icon }
    );
  });
}

async function editLaporan(laporanId) {
  try {
    const laporan = await fetchAPI(`${API.laporanSampah}${laporanId}/`, {
      headers: getAuthHeaders(),
    });

    const formHTML = `
            <form id="editLaporanForm">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nama Pelapor *</label>
                    <input type="text" id="nama" value="${
                      laporan.nama
                    }" required 
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Alamat Lengkap *</label>
                    <textarea id="alamat" required 
                              style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; height: 80px;">${
                                laporan.alamat
                              }</textarea>
                </div>
                
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Latitude *</label>
                        <input type="number" step="any" id="latitude" value="${
                          laporan.latitude
                        }" required 
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="flex: 1;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Longitude *</label>
                        <input type="number" step="any" id="longitude" value="${
                          laporan.longitude
                        }" required 
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Deskripsi Masalah *</label>
                    <textarea id="deskripsi" required 
                              style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; height: 100px;">${
                                laporan.deskripsi
                              }</textarea>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Status Laporan *</label>
                    <select id="status" required 
                            style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="pending" ${
                          laporan.status === "pending" ? "selected" : ""
                        }>⏳ Pending</option>
                        <option value="proses" ${
                          laporan.status === "proses" ? "selected" : ""
                        }>🔄 Proses</option>
                        <option value="selesai" ${
                          laporan.status === "selesai" ? "selected" : ""
                        }>✅ Selesai</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Foto Bukti Saat Ini:</label>
                    ${
                      laporan.foto_bukti_url
                        ? `<div style="margin: 10px 0;">
                            <img src="${laporan.foto_bukti_url}" 
                                 alt="Foto Saat Ini"
                                 style="max-width: 200px; border: 1px solid #ddd; border-radius: 4px;"><br>
                            <a href="${laporan.foto_bukti_url}" target="_blank" 
                               style="color: #007bff; text-decoration: none; font-size: 14px;">🔗 Buka di tab baru</a>
                        </div>`
                        : '<p style="color: #888;">Tidak ada foto bukti</p>'
                    }
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Ganti Foto (Opsional):</label>
                    <input type="file" id="foto_bukti" accept="image/*" 
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    <small style="color: #666;">Biarkan kosong jika tidak ingin mengganti foto</small>
                    
                    <div id="previewContainer" style="display: none; margin-top: 10px;">
                        <p style="margin-bottom: 5px;">Preview:</p>
                        <img id="fotoPreview" 
                             style="max-width: 200px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                </div>
            </form>
        `;

    showModal("Edit Laporan Sampah", formHTML, async () => {
      const formData = new FormData();

      // Tambahkan data ke FormData
      formData.append("nama", document.getElementById("nama").value);
      formData.append("alamat", document.getElementById("alamat").value);
      formData.append("latitude", document.getElementById("latitude").value);
      formData.append("longitude", document.getElementById("longitude").value);
      formData.append("deskripsi", document.getElementById("deskripsi").value);
      formData.append("status", document.getElementById("status").value);
      formData.append("tanggal_lapor", laporan.tanggal_lapor); // Tetap sama
      formData.append("idUser", laporan.idUser); // Tetap sama

      // Handle file upload jika ada
      const fileInput = document.getElementById("foto_bukti");
      if (fileInput.files.length > 0) {
        formData.append("foto_bukti", fileInput.files[0]);
      }

      try {
        const token = localStorage.getItem("access");
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API.laporanSampah}${laporanId}/`, {
          method: "PATCH",
          headers: headers,
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP ${response.status}`);
        }

        alert("Laporan berhasil diperbarui!");
        loadLaporan();
      } catch (error) {
        alert("Error updating laporan: " + error.message);
      }
    });

    // Event listener untuk preview foto
    setTimeout(() => {
      const fileInput = document.getElementById("foto_bukti");
      const previewContainer = document.getElementById("previewContainer");
      const fotoPreview = document.getElementById("fotoPreview");

      fileInput.addEventListener("change", function () {
        if (this.files && this.files[0]) {
          const reader = new FileReader();

          reader.onload = function (e) {
            fotoPreview.src = e.target.result;
            previewContainer.style.display = "block";
          };

          reader.readAsDataURL(this.files[0]);
        } else {
          previewContainer.style.display = "none";
        }
      });
    }, 50);
  } catch (error) {
    alert("Error loading laporan data: " + error.message);
  }
}

async function deleteLaporan(laporanId) {
  showConfirmModal(
    "Apakah Anda yakin ingin menghapus laporan ini?",
    async () => {
      try {
        const response = await fetch(`${API.laporanSampah}${laporanId}/`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP ${response.status}`);
        }

        alert("Laporan berhasil dihapus!");
        loadLaporan();
      } catch (error) {
        alert("Error deleting laporan: " + error.message);
      }
    }
  );
}
