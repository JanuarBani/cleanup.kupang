import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showModal, showConfirmModal, showModalAlert, showNotif, closeModal } from "../../utils/modal.js";
import { ensureLeafletLoaded, initMapForm } from "../../utils/mapConfig.js";
import { showToast } from '../../utils/toast.js';

let anggotaAllData = [];
let anggotaCurrentPage = 1;
let anggotaPerPage = 10;

// Variabel untuk map edit anggota
let anggotaEditFormMap = null;
let anggotaEditFormMarker = null;
let anggotaEditFormGPSMarker = null;

// Fungsi untuk render GPS ke peta (bisa digunakan untuk form dan edit)
async function renderGPSForMap(mapInstance, marker, gpsMarker, statusCallback, options = {}) {
  if (!navigator.geolocation) {
    if (statusCallback) statusCallback('error', 'Browser tidak mendukung GPS');
    throw new Error('Browser tidak mendukung geolocation');
  }

  // Default options
  const defaultOptions = {
    enableHighAccuracy: false,
    timeout: 15000,
    maximumAge: 60000,
    showAccuracyCircle: true,
    moveToLocation: true,
    zoomLevel: 16
  };

  const config = { ...defaultOptions, ...options };

  return new Promise((resolve, reject) => {
    // Update status loading
    if (statusCallback) statusCallback('loading');

    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy || 100;

          // Update status success
          if (statusCallback) {
            statusCallback('success', {
              lat: lat.toFixed(7),
              lng: lng.toFixed(7),
              accuracy: Math.round(accuracy)
            });
          }

          // Pindah view ke lokasi GPS
          if (mapInstance && config.moveToLocation) {
            mapInstance.setView([lat, lng], config.zoomLevel);
          }

          // Hapus marker GPS lama jika ada
          if (gpsMarker && mapInstance.hasLayer(gpsMarker)) {
            mapInstance.removeLayer(gpsMarker);
          }

          // Buat custom icon untuk marker GPS
          const gpsIcon = L.divIcon({
            html: `
              <div style="
                position: relative;
                width: 50px;
                height: 50px;
              ">
                <div style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  width: 40px;
                  height: 40px;
                  background: #28a745;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 0 10px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-size: 18px;
                ">
                  <i class="bi bi-crosshair"></i>
                </div>
              </div>
            `,
            className: "gps-marker",
            iconSize: [50, 50],
            iconAnchor: [25, 25],
          });

          // Buat marker GPS baru
          const newGpsMarker = L.marker([lat, lng], {
            icon: gpsIcon,
            title: "LOKASI GPS ANDA",
            draggable: false,
            zIndexOffset: 1000,
          });

          // Tambahkan popup
          newGpsMarker.bindPopup(`
            <div style="max-width: 250px;">
              <strong style="color: #28a745;">
                <i class="bi bi-crosshair me-1"></i>LOKASI GPS ANDA
              </strong><br>
              <small>
                <b>Latitude:</b> ${lat.toFixed(7)}<br>
                <b>Longitude:</b> ${lng.toFixed(7)}<br>
                <b>Akurasi:</b> ±${Math.round(accuracy)} meter<br>
                <i>Diperoleh: ${new Date().toLocaleTimeString("id-ID")}</i>
              </small>
              <div class="mt-2">
                <button onclick="copyCoordinatesToClipboard('${lat.toFixed(7)}, ${lng.toFixed(7)}')" 
                        class="btn btn-sm btn-outline-success">
                  <i class="bi bi-clipboard me-1"></i>Salin Koordinat
                </button>
              </div>
            </div>
          `).openPopup();

          // Tambahkan ke peta
          newGpsMarker.addTo(mapInstance);

          // Update marker utama (jika ada)
          if (marker) {
            marker.setLatLng([lat, lng]);
            marker.setOpacity(0.7);
          }

          // Tambahkan circle akurasi
          if (config.showAccuracyCircle && accuracy > 0 && accuracy < 1000) {
            L.circle([lat, lng], {
              radius: accuracy,
              color: "#28a745",
              fillColor: "#28a745",
              fillOpacity: 0.1,
              weight: 1,
            }).addTo(mapInstance);
          }

          // Refresh peta
          setTimeout(() => {
            if (mapInstance && mapInstance.invalidateSize) {
              mapInstance.invalidateSize();
            }
          }, 100);

          resolve({
            lat,
            lng,
            accuracy,
            marker: newGpsMarker
          });

        } catch (error) {
          if (statusCallback) statusCallback('error', error.message);
          reject(error);
        }
      },
      
      // Error callback
      (error) => {
        let errorMessage = 'Gagal mendapatkan lokasi GPS';
        switch (error.code) {
          case 1:
            errorMessage = 'Izin lokasi ditolak';
            break;
          case 2:
            errorMessage = 'Lokasi tidak tersedia';
            break;
          case 3:
            errorMessage = 'Waktu pencarian habis';
            break;
        }
        
        if (statusCallback) statusCallback('error', errorMessage);
        reject(new Error(errorMessage));
      },
      
      // Options
      {
        enableHighAccuracy: config.enableHighAccuracy,
        timeout: config.timeout,
        maximumAge: config.maximumAge
      }
    );
  });
}

// Fungsi untuk setup Bootstrap validation
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
}

// Fungsi untuk validasi field individual
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
    // Pastikan showToast sudah tersedia secara global
    if (typeof showToast === 'function') {
        showToast(message, type, 3000);
    } else {
        // Fallback ke alert jika showToast tidak tersedia
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

function showFormAlert(message, type = 'danger', formId = 'formMessage') {
    const formMessage = document.getElementById(formId);
    if (!formMessage) return;
    
    formMessage.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show">
            <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}-fill me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // Auto dismiss untuk success/info
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            const alert = formMessage.querySelector('.alert');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 3000);
    }
    
    // Scroll ke alert
    formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function validatePhoneNumber(phoneNumber) {
    if (!phoneNumber) return { 
        valid: false, 
        message: 'Nomor WhatsApp harus diisi',
        cleanNoWA: ''
    };
    
    // Hapus semua karakter non-digit
    const cleanNoWA = phoneNumber.toString().replace(/\D/g, '');
    
    // Validasi panjang nomor
    if (cleanNoWA.length < 10) {
        return { 
            valid: false, 
            message: 'Nomor WhatsApp terlalu pendek (minimal 10 digit)',
            cleanNoWA: cleanNoWA
        };
    }
    
    if (cleanNoWA.length > 13) {
        return { 
            valid: false, 
            message: 'Nomor WhatsApp terlalu panjang (maksimal 15 digit)',
            cleanNoWA: cleanNoWA
        };
    }
    
    // Validasi tambahan: format 08 harus memiliki panjang yang tepat
    if (cleanNoWA.startsWith('08')) {
        const digitsAfter08 = cleanNoWA.substring(2);
        if (digitsAfter08.length < 8 || digitsAfter08.length > 10) {
            return { 
                valid: false, 
                message: 'Nomor WhatsApp dengan format 08 harus memiliki 10-12 digit total',
                cleanNoWA: cleanNoWA
            };
        }
    }
    
    return { valid: true, cleanNoWA: cleanNoWA };
}

