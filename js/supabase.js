// Supabase 클라이언트 초기화
// CDN을 통해 로드된 supabase를 사용합니다

let supabaseClient = null;

// Supabase 클라이언트 초기화
function initSupabase() {
  // 이미 초기화되어 있으면 기존 클라이언트 반환
  if (supabaseClient !== null) {
    return supabaseClient;
  }

  // Supabase 라이브러리가 로드되었는지 확인
  if (typeof supabase === 'undefined') {
    return null;
  }

  try {
    // Supabase 클라이언트 생성
    supabaseClient = supabase.createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey
    );
    return supabaseClient;
  } catch (error) {
    return null;
  }
}

// 현재 사용자 가져오기
async function getCurrentUser() {
  const client = initSupabase();
  if (!client) return null;

  try {
    const { data: { user }, error } = await client.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    return null;
  }
}

// 현재 세션 가져오기
async function getCurrentSession() {
  const client = initSupabase();
  if (!client) return null;

  try {
    const { data: { session }, error } = await client.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    return null;
  }
}

// 로그인 상태 확인 및 리디렉션
async function requireAuth() {
  const session = await getCurrentSession();
  if (!session) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

// 로그아웃 상태 확인 및 리디렉션 (로그인/회원가입 페이지용)
async function requireGuest() {
  const session = await getCurrentSession();
  if (session) {
    window.location.href = '/main.html';
    return false;
  }
  return true;
}

// 관리자 권한 확인
async function isAdmin() {
  const client = initSupabase();
  if (!client) return false;

  const user = await getCurrentUser();
  if (!user) return false;

  try {
    const { data, error } = await client
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return !!data;
  } catch (error) {
    return false;
  }
}

// 에러 메시지 표시
function showError(message) {
  alert(message); // 간단한 alert, 나중에 더 나은 UI로 교체 가능
}

// 성공 메시지 표시
function showSuccess(message) {
  alert(message);
}

// 로딩 상태 표시/숨김
function setLoading(elementId, isLoading) {
  const element = document.getElementById(elementId);
  if (!element) return;

  if (isLoading) {
    element.disabled = true;
    element.classList.add('opacity-50', 'cursor-not-allowed');
  } else {
    element.disabled = false;
    element.classList.remove('opacity-50', 'cursor-not-allowed');
  }
}

// 날짜 포맷팅
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  // 1분 미만
  if (diff < 60000) {
    return '방금 전';
  }
  // 1시간 미만
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}분 전`;
  }
  // 24시간 미만
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}시간 전`;
  }
  // 7일 미만
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}일 전`;
  }

  // 그 외
  return date.toLocaleDateString('ko-KR');
}

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 페이지 초기화 시 Supabase 클라이언트 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
});

