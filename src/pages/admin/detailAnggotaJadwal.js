// admin/detailAnggotaJadwal.js
import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showModal, showConfirmModal } from "../../utils/modal.js";

export async function detailAnggotaJadwalAdminPage() {
  const mainContent = document.getElementById("mainContent");
  mainContent.innerHTML = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Detail Jadwal Anggota</h2>
                <button id="addDetailBtn" style="padding: 8px 16px; background: #28a745; color: white;">+ Tambah Detail</button>
            </div>
            
            <div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                <input type="text" id="searchDetail" placeholder="Cari anggota/jadwal..." style="padding: 8px; width: 250px;">
                <select id="filterStatus" style="padding: 8px;">
                    <option value="">Semua Status</option>
                    <option value="terjadwal">Terjadwal</option>
                    <option value="dalam_proses">Dalam Proses</option>
                    <option value="selesai">Selesai</option>
                    <option value="dibatalkan">Dibatalkan</option>
                </select>
                <select id="filterAnggota" style="padding: 8px; width: 200px;">
                    <option value="">Semua Anggota</option>
                </select>
                <select id="filterJadwal" style="padding: 8px; width: 200px;">
                    <option value="">Semua Jadwal</option>
                </select>
            </div>
            
            <div id="detailTableContainer">
                <p>Loading data...</p>
            </div>
        </div>
    `;

  document.getElementById("addDetailBtn").onclick = () => showAddDetailForm();
  document.getElementById("searchDetail").oninput = loadDetailAnggotaJadwal;
  document.getElementById("filterStatus").onchange = loadDetailAnggotaJadwal;

  // Load dropdown data
  loadDropdownData();

  // Load data
  loadDetailAnggotaJadwal();
}

async function loadDropdownData() {
  try {
    // Load anggota
    const anggota = await fetchAPI(API.anggota, { headers: getAuthHeaders() });
    const anggotaSelect = document.getElementById("filterAnggota");

    // Clear existing options except first one
    while (anggotaSelect.options.length > 1) {
      anggotaSelect.remove(1);
    }

    anggota.forEach((a) => {
      const option = document.createElement("option");
      option.value = a.idAnggota; // idAnggota adalah number
      option.textContent = `${a.idAnggota} - ${a.nama}`;
      anggotaSelect.appendChild(option);
    });

    // Load jadwal
    const jadwal = await fetchAPI(API.jadwal, { headers: getAuthHeaders() });
    const jadwalSelect = document.getElementById("filterJadwal");

    // Clear existing options except first one
    while (jadwalSelect.options.length > 1) {
      jadwalSelect.remove(1);
    }

    jadwal.forEach((j) => {
      const option = document.createElement("option");
      const id = j.idJadwal; // idJadwal adalah number
      const tanggal = j.tanggalJadwal || "N/A";
      const namaTim = j.nama_tim || "N/A";

      option.value = id;
      option.textContent = `${id} - ${tanggal} (${namaTim})`;
      jadwalSelect.appendChild(option);
    });

    // Add event listeners setelah data dimuat
    document.getElementById("filterAnggota").onchange = loadDetailAnggotaJadwal;
    document.getElementById("filterJadwal").onchange = loadDetailAnggotaJadwal;
  } catch (error) {
    console.error("Error loading dropdown data:", error);
  }
}

async function loadDetailAnggotaJadwal() {
  const search = document.getElementById("searchDetail")?.value || "";
  const filterStatus = document.getElementById("filterStatus")?.value || "";
  const filterAnggota = document.getElementById("filterAnggota")?.value || "";
  const filterJadwal = document.getElementById("filterJadwal")?.value || "";

  try {
    // Load data detail
    const details = await fetchAPI(API.detailAnggotaJadwal, {
      headers: getAuthHeaders(),
    });

    // Filter data
    const filteredDetails = details.filter((detail) => {
      // Gunakan data dari serializer
      const namaAnggota = detail.nama_anggota || "";
      const tanggalJadwal = detail.tanggal_jadwal || "";
      const namaTim = detail.nama_tim || "";
      const status = detail.status_pengangkutan || "";

      // Catatan: alamat tidak tersedia di serializer,
      // jadi kita tidak bisa search berdasarkan alamat

      // Search
      const matchSearch =
        !search ||
        namaAnggota.toLowerCase().includes(search.toLowerCase()) ||
        tanggalJadwal.includes(search) ||
        namaTim.toLowerCase().includes(search.toLowerCase()) ||
        status.toLowerCase().includes(search.toLowerCase());

      // Filter status
      const matchStatus = !filterStatus || status === filterStatus;

      // Filter anggota (gunakan idAnggota yang berupa number)
      const matchAnggota = !filterAnggota || detail.idAnggota == filterAnggota;

      // Filter jadwal (gunakan idJadwal yang berupa number)
      const matchJadwal = !filterJadwal || detail.idJadwal == filterJadwal;

      return matchSearch && matchStatus && matchAnggota && matchJadwal;
    });

    renderDetailTable(filteredDetails);
  } catch (error) {
    document.getElementById(
      "detailTableContainer"
    ).innerHTML = `<p style="color: red;">Error loading data: ${error.message}</p>`;
  }
}

function renderDetailTable(detailList) {
  const container = document.getElementById("detailTableContainer");

  if (!detailList || detailList.length === 0) {
    container.innerHTML = `<p>Tidak ada data detail jadwal anggota</p>`;
    return;
  }

  const tableHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f2f2f2;">
                    <th style="padding: 10px; border: 1px solid #ddd;">ID</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Anggota</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Jadwal</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Status</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Catatan</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Dibuat</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                ${detailList
                  .map((detail) => {
                    const detailId = detail.id || "N/A";
                    const namaAnggota =
                      detail.nama_anggota || `Anggota ID: ${detail.idAnggota}`;
                    const tanggalJadwal =
                      detail.tanggal_jadwal || `Jadwal ID: ${detail.idJadwal}`;
                    const namaTim = detail.nama_tim || "N/A";

                    const catatan = detail.catatan || "";
                    const catatanDisplay = catatan
                      ? catatan.substring(0, 50) +
                        (catatan.length > 50 ? "..." : "")
                      : "-";

                    const createdAt = detail.created_at
                      ? new Date(detail.created_at).toLocaleDateString("id-ID")
                      : "-";

                    return `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">${detailId}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">
                            <div>
                                <strong>${namaAnggota}</strong><br>
                                <small style="color: #666;">ID: ${
                                  detail.idAnggota
                                }</small>
                            </div>
                        </td>
                        <td style="padding: 10px; border: 1px solid #ddd;">
                            <div>
                                <strong>${tanggalJadwal}</strong><br>
                                <small style="color: #666;">Tim: ${namaTim}</small><br>
                                <small style="color: #999;">ID Jadwal: ${
                                  detail.idJadwal
                                }</small>
                            </div>
                        </td>
                        <td style="padding: 10px; border: 1px solid #ddd;">
                            ${getStatusBadge(detail.status_pengangkutan)}
                        </td>
                        <td style="padding: 10px; border: 1px solid #ddd; max-width: 200px;">
                            ${catatanDisplay}
                        </td>
                        <td style="padding: 10px; border: 1px solid #ddd; font-size: 12px;">
                            ${createdAt}
                        </td>
                        <td style="padding: 10px; border: 1px solid #ddd;">
                            <button onclick="viewDetailJadwal(${detailId})" style="padding: 4px 8px; margin-right: 5px; background: #17a2b8; color: white;">Detail</button>
                            <button onclick="editDetailJadwal(${detailId})" style="padding: 4px 8px; margin-right: 5px; background: #ffc107;">Edit</button>
                            <button onclick="deleteDetailJadwal(${detailId})" style="padding: 4px 8px; background: #dc3545; color: white;">Hapus</button>
                        </td>
                    </tr>
                    `;
                  })
                  .join("")}
            </tbody>
        </table>
    `;

  container.innerHTML = tableHTML;

  // Attach functions to window
  window.viewDetailJadwal = viewDetailJadwal;
  window.editDetailJadwal = editDetailJadwal;
  window.deleteDetailJadwal = deleteDetailJadwal;
}

