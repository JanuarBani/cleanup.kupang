import { API, getAuthHeaders } from "../../api.js";

// Global variable
let currentPaymentDetail = null;
let access = localStorage.getItem('access');

// Fungsi untuk menampilkan detail pembayaran
export async function showPaymentDetail(paymentId) {
    try {
        console.log("Loading payment detail for ID:", paymentId);
        
        // Fetch payment data
        const response = await fetch(`${API.pembayaran}${paymentId}/`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Gagal mengambil data pembayaran: ${response.status}`);
        }

        const paymentData = await response.json();
        currentPaymentDetail = paymentData;
        
        // Show modal - untuk anggota hanya view mode
        showPaymentDetailModal(paymentData, false); // false = bukan admin
        
    } catch (error) {
        console.error("Error loading payment detail:", error);
        alert(`❌ Gagal memuat detail pembayaran: ${error.message}`);
    }
}

// Fungsi untuk menampilkan modal detail pembayaran (anggota view only)
export async function showPaymentDetailForAnggota(paymentId) {
    try {
        console.log("Loading payment detail for anggota:", paymentId);
        
        const response = await fetch(`${API.pembayaran}${paymentId}/`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Gagal mengambil data pembayaran: ${response.status}`);
        }

        const paymentData = await response.json();
        currentPaymentDetail = paymentData;
        
        // Show modal untuk anggota (view only)
        showPaymentDetailModal(paymentData, false);
        
    } catch (error) {
        console.error("Error loading payment detail:", error);
        alert(`❌ Gagal memuat detail pembayaran: ${error.message}`);
    }
}

