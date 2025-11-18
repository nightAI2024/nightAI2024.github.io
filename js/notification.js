// 알림 관련 기능

// 전체 알림 조회
async function getNotifications() {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// 읽지 않은 알림 조회
async function getUnreadNotifications() {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// 유형별 알림 조회
async function getNotificationsByType(type) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// 알림 읽음 처리
async function markAsRead(notificationId) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    await client.rpc('mark_notification_as_read', {
      notification_uuid: notificationId,
    });
  } catch (error) {
    throw error;
  }
}

// 모든 알림 읽음 처리
async function markAllAsRead() {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    await client.rpc('mark_all_notifications_as_read');
  } catch (error) {
    throw error;
  }
}

// 읽지 않은 알림 수 조회
async function getUnreadCount() {
  const client = initSupabase();
  if (!client) return 0;

  try {
    const { count, error } = await client
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    return 0;
  }
}

// 실시간 알림 구독
function subscribeToNotifications(callback) {
  const client = initSupabase();
  if (!client) return null;

  getCurrentUser().then(user => {
    if (!user) return;

    const subscription = client
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  });
}

// 알림 구독 해제
function unsubscribeFromNotifications(subscription) {
  if (subscription) {
    subscription.unsubscribe();
  }
}