export async function anggotaAdminPage() {
  const mainContent = document.getElementById("mainContent");

  // Pastikan modal container ada
  if (!document.getElementById("modalContainer")) {
    const modalContainer = document.createElement("div");
    modalContainer.id = "modalContainer";
    document.body.appendChild(modalContainer);
  }

  mainContent.innerHTML = `
    <div class="anggota-admin-page">
      <!-- Header dengan gradient hijau -->
      <div class="card border-success mb-4 shadow-sm">
        <div class="card-body p-4">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="text-success fw-bold mb-1">
                <i class="bi bi-people-fill me-2"></i>Manajemen Anggota
              </h2>
              <p class="text-muted mb-0">Kelola data anggota dan lihat lokasi pada peta</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Filter dan Search -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0">
                  <i class="bi bi-search text-success"></i>
                </span>
                <input type="text" id="searchAnggota" class="form-control border-start-0" placeholder="Cari nama/alamat...">
              </div>
            </div>
            <div class="col-md-3">
              <select id="filterStatus" class="form-select">
                <option value="">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="non-aktif">Non-Aktif</option>
              </select>
            </div>
            <div class="col-md-3">
              <select id="filterJenisSampah" class="form-select">
                <option value="">Semua Jenis Sampah</option>
                <option value="Rumah Tangga">Rumah Tangga</option>
                <option value="Tempat Usaha">Tempat Usaha</option>
              </select>
            </div>
            <div class="col-md-2">
              <button onclick="loadAnggotaWithMap()" class="btn btn-outline-success w-100">
                <i class="bi bi-funnel me-1"></i>Filter
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Peta Lokasi Anggota -->
      <div class="card border-success border-2 shadow-sm mb-4">
        <div class="card-header bg-success bg-opacity-10 border-bottom-0">
          <h5 class="card-title mb-0 text-success fw-semibold">
            <i class="bi bi-map me-2"></i>Peta Lokasi Anggota
          </h5>
          <small class="text-muted">Klik marker untuk melihat detail anggota</small>
        </div>
        <div class="card-body p-0">
          <div id="anggotaMap" style="height: 400px; border-radius: 0 0 8px 8px;"></div>
        </div>
      </div>
      
      <!-- Tabel Anggota -->
      <div class="card border-0 shadow-sm">
        <div class="card-body p-0">
          <div id="anggotaTableContainer" class="table-responsive">
            <div class="text-center py-5">
              <div class="spinner-border text-success" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-3 text-muted">Memuat data anggota...</p>
            </div>
          </div>
          <div id="anggotaPagination" class="p-3 border-top"></div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("searchAnggota").oninput = loadAnggotaWithMap;
  document.getElementById("filterStatus").onchange = loadAnggotaWithMap;
  document.getElementById("filterJenisSampah").onchange = loadAnggotaWithMap;

  // Load peta dan data anggota
  loadAnggotaWithMap();
}

let anggotaMapInstance = null;
let anggotaMarkers = [];

async function loadAnggotaWithMap() {
  const search = document.getElementById("searchAnggota")?.value || "";
  const filterStatus = document.getElementById("filterStatus")?.value || "";
  const filterJenisSampah =
    document.getElementById("filterJenisSampah")?.value || "";

  try {
    const anggota = await fetchAPI(API.anggota, {
      headers: getAuthHeaders(),
    });

    // Simpan semua data ke variabel global
    anggotaAllData = anggota.filter((a) => {
      const matchSearch =
        a.nama?.toLowerCase().includes(search.toLowerCase()) ||
        a.alamat?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || a.status === filterStatus;
      const matchJenis =
        !filterJenisSampah || a.jenisSampah === filterJenisSampah;
      return matchSearch && matchStatus && matchJenis;
    });

    // Reset ke halaman 1 saat filter berubah
    anggotaCurrentPage = 1;

    // Render tabel dan pagination
    renderAnggotaTable();
    renderAnggotaMap(anggotaAllData);
  } catch (error) {
    console.error("Error loading anggota:", error);
    document.getElementById("anggotaTableContainer").innerHTML = `
      <div class="alert alert-danger m-3">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        Error loading anggota: ${error.message}
      </div>
    `;
  }
}

function renderAnggotaMap(anggotaList) {
  const mapContainer = document.getElementById("anggotaMap");
  if (!mapContainer) return;

  // Hapus peta lama jika ada
  if (anggotaMapInstance) {
    anggotaMapInstance.remove();
    anggotaMapInstance = null;
  }

  // Hapus markers lama
  anggotaMarkers = [];

  // Setup container baru
  mapContainer.innerHTML = "";

  // Tunggu DOM update
  setTimeout(async () => {
    try {
      await ensureLeafletLoaded();

      if (anggotaList.length === 0) {
        mapContainer.innerHTML = `
          <div class="h-100 d-flex flex-column align-items-center justify-content-center bg-light">
            <i class="bi bi-map text-muted mb-3" style="font-size: 3rem;"></i>
            <p class="text-muted">Tidak ada data anggota untuk ditampilkan</p>
          </div>
        `;
        return;
      }

      // Inisialisasi peta
      anggotaMapInstance = L.map("anggotaMap").setView(
        [-10.1935921, 123.6149376],
        13
      );

      // Tambahkan tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(anggotaMapInstance);

      // Tambahkan markers
      const bounds = [];
      anggotaList.forEach((anggota) => {
        if (anggota.latitude && anggota.longitude) {
          const markerColor =
            anggota.status === "aktif" ? "#28a745" : "#dc3545";
          const markerIcon = L.divIcon({
            html: `
              <div style="
                background: ${markerColor};
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 16px;
                border: 3px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                cursor: pointer;
              ">
                ${anggota.nama?.charAt(0).toUpperCase() || "?"}
              </div>
            `,
            className: "anggota-marker",
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          });

          const marker = L.marker([anggota.latitude, anggota.longitude], {
            icon: markerIcon,
            riseOnHover: true,
          }).addTo(anggotaMapInstance).bindPopup(`
              <div class="popup-content" style="min-width: 250px;">
                <div class="d-flex align-items-center mb-2">
                  <div class="bg-success bg-opacity-10 p-2 rounded me-2">
                    <i class="bi bi-person-circle text-success"></i>
                  </div>
                  <div>
                    <h6 class="mb-0 fw-semibold">${
                      anggota.nama || "Tidak ada nama"
                    }</h6>
                    <small class="text-muted">ID: ${anggota.idAnggota}</small>
                  </div>
                </div>
                <div class="mb-2">
                  <small class="text-muted d-block">Alamat:</small>
                  <div class="small">${
                    anggota.alamat?.substring(0, 100) || "Tidak ada alamat"
                  }...</div>
                </div>
                <div class="row g-2 mb-2">
                  <div class="col-6">
                    <small class="text-muted d-block">Status:</small>
                    <span class="badge ${
                      anggota.status === "aktif" ? "bg-success" : "bg-danger"
                    }">
                      ${anggota.status === "aktif" ? "Aktif" : "Non-Aktif"}
                    </span>
                  </div>
                  <div class="col-6">
                    <small class="text-muted d-block">Jenis:</small>
                    <span class="badge bg-info">${
                      anggota.jenisSampah || "-"
                    }</span>
                  </div>
                </div>
                <div class="mt-3">
                  <button onclick="viewDetailFromMap(${anggota.idAnggota})" 
                          class="btn btn-sm btn-success w-100">
                    <i class="bi bi-eye me-1"></i>Lihat Detail
                  </button>
                </div>
              </div>
            `);

          anggotaMarkers.push(marker);
          bounds.push([anggota.latitude, anggota.longitude]);
        }
      });

      // Fit bounds jika ada markers
      if (bounds.length > 0) {
        anggotaMapInstance.fitBounds(bounds, { padding: [50, 50] });
      }

      // Fungsi untuk view detail dari popup
      window.viewDetailFromMap = viewDetail;
    } catch (error) {
      console.error("Error rendering map:", error);
      mapContainer.innerHTML = `
        <div class="h-100 d-flex flex-column align-items-center justify-content-center bg-light">
          <i class="bi bi-exclamation-triangle text-warning mb-3" style="font-size: 3rem;"></i>
          <p class="text-danger">Gagal memuat peta: ${error.message}</p>
        </div>
      `;
    }
  }, 100);
}

function renderAnggotaTable() {
  const container = document.getElementById("anggotaTableContainer");
  const paginationContainer = document.getElementById("anggotaPagination");

  if (!container) return;

  // Hitung data yang akan ditampilkan
  const totalData = anggotaAllData.length;
  const totalPages = Math.ceil(totalData / anggotaPerPage);

  // Validasi halaman saat ini
  if (anggotaCurrentPage > totalPages && totalPages > 0) {
    anggotaCurrentPage = totalPages;
  }

  // Ambil data untuk halaman saat ini
  const startIndex = (anggotaCurrentPage - 1) * anggotaPerPage;
  const endIndex = startIndex + anggotaPerPage;
  const currentPageData = anggotaAllData.slice(startIndex, endIndex);

  // Tampilkan pesan jika tidak ada data
  if (totalData === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-people text-muted mb-3" style="font-size: 3rem;"></i>
        <h5 class="text-muted">Tidak ada data anggota</h5>
        <p class="text-muted">Coba ubah filter pencarian</p>
      </div>
    `;
    paginationContainer.innerHTML = "";
    return;
  }

  // PERBAIKAN: Hitung nomor urut yang benar berdasarkan halaman
  const startNumber = startIndex + 1;

  // Buat tabel HTML
  const tableHTML = `
    <table class="table table-hover mb-0">
      <thead class="table-light">
        <tr>
          <th scope="col" width="60" class="ps-4">No</th>
          <th scope="col" class="ps-4">ID</th>
          <th scope="col">Nama</th>
          <th scope="col">Alamat</th>
          <th scope="col">No WA</th>
          <th scope="col">Status</th>
          <th scope="col">Koordinat</th>
          <th scope="col" class="text-center pe-4">Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${currentPageData
          .map(
            (anggota, index) => `
          <tr>
            <td class="ps-4 text-muted fw-semibold">
              ${startNumber + index} <!-- PERBAIKAN: Nomor urut yang benar -->
            </td>
            <td class="ps-4 fw-semibold">${anggota.idAnggota}</td>
            <td>
              <div class="d-flex align-items-center">
                <div class="bg-success bg-opacity-10 p-2 rounded me-2">
                  <i class="bi bi-person-circle text-success"></i>
                </div>
                <div>
                  <div class="fw-medium">${anggota.nama}</div>
                  <small class="text-muted">${anggota.jenisSampah}</small>
                </div>
              </div>
            </td>
            <td>${
              anggota.alamat ? anggota.alamat.substring(0, 30) + "..." : "-"
            }</td>
            <td>
              ${
                anggota.noWA
                  ? `
                <a href="https://wa.me/${anggota.noWA.replace(/[^0-9]/g, "")}" 
                   target="_blank" class="text-decoration-none">
                  <i class="bi bi-whatsapp text-success me-1"></i>${
                    anggota.noWA
                  }
                </a>
              `
                  : "-"
              }
            </td>
            <td>
              <span class="badge ${
                anggota.status === "aktif" ? "bg-success" : "bg-danger"
              }">
                ${anggota.status === "aktif" ? "Aktif" : "Non-Aktif"}
              </span>
            </td>
            <td>
              <small class="text-muted d-block">${
                anggota.latitude ? anggota.latitude.toFixed(4) : "-"
              }</small>
              <small class="text-muted">${
                anggota.longitude ? anggota.longitude.toFixed(4) : "-"
              }</small>
            </td>
            <td class="text-center pe-4">
              <div class="btn-group btn-group-sm" role="group">
                <button onclick="window.viewAnggotaDetail(${
                  anggota.idAnggota
                })" class="btn btn-outline-success">
                  <i class="bi bi-eye"></i>
                </button>
                <button onclick="window.editAnggota(${
                  anggota.idAnggota
                })" class="btn btn-outline-warning">
                  <i class="bi bi-pencil"></i>
                </button>
                <button onclick="window.deleteAnggota(${
                  anggota.idAnggota
                })" class="btn btn-outline-danger">
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
  `;

  container.innerHTML = tableHTML;

  // Render pagination
  renderPagination(totalPages);
  
  // Setup event listeners untuk tombol aksi
  setupTableActionListeners();
}

function renderPagination(totalPages) {
  const paginationContainer = document.getElementById("anggotaPagination");

  if (!paginationContainer) return;

  if (totalPages <= 1) {
    paginationContainer.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <small class="text-muted">Menampilkan semua data (${anggotaAllData.length} anggota)</small>
      </div>
    `;
    return;
  }

  const startData = (anggotaCurrentPage - 1) * anggotaPerPage + 1;
  const endData = Math.min(
    anggotaCurrentPage * anggotaPerPage,
    anggotaAllData.length
  );

  // Tentukan halaman yang akan ditampilkan (maksimal 5 halaman)
  let startPage = Math.max(1, anggotaCurrentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  // Buat array untuk tombol halaman
  const pageButtons = [];

  // Tombol Previous
  if (anggotaCurrentPage > 1) {
    pageButtons.push(`
      <li class="page-item">
        <button class="page-link" onclick="window.goToPage(${anggotaCurrentPage - 1})">
          <i class="bi bi-chevron-left"></i>
        </button>
      </li>
    `);
  } else {
    pageButtons.push(`
      <li class="page-item disabled">
        <span class="page-link">
          <i class="bi bi-chevron-left"></i>
        </span>
      </li>
    `);
  }

  // Tombol halaman
  for (let i = startPage; i <= endPage; i++) {
    if (i === anggotaCurrentPage) {
      pageButtons.push(`
        <li class="page-item active">
          <span class="page-link">${i}</span>
        </li>
      `);
    } else {
      pageButtons.push(`
        <li class="page-item">
          <button class="page-link" onclick="window.goToPage(${i})">${i}</button>
        </li>
      `);
    }
  }

  // Tombol Next
  if (anggotaCurrentPage < totalPages) {
    pageButtons.push(`
      <li class="page-item">
        <button class="page-link" onclick="window.goToPage(${anggotaCurrentPage + 1})">
          <i class="bi bi-chevron-right"></i>
        </button>
      </li>
    `);
  } else {
    pageButtons.push(`
      <li class="page-item disabled">
        <span class="page-link">
          <i class="bi bi-chevron-right"></i>
        </span>
      </li>
    `);
  }

  // Dropdown untuk pilih jumlah data per halaman
  const perPageOptions = [5, 10, 20, 50];
  const perPageOptionsHTML = perPageOptions
    .map(
      (option) =>
        `<option value="${option}" ${
          anggotaPerPage === option ? "selected" : ""
        }>${option}</option>`
    )
    .join("");

  paginationContainer.innerHTML = `
    <div class="d-flex flex-wrap justify-content-between align-items-center">
      <div class="mb-2 mb-md-0">
        <small class="text-muted">
          Menampilkan ${startData} - ${endData} dari ${
    anggotaAllData.length
  } anggota
        </small>
      </div>
      
      <div class="d-flex align-items-center">
        <div class="me-3 d-none d-md-block">
          <small class="text-muted me-2">Data per halaman:</small>
          <select id="anggotaPerPageSelect" class="form-select form-select-sm" style="width: auto;">
            ${perPageOptionsHTML}
          </select>
        </div>
        
        <nav>
          <ul class="pagination pagination-sm mb-0">
            ${pageButtons.join("")}
          </ul>
        </nav>
      </div>
    </div>
  `;

  // Setup event listener untuk dropdown per page
  setupPaginationListeners();
}

