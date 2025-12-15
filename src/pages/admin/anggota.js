import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { showModal, showConfirmModal } from "../../utils/modal.js";
import { ensureLeafletLoaded, initMapForm } from "../../utils/mapConfig.js";


export async function anggotaAdminPage() {
  const mainContent = document.getElementById("mainContent");
  
  // Pastikan modal container ada
  if (!document.getElementById('modalContainer')) {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modalContainer';
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
            <button id="addAnggotaBtn" class="btn btn-success">
              <i class="bi bi-plus-circle me-1"></i>Tambah Anggota
            </button>
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
        </div>
      </div>
    </div>
  `;

  document.getElementById("addAnggotaBtn").onclick = () => showAddAnggotaForm();
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
  const filterJenisSampah = document.getElementById("filterJenisSampah")?.value || "";

  try {
    const anggota = await fetchAPI(API.anggota, {
      headers: getAuthHeaders(),
    });

    const filteredAnggota = anggota.filter((a) => {
      const matchSearch =
        a.nama?.toLowerCase().includes(search.toLowerCase()) ||
        a.alamat?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || a.status === filterStatus;
      const matchJenis =
        !filterJenisSampah || a.jenisSampah === filterJenisSampah;
      return matchSearch && matchStatus && matchJenis;
    });

    renderAnggotaTable(filteredAnggota);
    renderAnggotaMap(filteredAnggota);
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
      anggotaMapInstance = L.map("anggotaMap").setView([-10.1935921, 123.6149376], 13);

      // Tambahkan tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(anggotaMapInstance);

      // Tambahkan markers
      const bounds = [];
      anggotaList.forEach((anggota) => {
        if (anggota.latitude && anggota.longitude) {
          const markerColor = anggota.status === "aktif" ? "#28a745" : "#dc3545";
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
          })
            .addTo(anggotaMapInstance)
            .bindPopup(`
              <div class="popup-content" style="min-width: 250px;">
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
                  <small class="text-muted d-block">Alamat:</small>
                  <div class="small">${anggota.alamat?.substring(0, 100) || 'Tidak ada alamat'}...</div>
                </div>
                <div class="row g-2 mb-2">
                  <div class="col-6">
                    <small class="text-muted d-block">Status:</small>
                    <span class="badge ${anggota.status === 'aktif' ? 'bg-success' : 'bg-danger'}">
                      ${anggota.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </div>
                  <div class="col-6">
                    <small class="text-muted d-block">Jenis:</small>
                    <span class="badge bg-info">${anggota.jenisSampah || '-'}</span>
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

function renderAnggotaTable(anggotaList) {
  const container = document.getElementById("anggotaTableContainer");

  if (anggotaList.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-people text-muted mb-3" style="font-size: 3rem;"></i>
        <h5 class="text-muted">Tidak ada data anggota</h5>
        <p class="text-muted">Coba ubah filter pencarian</p>
      </div>
    `;
    return;
  }

  const tableHTML = `
    <table class="table table-hover mb-0">
      <thead class="table-light">
        <tr>
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
        ${anggotaList.map((anggota) => `
          <tr>
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
            <td>${anggota.alamat.substring(0, 30)}...</td>
            <td>
              <a href="https://wa.me/${anggota.noWA.replace(/[^0-9]/g, '')}" 
                 target="_blank" class="text-decoration-none">
                <i class="bi bi-whatsapp text-success me-1"></i>${anggota.noWA}
              </a>
            </td>
            <td>
              <span class="badge ${anggota.status === 'aktif' ? 'bg-success' : 'bg-danger'}">
                ${anggota.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
              </span>
            </td>
            <td>
              <small class="text-muted d-block">${anggota.latitude ? anggota.latitude.toFixed(4) : '-'}</small>
              <small class="text-muted">${anggota.longitude ? anggota.longitude.toFixed(4) : '-'}</small>
            </td>
            <td class="text-center pe-4">
              <div class="btn-group btn-group-sm" role="group">
                <button onclick="viewDetail(${anggota.idAnggota})" class="btn btn-outline-success">
                  <i class="bi bi-eye"></i>
                </button>
                <button onclick="editAnggota(${anggota.idAnggota})" class="btn btn-outline-warning">
                  <i class="bi bi-pencil"></i>
                </button>
                <button onclick="deleteAnggota(${anggota.idAnggota})" class="btn btn-outline-danger">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  container.innerHTML = tableHTML;

  // Attach fungsi ke window
  window.viewDetail = viewDetail;
  window.editAnggota = editAnggota;
  window.deleteAnggota = deleteAnggota;
}

function showAddAnggotaForm() {
  fetchAPI(API.users, { headers: getAuthHeaders() })
    .then((users) => {
      const userOptions = users
        .filter((u) => u.role === "anggota" || u.role === "tamu")
        .map(
          (u) => `<option value="${u.id}">${u.username} (${u.role})</option>`
        )
        .join("");

      const formHTML = `
        <div class="anggota-form-container">
          <div class="row g-4">
            <!-- Informasi Anggota -->
            <div class="col-lg-6">
              <div class="card h-100 border-success border-2">
                <div class="card-header bg-success bg-opacity-10">
                  <h6 class="card-title mb-0 text-success">
                    <i class="bi bi-person-badge me-2"></i>Informasi Anggota
                  </h6>
                </div>
                <div class="card-body">
                  <form id="anggotaForm">
                    <div class="mb-3">
                      <label for="user" class="form-label">
                        <i class="bi bi-person me-1"></i>User *
                      </label>
                      <select id="user" class="form-select" required>
                        <option value="">Pilih User</option>
                        ${userOptions}
                      </select>
                    </div>
                    
                    <div class="mb-3">
                      <label for="nama" class="form-label">
                        <i class="bi bi-card-text me-1"></i>Nama *
                      </label>
                      <input type="text" id="nama" class="form-control" required>
                    </div>
                    
                    <div class="mb-3">
                      <label for="alamat" class="form-label">
                        <i class="bi bi-house me-1"></i>Alamat *
                      </label>
                      <textarea id="alamat" class="form-control" rows="3" required></textarea>
                    </div>
                    
                    <div class="mb-3">
                      <label for="noWA" class="form-label">
                        <i class="bi bi-whatsapp me-1"></i>No WhatsApp *
                      </label>
                      <input type="text" id="noWA" class="form-control" required>
                    </div>
                    
                    <div class="row g-3">
                      <div class="col-md-6">
                        <label for="tanggalStart" class="form-label">
                          <i class="bi bi-calendar-plus me-1"></i>Tanggal Start *
                        </label>
                        <input type="date" id="tanggalStart" class="form-control" required>
                      </div>
                      <div class="col-md-6">
                        <label for="tanggalEnd" class="form-label">
                          <i class="bi bi-calendar-minus me-1"></i>Tanggal End *
                        </label>
                        <input type="date" id="tanggalEnd" class="form-control" required>
                      </div>
                    </div>
                    
                    <div class="row g-3 mt-3">
                      <div class="col-md-6">
                        <label for="status" class="form-label">
                          <i class="bi bi-check-circle me-1"></i>Status *
                        </label>
                        <select id="status" class="form-select" required>
                          <option value="aktif">Aktif</option>
                          <option value="non-aktif">Non-Aktif</option>
                        </select>
                      </div>
                      <div class="col-md-6">
                        <label for="jenisSampah" class="form-label">
                          <i class="bi bi-trash me-1"></i>Jenis Sampah *
                        </label>
                        <select id="jenisSampah" class="form-select" required>
                          <option value="Rumah Tangga">Rumah Tangga</option>
                          <option value="Tempat Usaha">Tempat Usaha</option>
                        </select>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            
            <!-- Peta Lokasi -->
            <div class="col-lg-6">
              <div class="card h-100 border-success border-2">
                <div class="card-header bg-success bg-opacity-10">
                  <h6 class="card-title mb-0 text-success">
                    <i class="bi bi-geo-alt me-2"></i>Pilih Lokasi di Peta
                  </h6>
                </div>
                <div class="card-body">
                  <div class="alert alert-info mb-3">
                    <i class="bi bi-info-circle me-2"></i>
                    <strong>Instruksi:</strong> Klik di peta untuk memilih lokasi. 
                    Koordinat akan otomatis terisi.
                  </div>
                  
                  <div class="row g-3 mb-3">
                    <div class="col-md-6">
                      <label for="latitude" class="form-label">Latitude *</label>
                      <input type="number" step="any" id="latitude" 
                             class="form-control" required 
                             placeholder="Klik peta untuk mengisi">
                    </div>
                    <div class="col-md-6">
                      <label for="longitude" class="form-label">Longitude *</label>
                      <input type="number" step="any" id="longitude" 
                             class="form-control" required 
                             placeholder="Klik peta untuk mengisi">
                    </div>
                  </div>
                  
                  <div id="mapContainerAnggota" 
                       style="height: 300px; border-radius: 8px; border: 1px solid #dee2e6;"
                       class="position-relative">
                    <div id="mapLoading" class="text-center py-5">
                      <div class="spinner-border text-success" role="status">
                        <span class="visually-hidden">Loading...</span>
                      </div>
                      <p class="mt-2 text-muted">Memuat peta...</p>
                    </div>
                    <div id="mapError" class="d-none text-center py-5">
                      <i class="bi bi-exclamation-triangle text-warning fs-1"></i>
                      <p class="mt-2">Peta tidak dapat dimuat</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Error Message -->
          <div id="formMessage" class="mt-4"></div>
        </div>
      `;

      showModal(
        "Tambah Anggota Baru",
        formHTML,
        async () => {
          // Validasi form
          const messageDiv = document.getElementById("formMessage");
          messageDiv.innerHTML = "";
          messageDiv.className = "alert";

          // Validasi required fields
          const requiredFields = ['user', 'nama', 'alamat', 'noWA', 'latitude', 'longitude', 
                                  'tanggalStart', 'tanggalEnd', 'status', 'jenisSampah'];
          
          const missingFields = [];
          for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field?.value?.trim()) {
              missingFields.push(fieldId);
            }
          }

          if (missingFields.length > 0) {
            messageDiv.className = "alert alert-danger";
            messageDiv.innerHTML = `<strong>Perhatian:</strong> Field berikut harus diisi: ${missingFields.join(', ')}`;
            return;
          }

          // Validasi koordinat
          const latitude = parseFloat(document.getElementById("latitude").value);
          const longitude = parseFloat(document.getElementById("longitude").value);
          
          if (isNaN(latitude) || isNaN(longitude)) {
            messageDiv.className = "alert alert-danger";
            messageDiv.innerHTML = "<strong>Error:</strong> Koordinat tidak valid. Klik peta untuk memilih lokasi.";
            return;
          }

          // Validasi tanggal
          const tanggalStart = new Date(document.getElementById("tanggalStart").value);
          const tanggalEnd = new Date(document.getElementById("tanggalEnd").value);
          
          if (tanggalEnd < tanggalStart) {
            messageDiv.className = "alert alert-danger";
            messageDiv.innerHTML = "<strong>Error:</strong> Tanggal End tidak boleh lebih awal dari Tanggal Start.";
            return;
          }

          // Siapkan data
          const anggotaData = {
            user: parseInt(document.getElementById("user").value),
            nama: document.getElementById("nama").value,
            alamat: document.getElementById("alamat").value,
            noWA: document.getElementById("noWA").value,
            latitude: latitude,
            longitude: longitude,
            tanggalStart: document.getElementById("tanggalStart").value,
            tanggalEnd: document.getElementById("tanggalEnd").value,
            status: document.getElementById("status").value,
            jenisSampah: document.getElementById("jenisSampah").value,
          };

          console.log("Data yang akan dikirim:", anggotaData);

          // Tampilkan loading
          messageDiv.className = "alert alert-info";
          messageDiv.innerHTML = "Menyimpan data anggota...";

          try {
            await fetchAPI(API.anggota, {
              method: "POST",
              headers: getAuthHeaders(),
              body: JSON.stringify(anggotaData),
            });

            messageDiv.className = "alert alert-success";
            messageDiv.innerHTML = `
              <div class="d-flex align-items-center">
                <i class="bi bi-check-circle-fill fs-4 me-2"></i>
                <div>
                  <strong>Berhasil!</strong> Anggota berhasil ditambahkan.
                </div>
              </div>
            `;

            // Tunggu 2 detik lalu tutup modal dan refresh
            setTimeout(() => {
              loadAnggotaWithMap();
            }, 2000);

          } catch (error) {
            console.error("Error saving anggota:", error);
            messageDiv.className = "alert alert-danger";
            messageDiv.innerHTML = `
              <div class="d-flex align-items-center">
                <i class="bi bi-exclamation-triangle-fill fs-4 me-2"></i>
                <div>
                  <strong>Error:</strong> ${error.message}
                </div>
              </div>
            `;
          }
        }
      );

      // Inisialisasi peta setelah modal ditampilkan
      setTimeout(() => {
        initializeAnggotaMap();
      }, 300);

    })
    .catch((error) => {
      console.error("Error loading users:", error);
      showModal(
        "Error",
        `
          <div class="text-center py-4">
            <i class="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
            <h5 class="text-danger">Gagal Memuat Data User</h5>
            <p class="text-muted">${error.message}</p>
          </div>
        `,
        null
      );
    });
}

// Fungsi untuk inisialisasi peta di form
async function initializeAnggotaMap() {
  const containerId = 'mapContainerAnggota';
  const latInputId = 'latitude';
  const lngInputId = 'longitude';
  
  const container = document.getElementById(containerId);
  if (!container) return;

  const loadingDiv = document.getElementById('mapLoading');
  const errorDiv = document.getElementById('mapError');
  
  if (loadingDiv) loadingDiv.classList.remove('d-none');
  if (errorDiv) errorDiv.classList.add('d-none');

  try {
    await ensureLeafletLoaded();
    
    // Tunggu hingga container siap
    await waitForElement(containerId);
    
    if (container.clientHeight === 0) {
      container.style.height = '300px';
    }

    const map = await initMapForm(
      containerId,
      latInputId,
      lngInputId,
      -10.1935921,  // Default latitude Kupang
      123.6149376,   // Default longitude Kupang
      13             // Zoom level
    );

    if (loadingDiv) loadingDiv.classList.add('d-none');
    window.anggotaMap = map;
    
    console.log("Anggota map initialized successfully");

  } catch (error) {
    console.error("Failed to initialize map:", error);
    
    if (loadingDiv) loadingDiv.classList.add('d-none');
    if (errorDiv) errorDiv.classList.remove('d-none');
    
    // Fallback: set default values
    const latInput = document.getElementById(latInputId);
    const lngInput = document.getElementById(lngInputId);
    
    if (latInput && lngInput) {
      latInput.value = "-10.1935921";
      lngInput.value = "123.6149376";
    }
  }
}

// Helper function untuk menunggu elemen
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkElement = () => {
      const element = document.getElementById(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Element #${selector} not found after ${timeout}ms`));
        return;
      }
      
      setTimeout(checkElement, 100);
    };
    
    checkElement();
  });
}

