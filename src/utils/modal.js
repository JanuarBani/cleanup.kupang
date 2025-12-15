// // utils/modal.js - Tambahkan fungsi closeModal yang diekspor
// export function showModal(title, content, onSave = null, onClose = null) {
//     let modalContainer = document.getElementById('modalContainer');
    
//     if (!modalContainer) {
//         modalContainer = document.createElement('div');
//         modalContainer.id = 'modalContainer';
//         document.body.appendChild(modalContainer);
//     }
    
//     modalContainer.innerHTML = `
//         <div class="modal fade" id="customModal" tabindex="-1" aria-hidden="true">
//             <div class="modal-dialog ${onSave ? 'modal-lg' : ''}">
//                 <div class="modal-content">
//                     <div class="modal-header">
//                         <h5 class="modal-title">${title}</h5>
//                         <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
//                     </div>
//                     <div class="modal-body">
//                         ${content}
//                     </div>
//                     ${onSave ? `
//                     <div class="modal-footer">
//                         <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
//                         <button type="button" class="btn btn-primary" id="saveModalBtn">Simpan</button>
//                     </div>
//                     ` : ''}
//                 </div>
//             </div>
//         </div>
//     `;
    
//     const modal = new bootstrap.Modal(document.getElementById('customModal'));
//     modal.show();
    
//     if (onSave) {
//         document.getElementById('saveModalBtn').addEventListener('click', async () => {
//             try {
//                 await onSave();
//                 modal.hide();
//             } catch (error) {
//                 console.error('Error in modal save:', error);
//                 alert('Error: ' + error.message);
//             }
//         });
//     }
    
//     // PERBAIKAN: Hapus atau modifikasi event handler
//     document.getElementById('customModal').addEventListener('hidden.bs.modal', () => {
//         closeModal();
//         // HAPUS atau KOMENTARI bagian yang redirect ke dashboard
//         // if (typeof onClose === 'function') {
//         //     onClose();
//         // }
//     });
// }

// export function showConfirmModal(message, onConfirm) {
//     let modalContainer = document.getElementById('modalContainer');
    
//     if (!modalContainer) {
//         modalContainer = document.createElement('div');
//         modalContainer.id = 'modalContainer';
//         document.body.appendChild(modalContainer);
//     }
    
//     modalContainer.innerHTML = `
//         <div class="modal fade" id="confirmModal" tabindex="-1" aria-hidden="true">
//             <div class="modal-dialog">
//                 <div class="modal-content">
//                     <div class="modal-header">
//                         <h5 class="modal-title text-danger">Konfirmasi</h5>
//                         <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
//                     </div>
//                     <div class="modal-body">
//                         <p>${message}</p>
//                     </div>
//                     <div class="modal-footer">
//                         <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
//                         <button type="button" class="btn btn-danger" id="confirmModalBtn">Hapus</button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     `;
    
//     const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
//     modal.show();
    
//     document.getElementById('confirmModalBtn').addEventListener('click', async () => {
//         try {
//             await onConfirm();
//             modal.hide();
//         } catch (error) {
//             console.error('Error in confirmation:', error);
//             alert('Error: ' + error.message);
//         }
//     });
    
//     document.getElementById('confirmModal').addEventListener('hidden.bs.modal', () => {
//         closeModal();
//     });
// }

// // Fungsi untuk menutup modal - DIEKSPOR
// export function closeModal() {
//     const modalContainer = document.getElementById('modalContainer');
//     if (modalContainer) {
//         modalContainer.innerHTML = '';
        
//         // Hapus semua modal instance Bootstrap yang mungkin masih aktif
//         const existingModals = document.querySelectorAll('.modal');
//         existingModals.forEach(modal => {
//             if (modal.id !== 'modalContainer') {
//                 const bsModal = bootstrap.Modal.getInstance(modal);
//                 if (bsModal) {
//                     bsModal.hide();
//                 }
//                 modal.remove();
//             }
//         });
//     }
// }

