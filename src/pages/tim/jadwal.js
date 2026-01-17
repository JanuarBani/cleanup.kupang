import { API, getAuthHeaders, fetchAPI } from "../../api.js";

// BUAT MODAL FUNCTIONS SENDIRI
function showModal(title, content, onConfirm = null, confirmText = "Simpan", cancelText = "Batal") {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 8px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        ">
            <div style="
                padding: 20px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <h3 style="margin: 0;">${title}</h3>
                <button id="closeModal" style="
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #666;
                ">×</button>
            </div>
            <div style="padding: 20px;" id="modalContent">
                ${content}
            </div>
            <div style="
                padding: 15px 20px;
                border-top: 1px solid #eee;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            ">
                <button id="cancelBtn" style="
                    padding: 8px 16px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">${cancelText}</button>
                ${onConfirm ? `
                <button id="confirmBtn" style="
                    padding: 8px 16px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">${confirmText}</button>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeModal = () => document.body.removeChild(modal);
    
    document.getElementById('closeModal').onclick = closeModal;
    document.getElementById('cancelBtn').onclick = closeModal;
    
    if (onConfirm) {
        document.getElementById('confirmBtn').onclick = () => {
            onConfirm();
            closeModal();
        };
    }
    
    const handleEsc = (e) => {
        if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleEsc);
    
    modal._closeModal = closeModal;
    modal._handleEsc = handleEsc;
    
    return modal;
}

function showConfirmModal(message, onConfirm, title = "Konfirmasi", confirmText = "Ya", cancelText = "Tidak") {
    return showModal(title, `
        <div style="padding: 20px 0;">
            <p style="margin: 0 0 20px 0;">${message}</p>
        </div>
    `, onConfirm, confirmText, cancelText);
}

// Pagination variables
let detailAllData = [];
let detailCurrentPage = 1;
let detailPerPage = 10;

// Get user from localStorage
let iduser;
let user;
let username;

export async function detailAnggotaJadwalTimAngkutPage() {

    // Get user from localStorage
    iduser = localStorage.getItem("user");
    if (!iduser) {
        window.location.href = "#/login";
        return;
    }
    user = JSON.parse(iduser);
    username = user ? user.username : null;

    if (!username) {
        console.error("User not found in localStorage");
        return;
    }
    
    const mainContent = document.getElementById("mainContent");
    mainContent.innerHTML = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>📅 Jadwal Pengangkutan Tim ${username}</h2>
                <button id="refreshBtn" style="padding: 8px 16px; background: #17a2b8; color: white;">🔄 Refresh</button>
            </div>
            
            <div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                <select id="filterTanggal" style="padding: 8px; width: 200px;">
                    <option value="">Semua Tanggal</option>
                    <option value="hari-ini">Hari Ini</option>
                    <option value="minggu-ini">Minggu Ini</option>
                    <option value="bulan-ini">Bulan Ini</option>
                </select>
                <select id="filterStatus" style="padding: 8px; width: 200px;">
                    <option value="">Semua Status</option>
                    <option value="terjadwal">Terjadwal</option>
                    <option value="dalam_proses">Dalam Proses</option>
                    <option value="selesai">Selesai</option>
                    <option value="dibatalkan">Dibatalkan</option>
                </select>
                <input type="text" id="searchAnggota" placeholder="Cari nama anggota..." style="padding: 8px; width: 250px;">
            </div>
            
            <!-- Stats Overview -->
            <div id="statsOverview" style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            ">
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #1976d2;">0</div>
                    <div style="font-size: 14px; color: #555;">Total Jadwal</div>
                </div>
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #ff9800;">0</div>
                    <div style="font-size: 14px; color: #555;">Dalam Proses</div>
                </div>
                <div style="background: #d4edda; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #28a745;">0</div>
                    <div style="font-size: 14px; color: #555;">Selesai</div>
                </div>
                <div style="background: #f8d7da; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #dc3545;">0</div>
                    <div style="font-size: 14px; color: #555;">Dibatalkan</div>
                </div>
            </div>
            
            <div id="detailTableContainer">
                <p>Loading data...</p>
            </div>
            
            <!-- Pagination Container -->
            <div id="detailPagination" style="margin-top: 20px; display: flex; justify-content: center; align-items: center;"></div>
        </div>
    `;

    document.getElementById('refreshBtn').onclick = loadDetailAnggotaJadwalTimAngkut;
    document.getElementById('filterTanggal').onchange = loadDetailAnggotaJadwalTimAngkut;
    document.getElementById('filterStatus').onchange = loadDetailAnggotaJadwalTimAngkut;
    document.getElementById('searchAnggota').oninput = loadDetailAnggotaJadwalTimAngkut;
    
    // Load data
    loadDetailAnggotaJadwalTimAngkut();
}

async function loadDetailAnggotaJadwalTimAngkut() {
    const filterTanggal = document.getElementById('filterTanggal').value;
    const filterStatus = document.getElementById('filterStatus').value;
    const searchAnggota = document.getElementById('searchAnggota').value;
    
    try {
        // Load data detail
        const details = await fetchAPI(API.detailAnggotaJadwal, {
            headers: getAuthHeaders()
        });

        console.log("Semua data jadwal:", details);
        console.log("Username yang login:", username);

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Filter data berdasarkan nama_tim yang sama dengan username
        const filteredDetails = details.filter(detail => {
            const tanggalJadwal = detail.tanggal_jadwal || '';
            const namaAnggota = detail.nama_anggota || '';
            const status = detail.status_pengangkutan || '';
            const namaTim = detail.nama_tim || '';
            
            // Filter utama: nama_tim harus sama dengan username
            const matchTim = namaTim === username;
            
            if (!matchTim) {
                console.log(`Data ${detail.id} tidak sesuai: nama_tim=${namaTim}, username=${username}`);
                return false;
            }
            
            // Filter tanggal
            let matchTanggal = true;
            if (filterTanggal) {
                if (!tanggalJadwal) return false;
                const jadwalDate = new Date(tanggalJadwal);
                const jadwalDay = new Date(jadwalDate.getFullYear(), jadwalDate.getMonth(), jadwalDate.getDate());
                
                if (filterTanggal === 'hari-ini') {
                    matchTanggal = jadwalDay.getTime() === today.getTime();
                } else if (filterTanggal === 'minggu-ini') {
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    matchTanggal = jadwalDate >= weekStart && jadwalDate <= weekEnd;
                } else if (filterTanggal === 'bulan-ini') {
                    matchTanggal = jadwalDate.getMonth() === today.getMonth() && 
                                  jadwalDate.getFullYear() === today.getFullYear();
                }
            }
            
            // Filter status
            const matchStatus = !filterStatus || status === filterStatus;
            
            // Search anggota
            const matchSearch = !searchAnggota || 
                namaAnggota.toLowerCase().includes(searchAnggota.toLowerCase());
            
            return matchTim && matchTanggal && matchStatus && matchSearch;
        });

        console.log("Data setelah filter:", filteredDetails);
        
        // Simpan semua data ke variabel global
        detailAllData = filteredDetails;
        
        // Reset ke halaman 1 saat filter berubah
        detailCurrentPage = 1;

        // Update stats
        updateStatsOverview(filteredDetails);
        
        // Render table dengan pagination
        renderDetailTableTimAngkut();
    } catch (error) {
        document.getElementById('detailTableContainer').innerHTML = 
            `<p style="color: red;">Error loading data: ${error.message}</p>`;
        document.getElementById('detailPagination').innerHTML = '';
    }
}

function updateStatsOverview(details) {
    const stats = {
        total: details.length,
        terjadwal: details.filter(d => d.status_pengangkutan === 'terjadwal').length,
        dalam_proses: details.filter(d => d.status_pengangkutan === 'dalam_proses').length,
        selesai: details.filter(d => d.status_pengangkutan === 'selesai').length,
        dibatalkan: details.filter(d => d.status_pengangkutan === 'dibatalkan').length
    };
    
    document.querySelector('#statsOverview div:nth-child(1) div:first-child').textContent = stats.total;
    document.querySelector('#statsOverview div:nth-child(2) div:first-child').textContent = stats.dalam_proses;
    document.querySelector('#statsOverview div:nth-child(3) div:first-child').textContent = stats.selesai;
    document.querySelector('#statsOverview div:nth-child(4) div:first-child').textContent = stats.dibatalkan;
}

function renderDetailTableTimAngkut() {
    const container = document.getElementById('detailTableContainer');
    const paginationContainer = document.getElementById('detailPagination');
    
    if (!container) return;

    // Urutkan data berdasarkan tanggal_jadwal (terbaru ke terlama)
    detailAllData.sort((a, b) => {
        const dateA = new Date(a.tanggal_jadwal);
        const dateB = new Date(b.tanggal_jadwal);

        // Jika tanggal tidak valid, dorong ke bawah
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;

        return dateB - dateA; // DESC (new → old)
    });


    // Hitung data yang akan ditampilkan
    const totalData = detailAllData.length;
    const totalPages = Math.ceil(totalData / detailPerPage);

    // Validasi halaman saat ini
    if (detailCurrentPage > totalPages && totalPages > 0) {
        detailCurrentPage = totalPages;
    }
    
    // Jika tidak ada data, reset ke halaman 1
    if (totalData === 0) {
        detailCurrentPage = 1;
    }

    // Ambil data untuk halaman saat ini
    const startIndex = (detailCurrentPage - 1) * detailPerPage;
    const endIndex = Math.min(startIndex + detailPerPage, totalData);
    const currentPageData = detailAllData.slice(startIndex, endIndex);

    // Hitung angka untuk display
    const startData = totalData > 0 ? startIndex + 1 : 0;
    const endData = endIndex;

    if (!currentPageData || currentPageData.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                <div style="font-size: 48px; color: #6c757d; margin-bottom: 15px;">📭</div>
                <h3 style="color: #6c757d;">Tidak ada jadwal</h3>
                <p style="color: #6c757d;">Tidak ada jadwal pengangkutan yang ditugaskan ke tim Anda (${username}).</p>
            </div>
        `;
        paginationContainer.innerHTML = '';
        return;
    }

    const tableHTML = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; min-width: 900px;">
                <thead>
                    <tr style="background: #f2f2f2;">
                        <th style="padding: 10px; border: 1px solid #ddd;">No</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Tanggal</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Anggota</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Nama Tim</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Status</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Catatan</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Detail</th>
                    </tr>
                </thead>
                <tbody>
                    ${currentPageData.map((detail, index) => {
                        const detailId = detail.id || 'N/A';
                        const tanggalJadwal = detail.tanggal_jadwal || '';
                        const namaAnggota = detail.nama_anggota || 'Anggota';
                        const namaTim = detail.nama_tim || 'N/A';
                        
                        // Format tanggal untuk display
                        let tanggalDisplay = tanggalJadwal;
                        try {
                            const date = new Date(tanggalJadwal);
                            if (!isNaN(date)) {
                                tanggalDisplay = date.toLocaleDateString('id-ID', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                });
                                
                                // Highlight jika hari ini
                                const today = new Date();
                                if (date.toDateString() === today.toDateString()) {
                                    tanggalDisplay = `<span style="background: #ff5722; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;">HARI INI</span><br>${tanggalDisplay}`;
                                }
                            }
                        } catch (e) {
                            // Jika parsing gagal, gunakan format asli
                        }
                        
                        const catatan = detail.catatan || '';
                        const catatanDisplay = catatan ? 
                            catatan.substring(0, 30) + (catatan.length > 30 ? '...' : '') : 
                            '<span style="color: #999; font-style: italic;">Tidak ada catatan</span>';
                        
                        // Tombol detail saja
                        const actionButtons = `
                            <button onclick="viewDetailTimAngkut(${detailId})" style="padding: 6px 12px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                <i class="bi bi-info-circle"></i> Detail
                            </button>
                        `;
                        
                        return `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${startIndex + index + 1}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; min-width: 120px;">
                                ${tanggalDisplay}
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                <div>
                                    <strong>${namaAnggota}</strong><br>
                                    <small style="color: #666;">ID: ${detail.idAnggota || 'N/A'}</small>
                                </div>
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                                <span style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                                    ${namaTim}
                                </span>
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                                ${getStatusBadgeTimAngkut(detail.status_pengangkutan)}
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd; max-width: 150px; font-size: 13px;">
                                ${catatanDisplay}
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                                ${actionButtons}
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 14px; color: #666;">
            <strong>Menampilkan ${startData} - ${endData} dari ${totalData} jadwal</strong> • 
            Terjadwal: ${detailAllData.filter(d => d.status_pengangkutan === 'terjadwal').length} • 
            Dalam Proses: ${detailAllData.filter(d => d.status_pengangkutan === 'dalam_proses').length} • 
            Selesai: ${detailAllData.filter(d => d.status_pengangkutan === 'selesai').length}
        </div>
    `;

    container.innerHTML = tableHTML;
    
    // Render pagination
    renderDetailPagination(totalPages, startData, endData, totalData);
    
    // Attach functions to window
    window.viewDetailTimAngkut = viewDetailTimAngkut;
}

function renderDetailPagination(totalPages, startData, endData, totalData) {
    const paginationContainer = document.getElementById('detailPagination');

    if (totalPages <= 1) {
        paginationContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <small class="text-muted">
                    Menampilkan ${startData} - ${endData} dari ${totalData} jadwal
                </small>
                <select id="detailPerPageSelect" style="padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="10" ${detailPerPage === 10 ? 'selected' : ''}>10 per halaman</option>
                    <option value="20" ${detailPerPage === 20 ? 'selected' : ''}>20 per halaman</option>
                    <option value="50" ${detailPerPage === 50 ? 'selected' : ''}>50 per halaman</option>
                    <option value="100" ${detailPerPage === 100 ? 'selected' : ''}>100 per halaman</option>
                </select>
            </div>
        `;
        
        const perPageSelect = document.getElementById('detailPerPageSelect');
        if (perPageSelect) {
            perPageSelect.onchange = function() {
                detailPerPage = parseInt(this.value);
                detailCurrentPage = 1;
                renderDetailTableTimAngkut();
            };
        }
        return;
    }

    let startPage = Math.max(1, detailCurrentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    let paginationHTML = `
        <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
            <div>
                <small style="color: #666;">
                    Menampilkan ${startData} - ${endData} dari ${totalData} | 
                    Halaman ${detailCurrentPage} dari ${totalPages}
                </small>
            </div>
            
            <div style="display: flex; gap: 5px;">
    `;

    if (detailCurrentPage > 1) {
        paginationHTML += `
            <button onclick="changeDetailPage(${detailCurrentPage - 1})" 
                    style="padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">
                ←
            </button>
        `;
    } else {
        paginationHTML += `
            <button disabled style="padding: 5px 10px; border: 1px solid #ddd; background: #f5f5f5; cursor: not-allowed; border-radius: 4px; color: #999;">
                ←
            </button>
        `;
    }

    for (let i = startPage; i <= endPage; i++) {
        if (i === detailCurrentPage) {
            paginationHTML += `
                <button style="padding: 5px 10px; border: 1px solid #ddd; background: #007bff; color: white; cursor: default; border-radius: 4px;">
                    ${i}
                </button>
            `;
        } else {
            paginationHTML += `
                <button onclick="changeDetailPage(${i})" 
                        style="padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">
                    ${i}
                </button>
            `;
        }
    }

    if (detailCurrentPage < totalPages) {
        paginationHTML += `
            <button onclick="changeDetailPage(${detailCurrentPage + 1})" 
                    style="padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">
                →
            </button>
        `;
    } else {
        paginationHTML += `
            <button disabled style="padding: 5px 10px; border: 1px solid #ddd; background: #f5f5f5; cursor: not-allowed; border-radius: 4px; color: #999;">
                →
            </button>
        `;
    }

    paginationHTML += `
            </div>
            
            <div>
                <select id="detailPerPageSelect" style="padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="10" ${detailPerPage === 10 ? 'selected' : ''}>10 per halaman</option>
                    <option value="20" ${detailPerPage === 20 ? 'selected' : ''}>20 per halaman</option>
                    <option value="50" ${detailPerPage === 50 ? 'selected' : ''}>50 per halaman</option>
                    <option value="100" ${detailPerPage === 100 ? 'selected' : ''}>100 per halaman</option>
                </select>
            </div>
        </div>
    `;

    paginationContainer.innerHTML = paginationHTML;
    
    const perPageSelect = document.getElementById('detailPerPageSelect');
    if (perPageSelect) {
        perPageSelect.onchange = function() {
            detailPerPage = parseInt(this.value);
            detailCurrentPage = 1;
            renderDetailTableTimAngkut();
        };
    }
}

// Function to change page
window.changeDetailPage = function(pageNumber) {
    if (pageNumber < 1 || pageNumber > Math.ceil(detailAllData.length / detailPerPage)) {
        return;
    }
    
    detailCurrentPage = pageNumber;
    
    const tableContainer = document.getElementById('detailTableContainer');
    if (tableContainer) {
        tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    renderDetailTableTimAngkut();
};

function getStatusBadgeTimAngkut(status) {
    const statusConfig = {
        'terjadwal': { color: '#17a2b8', label: 'Terjadwal', icon: '📅' },
        'dalam_proses': { color: '#ffc107', label: 'Dalam Proses', icon: '🚚' },
        'selesai': { color: '#28a745', label: 'Selesai', icon: '✅' },
        'dibatalkan': { color: '#dc3545', label: 'Dibatalkan', icon: '❌' }
    };
    
    const config = statusConfig[status] || { color: '#6c757d', label: status, icon: '❓' };
    
    return `
        <span style="
            padding: 4px 10px;
            border-radius: 20px;
            background: ${config.color};
            color: white;
            font-size: 12px;
            font-weight: bold;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        ">
            ${config.icon} ${config.label}
        </span>
    `;
}

async function viewDetailTimAngkut(detailId) {
    try {
        const detail = await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
            headers: getAuthHeaders()
        });

        // Fetch detail anggota untuk mendapatkan alamat lengkap
        let anggotaDetail = null;
        if (detail.idAnggota) {
            try {
                anggotaDetail = await fetchAPI(`${API.anggota}${detail.idAnggota}/`, {
                    headers: getAuthHeaders()
                });
            } catch (error) {
                console.warn('Tidak bisa fetch detail anggota:', error);
            }
        }

        const detailHTML = `
            <div>
                <h3>📋 Detail Pengangkutan</h3>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 15px;">
                    <div style="display: grid; grid-template-columns: 150px 1fr; gap: 15px; margin-bottom: 20px;">
                        <div style="font-weight: 600; color: #555;">ID:</div>
                        <div>${detail.id || 'N/A'}</div>
                        
                        <div style="font-weight: 600; color: #555;">Nama Tim:</div>
                        <div>
                            <span style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px;">
                                ${detail.nama_tim || 'N/A'}
                            </span>
                        </div>
                        
                        <div style="font-weight: 600; color: #555;">Status:</div>
                        <div>
                            ${getStatusBadgeTimAngkut(detail.status_pengangkutan)}
                        </div>
                        
                        <div style="font-weight: 600; color: #555;">Tanggal:</div>
                        <div>
                            <strong>${detail.tanggal_jadwal || 'N/A'}</strong>
                        </div>
                        
                        <div style="font-weight: 600; color: #555;">Anggota:</div>
                        <div>
                            <strong>${detail.nama_anggota || anggotaDetail?.nama || 'N/A'}</strong><br>
                            <small>${anggotaDetail?.alamat || 'Alamat tidak tersedia'}</small>
                        </div>
                        
                        <div style="font-weight: 600; color: #555;">Kontak:</div>
                        <div>
                            <small>Telp/WA: ${anggotaDetail?.noWA || 'Tidak tersedia'}</small>
                        </div>
                        
                        <div style="font-weight: 600; color: #555;">Catatan:</div>
                        <div style="white-space: pre-wrap; background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd; min-height: 60px;">
                            ${detail.catatan || '<span style="color: #999; font-style: italic;">Tidak ada catatan</span>'}
                        </div>
                        
                        <div style="font-weight: 600; color: #555;">Dibuat:</div>
                        <div>${detail.created_at ? new Date(detail.created_at).toLocaleString('id-ID') : 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;

        showModal('Detail Pengangkutan', detailHTML);
    } catch (error) {
        alert('Error loading detail: ' + error.message);
    }
}

// Tambahkan ke window untuk akses global
window.detailAnggotaJadwalTimAngkutPage = detailAnggotaJadwalTimAngkutPage;
window.changeDetailPage = changeDetailPage;