import { API, getAuthHeaders, fetchAPI } from "../../api.js";
import { authGuard } from "../../utils/authGuard.js";
import { showPaymentDetail } from "./pembayaran_detail.js";

// Deklarasi variabel global untuk user
let currentUser = null;
let currentAnggotaData = null;
let currentPaymentId = null;
let access = localStorage.getItem("access");

export async function pembayaranPage() {
  currentUser = await authGuard();
  const main = document.getElementById("mainContent");

  currentPaymentId = null;

  if (!currentUser) {
    main.innerHTML = `
            <div class="container py-5">
                <div class="alert alert-danger text-center">
                    <h3 class="alert-heading">⚠️ Akses Ditolak</h3>
                    <p>Silakan login terlebih dahulu</p>
                    <button class="btn btn-success mt-2" onclick="window.location.hash='#/login'">Login</button>
                </div>
            </div>
        `;
    return;
  }

  if (currentUser.role !== "anggota") {
    main.innerHTML = `
            <div class="container py-5">
                <div class="alert alert-warning text-center">
                    <h3 class="alert-heading">⚠️ Akses Ditolak</h3>
                    <p>Halaman ini hanya untuk anggota. Role Anda: ${currentUser.role}</p>
                    <button class="btn btn-success mt-2" onclick="window.location.hash='#/dashboard'">Kembali ke Dashboard</button>
                </div>
            </div>
        `;
    return;
  }

  // Tampilkan loading state
  main.innerHTML = `
        <div class="container py-5">
            <div class="text-center">
                <div class="spinner-border text-success" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-muted">Memuat data pembayaran...</p>
            </div>
        </div>
    `;

  try {
    // Ambil data anggota dari API
    currentAnggotaData = await loadAnggotaData();

    if (!currentAnggotaData) {
      // Tampilkan form pendaftaran jika belum terdaftar sebagai anggota
      return showAnggotaRegistrationForm();
    }

    console.log("Data anggota berhasil dimuat:", currentAnggotaData);

    // Render halaman pembayaran
    renderPaymentPage();

    // Load data pembayaran
    await Promise.all([loadPembayaran(), loadPaymentSummary()]);
  } catch (error) {
    console.error("Error loading payment page:", error);
    main.innerHTML = `
            <div class="container py-5">
                <div class="alert alert-danger">
                    <h4 class="alert-heading">
                        <i class="bi bi-exclamation-triangle me-2"></i>Terjadi Kesalahan
                    </h4>
                    <p>Gagal memuat halaman pembayaran: ${error.message}</p>
                    <button class="btn btn-success" onclick="location.reload()">
                        <i class="bi bi-arrow-clockwise me-1"></i>Coba Lagi
                    </button>
                </div>
            </div>
        `;
  }
}

// Fungsi untuk mengambil data anggota (sama seperti di login.js)
async function loadAnggotaData() {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    console.log("⚠ No user data found");
    return null;
  }

  try {
    const user = JSON.parse(userStr);
    // const token = localStorage.getItem("access");

    console.log(
      `🔍 Searching anggota for user ID: ${user.id}, Role: ${user.role}`
    );

    // Hanya cari anggota jika user role = "anggota"
    if (user.role !== "anggota") {
      console.log(`ℹ User role is "${user.role}", skipping anggota lookup`);
      return null;
    }

    // Fetch dari API dengan query user ID
    const response = await fetch(`${API.anggota}?user=${user.id}`, {
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`📊 Response status: ${response.status}`);

    if (!response.ok) {
      console.warn(`⚠ API error ${response.status} when fetching anggota`);
      return null;
    }

    const data = await response.json();
    console.log(`📦 Data anggota received:`, data);

    if (data.length > 0) {
      const anggotaData = data[0];
      // Simpan ke localStorage untuk caching
      localStorage.setItem("anggota", JSON.stringify(anggotaData));
      return anggotaData;
    } else {
      console.log(`ℹ Tidak ada data anggota untuk user ID ${user.id}`);
      return null;
    }
  } catch (error) {
    console.error("❌ Gagal load anggota data:", error);
    return null;
  }
}