function setupPaginationListeners() {
  // Event listener untuk dropdown per page
  const perPageSelect = document.getElementById("anggotaPerPageSelect");
  if (perPageSelect) {
    perPageSelect.addEventListener("change", (e) => {
      anggotaPerPage = parseInt(e.target.value);
      anggotaCurrentPage = 1; // Reset ke halaman 1
      renderAnggotaTable();
    });
  }

  // Pastikan fungsi goToPage tersedia di window
  window.goToPage = (pageNumber) => {
    // Validasi page number
    if (pageNumber < 1 || pageNumber > Math.ceil(anggotaAllData.length / anggotaPerPage)) {
      return;
    }
    
    anggotaCurrentPage = pageNumber;
    renderAnggotaTable();

    // Scroll ke atas tabel
    const tableContainer = document.getElementById("anggotaTableContainer");
    if (tableContainer) {
      tableContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
}

function setupTableActionListeners() {
  // Pastikan fungsi aksi tersedia di window
  window.viewAnggotaDetail = viewDetail;
  window.editAnggota = editAnggota;
  window.deleteAnggota = deleteAnggota;
}

function changePage(pageNumber) {
  anggotaCurrentPage = pageNumber;
  renderAnggotaTable();

  // Scroll ke atas tabel
  const tableContainer = document.getElementById("anggotaTableContainer");
  if (tableContainer) {
    tableContainer.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function editAnggota(anggotaId) {
  try {
    const anggota = await fetchAPI(`${API.anggota}${anggotaId}/`, {
      headers: getAuthHeaders(),
    });

    // Format tanggal untuk input date
    const formatDateForInput = (dateString) => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
      } catch (error) {
        return "";
      }
    };

    // Cek apakah user ada dan ambil data lengkap jika perlu
    let userData = anggota.user;

    // Jika user hanya berupa ID (number), fetch data user
    if (typeof anggota.user === "number") {
      try {
        const user = await fetchAPI(`${API.users}${anggota.user}/`, {
          headers: getAuthHeaders(),
        });
        userData = user;
      } catch (error) {
        console.error("Error fetching user data:", error);
        userData = null;
      }
    }

    // Simpan nilai awal untuk komparasi nanti
    const initialValues = {
      nama: anggota.nama || "",
      alamat: anggota.alamat || "",
      noWA: anggota.noWA || "",
      latitude: anggota.latitude || 0,
      longitude: anggota.longitude || 0,
      tanggalStart: anggota.tanggalStart || "",
      tanggalEnd: anggota.tanggalEnd || "",
      status: anggota.status || "aktif",
      jenisSampah: anggota.jenisSampah || "Rumah Tangga",
      userId: userData ? userData.id : null
    };

    const formHTML = `
      <div class="anggota-form-container">
        <div class="row">
          <!-- Informasi User (Display Only) -->
          <div class="col-12 mb-4">
            <div class="card ${
              userData ? "border-info" : "border-warning"
            } border-2">
              <div class="card-header ${
                userData ? "bg-info" : "bg-warning"
              } bg-opacity-10">
                <h6 class="card-title mb-0 ${
                  userData ? "text-info" : "text-warning"
                }">
                  <i class="bi bi-person-badge me-2"></i>
                  ${
                    userData
                      ? "Informasi Akun User"
                      : "Peringatan: Tidak Ada Akun User"
                  }
                </h6>
              </div>
              <div class="card-body">
                ${
                  userData
                    ? `
                <div class="row">
                  <div class="col-md-4">
                    <div class="d-flex align-items-center">
                      <div class="${
                        userData.is_active ? "bg-info" : "bg-secondary"
                      } bg-opacity-10 p-3 rounded-circle me-3">
                        <i class="bi bi-person-fill ${
                          userData.is_active ? "text-info" : "text-secondary"
                        } fs-4"></i>
                      </div>
                      <div>
                        <h5 class="mb-0">${
                          userData.username || "Tidak ada username"
                        }</h5>
                        <small class="text-muted">Username</small>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <p class="mb-1"><strong>Email:</strong></p>
                    <p class="text-muted">${
                      userData.email || "Tidak ada email"
                    }</p>
                  </div>
                  <div class="col-md-4">
                    <p class="mb-1"><strong>Status:</strong></p>
                    <span class="badge ${
                      userData.is_active ? "bg-success" : "bg-secondary"
                    }">
                      ${userData.is_active ? "Aktif" : "Non-Aktif"}
                    </span>
                  </div>
                </div>
                <input type="hidden" id="user" value="${userData.id}">
                `
                    : `
                <div class="alert alert-warning">
                  <div class="d-flex align-items-center">
                    <i class="bi bi-exclamation-triangle fs-4 me-3"></i>
                    <div>
                      <h6 class="alert-heading mb-2">Anggota ini belum memiliki akun user</h6>
                      <p class="mb-0">
                        Hubungkan dengan akun user yang sudah ada
                      </p>
                    </div>
                  </div>
                  <div class="mt-3">
                    <label for="userSelect" class="form-label">Pilih User yang ada:</label>
                    <select id="userSelect" class="form-select" required>
                      <option value="">Pilih User...</option>
                      <!-- Options akan diisi via JavaScript -->
                    </select>
                    <div class="valid-feedback">Valid.</div>
                    <div class="invalid-feedback">Silakan pilih user.</div>
                  </div>
                </div>
                `
                }
              </div>
            </div>
          </div>
          
          <!-- Form Edit Anggota -->
          <div class="col-lg-6">
            <div class="card h-100 border-warning border-2">
              <div class="card-header bg-warning bg-opacity-10">
                <h6 class="card-title mb-0 text-warning">
                  <i class="bi bi-person-lines-fill me-2"></i>Informasi Anggota
                </h6>
              </div>
              <div class="card-body">
                <form id="anggotaFormEdit" class="needs-validation" novalidate>
                  <div class="mb-3">
                    <label for="nama" class="form-label">
                      <i class="bi bi-card-text me-1"></i>Nama Lengkap *
                    </label>
                    <input type="text" id="nama" class="form-control" 
                           placeholder="Masukkan nama lengkap" 
                           value="${anggota.nama || ""}" required>
                    <div class="valid-feedback">Valid.</div>
                    <div class="invalid-feedback">Silakan isi nama lengkap.</div>
                  </div>
                  
                  <div class="mb-3">
                    <label for="alamat" class="form-label">
                      <i class="bi bi-house me-1"></i>Alamat *
                    </label>
                    <textarea id="alamat" class="form-control" rows="3" 
                              placeholder="Masukkan alamat lengkap" required>${
                                anggota.alamat || ""
                              }</textarea>
                    <div class="valid-feedback">Valid.</div>
                    <div class="invalid-feedback">Silakan isi alamat.</div>
                  </div>
                  
                  <div class="mb-3">
                    <label for="noWA" class="form-label">
                      <i class="bi bi-whatsapp me-1"></i>Nomor WhatsApp *
                    </label>
                    <input type="text" id="noWA" maxlength="12" class="form-control" 
                           placeholder="Contoh: 081234567890" 
                           value="${anggota.noWA || ""}" required>
                    <div class="valid-feedback">Valid.</div>
                    <div class="invalid-feedback">Silakan isi nomor WhatsApp.</div>
                  </div>
                  
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label for="tanggalStart" class="form-label">
                        <i class="bi bi-calendar-plus me-1"></i>Tanggal Mulai *
                      </label>
                      <input type="date" id="tanggalStart" class="form-control" 
                             value="${formatDateForInput(
                               anggota.tanggalStart
                             )}" required>
                      <div class="valid-feedback">Valid.</div>
                      <div class="invalid-feedback">Silakan pilih tanggal start.</div>
                    </div>
                    <div class="col-md-6">
                      <label for="tanggalEnd" class="form-label">
                        <i class="bi bi-calendar-minus me-1"></i>Tanggal Berakhir *
                      </label>
                      <input type="date" id="tanggalEnd" class="form-control" 
                             value="${formatDateForInput(
                               anggota.tanggalEnd
                             )}" required>
                      <div class="valid-feedback">Valid.</div>
                      <div class="invalid-feedback">Silakan pilih tanggal end.</div>
                    </div>
                  </div>
                  
                  <div class="row g-3 mt-3">
                    <div class="col-md-6">
                      <label for="status" class="form-label">
                        <i class="bi bi-check-circle me-1"></i>Status *
                      </label>
                      <select id="status" class="form-select" required>
                        <option value="">Pilih Status</option>
                        <option value="aktif" ${
                          anggota.status === "aktif" ? "selected" : ""
                        }>Aktif</option>
                        <option value="non-aktif" ${
                          anggota.status === "non-aktif" ? "selected" : ""
                        }>Non-Aktif</option>
                      </select>
                      <div class="valid-feedback">Valid.</div>
                      <div class="invalid-feedback">Silakan pilih status.</div>
                    </div>
                    <div class="col-md-6">
                      <label for="jenisSampah" class="form-label">
                        <i class="bi bi-trash me-1"></i>Jenis Sampah *
                      </label>
                      <select id="jenisSampah" class="form-select" required>
                        <option value="">Pilih Jenis</option>
                        <option value="Rumah Tangga" ${
                          anggota.jenisSampah === "Rumah Tangga"
                            ? "selected"
                            : ""
                        }>Rumah Tangga</option>
                        <option value="Tempat Usaha" ${
                          anggota.jenisSampah === "Tempat Usaha"
                            ? "selected"
                            : ""
                        }>Tempat Usaha</option>
                      </select>
                      <div class="valid-feedback">Valid.</div>
                      <div class="invalid-feedback">Silakan pilih jenis sampah.</div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
          
          <!-- Peta Lokasi -->
          <div class="col-lg-6">
            <div class="card h-100 border-warning border-2">
              <div class="card-header bg-warning bg-opacity-10">
                <div class="d-flex justify-content-between align-items-center">
                  <h6 class="card-title mb-0 text-warning">
                    <i class="bi bi-geo-alt me-2"></i>Lokasi di Peta
                  </h6>
                  <div>
                    <button type="button" id="btnGetGPSLocationEdit" class="btn btn-warning btn-sm me-2">
                      <i class="bi bi-crosshair me-1"></i>Lokasi Saya
                    </button>
                    <button type="button" onclick="setAnggotaEditLocation(${
                      anggota.latitude || -10.1935921
                    }, ${anggota.longitude || 123.6149376}, 'Lokasi Asli')" 
                            class="btn btn-outline-warning btn-sm">
                      <i class="bi bi-arrow-return-left me-1"></i>Reset
                    </button>
                  </div>
                </div>
              </div>
              
              <div class="card-body">
                <!-- Status GPS -->
                <div id="gpsStatusEdit" class="mb-2">
                  <div id="gpsLoadingEdit" style="display: none;">
                    <span class="spinner-border spinner-border-sm text-warning me-2"></span>
                    <small class="text-warning">Mendapatkan lokasi...</small>
                  </div>
                  <div id="gpsSuccessEdit" style="display: none;">
                    <i class="bi bi-check-circle-fill text-success me-1"></i>
                    <small class="text-success">Lokasi GPS diterapkan</small>
                  </div>
                  <div id="gpsErrorEdit" style="display: none;">
                    <i class="bi bi-exclamation-circle-fill text-danger me-1"></i>
                    <small class="text-danger">Gagal mendapatkan lokasi</small>
                  </div>
                </div>
                
                <div class="alert alert-info mb-3">
                  <i class="bi bi-info-circle me-2"></i>
                  <strong>Instruksi:</strong> Klik di peta untuk mengubah lokasi. 
                  Gunakan tombol "Lokasi Saya" untuk GPS atau tombol lain untuk lokasi cepat.
                </div>
                
                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label for="latitude" class="form-label">Latitude *</label>
                    <div class="input-group">
                      <input type="number" step="any" id="latitude" 
                             class="form-control" value="${
                               anggota.latitude || ""
                             }" required>
                      <button type="button" class="btn btn-outline-secondary" 
                              onclick="copyAnggotaEditToClipboard('latitude')">
                        <i class="bi bi-clipboard"></i>
                      </button>
                      <div class="valid-feedback">Valid.</div>
                      <div class="invalid-feedback">Silakan klik peta untuk memilih lokasi.</div>
                    </div>
                    <small class="text-muted">Format: -10.1711872</small>
                  </div>
                  <div class="col-md-6">
                    <label for="longitude" class="form-label">Longitude *</label>
                    <div class="input-group">
                      <input type="number" step="any" id="longitude" 
                             class="form-control" value="${
                               anggota.longitude || ""
                             }" required>
                      <button type="button" class="btn btn-outline-secondary" 
                              onclick="copyAnggotaEditToClipboard('longitude')">
                        <i class="bi bi-clipboard"></i>
                      </button>
                      <div class="valid-feedback">Valid.</div>
                      <div class="invalid-feedback">Silakan klik peta untuk memilih lokasi.</div>
                    </div>
                    <small class="text-muted">Format: 123.6149376</small>
                  </div>
                </div>
                
                <!-- Lokasi Cepat -->
                <div class="mb-3">
                  <label class="form-label">
                    <i class="bi bi-lightning-charge me-1"></i>Lokasi Cepat
                  </label>
                  <div class="d-flex flex-wrap gap-2">
                    <button type="button" class="btn btn-outline-primary btn-sm"
                            onclick="setAnggotaEditLocation(-10.1711872, 123.6149376, 'Lokasi Saya')">
                      <i class="bi bi-house me-1"></i> Lokasi Saya
                    </button>
                    <button type="button" class="btn btn-outline-success btn-sm"
                            onclick="setAnggotaEditLocation(-10.1935921, 123.6149376, 'Kota Kupang')">
                      <i class="bi bi-geo-alt me-1"></i> Kota Kupang
                    </button>
                    <button type="button" class="btn btn-outline-info btn-sm"
                            onclick="setAnggotaEditLocation(${
                              anggota.latitude || -10.1711872
                            }, ${
                              anggota.longitude || 123.6149376
                            }, 'Lokasi Asli')">
                      <i class="bi bi-arrow-return-left me-1"></i> Lokasi Asli
                    </button>
                  </div>
                </div>
                
                <div id="mapContainerAnggotaEdit" 
                     style="height: 300px; border-radius: 8px; border: 1px solid #dee2e6;"
                     class="position-relative">
                  <div id="mapLoadingEdit" class="text-center py-5">
                    <div class="spinner-border text-warning" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2 text-muted">Memuat peta...</p>
                  </div>
                  <div id="mapErrorEdit" class="d-none text-center py-5">
                    <i class="bi bi-exclamation-triangle text-warning fs-1"></i>
                    <p class="mt-2">Peta tidak dapat dimuat</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Error Message -->
        <div id="formMessageEdit" class="mt-4"></div>
      </div>
    `;

    showModal(`Edit Anggota: ${anggota.nama}`, formHTML, async () => {
      // Dapatkan form
      const form = document.getElementById('anggotaFormEdit');
      
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

      // Validasi tambahan untuk nomor WhatsApp
      const phoneValidation = validatePhoneNumber(document.getElementById("noWA").value);
      if (!phoneValidation.valid) {
        showFormToast(
          `<strong>Error:</strong> ${phoneValidation.message}`,
          'error'
        );
        const noWAInput = document.getElementById('noWA');
        noWAInput.classList.add('is-invalid');
        noWAInput.focus();
        return false;
      }

      // Validasi tanggal
      const tanggalStart = new Date(document.getElementById("tanggalStart").value);
      const tanggalEnd = new Date(document.getElementById("tanggalEnd").value);

      if (tanggalEnd < tanggalStart) {
        showFormToast(
          "<strong>Error:</strong> Tanggal End tidak boleh lebih awal dari Tanggal Start.",
          'error'
        );
        const tanggalEndInput = document.getElementById('tanggalEnd');
        tanggalEndInput.classList.add('is-invalid');
        tanggalEndInput.focus();
        return false;
      }

      // Validasi koordinat
      const latitude = parseFloat(document.getElementById("latitude").value);
      const longitude = parseFloat(document.getElementById("longitude").value);

      if (isNaN(latitude) || isNaN(longitude)) {
        showFormToast(
          "<strong>Error:</strong> Koordinat tidak valid. Klik peta untuk memilih lokasi.",
          'error'
        );
        const latitudeInput = document.getElementById('latitude');
        latitudeInput.classList.add('is-invalid');
        latitudeInput.focus();
        return false;
      }

      // Handle user jika tidak ada
      let userId;
      if (userData) {
        userId = userData.id;
      } else {
        // Ambil dari dropdown jika ada
        const userSelect = document.getElementById("userSelect");
        userId = userSelect ? parseInt(userSelect.value) : null;
        
        if (!userId) {
          showFormToast(
            "<strong>Error:</strong> Anggota harus terhubung dengan akun user.",
            'error'
          );
          const userSelectInput = document.getElementById('userSelect');
          userSelectInput.classList.add('is-invalid');
          userSelectInput.focus();
          return false;
        }
      }

      // Kumpulkan data yang akan diupdate
      const currentValues = {
        nama: document.getElementById("nama").value,
        alamat: document.getElementById("alamat").value,
        noWA: phoneValidation.cleanNoWA,
        latitude: latitude,
        longitude: longitude,
        tanggalStart: document.getElementById("tanggalStart").value,
        tanggalEnd: document.getElementById("tanggalEnd").value,
        status: document.getElementById("status").value,
        jenisSampah: document.getElementById("jenisSampah").value,
        userId: userId
      };

      console.log("Data awal:", initialValues);
      console.log("Data sekarang:", currentValues);

      // Cek apakah ada perubahan data
      const hasChanges = 
        currentValues.nama !== initialValues.nama ||
        currentValues.alamat !== initialValues.alamat ||
        currentValues.noWA !== initialValues.noWA ||
        Math.abs(currentValues.latitude - initialValues.latitude) > 0.00001 ||
        Math.abs(currentValues.longitude - initialValues.longitude) > 0.00001 ||
        currentValues.tanggalStart !== initialValues.tanggalStart ||
        currentValues.tanggalEnd !== initialValues.tanggalEnd ||
        currentValues.status !== initialValues.status ||
        currentValues.jenisSampah !== initialValues.jenisSampah ||
        (currentValues.userId && currentValues.userId !== initialValues.userId);

      console.log("Ada perubahan?", hasChanges);

      if (!hasChanges) {
        showFormToast(
          "Tidak ada perubahan data yang dilakukan. Simpan dibatalkan.",
          'warning'
        );
        return false; // Jangan tutup modal
      }

      // Siapkan data untuk API
      const anggotaData = {
        ...(userId && { user: userId }),
        nama: currentValues.nama,
        alamat: currentValues.alamat,
        noWA: currentValues.noWA,
        latitude: currentValues.latitude,
        longitude: currentValues.longitude,
        tanggalStart: currentValues.tanggalStart,
        tanggalEnd: currentValues.tanggalEnd,
        status: currentValues.status,
        jenisSampah: currentValues.jenisSampah,
      };

      // Tampilkan loading
      showFormToast(
        "Menyimpan perubahan data anggota...",
        'info'
      );

      try {
        await fetchAPI(`${API.anggota}${anggotaId}/`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(anggotaData),
        });

        showToast(
          `✅ Berhasil! Data anggota "${currentValues.nama}" berhasil diperbarui.`,
          'success', 5000
        );

        // Refresh data setelah 2 detik
        setTimeout(() => {
          loadAnggotaWithMap();
          closeModal();
        }, 2000);

        return true;
        
      } catch (error) {
        console.error("Error updating anggota:", error);
        showToast(
          `<strong>Error:</strong> ${error.message}`,
          'error',
          3000
        );
        return false;
      }
    });

    // Jika tidak ada user, load user list untuk dropdown
    if (!userData) {
      setTimeout(() => {
        loadUsersForDropdown();
      }, 300);
    }

    // Inisialisasi peta setelah modal ditampilkan
    setTimeout(() => {
      initializeAnggotaMapEdit(anggota.latitude, anggota.longitude);
      
      // Setup Bootstrap validation untuk form
      setupFormValidation();

      // Setup event listener untuk tombol GPS edit
      setTimeout(() => {
        const btnGPSEdit = document.getElementById("btnGetGPSLocationEdit");
        if (btnGPSEdit) {
          btnGPSEdit.onclick = () => getGPSLocationForAnggotaEdit();
        }
      }, 500);
    }, 300);
    
  } catch (error) {
    console.error("Error loading anggota data:", error);
    showToast(
      `<strong>Error:</strong> Gagal memuat data anggota: ${error.message}`,
      'error',
      3000
    );
  }
}

