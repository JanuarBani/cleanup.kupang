import { API, authHeader } from "../../api.js";
import { authGuard } from "../../utils/authGuard.js";
import { renderCalendar } from "./formJadwalAdmin.js";

export async function jadwalAdminPage() {
    const user = await authGuard();
    const main = document.getElementById("mainContent");

    if (!user) {
        alert("Silakan login terlebih dahulu!");
        window.location.hash = "#/login";
        return;
    }

    // Cek jika user bukan admin
    if (user.role !== "admin") {
        main.innerHTML = `
            <div>
                <h2>Akses Ditolak</h2>
                <p>Hanya admin yang dapat mengakses halaman ini.</p>
                <button onclick="window.location.hash='#/'">
                    Kembali ke Dashboard
                </button>
            </div>
        `;
        return;
    }

    main.innerHTML = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h1>Manajemen Jadwal</h1>
                    <p>Kelola jadwal pengangkutan sampah</p>
                </div>
                <div>
                    <button id="btnTambahJadwal" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Buat Jadwal Baru
                    </button>
                    <button id="btnRefresh" style="padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
                        Refresh
                    </button>
                </div>
            </div>

            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                <div style="flex: 1; padding: 15px; background: white; border: 1px solid #ddd; border-radius: 4px;">
                    <h3 id="totalJadwal" style="margin: 0; font-size: 24px;">0</h3>
                    <p style="margin: 5px 0 0 0;">Total Jadwal</p>
                </div>
                <div style="flex: 1; padding: 15px; background: white; border: 1px solid #ddd; border-radius: 4px;">
                    <h3 id="totalTim" style="margin: 0; font-size: 24px;">0</h3>
                    <p style="margin: 5px 0 0 0;">Tim Aktif</p>
                </div>
                <div style="flex: 1; padding: 15px; background: white; border: 1px solid #ddd; border-radius: 4px;">
                    <h3 id="jadwalBulanIni" style="margin: 0; font-size: 24px;">0</h3>
                    <p style="margin: 5px 0 0 0;">Jadwal Bulan Ini</p>
                </div>
            </div>

            <div style="display: flex; gap: 30px; margin-bottom: 30px;">
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3>Kalender Jadwal</h3>
                        <div style="display: flex; gap: 10px;">
                            <button id="btnToday" style="padding: 5px 10px; border: 1px solid #ddd; background: white; cursor: pointer;">Hari Ini</button>
                            <select id="monthSelect" style="padding: 5px; border: 1px solid #ddd;">
                                ${generateMonthOptions()}
                            </select>
                            <select id="yearSelect" style="padding: 5px; border: 1px solid #ddd;">
                                ${generateYearOptions()}
                            </select>
                        </div>
                    </div>
                    <div id="calendarMain" style="background: white; padding: 15px; border: 1px solid #ddd; border-radius: 4px;"></div>
                </div>

                <div style="flex: 1.5;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3>Daftar Jadwal</h3>
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="searchJadwal" placeholder="Cari jadwal..." style="padding: 5px; border: 1px solid #ddd;">
                            <select id="filterTim" style="padding: 5px; border: 1px solid #ddd;">
                                <option value="">Semua Tim</option>
                            </select>
                        </div>
                    </div>
                    <div id="jadwalList" style="background: white; padding: 15px; border: 1px solid #ddd; border-radius: 4px; min-height: 400px;">
                        Memuat data...
                    </div>
                </div>
            </div>

            <!-- Modal Container -->
            <div id="formModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; z-index: 1000;">
                <div style="background: white; border-radius: 4px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #ddd;">
                        <h3 id="modalTitle" style="margin: 0;">Tambah Jadwal</h3>
                        <button class="modal-close" style="background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
                    </div>
                    <div id="formContainer" style="padding: 15px;"></div>
                </div>
            </div>
        </div>
    `;

    let jadwalData = [];
    let timData = [];
    let selectedDate = new Date().toISOString().split('T')[0];

    // Event listeners
    document.getElementById("btnTambahJadwal").onclick = () => openFormModal();
    document.getElementById("btnRefresh").onclick = loadJadwal;
    document.getElementById("btnToday").onclick = () => {
        const today = new Date();
        document.getElementById("monthSelect").value = today.getMonth();
        document.getElementById("yearSelect").value = today.getFullYear();
        renderCalendarView();
    };

    document.getElementById("monthSelect").onchange = renderCalendarView;
    document.getElementById("yearSelect").onchange = renderCalendarView;
    document.getElementById("searchJadwal").oninput = filterJadwalList;
    document.getElementById("filterTim").onchange = filterJadwalList;

    // Modal close
    document.querySelector(".modal-close").onclick = closeModal;
    document.getElementById("formModal").onclick = (e) => {
        if (e.target.id === "formModal") closeModal();
    };

    // Load initial data
    loadTimData();
    loadJadwal();

    // ================================
    //          LOAD DATA
    // ================================
    async function loadTimData() {
        try {
            console.log("Loading tim data...");
            const res = await fetch(API.tim, { 
                headers: authHeader()
            });
            
            console.log("Response status:", res.status);
            
            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.removeItem('token');
                    window.location.hash = "#/login";
                    return;
                }
                throw new Error(`HTTP ${res.status}: Gagal memuat data tim`);
            }
            
            const response = await res.json();
            console.log("Raw tim response:", response);
            
            // FORMAT: {"success":true,"data":[array],"count":X}
            if (response.success && response.data && Array.isArray(response.data)) {
                timData = response.data;
            } else if (Array.isArray(response)) {
                // Fallback jika langsung array
                timData = response;
            } else {
                console.error("Unexpected tim response format:", response);
                timData = [];
            }
            
            console.log("Processed timData:", timData);
            populateTimFilter();
            
        } catch (err) {
            console.error("Error loading tim:", err);
            
            // Fallback mock data
            timData = [
                { idTim: 1, namaTim: "josua", noWhatsapp: "08674577654", jumlah_anggota: 0 }
            ];
            populateTimFilter();
        }
    }

    async function loadJadwal() {
        const list = document.getElementById("jadwalList");
        list.innerHTML = "Memuat data...";

        try {
            const res = await fetch(API.jadwal, { headers: authHeader() });
            
            if (!res.ok) {
                throw new Error("Gagal memuat jadwal");
            }
            
            const data = await res.json();
            console.log("Raw jadwal data:", data);
            
            // FORMAT: langsung array
            if (Array.isArray(data)) {
                jadwalData = data;
            } else if (data.data && Array.isArray(data.data)) {
                jadwalData = data.data;
            } else {
                console.error("Unexpected jadwal format:", data);
                jadwalData = [];
            }
            
            console.log("Processed jadwalData:", jadwalData);
            
            // Update stats
            updateStats();
            
            // Render calendar
            renderCalendarView();
            
            // Render list
            renderJadwalList(jadwalData);

        } catch (err) {
            console.error(err);
            list.innerHTML = `
                <div>
                    <p>Gagal memuat data jadwal</p>
                    <button onclick="loadJadwal()">Coba Lagi</button>
                </div>
            `;
            alert("Gagal memuat data jadwal");
        }
    }

    // ================================
    //          RENDER FUNCTIONS
    // ================================
    function updateStats() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const jadwalBulanIni = jadwalData.filter(j => {
            try {
                const date = new Date(j.tanggalJadwal);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            } catch (e) {
                return false;
            }
        }).length;
        
        // Update DOM
        document.getElementById("totalJadwal").textContent = jadwalData.length;
        document.getElementById("totalTim").textContent = timData.length;
        document.getElementById("jadwalBulanIni").textContent = jadwalBulanIni;
    }

    function renderCalendarView() {
        const month = parseInt(document.getElementById("monthSelect").value);
        const year = parseInt(document.getElementById("yearSelect").value);
        
        const dates = jadwalData.map(j => j.tanggalJadwal);
        
        renderCalendar("calendarMain", dates, {
            month: month,
            year: year,
            onDateSelect: handleDateSelect,
            showMonthNav: false
        });
    }

    function renderJadwalList(data) {
        const list = document.getElementById("jadwalList");
        
        if (!data || !Array.isArray(data) || data.length === 0) {
            list.innerHTML = `
                <div>
                    <p>Belum ada jadwal</p>
                    <button onclick="openFormModal()">Buat Jadwal Pertama</button>
                </div>
            `;
            return;
        }

        // Sort by date descending
        const sortedData = [...data].sort((a, b) => {
            try {
                const dateA = new Date(a.tanggalJadwal);
                const dateB = new Date(b.tanggalJadwal);
                return dateB - dateA;
            } catch (e) {
                return 0;
            }
        });

        let tableHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid #ddd;">
                        <th style="padding: 10px; text-align: left;">Tanggal</th>
                        <th style="padding: 10px; text-align: left;">Hari</th>
                        <th style="padding: 10px; text-align: left;">Tim Pengangkut</th>
                        <th style="padding: 10px; text-align: left;">WhatsApp</th>
                        <th style="padding: 10px; text-align: left;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        sortedData.forEach(j => {
            try {
                const date = new Date(j.tanggalJadwal);
                const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][date.getDay()];
                
                // Cari info tim
                const timInfo = timData.find(t => t.idTim === j.idTim) || {};
                
                tableHTML += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px;">${date.toLocaleDateString('id-ID')}</td>
                        <td style="padding: 10px;">${hari}</td>
                        <td style="padding: 10px;">${j.nama_tim || timInfo.namaTim || '-'}</td>
                        <td style="padding: 10px;">${timInfo.noWhatsapp || '-'}</td>
                        <td style="padding: 10px;">
                            <button onclick="editJadwal(${j.idJadwal})" style="padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px;">Edit</button>
                            <button onclick="deleteJadwal(${j.idJadwal})" style="padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer;">Hapus</button>
                        </td>
                    </tr>
                `;
            } catch (e) {
                console.error("Error rendering jadwal row:", e);
            }
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        list.innerHTML = tableHTML;
    }

    // ================================
    //          EVENT HANDLERS
    // ================================
    function handleDateSelect(date) {
        selectedDate = date;
        openFormModal(date);
    }

    function openFormModal(date = null) {
        const modal = document.getElementById("formModal");
        const title = document.getElementById("modalTitle");
        
        title.textContent = date ? `Tambah Jadwal - ${formatDate(date)}` : "Tambah Jadwal Baru";
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
        
        // Load form
        loadForm(date);
    }

    async function loadForm(date = null, editId = null) {
        const container = document.getElementById("formContainer");
        container.innerHTML = "Memuat form...";
        
        try {
            const { formJadwalAdminPage } = await import("./formJadwalAdmin.js");
            
            const callback = (success) => {
                if (success) {
                    closeModal();
                    loadJadwal();
                    alert(editId ? "Jadwal berhasil diupdate" : "Jadwal berhasil dibuat");
                }
            };
            
            if (editId) {
                // Edit mode
                formJadwalAdminPage({ editId, timData, callback });
            } else {
                // Create mode
                formJadwalAdminPage({ date, timData, callback });
            }
        } catch (err) {
            console.error("Error loading form:", err);
            container.innerHTML = "Gagal memuat form. Silakan refresh halaman.";
        }
    }

    function closeModal() {
        document.getElementById("formModal").style.display = "none";
        document.body.style.overflow = "auto";
        document.getElementById("formContainer").innerHTML = "";
    }

    // ================================
    //          CRUD OPERATIONS
    // ================================
    window.editJadwal = function(id) {
        console.log("Edit jadwal:", id);
        openFormModal(null, id);
    };

    window.deleteJadwal = function(id) {
        if (!confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) return;
        
        fetch(`${API.jadwal}${id}/`, {
            method: "DELETE",
            headers: authHeader()
        })
        .then(res => {
            if (res.ok) {
                alert("Jadwal berhasil dihapus");
                loadJadwal();
            } else {
                throw new Error("Gagal menghapus jadwal");
            }
        })
        .catch(err => {
            console.error("Delete error:", err);
            alert("Gagal menghapus jadwal");
        });
    };

    // ================================
    //          UTILITIES
    // ================================
    function populateTimFilter() {
        const select = document.getElementById("filterTim");
        
        // Clear existing options except first
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        timData.forEach(tim => {
            if (tim.idTim && tim.namaTim) {
                const option = document.createElement("option");
                option.value = tim.idTim;
                option.textContent = tim.namaTim;
                select.appendChild(option);
            }
        });
    }

    function filterJadwalList() {
        const search = document.getElementById("searchJadwal").value.toLowerCase();
        const timFilter = document.getElementById("filterTim").value;
        
        let filtered = jadwalData;
        
        // Filter by search
        if (search) {
            filtered = filtered.filter(j => {
                const timName = j.nama_tim?.toLowerCase() || '';
                const dateStr = new Date(j.tanggalJadwal).toLocaleDateString('id-ID');
                return timName.includes(search) || dateStr.includes(search);
            });
        }
        
        // Filter by tim
        if (timFilter) {
            filtered = filtered.filter(j => j.idTim == timFilter);
        }
        
        renderJadwalList(filtered);
    }

    function formatDate(dateStr) {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    }

    function generateMonthOptions() {
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const currentMonth = new Date().getMonth();
        
        return months.map((month, index) => 
            `<option value="${index}" ${index === currentMonth ? 'selected' : ''}>${month}</option>`
        ).join('');
    }

    function generateYearOptions() {
        const currentYear = new Date().getFullYear();
        let options = '';
        
        for (let year = currentYear - 2; year <= currentYear + 2; year++) {
            options += `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`;
        }
        
        return options;
    }
}