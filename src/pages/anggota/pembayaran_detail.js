import { API, getAuthHeaders } from "../../api.js";

// Global variable
let currentPaymentDetail = null;

// Helper functions
function getStatusColor(status) {
    const statusLower = status ? status.toLowerCase() : '';
    const colors = {
        'lunas': '#4CAF50',
        'success': '#4CAF50',
        'pending': '#FF9800',
        'failed': '#F44336',
        'gagal': '#F44336',
        'ditolak': '#F44336'
    };
    return colors[statusLower] || '#757575';
}

function getStatusText(status) {
    const statusLower = status ? status.toLowerCase() : '';
    const texts = {
        'lunas': 'LUNAS',
        'success': 'BERHASIL',
        'pending': 'MENUNGGU',
        'failed': 'GAGAL',
        'gagal': 'GAGAL',
        'ditolak': 'DITOLAK'
    };
    return texts[statusLower] || (status ? status.toUpperCase() : 'UNKNOWN');
}

function getMethodIcon(method) {
    const methodLower = method ? method.toLowerCase() : '';
    const icons = {
        'bank_transfer': '🏦',
        'transfer': '🏦',
        'cash': '💵',
        'tunai': '💵',
        'qris': '📱',
        'debit': '💳',
        'credit': '💳'
    };
    return icons[methodLower] || '💳';
}

function getMethodText(method) {
    const methodLower = method ? method.toLowerCase() : '';
    const texts = {
        'bank_transfer': 'Transfer Bank',
        'transfer': 'Transfer Bank',
        'cash': 'Tunai',
        'tunai': 'Tunai',
        'qris': 'QRIS',
        'debit': 'Kartu Debit',
        'credit': 'Kartu Kredit'
    };
    return texts[methodLower] || method || 'Transfer';
}

