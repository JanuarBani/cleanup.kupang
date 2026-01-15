export function landingPage() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- NAVBAR -->
    <nav class="navbar navbar-expand-lg navbar-dark fixed-top" 
         style="background: rgba(27, 94, 32, 0.95); backdrop-filter: blur(10px);">
      <div class="container">
        <a class="navbar-brand fw-bold d-flex align-items-center" href="#" id="logoHome">
          <!-- LOGO di Navbar -->
          <div class="me-2">
            <img src="/logo/logo_3d.png" 
                 alt="CleanUp Kupang Logo" 
                 style="height: 40px; width: auto;">
          </div>
          CleanUp Kupang
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <a class="nav-link" href="#hero" data-section="hero">Beranda</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#fitur" data-section="fitur">Fitur</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#harga" data-section="harga">Harga</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#tentang" data-section="tentang">Tentang</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#kontak" data-section="kontak">Kontak</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#/analisis-dampak">
                <i class="bi bi-graph-up me-1"></i> Analisis
              </a>
            </li>
            <li class="nav-item ms-2">
              <a href="#/login" class="btn btn-warning btn-sm" id="loginBtn">
                <i class="bi bi-box-arrow-in-right me-1"></i> Login
              </a>
            </li>
            <li class="nav-item ms-2">
              <a href="#/register" class="btn btn-outline-light btn-sm" id="registerBtn">
                <i class="bi bi-person-plus me-1"></i> Daftar
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- HERO SECTION -->
    <section id="hero" class="text-white position-relative" 
             style="background: linear-gradient(135deg, #1b5e20 0%, #4caf50 100%); padding-top: 80px;">
      <div class="container py-5">
        <div class="row align-items-center">
          <div class="col-lg-6">
            <!-- LOGO di Hero Section -->
            <div class="d-flex align-items-center mb-3">
              <div class="me-3">
                <img src="/logo/logo_3d.png" 
                     alt="CleanUp Kupang Logo" 
                     style="height: 60px; width: auto;">
              </div>
              <h1 class="display-4 fw-bold mb-0 animate__animated animate__fadeInUp">
                CleanUp Kupang
              </h1>
            </div>
            <p class="lead mb-4 animate__animated animate__fadeInUp animate__delay-1s">
              Layanan Angkut Sampah Rumah Tangga Langsung ke TPA
            </p>
            <p class="mb-4 animate__animated animate__fadeInUp animate__delay-2s">
              Daftar sebagai anggota CleanUp Kupang, atur lokasi & jadwal sendiri,
              dan nikmati layanan angkut sampah rumah tangga langsung ke TPA resmi.
            </p>
            <div class="d-flex flex-wrap gap-3 animate__animated animate__fadeInUp animate__delay-3s">
              <a href="#/register-anggota" class="btn btn-warning btn-lg px-4" id="heroRegisterBtn">
                <i class="bi bi-star-fill me-1"></i> Gabung Sekarang
              </a>
            </div>
            <div class="mt-4 d-flex align-items-center text-white-50 animate__animated animate__fadeInUp animate__delay-4s">
              <i class="bi bi-shield-check me-2"></i>
              <small>Terpercaya • Terlisensi • Ramah Lingkungan</small>
            </div>
          </div>
          <div class="col-lg-6 text-center mt-5 mt-lg-0 animate__animated animate__fadeIn">
            <div class="position-relative">
              <!-- Container dengan efek modern -->
              <div class="position-relative d-inline-block">
                <!-- Background gradient dengan efek blur -->
                <div class="position-absolute top-50 start-50 translate-middle bg-success bg-opacity-10 rounded-circle" 
                    style="width: 200px; height: 200px; filter: blur(20px);"></div>
                
                <!-- Main logo container dengan border gradient -->
                <div class="position-relative rounded-4 p-4 shadow-lg" 
                    style="
                      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                      border: 2px solid rgba(25, 135, 84, 0.1);
                      width: 240px;
                      height: 240px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    ">
                  
                  <!-- Logo dengan efek shadow -->
                  <div class="position-relative">
                    <img src="/logo/logo_3d.png" 
                        alt="CleanUp Kupang Logo" 
                        class="img-fluid"
                        style="
                          height: 160px;
                          width: auto;
                          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
                          transition: transform 0.3s ease;
                        ">
                    
                    <!-- Glow effect -->
                    <div class="position-absolute top-50 start-50 translate-middle bg-success bg-opacity-25 rounded-circle" 
                        style="width: 180px; height: 180px; z-index: -1; filter: blur(15px);"></div>
                  </div>
                  
                  <!-- Decorative elements -->
                  <div class="position-absolute top-0 start-0 translate-middle bg-success rounded-circle p-2 shadow-sm"
                      style="width: 40px; height: 40px;">
                    <i class="bi bi-recycle text-white"></i>
                  </div>
                  
                  <div class="position-absolute top-0 end-0 translate-middle bg-warning rounded-circle p-2 shadow-sm"
                      style="width: 40px; height: 40px;">
                    <i class="bi bi-tree text-white"></i>
                  </div>
                  
                  <div class="position-absolute bottom-0 start-0 translate-middle bg-info rounded-circle p-2 shadow-sm"
                      style="width: 40px; height: 40px;">
                    <i class="bi bi-truck text-white"></i>
                  </div>
                  
                  <div class="position-absolute bottom-0 end-0 translate-middle bg-danger rounded-circle p-2 shadow-sm"
                      style="width: 40px; height: 40px;">
                    <i class="bi bi-trash text-white"></i>
                  </div>
                </div>
                
                <!-- Floating truck icon dengan animasi -->
                <div class="position-absolute top-0 start-50 translate-middle-x mt-4">
                  <div class="bg-success text-white rounded-circle p-3 shadow-lg animate__animated animate__bounceIn animate__delay-2s"
                      style="
                        width: 70px;
                        height: 70px;
                        animation: float 3s ease-in-out infinite;
                      ">
                    <i class="bi bi-truck" style="font-size: 2rem;"></i>
                  </div>
                </div>
              </div>
              
              <!-- Text label di bawah logo -->
              <div class="mt-5 animate__animated animate__fadeInUp animate__delay-1s">
                <div class="d-flex justify-content-center align-items-center gap-3 mb-3">
                  <div class="bg-success bg-opacity-25 px-3 py-1 rounded-pill">
                    <small class="text-warning fw-bold">
                      <i class="bi bi-shield-check me-1"></i>Terlisensi Resmi
                    </small>
                  </div>
                  <div class="bg-warning bg-opacity-25 px-3 py-1 rounded-pill">
                    <small class="text-warning fw-bold">
                      <i class="bi bi-star-fill me-1"></i>Rating 4.9/5.0
                    </small>
                  </div>
                </div>
                
                <h5 class="text-warning fw-bold mb-2">Solusi Sampah Terpercaya</h5>
                <p class="text-muted small mx-auto" style="max-width: 300px;">
                  Melayani 150+ anggota dengan 4.000+ pengangkutan sukses
                </p>
              </div>
            </div>
          </div>

          <!-- Tambahkan style untuk animasi float -->
          <style>
            @keyframes float {
              0%, 100% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(-10px);
              }
            }
            
            .hero-logo-container:hover img {
              transform: scale(1.05);
            }
          </style>
        </div>
      </div>
      <div class="wave-divider">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
                opacity=".25" fill="#ffffff"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
                opacity=".5" fill="#ffffff"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="#ffffff"></path>
        </svg>
      </div>
    </section>

    <!-- STATS SECTION -->
    <section class="bg-light py-4">
      <div class="container">
        <div class="row text-center g-4">
          <div class="col-md-3 col-6">
            <div class="card border-0 bg-transparent">
              <div class="card-body">
                <h3 class="text-success fw-bold display-6">150+</h3>
                <p class="text-muted mb-0">Anggota Aktif</p>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-6">
            <div class="card border-0 bg-transparent">
              <div class="card-body">
                <h3 class="text-success fw-bold display-6">4,000+</h3>
                <p class="text-muted mb-0">Pengangkutan</p>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-6">
            <div class="card border-0 bg-transparent">
              <div class="card-body">
                <h3 class="text-success fw-bold display-6">100%</h3>
                <p class="text-muted mb-0">Ke TPA</p>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-6">
            <div class="card border-0 bg-transparent">
              <div class="card-body">
                <h3 class="text-success fw-bold display-6">24/7</h3>
                <p class="text-muted mb-0">Layanan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FITUR SECTION -->
    <section id="fitur" class="py-5">
      <div class="container">
        <div class="text-center mb-5">
          <span class="badge bg-success bg-opacity-10 text-success mb-3 px-3 py-2">
            <i class="bi bi-stars me-1"></i>Fitur Unggulan
          </span>
          <div class="d-flex justify-content-center align-items-center mb-3">
            <div class="me-3">
              <img src="/logo/logo_3d.png" 
                   alt="CleanUp Kupang Logo" 
                   style="height: 40px; width: auto;">
            </div>
            <h2 class="fw-bold display-5 mb-0">Mengapa Memilih CleanUp Kupang?</h2>
          </div>
          <p class="text-muted lead mx-auto" style="max-width: 600px;">
            Kami memberikan solusi lengkap untuk masalah sampah rumah tangga Anda
          </p>
        </div>
        
        <div class="row g-4">
          <div class="col-lg-4 col-md-6">
            <div class="card border-0 shadow-sm h-100 hover-lift">
              <div class="card-body p-4 text-center">
                <div class="bg-success bg-opacity-10 rounded-circle p-4 d-inline-block mb-4">
                  <i class="bi bi-truck text-success" style="font-size: 2.5rem;"></i>
                </div>
                <h4 class="card-title fw-bold mb-3">Angkut Langsung</h4>
                <p class="card-text text-muted">
                  Sampah dijemput langsung di depan rumah Anda tanpa perlu mengantarkan ke TPS.
                </p>
                <ul class="list-unstyled text-start mt-4">
                  <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i>Jadwal fleksibel</li>
                  <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i>Armada lengkap</li>
                  <li><i class="bi bi-check-circle-fill text-success me-2"></i>Petugas profesional</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="col-lg-4 col-md-6">
            <div class="card border-0 shadow-sm h-100 hover-lift">
              <div class="card-body p-4 text-center">
                <div class="bg-success bg-opacity-10 rounded-circle p-4 d-inline-block mb-4">
                  <i class="bi bi-map text-success" style="font-size: 2.5rem;"></i>
                </div>
                <h4 class="card-title fw-bold mb-3">Laporan Real-time</h4>
                <p class="card-text text-muted">
                  Laporkan titik sampah dengan peta interaktif dan pantau statusnya secara real-time.
                </p>
                <ul class="list-unstyled text-start mt-4">
                  <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i>GPS tracking</li>
                  <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i>Foto bukti</li>
                  <li><i class="bi bi-check-circle-fill text-success me-2"></i>Notifikasi status</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="col-lg-4 col-md-6">
            <div class="card border-0 shadow-sm h-100 hover-lift">
              <div class="card-body p-4 text-center">
                <div class="bg-success bg-opacity-10 rounded-circle p-4 d-inline-block mb-4">
                  <i class="bi bi-recycle text-success" style="font-size: 2.5rem;"></i>
                </div>
                <h4 class="card-title fw-bold mb-3">Ramah Lingkungan</h4>
                <p class="card-text text-muted">
                  Bersama menjaga Kota Kupang tetap bersih dengan pengelolaan sampah yang bertanggung jawab.
                </p>
                <ul class="list-unstyled text-start mt-4">
                  <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i>Sampah ke TPA</li>
                  <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i>Edukasi lingkungan</li>
                  <li><i class="bi bi-check-circle-fill text-success me-2"></i>Komunitas peduli</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section class="bg-light py-5">
      <div class="container">
        <div class="text-center mb-5">
          <span class="badge bg-warning bg-opacity-10 text-warning mb-3 px-3 py-2">
            <i class="bi bi-lightning-charge me-1"></i>Cara Kerja
          </span>
          <div class="d-flex justify-content-center align-items-center mb-3">
            <div class="me-3">
              <img src="/logo/logo_3d.png" 
                   alt="CleanUp Kupang Logo" 
                   style="height: 40px; width: auto;">
            </div>
            <h2 class="fw-bold display-5 mb-0">Hanya 3 Langkah Mudah</h2>
          </div>
          <p class="text-muted lead mx-auto" style="max-width: 600px;">
            Mulai dari daftar hingga sampah terangkut, semudah itu!
          </p>
        </div>
        
        <div class="row align-items-center">
          <div class="col-lg-4 mb-4">
            <div class="card border-0 bg-white shadow-sm p-4">
              <div class="position-relative">
                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center" 
                     style="width: 60px; height: 60px; font-size: 1.5rem; position: absolute; top: -30px; left: 50%; transform: translateX(-50%);">
                  1
                </div>
              </div>
              <div class="card-body text-center pt-5">
                <h4 class="fw-bold mb-3">Daftar & Login</h4>
                <p class="text-muted mb-0">
                  Daftar akun, tentukan lokasi rumah via GPS, dan langsung aktif sebagai anggota.
                </p>
              </div>
            </div>
          </div>
          
          <div class="col-lg-4 mb-4">
            <div class="card border-0 bg-white shadow-sm p-4">
              <div class="position-relative">
                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center" 
                     style="width: 60px; height: 60px; font-size: 1.5rem; position: absolute; top: -30px; left: 50%; transform: translateX(-50%);">
                  2
                </div>
              </div>
              <div class="card-body text-center pt-5">
                <h4 class="fw-bold mb-3">Atur Jadwal</h4>
                <p class="text-muted mb-0">
                  Pilih jadwal pengangkutan langsung dari aplikasi tanpa perlu konfirmasi manual.
                </p>
              </div>
            </div>
          </div>
          
          <div class="col-lg-4 mb-4">
            <div class="card border-0 bg-white shadow-sm p-4">
              <div class="position-relative">
                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center" 
                     style="width: 60px; height: 60px; font-size: 1.5rem; position: absolute; top: -30px; left: 50%; transform: translateX(-50%);">
                  3
                </div>
              </div>
              <div class="card-body text-center pt-5">
                <h4 class="fw-bold mb-3">Sampah ke TPA</h4>
                <p class="text-muted mb-0">
                  Sampah langsung dibawa ke TPA dengan pengelolaan yang bertanggung jawab.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- PRICING SECTION -->
    <section id="harga" class="py-5">
      <div class="container">
        <div class="text-center mb-5">
          <span class="badge bg-info bg-opacity-10 text-info mb-3 px-3 py-2">
            <i class="bi bi-tags me-1"></i>Harga Terjangkau
          </span>
          <div class="d-flex justify-content-center align-items-center mb-3">
            <div class="me-3">
              <img src="/logo/logo_3d.png" 
                   alt="CleanUp Kupang Logo" 
                   style="height: 40px; width: auto;">
            </div>
            <h2 class="fw-bold display-5 mb-0">Paket Layanan CleanUp</h2>
          </div>
          <p class="text-muted lead mx-auto" style="max-width: 600px;">
            Investasi kecil untuk lingkungan bersih dan nyaman
          </p>
        </div>
        
        <div class="row justify-content-center">
          <div class="col-lg-8">
            <div class="card border-0 shadow-lg overflow-hidden">
              <div class="card-header bg-success text-white text-center py-4">
                <h3 class="fw-bold mb-1">Paket Bulanan</h3>
                <div class="display-4 fw-bold">Rp 50.000</div>
                <small class="opacity-75">
                  per bulan • akun langsung aktif setelah daftar
                </small>
              </div>
              <div class="card-body p-0">
                <div class="row g-0">
                  <div class="col-md-6 p-4">
                    <h5 class="fw-bold text-success mb-4">
                      <i class="bi bi-check-circle me-2"></i>Yang Anda Dapatkan:
                    </h5>
                    <ul class="list-unstyled mb-4">
                      <li class="mb-3"><i class="bi bi-check-lg text-success me-2"></i>4x pengangkutan per bulan</li>
                      <li class="mb-3"><i class="bi bi-check-lg text-success me-2"></i>Jemput depan rumah</li>
                      <li class="mb-3"><i class="bi bi-check-lg text-success me-2"></i>Sampah langsung ke TPA</li>
                      <li class="mb-3"><i class="bi bi-check-lg text-success me-2"></i>Akses aplikasi premium</li>
                      <li><i class="bi bi-check-lg text-success me-2"></i>Prioritas layanan</li>
                    </ul>
                  </div>
                  <div class="col-md-6 bg-light p-4">
                    <h5 class="fw-bold text-success mb-4">
                      <i class="bi bi-star me-2"></i>Bonus Tambahan:
                    </h5>
                    <ul class="list-unstyled mb-4">
                      <li class="mb-3"><i class="bi bi-gift text-success me-2"></i>Gratis edukasi pengelolaan sampah</li>
                      <li class="mb-3"><i class="bi bi-gift text-success me-2"></i>Diskon produk ramah lingkungan</li>
                      <li class="mb-3"><i class="bi bi-gift text-success me-2"></i>Kartu anggota eksklusif</li>
                      <li><i class="bi bi-gift text-success me-2"></i>Update newsletter lingkungan</li>
                    </ul>
                    <div class="text-center mt-4">
                      <a href="#/register-anggota" class="btn btn-success btn-lg w-100 py-3 fw-bold" id="pricingRegisterBtn">
                        <i class="bi bi-arrow-right-circle me-2"></i>Daftar Sekarang
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="alert alert-success mt-4 text-center">
              <div class="d-flex align-items-center justify-content-center">
                <div class="me-3">
                  <img src="/logo/logo_3d.png" 
                       alt="CleanUp Kupang Logo" 
                       style="height: 30px; width: auto;">
                </div>
                <div>
                  <strong>Garansi Kepuasan:</strong> 100% uang kembali jika tidak puas dengan layanan kami
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TENTANG SECTION -->
    <section id="tentang" class="py-5">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-lg-6 mb-5 mb-lg-0">
            <span class="badge bg-success bg-opacity-10 text-success mb-3 px-3 py-2">
              <i class="bi bi-info-circle me-1"></i>Tentang Kami
            </span>
            <div class="d-flex align-items-center mb-4">
              <div class="me-3">
                <img src="/logo/logo_3d.png" 
                     alt="CleanUp Kupang Logo" 
                     style="height: 100px; width: auto;">
              </div>
              <h2 class="fw-bold display-5 mb-0">CleanUp Kupang - Peduli Lingkungan</h2>
            </div>
            <p class="lead mb-4">
              Kami mulai dari kesadaran melihat <strong class="text-success">SAMPAH KOTA KUPANG</strong> yang semakin parah setiap hari.
            </p>
            <p class="mb-4">
              Didirikan tahun 2025, CleanUp Kupang hadir sebagai solusi untuk masalah sampah rumah tangga. 
              Dengan motto <strong>"Kaka Buang, Beta Angkut"</strong>, kami berkomitmen memberikan layanan terbaik untuk 
              lingkungan yang lebih bersih dan sehat.
            </p>
            <div class="row">
              <div class="col-6 mb-3">
                <div class="d-flex align-items-center">
                  <div class="bg-success bg-opacity-10 p-2 rounded me-3">
                    <i class="bi bi-award text-success"></i>
                  </div>
                  <div>
                    <h6 class="fw-bold mb-0">Terlisensi Resmi</h6>
                    <small class="text-muted">Izin pengangkutan sampah</small>
                  </div>
                </div>
              </div>
              <div class="col-6 mb-3">
                <div class="d-flex align-items-center">
                  <div class="bg-success bg-opacity-10 p-2 rounded me-3">
                    <i class="bi bi-tree text-success"></i>
                  </div>
                  <div>
                    <h6 class="fw-bold mb-0">Ramah Lingkungan</h6>
                    <small class="text-muted">Sampah ke TPA terdaftar</small>
                  </div>
                </div>
              </div>
              <div class="col-6 mb-3">
                <div class="d-flex align-items-center">
                  <div class="bg-success bg-opacity-10 p-2 rounded me-3">
                    <i class="bi bi-people text-success"></i>
                  </div>
                  <div>
                    <h6 class="fw-bold mb-0">Komunitas Besar</h6>
                    <small class="text-muted">100+ anggota aktif</small>
                  </div>
                </div>
              </div>
              <div class="col-6 mb-3">
                <div class="d-flex align-items-center">
                  <div class="bg-success bg-opacity-10 p-2 rounded me-3">
                    <i class="bi bi-shield-check text-success"></i>
                  </div>
                  <div>
                    <h6 class="fw-bold mb-0">Terpercaya</h6>
                    <small class="text-muted">Rating 4.9/5.0</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="position-relative">
              <div class="bg-success bg-opacity-10 rounded-3 p-5">
                <div class="text-center mb-4">
                  <div class="mb-3">
                    <img src="/logo/logo_3d.png" 
                         alt="CleanUp Kupang Logo" 
                         style="height: 60px; width: auto;">
                  </div>
                  <i class="bi bi-quote display-1 text-success opacity-25"></i>
                </div>
                <blockquote class="blockquote text-center">
                  <p class="fs-4 fst-italic mb-4">
                    "Bersama CleanUp, kita bukan hanya membuang sampah, tapi membangun Kota Kupang yang lebih bersih untuk generasi mendatang."
                  </p>
                  <footer class="blockquote-footer mt-3">
                    <strong>Tim CleanUp Kupang</strong>
                  </footer>
                </blockquote>
                <div class="text-center mt-4">
                  <div class="badge bg-success px-3 py-2 mb-2">"INGAT SAMPAH INGAT CLEANUP"</div>
                  <div class="badge bg-warning text-dark px-3 py-2">EST 2025</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CONTACT SECTION -->
    <section id="kontak" class="py-5 bg-light">
      <div class="container">
        <div class="text-center mb-5">
          <span class="badge bg-info bg-opacity-10 text-info mb-3 px-3 py-2">
            <i class="bi bi-telephone me-1"></i>Kontak Kami
          </span>
          <div class="d-flex justify-content-center align-items-center mb-3">
            <div class="me-3">
              <img src="/logo/logo_3d.png" 
                   alt="CleanUp Kupang Logo" 
                   style="height: 40px; width: auto;">
            </div>
            <h2 class="fw-bold display-5 mb-0">Hubungi CleanUp Kupang</h2>
          </div>
          <p class="text-muted lead mx-auto" style="max-width: 600px;">
            Kami siap membantu Anda dengan layanan terbaik
          </p>
        </div>
        
        <div class="row">
          <div class="col-lg-4 mb-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body p-4 text-center">
                <div class="bg-success bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                  <i class="bi bi-whatsapp text-success fs-2"></i>
                </div>
                <h5 class="fw-bold mb-3">WhatsApp</h5>
                <p class="text-muted mb-3">Chat langsung dengan tim kami</p>
                <a href="https://wa.me/6282341743886" target="_blank" 
                   class="btn btn-success w-100">
                  <i class="bi bi-whatsapp me-2"></i>082-341-743-886
                </a>
              </div>
            </div>
          </div>
          
          <div class="col-lg-4 mb-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body p-4 text-center">
                <div class="bg-success bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                  <i class="bi bi-envelope text-success fs-2"></i>
                </div>
                <h5 class="fw-bold mb-3">Email</h5>
                <p class="text-muted mb-3">Untuk pertanyaan formal</p>
                <a href="mailto:admin@cleanupkupang.id" 
                   class="btn btn-outline-success w-100">
                  <i class="bi bi-envelope me-2"></i>admin@cleanupkupang.id
                </a>
              </div>
            </div>
          </div>
          
          <div class="col-lg-4 mb-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body p-4 text-center">
                <div class="bg-success bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                  <i class="bi bi-clock text-success fs-2"></i>
                </div>
                <h5 class="fw-bold mb-3">Jam Operasional</h5>
                <p class="text-muted mb-3">Senin - Rabu</p>
                <div class="bg-light p-3 rounded">
                  <p class="mb-0 fw-bold">08:00 - 18:00 WITA</p>
                  <small class="text-muted">Kami selalu siap melayani</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- FOOTER -->
    <footer class="bg-dark text-white py-5">
      <div class="container">
        <div class="row">
          <div class="col-lg-4 mb-4">
            <div class="d-flex align-items-center mb-4">
              <div class="me-3">
                <img src="/logo/logo_3d.png" 
                     alt="CleanUp Kupang Logo" 
                     style="height: 50px; width: auto;">
              </div>
              <h4 class="fw-bold mb-0">CleanUp Kupang</h4>
            </div>
            <p class="text-white-50 mb-4">
              Layanan angkut sampah rumah tangga langsung ke TPA. Bersama menjaga Kota Kupang tetap bersih.
            </p>
            <div class="d-flex gap-3">
              <a href="https://instagram.com/cleanUp_officiall" target="_blank" class="text-white text-decoration-none">
                <i class="bi bi-instagram fs-5"></i>
              </a>
              <a href="https://facebook.com/CleanUpKupang" target="_blank" class="text-white text-decoration-none">
                <i class="bi bi-facebook fs-5"></i>
              </a>
              <a href="https://www.tiktok.com/@cleanp.kupang5" target="_blank" class="text-white text-decoration-none">
                <i class="bi bi-tiktok fs-5"></i>
              </a>
            </div>
          </div>
          
          <div class="col-lg-2 col-6 mb-4">
            <h6 class="fw-bold mb-4">Menu</h6>
            <ul class="list-unstyled">
              <li class="mb-2"><a href="#hero" class="text-white-50 text-decoration-none" data-section="hero">Beranda</a></li>
              <li class="mb-2"><a href="#fitur" class="text-white-50 text-decoration-none" data-section="fitur">Fitur</a></li>
              <li class="mb-2"><a href="#harga" class="text-white-50 text-decoration-none" data-section="harga">Harga</a></li>
              <li class="mb-2"><a href="#tentang" class="text-white-50 text-decoration-none" data-section="tentang">Tentang</a></li>
              <li><a href="#kontak" class="text-white-50 text-decoration-none" data-section="kontak">Kontak</a></li>
            </ul>
          </div>
          
          <div class="col-lg-3 col-6 mb-4">
            <h6 class="fw-bold mb-4">Layanan</h6>
            <ul class="list-unstyled">
              <li class="mb-2"><a href="#/register" class="text-white-50 text-decoration-none" id="footerRegisterBtn">Daftar Anggota</a></li>
              <li class="mb-2"><a href="#/login" class="text-white-50 text-decoration-none" id="footerLoginBtn">Login</a></li>
              <li class="mb-2"><a href="#/laporan" class="text-white-50 text-decoration-none">Lapor Sampah</a></li>
              <li><a href="#/bantuan" class="text-white-50 text-decoration-none">Bantuan</a></li>
            </ul>
          </div>
          
          <div class="col-lg-3 mb-4">
            <h6 class="fw-bold mb-4">Kontak</h6>
            <ul class="list-unstyled">
              <li class="mb-3">
                <i class="bi bi-telephone text-success me-2"></i>
                <span class="text-white-50">082-341-743-886</span>
              </li>
              <li class="mb-3">
                <i class="bi bi-envelope text-success me-2"></i>
                <span class="text-white-50">admin@cleanupkupang.id</span>
              </li>
              <li>
                <i class="bi bi-clock text-success me-2"></i>
                <span class="text-white-50">Senin - Rabu: 08:00-18:00 WITA</span>
              </li>
            </ul>
          </div>
        </div>
        
        <hr class="text-white-50 my-4">
        
        <div class="row">
          <div class="col-md-6">
            <p class="text-white-50 mb-0">
              © 2025 CleanUp Kupang · "Kaka Buang, Beta Angkut"
            </p>
          </div>
          <div class="col-md-6 text-md-end">
            <div class="d-flex flex-wrap justify-content-md-end gap-3">
              <a href="#/syarat-ketentuan" class="text-white-50 text-decoration-none small">Syarat & Ketentuan</a>
              <a href="#/kebijakan-privasi" class="text-white-50 text-decoration-none small">Kebijakan Privasi</a>
              <a href="#/faq" class="text-white-50 text-decoration-none small">FAQ</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
    
    <!-- Back to Top Button -->
    <button id="backToTop" class="btn btn-success position-fixed bottom-3 end-3 rounded-circle shadow-lg" 
            style="width: 50px; height: 50px; display: none;">
      <i class="bi bi-arrow-up"></i>
    </button>
    
    <!-- Bootstrap JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
    <!-- Animate.css -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
    
    <!-- Custom CSS -->
    <style>
      :root {
        --bs-success: #198754;
        --bs-success-rgb: 25, 135, 84;
      }
      
      html {
        scroll-behavior: smooth;
      }
      
      .navbar {
        transition: all 0.3s ease;
      }
      
      .navbar.scrolled {
        background: rgba(27, 94, 32, 0.95) !important;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
      
      .wave-divider {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        overflow: hidden;
        line-height: 0;
      }
      
      .wave-divider svg {
        position: relative;
        display: block;
        width: calc(100% + 1.3px);
        height: 100px;
      }
      
      .hover-lift {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      
      .hover-lift:hover {
        transform: translateY(-10px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
      }
      
      .accordion-button:not(.collapsed) {
        background-color: rgba(25, 135, 84, 0.05) !important;
        color: var(--bs-success) !important;
        border-color: var(--bs-success) !important;
      }
      
      .accordion-button:focus {
        box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25) !important;
        border-color: var(--bs-success) !important;
      }
      
      @media (max-width: 768px) {
        .display-4 {
          font-size: 2.5rem;
        }
        
        .lead {
          font-size: 1.1rem;
        }
        
        .logo-in-section {
          height: 30px !important;
        }
      }
    </style>
  `;

  // Setup event handlers setelah DOM di-render
  setTimeout(setupLandingPageEvents, 100);
}

// Setup event handlers khusus untuk landing page
function setupLandingPageEvents() {
  console.log("🔧 Setting up landing page event handlers...");

  // Bersihkan event listener sebelumnya jika ada
  cleanupLandingPageEvents();

  // 1. Navbar logo - kembali ke beranda (top)
  const logoHome = document.getElementById("logoHome");
  if (logoHome) {
    logoHome.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  // 2. Link internal (anchor links) - smooth scroll
  document
    .querySelectorAll('a[href^="#"]:not([href^="#/"])')
    .forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        const href = this.getAttribute("href");

        // Skip jika href adalah # saja
        if (href === "#") return;

        // Jika internal anchor link (bukan route)
        if (href.startsWith("#") && !href.startsWith("#/")) {
          e.preventDefault();

          const targetElement = document.querySelector(href);
          if (targetElement) {
            const offset = 80;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition =
              elementPosition + window.pageYOffset - offset;

            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            });

            // Update active nav
            updateActiveNav(href.substring(1));
          }
        }
      });
    });

  // 3. Link route (login/register) - langsung navigate
  const routeButtons = [
    "loginBtn",
    "registerBtn",
    "heroRegisterBtn",
    "learnMoreBtn",
    "pricingRegisterBtn",
    "ctaRegisterBtn",
    "footerRegisterBtn",
    "footerLoginBtn",
  ];

  routeButtons.forEach((btnId) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      // Remove existing listeners dengan cara yang lebih aman
      btn.onclick = null;
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      // Add fresh listener
      const freshBtn = document.getElementById(btnId);
      if (freshBtn) {
        freshBtn.addEventListener("click", function (e) {
          e.preventDefault();
          const href = this.getAttribute("href");
          if (href && href.startsWith("#/")) {
            window.location.hash = href;
          }
        });
      }
    }
  });

  // 4. Navbar scroll effect
  const scrollHandler = function () {
    const navbar = document.querySelector(".navbar");
    if (navbar) {
      if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    }

    // Update active nav berdasarkan scroll position
    updateActiveNavOnScroll();
  };

  window.addEventListener("scroll", scrollHandler);

  // Simpan referensi untuk cleanup nanti
  window._landingPageScrollHandler = scrollHandler;

  // 5. Back to top button
  const backToTopButton = document.getElementById("backToTop");
  if (backToTopButton) {
    const backToTopScrollHandler = function () {
      if (window.scrollY > 300) {
        backToTopButton.style.display = "block";
      } else {
        backToTopButton.style.display = "none";
      }
    };

    const backToTopClickHandler = function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

    window.addEventListener("scroll", backToTopScrollHandler);
    backToTopButton.addEventListener("click", backToTopClickHandler);

    // Simpan referensi untuk cleanup
    window._backToTopScrollHandler = backToTopScrollHandler;
    window._backToTopClickHandler = backToTopClickHandler;
  }

  // 6. Initialize Bootstrap tooltips
  if (typeof bootstrap !== "undefined" && bootstrap.Tooltip) {
    const tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }

  console.log("✅ Landing page events setup complete");
}

// Fungsi untuk membersihkan event listener
function cleanupLandingPageEvents() {
  // Hapus event listener scroll
  if (window._landingPageScrollHandler) {
    window.removeEventListener("scroll", window._landingPageScrollHandler);
    window._landingPageScrollHandler = null;
  }

  // Hapus event listener back to top
  if (window._backToTopScrollHandler) {
    window.removeEventListener("scroll", window._backToTopScrollHandler);
    window._backToTopScrollHandler = null;
  }

  const backToTopButton = document.getElementById("backToTop");
  if (backToTopButton && window._backToTopClickHandler) {
    backToTopButton.removeEventListener("click", window._backToTopClickHandler);
    window._backToTopClickHandler = null;
  }

  console.log("🧹 Cleaned up landing page events");
}

// Helper untuk update active nav
function updateActiveNav(sectionId) {
  document.querySelectorAll(".navbar-nav .nav-link").forEach((link) => {
    const linkSection = link.getAttribute("data-section");
    if (linkSection === sectionId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// Helper untuk update active nav berdasarkan scroll
function updateActiveNavOnScroll() {
  const sections = ["hero", "fitur", "harga", "tentang", "kontak"];
  const navLinks = document.querySelectorAll(
    ".navbar-nav .nav-link[data-section]"
  );

  let currentSection = "";
  const scrollPosition = window.scrollY + 100;

  sections.forEach((sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (
        scrollPosition >= sectionTop &&
        scrollPosition < sectionTop + sectionHeight
      ) {
        currentSection = sectionId;
      }
    }
  });

  navLinks.forEach((link) => {
    const linkSection = link.getAttribute("data-section");
    if (linkSection === currentSection) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}