// Fungsi-fungsi lainnya tetap sama (editAnggota, viewDetail, deleteAnggota)
// Hanya perlu update styling untuk konsistensi dengan Bootstrap

async function editAnggota(anggotaId) {
  try {
    const anggota = await fetchAPI(`${API.anggota}${anggotaId}/`, {
      headers: getAuthHeaders(),
    });

    // DEBUG: Lihat struktur data anggota
    console.log('Anggota data:', anggota);
    console.log('User data:', anggota.user);

    // Format tanggal untuk input date
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      } catch (error) {
        return '';
      }
    };

    // Cek apakah user ada dan ambil data lengkap jika perlu
    let userData = anggota.user;
    
    // Jika user hanya berupa ID (number), fetch data user
    if (typeof anggota.user === 'number') {
      try {
        const user = await fetchAPI(`${API.users}${anggota.user}/`, {
          headers: getAuthHeaders(),
        });
        userData = user;
      } catch (error) {
        console.error('Error fetching user data:', error);
        userData = null;
      }
    }

    const formHTML = `
      <div class="anggota-form-container">
        <div class="row">
          <!-- Informasi User (Display Only) -->
          <div class="col-12 mb-4">
            <div class="card ${userData ? 'border-info' : 'border-warning'} border-2">
              <div class="card-header ${userData ? 'bg-info' : 'bg-warning'} bg-opacity-10">
                <h6 class="card-title mb-0 ${userData ? 'text-info' : 'text-warning'}">
                  <i class="bi bi-person-badge me-2"></i>
                  ${userData ? 'Informasi Akun User' : 'Peringatan: Tidak Ada Akun User'}
                </h6>
              </div>
              <div class="card-body">
                ${userData ? `
                <div class="row">
                  <div class="col-md-4">
                    <div class="d-flex align-items-center">
                      <div class="${userData.is_active ? 'bg-info' : 'bg-secondary'} bg-opacity-10 p-3 rounded-circle me-3">
                        <i class="bi bi-person-fill ${userData.is_active ? 'text-info' : 'text-secondary'} fs-4"></i>
                      </div>
                      <div>
                        <h5 class="mb-0">${userData.username || 'Tidak ada username'}</h5>
                        <small class="text-muted">Username</small>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <p class="mb-1"><strong>Email:</strong></p>
                    <p class="text-muted">${userData.email || 'Tidak ada email'}</p>
                  </div>
                  <div class="col-md-4">
                    <p class="mb-1"><strong>Status:</strong></p>
                    <span class="badge ${userData.is_active ? 'bg-success' : 'bg-secondary'}">
                      ${userData.is_active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </div>
                </div>
                <input type="hidden" id="user" value="${userData.id}">
                ` : `
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
                    <select id="userSelect" class="form-select">
                      <option value="">Pilih User...</option>
                      <!-- Options akan diisi via JavaScript -->
                    </select>
                  </div>
                </div>
                `}
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
                <form id="anggotaFormEdit">
                  <div class="mb-3">
                    <label for="nama" class="form-label">
                      <i class="bi bi-card-text me-1"></i>Nama Lengkap *
                    </label>
                    <input type="text" id="nama" class="form-control" value="${anggota.nama || ''}" required>
                  </div>
                  
                  <div class="mb-3">
                    <label for="alamat" class="form-label">
                      <i class="bi bi-house me-1"></i>Alamat *
                    </label>
                    <textarea id="alamat" class="form-control" rows="3" required>${anggota.alamat || ''}</textarea>
                  </div>
                  
                  <div class="mb-3">
                    <label for="noWA" class="form-label">
                      <i class="bi bi-whatsapp me-1"></i>Nomor WhatsApp *
                    </label>
                    <input type="text" id="noWA" class="form-control" value="${anggota.noWA || ''}" required>
                  </div>
                  
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label for="tanggalStart" class="form-label">
                        <i class="bi bi-calendar-plus me-1"></i>Tanggal Mulai *
                      </label>
                      <input type="date" id="tanggalStart" class="form-control" 
                             value="${formatDateForInput(anggota.tanggalStart)}" required>
                    </div>
                    <div class="col-md-6">
                      <label for="tanggalEnd" class="form-label">
                        <i class="bi bi-calendar-minus me-1"></i>Tanggal Berakhir *
                      </label>
                      <input type="date" id="tanggalEnd" class="form-control" 
                             value="${formatDateForInput(anggota.tanggalEnd)}" required>
                    </div>
                  </div>
                  
                  <div class="row g-3 mt-3">
                    <div class="col-md-6">
                      <label for="status" class="form-label">
                        <i class="bi bi-check-circle me-1"></i>Status *
                      </label>
                      <select id="status" class="form-select" required>
                        <option value="aktif" ${anggota.status === 'aktif' ? 'selected' : ''}>Aktif</option>
                        <option value="non-aktif" ${anggota.status === 'non-aktif' ? 'selected' : ''}>Non-Aktif</option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label for="jenisSampah" class="form-label">
                        <i class="bi bi-trash me-1"></i>Jenis Sampah *
                      </label>
                      <select id="jenisSampah" class="form-select" required>
                        <option value="Rumah Tangga" ${anggota.jenisSampah === 'Rumah Tangga' ? 'selected' : ''}>Rumah Tangga</option>
                        <option value="Tempat Usaha" ${anggota.jenisSampah === 'Tempat Usaha' ? 'selected' : ''}>Tempat Usaha</option>
                      </select>
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
                <h6 class="card-title mb-0 text-warning">
                  <i class="bi bi-geo-alt me-2"></i>Lokasi di Peta
                </h6>
              </div>
              <div class="card-body">
                <div class="alert alert-info mb-3">
                  <i class="bi bi-info-circle me-2"></i>
                  <strong>Instruksi:</strong> Klik di peta untuk mengubah lokasi. 
                  Koordinat akan otomatis terisi.
                </div>
                
                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label for="latitude" class="form-label">Latitude *</label>
                    <input type="number" step="any" id="latitude" 
                           class="form-control" value="${anggota.latitude || ''}" required>
                  </div>
                  <div class="col-md-6">
                    <label for="longitude" class="form-label">Longitude *</label>
                    <input type="number" step="any" id="longitude" 
                           class="form-control" value="${anggota.longitude || ''}" required>
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

    showModal(
      `Edit Anggota: ${anggota.nama}`,
      formHTML,
      async () => {
        // Validasi form
        const messageDiv = document.getElementById("formMessageEdit");
        messageDiv.innerHTML = "";
        messageDiv.className = "alert";

        // Validasi required fields
        const requiredFields = ['nama', 'alamat', 'noWA', 'latitude', 'longitude', 
                                'tanggalStart', 'tanggalEnd', 'status', 'jenisSampah'];
        
        const missingFields = [];
        for (const fieldId of requiredFields) {
          const field = document.getElementById(fieldId);
          if (!field?.value?.trim()) {
            missingFields.push(fieldId);
          }
        }

        if (missingFields.length > 0) {
          messageDiv.className = "alert alert-danger";
          messageDiv.innerHTML = `<strong>Perhatian:</strong> Field berikut harus diisi: ${missingFields.join(', ')}`;
          return;
        }

        // Validasi koordinat
        const latitude = parseFloat(document.getElementById("latitude").value);
        const longitude = parseFloat(document.getElementById("longitude").value);
        
        if (isNaN(latitude) || isNaN(longitude)) {
          messageDiv.className = "alert alert-danger";
          messageDiv.innerHTML = "<strong>Error:</strong> Koordinat tidak valid. Klik peta untuk memilih lokasi.";
          return;
        }

        // Validasi tanggal
        const tanggalStart = new Date(document.getElementById("tanggalStart").value);
        const tanggalEnd = new Date(document.getElementById("tanggalEnd").value);
        
        if (tanggalEnd < tanggalStart) {
          messageDiv.className = "alert alert-danger";
          messageDiv.innerHTML = "<strong>Error:</strong> Tanggal End tidak boleh lebih awal dari Tanggal Start.";
          return;
        }

        // Handle user jika tidak ada
        let userId;
        if (userData) {
          userId = userData.id;
        } else {
          // Ambil dari dropdown jika ada
          const userSelect = document.getElementById('userSelect');
          userId = userSelect ? parseInt(userSelect.value) : null;
        }

        // Siapkan data
        const anggotaData = {
          ...(userId && { user: userId }),
          nama: document.getElementById("nama").value,
          alamat: document.getElementById("alamat").value,
          noWA: document.getElementById("noWA").value,
          latitude: latitude,
          longitude: longitude,
          tanggalStart: document.getElementById("tanggalStart").value,
          tanggalEnd: document.getElementById("tanggalEnd").value,
          status: document.getElementById("status").value,
          jenisSampah: document.getElementById("jenisSampah").value,
        };

        console.log("Data yang akan dikirim (edit):", anggotaData);

        // Tampilkan loading
        messageDiv.className = "alert alert-info";
        messageDiv.innerHTML = "Menyimpan perubahan data anggota...";

        try {
          await fetchAPI(`${API.anggota}${anggotaId}/`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(anggotaData),
          });

          messageDiv.className = "alert alert-success";
          messageDiv.innerHTML = `
            <div class="d-flex align-items-center">
              <i class="bi bi-check-circle-fill fs-4 me-2"></i>
              <div>
                <strong>Berhasil!</strong> Data anggota berhasil diperbarui.
              </div>
            </div>
          `;

          // Tunggu 2 detik lalu refresh data
          setTimeout(() => {
            loadAnggotaWithMap();
          }, 2000);

        } catch (error) {
          console.error("Error updating anggota:", error);
          messageDiv.className = "alert alert-danger";
          messageDiv.innerHTML = `
            <div class="d-flex align-items-center">
              <i class="bi bi-exclamation-triangle-fill fs-4 me-2"></i>
              <div>
                <strong>Error:</strong> ${error.message}
              </div>
            </div>
          `;
        }
      }
    );

    // Jika tidak ada user, load user list untuk dropdown
    if (!userData) {
      setTimeout(() => {
        loadUsersForDropdown();
      }, 300);
    }

    // Inisialisasi peta setelah modal ditampilkan
    setTimeout(() => {
      initializeAnggotaMapEdit(anggota.latitude, anggota.longitude);
    }, 300);

  } catch (error) {
    console.error("Error loading anggota data:", error);
    showModal(
      "Error",
      `
        <div class="text-center py-4">
          <i class="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
          <h5 class="text-danger">Gagal Memuat Data Anggota</h5>
          <p class="text-muted">${error.message}</p>
        </div>
      `,
      null
    );
  }
}

// Fungsi untuk load users ke dropdown
async function loadUsersForDropdown() {
  try {
    const users = await fetchAPI(API.users, { headers: getAuthHeaders() });
    const userSelect = document.getElementById('userSelect');
    
    if (userSelect) {
      // Filter user yang belum memiliki anggota (anggota atau tamu)
      // Catatan: Anda perlu implementasi untuk cek user sudah punya anggota atau tidak
      const availableUsers = users.filter(u => 
        (u.role === 'anggota' || u.role === 'tamu') && u.is_active
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
      
      const options = availableUsers.map(u => 
        `<option value="${u.id}">
          ${u.username} - ${u.email || 'no email'} (${u.role})
        </option>`
      ).join('');
      
      userSelect.innerHTML = `<option value="">Pilih User...</option>` + options;
    }
  } catch (error) {
    console.error('Error loading users for dropdown:', error);
  }
}

// Fungsi untuk inisialisasi peta di form edit
async function initializeAnggotaMapEdit(defaultLat, defaultLng) {
  const containerId = 'mapContainerAnggotaEdit';
  const latInputId = 'latitude';
  const lngInputId = 'longitude';
  
  const container = document.getElementById(containerId);
  if (!container) return;

  const loadingDiv = document.getElementById('mapLoadingEdit');
  const errorDiv = document.getElementById('mapErrorEdit');
  
  if (loadingDiv) loadingDiv.classList.remove('d-none');
  if (errorDiv) errorDiv.classList.add('d-none');

  try {
    await ensureLeafletLoaded();
    
    // Tunggu hingga container siap
    await waitForElement(containerId);
    
    if (container.clientHeight === 0) {
      container.style.height = '300px';
    }

    // Gunakan koordinat anggota sebagai default
    const lat = defaultLat || -10.1935921;
    const lng = defaultLng || 123.6149376;
    
    const map = await initMapForm(
      containerId,
      latInputId,
      lngInputId,
      lat,
      lng,
      15             // Zoom level lebih dekat
    );

    if (loadingDiv) loadingDiv.classList.add('d-none');
    window.anggotaMapEdit = map;
    
    console.log("Anggota edit map initialized successfully");

  } catch (error) {
    console.error("Failed to initialize edit map:", error);
    
    if (loadingDiv) loadingDiv.classList.add('d-none');
    if (errorDiv) errorDiv.classList.remove('d-none');
    
    // Set default values if map fails
    const latInput = document.getElementById(latInputId);
    const lngInput = document.getElementById(lngInputId);
    
    if (latInput && !latInput.value) {
      latInput.value = defaultLat || -10.1935921;
    }
    if (lngInput && !lngInput.value) {
      lngInput.value = defaultLng || 123.6149376;
    }
  }
}

function chatWhatsApp(phoneNumber, message = '') {
  if (!phoneNumber) {
    alert('Nomor WhatsApp tidak tersedia');
    return;
  }
  
  const formattedPhone = phoneNumber.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${formattedPhone}${message ? `?text=${encodedMessage}` : ''}`;
  window.open(whatsappUrl, '_blank');
}

