import { API, authHeader } from "../../api.js";
import { renderCalendar } from "../../utils/calendar.js";

export function formJadwalAdminPage({ date = null, editId = null, timData = [], callback = null }) {
    const container = document.getElementById("formContainer");
    if (!document.getElementById('modalContainer')) {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modalContainer';
    document.body.appendChild(modalContainer);
  }
    
    container.innerHTML = `
        <form id="jadwalForm" class="form-vertical">
            <div class="form-group">
                <label for="tanggalInput"><i class="fas fa-calendar-day"></i> Tanggal Jadwal:</label>
                <div class="date-picker-group">
                    <input type="date" id="tanggalInput" class="form-control" required 
                           ${date ? `value="${date}"` : ""}>
                    <button type="button" id="btnPickDate" class="btn-icon">
                        <i class="fas fa-calendar-alt"></i>
                    </button>
                </div>
                <small class="form-text">Pilih tanggal yang belum memiliki jadwal</small>
            </div>

            <div id="datePickerModal" class="modal">
                <div class="modal-content modal-sm">
                    <div class="modal-header">
                        <h4>Pilih Tanggal</h4>
                        <button type="button" class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div id="calendarPicker"></div>
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label for="timInput"><i class="fas fa-users"></i> Tim Pengangkut:</label>
                <select id="timInput" class="form-control" required>
                    <option value="">Pilih Tim...</option>
                    ${timData.map(tim => 
                        `<option value="${tim.idTim}">${tim.namaTim} (${tim.jumlahAnggota || 0} anggota)</option>`
                    ).join('')}
                </select>
            </div>

            <div class="form-group">
                <label><i class="fas fa-info-circle"></i> Informasi:</label>
                <div id="infoBox" class="info-box">
                    <p id="selectedDateInfo">-</p>
                    <p id="selectedTimInfo">-</p>
                </div>
            </div>

            <div class="form-actions">
                <button type="submit" class="btn-primary" id="btnSubmit">
                    <i class="fas fa-save"></i> ${editId ? 'Update' : 'Simpan'}
                </button>
                <button type="button" class="btn-secondary" id="btnCancel">
                    <i class="fas fa-times"></i> Batal
                </button>
            </div>
        </form>
    `;

    // Load existing data if editing
    if (editId) {
        loadEditData(editId);
    }

    // Setup event listeners
    setupEventListeners(callback);
}

async function loadEditData(id) {
    try {
        const res = await fetch(`${API.jadwal}${id}/`, { headers: authHeader() });
        if (!res.ok) throw new Error("Gagal memuat data");
        
        const data = await res.json();
        
        document.getElementById("tanggalInput").value = data.tanggalJadwal;
        document.getElementById("timInput").value = data.idTim.idTim;
        
        updateInfoBox(data.tanggalJadwal, data.idTim.namaTim);
        
    } catch (err) {
        console.error("Error loading edit data:", err);
        alert("Gagal memuat data jadwal");
    }
}

function setupEventListeners(callback) {
    const form = document.getElementById("jadwalForm");
    const tanggalInput = document.getElementById("tanggalInput");
    const timInput = document.getElementById("timInput");
    const btnPickDate = document.getElementById("btnPickDate");
    const btnCancel = document.getElementById("btnCancel");
    const datePickerModal = document.getElementById("datePickerModal");
    
    // Update info box on change
    tanggalInput.onchange = () => updateInfoBox(tanggalInput.value, getTimName(timInput.value));
    timInput.onchange = () => updateInfoBox(tanggalInput.value, getTimName(timInput.value));
    
    // Date picker button
    btnPickDate.onclick = () => {
        datePickerModal.style.display = "flex";
        renderDatePicker();
    };
    
    // Close date picker
    datePickerModal.querySelector(".modal-close").onclick = () => {
        datePickerModal.style.display = "none";
    };
    
    datePickerModal.onclick = (e) => {
        if (e.target === datePickerModal) {
            datePickerModal.style.display = "none";
        }
    };
    
    // Form submission
    form.onsubmit = async (e) => {
        e.preventDefault();
        await handleSubmit(callback);
    };
    
    // Cancel button
    btnCancel.onclick = () => {
        if (callback) callback(false);
    };
}

function renderDatePicker() {
    const container = document.getElementById("calendarPicker");
    
    // Get existing jadwal dates for highlighting
    fetch(API.jadwal, { headers: authHeader() })
        .then(res => res.json())
        .then(jadwalData => {
            const existingDates = jadwalData.map(j => j.tanggalJadwal);
            
            renderCalendar("calendarPicker", existingDates, {
                onDateSelect: (date) => {
                    document.getElementById("tanggalInput").value = date;
                    datePickerModal.style.display = "none";
                    updateInfoBox(date, getTimName(document.getElementById("timInput").value));
                },
                highlightColor: "#ff4444",
                showMonthNav: true
            });
        });
}

async function handleSubmit(callback) {
    const btnSubmit = document.getElementById("btnSubmit");
    const originalText = btnSubmit.innerHTML;
    
    try {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        
        const form = document.getElementById("jadwalForm");
        const formData = new FormData(form);
        
        const jadwalData = {
            tanggalJadwal: formData.get("tanggalInput"),
            idTim: parseInt(formData.get("timInput"))
        };
        
        // Check if date already exists
        const checkRes = await fetch(API.jadwal, { headers: authHeader() });
        const existingJadwal = await checkRes.json();
        
        const isDuplicate = existingJadwal.some(j => 
            j.tanggalJadwal === jadwalData.tanggalJadwal && 
            (!form.dataset.editId || j.idJadwal != form.dataset.editId)
        );
        
        if (isDuplicate) {
            alert("Tanggal ini sudah memiliki jadwal. Silakan pilih tanggal lain.");
            return;
        }
        
        // Determine if create or update
        const editId = form.dataset.editId;
        const url = editId ? `${API.jadwal}${editId}/` : API.jadwal;
        const method = editId ? "PUT" : "POST";
        
        const res = await fetch(url, {
            method: method,
            headers: {
                ...authHeader(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify(jadwalData)
        });
        
        if (!res.ok) throw new Error("Gagal menyimpan jadwal");
        
        if (callback) callback(true);
        
    } catch (err) {
        console.error("Submit error:", err);
        alert("Gagal menyimpan jadwal. " + err.message);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalText;
    }
}

function updateInfoBox(date, timName) {
    const dateInfo = document.getElementById("selectedDateInfo");
    const timInfo = document.getElementById("selectedTimInfo");
    
    if (date) {
        const dateObj = new Date(date);
        dateInfo.textContent = `Tanggal: ${dateObj.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}`;
    } else {
        dateInfo.textContent = "Tanggal belum dipilih";
    }
    
    if (timName) {
        timInfo.textContent = `Tim: ${timName}`;
    } else {
        timInfo.textContent = "Tim belum dipilih";
    }
}

function getTimName(timId) {
    const timSelect = document.getElementById("timInput");
    const selectedOption = timSelect.querySelector(`option[value="${timId}"]`);
    return selectedOption ? selectedOption.textContent.split('(')[0].trim() : null;
}

// Export renderCalendar for other files
export { renderCalendar };