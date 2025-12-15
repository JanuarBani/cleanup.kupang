// anggota/detailAnggotaJadwal.js
import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { authGuard } from "../../utils/authGuard.js";

// BUAT MODAL FUNCTIONS SENDIRI (tidak perlu import)
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
    
    // Close modal functions
    const closeModal = () => document.body.removeChild(modal);
    
    document.getElementById('closeModal').onclick = closeModal;
    document.getElementById('cancelBtn').onclick = closeModal;
    
    if (onConfirm) {
        document.getElementById('confirmBtn').onclick = () => {
            onConfirm();
            closeModal();
        };
    }
    
    // Close on ESC key
    const handleEsc = (e) => {
        if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleEsc);
    
    // Remove event listener when modal closes
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

export async function detailAnggotaJadwalPage() {
    const mainContent = document.getElementById("mainContent");
    mainContent.innerHTML = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Jadwal Pengangkutan Saya</h2>
                <button id="addDetailBtn" style="padding: 8px 16px; background: #28a745; color: white;">
                    + Tambah Jadwal Saya
                </button>
            </div>
            
            <div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                <input type="text" id="searchDetail" placeholder="Cari berdasarkan tanggal/tim..." style="padding: 8px; width: 250px;">
                <select id="filterStatus" style="padding: 8px;">
                    <option value="">Semua Status</option>
                    <option value="terjadwal">Terjadwal</option>
                    <option value="dalam_proses">Dalam Proses</option>
                    <option value="selesai">Selesai</option>
                    <option value="dibatalkan">Dibatalkan</option>
                </select>
                <select id="filterJadwal" style="padding: 8px; width: 200px;">
                    <option value="">Semua Jadwal</option>
                </select>
            </div>
            
            <div id="detailTableContainer">
                <p>Loading data...</p>
            </div>
            
            <!-- Info untuk anggota -->
            <div style="margin-top: 30px; padding: 15px; background: #e7f3ff; border-radius: 8px; border-left: 4px solid #007bff;">
                <h4 style="margin-top: 0; color: #0056b3;">📋 Panduan Penggunaan:</h4>
                <ul style="margin-bottom: 0;">
                    <li>Anda hanya dapat melihat dan mengelola jadwal milik Anda sendiri</li>
                    <li><strong>Status "Terjadwal"</strong>: Jadwal sudah direncanakan</li>
                    <li><strong>Status "Dalam Proses"</strong>: Tim sedang dalam perjalanan</li>
                    <li><strong>Status "Selesai"</strong>: Pengangkutan telah selesai</li>
                    <li><strong>Status "Dibatalkan"</strong>: Jadwal dibatalkan</li>
                    <li>Gunakan kolom catatan untuk memberikan informasi tambahan</li>
                </ul>
            </div>
        </div>
    `;

    document.getElementById('addDetailBtn').onclick = () => showAddDetailFormAnggota();
    document.getElementById('searchDetail').oninput = loadDetailAnggotaJadwalAnggota;
    document.getElementById('filterStatus').onchange = loadDetailAnggotaJadwalAnggota;
    
    // Load dropdown data (hanya jadwal)
    loadDropdownDataAnggota();

    
    // Load data
    loadDetailAnggotaJadwalAnggota();
}

async function loadDropdownDataAnggota() {
    try {
        // Hanya load jadwal saja
        const jadwal = await fetchAPI(API.jadwal, { headers: getAuthHeaders() });
        const jadwalSelect = document.getElementById('filterJadwal');
        
        // Clear existing options except first one
        while (jadwalSelect.options.length > 1) {
            jadwalSelect.remove(1);
        }
        
        jadwal.forEach(j => {
            const option = document.createElement('option');
            const id = j.idJadwal;
            const tanggal = j.tanggalJadwal || 'N/A';
            const namaTim = j.nama_tim || 'N/A';
            
            option.value = id;
            option.textContent = `${tanggal} (${namaTim})`;
            jadwalSelect.appendChild(option);
        });
        
        document.getElementById('filterJadwal').onchange = loadDetailAnggotaJadwalAnggota;
        
    } catch (error) {
        console.error('Error loading dropdown data:', error);
    }
}

async function loadDetailAnggotaJadwalAnggota() {
    const search = document.getElementById('searchDetail')?.value || '';
    const filterStatus = document.getElementById('filterStatus')?.value || '';
    const filterJadwal = document.getElementById('filterJadwal')?.value || '';
    
    try {
        // Load data detail
        const details = await fetchAPI(API.detailAnggotaJadwal, {
            headers: getAuthHeaders()
        });

        // Filter data - hanya tampilkan yang milik anggota ini
        const filteredDetails = details.filter(detail => {
            // Gunakan data dari serializer
            const tanggalJadwal = detail.tanggal_jadwal || '';
            const namaTim = detail.nama_tim || '';
            const status = detail.status_pengangkutan || '';
            
            // Search
            const matchSearch = !search || 
                tanggalJadwal.includes(search) ||
                namaTim.toLowerCase().includes(search.toLowerCase()) ||
                status.toLowerCase().includes(search.toLowerCase());
            
            // Filter status
            const matchStatus = !filterStatus || status === filterStatus;
            
            // Filter jadwal
            const matchJadwal = !filterJadwal || detail.idJadwal == filterJadwal;
            
            return matchSearch && matchStatus && matchJadwal;
        });

        renderDetailTableAnggota(filteredDetails);
    } catch (error) {
        document.getElementById('detailTableContainer').innerHTML = 
            `<p style="color: red;">Error loading data: ${error.message}</p>`;
    }
}

function renderDetailTableAnggota(detailList) {
    const container = document.getElementById('detailTableContainer');
    
    if (!detailList || detailList.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                <div style="font-size: 48px; color: #6c757d; margin-bottom: 15px;">📅</div>
                <h3 style="color: #6c757d;">Belum ada jadwal</h3>
                <p style="color: #6c757d;">Klik tombol <strong>"+ Tambah Jadwal Saya"</strong> untuk menambahkan jadwal pengangkutan</p>
                <button onclick="showAddDetailFormAnggota()" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; margin-top: 10px;">
                    + Tambah Jadwal Pertama
                </button>
            </div>
        `;
        return;
    }

    const tableHTML = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
                <thead>
                    <tr style="background: #f2f2f2;">
                        <th style="padding: 10px; border: 1px solid #ddd;">ID</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Tanggal Jadwal</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Tim Angkut</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Status</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Catatan</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Dibuat</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${detailList.map(detail => {
                        const detailId = detail.id || 'N/A';
                        const tanggalJadwal = detail.tanggal_jadwal || `Jadwal ID: ${detail.idJadwal}`;
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
                            }
                        } catch (e) {
                            // Jika parsing gagal, gunakan format asli
                        }
                        
                        const catatan = detail.catatan || '';
                        const catatanDisplay = catatan ? 
                            catatan.substring(0, 40) + (catatan.length > 40 ? '...' : '') : 
                            '-';
                        
                        const createdAt = detail.created_at ? 
                            new Date(detail.created_at).toLocaleDateString('id-ID') : 
                            '-';
                        
                        // Tentukan tombol aksi berdasarkan status
                        let actionButtons = '';
                        if (detail.status_pengangkutan === 'terjadwal') {
                            actionButtons = `
                                <button onclick="viewDetailJadwalAnggota(${detailId})" style="padding: 4px 8px; margin-right: 5px; background: #17a2b8; color: white; border: none; border-radius: 3px;">Detail</button>
                                <button onclick="editDetailJadwalAnggota(${detailId})" style="padding: 4px 8px; margin-right: 5px; background: #ffc107; color: black; border: none; border-radius: 3px;">Edit</button>
                                <button onclick="batalkanJadwalAnggota(${detailId})" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 3px;">Batalkan</button>
                            `;
                        } else if (detail.status_pengangkutan === 'dalam_proses') {
                            actionButtons = `
                                <button onclick="viewDetailJadwalAnggota(${detailId})" style="padding: 4px 8px; margin-right: 5px; background: #17a2b8; color: white; border: none; border-radius: 3px;">Detail</button>
                                <button onclick="updateStatusSelesai(${detailId})" style="padding: 4px 8px; background: #28a745; color: white; border: none; border-radius: 3px;">Selesai</button>
                            `;
                        } else {
                            actionButtons = `
                                <button onclick="viewDetailJadwalAnggota(${detailId})" style="padding: 4px 8px; background: #17a2b8; color: white; border: none; border-radius: 3px;">Detail</button>
                            `;
                        }
                        
                        return `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${detailId}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                <div>
                                    <strong>${tanggalDisplay}</strong>
                                </div>
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd;">
                                <div>
                                    <strong>${namaTim}</strong>
                                </div>
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                                ${getStatusBadgeAnggota(detail.status_pengangkutan)}
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd; max-width: 200px;">
                                ${catatanDisplay}
                            </td>
                            <td style="padding: 10px; border: 1px solid #ddd; font-size: 12px; text-align: center;">
                                ${createdAt}
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
        
        <div style="margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 14px; color: #666;">
            <strong>Total:</strong> ${detailList.length} jadwal ditemukan
        </div>
    `;

    container.innerHTML = tableHTML;
    
    // Attach functions to window
    window.viewDetailJadwalAnggota = viewDetailJadwalAnggota;
    window.editDetailJadwalAnggota = editDetailJadwalAnggota;
    window.batalkanJadwalAnggota = batalkanJadwalAnggota;
    window.updateStatusSelesai = updateStatusSelesai;
}

