export function showModal(title, content, onSave = null, onClose = null) {
    let modalContainer = document.getElementById('modalContainer');
    
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'modalContainer';
        document.body.appendChild(modalContainer);
    }
    
    closeModal();
    
    setTimeout(() => {
        // PERUBAHAN 1: Buat modal dengan id unik
        const modalId = 'customModal-' + Date.now();
        
        modalContainer.innerHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1" 
                 role="dialog" aria-modal="true" aria-labelledby="${modalId}-title">
                <div class="modal-dialog ${onSave ? 'modal-lg' : ''}">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="${modalId}-title">${title}</h5>
                            <button type="button" class="btn-close" 
                                    onclick="window.closeModalById('${modalId}')" 
                                    aria-label="Tutup modal"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        ${onSave ? `
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" 
                                    onclick="window.closeModalById('${modalId}')">Batal</button>
                            <button type="button" class="btn btn-primary" 
                                    id="saveModalBtn-${modalId}">Simpan</button>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        const modalElement = document.getElementById(modalId);
        
        // PERUBAHAN 2: Buat modal instance dengan config khusus
        const modalOptions = {
            backdrop: 'static',
            keyboard: false,
            focus: false // Nonaktifkan fokus otomatis Bootstrap
        };
        
        const modal = new bootstrap.Modal(modalElement, modalOptions);
        
        // Simpan modal instance ke window untuk akses global
        window.currentModal = modal;
        window.currentModalElement = modalElement;
        
        // PERUBAHAN 3: Setup manual event untuk override Bootstrap
        modalElement.addEventListener('show.bs.modal', () => {
            console.log('Modal showing - removing aria-hidden');
            
            // Override: Hapus aria-hidden yang ditambahkan Bootstrap
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && 
                        mutation.attributeName === 'aria-hidden' &&
                        mutation.target === modalElement) {
                        
                        console.log('Bootstrap added aria-hidden, removing...');
                        modalElement.removeAttribute('aria-hidden');
                        modalElement.setAttribute('aria-modal', 'true');
                        
                        // Juga hapus dari backdrop
                        const backdrop = document.querySelector('.modal-backdrop');
                        if (backdrop) {
                            backdrop.removeAttribute('aria-hidden');
                        }
                    }
                });
            });
            
            // Observe perubahan pada modal element
            observer.observe(modalElement, {
                attributes: true,
                attributeFilter: ['aria-hidden']
            });
            
            // Simpan observer untuk cleanup nanti
            modalElement._ariaObserver = observer;
        });
        
        modalElement.addEventListener('shown.bs.modal', () => {
            console.log('Modal shown - setting focus');
            
            // Hapus aria-hidden sekali lagi setelah modal ditampilkan
            modalElement.removeAttribute('aria-hidden');
            modalElement.setAttribute('aria-modal', 'true');
            
            // Setup focus trap manual
            setupFocusTrap(modalElement);
            
            // Fokus ke elemen yang aman (bukan btn-close)
            if (onSave) {
                const saveBtn = document.getElementById(`saveModalBtn-${modalId}`);
                if (saveBtn) {
                    saveBtn.focus();
                }
            } else {
                // Fokus ke elemen pertama yang bisa difokuskan, kecuali btn-close
                const focusableElements = modalElement.querySelectorAll(
                    'button:not(.btn-close):not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                
                if (focusableElements.length > 0) {
                    focusableElements[0].focus();
                }
            }
        });
        
        modalElement.addEventListener('hide.bs.modal', () => {
            // Cleanup observer
            if (modalElement._ariaObserver) {
                modalElement._ariaObserver.disconnect();
                delete modalElement._ariaObserver;
            }
        });
        
        modalElement.addEventListener('hidden.bs.modal', () => {
            // Cleanup
            removeFocusTrap(modalElement);
            if (typeof onClose === 'function') {
                onClose();
            }
        });
        
        // Event listener untuk tombol simpan
        if (onSave) {
            const saveBtn = document.getElementById(`saveModalBtn-${modalId}`);
            if (saveBtn) {
                // Gunakan event delegation untuk menghindari cloning
                modalElement.addEventListener('click', function(event) {
                    if (event.target && event.target.id === `saveModalBtn-${modalId}`) {
                        event.preventDefault();
                        
                        (async () => {
                            try {
                                const result = await onSave();
                                if (result !== false) {
                                    modal.hide();
                                }
                            } catch (error) {
                                console.error('Error in modal save:', error);
                                showModalAlert(error.message, 'danger', modalId);
                            }
                        })();
                    }
                });
            }
        }
        
        // Tampilkan modal
        modal.show();
        
        // PERUBAHAN 4: Tambah fungsi close global
        window.closeModalById = function(id) {
            const modalToClose = document.getElementById(id);
            if (modalToClose) {
                const bsModal = bootstrap.Modal.getInstance(modalToClose);
                if (bsModal) {
                    bsModal.hide();
                }
            }
        };
        
    }, 50);
}

// PERUBAHAN pada setupFocusTrap
function setupFocusTrap(modalElement) {
    const focusableElements = modalElement.querySelectorAll(
        'button:not([disabled]):not(.btn-close), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusableElement) {
                    e.preventDefault();
                    lastFocusableElement.focus();
                }
            } else {
                if (document.activeElement === lastFocusableElement) {
                    e.preventDefault();
                    firstFocusableElement.focus();
                }
            }
        }
        
        // Prevent escape key from closing modal (kita handle sendiri)
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            
            // Focus ke tombol close dan trigger click
            const closeBtn = modalElement.querySelector('.btn-close');
            if (closeBtn) {
                closeBtn.focus();
                setTimeout(() => {
                    closeBtn.click();
                }, 100);
            }
        }
    };
    
    modalElement._tabHandler = handleTabKey;
    modalElement.addEventListener('keydown', handleTabKey);
    
    // Juga trap fokus pada document level
    document._modalFocusTrap = (e) => {
        if (e.key === 'Tab' && !modalElement.contains(document.activeElement)) {
            e.preventDefault();
            firstFocusableElement.focus();
        }
    };
    
    document.addEventListener('keydown', document._modalFocusTrap);
}

function removeFocusTrap(modalElement) {
    if (modalElement && modalElement._tabHandler) {
        modalElement.removeEventListener('keydown', modalElement._tabHandler);
        delete modalElement._tabHandler;
    }
    
    if (document._modalFocusTrap) {
        document.removeEventListener('keydown', document._modalFocusTrap);
        delete document._modalFocusTrap;
    }
}

export function closeModal() {
    const modalContainer = document.getElementById('modalContainer');
    
    if (modalContainer) {
        // Tutup modal aktif jika ada
        if (window.currentModal) {
            window.currentModal.hide();
        }
        
        // Cleanup semua
        const existingModals = document.querySelectorAll('.modal');
        existingModals.forEach(modalElement => {
            removeFocusTrap(modalElement);
            
            const bsModal = bootstrap.Modal.getInstance(modalElement);
            if (bsModal) {
                try {
                    bsModal.dispose();
                } catch (e) {
                    console.log('Error disposing modal:', e);
                }
            }
            
            // Cleanup observer
            if (modalElement._ariaObserver) {
                modalElement._ariaObserver.disconnect();
                delete modalElement._ariaObserver;
            }
            
            modalElement.remove();
        });
        
        // Hapus backdrop
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        
        // Reset body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Clear container
        modalContainer.innerHTML = '';
        
        // Cleanup global variables
        delete window.currentModal;
        delete window.currentModalElement;
        delete window.closeModalById;
        
        console.log('Modal closed with override');
    }
}

export function showConfirmModal(message, onConfirm) {
    let modalContainer = document.getElementById('modalContainer');
    
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'modalContainer';
        document.body.appendChild(modalContainer);
    }
    
    closeModal();
    
    setTimeout(() => {
        modalContainer.innerHTML = `
            <div class="modal fade" id="confirmModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title text-danger">Konfirmasi</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            ${message}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                            <button type="button" class="btn btn-danger" id="confirmModalBtn">Hapus</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const modalElement = document.getElementById('confirmModal');
        const modal = new bootstrap.Modal(modalElement);
        
        // Setup event listener dengan clone untuk menghindari duplikasi
        const confirmBtn = document.getElementById('confirmModalBtn');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', async () => {
            try {
                await onConfirm();
                modal.hide();
            } catch (error) {
                console.error('Error in confirmation:', error);
                showModalAlert(error.message, 'danger', 'confirmModal');
            }
        });
        
        modalElement.addEventListener('hidden.bs.modal', () => {
            closeModal();
        });
        
        modal.show();
        
        // Focus pada tombol konfirmasi
        setTimeout(() => {
            newConfirmBtn.focus();
        }, 100);
        
    }, 50);
}

