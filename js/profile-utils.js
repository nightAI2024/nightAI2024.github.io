// 프로필 이미지 유틸리티 함수

/**
 * 이름을 기반으로 일관된 배경색 생성
 * @param {string} name - 사용자 이름
 * @returns {string} - 배경색 (Tailwind CSS 클래스)
 */
function getProfileColor(name) {
    if (!name) return 'bg-gray-400';
    
    // 이름의 첫 글자 코드를 기반으로 색상 선택
    const colors = [
        'bg-red-500',
        'bg-orange-500',
        'bg-amber-500',
        'bg-yellow-500',
        'bg-lime-500',
        'bg-green-500',
        'bg-emerald-500',
        'bg-teal-500',
        'bg-cyan-500',
        'bg-sky-500',
        'bg-blue-500',
        'bg-indigo-500',
        'bg-violet-500',
        'bg-purple-500',
        'bg-fuchsia-500',
        'bg-pink-500',
        'bg-rose-500'
    ];
    
    // 이름의 모든 문자 코드 합계로 해시 생성
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    
    return colors[hash % colors.length];
}

/**
 * 이름을 기반으로 CSS 배경색 생성 (inline style용)
 * @param {string} name - 사용자 이름
 * @returns {string} - 배경색 (hex)
 */
function getProfileColorHex(name) {
    if (!name) return '#9ca3af';
    
    const colors = [
        '#ef4444', // red
        '#f97316', // orange
        '#f59e0b', // amber
        '#eab308', // yellow
        '#84cc16', // lime
        '#22c55e', // green
        '#10b981', // emerald
        '#14b8a6', // teal
        '#06b6d4', // cyan
        '#0ea5e9', // sky
        '#3b82f6', // blue
        '#6366f1', // indigo
        '#8b5cf6', // violet
        '#a855f7', // purple
        '#d946ef', // fuchsia
        '#ec4899', // pink
        '#f43f5e'  // rose
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    
    return colors[hash % colors.length];
}

/**
 * 프로필 이미지 HTML 생성 (아바타)
 * @param {Object} profile - 프로필 객체 {name, profile_image_url}
 * @param {string} size - 크기 ('sm', 'md', 'lg', 'xl')
 * @returns {string} - HTML 문자열
 */
function createProfileAvatar(profile, size = 'md') {
    const textSizes = {
        sm: 'text-xs',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-4xl'
    };
    
    const textSizeClass = textSizes[size] || textSizes.md;
    const initial = profile?.name?.[0]?.toUpperCase() || '?';
    
    if (profile?.profile_image_url) {
        return `
            <img src="${escapeHtml(profile.profile_image_url)}" 
                 alt="${escapeHtml(profile?.name || 'Profile')}"
                 class="w-full h-full object-cover rounded-full" />
        `;
    } else {
        const bgColor = getProfileColorHex(profile?.name);
        return `
            <div class="w-full h-full rounded-full flex items-center justify-center text-white font-bold ${textSizeClass}" 
                style="background-color: ${bgColor}">
                ${initial}
            </div>
        `;
    }
}

/**
 * 프로필 이미지 DOM 요소 설정
 * @param {HTMLElement} element - DOM 요소
 * @param {Object} profile - 프로필 객체 {name, profile_image_url}
 */
function setProfileImage(element, profile) {
    if (!element) return;
    
    const initial = profile?.name?.[0]?.toUpperCase() || '?';
    
    if (profile?.profile_image_url) {
        element.style.backgroundImage = `url('${profile.profile_image_url}')`;
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';
        element.textContent = '';
        element.className = element.className.replace(/bg-\w+-\d+/g, '');
    } else {
        const bgColor = getProfileColorHex(profile?.name);
        element.style.backgroundImage = '';
        element.style.backgroundColor = bgColor;
        element.textContent = initial;
        element.className = element.className + ' flex items-center justify-center text-white font-bold';
    }
}

/**
 * 이미지 파일 업로드 (Supabase Storage)
 * @param {File} file - 이미지 파일
 * @param {string} userId - 사용자 ID
 * @returns {Promise<string>} - 업로드된 이미지 URL
 */
async function uploadProfileImage(file, userId) {
    // 파일 크기 확인 (3MB = 3 * 1024 * 1024 bytes)
    const maxSize = 3 * 1024 * 1024;
    if (file.size > maxSize) {
        throw new Error('이미지 크기는 3MB 이하여야 합니다.');
    }
    
    // 파일 형식 확인
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('JPG, PNG, GIF, WEBP 형식만 업로드 가능합니다.');
    }
    
    const client = initSupabase();
    
    // 파일명 생성 (userId_timestamp.확장자)
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `profiles/${fileName}`;
    
    // Supabase Storage에 업로드
    const { data, error } = await client.storage
        .from('avatars')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });
    
    if (error) throw error;
    
    // Public URL 가져오기
    const { data: urlData } = client.storage
        .from('avatars')
        .getPublicUrl(filePath);
    
    return urlData.publicUrl;
}

/**
 * 프로필 이미지 삭제 (Supabase Storage)
 * @param {string} imageUrl - 삭제할 이미지 URL
 */
async function deleteProfileImage(imageUrl) {
    if (!imageUrl) return;
    
    const client = initSupabase();
    
    // URL에서 파일 경로 추출
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `profiles/${fileName}`;
    
    const { error } = await client.storage
        .from('avatars')
        .remove([filePath]);
    
}