function getStatusBadgeAnggota(status) {
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

async function loadAnggotaId() {
    const user = await authGuard();
    if (!user || !user.id) {
        console.warn("User tidak ditemukan saat loadAnggotaId.");
        return null;
    }

    try {
        const response = await fetchAPI(`${API.anggota}?user=${user.id}`, {
            headers: getAuthHeaders()
        });

        if (response.length > 0) {
            localStorage.setItem("idAnggota", response[0].id);
            console.log("idAnggota loaded:", response[0].id);
            return response[0].id;
        }

        console.warn("Tidak ditemukan data Anggota untuk user ini.");
        return null;

    } catch (err) {
        console.error("Gagal load idAnggota:", err);
        return null;
    }
}

function showAddDetailFormAnggota() {

    const anggotaData = JSON.parse(localStorage.getItem("anggota"));
    const idAnggota = anggotaData?.idAnggota;


    if (!idAnggota) {
        alert("Data Anggota tidak ditemukan! Silakan login ulang.");
        return;
    }

    fetchAPI(API.jadwal, { headers: getAuthHeaders() })
        .then(jadwal => {

            const jadwalGrid = createMultiSelectJadwalGridAnggota(jadwal);

            // ⭐ FORM HARUS DIISI – TIDAK BOLEH KOSONG
            const formHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    ${jadwalGrid}
                </div>

                <hr style="margin: 15px 0;">

                <div>
                    <label><strong>Catatan (opsional)</strong></label>
                    <textarea id="catatanAnggota"
                        style="width: 100%; height: 80px; padding: 8px; border: 1px solid #ccc; border-radius: 5px;"
                        placeholder="Tambahkan catatan..."
                    ></textarea>
                </div>

                <input type="hidden" id="selectedJadwalIdsAnggota">

                <div style="margin-top: 15px; background: #f7f7f7; padding: 10px; border-radius: 5px;">
                    <strong>Dipilih: <span id="selectedCountAnggota">0</span> jadwal</strong>
                    <div id="selectedJadwalListAnggota" style="margin-top: 10px;"></div>
                </div>
            `;

            showModal('Tambah Jadwal Pengangkutan', formHTML, async () => {

                const selectedJadwalIds = document.getElementById('selectedJadwalIdsAnggota').value;

                if (!selectedJadwalIds) {
                    alert('Pilih minimal 1 jadwal!');
                    return;
                }

                const jadwalIds = selectedJadwalIds.split(',').filter(id => id !== '');
                const catatan = document.getElementById('catatanAnggota').value || '';

                let successCount = 0;
                let errorCount = 0;
                let errorMessages = [];

                const promises = jadwalIds.map(jadwalId => {

                    const detailData = {
                        idJadwal: parseInt(jadwalId),
                        idAnggota: parseInt(idAnggota),   // ⭐ FIX TERPENTING
                        status_pengangkutan: "terjadwal",
                        catatan: catatan
                    };

                    console.log("Payload dikirim:", detailData);

                    return fetchAPI(API.detailAnggotaJadwal, {
                        method: "POST",
                        headers: getAuthHeaders(),
                        body: JSON.stringify(detailData)
                    })
                        .then(() => successCount++)
                        .catch(error => {
                            errorCount++;
                            errorMessages.push(`Jadwal ${jadwalId}: ${error.message}`);
                        });
                });

                await Promise.allSettled(promises);

                if (successCount > 0) {
                    alert(`Berhasil menambahkan ${successCount} jadwal!`);
                    loadDetailAnggotaJadwalAnggota();
                }

                if (errorCount > 0) {
                    alert(`Gagal menambah ${errorCount} jadwal:\n${errorMessages.join("\n")}`);
                }

            });

            setupMultiSelectJadwalGridListenersAnggota();

        })
        .catch(error => {
            alert("Error memuat data jadwal: " + error.message);
        });
}


function createMultiSelectJadwalGridAnggota(jadwalList) {
    // Filter jadwal yang belum lewat (hari ini atau masa depan)
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set ke awal hari
    
    const futureJadwal = jadwalList.filter(j => {
        if (!j.tanggalJadwal) return false;
        const jadwalDate = new Date(j.tanggalJadwal);
        return jadwalDate >= now;
    });
    
    if (futureJadwal.length === 0) {
        return `
            <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 10px;">📭</div>
                <p>Tidak ada jadwal yang tersedia untuk dipilih.</p>
                <p>Silakan hubungi admin untuk informasi jadwal terbaru.</p>
            </div>
        `;
    }
    
    // Group jadwal by bulan
    const groupedByMonth = {};
    
    futureJadwal.forEach(j => {
        const id = j.idJadwal;
        const tanggal = j.tanggalJadwal;
        const namaTim = j.nama_tim || 'Tim';
        
        if (tanggal) {
            const date = new Date(tanggal);
            const monthYear = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            
            if (!groupedByMonth[monthYear]) {
                groupedByMonth[monthYear] = [];
            }
            
            groupedByMonth[monthYear].push({
                id,
                tanggal,
                namaTim,
                dateObj: date,
                formattedDate: date.toLocaleDateString('id-ID', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short' 
                }),
                isToday: date.toDateString() === now.toDateString()
            });
        }
    });

    let gridHTML = '';
    
    // Urutkan bulan
    const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => {
        return new Date(a) - new Date(b);
    });

    sortedMonths.forEach(monthYear => {
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
        
        jadwals.forEach(j => {
            const todayBadge = j.isToday ? 
                '<span style="position: absolute; top: -5px; left: -5px; background: #ff5722; color: white; font-size: 10px; padding: 2px 5px; border-radius: 10px;">HARI INI</span>' : '';
            
            gridHTML += `
                <div class="jadwal-card-anggota" data-jadwal-id="${j.id}" 
                     style="border: 1px solid #ddd; border-radius: 8px; padding: 10px; 
                            cursor: pointer; transition: all 0.2s; text-align: center;
                            background: white; position: relative; min-height: 70px;">
                    ${todayBadge}
                    <div style="font-weight: bold; color: #007bff; margin-bottom: 5px;">
                        ${j.formattedDate}
                    </div>
                    <div style="font-size: 12px; color: #666;">
                        ${j.namaTim}
                    </div>
                    <div class="checkmark-anggota" style="position: absolute; top: 5px; right: 5px; 
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

function setupMultiSelectJadwalGridListenersAnggota() {
    const jadwalCards = document.querySelectorAll('.jadwal-card-anggota');
    const selectedJadwalIds = [];
    const selectedJadwalMap = new Map();
    
    jadwalCards.forEach(card => {
        card.addEventListener('click', function() {

            const jadwalId = this.getAttribute('data-jadwal-id');

            // 🔹 AMBIL TANGGAL DENGAN AMAN
            let tanggalEl = this.querySelector('.tanggal');
            let tanggal = tanggalEl ? tanggalEl.textContent.trim() : '';

            // fallback kalau HTML lama
            if (!tanggal && this.children[0]) {
                tanggal = this.children[0].textContent.trim();
            }

            // 🔹 AMBIL NAMA TIM DENGAN AMAN
            let timEl = this.querySelector('.nama-tim');
            let namaTim = timEl ? timEl.textContent.trim() : '';

            // fallback jika struktur HTML lama
            if (!namaTim && this.children[1]) {
                namaTim = this.children[1].textContent.trim();
            }

            const checkmark = this.querySelector('.checkmark-anggota');

            // =============== SELECT / UNSELECT HANDLING ===================
            if (selectedJadwalIds.includes(jadwalId)) {

                // Unselect
                const index = selectedJadwalIds.indexOf(jadwalId);
                selectedJadwalIds.splice(index, 1);
                selectedJadwalMap.delete(jadwalId);

                removeCardSelectionStyle(this, checkmark);

            } else {

                // Batasi max 4 jadwal
                if (selectedJadwalIds.length >= 4) {
                    alert('Maksimal hanya bisa memilih 4 jadwal!');
                    return;
                }

                // Select
                selectedJadwalIds.push(jadwalId);
                selectedJadwalMap.set(jadwalId, { tanggal, namaTim, id: jadwalId });

                applyCardSelectionStyle(this, checkmark);
            }

            updateSelectedJadwalInfoAnggota(selectedJadwalIds, selectedJadwalMap);
        });

        // ========= HOVER ANIMATION ==========
        card.addEventListener('mouseenter', function() {
            if (!selectedJadwalIds.includes(this.getAttribute('data-jadwal-id'))) {
                this.style.background = '#f8f9fa';
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            }
        });

        card.addEventListener('mouseleave', function() {
            const jadwalId = this.getAttribute('data-jadwal-id');
            if (!selectedJadwalIds.includes(jadwalId)) {
                this.style.background = 'white';
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            }
        });
    });
}


// =======================================
// CARD STYLE FUNCTIONS
// =======================================

function applyCardSelectionStyle(card, checkmark) {
    card.style.background = '#e3f2fd';
    card.style.borderColor = '#007bff';
    card.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.25)';
    if (checkmark) checkmark.style.display = 'flex';
}

function removeCardSelectionStyle(card, checkmark) {
    card.style.background = 'white';
    card.style.borderColor = '#ddd';
    card.style.boxShadow = 'none';
    if (checkmark) checkmark.style.display = 'none';
}


function updateSelectedJadwalInfoAnggota(selectedIds, selectedMap) {
    // Update counter
    document.getElementById('selectedCountAnggota').textContent = selectedIds.length;
    
    // Update hidden input
    document.getElementById('selectedJadwalIdsAnggota').value = selectedIds.join(',');
    
    // Update list jadwal terpilih
    const selectedList = document.getElementById('selectedJadwalListAnggota');
    
    if (selectedIds.length === 0) {
        selectedList.innerHTML = '<span style="color: #999; font-style: italic;">Belum ada jadwal yang dipilih</span>';
        return;
    }
    
    let listHTML = '<div style="display: flex; flex-wrap: wrap; gap: 5px;">';
    
    selectedIds.forEach(id => {
        const jadwal = selectedMap.get(id);
        if (jadwal) {
            listHTML += `
                <span style="background: #007bff; color: white; padding: 3px 8px; 
                      border-radius: 12px; font-size: 12px; display: inline-flex; 
                      align-items: center; gap: 5px;">
                    ${jadwal.tanggal}
                    <button type="button" onclick="removeSelectedJadwalAnggota('${id}')" 
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
    
    listHTML += '</div>';
    selectedList.innerHTML = listHTML;
}

function removeSelectedJadwalAnggota(jadwalId) {
    const card = document.querySelector(`.jadwal-card-anggota[data-jadwal-id="${jadwalId}"]`);
    if (card) {
        card.click();
    }
}

async function viewDetailJadwalAnggota(detailId) {
    try {
        const detail = await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
            headers: getAuthHeaders()
        });

        // Fetch detail jadwal jika diperlukan
        let jadwalDetail = null;
        if (detail.idJadwal) {
            try {
                jadwalDetail = await fetchAPI(`${API.jadwal}${detail.idJadwal}/`, {
                    headers: getAuthHeaders()
                });
            } catch (error) {
                console.warn('Tidak bisa fetch detail jadwal:', error);
            }
        }

        const detailHTML = `
            <div>
                <h3>📋 Detail Jadwal Pengangkutan</h3>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 15px;">
                    <div style="display: grid; grid-template-columns: 150px 1fr; gap: 15px; margin-bottom: 20px;">
                        <div style="font-weight: 600; color: #555;">ID:</div>
                        <div>${detail.id || 'N/A'}</div>
                        
                        <div style="font-weight: 600; color: #555;">Status:</div>
                        <div>
                            ${getStatusBadgeAnggota(detail.status_pengangkutan)}
                        </div>
                        
                        <div style="font-weight: 600; color: #555;">Tanggal:</div>
                        <div>
                            <strong>${detail.tanggal_jadwal || jadwalDetail?.tanggalJadwal || 'N/A'}</strong>
                        </div>
                        
                        <div style="font-weight: 600; color: #555;">Tim Angkut:</div>
                        <div>
                            <strong>${detail.nama_tim || jadwalDetail?.nama_tim || 'N/A'}</strong>
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

        showModal('Detail Jadwal', detailHTML);
    } catch (error) {
        alert('Error loading detail: ' + error.message);
    }
}

async function editDetailJadwalAnggota(detailId) {
    try {
        const detail = await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
            headers: getAuthHeaders()
        });

        // Hanya boleh edit jika status masih "terjadwal"
        if (detail.status_pengangkutan !== 'terjadwal') {
            alert('Hanya jadwal dengan status "Terjadwal" yang dapat diedit!');
            return;
        }

        const formHTML = `
            <form id="editDetailFormAnggota">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">
                        <strong>Catatan</strong>
                        <small style="color: #666; font-weight: normal;"> - Update informasi tambahan jika diperlukan</small>
                    </label>
                    <textarea id="catatanEdit" style="width: 100%; padding: 8px; height: 100px;" 
                              placeholder="Contoh: Sampah organik 3 karung, plastik 1 karung, ada barang elektronik rusak...">${detail.catatan || ''}</textarea>
                </div>
                
                <div style="padding: 10px; background: #fff3cd; border-radius: 5px; margin-bottom: 15px;">
                    <p style="margin: 0; color: #856404;">
                        <strong>⚠️ Perhatian:</strong> Hanya catatan yang dapat diubah. 
                        Untuk mengubah tanggal atau membatalkan jadwal, gunakan tombol "Batalkan" dan buat jadwal baru.
                    </p>
                </div>
            </form>
        `;

        showModal('Edit Catatan Jadwal', formHTML, async () => {
            const catatan = document.getElementById('catatanEdit').value || '';

            try {
                await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
                    method: 'PATCH',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        catatan: catatan
                    })
                });

                alert('✅ Catatan jadwal berhasil diupdate!');
                loadDetailAnggotaJadwalAnggota();
            } catch (error) {
                console.error('Update error:', error);
                alert('Error: ' + error.message);
            }
        });

    } catch (error) {
        alert('Error loading data: ' + error.message);
    }
}

async function batalkanJadwalAnggota(detailId) {
    showConfirmModal('Apakah Anda yakin ingin membatalkan jadwal ini?', async () => {
        try {
            await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    status_pengangkutan: 'dibatalkan'
                })
            });
            
            alert('✅ Jadwal berhasil dibatalkan!');
            loadDetailAnggotaJadwalAnggota();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }, 'Batalkan Jadwal', 'Ya, Batalkan', 'Tidak');
}

async function updateStatusSelesai(detailId) {
    showConfirmModal('Apakah pengangkutan sudah selesai?', async () => {
        try {
            await fetchAPI(`${API.detailAnggotaJadwal}${detailId}/`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    status_pengangkutan: 'selesai'
                })
            });
            
            alert('✅ Status jadwal berhasil diupdate menjadi "Selesai"!');
            loadDetailAnggotaJadwalAnggota();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }, 'Konfirmasi Selesai', 'Ya, Sudah Selesai', 'Belum');
}

// Tambahkan ke window untuk akses global
window.showAddDetailFormAnggota = showAddDetailFormAnggota;
window.removeSelectedJadwalAnggota = removeSelectedJadwalAnggota;