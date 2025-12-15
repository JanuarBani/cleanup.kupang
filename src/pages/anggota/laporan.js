import { API, getAuthHeaders, getAuthHeadersMultipart, fetchAPI } from "../../api.js";
import { authGuard } from "../../utils/authGuard.js";
import { loadLeaflet, initMap, addMarker, initMapForm } from "../../utils/mapConfig.js";
import { showLaporanDetail } from "./detail_laporan.js";

// Deklarasi variabel global untuk user
let currentUser = null;

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

    // Validasi role
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

            <!-- Modal Form -->
            <div id="formModal" style="display: none;"></div>
        </div>
    `;

    // Load data
    await Promise.all([
        loadLaporan(),
        loadStatistics(),
        loadMap()
    ]);

    // Event listener untuk buat laporan
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

        // Tampilkan laporan yang sudah difilter
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                ${filteredData.map(laporan => renderLaporanCard(laporan)).join('')}
            </div>
            
            <!-- Summary info -->
            <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                <small style="color: #666;">
                    Menampilkan <strong>${filteredData.length}</strong> dari <strong>${data.length}</strong> laporan
                    ${filters.status ? ` | Status: ${filters.status}` : ''}
                    ${filters.myReport ? ` | ${filters.myReport === 'my' ? 'Laporan Saya' : 'Laporan Orang Lain'}` : ''}
                </small>
            </div>
        `;

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

async function loadLaporan() {
    await loadLaporanWithContainer("laporanContainer");
}

