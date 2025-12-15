// pages/admin/reports.js
import { authGuard } from '../../utils/authGuard.js';
import { showToast } from '../../utils/toast.js';
import { API } from '../../api.js';

export async function reportsAdminPage() {
    const mainContent = document.getElementById('mainContent');
    if (!document.getElementById('modalContainer')) {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modalContainer';
    document.body.appendChild(modalContainer);
  }
    
    if (!mainContent) {
        console.error('mainContent element not found');
        return;
    }
    
    mainContent.innerHTML = `
        <div class="reports-container">
            <div class="reports-header">
                <h2><i class="fas fa-chart-bar"></i> Laporan dan Statistik</h2>
                <p class="text-muted">Kelola dan lihat berbagai laporan sistem</p>
            </div>
            
            <!-- Report Selection Cards -->
            <div class="row g-4 mb-4" id="reportCardsContainer">
                <div class="col-md-4">
                    <div class="report-card" data-report-type="keuangan">
                        <div class="report-icon bg-primary">
                            <i class="fas fa-money-bill-wave"></i>
                        </div>
                        <div class="report-content">
                            <h5>Laporan Keuangan</h5>
                            <p>Pendapatan, transaksi, dan statistik keuangan</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="report-card" data-report-type="anggota">
                        <div class="report-icon bg-success">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="report-content">
                            <h5>Laporan Anggota</h5>
                            <p>Statistik anggota dan aktivitas</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="report-card" data-report-type="laporan-sampah">
                        <div class="report-icon bg-warning">
                            <i class="fas fa-trash"></i>
                        </div>
                        <div class="report-content">
                            <h5>Laporan Sampah</h5>
                            <p>Laporan dan pengaduan sampah</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="report-card" data-report-type="jadwal">
                        <div class="report-icon bg-info">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div class="report-content">
                            <h5>Laporan Jadwal</h5>
                            <p>Jadwal pengangkutan dan tim</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="report-card" data-report-type="user-stats">
                        <div class="report-icon bg-dark">
                            <i class="fas fa-user-chart"></i>
                        </div>
                        <div class="report-content">
                            <h5>Statistik User</h5>
                            <p>Data pengguna dan aktivitas</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="report-card" data-report-type="monthly">
                        <div class="report-icon bg-purple">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="report-content">
                            <h5>Laporan Bulanan</h5>
                            <p>Ringkasan performa bulanan</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Report Display Area -->
            <div class="report-display-area">
                <div class="card">
                    <div class="card-header">
                        <h4 id="reportTitle" class="mb-0">Pilih Laporan</h4>
                    </div>
                    <div class="card-body">
                        <!-- Filter Section -->
                        <div id="filterSection" class="mb-4" style="display: none;">
                            <div class="card">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0"><i class="fas fa-filter"></i> Filter Laporan</h6>
                                </div>
                                <div class="card-body">
                                    <div id="filterContent"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Report Content -->
                        <div id="reportContent">
                            <div class="text-center py-5">
                                <div class="display-1 text-muted mb-3">
                                    <i class="fas fa-chart-pie"></i>
                                </div>
                                <h4 class="text-muted">Pilih jenis laporan di atas</h4>
                                <p class="text-muted">Klik salah satu kartu laporan untuk melihat detail</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Setup event listeners
    setupReportEventListeners();
    
    // Tambahkan CSS jika belum ada
    addReportsCSS();
}

// Setup event listeners untuk semua interaksi
function setupReportEventListeners() {
    // Event delegation untuk report cards
    const container = document.getElementById('reportCardsContainer');
    if (container) {
        container.addEventListener('click', (event) => {
            const reportCard = event.target.closest('.report-card');
            if (reportCard) {
                const reportType = reportCard.getAttribute('data-report-type');
                if (reportType) {
                    // Highlight active card
                    document.querySelectorAll('.report-card').forEach(card => {
                        card.classList.remove('active');
                    });
                    reportCard.classList.add('active');
                    
                    // Load report
                    loadReport(reportType);
                }
            }
        });
    }
    
    // Event delegation untuk semua form dalam report
    document.addEventListener('submit', (event) => {
        const form = event.target;
        
        // Handle filter form
        if (form.id === 'filterForm') {
            event.preventDefault();
            const activeCard = document.querySelector('.report-card.active');
            if (activeCard) {
                const reportType = activeCard.getAttribute('data-report-type');
                applyFilter(event, reportType);
            }
        }
        
        // Handle monthly report form
        if (form.id === 'monthlyFilterForm') {
            event.preventDefault();
            generateMonthlyReport();
        }
    });
    
    // Event delegation untuk semua button clicks dalam report
    document.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        
        // Handle export buttons
        if (button.textContent.includes('Export') || button.textContent.includes('📄') || 
            button.textContent.includes('📊') || button.textContent.includes('📋')) {
            const parentText = button.parentElement?.parentElement?.textContent || '';
            let reportType = '';
            
            if (parentText.includes('Keuangan')) reportType = 'keuangan';
            else if (parentText.includes('Anggota')) reportType = 'anggota';
            else if (parentText.includes('Sampah')) reportType = 'laporan-sampah';
            else if (parentText.includes('Jadwal')) reportType = 'jadwal';
            else if (parentText.includes('Bulanan')) reportType = 'monthly';
            
            const formatMatch = button.textContent.match(/PDF|Excel|JSON/);
            const format = formatMatch ? formatMatch[0].toLowerCase() : 'pdf';
            
            if (reportType) {
                event.preventDefault();
                exportReport(reportType, format);
            }
        }
        
        // Handle refresh buttons
        if (button.textContent.includes('Refresh') || button.textContent.includes('🔄')) {
            const parentText = button.parentElement?.parentElement?.textContent || '';
            if (parentText.includes('User') || parentText.includes('Statistik')) {
                event.preventDefault();
                loadUserStatsReport();
            }
        }
    });
}

// Fungsi untuk menambah CSS
function addReportsCSS() {
    if (document.querySelector('#reports-css')) return;
    
    const css = `
        .reports-container {
            padding: 20px;
        }
        
        .reports-header {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
        }
        
        .report-card {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.08);
            cursor: pointer;
            transition: all 0.3s ease;
            height: 100%;
            border: 1px solid #e9ecef;
        }
        
        .report-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
            border-color: #007bff;
        }
        
        .report-card.active {
            border-color: #007bff;
            background-color: #f8f9fa;
            box-shadow: 0 5px 15px rgba(0,123,255,0.2);
        }
        
        .report-icon {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            color: white;
            font-size: 24px;
        }
        
        .report-icon.bg-purple {
            background: linear-gradient(135deg, #6f42c1, #9b6bff);
        }
        
        .report-content h5 {
            font-weight: 600;
            margin-bottom: 10px;
            color: #343a40;
        }
        
        .report-content p {
            color: #6c757d;
            font-size: 0.9rem;
            margin-bottom: 0;
        }
        
        .report-display-area {
            margin-top: 30px;
        }
        
        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 300px;
            padding: 40px 20px;
        }
        
        .spinner-border {
            width: 3rem;
            height: 3rem;
            margin-bottom: 20px;
        }
        
        @media (max-width: 768px) {
            .report-card {
                padding: 20px;
            }
            
            .report-icon {
                width: 50px;
                height: 50px;
                font-size: 20px;
            }
        }
    `;
    
    const style = document.createElement('style');
    style.id = 'reports-css';
    style.textContent = css;
    document.head.appendChild(style);
}

function formatRupiah(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

async function fetchReport(url, method = 'POST', data = null, signal = null) {
    try {
        const token = localStorage.getItem('access');
        if (!token) {
            throw new Error('Sesi telah berakhir. Silakan login kembali.');
        }
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        
        const options = {
            method: method,
            headers: headers,
            signal: signal
        };
        
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        
        if (response.status === 401) {
            localStorage.removeItem('access');
            window.location.href = '/login';
            throw new Error('Sesi telah berakhir');
        }
        
        if (response.status >= 500) {
            throw new Error(`Server error ${response.status}. Silakan coba lagi nanti.`);
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { 
                    message: `HTTP ${response.status}: ${response.statusText}`,
                    details: errorText.substring(0, 100) + '...'
                };
            }
            
            const error = new Error(errorData.message || 'Terjadi kesalahan pada server');
            error.response = errorData;
            error.status = response.status;
            throw error;
        }
        
        const result = await response.json();
        
        if (result.status === 'error') {
            throw new Error(result.message || 'Terjadi kesalahan');
        }
        
        return result;
        
    } catch (error) {
        console.error('Fetch report error:', error);
        
        if (error.name === 'AbortError') {
            throw new Error('Request timeout. Silakan coba lagi.');
        }
        
        if (error.name === 'TypeError') {
            if (error.message.includes('fetch')) {
                throw new Error('Koneksi jaringan terputus. Periksa koneksi internet Anda.');
            }
            if (error.message.includes('token')) {
                throw new Error('Token tidak valid. Silakan login kembali.');
            }
        }
        
        if (error.message.includes('500')) {
            throw new Error('Server sedang mengalami masalah. Silakan coba lagi dalam beberapa menit.');
        }
        
        throw error;
    }
}

function createDateFilterForm(reportType) {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    return `
        <form id="filterForm">
            <div class="row g-3">
                <div class="col-md-5">
                    <label class="form-label">Tanggal Mulai</label>
                    <input type="date" class="form-control" id="startDate" 
                           value="${lastMonth.toISOString().split('T')[0]}" required>
                </div>
                <div class="col-md-5">
                    <label class="form-label">Tanggal Akhir</label>
                    <input type="date" class="form-control" id="endDate" 
                           value="${today.toISOString().split('T')[0]}" required>
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button type="submit" class="btn btn-primary w-100">
                        <i class="fas fa-filter"></i> Terapkan
                    </button>
                </div>
            </div>
        </form>
    `;
}

function createMonthYearFilter() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const years = [currentYear, currentYear - 1, currentYear - 2];
    
    return `
        <form id="monthlyFilterForm">
            <div class="row g-3">
                <div class="col-md-5">
                    <label class="form-label">Bulan</label>
                    <select class="form-select" id="monthSelect" required>
                        ${months.map((month, index) => `
                            <option value="${index + 1}" ${currentMonth === index + 1 ? 'selected' : ''}>
                                ${month}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="col-md-5">
                    <label class="form-label">Tahun</label>
                    <select class="form-select" id="yearSelect" required>
                        ${years.map(year => `
                            <option value="${year}" ${currentYear === year ? 'selected' : ''}>${year}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button type="submit" class="btn btn-primary w-100">
                        <i class="fas fa-chart-line"></i> Generate
                    </button>
                </div>
            </div>
        </form>
    `;
}

function createExportButtons(reportType, filters = {}) {
    return `
        <div class="mt-4 pt-3 border-top">
            <h6 class="mb-3"><i class="fas fa-download"></i> Export Laporan</h6>
            <div class="btn-group">
                <button type="button" class="btn btn-outline-danger export-btn" data-format="pdf">
                    <i class="fas fa-file-pdf"></i> PDF
                </button>
                <button type="button" class="btn btn-outline-success export-btn" data-format="excel">
                    <i class="fas fa-file-excel"></i> Excel
                </button>
                <button type="button" class="btn btn-outline-primary export-btn" data-format="json">
                    <i class="fas fa-file-code"></i> JSON
                </button>
            </div>
        </div>
    `;
}

async function loadReport(reportType) {
    const filterSection = document.getElementById('filterSection');
    const reportContent = document.getElementById('reportContent');
    const reportTitle = document.getElementById('reportTitle');
    
    try {
        reportContent.innerHTML = `
            <div class="loading-container">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <h4 class="mt-3">Memuat laporan...</h4>
            </div>
        `;
        
        const titles = {
            'keuangan': 'Laporan Keuangan',
            'anggota': 'Laporan Anggota',
            'laporan-sampah': 'Laporan Sampah',
            'jadwal': 'Laporan Jadwal',
            'user-stats': 'Statistik User',
            'monthly': 'Laporan Bulanan'
        };
        
        if (reportTitle) {
            reportTitle.textContent = titles[reportType] || 'Laporan';
        }
        
        if (filterSection) {
            filterSection.style.display = 'block';
        }
        
        const filterContent = document.getElementById('filterContent');
        
        if (reportType === 'user-stats') {
            if (filterContent) {
                filterContent.innerHTML = '';
            }
            await loadUserStatsReport();
            
        } else if (reportType === 'monthly') {
            if (filterContent) {
                filterContent.innerHTML = createMonthYearFilter();
            }
            await generateMonthlyReport();
            
        } else {
            if (filterContent) {
                filterContent.innerHTML = createDateFilterForm(reportType);
                
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                
                document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
                document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
            }
            
            await applyFilter(null, reportType);
        }
        
    } catch (error) {
        console.error('Error in loadReport:', error);
        
        if (reportContent) {
            reportContent.innerHTML = `
                <div class="alert alert-danger">
                    <h5><i class="fas fa-exclamation-triangle"></i> Error</h5>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
}

async function applyFilter(event, reportType, predefinedFilters = null) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const reportContent = document.getElementById('reportContent');
    const filterButton = event ? event.target.querySelector('button[type="submit"]') : null;
    
    try {
        reportContent.innerHTML = `
            <div class="loading-container">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="mt-3">
                    <h4>Memproses data...</h4>
                    <p class="text-muted">Sedang mengambil dan memproses data laporan</p>
                </div>
            </div>
        `;
        
        if (filterButton) {
            const originalText = filterButton.innerHTML;
            filterButton.disabled = true;
            filterButton.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Memproses...
            `;
        }
        
        let filters;
        if (predefinedFilters) {
            filters = predefinedFilters;
        } else {
            const startDate = document.getElementById('startDate')?.value;
            const endDate = document.getElementById('endDate')?.value;
            
            if (!startDate || !endDate) {
                throw new Error('Tanggal awal dan akhir harus diisi');
            }
            
            if (new Date(startDate) > new Date(endDate)) {
                throw new Error('Tanggal awal tidak boleh lebih besar dari tanggal akhir');
            }
            
            filters = { 
                start_date: startDate, 
                end_date: endDate 
            };
        }
        
        filters._t = new Date().getTime();
        
        let response;
        switch(reportType) {
            case 'keuangan':
                response = await fetchReport(API.reportsKeuangan, 'POST', filters);
                renderKeuanganReport(response.data || response, filters);
                break;
                
            case 'anggota':
                response = await fetchReport(API.reportsAnggota, 'POST', filters);
                renderAnggotaReport(response.data || response, filters);
                break;
                
            case 'laporan-sampah':
                response = await fetchReport(API.reportsLaporanSampah, 'POST', filters);
                renderLaporanSampahReport(response.data || response, filters);
                break;
                
            case 'jadwal':
                response = await fetchReport(API.reportsJadwal, 'POST', filters);
                renderJadwalReport(response.data || response, filters);
                break;
                
            default:
                throw new Error(`Tipe report tidak dikenali: ${reportType}`);
        }
        
    } catch (error) {
        console.error('Error in applyFilter:', error);
        
        let errorMessage = error.message;
        if (error.response) {
            errorMessage = error.response.message || error.message;
        }
        
        if (reportContent) {
            reportContent.innerHTML = `
                <div class="alert alert-danger">
                    <h5><i class="fas fa-exclamation-circle"></i> Gagal Memuat Data Laporan</h5>
                    <p>${errorMessage}</p>
                    <button class="btn btn-sm btn-outline-danger mt-2" onclick="window.applyFilter(null, '${reportType}')">
                        <i class="fas fa-redo"></i> Coba Lagi
                    </button>
                </div>
            `;
        }
        
    } finally {
        if (filterButton) {
            filterButton.disabled = false;
            filterButton.innerHTML = '<i class="fas fa-filter"></i> Terapkan Filter';
        }
    }
}

async function loadUserStatsReport() {
    const reportContent = document.getElementById('reportContent');
    
    try {
        if (!reportContent) {
            throw new Error('Element reportContent tidak ditemukan');
        }
        
        reportContent.innerHTML = `
            <div class="loading-container">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <h4 class="mt-3">Memuat Statistik Pengguna...</h4>
                <p class="text-muted">Sedang mengambil data dari server</p>
            </div>
        `;
        
        const response = await fetchReport(API.reportsUserStats, 'GET');
        
        if (!response) {
            throw new Error('Tidak ada data yang diterima');
        }
        
        const statsData = response.data || response;
        renderUserStatsReport(statsData);
        
    } catch (error) {
        console.error('Error loading user stats:', error);
        
        if (reportContent) {
            reportContent.innerHTML = `
                <div class="alert alert-danger">
                    <h5><i class="fas fa-exclamation-triangle"></i> Gagal Memuat Statistik</h5>
                    <p>${error.message}</p>
                    <button class="btn btn-sm btn-outline-danger mt-2" onclick="window.loadUserStatsReport()">
                        <i class="fas fa-redo"></i> Coba Lagi
                    </button>
                </div>
            `;
        }
    }
}

async function generateMonthlyReport() {
    const reportContent = document.getElementById('reportContent');
    
    try {
        console.log('🚀 generateMonthlyReport dipanggil');
        
        if (!reportContent) {
            console.error('❌ reportContent element not found');
            return;
        }
        
        // Cek token sebelum melanjutkan
        const token = localStorage.getItem('access');
        if (!token) {
            throw new Error('Silakan login terlebih dahulu');
        }
        
        // Show loading
        reportContent.innerHTML = `
            <div class="loading-container">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <h4 class="mt-3">Memuat laporan bulanan...</h4>
                <p class="text-muted">Sedang menghitung data statistik</p>
            </div>
        `;
        
        // Get selected month and year
        const monthSelect = document.getElementById('monthSelect');
        const yearSelect = document.getElementById('yearSelect');
        
        console.log('📅 Selected month:', monthSelect?.value);
        console.log('📅 Selected year:', yearSelect?.value);
        
        if (!monthSelect || !yearSelect) {
            throw new Error('Form filter tidak ditemukan');
        }
        
        const month = parseInt(monthSelect.value);
        const year = parseInt(yearSelect.value);
        
        console.log(`📅 Parsed values: Month=${month}, Year=${year}`);
        
        if (!month || !year) {
            throw new Error('Bulan dan tahun harus dipilih');
        }
        
        // Validate month range
        if (month < 1 || month > 12) {
            throw new Error('Bulan harus antara 1-12');
        }
        
        // Fetch data from API
        console.log(`📤 Fetching monthly report for ${month}/${year}...`);
        
        const response = await fetchReport(API.reportsMonthly, 'POST', { 
            month, 
            year 
        });
        
        console.log('✅ Response received:', response);
        
        // Extract data
        const reportData = response.data || response;
        
        // Render the report
        renderMonthlyReport(reportData, { month, year });
        
        console.log('✅ Laporan berhasil ditampilkan');
        
    } catch (error) {
        console.error('❌ Error in generateMonthlyReport:', error);
        
        if (reportContent) {
            let errorMessage = error.message;
            
            // Handle specific error messages
            if (error.message.includes('401') || error.message.includes('Sesi telah berakhir')) {
                errorMessage = 'Sesi telah berakhir. Silakan login kembali.';
                clearAuthTokens();
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            }
            
            reportContent.innerHTML = `
                <div class="alert alert-danger">
                    <h5><i class="fas fa-exclamation-triangle"></i> Gagal Memuat Laporan Bulanan</h5>
                    <p>${errorMessage}</p>
                    <div class="mt-3">
                        <button class="btn btn-sm btn-outline-danger me-2" onclick="generateMonthlyReport()">
                            <i class="fas fa-redo"></i> Coba Lagi
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="loadReport('monthly')">
                            <i class="fas fa-arrow-left"></i> Kembali ke Filter
                        </button>
                    </div>
                </div>
            `;
        }
    }
}

async function exportReport(reportType, format, filters = {}) {
    try {
        showToast(`Memulai export ${reportType} sebagai ${format.toUpperCase()}...`, 'info');
        showToast(`Fitur export ${format} untuk ${reportType} belum diimplementasi di backend`, 'warning');
        
    } catch (error) {
        console.error('Export error:', error);
        showToast(`Gagal mengekspor laporan: ${error.message}`, 'error');
    }
}

// Tambahkan fungsi ini di reports.js, sebelum fungsi loadUserStatsReport

function renderUserStatsReport(data) {
    const reportContent = document.getElementById('reportContent');
    
    if (!reportContent) return;
    
    // Format data
    const totalUsers = data.total_users || 0;
    const activeUsers = data.active_users || 0;
    const adminCount = data.admin_count || 0;
    const anggotaCount = data.anggota_count || 0;
    const tamuCount = data.tamu_count || 0;
    const timCount = data.tim_angkut_count || 0;
    const newUsers = data.new_users_month || 0;
    
    // Calculate percentages
    const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
    const adminPercentage = totalUsers > 0 ? Math.round((adminCount / totalUsers) * 100) : 0;
    const anggotaPercentage = totalUsers > 0 ? Math.round((anggotaCount / totalUsers) * 100) : 0;
    
    reportContent.innerHTML = `
        <div class="user-stats-report">
            <div class="report-header mb-4">
                <h4><i class="fas fa-users"></i> Statistik Pengguna</h4>
                <p class="text-muted">Data terakhir diperbarui: ${new Date().toLocaleString('id-ID')}</p>
            </div>
            
            <div class="row g-3 mb-4">
                <div class="col-md-3 col-6">
                    <div class="card border-primary">
                        <div class="card-body text-center">
                            <h2 class="text-primary">${totalUsers}</h2>
                            <p class="text-muted mb-0">Total Pengguna</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="card border-success">
                        <div class="card-body text-center">
                            <h2 class="text-success">${activeUsers}</h2>
                            <p class="text-muted mb-0">Aktif (${activePercentage}%)</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="card border-danger">
                        <div class="card-body text-center">
                            <h2 class="text-danger">${adminCount}</h2>
                            <p class="text-muted mb-0">Admin (${adminPercentage}%)</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="card border-warning">
                        <div class="card-body text-center">
                            <h2 class="text-warning">${newUsers}</h2>
                            <p class="text-muted mb-0">Baru Bulan Ini</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Detail Peran Pengguna</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Peran</th>
                                    <th>Jumlah</th>
                                    <th>Persentase</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><span class="badge bg-danger">Admin</span></td>
                                    <td>${adminCount}</td>
                                    <td>${adminPercentage}%</td>
                                </tr>
                                <tr>
                                    <td><span class="badge bg-success">Anggota</span></td>
                                    <td>${anggotaCount}</td>
                                    <td>${anggotaPercentage}%</td>
                                </tr>
                                <tr>
                                    <td><span class="badge bg-warning">Tamu</span></td>
                                    <td>${tamuCount}</td>
                                    <td>${totalUsers > 0 ? Math.round((tamuCount / totalUsers) * 100) : 0}%</td>
                                </tr>
                                <tr>
                                    <td><span class="badge bg-info">Tim Pengangkut</span></td>
                                    <td>${timCount}</td>
                                    <td>${totalUsers > 0 ? Math.round((timCount / totalUsers) * 100) : 0}%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="mt-3">
                <button class="btn btn-outline-primary" onclick="window.loadUserStatsReport()">
                    <i class="fas fa-sync-alt"></i> Refresh Data
                </button>
            </div>
        </div>
    `;
}

// Juga tambahkan fungsi render lainnya yang mungkin belum ada

function renderKeuanganReport(data, filters) {
    const reportContent = document.getElementById('reportContent');
    
    const html = `
        <div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
                <div class="stat-card">
                    <div class="stat-value" style="color: #27ae60;">${formatRupiah(data.total_pendapatan || 0)}</div>
                    <div class="stat-label">Total Pendapatan</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: #f39c12;">${formatRupiah(data.total_pending || 0)}</div>
                    <div class="stat-label">Pending</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: #3498db;">${data.total_lunas || 0}</div>
                    <div class="stat-label">Transaksi Lunas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: #e74c3c;">${data.total_gagal || 0}</div>
                    <div class="stat-label">Transaksi Gagal</div>
                </div>
            </div>
            
            ${data.metode_bayar_stats ? `
                <div style="margin-top: 30px;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">Statistik Metode Pembayaran</h4>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #3498db; color: white;">
                                    <th style="padding: 10px; text-align: left;">Metode</th>
                                    <th style="padding: 10px; text-align: right;">Jumlah</th>
                                    <th style="padding: 10px; text-align: right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.entries(data.metode_bayar_stats).map(([metode, stats]) => `
                                    <tr style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 10px;">${metode}</td>
                                        <td style="padding: 10px; text-align: right;">${stats.count || 0}</td>
                                        <td style="padding: 10px; text-align: right;">${formatRupiah(stats.total || 0)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}
            
            ${createExportButtons('keuangan', filters)}
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; color: #7f8c8d; font-size: 14px;">
                <strong>Periode:</strong> ${data.period || '-'} | 
                <strong>Dibuat:</strong> ${formatDate(data.tanggal_generate || new Date())}
            </div>
        </div>
    `;
    
    reportContent.innerHTML = html;
}

function renderAnggotaReport(data, filters) {
    const reportContent = document.getElementById('reportContent');
    const total = data.total_anggota || 0;
    const aktif = data.aktif || 0;
    const nonAktif = data.non_aktif || 0;
    
    const html = `
        <div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
                <div class="stat-card">
                    <div class="stat-value" style="color: #3498db;">${total}</div>
                    <div class="stat-label">Total Anggota</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: #27ae60;">${aktif}</div>
                    <div class="stat-label">Aktif (${total > 0 ? ((aktif/total)*100).toFixed(1) : 0}%)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: #e74c3c;">${nonAktif}</div>
                    <div class="stat-label">Non-Aktif (${total > 0 ? ((nonAktif/total)*100).toFixed(1) : 0}%)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: #f39c12;">${data.akan_expired || 0}</div>
                    <div class="stat-label">Akan Expired</div>
                </div>
            </div>
            
            ${data.jenis_sampah_stats ? `
                <div style="margin-top: 30px;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">Distribusi Jenis Sampah</h4>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #2ecc71; color: white;">
                                    <th style="padding: 10px; text-align: left;">Jenis Sampah</th>
                                    <th style="padding: 10px; text-align: right;">Jumlah</th>
                                    <th style="padding: 10px; text-align: right;">Persentase</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.entries(data.jenis_sampah_stats).map(([jenis, count]) => `
                                    <tr style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 10px;">${jenis}</td>
                                        <td style="padding: 10px; text-align: right;">${count}</td>
                                        <td style="padding: 10px; text-align: right;">${total > 0 ? ((count/total)*100).toFixed(1) : 0}%</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}
            
            ${createExportButtons('anggota', filters)}
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; color: #7f8c8d; font-size: 14px;">
                <strong>Periode:</strong> ${data.period || '-'} | 
                <strong>Dibuat:</strong> ${formatDate(data.tanggal_generate || new Date())}
            </div>
        </div>
    `;
    
    reportContent.innerHTML = html;
}

function renderLaporanSampahReport(data, filters) {
    const reportContent = document.getElementById('reportContent');
    const total = data.total_laporan || 0;
    const pending = data.pending || 0;
    const proses = data.proses || 0;
    const selesai = data.selesai || 0;
    
    const html = `
        <div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
                <div class="stat-card">
                    <div class="stat-value" style="color: #3498db;">${total}</div>
                    <div class="stat-label">Total Laporan</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: #f39c12;">${pending}</div>
                    <div class="stat-label">Pending (${total > 0 ? ((pending/total)*100).toFixed(1) : 0}%)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: #3498db;">${proses}</div>
                    <div class="stat-label">Proses (${total > 0 ? ((proses/total)*100).toFixed(1) : 0}%)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: #27ae60;">${selesai}</div>
                    <div class="stat-label">Selesai (${total > 0 ? ((selesai/total)*100).toFixed(1) : 0}%)</div>
                </div>
            </div>
            
            ${data.top_pelapor && data.top_pelapor.length > 0 ? `
                <div style="margin-top: 30px;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">Top Pelapor</h4>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #e74c3c; color: white;">
                                    <th style="padding: 10px; text-align: left;">No</th>
                                    <th style="padding: 10px; text-align: left;">Username</th>
                                    <th style="padding: 10px; text-align: right;">Jumlah Laporan</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.top_pelapor.map((pelapor, index) => `
                                    <tr style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 10px;">${index + 1}</td>
                                        <td style="padding: 10px;">${pelapor.username || '-'}</td>
                                        <td style="padding: 10px; text-align: right;">${pelapor.jumlah_laporan || 0}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}
            
            ${createExportButtons('laporan-sampah', filters)}
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; color: #7f8c8d; font-size: 14px;">
                <strong>Periode:</strong> ${data.period || '-'} | 
                <strong>Dibuat:</strong> ${formatDate(data.tanggal_generate || new Date())}
            </div>
        </div>
    `;
    
    reportContent.innerHTML = html;
}

function renderJadwalReport(data, filters) {
    const reportContent = document.getElementById('reportContent');
    
    const html = `
        <div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
                <div class="stat-card">
                    <div class="stat-value" style="color: #3498db;">${data.total_jadwal || 0}</div>
                    <div class="stat-label">Total Jadwal</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: #9b59b6;">${data.total_tim || 0}</div>
                    <div class="stat-label">Tim Pengangkut</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: #27ae60;">${data.total_anggota_terjadwal || 0}</div>
                    <div class="stat-label">Anggota Terjadwal</div>
                </div>
            </div>
            
            ${data.status_stats ? `
                <div style="margin-top: 30px;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">Status Pengangkutan</h4>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #9b59b6; color: white;">
                                    <th style="padding: 10px; text-align: left;">Status</th>
                                    <th style="padding: 10px; text-align: right;">Jumlah</th>
                                    <th style="padding: 10px; text-align: right;">Persentase</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.entries(data.status_stats).map(([status, count]) => `
                                    <tr style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 10px;">
                                            <span style="padding: 4px 8px; background: ${getStatusColor(status)}; color: white; border-radius: 3px;">
                                                ${status}
                                            </span>
                                        </td>
                                        <td style="padding: 10px; text-align: right;">${count}</td>
                                        <td style="padding: 10px; text-align: right;">
                                            ${data.total_anggota_terjadwal > 0 ? ((count/data.total_anggota_terjadwal)*100).toFixed(1) : 0}%
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}
            
            ${createExportButtons('jadwal', filters)}
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; color: #7f8c8d; font-size: 14px;">
                <strong>Periode:</strong> ${data.period || '-'} | 
                <strong>Dibuat:</strong> ${formatDate(data.tanggal_generate || new Date())}
            </div>
        </div>
    `;
    
    reportContent.innerHTML = html;
}

function renderMonthlyReport(data, filters) {
    const reportContent = document.getElementById('reportContent');
    
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const monthName = data.bulan || (filters.month ? monthNames[filters.month - 1] + ' ' + filters.year : 'Laporan Bulanan');
    
    const html = `
        <div>
            <h3 style="color: #2c3e50; margin-bottom: 20px;">${monthName}</h3>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
                <div class="stat-card">
                    <div class="stat-value" style="color: #27ae60;">${formatRupiah(data.total_pendapatan || 0)}</div>
                    <div class="stat-label">Pendapatan</div>
                    <div style="font-size: 14px; color: #7f8c8d;">${data.total_transaksi || 0} transaksi</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: #3498db;">${data.total_anggota || 0}</div>
                    <div class="stat-label">Anggota</div>
                    <div style="font-size: 14px; color: #7f8c8d;">
                        ${data.anggota_baru || 0} baru, ${data.anggota_expired || 0} expired
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: #9b59b6;">${data.total_jadwal || 0}</div>
                    <div class="stat-label">Jadwal</div>
                    <div style="font-size: 14px; color: #7f8c8d;">
                        ${data.anggota_dilayani || 0} anggota, ${data.success_rate || 0}% success
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: #e74c3c;">${data.total_laporan || 0}</div>
                    <div class="stat-label">Laporan Sampah</div>
                    <div style="font-size: 14px; color: #7f8c8d;">${data.resolution_rate || 0}% resolved</div>
                </div>
            </div>
            
            ${data.summary ? `
                <div style="margin-top: 30px;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">Summary & Metrics</h4>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tbody>
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 10px; font-weight: bold;">Pendapatan per Anggota</td>
                                    <td style="padding: 10px; text-align: right;">${formatRupiah(data.summary.pendapatan_per_anggota || 0)}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 10px; font-weight: bold;">Laporan per User</td>
                                    <td style="padding: 10px; text-align: right;">${(data.summary.laporan_per_user || 0).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; font-weight: bold;">Efficiency Rate</td>
                                    <td style="padding: 10px; text-align: right;">
                                        <div style="background: #ecf0f1; height: 20px; border-radius: 10px; overflow: hidden;">
                                            <div style="background: #27ae60; height: 100%; width: ${data.summary.efficiency_rate || 0}%;"></div>
                                        </div>
                                        <div style="text-align: center; margin-top: 5px;">${data.summary.efficiency_rate || 0}%</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}
            
            ${createExportButtons('monthly', filters)}
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; color: #7f8c8d; font-size: 14px;">
                <strong>Dibuat:</strong> ${formatDate(data.tanggal_generate || new Date())}
            </div>
        </div>
    `;
    
    reportContent.innerHTML = html;
}

// Jangan lupa tambahkan fungsi helper untuk warna status
function getStatusColor(status) {
    const colors = {
        'selesai': '#27ae60',
        'proses': '#3498db',
        'pending': '#f39c12',
        'dibatalkan': '#e74c3c',
        'jadwal_ulang': '#9b59b6'
    };
    return colors[status] || '#7f8c8d';
}

// Update bagian export di window object di akhir file
window.loadReport = loadReport;
window.loadUserStatsReport = loadUserStatsReport;
window.applyFilter = applyFilter;
window.generateMonthlyReport = generateMonthlyReport;
window.exportReport = exportReport;
window.renderUserStatsReport = renderUserStatsReport;
window.renderKeuanganReport = renderKeuanganReport;
window.renderAnggotaReport = renderAnggotaReport;
window.renderLaporanSampahReport = renderLaporanSampahReport;
window.renderJadwalReport = renderJadwalReport;
window.renderMonthlyReport = renderMonthlyReport;
window.formatRupiah = formatRupiah;
window.formatDate = formatDate;
window.getStatusColor = getStatusColor;