// Fungsi untuk menampilkan form pendaftaran anggota jika belum terdaftar
function showAnggotaRegistrationForm() {
  const main = document.getElementById("mainContent");

  main.innerHTML = `
        <div class="container py-4">
            <div class="card border-warning shadow">
                <div class="card-header bg-warning text-white">
                    <h3 class="mb-0">
                        <i class="bi bi-person-plus me-2"></i>Pendaftaran Anggota
                    </h3>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        <strong>Selamat datang!</strong> Anda belum terdaftar sebagai anggota CleanUp Kupang. 
                        Silakan lengkapi formulir berikut untuk mendaftar.
                    </div>
                    
                    <form id="anggotaRegistrationForm">
                        <div class="mb-3">
                            <label for="nama" class="form-label">
                                <i class="bi bi-person me-1"></i>Nama Lengkap *
                            </label>
                            <input type="text" id="nama" class="form-control" required 
                                   value="${currentUser?.username || ""}">
                        </div>
                        
                        <div class="mb-3">
                            <label for="alamat" class="form-label">
                                <i class="bi bi-house me-1"></i>Alamat Lengkap *
                            </label>
                            <textarea id="alamat" class="form-control" rows="3" required></textarea>
                        </div>
                        
                        <div class="mb-3">
                            <label for="noWA" class="form-label">
                                <i class="bi bi-whatsapp me-1"></i>Nomor WhatsApp *
                            </label>
                            <input type="tel" id="noWA" class="form-control" required 
                                   placeholder="081234567890">
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="latitude" class="form-label">
                                    <i class="bi bi-geo-alt me-1"></i>Latitude *
                                </label>
                                <input type="number" step="any" id="latitude" class="form-control" required 
                                       value="-10.1935921">
                            </div>
                            <div class="col-md-6">
                                <label for="longitude" class="form-label">
                                    <i class="bi bi-geo-alt me-1"></i>Longitude *
                                </label>
                                <input type="number" step="any" id="longitude" class="form-control" required 
                                       value="123.6149376">
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="tanggalStart" class="form-label">
                                    <i class="bi bi-calendar-plus me-1"></i>Tanggal Mulai *
                                </label>
                                <input type="date" id="tanggalStart" class="form-control" required>
                            </div>
                            <div class="col-md-6">
                                <label for="tanggalEnd" class="form-label">
                                    <i class="bi bi-calendar-minus me-1"></i>Tanggal Berakhir *
                                </label>
                                <input type="date" id="tanggalEnd" class="form-control" required>
                            </div>
                        </div>
                        
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <label for="jenisSampah" class="form-label">
                                    <i class="bi bi-trash me-1"></i>Jenis Sampah *
                                </label>
                                <select id="jenisSampah" class="form-select" required>
                                    <option value="Rumah Tangga">Rumah Tangga</option>
                                    <option value="Tempat Usaha">Tempat Usaha</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">
                                    <i class="bi bi-check-circle me-1"></i>Status Keanggotaan
                                </label>
                                <div class="alert alert-success py-2">
                                    <i class="bi bi-check-lg me-1"></i>
                                    Aktif (setelah pembayaran pertama)
                                </div>
                            </div>
                        </div>
                        
                        <div class="alert alert-warning">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            <strong>Perhatian:</strong> Setelah mendaftar, Anda perlu membayar biaya keanggotaan 
                            bulanan sebesar <strong>Rp 50.000</strong> untuk dapat menggunakan layanan pengangkutan sampah.
                        </div>
                        
                        <div class="d-flex justify-content-between">
                            <button type="button" class="btn btn-secondary" 
                                    onclick="window.location.hash='#/dashboard'">
                                <i class="bi bi-arrow-left me-1"></i>Kembali
                            </button>
                            <button type="submit" class="btn btn-success">
                                <i class="bi bi-check-circle me-1"></i>Daftar Sekarang
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

  // Set default tanggal (tanggal sekarang untuk start, +30 hari untuk end)
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  document.getElementById("tanggalStart").value = today
    .toISOString()
    .split("T")[0];
  document.getElementById("tanggalEnd").value = nextMonth
    .toISOString()
    .split("T")[0];

  // Handle form submission
  document.getElementById("anggotaRegistrationForm").onsubmit = async (e) => {
    e.preventDefault();
    await registerAnggota();
  };
}

// Fungsi untuk mendaftarkan anggota baru
async function registerAnggota() {
  const form = document.getElementById("anggotaRegistrationForm");
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Mendaftarkan...';

    const anggotaData = {
      user: currentUser.id,
      nama: document.getElementById("nama").value,
      alamat: document.getElementById("alamat").value,
      noWA: document.getElementById("noWA").value,
      latitude: parseFloat(document.getElementById("latitude").value),
      longitude: parseFloat(document.getElementById("longitude").value),
      tanggalStart: document.getElementById("tanggalStart").value,
      tanggalEnd: document.getElementById("tanggalEnd").value,
      status: "aktif",
      jenisSampah: document.getElementById("jenisSampah").value,
    };

    console.log("Data anggota yang akan dikirim:", anggotaData);

    const response = await fetchAPI(API.anggota, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(anggotaData),
    });

    console.log("Registration response:", response);

    // Simpan data anggota ke variable global
    currentAnggotaData = response;
    localStorage.setItem("anggota", JSON.stringify(response));

    // Show success message and reload page
    showAlert(
      "success",
      `
            ✅ Pendaftaran anggota berhasil!<br>
            ID Anggota: <strong>${
              response.idAnggota || response.id
            }</strong><br><br>
            Halaman akan dimuat ulang untuk melanjutkan ke pembayaran.
        `
    );

    setTimeout(() => {
      location.reload();
    }, 2000);
  } catch (error) {
    console.error("Registration error:", error);
    showAlert("danger", `❌ Gagal mendaftarkan anggota: ${error.message}`);

    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// Fungsi untuk render halaman pembayaran
function renderPaymentPage() {
  const main = document.getElementById("mainContent");

  main.innerHTML = `
        <div class="container-fluid py-4">
            <!-- Header -->
            <div class="card border-success shadow-sm mb-4">
                <div class="card-body bg-success bg-opacity-10">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h1 class="text-success mb-1">
                                <i class="bi bi-cash-coin me-2"></i>Pembayaran Langganan
                            </h1>
                            <p class="text-muted mb-0">
                                ID Anggota: <strong>#${
                                  currentAnggotaData.idAnggota ||
                                  currentAnggotaData.id
                                }</strong> | 
                                ${currentAnggotaData.nama}
                            </p>
                        </div>
                        <div class="text-end">
                            <div class="text-success small">Biaya Bulanan</div>
                            <div class="h2 text-success fw-bold">Rp 50.000</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Payment Summary -->
            <div class="row g-3 mb-4">
                <div class="col-md-4">
                    <div class="card border-info h-100 shadow-sm">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div class="bg-info bg-opacity-10 p-3 rounded me-3">
                                    <i class="bi bi-wallet2 text-info fs-4"></i>
                                </div>
                                <div>
                                    <h5 class="card-title text-muted mb-1">Total Dibayar</h5>
                                    <div class="h4 text-success fw-bold" id="totalPaid">Rp 0</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card border-primary h-100 shadow-sm">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div class="bg-primary bg-opacity-10 p-3 rounded me-3">
                                    <i class="bi bi-calendar-check text-primary fs-4"></i>
                                </div>
                                <div>
                                    <h5 class="card-title text-muted mb-1">Bulan Aktif</h5>
                                    <div class="h4 text-success fw-bold" id="activeMonths">0 bulan</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card border-success h-100 shadow-sm">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div class="bg-success bg-opacity-10 p-3 rounded me-3">
                                    <i class="bi bi-check-circle text-success fs-4"></i>
                                </div>
                                <div>
                                    <h5 class="card-title text-muted mb-1">Status Pembayaran</h5>
                                    <div class="h4 text-success fw-bold" id="paymentStatus">Aktif</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Payment Options -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-success text-white">
                    <h3 class="mb-0">
                        <i class="bi bi-credit-card me-2"></i>Pilih Metode Pembayaran
                    </h3>
                </div>
                <div class="card-body">
                    <p class="text-muted mb-4">Bayar Rp 50.000 untuk keanggotaan 1 bulan</p>
                    
                    <div class="row g-3 mb-4">
                        <div class="col-md-4">
                            <div class="payment-method card h-100 border-2 cursor-pointer" data-method="transfer">
                                <div class="card-body text-center">
                                    <div class="display-4 mb-3 text-primary">
                                        <i class="bi bi-bank"></i>
                                    </div>
                                    <h5 class="text-dark">Transfer Bank</h5>
                                    <p class="text-muted small mb-0">BNI / BRI / Mandiri</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-4">
                            <div class="payment-method card h-100 border-2 cursor-pointer" data-method="cash">
                                <div class="card-body text-center">
                                    <div class="display-4 mb-3 text-success">
                                        <i class="bi bi-cash-stack"></i>
                                    </div>
                                    <h5 class="text-dark">Tunai</h5>
                                    <p class="text-muted small mb-0">Bayar ke petugas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="paymentDetails" class="alert alert-light border" style="display: none;">
                        <div id="paymentInstructions"></div>
                        <button id="btnConfirmPayment" class="btn btn-success mt-3">
                            <i class="bi bi-cash-coin me-1"></i>Buat Pembayaran
                        </button>
                    </div>
                </div>
            </div>

            <!-- Payment History -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                    <h3 class="mb-0">
                        <i class="bi bi-clock-history me-2"></i>Riwayat Pembayaran
                    </h3>
                    <button onclick="exportPayments()" class="btn btn-light btn-sm">
                        <i class="bi bi-download me-1"></i>Export
                    </button>
                </div>
                <div class="card-body">
                    <div id="pembayaranList">
                        <div class="text-center py-5">
                            <div class="spinner-border text-success" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-2 text-muted">Memuat riwayat pembayaran...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Info -->
            <div class="alert alert-info shadow-sm">
                <h5 class="alert-heading">
                    <i class="bi bi-info-circle me-2"></i>Informasi Pembayaran
                </h5>
                <ul class="mb-0">
                    <li>Biaya keanggotaan: <strong class="text-success">Rp 50.000 per bulan</strong></li>
                    <li>Pembayaran tunai: Bayar ke petugas saat pengangkutan sampah pertama</li>
                    <li>Transfer bank: Upload bukti transfer setelah melakukan pembayaran</li>
                    <li>Status anggota akan non-aktif jika pembayaran terlambat 7 hari</li>
                </ul>
            </div>
        </div>

        <!-- Payment Modals -->
        <div id="paymentModal"></div>
        <div id="uploadModal"></div>
    `;

  // Setup event listeners
  setupPaymentPageEvents();
}

function setupPaymentPageEvents() {
  // Event listeners untuk payment methods
  document.querySelectorAll(".payment-method").forEach((method) => {
    method.onclick = () => {
      document.querySelectorAll(".payment-method").forEach((m) => {
        m.classList.remove("border-success", "bg-success", "bg-opacity-10");
        m.classList.add("border-2");
      });

      method.classList.remove("border-2");
      method.classList.add("border-success", "bg-success", "bg-opacity-10");

      const paymentMethod = method.dataset.method;
      showPaymentInstructions(paymentMethod);
    };
  });

  // Confirm payment button
  document.getElementById("btnConfirmPayment").onclick = async () => {
    const activeMethod = document.querySelector(
      ".payment-method.border-success"
    );
    if (!activeMethod) {
      showAlert("warning", "Pilih metode pembayaran terlebih dahulu");
      return;
    }

    const method = activeMethod.dataset.method;

    if (method === "cash") {
      await processCashPayment();
    } else {
      await createPayment(method);
    }
  };
}

// Tampilkan instruksi pembayaran
function showPaymentInstructions(method) {
  const paymentDetails = document.getElementById("paymentDetails");
  const instructionsDiv = document.getElementById("paymentInstructions");

  const instructions = {
    transfer: `
            <div>
                <h5 class="text-primary"><i class="bi bi-bank me-2"></i>Transfer Bank</h5>
                <div class="alert alert-primary">
                    <strong>Transfer ke rekening berikut:</strong>
                    <table class="table table-sm mt-2">
                        <tr>
                            <td class="fw-bold">Bank</td>
                            <td class="text-end"><strong>BNI</strong></td>
                        </tr>
                        <tr>
                            <td class="fw-bold">Nomor Rekening</td>
                            <td class="text-end"><strong>1234-5678-9012</strong></td>
                        </tr>
                        <tr>
                            <td class="fw-bold">Atas Nama</td>
                            <td class="text-end"><strong>CLEANUP KUPANG</strong></td>
                        </tr>
                        <tr>
                            <td class="fw-bold">Jumlah Transfer</td>
                            <td class="text-end"><strong class="text-success">Rp 50.000</strong></td>
                        </tr>
                    </table>
                    <p class="mb-0">
                        <i class="bi bi-info-circle me-1"></i>
                        Setelah melakukan transfer, klik tombol "Buat Pembayaran" dan upload bukti transfer
                    </p>
                </div>
                <div class="alert alert-info">
                    <i class="bi bi-exclamation-circle me-2"></i>
                    <strong>Catatan:</strong> Setelah Anda melakukan pembayaran, sistem akan otomatis memperbarui status menjadi "Lunas" setelah konfirmasi.
                </div>
            </div>
        `,
    cash: `
            <div>
                <h5 class="text-success"><i class="bi bi-cash-stack me-2"></i>Pembayaran Tunai</h5>
                <div class="alert alert-success">
                    <strong>Pembayaran dilakukan langsung ke petugas:</strong>
                    <ul class="mb-0 mt-2">
                        <li>Bayar saat pengangkutan sampah pertama</li>
                        <li>Petugas akan memberikan kwitansi pembayaran</li>
                        <li>Status akan dikonfirmasi oleh petugas</li>
                    </ul>
                </div>
                <div class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    <strong>Catatan:</strong> Pastikan Anda mendapatkan kwitansi pembayaran dari petugas sebagai bukti.
                </div>
            </div>
        `,
  };

  instructionsDiv.innerHTML =
    instructions[method] || '<p class="text-muted">Pilih metode pembayaran</p>';
  paymentDetails.style.display = "block";
}

async function processPaymentSuccess(paymentData) {
  const btnConfirm = document.getElementById("btnConfirmPayment");
  const btnOriginal = btnConfirm?.innerHTML;

  if (btnConfirm) {
    btnConfirm.disabled = true;
    btnConfirm.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Memproses...';
  }

  try {
    console.log(
      "🎯 Processing payment success for ID:",
      paymentData.idPembayaran || paymentData.id
    );

    // Panggil endpoint pembayaran sukses di backend
    const result = await fetchAPI(
      API.pembayaranSuccess(paymentData.idPembayaran || paymentData.id),
      {
        method: "POST",
      }
    );

    console.log("✅ Payment success result:", result);

    if (result.status === "success") {
      // Show success message with details
      showAlert(
        "success",
        `
                <div class="text-center">
                    <i class="bi bi-check-circle display-1 text-success mb-3"></i>
                    <h4 class="text-success">✅ Pembayaran Berhasil!</h4>
                    <div class="mt-3">
                        <p><strong>ID Pembayaran:</strong> ${
                          paymentData.idPembayaran || paymentData.id
                        }</p>
                        <p><strong>Status Anggota:</strong> <span class="badge bg-success">Aktif</span></p>
                        <p><strong>Berlaku Hingga:</strong> ${formatDate(
                          result.anggota.tanggal_end
                        )}</p>
                        <p><strong>Jadwal Diaktifkan:</strong> ${
                          result.reactivated_schedules || 0
                        } jadwal</p>
                    </div>
                    <div class="mt-4">
                        <button onclick="location.reload()" class="btn btn-success">
                            <i class="bi bi-arrow-clockwise me-1"></i> Refresh Dashboard
                        </button>
                    </div>
                </div>
            `
      );

      renderPaymentPage();

      // Update local storage dengan data anggota terbaru
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user && user.idAnggota) {
        try {
          const updatedAnggota = await fetchAPI(
            `${API.anggota}${user.idAnggota}/`
          );
          localStorage.setItem(
            "currentAnggota",
            JSON.stringify(updatedAnggota)
          );
        } catch (error) {
          console.error("Failed to update anggota data:", error);
        }
      }

      // Refresh halaman pembayaran setelah 3 detik
      setTimeout(() => {
        if (typeof loadPembayaran === "function") {
          loadPembayaran();
        }
        if (typeof loadPaymentSummary === "function") {
          loadPaymentSummary();
        }
      }, 3000);
    } else {
      throw new Error(result.error || "Gagal memproses pembayaran");
    }
  } catch (error) {
    console.error("❌ Payment processing error:", error);
    showAlert(
      "danger",
      `
            ❌ Gagal memproses pembayaran: ${error.message}<br><br>
            <small class="text-muted">
                Silakan hubungi admin atau coba lagi nanti. 
                Pembayaran Anda telah tercatat dengan status pending.
            </small>
        `
    );

    if (btnConfirm) {
      btnConfirm.disabled = false;
      btnConfirm.innerHTML = btnOriginal;
    }
  }
}

async function createPayment(method) {
  const btnConfirm = document.getElementById("btnConfirmPayment");

  if (!currentUser) {
    showAlert("danger", "Sesi telah berakhir. Silakan login ulang.");
    return;
  }

  if (!currentAnggotaData || !currentAnggotaData.idAnggota) {
    showAlert("danger", "Data anggota tidak valid. Silakan refresh halaman.");
    return;
  }

  const btnOriginal = btnConfirm.innerHTML;
  btnConfirm.disabled = true;
  btnConfirm.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Membuat pembayaran...';

  try {
    const payload = {
      idAnggota: currentAnggotaData.idAnggota || currentAnggotaData.id,
      tanggalBayar: new Date().toISOString().split("T")[0],
      jumlahBayar: 50000,
      metodeBayar: method === "transfer" ? "bank_transfer" : method,
      statusBayar: "pending", // SEMUA metode mulai dari pending (tidak langsung success)
    };

    console.log("📤 Payload pembayaran:", payload);

    const responseData = await fetchAPI(API.pembayaran, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    console.log("📥 Response pembayaran:", responseData);
    alert("pembayaran Berhasil di Buat, Silahkan bayar ketika petugas mengambil saat pengambilan pertama!");

    const paymentId = responseData.idPembayaran || responseData.id;
    currentPaymentId = paymentId;

    if (method === "transfer") {
      showUploadModal(responseData);
    } else if (method === "cash") {
      showAlert(
        "success",
        `
                ✅ Pembayaran tunai berhasil dibuat!<br><br>
                <strong>ID Pembayaran:</strong> ${paymentId}<br>
                <strong>Status:</strong> Menunggu pembayaran ke petugas<br><br>
                <small class="text-muted">
                    Silakan bayar ke petugas saat pengangkutan sampah pertama.<br>
                    Petugas akan mengkonfirmasi pembayaran Anda.
                </small>
            `
      );

      // Refresh data
      await Promise.all([loadPembayaran(), loadPaymentSummary()]);
    }

    resetPaymentUI();
  } catch (error) {
    console.error("❌ Payment error:", error);
    showAlert("danger", `❌ Gagal membuat pembayaran: ${error.message}`);

    btnConfirm.disabled = false;
    btnConfirm.innerHTML = btnOriginal;
  }
}

async function processCashPayment() {
  const btnConfirm = document.getElementById("btnConfirmPayment");

  if (!currentUser) {
    showAlert("danger", "Sesi telah berakhir. Silakan login ulang.");
    return;
  }

  if (!currentAnggotaData || !currentAnggotaData.idAnggota) {
    showAlert("danger", "❌ Data anggota tidak ditemukan.");
    return;
  }

  const confirmPayment = await showConfirmModal(
    "Pembayaran Tunai",
    `
        <div class="alert alert-warning">
            <h6><i class="bi bi-cash-stack me-2"></i>Prosedur Pembayaran Tunai</h6>
            <ol class="mb-0">
                <li>Sistem akan membuat tagihan pembayaran tunai</li>
                <li>Bayar Rp 50.000 ke petugas saat pengangkutan sampah pertama</li>
                <li>Petugas akan konfirmasi pembayaran Anda</li>
            </ol>
        </div>
        <p class="text-muted">Lanjutkan membuat pembayaran tunai?</p>
        `,
    "Ya, Lanjutkan",
    "success",
    "Batal"
  );

  if (!confirmPayment) return;

  const btnOriginal = btnConfirm.innerHTML;
  btnConfirm.disabled = true;
  btnConfirm.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Membuat pembayaran tunai...';

  try {
    const payload = {
      idAnggota: currentAnggotaData.idAnggota || currentAnggotaData.id,
      tanggalBayar: new Date().toISOString().split("T")[0],
      jumlahBayar: 50000,
      metodeBayar: "cash",
      statusBayar: "pending",
    };

    console.log("Payload pembayaran tunai:", payload);

    const response = await fetch(API.pembayaran, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Gagal membuat pembayaran");
    }

    currentPaymentId = data.idPembayaran || data.id;

    showAlert(
      "success",
      `✅ Pembayaran tunai berhasil dibuat!<br><br>
            <strong>ID Pembayaran:</strong> ${currentPaymentId}<br>
            <strong>Status:</strong> Menunggu pembayaran ke petugas<br><br>
            <small class="text-muted">Silakan bayar ke petugas saat pengangkutan sampah pertama.</small>`
    );

    resetPaymentUI();

    await Promise.all([loadPembayaran(), loadPaymentSummary()]);
  } catch (error) {
    showAlert("danger", `❌ Gagal membuat pembayaran tunai: ${error.message}`);
    btnConfirm.disabled = false;
    btnConfirm.innerHTML = btnOriginal;
  }
}

function showUploadModal(paymentData) {
  const modal = document.getElementById("uploadModal") || document.createElement("div");
  modal.id = "uploadModal";
  modal.innerHTML = "";

  const isTransferBank = paymentData.metodeBayar === "bank_transfer" || !paymentData.metodeBayar;
  
  // Tentukan judul dan warna berdasarkan metode
  const modalTitle = '<i class="bi bi-cloud-upload me-2"></i>Upload Bukti Transfer';
  const modalHeaderClass = 'bg-success text-white';
  const modalButtonClass = 'btn-success';

  // Instruksi untuk Transfer Bank
  let instructionsHTML = '';
  let paymentInfoHTML = '';
  
  // Hanya tampilkan untuk transfer bank
  instructionsHTML = `
    <div class="mb-4">
      <h6><i class="bi bi-list-ol me-2"></i>Instruksi Transfer Bank:</h6>
      <ol class="mb-0">
        <li>Transfer <strong class="text-success">Rp 50.000</strong> ke rekening berikut:</li>
        <div class="alert alert-primary mt-2 mb-3">
          <table class="table table-sm table-borderless mb-0">
            <tr>
              <td width="40%"><strong>Bank</strong></td>
              <td class="text-end"><strong>BNI</strong></td>
            </tr>
            <tr>
              <td><strong>Nomor Rekening</strong></td>
              <td class="text-end"><strong>1234-5678-9012</strong></td>
            </tr>
            <tr>
              <td><strong>Atas Nama</strong></td>
              <td class="text-end"><strong>CLEANUP KUPANG</strong></td>
            </tr>
          </table>
        </div>
        <li>Screenshot/photo <strong>bukti transfer</strong> dari aplikasi bank/mobile banking</li>
        <li>Upload file bukti transfer di bawah ini</li>
        <li>Klik "Simpan Bukti Transfer" untuk mengkonfirmasi</li>
      </ol>
    </div>
    
    <div class="alert alert-info mb-4">
      <i class="bi bi-info-circle me-2"></i>
      <strong>Informasi Penting:</strong> Pastikan bukti transfer memuat informasi:
      <ul class="mb-0 mt-1">
        <li>Nama pengirim (Anda)</li>
        <li>Jumlah transfer (Rp 50.000)</li>
        <li>Waktu transfer</li>
        <li>Referensi/ID transaksi bank</li>
      </ul>
    </div>
  `;
  
  paymentInfoHTML = `
    <p class="mb-1"><strong>ID Pembayaran:</strong> ${paymentData.idPembayaran || paymentData.id}</p>
    <p class="mb-1"><strong>Jumlah:</strong> <span class="text-success fw-bold">Rp 50.000</span></p>
    <p class="mb-0"><strong>Metode:</strong> <span class="badge bg-success">Transfer Bank</span></p>
    <p class="mb-0 mt-1"><strong>Kode Bank:</strong> <code>009 (BNI)</code></p>
  `;

  modal.innerHTML = `
    <div class="modal fade show" style="display: block; background: rgba(0,0,0,0.5);" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header ${modalHeaderClass}">
            <h5 class="modal-title">
              ${modalTitle}
            </h5>
            <button type="button" class="btn-close btn-close-white" onclick="closeUploadModal()"></button>
          </div>
          <div class="modal-body">
            <div class="mb-4">
              <div class="alert alert-primary">
                <h6 class="alert-heading mb-2">
                  <i class="bi bi-info-circle me-2"></i>Informasi Pembayaran
                </h6>
                ${paymentInfoHTML}
              </div>
            </div>
            
            ${instructionsHTML}
            
            <div class="mb-4">
              <div id="uploadPreview" class="border rounded p-4 text-center bg-light">
                <i class="bi bi-paperclip display-4 text-muted mb-3"></i>
                <p class="text-muted mb-1">Belum ada file dipilih</p>
                <small class="text-muted">Maksimal 5MB (JPG, PNG, PDF)</small>
              </div>
            </div>
            
            <div class="mb-4">
              <div class="d-grid gap-2">
                <label for="fileInput" class="btn btn-outline-success">
                  <i class="bi bi-folder2-open me-2"></i>Pilih File Bukti
                </label>
                <input type="file" id="fileInput" class="d-none" accept=".jpg,.jpeg,.png,.pdf">
                <button onclick="uploadBuktiBayar()" id="btnUpload" class="btn btn-success" disabled>
                  <i class="bi bi-cloud-upload me-2"></i>Simpan Bukti Transfer
                </button>
              </div>
            </div>
            
            <div id="uploadMessage"></div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="skipUpload()">
              <i class="bi bi-clock me-2"></i>Upload Nanti
            </button>
            <button type="button" class="btn btn-outline-success" onclick="closeUploadModal()">
              <i class="bi bi-x-circle me-2"></i>Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("fileInput").onchange = function (e) {
    const file = e.target.files[0];
    if (file) {
      previewUploadFile(file);
    }
  };
}

