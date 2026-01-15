// pages/admin/reports.js
// import { authGuard } from '../../utils/authGuard.js';
import { showToast } from '../../utils/toast.js';
import { API, getAuthHeaders } from '../../api.js';

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
                    <div class="report-card" data-report-type="dampak-lingkungan">
                        <div class="report-icon" style="background: linear-gradient(135deg, #27ae60, #2ecc71);">
                            <i class="fas fa-leaf"></i>
                        </div>
                        <div class="report-content">
                            <h5>Dampak Lingkungan</h5>
                            <p>Analisis dampak lingkungan dari laporan sampah</p>
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
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h4 id="reportTitle" class="mb-0">Pilih Laporan</h4>
                        <div id="exportButtonsContainer" style="display: none;">
                            <div class="btn-group">
                                <button type="button" class="btn btn-sm btn-outline-danger" id="exportPdfBtn">
                                    <i class="fas fa-file-pdf"></i> PDF
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-success" id="exportExcelBtn">
                                    <i class="fas fa-file-excel"></i> Excel
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-primary" id="exportJsonBtn">
                                    <i class="fas fa-file-code"></i> JSON
                                </button>
                            </div>
                        </div>
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

function setupExportButtonListeners() {
    document.addEventListener('click', (event) => {
        // Handle export buttons di header (exportPdfBtn, exportExcelBtn, exportJsonBtn)
        if (event.target.id === 'exportPdfBtn' || event.target.closest('#exportPdfBtn')) {
            event.preventDefault();
            event.stopPropagation();
            handleExport('pdf');
        } else if (event.target.id === 'exportExcelBtn' || event.target.closest('#exportExcelBtn')) {
            event.preventDefault();
            event.stopPropagation();
            handleExport('excel');
        } else if (event.target.id === 'exportJsonBtn' || event.target.closest('#exportJsonBtn')) {
            event.preventDefault();
            event.stopPropagation();
            handleExport('json');
        }
        
        // Handle export buttons di content (yang dibuat dinamis dengan class export-btn)
        const exportBtn = event.target.closest('.export-btn');
        if (exportBtn) {
            event.preventDefault();
            event.stopPropagation();
            const format = exportBtn.getAttribute('data-format') || 'pdf';
            
            // Dapatkan report type dari card aktif
            const activeCard = document.querySelector('.report-card.active');
            if (activeCard) {
                const reportType = activeCard.getAttribute('data-report-type');
                
                // Ambil filter berdasarkan tipe laporan
                let filters = {};
                
                if (reportType === 'monthly') {
                    const monthSelect = document.getElementById('monthSelect');
                    const yearSelect = document.getElementById('yearSelect');
                    if (monthSelect && yearSelect) {
                        filters = {
                            month: parseInt(monthSelect.value),
                            year: parseInt(yearSelect.value)
                        };
                    }
                } else if (reportType === 'user-stats') {
                    // User stats biasanya tidak butuh filter
                    filters = {};
                } else {
                    // Untuk laporan lain, ambil tanggal dari filter
                    const startDate = document.getElementById('startDate')?.value;
                    const endDate = document.getElementById('endDate')?.value;
                    
                    if (startDate && endDate) {
                        filters = {
                            start_date: startDate,
                            end_date: endDate
                        };
                    }
                }
                
                console.log(`Export ${reportType} as ${format} with filters:`, filters);
                handleExportWithFilters(reportType, format, filters);
            }
        }
    });
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
    
    // Setup export button listeners
    setupExportButtonListeners();
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
        
        .stat-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            border: 1px solid #e9ecef;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            transition: transform 0.2s;
        }
        
        .stat-card:hover {
            transform: translateY(-2px);
        }
        
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 14px;
            color: #6c757d;
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
            
            .stat-value {
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
        const headers = getAuthHeaders();
        
        // Pastikan content-type JSON untuk POST/PUT
        if (method !== 'GET' && data) {
            headers['Content-Type'] = 'application/json';
        }
        
        const options = {
            method: method,
            headers: headers,
            signal: signal
        };
        
        // Handle data untuk method non-GET
        if (data && method !== 'GET') {
            // Jika sudah string (misal FormData), langsung gunakan
            if (typeof data === 'string' || data instanceof FormData) {
                options.body = data;
                // Jika FormData, hapus Content-Type agar browser set otomatis
                if (data instanceof FormData) {
                    delete headers['Content-Type'];
                }
            } else {
                options.body = JSON.stringify(data);
            }
        }
        
        console.log(`📤 Fetch Report: ${method} ${url}`, {
            headers: headers,
            body: data ? (data instanceof FormData ? '[FormData]' : data) : undefined
        });
        
        const response = await fetch(url, options);
        
        console.log(`📥 Response: ${response.status} ${response.statusText}`);
        
        // Handle unauthorized
        if (response.status === 401) {
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
            localStorage.removeItem('user');
            showToast('Sesi telah berakhir. Silakan login kembali.', 'warning');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            throw new Error('Sesi telah berakhir');
        }
        
        // Handle server errors
        if (response.status >= 500) {
            const errorText = await response.text();
            console.error('Server Error Response:', errorText);
            throw new Error(`Server error ${response.status}. Silakan coba lagi nanti.`);
        }
        
        // Handle client errors (400-499)
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Client Error ${response.status}:`, errorText);
            
            let errorData;
            try {
                errorData = JSON.parse(errorText);
                console.error('Parsed Error:', errorData);
            } catch {
                errorData = { 
                    message: `HTTP ${response.status}: ${response.statusText}`,
                    details: errorText.substring(0, 200) + '...'
                };
            }
            
            // Format pesan error yang lebih baik
            let errorMessage = 'Terjadi kesalahan pada server';
            if (errorData.detail) {
                errorMessage = errorData.detail;
            } else if (errorData.message) {
                errorMessage = errorData.message;
            } else if (errorData.non_field_errors) {
                errorMessage = Array.isArray(errorData.non_field_errors) 
                    ? errorData.non_field_errors.join(', ') 
                    : errorData.non_field_errors;
            } else if (typeof errorData === 'object') {
                // Gabungkan semua field errors
                const fieldErrors = [];
                for (const [field, errors] of Object.entries(errorData)) {
                    if (Array.isArray(errors)) {
                        fieldErrors.push(`${field}: ${errors.join(', ')}`);
                    } else if (typeof errors === 'string') {
                        fieldErrors.push(`${field}: ${errors}`);
                    }
                }
                if (fieldErrors.length > 0) {
                    errorMessage = fieldErrors.join('; ');
                }
            }
            
            const error = new Error(errorMessage);
            error.response = errorData;
            error.status = response.status;
            throw error;
        }
        
        // Parse response
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
            const result = await response.json();
            console.log('✅ Parsed JSON Response:', result);
            
            // Handle error status dari API custom
            if (result.status === 'error') {
                throw new Error(result.message || 'Terjadi kesalahan');
            }
            
            return result;
        } else if (contentType.includes('text/')) {
            const text = await response.text();
            console.log('✅ Text Response:', text.substring(0, 200));
            
            // Coba parse sebagai JSON jika bisa
            try {
                const jsonData = JSON.parse(text);
                return jsonData;
            } catch {
                return { data: text };
            }
        } else {
            // Untuk binary data atau tipe lain
            return response;
        }
        
    } catch (error) {
        console.error('❌ Fetch report error:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        
        // Handle specific error types
        if (error.name === 'AbortError') {
            throw new Error('Request timeout. Silakan coba lagi.');
        }
        
        if (error.name === 'TypeError') {
            if (error.message.includes('fetch') || error.message.includes('network')) {
                throw new Error('Koneksi jaringan terputus. Periksa koneksi internet Anda.');
            }
        }
        
        // Jika error sudah memiliki pesan dari response, gunakan itu
        if (error.message && error.message !== 'Terjadi kesalahan pada server') {
            throw error;
        }
        
        // Default error message
        if (error.message.includes('500')) {
            throw new Error('Server sedang mengalami masalah. Silakan coba lagi dalam beberapa menit.');
        }
        
        throw new Error(error.message || 'Terjadi kesalahan yang tidak diketahui');
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
    // Bersihkan filter untuk display
    const displayFilters = {};
    if (filters.start_date && filters.end_date) {
        displayFilters.start_date = filters.start_date;
        displayFilters.end_date = filters.end_date;
    } else if (filters.month && filters.year) {
        displayFilters.month = filters.month;
        displayFilters.year = filters.year;
    }
    
    // Stringify filter dengan escape yang benar
    const filterString = JSON.stringify(displayFilters).replace(/"/g, '&quot;');
    
    return `
        <div class="mt-4 pt-3 border-top">
            <h6 class="mb-3"><i class="fas fa-download"></i> Export Laporan</h6>
            <p class="text-muted small mb-3">
                <i class="fas fa-info-circle"></i> Pilih format yang diinginkan
            </p>
            <div class="btn-group">
                <button type="button" class="btn btn-outline-danger export-btn" data-format="pdf"
                        onclick="window.handleExportButtonClick('${reportType}', 'pdf', '${filterString}')">
                    <i class="fas fa-file-pdf"></i> PDF
                </button>
                <button type="button" class="btn btn-outline-success export-btn" data-format="excel"
                        onclick="window.handleExportButtonClick('${reportType}', 'excel', '${filterString}')">
                    <i class="fas fa-file-excel"></i> Excel
                </button>
                <button type="button" class="btn btn-outline-primary export-btn" data-format="json"
                        onclick="window.handleExportButtonClick('${reportType}', 'json', '${filterString}')">
                    <i class="fas fa-file-code"></i> JSON
                </button>
            </div>
        </div>
    `;
}

// Fungsi untuk handle klik tombol export dari HTML
async function handleExportButtonClick(reportType, format, filterString) {
    try {
        console.log('Export button clicked:', { reportType, format, filterString });
        
        let filters = {};
        try {
            if (filterString && filterString !== '{}') {
                // Decode filter string
                const decodedFilterString = filterString.replace(/&quot;/g, '"');
                filters = JSON.parse(decodedFilterString);
            }
        } catch (parseError) {
            console.error('Error parsing filter string:', parseError);
        }
        
        await exportReport(reportType, format, filters);
    } catch (error) {
        console.error('Error in handleExportButtonClick:', error);
        showToast(`Gagal export: ${error.message}`, 'error');
    }
}

async function handleExportWithFilters(reportType, format, filters = {}) {
    try {
        console.log(`📊 Export ${reportType} as ${format}`, filters);
        await exportReport(reportType, format, filters);
    } catch (error) {
        console.error('Error in handleExportWithFilters:', error);
        showToast(`Gagal export: ${error.message}`, 'error');
    }
}

async function loadReport(reportType) {
    const filterSection = document.getElementById('filterSection');
    const reportContent = document.getElementById('reportContent');
    const reportTitle = document.getElementById('reportTitle');
    const exportButtonsContainer = document.getElementById('exportButtonsContainer');
    
    try {
        // Reset state
        if (exportButtonsContainer) {
            exportButtonsContainer.style.display = 'none';
        }
        
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
            'dampak-lingkungan': 'Analisis Dampak Lingkungan',
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
                filterSection.style.display = 'none';
            }
            await loadUserStatsReport();
            
        } else if (reportType === 'monthly') {
            if (filterContent) {
                filterContent.innerHTML = createMonthYearFilter();
            }
            await generateMonthlyReport();

        } else if (reportType === 'dampak-lingkungan') {
            if (filterContent) {
                filterContent.innerHTML = createDateFilterForm(reportType);
                
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                
                document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
                document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
            }
            
            await applyFilter(null, reportType);
            
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
        
        // Show export buttons
        if (exportButtonsContainer && reportType !== 'user-stats') {
            exportButtonsContainer.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error in loadReport:', error);
        
        if (reportContent) {
            reportContent.innerHTML = `
                <div class="alert alert-danger">
                    <h5><i class="fas fa-exclamation-triangle"></i> Error</h5>
                    <p>${error.message}</p>
                    <button class="btn btn-sm btn-outline-danger mt-2" onclick="window.loadReport('${reportType}')">
                        <i class="fas fa-redo"></i> Coba Lagi
                    </button>
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
        let apiEndpoint;
        
        // Gunakan endpoint dari API object yang sudah diimport
        switch(reportType) {
            case 'keuangan':
                apiEndpoint = API.reportsKeuangan;
                response = await fetchReport(apiEndpoint, 'POST', filters);
                renderKeuanganReport(response.data || response, filters);
                break;
                
            case 'anggota':
                apiEndpoint = API.reportsAnggota;
                response = await fetchReport(apiEndpoint, 'POST', filters);
                renderAnggotaReport(response.data || response, filters);
                break;
                
            case 'laporan-sampah':
                apiEndpoint = API.reportsLaporanSampah;
                response = await fetchReport(apiEndpoint, 'POST', filters);
                renderLaporanSampahReport(response.data || response, filters);
                break;
                
            case 'jadwal':
                apiEndpoint = API.reportsJadwal;
                response = await fetchReport(apiEndpoint, 'POST', filters);
                renderJadwalReport(response.data || response, filters);
                break;
            
            case 'dampak-lingkungan':
                apiEndpoint = API.reportsDampakLingkungan;
                response = await fetchReport(apiEndpoint, 'POST', filters);
                renderDampakLingkunganReport(response.data || response, filters);
                break;
            
            case 'user-stats':
                apiEndpoint = API.reportsUserStats;
                response = await fetchReport(apiEndpoint, 'GET');
                renderUserStatsReport(response.data || response, filters);
                break;
            
            case 'monthly':
                apiEndpoint = API.reportsMonthly;
                response = await fetchReport(apiEndpoint, 'POST', filters);
                renderMonthlyReport(response.data || response, filters);
                break;
                
            default:
                throw new Error(`Tipe report tidak dikenali: ${reportType}`);
        }
        
    } catch (error) {
        console.error('Error in applyFilter:', error);
        
        let errorMessage = error.message;
        if (error.response) {
            errorMessage = error.response.message || error.message;
            console.error('Error response details:', error.response);
        }
        
        if (reportContent) {
            reportContent.innerHTML = `
                <div class="alert alert-danger">
                    <h5><i class="fas fa-exclamation-circle"></i> Gagal Memuat Data Laporan</h5>
                    <p>${errorMessage}</p>
                    <p class="small text-muted mt-2">Endpoint: ${apiEndpoint || 'N/A'}</p>
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
        
        // Gunakan API.reportsUserStats dari import
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
    const exportButtonsContainer = document.getElementById('exportButtonsContainer');
    
    try {
        if (!reportContent) {
            console.error('❌ reportContent element not found');
            return;
        }
        
        // Show export buttons
        if (exportButtonsContainer) {
            exportButtonsContainer.style.display = 'block';
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
        
        if (!monthSelect || !yearSelect) {
            throw new Error('Form filter tidak ditemukan');
        }
        
        const month = parseInt(monthSelect.value);
        const year = parseInt(yearSelect.value);
        
        if (!month || !year) {
            throw new Error('Bulan dan tahun harus dipilih');
        }
        
        if (month < 1 || month > 12) {
            throw new Error('Bulan harus antara 1-12');
        }
        
        // Fetch data from API
        const apiEndpoint = API.reportsMonthly || '/api/reports/monthly/';
        const response = await fetchReport(apiEndpoint, 'POST', { 
            month, 
            year 
        });
        
        // Extract data
        const reportData = response.data || response;
        
        // Render the report
        renderMonthlyReport(reportData, { month, year });
        
    } catch (error) {
        console.error('❌ Error in generateMonthlyReport:', error);
        
        if (reportContent) {
            let errorMessage = error.message;
            
            if (error.message.includes('401') || error.message.includes('Sesi telah berakhir')) {
                errorMessage = 'Sesi telah berakhir. Silakan login kembali.';
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

async function exportReport(reportType, format = 'pdf', filters = {}) {
    // Tampilkan loading state untuk SEMUA tombol export
    const exportButtons = document.querySelectorAll('.export-btn, #exportPdfBtn, #exportExcelBtn, #exportJsonBtn');
    
    // Simpan state original semua tombol
    exportButtons.forEach(btn => {
        const originalHTML = btn.innerHTML;
        const originalDisabled = btn.disabled;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> Memproses...`;
        btn.disabled = true;
        
        // Simpan data untuk restore nanti
        btn.dataset.originalHTML = originalHTML;
        btn.dataset.originalDisabled = originalDisabled ? 'true' : 'false';
    });
    
    try {
        console.log(`🚀 Starting export for ${reportType} as ${format}`, filters);
        
        const headers = getAuthHeaders();
        headers['Content-Type'] = 'application/json';
        
        // Bersihkan filters
        const cleanFilters = {};
        const validKeys = ['start_date', 'end_date', 'month', 'year'];
        
        validKeys.forEach(key => {
            if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
                cleanFilters[key] = filters[key];
            }
        });
        
        // Default untuk report non-monthly
        if (reportType !== 'monthly' && reportType !== 'user-stats') {
            if (!cleanFilters.start_date || !cleanFilters.end_date) {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 30);
                
                cleanFilters.start_date = start.toISOString().split('T')[0];
                cleanFilters.end_date = end.toISOString().split('T')[0];
            }
        }
        
        console.log('📤 Sending export request:', {
            report_type: reportType,
            format: format,
            filters: cleanFilters
        });
        
        const exportData = {
            report_type: reportType,
            format: format,
            filters: cleanFilters
        };
        
        const response = await fetch(API.reportsExport, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(exportData)
        });
        
        console.log('📥 Received response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        });
        
        // Handle error responses
        if (!response.ok) {
            let errorText = '';
            try {
                errorText = await response.text();
                console.error('Error response text:', errorText);
                
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                
                // Try to parse as JSON
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.error) errorMessage = errorData.error;
                    else if (errorData.detail) errorMessage = errorData.detail;
                    else if (errorData.message) errorMessage = errorData.message;
                } catch {
                    // If not JSON, use first 200 chars
                    if (errorText.length > 200) {
                        errorMessage = errorText.substring(0, 200) + '...';
                    } else {
                        errorMessage = errorText || errorMessage;
                    }
                }
                
                throw new Error(errorMessage);
            } catch (textError) {
                console.error('Error reading error response:', textError);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }
        
        // Handle successful response
        const contentType = response.headers.get('content-type') || '';
        console.log('Content-Type:', contentType);
        
        // Get filename
        let filename = `laporan_${reportType}_${new Date().getTime()}`;
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="(.+)"/) || contentDisposition.match(/filename=([^;]+)/);
            if (match && match[1]) {
                filename = match[1].replace(/['"]/g, '');
            }
        }
        
        // Handle based on content type
        if (contentType.includes('application/pdf')) {
            const blob = await response.blob();
            if (!blob || blob.size === 0) {
                throw new Error('File PDF kosong atau corrupt');
            }
            downloadFile(blob, filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
            showToast('File PDF berhasil didownload!', 'success', 7000);
            
        } else if (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
            const blob = await response.blob();
            if (!blob || blob.size === 0) {
                throw new Error('File Excel kosong atau corrupt');
            }
            downloadFile(blob, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
            showToast('File Excel berhasil didownload!', 'success', 7000);
            
        } else if (contentType.includes('application/json')) {
            const text = await response.text();
            console.log('JSON response received:', text.substring(0, 200) + '...');
            
            try {
                const jsonData = JSON.parse(text);
                
                if (format === 'pdf' || format === 'excel') {
                    // User requested PDF/Excel but got JSON
                    showToast(`Backend mengembalikan data JSON, bukan file ${format.toUpperCase()}`, 'warning');
                    
                    if (jsonData.error) {
                        throw new Error(jsonData.error);
                    }
                    
                    // Fallback: download as JSON
                    const dataStr = JSON.stringify(jsonData, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    downloadFile(blob, `${filename}.json`);
                    showToast('Data tersedia dalam format JSON', 'info');
                } else {
                    // User requested JSON
                    const dataStr = JSON.stringify(jsonData, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    downloadFile(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
                    showToast('File JSON berhasil didownload!', 'success', 7000);
                }
            } catch (jsonError) {
                console.error('Error parsing JSON response:', jsonError);
                throw new Error('Gagal memproses response dari server');
            }
            
        } else {
            // Unknown content type, try blob
            const blob = await response.blob();
            if (blob && blob.size > 0) {
                let extension = format;
                if (format === 'pdf') extension = 'pdf';
                else if (format === 'excel') extension = 'xlsx';
                else if (format === 'json') extension = 'json';
                
                downloadFile(blob, `${filename}.${extension}`);
                showToast(`File ${format.toUpperCase()} berhasil didownload!`, 'success');
            } else {
                throw new Error('Response kosong dari server');
            }
        }
        
    } catch (error) {
        console.error('❌ Export error:', error);
        showToast(`Gagal export: ${error.message}`, 'error');
    } finally {
        // Restore semua tombol ke state semula
        exportButtons.forEach(btn => {
            if (btn.dataset.originalHTML) {
                btn.innerHTML = btn.dataset.originalHTML;
                const wasDisabled = btn.dataset.originalDisabled === 'true';
                btn.disabled = wasDisabled;
                // Hapus data temporary
                delete btn.dataset.originalHTML;
                delete btn.dataset.originalDisabled;
            }
        });
    }
}

async function handleExport(format = 'pdf') {
    try {
        const activeCard = document.querySelector('.report-card.active');
        if (!activeCard) {
            showToast('Silakan pilih laporan terlebih dahulu', 'warning');
            return;
        }
        
        const reportType = activeCard.getAttribute('data-report-type');
        
        // Tentukan filter berdasarkan tipe laporan
        let filters = {};
        
        if (reportType === 'monthly') {
            const monthSelect = document.getElementById('monthSelect');
            const yearSelect = document.getElementById('yearSelect');
            
            if (monthSelect && yearSelect) {
                filters = {
                    month: parseInt(monthSelect.value),
                    year: parseInt(yearSelect.value)
                };
            } else {
                // Default ke bulan dan tahun sekarang
                const now = new Date();
                filters = {
                    month: now.getMonth() + 1,
                    year: now.getFullYear()
                };
            }
        } else if (reportType === 'user-stats') {
            // User stats biasanya tidak butuh filter
            filters = {};
        } else if (reportType === 'dampak-lingkungan') {
            // Untuk laporan dampak lingkungan, ambil tanggal dari filter atau gunakan default
            let startDate = document.getElementById('startDate')?.value;
            let endDate = document.getElementById('endDate')?.value;
            
            if (!startDate || !endDate) {
                // Default: 30 hari terakhir
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 30);
                
                startDate = start.toISOString().split('T')[0];
                endDate = end.toISOString().split('T')[0];
            }
            
            // Validasi tanggal
            if (new Date(startDate) > new Date(endDate)) {
                throw new Error('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
            }
            
            filters = {
                start_date: startDate,
                end_date: endDate
            };
        } else {
            // Untuk laporan lain, ambil tanggal dari filter atau gunakan default
            let startDate = document.getElementById('startDate')?.value;
            let endDate = document.getElementById('endDate')?.value;
            
            if (!startDate || !endDate) {
                // Default: 30 hari terakhir
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 30);
                
                startDate = start.toISOString().split('T')[0];
                endDate = end.toISOString().split('T')[0];
            }
            
            // Validasi tanggal
            if (new Date(startDate) > new Date(endDate)) {
                throw new Error('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
            }
            
            filters = {
                start_date: startDate,
                end_date: endDate
            };
        }
        
        console.log(`📊 Export ${reportType} sebagai ${format} dengan filter:`, filters);
        
        await exportReport(reportType, format, filters);
        
    } catch (error) {
        console.error('Error in handleExport:', error);
        showToast(`Gagal memproses export: ${error.message}`, 'error');
    }
}

// Fungsi untuk handle JSON response (ketika backend tidak menghasilkan file PDF/Excel)
function handleJsonResponse(jsonData, reportType, requestedFormat) {
    console.log('📊 JSON Data received:', jsonData);
    
    // Cek jika ada error
    if (jsonData.status === 'error') {
        throw new Error(jsonData.message || 'Export gagal');
    }
    
    // Jika user minta PDF/Excel tapi dapat JSON, beri tahu
    if (requestedFormat === 'pdf' || requestedFormat === 'excel') {
        showToast(`⚠️ Backend mengembalikan data JSON, bukan file ${requestedFormat.toUpperCase()}`, 'warning');
        showToast('Fitur export PDF/Excel mungkin belum diimplementasi.', 'info');
    }
    
    // Download JSON sebagai fallback
    const dataStr = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const filename = `laporan_${reportType}_${new Date().getTime()}.json`;
    
    downloadFile(blob, filename);
    
    if (requestedFormat === 'json') {
        showToast(`File JSON berhasil didownload: ${filename}`, 'success', '7000');
    } else {
        showToast(`Data tersedia dalam format JSON: ${filename}`, 'info');
    }
}

function downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}


// Tambahkan fungsi untuk mengecek status backend export
async function checkExportCapabilities() {
    try {
        const headers = getAuthHeaders();
        headers['Content-Type'] = 'application/json';
        
        // Test request sederhana
        const testData = {
            report_type: 'user-stats',
            format: 'json'
        };
        
        const response = await fetch(API.reportsExport, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(testData)
        });
        
        const contentType = response.headers.get('content-type') || '';
        const data = await response.json().catch(() => null);
        
        console.log('🔧 Export capabilities check:', {
            status: response.status,
            contentType: contentType,
            supportsPdf: contentType.includes('pdf'),
            supportsExcel: contentType.includes('excel') || contentType.includes('spreadsheetml'),
            dataFormat: data ? typeof data : 'unknown'
        });
        
        return {
            supportsPdf: contentType.includes('pdf'),
            supportsExcel: contentType.includes('excel') || contentType.includes('spreadsheetml'),
            supportsJson: true,
            status: response.status
        };
        
    } catch (error) {
        console.error('Error checking export capabilities:', error);
        return {
            supportsPdf: false,
            supportsExcel: false,
            supportsJson: true,
            error: error.message
        };
    }
}

function renderUserStatsReport(data) {
    const reportContent = document.getElementById('reportContent');
    if (!reportContent) return;

    const info = data.info || {};
    const table = data.table || [];

    const totalUsers = info.total_users || 0;
    const activeUsers = info.active_users || 0;
    const adminCount = info.admin_count || 0;
    const anggotaCount = info.anggota_count || 0;
    const tamuCount = info.tamu_count || 0;
    const timCount = info.tim_angkut_count || 0;
    const newUsers = info.new_users_month || 0;

    const percent = (val) =>
        totalUsers ? Math.round((val / totalUsers) * 100) : 0;

    const activePercentage = percent(activeUsers);
    const adminPercentage = percent(adminCount);
    const anggotaPercentage = percent(anggotaCount);
    const tamuPercentage = percent(tamuCount);
    const timPercentage = percent(timCount);

    // ===== SORT TABLE (tanggal terbaru dulu) =====
    const sortedTable = [...table].sort(
        (a, b) => new Date(b.date_joined) - new Date(a.date_joined)
    );

    reportContent.innerHTML = `
        <div class="user-stats-report">
            <!-- HEADER -->
            <div class="mb-4">
                <h4><i class="fas fa-users"></i> Statistik Pengguna</h4>
                <p class="text-muted">
                    Terakhir diperbarui: ${new Date(info.tanggal_generate || Date.now()).toLocaleString('id-ID')}
                </p>
            </div>

            <!-- SUMMARY -->
            <div class="row g-3 mb-4">
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="stat-value text-primary">${totalUsers}</div>
                        <div class="stat-label">Total Pengguna</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="stat-value text-success">${activeUsers}</div>
                        <div class="stat-label">Aktif (${activePercentage}%)</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="stat-value text-danger">${adminCount}</div>
                        <div class="stat-label">Admin (${adminPercentage}%)</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="stat-value text-warning">${newUsers}</div>
                        <div class="stat-label">Baru Bulan Ini</div>
                    </div>
                </div>
            </div>

            <!-- DISTRIBUSI ROLE -->
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="mb-0">Distribusi Peran</h5>
                        </div>
                        <div class="card-body">
                            ${renderRoleRow('Admin', adminCount, adminPercentage, 'danger')}
                            ${renderRoleRow('Anggota', anggotaCount, anggotaPercentage, 'success')}
                            ${renderRoleRow('Tamu', tamuCount, tamuPercentage, 'warning')}
                            ${renderRoleRow('Tim Pengangkut', timCount, timPercentage, 'info')}
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="mb-0">Ringkasan</h5>
                        </div>
                        <div class="card-body">
                            <p><i class="fas fa-check-circle text-success me-2"></i>
                                <strong>${activePercentage}%</strong> pengguna aktif
                            </p>
                            <p><i class="fas fa-user-plus text-primary me-2"></i>
                                <strong>${newUsers}</strong> pengguna baru bulan ini
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TABLE DETAIL -->
            ${sortedTable.length ? `
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between">
                    <h5 class="mb-0">Detail Pengguna</h5>
                    <span class="badge bg-secondary">${sortedTable.length} user</span>
                </div>
                <div class="card-body table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>No</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Tanggal Daftar</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedTable.map((u, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td>${u.username || '-'}</td>
                                    <td>${u.email || '-'}</td>
                                    <td>
                                        <span class="badge bg-secondary">${u.role}</span>
                                    </td>
                                    <td>
                                        <span class="badge ${u.is_active ? 'bg-success' : 'bg-danger'}">
                                            ${u.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td>${formatDate(u.date_joined)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : `
            <div class="alert alert-info">Tidak ada data pengguna</div>
            `}

            ${createExportButtons('user-stats')}

            <button class="btn btn-outline-primary mt-3" onclick="window.loadUserStatsReport()">
                <i class="fas fa-sync-alt"></i> Refresh Data
            </button>
        </div>
    `;
}

/* helper kecil */
function renderRoleRow(label, count, percent, color) {
    return `
        <div class="d-flex justify-content-between mb-2">
            <span><span class="badge bg-${color}">${label}</span></span>
            <span>${count} (${percent}%)</span>
        </div>
    `;
}


function renderAnggotaReport(data, filters) {
    const reportContent = document.getElementById('reportContent');
    if (!reportContent) return;

    const info = data.info || {};
    const table = data.table || [];

    const total = info.total_anggota || 0;
    const aktif = info.aktif || 0;
    const nonAktif = info.non_aktif || 0;
    const akanExpired = info.akan_expired || 0;

    const aktifPercentage = total > 0 ? ((aktif / total) * 100).toFixed(1) : 0;
    const nonAktifPercentage = total > 0 ? ((nonAktif / total) * 100).toFixed(1) : 0;

    const html = `
        <div class="anggota-report">

            <!-- ===== SUMMARY ===== -->
            <div class="row g-3 mb-4">
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="stat-value text-primary">${total}</div>
                        <div class="stat-label">Total Anggota</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="stat-value text-success">${aktif}</div>
                        <div class="stat-label">Aktif (${aktifPercentage}%)</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="stat-value text-danger">${nonAktif}</div>
                        <div class="stat-label">Non-Aktif (${nonAktifPercentage}%)</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="stat-value text-warning">${akanExpired}</div>
                        <div class="stat-label">Akan Expired</div>
                    </div>
                </div>
            </div>

            <!-- ===== DISTRIBUSI JENIS SAMPAH ===== -->
            ${info.jenis_sampah_stats && Object.keys(info.jenis_sampah_stats).length ? `
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Distribusi Jenis Sampah</h5>
                    </div>
                    <div class="card-body table-responsive">
                        <table class="table table-hover table-bordered">
                            <thead class="table-success">
                                <tr>
                                    <th>Jenis Sampah</th>
                                    <th class="text-end">Jumlah</th>
                                    <th class="text-end">Persentase</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.entries(info.jenis_sampah_stats).map(([jenis, count]) => `
                                    <tr>
                                        <td>${jenis}</td>
                                        <td class="text-end">${count}</td>
                                        <td class="text-end">
                                            ${total > 0 ? ((count / total) * 100).toFixed(1) : 0}%
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}

            <!-- ===== TABLE DETAIL ANGGOTA ===== -->
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Detail Anggota</h5>
                    <span class="badge bg-secondary">${table.length} data</span>
                </div>
                <div class="card-body table-responsive">
                    <table class="table table-striped table-bordered align-middle">
                        <thead class="table-dark">
                            <tr>
                                <th>No</th>
                                <th>Nama Anggota</th>
                                <th>Status</th>
                                <th>Jenis Sampah</th>
                                <th>Tanggal Mulai</th>
                                <th>Tanggal Berakhir</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${table.length ? table.map((row, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${row.nama_anggota || '-'}</td>
                                    <td>
                                        <span class="badge ${
                                            row.status === 'aktif' ? 'bg-success' : 'bg-danger'
                                        }">
                                            ${row.status}
                                        </span>
                                    </td>
                                    <td>${row.jenis_sampah || '-'}</td>
                                    <td>${formatDate(row.tanggal_start)}</td>
                                    <td>${row.tanggal_end ? formatDate(row.tanggal_end) : '-'}</td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="6" class="text-center text-muted">
                                        Tidak ada data anggota
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- ===== EXPORT ===== -->
            ${createExportButtons('anggota', filters)}

            <!-- ===== FOOTER ===== -->
            <div class="mt-4 pt-3 border-top text-muted small">
                <strong>Periode:</strong>
                ${formatDate(filters.start_date)} - ${formatDate(filters.end_date)}
                &nbsp;|&nbsp;
                <strong>Dibuat:</strong>
                ${new Date(info.tanggal_generate || Date.now()).toLocaleString('id-ID')}
            </div>

        </div>
    `;

    reportContent.innerHTML = html;
}


function renderLaporanSampahReport(data, filters) {
    const reportContent = document.getElementById('reportContent');

    const info = data.info || {};
    const table = data.table || [];

    const total = info.total_laporan || 0;
    const pending = info.pending || 0;
    const proses = info.proses || 0;
    const selesai = info.selesai || 0;

    const pendingPercentage = total ? ((pending / total) * 100).toFixed(1) : 0;
    const prosesPercentage = total ? ((proses / total) * 100).toFixed(1) : 0;
    const selesaiPercentage = total ? ((selesai / total) * 100).toFixed(1) : 0;

    const html = `
    <div>
        <!-- SUMMARY -->
        <div class="row g-3 mb-4">
            <div class="col-md-3 col-6">
                <div class="stat-card">
                    <div class="stat-value text-primary">${total}</div>
                    <div class="stat-label">Total Laporan</div>
                </div>
            </div>
            <div class="col-md-3 col-6">
                <div class="stat-card">
                    <div class="stat-value text-warning">${pending}</div>
                    <div class="stat-label">Pending (${pendingPercentage}%)</div>
                </div>
            </div>
            <div class="col-md-3 col-6">
                <div class="stat-card">
                    <div class="stat-value text-info">${proses}</div>
                    <div class="stat-label">Proses (${prosesPercentage}%)</div>
                </div>
            </div>
            <div class="col-md-3 col-6">
                <div class="stat-card">
                    <div class="stat-value text-success">${selesai}</div>
                    <div class="stat-label">Selesai (${selesaiPercentage}%)</div>
                </div>
            </div>
        </div>

        <!-- TOP PELAPOR -->
        ${info.top_pelapor?.length ? `
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Top Pelapor</h5>
            </div>
            <div class="card-body table-responsive">
                <table class="table table-hover">
                    <thead class="table-danger">
                        <tr>
                            <th>No</th>
                            <th>Username</th>
                            <th class="text-end">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${info.top_pelapor.map((p, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${p.username || '-'}</td>
                                <td class="text-end">${p.jumlah_laporan || 0}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>` : ''}

        <!-- TABEL DETAIL LAPORAN -->
        ${table.length ? `
        <div class="card mb-4">
            <div class="card-header d-flex justify-content-between">
                <h5 class="mb-0">Detail Laporan Sampah</h5>
                <span class="badge bg-secondary">${table.length} data</span>
            </div>
            <div class="card-body table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>No</th>
                            <th>Tanggal</th>
                            <th>Pelapor</th>
                            <th>Lokasi</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${table.map((row, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${formatDate(row.tanggal_lapor)}</td>
                                <td>${row.nama_pelapor}</td>
                                <td>${row.alamat}</td>
                                <td>
                                    <span class="badge ${
                                        row.status === 'selesai' ? 'bg-success' :
                                        row.status === 'proses' ? 'bg-info' :
                                        'bg-warning'
                                    }">
                                        ${row.status}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>` : `
        <div class="alert alert-info">Tidak ada data laporan</div>`}

        ${createExportButtons('laporan-sampah', filters)}

        <div class="mt-4 pt-3 border-top text-muted small">
            <strong>Periode:</strong> ${formatDate(filters.start_date)} - ${formatDate(filters.end_date)} |
            <strong>Dibuat:</strong> ${new Date().toLocaleString('id-ID')}
        </div>
    </div>
    `;

    reportContent.innerHTML = html;
}


function renderJadwalReport(data, filters) {
    const reportContent = document.getElementById('reportContent');

    const info = data.info || {};
    const table = data.table || [];

    const totalJadwal = info.total_jadwal || 0;
    const totalTim = info.total_tim || 0;
    const totalAnggota = info.total_anggota_terjadwal || 0;

    const html = `
        <div>
            <!-- SUMMARY GLOBAL -->
            <div class="row g-3 mb-4">
                <div class="col-md-4 col-6">
                    <div class="stat-card">
                        <div class="stat-value text-primary">${totalJadwal}</div>
                        <div class="stat-label">Total Jadwal</div>
                    </div>
                </div>
                <div class="col-md-4 col-6">
                    <div class="stat-card">
                        <div class="stat-value" style="color:#9b59b6;">${totalTim}</div>
                        <div class="stat-label">Tim Pengangkut</div>
                    </div>
                </div>
                <div class="col-md-4 col-6">
                    <div class="stat-card">
                        <div class="stat-value text-success">${totalAnggota}</div>
                        <div class="stat-label">Anggota Terjadwal</div>
                    </div>
                </div>
            </div>

            <!-- STATUS GLOBAL -->
            ${info.status_stats ? `
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Status Pengangkutan (Global)</h5>
                    </div>
                    <div class="card-body table-responsive">
                        <table class="table table-hover">
                            <thead class="table-info">
                                <tr>
                                    <th>Status</th>
                                    <th class="text-end">Jumlah</th>
                                    <th class="text-end">Persentase</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.entries(info.status_stats).map(([status, count]) => `
                                    <tr>
                                        <td>
                                            <span class="badge" style="background:${getStatusColor(status)}">
                                                ${status}
                                            </span>
                                        </td>
                                        <td class="text-end">${count}</td>
                                        <td class="text-end">
                                            ${totalAnggota ? ((count / totalAnggota) * 100).toFixed(1) : 0}%
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}

            <!-- DETAIL PER TIM -->
            ${table.length ? `
                <div class="accordion" id="accordionTim">
                    ${table.map((tim, idx) => `
                        <div class="accordion-item mb-3">
                            <h2 class="accordion-header">
                                <button class="accordion-button ${idx ? 'collapsed' : ''}" 
                                        type="button"
                                        data-bs-toggle="collapse"
                                        data-bs-target="#tim-${idx}">
                                    <strong>${tim.nama_tim}</strong>
                                    <span class="ms-3 badge bg-primary">
                                        ${tim.total_anggota} anggota
                                    </span>
                                    <span class="ms-2 badge bg-secondary">
                                        ${tim.total_jadwal} jadwal
                                    </span>
                                </button>
                            </h2>

                            <div id="tim-${idx}" class="accordion-collapse collapse ${idx === 0 ? 'show' : ''}">
                                <div class="accordion-body">

                                    <!-- STATUS PER TIM -->
                                    <div class="mb-3">
                                        ${Object.entries(tim.status_stats).map(([status, count]) => `
                                            <span class="badge me-2" style="background:${getStatusColor(status)}">
                                                ${status}: ${count}
                                            </span>
                                        `).join('')}
                                    </div>

                                    <!-- TABEL ANGGOTA -->
                                    <div class="table-responsive">
                                        <table class="table table-sm table-striped table-hover">
                                            <thead class="table-dark">
                                                <tr>
                                                    <th>No</th>
                                                    <th>Tanggal</th>
                                                    <th>Nama Anggota</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${tim.detail.map((row, i) => `
                                                    <tr>
                                                        <td>${i + 1}</td>
                                                        <td>${formatDate(row.tanggal_jadwal)}</td>
                                                        <td>${row.nama_anggota}</td>
                                                        <td>
                                                            <span class="badge" style="background:${getStatusColor(row.status_pengangkutan)}">
                                                                ${row.status_pengangkutan}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>

                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="alert alert-info">Tidak ada data jadwal</div>
            `}

            ${createExportButtons('jadwal', filters)}

            <div class="mt-4 pt-3 border-top text-muted small">
                <strong>Periode:</strong> ${formatDate(filters.start_date)} - ${formatDate(filters.end_date)} |
                <strong>Dibuat:</strong> ${new Date().toLocaleString('id-ID')}
            </div>
        </div>
    `;

    reportContent.innerHTML = html;
}

function renderKeuanganReport(data, filters) {
    const reportContent = document.getElementById('reportContent');

    const info = data.info || {};
    const table = data.table || [];

    const totalPendapatan = info.total_pendapatan || 0;
    const totalPending = info.total_pending || 0;
    const totalLunas = info.total_lunas || 0;
    const totalGagal = info.total_gagal || 0;

    const html = `
        <div>
            <!-- SUMMARY -->
            <div class="row g-3 mb-4">
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="stat-value text-success">${formatRupiah(totalPendapatan)}</div>
                        <div class="stat-label">Total Pendapatan</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="stat-value text-warning">${totalPending}</div>
                        <div class="stat-label">Transaksi Pending</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="stat-value text-primary">${totalLunas}</div>
                        <div class="stat-label">Transaksi Lunas</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="stat-value text-danger">${totalGagal}</div>
                        <div class="stat-label">Transaksi Gagal</div>
                    </div>
                </div>
            </div>

            <!-- METODE PEMBAYARAN -->
            ${info.metode_bayar_stats ? `
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Statistik Metode Pembayaran</h5>
                    </div>
                    <div class="card-body table-responsive">
                        <table class="table table-hover">
                            <thead class="table-primary">
                                <tr>
                                    <th>Metode</th>
                                    <th class="text-end">Jumlah</th>
                                    <th class="text-end">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.entries(info.metode_bayar_stats).map(([metode, stats]) => `
                                    <tr>
                                        <td>${metode}</td>
                                        <td class="text-end">${stats.count || 0}</td>
                                        <td class="text-end">${formatRupiah(stats.total || 0)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}

            ${table.length ? `
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Detail Transaksi</h5>
                    <span class="badge bg-secondary">${table.length} data</span>
                </div>
                <div class="card-body table-responsive">
                    <table class="table table-hover table-striped">
                        <thead class="table-dark">
                            <tr>
                                <th>No</th>
                                <th>Tanggal</th>
                                <th>Nama Anggota</th>
                                <th>Metode</th>
                                <th>Status</th>
                                <th class="text-end">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${table.map((row, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td>${formatDate(row.tanggal_bayar)}</td>
                                    <td>${row.nama_anggota}</td>
                                    <td>${row.metode_bayar}</td>
                                    <td>
                                        <span class="badge ${
                                            row.status_bayar === 'lunas' ? 'bg-success' :
                                            row.status_bayar === 'pending' ? 'bg-warning' :
                                            'bg-danger'
                                        }">
                                            ${row.status_bayar}
                                        </span>
                                    </td>
                                    <td class="text-end">${formatRupiah(row.jumlah_bayar)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : `
            <div class="alert alert-info">Tidak ada data transaksi</div>
            `}


            ${createExportButtons('keuangan', filters)}

            <div class="mt-4 pt-3 border-top text-muted small">
                <strong>Periode:</strong> ${formatDate(filters.start_date)} - ${formatDate(filters.end_date)} |
                <strong>Dibuat:</strong> ${new Date().toLocaleString('id-ID')}
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
            <h4 class="mb-4" style="color: #2c3e50;">${monthName}</h4>
            
            <div class="row g-3 mb-4">
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="stat-value text-success">${formatRupiah(data.total_pendapatan || 0)}</div>
                        <div class="stat-label">Pendapatan</div>
                        <div class="text-muted small">${data.total_transaksi || 0} transaksi</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="stat-value text-primary">${data.total_anggota || 0}</div>
                        <div class="stat-label">Anggota</div>
                        <div class="text-muted small">
                            ${data.anggota_baru || 0} baru, ${data.anggota_expired || 0} expired
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="stat-value" style="color: #9b59b6;">${data.total_jadwal || 0}</div>
                        <div class="stat-label">Jadwal</div>
                        <div class="text-muted small">
                            ${data.anggota_dilayani || 0} anggota, ${data.success_rate || 0}% success
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="stat-value text-danger">${data.total_laporan || 0}</div>
                        <div class="stat-label">Laporan Sampah</div>
                        <div class="text-muted small">${data.resolution_rate || 0}% resolved</div>
                    </div>
                </div>
            </div>
            
            ${data.summary ? `
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Ringkasan & Metrics</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table">
                                <tbody>
                                    <tr>
                                        <td class="fw-bold">Pendapatan per Anggota</td>
                                        <td class="text-end">${formatRupiah(data.summary.pendapatan_per_anggota || 0)}</td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">Laporan per User</td>
                                        <td class="text-end">${(data.summary.laporan_per_user || 0).toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">Efficiency Rate</td>
                                        <td class="text-end">
                                            <div class="d-flex align-items-center">
                                                <div class="progress flex-grow-1 me-2" style="height: 20px;">
                                                    <div class="progress-bar bg-success" role="progressbar" 
                                                         style="width: ${data.summary.efficiency_rate || 0}%">
                                                    </div>
                                                </div>
                                                <span>${data.summary.efficiency_rate || 0}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            ${createExportButtons('monthly', filters)}
            
            <div class="mt-4 pt-3 border-top text-muted small">
                <strong>Bulan:</strong> ${monthName} | 
                <strong>Dibuat:</strong> ${new Date().toLocaleString('id-ID')}
            </div>
        </div>
    `;
    
    reportContent.innerHTML = html;
}

function renderDampakLingkunganReport(data, filters) {
    const reportContent = document.getElementById('reportContent');
    
    if (!reportContent) {
        console.error('Element #reportContent tidak ditemukan');
        return;
    }
    
    // ✅ AMBIL DATA DARI BACKEND DENGAN STRUKTUR YANG BENAR
    const totalLaporan = data.total_laporan || 0;
    const laporanSelesai = data.laporan_selesai || 0;
    const tingkatPenyelesaian = data.tingkat_penyelesaian || 0;
    
    // ✅ EFEKTIVITAS PENANGANAN
    const efektivitas = data.efektivitas_penanganan || {};
    
    // ✅ TREN WAKTU
    const tren = data.tren_waktu || {};
    
    // ✅ DAMPAK LINGKUNGAN - STRUKTUR BARU
    const dampakLingkungan = data.dampak_lingkungan || {};
    const peringatan = Array.isArray(dampakLingkungan.peringatan) ? dampakLingkungan.peringatan : [];
    const jenisBerbahaya = dampakLingkungan.jenis_berbahaya || {};
    const analisisDetail = Array.isArray(dampakLingkungan.analisis_detail) ? dampakLingkungan.analisis_detail : [];
    const ringkasan = dampakLingkungan.ringkasan || {};
    const lokasiBerbahaya = Array.isArray(dampakLingkungan.lokasi_berbahaya) ? dampakLingkungan.lokasi_berbahaya : [];
    const waktuPenangananBerbahaya = dampakLingkungan.waktu_penanganan_berbahaya || {};
    
    // ✅ KLASIFIKASI SAMPAH
    const klasifikasiSampah = data.klasifikasi_sampah || {};
    const klasifikasiArray = Array.isArray(klasifikasiSampah.detail_klasifikasi) ? klasifikasiSampah.detail_klasifikasi : [];
    const persentaseDataTerstruktur = klasifikasiSampah.persentase_data_terstruktur || 0;
    
    
    // ✅ RANKING WILAYAH
    const rankingWilayah = data.ranking_wilayah || {};
    const rankingTerkotor = Array.isArray(rankingWilayah.ranking_terkotor) ? rankingWilayah.ranking_terkotor : [];
    const rankingTerbersih = Array.isArray(rankingWilayah.ranking_terbersih) ? rankingWilayah.ranking_terbersih : [];
    
    // ✅ REKOMENDASI
    const rekomendasi = Array.isArray(data.rekomendasi) ? data.rekomendasi : [];

    // Fungsi helper untuk format tanggal
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    // Fungsi helper untuk badge risiko
    const getRiskBadgeClass = (tingkatRisiko) => {
        switch (tingkatRisiko) {
            case 'sangat_tinggi': return 'bg-danger';
            case 'tinggi': return 'bg-warning';
            case 'sedang': return 'bg-primary';
            case 'rendah': return 'bg-info';
            case 'aman': return 'bg-success';
            default: return 'bg-secondary';
        }
    };

    // Fungsi helper untuk warna jenis sampah
    const getJenisWarna = (jenis) => {
        const colorMap = {
            'plastik': '#e74c3c',
            'organik': '#27ae60',
            'kertas': '#3498db',
            'logam': '#f39c12',
            'b3': '#9b59b6',
            'kaca': '#1abc9c',
            'campuran': '#95a5a6',
            'karet': '#d35400',
            'tekstil': '#8e44ad',
            'tidak_terdeteksi': '#7f8c8d'
        };
        return colorMap[jenis] || '#34495e';
    };

    // Fungsi untuk render peringatan
    const renderPeringatan = () => {
        if (peringatan.length === 0) {
            return `
                <div class="alert alert-success mb-4">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-check-circle fa-2x me-3"></i>
                        <div>
                            <h6 class="alert-heading">Tidak Ada Peringatan Kritis</h6>
                            <p class="mb-0">Berdasarkan analisis data yang tersedia, tidak ditemukan indikasi dampak lingkungan yang kritis.</p>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="mb-4">
                <h6 class="text-danger mb-3"><i class="fas fa-radiation"></i> Peringatan Lingkungan</h6>
                <div class="row g-3">
                    ${peringatan.map(peringatan => {
                        const levelClass = peringatan.level === 'sangat_tinggi' ? 'danger' : 
                                         peringatan.level === 'tinggi' ? 'warning' : 
                                         peringatan.level === 'sedang' ? 'primary' : 'info';
                        const icon = peringatan.level === 'sangat_tinggi' ? 'fa-radiation' : 
                                   peringatan.level === 'tinggi' ? 'fa-exclamation-triangle' : 
                                   peringatan.level === 'sedang' ? 'fa-exclamation-circle' : 'fa-info-circle';
                        const levelText = peringatan.level === 'sangat_tinggi' ? 'SANGAT TINGGI' :
                                        peringatan.level === 'tinggi' ? 'TINGGI' :
                                        peringatan.level === 'sedang' ? 'SEDANG' : 'RENDAH';
                        
                        // Format jenis untuk display
                        let jenisDisplay = peringatan.jenis || 'tidak_diketahui';
                        if (jenisDisplay === 'b3') jenisDisplay = 'LIMBAH B3';
                        else if (jenisDisplay === 'plastik') jenisDisplay = 'SAMPAH PLASTIK';
                        else if (jenisDisplay === 'organik') jenisDisplay = 'SAMPAH ORGANIK';
                        else jenisDisplay = jenisDisplay.toUpperCase();
                        
                        return `
                            <div class="col-md-6">
                                <div class="alert alert-${levelClass}">
                                    <div class="d-flex align-items-start">
                                        <i class="fas ${icon} fa-2x me-3 mt-1"></i>
                                        <div>
                                            <h6 class="alert-heading">
                                                ${jenisDisplay}
                                                <span class="badge bg-dark ms-2">${levelText}</span>
                                            </h6>
                                            <p class="mb-1">
                                                <strong>${peringatan.jumlah || 0} laporan</strong> 
                                                (${peringatan.persentase || 0}% dari total)
                                            </p>
                                            ${peringatan.dampak ? `
                                                <p class="small mb-1">
                                                    <i class="fas fa-exclamation-circle"></i> 
                                                    ${Array.isArray(peringatan.dampak) ? peringatan.dampak[0] : peringatan.dampak}
                                                    ${Array.isArray(peringatan.dampak) && peringatan.dampak.length > 1 ? 
                                                        ` (+${peringatan.dampak.length - 1} lainnya)` : ''}
                                                </p>
                                            ` : ''}
                                            ${peringatan.rekomendasi ? `
                                                <small class="mb-0">
                                                    <strong>Rekomendasi:</strong> ${peringatan.rekomendasi}
                                                </small>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    };

    // Fungsi untuk render analisis detail
    const renderAnalisisDetail = () => {
        if (analisisDetail.length === 0) return '';

        return `
            <div class="mb-4">
                <h6 class="text-primary mb-3"><i class="fas fa-chart-bar"></i> Analisis Dampak per Jenis Sampah</h6>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-primary">
                            <tr>
                                <th>Jenis Sampah</th>
                                <th class="text-end">Jumlah</th>
                                <th class="text-end">Persentase</th>
                                <th>Tingkat Bahaya</th>
                                <th>Dampak Potensial</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${analisisDetail.map(item => {
                                const tingkatBahaya = item.tingkat_bahaya || 'tidak_diketahui';
                                const bahayaClass = tingkatBahaya === 'sangat_tinggi' ? 'danger' :
                                                  tingkatBahaya === 'tinggi' ? 'warning' :
                                                  tingkatBahaya === 'sedang' ? 'primary' : 'success';
                                const status = item.status || 'tidak_diketahui';
                                const statusClass = status === 'aman' ? 'success' : 'warning';
                                const statusIcon = status === 'aman' ? 'fa-check-circle' : 'fa-exclamation-triangle';
                                
                                // Format jenis untuk display
                                let jenisDisplay = item.jenis || 'tidak_diketahui';
                                if (jenisDisplay === 'b3') jenisDisplay = 'Limbah B3';
                                else if (jenisDisplay === 'plastik') jenisDisplay = 'Plastik';
                                else if (jenisDisplay === 'organik') jenisDisplay = 'Organik';
                                else if (jenisDisplay === 'kertas') jenisDisplay = 'Kertas';
                                else if (jenisDisplay === 'logam') jenisDisplay = 'Logam';
                                else if (jenisDisplay === 'kaca') jenisDisplay = 'Kaca';
                                else jenisDisplay = jenisDisplay.charAt(0).toUpperCase() + jenisDisplay.slice(1);
                                
                                return `
                                    <tr>
                                        <td>
                                            <strong>${jenisDisplay}</strong>
                                        </td>
                                        <td class="text-end fw-bold">${item.jumlah || 0}</td>
                                        <td class="text-end">${item.persentase || 0}%</td>
                                        <td>
                                            <span class="badge bg-${bahayaClass}">
                                                ${tingkatBahaya === 'sangat_tinggi' ? 'SANGAT TINGGI' :
                                                 tingkatBahaya === 'tinggi' ? 'TINGGI' :
                                                 tingkatBahaya === 'sedang' ? 'SEDANG' : 'RENDAH'}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="small">
                                                ${item.dampak_potensial ? 
                                                    (Array.isArray(item.dampak_potensial) ? 
                                                        item.dampak_potensial[0] : item.dampak_potensial) : 
                                                    '-'}
                                                ${Array.isArray(item.dampak_potensial) && item.dampak_potensial.length > 1 ? 
                                                    `<br><span class="text-muted">+${item.dampak_potensial.length - 1} dampak lainnya</span>` : ''}
                                            </div>
                                        </td>
                                        <td>
                                            <span class="badge bg-${statusClass}">
                                                <i class="fas ${statusIcon}"></i>
                                                ${status === 'aman' ? 'AMAN' : 'PERHATIAN'}
                                            </span>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    };

    // Fungsi untuk render lokasi berbahaya
    const renderLokasiBerbahaya = () => {
        if (lokasiBerbahaya.length === 0) return '';

        return `
            <div class="mb-4">
                <h6 class="text-warning mb-3"><i class="fas fa-map-marker-alt"></i> Lokasi dengan Sampah Berbahaya</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead class="table-warning">
                            <tr>
                                <th>#</th>
                                <th>Lokasi</th>
                                <th class="text-end">Limbah B3</th>
                                <th class="text-end">Plastik</th>
                                <th class="text-end">Total</th>
                                <th>Tingkat Risiko</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${lokasiBerbahaya.slice(0, 5).map((lokasi, index) => {
                                const riskClass = lokasi.tingkat_risiko === 'tinggi' ? 'danger' : 'warning';
                                const lokasiDisplay = lokasi.lokasi || lokasi.wilayah || 'Lokasi Tidak Diketahui';
                                
                                return `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>
                                            <strong>${lokasiDisplay}</strong>
                                            ${lokasi.koordinat ? 
                                                `<div class="small text-muted">
                                                    <i class="fas fa-map-pin"></i> 
                                                    ${lokasi.koordinat.lat?.toFixed(4) || '?'}, ${lokasi.koordinat.lon?.toFixed(4) || '?'}
                                                </div>` : ''}
                                            ${lokasi.alamat_samples && Array.isArray(lokasi.alamat_samples) && lokasi.alamat_samples.length > 0 ? 
                                                `<div class="small text-muted">Alamat: \t${lokasi.alamat_samples[0]}</div>` : ''}
                                        </td>
                                        <td class="text-end">
                                            ${lokasi.b3 > 0 ? 
                                                `<span class="badge bg-danger">${lokasi.b3}</span>` : 
                                                '<span class="text-muted">-</span>'}
                                        </td>
                                        <td class="text-end">
                                            ${lokasi.plastik > 0 ? 
                                                `<span class="badge bg-warning">${lokasi.plastik}</span>` : 
                                                '<span class="text-muted">-</span>'}
                                        </td>
                                        <td class="text-end fw-bold">${lokasi.total_berbahaya || lokasi.total || 0}</td>
                                        <td>
                                            <span class="badge bg-${riskClass}">
                                                ${lokasi.tingkat_risiko === 'tinggi' ? 'TINGGI' : 'SEDANG'}
                                            </span>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                ${lokasiBerbahaya.length > 5 ? 
                    `<p class="small text-muted mt-2">
                        <i class="fas fa-info-circle"></i> Menampilkan 5 dari ${lokasiBerbahaya.length} lokasi berbahaya
                    </p>` : ''}
            </div>
        `;
    };

    // Fungsi untuk render waktu penanganan berbahaya
    const renderWaktuPenanganan = () => {
        if (!waktuPenangananBerbahaya || waktuPenangananBerbahaya.total_laporan_berbahaya === 0) return '';

        return `
            <div class="mb-4">
                <h6 class="text-info mb-3"><i class="fas fa-clock"></i> Waktu Penanganan Sampah Berbahaya</h6>
                <div class="row">
                    <div class="col-md-6">
                        <div class="alert alert-light">
                            <div class="row">
                                <div class="col-6">
                                    <p class="small mb-1">
                                        <i class="fas fa-list"></i> <strong>Total Laporan</strong><br>
                                        <span class="fs-5 fw-bold">${waktuPenangananBerbahaya.total_laporan_berbahaya}</span>
                                    </p>
                                </div>
                                <div class="col-6">
                                    <p class="small mb-1">
                                        <i class="fas fa-check-circle text-success"></i> <strong>Selesai</strong><br>
                                        <span class="fs-5 fw-bold">${waktuPenangananBerbahaya.selesai || 0}</span>
                                    </p>
                                </div>
                                <div class="col-12 mt-2">
                                    <p class="small mb-1">
                                        <i class="fas fa-clock"></i> <strong>Rata-rata waktu</strong><br>
                                        <span class="fs-5 fw-bold">${waktuPenangananBerbahaya.rata_waktu_penanganan_hari || 0}</span> hari
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="alert alert-light">
                            <p class="small mb-2">
                                <i class="fas fa-chart-line"></i> <strong>Tingkat Penanganan</strong>
                            </p>
                            <div class="progress" style="height: 20px;">
                                <div class="progress-bar bg-info" role="progressbar" 
                                     style="width: ${waktuPenangananBerbahaya.tingkat_penanganan || 0}%">
                                </div>
                            </div>
                            <p class="small text-center mt-1">
                                ${waktuPenangananBerbahaya.tingkat_penanganan || 0}%
                            </p>
                            ${waktuPenangananBerbahaya.rata_waktu_penanganan_hari > 7 ? `
                                <p class="small text-danger mb-0">
                                    <i class="fas fa-exclamation-triangle"></i> 
                                    Waktu penanganan melebihi 7 hari, perlu perbaikan respons time
                                </p>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    // Fungsi untuk render klasifikasi sampah
    const renderKlasifikasiSampah = () => {
        if (klasifikasiArray.length === 0) {
            return '<div class="alert alert-warning mb-4"><i class="fas fa-exclamation-triangle"></i> Tidak ada data klasifikasi sampah</div>';
        }

        // Analisis komposisi
        const plastik = klasifikasiArray.find(i => i.jenis === 'plastik');
        const b3 = klasifikasiArray.find(i => i.jenis === 'b3');
        const organik = klasifikasiArray.find(i => i.jenis === 'organik');
        const totalKlasifikasi = klasifikasiArray.reduce((sum, item) => sum + (item.jumlah || 0), 0);

        let analisisKomposisi = '';
        if (b3 && b3.jumlah > 0) {
            analisisKomposisi += `
                <p class="mb-2">
                    <i class="fas fa-radiation text-danger"></i> 
                    <strong>Limbah B3:</strong> ${b3.jumlah} laporan (${b3.persentase}%)<br>
                    <span class="text-danger small">• Penanganan khusus diperlukan</span>
                </p>
            `;
        }
        
        if (plastik) {
            if (plastik.persentase > 30) {
                analisisKomposisi += `
                    <p class="mb-2">
                        <i class="fas fa-exclamation-triangle text-warning"></i> 
                        <strong>Plastik Tinggi:</strong> ${plastik.persentase}%<br>
                        <span class="text-warning small">• Perlu program daur ulang</span>
                    </p>
                `;
            } else if (plastik.persentase > 0) {
                analisisKomposisi += `
                    <p class="mb-2">
                        <i class="fas fa-check-circle text-success"></i> 
                        <strong>Plastik:</strong> ${plastik.persentase}% (wajar)
                    </p>
                `;
            }
        }
        
        if (organik && organik.persentase > 40) {
            analisisKomposisi += `
                <p class="mb-2">
                    <i class="fas fa-leaf text-success"></i> 
                    <strong>Organik Dominan:</strong> ${organik.persentase}%<br>
                    <span class="text-success small">• Potensi pengomposan tinggi</span>
                </p>
            `;
        }
        
        analisisKomposisi += `
            <hr>
            <p class="mb-0">
                <i class="fas fa-percentage"></i> 
                <strong>Total Terklasifikasi:</strong> ${totalKlasifikasi} laporan<br>
                <i class="fas fa-database"></i> 
                <strong>Data Terstruktur:</strong> ${persentaseDataTerstruktur.toFixed(1)}%
            </p>
        `;

        return `
            <div class="card mb-4">
                <div class="card-header bg-success text-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0"><i class="fas fa-chart-pie"></i> Distribusi Jenis Sampah</h5>
                        <div>
                            <span class="badge bg-light text-dark me-2">
                                <i class="fas fa-database"></i> ${persentaseDataTerstruktur.toFixed(1)}% data terstruktur
                            </span>
                            <span class="badge ${persentaseDataTerstruktur > 50 ? 'bg-success' : 'bg-warning'}">
                                ${persentaseDataTerstruktur > 50 ? 'Data Baik' : 'Perlu Perbaikan'}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead class="table-success">
                                        <tr>
                                            <th>Jenis Sampah</th>
                                            <th class="text-end">Jumlah</th>
                                            <th class="text-end">Persentase</th>
                                            <th class="text-end">Data Valid</th>
                                            <th>Status Data</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${klasifikasiArray.map(item => {
                                            const percentage = item.persentase || 0;
                                            let jenisDisplay = item.jenis || 'tidak_dikenali';
                                            
                                            // Format display
                                            if (jenisDisplay === 'b3') jenisDisplay = 'Limbah B3';
                                            else if (jenisDisplay === 'plastik') jenisDisplay = 'Plastik';
                                            else if (jenisDisplay === 'organik') jenisDisplay = 'Organik';
                                            else if (jenisDisplay === 'kertas') jenisDisplay = 'Kertas';
                                            else if (jenisDisplay === 'logam') jenisDisplay = 'Logam';
                                            else if (jenisDisplay === 'kaca') jenisDisplay = 'Kaca';
                                            else if (jenisDisplay === 'campuran') jenisDisplay = 'Campuran';
                                            else if (jenisDisplay === 'tidak_terdeteksi') jenisDisplay = 'Tidak Terdeteksi';
                                            else jenisDisplay = jenisDisplay.charAt(0).toUpperCase() + jenisDisplay.slice(1);
                                            
                                            const warna = getJenisWarna(item.jenis);
                                            const dataValid = item.data_valid || 0;
                                            
                                            return `
                                                <tr>
                                                    <td>
                                                        <span class="badge" style="background-color: ${warna}; color: white;">
                                                            ${jenisDisplay}
                                                        </span>
                                                    </td>
                                                    <td class="text-end fw-bold">${item.jumlah || 0}</td>
                                                    <td class="text-end">
                                                        <div class="progress" style="height: 10px; width: 80px; margin-left: auto;">
                                                            <div class="progress-bar" 
                                                                 style="width: ${percentage}%; background-color: ${warna};">
                                                            </div>
                                                        </div>
                                                        <span class="small">${percentage.toFixed(1)}%</span>
                                                    </td>
                                                    <td class="text-end">
                                                        <span class="badge bg-info">${dataValid}</span>
                                                    </td>
                                                    <td>
                                                        <span class="badge ${dataValid > 0 ? 'bg-success' : 'bg-warning'}">
                                                            ${dataValid > 0 ? 'Valid' : 'Perlu Verifikasi'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="alert alert-light h-100">
                                <h6><i class="fas fa-info-circle"></i> Analisis Komposisi</h6>
                                <div class="small">
                                    ${analisisKomposisi}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    // Fungsi untuk render ranking wilayah
    const renderRankingWilayah = () => {
        if (rankingTerkotor.length === 0 && rankingTerbersih.length === 0) return '';

        return `
            <div class="row mb-4">
                ${rankingTerkotor.length > 0 ? `
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-header bg-danger text-white">
                                <h5 class="mb-0"><i class="fas fa-exclamation-triangle"></i> 5 Wilayah Terkotor</h5>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Wilayah</th>
                                                <th class="text-end">Laporan</th>
                                                <th class="text-end">Selesai</th>
                                                <th class="text-end">Skor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${rankingTerkotor.map((wilayah, index) => `
                                                <tr>
                                                    <td>${index + 1}</td>
                                                    <td>
                                                        <span class="badge bg-danger">${wilayah.wilayah || 'Tidak Diketahui'}</span>
                                                    </td>
                                                    <td class="text-end">${wilayah.total_laporan || 0}</td>
                                                    <td class="text-end">
                                                        <span class="badge ${wilayah.tingkat_penyelesaian > 50 ? 'bg-success' : 'bg-warning'}">
                                                            ${wilayah.tingkat_penyelesaian || 0}%
                                                        </span>
                                                    </td>
                                                    <td class="text-end fw-bold" style="color: #e74c3c;">
                                                        ${wilayah.skor_kebersihan || 0}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                ${rankingTerbersih.length > 0 ? `
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-header bg-success text-white">
                                <h5 class="mb-0"><i class="fas fa-trophy"></i> 5 Wilayah Terbersih</h5>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Wilayah</th>
                                                <th class="text-end">Laporan</th>
                                                <th class="text-end">Selesai</th>
                                                <th class="text-end">Skor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${rankingTerbersih.map((wilayah, index) => `
                                                <tr>
                                                    <td>${index + 1}</td>
                                                    <td>
                                                        <span class="badge bg-success">${wilayah.wilayah || 'Tidak Diketahui'}</span>
                                                    </td>
                                                    <td class="text-end">${wilayah.total_laporan || 0}</td>
                                                    <td class="text-end">
                                                        <span class="badge ${wilayah.tingkat_penyelesaian > 50 ? 'bg-success' : 'bg-warning'}">
                                                            ${wilayah.tingkat_penyelesaian || 0}%
                                                        </span>
                                                    </td>
                                                    <td class="text-end fw-bold" style="color: #27ae60;">
                                                        ${wilayah.skor_kebersihan || 0}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    };

    // Fungsi untuk render rekomendasi
    const renderRekomendasi = () => {
        if (rekomendasi.length === 0) return '';

        return `
            <div class="card mb-4">
                <div class="card-header" style="background: linear-gradient(135deg, #6f42c1, #9b6bff); color: white;">
                    <h5 class="mb-0"><i class="fas fa-lightbulb"></i> Rekomendasi Aksi Prioritas</h5>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        ${rekomendasi.map((rec, index) => {
                            const priorityColor = rec.prioritas === 'sangat_tinggi' ? 'danger' :
                                                rec.prioritas === 'tinggi' ? 'warning' :
                                                rec.prioritas === 'sedang' ? 'primary' : 'success';
                            const priorityIcon = rec.prioritas === 'sangat_tinggi' ? 'fa-exclamation-triangle' :
                                                rec.prioritas === 'tinggi' ? 'fa-exclamation-circle' :
                                                rec.prioritas === 'sedang' ? 'fa-info-circle' : 'fa-check-circle';
                            const priorityText = rec.prioritas === 'sangat_tinggi' ? 'SANGAT TINGGI' :
                                               rec.prioritas === 'tinggi' ? 'TINGGI' :
                                               rec.prioritas === 'sedang' ? 'SEDANG' : 'RENDAH';
                            
                            return `
                                <div class="col-md-6">
                                    <div class="card border-${priorityColor} h-100 shadow-sm">
                                        <div class="card-header bg-${priorityColor} text-white py-2">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <i class="fas ${priorityIcon} me-2"></i>
                                                    <span class="small fw-bold">${index + 1}. ${rec.kategori || 'Umum'}</span>
                                                </div>
                                                <span class="badge bg-light text-dark">${priorityText}</span>
                                            </div>
                                        </div>
                                        <div class="card-body">
                                            <p class="card-text fw-bold">${rec.rekomendasi || 'Tidak ada rekomendasi'}</p>
                                            <div class="small text-muted">
                                                <i class="fas fa-bullseye"></i> 
                                                <strong>Alasan:</strong> ${rec.alasan || 'Tidak tersedia'}
                                            </div>
                                            ${rec.sumber_data ? `
                                                <div class="small mt-2">
                                                    <i class="fas fa-database"></i> 
                                                    <strong>Sumber data:</strong> 
                                                    <span class="badge bg-secondary">${rec.sumber_data}</span>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    };

    // Fungsi untuk render tren waktu
    const renderTrenWaktu = () => {
        if (!tren.labels || tren.labels.length === 0) return '';

        const totalTren = tren.total_laporan ? tren.total_laporan.reduce((a, b) => a + b, 0) : 0;
        const rataRataPerHari = totalTren / tren.labels.length;
        
        let hariTerpadat = '-';
        if (tren.total_laporan && tren.total_laporan.length > 0) {
            const maxIndex = tren.total_laporan.indexOf(Math.max(...tren.total_laporan));
            const maxValue = Math.max(...tren.total_laporan);
            hariTerpadat = `
                <strong>${tren.labels[maxIndex] || '-'}</strong><br>
                <span class="text-primary">${maxValue} laporan</span>
            `;
        }

        return `
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0"><i class="fas fa-chart-line"></i> Analisis Tren Waktu</h5>
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-6">
                                <p class="small mb-1">
                                    <i class="fas fa-calendar-check"></i> 
                                    <strong>Periode:</strong> ${tren.labels.length} hari
                                </p>
                            </div>
                            <div class="col-6 text-end">
                                <p class="small mb-1">
                                    <strong>Total:</strong> ${totalTren}
                                </p>
                            </div>
                        </div>
                        
                        <div class="alert alert-light">
                            <div class="row">
                                <div class="col-6">
                                    <p class="small mb-1">
                                        <i class="fas fa-chart-bar"></i> 
                                        <strong>Rata-rata/hari:</strong>
                                    </p>
                                    <h4 class="text-primary">
                                        ${rataRataPerHari.toFixed(1)}
                                    </h4>
                                    <p class="small text-muted mb-0">laporan</p>
                                </div>
                                <div class="col-6">
                                    <p class="small mb-1">
                                        <i class="fas fa-calendar-day"></i> 
                                        <strong>Hari terpadat:</strong>
                                    </p>
                                    <div class="small">
                                        ${hariTerpadat}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    // Render HTML utama
    const html = `
        <div class="dampak-lingkungan-report">
            <div class="report-header mb-4">
                <h4><i class="fas fa-leaf text-success"></i> Analisis Dampak Lingkungan</h4>
                <p class="text-muted">
                    <i class="fas fa-calendar"></i> Periode: ${formatDate(filters?.start_date)} - ${formatDate(filters?.end_date)}
                    <span class="ms-3 badge ${getRiskBadgeClass(ringkasan.tingkat_risiko)}">
                        <i class="fas fa-chart-bar"></i> Tingkat Risiko: ${ringkasan.tingkat_risiko || 'Belum Dianalisis'}
                    </span>
                </p>
            </div>
            
            <!-- Summary Cards -->
            <div class="row g-3 mb-4">
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="stat-value text-primary">${totalLaporan}</div>
                        <div class="stat-label">Total Laporan</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="stat-value text-success">${laporanSelesai}</div>
                        <div class="stat-label">Laporan Selesai</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="stat-value" style="color: #e74c3c;">${tingkatPenyelesaian.toFixed(1)}%</div>
                        <div class="stat-label">Tingkat Penyelesaian</div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="stat-card">
                        <div class="stat-value" style="color: #f39c12;">
                            ${ringkasan.total_peringatan || 0}
                        </div>
                        <div class="stat-label">Peringatan Lingkungan</div>
                    </div>
                </div>
            </div>
            
            <!-- DAMPAK LINGKUNGAN SECTION -->
            <div class="card mb-4 ${peringatan.length > 0 ? 'border-danger' : 'border-success'}">
                <div class="card-header ${peringatan.length > 0 ? 'bg-danger text-white' : 'bg-success text-white'}">
                    <h5 class="mb-0">
                        <i class="fas ${peringatan.length > 0 ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> 
                        Analisis Dampak Lingkungan
                        ${ringkasan.total_jenis_berbahaya > 0 ? 
                            `<span class="badge bg-warning ms-2">${ringkasan.total_jenis_berbahaya} jenis berbahaya</span>` : ''}
                    </h5>
                </div>
                <div class="card-body">
                    ${renderPeringatan()}
                    ${renderAnalisisDetail()}
                    ${renderLokasiBerbahaya()}
                    ${renderWaktuPenanganan()}
                </div>
            </div>
            
            ${renderKlasifikasiSampah()}
            ${renderRankingWilayah()}
            ${renderRekomendasi()}
            
            <!-- Efektivitas & Tren -->
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header bg-info text-white">
                            <h5 class="mb-0"><i class="fas fa-chart-bar"></i> Efektivitas Penanganan</h5>
                        </div>
                        <div class="card-body">
                            <div class="d-flex flex-column gap-2">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span>Total Laporan</span>
                                    <span class="fw-bold fs-5">${efektivitas.total_laporan || 0}</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span>
                                        <i class="fas fa-check-circle text-success me-1"></i>
                                        Selesai
                                    </span>
                                    <span class="badge bg-success fs-6">${efektivitas.laporan_selesai || 0}</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span>
                                        <i class="fas fa-clock text-warning me-1"></i>
                                        Pending
                                    </span>
                                    <span class="badge bg-warning fs-6">${efektivitas.laporan_pending || 0}</span>
                                </div>
                                <hr>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span>Tingkat Penyelesaian</span>
                                    <div class="progress flex-grow-1 mx-2" style="height: 20px;">
                                        <div class="progress-bar bg-success" role="progressbar" 
                                             style="width: ${efektivitas.tingkat_penyelesaian || 0}%">
                                        </div>
                                    </div>
                                    <span class="fw-bold fs-5">${efektivitas.tingkat_penyelesaian ? efektivitas.tingkat_penyelesaian.toFixed(1) : 0}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                ${renderTrenWaktu()}
            </div>

            <!-- ===== TAMBAHKAN TOMBOL EXPORT DI SINI ===== -->
            ${createExportButtons('dampak-lingkungan', filters)}
            
            <!-- Footer -->
            <div class="mt-4 pt-3 border-top text-muted small">
                <div class="row">
                    <div class="col-md-6">
                        <div>
                            <i class="fas fa-chart-pie"></i> 
                            <strong>Analisis Lengkap:</strong> 
                            Berdasarkan ${totalLaporan} laporan sampah
                        </div>
                        <div class="mt-1">
                            <i class="fas fa-clock"></i> 
                            <strong>Dibuat:</strong> ${new Date().toLocaleString('id-ID')}
                        </div>
                    </div>
                    <div class="col-md-6 text-end">
                        <div>
                            <i class="fas fa-database"></i> 
                            <strong>Kualitas Data:</strong> 
                            <span class="badge ${persentaseDataTerstruktur > 50 ? 'bg-success' : 'bg-warning'}">
                                ${persentaseDataTerstruktur > 50 ? 'Baik' : 'Perlu Perbaikan'}
                            </span>
                            <span class="ms-2">(${persentaseDataTerstruktur.toFixed(1)}% terstruktur)</span>
                        </div>
                        <div class="mt-1">
                            <i class="fas fa-exclamation-circle"></i> 
                            <strong>Peringatan:</strong> 
                            <span class="badge ${ringkasan.total_peringatan > 0 ? 'bg-danger' : 'bg-success'}">
                                ${ringkasan.total_peringatan || 0}
                            </span>
                            <span class="ms-2">Risiko: ${ringkasan.tingkat_risiko || 'Belum Dianalisis'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    reportContent.innerHTML = html;
}

// Helper functions
function getRiskBadgeClass(risk) {
    if (!risk) return 'bg-secondary';
    
    switch(risk.toLowerCase()) {
        case 'sangat_tinggi': return 'bg-danger';
        case 'tinggi': return 'bg-warning';
        case 'sedang': return 'bg-primary';
        case 'rendah': return 'bg-info';
        case 'aman': return 'bg-success';
        default: return 'bg-secondary';
    }
}

function getJenisWarna(jenis) {
    if (!jenis) return '#7f8c8d';
    
    switch(jenis.toLowerCase()) {
        case 'plastik': return '#e74c3c';
        case 'b3': return '#f39c12';
        case 'organik': return '#27ae60';
        case 'kertas': return '#3498db';
        case 'logam': return '#95a5a6';
        case 'kaca': return '#9b59b6';
        case 'campuran': return '#34495e';
        case 'tidak_terdeteksi': return '#7f8c8d';
        default: return '#7f8c8d';
    }
}

// Helper functions
function getStatusColor(status) {
    const colors = {
        'selesai': '#27ae60',
        'proses': '#3498db',
        'pending': '#f39c12',
        'dibatalkan': '#e74c3c',
        'jadwal_ulang': '#9b59b6',
        'completed': '#27ae60',
        'in_progress': '#3498db',
        'pending': '#f39c12',
        'cancelled': '#e74c3c',
        'rescheduled': '#9b59b6'
    };
    return colors[status.toLowerCase()] || '#7f8c8d';
}

function clearAuthTokens() {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
}
// Update window object di akhir file
window.loadReport = loadReport;
window.loadUserStatsReport = loadUserStatsReport;
window.applyFilter = applyFilter;
window.generateMonthlyReport = generateMonthlyReport;
window.handleExport = handleExport;
window.exportReport = exportReport;
window.handleExportWithFilters = handleExportWithFilters;
window.handleExportButtonClick = handleExportButtonClick;
window.renderUserStatsReport = renderUserStatsReport;
window.renderKeuanganReport = renderKeuanganReport;
window.renderAnggotaReport = renderAnggotaReport;
window.renderLaporanSampahReport = renderLaporanSampahReport;
window.renderJadwalReport = renderJadwalReport;
window.renderMonthlyReport = renderMonthlyReport;
window.renderDampakLingkunganReport = renderDampakLingkunganReport;
window.formatRupiah = formatRupiah;
window.formatDate = formatDate;
window.getStatusColor = getStatusColor;
window.checkExportCapabilities = checkExportCapabilities;