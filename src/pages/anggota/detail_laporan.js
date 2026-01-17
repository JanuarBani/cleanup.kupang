// detail_laporan.js - VERSI DENGAN 2 MARKER: SAMPAH + LOKASI SAYA
import { API, getAuthHeaders } from "../../api.js";
import { authGuard } from "../../utils/authGuard.js";
import { loadLeaflet, initMap } from "../../utils/mapConfig.js";

// Global variable
let currentLaporanDetail = null;
let mapInstance = null;
let userMarker = null;

// Fungsi untuk menampilkan detail laporan
export async function showDetail(laporanId) {
    try {
        console.log("Loading laporan detail for ID:", laporanId);
        
        // Fetch laporan data
        const response = await fetch(`${API.laporanSampah}${laporanId}/`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Gagal mengambil data laporan: ${response.status}`);
        }

        const laporanData = await response.json();
        currentLaporanDetail = laporanData;
        
        // Show detail modal
        showDetailModal(laporanData);
        
    } catch (error) {
        console.error("Error loading laporan detail:", error);
        alert(`❌ Gagal memuat detail laporan: ${error.message}`);
    }
}

// Fungsi untuk mendapatkan GPS lokasi pengguna saat ini
function getCurrentUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("GPS tidak didukung oleh browser"));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date(position.timestamp)
                });
            },
            (error) => {
                let errorMessage = "Gagal mendapatkan lokasi GPS: ";
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += "Izin ditolak. Izinkan akses lokasi di pengaturan browser.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += "Informasi lokasi tidak tersedia.";
                        break;
                    case error.TIMEOUT:
                        errorMessage += "Permintaan waktu habis.";
                        break;
                    default:
                        errorMessage += "Error tidak diketahui.";
                }
                reject(new Error(errorMessage));
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 0
            }
        );
    });
}

// Fungsi untuk membuat marker custom
function createCustomMarker(lat, lng, popupHtml, color = 'red', iconSymbol = '🗑️') {
    let iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
    
    // Untuk marker hijau (lokasi saya), buat custom icon
    if (color === 'green') {
        const icon = L.divIcon({
            className: 'user-marker-custom',
            html: `
                <div style="
                    background: #4CAF50;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 0 10px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 14px;
                    font-weight: bold;
                ">
                    ${iconSymbol}
                </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
        
        return L.marker([lat, lng], { icon }).bindPopup(popupHtml);
    }
    
    // Untuk marker merah (default), pakai icon leaflet
    const icon = L.icon({
        iconUrl: iconUrl,
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const marker = L.marker([lat, lng], { icon })
        .bindPopup(popupHtml);
    
    return marker;
}

// Fungsi untuk menampilkan modal detail laporan
function showDetailModal(laporanData) {
    // Hapus modal yang sudah ada
    const existingModal = document.getElementById('laporanDetailModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'laporanDetailModal';
    
    // Tentukan warna status
    const statusColor = getStatusColor(laporanData.status);
    const statusText = getStatusText(laporanData.status);
    
    // Format tanggal
    const tanggal = formatFullDate(laporanData.tanggal_lapor);
    
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000;">
            <div style="background: white; padding: 0; border-radius: 10px; width: 95%; max-width: 1000px; max-height: 95vh; overflow-y: auto;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #2196F3, #1976D2); color: white; padding: 20px 25px; border-radius: 10px 10px 0 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <h2 style="margin: 0; font-size: 24px;">🗑️ Detail Laporan Sampah</h2>
                            <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">ID: #${laporanData.idLaporan}</p>
                        </div>
                        <button onclick="closeLaporanDetailModal()" 
                                style="background: rgba(255,255,255,0.2); border: none; color: white; font-size: 28px; cursor: pointer; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            ×
                        </button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <div style="padding: 6px 16px; background: ${statusColor}; color: white; border-radius: 20px; font-weight: bold; font-size: 14px;">
                            ${statusText}
                        </div>
                        <div style="font-size: 14px; opacity: 0.9;">
                            📅 ${tanggal}
                        </div>
                        <div style="font-size: 14px; opacity: 0.9; display: flex; align-items: center; gap: 5px; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 15px;">
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: #4CAF50;"></div>
                            <span>📍 GPS Aktif</span>
                        </div>
                    </div>
                </div>
                
                <!-- Content -->
                <div style="padding: 25px;">
                    <div style="display: flex; flex-direction: column; gap: 25px;">
                        <!-- ROW 1: Peta Besar di Atas -->
                        ${laporanData.latitude && laporanData.longitude ? `
                            <div style="flex: 1;">
                                <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px; display: flex; align-items: center; gap: 10px;">
                                    <span style="font-size: 20px;">🗺️</span> Peta Lokasi
                                    <span style="display: flex; align-items: center; gap: 10px; margin-left: auto;">
                                        <span style="display: flex; align-items: center; gap: 5px;">
                                            <div style="width: 12px; height: 12px; background: #FF5252; border-radius: 50%;"></div>
                                            <small style="font-size: 12px; color: #666;">Lokasi Sampah</small>
                                        </span>
                                        <span style="display: flex; align-items: center; gap: 5px;">
                                            <div style="width: 12px; height: 12px; background: #4CAF50; border-radius: 50%;"></div>
                                            <small style="font-size: 12px; color: #666;">Lokasi Saya</small>
                                        </span>
                                    </span>
                                </h3>
                                <div id="detailMap" style="height: 400px; border-radius: 10px; overflow: hidden; border: 1px solid #ddd; box-shadow: 0 2px 10px rgba(0,0,0,0.1);"></div>
                                
                                <!-- Controls -->
                                <div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between;">
                                    <div style="display: flex; gap: 10px;">
                                        <button onclick="showLocationOnGoogleMaps(${laporanData.latitude}, ${laporanData.longitude})" 
                                                style="background: #4285F4; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                                            <span>🌍</span> Buka di Google Maps
                                        </button>
                                        <button onclick="zoomInMap()" 
                                                style="background: #757575; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                                            <span>➕</span> Zoom In
                                        </button>
                                        <button onclick="zoomOutMap()" 
                                                style="background: #757575; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                                            <span>➖</span> Zoom Out
                                        </button>
                                    </div>
                                    
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <button onclick="centerToSampahMarker()" 
                                                style="background: #FF5252; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                                            <span>🗑️</span> Fokus ke Sampah
                                        </button>
                                        <button onclick="centerToUserMarker()" 
                                                style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                                            <span>📍</span> Fokus ke Saya
                                        </button>
                                        <button onclick="fitBothMarkers()" 
                                                style="background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                                            <span>🔍</span> Lihat Keduanya
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- GPS Info -->
                                <div id="gpsInfoBox" style="margin-top: 15px; background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid #4CAF50; display: none;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <div style="font-size: 14px; font-weight: bold; color: #333; display: flex; align-items: center; gap: 8px;">
                                                <span>📍</span> Informasi Lokasi
                                            </div>
                                            <div style="font-size: 12px; color: #666; margin-top: 5px;">
                                                <span id="distanceInfo">Menghitung jarak...</span>
                                            </div>
                                        </div>
                                        <button onclick="updateUserLocation()" 
                                                style="background: #4CAF50; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 5px;">
                                            <span>🔄</span> Update GPS
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- ROW 2: Grid untuk Info dan Foto (sama seperti sebelumnya) -->
                        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 25px;">
                            <!-- Left Column: Informasi Lengkap -->
                            <div>
                                <!-- Reporter & Status Info -->
                                <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                        <div>
                                            <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                                                <span style="font-size: 18px;">👤</span> Pelapor
                                            </h3>
                                            <div style="padding: 15px; background: white; border-radius: 6px; border: 1px solid #e0e0e0;">
                                                <div style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 5px;">
                                                    ${laporanData.nama || 'Tidak diketahui'}
                                                </div>
                                                ${laporanData.idUser ? `
                                                    <div style="font-size: 13px; color: #666;">ID: ${laporanData.idUser}</div>
                                                ` : ''}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                                                <span style="font-size: 18px;">📊</span> Status
                                            </h3>
                                            <div style="padding: 15px; background: white; border-radius: 6px; border: 1px solid #e0e0e0; text-align: center;">
                                                <div style="padding: 8px 16px; background: ${statusColor}; color: white; border-radius: 20px; font-weight: bold; font-size: 14px; display: inline-block;">
                                                    ${statusText}
                                                </div>
                                                <div style="margin-top: 10px; font-size: 13px; color: #666;">
                                                    ${getStatusDescription(laporanData.status)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Location Details -->
                                <div style="margin-bottom: 20px;">
                                    <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                                        <span style="font-size: 18px;">📍</span> Detail Lokasi
                                    </h3>
                                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                                        <div style="margin-bottom: 15px;">
                                            <div style="font-size: 13px; color: #666; margin-bottom: 5px; font-weight: bold;">ALAMAT</div>
                                            <div style="font-size: 15px; color: #333; line-height: 1.5; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e0e0e0;">
                                                ${laporanData.alamat || 'Tidak ada alamat'}
                                            </div>
                                        </div>
                                        
                                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                            <div>
                                                <div style="font-size: 13px; color: #666; margin-bottom: 5px; font-weight: bold;">LATITUDE</div>
                                                <div style="font-family: monospace; font-size: 14px; color: #333; padding: 10px; background: white; border-radius: 6px; border: 1px solid #e0e0e0;">
                                                    ${laporanData.latitude || '-'}
                                                </div>
                                            </div>
                                            <div>
                                                <div style="font-size: 13px; color: #666; margin-bottom: 5px; font-weight: bold;">LONGITUDE</div>
                                                <div style="font-family: monospace; font-size: 14px; color: #333; padding: 10px; background: white; border-radius: 6px; border: 1px solid #e0e0e0;">
                                                    ${laporanData.longitude || '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Description -->
                                <div>
                                    <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                                        <span style="font-size: 18px;">📝</span> Deskripsi Lengkap
                                    </h3>
                                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; min-height: 200px;">
                                        <div style="font-size: 15px; color: #333; line-height: 1.6; white-space: pre-wrap;">
                                            ${laporanData.deskripsi || 'Tidak ada deskripsi'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Right Column: Foto Bukti -->
                            <div>
                                <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 18px;">📷</span> Foto Bukti
                                </h3>
                                ${laporanData.foto_bukti ? `
                                    <div style="position: relative;">
                                        <img src="${laporanData.foto_bukti}" 
                                             alt="Foto Bukti Laporan" 
                                             style="width: 100%; height: 300px; border-radius: 10px; border: 1px solid #ddd; object-fit: cover; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                        <div style="position: absolute; bottom: 10px; right: 10px;">
                                            <a href="${laporanData.foto_bukti}" 
                                               target="_blank" 
                                               style="background: rgba(0,0,0,0.7); color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 12px; display: flex; align-items: center; gap: 5px;">
                                                🔍 Full Size
                                            </a>
                                        </div>
                                    </div>
                                    <div style="margin-top: 10px; text-align: center;">
                                        <small style="color: #666; font-size: 12px;">Klik Full Size untuk melihat gambar asli</small>
                                    </div>
                                ` : `
                                    <div style="background: #f8f9fa; padding: 60px 20px; border-radius: 10px; text-align: center; height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px dashed #ddd;">
                                        <div style="font-size: 48px; margin-bottom: 15px; color: #ccc;">📷</div>
                                        <div style="color: #666; margin-bottom: 10px;">Tidak ada foto bukti</div>
                                        <small style="color: #999;">Foto tidak diunggah saat laporan dibuat</small>
                                    </div>
                                `}
                                
                                <!-- Additional Info -->
                                <div style="margin-top: 25px; background: #f8f9fa; padding: 15px; border-radius: 8px;">
                                    <h4 style="margin: 0 0 10px 0; color: #333; font-size: 14px;">📋 Informasi Tambahan</h4>
                                    <div style="font-size: 12px; color: #666;">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                            <span>ID Laporan:</span>
                                            <span style="font-weight: bold;">#${laporanData.idLaporan}</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                            <span>Tanggal Dibuat:</span>
                                            <span>${formatShortDate(laporanData.tanggal_lapor)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- User GPS Info -->
                                <div id="userGPSBox" style="margin-top: 25px; background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4CAF50;">
                                    <h4 style="margin: 0 0 10px 0; color: #2e7d32; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                                        <span>📍</span> Lokasi Saya
                                    </h4>
                                    <div style="font-size: 12px; color: #2e7d32;">
                                        <div style="margin-bottom: 5px;">
                                            <strong>Status GPS:</strong> <span id="gpsStatusText">Memuat...</span>
                                        </div>
                                        <div style="margin-bottom: 5px;">
                                            <strong>Jarak ke Lokasi Sampah:</strong> <span id="distanceResult">-</span>
                                        </div>
                                        <button onclick="showDirections()" 
                                                style="margin-top: 10px; background: #4CAF50; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 5px;">
                                            <span>🧭</span> Tunjuk Arah ke Sampah
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee;">
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button onclick="printLaporan(${laporanData.idLaporan})" 
                                    style="background: #2196F3; color: white; border: none; padding: 12px 25px; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px; font-weight: bold;">
                                <span style="font-size: 16px;">🖨️</span> Cetak Laporan
                            </button>
                            
                            ${laporanData.latitude && laporanData.longitude ? `
                                <button onclick="shareLaporanLocation(${laporanData.latitude}, ${laporanData.longitude}, '${laporanData.alamat || ''}')" 
                                        style="background: #4CAF50; color: white; border: none; padding: 12px 25px; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 16px;">📤</span> Bagikan Lokasi
                                </button>
                            ` : ''}
                            
                            <button onclick="closeLaporanDetailModal()" 
                                    style="background: #757575; color: white; border: none; padding: 12px 25px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load map jika ada koordinat
    if (laporanData.latitude && laporanData.longitude) {
        loadLeaflet(() => {
            initMapWithTwoMarkers(laporanData, statusText);
        });
    }
}

// Fungsi untuk inisialisasi peta dengan 2 marker
async function initMapWithTwoMarkers(laporanData, statusText) {
    const laporanLat = parseFloat(laporanData.latitude);
    const laporanLng = parseFloat(laporanData.longitude);
    
    // Inisialisasi peta
    mapInstance = initMap("detailMap", laporanLat, laporanLng, 14);
    
    // Array untuk menyimpan bounds
    const bounds = [[laporanLat, laporanLng]];
    
    // 1️⃣ MARKER LOKASI SAMPAH (MERAH)
    const sampahMarker = createCustomMarker(
        laporanLat, 
        laporanLng,
        `
        <div style="max-width: 250px;">
            <div style="font-weight: bold; color: #FF5252; margin-bottom: 5px; display: flex; align-items: center; gap: 5px;">
                <span>🗑️</span> LOKASI SAMPAH
            </div>
            <hr style="margin: 5px 0; border-color: #eee;">
            <div><strong>ID:</strong> #${laporanData.idLaporan}</div>
            <div><strong>Status:</strong> ${statusText}</div>
            <div><strong>Pelapor:</strong> ${laporanData.nama || '-'}</div>
            <div><strong>Alamat:</strong> ${laporanData.alamat ? laporanData.alamat.substring(0, 50) + '...' : '-'}</div>
            <div><strong>Koordinat:</strong><br>${laporanLat.toFixed(6)}, ${laporanLng.toFixed(6)}</div>
            <hr style="margin: 8px 0; border-color: #eee;">
            <button onclick="showLocationOnGoogleMaps(${laporanLat}, ${laporanLng})" 
                    style="background: #4285F4; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 11px; margin-top: 5px;">
                Buka di Google Maps
            </button>
        </div>
        `,
        'red',
        '🗑️'
    );
    
    sampahMarker.addTo(mapInstance);
    window.sampahMarker = sampahMarker;
    
    // 2️⃣ MARKER LOKASI SAYA (HĨJAU)
    try {
        console.log("Mencoba mendapatkan lokasi GPS pengguna...");
        const userLocation = await getCurrentUserLocation();
        const userLat = userLocation.latitude;
        const userLng = userLocation.longitude;
        const accuracy = userLocation.accuracy;
        
        console.log("GPS pengguna ditemukan:", { userLat, userLng, accuracy });
        
        userMarker = createCustomMarker(
            userLat,
            userLng,
            `
            <div style="max-width: 250px;">
                <div style="font-weight: bold; color: #4CAF50; margin-bottom: 5px; display: flex; align-items: center; gap: 5px;">
                    <span>📍</span> LOKASI SAYA
                </div>
                <hr style="margin: 5px 0; border-color: #eee;">
                <div><strong>Koordinat:</strong><br>${userLat.toFixed(6)}, ${userLng.toFixed(6)}</div>
                <div><strong>Akurasi:</strong> ${accuracy ? `${accuracy.toFixed(1)} meter` : 'Tidak diketahui'}</div>
                <div><strong>Waktu:</strong> ${new Date().toLocaleTimeString('id-ID')}</div>
                <div><strong>Jarak ke Sampah:</strong><br><span id="userToSampahDistance">Menghitung...</span></div>
                <hr style="margin: 8px 0; border-color: #eee;">
                <button onclick="centerToUserMarker()" 
                        style="background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 11px; margin-right: 5px;">
                    Fokus ke Saya
                </button>
                <button onclick="showLocationOnGoogleMaps(${userLat}, ${userLng})" 
                        style="background: #4285F4; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                    Buka di GMaps
                </button>
            </div>
            `,
            'green',
            '📍'
        );
        
        userMarker.addTo(mapInstance);
        window.userMarker = userMarker;
        bounds.push([userLat, userLng]);
        
        // Hitung jarak
        const distance = calculateDistance(userLat, userLng, laporanLat, laporanLng);
        
        // Update UI dengan jarak
        updateDistanceInfo(distance);
        
        // Tampilkan info box
        document.getElementById('gpsInfoBox').style.display = 'block';
        document.getElementById('gpsStatusText').textContent = 'Aktif';
        
        // Atur view peta untuk melihat kedua marker
        if (bounds.length > 1) {
            const latLngBounds = L.latLngBounds(bounds);
            mapInstance.fitBounds(latLngBounds, { 
                padding: [80, 80],
                maxZoom: 16
            });
        }
        
    } catch (error) {
        console.error("Error mendapatkan GPS pengguna:", error);
        
        // Update UI dengan error
        document.getElementById('gpsStatusText').textContent = 'Gagal';
        document.getElementById('userGPSBox').innerHTML += `
            <div style="color: #f44336; font-size: 11px; margin-top: 5px;">
                ⚠️ ${error.message}
            </div>
        `;
        
        // Tetap zoom ke lokasi sampah
        mapInstance.setView([laporanLat, laporanLng], 14);
    }
    
    // Simpan instance peta
    window.detailMapInstance = mapInstance;
    window.mapInstance = mapInstance;
}

// Fungsi untuk menghitung jarak
function calculateDistance(lat1, lng1, lat2, lng2) {
    function haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Radius bumi dalam meter
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }
    
    return haversineDistance(lat1, lng1, lat2, lng2);
}

// Update info jarak di UI
function updateDistanceInfo(distanceMeters) {
    let distanceText;
    
    if (distanceMeters < 1000) {
        distanceText = `${Math.round(distanceMeters)} meter`;
    } else {
        distanceText = `${(distanceMeters / 1000).toFixed(2)} km`;
    }
    
    // Update di info box
    const distanceInfo = document.getElementById('distanceInfo');
    const distanceResult = document.getElementById('distanceResult');
    
    if (distanceInfo) distanceInfo.textContent = `Jarak ke lokasi sampah: ${distanceText}`;
    if (distanceResult) distanceResult.textContent = distanceText;
    
    // Update di popup marker
    if (window.userMarker) {
        const currentPopup = window.userMarker.getPopup();
        const newContent = currentPopup.getContent().replace(
            '<span id="userToSampahDistance">Menghitung...</span>',
            `<span id="userToSampahDistance">${distanceText}</span>`
        );
        window.userMarker.setPopupContent(newContent);
    }
    
    return distanceText;
}

// Fungsi untuk update GPS lokasi
async function updateUserLocation() {
    try {
        const userLocation = await getCurrentUserLocation();
        const userLat = userLocation.latitude;
        const userLng = userLocation.longitude;
        
        // Update marker position
        if (window.userMarker) {
            window.userMarker.setLatLng([userLat, userLng]);
            
            // Update popup content
            const currentPopup = window.userMarker.getPopup();
            const newContent = currentPopup.getContent()
                .replace(/Koordinat:<br>[\d\.\-]+,\s[\d\.\-]+/, `Koordinat:<br>${userLat.toFixed(6)}, ${userLng.toFixed(6)}`)
                .replace(/Waktu:[^<]+/, `Waktu: ${new Date().toLocaleTimeString('id-ID')}`);
            
            window.userMarker.setPopupContent(newContent);
            
            // Update distance
            if (window.sampahMarker) {
                const sampahLatLng = window.sampahMarker.getLatLng();
                const distance = calculateDistance(userLat, userLng, sampahLatLng.lat, sampahLatLng.lng);
                updateDistanceInfo(distance);
            }
            
            alert(`📍 Lokasi diperbarui: ${userLat.toFixed(6)}, ${userLng.toFixed(6)}`);
        }
    } catch (error) {
        alert(`⚠️ Gagal update lokasi: ${error.message}`);
    }
}

// Fungsi untuk tunjuk arah di Google Maps
function showDirections() {
    if (window.userMarker && window.sampahMarker) {
        const userLatLng = window.userMarker.getLatLng();
        const sampahLatLng = window.sampahMarker.getLatLng();
        
        const url = `https://www.google.com/maps/dir/${userLatLng.lat},${userLatLng.lng}/${sampahLatLng.lat},${sampahLatLng.lng}`;
        window.open(url, '_blank');
    }
}

// Fungsi untuk kontrol peta
function centerToSampahMarker() {
    if (window.sampahMarker && window.mapInstance) {
        const latlng = window.sampahMarker.getLatLng();
        window.mapInstance.setView(latlng, 16);
        window.sampahMarker.openPopup();
    }
}

function centerToUserMarker() {
    if (window.userMarker && window.mapInstance) {
        const latlng = window.userMarker.getLatLng();
        window.mapInstance.setView(latlng, 16);
        window.userMarker.openPopup();
    }
}

function fitBothMarkers() {
    if (window.sampahMarker && window.userMarker && window.mapInstance) {
        const bounds = L.latLngBounds([
            window.sampahMarker.getLatLng(),
            window.userMarker.getLatLng()
        ]);
        window.mapInstance.fitBounds(bounds, { padding: [100, 100] });
    }
}

// HELPER FUNCTIONS (sama seperti sebelumnya)
function getStatusColor(status) {
    const colors = {
        'selesai': '#4CAF50',
        'proses': '#2196F3',
        'pending': '#FF9800',
        'default': '#757575'
    };
    return colors[status] || colors.default;
}

function getStatusText(status) {
    const texts = {
        'selesai': 'SELESAI',
        'proses': 'DIPROSES',
        'pending': 'MENUNGGU',
        'default': status?.toUpperCase() || 'UNKNOWN'
    };
    return texts[status] || texts.default;
}

function getStatusDescription(status) {
    const descriptions = {
        'selesai': 'Laporan telah ditangani dan selesai',
        'proses': 'Sedang dalam proses penanganan',
        'pending': 'Menunggu untuk diproses'
    };
    return descriptions[status] || 'Status laporan';
}

function formatFullDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateString;
    }
}

function formatShortDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return dateString;
    }
}

