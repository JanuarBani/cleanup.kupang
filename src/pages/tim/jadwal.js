// timAngkut/detailAnggotaJadwal.js
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

export async function detailAnggotaJadwalTimAngkutPage() {
    const mainContent = document.getElementById("mainContent");
    mainContent.innerHTML = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>📅 Jadwal Pengangkutan Tim Saya</h2>
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
                <select id="filterAnggota" style="padding: 8px; width: 200px;">
                    <option value="">Semua Anggota</option>
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
            
            <!-- Panduan untuk tim angkut -->
            <div style="margin-top: 30px; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                <h4 style="margin-top: 0; color: #856404;">🚚 Panduan Tim Pengangkut:</h4>
                <ul style="margin-bottom: 0;">
                    <li><strong>Terjadwal</strong> → <strong>Dalam Proses</strong>: Klik tombol "Mulai" saat berangkat mengambil sampah</li>
                    <li><strong>Dalam Proses</strong> → <strong>Selesai</strong>: Klik tombol "Selesai" setelah sampah terambil</li>
                    <li>Gunakan kolom catatan untuk mencatat informasi penting selama pengangkutan</li>
                    <li>Tekan tombol "Lihat Lokasi" untuk melihat alamat anggota</li>
                </ul>
            </div>
        </div>
    `;

    document.getElementById('refreshBtn').onclick = loadDetailAnggotaJadwalTimAngkut;
    document.getElementById('filterTanggal').onchange = loadDetailAnggotaJadwalTimAngkut;
    document.getElementById('filterStatus').onchange = loadDetailAnggotaJadwalTimAngkut;
    document.getElementById('filterAnggota').onchange = loadDetailAnggotaJadwalTimAngkut;
    document.getElementById('searchAnggota').oninput = loadDetailAnggotaJadwalTimAngkut;
    
    // Load dropdown data
    loadAnggotaOptions();
    
    // Load data
    loadDetailAnggotaJadwalTimAngkut();
}

async function loadAnggotaOptions() {
    try {
        // Load data detail dulu untuk mendapatkan daftar anggota di jadwal tim ini
        const details = await fetchAPI(API.detailAnggotaJadwal, {
            headers: getAuthHeaders()
        });
        
        // Ambil unique anggota dari data
        const anggotaMap = new Map();
        details.forEach(detail => {
            if (detail.idAnggota && detail.nama_anggota) {
                anggotaMap.set(detail.idAnggota, detail.nama_anggota);
            }
        });
        
        const anggotaSelect = document.getElementById('filterAnggota');
        
        // Clear existing options except first one
        while (anggotaSelect.options.length > 1) {
            anggotaSelect.remove(1);
        }
        
        // Tambahkan opsi dari map
        anggotaMap.forEach((nama, id) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = nama;
            anggotaSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading anggota options:', error);
    }
}

async function loadDetailAnggotaJadwalTimAngkut() {
    const filterTanggal = document.getElementById('filterTanggal').value;
    const filterStatus = document.getElementById('filterStatus').value;
    const filterAnggota = document.getElementById('filterAnggota').value;
    const searchAnggota = document.getElementById('searchAnggota').value;
    
    try {
        // Load data detail - backend sudah filter hanya untuk tim angkut ini
        const details = await fetchAPI(API.detailAnggotaJadwal, {
            headers: getAuthHeaders()
        });

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Filter data
        const filteredDetails = details.filter(detail => {
            const tanggalJadwal = detail.tanggal_jadwal || '';
            const namaAnggota = detail.nama_anggota || '';
            const status = detail.status_pengangkutan || '';
            
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
            
            // Filter anggota
            const matchAnggota = !filterAnggota || detail.idAnggota == filterAnggota;
            
            // Search anggota
            const matchSearch = !searchAnggota || 
                namaAnggota.toLowerCase().includes(searchAnggota.toLowerCase());
            
            return matchTanggal && matchStatus && matchAnggota && matchSearch;
        });

        // Update stats
        updateStatsOverview(filteredDetails);
        
        // Render table
        renderDetailTableTimAngkut(filteredDetails);
    } catch (error) {
        document.getElementById('detailTableContainer').innerHTML = 
            `<p style="color: red;">Error loading data: ${error.message}</p>`;
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

function renderDetailTableTimAngkut(detailList) {
    const container = document.getElementById('detailTableContainer');
    
    if (!detailList || detailList.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                <div style="font-size: 48px; color: #6c757d; margin-bottom: 15px;">📭</div>
                <h3 style="color: #6c757d;">Tidak ada jadwal</h3>
                <p style="color: #6c757d;">Tidak ada jadwal pengangkutan yang ditugaskan ke tim Anda.</p>
            </div>
        `;
        return;
    }

    const tableHTML = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; min-width: 900px;">
                <thead>
                    <tr style="background: #f2f2f2;">
                        <th style="padding: 10px; border: 1px solid #ddd;">ID</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Tanggal</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Anggota</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Status</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Catatan Anggota</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${detailList.map(detail => {
                        const detailId = detail.id || 'N/A';
                        const tanggalJadwal = detail.tanggal_jadwal || '';
                        const namaAnggota = detail.nama_anggota || 'Anggota';
                        
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
                        
                        // Tentukan tombol aksi berdasarkan status
                        let actionButtons = '';
                        if (detail.status_pengangkutan === 'terjadwal') {
                            actionButtons = `
                                <button onclick="mulaiPengangkutan(${detailId})" style="padding: 4px 8px; margin-right: 5px; background: #ffc107; color: black; border: none; border-radius: 3px; margin-bottom: 3px;">🚚 Mulai</button>
                                <button onclick="viewDetailTimAngkut(${detailId})" style="padding: 4px 8px; margin-right: 5px; background: #17a2b8; color: white; border: none; border-radius: 3px; margin-bottom: 3px;">📋 Detail</button>
                                <button onclick="lihatLokasi(${detailId})" style="padding: 4px 8px; background: #28a745; color: white; border: none; border-radius: 3px; margin-bottom: 3px;">📍 Lokasi</button>
                            `;
                        } else if (detail.status_pengangkutan === 'dalam_proses') {
                            actionButtons = `
                                <button onclick="selesaikanPengangkutan(${detailId})" style="padding: 4px 8px; margin-right: 5px; background: #28a745; color: white; border: none; border-radius: 3px; margin-bottom: 3px;">✅ Selesai</button>
                                <button onclick="tambahCatatanTim(${detailId})" style="padding: 4px 8px; margin-right: 5px; background: #6f42c1; color: white; border: none; border-radius: 3px; margin-bottom: 3px;">📝 Catatan</button>
                                <button onclick="viewDetailTimAngkut(${detailId})" style="padding: 4px 8px; background: #17a2b8; color: white; border: none; border-radius: 3px; margin-bottom: 3px;">📋 Detail</button>
                            `;
                        } else if (detail.status_pengangkutan === 'selesai') {
                            actionButtons = `
                                <button onclick="viewDetailTimAngkut(${detailId})" style="padding: 4px 8px; margin-right: 5px; background: #17a2b8; color: white; border: none; border-radius: 3px;">📋 Detail</button>
                                <button onclick="tambahCatatanTim(${detailId})" style="padding: 4px 8px; background: #6f42c1; color: white; border: none; border-radius: 3px;">📝 Catatan</button>
                            `;
                        } else {
                            actionButtons = `
                                <button onclick="viewDetailTimAngkut(${detailId})" style="padding: 4px 8px; background: #17a2b8; color: white; border: none; border-radius: 3px;">📋 Detail</button>
                            `;
                        }
                        
                        return `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${detailId}</td>
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
                                ${getStatusBadgeTimAngkut(detail.status_pengangkutan)}
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd; max-width: 150px; font-size: 13px;">
                                ${catatanDisplay}
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center; min-width: 200px;">
                                ${actionButtons}
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <div style="margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 14px; color: #666;">
            <strong>Total:</strong> ${detailList.length} jadwal ditemukan • 
            <strong>Terjadwal:</strong> ${detailList.filter(d => d.status_pengangkutan === 'terjadwal').length} • 
            <strong>Dalam Proses:</strong> ${detailList.filter(d => d.status_pengangkutan === 'dalam_proses').length} • 
            <strong>Selesai:</strong> ${detailList.filter(d => d.status_pengangkutan === 'selesai').length}
        </div>
    `;

    container.innerHTML = tableHTML;
    
    // Attach functions to window
    window.viewDetailTimAngkut = viewDetailTimAngkut;
    window.mulaiPengangkutan = mulaiPengangkutan;
    window.selesaikanPengangkutan = selesaikanPengangkutan;
    window.tambahCatatanTim = tambahCatatanTim;
    window.lihatLokasi = lihatLokasi;
}

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

async function mulaiPengangkutan(detailId) {
    showConfirmModal('Mulai pengangkutan untuk jadwal ini?', async () => {
        try {
            await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    status_pengangkutan: 'dalam_proses'
                })
            });
            
            alert('🚚 Pengangkutan telah dimulai!');
            loadDetailAnggotaJadwalTimAngkut();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }, 'Mulai Pengangkutan', 'Ya, Mulai', 'Batal');
}