function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
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
  window.open(mapsUrl, '_blank');
}

// Fungsi viewDetail dengan event delegation
async function viewDetail(anggotaId) {
  try {
    const anggota = await fetchAPI(`${API.anggota}${anggotaId}/`, {
      headers: getAuthHeaders(),
    });

    // Tampilkan modal dengan detail
    showModal(
      `Detail Anggota: ${anggota.nama}`,
      `
        <div class="detail-container">
          <div class="row">
            <div class="col-md-4 text-center">
              <div class="avatar-placeholder bg-secondary rounded-circle d-inline-flex align-items-center justify-content-center" 
                   style="width: 120px; height: 120px; font-size: 40px;">
                <i class="bi bi-person-fill text-white"></i>
              </div>
              <h4 class="mt-3">${anggota.nama}</h4>
              <span class="badge ${anggota.status === 'aktif' ? 'bg-success' : 'bg-danger'}">
                ${anggota.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
              </span>
              <div class="mt-3">
                <button class="btn btn-success btn-sm" id="chatWhatsAppBtn">
                  <i class="bi bi-whatsapp me-1"></i>Chat WhatsApp
                </button>
              </div>
            </div>
            <div class="col-md-8">
              <h5 class="border-bottom pb-2">Informasi Anggota</h5>
              <table class="table table-borderless">
                <tr>
                  <td width="35%"><strong>ID Anggota</strong></td>
                  <td>${anggota.idAnggota || '-'}</td>
                </tr>
                <tr>
                  <td><strong>Alamat</strong></td>
                  <td>${anggota.alamat || '-'}</td>
                </tr>
                <tr>
                  <td><strong>Nomor WhatsApp</strong></td>
                  <td>
                    <a href="https://wa.me/${anggota.noWA}" target="_blank" class="text-decoration-none">
                      <i class="bi bi-whatsapp text-success me-1"></i>${anggota.noWA || '-'}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td><strong>Jenis Sampah</strong></td>
                  <td>
                    <span class="badge ${anggota.jenisSampah === 'Rumah Tangga' ? 'bg-info' : 'bg-warning text-dark'}">
                      ${anggota.jenisSampah || '-'}
                    </span>
                  </td>
                </tr>
              </table>
              
              <h5 class="border-bottom pb-2 mt-4">Koordinat Lokasi</h5>
              <table class="table table-borderless">
                <tr>
                  <td width="35%"><strong>Latitude</strong></td>
                  <td>${anggota.latitude || '0'}</td>
                </tr>
                <tr>
                  <td><strong>Longitude</strong></td>
                  <td>${anggota.longitude || '0'}</td>
                </tr>
                <tr>
                  <td colspan="2">
                    <div class="mt-2">
                      <button class="btn btn-sm btn-outline-primary me-2" id="showMapBtn">
                        <i class="bi bi-map me-1"></i>Tampilkan di Peta
                      </button>
                      <button class="btn btn-sm btn-outline-success" id="sendLocationBtn">
                        <i class="bi bi-whatsapp me-1"></i>Kirim Lokasi via WA
                      </button>
                    </div>
                  </td>
                </tr>
              </table>
              
              <h5 class="border-bottom pb-2 mt-4">Periode Keanggotaan</h5>
              <table class="table table-borderless">
                <tr>
                  <td width="35%"><strong>Tanggal Mulai</strong></td>
                  <td>${formatDate(anggota.tanggalStart)}</td>
                </tr>
                <tr>
                  <td><strong>Tanggal Berakhir</strong></td>
                  <td>
                    ${formatDate(anggota.tanggalEnd)}
                    ${isExpired(anggota.tanggalEnd) ? 
                      '<span class="badge bg-danger ms-2">Kedaluwarsa</span>' : 
                      ''}
                  </td>
                </tr>
                <tr>
                  <td><strong>Status</strong></td>
                  <td>
                    <span class="badge ${anggota.status === 'aktif' ? 'bg-success' : 'bg-secondary'}">
                      ${anggota.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                </tr>
              </table>
              
              ${anggota.user ? `
              <h5 class="border-bottom pb-2 mt-4">Akun Pengguna</h5>
              <table class="table table-borderless">
                <tr>
                  <td width="35%"><strong>Username</strong></td>
                  <td>${anggota.user.username || '-'}</td>
                </tr>
                <tr>
                  <td><strong>Email</strong></td>
                  <td>${anggota.user.email || '-'}</td>
                </tr>
              </table>
              ` : ''}
            </div>
          </div>
          
          <div class="mt-4 pt-3 border-top d-flex justify-content-between">
            <div>
              <button class="btn btn-success me-2" id="chatNowBtn">
                <i class="bi bi-whatsapp me-1"></i>Chat Sekarang
              </button>
              <button class="btn btn-warning me-2" onclick="editAnggota(${anggotaId})">
                <i class="bi bi-pencil me-1"></i>Edit Anggota
              </button>
              <button class="btn btn-danger" onclick="deleteAnggota(${anggotaId}, '${anggota.nama}')">
                <i class="bi bi-trash me-1"></i>Hapus Anggota
              </button>
            </div>
          </div>
        </div>
      `,
      null,
      () => {
        if (window.location.hash.includes('/anggota/')) {
          window.location.hash = '#/anggota';
        }
      }
    );

    // Tambahkan event listeners setelah modal ditampilkan
    setTimeout(() => {
      const modalContainer = document.getElementById('modalContainer');
      if (modalContainer) {
        // Chat WhatsApp button
        const chatBtn = modalContainer.querySelector('#chatWhatsAppBtn');
        if (chatBtn) {
          chatBtn.addEventListener('click', () => {
            chatWhatsApp(anggota.noWA, `Halo ${anggota.nama}, ini dari admin Bank Sampah`);
          });
        }

        // Show map button
        const mapBtn = modalContainer.querySelector('#showMapBtn');
        if (mapBtn) {
          mapBtn.addEventListener('click', () => {
            showLocationMap(anggota.latitude, anggota.longitude, anggota.nama);
          });
        }

        // Send location button
        const sendLocationBtn = modalContainer.querySelector('#sendLocationBtn');
        if (sendLocationBtn) {
          sendLocationBtn.addEventListener('click', () => {
            chatWhatsApp(anggota.noWA, `Lokasi saya: ${anggota.latitude},${anggota.longitude} - ${anggota.alamat}`);
          });
        }

        // Chat now button
        const chatNowBtn = modalContainer.querySelector('#chatNowBtn');
        if (chatNowBtn) {
          chatNowBtn.addEventListener('click', () => {
            chatWhatsApp(anggota.noWA, `Halo ${anggota.nama}, ini dari admin Bank Sampah`);
          });
        }
      }
    }, 100);

    window.location.hash = `#/anggota/${anggotaId}`;
    
  } catch (error) {
    console.error("Error loading detail:", error);
    showModal(
      "Error",
      `
        <div class="text-center py-4">
          <i class="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
          <h5 class="text-danger">Gagal Memuat Detail Anggota</h5>
          <p class="text-muted">${error.message || 'Terjadi kesalahan saat memuat data'}</p>
        </div>
      `,
      null
    );
  }
}