window.resetToOriginalLocation = function() {
  // Mendapatkan koordinat asli dari form
  const latInput = document.getElementById("latitude");
  const lngInput = document.getElementById("longitude");
  
  if (!latInput || !lngInput) return;
  
  // Ambil nilai asli sebelum diubah
  const originalLat = parseFloat(latInput.defaultValue || latInput.dataset.original || latInput.value);
  const originalLng = parseFloat(lngInput.defaultValue || lngInput.dataset.original || lngInput.value);
  
  if (isNaN(originalLat) || isNaN(originalLng)) {
    showEditFormMessage(`
      <div class="alert alert-warning alert-dismissible fade show">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <strong>Tidak dapat reset!</strong> Koordinat asli tidak ditemukan.
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `);
    return;
  }
  
  // Update koordinat
  updateAnggotaEditCoordinates(originalLat.toFixed(7), originalLng.toFixed(7));
  
  // Update peta
  if (anggotaEditFormMap) {
    anggotaEditFormMap.setView([originalLat, originalLng], 15);
    
    // Update marker
    if (anggotaEditFormMarker) {
      anggotaEditFormMarker.setLatLng([originalLat, originalLng]);
      anggotaEditFormMarker.setOpacity(1);
    }
    
    // Hapus marker GPS jika ada
    if (anggotaEditFormGPSMarker && anggotaEditFormMap.hasLayer(anggotaEditFormGPSMarker)) {
      anggotaEditFormMap.removeLayer(anggotaEditFormGPSMarker);
      anggotaEditFormGPSMarker = null;
    }
    
    updateAnggotaEditGPSStatus("manual");
    
    // Refresh peta
    setTimeout(() => {
      if (anggotaEditFormMap && anggotaEditFormMap.invalidateSize) {
        anggotaEditFormMap.invalidateSize();
      }
    }, 100);
  }
  
  showEditFormMessage(`
    <div class="alert alert-info alert-dismissible fade show">
      <i class="bi bi-check-circle-fill me-2"></i>
      <strong>Lokasi direset!</strong> Kembali ke koordinat asli.
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `);
};

