import { API, getAuthHeaders, getAuthHeadersMultipart, fetchAPI } from "../../api.js";
import { authGuard } from "../../utils/authGuard.js";
import { loadLeaflet, initMap, addMarker, initMapForm } from "../../utils/mapConfig.js";
import { showToast } from "../../utils/toast.js";
import { showDetail } from "./detail_laporan.js";

// Deklarasi variabel global untuk user
let currentUser = null;
let isGettingLocation = false; // Tambahkan variabel global

let currentPage = 1;
const itemsPerPage = 9;
let laporanData = []; // isi dari API

// Deklarasi variabel untuk GPS
let gpsMarker = null;
let locationFromGPS = false;
let selectedLocation = {
    latitude: null,
    longitude: null
};


export async function laporanPage() {
    const user = await authGuard();
    const main = document.getElementById("mainContent");

    // Simpan user ke variabel global
    currentUser = user;

    if (!user) {
        main.innerHTML = `
            <div style="background: #ffebee; color: #c62828; padding: 20px; border-radius: 8px; text-align: center;">
                <h3>⚠️ Akses Ditolak</h3>
                <p>Silakan login terlebih dahulu</p>
                <button onclick="window.location.hash='#/login'" 
                        style="background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-top: 10px;">
                    Login
                </button>
            </div>
        `;
        return;
    }

    // ✅ PERBAIKAN DI SINI: Validasi role
    if (user.role !== "anggota") {
        main.innerHTML = `
            <div style="background: #fff3cd; color: #856404; padding: 20px; border-radius: 8px; text-align: center;">
                <h3>⚠️ Akses Ditolak</h3>
                <p>Halaman ini hanya untuk anggota. Role Anda: <strong>${user.role}</strong></p>
                <button onclick="window.location.hash='#/dashboard'" 
                        style="background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-top: 10px;">
                    Kembali ke Dashboard
                </button>
            </div>
        `;
        return;
    }

    // ✅ HTML untuk role ANGGOTA (ini yang seharusnya ditampilkan)
    main.innerHTML = `
        <div style="max-width: 1200px; margin: 0 auto;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2196F3, #1976D2); color: white; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1 style="margin: 0 0 10px 0; font-size: 28px;">🗑️ Laporan Sampah</h1>
                        <p style="margin: 0; opacity: 0.9;">Laporkan sampah untuk membantu kebersihan Kota Kupang</p>
                    </div>
                    <button id="btnBuatLaporan" 
                            style="background: rgba(255,255,255,0.2); color: white; border: 2px solid white; padding: 12px 25px; border-radius: 6px; font-size: 16px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        📝 Buat Laporan Baru
                    </button>
                </div>
            </div>

            <!-- PETA LAPORAN (Full Width di Baris Pertama) -->
            <div style="margin-bottom: 20px;">
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <div style="font-size: 24px;">📍</div>
                        <h2 style="margin: 0; color: #333;">Peta Lokasi Laporan</h2>
                    </div>
                    <p style="margin: 0 0 15px 0; color: #666;">Lihat semua lokasi laporan sampah di Kota Kupang</p>
                    <div id="mapContainer" style="height: 400px; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0;">
                        <div style="height: 100%; display: flex; align-items: center; justify-content: center; color: #666; background: #f8f9fa;">
                            <div style="text-align: center;">
                                <div style="font-size: 48px; margin-bottom: 10px;">🗺️</div>
                                <p>Memuat peta...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- STATISTIK LAPORAN (Full Width di Baris Kedua) -->
            <div style="margin-bottom: 20px;">
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <div style="font-size: 24px;">📊</div>
                        <h2 style="margin: 0; color: #333;">Statistik Laporan Anda</h2>
                    </div>
                    <p style="margin: 0 0 15px 0; color: #666;">Ringkasan laporan yang telah Anda buat</p>
                    <div id="statistics">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <!-- Card Total Laporan -->
                            <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Total Laporan</div>
                                        <div style="font-size: 32px; font-weight: bold; color: #2e7d32;">0</div>
                                    </div>
                                    <div style="font-size: 32px; color: #4CAF50;">📋</div>
                                </div>
                            </div>
                            
                            <!-- Card Laporan Diproses -->
                            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196F3;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Diproses</div>
                                        <div style="font-size: 32px; font-weight: bold; color: #1565c0;">0</div>
                                    </div>
                                    <div style="font-size: 32px; color: #2196F3;">⏳</div>
                                </div>
                            </div>
                            
                            <!-- Card Laporan Selesai -->
                            <div style="background: #fff8e1; padding: 20px; border-radius: 8px; border-left: 4px solid #FF9800;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Selesai</div>
                                        <div style="font-size: 32px; font-weight: bold; color: #ef6c00;">0</div>
                                    </div>
                                    <div style="font-size: 32px; color: #FF9800;">✅</div>
                                </div>
                            </div>
                            
                            <!-- Card Rating Rata-rata -->
                            <div style="background: #f3e5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #9C27B0;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Rating Rata-rata</div>
                                        <div style="font-size: 32px; font-weight: bold; color: #7b1fa2;">0.0</div>
                                    </div>
                                    <div style="font-size: 32px; color: #9C27B0;">⭐</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- DAFTAR LAPORAN (Full Width di Baris Ketiga) -->
            <div style="margin-bottom: 20px;">
                <div style="background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
                    <div style="padding: 20px; border-bottom: 1px solid #eee;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h2 style="margin: 0; color: #333;">Daftar Laporan Sampah</h2>
                                <p style="margin: 10px 0 0 0; color: #666;">Semua laporan sampah di Kota Kupang</p>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button id="btnRefreshLaporan" 
                                        style="background: #f5f5f5; color: #333; border: 1px solid #ddd; padding: 8px 16px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                                    🔄 Refresh
                                </button>
                                <button id="btnFilterLaporan" 
                                        style="background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                                    🔍 Filter
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div id="laporanContainer" style="padding: 20px;">
                        <div style="text-align: center; padding: 40px; color: #666;">
                            <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
                            <p>Memuat laporan...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load data
    await Promise.all([
        loadLaporan(),
        loadStatistics(),
        loadMap()
    ]);

    // ✅ Sekarang btnBuatLaporan akan ditemukan karena HTML sudah ditampilkan
    document.getElementById("btnBuatLaporan").onclick = showCreateLaporanForm;
    document.getElementById("btnRefreshLaporan").onclick = async () => {
        document.getElementById("btnRefreshLaporan").innerHTML = "🔄 Memuat...";
        document.getElementById("btnRefreshLaporan").disabled = true;
        await Promise.all([
            loadLaporan(),
            loadStatistics(),
            loadMap()
        ]);
        document.getElementById("btnRefreshLaporan").innerHTML = "🔄 Refresh";
        document.getElementById("btnRefreshLaporan").disabled = false;
    };

    document.getElementById("btnFilterLaporan").onclick = showFilterOptions;
}

// Fungsi untuk apply filter
async function applyFilters() {
    const status = document.getElementById("filterStatus").value;
    const jenis = document.getElementById("filterJenis").value;
    const sort = document.getElementById("filterSort").value;
    
    await loadLaporan({ status, jenis, sort });
}

function showFilterOptions() {
    const laporanContainer = document.getElementById("laporanContainer");
    
    laporanContainer.innerHTML = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0;">🔍 Filter Laporan</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Status</label>
                    <select id="filterStatus" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">Semua Status</option>
                        <option value="selesai">Selesai</option>
                        <option value="diproses">Diproses</option>
                        <option value="diterima">Diterima</option>
                        <option value="dilaporkan">Dilaporkan</option>
                        <option value="ditolak">Ditolak</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Laporan Saya</label>
                    <select id="filterMyReport" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">Semua Laporan</option>
                        <option value="my">Laporan Saya Saja</option>
                        <option value="others">Laporan Orang Lain</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Urutkan</label>
                    <select id="filterSort" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="newest">Terbaru</option>
                        <option value="oldest">Terlama</option>
                    </select>
                </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button onclick="applyLaporanFilters()" 
                        style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                    Terapkan Filter
                </button>
                <button onclick="resetLaporanFilters()" 
                        style="background: #757575; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                    Reset Filter
                </button>
            </div>
        </div>
        <div id="laporanList" style="min-height: 200px;">
            <div style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
                <p>Memuat laporan...</p>
            </div>
        </div>
    `;
    
    // Load laporan dengan container yang benar
    loadLaporanWithContainer("laporanList");
}