function getStatusBadge(status) {
  const statusConfig = {
    terjadwal: { color: "#17a2b8", label: "Terjadwal" },
    dalam_proses: { color: "#ffc107", label: "Dalam Proses" },
    selesai: { color: "#28a745", label: "Selesai" },
    dibatalkan: { color: "#dc3545", label: "Dibatalkan" },
  };

  const config = statusConfig[status] || { color: "#6c757d", label: status };

  return `
        <span style="
            padding: 4px 10px;
            border-radius: 20px;
            background: ${config.color};
            color: white;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
        ">
            ${config.label}
        </span>
    `;
}

function showAddDetailForm() {
  // Load data untuk dropdown
  Promise.all([
    fetchAPI(API.anggota, { headers: getAuthHeaders() }),
    fetchAPI(API.jadwal, { headers: getAuthHeaders() }),
  ])
    .then(([anggota, jadwal]) => {
      console.log("Data jadwal untuk dropdown:", jadwal); // Debug

      const anggotaOptions = anggota
        .map(
          (a) =>
            `<option value="${a.idAnggota}">${a.idAnggota} - ${
              a.nama
            } (${a.alamat.substring(0, 20)}...)</option>`
        )
        .join("");

      // Buat grid untuk jadwal
      const jadwalGrid = createMultiSelectJadwalGrid(jadwal);

      const formHTML = `
            <form id="detailForm">
                <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <label style="display: block; margin-bottom: 5px;">Anggota *</label>
                        <select id="idAnggota" required style="width: 100%; padding: 8px;">
                            <option value="">Pilih Anggota</option>
                            ${anggotaOptions}
                        </select>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <label style="display: block; font-weight: bold;">Pilih Jadwal (Maksimal 4) *</label>
                        <div style="font-size: 14px; color: #666;">
                            <span id="selectedCount">0</span>/4 jadwal terpilih
                        </div>
                    </div>
                    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; max-height: 300px; overflow-y: auto;">
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;" id="jadwalGrid">
                            ${jadwalGrid}
                        </div>
                    </div>
                    <input type="hidden" id="selectedJadwalIds">
                    <div id="selectedJadwalInfo" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px; min-height: 40px;">
                        <strong>Jadwal terpilih:</strong> 
                        <div id="selectedJadwalList" style="margin-top: 5px; font-size: 14px;"></div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <label style="display: block; margin-bottom: 5px;">Status Pengangkutan *</label>
                        <select id="status_pengangkutan" required style="width: 100%; padding: 8px;">
                            <option value="terjadwal">Terjadwal</option>
                            <option value="dalam_proses">Dalam Proses</option>
                            <option value="selesai">Selesai</option>
                            <option value="dibatalkan">Dibatalkan</option>
                        </select>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Catatan</label>
                    <textarea id="catatan" style="width: 100%; padding: 8px; height: 100px;" 
                              placeholder="Catatan tambahan..."></textarea>
                </div>
            </form>
        `;

      showModal("Tambah Detail Jadwal Anggota", formHTML, async () => {
        const selectedJadwalIds =
          document.getElementById("selectedJadwalIds").value;
        if (!selectedJadwalIds) {
          alert("Silakan pilih minimal 1 jadwal!");
          return;
        }

        const jadwalIds = selectedJadwalIds
          .split(",")
          .filter((id) => id !== "");
        if (jadwalIds.length === 0) {
          alert("Silakan pilih minimal 1 jadwal!");
          return;
        }

        const idAnggota = parseInt(document.getElementById("idAnggota").value);
        const status_pengangkutan = document.getElementById(
          "status_pengangkutan"
        ).value;
        const catatan = document.getElementById("catatan").value || "";

        let successCount = 0;
        let errorCount = 0;
        let errorMessages = [];

        // Kirim satu per satu dengan Promise.all
        try {
          const promises = jadwalIds.map((jadwalId) => {
            const detailData = {
              idAnggota: idAnggota,
              idJadwal: parseInt(jadwalId),
              status_pengangkutan: status_pengangkutan,
              catatan: catatan,
            };

            return fetchAPI(API.detailAnggotaJadwal, {
              method: "POST",
              headers: getAuthHeaders(),
              body: JSON.stringify(detailData),
            })
              .then(() => {
                successCount++;
              })
              .catch((error) => {
                errorCount++;
                errorMessages.push(`Jadwal ID ${jadwalId}: ${error.message}`);
              });
          });

          await Promise.allSettled(promises);

          if (successCount > 0) {
            alert(
              `Berhasil menambahkan ${successCount} dari ${jadwalIds.length} jadwal!`
            );
            loadDetailAnggotaJadwal();
          }

          if (errorCount > 0) {
            setTimeout(() => {
              alert(
                `Gagal menambahkan ${errorCount} jadwal:\n${errorMessages.join(
                  "\n"
                )}`
              );
            }, 500);
          }
        } catch (error) {
          alert("Error: " + error.message);
        }
      });

      // Setup event listeners untuk grid jadwal multiple selection
      setupMultiSelectJadwalGridListeners();
    })
    .catch((error) => {
      alert("Error loading data: " + error.message);
    });
}

