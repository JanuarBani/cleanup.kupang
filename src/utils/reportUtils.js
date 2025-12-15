// utils/reportUtils.js
import { apiRequest, showToast } from './authGuard.js';

export class ReportUtils {
    static async generateReport(reportType, data = {}) {
        try {
            console.log(`📊 Generating ${reportType} report`);
            
            const endpoints = {
                'keuangan': '/reports/keuangan/',
                'anggota': '/reports/anggota/',
                'laporan-sampah': '/reports/laporan-sampah/',
                'jadwal': '/reports/jadwal/',
                'user-stats': '/reports/user-stats/',
                'monthly': '/reports/monthly/'
            };

            const endpoint = endpoints[reportType];
            if (!endpoint) {
                throw new Error('Jenis laporan tidak valid');
            }

            let response;
            if (reportType === 'user-stats') {
                response = await apiRequest(endpoint, 'GET');
            } else {
                response = await apiRequest(endpoint, 'POST', data);
            }

            console.log(`✅ Report ${reportType} generated`);
            return response;

        } catch (error) {
            console.error(`❌ Error generating ${reportType} report:`, error);
            showToast(`Gagal membuat laporan ${reportType}: ${error.message}`, 'error');
            throw error;
        }
    }

    static formatRupiah(amount) {
        if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    static formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID');
        } catch (error) {
            return dateString;
        }
    }

    static createExportButtons(reportType, filters = {}) {
        return `
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button onclick="exportReport('${reportType}', 'pdf', ${JSON.stringify(filters)})" 
                        style="padding: 8px 15px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    PDF
                </button>
                <button onclick="exportReport('${reportType}', 'excel', ${JSON.stringify(filters)})"
                        style="padding: 8px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Excel
                </button>
                <button onclick="exportReport('${reportType}', 'json', ${JSON.stringify(filters)})"
                        style="padding: 8px 15px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    JSON
                </button>
            </div>
        `;
    }

    static async exportReport(reportType, format, filters = {}) {
        try {
            console.log(`Exporting ${reportType} as ${format}`);
            
            // Untuk sekarang, cukup tampilkan alert
            showToast(`Fitur export ${format} untuk ${reportType} belum diimplementasi`, 'info');
            
        } catch (error) {
            console.error('Error exporting report:', error);
            showToast('Gagal mengekspor laporan', 'error');
        }
    }
}

// Make exportReport available globally
window.exportReport = (reportType, format, filters) => {
    ReportUtils.exportReport(reportType, format, filters);
};