async function selesaikanPengangkutan(detailId) {
    const formHTML = `
        <form id="selesaiForm">
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">
                    <strong>Catatan Selesai (Opsional)</strong>
                    <small style="color: #666; font-weight: normal;"> - Contoh: "Sampah telah terambil, kondisi baik"</small>
                </label>
                <textarea id="catatanSelesai" style="width: 100%; padding: 8px; height: 80px;" 
                          placeholder="Contoh: Sampah organik 3 karung sudah terambil, kondisi sampah baik..."></textarea>
            </div>
            
            <div style="padding: 10px; background: #d4edda; border-radius: 5px; margin-bottom: 15px;">
                <p style="margin: 0; color: #155724;">
                    <strong>✅ Konfirmasi:</strong> Pastikan sampah telah terambil dengan baik sebelum menekan tombol "Selesai".
                </p>
            </div>
        </form>
    `;

    showModal('Konfirmasi Selesai', formHTML, async () => {
        const catatanSelesai = document.getElementById('catatanSelesai').value || '';
        
        // Gabungkan catatan jika ada catatan lama
        try {
            const detail = await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
                headers: getAuthHeaders()
            });
            
            const catatanLama = detail.catatan || '';
            const catatanBaru = catatanSelesai ? 
                (catatanLama ? `${catatanLama}\n\n[Tim]: ${catatanSelesai}` : `[Tim]: ${catatanSelesai}`) : 
                catatanLama;

            await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    status_pengangkutan: 'selesai',
                    catatan: catatanBaru
                })
            });
            
            alert('✅ Pengangkutan telah selesai!');
            loadDetailAnggotaJadwalTimAngkut();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }, 'Selesai', 'Ya, Selesai', 'Batal');
}