function renderLaporanCard(laporan) {
    const statusColors = {
        'selesai': '#4CAF50',
        'diproses': '#2196F3',
        'diterima': '#FF9800',
        'ditolak': '#f44336',
        'dilaporkan': '#9C27B0',
        'default': '#757575'
    };
    
    const status = laporan.status || 'dilaporkan';
    const statusColor = statusColors[status] || statusColors.default;
    
    // Tentukan apakah laporan ini milik user saat ini
    const isMyReport = currentUser && (
        laporan.idUser === currentUser.id || 
        laporan.id_user === currentUser.id ||
        laporan.nama === currentUser.username
    );
    
    // Tampilkan nama pelapor
    const reporterName = laporan.nama || 'Tidak diketahui';
    
    return `
        <div style="background: white; border: 1px solid #eee; border-radius: 8px; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s;"
             onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
            ${laporan.foto_bukti ? `
                <div style="height: 180px; overflow: hidden; position: relative;">
                    <img src="${laporan.foto_bukti}" 
                         alt="Foto laporan" 
                         style="width: 100%; height: 100%; object-fit: cover;">
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
                        <h3 style="margin: 0; font-size: 18px; color: #333;">${laporan.deskripsi?.substring(0, 50) || 'Laporan Sampah'}${laporan.deskripsi?.length > 50 ? '...' : ''}</h3>
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
                            <div style="font-size: 14px; font-weight: 500;">${laporan.alamat?.substring(0, 60) || 'Tidak ada alamat'}${laporan.alamat?.length > 60 ? '...' : ''}</div>
                            <small style="font-size: 12px; color: #888;">Lokasi</small>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; color: #555;">
                        <span style="font-size: 14px; min-width: 20px;">📅</span>
                        <div>
                            <div style="font-size: 14px; font-weight: 500;">${formatDate(laporan.tanggal_lapor)}</div>
                            <small style="font-size: 12px; color: #888;">Tanggal Lapor</small>
                        </div>
                    </div>
                </div>
                
                ${laporan.latitude && laporan.longitude ? `
                    <button onclick="showLaporanDetail(${laporan.idLaporan || laporan.id})" 
                            style="width: 100%; background: #2196F3; color: white; border: none; padding: 10px; border-radius: 6px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s;"
                            onmouseover="this.style.background='#1976D2'"
                            onmouseout="this.style.background='#2196F3'">
                        <span style="font-size: 16px;">🔍</span> Detail Laporan
                    </button>
                ` : `
                    <button onclick="showLaporanDetail(${laporan.idLaporan || laporan.id})" 
                            style="width: 100%; background: #757575; color: white; border: none; padding: 10px; border-radius: 6px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <span style="font-size: 16px;">🔍</span> Detail Laporan
                    </button>
                `}
                    <div style="width: 100%; background: #f5f5f5; border: 1px dashed #ddd; color: #999; padding: 10px; border-radius: 6px; font-size: 14px; text-align: center;">
                        📍 Tidak ada lokasi
                    </div>
            </div>
        </div>
    `;
}

// Update fungsi showLaporanOnMap untuk menerima deskripsi
window.showLaporanOnMap = function(latitude, longitude, deskripsi = '') {
    const modal = document.getElementById("formModal") || document.createElement('div');
    modal.id = 'formModal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div style="background: white; width: 90%; max-width: 500px; border-radius: 10px; padding: 0;">
                <div style="background: #4CAF50; color: white; padding: 15px 20px; border-radius: 10px 10px 0 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; font-size: 18px;">📍 Lokasi Laporan</h3>
                        <button onclick="document.getElementById('formModal').style.display='none'" 
                                style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0;">
                            ×
                        </button>
                    </div>
                </div>
                <div style="padding: 20px;">
                    ${deskripsi ? `
                        <div style="margin-bottom: 15px; padding: 12px; background: #f8f9fa; border-radius: 6px;">
                            <p style="margin: 0; font-size: 14px; color: #333;">${deskripsi}</p>
                        </div>
                    ` : ''}
                    <div id="detailMap" style="height: 300px; border-radius: 6px; overflow: hidden; border: 1px solid #ddd;"></div>
                    <div style="margin-top: 15px; text-align: center;">
                        <button onclick="document.getElementById('formModal').style.display='none'"
                                style="background: #757575; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    loadLeaflet(() => {
        const map = initMap("detailMap", latitude, longitude, 15);
        addMarker(map, latitude, longitude, deskripsi || "Lokasi Laporan");
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

// Fungsi addMarker yang mendukung custom color (perlu ditambahkan ke mapConfig.js)
// Jika belum ada, tambahkan parameter color ke fungsi addMarker di mapConfig.js

function showCreateLaporanForm() {
    const modal = document.getElementById("formModal");
    if (!modal) return;

    modal.style.display = 'block';
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div style="background: white; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; border-radius: 10px; padding: 0;">
                <div style="background: linear-gradient(135deg, #2196F3, #1976D2); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin: 0; font-size: 20px;">📝 Buat Laporan Baru</h2>
                        <button onclick="document.getElementById('formModal').style.display='none'" 
                                style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0;">
                            ×
                        </button>
                    </div>
                </div>
                
                <div style="padding: 25px;">
                    <form id="formLaporan">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">Alamat Lokasi Sampah</label>
                            <input type="text" id="alamat" placeholder="Contoh: Jl. Sudirman No. 10, RT 01/RW 02" required
                                   style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">Deskripsi Sampah</label>
                            <textarea id="deskripsi" placeholder="Jelaskan kondisi sampah (jenis, volume, kondisi sekitar)" required rows="4"
                                      style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; resize: vertical;"></textarea>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">
                                📍 Pilih Lokasi di Peta (Klik pada peta)
                            </label>
                            <div id="mapForm" style="height: 250px; width: 100%; border: 1px solid #ddd; border-radius: 6px;"></div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">Latitude</label>
                                <input type="number" step="0.00000001" id="latitude" placeholder="-10.1935921" required readonly
                                       style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; background: #f9f9f9;">
                            </div>
                            
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">Longitude</label>
                                <input type="number" step="0.00000001" id="longitude" placeholder="123.6149376" required readonly
                                       style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; background: #f9f9f9;">
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">📷 Foto Bukti (Opsional)</label>
                            <p style="margin: 0 0 10px 0; font-size: 13px; color: #666;">Maksimal 5MB. Format: JPG, PNG, JPEG</p>
                            <input type="file" id="foto" accept="image/*"
                                   style="width: 100%; padding: 12px; border: 2px dashed #ddd; border-radius: 6px; font-size: 14px;">
                            
                            <div id="previewContainer" style="margin-top: 15px; display: none;">
                                <img id="imagePreview" style="max-width: 100%; max-height: 200px; border-radius: 6px; border: 1px solid #ddd;">
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 10px;">
                            <button type="submit" id="btnSubmit"
                                    style="flex: 1; background: #4CAF50; color: white; border: none; padding: 14px; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                📤 Kirim Laporan
                            </button>
                            <button type="button" onclick="document.getElementById('formModal').style.display='none'"
                                    style="flex: 1; background: #757575; color: white; border: none; padding: 14px; border-radius: 6px; font-size: 16px; cursor: pointer;">
                                ❌ Batal
                            </button>
                        </div>
                        
                        <div id="formMessage" style="margin-top: 15px;"></div>
                    </form>
                </div>
            </div>
        </div>
    `;

    // Initialize map
    loadLeaflet(() => {
        initMapForm("mapForm", "latitude", "longitude", -10.1935921, 123.6149376, 13);
    });

    // Image preview
    document.getElementById("foto").onchange = function(e) {
        const file = e.target.files[0];
        const previewContainer = document.getElementById("previewContainer");
        const imagePreview = document.getElementById("imagePreview");
        
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showMessage("Ukuran file maksimal 5MB", "error", document.getElementById("formMessage"));
                e.target.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                imagePreview.src = event.target.result;
                previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            previewContainer.style.display = 'none';
        }
    };

    // Form submission
    document.getElementById("formLaporan").onsubmit = async (e) => {
        e.preventDefault();
        await submitLaporanForm();
    };
}

