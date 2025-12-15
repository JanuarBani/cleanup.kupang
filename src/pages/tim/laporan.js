import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showModal } from "../../utils/modal.js";

export async function laporanTimPage() {
  const mainContent = document.getElementById("mainContent");
  mainContent.innerHTML = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>🗑️ Laporan Sampah</h2>
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="searchLaporan" placeholder="Cari laporan..." style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 200px;">
                    <select id="filterStatus" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">Semua Status</option>
                        <option value="dilaporkan">Dilaporkan</option>
                        <option value="diterima">Diterima</option>
                        <option value="diproses">Diproses</option>
                        <option value="selesai">Selesai</option>
                        <option value="ditolak">Ditolak</option>
                    </select>
                    <input type="date" id="filterDate" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
            </div>
            
            <div id="laporanContainer">
                <p>Loading data...</p>
            </div>
        </div>
    `;

  document.getElementById("searchLaporan").oninput = loadLaporan;
  document.getElementById("filterStatus").onchange = loadLaporan;
  document.getElementById("filterDate").onchange = loadLaporan;

  loadLaporan();
}

async function loadLaporan() {
  const search = document.getElementById("searchLaporan").value;
  const filterStatus = document.getElementById("filterStatus").value;
  const filterDate = document.getElementById("filterDate").value;

  try {
    const laporan = await fetchAPI(API.laporanSampah, {
      headers: getAuthHeaders(),
    });

    const filteredLaporan = laporan.filter((l) => {
      const matchSearch =
        l.nama?.toLowerCase().includes(search.toLowerCase()) ||
        l.alamat?.toLowerCase().includes(search.toLowerCase()) ||
        l.deskripsi?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || l.status === filterStatus;
      const matchDate = !filterDate || l.tanggal_lapor === filterDate;
      return matchSearch && matchStatus && matchDate;
    });

    renderLaporanCards(filteredLaporan);
  } catch (error) {
    document.getElementById(
      "laporanContainer"
    ).innerHTML = `<p style="color: red;">Error loading laporan: ${error.message}</p>`;
  }
}

async function viewLaporan(laporanId) {
  try {
    const laporan = await fetchAPI(`${API.laporanSampah}${laporanId}/`, {
      headers: getAuthHeaders(),
    });

    // Badge status dengan warna yang sesuai
    const statusColors = getStatusColor(laporan.status);
    const statusBadge = `
            <span style="
                padding: 6px 14px;
                background: ${statusColors.background};
                color: ${statusColors.text};
                border: 1px solid ${statusColors.border};
                border-radius: 20px;
                font-size: 13px;
                font-weight: bold;
                text-transform: uppercase;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            ">
                ${getStatusIcon(laporan.status)} ${laporan.status}
            </span>
        `;

    // Foto bukti
    const fotoHTML = laporan.foto_bukti
      ? `
                <div style="margin-top: 15px; text-align:center;">
                    <img src="${laporan.foto_bukti}" alt="Foto Bukti"
                        style="
                            width: 100%;
                            max-height: 260px;
                            object-fit: cover;
                            border-radius: 10px;
                            border: 1px solid #ccc;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                        ">
                </div>
              `
      : `
                <div style="
                    margin-top:15px; 
                    padding:20px; 
                    background:#f0f0f0; 
                    text-align:center; 
                    border-radius:8px;
                    color:#777;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                ">
                    <i class="bi bi-image" style="font-size: 20px;"></i>
                    Tidak ada foto bukti
                </div>
              `;

    // Timeline status
    const timelineHTML = `
            <div style="margin-top: 20px;">
                <h4 style="margin-bottom: 15px; color: #555;">📋 Timeline Status</h4>
                <div style="position: relative; padding-left: 30px;">
                    <div style="position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: #e0e0e0;"></div>
                    
                    <!-- Step Dilaporkan -->
                    <div style="position: relative; margin-bottom: 25px;">
                        <div style="position: absolute; left: -25px; top: 0; width: 16px; height: 16px; border-radius: 50%; background: #9C27B0; border: 3px solid white; z-index: 1;"></div>
                        <div>
                            <div style="font-weight: 500; color: #333;">Dilaporkan</div>
                            <div style="font-size: 13px; color: #666;">${formatTanggalDetail(
                              laporan.tanggal_lapor
                            )}</div>
                        </div>
                    </div>
                    
                    <!-- Status Saat Ini -->
                    ${getStatusTimeline(laporan)}
                </div>
            </div>
        `;

    const detailHTML = `
            <div style="font-family: Arial;">

                <h2 style="margin-bottom: 15px; color:#333; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
                    <i class="bi bi-file-earmark-text me-2"></i> Detail Laporan Sampah
                </h2>

                <div style="
                    background: #ffffff;
                    padding: 20px;
                    border-radius: 10px;
                    border: 1px solid #e5e5e5;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                ">

                    <!-- Header dengan Status -->
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <h3 style="margin:0; color:#222; font-size: 20px;">${
                              laporan.nama || "Laporan Tanpa Nama"
                            }</h3>
                            <p style="margin:5px 0 0 0; color:#666; font-size: 14px;">
                                <i class="bi bi-person me-1"></i> ${
                                  laporan.nama_user || "Tidak diketahui"
                                }
                            </p>
                        </div>
                        ${statusBadge}
                    </div>

                    <!-- Informasi Utama -->
                    <div style="margin-bottom: 20px;">
                        <div class="row" style="display: flex; flex-wrap: wrap; gap: 15px; margin: 0 -7px;">
                            <div style="flex: 1; min-width: 200px; padding: 0 7px;">
                                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid #4285F4;">
                                    <p style="margin:0; color:#666; font-size: 13px; font-weight: 500;">
                                        <i class="bi bi-calendar me-2"></i> Tanggal Lapor
                                    </p>
                                    <p style="margin:5px 0 0 0; color:#333; font-size: 15px; font-weight: 600;">
                                        ${formatTanggalDetail(
                                          laporan.tanggal_lapor
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div style="flex: 1; min-width: 200px; padding: 0 7px;">
                                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid #34A853;">
                                    <p style="margin:0; color:#666; font-size: 13px; font-weight: 500;">
                                        <i class="bi bi-geo-alt me-2"></i> ID Laporan
                                    </p>
                                    <p style="margin:5px 0 0 0; color:#333; font-size: 15px; font-weight: 600;">
                                        #${laporan.idLaporan || laporan.id}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Alamat -->
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #555; font-size: 16px;">
                            <i class="bi bi-geo-alt-fill me-2"></i> Alamat Lokasi
                        </h4>
                        <div style="
                            padding: 15px;
                            background: #f8f9fa;
                            border-radius: 8px;
                            border-left: 4px solid #FBBC05;
                        ">
                            <p style="margin:0; color:#333; line-height: 1.5;">
                                ${laporan.alamat || "Tidak ada alamat"}
                            </p>
                        </div>
                    </div>

                    <!-- MAP SECTION -->
                    <div style="margin: 20px 0;">
                        <h4 style="margin-bottom: 15px; color: #555; font-size: 16px;">
                            <i class="bi bi-map me-2"></i> Lokasi di Peta
                        </h4>

                        <div id="map-loading-laporan-${laporan.idLaporan}" 
                            style="padding: 20px; text-align:center; color:#555; background: #f8f9fa; border-radius: 8px;">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p style="margin-top: 10px;">Memuat peta...</p>
                        </div>

                        <div id="map-laporan-${laporan.idLaporan}"
                            style="
                                width: 100%;
                                height: 300px;
                                background: #eaeaea;
                                border-radius: 8px;
                                margin-bottom: 15px;
                                display: none;
                            ">
                        </div>

                        <!-- Map Controls -->
                        <div id="map-controls-laporan-${laporan.idLaporan}" 
                            style="display:none; margin-bottom:15px;">
                            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                  <button onclick="resetLaporanMapView(${
                                  laporan.idLaporan
                                })"
                                    class="btn btn-outline-secondary btn-sm">
                                    <i class="bi bi-arrow-clockwise me-1"></i> Reset
                                </button>
                                ${
                                  laporan.latitude && laporan.longitude
                                    ? `
                                    <a href="https://www.google.com/maps?q=${laporan.latitude},${laporan.longitude}"
                                    target="_blank"
                                    class="btn btn-success btn-sm">
                                        <i class="bi bi-google me-1"></i> Buka di Google Maps
                                    </a>
                                `
                                    : ""
                                }
                            </div>
                        </div>
                    </div>
                    <!-- END MAP SECTION -->

                    <!-- Deskripsi -->
                    <div style="margin: 20px 0;">
                        <h4 style="margin-bottom: 10px; color: #555; font-size: 16px;">
                            <i class="bi bi-chat-text me-2"></i> Deskripsi Laporan
                        </h4>
                        <div style="
                            padding: 15px;
                            background:#f8f9fa;
                            border-left:4px solid #0d6efd;
                            border-radius:8px;
                        ">
                            <p style="margin:0; color:#555; line-height:1.6;">
                                ${laporan.deskripsi || "Tidak ada deskripsi"}
                            </p>
                        </div>
                    </div>

                    <!-- Foto Bukti -->
                    <div style="margin: 20px 0;">
                        <h4 style="margin-bottom: 15px; color: #555; font-size: 16px;">
                            <i class="bi bi-image me-2"></i> Foto Bukti
                        </h4>
                        ${fotoHTML}
                    </div>

                    <!-- Timeline -->
                    ${timelineHTML}

                </div>
            </div>
        `;

    showModal("Detail Laporan", detailHTML);

    setTimeout(() => {
      loadMapForLaporan(laporan);
    }, 300);
  } catch (error) {
    showNotification("Error loading detail: " + error.message, "error");
  }
}

function renderLaporanCards(laporanList) {
  const container = document.getElementById("laporanContainer");

  // Jika kosong
  if (!laporanList || laporanList.length === 0) {
    container.innerHTML = `
            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                <div style="font-size: 48px; color: #ddd; margin-bottom: 15px;">📭</div>
                <h3 style="color: #666; margin-bottom: 10px;">Tidak ada laporan</h3>
                <p style="color: #888;">Tidak ada laporan sampah yang ditemukan.</p>
            </div>
        `;
    return;
  }

  // GRID VIEW
  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(auto-fill, minmax(300px, 1fr))";
  container.style.gap = "20px";

  const cardsHTML = laporanList
    .map((l) => {
      const foto = l.foto_bukti || null;
      const statusColors = getStatusColor(l.status);

      return `
        <div class="laporan-card" style="
            border: 1px solid #ddd;
            border-radius: 12px;
            background: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.08);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            transition: all 0.3s ease;
        " onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.12)'"
          onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.08)'">

            <!-- Header dengan Status -->
            <div style="
                padding: 12px 16px;
                background: ${statusColors.lightBackground};
                border-bottom: 1px solid ${statusColors.border};
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <h3 style="margin: 0; font-size: 16px; color: ${
                  statusColors.text
                }; font-weight: 600;">
                    ${getStatusIcon(l.status)} ${l.nama || "Laporan"}
                </h3>
                <span style="
                    padding: 4px 12px;
                    background: ${statusColors.background};
                    color: ${statusColors.text};
                    border: 1px solid ${statusColors.border};
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: bold;
                    text-transform: uppercase;
                ">
                    ${l.status}
                </span>
            </div>

            <!-- Thumbnail Foto -->
            ${
              foto
                ? `<img src="${foto}" style="width: 100%; height: 180px; object-fit: cover; cursor: pointer;" 
                         onclick="showImageModal('${foto}')">`
                : `<div style="width: 100%; height: 180px; background:#f8f9fa; display:flex; flex-direction: column; align-items:center; justify-content:center; color:#999;">
                        <i class="bi bi-image" style="font-size: 40px; margin-bottom: 10px;"></i>
                        <span>Tidak ada foto</span>
                      </div>`
            }

            <!-- Isi Card -->
            <div style="padding: 16px; flex: 1;">

                <!-- User Info -->
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                    <div style="
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: #e3f2fd;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #1976d2;
                        font-weight: bold;
                    ">
                        ${
                          l.nama_user
                            ? l.nama_user.charAt(0).toUpperCase()
                            : "U"
                        }
                    </div>
                    <div>
                        <div style="font-weight: 500; color: #333;">${
                          l.nama_user || "User"
                        }</div>
                        <small style="color: #666; font-size: 12px;">
                            <i class="bi bi-calendar me-1"></i> ${formatTanggalSimple(
                              l.tanggal_lapor
                            )}
                        </small>
                    </div>
                </div>

                <!-- Deskripsi -->
                <p style="margin: 0 0 12px; color: #555; font-size: 14px; line-height: 1.4;">
                    ${l.deskripsi?.substring(0, 100) || ""}
                    ${l.deskripsi && l.deskripsi.length > 100 ? "..." : ""}
                </p>

                <!-- Info Lokasi -->
                <div style="
                    background: #f8f9fa; 
                    padding: 10px; 
                    border-radius: 8px; 
                    margin-bottom: 12px;
                ">
                    <div style="display: flex; align-items: flex-start; gap: 8px; color: #333;">
                        <i class="bi bi-geo-alt" style="color: #4285F4; font-size: 16px; margin-top: 2px;"></i>
                        <div>
                            <small style="color: #666; font-size: 12px; display: block; margin-bottom: 4px;">Lokasi</small>
                            <div style="font-size: 13px; line-height: 1.3;">
                                ${l.alamat?.substring(0, 60) || ""}
                                ${l.alamat?.length > 60 ? "..." : ""}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Koordinat Info -->
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    ${
                      l.latitude && l.longitude
                        ? `
                                <div style="display: flex; align-items: center; gap: 6px; color: #34A853; font-size: 13px;">
                                    <i class="bi bi-check-circle"></i>
                                    <span>Tersedia koordinat</span>
                                </div>
                                <button onclick="copyLaporanCoordinates(${l.latitude}, ${l.longitude})"
                                        style="padding: 4px 8px; background: #f1f1f1; border: 1px solid #ddd; border-radius: 4px; font-size: 11px; color: #666; cursor: pointer;">
                                    <i class="bi bi-clipboard me-1"></i> Salin
                                </button>
                            `
                        : `<div style="color: #999; font-size: 13px; font-style: italic;">
                                <i class="bi bi-exclamation-circle me-1"></i> Tidak ada koordinat
                            </div>`
                    }
                </div>
            </div>

            <!-- Action Buttons -->
            <div style="
                padding: 12px 16px; 
                display:flex; 
                justify-content: space-between; 
                background:#fafafa;
                border-top: 1px solid #eee;
                gap: 8px;
            ">
                
                <button onclick="viewLaporan(${l.idLaporan || l.id})"
                    style="flex: 1; padding: 8px 12px; background: #4285F4; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="bi bi-eye"></i> Detail
                </button>

                <button onclick="updateLaporanStatus(${l.idLaporan || l.id})"
                    style="flex: 1; padding: 8px 12px; background: ${
                      statusColors.actionButton
                    }; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="bi bi-pencil-square"></i> Update
                </button>
            </div>
        </div>`;
    })
    .join("");

  container.innerHTML = cardsHTML;

  // Re-assign functions to window
  window.viewLaporan = viewLaporan;
  window.updateLaporanStatus = updateLaporanStatus;
  window.showImageModal = showImageModal;
}

// Fungsi untuk mendapatkan ikon berdasarkan status
function getStatusIcon(status) {
  const iconMap = {
    dilaporkan: "📝",
    diterima: "✅",
    diproses: "⏳",
    proses: "🔄",
    selesai: "🎉",
    ditolak: "❌",
    pending: "⏱️",
  };
  return iconMap[status] || "📋";
}

// Fungsi untuk format tanggal detail
function formatTanggalDetail(dateString) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

// Fungsi untuk timeline status
function getStatusTimeline(laporan) {
  const status = laporan.status || "dilaporkan";
  const statusOrder = [
    "dilaporkan",
    "diterima",
    "diproses",
    "selesai",
    "ditolak",
  ];
  const currentIndex = statusOrder.indexOf(status);

  let timelineHTML = "";

  statusOrder.forEach((s, index) => {
    if (index <= currentIndex) {
      const statusColors = getStatusColor(s);
      const isCurrent = s === status;

      timelineHTML += `
                <div style="position: relative; margin-bottom: 25px;">
                    <div style="position: absolute; left: -25px; top: 0; width: 16px; height: 16px; border-radius: 50%; 
                         background: ${statusColors.text}; 
                         border: 3px solid white; 
                         z-index: 1;
                         ${
                           isCurrent
                             ? "box-shadow: 0 0 0 3px " +
                               statusColors.background +
                               ";"
                             : ""
                         }">
                    </div>
                    <div>
                        <div style="font-weight: 500; color: #333; display: flex; align-items: center; gap: 8px;">
                            ${getStatusIcon(s)} ${s.toUpperCase()}
                            ${
                              isCurrent
                                ? '<span style="font-size: 11px; background: ' +
                                  statusColors.background +
                                  "; color: " +
                                  statusColors.text +
                                  '; padding: 2px 8px; border-radius: 10px;">SAAT INI</span>'
                                : ""
                            }
                        </div>
                    </div>
                </div>
            `;
    }
  });

  return timelineHTML;
}

// Fungsi modal gambar
function showImageModal(imageUrl) {
  const modalHTML = `
        <div class="modal fade" id="imageModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Foto Bukti</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center">
                        <img src="${imageUrl}" class="img-fluid" alt="Foto bukti laporan" 
                             style="max-height: 70vh; object-fit: contain;">
                    </div>
                    <div class="modal-footer">
                        <a href="${imageUrl}" download class="btn btn-primary">
                            <i class="bi bi-download me-2"></i> Download
                        </a>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                    </div>
                </div>
            </div>
        </div>
    `;

  const modalDiv = document.createElement("div");
  modalDiv.innerHTML = modalHTML;
  document.body.appendChild(modalDiv);

  const imageModal = new bootstrap.Modal(document.getElementById("imageModal"));
  imageModal.show();

  // Cleanup after modal is hidden
  document
    .getElementById("imageModal")
    .addEventListener("hidden.bs.modal", function () {
      modalDiv.remove();
    });
}

// Helper function untuk format tanggal sederhana (tetap sama)
function formatTanggalSimple(dateString) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hari ini";
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "Kemarin";
    }

    const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return `${diffDays} hari lalu`;
    }

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  } catch (e) {
    return typeof dateString === "string" ? dateString.split("T")[0] : "-";
  }
}

// Fungsi untuk membuka lokasi laporan di Google Maps
function openLaporanInGoogleMaps(latitude, longitude, locationName = "") {
  try {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      showNotification("❌ Koordinat tidak valid", "error");
      return;
    }

    // Buat URL Google Maps
    let googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    // Tambahkan nama lokasi jika ada
    if (locationName) {
      googleMapsUrl += `&q=${encodeURIComponent(locationName)}`;
    }

    // Buka di tab baru
    window.open(googleMapsUrl, "_blank");

    showNotification("🌍 Membuka lokasi di Google Maps", "info");
  } catch (error) {
    console.error("Error opening Google Maps:", error);
    showNotification("❌ Gagal membuka Google Maps", "error");
  }
}

// Fungsi untuk menyalin koordinat laporan
function copyLaporanCoordinates(latitude, longitude) {
  try {
    const lat = parseFloat(latitude).toFixed(6);
    const lng = parseFloat(longitude).toFixed(6);
    const coords = `${lat}, ${lng}`;

    navigator.clipboard
      .writeText(coords)
      .then(() => {
        showNotification("✅ Koordinat disalin: " + coords, "success");
      })
      .catch((err) => {
        // Fallback untuk browser lama
        const textArea = document.createElement("textarea");
        textArea.value = coords;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        showNotification("✅ Koordinat disalin: " + coords, "success");
      });
  } catch (error) {
    console.error("Error copying coordinates:", error);
    showNotification("❌ Gagal menyalin koordinat", "error");
  }
}

// Fungsi untuk load peta laporan
async function loadMapForLaporan(laporan) {
  const mapId = `map-laporan-${laporan.idLaporan || laporan.id}`;
  const loadingId = `map-loading-laporan-${laporan.idLaporan || laporan.id}`;
  const controlsId = `map-controls-laporan-${laporan.idLaporan || laporan.id}`;

  try {
    // Cek apakah Leaflet sudah dimuat
    if (window.L) {
      createMapForLaporan(laporan, mapId, loadingId, controlsId);
      return;
    }

    console.log("📥 Loading Leaflet for laporan...");

    // Update loading message
    const loadingDiv = document.getElementById(loadingId);
    if (loadingDiv) {
      loadingDiv.innerHTML = "<p>⏳ Mengunduh library peta...</p>";
    }

    // Muat Leaflet
    await loadLeafletForLaporan();

    // Buat peta
    createMapForLaporan(laporan, mapId, loadingId, controlsId);
  } catch (error) {
    console.error("Error loading map for laporan:", error);
    showMapErrorForLaporan(mapId, loadingId, error.message);
  }
}

// Fungsi untuk memuat Leaflet khusus laporan
async function loadLeafletForLaporan() {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve();
      return;
    }

    // Muat CSS Leaflet jika belum ada
    if (!document.querySelector('link[href*="leaflet"]')) {
      const leafletCSS = document.createElement("link");
      leafletCSS.rel = "stylesheet";
      leafletCSS.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      leafletCSS.integrity =
        "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      leafletCSS.crossOrigin = "";
      document.head.appendChild(leafletCSS);
    }

    // Muat JS Leaflet
    const scriptId = "leaflet-script-laporan";

    if (document.getElementById(scriptId)) {
      // Tunggu jika sedang dimuat
      const checkLoaded = setInterval(() => {
        if (window.L) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);
      return;
    }

    const leafletScript = document.createElement("script");
    leafletScript.id = scriptId;
    leafletScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    leafletScript.integrity =
      "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    leafletScript.crossOrigin = "";

    leafletScript.onload = () => {
      console.log("✅ Leaflet loaded for laporan");

      // Fix icon paths
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      resolve();
    };

    leafletScript.onerror = (error) => {
      console.error("❌ Failed to load Leaflet:", error);
      reject(new Error("Gagal memuat library peta"));
    };

    document.body.appendChild(leafletScript);
  });
}

// Fungsi untuk membuat peta laporan
function createMapForLaporan(laporan, mapId, loadingId, controlsId) {
  try {
    // Hapus loading message
    const loadingDiv = document.getElementById(loadingId);
    if (loadingDiv) loadingDiv.remove();

    // Gunakan koordinat laporan
    const lat = parseFloat(laporan.latitude) || -10.1935921;
    const lng = parseFloat(laporan.longitude) || 123.6149376;

    // Cek container
    const mapContainer = document.getElementById(mapId);
    if (!mapContainer) {
      throw new Error("Container peta tidak ditemukan");
    }

    // Buat peta
    const map = L.map(mapId).setView([lat, lng], 16);

    // Tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // ============================
    // 🔥 LOGIKA WARNA SEDERHANA 🔥
    // ============================
    let markerColor = "#ffc107"; // default kuning

    const status = laporan.status?.toLowerCase() || "";

    if (status === "selesai") {
      markerColor = "#28a745"; // hijau
    } else if (status === "diproses" || status === "proses") {
      markerColor = "#17a2b8"; // biru muda
    } else if (status === "ditolak") {
      markerColor = "#f44336"; // merah
    } else if (status === "diterima") {
      markerColor = "#ffc107"; // kuning
    } else if (status === "dilaporkan") {
      markerColor = "#9C27B0"; // ungu
    } else if (status === "pending") {
      markerColor = "#ff9800"; // orange
    }

    // Custom marker icon
    const customIcon = L.divIcon({
      html: `
                <div style="
                    background: ${markerColor};
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 20px;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
                ">
                    🗑️
                </div>
            `,
      className: "custom-laporan-marker",
      iconSize: [42, 42],
      iconAnchor: [21, 42],
      popupAnchor: [0, -42],
    });

    // Tambahkan marker
    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

    // Format alamat dengan aman
    const alamat = laporan.alamat || "";
    const safeAlamat = alamat.replace(/'/g, "\\'");

    // Ikon status
    const statusIcons = {
      selesai: "✅",
      diproses: "⏳",
      proses: "⏳",
      ditolak: "❌",
      diterima: "📥",
      dilaporkan: "📝",
      pending: "⏱️",
    };
    const statusIcon = statusIcons[status] || "📋";

    marker
      .bindPopup(
        `
            <div style="padding: 12px; min-width: 280px; font-family: Arial, sans-serif;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        background: ${markerColor};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 20px;
                    ">
                        🗑️
                    </div>
                    <div>
                        <strong style="font-size: 16px; color: #333;">Laporan Sampah</strong>
                        <div style="font-size: 12px; color: #666;">ID: #${
                          laporan.idLaporan || laporan.id
                        }</div>
                    </div>
                </div>
                
                <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid ${markerColor};">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <span style="font-size: 14px;">${statusIcon}</span>
                        <span style="font-weight: 600; color: #555;">Status:</span>
                        <span style="
                            padding: 4px 10px;
                            border-radius: 12px;
                            font-size: 12px;
                            background: ${markerColor};
                            color: white;
                            font-weight: bold;
                            text-transform: uppercase;
                        ">
                            ${laporan.status}
                        </span>
                    </div>
                    
                    <div style="margin-top: 8px; font-size: 13px;">
                        <div style="color: #555; margin-bottom: 4px;">
                            <strong>👤 Pelapor:</strong> ${
                              laporan.nama || "Tidak diketahui"
                            }
                        </div>
                        <div style="color: #555;">
                            <strong>📅 Tanggal:</strong> ${
                              laporan.tanggal_lapor
                                ? new Date(
                                    laporan.tanggal_lapor
                                  ).toLocaleDateString("id-ID")
                                : "-"
                            }
                        </div>
                    </div>
                </div>

                <div style="font-size: 13px; color: #666; margin: 12px 0; line-height: 1.4;">
                    <strong style="color: #555;">📍 Alamat:</strong><br>
                    ${alamat.substring(0, 80)}${alamat.length > 80 ? "..." : ""}
                </div>

                <div style="font-size: 12px; color: #777; background: #f1f1f1; padding: 8px; border-radius: 4px; margin: 10px 0;">
                    <strong>Koordinat:</strong> ${lat.toFixed(
                      6
                    )}, ${lng.toFixed(6)}
                </div>

                <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                    <button onclick="window.openLaporanInGoogleMaps(${lat}, ${lng}, '${safeAlamat}')" 
                        style="
                            flex: 1;
                            padding: 8px 12px;
                            background: #4285F4;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            font-size: 12px;
                            font-weight: 500;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            transition: background 0.2s;
                        "
                        onmouseover="this.style.backgroundColor='#1976D2'"
                        onmouseout="this.style.backgroundColor='#4285F4'">
                        <span>🌍</span>
                        <span>Google Maps</span>
                    </button>
                    
                    <button onclick="window.copyLaporanCoordinates(${lat}, ${lng})" 
                        style="
                            flex: 1;
                            padding: 8px 12px;
                            background: #34A853;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            font-size: 12px;
                            font-weight: 500;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            transition: background 0.2s;
                        "
                        onmouseover="this.style.backgroundColor='#2e7d32'"
                        onmouseout="this.style.backgroundColor='#34A853'">
                        <span>📋</span>
                        <span>Salin Koordinat</span>
                    </button>
                </div>
                
                ${
                  laporan.foto_bukti
                    ? `
                    <div style="margin-top: 10px;">
                        <button onclick="showImageModal('${laporan.foto_bukti}')"
                            style="
                                width: 100%;
                                padding: 8px 12px;
                                background: #FBBC05;
                                color: #333;
                                border: none;
                                border-radius: 4px;
                                font-size: 12px;
                                font-weight: 500;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 6px;
                            ">
                            <span>📷</span>
                            <span>Lihat Foto Bukti</span>
                        </button>
                    </div>
                `
                    : ""
                }
            </div>
        `
      )
      .openPopup();

    // Controls
    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.scale().addTo(map);

    // Simpan reference
    if (!window.laporanMaps) window.laporanMaps = {};
    if (!window.laporanMapData) window.laporanMapData = {};

    window.laporanMaps[laporan.idLaporan || laporan.id] = map;
    window.laporanMapData[laporan.idLaporan || laporan.id] = laporan;

    // Tampilkan kontrol dan peta
    const controlsDiv = document.getElementById(controlsId);
    if (controlsDiv) {
      controlsDiv.style.display = "block";
      mapContainer.style.display = "block";
    }

    console.log(
      "✅ Map created for laporan:",
      laporan.idLaporan,
      "Status:",
      status,
      "Color:",
      markerColor
    );
  } catch (error) {
    console.error("Error creating laporan map:", error);
    showMapErrorForLaporan(mapId, loadingId, error.message);
  }
}

// Fungsi error untuk peta laporan
function showMapErrorForLaporan(mapId, loadingId, errorMessage) {
  const mapContainer = document.getElementById(mapId);
  if (!mapContainer) return;

  const loadingDiv = document.getElementById(loadingId);
  if (loadingDiv) {
    loadingDiv.remove();
  }

  mapContainer.innerHTML = `
        <div style="text-align: center; padding: 50px; color: #dc3545;">
            <p style="font-size: 16px; margin-bottom: 10px;">❌ Gagal memuat peta</p>
            <p style="font-size: 14px; margin-bottom: 20px;">${errorMessage}</p>
        </div>
    `;
}

// Fungsi untuk reset view peta laporan
function resetLaporanMapView(laporanId) {
  if (window.laporanMaps && window.laporanMaps[laporanId]) {
    const laporan = window.laporanMapData && window.laporanMapData[laporanId];
    if (laporan) {
      window.laporanMaps[laporanId].setView(
        [parseFloat(laporan.latitude), parseFloat(laporan.longitude)],
        16
      );
      showNotification("Mengembalikan tampilan peta", "info");
    }
  }
}

// Helper function untuk deskripsi status
function getStatusDescription(status) {
  const descriptions = {
    pending: "Menunggu penanganan",
    proses: "Sedang dalam proses",
    selesai: "Sudah ditangani",
  };
  return descriptions[status] || "Status laporan";
}

// Fungsi notifikasi (sama seperti sebelumnya)
function showNotification(message, type = "info") {
  const existing = document.querySelector(".custom-notification");
  if (existing) existing.remove();

  const notification = document.createElement("div");
  notification.className = "custom-notification";
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-size: 14px;
        font-weight: 500;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        display: flex;
        align-items: center;
        gap: 10px;
    `;

  if (type === "success") notification.style.backgroundColor = "#34A853";
  else if (type === "error") notification.style.backgroundColor = "#EA4335";
  else if (type === "warning") notification.style.backgroundColor = "#FBBC05";
  else notification.style.backgroundColor = "#4285F4";

  const icon =
    type === "success"
      ? "✅"
      : type === "error"
      ? "❌"
      : type === "warning"
      ? "⚠️"
      : "ℹ️";

  notification.innerHTML = `<span style="font-size: 16px;">${icon}</span><span>${message}</span>`;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Tambahkan CSS untuk animasi jika belum ada