// FUNGSI BARU: Menampilkan alert dalam modal
export function showModalAlert(message, type = 'danger', modalId = 'customModal') {
    const modalBody = document.querySelector(`#${modalId} .modal-body`);
    if (!modalBody) return;
    
    // Cari alert container
    let alertContainer = modalBody.querySelector('.modal-alert-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'modal-alert-container mb-3';
        modalBody.insertBefore(alertContainer, modalBody.firstChild);
    }
    
    // Hapus alert lama
    alertContainer.innerHTML = '';
    
    // Tambah alert baru
    const alertHTML = `
        <div class="alert alert-${type} alert-dismissible fade show">
            <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}-fill me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    alertContainer.innerHTML = alertHTML;
    
    // Scroll ke alert
    alertContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Auto dismiss setelah 5 detik untuk success/info
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            if (alertContainer && alertContainer.querySelector('.alert')) {
                const alertElement = alertContainer.querySelector('.alert');
                if (alertElement) {
                    const bsAlert = new bootstrap.Alert(alertElement);
                    bsAlert.close();
                }
            }
        }, 5000);
    }
}

// FUNGSI BARU: Menampilkan toast notification
export function showNotif(message, type = 'success') {
    // Buat container untuk toast jika belum ada
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = `toast-${Date.now()}`;
    const toastHTML = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-${type} text-white">
                <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}-fill me-2"></i>
                <strong class="me-auto">${type === 'success' ? 'Sukses' : type === 'warning' ? 'Peringatan' : 'Informasi'}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 3000
    });
    
    toast.show();
    
    // Hapus toast setelah ditutup
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}