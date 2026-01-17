// utils/tamuNotifications.js
import webPushManager from "./webPush.js";
import { showToast } from "./toast.js";
import { API, getAuthHeaders } from "../api.js";

export class TamuNotifications {
  constructor() {
    this.notificationSubscription = null;
    this.notificationInterval = null;
    this.webPushInitialized = false;
    this.user = null;
  }

  // ==================== INITIALIZATION ====================

  async initialize() {
    try {
      console.log("🔔 Initializing Tamu Notifications...");

      // Get user from localStorage
      this.user = JSON.parse(localStorage.getItem("user") || "{}");

      // Only initialize for tamu and anggota users
      const allowedRoles = ["tamu", "anggota"];
      if (!allowedRoles.includes(this.user.role)) {
        console.log(
          `ℹ️ User role ${this.user.role} doesn't need tamu notifications`
        );
        return false;
      }

      if (!webPushManager.isSupported) {
        console.log("⚠️ Web Push not supported in this browser");
        this.updateNotificationUI("not-supported");
        return false;
      }

      // Initialize web push
      try {
        await webPushManager.initialize();
        this.webPushInitialized = true;
        webPushManager.setupPushEventListener();
        console.log("✅ Web Push initialized for tamu");
      } catch (initError) {
        console.error("Web Push init failed:", initError);
        this.updateNotificationUI("service-worker-error");
        return false;
      }

      // ==================== PERBAIKAN: Cek permission status ====================

      // Cek status permission Notification API
      const notificationPermission = Notification.permission;
      console.log(`📋 Notification permission: ${notificationPermission}`);

      // Jika permission sudah granted, cek subscription
      if (notificationPermission === "granted") {
        const isSubscribed = await webPushManager.checkSubscription();

        if (isSubscribed) {
          console.log("✅ Tamu is subscribed to push notifications");
          this.notificationSubscription = webPushManager.subscription;
          await this.updateNotificationUI("subscribed");
          this.startNotificationPolling();
        } else {
          console.log("ℹ️ Tamu has permission but not subscribed");
          await this.updateNotificationUI("unsubscribed");
        }
      }
      // Jika permission denied, tampilkan status denied
      else if (notificationPermission === "denied") {
        console.log("🚫 Notification permission denied by user");
        await this.updateNotificationUI("permission-denied");

        // Tampilkan tombol bantuan jika ingin mengaktifkan
        this.setupPermissionRecoveryButton();
      }
      // Jika permission default (belum diminta)
      else if (notificationPermission === "default") {
        console.log("❓ Notification permission not yet requested");
        await this.updateNotificationUI("unsubscribed");

        // Tampilkan tombol "Aktifkan" yang friendly
        this.setupEnableButton();
      }

      return notificationPermission === "granted";
    } catch (error) {
      console.error("❌ Error initializing tamu notifications:", error);
      this.updateNotificationUI("error");
      return false;
    }
  }

  // ==================== FUNGSI BANTUAN TAMBAHAN ====================

  setupPermissionRecoveryButton() {
    const toggleBtn = document.getElementById("tamu-toggleNotificationsBtn");
    if (toggleBtn) {
      // Ubah tombol menjadi "Bantuan Aktifkan"
      toggleBtn.innerHTML = `
                <i class="bi bi-question-circle me-2"></i>
                Bantuan Aktifkan Notifikasi
            `;

      // Ganti event listener untuk tampilkan panduan
      toggleBtn.onclick = async () => {
        await this.showPermissionDeniedGuide();
      };

      console.log("✅ Setup permission recovery button");
    }
  }

  setupEnableButton() {
    const toggleBtn = document.getElementById("tamu-toggleNotificationsBtn");
    if (toggleBtn) {
      // Pastikan tombol dalam keadaan siap
      toggleBtn.innerHTML = `
                <i class="bi bi-bell me-2"></i>
                Aktifkan Notifikasi
            `;
      toggleBtn.disabled = false;
      toggleBtn.onclick = async (e) => {
        e.preventDefault();
        await this.enableNotifications();
      };

      console.log("✅ Setup enable button with permission flow");
    }
  }

  // ==================== NOTIFICATION CONTROLS ====================