// utils/modal.js - Versi diperbaiki untuk menghindari warning aria-hidden
export function showModal(title, content, onSave = null, onClose = null) {
    let modalContainer = document.getElementById('modalContainer');
    
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'modalContainer';
        document.body.appendChild(modalContainer);
    }
    
    // Hapus modal sebelumnya jika ada
    closeModal();
    
    modalContainer.innerHTML = `
        <div class="modal fade" id="customModal" tabindex="-1">
            <div class="modal-dialog ${onSave ? 'modal-lg' : ''}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${onSave ? `
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-primary" id="saveModalBtn">Simpan</button>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    const modalElement = document.getElementById('customModal');
    const modal = new bootstrap.Modal(modalElement);
    
    // Event listener untuk tombol simpan
    if (onSave) {
        document.getElementById('saveModalBtn').addEventListener('click', async () => {
            try {
                const shouldClose = await onSave();
                if (shouldClose !== false) {
                    modal.hide();
                }
            } catch (error) {
                console.error('Error in modal save:', error);
                showModalError(error.message);
            }
        });
    }
    
    // Event listener untuk modal hidden
    modalElement.addEventListener('hidden.bs.modal', () => {
        closeModal();
        if (typeof onClose === 'function') {
            onClose();
        }
    });
    
    // Event listener untuk modal shown - atur fokus
    modalElement.addEventListener('shown.bs.modal', () => {
        // Fokus ke tombol pertama yang sesuai
        if (onSave) {
            const saveBtn = document.getElementById('saveModalBtn');
            if (saveBtn) {
                saveBtn.focus();
            }
        } else {
            const closeBtn = modalElement.querySelector('.btn-close');
            if (closeBtn) {
                closeBtn.focus();
            }
        }
    });
    
    // Tampilkan modal
    modal.show();
}

export function showConfirmModal(message, onConfirm) {
    let modalContainer = document.getElementById('modalContainer');
    
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'modalContainer';
        document.body.appendChild(modalContainer);
    }
    
    // Hapus modal sebelumnya jika ada
    closeModal();
    
    modalContainer.innerHTML = `
        <div class="modal fade" id="confirmModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title text-danger">Konfirmasi</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
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
    
    document.getElementById('confirmModalBtn').addEventListener('click', async () => {
        try {
            await onConfirm();
            modal.hide();
        } catch (error) {
            console.error('Error in confirmation:', error);
            showModalError(error.message);
        }
    });
    
    modalElement.addEventListener('hidden.bs.modal', () => {
        closeModal();
    });
    
    // Event listener untuk modal shown - atur fokus
    modalElement.addEventListener('shown.bs.modal', () => {
        const confirmBtn = document.getElementById('confirmModalBtn');
        if (confirmBtn) {
            confirmBtn.focus();
        }
    });
    
    modal.show();
}

// Fungsi untuk menampilkan error dalam modal
function showModalError(errorMessage) {
    showModal(
        "Error",
        `
        <div class="text-center py-4">
            <i class="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
            <h5 class="text-danger">Terjadi Kesalahan</h5>
            <p class="text-muted">${errorMessage}</p>
        </div>
        `,
        null
    );
}

// Fungsi untuk menutup modal - DIEKSPOR
export function closeModal() {
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer) {
        // Hapus semua modal instance Bootstrap yang mungkin masih aktif
        const existingModals = document.querySelectorAll('.modal.show, .modal.fade');
        existingModals.forEach(modal => {
            // Hapus backdrop jika ada
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            
            // Hapus class yang menyebabkan masalah
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'false');
            modal.style.display = 'none';
            
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                try {
                    bsModal.hide();
                    bsModal.dispose();
                } catch (e) {
                    console.warn("Error disposing modal:", e);
                }
            }
            
            modal.remove();
        });
        
        // Hapus modal-backdrop jika masih ada
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        
        // Hapus class dari body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Kosongkan container
        modalContainer.innerHTML = '';
    }
}

// Fungsi tambahan untuk membuat modal lebih aman
export function safeShowModal(title, content, onSave = null) {
    // Pastikan semua modal sebelumnya ditutup
    closeModal();
    
    // Beri jeda kecil sebelum membuat modal baru
    setTimeout(() => {
        showModal(title, content, onSave);
    }, 50);
}