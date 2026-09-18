const TOKEN_KEY = 'special-deck-cloud-token';
const ACCOUNT_KEY = 'special-deck-cloud-account';

const API_BASE = 'https://special-deck.onrender.com';

const api = (path, options = {}) =>
  fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  }).then(async (r) => {
    const d = await r.json().catch(() => ({}));

    if (!r.ok) {
      throw new Error(d.error || 'Request failed');
    }

    return d;
  });

export function loadAccount() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || 'null');
  } catch {
    return null;
  }
}

export function loadToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

function store(d) {
  localStorage.setItem(TOKEN_KEY, d.token);
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(d.user));

  return {
    ...d.user,
    token: d.token,
  };
}

export async function registerAccount(name, email, password) {
  const d = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });

  return store(d);
}

export async function loginAccount(email, password) {
  const d = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  });

  return store(d);
}

export async function syncCloud(data) {
  const token = loadToken();

  if (!token) {
    throw new Error('Please sign in first.');
  }

  return api('/api/account/sync', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function loadCloud() {
  const token = loadToken();

  if (!token) {
    throw new Error('Please sign in first.');
  }

  return api('/api/account/data', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function logoutAccount() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ACCOUNT_KEY);
}
