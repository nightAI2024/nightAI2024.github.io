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

// admin_roles.role 이 admin / super_admin 인 경우에만 실질적인 권한 부여
function hasAdminPrivileges(adminInfo) {
  return adminInfo?.role === 'admin' || adminInfo?.role === 'super_admin';
}

// 관리자인지 확인 (간단한 boolean)
async function isAdmin() {
  const adminInfo = await getAdminInfo();
  return hasAdminPrivileges(adminInfo);
}

// 관리자 전용 페이지 접근 가드
async function requireAdmin() {
  const session = await requireAuth();
  if (!session) return false;

  const admin = await isAdmin();
  if (!admin) {
    if (typeof showError === 'function') {
      showError('관리자만 접근할 수 있습니다.');
    }
    setTimeout(() => {
      window.location.href = '/main';
    }, 800);
    return false;
  }
  return true;
}

// 게시글 삭제 권한 확인 (본인 또는 관리자)
async function canDeletePost(authorId) {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // 본인 게시글이면 삭제 가능
  if (user.id === authorId) return true;
  
  // 관리자면 삭제 가능
  const adminInfo = await getAdminInfo();
  return hasAdminPrivileges(adminInfo);
}

// 댓글 삭제 권한 확인 (본인 또는 관리자)
async function canDeleteComment(authorId) {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // 본인 댓글이면 삭제 가능
  if (user.id === authorId) return true;
  
  // 관리자면 삭제 가능
  const adminInfo = await getAdminInfo();
  return hasAdminPrivileges(adminInfo);
}

// 공지사항 작성 권한 확인 (관리자만 가능)
async function canWriteNotice() {
  const adminInfo = await getAdminInfo();
  return hasAdminPrivileges(adminInfo);
}

// ---- 원우회 멤버 관리 ----

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function normalizeBirthDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const digits = raw.replace(/\D/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }

  // Excel serial date
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const serial = Number(raw);
    if (serial > 20000 && serial < 60000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(excelEpoch.getTime() + Math.round(serial) * 86400000);
      return normalizeBirthDate(date);
    }
  }

  return null;
}

function validateMemberPayload(member) {
  const name = String(member.name || '').trim();
  const birth_date = normalizeBirthDate(member.birth_date);
  const phone = normalizePhone(member.phone);
  const batch = String(member.batch || '').trim();

  if (!name) return { ok: false, error: '이름이 필요합니다.' };
  if (!birth_date) return { ok: false, error: '생년월일 형식이 올바르지 않습니다. (YYYY-MM-DD 또는 YYYYMMDD)' };
  if (phone.length < 10 || phone.length > 11) return { ok: false, error: '휴대폰 번호는 10~11자리 숫자여야 합니다.' };
  if (!batch) return { ok: false, error: '기수가 필요합니다.' };

  return {
    ok: true,
    data: {
      name,
      birth_date,
      phone,
      batch,
      is_registered: false,
    },
  };
}

async function listMembers({ search = '', batch = '', registered = '', limit = 100, offset = 0 } = {}) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  let query = client
    .from('members')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    const term = search.trim();
    query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
  }
  if (batch) query = query.eq('batch', batch);
  if (registered === 'true') query = query.eq('is_registered', true);
  if (registered === 'false') query = query.eq('is_registered', false);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

async function addMember(member) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');
  if (!(await isAdmin())) throw new Error('관리자 권한이 필요합니다.');

  const validated = validateMemberPayload(member);
  if (!validated.ok) throw new Error(validated.error);

  const { data: existing } = await client
    .from('members')
    .select('id, name, is_registered')
    .eq('name', validated.data.name)
    .eq('birth_date', validated.data.birth_date)
    .eq('phone', validated.data.phone)
    .maybeSingle();

  if (existing) {
    throw new Error(`이미 등록된 회원입니다: ${existing.name}`);
  }

  const { data, error } = await client
    .from('members')
    .insert(validated.data)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateMember(id, updates) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');
  if (!(await isAdmin())) throw new Error('관리자 권한이 필요합니다.');

  const payload = {};
  if (updates.name !== undefined) payload.name = String(updates.name).trim();
  if (updates.batch !== undefined) payload.batch = String(updates.batch).trim();
  if (updates.phone !== undefined) payload.phone = normalizePhone(updates.phone);
  if (updates.birth_date !== undefined) {
    const birth = normalizeBirthDate(updates.birth_date);
    if (!birth) throw new Error('생년월일 형식이 올바르지 않습니다.');
    payload.birth_date = birth;
  }

  const { data, error } = await client
    .from('members')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteMember(id) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');
  if (!(await isAdmin())) throw new Error('관리자 권한이 필요합니다.');

  const { data: member, error: fetchError } = await client
    .from('members')
    .select('id, is_registered, name')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;
  if (member.is_registered) {
    throw new Error('이미 가입 완료된 회원은 삭제할 수 없습니다. 가입 전 명부만 삭제 가능합니다.');
  }

  const { error } = await client.from('members').delete().eq('id', id);
  if (error) throw error;
  return true;
}