function createMultiSelectJadwalGrid(jadwalList) {
  // Group jadwal by bulan untuk organisasi yang lebih baik
  const groupedByMonth = {};

  jadwalList.forEach((j) => {
    const id = j.idJadwal || j.id;
    const tanggal = j.tanggalJadwal || j.tanggal;
    const namaTim = j.nama_tim || "Tim";

    if (tanggal) {
      const date = new Date(tanggal);
      const monthYear = date.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });

      if (!groupedByMonth[monthYear]) {
        groupedByMonth[monthYear] = [];
      }

      groupedByMonth[monthYear].push({
        id,
        tanggal,
        namaTim,
        dateObj: date,
        formattedDate: date.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
      });
    }
  });

  let gridHTML = "";

  // Urutkan bulan
  const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => {
    return new Date(a) - new Date(b);
  });

  sortedMonths.forEach((monthYear) => {
    const jadwals = groupedByMonth[monthYear];

    // Urutkan jadwal dalam bulan berdasarkan tanggal
    jadwals.sort((a, b) => a.dateObj - b.dateObj);

    gridHTML += `
            <div style="grid-column: 1 / -1; margin-bottom: 10px;">
                <h4 style="margin: 0; padding-bottom: 5px; border-bottom: 2px solid #007bff; color: #333;">
                    ${monthYear}
                </h4>
            </div>
        `;

    jadwals.forEach((j) => {
      gridHTML += `
                <div class="jadwal-card" data-jadwal-id="${j.id}" 
                     style="border: 1px solid #ddd; border-radius: 8px; padding: 10px; 
                            cursor: pointer; transition: all 0.2s; text-align: center;
                            background: white; position: relative;">
                    <div style="font-weight: bold; color: #007bff; margin-bottom: 5px;">
                        ${j.formattedDate}
                    </div>
                    <div style="font-size: 12px; color: #666;">
                        ${j.namaTim}
                    </div>
                    <div class="checkmark" style="position: absolute; top: 5px; right: 5px; 
                          width: 20px; height: 20px; border-radius: 50%; 
                          background: #28a745; color: white; font-size: 12px;
                          display: none; align-items: center; justify-content: center;">
                        ✓
                    </div>
                </div>
            `;
    });
  });

  return gridHTML;
}

