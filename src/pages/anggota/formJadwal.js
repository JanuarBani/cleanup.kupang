import { API, authHeader } from "../../api.js";

/**
 * formJadwalPage
 * @param selectedDates - array tanggal dari DB
 * @param onUpdateDates - callback jika ada update tanggal baru
 */
export function formJadwalPage(selectedDates, onUpdateDates) {
    const formContainer = document.getElementById("formContainer");
    formContainer.innerHTML = `
        <form id="formJadwal">
            <div id="calendarForm" style="margin-bottom:20px;"></div>
            <button type="submit">Simpan Jadwal Baru</button>
        </form>
    `;

    let newSelectedDates = [];

    renderCalendar("calendarForm", selectedDates, newSelectedDates, (dates) => {
        newSelectedDates = dates;
    }, false);

    document.getElementById("formJadwal").onsubmit = async (e) => {
        e.preventDefault();
        if (!newSelectedDates.length) {
            alert("Pilih minimal satu tanggal!");
            return;
        }

        try {
            for (const tanggal of newSelectedDates) {
                const payload = { tanggalJadwal: tanggal, idTim: 1 };
                const res = await fetch(API.jadwal, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...authHeader() },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error("Gagal tambah jadwal " + tanggal + ": " + errorText);
                }
            }

            alert("Jadwal berhasil ditambahkan!");
            selectedDates.push(...newSelectedDates);
            if (onUpdateDates) onUpdateDates([...selectedDates]);
            formContainer.innerHTML = "";

        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan saat tambah jadwal: " + err.message);
        }
    };
}

/**
 * renderCalendar
 * Digunakan untuk form maupun kalender utama
 */
export function renderCalendar(
    containerId,
    selectedDatesDB = [],
    selectedDatesForm = [],
    onDateSelect = null,
    readOnly = false,
    highlightColorDB = "#1e88e5",
    highlightColorForm = "#00bcd4"
) {
    const container = document.getElementById(containerId);
    if (!container) return;

    selectedDatesDB = Array.isArray(selectedDatesDB) ? selectedDatesDB : [];
    selectedDatesForm = Array.isArray(selectedDatesForm) ? selectedDatesForm : [];

    container.innerHTML = "";
    const TODAY = new Date();
    const firstDayOfMonth = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
    const lastDayOfMonth = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0);

    const grid = document.createElement("div");
    grid.style = `display:grid;grid-template-columns:repeat(7,1fr);gap:5px;`;
    container.appendChild(grid);

    const dayNames = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
    dayNames.forEach(d => {
        const header = document.createElement("div");
        header.innerText = d;
        header.style.fontWeight = "bold";
        header.style.textAlign = "center";
        grid.appendChild(header);
    });

    for (let i = 0; i < firstDayOfMonth.getDay(); i++) grid.appendChild(document.createElement("div"));

    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
        const date = new Date(TODAY.getFullYear(), TODAY.getMonth(), d);
        const dateStr = date.toISOString().split("T")[0];
        const dayDiv = document.createElement("button");
        dayDiv.innerText = d;
        dayDiv.style.padding = "10px";
        dayDiv.style.border = "1px solid #ccc";
        dayDiv.style.cursor = readOnly ? "default" : "pointer";

        if ([1,2,3].includes(date.getDay())) { // Senin-Rabu aktif
            if (selectedDatesDB.includes(dateStr)) {
                dayDiv.style.backgroundColor = highlightColorDB;
                dayDiv.style.color = "#fff";
            } else if (selectedDatesForm.includes(dateStr)) {
                dayDiv.style.backgroundColor = highlightColorForm;
                dayDiv.style.color = "#fff";
            } else {
                dayDiv.style.backgroundColor = "#e0f7fa";
                dayDiv.style.color = "#000";
            }

            if (!readOnly) {
                dayDiv.addEventListener("click", () => {
                    const index = selectedDatesForm.indexOf(dateStr);
                    if (index > -1) {
                        selectedDatesForm.splice(index, 1);
                        dayDiv.style.backgroundColor = "#e0f7fa";
                        dayDiv.style.color = "#000";
                    } else {
                        if (selectedDatesForm.length + selectedDatesDB.length >= 4) {
                            alert("Maksimal pilih 4 tanggal (termasuk jadwal lama)");
                            return;
                        }
                        selectedDatesForm.push(dateStr);
                        dayDiv.style.backgroundColor = highlightColorForm;
                        dayDiv.style.color = "#fff";
                    }
                    if (onDateSelect) onDateSelect([...selectedDatesForm]);
                });
            }
        } else {
            dayDiv.disabled = true;
            dayDiv.style.backgroundColor = "#f5f5f5";
            dayDiv.style.color = "#aaa";
        }

        grid.appendChild(dayDiv);
    }
}
