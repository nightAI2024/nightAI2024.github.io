// page-transition.js - 부드러운 페이지 전환 애니메이션

// 페이지 로드 시 페이드인 효과
document.addEventListener('DOMContentLoaded', () => {
    // body에 페이드인 애니메이션 적용
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease-in-out';
    
    requestAnimationFrame(() => {
        document.body.style.opacity = '1';
    });
});

// 부드러운 페이지 이동 함수 (글로벌)
function smoothNavigate(url, delay = 800) {
    return new Promise((resolve) => {
        // 페이드아웃
        document.body.style.opacity = '0';
        
        // 딜레이 후 페이지 이동
        setTimeout(() => {
            window.location.href = url;
            resolve();
        }, delay);
    });
}

// 부드러운 새로고침 함수 (글로벌)
function smoothReload(delay = 300) {
    return new Promise((resolve) => {
        // 페이드아웃
        document.body.style.opacity = '0';
        
        // 딜레이 후 새로고침
        setTimeout(() => {
            window.location.reload();
            resolve();
        }, delay);
    });
}

// 링크 클릭 시 페이드아웃 후 이동
function initPageTransitions() {
    // 모든 내부 링크에 페이드아웃 효과 추가
    document.querySelectorAll('a[href]:not([href^="#"]):not([href^="http"]):not([href^="mailto"]):not([href^="tel"])').forEach(link => {
        link.addEventListener('click', async (e) => {
            const href = link.getAttribute('href');
            
            // 외부 링크나 특수 링크는 무시
            if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) {
                return;
            }
            
            // 새 탭에서 열기는 무시
            if (e.ctrlKey || e.metaKey || e.shiftKey || link.target === '_blank') {
                return;
            }
            
            e.preventDefault();
            
            // 부드러운 페이지 이동
            await smoothNavigate(href, 300);
        });
    });
}

// 전역 함수로 노출
window.smoothNavigate = smoothNavigate;
window.smoothReload = smoothReload;

// DOM 로드 후 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageTransitions);
} else {
    initPageTransitions();
}