// Fungsi helper untuk format currency (tambahkan jika belum ada)
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID').format(amount);
}

async function deleteAnggota(anggotaId) {
  showConfirmModal(
    `
      <div class="text-center py-3">
        <i class="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
        <h5 class="text-danger">Hapus Anggota</h5>
        <p class="text-muted">Apakah Anda yakin ingin menghapus anggota ini?</p>
        <small class="text-muted d-block">Data yang telah dihapus tidak dapat dikembalikan.</small>
      </div>
    `,
    async () => {
      try {
        await fetchAPI(`${API.anggota}${anggotaId}/`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        // Show success notification
        showModal(
          "Berhasil",
          `
            <div class="text-center py-4">
              <i class="bi bi-check-circle-fill text-success fs-1 mb-3"></i>
              <h5 class="text-success">Anggota Dihapus</h5>
              <p class="text-muted">Anggota berhasil dihapus dari sistem.</p>
            </div>
          `,
          null
        );

      } catch (error) {
        console.error("Error deleting anggota:", error);
        showModal(
          "Error",
          `
            <div class="text-center py-4">
              <i class="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
              <h5 class="text-danger">Gagal Menghapus</h5>
              <p class="text-muted">${error.message}</p>
            </div>
          `,
          null
        );
      }
    }
  );
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
  else if (hash === '#/anggota') {
    renderAnggotaList(); // Fungsi untuk merender daftar
  }
}

// Panggil saat hash berubah
window.addEventListener('hashchange', handleRoute);
window.editAnggota = editAnggota;
window.viewDetail = viewDetail;
window.deleteAnggota = deleteAnggota;
// Panggil saat pertama kali load
document.addEventListener('DOMContentLoaded', handleRoute);
export { viewDetail, chatWhatsApp, formatDate, isExpired, showLocationMap };