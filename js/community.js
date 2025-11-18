// 커뮤니티 관련 기능

// 최신글 조회
async function getRecentPosts(limit = 20) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { data, error } = await client
      .from('posts_with_details')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// 인기글 조회
async function getPopularPosts(limit = 20) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { data, error } = await client
      .from('posts_with_details')
      .select('*')
      .order('like_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// 내 글 조회
async function getMyPosts() {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  const user = await getCurrentUser();
  if (!user) throw new Error('로그인이 필요합니다');

  try {
    const { data, error } = await client
      .from('posts_with_details')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// 게시글 작성
async function createPost(content, links = []) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  const user = await getCurrentUser();
  if (!user) throw new Error('로그인이 필요합니다');

  try {
    // 게시글 생성
    const { data: post, error: postError } = await client
      .from('posts')
      .insert({
        author_id: user.id,
        content,
      })
      .select()
      .single();

    if (postError) throw postError;

    // 링크 추가
    if (links.length > 0) {
      const linkData = links.map((link, index) => ({
        post_id: post.id,
        url: link.url,
        title: link.title,
        order: index,
      }));

      const { error: linksError } = await client
        .from('post_links')
        .insert(linkData);

      if (linksError) throw linksError;
    }

    return post;
  } catch (error) {
    throw error;
  }
}

// 게시글 상세 조회
async function getPostDetail(postId) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    // 게시글 정보
    const { data: post, error: postError } = await client
      .from('posts_with_details')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError) throw postError;

    // 링크 정보
    const { data: links } = await client
      .from('post_links')
      .select('*')
      .eq('post_id', postId)
      .order('order');

    post.links = links || [];

    return post;
  } catch (error) {
    throw error;
  }
}

// 게시글 수정
async function updatePost(postId, content) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { error } = await client
      .from('posts')
      .update({ content })
      .eq('id', postId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

// 게시글 삭제
async function deletePost(postId) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { error } = await client
      .from('posts')
      .update({ is_deleted: true })
      .eq('id', postId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

// 좋아요 추가
async function likePost(postId) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  const user = await getCurrentUser();
  if (!user) throw new Error('로그인이 필요합니다');

  try {
    const { error } = await client
      .from('post_likes')
      .insert({
        post_id: postId,
        user_id: user.id,
      });

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

// 좋아요 취소
async function unlikePost(postId) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  const user = await getCurrentUser();
  if (!user) throw new Error('로그인이 필요합니다');

  try {
    const { error } = await client
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

// 좋아요 여부 확인
async function isPostLiked(postId) {
  const client = initSupabase();
  if (!client) return false;

  const user = await getCurrentUser();
  if (!user) return false;

  try {
    const { data, error } = await client
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    return !!data;
  } catch (error) {
    return false;
  }
}

// 댓글 목록 조회 (계층 구조)
async function getComments(postId) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { data, error } = await client
      .from('comments_with_details')
      .select('*')
      .eq('post_id', postId)
      .order('created_at');

    if (error) throw error;

    // 댓글을 계층 구조로 변환
    const commentsMap = {};
    const rootComments = [];

    data.forEach(comment => {
      comment.replies = [];
      commentsMap[comment.id] = comment;

      if (comment.parent_comment_id) {
        // 대댓글
        const parent = commentsMap[comment.parent_comment_id];
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        // 일반 댓글
        rootComments.push(comment);
      }
    });

    return rootComments;
  } catch (error) {
    throw error;
  }
}

// 댓글 작성
async function createComment(postId, content) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  const user = await getCurrentUser();
  if (!user) throw new Error('로그인이 필요합니다');

  try {
    const { error } = await client
      .from('comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        content,
      });

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

// 대댓글 작성
async function createReply(postId, parentCommentId, content) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  const user = await getCurrentUser();
  if (!user) throw new Error('로그인이 필요합니다');

  try {
    const { error } = await client
      .from('comments')
      .insert({
        post_id: postId,
        parent_comment_id: parentCommentId,
        author_id: user.id,
        content,
      });

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

// 댓글 수정
async function updateComment(commentId, content) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { error } = await client
      .from('comments')
      .update({ content })
      .eq('id', commentId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

// 댓글 삭제
async function deleteComment(commentId) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { error } = await client
      .from('comments')
      .update({ is_deleted: true, content: '삭제된 댓글입니다.' })
      .eq('id', commentId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}