function setupMultiSelectJadwalGridListeners() {
  const jadwalCards = document.querySelectorAll(".jadwal-card");
  const selectedJadwalIds = [];
  const selectedJadwalMap = new Map(); // Untuk menyimpan info jadwal yang dipilih

  jadwalCards.forEach((card) => {
    card.addEventListener("click", function () {
      const jadwalId = this.getAttribute("data-jadwal-id");
      const tanggal = this.querySelector("div:first-child").textContent;
      const namaTim = this.querySelector("div:nth-child(2)").textContent;
      const checkmark = this.querySelector(".checkmark");

      if (selectedJadwalIds.includes(jadwalId)) {
        // Unselect
        const index = selectedJadwalIds.indexOf(jadwalId);
        selectedJadwalIds.splice(index, 1);
        selectedJadwalMap.delete(jadwalId);

        this.style.background = "white";
        this.style.borderColor = "#ddd";
        this.style.boxShadow = "none";
        checkmark.style.display = "none";
      } else {
        // Cek apakah sudah mencapai batas maksimal (4)
        if (selectedJadwalIds.length >= 4) {
          alert("Maksimal hanya bisa memilih 4 jadwal!");
          return;
        }

        // Select
        selectedJadwalIds.push(jadwalId);
        selectedJadwalMap.set(jadwalId, {
          tanggal,
          namaTim,
          id: jadwalId,
        });

        this.style.background = "#e3f2fd";
        this.style.borderColor = "#007bff";
        this.style.boxShadow = "0 0 0 2px rgba(0, 123, 255, 0.25)";
        checkmark.style.display = "flex";
      }

      // Update counter dan list
      updateSelectedJadwalInfo(selectedJadwalIds, selectedJadwalMap);
    });

    // Hover effects
    card.addEventListener("mouseenter", function () {
      if (!selectedJadwalIds.includes(this.getAttribute("data-jadwal-id"))) {
        this.style.background = "#f8f9fa";
        this.style.transform = "translateY(-2px)";
        this.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
      }
    });

    card.addEventListener("mouseleave", function () {
      const jadwalId = this.getAttribute("data-jadwal-id");
      if (!selectedJadwalIds.includes(jadwalId)) {
        this.style.background = "white";
        this.style.transform = "translateY(0)";
        this.style.boxShadow = "none";
      }
    });
  });
}