// Fungsi untuk copy ke clipboard
window.copyToClipboard = function (inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.select();
    document.execCommand("copy");

    // Tampilkan feedback
    const originalValue = input.value;
    input.value = "✓ Disalin!";
    setTimeout(() => {
      input.value = originalValue;
    }, 1000);

    showFormMessage(`
      <div class="alert alert-success alert-dismissible fade show">
        <i class="bi bi-check-circle-fill me-2"></i>
        <strong>Berhasil disalin!</strong>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `);
  }
};

// Helper function untuk menunggu elemen
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkElement = () => {
      // Gunakan querySelector untuk menerima selector CSS
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error(`Element ${selector} not found after ${timeout}ms`));
        return;
      }

      setTimeout(checkElement, 100);
    };

    checkElement();
  });
}

// Fungsi untuk load users ke dropdown
async function loadUsersForDropdown() {
  try {
    const users = await fetchAPI(API.users, { headers: getAuthHeaders() });
    const userSelect = document.getElementById("userSelect");

    if (userSelect) {
      // Filter user yang belum memiliki anggota (anggota atau tamu)
      // Catatan: Anda perlu implementasi untuk cek user sudah punya anggota atau tidak
      const availableUsers = users.filter(
        (u) => (u.role === "anggota" || u.role === "tamu") && u.is_active
      );

      if (availableUsers.length === 0) {
        userSelect.innerHTML = `
          <option value="">Tidak ada user yang tersedia</option>
          <option value="" disabled>
            Semua user sudah memiliki data anggota atau tidak aktif
          </option>
        `;
        return;
      }

      const options = availableUsers
        .map(
          (u) =>
            `<option value="${u.id}">
          ${u.username} - ${u.email || "no email"} (${u.role})
        </option>`
        )
        .join("");

      userSelect.innerHTML =
        `<option value="">Pilih User...</option>` + options;
    }
  } catch (error) {
    console.error("Error loading users for dropdown:", error);
  }
}

