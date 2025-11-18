// 프로필 관련 기능

// 본인 프로필 조회
async function getMyProfile() {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  const user = await getCurrentUser();
  if (!user) throw new Error('로그인이 필요합니다');

  try {
    const { data, error } = await client
      .from('profiles')
      .select(`
        *,
        privacy_settings (*),
        careers (*),
        educations (*)
      `)
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// 다른 사용자 프로필 조회
async function getUserProfile(userId) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { data, error } = await client
      .from('profile_with_privacy')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // 비공개 정보 필터링
    if (!data.show_phone) delete data.phone;
    if (!data.show_email) delete data.email;

    // 경력 및 학력 정보 가져오기
    if (data.show_career) {
      const { data: careers } = await client
        .from('careers')
        .select('*')
        .eq('profile_id', userId)
        .order('order');
      data.careers = careers || [];
    }

    if (data.show_education) {
      const { data: educations } = await client
        .from('educations')
        .select('*')
        .eq('profile_id', userId)
        .order('order');
      data.educations = educations || [];
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// 명부 목록 조회 (기수별)
async function getMembersByBatch(batch) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { data, error } = await client
      .from('profiles')
      .select('id, name, batch, company, position, profile_image_url')
      .eq('batch', batch)
      .order('name');

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// 명부 검색
async function searchMembers(searchTerm) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { data, error } = await client
      .from('profiles')
      .select('id, name, batch, company, position, profile_image_url')
      .or(`name.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`)
      .order('batch', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// 프로필 수정
async function updateProfile(updates) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  const user = await getCurrentUser();
  if (!user) throw new Error('로그인이 필요합니다');

  try {
    const { error } = await client
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

// 정보 공개 설정 업데이트
async function updatePrivacySettings(settings) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  const user = await getCurrentUser();
  if (!user) throw new Error('로그인이 필요합니다');

  try {
    const { error } = await client
      .from('privacy_settings')
      .update(settings)
      .eq('profile_id', user.id);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

// 경력 추가
async function addCareer(careerData) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  const user = await getCurrentUser();
  if (!user) throw new Error('로그인이 필요합니다');

  try {
    const { error } = await client
      .from('careers')
      .insert({
        profile_id: user.id,
        ...careerData,
      });

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

// 경력 수정
async function updateCareer(careerId, updates) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { error } = await client
      .from('careers')
      .update(updates)
      .eq('id', careerId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

// 경력 삭제
async function deleteCareer(careerId) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { error } = await client
      .from('careers')
      .delete()
      .eq('id', careerId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

// 학력 추가
async function addEducation(educationData) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  const user = await getCurrentUser();
  if (!user) throw new Error('로그인이 필요합니다');

  try {
    const { error } = await client
      .from('educations')
      .insert({
        profile_id: user.id,
        ...educationData,
      });

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

// 학력 수정
async function updateEducation(educationId, updates) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { error } = await client
      .from('educations')
      .update(updates)
      .eq('id', educationId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}

// 학력 삭제
async function deleteEducation(educationId) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  try {
    const { error } = await client
      .from('educations')
      .delete()
      .eq('id', educationId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
}



