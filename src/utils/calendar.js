import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import weekday from "dayjs/plugin/weekday";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(weekday);

export function renderCalendar(containerId, selectedDates = [], onDateSelect) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const TODAY = dayjs();
  let currentMonth = TODAY.startOf("month");

  const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  container.innerHTML = `
    <div class="calendar-month">
      <section class="calendar-month-header">
        <div id="selected-month" class="calendar-month-header-selected-month"></div>
        <section class="calendar-month-header-selectors">
          <span id="previous-month-selector"><</span>
          <span id="present-month-selector">Today</span>
          <span id="next-month-selector">></span>
        </section>
      </section>
      <ol id="days-of-week" class="day-of-week"></ol>
      <ol id="calendar-days" class="days-grid"></ol>
    </div>
  `;

  const daysOfWeekElement = document.getElementById("days-of-week");
  WEEKDAYS.forEach((d) => {
    const li = document.createElement("li");
    li.innerText = d;
    daysOfWeekElement.appendChild(li);
  });

  function createCalendar() {
    const calendarDaysElement = document.getElementById("calendar-days");
    document.getElementById("selected-month").innerText = currentMonth.format("MMMM YYYY");
    calendarDaysElement.innerHTML = "";

    const startDay = currentMonth.startOf("week"); // Minggu pertama
    const endDay = currentMonth.endOf("month").endOf("week");

    let day = startDay;
    while (day.isBefore(endDay) || day.isSame(endDay, "day")) {
      const li = document.createElement("li");
      li.classList.add("calendar-day");
      li.innerText = day.date();

      const weekday = day.day(); // 0=Sun ... 6=Sat
      // Aktif hanya Senin(1), Selasa(2), Rabu(3)
      if ([1,2,3].includes(weekday) && day.isSameOrAfter(TODAY, "day")) {
        li.classList.add("calendar-day--active");
        li.addEventListener("click", () => {
          const dateStr = day.format("YYYY-MM-DD");
          const index = selectedDates.indexOf(dateStr);
          if (index > -1) {
            selectedDates.splice(index, 1);
            li.classList.remove("calendar-day--selected");
          } else {
            if (selectedDates.length >= 4) {
              alert("Hanya boleh memilih maksimal 4 tanggal sekaligus.");
              return;
            }
            selectedDates.push(dateStr);
            li.classList.add("calendar-day--selected");
          }
          if (onDateSelect) onDateSelect([...selectedDates]);
        });
      } else {
        li.classList.add("calendar-day--disabled");
      }

      if (selectedDates.includes(day.format("YYYY-MM-DD"))) {
        li.classList.add("calendar-day--selected");
      }

      calendarDaysElement.appendChild(li);
      day = day.add(1, "day");
    }
  }

  document.getElementById("previous-month-selector").onclick = () => {
    currentMonth = currentMonth.subtract(1, "month");
    createCalendar();
  };

  document.getElementById("next-month-selector").onclick = () => {
    currentMonth = currentMonth.add(1, "month");
    createCalendar();
  };

  document.getElementById("present-month-selector").onclick = () => {
    currentMonth = TODAY.startOf("month");
    createCalendar();
  };

  createCalendar();
  return selectedDates;
}