function updateSelectedJadwalInfo(selectedIds, selectedMap) {
  // Update counter
  document.getElementById("selectedCount").textContent = selectedIds.length;

  // Update hidden input dengan comma-separated IDs
  document.getElementById("selectedJadwalIds").value = selectedIds.join(",");

  // Update list jadwal terpilih
  const selectedList = document.getElementById("selectedJadwalList");

  if (selectedIds.length === 0) {
    selectedList.innerHTML =
      '<span style="color: #999; font-style: italic;">Belum ada jadwal yang dipilih</span>';
    return;
  }

  let listHTML = '<div style="display: flex; flex-wrap: wrap; gap: 5px;">';

  selectedIds.forEach((id) => {
    const jadwal = selectedMap.get(id);
    if (jadwal) {
      listHTML += `
                <span style="background: #007bff; color: white; padding: 3px 8px; 
                      border-radius: 12px; font-size: 12px; display: inline-flex; 
                      align-items: center; gap: 5px;">
                    ${jadwal.tanggal}
                    <button type="button" onclick="removeSelectedJadwal('${id}')" 
                            style="background: none; border: none; color: white; 
                                   cursor: pointer; font-size: 10px; padding: 0;"
                            onmouseover="this.innerHTML='×'" 
                            onmouseout="this.innerHTML='✕'">
                        ✕
                    </button>
                </span>
            `;
    }
  });

  listHTML += "</div>";
  selectedList.innerHTML = listHTML;
}

// Fungsi untuk remove jadwal dari list
function removeSelectedJadwal(jadwalId) {
  const card = document.querySelector(
    `.jadwal-card[data-jadwal-id="${jadwalId}"]`
  );
  if (card) {
    card.click(); // Trigger click untuk toggle selection
  }
}

function createJadwalGrid(jadwalList) {
  // Group jadwal by bulan untuk organisasi yang lebih baik
  const groupedByMonth = {};

  jadwalList.forEach((j) => {
    const id = j.idJadwal || j.id;
    const tanggal = j.tanggalJadwal || j.tanggal;
    const namaTim = j.nama_tim || "Tim";

    if (tanggal) {
      const date = new Date(tanggal);
      const monthYear = date.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });

      if (!groupedByMonth[monthYear]) {
        groupedByMonth[monthYear] = [];
      }

      groupedByMonth[monthYear].push({
        id,
        tanggal,
        namaTim,
        dateObj: date,
        formattedDate: date.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
      });
    }
  });

  let gridHTML = "";

  // Urutkan bulan
  const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => {
    return new Date(a) - new Date(b);
  });

  sortedMonths.forEach((monthYear) => {
    const jadwals = groupedByMonth[monthYear];

    // Urutkan jadwal dalam bulan berdasarkan tanggal
    jadwals.sort((a, b) => a.dateObj - b.dateObj);

    gridHTML += `
            <div style="grid-column: 1 / -1; margin-bottom: 10px;">
                <h4 style="margin: 0; padding-bottom: 5px; border-bottom: 2px solid #007bff; color: #333;">
                    ${monthYear}
                </h4>
            </div>
        `;

    jadwals.forEach((j) => {
      gridHTML += `
                <div class="jadwal-card" data-jadwal-id="${j.id}" 
                     style="border: 1px solid #ddd; border-radius: 8px; padding: 10px; 
                            cursor: pointer; transition: all 0.2s; text-align: center;
                            background: white;">
                    <div style="font-weight: bold; color: #007bff; margin-bottom: 5px;">
                        ${j.formattedDate}
                    </div>
                    <div style="font-size: 12px; color: #666;">
                        ${j.namaTim}
                    </div>
                </div>
            `;
    });
  });

  return gridHTML;
}