async function bulkAddMembers(rows) {
  if (!(await isAdmin())) throw new Error('관리자 권한이 필요합니다.');

  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');

  const results = { success: [], failed: [] };
  const toInsert = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const validated = validateMemberPayload(row);
    if (!validated.ok) {
      results.failed.push({ row: rowNum, data: row, error: validated.error });
      continue;
    }
    toInsert.push({ rowNum, data: validated.data, raw: row });
  }

  // 기존 중복 체크 (이름+생년월일+휴대폰)
  for (const item of toInsert) {
    try {
      const { data: existing } = await client
        .from('members')
        .select('id, name')
        .eq('name', item.data.name)
        .eq('birth_date', item.data.birth_date)
        .eq('phone', item.data.phone)
        .maybeSingle();

      if (existing) {
        results.failed.push({
          row: item.rowNum,
          data: item.raw,
          error: `이미 등록된 회원입니다: ${existing.name}`,
        });
        continue;
      }

      const { data, error } = await client
        .from('members')
        .insert(item.data)
        .select()
        .single();

      if (error) throw error;
      results.success.push({ row: item.rowNum, member: data });
    } catch (error) {
      results.failed.push({
        row: item.rowNum,
        data: item.raw,
        error: error.message || '추가 실패',
      });
    }
  }

  return results;
}

// ---- 관리자 역할 관리 ----

async function listAdminRoles() {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');
  if (!(await isAdmin())) throw new Error('관리자 권한이 필요합니다.');

  const { data, error } = await client
    .from('admin_roles')
    .select('*, profiles:user_id(id, name, email, members(batch))')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function searchProfilesForAdmin(search, limit = 20) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');
  if (!(await isAdmin())) throw new Error('관리자 권한이 필요합니다.');

  const term = (search || '').trim();
  if (!term) return [];

  const { data, error } = await client
    .from('profiles')
    .select('id, name, email, members(batch)')
    .or(`name.ilike.%${term}%,email.ilike.%${term}%`)
    .limit(limit);

  if (error) throw error;
  return data || [];
}

async function setAdminRole(userId, role = 'admin', displayName = '운영진') {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');
  if (!(await isAdmin())) throw new Error('관리자 권한이 필요합니다.');

  const allowed = ['admin', 'super_admin', 'user'];
  if (!allowed.includes(role)) throw new Error('허용되지 않은 역할입니다.');

  const currentUser = await getCurrentUser();
  if (currentUser?.id === userId && role !== 'admin' && role !== 'super_admin') {
    throw new Error('자신의 관리자 권한은 해제할 수 없습니다.');
  }

  const { data: existing } = await client
    .from('admin_roles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await client
      .from('admin_roles')
      .update({ role, display_name: displayName || '운영진' })
      .eq('user_id', userId)
      .select('*, profiles:user_id(id, name, email)')
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await client
    .from('admin_roles')
    .insert({
      user_id: userId,
      role,
      display_name: displayName || '운영진',
    })
    .select('*, profiles:user_id(id, name, email)')
    .single();

  if (error) throw error;
  return data;
}

async function removeAdminRole(userId) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase 초기화 실패');
  if (!(await isAdmin())) throw new Error('관리자 권한이 필요합니다.');

  const currentUser = await getCurrentUser();
  if (currentUser?.id === userId) {
    throw new Error('자신의 관리자 권한은 해제할 수 없습니다.');
  }

  const { error } = await client.from('admin_roles').delete().eq('user_id', userId);
  if (error) throw error;
  return true;
}

// ---- CSV / Excel 파싱 ----

function parseCsvText(text) {
  const lines = String(text || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) throw new Error('CSV에 데이터가 없습니다.');

  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  const headerMap = {
    name: 'name',
    이름: 'name',
    birth_date: 'birth_date',
    birthdate: 'birth_date',
    생년월일: 'birth_date',
    phone: 'phone',
    휴대폰: 'phone',
    전화번호: 'phone',
    batch: 'batch',
    기수: 'batch',
  };

  const mappedHeaders = headers.map((h) => headerMap[h] || h);
  const required = ['name', 'birth_date', 'phone', 'batch'];
  for (const key of required) {
    if (!mappedHeaders.includes(key)) {
      throw new Error(`필수 컬럼이 없습니다: ${key} (name, birth_date, phone, batch)`);
    }
  }

  return lines.slice(1).map((line) => {
    const cols = parseLine(line);
    const row = {};
    mappedHeaders.forEach((key, idx) => {
      row[key] = cols[idx] ?? '';
    });
    return row;
  });
}

async function parseMemberUploadFile(file) {
  if (!file) throw new Error('파일이 없습니다.');
  const name = (file.name || '').toLowerCase();

  if (name.endsWith('.csv') || file.type === 'text/csv') {
    const text = await file.text();
    return parseCsvText(text);
  }

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    if (typeof XLSX === 'undefined') {
      throw new Error('엑셀 파서 로드에 실패했습니다. CSV로 업로드해 주세요.');
    }
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    if (!json.length) throw new Error('엑셀에 데이터가 없습니다.');

    return json.map((row) => {
      const normalized = {};
      Object.keys(row).forEach((key) => {
        const k = String(key).toLowerCase().replace(/\s+/g, '_');
        const map = {
          name: 'name',
          이름: 'name',
          birth_date: 'birth_date',
          birthdate: 'birth_date',
          생년월일: 'birth_date',
          phone: 'phone',
          휴대폰: 'phone',
          전화번호: 'phone',
          batch: 'batch',
          기수: 'batch',
        };
        normalized[map[k] || map[key] || k] = row[key];
      });
      return normalized;
    });
  }

  throw new Error('CSV 또는 Excel(.xlsx) 파일만 지원합니다.');
}

function downloadMemberSampleCsv() {
  const csv = [
    'name,birth_date,phone,batch',
    '홍길동,1990-01-15,01012345678,3기 서울',
    '김철수,1988-05-20,01098765432,3',
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '원우회_멤버_샘플.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

