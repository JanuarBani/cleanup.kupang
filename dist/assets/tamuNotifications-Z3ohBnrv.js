import{w as s,s as o}from"./router-D9V036Fn.js";import"./index-C2HavDub.js";class d{constructor(){this.notificationSubscription=null,this.notificationInterval=null,this.webPushInitialized=!1,this.user=null}async initialize(){try{if(console.log("🔔 Initializing Tamu Notifications..."),this.user=JSON.parse(localStorage.getItem("user")||"{}"),!["tamu","anggota"].includes(this.user.role))return console.log(`ℹ️ User role ${this.user.role} doesn't need tamu notifications`),!1;if(!s.isSupported)return console.log("⚠️ Web Push not supported in this browser"),this.updateNotificationUI("not-supported"),!1;try{await s.initialize(),this.webPushInitialized=!0,s.setupPushEventListener(),console.log("✅ Web Push initialized for tamu")}catch(t){return console.error("Web Push init failed:",t),this.updateNotificationUI("service-worker-error"),!1}const e=Notification.permission;return console.log(`📋 Notification permission: ${e}`),e==="granted"?await s.checkSubscription()?(console.log("✅ Tamu is subscribed to push notifications"),this.notificationSubscription=s.subscription,await this.updateNotificationUI("subscribed"),this.startNotificationPolling()):(console.log("ℹ️ Tamu has permission but not subscribed"),await this.updateNotificationUI("unsubscribed")):e==="denied"?(console.log("🚫 Notification permission denied by user"),await this.updateNotificationUI("permission-denied"),this.setupPermissionRecoveryButton()):e==="default"&&(console.log("❓ Notification permission not yet requested"),await this.updateNotificationUI("unsubscribed"),this.setupEnableButton()),e==="granted"}catch(i){return console.error("❌ Error initializing tamu notifications:",i),this.updateNotificationUI("error"),!1}}setupPermissionRecoveryButton(){const i=document.getElementById("tamu-toggleNotificationsBtn");i&&(i.innerHTML=`
                <i class="bi bi-question-circle me-2"></i>
                Bantuan Aktifkan Notifikasi
            `,i.onclick=async()=>{await this.showPermissionDeniedGuide()},console.log("✅ Setup permission recovery button"))}setupEnableButton(){const i=document.getElementById("tamu-toggleNotificationsBtn");i&&(i.innerHTML=`
                <i class="bi bi-bell me-2"></i>
                Aktifkan Notifikasi
            `,i.disabled=!1,i.onclick=async e=>{e.preventDefault(),await this.enableNotifications()},console.log("✅ Setup enable button with permission flow"))}async enableNotifications(){try{if(console.log("🔄 Enabling tamu notifications..."),this.updateNotificationUI("loading"),!s.isSupported)throw new Error("Browser tidak mendukung Web Push Notifications");const i=Notification.permission;if(console.log(`📋 Current permission status: ${i}`),i==="granted"){if(console.log("✅ Permission sudah diberikan, langsung subscribe..."),(await s.enableNotifications()).success)return await this.handleEnableSuccess(),!0;throw new Error("Gagal subscribe meskipun permission granted")}if(i==="denied")throw console.log("❌ Permission telah ditolak sebelumnya"),await this.showPermissionDeniedGuide(),new Error("Permission untuk notifikasi telah ditolak. Mohon aktifkan di pengaturan browser.");if(i==="default"){if(console.log("❓ Permission belum diminta, meminta izin..."),!await this.showPermissionRequestModal())return console.log("👤 User membatalkan permintaan izin"),await this.updateNotificationUI("unsubscribed"),o("Anda dapat mengaktifkan notifikasi nanti di pengaturan","info"),!1;console.log("🎯 Meminta permission dari browser...");const a=await Notification.requestPermission();if(a!=="granted")return console.log(`❌ User menolak permission: ${a}`),this.saveUserPreference("notifications","disabled"),a==="denied"?(await this.updateNotificationUI("permission-denied"),o("Izin notifikasi ditolak. Anda dapat mengubahnya di pengaturan browser.","info")):(await this.updateNotificationUI("unsubscribed"),o("Izin notifikasi ditangguhkan.","info")),!1;console.log("✅ Permission granted oleh user, melanjutkan..."),this.saveUserPreference("notifications","enabled")}const e=await s.enableNotifications();if(e.success)return await this.handleEnableSuccess(),!0;throw new Error(e.error||"Gagal mengaktifkan notifikasi")}catch(i){return await this.handleEnableError(i),!1}}async showPermissionRequestModal(){return new Promise(i=>{const e=`
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
            `,t=document.createElement("div");t.innerHTML=e,document.body.appendChild(t);const a=document.getElementById("permissionModal"),n=new bootstrap.Modal(a);document.getElementById("permissionAllowBtn").onclick=()=>{n.hide(),i(!0),setTimeout(()=>t.remove(),300)},document.getElementById("permissionCancelBtn").onclick=()=>{n.hide(),i(!1),setTimeout(()=>t.remove(),300)},n.show(),a.addEventListener("hidden.bs.modal",()=>{i(!1),setTimeout(()=>t.remove(),300)})})}async showPermissionDeniedGuide(){const i=`
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
        `,e=document.createElement("div");e.innerHTML=i,document.body.appendChild(e);const t=document.getElementById("permissionGuideModal");new bootstrap.Modal(t).show(),t.addEventListener("hidden.bs.modal",()=>{setTimeout(()=>e.remove(),300)})}saveUserPreference(i,e){try{const t=JSON.parse(localStorage.getItem("user_preferences")||"{}");t[i]=e,localStorage.setItem("user_preferences",JSON.stringify(t)),console.log(`💾 Saved preference: ${i}=${e}`)}catch(t){console.error("Error saving preference:",t)}}async handleEnableSuccess(){console.log("✅ Tamu notifications enabled successfully"),this.notificationSubscription=s.subscription,await this.updateNotificationUI("subscribed"),this.startNotificationPolling(),o("Notifikasi telah diaktifkan! Anda akan mendapatkan pemberitahuan tentang laporan dan pembaruan.","success"),this.saveUserPreference("notifications_enabled_at",new Date().toISOString())}async handleEnableError(i){console.error("❌ Failed to enable tamu notifications:",i);let e="Terjadi kesalahan saat mengaktifkan notifikasi",t="error";i.message.includes("Permission")||i.message.includes("Izin")?(e="Izin notifikasi ditolak. Mohon aktifkan di pengaturan browser.",t="permission-denied"):i.message.includes("Service Worker")?(e="Service Worker tidak tersedia. Pastikan Anda mengakses melalui HTTPS.",t="service-worker-error"):(i.message.includes("VAPID")||i.message.includes("fetch"))&&(e="Server notifikasi tidak dapat dijangkau. Coba lagi nanti.",t="server-unavailable"),await this.updateNotificationUI(t),o(e,"error")}async disableNotifications(){try{console.log("🔄 Disabling tamu notifications..."),this.updateNotificationUI("loading");const i=await s.disableNotifications();return i.success?(console.log("✅ Tamu notifications disabled successfully"),this.notificationSubscription=null,this.stopNotificationPolling(),await this.updateNotificationUI("unsubscribed"),o("Notifikasi telah dinonaktifkan","info"),!0):(console.error("❌ Failed to disable tamu notifications:",i.error),await this.updateNotificationUI("error"),o("Gagal menonaktifkan notifikasi","info"),!1)}catch(i){return console.error("❌ Error disabling tamu notifications:",i),await this.updateNotificationUI("error"),o("Terjadi kesalahan saat menonaktifkan notifikasi","info"),!1}}async toggleNotifications(){try{if(await s.checkSubscription()){const e=await this.showDisableConfirmation();return e&&await this.disableNotifications(),e}else return await this.enableNotifications()}catch(i){return console.error("❌ Error toggling tamu notifications:",i),o("Gagal mengubah pengaturan notifikasi","error"),!1}}async showDisableConfirmation(){return new Promise(i=>{const e=`
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
            `,t=document.createElement("div");t.innerHTML=e,document.body.appendChild(t);const a=document.getElementById("disableConfirmModal"),n=new bootstrap.Modal(a);document.getElementById("confirmDisableBtn").onclick=()=>{n.hide(),i(!0),setTimeout(()=>t.remove(),300)},a.addEventListener("hidden.bs.modal",()=>{i(!1),setTimeout(()=>t.remove(),300)}),n.show()})}async updateNotificationUI(i){const e=document.getElementById("tamu-notification-status"),t=document.getElementById("tamu-toggleNotificationsBtn"),a=(r,c)=>{r&&(r.innerHTML=c)},n={loading:{badge:`<span class="badge bg-warning">
                    <i class="bi bi-arrow-repeat spinner-border spinner-border-sm me-1"></i> Memuat...
                </span>`,buttonText:'<i class="bi bi-arrow-repeat me-2"></i>Memuat...',disabled:!0},subscribed:{badge:`<span class="badge bg-success">
                    <i class="bi bi-bell-fill me-1"></i> Aktif
                </span>`,buttonText:'<i class="bi bi-bell-slash me-2"></i>Nonaktifkan',disabled:!1},unsubscribed:{badge:`<span class="badge bg-secondary">
                    <i class="bi bi-bell-slash me-1"></i> Nonaktif
                </span>`,buttonText:'<i class="bi bi-bell me-2"></i>Aktifkan',disabled:!1},"not-supported":{badge:`<span class="badge bg-warning">
                    <i class="bi bi-exclamation-triangle me-1"></i> Tidak Didukung
                </span>`,buttonText:'<i class="bi bi-ban me-2"></i>Tidak Didukung',disabled:!0},"permission-denied":{badge:`<span class="badge bg-danger">
                    <i class="bi bi-slash-circle me-1"></i> Izin Ditolak
                </span>`,buttonText:'<i class="bi bi-slash-circle me-2"></i>Izin Ditolak',disabled:!0},"service-worker-error":{badge:`<span class="badge bg-danger">
                    <i class="bi bi-gear me-1"></i> Service Worker Error
                </span>`,buttonText:'<i class="bi bi-exclamation-triangle me-2"></i>Error SW',disabled:!0},"server-unavailable":{badge:`<span class="badge bg-warning">
                    <i class="bi bi-cloud-slash me-1"></i> Server Offline
                </span>`,buttonText:'<i class="bi bi-cloud-slash me-2"></i>Server Offline',disabled:!0},error:{badge:`<span class="badge bg-danger">
                    <i class="bi bi-exclamation-circle me-1"></i> Error
                </span>`,buttonText:'<i class="bi bi-exclamation-triangle me-2"></i>Error',disabled:!1}},l=n[i]||n.error;a(e,l.badge),t&&(t.innerHTML=l.buttonText,t.disabled=l.disabled)}startNotificationPolling(){this.notificationInterval&&clearInterval(this.notificationInterval),this.notificationInterval=setInterval(async()=>{try{await this.checkForNewNotifications()}catch(i){console.error("Polling error:",i)}},5*60*1e3),console.log("🔄 Started notification polling (every 5 minutes)"),setTimeout(()=>{this.checkForNewNotifications()},3e3)}stopNotificationPolling(){this.notificationInterval&&(clearInterval(this.notificationInterval),this.notificationInterval=null,console.log("🛑 Stopped notification polling"))}async checkForNewNotifications(){try{return navigator.onLine?(console.log("🔔 Checking for notification status..."),[]):(console.log("🌐 Offline - Skipping notification check"),[])}catch(i){return console.error("❌ Error checking for new notifications:",i),[]}}async setupDashboardIntegration(){try{console.log("🔧 Setting up tamu dashboard integration..."),await this.initialize(),this.setupEventListeners(),console.log("✅ Tamu dashboard integration complete")}catch(i){console.error("❌ Error setting up dashboard integration:",i)}}setupEventListeners(){console.log("🔗 Setting up tamu event listeners...");const i=document.getElementById("tamu-toggleNotificationsBtn");i&&(i.addEventListener("click",async e=>{e.preventDefault(),await this.toggleNotifications()}),console.log("✅ Toggle button listener added"))}}const g=new d;export{d as TamuNotifications,g as tamuNotifications};