async function submitLaporanForm() {
    const btnSubmit = document.getElementById("btnSubmit");
    const formMessage = document.getElementById("formMessage");
    
    if (!currentUser) {
        const user = await authGuard();
        if (!user) {
            showMessage("Session expired. Please login again.", "error", formMessage);
            return;
        }
        currentUser = user;
    }

    // Validate form
    const alamat = document.getElementById("alamat").value.trim();
    const deskripsi = document.getElementById("deskripsi").value.trim();
    const latitude = parseFloat(document.getElementById("latitude").value);
    const longitude = parseFloat(document.getElementById("longitude").value);

    if (!alamat || !deskripsi || isNaN(latitude) || isNaN(longitude)) {
        showMessage("Harap lengkapi semua field yang wajib diisi", "error", formMessage);
        return;
    }

    // Prepare payload sesuai model Django
    const payload = {
        nama: currentUser.username,
        alamat: alamat,
        deskripsi: deskripsi,
        latitude: latitude,
        longitude: longitude,
        tanggal_lapor: new Date().toISOString().split("T")[0],
        idUser: parseInt(currentUser.id), // Pastikan integer
        status: "pending" // Default dari model
    };

    console.log("Submitting laporan payload:", payload);

    // Show loading
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = "⏳ Mengirim...";
    showMessage("Mengirim laporan...", "info", formMessage);

    try {
        const response = await fetch(API.laporanSampah, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        console.log("Response status:", response.status);

        let data;
        try {
            data = await response.json();
            console.log("Response data:", data);
        } catch (jsonError) {
            const text = await response.text();
            console.error("JSON parse error:", jsonError);
            console.log("Raw response:", text.substring(0, 200));
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

        // Success
        showMessage("✅ Laporan berhasil dikirim! Status: PENDING", "success", formMessage);
        btnSubmit.innerHTML = "✅ Berhasil Dikirim";
        
        // Jika ada foto, upload terpisah
        const foto = document.getElementById("foto").files[0];
        if (foto) {
            showMessage("Mengupload foto...", "info", formMessage);
            await uploadFoto(data.idLaporan || data.id, foto);
        }
        
        setTimeout(() => {
            document.getElementById("formModal").style.display = 'none';
            laporanPage();
        }, 2000);

    } catch (error) {
        console.error("Error submitting laporan:", error);
        
        let errorMessage = "❌ Gagal mengirim laporan";
        if (error.message.includes("400")) {
            errorMessage += "\nFormat data tidak sesuai dengan backend.";
        }
        
        showMessage(`${errorMessage}\n${error.message.substring(0, 100)}`, "error", formMessage);
        
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = "📤 Kirim Laporan";
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

// Global function untuk peta
window.showLaporanOnMap = function(latitude, longitude) {
    const modal = document.getElementById("formModal") || document.createElement('div');
    modal.id = 'formModal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div style="background: white; width: 90%; max-width: 500px; border-radius: 10px; padding: 0;">
                <div style="background: #4CAF50; color: white; padding: 15px 20px; border-radius: 10px 10px 0 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; font-size: 18px;">📍 Lokasi Laporan</h3>
                        <button onclick="document.getElementById('formModal').style.display='none'" 
                                style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0;">
                            ×
                        </button>
                    </div>
                </div>
                <div style="padding: 20px;">
                    <div id="detailMap" style="height: 300px; border-radius: 6px; overflow: hidden;"></div>
                    <div style="margin-top: 15px; text-align: center;">
                        <button onclick="document.getElementById('formModal').style.display='none'"
                                style="background: #757575; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    loadLeaflet(() => {
        const map = initMap("detailMap", latitude, longitude, 15);
        addMarker(map, latitude, longitude, "Lokasi Laporan");
    });
};

window.applyLaporanFilters = applyLaporanFilters;
window.resetLaporanFilters = resetLaporanFilters;