function resetPaymentUI() {
  document.querySelectorAll(".payment-method").forEach((m) => {
    m.classList.remove("border-success", "bg-success", "bg-opacity-10");
    m.classList.add("border-2");
  });

  const paymentDetails = document.getElementById("paymentDetails");
  if (paymentDetails) {
    paymentDetails.style.display = "none";
  }

  const btnConfirm = document.getElementById("btnConfirmPayment");
  if (btnConfirm) {
    btnConfirm.disabled = false;
    btnConfirm.innerHTML =
      '<i class="bi bi-cash-coin me-1"></i>Buat Pembayaran';
  }
}

async function loadPaymentSummary() {
  try {
    if (!currentUser) return;

    const response = await fetch(`${API.pembayaran}?user=${currentUser.id}`, {
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      const data = await response.json();
      const userPayments = Array.isArray(data) ? data : [];

      // Filter hanya pembayaran yang statusnya 'success' atau 'lunas'
      const successfulPayments = userPayments.filter(
        (p) =>
          (p.statusBayar || p.status) === "success" ||
          (p.statusBayar || p.status) === "lunas"
      );

      const totalPaid = successfulPayments.reduce(
        (sum, p) => sum + (p.jumlahBayar || p.nominal || 0),
        0
      );
      const activeMonths = Math.floor(totalPaid / 50000);

      // Tentukan status berdasarkan pembayaran terakhir
      const latestPayment = userPayments[userPayments.length - 1];
      let paymentStatus = "Belum Bayar";
      let paymentStatusText = "Belum Bayar";

      if (userPayments.length > 0) {
        const latestStatus =
          latestPayment?.statusBayar || latestPayment?.status;

        switch (latestStatus) {
          case "success":
          case "lunas":
            paymentStatus = "Aktif";
            paymentStatusText = "Lunas";
            break;
          case "pending":
            paymentStatus = "Menunggu";
            paymentStatusText = "Menunggu Konfirmasi";
            break;
          case "failed":
          case "gagal":
            paymentStatus = "Gagal";
            paymentStatusText = "Gagal";
            break;
          default:
            paymentStatus = "Belum Bayar";
            paymentStatusText = "Belum Bayar";
        }
      }

      // Periksa jika sudah ada pembayaran yang sukses
      if (totalPaid > 0) {
        paymentStatus = "Aktif";
        paymentStatusText = "Lunas";
      }

      document.getElementById(
        "totalPaid"
      ).textContent = `Rp ${totalPaid.toLocaleString("id-ID")}`;
      document.getElementById(
        "activeMonths"
      ).textContent = `${activeMonths} bulan`;
      document.getElementById("paymentStatus").textContent = paymentStatusText;

      // Update status color
      const statusEl = document.getElementById("paymentStatus");
      statusEl.className =
        "h4 fw-bold " +
        (paymentStatus === "Aktif" || paymentStatus === "Lunas"
          ? "text-success"
          : paymentStatus === "Menunggu"
          ? "text-warning"
          : paymentStatus === "Gagal"
          ? "text-danger"
          : "text-muted");

      // Update header card warna sesuai status
      const statusCard = document.querySelector(
        ".card.border-success .card-body"
      );
      if (statusCard) {
        statusCard.classList.remove("bg-success", "bg-opacity-10");
        if (paymentStatus === "Aktif" || paymentStatus === "Lunas") {
          statusCard.classList.add("bg-success", "bg-opacity-10");
        } else if (paymentStatus === "Menunggu") {
          statusCard.classList.add("bg-warning", "bg-opacity-10");
        } else if (paymentStatus === "Gagal") {
          statusCard.classList.add("bg-danger", "bg-opacity-10");
        } else {
          statusCard.classList.add("bg-secondary", "bg-opacity-10");
        }
      }
    }
  } catch (error) {
    console.error("Error loading payment summary:", error);
  }
}

async function loadPembayaran() {
  const list = document.getElementById("pembayaranList");
  if (!list || !currentUser) return;

  try {
    const response = await fetch(`${API.pembayaran}?user=${currentUser.id}`, {
      headers: getAuthHeaders(),
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      showErrorMessage(list, "Format data tidak valid");
      return;
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const payments = Array.isArray(data) ? data : [];

    if (payments.length === 0) {
      list.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-wallet display-1 text-muted mb-3"></i>
                    <h4 class="text-muted">Belum Ada Riwayat Pembayaran</h4>
                    <p class="text-muted">Lakukan pembayaran pertama Anda</p>
                </div>
            `;
      return;
    }

    list.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>ID</th>
                            <th>Tanggal</th>
                            <th>Nominal</th>
                            <th>Metode</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payments
                          .map((payment) => renderPaymentRow(payment))
                          .join("")}
                    </tbody>
                </table>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-3">
                <div>
                    <strong>Total: ${payments.length} transaksi</strong>
                </div>
                <div>
                    <button class="btn btn-outline-success" onclick="exportPayments()">
                        <i class="bi bi-download me-1"></i>Export PDF
                    </button>
                </div>
            </div>
        `;
  } catch (err) {
    console.error("Error loading pembayaran:", err);
    showErrorMessage(list, err.message);
  }
}

function renderPaymentRow(payment) {
  const status = payment.statusBayar || payment.status || "pending";
  const jumlahBayar = payment.jumlahBayar || payment.nominal || 0;
  
  // Cek apakah sudah ada bukti bayar
  const hasBuktiBayar = payment.bukti_bayar || payment.buktiBayar;

  // Map status yang benar
  let statusConfig;
  switch (status) {
    case "success":
    case "lunas":
      statusConfig = { class: "success", text: "Lunas", icon: "check-circle" };
      break;
    case "pending":
      // Jika pending, cek apakah sudah ada bukti
      if (hasBuktiBayar) {
        statusConfig = { class: "info", text: "Menunggu Verifikasi", icon: "clock-history" };
      } else {
        statusConfig = { class: "warning", text: "Menunggu Pembayaran", icon: "clock" };
      }
      break;
    case "failed":
    case "gagal":
      statusConfig = { class: "danger", text: "Gagal", icon: "x-circle" };
      break;
    default:
      statusConfig = {
        class: "secondary",
        text: status,
        icon: "question-circle",
      };
  }

  // Format metode bayar
  let metodeText = "Transfer";
  if (payment.metodeBayar) {
    switch (payment.metodeBayar) {
      case "bank_transfer":
        metodeText = "Transfer Bank";
        break;
      case "cash":
        metodeText = "Tunai";
        break;
      default:
        metodeText = payment.metodeBayar;
    }
  }

  // Tombol aksi berdasarkan status, metode, dan bukti
  let actionButton = "";
  
  if (status === "pending") {
    // Cek apakah metode memerlukan upload bukti
    const needsUpload = (payment.metodeBayar === "bank_transfer");
    
    if (needsUpload) {
      // Jika sudah ada bukti, tidak tampilkan tombol upload
      if (hasBuktiBayar) {
        actionButton = `
          <span class="text-info small">
            <i class="bi bi-clock-history me-1"></i>Menunggu Verifikasi
          </span>
        `;
      } else {
        // Jika belum ada bukti, tampilkan tombol upload
        actionButton = `
          <button onclick="showUploadModalForPayment('${
            payment.idPembayaran || payment.id
          }')" 
                  class="btn btn-sm btn-outline-warning">
            <i class="bi bi-upload me-1"></i>Upload Bukti
          </button>
        `;
      }
    } else {
      // Untuk metode cash atau lainnya
      actionButton = `
        <button onclick="showPaymentDetailForAnggota('${
          payment.idPembayaran || payment.id
        }')" 
                class="btn btn-sm btn-outline-success">
          <i class="bi bi-eye me-1"></i>Detail
        </button>
      `;
    }
  } else {
    // Status bukan pending, tampilkan tombol detail biasa
    actionButton = `
      <button onclick="showPaymentDetailForAnggota('${
        payment.idPembayaran || payment.id
      }')" 
              class="btn btn-sm btn-outline-success">
        <i class="bi bi-eye me-1"></i>Detail
      </button>
    `;
  }

  return `
    <tr>
      <td class="fw-semibold">#${payment.idPembayaran || payment.id || "-"}</td>
      <td>${formatDate(payment.tanggalBayar || payment.created_at)}</td>
      <td class="${
        status === "success" || status === "lunas"
          ? "text-success"
          : status === "pending" && hasBuktiBayar
          ? "text-info"
          : "text-warning"
      } fw-bold">
        Rp ${jumlahBayar.toLocaleString("id-ID")}
      </td>
      <td>
        <span class="badge bg-light text-dark">
          ${metodeText}
        </span>
      </td>
      <td>
        <span class="badge bg-${statusConfig.class}">
          <i class="bi bi-${statusConfig.icon} me-1"></i>${statusConfig.text}
        </span>
      </td>
      <td>
        ${actionButton}
      </td>
    </tr>
  `;
}

// Tambahkan fungsi global untuk upload bukti dari riwayat
window.showUploadModalForPayment = async function (paymentId) {
  currentPaymentId = paymentId;

  // Ambil data pembayaran untuk modal upload
  try {
    const response = await fetch(`${API.pembayaran}${paymentId}/`, {
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      const paymentData = await response.json();
      showUploadModal(paymentData);
    } else {
      showAlert("danger", "Gagal memuat data pembayaran");
    }
  } catch (error) {
    showAlert("danger", "Error: " + error.message);
  }
};

function showErrorMessage(element, message) {
  element.innerHTML = `
        <div class="alert alert-danger text-center">
            <h4 class="alert-heading">
                <i class="bi bi-exclamation-triangle me-2"></i>Gagal Memuat Data
            </h4>
            <p class="mb-3">${message}</p>
            <button onclick="location.reload()" class="btn btn-success">
                <i class="bi bi-arrow-clockwise me-1"></i>Coba Lagi
            </button>
        </div>
    `;
}

function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

// Helper functions
function showAlert(type, message) {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
  alertDiv.style.top = "20px";
  alertDiv.style.right = "20px";
  alertDiv.style.zIndex = "1050";
  alertDiv.style.minWidth = "300px";
  alertDiv.innerHTML = `
        <div>${message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

function showConfirmModal(
  title,
  message,
  confirmText = "Ya",
  confirmType = "primary",
  cancelText = "Batal"
) {
  return new Promise((resolve) => {
    const modalDiv = document.createElement("div");
    modalDiv.id = "confirmModal";
    modalDiv.innerHTML = `
            <div class="modal fade show" style="display: block; background: rgba(0,0,0,0.5);" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" onclick="document.getElementById('confirmModal').remove(); resolve(false);"></button>
                        </div>
                        <div class="modal-body">
                            ${message}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" onclick="document.getElementById('confirmModal').remove(); resolve(false);">
                                ${cancelText}
                            </button>
                            <button type="button" class="btn btn-${confirmType}" onclick="document.getElementById('confirmModal').remove(); resolve(true);">
                                ${confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(modalDiv);

    window.resolve = resolve;
  });
}

// Global functions
window.exportPayments = function () {
  showAlert("info", "Fitur export PDF sedang dalam pengembangan");
};

window.uploadBuktiBayar = async function () {
  const fileInput = document.getElementById("fileInput");
  const btnUpload = document.getElementById("btnUpload");
  const uploadMessage = document.getElementById("uploadMessage");

  if (!fileInput.files || fileInput.files.length === 0) {
    showUploadMessage("Pilih file terlebih dahulu", "error");
    return;
  }

  if (!currentPaymentId) {
    showUploadMessage("ID pembayaran tidak ditemukan", "error");
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("buktiBayar", file);

  const btnOriginal = btnUpload.innerHTML;
  btnUpload.disabled = true;
  btnUpload.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Mengupload...';
  showUploadMessage("Mengupload file...", "info");

  try {
    const response = await fetch(`${API.pembayaran}${currentPaymentId}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${access}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Gagal mengupload bukti");
    }

    showUploadMessage("✅ Bukti pembayaran berhasil diupload!", "success");
    renderPaymentPage();
    closeUploadModal();
    btnUpload.innerHTML = '<i class="bi bi-check-circle me-2"></i>Terupload';

    // Refresh data setelah upload sukses
    setTimeout(async () => {
      showAlert(
        "success",
        "Bukti transfer berhasil diupload. Status akan diperiksa oleh admin."
      );

      closeUploadModal();

      // Refresh data pembayaran dan summary
      await loadPaymentSummary();
      await loadPembayaran();

      // Update status di UI
      document.getElementById("paymentStatus").textContent =
        "Menunggu Konfirmasi";
      document.getElementById("paymentStatus").className =
        "h4 fw-bold text-warning";
    }, 2000);
  } catch (error) {
    console.error("Upload error:", error);
    showUploadMessage(`❌ Gagal upload: ${error.message}`, "error");
    btnUpload.disabled = false;
    btnUpload.innerHTML = btnOriginal;
  }
};

window.closeUploadModal = function () {
  const modal = document.getElementById("uploadModal");
  if (modal) {
    modal.remove();
  }
  // JANGAN reset currentPaymentId di sini, karena masih mungkin dibutuhkan
};

window.skipUpload = function () {
  showConfirmModal(
    "Upload Bukti Transfer",
    "Anda yakin ingin melewati upload bukti?<br><br>Anda dapat upload bukti transfer nanti melalui menu riwayat pembayaran.",
    "Ya, Lewati",
    "warning"
  ).then(async (confirmed) => {
    await Promise.all([loadPembayaran(), loadPaymentSummary()]);
    if (confirmed) {
      closeUploadModal();
      showAlert(
        "info",
        `Pembayaran berhasil dibuat (ID: ${currentPaymentId}).<br>Jangan lupa upload bukti transfer nanti.`
      );
      currentPaymentId = null;
    }
  });
};

window.previewUploadFile = function (file) {
  const preview = document.getElementById("uploadPreview");
  const btnUpload = document.getElementById("btnUpload");

  if (file.size > 5 * 1024 * 1024) {
    showUploadMessage("File terlalu besar. Maksimal 5MB", "error");
    return;
  }

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
  ];
  if (!allowedTypes.includes(file.type)) {
    showUploadMessage(
      "Format file tidak didukung. Gunakan JPG, PNG, atau PDF",
      "error"
    );
    return;
  }

  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.innerHTML = `
                <div class="text-center">
                    <img src="${
                      e.target.result
                    }" alt="Preview" class="img-fluid rounded" style="max-height: 200px;">
                    <div class="mt-2">
                        <strong class="d-block">${file.name}</strong>
                        <small class="text-muted">${(file.size / 1024).toFixed(
                          1
                        )} KB</small>
                    </div>
                </div>
            `;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = `
            <div class="text-center">
                <i class="bi bi-file-earmark-pdf display-1 text-danger mb-2"></i>
                <div class="mt-2">
                    <strong class="d-block">${file.name}</strong>
                    <small class="text-muted">${(file.size / 1024).toFixed(
                      1
                    )} KB - PDF</small>
                </div>
            </div>
        `;
  }

  btnUpload.disabled = false;
  btnUpload.innerHTML = '<i class="bi bi-cloud-upload me-2"></i>Upload Bukti';
  showUploadMessage("File siap diupload", "success");
};

window.showUploadMessage = function (message, type = "info") {
  const uploadMessage = document.getElementById("uploadMessage");
  if (!uploadMessage) return;

  uploadMessage.innerHTML = `
        <div class="alert alert-${type} mb-0">
            <i class="bi bi-${
              type === "error"
                ? "exclamation-triangle"
                : type === "success"
                ? "check-circle"
                : "info-circle"
            } me-2"></i>
            ${message}
        </div>
    `;
};

// Fungsi untuk menampilkan detail pembayaran
// PERBAIKAN: Fungsi untuk menampilkan detail pembayaran dengan error handling
window.showPaymentDetailForAnggota = async function (paymentId) {
  try {
    console.log("🔍 Fetching payment detail for ID:", paymentId);

    // Cek format ID, jika hanya angka, tambahkan prefix
    let apiUrl = `${API.pembayaran}${paymentId}/`;

    console.log("🔗 API URL:", apiUrl);

    const response = await fetch(apiUrl, {
      headers: getAuthHeaders(),
    });

    console.log("📊 Response status:", response.status);

    if (!response.ok) {
      if (response.status === 404) {
        // Coba format lain jika 404
        const altUrl = `${API.pembayaran}?id=${paymentId}`;
        console.log("🔄 Trying alternative URL:", altUrl);

        const altResponse = await fetch(altUrl, {
          headers: getAuthHeaders(),
        });

        if (altResponse.ok) {
          const altData = await altResponse.json();
          if (Array.isArray(altData) && altData.length > 0) {
            // Ambil data pertama dari array
            showPaymentDetailSimplified(altData[0]);
            return;
          }
        }
      }
      throw new Error(
        `HTTP ${response.status}: Gagal mengambil detail pembayaran`
      );
    }

    const paymentData = await response.json();
    console.log("✅ Payment data received:", paymentData);

    // Panggil fungsi showPaymentDetail dari modul lain
    if (typeof showPaymentDetail === "function") {
      showPaymentDetail(paymentData);
    } else {
      // Fallback jika modul tidak ada
      showPaymentDetailSimplified(paymentData);
    }
  } catch (error) {
    console.error("❌ Error loading payment detail:", error);
    showAlert("danger", `Gagal memuat detail pembayaran: ${error.message}`);
  }
};

// Fallback function jika showPaymentDetail tidak ada
function showPaymentDetailSimplified(paymentData) {
  const modal = document.createElement("div");
  modal.id = "detailModal";
  modal.innerHTML = `
        <div class="modal fade show" style="display: block; background: rgba(0,0,0,0.5);" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-receipt me-2"></i>Detail Pembayaran
                        </h5>
                        <button type="button" class="btn-close btn-close-white" onclick="document.getElementById('detailModal').remove()"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <h6 class="alert-heading">Informasi Pembayaran</h6>
                        </div>
                        
                        <table class="table table-borderless">
                            <tr>
                                <td width="40%"><strong>ID Pembayaran</strong></td>
                                <td>#${
                                  paymentData.idPembayaran ||
                                  paymentData.id ||
                                  "N/A"
                                }</td>
                            </tr>
                            <tr>
                                <td><strong>Tanggal</strong></td>
                                <td>${formatDate(
                                  paymentData.tanggalBayar ||
                                    paymentData.created_at
                                )}</td>
                            </tr>
                            <tr>
                                <td><strong>Jumlah</strong></td>
                                <td class="fw-bold text-success">
                                    Rp ${parseInt(
                                      paymentData.jumlahBayar ||
                                        paymentData.nominal ||
                                        0
                                    ).toLocaleString("id-ID")}
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Metode</strong></td>
                                <td>
                                    ${
                                      paymentData.metodeBayar ===
                                      "bank_transfer"
                                        ? "Transfer Bank"
                                        : paymentData.metodeBayar === "cash"
                                        ? "Tunai"
                                        : paymentData.metodeBayar || "N/A"
                                    }
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Status</strong></td>
                                <td>
                                    ${getPaymentStatusBadge(
                                      paymentData.statusBayar ||
                                        paymentData.status
                                    )}
                                </td>
                            </tr>
                        </table>
                        
                        ${
                          paymentData.bukti_bayar || paymentData.buktiBayar
                            ? `
                        <div class="mt-4">
                            <h6><i class="bi bi-image me-2"></i>Bukti Pembayaran</h6>
                            <div class="text-center">
                                <img src="${
                                  paymentData.bukti_bayar ||
                                  paymentData.buktiBayar
                                }" 
                                     class="img-fluid rounded border" 
                                     style="max-height: 200px;" 
                                     alt="Bukti Bayar">
                                <div class="mt-2">
                                    <a href="${
                                      paymentData.bukti_bayar ||
                                      paymentData.buktiBayar
                                    }" 
                                       target="_blank" 
                                       class="btn btn-sm btn-outline-primary">
                                        <i class="bi bi-box-arrow-up-right me-1"></i>Buka Full Size
                                    </a>
                                </div>
                            </div>
                        </div>
                        `
                            : ""
                        }
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" onclick="document.getElementById('detailModal').remove()">
                            <i class="bi bi-x-circle me-2"></i>Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(modal);
}

// Helper function untuk status badge
function getPaymentStatusBadge(status) {
  const statusMap = {
    success: { text: "Lunas", class: "bg-success" },
    lunas: { text: "Lunas", class: "bg-success" },
    pending: { text: "Pending", class: "bg-warning" },
    failed: { text: "Gagal", class: "bg-danger" },
    gagal: { text: "Gagal", class: "bg-danger" },
  };

  const statusInfo = statusMap[status?.toLowerCase()] || {
    text: status || "Unknown",
    class: "bg-secondary",
  };

  return `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
}