async function tambahCatatanTim(detailId) {
    try {
        const detail = await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
            headers: getAuthHeaders()
        });

        const formHTML = `
            <form id="catatanTimForm">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">
                        <strong>Catatan Tim Pengangkut</strong>
                        <small style="color: #666; font-weight: normal;"> - Tambahkan catatan dari tim</small>
                    </label>
                    <textarea id="catatanTim" style="width: 100%; padding: 8px; height: 100px;" 
                              placeholder="Contoh: Rumah sulit ditemukan, sampah lebih banyak dari perkiraan, kondisi jalan macet...">${detail.catatan || ''}</textarea>
                </div>
                
                <div style="padding: 10px; background: #e7f3ff; border-radius: 5px; margin-bottom: 15px;">
                    <p style="margin: 0; color: #0056b3;">
                        <strong>📝 Info:</strong> Catatan ini akan ditambahkan ke catatan yang sudah ada.
                    </p>
                </div>
            </form>
        `;

        showModal('Tambah Catatan Tim', formHTML, async () => {
            const catatanTim = document.getElementById('catatanTim').value || '';

            try {
                await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
                    method: 'PATCH',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        catatan: catatanTim
                    })
                });

                alert('✅ Catatan tim berhasil disimpan!');
                loadDetailAnggotaJadwalTimAngkut();
            } catch (error) {
                console.error('Update error:', error);
                alert('Error: ' + error.message);
            }
        });

    } catch (error) {
        alert('Error loading data: ' + error.message);
    }
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
                        
                        <div style="font-weight: 600; color: #555;">Terakhir Update:</div>
                        <div>${detail.updated_at ? new Date(detail.updated_at).toLocaleString('id-ID') : 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;

        showModal('Detail Pengangkutan', detailHTML);
    } catch (error) {
        alert('Error loading detail: ' + error.message);
    }
}

async function lihatLokasi(detailId) {
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

        const alamat = anggotaDetail?.alamat || 'Alamat tidak tersedia';
        const namaAnggota = detail.nama_anggota || anggotaDetail?.nama || 'Anggota';
        
        // Encode alamat untuk Google Maps
        const encodedAlamat = encodeURIComponent(alamat);
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAlamat}`;

        const lokasiHTML = `
            <div>
                <h3>📍 Lokasi Anggota</h3>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 15px;">
                    <div style="margin-bottom: 20px;">
                        <div style="font-weight: 600; color: #555; margin-bottom: 5px;">Nama Anggota:</div>
                        <div style="font-size: 18px; font-weight: bold;">${namaAnggota}</div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="font-weight: 600; color: #555; margin-bottom: 5px;">Alamat:</div>
                        <div style="background: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd; font-size: 14px;">
                            ${alamat}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <div style="font-weight: 600; color: #555; margin-bottom: 5px;">Kontak:</div>
                        <div style="background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
                            <strong>Telp/WA:</strong> ${anggotaDetail?.noWA || 'Tidak tersedia'}
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="${mapsUrl}" target="_blank" style="
                            display: inline-block;
                            padding: 12px 24px;
                            background: #4285f4;
                            color: white;
                            text-decoration: none;
                            border-radius: 8px;
                            font-weight: bold;
                            font-size: 16px;
                        ">
                            🗺️ Buka di Google Maps
                        </a>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 10px; background: #fff3cd; border-radius: 5px;">
                        <p style="margin: 0; color: #856404;">
                            <strong>💡 Tips:</strong> Gunakan tombol di atas untuk membuka alamat di Google Maps. 
                            Jika alamat tidak akurat, hubungi anggota untuk konfirmasi.
                        </p>
                    </div>
                </div>
            </div>
        `;

        showModal('Lokasi Anggota', lokasiHTML);
    } catch (error) {
        alert('Error loading lokasi: ' + error.message);
    }
}

// Tambahkan ke window untuk akses global
window.detailAnggotaJadwalTimAngkutPage = detailAnggotaJadwalTimAngkutPage;