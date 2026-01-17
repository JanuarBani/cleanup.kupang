// map.js - Fungsi untuk menampilkan peta interaktif dengan rute dan navigasi
export function showInteractiveRouteMap(
  latitude,
  longitude,
  title = "",
  description = ""
) {
  // Buat modal atau container untuk peta
  const modalId = "routeMapModal";
  let modal = document.getElementById(modalId);

  // Jika modal belum ada, buat elemen modal
  if (!modal) {
    modal = document.createElement("div");
    modal.id = modalId;
    modal.className = "modal fade";
    modal.setAttribute("tabindex", "-1");
    modal.setAttribute("aria-labelledby", "routeMapModalLabel");
    modal.setAttribute("aria-hidden", "true");

    modal.innerHTML = `
            <div class="modal-dialog modal-xl modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title" id="routeMapModalLabel">
                            <i class="bi bi-map me-2"></i>Peta Lokasi & Rute
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-0">
                        <div class="container-fluid">
                            <div class="row">
                                <!-- Peta -->
                                <div class="col-md-8 p-0 position-relative">
                                    <div id="routeMap" style="height: 600px;"></div>
                                    
                                    <!-- Panel Navigasi -->
                                    <div id="navigationPanel" class="card position-absolute bottom-20 start-0 end-0 m-3 shadow d-none">
                                        <div class="card-header py-2 bg-primary text-white d-flex justify-content-between align-items-center">
                                            <h6 class="mb-0"><i class="bi bi-compass me-2"></i>Navigasi Perjalanan</h6>
                                            <button id="closeNavigation" class="btn btn-sm btn-light">
                                                <i class="bi bi-x"></i>
                                            </button>
                                        </div>
                                        <div class="card-body p-2">
                                            <div class="row align-items-center">
                                                <div class="col-md-8">
                                                    <div id="turnByTurnNavigation" class="mb-2">
                                                        <div class="d-flex align-items-center">
                                                            <div id="turnIcon" class="me-3 fs-4 text-primary">
                                                                <i class="bi bi-signpost"></i>
                                                            </div>
                                                            <div>
                                                                <div id="nextInstruction" class="fw-bold">Mulai navigasi</div>
                                                                <small id="nextDistance" class="text-muted">-</small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div id="progressSection" class="d-none">
                                                        <div class="progress" style="height: 6px;">
                                                            <div id="routeProgress" class="progress-bar bg-success" role="progressbar" style="width: 0%"></div>
                                                        </div>
                                                        <div class="d-flex justify-content-between mt-1">
                                                            <small id="distanceRemaining" class="text-muted">-</small>
                                                            <small id="timeRemaining" class="text-muted">-</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-4 text-end">
                                                    <div class="btn-group">
                                                        <button id="prevStep" class="btn btn-outline-secondary btn-sm" disabled>
                                                            <i class="bi bi-chevron-left"></i>
                                                        </button>
                                                        <button id="nextStep" class="btn btn-outline-secondary btn-sm" disabled>
                                                            <i class="bi bi-chevron-right"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Panel Info -->
                                <div class="col-md-4 p-3">
                                    <h5 class="mb-3">${
                                      title || "Lokasi Anggota"
                                    }</h5>
                                    ${
                                      description
                                        ? `<p class="text-muted mb-3">${description}</p>`
                                        : ""
                                    }
                                    
                                    <div class="mb-4">
                                        <h6><i class="bi bi-geo-alt me-2"></i>Koordinat</h6>
                                        <p class="mb-1">Latitude: ${latitude}</p>
                                        <p>Longitude: ${longitude}</p>
                                    </div>
                                    
                                    <div class="mb-4">
                                        <h6><i class="bi bi-info-circle me-2"></i>Kontrol Peta</h6>
                                        <div class="d-grid gap-2">
                                            <button id="getUserLocation" class="btn btn-primary btn-sm">
                                                <i class="bi bi-geo me-2"></i>Lokasi Saya
                                            </button>
                                            <button id="showRoute" class="btn btn-success btn-sm" disabled>
                                                <i class="bi bi-signpost me-2"></i>Tampilkan Rute
                                            </button>
                                            <button id="startNavigation" class="btn btn-warning btn-sm" disabled>
                                                <i class="bi bi-compass me-2"></i>Mulai Navigasi
                                            </button>
                                            <button id="resetMapView" class="btn btn-secondary btn-sm">
                                                <i class="bi bi-arrow-clockwise me-2"></i>Reset Peta
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div id="routeInfo" class="mt-3" style="display: none;">
                                        <h6><i class="bi bi-graph-up me-2"></i>Informasi Rute</h6>
                                        <div class="row">
                                            <div class="col-6">
                                                <div class="card bg-light">
                                                    <div class="card-body p-2 text-center">
                                                        <small class="text-muted">Jarak</small>
                                                        <h6 id="routeDistance">-</h6>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-6">
                                                <div class="card bg-light">
                                                    <div class="card-body p-2 text-center">
                                                        <small class="text-muted">Waktu</small>
                                                        <h6 id="routeDuration">-</h6>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Panel Petunjuk Navigasi -->
                                    <div id="directionsPanel" class="mt-3 d-none">
                                        <h6><i class="bi bi-list-check me-2"></i>Petunjuk Perjalanan</h6>
                                        <div id="stepByStepDirections" style="max-height: 200px; overflow-y: auto;" class="mt-2">
                                            <!-- Petunjuk akan dimuat di sini -->
                                        </div>
                                    </div>
                                    
                                    <div id="locationStatus" class="mt-3"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    // Inisialisasi modal Bootstrap
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    // Event untuk membersihkan saat modal ditutup
    modal.addEventListener("hidden.bs.modal", function () {
      if (window.map) {
        window.map.remove();
        window.map = null;
      }
      if (window.routeControl) {
        window.routeControl.remove();
        window.routeControl = null;
      }
      if (window.navigationInterval) {
        clearInterval(window.navigationInterval);
        window.navigationInterval = null;
      }
    });
  } else {
    // Jika modal sudah ada, tampilkan lagi
    const modalInstance = bootstrap.Modal.getInstance(modal);
    if (!modalInstance) {
      new bootstrap.Modal(modal).show();
    } else {
      modalInstance.show();
    }

    // Update konten
    document.getElementById(
      "routeMapModalLabel"
    ).innerHTML = `<i class="bi bi-map me-2"></i>${
      title || "Peta Lokasi & Rute"
    }`;
    const modalBody = modal.querySelector(".modal-body");
    modalBody.querySelector("h5").textContent = title || "Lokasi Anggota";
    if (description) {
      const descEl = modalBody.querySelector("p.text-muted");
      if (descEl) descEl.textContent = description;
    }
    modalBody.querySelector(".mb-1").textContent = `Latitude: ${latitude}`;
    modalBody.querySelector(
      ".mb-1 + p"
    ).textContent = `Longitude: ${longitude}`;

    // Reset status
    document.getElementById("routeInfo").style.display = "none";
    document.getElementById("directionsPanel").classList.add("d-none");
    document.getElementById("navigationPanel").classList.add("d-none");
    document.getElementById("locationStatus").innerHTML = "";
  }

  // Load Leaflet assets dan inisialisasi peta
  loadLeafletAssets()
    .then(() => {
      setTimeout(() => initializeMap(latitude, longitude, title), 100);
    })
    .catch((error) => {
      console.error("Failed to load Leaflet:", error);
      showNotification("Gagal memuat peta. Silakan refresh halaman.", "error");
    });
}

// Fungsi untuk memuat assets Leaflet secara dinamis
function loadLeafletAssets() {
  return new Promise((resolve, reject) => {
    // Cek apakah Leaflet sudah dimuat
    if (window.L && window.L.Routing) {
      resolve();
      return;
    }

    // Buat array untuk melacak assets yang sudah dimuat
    let loadedCount = 0;
    const totalAssets = 4;

    // Fungsi untuk mengecek apakah semua assets sudah dimuat
    function checkAllLoaded() {
      loadedCount++;
      if (loadedCount === totalAssets && window.L && window.L.Routing) {
        resolve();
      }
    }

    // Load Leaflet CSS
    const leafletCSS = document.createElement("link");
    leafletCSS.rel = "stylesheet";
    leafletCSS.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    leafletCSS.onload = checkAllLoaded;
    leafletCSS.onerror = () => {
      console.error("Failed to load Leaflet CSS");
      checkAllLoaded();
    };
    document.head.appendChild(leafletCSS);

    // Load Leaflet Routing Machine CSS
    const routingCSS = document.createElement("link");
    routingCSS.rel = "stylesheet";
    routingCSS.href =
      "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css";
    routingCSS.onload = checkAllLoaded;
    routingCSS.onerror = () => {
      console.error("Failed to load Leaflet Routing Machine CSS");
      checkAllLoaded();
    };
    document.head.appendChild(routingCSS);

    // Load Leaflet JS
    const leafletJS = document.createElement("script");
    leafletJS.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    leafletJS.onload = checkAllLoaded;
    leafletJS.onerror = () => {
      console.error("Failed to load Leaflet JS");
      reject(new Error("Failed to load Leaflet"));
    };
    document.head.appendChild(leafletJS);

    // Load Leaflet Routing Machine JS
    const routingJS = document.createElement("script");
    routingJS.src =
      "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js";
    routingJS.onload = checkAllLoaded;
    routingJS.onerror = () => {
      console.error("Failed to load Leaflet Routing Machine JS");
      reject(new Error("Failed to load Leaflet Routing Machine"));
    };
    document.head.appendChild(routingJS);

    // Timeout untuk menghindari loading tak berujung
    setTimeout(() => {
      if (window.L && window.L.Routing) {
        resolve();
      } else {
        reject(new Error("Timeout loading Leaflet assets"));
      }
    }, 10000);
  });
}

function createLeafIcon({
  leafColor = "green", // green | orange | red
  overlayIcon = "bi-person-fill",
  overlayBg = "rgba(0,0,0,0.6)",
  leafFilter = "", // KHUSUS user
  size = [38, 95],
} = {}) {
  return L.divIcon({
    className: "leaf-marker",
    html: `
      <div style="position: relative; width: ${size[0]}px; height: ${
      size[1]
    }px;">
        
        <!-- Leaf image -->
        <img 
          src="../../../public/foto/leaf-${leafColor}.png"
          style="
            width: 100%;
            height: 100%;
            display: block;
            ${leafFilter ? `filter: ${leafFilter};` : ""}
          "
        />

        <!-- Overlay icon -->
        <div style="
          position: absolute;
          top: 18px;
          left: 50%;
          transform: translateX(-50%);
          width: 26px;
          height: 26px;
          background: ${overlayBg};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          border: 2px solid white;
          box-shadow: 0 0 6px rgba(0,0,0,0.4);
        ">
          <i class="bi ${overlayIcon}"></i>
        </div>
      </div>
    `,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] - 1],
    popupAnchor: [0, -size[1] + 20],
    shadowUrl: "../../../public/foto/leaf-silver.png",
    shadowSize: [50, 64],
    shadowAnchor: [4, 62],
  });
}

// Fungsi untuk menginisialisasi peta
function initializeMap(latitude, longitude, title) {
  // Periksa apakah Leaflet sudah tersedia
  if (!window.L) {
    console.error("Leaflet not loaded");
    return;
  }

  // Hapus peta lama jika ada
  if (window.map) {
    window.map.remove();
  }

  // Inisialisasi peta baru
  const map = L.map("routeMap").setView([latitude, longitude], 15);
  window.map = map;

  // Tambahkan tile layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  // Tambahkan marker untuk lokasi anggota
  const anggotaIcon = createLeafIcon({
    leafColor: "red",
    overlayIcon: "bi-person-fill",
  });

  const anggotaMarker = L.marker([latitude, longitude], { icon: anggotaIcon })
    .addTo(map)
    .bindPopup(
      `<strong>${
        title || "Lokasi Anggota"
      }</strong><br>Lat: ${latitude}<br>Lng: ${longitude}`
    );

  // Variabel global untuk navigasi
  window.userLocation = null;
  window.routeControl = null;
  window.userMarker = null;
  window.navigationInterval = null;
  window.currentRoute = null;
  window.currentStepIndex = 0;
  window.navigationSteps = [];

  // Elemen UI
  const getUserLocationBtn = document.getElementById("getUserLocation");
  const showRouteBtn = document.getElementById("showRoute");
  const startNavigationBtn = document.getElementById("startNavigation");
  const resetMapBtn = document.getElementById("resetMapView");
  const locationStatusEl = document.getElementById("locationStatus");
  const routeInfoEl = document.getElementById("routeInfo");
  const routeDistanceEl = document.getElementById("routeDistance");
  const routeDurationEl = document.getElementById("routeDuration");
  const navigationPanel = document.getElementById("navigationPanel");
  const closeNavigationBtn = document.getElementById("closeNavigation");
  const prevStepBtn = document.getElementById("prevStep");
  const nextStepBtn = document.getElementById("nextStep");
  const directionsPanel = document.getElementById("directionsPanel");
  const stepByStepDirections = document.getElementById("stepByStepDirections");
  const turnIcon = document.getElementById("turnIcon");
  const nextInstruction = document.getElementById("nextInstruction");
  const nextDistance = document.getElementById("nextDistance");
  const progressSection = document.getElementById("progressSection");
  const routeProgress = document.getElementById("routeProgress");
  const distanceRemaining = document.getElementById("distanceRemaining");
  const timeRemaining = document.getElementById("timeRemaining");

  // Fungsi untuk mendapatkan lokasi pengguna
  function getCurrentLocation() {
    locationStatusEl.innerHTML =
      '<div class="alert alert-info"><i class="bi bi-hourglass-split me-2"></i>Mendapatkan lokasi Anda...</div>';

    if (!navigator.geolocation) {
      locationStatusEl.innerHTML =
        '<div class="alert alert-danger">Browser tidak mendukung geolokasi</div>';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function (position) {
        window.userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Tambahkan marker lokasi pengguna
        if (window.userMarker) {
          map.removeLayer(window.userMarker);
        }

        const userIcon = createLeafIcon({
          leafColor: "green",
          overlayIcon: "bi-geo-alt-fill",
          overlayBg: "rgba(13,110,253,0.9)",
          leafFilter: "hue-rotate(185deg) brightness(0.9)",
        });

        window.userMarker = L.marker(
          [window.userLocation.lat, window.userLocation.lng],
          { icon: userIcon }
        )
          .addTo(map)
          .bindPopup("<strong>Lokasi Anda</strong>");

        locationStatusEl.innerHTML =
          '<div class="alert alert-success"><i class="bi bi-check-circle me-2"></i>Lokasi berhasil didapatkan!</div>';

        // Aktifkan tombol rute
        showRouteBtn.disabled = false;
        startNavigationBtn.disabled = false;

        // Zoom ke kedua lokasi
        const bounds = L.latLngBounds(
          [window.userLocation.lat, window.userLocation.lng],
          [latitude, longitude]
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      },
      function (error) {
        let errorMsg = "Gagal mendapatkan lokasi: ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg +=
              "Izin ditolak. Izinkan akses lokasi di pengaturan browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg += "Informasi lokasi tidak tersedia.";
            break;
          case error.TIMEOUT:
            errorMsg += "Waktu permintaan habis.";
            break;
          default:
            errorMsg += "Terjadi kesalahan.";
        }
        locationStatusEl.innerHTML = `<div class="alert alert-warning"><i class="bi bi-exclamation-triangle me-2"></i>${errorMsg}</div>`;
      },
      {
        enableHighAccuracy: true,
        timeout: 40000,
        maximumAge: 0,
      }
    );
  }

  // Fungsi untuk mendapatkan icon berdasarkan tipe belokan
  function getTurnIcon(type) {
    const iconMap = {
      Head: "bi-arrow-up",
      TurnLeft: "bi-arrow-left",
      TurnRight: "bi-arrow-right",
      SharpLeft: "bi-arrow-90deg-left",
      SharpRight: "bi-arrow-90deg-right",
      SlightLeft: "bi-arrow-left",
      SlightRight: "bi-arrow-right",
      Continue: "bi-arrow-up",
      Roundabout: "bi-arrow-repeat",
      Fork: "bi-signpost-split",
      Merge: "bi-signpost-merge",
      DestinationReached: "bi-flag-fill",
      Start: "bi-play-fill",
      End: "bi-flag-fill",
    };

    return iconMap[type] || "bi-signpost";
  }

  // Fungsi untuk memformat jarak
  function formatDistance(meters) {
    if (meters < 1000) {
      return Math.round(meters) + " m";
    } else {
      return (meters / 1000).toFixed(1) + " km";
    }
  }

  // Fungsi untuk memformat waktu
  function formatTime(seconds) {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return minutes + " menit";
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0
        ? `${hours} jam ${remainingMinutes} menit`
        : `${hours} jam`;
    }
  }

  function translateInstruction(instruction) {
    const text = instruction.text || "";
    const type = instruction.type || "";

    // ===== 1. Terjemahan berdasarkan TYPE (paling akurat) =====
    const typeMap = {
      Start: "Mulai perjalanan",
      Head: "Lurus ke depan",
      Continue: "Tetap lurus",
      TurnLeft: "Belok kiri",
      TurnRight: "Belok kanan",
      SlightLeft: "Belok kiri sedikit",
      SlightRight: "Belok kanan sedikit",
      Uturn: "Putar balik",
      SharpLeft: "Belok kiri tajam",
      SharpRight: "Belok kanan tajam",
      Roundabout: "Masuk bundaran",
      Fork: "Ambil percabangan",
      Merge: "Gabung ke jalur",
      DestinationReached: "Anda telah sampai di tujuan",
      End: "Tujuan tercapai",
    };

    if (typeMap[type]) {
      return typeMap[type];
    }

    // ===== 2. Terjemahan berbasis TEXT (regex OSRM) =====

    // Make a U-turn and continue on Jalan X
    if (/^Make a U-turn and continue on (.+)/i.test(text)) {
      return `Putar balik dan lanjut ke ${RegExp.$1}`;
    }

    // Turn right onto Jalan X
    if (/^Turn right onto (.+)/i.test(text)) {
      return `Belok kanan ke ${RegExp.$1}`;
    }

    // Turn left onto Jalan X
    if (/^Turn left onto (.+)/i.test(text)) {
      return `Belok kiri ke ${RegExp.$1}`;
    }

    // Go straight onto Jalan X
    if (/^Go straight onto (.+)/i.test(text)) {
      return `Lurus ke ${RegExp.$1}`;
    }

    // Continue onto Jalan X
    if (/^Continue onto (.+)/i.test(text)) {
      return `Tetap lurus ke ${RegExp.$1}`;
    }

    // Turn right
    if (/^Turn right$/i.test(text)) {
      return "Belok kanan";
    }

    // Turn left
    if (/^Turn left$/i.test(text)) {
      return "Belok kiri";
    }

    // Keep right / Keep left
    if (/^Keep right/i.test(text)) {
      return "Ambil jalur kanan";
    }

    if (/^Keep left/i.test(text)) {
      return "Ambil jalur kiri";
    }

    // Fork
    if (/^Take the fork/i.test(text)) {
      return "Ambil percabangan";
    }

    // Roundabout
    if (/roundabout/i.test(text)) {
      return "Masuk bundaran";
    }

    // Destination reached (kanan / kiri)
    if (/You have arrived at your destination/i.test(text)) {
      if (/right/i.test(text)) return "Tujuan berada di sebelah kanan";
      if (/left/i.test(text)) return "Tujuan berada di sebelah kiri";
      return "Anda telah sampai di tujuan";
    }

    // ===== 3. Fallback =====
    return text;
  }

  // Fungsi untuk menampilkan petunjuk langkah demi langkah
  function displayStepByStepDirections(instructions) {
    stepByStepDirections.innerHTML = "";
    window.navigationSteps = instructions;

    instructions.forEach((instruction, index) => {
      const stepEl = document.createElement("div");
      stepEl.className = `d-flex align-items-start mb-2 p-2 rounded ${
        index === 0 ? "bg-light" : ""
      }`;
      stepEl.id = `step-${index}`;

      stepEl.innerHTML = `
        <div class="me-3 text-primary">
          <i class="bi ${getTurnIcon(instruction.type)} fs-5"></i>
        </div>
        <div class="flex-grow-1">
          <div class="fw-bold">${instruction.text}</div>
          <small class="text-muted">${formatDistance(
            instruction.distance
          )}</small>
        </div>
        <div class="ms-2">
          <small class="badge bg-secondary">${index + 1}</small>
        </div>
      `;

      stepByStepDirections.appendChild(stepEl);
    });

    // Tampilkan panel petunjuk
    directionsPanel.classList.remove("d-none");
  }

  // Fungsi untuk memperbarui tampilan navigasi
  function updateNavigationDisplay(stepIndex) {
    if (!window.navigationSteps || window.navigationSteps.length === 0) return;

    const step = window.navigationSteps[stepIndex];
    const nextStep = window.navigationSteps[stepIndex + 1];

    // Update icon belokan
    turnIcon.innerHTML = `<i class="bi ${getTurnIcon(step.type)}"></i>`;

    // Update instruksi
    nextInstruction.textContent = step.text;
    nextDistance.textContent = `Selanjutnya: ${formatDistance(step.distance)}`;

    // Update progress bar
    if (window.currentRoute && window.currentRoute.summary) {
      const totalDistance = window.currentRoute.summary.totalDistance;
      const distanceTraveled = window.navigationSteps
        .slice(0, stepIndex)
        .reduce((sum, s) => sum + s.distance, 0);

      const progress = (distanceTraveled / totalDistance) * 100;
      routeProgress.style.width = `${progress}%`;

      // Update sisa jarak dan waktu
      const remainingDistance = totalDistance - distanceTraveled;
      const remainingTime =
        (remainingDistance / totalDistance) *
        window.currentRoute.summary.totalTime;

      distanceRemaining.textContent = `${formatDistance(
        remainingDistance
      )} tersisa`;
      timeRemaining.textContent = `≈ ${formatTime(remainingTime)}`;
    }

    // Update highlight di panel petunjuk
    document
      .querySelectorAll("#stepByStepDirections > div")
      .forEach((el, idx) => {
        if (idx === stepIndex) {
          el.classList.add(
            "bg-light",
            "border-start",
            "border-primary",
            "border-3"
          );
        } else {
          el.classList.remove(
            "bg-light",
            "border-start",
            "border-primary",
            "border-3"
          );
        }
      });

    // Update tombol navigasi
    prevStepBtn.disabled = stepIndex === 0;
    nextStepBtn.disabled = stepIndex >= window.navigationSteps.length - 1;
  }

  // Fungsi untuk menampilkan rute
  function showRouteToLocation() {
    if (!window.userLocation) {
      locationStatusEl.innerHTML =
        '<div class="alert alert-warning">Harap dapatkan lokasi Anda terlebih dahulu</div>';
      return;
    }

    // Periksa apakah Leaflet Routing Machine tersedia
    if (!L.Routing) {
      locationStatusEl.innerHTML =
        '<div class="alert alert-danger">Fitur rute tidak tersedia. Silakan refresh halaman.</div>';
      return;
    }

    // Hapus rute sebelumnya
    if (window.routeControl) {
      map.removeControl(window.routeControl);
    }

    // Tampilkan info rute
    routeInfoEl.style.display = "block";

    try {
      // Buat rute
      window.routeControl = L.Routing.control({
        waypoints: [
          L.latLng(window.userLocation.lat, window.userLocation.lng),
          L.latLng(latitude, longitude),
        ],
        routeWhileDragging: false,
        showAlternatives: false,
        lineOptions: {
          styles: [{ color: "#0d6efd", opacity: 0.7, weight: 5 }],
        },
        createMarker: function () {
          return null;
        },
        addWaypoints: false,
        show: false,
      }).addTo(map);

      // Tangkap event rute ditemukan
      window.routeControl.on("routesfound", function (e) {
        const routes = e.routes;
        if (routes && routes.length > 0) {
          window.currentRoute = routes[0];
          const summary = routes[0].summary;

          // Format jarak
          let distance = summary.totalDistance / 1000;
          distance =
            distance < 1
              ? Math.round(summary.totalDistance) + " m"
              : distance.toFixed(2) + " km";

          // Format waktu
          const minutes = Math.round(summary.totalTime / 60);
          const hours = Math.floor(minutes / 60);
          const remainingMinutes = minutes % 60;
          let duration = "";

          if (hours > 0) {
            duration = `${hours} jam ${remainingMinutes} menit`;
          } else {
            duration = `${minutes} menit`;
          }

          routeDistanceEl.textContent = distance;
          routeDurationEl.textContent = duration;

          // Ekstrak petunjuk dari rute
          const instructions = [];
          routes[0].instructions.forEach((instruction) => {
            instructions.push({
              text: translateInstruction(instruction),
              distance: instruction.distance,
              time: instruction.time,
              type: instruction.type,
            });
          });

          // Tampilkan petunjuk langkah demi langkah
          displayStepByStepDirections(instructions);

          // Reset navigasi
          window.currentStepIndex = 0;
          updateNavigationDisplay(0);

          // Aktifkan tombol navigasi
          startNavigationBtn.disabled = false;
        }
      });

      // Tangkap error
      window.routeControl.on("routingerror", function (e) {
        console.error("Routing error:", e.error);
        locationStatusEl.innerHTML =
          '<div class="alert alert-warning">Tidak dapat menghitung rute. Coba lagi.</div>';
      });
    } catch (error) {
      console.error("Error creating route:", error);
      locationStatusEl.innerHTML =
        '<div class="alert alert-danger">Gagal membuat rute. Coba refresh halaman.</div>';
    }
  }

  // Fungsi untuk memulai navigasi
  function startNavigation() {
    if (!window.navigationSteps || window.navigationSteps.length === 0) {
      locationStatusEl.innerHTML =
        '<div class="alert alert-warning">Belum ada rute yang ditampilkan</div>';
      return;
    }

    // Tampilkan panel navigasi
    navigationPanel.classList.remove("d-none");
    progressSection.classList.remove("d-none");

    // Reset ke langkah pertama
    window.currentStepIndex = 0;
    updateNavigationDisplay(0);

    // Mulai tracking posisi pengguna secara berkala
    if (window.navigationInterval) {
      clearInterval(window.navigationInterval);
    }

    window.navigationInterval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Di sini Anda bisa menambahkan logika untuk
            // otomatis pindah ke langkah berikutnya berdasarkan posisi
            console.log("Tracking position:", position.coords);
          },
          (error) => {
            console.error("Error tracking position:", error);
          },
          { enableHighAccuracy: true }
        );
      }
    }, 5000); // Update setiap 5 detik

    locationStatusEl.innerHTML =
      '<div class="alert alert-success"><i class="bi bi-compass me-2"></i>Navigasi dimulai! Ikuti petunjuk di bawah peta.</div>';
  }

  // Fungsi untuk pindah ke langkah sebelumnya
  function goToPreviousStep() {
    if (window.currentStepIndex > 0) {
      window.currentStepIndex--;
      updateNavigationDisplay(window.currentStepIndex);
    }
  }

  // Fungsi untuk pindah ke langkah berikutnya
  function goToNextStep() {
    if (window.currentStepIndex < window.navigationSteps.length - 1) {
      window.currentStepIndex++;
      updateNavigationDisplay(window.currentStepIndex);
    }
  }

  // Fungsi untuk menutup navigasi
  function closeNavigation() {
    navigationPanel.classList.add("d-none");
    if (window.navigationInterval) {
      clearInterval(window.navigationInterval);
      window.navigationInterval = null;
    }
  }

  function resetMapView() {
    if (!map || !map._container) {
      console.warn("Map sudah tidak tersedia, reset dibatalkan");
      return;
    }

    if (window.routeControl) {
      map.removeControl(window.routeControl);
      window.routeControl = null;
    }

    if (window.userMarker) {
      map.removeLayer(window.userMarker);
      window.userMarker = null;
    }

    if (window.navigationInterval) {
      clearInterval(window.navigationInterval);
      window.navigationInterval = null;
    }

    map.setView([latitude, longitude], 15);

    routeInfoEl.style.display = "none";
    directionsPanel.classList.add("d-none");
    navigationPanel.classList.add("d-none");
    showRouteBtn.disabled = true;
    startNavigationBtn.disabled = true;
    locationStatusEl.innerHTML = "";
    window.userLocation = null;
    window.currentRoute = null;
    window.navigationSteps = [];
    window.currentStepIndex = 0;
  }

  // Event listeners
  getUserLocationBtn.addEventListener("click", getCurrentLocation);
  showRouteBtn.addEventListener("click", showRouteToLocation);
  startNavigationBtn.addEventListener("click", startNavigation);
  resetMapBtn.addEventListener("click", resetMapView);
  closeNavigationBtn.addEventListener("click", closeNavigation);
  prevStepBtn.addEventListener("click", goToPreviousStep);
  nextStepBtn.addEventListener("click", goToNextStep);
}

// Fungsi helper untuk menampilkan notifikasi
function showNotification(message, type = "info") {
  console.log(`${type}: ${message}`);
}