// Fungsi untuk inisialisasi peta di form edit
async function initializeAnggotaMapEdit(defaultLat, defaultLng) {
  const containerId = "mapContainerAnggotaEdit";
  const selector = `#${containerId}`; // Tambahkan # untuk selector CSS
  const latInputId = "latitude";
  const lngInputId = "longitude";

  const container = document.getElementById(containerId);
  if (!container) return;

  const loadingDiv = document.getElementById("mapLoadingEdit");
  const errorDiv = document.getElementById("mapErrorEdit");

  if (loadingDiv) loadingDiv.classList.remove("d-none");
  if (errorDiv) errorDiv.classList.add("d-none");

  try {
    await ensureLeafletLoaded();

    // Tunggu hingga container siap - PERBAIKAN: gunakan selector dengan #
    await waitForElement(selector);

    if (container.clientHeight === 0) {
      container.style.height = "300px";
    }

    // Hapus peta lama jika ada
    if (anggotaEditFormMap) {
      anggotaEditFormMap.remove();
      anggotaEditFormMap = null;
    }

    // Gunakan koordinat anggota sebagai default
    const lat = parseFloat(defaultLat) || -10.1935921;
    const lng = parseFloat(defaultLng) || 123.6149376;
    const formattedLat = lat.toFixed(7);
    const formattedLng = lng.toFixed(7);

    // Buat peta baru
    anggotaEditFormMap = L.map(containerId).setView([lat, lng], 15);

    // Tambahkan tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(anggotaEditFormMap);

    // Buat marker untuk lokasi saat ini
    anggotaEditFormMarker = L.marker([lat, lng], {
      draggable: true,
      title: "Lokasi Anggota",
    }).addTo(anggotaEditFormMap);

    // Tambahkan popup
    anggotaEditFormMarker
      .bindPopup(
        `
      <div style="max-width: 200px;">
        <strong>📍 Lokasi Anggota</strong><br>
        <small>
          Lat: ${formattedLat}<br>
          Lng: ${formattedLng}<br>
          <em>Drag untuk mengubah lokasi</em>
        </small>
      </div>
    `
      )
      .openPopup();

    // Event untuk drag marker
    anggotaEditFormMarker.on("dragend", function (e) {
      const position = anggotaEditFormMarker.getLatLng();
      const newLat = position.lat.toFixed(7);
      const newLng = position.lng.toFixed(7);

      updateAnggotaEditCoordinates(newLat, newLng);

      // Hapus marker GPS jika ada
      if (
        anggotaEditFormGPSMarker &&
        anggotaEditFormMap.hasLayer(anggotaEditFormGPSMarker)
      ) {
        anggotaEditFormMap.removeLayer(anggotaEditFormGPSMarker);
        anggotaEditFormGPSMarker = null;
      }

      updateAnggotaEditGPSStatus("manual");
    });

    // Event untuk klik peta
    anggotaEditFormMap.on("click", function (e) {
      const { lat, lng } = e.latlng;
      const formattedLat = lat.toFixed(7);
      const formattedLng = lng.toFixed(7);

      updateAnggotaEditCoordinates(formattedLat, formattedLng);
      anggotaEditFormMarker.setLatLng([lat, lng]);

      // Hapus marker GPS jika ada
      if (
        anggotaEditFormGPSMarker &&
        anggotaEditFormMap.hasLayer(anggotaEditFormGPSMarker)
      ) {
        anggotaEditFormMap.removeLayer(anggotaEditFormGPSMarker);
        anggotaEditFormGPSMarker = null;
      }

      updateAnggotaEditGPSStatus("manual");
    });

    // Setup event listener untuk tombol GPS (tambahkan tombol di HTML edit form)
    const btnGPS = document.getElementById("btnGetGPSLocationEdit");
    if (btnGPS) {
      btnGPS.onclick = () => getGPSLocationForAnggotaEdit();
    }

    // Setup event listener untuk input change
    document
      .getElementById(latInputId)
      .addEventListener("input", updateEditMarkerFromInputs);
    document
      .getElementById(lngInputId)
      .addEventListener("input", updateEditMarkerFromInputs);

    if (loadingDiv) loadingDiv.classList.add("d-none");

    console.log("Anggota edit map initialized successfully");
  } catch (error) {
    console.error("Failed to initialize edit map:", error);

    if (loadingDiv) loadingDiv.classList.add("d-none");
    if (errorDiv) errorDiv.classList.remove("d-none");

    // Set default values if map fails
    const latInput = document.getElementById(latInputId);
    const lngInput = document.getElementById(lngInputId);

    if (latInput && !latInput.value) {
      latInput.value = defaultLat || "-10.1935921";
    }
    if (lngInput && !lngInput.value) {
      lngInput.value = defaultLng || "123.6149376";
    }
  }
}

async function getGPSLocationForAnggotaEdit() {
  const btnGPS = document.getElementById("btnGetGPSLocationEdit");
  
  if (!btnGPS || !anggotaEditFormMap) {
    showEditFormMessage(`
      <div class="alert alert-danger alert-dismissible fade show">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <strong>Error!</strong> Peta belum siap atau tombol tidak ditemukan.
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `);
    return;
  }

  // Simpan state tombol
  const originalText = btnGPS.innerHTML;
  btnGPS.disabled = true;
  btnGPS.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Mendapatkan lokasi...';

  try {
    const result = await renderGPSForMap(
      anggotaEditFormMap,
      anggotaEditFormMarker,
      anggotaEditFormGPSMarker,
      (status, data) => {
        updateAnggotaEditGPSStatus(status, data);
      },
      {
        moveToLocation: true,
        zoomLevel: 16,
        showAccuracyCircle: true
      }
    );

    // Update koordinat di form edit
    updateAnggotaEditCoordinates(result.lat.toFixed(7), result.lng.toFixed(7));
    
    // Simpan reference ke marker GPS
    anggotaEditFormGPSMarker = result.marker;

    // Tampilkan pesan sukses
    showEditFormMessage(`
      <div class="alert alert-success alert-dismissible fade show">
        <i class="bi bi-check-circle-fill me-2"></i>
        <strong>Lokasi GPS Berhasil Diambil!</strong>
        <small class="d-block">
          Latitude: ${result.lat.toFixed(7)}<br>
          Longitude: ${result.lng.toFixed(7)}<br>
          Akurasi: ±${Math.round(result.accuracy)} meter
        </small>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `);

  } catch (error) {
    console.error("GPS Error:", error);
    
    showEditFormMessage(`
      <div class="alert alert-danger alert-dismissible fade show">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <strong>${error.message || 'Gagal mendapatkan lokasi GPS'}</strong>
        <small class="d-block">
          Pastikan browser memiliki akses lokasi dan GPS perangkat aktif.
        </small>
        <div class="mt-2">
          <button onclick="useManualLocationFallback()" class="btn btn-sm btn-outline-secondary">
            <i class="bi bi-geo-alt me-1"></i>Gunakan Lokasi Default
          </button>
        </div>
      </div>
    `);
    
    updateAnggotaEditGPSStatus('error');
    
  } finally {
    // Reset tombol
    btnGPS.disabled = false;
    btnGPS.innerHTML = originalText;
  }
}

window.copyCoordinatesToClipboard = async function(coordinates) {
  try {
    await navigator.clipboard.writeText(coordinates);
    showToast('Koordinat berhasil disalin ke clipboard', 'success', 2000);
  } catch (err) {
    console.error('Gagal menyalin koordinat:', err);
    showToast('Gagal menyalin koordinat', 'error', 2000);
  }
};

// Fungsi fallback jika GPS gagal
function useManualLocationFallback() {
  // Default lokasi jika GPS gagal
  const fallbackLat = -10.1935921;
  const fallbackLng = 123.6149376;

  updateAnggotaEditCoordinates(fallbackLat.toFixed(7), fallbackLng.toFixed(7));

  if (anggotaEditFormMap) {
    anggotaEditFormMap.setView([fallbackLat, fallbackLng], 15);

    if (anggotaEditFormMarker) {
      anggotaEditFormMarker.setLatLng([fallbackLat, fallbackLng]);
      anggotaEditFormMarker.setOpacity(1);
    }
  }

  showEditFormMessage(`
    <div class="alert alert-warning alert-dismissible fade show">
      <i class="bi bi-info-circle-fill me-2"></i>
      <strong>Menggunakan Lokasi Default</strong>
      <small class="d-block">Lokasi Kota Kupang: ${fallbackLat.toFixed(
        7
      )}, ${fallbackLng.toFixed(7)}</small>
      <small>Anda masih bisa mengklik peta untuk mengubah lokasi manual.</small>
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `);
}

// Fungsi untuk membersihkan circle akurasi
function clearAccuracyCircles() {
  if (window.accuracyCircles && window.accuracyCircles.length > 0) {
    window.accuracyCircles.forEach((circle) => {
      if (circle && circle.remove) {
        circle.remove();
      }
    });
    window.accuracyCircles = [];
  }
}

// Panggil clearAccuracyCircles saat modal ditutup
if (typeof showModal === "function") {
  const originalShowModal = showModal;
  window.showModal = function (title, content, onConfirm, onCancel) {
    // Clear circles sebelum modal baru dibuka
    clearAccuracyCircles();
    return originalShowModal(title, content, onConfirm, onCancel);
  };
}

