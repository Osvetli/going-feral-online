const BASE = '/api';

function getUserId(): string | null {
  return localStorage.getItem('crazy_user_id');
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const uid = getUserId();
  if (uid) h['x-user-id'] = uid;
  return h;
}

export async function registerUser(nickname: string, password?: string) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Register failed');
  }
  const user = await res.json();
  localStorage.setItem('crazy_user_id', user.id);
  localStorage.setItem('crazy_nickname', user.nickname);
  return user;
}

export async function loginUser(nickname: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Login failed');
  }
  const user = await res.json();
  localStorage.setItem('crazy_user_id', user.id);
  localStorage.setItem('crazy_nickname', user.nickname);
  return user;
}

export async function unregisterUser(password?: string) {
  const res = await fetch(`${BASE}/auth/unregister`, {
    method: 'DELETE',
    headers: headers(),
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Unregister failed');
  }
  return res.json();
}

export async function getMe() {
  const res = await fetch(`${BASE}/auth/me`, { headers: headers() });
  if (!res.ok) return null;
  return res.json();
}

export async function saveRun(data: {
  mode: string;
  inputType: string;
  content: string;
  drawLabel?: string;
  resultCard?: string;
}) {
  const res = await fetch(`${BASE}/runs`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Save run failed');
  return res.json();
}

export async function getRuns(userId: string) {
  const res = await fetch(`${BASE}/runs?userId=${userId}`, { headers: headers() });
  if (!res.ok) throw new Error('Get runs failed');
  return res.json();
}

export async function drawGacha(mode: string, runId?: string) {
  const res = await fetch(`${BASE}/gacha/draw`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ mode, runId }),
  });
  if (!res.ok) throw new Error('Gacha draw failed');
  return res.json();
}

export async function getCollection(userId: string) {
  const res = await fetch(`${BASE}/collection/${userId}`, { headers: headers() });
  if (!res.ok) throw new Error('Get collection failed');
  return res.json();
}

export async function getCollectionStats(userId: string) {
  const res = await fetch(`${BASE}/collection/${userId}/stats`, { headers: headers() });
  if (!res.ok) throw new Error('Get stats failed');
  return res.json();
}

export async function createShare(runId: string) {
  const res = await fetch(`${BASE}/share`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ runId }),
  });
  if (!res.ok) throw new Error('Create share failed');
  return res.json();
}

export async function getShare(id: string) {
  const res = await fetch(`${BASE}/share/${id}`);
  if (!res.ok) throw new Error('Share not found');
  return res.json();
}