function showLocationOnGoogleMaps(latitude, longitude) {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, '_blank');
}

function zoomInMap() {
    if (window.detailMapInstance) {
        window.detailMapInstance.zoomIn();
    }
}

function zoomOutMap() {
    if (window.detailMapInstance) {
        window.detailMapInstance.zoomOut();
    }
}

function shareLaporanLocation(latitude, longitude, alamat) {
    const text = `Lokasi laporan sampah:\n${alamat}\nKoordinat: ${latitude}, ${longitude}\nGoogle Maps: https://www.google.com/maps?q=${latitude},${longitude}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Lokasi Laporan Sampah',
            text: text,
            url: `https://www.google.com/maps?q=${latitude},${longitude}`
        });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert('Lokasi telah disalin ke clipboard!');
        });
    }
}

function printLaporan(laporanId) {
    if (!currentLaporanDetail) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Laporan Sampah #${laporanId}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 30px; max-width: 800px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { font-size: 48px; margin-bottom: 10px; }
                .company { font-size: 24px; font-weight: bold; color: #2196F3; }
                .address { font-size: 14px; color: #666; margin-bottom: 20px; }
                .title { font-size: 32px; font-weight: bold; margin: 20px 0; }
                .details { margin: 20px 0; }
                .details table { width: 100%; border-collapse: collapse; }
                .details td { padding: 12px 0; border-bottom: 1px solid #ddd; }
                .section { margin: 25px 0; }
                .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #2196F3; }
                .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
                .status { padding: 5px 15px; border-radius: 20px; font-weight: bold; display: inline-block; margin-bottom: 10px; }
                .status-pending { background: #FF9800; color: white; }
                .status-proses { background: #2196F3; color: white; }
                .status-selesai { background: #4CAF50; color: white; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">🗑️</div>
                <div class="company">CLEANUP KUPANG</div>
                <div class="address">Jl. Perintis Kemerdekaan No. 10, Kota Kupang</div>
                <div class="title">LAPORAN SAMPAH</div>
            </div>
            
            <div class="details">
                <table>
                    <tr>
                        <td width="30%"><strong>ID Laporan</strong></td>
                        <td>#${currentLaporanDetail.idLaporan}</td>
                    </tr>
                    <tr>
                        <td><strong>Tanggal Lapor</strong></td>
                        <td>${formatFullDate(currentLaporanDetail.tanggal_lapor)}</td>
                    </tr>
                    <tr>
                        <td><strong>Status</strong></td>
                        <td>
                            <span class="status status-${currentLaporanDetail.status || 'pending'}">
                                ${getStatusText(currentLaporanDetail.status)}
                            </span>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div class="section">
                <div class="section-title">Informasi Pelapor</div>
                <table>
                    <tr>
                        <td width="30%"><strong>Nama Pelapor</strong></td>
                        <td>${currentLaporanDetail.nama}</td>
                    </tr>
                    <tr>
                        <td><strong>ID User</strong></td>
                        <td>${currentLaporanDetail.idUser || '-'}</td>
                    </tr>
                </table>
            </div>
            
            <div class="section">
                <div class="section-title">Lokasi Sampah</div>
                <table>
                    <tr>
                        <td width="30%"><strong>Alamat</strong></td>
                        <td>${currentLaporanDetail.alamat}</td>
                    </tr>
                    <tr>
                        <td><strong>Koordinat</strong></td>
                        <td>${currentLaporanDetail.latitude || '-'}, ${currentLaporanDetail.longitude || '-'}</td>
                    </tr>
                </table>
            </div>
            
            <div class="section">
                <div class="section-title">Deskripsi Sampah</div>
                <div style="padding: 15px; background: #f5f5f5; border-radius: 5px; margin: 10px 0;">
                    ${currentLaporanDetail.deskripsi}
                </div>
            </div>
            
            ${currentLaporanDetail.foto_bukti ? `
                <div class="section">
                    <div class="section-title">Foto Bukti</div>
                    <div style="text-align: center; margin: 20px 0;">
                        <img src="${currentLaporanDetail.foto_bukti}" 
                             style="max-width: 100%; max-height: 400px; border-radius: 5px; border: 1px solid #ddd;">
                    </div>
                </div>
            ` : ''}
            
            <div class="footer">
                <div style="margin: 30px 0;">
                    <div style="margin-bottom: 40px;">______________________________</div>
                    <div>Petugas CleanUp Kupang</div>
                </div>
                <div>Dicetak pada: ${new Date().toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</div>
                <div class="no-print" style="margin-top: 20px;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        🖨️ Cetak Dokumen
                    </button>
                </div>
            </div>
            
            <script>
                window.onload = function() {
                    // Auto print jika diinginkan
                    // window.print();
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Fungsi untuk menutup modal
function closeLaporanDetailModal() {
    const modal = document.getElementById('laporanDetailModal');
    if (modal) {
        modal.remove();
    }
    currentLaporanDetail = null;
    window.detailMapInstance = null;
    window.mapInstance = null;
    window.sampahMarker = null;
    window.userMarker = null;
    window.routePolyline = null;
}

// Export semua fungsi ke global scope
window.showDetail = showDetail;
window.closeLaporanDetailModal = closeLaporanDetailModal;
window.showLocationOnGoogleMaps = showLocationOnGoogleMaps;
window.zoomInMap = zoomInMap;
window.zoomOutMap = zoomOutMap;
window.shareLaporanLocation = shareLaporanLocation;
window.printLaporan = printLaporan;

// Export fungsi tambahan
window.centerToSampahMarker = centerToSampahMarker;
window.centerToUserMarker = centerToUserMarker;
window.fitBothMarkers = fitBothMarkers;
window.updateUserLocation = updateUserLocation;
window.showDirections = showDirections;