// Fungsi untuk admin/petugas (bisa edit)
export async function showPaymentDetailForAdmin(paymentId) {
    try {
        console.log("Loading payment detail for admin:", paymentId);
        
        const response = await fetch(`${API.pembayaran}${paymentId}/`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Gagal mengambil data pembayaran: ${response.status}`);
        }

        const paymentData = await response.json();
        currentPaymentDetail = paymentData;
        
        // Show modal untuk admin (bisa edit)
        showPaymentDetailModal(paymentData, true);
        
    } catch (error) {
        console.error("Error loading payment detail:", error);
        alert(`❌ Gagal memuat detail pembayaran: ${error.message}`);
    }
}

// Fungsi untuk menampilkan modal detail pembayaran
function showPaymentDetailModal(paymentData, isAdmin = false) {
    // Hapus modal yang sudah ada
    const existingModal = document.getElementById('paymentDetailModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'paymentDetailModal';
    
    // Tentukan warna status
    const statusColor = getStatusColor(paymentData.statusBayar || paymentData.status);
    const statusText = getStatusText(paymentData.statusBayar || paymentData.status);
    
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
                                #${paymentData.idPembayaran || paymentData.id}
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
                                    ${formatDate(paymentData.tanggalBayar || paymentData.created_at)}
                                </div>
                            </div>
                            <div>
                                <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Jumlah Bayar</div>
                                <div style="font-weight: bold; font-size: 20px; color: #4CAF50;">
                                    Rp ${(paymentData.jumlahBayar || paymentData.nominal || 0).toLocaleString('id-ID')}
                                </div>
                            </div>
                        </div>
                        
                        <div style="margin-top: 15px;">
                            <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Metode Pembayaran</div>
                            <div style="font-weight: bold; display: flex; align-items: center; gap: 8px;">
                                ${getMethodIcon(paymentData.metodeBayar || paymentData.metode)}
                                ${getMethodText(paymentData.metodeBayar || paymentData.metode)}
                            </div>
                        </div>
                        
                        ${paymentData.idAnggota ? `
                            <div style="margin-top: 15px;">
                                <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Nama Anggota</div>
                                <div style="font-weight: bold;">
                                    ${paymentData.idAnggota?.nama || paymentData.namaAnggota || '-'}
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
                ${paymentData.buktiBayar ? `
                    <div style="margin-bottom: 25px;">
                        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">📎 Bukti Pembayaran</h3>
                        <div style="text-align: center;">
                            <img src="${paymentData.buktiBayar}" 
                                 alt="Bukti Pembayaran" 
                                 style="max-width: 100%; max-height: 300px; border-radius: 8px; border: 1px solid #ddd;">
                            <div style="margin-top: 10px;">
                                <a href="${paymentData.buktiBayar}" 
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
                            ${!isAdmin && (paymentData.metodeBayar === 'bank_transfer' || paymentData.metode === 'transfer') && (paymentData.statusBayar === 'pending' || paymentData.status === 'pending') ? `
                                <button onclick="uploadProofForPayment(${paymentData.idPembayaran || paymentData.id})" 
                                        style="background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                                    📤 Upload Bukti
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `}
                
                <!-- Actions -->
                <div style="margin-top: 25px; display: flex; gap: 10px; flex-wrap: wrap;">
                    ${isAdmin && (paymentData.statusBayar === 'pending' || paymentData.status === 'pending') ? `
                        <button onclick="confirmPaymentAsAdmin(${paymentData.idPembayaran || paymentData.id})" 
                                style="flex: 1; background: #4CAF50; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                            ✅ Konfirmasi Pembayaran
                        </button>
                        <button onclick="rejectPayment(${paymentData.idPembayaran || paymentData.id})" 
                                style="flex: 1; background: #F44336; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer;">
                            ❌ Tolak Pembayaran
                        </button>
                    ` : ''}
                    
                    ${!isAdmin && (paymentData.statusBayar === 'lunas' || paymentData.status === 'success') ? `
                        <button onclick="printReceipt(${paymentData.idPembayaran || paymentData.id})" 
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

// Tambahkan kontrol status untuk admin
function addAdminStatusControls(paymentData) {
    const actionsDiv = document.querySelector('#paymentDetailModal [style*="margin-top: 25px"]');
    if (!actionsDiv) return;
    
    // Tambahkan dropdown untuk mengubah status
    const statusControl = `
        <div style="margin-bottom: 15px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
            <div style="font-weight: bold; margin-bottom: 10px; color: #333;">🔄 Ubah Status</div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <select id="statusSelect" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="pending" ${(paymentData.statusBayar === 'pending') ? 'selected' : ''}>Menunggu</option>
                    <option value="lunas" ${(paymentData.statusBayar === 'lunas') ? 'selected' : ''}>Lunas</option>
                    <option value="gagal" ${(paymentData.statusBayar === 'gagal') ? 'selected' : ''}>Gagal</option>
                </select>
                <button onclick="updatePaymentStatus(${paymentData.idPembayaran || paymentData.id})" 
                        style="background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    Simpan
                </button>
            </div>
        </div>
    `;
    
    actionsDiv.insertAdjacentHTML('beforebegin', statusControl);
}

// Helper functions
function getStatusColor(status) {
    const colors = {
        'lunas': '#4CAF50',
        'success': '#4CAF50',
        'pending': '#FF9800',
        'failed': '#F44336',
        'gagal': '#F44336',
        'ditolak': '#F44336'
    };
    return colors[status] || '#757575';
}

function getStatusText(status) {
    const texts = {
        'lunas': 'LUNAS',
        'success': 'BERHASIL',
        'pending': 'MENUNGGU',
        'failed': 'GAGAL',
        'gagal': 'GAGAL',
        'ditolak': 'DITOLAK'
    };
    return texts[status] || status?.toUpperCase() || 'UNKNOWN';
}

function getMethodIcon(method) {
    const icons = {
        'bank_transfer': '🏦',
        'transfer': '🏦',
        'cash': '💵',
        'tunai': '💵',
        'qris': '📱',
        'debit': '💳',
        'credit': '💳'
    };
    return icons[method] || '💳';
}

function getMethodText(method) {
    const texts = {
        'bank_transfer': 'Transfer Bank',
        'transfer': 'Transfer Bank',
        'cash': 'Tunai',
        'tunai': 'Tunai',
        'qris': 'QRIS',
        'debit': 'Kartu Debit',
        'credit': 'Kartu Kredit'
    };
    return texts[method] || method || 'Transfer';
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

// Fungsi untuk admin konfirmasi pembayaran
async function confirmPaymentAsAdmin(paymentId) {
    const confirmAction = confirm(
        'Konfirmasi Pembayaran sebagai Admin:\n\n' +
        'Anda yakin ingin mengkonfirmasi pembayaran ini?\n' +
        'Status akan berubah menjadi "LUNAS" dan anggota akan mendapatkan akses.'
    );
    
    if (!confirmAction) return;
    
    try {
        const response = await fetch(`${API.pembayaran}${paymentId}/`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                statusBayar: 'lunas'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Gagal mengkonfirmasi pembayaran');
        }

        alert('✅ Pembayaran berhasil dikonfirmasi! Status: LUNAS');
        
        closePaymentDetailModal();
        
        if (typeof window.loadPembayaran === 'function') {
            window.loadPembayaran();
        }
        
    } catch (error) {
        console.error("Confirm payment error:", error);
        alert(`❌ Gagal mengkonfirmasi pembayaran: ${error.message}`);
    }
}

// Fungsi untuk menolak pembayaran (admin only)
async function rejectPayment(paymentId) {
    const reason = prompt('Masukkan alasan penolakan:');
    if (reason === null) return;
    
    const confirmAction = confirm(
        'Tolak Pembayaran:\n\n' +
        'Anda yakin ingin menolak pembayaran ini?\n' +
        `Alasan: ${reason}\n\n` +
        'Status akan berubah menjadi "GAGAL".'
    );
    
    if (!confirmAction) return;
    
    try {
        const response = await fetch(`${API.pembayaran}${paymentId}/`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                statusBayar: 'gagal'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Gagal menolak pembayaran');
        }

        alert('❌ Pembayaran telah ditolak! Status: GAGAL');
        
        closePaymentDetailModal();
        
        if (typeof window.loadPembayaran === 'function') {
            window.loadPembayaran();
        }
        
    } catch (error) {
        console.error("Reject payment error:", error);
        alert(`❌ Gagal menolak pembayaran: ${error.message}`);
    }
}

// Fungsi untuk update status (admin dropdown)
async function updatePaymentStatus(paymentId) {
    const statusSelect = document.getElementById('statusSelect');
    if (!statusSelect) return;
    
    const newStatus = statusSelect.value;
    
    const confirmAction = confirm(
        'Ubah Status Pembayaran:\n\n' +
        `Ubah status menjadi "${newStatus.toUpperCase()}"?\n\n` +
        'Perubahan ini akan langsung diterapkan.'
    );
    
    if (!confirmAction) return;
    
    try {
        const response = await fetch(`${API.pembayaran}${paymentId}/`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                statusBayar: newStatus
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Gagal mengubah status');
        }

        alert(`✅ Status berhasil diubah menjadi: ${newStatus.toUpperCase()}`);
        
        closePaymentDetailModal();
        
        if (typeof window.loadPembayaran === 'function') {
            window.loadPembayaran();
        }
        
    } catch (error) {
        console.error("Update status error:", error);
        alert(`❌ Gagal mengubah status: ${error.message}`);
    }
}

// Fungsi untuk upload bukti dari detail (anggota only)
async function uploadProofForPayment(paymentId) {
    closePaymentDetailModal();
    
    // Tampilkan modal upload untuk anggota
    showUploadModalForAnggota(paymentId);
}

// Fungsi untuk upload bukti (anggota)
function showUploadModalForAnggota(paymentId) {
    const existingModal = document.getElementById('uploadProofModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'uploadProofModal';
    
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000;">
            <div style="background: white; padding: 20px; border-radius: 8px; width: 90%; max-width: 400px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0;">📤 Upload Bukti Transfer</h3>
                    <button onclick="document.getElementById('uploadProofModal').remove()" 
                            style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <p>Upload bukti transfer untuk pembayaran #${paymentId}</p>
                    <p><strong>Rekening Tujuan:</strong><br>
                    BNI: 1234-5678-9012<br>
                    a.n CLEANUP KUPANG</p>
                </div>
                
                <div>
                    <div style="margin-bottom: 15px;">
                        <input type="file" id="proofFile" accept=".jpg,.jpeg,.png,.pdf" 
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div id="uploadProofMessage" style="margin-bottom: 15px;"></div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="doUploadProof(${paymentId})" 
                                style="flex: 1; background: #4CAF50; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer;">
                            Upload
                        </button>
                        <button onclick="document.getElementById('uploadProofModal').remove()" 
                                style="flex: 1; background: #757575; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer;">
                            Batal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Fungsi untuk upload bukti
async function doUploadProof(paymentId) {
    const fileInput = document.getElementById('proofFile');
    const messageDiv = document.getElementById('uploadProofMessage');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        messageDiv.innerHTML = '<div style="color: #F44336;">Pilih file terlebih dahulu</div>';
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('buktiBayar', file);
    
    try {
        const response = await fetch(`${API.pembayaran}${paymentId}/`, {
            method: "PATCH",
            headers: {
                'Authorization': `Bearer ${access}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Gagal mengupload bukti');
        }

        messageDiv.innerHTML = '<div style="color: #4CAF50;">✅ Bukti berhasil diupload!</div>';
        
        setTimeout(() => {
            document.getElementById('uploadProofModal').remove();
            alert('Bukti transfer berhasil diupload. Admin akan memverifikasi pembayaran Anda.');
            if (typeof window.loadPembayaran === 'function') {
                window.loadPembayaran();
            }
        }, 1500);
        
    } catch (error) {
        console.error("Upload proof error:", error);
        messageDiv.innerHTML = `<div style="color: #F44336;">❌ ${error.message}</div>`;
    }
}

// Fungsi untuk cetak kwitansi (anggota)
function printReceipt(paymentId) {
    if (!currentPaymentDetail) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Kwitansi #${paymentId}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .receipt { max-width: 400px; margin: 0 auto; border: 2px solid #000; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .logo { font-size: 48px; margin-bottom: 10px; }
                .company { font-size: 18px; font-weight: bold; }
                .address { font-size: 12px; color: #666; margin-bottom: 20px; }
                .details table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .details td { padding: 8px 0; border-bottom: 1px solid #ddd; }
                .footer { text-align: center; margin-top: 40px; font-size: 12px; }
                .signature { margin-top: 60px; text-align: right; }
                .total { font-size: 18px; font-weight: bold; text-align: right; }
                .note { font-size: 11px; color: #666; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="header">
                    <div class="logo">💰</div>
                    <div class="company">CLEANUP KUPANG</div>
                    <div class="address">Jl. Perintis Kemerdekaan No. 10, Kupang</div>
                    <div style="font-size: 24px; font-weight: bold; margin: 10px 0;">KWITANSI</div>
                </div>
                
                <div class="details">
                    <table>
                        <tr>
                            <td>No. Kwitansi</td>
                            <td>#${currentPaymentDetail.idPembayaran || paymentId}</td>
                        </tr>
                        <tr>
                            <td>Tanggal</td>
                            <td>${formatDate(currentPaymentDetail.tanggalBayar)}</td>
                        </tr>
                        <tr>
                            <td>Nama</td>
                            <td>${currentPaymentDetail.idAnggota?.nama || 'Anggota'}</td>
                        </tr>
                        <tr>
                            <td>Metode</td>
                            <td>${currentPaymentDetail.metodeBayar}</td>
                        </tr>
                    </table>
                    
                    <div style="margin: 20px 0; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                        <div style="text-align: center; font-size: 14px; margin-bottom: 5px;">JUMLAH PEMBAYARAN</div>
                        <div class="total">Rp ${(currentPaymentDetail.jumlahBayar || 0).toLocaleString('id-ID')}</div>
                    </div>
                    
                    <div class="note">
                        Kwitansi ini merupakan bukti pembayaran yang sah.<br>
                        Simpan kwitansi ini untuk keperluan administrasi.
                    </div>
                </div>
                
                <div class="footer">
                    <div>Terima kasih atas kepercayaan Anda</div>
                    <div style="margin-top: 10px; font-weight: bold;">CLEANUP KUPANG</div>
                </div>
                
                <div class="signature">
                    <div style="margin-top: 60px;">
                        __________________________
                    </div>
                    <div style="font-size: 12px;">Petugas</div>
                </div>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Fungsi untuk menutup modal
function closePaymentDetailModal() {
    const modal = document.getElementById('paymentDetailModal');
    if (modal) {
        modal.remove();
    }
    currentPaymentDetail = null;
}

// Export fungsi ke global scope
window.showPaymentDetail = showPaymentDetail;
window.showPaymentDetailForAnggota = showPaymentDetailForAnggota;
window.showPaymentDetailForAdmin = showPaymentDetailForAdmin;
window.closePaymentDetailModal = closePaymentDetailModal;
window.confirmPaymentAsAdmin = confirmPaymentAsAdmin;
window.rejectPayment = rejectPayment;
window.updatePaymentStatus = updatePaymentStatus;
window.uploadProofForPayment = uploadProofForPayment;
window.doUploadProof = doUploadProof;
window.printReceipt = printReceipt;