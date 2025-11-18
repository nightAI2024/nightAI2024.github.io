// 인증 관련 기능

// 회원가입 - Step 1: 회원 검증
async function verifyMember(name, birthDate, phone) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { data, error } = await client
      .from('members')
      .select('*')
      .eq('name', name)
      .eq('birth_date', birthDate)
      .eq('phone', phone)
      .eq('is_registered', false)
      .single();

    if (error || !data) {
      throw new Error('등록된 회원 정보가 없거나 이미 가입되었습니다.');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// 회원가입 - Step 2: 계정 생성
async function signUp(email, password, memberData) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    // 1. Auth 회원가입
    const { data: authData, error: authError } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: memberData.name,
          batch: memberData.batch
        }
      }
    });

    if (authError) {
      // 에러 정보를 더 상세하게 전달
      const error = new Error(authError.message || '회원가입에 실패했습니다.');
      error.status = authError.status;
      error.originalError = authError;
      throw error;
    }

    if (!authData.user) {
      throw new Error('사용자 생성에 실패했습니다.');
    }

    // 잠시 대기 (세션 안정화)
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. 프로필 생성
    const { data: profileData, error: profileError } = await client
      .from('profiles')
      .insert({
        id: authData.user.id,
        member_id: memberData.id,
        name: memberData.name,
        batch: memberData.batch,
        email: email,
        phone: memberData.phone,
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(`프로필 생성 실패: ${profileError.message}`);
    }

    // 3. 회원 등록 완료 표시
    const { error: updateError } = await client
      .from('members')
      .update({ is_registered: true })
      .eq('id', memberData.id);

    if (updateError) {
      throw new Error(`회원 등록 완료 처리 실패: ${updateError.message}`);
    }

    return authData;
  } catch (error) {
    throw error;
  }
}

// 로그인
async function signIn(email, password) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// 로그아웃
async function signOut() {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { error } = await client.auth.signOut();
    if (error) throw error;
    
    // 로그인 페이지로 리디렉션
    window.location.href = '/login.html';
  } catch (error) {
    throw error;
  }
}

// 비밀번호 재설정 이메일 전송
async function sendPasswordResetEmail(email) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    // reset-password.html로 리다이렉트 설정
    const baseUrl = window.location.origin;
    const redirectTo = `${baseUrl}/reset-password.html`;
    
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

// 비밀번호 업데이트 (재설정)
async function updatePassword(newPassword) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { error } = await client.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

// 인증 상태 변화 감지
function onAuthStateChange(callback) {
  const client = initSupabase();
  if (!client) return null;

  const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return subscription;
}

// 로그인 필수 (로그인하지 않은 경우 login.html로 리디렉션)
async function requireAuth() {
  const client = initSupabase();
  if (!client) {
    window.location.href = 'login.html';
    return null;
  }

  const { data: { session } } = await client.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }

  return session;
}

// 게스트 필수 (로그인한 경우 main.html로 리디렉션)
async function requireGuest() {
  const client = initSupabase();
  if (!client) return;

  const { data: { session } } = await client.auth.getSession();
  if (session) {
    window.location.href = 'main.html';
  }
}

// 로딩 상태 설정
function setLoading(elementId, isLoading) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  element.disabled = isLoading;
  if (isLoading) {
    element.style.opacity = '0.6';
    element.style.cursor = 'wait';
  } else {
    element.style.opacity = '1';
    element.style.cursor = 'pointer';
  }
}
