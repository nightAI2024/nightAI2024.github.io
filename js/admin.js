// 관리자 관련 함수들

// 관리자 권한 확인 (상세 정보 포함)
async function getAdminInfo() {
  const client = initSupabase();
  if (!client) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const { data, error } = await client
      .from('admin_roles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    return null;
  }
}

// 관리자 배지 생성 함수
function createAdminBadge(displayName) {
  const name = displayName || '관리자';
  return `<span class="text-xs font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-500 px-2 py-0.5 rounded-full shadow-sm border border-yellow-400">${escapeHtml(name)}</span>`;
}

// 관리자인지 확인 (간단한 boolean)
async function isAdmin() {
  const adminInfo = await getAdminInfo();
  return !!adminInfo;
}

// 게시글 삭제 권한 확인 (본인 또는 관리자)
async function canDeletePost(authorId) {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // 본인 게시글이면 삭제 가능
  if (user.id === authorId) return true;
  
  // 관리자면 삭제 가능
  const adminInfo = await getAdminInfo();
  return !!adminInfo;
}

// 댓글 삭제 권한 확인 (본인 또는 관리자)
async function canDeleteComment(authorId) {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // 본인 댓글이면 삭제 가능
  if (user.id === authorId) return true;
  
  // 관리자면 삭제 가능
  const adminInfo = await getAdminInfo();
  return !!adminInfo;
}

// 공지사항 작성 권한 확인 (관리자만 가능)
async function canWriteNotice() {
  const adminInfo = await getAdminInfo();
  return !!adminInfo;
}