function setupJadwalGridListeners() {
  const jadwalCards = document.querySelectorAll(".jadwal-card");
  let selectedCard = null;

  jadwalCards.forEach((card) => {
    card.addEventListener("click", function () {
      const jadwalId = this.getAttribute("data-jadwal-id");
      const tanggal = this.querySelector("div:first-child").textContent;
      const namaTim = this.querySelector("div:last-child").textContent;

      // Reset selected card sebelumnya
      if (selectedCard) {
        selectedCard.style.background = "white";
        selectedCard.style.borderColor = "#ddd";
        selectedCard.style.boxShadow = "none";
      }

      // Set selected card baru
      this.style.background = "#e3f2fd";
      this.style.borderColor = "#007bff";
      this.style.boxShadow = "0 0 0 2px rgba(0, 123, 255, 0.25)";
      selectedCard = this;

      // Update hidden input dan info
      document.getElementById("idJadwal").value = jadwalId;
      document.getElementById(
        "selectedJadwalText"
      ).textContent = `${tanggal} - ${namaTim}`;
      document.getElementById("selectedJadwalInfo").style.display = "block";
    });

    // Hover effects
    card.addEventListener("mouseenter", function () {
      if (this !== selectedCard) {
        this.style.background = "#f8f9fa";
        this.style.transform = "translateY(-2px)";
        this.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
      }
    });

    card.addEventListener("mouseleave", function () {
      if (this !== selectedCard) {
        this.style.background = "white";
        this.style.transform = "translateY(0)";
        this.style.boxShadow = "none";
      }
    });
  });
}

async function editDetailJadwal(detailId) {
  try {
    const detail = await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
      headers: getAuthHeaders(),
    });

    console.log("Detail untuk edit:", detail);

    const [anggota, jadwal] = await Promise.all([
      fetchAPI(API.anggota, { headers: getAuthHeaders() }),
      fetchAPI(API.jadwal, { headers: getAuthHeaders() }),
    ]);

    const anggotaOptions = anggota
      .map(
        (a) =>
          `<option value="${a.idAnggota}" ${
            a.idAnggota == detail.idAnggota ? "selected" : ""
          }>
                ${a.idAnggota} - ${a.nama}
            </option>`
      )
      .join("");

    // Buat grid untuk jadwal
    const jadwalGrid = createJadwalGrid(jadwal);

    const formHTML = `
            <form id="editDetailForm">
                <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <label style="display: block; margin-bottom: 5px;">Anggota *</label>
                        <select id="idAnggota" required style="width: 100%; padding: 8px;">
                            <option value="">Pilih Anggota</option>
                            ${anggotaOptions}
                        </select>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: bold;">Pilih Jadwal *</label>
                    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; max-height: 300px; overflow-y: auto;">
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;" id="jadwalGrid">
                            ${jadwalGrid}
                        </div>
                    </div>
                    <input type="hidden" id="idJadwal" required value="${
                      detail.idJadwal || ""
                    }">
                    <div id="selectedJadwalInfo" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px; display: none;">
                        <strong>Jadwal terpilih:</strong> <span id="selectedJadwalText"></span>
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <label style="display: block; margin-bottom: 5px;">Status Pengangkutan *</label>
                        <select id="status_pengangkutan" required style="width: 100%; padding: 8px;">
                            <option value="terjadwal" ${
                              detail.status_pengangkutan === "terjadwal"
                                ? "selected"
                                : ""
                            }>Terjadwal</option>
                            <option value="dalam_proses" ${
                              detail.status_pengangkutan === "dalam_proses"
                                ? "selected"
                                : ""
                            }>Dalam Proses</option>
                            <option value="selesai" ${
                              detail.status_pengangkutan === "selesai"
                                ? "selected"
                                : ""
                            }>Selesai</option>
                            <option value="dibatalkan" ${
                              detail.status_pengangkutan === "dibatalkan"
                                ? "selected"
                                : ""
                            }>Dibatalkan</option>
                        </select>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Catatan</label>
                    <textarea id="catatan" style="width: 100%; padding: 8px; height: 100px;" 
                              placeholder="Catatan tambahan...">${
                                detail.catatan || ""
                              }</textarea>
                </div>
            </form>
        `;

    showModal("Edit Detail Jadwal Anggota", formHTML, async () => {
      const selectedJadwalId = document.getElementById("idJadwal").value;
      if (!selectedJadwalId) {
        alert("Silakan pilih jadwal terlebih dahulu!");
        return;
      }

      const detailData = {
        idAnggota: parseInt(document.getElementById("idAnggota").value),
        idJadwal: parseInt(selectedJadwalId),
        status_pengangkutan: document.getElementById("status_pengangkutan")
          .value,
        catatan: document.getElementById("catatan").value || "",
      };

      console.log("Data yang akan diupdate:", detailData);

      try {
        await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify(detailData),
        });

        alert("Detail jadwal berhasil diupdate!");
        loadDetailAnggotaJadwal();
      } catch (error) {
        console.error("Update error:", error);
        alert("Error: " + error.message);
      }
    });

    // Setup event listeners untuk grid jadwal
    setupJadwalGridListeners();

    // Highlight jadwal yang sudah dipilih sebelumnya
    setTimeout(() => {
      if (detail.idJadwal) {
        const selectedCard = document.querySelector(
          `.jadwal-card[data-jadwal-id="${detail.idJadwal}"]`
        );
        if (selectedCard) {
          selectedCard.click(); // Trigger click untuk select card
        }
      }
    }, 100);
  } catch (error) {
    alert("Error loading data: " + error.message);
  }
}