  async enableNotifications() {
    try {
      console.log("🔄 Enabling tamu notifications...");

      // Show loading state
      this.updateNotificationUI("loading");

      // Check browser support
      if (!webPushManager.isSupported) {
        throw new Error("Browser tidak mendukung Web Push Notifications");
      }

      // ==================== LOGIKA IZIN YANG DIPERBAIKI ====================

      // 1. Cek status permission saat ini
      const currentPermission = Notification.permission;
      console.log(`📋 Current permission status: ${currentPermission}`);

      // 2. Jika permission sudah granted, langsung subscribe
      if (currentPermission === "granted") {
        console.log("✅ Permission sudah diberikan, langsung subscribe...");

        // Enable notifications using webPushManager
        const result = await webPushManager.enableNotifications();

        if (result.success) {
          await this.handleEnableSuccess();
          return true;
        } else {
          throw new Error("Gagal subscribe meskipun permission granted");
        }
      }

      // 3. Jika permission denied, tidak bisa lanjut
      if (currentPermission === "denied") {
        console.log("❌ Permission telah ditolak sebelumnya");

        // Tampilkan panduan cara mengizinkan manual
        await this.showPermissionDeniedGuide();

        throw new Error(
          "Permission untuk notifikasi telah ditolak. Mohon aktifkan di pengaturan browser."
        );
      }

      // 4. Jika permission default (belum diminta), minta izin dengan UI yang friendly
      if (currentPermission === "default") {
        console.log("❓ Permission belum diminta, meminta izin...");

        // Tampilkan modal konfirmasi sebelum meminta permission
        const userConfirmed = await this.showPermissionRequestModal();

        if (!userConfirmed) {
          console.log("👤 User membatalkan permintaan izin");
          await this.updateNotificationUI("unsubscribed");
          showToast(
            "Anda dapat mengaktifkan notifikasi nanti di pengaturan",
            "info"
          );
          return false;
        }

        // Minta permission dari browser
        console.log("🎯 Meminta permission dari browser...");
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
          console.log(`❌ User menolak permission: ${permission}`);

          // Simpan preferensi user
          this.saveUserPreference("notifications", "disabled");

          // Tampilkan feedback berdasarkan pilihan user
          if (permission === "denied") {
            await this.updateNotificationUI("permission-denied");
            showToast(
              "Izin notifikasi ditolak. Anda dapat mengubahnya di pengaturan browser.",
              "info"
            );
          } else {
            await this.updateNotificationUI("unsubscribed");
            showToast("Izin notifikasi ditangguhkan.", "info");
          }

          return false;
        }

        console.log("✅ Permission granted oleh user, melanjutkan...");

        // Simpan preferensi user
        this.saveUserPreference("notifications", "enabled");
      }

      // ==================== LANJUTKAN DENGAN SUBSCRIBE ====================

      // Enable notifications using webPushManager
      const result = await webPushManager.enableNotifications();

      if (result.success) {
        await this.handleEnableSuccess();
        return true;
      } else {
        throw new Error(result.error || "Gagal mengaktifkan notifikasi");
      }
    } catch (error) {
      await this.handleEnableError(error);
      return false;
    }
  }

  // ==================== FUNGSI BANTUAN BARU ====================

  async showPermissionRequestModal() {
    return new Promise((resolve) => {
      // Buat modal untuk meminta konfirmasi user
      const modalHTML = `
                <div class="modal fade" id="permissionModal" tabindex="-1">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header bg-success text-white">
                                <h5 class="modal-title">
                                    <i class="bi bi-bell-fill me-2"></i>
                                    Aktifkan Notifikasi
                                </h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="text-center mb-4">
                                    <div class="bg-success bg-opacity-10 p-4 rounded-circle d-inline-block">
                                        <i class="bi bi-bell text-success fs-1"></i>
                                    </div>
                                </div>
                                <h5 class="text-center mb-3">Izinkan Notifikasi?</h5>
                                <p class="text-muted">
                                    Dengan mengizinkan notifikasi, Anda akan mendapatkan:
                                </p>
                                <ul class="list-unstyled">
                                    <li class="mb-2">
                                        <i class="bi bi-check-circle text-success me-2"></i>
                                        Pemberitahuan status laporan sampah
                                    </li>
                                    <li class="mb-2">
                                        <i class="bi bi-check-circle text-success me-2"></i>
                                        Update laporan terbaru di wilayah Anda
                                    </li>
                                    <li class="mb-2">
                                        <i class="bi bi-check-circle text-success me-2"></i>
                                        Informasi kegiatan CleanUp Kupang
                                    </li>
                                    <li class="mb-2">
                                        <i class="bi bi-check-circle text-success me-2"></i>
                                        Pengingat untuk aktivitas lingkungan
                                    </li>
                                </ul>
                                <div class="alert alert-info mt-3">
                                    <i class="bi bi-info-circle me-2"></i>
                                    Anda dapat mengubah pengaturan ini kapan saja di menu profil
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" 
                                        class="btn btn-outline-secondary" 
                                        id="permissionCancelBtn">
                                    <i class="bi bi-x-circle me-2"></i>
                                    Nanti Saja
                                </button>
                                <button type="button" 
                                        class="btn btn-success" 
                                        id="permissionAllowBtn">
                                    <i class="bi bi-check-circle me-2"></i>
                                    Izinkan Notifikasi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

      // Tambahkan modal ke body
      const modalContainer = document.createElement("div");
      modalContainer.innerHTML = modalHTML;
      document.body.appendChild(modalContainer);

      // Inisialisasi modal
      const modalElement = document.getElementById("permissionModal");
      const modal = new bootstrap.Modal(modalElement);

      // Event listeners untuk tombol
      document.getElementById("permissionAllowBtn").onclick = () => {
        modal.hide();
        resolve(true);
        setTimeout(() => modalContainer.remove(), 300);
      };

      document.getElementById("permissionCancelBtn").onclick = () => {
        modal.hide();
        resolve(false);
        setTimeout(() => modalContainer.remove(), 300);
      };

      // Tampilkan modal
      modal.show();

      // Auto close jika user klik di luar modal
      modalElement.addEventListener("hidden.bs.modal", () => {
        resolve(false);
        setTimeout(() => modalContainer.remove(), 300);
      });
    });
  }

  async showPermissionDeniedGuide() {
    const guideHTML = `
            <div class="modal fade" id="permissionGuideModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-warning text-dark">
                            <h5 class="modal-title">
                                <i class="bi bi-slash-circle me-2"></i>
                                Izin Notifikasi Ditolak
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-warning">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                <strong>Izin notifikasi telah ditolak sebelumnya</strong>
                            </div>
                            
                            <p class="mb-3">Untuk mengaktifkan notifikasi:</p>
                            
                            <div class="accordion" id="guideAccordion">
                                <!-- Chrome -->
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" 
                                                data-bs-toggle="collapse" data-bs-target="#chromeGuide">
                                            <i class="bi bi-browser-chrome me-2 text-primary"></i>
                                            Google Chrome
                                        </button>
                                    </h2>
                                    <div id="chromeGuide" class="accordion-collapse collapse" 
                                        data-bs-parent="#guideAccordion">
                                        <div class="accordion-body">
                                            <ol class="mb-0">
                                                <li>Klik ikon <strong>🔒 (gembok)</strong> di address bar</li>
                                                <li>Pilih <strong>"Site settings"</strong></li>
                                                <li>Cari <strong>"Notifications"</strong></li>
                                                <li>Ubah menjadi <strong>"Allow"</strong></li>
                                                <li>Refresh halaman ini</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Firefox -->
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" 
                                                data-bs-toggle="collapse" data-bs-target="#firefoxGuide">
                                            <i class="bi bi-browser-firefox me-2 text-danger"></i>
                                            Mozilla Firefox
                                        </button>
                                    </h2>
                                    <div id="firefoxGuide" class="accordion-collapse collapse" 
                                        data-bs-parent="#guideAccordion">
                                        <div class="accordion-body">
                                            <ol class="mb-0">
                                                <li>Klik ikon <strong>ⓘ (info)</strong> di address bar</li>
                                                <li>Klik <strong>"Permissions"</strong> > <strong>"Notifications"</strong></li>
                                                <li>Pilih <strong>"Allow"</strong></li>
                                                <li>Refresh halaman ini</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Safari -->
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" 
                                                data-bs-toggle="collapse" data-bs-target="#safariGuide">
                                            <i class="bi bi-browser-safari me-2 text-primary"></i>
                                            Safari
                                        </button>
                                    </h2>
                                    <div id="safariGuide" class="accordion-collapse collapse" 
                                        data-bs-parent="#guideAccordion">
                                        <div class="accordion-body">
                                            <ol class="mb-0">
                                                <li>Buka <strong>Safari > Preferences</strong></li>
                                                <li>Pilih tab <strong>"Websites"</strong></li>
                                                <li>Pilih <strong>"Notifications"</strong> di sidebar</li>
                                                <li>Cari situs ini dan pilih <strong>"Allow"</strong></li>
                                                <li>Refresh halaman ini</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Edge -->
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" 
                                                data-bs-toggle="collapse" data-bs-target="#edgeGuide">
                                            <i class="bi bi-browser-edge me-2 text-primary"></i>
                                            Microsoft Edge
                                        </button>
                                    </h2>
                                    <div id="edgeGuide" class="accordion-collapse collapse" 
                                        data-bs-parent="#guideAccordion">
                                        <div class="accordion-body">
                                            <ol class="mb-0">
                                                <li>Klik ikon <strong>🔒 (gembok)</strong> di address bar</li>
                                                <li>Klik <strong>"Permissions for this site"</strong></li>
                                                <li>Cari <strong>"Notifications"</strong></li>
                                                <li>Ubah menjadi <strong>"Allow"</strong></li>
                                                <li>Refresh halaman ini</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mt-4">
                                <button type="button" class="btn btn-outline-primary w-100" 
                                        onclick="location.reload()">
                                    <i class="bi bi-arrow-clockwise me-2"></i>
                                    Refresh Halaman Setelah Mengubah Pengaturan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Tambahkan modal ke body
    const guideContainer = document.createElement("div");
    guideContainer.innerHTML = guideHTML;
    document.body.appendChild(guideContainer);

    // Inisialisasi modal
    const modalElement = document.getElementById("permissionGuideModal");
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // Cleanup setelah modal ditutup
    modalElement.addEventListener("hidden.bs.modal", () => {
      setTimeout(() => guideContainer.remove(), 300);
    });
  }

  saveUserPreference(key, value) {
    try {
      const userPrefs = JSON.parse(
        localStorage.getItem("user_preferences") || "{}"
      );
      userPrefs[key] = value;
      localStorage.setItem("user_preferences", JSON.stringify(userPrefs));
      console.log(`💾 Saved preference: ${key}=${value}`);
    } catch (error) {
      console.error("Error saving preference:", error);
    }
  }

  async handleEnableSuccess() {
    console.log("✅ Tamu notifications enabled successfully");
    this.notificationSubscription = webPushManager.subscription;

    // Update UI
    await this.updateNotificationUI("subscribed");

    // Start polling
    this.startNotificationPolling();

    // Show success message
    showToast(
      "Notifikasi telah diaktifkan! Anda akan mendapatkan pemberitahuan tentang laporan dan pembaruan.",
      "success"
    );

    // Simpan timestamp
    this.saveUserPreference(
      "notifications_enabled_at",
      new Date().toISOString()
    );
  }

  async handleEnableError(error) {
    console.error("❌ Failed to enable tamu notifications:", error);

    let errorMessage = "Terjadi kesalahan saat mengaktifkan notifikasi";
    let uiStatus = "error";

    if (
      error.message.includes("Permission") ||
      error.message.includes("Izin")
    ) {
      errorMessage =
        "Izin notifikasi ditolak. Mohon aktifkan di pengaturan browser.";
      uiStatus = "permission-denied";
    } else if (error.message.includes("Service Worker")) {
      errorMessage =
        "Service Worker tidak tersedia. Pastikan Anda mengakses melalui HTTPS.";
      uiStatus = "service-worker-error";
    } else if (
      error.message.includes("VAPID") ||
      error.message.includes("fetch")
    ) {
      errorMessage =
        "Server notifikasi tidak dapat dijangkau. Coba lagi nanti.";
      uiStatus = "server-unavailable";
    }

    await this.updateNotificationUI(uiStatus);
    showToast(errorMessage, "error");
  }

  async disableNotifications() {
    try {
      console.log("🔄 Disabling tamu notifications...");

      // Show loading state
      this.updateNotificationUI("loading");

      // Disable notifications using webPushManager
      const result = await webPushManager.disableNotifications();

      if (result.success) {
        console.log("✅ Tamu notifications disabled successfully");
        this.notificationSubscription = null;

        // Stop polling
        this.stopNotificationPolling();

        // Update UI
        await this.updateNotificationUI("unsubscribed");

        showToast("Notifikasi telah dinonaktifkan", "info");

        return true;
      } else {
        console.error("❌ Failed to disable tamu notifications:", result.error);
        await this.updateNotificationUI("error");
        showToast("Gagal menonaktifkan notifikasi", "info");
        return false;
      }
    } catch (error) {
      console.error("❌ Error disabling tamu notifications:", error);
      await this.updateNotificationUI("error");
      showToast("Terjadi kesalahan saat menonaktifkan notifikasi", "info");
      return false;
    }
  }

  async toggleNotifications() {
    try {
      const isSubscribed = await webPushManager.checkSubscription();

      // Jika sudah subscribe, disable
      if (isSubscribed) {
        const confirmDisable = await this.showDisableConfirmation();
        if (confirmDisable) {
          await this.disableNotifications();
        }
        return confirmDisable;
      }
      // Jika belum subscribe, enable dengan flow permission
      else {
        return await this.enableNotifications();
      }
    } catch (error) {
      console.error("❌ Error toggling tamu notifications:", error);
      showToast("Gagal mengubah pengaturan notifikasi", "error");
      return false;
    }
  }

  async showDisableConfirmation() {
    return new Promise((resolve) => {
      const modalHTML = `
                <div class="modal fade" id="disableConfirmModal" tabindex="-1">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header bg-warning text-dark">
                                <h5 class="modal-title">
                                    <i class="bi bi-exclamation-triangle me-2"></i>
                                    Nonaktifkan Notifikasi?
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="alert alert-warning">
                                    <i class="bi bi-bell-slash me-2"></i>
                                    Anda tidak akan menerima:
                                </div>
                                <ul class="list-unstyled">
                                    <li class="mb-2">
                                        <i class="bi bi-x-circle text-danger me-2"></i>
                                        Pemberitahuan status laporan
                                    </li>
                                    <li class="mb-2">
                                        <i class="bi bi-x-circle text-danger me-2"></i>
                                        Update kegiatan CleanUp Kupang
                                    </li>
                                    <li class="mb-2">
                                        <i class="bi bi-x-circle text-danger me-2"></i>
                                        Informasi penting lainnya
                                    </li>
                                </ul>
                                <p class="text-muted mb-0">
                                    Anda dapat mengaktifkannya kembali kapan saja.
                                </p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" 
                                        class="btn btn-outline-secondary" 
                                        data-bs-dismiss="modal">
                                    <i class="bi bi-x-circle me-2"></i>
                                    Batal
                                </button>
                                <button type="button" 
                                        class="btn btn-warning" 
                                        id="confirmDisableBtn">
                                    <i class="bi bi-check-circle me-2"></i>
                                    Ya, Nonaktifkan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

      const modalContainer = document.createElement("div");
      modalContainer.innerHTML = modalHTML;
      document.body.appendChild(modalContainer);

      const modalElement = document.getElementById("disableConfirmModal");
      const modal = new bootstrap.Modal(modalElement);

      document.getElementById("confirmDisableBtn").onclick = () => {
        modal.hide();
        resolve(true);
        setTimeout(() => modalContainer.remove(), 300);
      };

      modalElement.addEventListener("hidden.bs.modal", () => {
        resolve(false);
        setTimeout(() => modalContainer.remove(), 300);
      });

      modal.show();
    });
  }

  // ==================== UI UPDATES ====================

  async updateNotificationUI(status) {
    const statusElement = document.getElementById("tamu-notification-status");
    const toggleBtn = document.getElementById("tamu-toggleNotificationsBtn");

    const updateElement = (element, html) => {
      if (element) {
        element.innerHTML = html;
      }
    };

    const statusConfigs = {
      loading: {
        badge: `<span class="badge bg-warning">
                    <i class="bi bi-arrow-repeat spinner-border spinner-border-sm me-1"></i> Memuat...
                </span>`,
        buttonText: `<i class="bi bi-arrow-repeat me-2"></i>Memuat...`,
        disabled: true,
      },
      subscribed: {
        badge: `<span class="badge bg-success">
                    <i class="bi bi-bell-fill me-1"></i> Aktif
                </span>`,
        buttonText: `<i class="bi bi-bell-slash me-2"></i>Nonaktifkan`,
        disabled: false,
      },
      unsubscribed: {
        badge: `<span class="badge bg-secondary">
                    <i class="bi bi-bell-slash me-1"></i> Nonaktif
                </span>`,
        buttonText: `<i class="bi bi-bell me-2"></i>Aktifkan`,
        disabled: false,
      },
      "not-supported": {
        badge: `<span class="badge bg-warning">
                    <i class="bi bi-exclamation-triangle me-1"></i> Tidak Didukung
                </span>`,
        buttonText: `<i class="bi bi-ban me-2"></i>Tidak Didukung`,
        disabled: true,
      },
      "permission-denied": {
        badge: `<span class="badge bg-danger">
                    <i class="bi bi-slash-circle me-1"></i> Izin Ditolak
                </span>`,
        buttonText: `<i class="bi bi-slash-circle me-2"></i>Izin Ditolak`,
        disabled: true,
      },
      "service-worker-error": {
        badge: `<span class="badge bg-danger">
                    <i class="bi bi-gear me-1"></i> Service Worker Error
                </span>`,
        buttonText: `<i class="bi bi-exclamation-triangle me-2"></i>Error SW`,
        disabled: true,
      },
      "server-unavailable": {
        badge: `<span class="badge bg-warning">
                    <i class="bi bi-cloud-slash me-1"></i> Server Offline
                </span>`,
        buttonText: `<i class="bi bi-cloud-slash me-2"></i>Server Offline`,
        disabled: true,
      },
      error: {
        badge: `<span class="badge bg-danger">
                    <i class="bi bi-exclamation-circle me-1"></i> Error
                </span>`,
        buttonText: `<i class="bi bi-exclamation-triangle me-2"></i>Error`,
        disabled: false,
      },
    };

    const config = statusConfigs[status] || statusConfigs.error;

    updateElement(statusElement, config.badge);

    if (toggleBtn) {
      toggleBtn.innerHTML = config.buttonText;
      toggleBtn.disabled = config.disabled;
    }
  }

  // ==================== NOTIFICATION POLLING ====================

  startNotificationPolling() {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }

    // Poll setiap 5 menit
    this.notificationInterval = setInterval(async () => {
      try {
        await this.checkForNewNotifications();
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 5 * 60 * 1000);

    console.log("🔄 Started notification polling (every 5 minutes)");

    // Initial check
    setTimeout(() => {
      this.checkForNewNotifications();
    }, 3000);
  }

  stopNotificationPolling() {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
      this.notificationInterval = null;
      console.log("🛑 Stopped notification polling");
    }
  }

  async checkForNewNotifications() {
    try {
      // Cek koneksi internet
      if (!navigator.onLine) {
        console.log("🌐 Offline - Skipping notification check");
        return [];
      }

      // Hanya cek status, tidak perlu menampilkan apa-apa
      console.log("🔔 Checking for notification status...");

      return [];
    } catch (error) {
      console.error("❌ Error checking for new notifications:", error);
      return [];
    }
  }

  // ==================== DASHBOARD INTEGRATION ====================

  async setupDashboardIntegration() {
    try {
      console.log("🔧 Setting up tamu dashboard integration...");

      // Inisialisasi notifikasi
      await this.initialize();

      // Setup event listeners untuk tombol
      this.setupEventListeners();

      console.log("✅ Tamu dashboard integration complete");
    } catch (error) {
      console.error("❌ Error setting up dashboard integration:", error);
    }
  }

  setupEventListeners() {
    console.log("🔗 Setting up tamu event listeners...");

    // Tombol toggle notifications
    const toggleBtn = document.getElementById("tamu-toggleNotificationsBtn");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await this.toggleNotifications();
      });
      console.log("✅ Toggle button listener added");
    }
  }
}

// Export singleton instance
export const tamuNotifications = new TamuNotifications();