function updateAnggotaEditCoordinates(lat, lng) {
  const latInput = document.getElementById("latitude");
  const lngInput = document.getElementById("longitude");

  if (latInput && lngInput) {
    latInput.value = lat;
    lngInput.value = lng;
    
    // Tandai bahwa koordinat telah diubah
    latInput.dataset.changed = "true";
    lngInput.dataset.changed = "true";
  }
}

function updateEditMarkerFromInputs() {
  if (!anggotaEditFormMap) return;

  const lat = parseFloat(document.getElementById("latitude").value);
  const lng = parseFloat(document.getElementById("longitude").value);

  if (isNaN(lat) || isNaN(lng)) return;

  if (anggotaEditFormMarker) {
    anggotaEditFormMarker.setLatLng([lat, lng]);
  }

  anggotaEditFormMap.setView([lat, lng], anggotaEditFormMap.getZoom());
}

function updateAnggotaEditGPSStatus(status, coordinates = null) {
  const loadingEl = document.getElementById("gpsLoadingEdit");
  const successEl = document.getElementById("gpsSuccessEdit");
  const errorEl = document.getElementById("gpsErrorEdit");

  if (!loadingEl || !successEl || !errorEl) return;

  // Reset semua status
  loadingEl.style.display = "none";
  successEl.style.display = "none";
  errorEl.style.display = "none";

  // Tampilkan status yang sesuai
  switch (status) {
    case "loading":
      loadingEl.style.display = "block";
      break;
    case "success":
      if (coordinates) {
        successEl.innerHTML = `
          <i class="bi bi-check-circle-fill text-success me-1"></i>
          <small class="text-success">📍 Lokasi GPS diterapkan! (${coordinates.lat}, ${coordinates.lng})</small>
        `;
      } else {
        successEl.innerHTML = `
          <i class="bi bi-check-circle-fill text-success me-1"></i>
          <small class="text-success">📍 Lokasi GPS diterapkan!</small>
        `;
      }
      successEl.style.display = "block";
      break;
    case "error":
      errorEl.style.display = "block";
      break;
    case "manual":
      successEl.innerHTML = `
        <i class="bi bi-geo-alt-fill text-primary me-1"></i>
        <small class="text-primary">📍 Lokasi dipilih manual di peta</small>
      `;
      successEl.style.display = "block";
      break;
  }
}

function showEditFormMessage(message) {
  const formMessage = document.getElementById("formMessageEdit");
  if (formMessage) {
    formMessage.innerHTML = message;

    // Auto dismiss setelah 3 detik
    setTimeout(() => {
      if (formMessage.innerHTML === message) {
        formMessage.innerHTML = "";
      }
    }, 3000);
  }
}

function chatWhatsApp(phoneNumber, message = "") {
  if (!phoneNumber) {
    alert("Nomor WhatsApp tidak tersedia");
    return;
  }

  const formattedPhone = phoneNumber.replace(/\D/g, "");
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${formattedPhone}${
    message ? `?text=${encodedMessage}` : ""
  }`;
  window.open(whatsappUrl, "_blank");
}

function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch (error) {
    return dateString;
  }
}

function isExpired(tanggalEnd) {
  if (!tanggalEnd) return false;
  try {
    const endDate = new Date(tanggalEnd);
    const today = new Date();
    return endDate < today;
  } catch (error) {
    return false;
  }
}

function showLocationMap(latitude, longitude, nama) {
  const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  window.open(mapsUrl, "_blank");
}

// Fungsi viewDetail dengan event delegation
async function viewDetail(anggotaId) {
  try {
    const anggota = await fetchAPI(`${API.anggota}${anggotaId}/`, {
      headers: getAuthHeaders(),
    });

    // Generate HTML untuk peta
    const mapHTML = anggota.latitude && anggota.longitude ? `
      <div class="col-12 mt-3">
        <div class="card border-success">
          <div class="card-header bg-success bg-opacity-10 py-2">
            <h6 class="mb-0"><i class="bi bi-map me-2"></i>Peta Lokasi</h6>
          </div>
          <div class="card-body p-0">
            <div id="detailMap-${anggotaId}" 
                 style="height: 300px; border-radius: 0 0 8px 8px;">
              <div class="h-100 d-flex align-items-center justify-content-center">
                <div class="text-center">
                  <div class="spinner-border text-success" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  <p class="mt-2 text-muted">Memuat peta...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ` : `
      <div class="col-12 mt-3">
        <div class="card border-warning">
          <div class="card-header bg-warning bg-opacity-10 py-2">
            <h6 class="mb-0"><i class="bi bi-map me-2"></i>Peta Lokasi</h6>
          </div>
          <div class="card-body">
            <div class="text-center py-4">
              <i class="bi bi-geo-alt text-warning fs-1 mb-3"></i>
              <p class="text-muted">Lokasi belum ditentukan</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Tampilkan modal dengan detail anggota yang benar
    showModal(
      `Detail Anggota: ${anggota.nama}`,
      `
        <div class="detail-container">
          <div class="row">
            <!-- Kolom Kiri - Foto dan Info Dasar -->
            <div class="col-md-4">
              <div class="text-center mb-4">
                <div class="bg-success bg-gradient rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                     style="width: 100px; height: 100px; font-size: 40px;">
                  <i class="bi bi-person-fill text-white"></i>
                </div>
                <h4 class="fw-bold">${anggota.nama || "-"}</h4>
                <span class="badge ${
                  anggota.status === "aktif" ? "bg-success" : "bg-danger"
                } fs-6">
                  ${anggota.status === "aktif" ? "Aktif" : "Non-Aktif"}
                </span>
                
                <div class="mt-3 d-grid">
                  ${
                    anggota.noWA
                      ? `
                    <button class="btn btn-success mb-2" onclick="chatWhatsApp('${
                      anggota.noWA
                    }', 'Halo ${
                          anggota.nama || ""
                        }, ini dari admin Bank Sampah')">
                      <i class="bi bi-whatsapp me-1"></i>Chat via WhatsApp
                    </button>
                  `
                      : ""
                  }
                  
                  ${
                    anggota.latitude && anggota.longitude
                      ? `
                    <button class="btn btn-outline-primary" onclick="window.open('https://www.google.com/maps?q=${anggota.latitude},${anggota.longitude}', '_blank')">
                      <i class="bi bi-geo-alt me-1"></i>Lihat di Maps
                    </button>
                  `
                      : ""
                  }
                </div>
              </div>
              
              <div class="card border-success mb-3">
                <div class="card-header bg-success bg-opacity-10 py-2">
                  <h6 class="mb-0"><i class="bi bi-qr-code me-2"></i>ID Anggota</h6>
                </div>
                <div class="card-body text-center py-3">
                  <div class="bg-light rounded-3 p-3">
                    <div class="font-monospace fs-4 fw-bold">${
                      anggota.idAnggota || "N/A"
                    }</div>
                    <small class="text-muted">ID Unik Anggota</small>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Kolom Kanan - Detail Lengkap -->
            <div class="col-md-8">
              <div class="row g-3">
                <!-- Informasi Kontak -->
                <div class="col-12">
                  <div class="card border-primary">
                    <div class="card-header bg-primary bg-opacity-10 py-2">
                      <h6 class="mb-0"><i class="bi bi-person-lines-fill me-2"></i>Informasi Kontak</h6>
                    </div>
                    <div class="card-body">
                      <div class="row">
                        <div class="col-md-6 mb-2">
                          <strong><i class="bi bi-whatsapp text-success me-2"></i>WhatsApp</strong>
                          <div class="mt-1">${anggota.noWA || "-"}</div>
                        </div>
                        <div class="col-md-6 mb-2">
                          <strong><i class="bi bi-geo-alt text-danger me-2"></i>Jenis Sampah</strong>
                          <div class="mt-1">
                            <span class="badge ${
                              anggota.jenisSampah === "Rumah Tangga"
                                ? "bg-info"
                                : "bg-warning"
                            }">
                              ${anggota.jenisSampah || "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Alamat Lengkap -->
                <div class="col-12">
                  <div class="card border-warning">
                    <div class="card-header bg-warning bg-opacity-10 py-2">
                      <h6 class="mb-0"><i class="bi bi-house-door me-2"></i>Alamat Lengkap</h6>
                    </div>
                    <div class="card-body">
                      <p class="mb-0">${
                        anggota.alamat || "Alamat belum diisi"
                      }</p>
                    </div>
                  </div>
                </div>
                
                <!-- Koordinat Lokasi -->
                <div class="col-md-6">
                  <div class="card border-info">
                    <div class="card-header bg-info bg-opacity-10 py-2">
                      <h6 class="mb-0"><i class="bi bi-geo me-2"></i>Koordinat</h6>
                    </div>
                    <div class="card-body">
                      <div class="row g-2">
                        <div class="col-12">
                          <strong>Latitude</strong>
                          <div class="input-group input-group-sm mt-1">
                            <input type="text" class="form-control" value="${
                              anggota.latitude || "0"
                            }" readonly>
                            <button class="btn btn-outline-secondary" onclick="copyToClipboardValue('${
                              anggota.latitude || ""
                            }')">
                              <i class="bi bi-clipboard"></i>
                            </button>
                          </div>
                        </div>
                        <div class="col-12">
                          <strong>Longitude</strong>
                          <div class="input-group input-group-sm mt-1">
                            <input type="text" class="form-control" value="${
                              anggota.longitude || "0"
                            }" readonly>
                            <button class="btn btn-outline-secondary" onclick="copyToClipboardValue('${
                              anggota.longitude || ""
                            }')">
                              <i class="bi bi-clipboard"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Periode Keanggotaan -->
                <div class="col-md-6">
                  <div class="card border-success">
                    <div class="card-header bg-success bg-opacity-10 py-2">
                      <h6 class="mb-0"><i class="bi bi-calendar me-2"></i>Periode Keanggotaan</h6>
                    </div>
                    <div class="card-body">
                      <div class="row">
                        <div class="col-12 mb-2">
                          <strong>Mulai</strong>
                          <div class="mt-1">${formatDate(
                            anggota.tanggalStart
                          )}</div>
                        </div>
                        <div class="col-12 mb-2">
                          <strong>Berakhir</strong>
                          <div class="mt-1">
                            ${formatDate(anggota.tanggalEnd)}
                            ${
                              isExpired(anggota.tanggalEnd)
                                ? '<span class="badge bg-danger ms-1">Kedaluwarsa</span>'
                                : ""
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Peta Lokasi (ditambahkan) -->
                ${mapHTML}
              
              <!-- Tombol Aksi -->
              <div class="mt-4 pt-3 border-top">
                <div class="d-flex flex-wrap gap-2">
                  <button class="btn btn-success" onclick="editAnggota(${anggotaId})">
                    <i class="bi bi-pencil me-1"></i>Edit Anggota
                  </button>
                  <button class="btn btn-danger ms-auto" onclick="deleteAnggota(${anggotaId})">
                    <i class="bi bi-trash me-1"></i>Hapus Anggota
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
      null,
      () => {
        // Callback ketika modal ditutup
        if (window.location.hash.includes("/anggota/")) {
          window.location.hash = "#/anggota";
        }
      }
    );

    // Load peta setelah modal ditampilkan (jika ada koordinat)
    if (anggota.latitude && anggota.longitude) {
      setTimeout(() => {
        loadDetailMap(anggota);
      }, 500);
    }

    window.location.hash = `#/anggota/${anggotaId}`;
  } catch (error) {
    console.error("Error loading detail:", error);
    showModal(
      "Error",
      `
        <div class="text-center py-4">
          <i class="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
          <h5 class="text-danger">Gagal Memuat Detail Anggota</h5>
          <p class="text-muted">${
            error.message || "Terjadi kesalahan saat memuat data"
          }</p>
          <button class="btn btn-primary mt-3" onclick="anggotaAdminPage()">
            Kembali ke Daftar Anggota
          </button>
        </div>
      `,
      null
    );
  }
}