if (!document.querySelector("#notification-styles")) {
  const style = document.createElement("style");
  style.id = "notification-styles";
  style.textContent = `
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
    `;
  document.head.appendChild(style);
}

// Fungsi update status (tetap sama)
async function updateLaporanStatus(laporanId) {
  try {
    const laporan = await fetchAPI(`${API.laporanSampah}${laporanId}/`, {
      headers: getAuthHeaders(),
    });

    const formHTML = `
            <form id="updateLaporanForm">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Status Laporan:</label>
                    <select id="status" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="pending" ${
                          laporan.status === "pending" ? "selected" : ""
                        }>Pending</option>
                        <option value="proses" ${
                          laporan.status === "proses" ? "selected" : ""
                        }>Proses</option>
                        <option value="selesai" ${
                          laporan.status === "selesai" ? "selected" : ""
                        }>Selesai</option>
                    </select>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Catatan (Opsional):</label>
                    <textarea id="catatan" rows="3" placeholder="Tambahkan catatan jika perlu..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">${
                      laporan.catatan || ""
                    }</textarea>
                </div>
            </form>
        `;

    showModal("Update Status Laporan", formHTML, async () => {
      const updatedData = {
        status: document.getElementById("status").value,
        catatan: document.getElementById("catatan").value.trim(),
      };

      try {
        await fetchAPI(`${API.laporanSampah}${laporanId}/`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify(updatedData),
        });

        showNotification("✅ Status laporan berhasil diupdate!", "success");
        loadLaporan();
      } catch (error) {
        showNotification(`❌ Error: ${error.message}`, "error");
      }
    });
  } catch (error) {
    showNotification(`❌ Error: ${error.message}`, "error");
  }
}

// Tambahkan Bootstrap jika belum ada
if (!document.querySelector("#bootstrap-icons")) {
  const link = document.createElement("link");
  link.id = "bootstrap-icons";
  link.rel = "stylesheet";
  link.href =
    "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css";
  document.head.appendChild(link);
}

// Export fungsi ke global scope
window.viewLaporan = viewLaporan;
window.updateLaporanStatus = updateLaporanStatus;
window.openLaporanInGoogleMaps = openLaporanInGoogleMaps;
window.copyLaporanCoordinates = copyLaporanCoordinates;
window.resetLaporanMapView = resetLaporanMapView;
window.showImageModal = showImageModal;
