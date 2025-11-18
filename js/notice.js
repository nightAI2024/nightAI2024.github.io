// 공지사항 관련 기능

// 공지사항 목록 조회
async function getNotices() {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { data, error } = await client
      .from('notices')
      .select('id, title, created_at, is_important')
      .eq('is_deleted', false)
      .order('is_important', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// 공지사항 상세 조회
async function getNoticeDetail(noticeId) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    // 조회수 증가
    await client.rpc('increment_notice_view_count', {
      notice_uuid: noticeId,
    });

    // 공지사항 정보
    const { data: notice, error: noticeError } = await client
      .from('notices')
      .select(`
        *,
        author:profiles(name)
      `)
      .eq('id', noticeId)
      .single();

    if (noticeError) throw noticeError;

    // 첨부파일
    const { data: attachments } = await client
      .from('notice_attachments')
      .select('*')
      .eq('notice_id', noticeId);

    notice.attachments = attachments || [];

    const { data: linkData } = await client
      .from('notice_links')
      .select('*')
      .eq('notice_id', noticeId)
      .order('order', { ascending: true });

    notice.links = linkData || [];

    return notice;
  } catch (error) {
    throw error;
  }
}

// 공지사항 작성 (관리자만)
async function createNotice(title, content, isImportant = false) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  const user = await getCurrentUser();
  if (!user) throw new Error('로그인이 필요합니다');

  const admin = await isAdmin();
  if (!admin) throw new Error('관리자 권한이 필요합니다');

  try {
    const { data, error } = await client
      .from('notices')
      .insert({
        author_id: user.id,
        title,
        content,
        is_important: isImportant,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// 공지사항 수정 (관리자만)
async function updateNotice(noticeId, updates) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  const admin = await isAdmin();
  if (!admin) throw new Error('관리자 권한이 필요합니다');

  try {
    const { error } = await client
      .from('notices')
      .update(updates)
      .eq('id', noticeId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

// 공지사항 삭제 (관리자만)
async function deleteNotice(noticeId) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  const admin = await isAdmin();
  if (!admin) throw new Error('관리자 권한이 필요합니다');

  try {
    const { error } = await client
      .from('notices')
      .update({ is_deleted: true })
      .eq('id', noticeId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}