function formatDate(dateString) {
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

// Fungsi untuk mendapatkan ID pembayaran yang valid
function getValidPaymentId(paymentId) {
    console.log("🔍 Extracting payment ID from:", paymentId);
    
    // Jika paymentId adalah object, coba ambil ID dari property
    if (paymentId && typeof paymentId === 'object') {
        // Cek berbagai kemungkinan property untuk ID
        if (paymentId.idPembayaran) return paymentId.idPembayaran;
        if (paymentId.id) return paymentId.id;
        if (paymentId.payment_id) return paymentId.payment_id;
        
        // Jika ada string representation yang valid
        const stringId = String(paymentId);
        if (stringId && stringId !== '[object Object]') {
            return stringId;
        }
        
        console.error("❌ Cannot extract ID from object:", paymentId);
        return null;
    }
    
    // Jika sudah string/number, return as is
    return paymentId;
}

// Fungsi untuk menampilkan detail pembayaran
export async function showPaymentDetail(paymentId) {
    try {
        console.log("Loading payment detail:", paymentId);
        
        // Validasi dan ekstrak ID
        const validPaymentId = getValidPaymentId(paymentId);
        if (!validPaymentId) {
            throw new Error("ID pembayaran tidak valid");
        }
        
        console.log("Valid payment ID:", validPaymentId);
        
        // Fetch payment data
        const response = await fetch(`${API.pembayaran}${validPaymentId}/`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Gagal mengambil data pembayaran: ${response.status}`);
        }

        const paymentData = await response.json();
        currentPaymentDetail = paymentData;
        
        // Show modal - untuk anggota hanya view mode
        showPaymentDetailModal(paymentData, false);
        
    } catch (error) {
        console.error("Error loading payment detail:", error);
        showErrorAlert(`❌ Gagal memuat detail pembayaran: ${error.message}`);
    }
}

// Fungsi untuk menampilkan modal detail pembayaran (anggota view only)
export async function showPaymentDetailForAnggota(paymentId) {
    try {
        console.log("Loading payment detail for anggota:", paymentId);
        
        // Validasi dan ekstrak ID
        const validPaymentId = getValidPaymentId(paymentId);
        if (!validPaymentId) {
            throw new Error("ID pembayaran tidak valid");
        }
        
        console.log("Valid payment ID for anggota:", validPaymentId);
        
        // Coba beberapa format endpoint
        let paymentData = null;
        
        // Coba endpoint detail langsung
        try {
            const response = await fetch(`${API.pembayaran}${validPaymentId}/`, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                paymentData = await response.json();
            }
        } catch (error) {
            console.log("Direct endpoint failed, trying search...");
        }
        
        // Jika tidak berhasil, coba search endpoint
        if (!paymentData) {
            try {
                // Coba format /api/pembayaran/?id_pembayaran={id}
                const searchUrl = `${API.pembayaran}?id_pembayaran=${validPaymentId}`;
                const searchResponse = await fetch(searchUrl, {
                    headers: getAuthHeaders()
                });
                
                if (searchResponse.ok) {
                    const searchData = await searchResponse.json();
                    if (Array.isArray(searchData) && searchData.length > 0) {
                        paymentData = searchData[0];
                    } else if (searchData.results && Array.isArray(searchData.results) && searchData.results.length > 0) {
                        paymentData = searchData.results[0];
                    }
                }
            } catch (searchError) {
                console.log("Search endpoint also failed");
            }
        }
        
        // Jika masih tidak ada data, lempar error
        if (!paymentData) {
            throw new Error(`Pembayaran dengan ID ${validPaymentId} tidak ditemukan`);
        }
        
        currentPaymentDetail = paymentData;
        
        // Show modal untuk anggota (view only)
        showPaymentDetailModal(paymentData, false);
        
    } catch (error) {
        console.error("Error loading payment detail:", error);
        showErrorAlert(`❌ Gagal memuat detail pembayaran: ${error.message}`);
    }
}

// Fungsi untuk menampilkan error alert
function showErrorAlert(message) {
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        max-width: 400px;
    `;
    
    alertDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="flex: 1;">
                <strong>❌ Error</strong><br>
                <span style="font-size: 14px;">${message}</span>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; margin-left: 10px;">
                ×
            </button>
        </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Fungsi untuk menampilkan modal detail pembayaran
function showPaymentDetailModal(paymentData, isAdmin = false) {
    // Hapus modal yang sudah ada
    const existingModal = document.getElementById('paymentDetailModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Dapatkan data yang diperlukan dengan fallback
    const paymentId = paymentData.idPembayaran || paymentData.id || 'N/A';
    const status = paymentData.statusBayar || paymentData.status || 'unknown';
    const statusColor = getStatusColor(status);
    const statusText = getStatusText(status);
    const metode = paymentData.metodeBayar || paymentData.metode || 'unknown';
    const metodeIcon = getMethodIcon(metode);
    const metodeText = getMethodText(metode);
    const jumlahBayar = paymentData.jumlahBayar || paymentData.nominal || 0;
    const tanggalBayar = paymentData.tanggalBayar || paymentData.created_at;
    const buktiBayar = paymentData.buktiBayar || paymentData.bukti_bayar;
    const namaAnggota = paymentData.idAnggota?.nama || paymentData.namaAnggota || 'N/A';
    
    const modal = document.createElement('div');
    modal.id = 'paymentDetailModal';
    
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000;">
            <div style="background: white; padding: 25px; border-radius: 10px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto;">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; color: #333;">📋 Detail Pembayaran</h2>
                    <button onclick="closePaymentDetailModal()" 
                            style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">
                        ×
                    </button>
                </div>
                
                <!-- Payment Info -->
                <div style="margin-bottom: 25px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <div style="font-size: 14px; color: #666; margin-bottom: 5px;">ID Pembayaran</div>
                            <div style="font-weight: bold; font-size: 18px; color: #333;">
                                #${paymentId}
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Status</div>
                            <div style="padding: 6px 12px; background: ${statusColor}; color: white; border-radius: 20px; display: inline-block; font-weight: bold;">
                                ${statusText}
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Tanggal Bayar</div>
                                <div style="font-weight: bold;">
                                    ${formatDate(tanggalBayar)}
                                </div>
                            </div>
                            <div>
                                <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Jumlah Bayar</div>
                                <div style="font-weight: bold; font-size: 20px; color: #4CAF50;">
                                    Rp ${parseInt(jumlahBayar).toLocaleString('id-ID')}
                                </div>
                            </div>
                        </div>
                        
                        <div style="margin-top: 15px;">
                            <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Metode Pembayaran</div>
                            <div style="font-weight: bold; display: flex; align-items: center; gap: 8px;">
                                ${metodeIcon}
                                ${metodeText}
                            </div>
                        </div>
                        
                        ${namaAnggota !== 'N/A' ? `
                            <div style="margin-top: 15px;">
                                <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Nama Anggota</div>
                                <div style="font-weight: bold;">
                                    ${namaAnggota}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${isAdmin && paymentData.idAnggota?.idAnggota ? `
                            <div style="margin-top: 15px;">
                                <div style="font-size: 14px; color: #666; margin-bottom: 5px;">ID Anggota</div>
                                <div style="font-weight: bold;">
                                    #${paymentData.idAnggota.idAnggota}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Bukti Pembayaran -->
                ${buktiBayar ? `
                    <div style="margin-bottom: 25px;">
                        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">📎 Bukti Pembayaran</h3>
                        <div style="text-align: center;">
                            <img src="${buktiBayar}" 
                                 alt="Bukti Pembayaran" 
                                 style="max-width: 100%; max-height: 300px; border-radius: 8px; border: 1px solid #ddd;">
                            <div style="margin-top: 10px;">
                                <a href="${buktiBayar}" 
                                   target="_blank" 
                                   style="color: #2196F3; text-decoration: none;">
                                    🔍 Lihat Full Size
                                </a>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div style="margin-bottom: 25px;">
                        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">📎 Bukti Pembayaran</h3>
                        <div style="background: #f8f9fa; padding: 40px 20px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 10px;">📄</div>
                            <div style="color: #666; margin-bottom: 15px;">Belum ada bukti pembayaran</div>
                            ${!isAdmin && (metode === 'bank_transfer' || metode === 'transfer') && (status === 'pending' || status === 'menunggu') ? `
                                <button onclick="uploadProofForPayment(${paymentId})" 
                                        style="background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                                    📤 Upload Bukti
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `}
                
                <!-- Actions -->
                <div style="margin-top: 25px; display: flex; gap: 10px; flex-wrap: wrap;">
                    ${isAdmin && (status === 'pending' || status === 'menunggu') ? `
                        <button onclick="confirmPaymentAsAdmin('${paymentId}')" 
                                style="flex: 1; background: #4CAF50; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                            ✅ Konfirmasi Pembayaran
                        </button>
                        <button onclick="rejectPayment('${paymentId}')" 
                                style="flex: 1; background: #F44336; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer;">
                            ❌ Tolak Pembayaran
                        </button>
                    ` : ''}
                    
                    ${!isAdmin && (status === 'lunas' || status === 'success') ? `
                        <button onclick="printReceipt('${paymentId}')" 
                                style="flex: 1; background: #2196F3; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer;">
                            🖨️ Cetak Kwitansi
                        </button>
                    ` : ''}
                    
                    <button onclick="closePaymentDetailModal()" 
                            style="flex: 1; background: #757575; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer;">
                        Tutup
                    </button>
                </div>
                
                <!-- Additional Info -->
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                    <div style="display: flex; justify-content: space-between;">
                        <div>Dibuat: ${formatDate(paymentData.created_at)}</div>
                        <div>Diperbarui: ${formatDate(paymentData.updated_at || paymentData.created_at)}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Jika admin, tambahkan juga dropdown untuk mengubah status
    if (isAdmin) {
        addAdminStatusControls(paymentData);
    }
}

// Fungsi untuk menutup modal
function closePaymentDetailModal() {
    const modal = document.getElementById('paymentDetailModal');
    if (modal) {
        modal.remove();
    }
    currentPaymentDetail = null;
}

// Fungsi untuk cetak kwitansi (anggota)
function printReceipt(paymentId) {
    // Gunakan data dari currentPaymentDetail jika ada
    const paymentData = currentPaymentDetail;
    
    if (!paymentData) {
        alert('❌ Tidak ada data pembayaran untuk dicetak');
        return;
    }
    
    // Siapkan data untuk cetak
    const receiptData = {
        id: paymentData.idPembayaran || paymentData.id || paymentId,
        tanggal: formatDateForPrint(paymentData.tanggalBayar || paymentData.created_at),
        metode: getMethodText(paymentData.metodeBayar || paymentData.metode),
        jumlah: paymentData.jumlahBayar || paymentData.nominal || 0,
        nama: paymentData.idAnggota?.nama || paymentData.namaAnggota || 'Anggota',
        status: getStatusText(paymentData.statusBayar || paymentData.status)
    };
    
    // Buka window baru untuk cetak
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    // HTML untuk kwitansi
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Kwitansi Pembayaran #${receiptData.id}</title>
            <style>
                @media print {
                    @page {
                        margin: 20mm;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: 'Arial', sans-serif;
                    }
                }
                
                body {
                    font-family: 'Arial', sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #fff;
                }
                
                .receipt-container {
                    border: 2px solid #000;
                    padding: 30px;
                    margin: 20px 0;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #000;
                    padding-bottom: 20px;
                }
                
                .logo {
                    font-size: 48px;
                    margin-bottom: 10px;
                }
                
                .company-name {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 5px;
                    text-transform: uppercase;
                }
                
                .company-address {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 10px;
                }
                
                .receipt-title {
                    font-size: 28px;
                    font-weight: bold;
                    margin: 20px 0;
                    text-align: center;
                }
                
                .details-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 30px 0;
                }
                
                .details-table td {
                    padding: 12px 8px;
                    border-bottom: 1px solid #ddd;
                    vertical-align: top;
                }
                
                .details-table tr:last-child td {
                    border-bottom: none;
                }
                
                .details-label {
                    font-weight: bold;
                    width: 40%;
                }
                
                .amount-section {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    margin: 30px 0;
                    border: 1px dashed #ccc;
                }
                
                .amount-label {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 5px;
                }
                
                .amount-value {
                    font-size: 32px;
                    font-weight: bold;
                    color: #4CAF50;
                }
                
                .footer {
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 1px solid #000;
                }
                
                .signature-section {
                    float: right;
                    text-align: center;
                    margin-top: 60px;
                }
                
                .signature-line {
                    width: 200px;
                    border-top: 1px solid #000;
                    margin: 40px auto 10px;
                }
                
                .signature-label {
                    font-size: 14px;
                }
                
                .watermark {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 80px;
                    color: rgba(0,0,0,0.1);
                    z-index: -1;
                    white-space: nowrap;
                }
                
                .receipt-number {
                    text-align: right;
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 20px;
                }
                
                .note {
                    font-size: 12px;
                    color: #666;
                    margin-top: 30px;
                    text-align: center;
                }
                
                .print-button {
                    display: none;
                    text-align: center;
                    margin-top: 20px;
                }
                
                @media screen {
                    .print-button {
                        display: block;
                    }
                }
                
                .btn-print {
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 10px;
                }
                
                .btn-close {
                    background: #757575;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <!-- Watermark -->
                <div class="watermark">LUNAS</div>
                
                <!-- Receipt Number -->
                <div class="receipt-number">
                    No: ${receiptData.id}/${new Date().getFullYear()}
                </div>
                
                <!-- Header -->
                <div class="header">
                    <div class="logo">💰</div>
                    <div class="company-name">CLEANUP KUPANG</div>
                    <div class="company-address">
                        Jl. Perintis Kemerdekaan No. 10, Kupang<br>
                        Telp: (0380) 123456 | Email: info@cleanupkupang.id
                    </div>
                </div>
                
                <!-- Title -->
                <div class="receipt-title">KWITANSI PEMBAYARAN</div>
                
                <!-- Details -->
                <table class="details-table">
                    <tr>
                        <td class="details-label">Nomor Kwitansi</td>
                        <td>#${receiptData.id}</td>
                    </tr>
                    <tr>
                        <td class="details-label">Tanggal Pembayaran</td>
                        <td>${receiptData.tanggal}</td>
                    </tr>
                    <tr>
                        <td class="details-label">Nama Anggota</td>
                        <td>${receiptData.nama}</td>
                    </tr>
                    <tr>
                        <td class="details-label">Metode Pembayaran</td>
                        <td>${receiptData.metode}</td>
                    </tr>
                    <tr>
                        <td class="details-label">Status</td>
                        <td><strong>${receiptData.status}</strong></td>
                    </tr>
                </table>
                
                <!-- Amount -->
                <div class="amount-section">
                    <div class="amount-label">TOTAL PEMBAYARAN</div>
                    <div class="amount-value">Rp ${parseInt(receiptData.jumlah).toLocaleString('id-ID')}</div>
                </div>
                
                <!-- Footer -->
                <div class="footer">
                    <div class="note">
                        Kwitansi ini merupakan bukti pembayaran yang sah.<br>
                        Simpan kwitansi ini untuk keperluan administrasi.
                    </div>
                    
                    <div class="signature-section">
                        <div class="signature-line"></div>
                        <div class="signature-label">Petugas CleanUp Kupang</div>
                    </div>
                    
                    <div style="clear: both;"></div>
                </div>
            </div>
            
            <!-- Buttons (only on screen, not when printing) -->
            <div class="print-button">
                <button class="btn-print" onclick="window.print()">
                    🖨️ Cetak Kwitansi
                </button>
                <button class="btn-close" onclick="window.close()">
                    ✕ Tutup
                </button>
            </div>
            
            <script>
                // Auto print setelah halaman dimuat
                window.onload = function() {
                    // Tunggu sebentar agar semua konten dimuat
                    setTimeout(function() {
                        window.print();
                        
                        // Setelah cetak, close window setelah beberapa detik
                        setTimeout(function() {
                            window.close();
                        }, 1000);
                    }, 500);
                };
                
                // Handler untuk setelah cetak selesai
                window.onafterprint = function() {
                    setTimeout(function() {
                        window.close();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// Helper function untuk format tanggal cetak
function formatDateForPrint(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
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

// Export fungsi ke global scope
window.showPaymentDetail = showPaymentDetail;
window.showPaymentDetailForAnggota = showPaymentDetailForAnggota;
window.closePaymentDetailModal = closePaymentDetailModal;
window.printReceipt = printReceipt;