// Fungsi untuk load peta di detail
// Fungsi untuk load peta di detail
async function loadDetailMap(anggota) {
  const mapId = `detailMap-${anggota.idAnggota}`;
  const selector = `#${mapId}`; // Ini yang benar
  
  try {
    await ensureLeafletLoaded();
    
    // Tunggu element tersedia - FIX: gunakan selector yang benar
    await waitForElement(selector);
    
    const lat = parseFloat(anggota.latitude);
    const lng = parseFloat(anggota.longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      throw new Error("Koordinat tidak valid");
    }
    
    // Inisialisasi peta
    const map = L.map(mapId).setView([lat, lng], 15);
    
    // Simpan peta ke variabel global untuk akses nanti
    if (!window.detailMaps) window.detailMaps = {};
    window.detailMaps[mapId] = map;
    
    // Tambahkan tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    
    // Tambahkan marker dengan warna berdasarkan status
    const markerColor = anggota.status === "aktif" ? "#28a745" : "#dc3545";
    const markerIcon = L.divIcon({
      html: `
        <div style="
          background: ${markerColor};
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 18px;
          border: 3px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        ">
          ${anggota.nama?.charAt(0).toUpperCase() || "?"}
        </div>
      `,
      className: "detail-marker",
      iconSize: [50, 50],
      iconAnchor: [25, 25],
    });
    
    const marker = L.marker([lat, lng], {
      icon: markerIcon,
    }).addTo(map);
    
    // Tambahkan popup dengan info anggota
    marker.bindPopup(`
      <div style="min-width: 200px;">
        <div class="d-flex align-items-center mb-2">
          <div class="bg-success bg-opacity-10 p-2 rounded me-2">
            <i class="bi bi-person-circle text-success"></i>
          </div>
          <div>
            <h6 class="mb-0 fw-semibold">${anggota.nama || 'Tidak ada nama'}</h6>
            <small class="text-muted">ID: ${anggota.idAnggota}</small>
          </div>
        </div>
        <div class="mb-2">
          <small class="text-muted">Alamat:</small>
          <div class="small">${anggota.alamat?.substring(0, 80) || 'Tidak ada alamat'}...</div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-6">
            <small class="text-muted">Status:</small>
            <span class="badge ${anggota.status === 'aktif' ? 'bg-success' : 'bg-danger'}">
              ${anggota.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
            </span>
          </div>
          <div class="col-6">
            <small class="text-muted">Jenis:</small>
            <span class="badge bg-info">${anggota.jenisSampah || '-'}</span>
          </div>
        </div>
        <div class="mt-2">
          <small class="text-muted">Koordinat:</small>
          <div class="font-monospace small">${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
        </div>
      </div>
    `).openPopup();
    
    // Tambahkan tombol kontrol di sudut kanan atas peta
    const controlDiv = L.DomUtil.create('div', 'leaflet-control leaflet-bar');
    
    const control = L.control({ position: 'topright' });
    control.onAdd = function(map) {
      return controlDiv;
    };
    control.addTo(map);
    
    console.log("Detail map loaded successfully");
    
  } catch (error) {
    console.error("Error loading detail map:", error);
    const mapContainer = document.getElementById(mapId);
    if (mapContainer) {
      mapContainer.innerHTML = `
        <div class="h-100 d-flex flex-column align-items-center justify-content-center bg-light">
          <i class="bi bi-exclamation-triangle text-warning mb-3" style="font-size: 3rem;"></i>
          <h6 class="mb-0 text-danger">Peta tidak dapat dimuat</h6>
          <p class="text-muted small">Koordinat: ${anggota.latitude}, ${anggota.longitude}</p>
          <button onclick="retryLoadDetailMap(${JSON.stringify(anggota)})" 
                  class="btn btn-warning btn-sm mt-2">
            <i class="bi bi-arrow-clockwise me-1"></i>Coba Lagi
          </button>
        </div>
      `;
    }
  }
}

// Fungsi untuk retry load peta
window.retryLoadDetailMap = function(anggota) {
  loadDetailMap(anggota);
};


window.resetViewDetailMap = function(mapId, lat, lng) {
  const map = window.detailMaps ? window.detailMaps[mapId] : null;
  if (map) {
    map.setView([lat, lng], 15);
  }
};

// Fungsi helper untuk copy ke clipboard
window.copyToClipboardValue = function (value) {
  if (!value) return;

  navigator.clipboard
    .writeText(value)
    .then(() => {
      // Tampilkan feedback sederhana
      const originalTitle = document.title;
      document.title = "✓ Disalin!";
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    })
    .catch((err) => {
      console.error("Gagal menyalin: ", err);
    });
};

// Fungsi helper untuk format currency (tambahkan jika belum ada)
function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID").format(amount);
}

async function deleteAnggota(anggotaId) {
  try {
    // Ambil data anggota untuk mendapatkan nama
    const anggota = await fetchAPI(`${API.anggota}${anggotaId}/`, {
      headers: getAuthHeaders(),
    });
    
    showConfirmModal(
      `
        <div class="text-center py-3">
          <i class="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
          <h5 class="text-danger">Hapus Anggota</h5>
          <p class="text-muted">Apakah Anda yakin ingin menghapus anggota ini?</p>
          <div class="alert alert-warning mt-3">
            <i class="bi bi-person me-2"></i><strong>${anggota.nama}</strong><br>
            <small>ID: ${anggota.idAnggota}</small>
          </div>
          <small class="text-muted d-block">Data yang telah dihapus tidak dapat dikembalikan.</small>
        </div>
      `,
      async () => {
        try {
          await fetchAPI(`${API.anggota}${anggotaId}/`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });

          // Gunakan toast untuk notifikasi sukses
          showToast(`Anggota ${anggota.nama} berhasil dihapus`, 'success', 5000);
          
          // Refresh data
          loadAnggotaWithMap();
          
        } catch (error) {
          console.error("Error deleting anggota:", error);
          showToast(`Gagal menghapus anggota: ${error.message}`, 'danger', 5000);
        }
      }
    );
  } catch (error) {
    console.error("Error loading anggota for deletion:", error);
    showNotif(`Gagal memuat data anggota: ${error.message}`, 'danger');
  }
}

// anggota.js - Tambahkan routing
function handleRoute() {
  const hash = window.location.hash;

  // Routing untuk detail anggota
  const detailMatch = hash.match(/#\/anggota\/(\d+)/);
  if (detailMatch) {
    const anggotaId = detailMatch[1];
    renderDetailPage(anggotaId); // Fungsi untuk merender halaman detail
  }
  // Routing untuk daftar anggota
  else if (hash === "#/anggota") {
    renderAnggotaList(); // Fungsi untuk merender daftar
  }
}

// Panggil saat hash berubah
window.addEventListener("hashchange", handleRoute);
window.editAnggota = editAnggota;
window.viewDetail = viewDetail;
window.deleteAnggota = deleteAnggota;
window.changePage = changePage;

// Panggil saat pertama kali load
document.addEventListener("DOMContentLoaded", handleRoute);
export { viewDetail, chatWhatsApp, formatDate, isExpired, showLocationMap };