async function applyLaporanFilters() {
    const status = document.getElementById("filterStatus").value;
    const myReport = document.getElementById("filterMyReport").value;
    const sort = document.getElementById("filterSort").value;
    
    await loadLaporanWithContainer("laporanList", { status, myReport, sort });
}

function resetLaporanFilters() {
    // Reset dropdown ke nilai default
    document.getElementById("filterStatus").value = "";
    document.getElementById("filterMyReport").value = "";
    document.getElementById("filterSort").value = "newest";
    
    // Load semua laporan
    loadLaporanWithContainer("laporanList");
}

async function loadLaporanWithContainer(containerId = "laporanContainer", filters = {}) {
    const container = document.getElementById(containerId);
    if (!container || !currentUser) return;

    try {
        console.log("Fetching laporan with filters:", filters);
        
        const response = await fetch(API.laporanSampah, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (!data || !Array.isArray(data) || data.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 50px 20px; color: #666;">
                    <div style="font-size: 72px; margin-bottom: 20px;">📝</div>
                    <h3 style="margin: 0 0 10px 0;">Belum Ada Laporan</h3>
                    <p style="margin: 0 0 20px 0;">Belum ada laporan sampah di sistem</p>
                    <button onclick="showCreateLaporanForm()" 
                            style="background: #4CAF50; color: white; border: none; padding: 12px 25px; border-radius: 6px; font-size: 16px; cursor: pointer;">
                        Buat Laporan Pertama
                    </button>
                </div>
            `;
            return;
        }

        // Filter data
        let filteredData = [...data];
        
        // Filter berdasarkan status
        if (filters.status) {
            filteredData = filteredData.filter(laporan => laporan.status === filters.status);
        }
        
        // Filter laporan saya/orang lain
        if (filters.myReport === "my") {
            filteredData = filteredData.filter(laporan => 
                laporan.idUser === currentUser.id || 
                laporan.id_user === currentUser.id ||
                laporan.nama === currentUser.username
            );
        } else if (filters.myReport === "others") {
            filteredData = filteredData.filter(laporan => 
                laporan.idUser !== currentUser.id && 
                laporan.id_user !== currentUser.id &&
                laporan.nama !== currentUser.username
            );
        }
        
        // Sorting
        if (filters.sort === "newest") {
            filteredData.sort((a, b) => new Date(b.tanggal_lapor || b.created_at) - new Date(a.tanggal_lapor || a.created_at));
        } else if (filters.sort === "oldest") {
            filteredData.sort((a, b) => new Date(a.tanggal_lapor || a.created_at) - new Date(b.tanggal_lapor || b.created_at));
        }

        if (filteredData.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 50px 20px; color: #666;">
                    <div style="font-size: 72px; margin-bottom: 20px;">🔍</div>
                    <h3 style="margin: 0 0 10px 0;">Tidak Ada Hasil</h3>
                    <p style="margin: 0 0 20px 0;">Tidak ada laporan yang sesuai dengan filter</p>
                    <button onclick="resetLaporanFilters()" 
                            style="background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                        Reset Filter
                    </button>
                </div>
            `;
            return;
        }

        // simpan hasil filter ke global
    laporanData = filteredData;
    currentPage = 1;

    // render container + pagination wrapper
    container.innerHTML = `
        <div id="laporanGrid"
            style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;">
        </div>

        <div id="pagination"
            style="margin-top:25px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">
            <small style="color: #666;">
                Menampilkan <strong>${filteredData.length}</strong> dari <strong>${data.length}</strong> laporan
                ${filters.status ? ` | Status: ${filters.status}` : ''}
                ${filters.myReport ? ` | ${filters.myReport === 'my' ? 'Laporan Saya' : 'Laporan Orang Lain'}` : ''}
            </small>
        </div>
    `;

    renderLaporanPage(1);


    } catch (err) {
        console.error("Error loading laporan:", err);
        container.innerHTML = `
            <div style="background: #ffebee; color: #c62828; padding: 20px; border-radius: 8px; text-align: center;">
                <h3>❌ Gagal Memuat Laporan</h3>
                <p>${err.message}</p>
                <button onclick="loadLaporanWithContainer('${containerId}')" 
                        style="background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-top: 10px;">
                    Coba Lagi
                </button>
            </div>
        `;
    }
}

function renderLaporanPage(page) {
    const grid = document.getElementById("laporanGrid");
    if (!grid) return;

    currentPage = page;

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = laporanData.slice(start, end);

    grid.innerHTML = pageData.map(laporan => renderLaporanCard(laporan)).join("");
    renderPagination();
}

async function loadLaporan() {
    await loadLaporanWithContainer("laporanContainer");
}

function renderPagination() {
    const pagination = document.getElementById("pagination");
    if (!pagination) return;

    const totalPages = Math.ceil(laporanData.length / itemsPerPage);
    let html = "";

    html += `
        <button ${currentPage === 1 ? "disabled" : ""}
            onclick="renderLaporanPage(${currentPage - 1})">⬅ Prev</button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        html += `
            <button onclick="renderLaporanPage(${i})"
                style="
                    padding:6px 12px;
                    border-radius:4px;
                    border:1px solid #ddd;
                    ${i === currentPage ? "background:#2196F3;color:white;" : ""}
                ">
                ${i}
            </button>
        `;
    }

    html += `
        <button ${currentPage === totalPages ? "disabled" : ""}
            onclick="renderLaporanPage(${currentPage + 1})">Next ➡</button>
    `;

    pagination.innerHTML = html;
}

function renderLaporanCard(laporan) {
    // **PERBAIKAN: Validasi data laporan**
    if (!laporan || typeof laporan !== 'object') {
        console.error("Invalid laporan data in renderLaporanCard:", laporan);
        return renderErrorCard("Data laporan tidak valid");
    }

    const statusColors = {
        'selesai': '#4CAF50',
        'diproses': '#2196F3',
        'diterima': '#FF9800',
        'ditolak': '#f44336',
        'dilaporkan': '#9C27B0',
        'pending': '#FF9800', // Tambahkan pending
        'default': '#757575'
    };
    
    const status = laporan.status || 'dilaporkan';
    const statusColor = statusColors[status] || statusColors.default;
    
    // **PERBAIKAN: Validasi currentUser**
    let isMyReport = false;
    if (currentUser) {
        isMyReport = (
            laporan.idUser === currentUser.id || 
            laporan.id_user === currentUser.id ||
            laporan.nama === currentUser.username
        );
    }
    
    // **PERBAIKAN: Gunakan nilai default untuk field yang mungkin tidak ada**
    const reporterName = laporan.nama || 'Tidak diketahui';
    const deskripsi = laporan.deskripsi || 'Laporan Sampah';
    const alamat = laporan.alamat || 'Tidak ada alamat';
    const tanggalLapor = laporan.tanggal_lapor || laporan.created_at;
    const laporanId = laporan.idLaporan || laporan.id || 'N/A';
    const hasLocation = laporan.latitude && laporan.longitude;
    
    return `
        <div style="background: white; border: 1px solid #eee; border-radius: 8px; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s;"
             onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
            ${laporan.foto_bukti ? `
                <div style="height: 180px; overflow: hidden; position: relative;">
                    <img src="${laporan.foto_bukti}" 
                         alt="Foto laporan" 
                         style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s;"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjY2NjIj7imYvigIwgRm90byBFcnJvcjwvdGV4dD48L3N2Zz4='">
                    ${isMyReport ? `
                        <div style="position: absolute; top: 10px; left: 10px; background: #9C27B0; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                            Laporan Anda
                        </div>
                    ` : ''}
                </div>
            ` : `
                <div style="height: 180px; background: linear-gradient(135deg, #f5f5f5, #e0e0e0); display: flex; align-items: center; justify-content: center; position: relative;">
                    <div style="font-size: 48px; color: #ccc;">🗑️</div>
                    ${isMyReport ? `
                        <div style="position: absolute; top: 10px; left: 10px; background: #9C27B0; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                            Laporan Anda
                        </div>
                    ` : ''}
                </div>
            `}
            
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div>
                        <h3 style="margin: 0; font-size: 18px; color: #333;">
                            ${deskripsi.substring(0, 50)}${deskripsi.length > 50 ? '...' : ''}
                        </h3>
                    </div>
                    <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                        ${status.toUpperCase()}
                    </span>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: #555;">
                        <span style="font-size: 14px; min-width: 20px;">👤</span>
                        <div>
                            <div style="font-size: 14px; font-weight: 500;">${reporterName}</div>
                            <small style="font-size: 12px; color: #888;">Pelapor</small>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: #555;">
                        <span style="font-size: 14px; min-width: 20px;">📍</span>
                        <div>
                            <div style="font-size: 14px; font-weight: 500;">
                                ${alamat.substring(0, 60)}${alamat.length > 60 ? '...' : ''}
                            </div>
                            <small style="font-size: 12px; color: #888;">Lokasi</small>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; color: #555;">
                        <span style="font-size: 14px; min-width: 20px;">📅</span>
                        <div>
                            <div style="font-size: 14px; font-weight: 500;">${formatDate(tanggalLapor)}</div>
                            <small style="font-size: 12px; color: #888;">Tanggal Lapor</small>
                        </div>
                    </div>
                </div>
                
                ${hasLocation ? `
                    <button onclick="showDetail(${laporanId})" 
                            style="width: 100%; background: #2196F3; color: white; border: none; padding: 10px; border-radius: 6px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s;"
                            onmouseover="this.style.background='#1976D2'"
                            onmouseout="this.style.background='#2196F3'">
                        <span style="font-size: 16px;">🔍</span> Detail Laporan
                    </button>
                ` : `
                    <div style="width: 100%; background: #f5f5f5; border: 1px dashed #ddd; color: #999; padding: 10px; border-radius: 6px; font-size: 14px; text-align: center;">
                        📍 Tidak ada lokasi
                    </div>
                `}
            </div>
        </div>
    `;
}

// Update fungsi showLaporanOnMap untuk menerima deskripsi
window.showLaporanOnMap = function(latitude, longitude, deskripsi = '') {
    // Gunakan SweetAlert untuk menampilkan peta detail
    const mapHTML = `
        <div style="margin-bottom: 15px;">
            ${deskripsi ? `
                <div style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                    <p style="margin: 0; font-size: 14px; color: #333;">${deskripsi}</p>
                </div>
            ` : ''}
            <div id="detailMap" style="height: 300px; width: 100%; border: 1px solid #ddd; border-radius: 6px;"></div>
        </div>
    `;
    
    Swal.fire({
        title: '📍 Lokasi Laporan',
        html: mapHTML,
        width: '500px',
        showConfirmButton: false,
        showCloseButton: true,
        didOpen: () => {
            loadLeaflet(() => {
                const map = initMap("detailMap", latitude, longitude, 15);
                addMarker(map, latitude, longitude, deskripsi || "Lokasi Laporan");
                
                // Refresh peta setelah modal terbuka
                setTimeout(() => {
                    map.invalidateSize();
                }, 200);
            });
        }
    });
};

async function loadStatistics() {
    const statisticsDiv = document.getElementById("statistics");
    if (!statisticsDiv || !currentUser) return;

    try {
        const response = await fetch(API.laporanSampah, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            
            // Gunakan SEMUA data tanpa filter
            const allLaporan = data;
            
            const counts = {
                total: allLaporan.length,
                selesai: allLaporan.filter(l => l.status === 'selesai').length,
                diproses: allLaporan.filter(l => l.status === 'diproses').length,
                diterima: allLaporan.filter(l => l.status === 'diterima').length,
                ditolak: allLaporan.filter(l => l.status === 'ditolak').length,
                dilaporkan: allLaporan.filter(l => l.status === 'dilaporkan' || !l.status).length
            };

            statisticsDiv.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #2196F3;">${counts.total}</div>
                        <small>Total</small>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">${counts.selesai}</div>
                        <small>Selesai</small>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #FF9800;">${counts.diproses}</div>
                        <small>Diproses</small>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #FFC107;">${counts.diterima}</div>
                        <small>Diterima</small>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #f44336;">${counts.ditolak}</div>
                        <small>Ditolak</small>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #9C27B0;">${counts.dilaporkan}</div>
                        <small>Dilaporkan</small>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error loading statistics:", error);
        statisticsDiv.innerHTML = `<p style="color: #f44336;">Gagal memuat statistik</p>`;
    }
}

async function loadMap() {
    const mapContainer = document.getElementById("mapContainer");
    if (!mapContainer || !currentUser) return;

    try {
        const response = await fetch(API.laporanSampah, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            
            // Gunakan SEMUA data tanpa filter
            const allLaporan = data;
            
            if (allLaporan.length === 0) {
                mapContainer.innerHTML = `
                    <div style="height: 100%; display: flex; align-items: center; justify-content: center; color: #666;">
                        <div style="text-align: center;">
                            <div style="font-size: 36px; margin-bottom: 10px;">📍</div>
                            <p>Belum ada laporan dengan lokasi</p>
                        </div>
                    </div>
                `;
                return;
            }

            mapContainer.innerHTML = '<div id="miniMap" style="height: 100%;"></div>';
            
            loadLeaflet(() => {
                const map = initMap("miniMap");
                let hasMarkers = false;
                
                allLaporan.forEach(laporan => {
                    if (laporan.latitude && laporan.longitude) {
                        hasMarkers = true;
                        
                        // SESUAIKAN WARNA DENGAN FUNGSI RENDERMAPDETAIL
                        let markerColor = '#ffc107'; // default kuning (untuk status lain)
                        
                        if (laporan.status === 'selesai') {
                            markerColor = '#28a745'; // hijau
                        } else if (laporan.status === 'diproses' || laporan.status === 'proses') {
                            markerColor = '#17a2b8'; // biru muda
                        } else if (laporan.status === 'ditolak') {
                            markerColor = '#f44336'; // merah
                        } else if (laporan.status === 'diterima') {
                            markerColor = '#ffc107'; // kuning
                        } else if (laporan.status === 'dilaporkan') {
                            markerColor = '#9C27B0'; // ungu
                        }
                        
                        // Tentukan apakah laporan ini milik user saat ini
                        const isMyReport = currentUser && (
                            laporan.idUser === currentUser.id || 
                            laporan.id_user === currentUser.id ||
                            laporan.nama === currentUser.username
                        );
                        
                        const popupContent = `
                            <b>${laporan.nama || 'Laporan'}</b><br>
                            <small>${laporan.alamat || ''}</small><br>
                            <small>Status: <strong>${laporan.status || 'dilaporkan'}</strong></small><br>
                            ${isMyReport ? '<small><em>🔹 Laporan Anda</em></small>' : ''}
                        `;
                        
                        addMarker(map, laporan.latitude, laporan.longitude, popupContent, markerColor);
                    }
                });
                
                // Jika ada markers, zoom ke bounds
                if (hasMarkers) {
                    setTimeout(() => {
                        const markers = document.querySelectorAll('.leaflet-marker-icon');
                        if (markers.length > 0) {
                            const bounds = L.latLngBounds([]);
                            allLaporan.forEach(l => {
                                if (l.latitude && l.longitude) {
                                    bounds.extend([parseFloat(l.latitude), parseFloat(l.longitude)]);
                                }
                            });
                            map.fitBounds(bounds, { padding: [20, 20] });
                        }
                    }, 500);
                }
            });
        }
    } catch (error) {
        console.error("Error loading map:", error);
        mapContainer.innerHTML = `<div style="height: 100%; display: flex; align-items: center; justify-content: center; color: #f44336;">
            Gagal memuat peta
        </div>`;
    }
}

function showCreateLaporanForm() {
    // Reset variabel GPS
    gpsMarker = null;
    locationFromGPS = false;
    
    // Buat form HTML untuk modal
    const formHTML = `
        <form id="modalLaporanForm" class="needs-validation" novalidate style="text-align: left;">
            <!-- INFO JENIS SAMPAH -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 20px; margin-right: 10px;">🗑️</span>
                    <h4 style="margin: 0; font-size: 16px; font-weight: bold;">Informasi Jenis Sampah</h4>
                </div>
                <div style="font-size: 13px; opacity: 0.95;">
                    <p style="margin: 0 0 10px 0;">Sebutkan jenis sampah dalam deskripsi untuk analisis yang lebih baik:</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
                        <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px; font-size: 11px;">
                            <span style="color: #ff6b6b;">●</span> B3 (Baterai, Elektronik, Bahan Kimia)
                        </span>
                        <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px; font-size: 11px;">
                            <span style="color: #4ecdc4;">●</span> Plastik (Botol, Kresek, Sedotan)
                        </span>
                        <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px; font-size: 11px;">
                            <span style="color: #45b7d1;">●</span> Organik (Sisa Makanan, Daun, Sayur)
                        </span>
                        <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px; font-size: 11px;">
                            <span style="color: #96ceb4;">●</span> Logam (Kaleng, Besi, Aluminium)
                        </span>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px; font-size: 11px;">
                            <span style="color: #ffeaa7;">●</span> Kaca (Botol, Beling, Pecahan)
                        </span>
                        <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px; font-size: 11px;">
                            <span style="color: #fab1a0;">●</span> Kertas (Koran, Kardus, Buku)
                        </span>
                        <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px; font-size: 11px;">
                            <span style="color: #a29bfe;">●</span> Karet (Ban, Sandal, Karet Gelang)
                        </span>
                        <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px; font-size: 11px;">
                            <span style="color: #fd79a8;">●</span> Tekstil (Kain, Baju, Sepatu)
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Alamat Lokasi -->
            <div class="mb-3">
                <label for="modalAlamat" class="form-label fw-bold">
                    <span style="color: #e74c3c;">📍</span> Kelurahan Lokasi Sampah
                </label>
                <input type="text" class="form-control" id="modalAlamat" 
                       placeholder="Contoh: Kelurahan Oebobo" required>
                <div class="invalid-feedback">
                    Mohon isi alamat lokasi sampah.
                </div>
            </div>
            
            <!-- Deskripsi Sampah -->
            <div class="mb-3">
                <label for="modalDeskripsi" class="form-label fw-bold">
                    <span style="color: #2ecc71;">📝</span> Deskripsi Sampah
                </label>
                <textarea class="form-control" id="modalDeskripsi" rows="4"
                          placeholder="Contoh: 'Tumpukan sampah plastik (botol mineral, kresek) di pinggir jalan, volume sekitar 2m³, menutupi saluran air'
                        
Contoh lainnya:
• 'Limbah B3: baterai bekas dan elektronik rusak dibuang sembarangan'
• 'Sampah organik: sisa sayuran dan daun membusuk di taman'
• 'Sampah campuran: plastik, kertas, dan kaleng berserakan'
                        
Mohon sebutkan:
1. Jenis sampah (plastik/organik/logam/B3/dll)
2. Perkiraan volume/banyaknya
3. Kondisi sekitar (berbau, mengganggu, dll)" required></textarea>
                <div class="invalid-feedback">
                    Mohon isi deskripsi sampah.
                </div>
                <div class="form-text text-muted">
                    <span style="color: #3498db;">💡</span> Deskripsi yang jelas membantu analisis dampak lingkungan
                </div>
            </div>
            
            <!-- Peta Lokasi -->
            <div class="mb-3">
                <label class="form-label fw-bold">
                    <span style="color: #9b59b6;">🗺️</span> Peta Lokasi
                </label>
                <p class="text-muted mb-2 small">Tentukan lokasi sampah di peta atau gunakan GPS</p>
                
                <!-- Tombol GPS di atas peta -->
                <div class="d-flex gap-2 mb-2 flex-wrap">
                    <button type="button" id="modalPilihLokasiPeta" 
                            class="btn btn-primary flex-fill d-flex align-items-center justify-content-center gap-2">
                        <span style="font-size: 16px;">🗺️</span> Pilih di Peta
                    </button>
                    
                    <button type="button" id="modalGetLocation" 
                            class="btn btn-success flex-fill d-flex align-items-center justify-content-center gap-2">
                        <span style="font-size: 16px;">📍</span> GPS Saya
                    </button>
                    
                    <button type="button" id="modalResetMap" 
                            class="btn btn-danger flex-fill d-flex align-items-center justify-content-center gap-2">
                        <span style="font-size: 16px;">🔄</span> Reset Peta
                    </button>
                </div>
                
                <!-- Peta utama -->
                <div id="modalMapSelect" style="height: 250px; width: 100%; border-radius: 6px; border: 2px solid #dee2e6;"></div>
                
                <!-- Koordinat Input -->
                <div class="row g-2 mt-2">
                    <div class="col-md-6">
                        <label for="modalLatitude" class="form-label small">
                            <span style="color: #f39c12;">🌐</span> Latitude
                        </label>
                        <input type="number" step="0.00000001" class="form-control" id="modalLatitude" 
                               placeholder="-10.1935921" required readonly>
                        <div class="invalid-feedback">
                            Mohon pilih lokasi di peta.
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <label for="modalLongitude" class="form-label small">
                            <span style="color: #f39c12;">🌐</span> Longitude
                        </label>
                        <input type="number" step="0.00000001" class="form-control" id="modalLongitude" 
                               placeholder="123.6149376" required readonly>
                        <div class="invalid-feedback">
                            Mohon pilih lokasi di peta.
                        </div>
                    </div>
                </div>
                
                <!-- Status GPS -->
                <div id="modalGpsStatus" class="mt-2"></div>
            </div>
            
            <!-- Foto Bukti -->
            <div class="mb-3">
                <label for="modalFoto" class="form-label fw-bold">
                    <span style="color: #e67e22;">📷</span> Foto Bukti
                </label>
                <p class="text-muted small">Maksimal 5MB. Format: JPG, PNG, JPEG</p>
                <input type="file" class="form-control" id="modalFoto" accept="image/*" required>
                <div class="invalid-feedback">
                    Mohon unggah foto bukti.
                </div>
                
                <!-- Preview Foto -->
                <div id="modalPreviewContainer" class="mt-2" style="display: none;">
                    <div class="card border-secondary">
                        <div class="card-body p-2">
                            <p class="small mb-1"><strong>Pratinjau Foto:</strong></p>
                            <img id="modalImagePreview" class="img-fluid rounded" style="max-height: 150px;">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Informasi tambahan -->
            <div class="alert alert-warning" role="alert">
                <div class="d-flex">
                    <i class="bi bi-lightbulb me-2 fs-5"></i>
                    <div>
                        <strong>Tips Pengisian:</strong> Sebutkan jenis sampah dengan jelas dalam deskripsi untuk membantu tim analisis menentukan tingkat bahaya dan prioritas penanganan.
                    </div>
                </div>
            </div>
        </form>
    `;
    
    // Tampilkan modal
    showModal(
        '<strong style="color: #2196F3;">📝 Buat Laporan Baru</strong>',
        formHTML,
        async () => {
            // Fungsi yang dipanggil saat tombol Simpan diklik
            const form = document.getElementById('modalLaporanForm');
            if (!form.checkValidity()) {
                // Trigger validation pada semua field
                const fields = form.querySelectorAll('input, textarea, select');
                fields.forEach(field => {
                    validateModalField(field);
                });
                
                // Scroll ke field pertama yang error
                const firstInvalid = form.querySelector('.is-invalid');
                if (firstInvalid) {
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                
                return false; // Mencegah modal ditutup
            }
            
            // Validasi foto
            const fotoInput = document.getElementById('modalFoto');
            if (!fotoInput || !fotoInput.files || fotoInput.files.length === 0) {
                fotoInput.classList.add('is-invalid');
                fotoInput.setCustomValidity('Mohon unggah foto bukti');
                fotoInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return false;
            }
            
            // Kumpulkan data form
            const formData = {
                alamat: document.getElementById('modalAlamat').value.trim(),
                deskripsi: document.getElementById('modalDeskripsi').value.trim(),
                latitude: parseFloat(document.getElementById('modalLatitude').value),
                longitude: parseFloat(document.getElementById('modalLongitude').value),
                foto: document.getElementById('modalFoto')?.files[0]
            };
            
            // Proses submit laporan
            await submitLaporan(formData);
            return true; // Tutup modal
        },
        () => {
            // Fungsi yang dipanggil saat modal ditutup
            console.log('Modal ditutup');
        }
    );
    
    // Setup setelah modal ditampilkan
    setTimeout(() => {
        // Set default values
        const defaultLat = -10.1935921;
        const defaultLng = 123.6149376;
        
        document.getElementById('modalLatitude').value = defaultLat;
        document.getElementById('modalLongitude').value = defaultLng;
        
        // Setup validation
        setupModalValidation();
        
        // Inisialisasi peta
        initModalMap();
        
        // Setup event listeners
        setupModalEventListeners();
    }, 100);
}

function setupModalValidation() {
    const form = document.getElementById('modalLaporanForm');
    if (!form) return;
    
    // Real-time validation untuk semua required fields
    const fields = form.querySelectorAll('input[required], textarea[required]');
    
    fields.forEach(field => {
        // Event listener untuk real-time validation
        field.addEventListener('input', function() {
            validateModalField(this);
        });
        
        field.addEventListener('blur', function() {
            validateModalField(this);
        });
    });
}

function validateModalField(field) {
    if (!field) return;
    
    // Clear previous validation
    field.classList.remove('is-valid', 'is-invalid');
    
    if (field.checkValidity()) {
        field.classList.add('is-valid');
    } else {
        field.classList.add('is-invalid');
    }
}

async function initModalMap() {
    try {
        const defaultLat = -10.1935921;
        const defaultLng = 123.6149376;
        
        const map = await initMapForm(
            "modalMapSelect", 
            "modalLatitude", 
            "modalLongitude", 
            defaultLat, 
            defaultLng
        );
        
        window.__formLaporanMap = map;
        window.__modalGpsMarker = null;
        
        // Event untuk klik peta
        map.on('click', function(e) {
            const { lat, lng } = e.latlng;
            
            const latInput = document.getElementById('modalLatitude');
            const lngInput = document.getElementById('modalLongitude');
            
            if (latInput && lngInput) {
                latInput.value = lat.toFixed(7);
                lngInput.value = lng.toFixed(7);
                
                // Validasi input setelah diisi
                validateModalField(latInput);
                validateModalField(lngInput);
            }
            
            // Hapus marker GPS jika ada
            if (window.__modalGpsMarker && map.hasLayer(window.__modalGpsMarker)) {
                map.removeLayer(window.__modalGpsMarker);
                window.__modalGpsMarker = null;
            }
            
            // Update marker default
            if (window.__formLaporanMarker && map.hasLayer(window.__formLaporanMarker)) {
                window.__formLaporanMarker.setOpacity(1);
                window.__formLaporanMarker.setLatLng([lat, lng]);
                window.__formLaporanMarker.bindPopup(`
                    <div style="max-width: 200px;">
                        <strong>📍 Lokasi Dipilih</strong><br>
                        <small>
                            Latitude: ${lat.toFixed(6)}<br>
                            Longitude: ${lng.toFixed(6)}<br>
                            <em>Lokasi dipilih manual di peta</em>
                        </small>
                    </div>
                `).openPopup();
            }
            
            // Reset GPS flag
            window.locationFromGPS = false;
            updateModalGPSStatus('manual', '📍 Lokasi dipilih manual');
            
            showToast("Lokasi dipilih ${lat.toFixed(6)}, ${lng.toFixed(6)}", { type: "info" });
        });
        
        // Refresh peta setelah modal terbuka
        setTimeout(() => {
            map.invalidateSize();
        }, 300);
        
    } catch (error) {
        console.error("Error inisialisasi peta:", error);
        showToast("Gagal memuat peta lokasi", { type: "error" });
    }
}

function setupModalEventListeners() {
    // Event listener untuk tombol GPS
    const btnGetLocation = document.getElementById('modalGetLocation');
    if (btnGetLocation) {
        btnGetLocation.addEventListener('click', getCurrentLocationForModal);
    }
    
    // Event listener untuk tombol Reset
    const btnResetMap = document.getElementById('modalResetMap');
    if (btnResetMap) {
        btnResetMap.addEventListener('click', resetModalMapToDefault);
    }
    
    // Event listener untuk tombol Pilih Lokasi di Peta
    const btnPilihLokasiPeta = document.getElementById('modalPilihLokasiPeta');
    if (btnPilihLokasiPeta) {
        btnPilihLokasiPeta.addEventListener('click', function() {
            showToast("Klik pada peta untuk memilih lokasi", { type: "info" });
            if (window.__formLaporanMap) {
                window.__formLaporanMap.invalidateSize();
            }
        });
    }
    
    // Event listener untuk preview gambar
    const fotoInput = document.getElementById('modalFoto');
    if (fotoInput) {
        fotoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const previewContainer = document.getElementById('modalPreviewContainer');
            const imagePreview = document.getElementById('modalImagePreview');
            
            // Clear previous validation
            this.classList.remove('is-invalid', 'is-valid');
            
            if (file) {
                // Validasi ukuran file (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    this.classList.add('is-invalid');
                    this.setCustomValidity('Ukuran file maksimal 5MB');
                    e.target.value = '';
                    previewContainer.style.display = 'none';
                    return;
                }
                
                // Validasi tipe file
                const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
                if (!validTypes.includes(file.type)) {
                    this.classList.add('is-invalid');
                    this.setCustomValidity('Format file harus JPG, JPEG, atau PNG');
                    e.target.value = '';
                    previewContainer.style.display = 'none';
                    return;
                }
                
                // File valid
                this.classList.add('is-valid');
                this.setCustomValidity('');
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    imagePreview.src = event.target.result;
                    previewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                this.classList.add('is-invalid');
                this.setCustomValidity('Mohon unggah foto bukti');
                previewContainer.style.display = 'none';
            }
        });
    }
}

// Fungsi untuk setup Bootstrap validation
function setupBootstrapValidation() {
    const form = document.getElementById('swalLaporanForm');
    if (!form) return;
    
    // Real-time validation untuk semua required fields
    const fields = form.querySelectorAll('input[required], textarea[required], select[required]');
    
    fields.forEach(field => {
        // Event listener untuk real-time validation
        field.addEventListener('input', function() {
            validateBootstrapField(this);
        });
        
        field.addEventListener('blur', function() {
            validateBootstrapField(this);
        });
    });
    
    // Event listener untuk form submission
    form.addEventListener('submit', function(event) {
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        form.classList.add('was-validated');
    }, false);
}

// Fungsi untuk validasi field Bootstrap
function validateBootstrapField(field) {
    if (!field) return;
    
    // Clear previous validation
    field.classList.remove('is-valid', 'is-invalid');
    
    if (field.checkValidity()) {
        field.classList.add('is-valid');
    } else {
        field.classList.add('is-invalid');
    }
}

// Fungsi untuk menampilkan pesan di form (versi Bootstrap)
function showSweetAlertBootstrapMessage(message, type = "info") {
    // Buat temporary message dengan Bootstrap styling
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type === "error" ? "danger" : type === "success" ? "success" : "info"} alert-dismissible fade show mt-2`;
    messageDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Tempatkan sebelum form
    const form = document.getElementById('swalLaporanForm');
    if (form) {
        form.parentNode.insertBefore(messageDiv, form);
        
        // Auto-remove setelah 5 detik
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

/**
 * Ambil lokasi saat ini menggunakan GPS
 */
function getCurrentLocationForModal() {
    if (isGettingLocation) return;
    
    console.log("📍 GPS button clicked - using REAL GPS");
    isGettingLocation = true;
    
    const btnGetLocation = document.getElementById("modalGetLocation");
    if (!btnGetLocation) {
        console.error("GPS button not found!");
        isGettingLocation = false;
        return;
    }
    
    if (!navigator.geolocation) {
        showToast("Browser tidak mendukung GPS", { type: "error" });
        isGettingLocation = false;
        return;
    }
    
    // UI loading
    btnGetLocation.disabled = true;
    btnGetLocation.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mengambil...';
    updateModalGPSStatus("loading", "Mendapatkan lokasi GPS...");
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                const accuracy = Math.round(position.coords.accuracy);
                
                console.log("GPS success:", { latitude, longitude, accuracy });
                
                // Update input form
                const latInput = document.getElementById('modalLatitude');
                const lngInput = document.getElementById('modalLongitude');
                
                if (latInput && lngInput) {
                    latInput.value = latitude.toFixed(7);
                    lngInput.value = longitude.toFixed(7);
                    validateModalField(latInput);
                    validateModalField(lngInput);
                }
                
                // Update peta
                if (window.__formLaporanMap) {
                    const map = window.__formLaporanMap;
                    
                    // Hapus marker GPS lama
                    if (window.__modalGpsMarker && map.hasLayer(window.__modalGpsMarker)) {
                        map.removeLayer(window.__modalGpsMarker);
                    }
                    
                    // Buat marker GPS baru
                    window.__modalGpsMarker = L.marker([latitude, longitude], {
                        icon: L.icon({
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34],
                            shadowSize: [41, 41]
                        }),
                        title: "Lokasi Saya (GPS)",
                        draggable: false,
                        zIndexOffset: 1000
                    }).addTo(map);
                    
                    window.__modalGpsMarker.bindPopup(`
                        <div style="max-width: 240px;">
                            <strong style="color:#2e7d32;">📍 LOKASI SAYA</strong><br>
                            <small>
                                <b>Latitude:</b> ${latitude.toFixed(6)}<br>
                                <b>Longitude:</b> ${longitude.toFixed(6)}<br>
                                <b>Akurasi:</b> ±${accuracy} meter
                            </small>
                        </div>
                    `).openPopup();
                    
                    // Redupkan marker default jika ada
                    if (window.__formLaporanMarker && map.hasLayer(window.__formLaporanMarker)) {
                        window.__formLaporanMarker.setOpacity(0.3);
                    }
                    
                    // Zoom ke lokasi
                    map.setView([latitude, longitude], 17);
                    setTimeout(() => map.invalidateSize(), 100);
                }
                
                // Update status
                window.locationFromGPS = true;
                updateModalGPSStatus("success", `✅ Lokasi ditemukan! Akurasi: ±${accuracy}m`);
                
                showModalMessage(`
                    <div style="background:#e8f5e9;padding:10px;border-radius:6px;border-left:4px solid #4CAF50;">
                        <strong style="color:#2e7d32;">✅ Lokasi berhasil diambil</strong><br>
                        <small>
                            Latitude: <b>${latitude.toFixed(6)}</b><br>
                            Longitude: <b>${longitude.toFixed(6)}</b><br>
                            Akurasi: ±${accuracy} meter
                        </small>
                    </div>
                `, "success");
                
            } catch (error) {
                console.error("Error in GPS success handler:", error);
                updateModalGPSStatus("error", "❌ Error memproses lokasi");
            } finally {
                // Reset tombol
                btnGetLocation.disabled = false;
                btnGetLocation.innerHTML = '<span style="font-size:16px;">📍</span> GPS Saya';
                isGettingLocation = false;
            }
        },
        (error) => {
            console.error("GPS error:", error);
            
            let message = "Gagal mengambil lokasi GPS";
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    message = "❌ Izin lokasi ditolak";
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = "❌ Lokasi tidak tersedia";
                    break;
                case error.TIMEOUT:
                    message = "❌ Permintaan lokasi timeout";
                    break;
            }
            
            updateModalGPSStatus("error", message);
            showToast(message, { type: "error" });
            
            // Reset tombol
            btnGetLocation.disabled = false;
            btnGetLocation.innerHTML = '<span style="font-size:16px;">📍</span> GPS Saya';
            isGettingLocation = false;
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}

