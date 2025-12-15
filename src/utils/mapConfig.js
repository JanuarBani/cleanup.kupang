// mapConfig.js - Perbaikan lengkap dengan error handling
export function loadLeaflet(callback) {
    if (window.L) {
        fixLeafletIconPaths();
        return callback(); // Leaflet sudah ada
    }

    const leafletCSS = document.createElement("link");
    leafletCSS.rel = "stylesheet";
    leafletCSS.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    leafletCSS.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    leafletCSS.crossOrigin = "";
    document.head.appendChild(leafletCSS);

    const leafletScript = document.createElement("script");
    leafletScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    leafletScript.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    leafletScript.crossOrigin = "";
    
    leafletScript.onload = function() {
        fixLeafletIconPaths();
        callback();
    };
    
    document.body.appendChild(leafletScript);
}

// Fungsi untuk memperbaiki path icon marker Leaflet
function fixLeafletIconPaths() {
    // Perbaiki path default icon
    delete L.Icon.Default.prototype._getIconUrl;
    
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    });
}

// Fungsi untuk membuat peta umum (dashboard)
export function initMap(containerId, lat = -10.1935921, lng = 123.6149376, zoom = 13) {
    const container = document.getElementById(containerId);
    
    // PERBAIKAN: Cek apakah container ada
    if (!container) {
        console.error(`Map container '${containerId}' not found in DOM`);
        throw new Error(`Map container '${containerId}' not found`);
    }
    
    // PERBAIKAN: Pastikan container punya tinggi
    if (container.clientHeight === 0) {
        container.style.height = '400px';
    }
    
    const map = L.map(container).setView([lat, lng], zoom);
    
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    return map;
}

// Peta di form, dengan klik untuk update input lat/lng
export function initMapForm(containerId, latInputId, lngInputId, defaultLat = -10.1935921, defaultLng = 123.6149376, zoom = 13) {
    // PERBAIKAN: Tunggu sampai DOM siap
    return new Promise((resolve, reject) => {
        const checkContainer = () => {
            const container = document.getElementById(containerId);
            const latInput = document.getElementById(latInputId);
            const lngInput = document.getElementById(lngInputId);
            
            if (!container) {
                console.warn(`Map container '${containerId}' not found, retrying...`);
                setTimeout(checkContainer, 100);
                return;
            }
            
            try {
                // Inisialisasi peta
                const map = initMap(containerId, defaultLat, defaultLng, zoom);
                
                let marker;
                
                // Jika input ada, set nilai default
                if (latInput && lngInput) {
                    latInput.value = defaultLat.toFixed(8);
                    lngInput.value = defaultLng.toFixed(8);
                }
                
                // Buat marker awal
                marker = addMarker(map, defaultLat, defaultLng);
                
                map.on("click", (e) => {
                    const { lat, lng } = e.latlng;
                    
                    // Update input jika ada
                    if (latInput && lngInput) {
                        latInput.value = lat.toFixed(8);
                        lngInput.value = lng.toFixed(8);
                    }
                    
                    // Update marker position
                    marker.setLatLng([lat, lng]);
                    
                    // Tampilkan popup dengan koordinat
                    marker.bindPopup(`📍 Lokasi: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
                          .openPopup();
                });
                
                resolve(map);
                
            } catch (error) {
                console.error("Error initializing map:", error);
                reject(error);
            }
        };
        
        // Mulai pengecekan
        checkContainer();
    });
}

// Fungsi untuk menambahkan marker
export function addMarker(map, lat, lng, popupText = "", color = '#3388ff') {
    const marker = L.marker([lat, lng], {
        icon: createCustomIcon(color)
    }).addTo(map);
    
    if (popupText) {
        marker.bindPopup(popupText);
    }
    
    return marker;
}

// Fungsi untuk membuat custom marker icon (optional)
export function createCustomIcon(color = '#3388ff') {
    return L.divIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="${color}">
                 <path d="M12 0C7.58 0 4 3.58 4 8c0 4.42 8 16 8 16s8-11.58 8-16c0-4.42-3.58-8-8-8zm0 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
               </svg>`,
        className: 'custom-marker-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
}

// Fungsi helper untuk memastikan Leaflet dimuat
export function ensureLeafletLoaded() {
    return new Promise((resolve) => {
        if (window.L) {
            fixLeafletIconPaths();
            resolve();
        } else {
            loadLeaflet(() => {
                resolve();
            });
        }
    });
}