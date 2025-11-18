// toast.js - 모던한 토스트 알림 시스템

// Material Symbols 폰트 로드 확인 및 추가
if (!document.querySelector('link[href*="Material+Symbols"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
    document.head.appendChild(link);
}

// Material Symbols 아이콘 스타일 추가
if (!document.getElementById('toast-icon-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-icon-styles';
    style.textContent = `
        .material-symbols-outlined {
            font-family: 'Material Symbols Outlined';
            font-weight: normal;
            font-style: normal;
            font-size: 24px;
            line-height: 1;
            letter-spacing: normal;
            text-transform: none;
            display: inline-block;
            white-space: nowrap;
            word-wrap: normal;
            direction: ltr;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
            font-feature-settings: 'liga';
        }
    `;
    document.head.appendChild(style);
}

// 토스트 컨테이너 초기화
function initToastContainer() {
    if (document.getElementById('toast-container')) return;
    
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none';
    container.style.maxWidth = '90vw';
    container.style.width = '400px';
    document.body.appendChild(container);
}

// 토스트 표시 함수
function showToast(message, type = 'info', duration = 3000) {
    initToastContainer();
    
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto transform transition-all duration-300 ease-out translate-x-full opacity-0';
    
    // 타입별 스타일
    const typeStyles = {
        success: {
            bg: 'bg-green-500',
            icon: 'info',
            iconBg: 'bg-green-600'
        },
        error: {
            bg: 'bg-red-500',
            icon: 'error',
            iconBg: 'bg-red-600'
        },
        warning: {
            bg: 'bg-yellow-500',
            icon: 'warning',
            iconBg: 'bg-yellow-600'
        },
        info: {
            bg: 'bg-blue-500',
            icon: 'info',
            iconBg: 'bg-blue-600'
        }
    };
    
    const style = typeStyles[type] || typeStyles.info;
    
    toast.innerHTML = `
        <div class="${style.bg} text-white rounded-lg shadow-lg overflow-hidden flex items-center min-h-[64px]">
            <div class="${style.iconBg} flex items-center justify-center w-16 h-full py-4">
                <span class="material-symbols-outlined text-3xl">${ style.icon}</span>
            </div>
            <div class="flex-1 px-4 py-3">
                <p class="text-sm font-medium leading-relaxed">${escapeHtml(message)}</p>
            </div>
            <button class="pr-4 py-4 hover:opacity-75 transition-opacity" onclick="this.closest('div').parentElement.remove()">
                <span class="material-symbols-outlined text-xl">close</span>
            </button>
        </div>
    `;
    
    container.appendChild(toast);
    
    // 애니메이션 시작
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
        });
    });
    
    // 자동 제거
    if (duration > 0) {
        setTimeout(() => {
            removeToast(toast);
        }, duration);
    }
    
    return toast;
}

// 토스트 제거 함수
function removeToast(toast) {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 300);
}

// 편의 함수들
function showSuccess(message, duration = 3000) {
    return showToast(message, 'success', duration);
}

function showError(message, duration = 4000) {
    return showToast(message, 'error', duration);
}

function showWarning(message, duration = 3500) {
    return showToast(message, 'warning', duration);
}

function showInfo(message, duration = 3000) {
    return showToast(message, 'info', duration);
}

// 모든 토스트 제거
function clearAllToasts() {
    const container = document.getElementById('toast-container');
    if (container) {
        container.innerHTML = '';
    }
}

// 커스텀 confirm 다이얼로그
function showConfirm(message, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm';
    overlay.style.animation = 'fadeIn 0.2s ease-out';
    
    const dialog = document.createElement('div');
    dialog.className = 'bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-11/12 mx-4 overflow-hidden transform transition-all';
    dialog.style.animation = 'scaleIn 0.3s ease-out';
    
    dialog.innerHTML = `
        <div class="p-6">
            <div class="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <span class="material-symbols-outlined text-3xl text-amber-600 dark:text-amber-400">help</span>
            </div>
            <p class="text-base text-gray-800 dark:text-gray-200 text-center mb-6 leading-relaxed">${escapeHtml(message)}</p>
            <div class="flex gap-3">
                <button id="cancelBtn" class="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    취소
                </button>
                <button id="confirmBtn" class="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors">
                    확인
                </button>
            </div>
        </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // 애니메이션 CSS 추가 (한 번만)
    if (!document.getElementById('toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes scaleIn {
                from { transform: scale(0.9); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    const closeDialog = (result) => {
        overlay.style.animation = 'fadeIn 0.2s ease-out reverse';
        setTimeout(() => {
            overlay.remove();
            if (result && onConfirm) onConfirm();
            if (!result && onCancel) onCancel();
        }, 200);
    };
    
    dialog.querySelector('#confirmBtn').addEventListener('click', () => closeDialog(true));
    dialog.querySelector('#cancelBtn').addEventListener('click', () => closeDialog(false));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeDialog(false);
    });
}

// escapeHtml 함수 (XSS 방지)
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