function resetModalMapToDefault() {
    if (window.__formLaporanMap) {
        const map = window.__formLaporanMap;
        const defaultLat = -10.1935921;
        const defaultLng = 123.6149376;
        
        // Kembalikan ke view default
        map.setView([defaultLat, defaultLng], 13);
        
        // Hapus marker GPS jika ada
        if (window.__modalGpsMarker && map.hasLayer(window.__modalGpsMarker)) {
            map.removeLayer(window.__modalGpsMarker);
            window.__modalGpsMarker = null;
        }
        
        // Tampilkan marker default jika ada
        if (window.__formLaporanMarker && map.hasLayer(window.__formLaporanMarker)) {
            window.__formLaporanMarker.setOpacity(1);
            window.__formLaporanMarker.setLatLng([defaultLat, defaultLng]);
            window.__formLaporanMarker.bindPopup(`
                <div style="max-width: 200px;">
                    <strong>📍 Lokasi Default</strong><br>
                    <small>
                        Latitude: ${defaultLat}<br>
                        Longitude: ${defaultLng}<br>
                        <em>Klik peta atau gunakan GPS untuk memilih lokasi lain</em>
                    </small>
                </div>
            `).openPopup();
        }
        
        // Update input
        const latInput = document.getElementById('modalLatitude');
        const lngInput = document.getElementById('modalLongitude');
        
        if (latInput && lngInput) {
            latInput.value = defaultLat;
            lngInput.value = defaultLng;
            validateModalField(latInput);
            validateModalField(lngInput);
        }
        
        window.locationFromGPS = false;
        updateModalGPSStatus('manual', '📍 Lokasi default');
        
        showModalMessage("📍 Peta direset ke lokasi default Kupang", "info");
        
        // Refresh peta
        setTimeout(() => {
            map.invalidateSize();
        }, 200);
    }
}