async function viewDetailJadwal(detailId) {
  try {
    const detail = await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
      headers: getAuthHeaders(),
    });

    console.log("Detail untuk view:", detail); // Debug

    // Jika perlu data lengkap anggota dan jadwal, fetch secara terpisah
    let anggotaDetail = null;
    let jadwalDetail = null;

    if (detail.idAnggota) {
      try {
        anggotaDetail = await fetchAPI(`${API.anggota}${detail.idAnggota}/`, {
          headers: getAuthHeaders(),
        });
      } catch (error) {
        console.warn("Tidak bisa fetch detail anggota:", error);
      }
    }

    if (detail.idJadwal) {
      try {
        jadwalDetail = await fetchAPI(`${API.jadwal}${detail.idJadwal}/`, {
          headers: getAuthHeaders(),
        });
      } catch (error) {
        console.warn("Tidak bisa fetch detail jadwal:", error);
      }
    }

    const detailHTML = `
            <div>
                <h3>Detail Jadwal Anggota</h3>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 15px;">
                    <div style="display: grid; grid-template-columns: 150px 1fr; gap: 15px; margin-bottom: 20px;">
                        <div style="font-weight: 600; color: #555;">ID:</div>
                        <div>${detail.id || "N/A"}</div>
                        
                        <div style="font-weight: 600; color: #555;">Anggota:</div>
                        <div>
                            <strong>${
                              detail.nama_anggota ||
                              anggotaDetail?.nama ||
                              "N/A"
                            }</strong><br>
                            <small>${anggotaDetail?.alamat || ""}</small><br>
                            <small>Telp: ${
                              anggotaDetail?.noWA || ""
                            }</small><br>
                            <small style="color: #666;">ID: ${
                              detail.idAnggota || "N/A"
                            }</small>
                        </div>
                        
                        <div style="font-weight: 600; color: #555;">Jadwal:</div>
                        <div>
                            <strong>Tanggal: ${
                              detail.tanggal_jadwal ||
                              jadwalDetail?.tanggalJadwal ||
                              "N/A"
                            }</strong><br>
                            <small>Tim: ${
                              detail.nama_tim || jadwalDetail?.nama_tim || "N/A"
                            }</small><br>
                            <small>ID Jadwal: ${
                              detail.idJadwal || jadwalDetail?.idJadwal || "N/A"
                            }</small>
                        </div>
                        
                        <div style="font-weight: 600; color: #555;">Status:</div>
                        <div>
                            ${getStatusBadge(detail.status_pengangkutan)}
                        </div>
                        
                        <div style="font-weight: 600; color: #555;">Catatan:</div>
                        <div style="white-space: pre-wrap; background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
                            ${detail.catatan || "-"}
                        </div>
                        
                        <div style="font-weight: 600; color: #555;">Dibuat:</div>
                        <div>${
                          detail.created_at
                            ? new Date(detail.created_at).toLocaleString(
                                "id-ID"
                              )
                            : "N/A"
                        }</div>
                    </div>
                </div>
            </div>
        `;

    showModal("Detail Jadwal Anggota", detailHTML);
  } catch (error) {
    alert("Error loading detail: " + error.message);
  }
}

async function deleteDetailJadwal(detailId) {
  showConfirmModal(
    "Apakah Anda yakin ingin menghapus detail jadwal ini?",
    async () => {
      try {
        await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        alert("Detail jadwal berhasil dihapus!");
        loadDetailAnggotaJadwal();
      } catch (error) {
        alert("Error deleting detail: " + error.message);
      }
    }
  );
}
