(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function l(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(n){if(n.ep)return;n.ep=!0;const i=l(n);fetch(n.href,i)}})();const y="modulepreload",b=function(e){return"/"+e},p={},f=function(t,l,s){let n=Promise.resolve();if(l&&l.length>0){document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),a=(r==null?void 0:r.nonce)||(r==null?void 0:r.getAttribute("nonce"));n=Promise.allSettled(l.map(c=>{if(c=b(c),c in p)return;p[c]=!0;const d=c.endsWith(".css"),u=d?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${u}`))return;const o=document.createElement("link");if(o.rel=d?"stylesheet":y,d||(o.as="script"),o.crossOrigin="",o.href=c,a&&o.setAttribute("nonce",a),document.head.appendChild(o),d)return new Promise((h,w)=>{o.addEventListener("load",h),o.addEventListener("error",()=>w(new Error(`Unable to preload CSS for ${c}`)))})}))}function i(r){const a=new Event("vite:preloadError",{cancelable:!0});if(a.payload=r,window.dispatchEvent(a),!a.defaultPrevented)throw r}return n.then(r=>{for(const a of r||[])a.status==="rejected"&&i(a.reason);return t().catch(i)})};function v(e={}){const{immediate:t=!1,onNeedRefresh:l,onOfflineReady:s,onRegistered:n,onRegisteredSW:i,onRegisterError:r}=e;let a,c;const d=async(o=!0)=>{await c};async function u(){if("serviceWorker"in navigator){if(a=await f(async()=>{const{Workbox:o}=await import("./workbox-window.prod.es5-vqzQaGvo.js");return{Workbox:o}},[]).then(({Workbox:o})=>new o("/sw.js",{scope:"/",type:"classic"})).catch(o=>{r==null||r(o)}),!a)return;a.addEventListener("activated",o=>{(o.isUpdate||o.isExternal)&&window.location.reload()}),a.addEventListener("installed",o=>{o.isUpdate||s==null||s()}),a.register({immediate:t}).then(o=>{i?i("/sw.js",o):n==null||n(o)}).catch(o=>{r==null||r(o)})}}return c=u(),d}v({immediate:!0});console.log("🚀 MAIN.JS STARTING...");typeof updateStatus=="function"&&updateStatus("Loading application...");let g;async function S(){try{console.log("📦 Importing router..."),g=(await f(()=>import("./router-DKNYMW_3.js").then(t=>t.r),[])).router,console.log("✅ Router imported"),typeof updateStatus=="function"&&updateStatus("Router loaded")}catch(e){console.error("❌ Failed to import router:",e),document.getElementById("app").innerHTML=`
            <div style="padding: 40px; text-align: center;">
                <h1 style="color: #f44336;">Application Error</h1>
                <p>Failed to load application modules.</p>
                <p><strong>Error:</strong> ${e.message}</p>
                <div style="margin-top: 20px;">
                    <button onclick="window.location.reload()">Reload Application</button>
                    <button onclick="clearStorage()" style="margin-left: 10px; background: #ff9800;">
                        Clear Storage & Reload
                    </button>
                </div>
            </div>
        `;const t=document.getElementById("loading");throw t&&(t.style.display="none"),e}}async function m(){if(!g){console.log("⏳ Router not loaded yet, waiting...");return}console.log("🔄 Executing router...");try{await g(),setTimeout(()=>{const e=document.getElementById("loading");e&&(e.style.opacity="0",setTimeout(()=>{e.style.display="none"},500))},300)}catch(e){console.error("❌ Router execution error:",e),document.getElementById("app").innerHTML=`
            <div style="padding: 20px; color: red;">
                <h2>Navigation Error</h2>
                <p>${e.message}</p>
                <button onclick="window.location.hash='#/'">Go Home</button>
                <button onclick="window.location.reload()" style="margin-left: 10px;">Reload</button>
            </div>
        `}}async function x(){console.log("🔧 Initializing application...");const e=!!localStorage.getItem("access"),t=!!localStorage.getItem("user");if(console.log("📊 Auth Status:"),console.log("- Token:",e?"✅ Found":"❌ Not found"),console.log("- User:",t?"✅ Found":"❌ Not found"),typeof updateStatus=="function"&&updateStatus(e?"User authenticated":"No session found"),await S(),!window.location.hash)if(console.log("📍 No hash found, setting default..."),e)try{const l=localStorage.getItem("user");if(l){const s=JSON.parse(l);console.log(`🎯 Redirecting ${s.role} to dashboard`)}}catch{window.location.hash="#/"}else window.location.hash="#/";await m(),console.log("✅ Application initialized")}window.addEventListener("DOMContentLoaded",async function(){console.log("📄 DOM Content Loaded"),setTimeout(async()=>{try{await x()}catch(e){console.error("❌ Application initialization failed:",e)}},100)});window.addEventListener("hashchange",async function(){console.log("🔗 Hash changed to:",window.location.hash),await m()});window.debugAuth=()=>{console.log("🔍 DEBUG AUTH STATUS:"),console.log("Token:",localStorage.getItem("access")),console.log("User:",localStorage.getItem("user"));const e=localStorage.getItem("access");if(e)try{const t=JSON.parse(atob(e.split(".")[1]));console.log("Token payload:",t),console.log("Expires:",new Date(t.exp*1e3)),console.log("User ID:",t.user_id);const s=t.exp*1e3-Date.now(),n=Math.floor(s/(1e3*60*60)),i=Math.floor(s%(1e3*60*60)/(1e3*60));console.log(`Valid for: ${n}h ${i}m`)}catch(t){console.error("Token decode error:",t)}};setTimeout(()=>{console.log("🕐 Auto-debug after load"),window.debugAuth()},2e3);window.logout=async function(){console.log("🚪 LOGOUT - Starting logout process...");try{if(!(await Swal.fire({title:"Konfirmasi Logout",html:`
                <div style="text-align: center;">
                    <div style="font-size: 60px; color: #ff6b6b; margin-bottom: 15px;">
                        <i class="bi bi-box-arrow-right"></i>
                    </div>
                    <p style="font-size: 16px; color: #666;">
                        Anda akan keluar dari sistem dan diarahkan ke halaman login.
                    </p>
                    <p style="font-size: 14px; color: #999; margin-top: 10px;">
                        Yakin ingin logout?
                    </p>
                </div>
            `,icon:"warning",showCancelButton:!0,confirmButtonColor:"#d33",cancelButtonColor:"#3085d6",confirmButtonText:`
                <i class="bi bi-box-arrow-right me-2"></i>
                Ya, Logout
            `,cancelButtonText:`
                <i class="bi bi-x-circle me-2"></i>
                Batal
            `,reverseButtons:!0,focusCancel:!0,backdrop:!0,allowOutsideClick:!1,customClass:{popup:"rounded-4",title:"fw-bold",confirmButton:"shadow-sm",cancelButton:"shadow-sm"}})).isConfirmed){console.log("🚪 LOGOUT - User canceled logout");return}await Swal.fire({title:"Sedang Logout...",html:`
                <div style="text-align: center;">
                    <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3" style="color: #666;">
                        Menghapus sesi login...
                    </p>
                </div>
            `,showConfirmButton:!1,allowOutsideClick:!1,allowEscapeKey:!1,timer:1500,didOpen:()=>{Swal.showLoading()}}),console.log("🚪 LOGOUT - Clearing localStorage..."),["access","refresh","user","idAnggota","anggota","payment_cache","last_login"].forEach(l=>{localStorage.removeItem(l)}),console.log("🚪 LOGOUT - Storage cleared successfully"),await Swal.fire({title:"Logout Berhasil!",html:`
                <div style="text-align: center;">
                    <div style="font-size: 60px; color: #4CAF50; margin-bottom: 15px;">
                        <i class="bi bi-check-circle"></i>
                    </div>
                    <p style="font-size: 16px; color: #666;">
                        Anda telah berhasil logout.
                    </p>
                    <p style="font-size: 14px; color: #999; margin-top: 10px;">
                        Mengarahkan ke halaman login...
                    </p>
                </div>
            `,icon:"success",showConfirmButton:!1,timer:2e3,timerProgressBar:!0,allowOutsideClick:!1}),console.log("🚪 LOGOUT - Redirecting to login..."),window.location.hash="#/login",setTimeout(()=>{window.location.reload()},500)}catch(e){console.error("🚪 LOGOUT - Error:",e),await Swal.fire({title:"Logout Gagal!",html:`
                <div style="text-align: center;">
                    <div style="font-size: 60px; color: #dc3545; margin-bottom: 15px;">
                        <i class="bi bi-exclamation-triangle"></i>
                    </div>
                    <p style="font-size: 16px; color: #666;">
                        Terjadi kesalahan saat logout.
                    </p>
                    <p style="font-size: 14px; color: #999; margin-top: 10px;">
                        ${e.message||"Silakan coba lagi."}
                    </p>
                </div>
            `,icon:"error",confirmButtonText:"OK",confirmButtonColor:"#dc3545",customClass:{popup:"rounded-4"}});try{localStorage.clear(),window.location.hash="#/login"}catch(t){console.error("Fallback logout error:",t)}}};export{f as _};