function updateModalGPSStatus(status, message = '') {
    const gpsStatusDiv = document.getElementById('modalGpsStatus');
    if (!gpsStatusDiv) return;
    
    let statusHTML = '';
    
    switch (status) {
        case 'loading':
            statusHTML = `
                <div class="alert alert-primary d-flex align-items-center py-2" role="alert">
                    <i class="bi bi-hourglass-split me-2"></i>
                    <div>${message}</div>
                </div>
            `;
            break;
            
        case 'success':
            statusHTML = `
                <div class="alert alert-success d-flex align-items-center py-2" role="alert">
                    <i class="bi bi-check-circle me-2"></i>
                    <div>${message}</div>
                </div>
            `;
            break;
            
        case 'error':
            statusHTML = `
                <div class="alert alert-danger d-flex align-items-center py-2" role="alert">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <div>${message}</div>
                </div>
            `;
            break;
            
        case 'manual':
            statusHTML = `
                <div class="alert alert-info d-flex align-items-center py-2" role="alert">
                    <i class="bi bi-geo-alt me-2"></i>
                    <div>${message}</div>
                </div>
            `;
            break;
    }
    
    gpsStatusDiv.innerHTML = statusHTML;
}

function showModalMessage(message, type = "info") {
    // Cari atau buat container untuk pesan
    let messageDiv = document.getElementById('modalMessageContainer');
    
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'modalMessageContainer';
        const form = document.getElementById('modalLaporanForm');
        if (form) {
            form.parentNode.insertBefore(messageDiv, form);
        }
    }
    
    // Hapus pesan lama
    messageDiv.innerHTML = '';
    
    // Buat alert baru
    const alertClass = type === 'error' ? 'alert-danger' : 
                      type === 'success' ? 'alert-success' : 
                      type === 'warning' ? 'alert-warning' : 'alert-info';
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alertClass} alert-dismissible fade show mt-2`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    
    messageDiv.appendChild(alertDiv);
    
    // Auto-remove setelah 5 detik untuk pesan info
    if (type === 'info') {
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}


// Tambahkan fungsi untuk validasi lokasi
function validateAndForceLocation() {
    const latInput = document.getElementById('swalLatitude');
    const lngInput = document.getElementById('swalLongitude');
    
    if (latInput && lngInput) {
        // Jika lokasi dari GPS, PASTIKAN nilainya adalah lokasi Anda
        if (window.locationFromGPS) {
            const YOUR_FIXED_LATITUDE = -10.1711872;
            const YOUR_FIXED_LONGITUDE = 123.6149376;
            
            latInput.value = YOUR_FIXED_LATITUDE;
            lngInput.value = YOUR_FIXED_LONGITUDE;
            console.log("Forced location on validation");
        }
    }
}

/**
 * Reset peta ke lokasi default
 */
function resetMapToDefault() {
    console.log("Reset map button clicked"); // Debug log
    
    if (window.__formLaporanMap) {
        const map = window.__formLaporanMap;
        const defaultLat = -10.1935921;
        const defaultLng = 123.6149376;
        
        // Kembalikan ke view default
        map.setView([defaultLat, defaultLng], 13);
        
        // Hapus marker GPS jika ada
        if (window.gpsMarker && map.hasLayer(window.gpsMarker)) {
            map.removeLayer(window.gpsMarker);
            window.gpsMarker = null;
        }
        
        // Tampilkan marker default jika ada
        if (window.__formLaporanMarker && map.hasLayer(window.__formLaporanMarker)) {
            window.__formLaporanMarker.setOpacity(1);
            window.__formLaporanMarker.setLatLng([defaultLat, defaultLng]);
            
            // Open popup marker default
            window.__formLaporanMarker.bindPopup(`
                <div style="max-width: 200px;">
                    <strong>📍 Lokasi Default</strong><br>
                    <small>
                        Latitude: ${defaultLat}<br>
                        Longitude: ${defaultLng}<br>
                        <em>Klik peta atau gunakan GPS untuk memilih lokasi lain</em>
                    </small>
                </div>
            `).openPopup();
        }
        
        // Update input
        const latInput = document.getElementById('swalLatitude');
        const lngInput = document.getElementById('swalLongitude');
        
        if (latInput && lngInput) {
            latInput.value = defaultLat;
            lngInput.value = defaultLng;
        }
        
        window.locationFromGPS = false;
        updateGPSStatus('manual');
        
        showMessageInForm("📍 Peta direset ke lokasi default Kupang", "info");
        
        // Refresh peta
        setTimeout(() => {
            map.invalidateSize();
        }, 200);
    } else {
        console.error("Map not found!");
        showMessageInForm("❌ Peta tidak ditemukan. Silakan refresh halaman.", "error");
    }
}

/**
 * Update status GPS di UI
 */
function updateGPSStatus(status, customMessage = null) {
    const loadingEl = document.getElementById('gpsLoading');
    const successEl = document.getElementById('gpsSuccess');
    const errorEl = document.getElementById('gpsError');
    
    if (!loadingEl || !successEl || !errorEl) return;
    
    // Reset semua status
    loadingEl.style.display = 'none';
    successEl.style.display = 'none';
    errorEl.style.display = 'none';
    
    // Tampilkan status yang sesuai
    switch (status) {
        case 'loading':
            loadingEl.style.display = 'block';
            break;
            
        case 'success':
            if (customMessage) {
                successEl.innerHTML = `<span>${customMessage}</span>`;
            } else {
                successEl.innerHTML = '<span>✅ Lokasi GPS ditemukan!</span>';
            }
            successEl.style.color = '#4CAF50'; // Hijau untuk sukses
            successEl.style.display = 'block';
            break;
            
        case 'error':
            errorEl.style.display = 'block';
            break;
            
        case 'manual':
            // Status manual (klik peta)
            successEl.innerHTML = '<span>📍 Lokasi dipilih manual di peta</span>';
            successEl.style.color = '#2196F3'; // Biru untuk manual
            successEl.style.display = 'block';
            break;
    }
}

/**
 * Tampilkan pesan dalam form
 */
function showMessageInForm(message, type = "info") {
    const messageDiv = document.getElementById("formMessage");
    if (!messageDiv) return;
    
    messageDiv.innerHTML = "";
    messageDiv.style.padding = "10px 15px";
    messageDiv.style.borderRadius = "6px";
    messageDiv.style.marginTop = "10px";
    messageDiv.style.fontSize = "14px";
    
    if (type === "error") {
        messageDiv.style.backgroundColor = "#ffebee";
        messageDiv.style.color = "#c62828";
        messageDiv.style.border = "1px solid #ffcdd2";
    } else if (type === "success") {
        messageDiv.style.backgroundColor = "#e8f5e9";
        messageDiv.style.color = "#2e7d32";
        messageDiv.style.border = "1px solid #c8e6c9";
    } else if (type === "warning") {
        messageDiv.style.backgroundColor = "#fff8e1";
        messageDiv.style.color = "#856404";
        messageDiv.style.border = "1px solid #ffeaa7";
    } else {
        messageDiv.style.backgroundColor = "#e3f2fd";
        messageDiv.style.color = "#1565c0";
        messageDiv.style.border = "1px solid #bbdefb";
    }
    
    messageDiv.innerHTML = message;
    
    // Auto-hide untuk pesan info
    if (type === "info") {
        setTimeout(() => {
            if (messageDiv.textContent.includes(message.substring(0, 50))) {
                messageDiv.innerHTML = "";
                // ✅ PERBAIKAN: Jangan reset style ke string kosong
                messageDiv.style.padding = "";
                messageDiv.style.borderRadius = "";
                messageDiv.style.marginTop = "";
                messageDiv.style.fontSize = "";
                messageDiv.style.backgroundColor = "";
                messageDiv.style.color = "";
                messageDiv.style.border = "";
            }
        }, 5000);
    }
}

// Fungsi untuk menampilkan peta pemilihan lokasi
function showMapPicker() {
    const mapHTML = `
        <div style="margin-bottom: 15px;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Klik pada peta untuk memilih lokasi</p>
            <div id="pickerMap" style="height: 300px; width: 100%; border: 1px solid #ddd; border-radius: 6px;"></div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
            <div>
                <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #333;">Latitude</label>
                <input type="text" id="pickerLatitude" class="swal2-input" placeholder="-10.1935921" readonly>
            </div>
            <div>
                <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #333;">Longitude</label>
                <input type="text" id="pickerLongitude" class="swal2-input" placeholder="123.6149376" readonly>
            </div>
        </div>
    `;
    
    Swal.fire({
        title: '📍 Pilih Lokasi',
        html: mapHTML,
        width: '600px',
        showCancelButton: true,
        confirmButtonText: 'Gunakan Lokasi Ini',
        cancelButtonText: 'Batal',
        didOpen: () => {
            // Inisialisasi peta
            loadLeaflet(() => {
                const map = initMap("pickerMap", -10.1935921, 123.6149376, 13);
                
                // Tambahkan marker yang bisa dipindah
                let marker = L.marker([-10.1935921, 123.6149376], {
                    draggable: true
                }).addTo(map);
                
                // Event untuk klik peta
                map.on('click', function(e) {
                    const { lat, lng } = e.latlng;
                    marker.setLatLng([lat, lng]);
                    document.getElementById('pickerLatitude').value = lat.toFixed(7);
                    document.getElementById('pickerLongitude').value = lng.toFixed(7);
                });
                
                // Event untuk drag marker
                marker.on('dragend', function(e) {
                    const position = marker.getLatLng();
                    document.getElementById('pickerLatitude').value = position.lat.toFixed(7);
                    document.getElementById('pickerLongitude').value = position.lng.toFixed(7);
                });
                
                // Set initial values
                document.getElementById('pickerLatitude').value = -10.1935921;
                document.getElementById('pickerLongitude').value = 123.6149376;
            });
            // Debug: Cek apakah tombol ditemukan
            setTimeout(() => {
                console.log("GPS button exists:", !!document.getElementById('btnGetLocation'));
                console.log("Reset button exists:", !!document.getElementById('btnResetMap'));
                console.log("Peta button exists:", !!document.getElementById('btnPilihLokasiPeta'));
            }, 100);
        },
        preConfirm: () => {
            const lat = document.getElementById('pickerLatitude').value;
            const lng = document.getElementById('pickerLongitude').value;
            
            if (!lat || !lng) {
                Swal.showValidationMessage('Silakan pilih lokasi di peta');
                return false;
            }
            
            return { latitude: lat, longitude: lng };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Simpan ke variabel global
            selectedLocation.latitude = result.value.latitude;
            selectedLocation.longitude = result.value.longitude;

            Swal.fire({
                icon: 'success',
                title: 'Lokasi Dipilih',
                text: `Lat: ${result.value.latitude}, Lng: ${result.value.longitude}`,
                timer: 1200,
                showConfirmButton: false
            });

            showCreateLaporanForm();
        }
    });
}

// Fungsi untuk submit laporan dengan SweetAlert
async function submitLaporan(formData) {
    // Tampilkan loading (Anda bisa buat fungsi loading di modal.js)
    showToast("Mengirim laporan...", "info");
    
    if (!currentUser) {
        const user = await authGuard();
        if (!user) {
            showModalMessage("Session expired, silakan login kembali", "error");
            return false;
        }
        currentUser = user;
    }
    
    try {
        // Prepare payload
        const payload = {
            nama: currentUser.username,
            alamat: formData.alamat,
            deskripsi: formData.deskripsi,
            latitude: formData.latitude,
            longitude: formData.longitude,
            tanggal_lapor: new Date().toISOString().split("T")[0],
            idUser: parseInt(currentUser.id),
            status: "pending"
        };
        
        // Kirim laporan
        const response = await fetch(API.laporanSampah, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            throw new Error(`Invalid response from server: ${response.status}`);
        }
        
        if (!response.ok) {
            let errorDetail = "";
            if (data && typeof data === "object") {
                for (const [key, value] of Object.entries(data)) {
                    if (Array.isArray(value)) {
                        errorDetail += `${key}: ${value.join(", ")}\n`;
                    } else {
                        errorDetail += `${key}: ${value}\n`;
                    }
                }
            }
            throw new Error(`HTTP ${response.status}\n${errorDetail}`);
        }
        
        // Jika ada foto, upload
        let fotoUploaded = false;
        if (formData.foto) {
            showModalMessage("Mengupload foto...", "info");
            fotoUploaded = await uploadFoto(data.idLaporan || data.id, formData.foto);
        }
        
        // Success - tampilkan pesan sukses sebelum modal ditutup
        showToast("Laporan berhasil dikirim", "success");
        alert("Laporan berhasil dikirim");
        
        // Tunggu sebentar agar pesan terlihat, lalu refresh halaman
        setTimeout(() => {
            laporanPage();
        }, 2000);
        
        return true;
        
    } catch (error) {
        console.error("Error submitting laporan:", error);
        showToast("Gagal mengirim laporan", "error");
        return false;
    }
}

async function uploadFoto(laporanId, foto) {
    const formData = new FormData();
    formData.append("foto_bukti", foto);
    
    try {
        const response = await fetch(`${API.laporanSampah}${laporanId}/`, {
            method: "PATCH",
            headers: getAuthHeadersMultipart(), // Gunakan ini untuk FormData
            body: formData
        });
        
        if (response.ok) {
            console.log("✅ Foto berhasil diupload");
            return true;
        } else {
            const errorData = await response.json();
            console.warn("Gagal upload foto:", errorData);
            return false;
        }
    } catch (error) {
        console.warn("Error uploading foto:", error);
        return false;
    }
}

function showMessage(message, type = "info", element) {
    if (!element) return;
    
    element.innerHTML = "";
    element.style.padding = "12px 15px";
    element.style.borderRadius = "6px";
    element.style.marginTop = "10px";
    element.style.fontSize = "14px";
    
    if (type === "error") {
        element.style.backgroundColor = "#ffebee";
        element.style.color = "#c62828";
        element.style.border = "1px solid #ffcdd2";
    } else if (type === "success") {
        element.style.backgroundColor = "#e8f5e9";
        element.style.color = "#2e7d32";
        element.style.border = "1px solid #c8e6c9";
    } else {
        element.style.backgroundColor = "#e3f2fd";
        element.style.color = "#1565c0";
        element.style.border = "1px solid #bbdefb";
    }
    
    element.textContent = message;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateString;
    }
}

// Ganti fungsi showLaporanOnMap untuk menggunakan modal
window.showLaporanOnMap = function(latitude, longitude, deskripsi = '') {
    const mapHTML = `
        <div style="margin-bottom: 15px;">
            ${deskripsi ? `
                <div style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                    <p style="margin: 0; font-size: 14px; color: #333;">${deskripsi}</p>
                </div>
            ` : ''}
            <div id="detailMap" style="height: 300px; width: 100%; border: 1px solid #ddd; border-radius: 6px;"></div>
        </div>
    `;
    
    // Gunakan modal custom untuk menampilkan peta
    showModal(
        '📍 Lokasi Laporan',
        mapHTML,
        null, // Tidak ada tombol simpan
        () => {
            // Cleanup saat modal ditutup
        }
    );
    
    // Inisialisasi peta setelah modal terbuka
    setTimeout(() => {
        loadLeaflet(() => {
            const map = initMap("detailMap", latitude, longitude, 15);
            addMarker(map, latitude, longitude, deskripsi || "Lokasi Laporan");
            
            // Refresh peta
            setTimeout(() => {
                map.invalidateSize();
            }, 200);
        });
    }, 100);
};

window.applyLaporanFilters = applyLaporanFilters;
window.resetLaporanFilters = resetLaporanFilters;
window.renderLaporanPage = renderLaporanPage;
