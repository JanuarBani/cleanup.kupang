// detail_laporan.js - VERSI DENGAN PETA BESAR
import { API, getAuthHeaders } from "../../api.js";
import { authGuard } from "../../utils/authGuard.js";
import { loadLeaflet, initMap, addMarker } from "../../utils/mapConfig.js";

// Global variable
let currentLaporanDetail = null;

// Fungsi untuk menampilkan detail laporan
export async function showLaporanDetail(laporanId) {
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
        showLaporanDetailModal(laporanData);
        
    } catch (error) {
        console.error("Error loading laporan detail:", error);
        alert(`❌ Gagal memuat detail laporan: ${error.message}`);
    }
}

// Fungsi untuk menampilkan modal detail laporan DENGAN PETA BESAR
function showLaporanDetailModal(laporanData) {
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
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="padding: 6px 16px; background: ${statusColor}; color: white; border-radius: 20px; font-weight: bold; font-size: 14px;">
                            ${statusText}
                        </div>
                        <div style="font-size: 14px; opacity: 0.9;">
                            📅 ${tanggal}
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
                                </h3>
                                <div id="detailMap" style="height: 400px; border-radius: 10px; overflow: hidden; border: 1px solid #ddd; box-shadow: 0 2px 10px rgba(0,0,0,0.1);"></div>
                                <div style="margin-top: 10px; display: flex; gap: 10px; justify-content: flex-end;">
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
                            </div>
                        ` : ''}
                        
                        <!-- ROW 2: Grid untuk Info dan Foto -->
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
                                        <div style="display: flex; justify-content: space-between;">
                                            <span>Terakhir Diperbarui:</span>
                                            <span>${formatShortDate(laporanData.updated_at || laporanData.created_at)}</span>
                                        </div>
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
    
    // Load map if coordinates exist
    if (laporanData.latitude && laporanData.longitude) {
        loadLeaflet(() => {
            const map = initMap("detailMap", parseFloat(laporanData.latitude), parseFloat(laporanData.longitude), 16);
            addMarker(map, laporanData.latitude, laporanData.longitude, `
                <b>Lokasi Laporan #${laporanData.idLaporan}</b><br>
                ${laporanData.alamat || ''}<br>
                Status: ${statusText}
            `);
            
            // Simpan map instance untuk zoom controls
            window.detailMapInstance = map;
        });
    }
}

// Helper functions
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

// Fungsi untuk membuka lokasi di Google Maps
function showLocationOnGoogleMaps(latitude, longitude) {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, '_blank');
}

// Fungsi zoom in untuk peta
function zoomInMap() {
    if (window.detailMapInstance) {
        window.detailMapInstance.zoomIn();
    }
}

// Fungsi zoom out untuk peta
function zoomOutMap() {
    if (window.detailMapInstance) {
        window.detailMapInstance.zoomOut();
    }
}

// Fungsi untuk share lokasi
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

// Fungsi untuk mencetak laporan (sama seperti sebelumnya)
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
}

// Export fungsi ke global scope
window.showLaporanDetail = showLaporanDetail;
window.closeLaporanDetailModal = closeLaporanDetailModal;
window.showLocationOnGoogleMaps = showLocationOnGoogleMaps;
window.zoomInMap = zoomInMap;
window.zoomOutMap = zoomOutMap;
window.shareLaporanLocation = shareLaporanLocation;
window.printLaporan = printLaporan;