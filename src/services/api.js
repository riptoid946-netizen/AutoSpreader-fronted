// Base API URL supports Vercel -> Railway deployment (auto-adds https:// if missing)
let rawHost = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '') : '';
if (rawHost && !rawHost.startsWith('http://') && !rawHost.startsWith('https://')) {
  rawHost = `https://${rawHost}`;
}
const API_HOST = rawHost;
const BASE_URL = `${API_HOST}/api`;

const TOKEN_KEY = 'wa_auth_token';
const USER_KEY = 'wa_auth_user';
const ACCOUNT_KEY = 'wa_active_account';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function setAuthSession({ token, user, defaultAccountId }) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (defaultAccountId) localStorage.setItem(ACCOUNT_KEY, defaultAccountId);
  window.dispatchEvent(new CustomEvent('wa-auth-changed', { detail: user }));
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACCOUNT_KEY);
  window.dispatchEvent(new CustomEvent('wa-auth-changed', { detail: null }));
}

export function logoutUser() {
  clearAuthSession();
}

export function getActiveAccountId() {
  return localStorage.getItem(ACCOUNT_KEY) || '';
}

export function setActiveAccountId(id) {
  localStorage.setItem(ACCOUNT_KEY, id);
  window.dispatchEvent(new CustomEvent('wa-account-changed', { detail: id }));
}

function getHeaders(customHeaders = {}) {
  const token = getAuthToken();
  const activeId = getActiveAccountId();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(activeId ? { 'x-account-id': activeId } : {}),
    ...customHeaders,
  };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: getHeaders(options.headers || {}),
  });

  if (res.status === 401) {
    clearAuthSession();
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

// ==========================================
// Authentication APIs
// ==========================================

export async function getAuthSetupStatus() {
  const res = await fetch(`${BASE_URL}/auth/setup-status`);
  return res.json();
}

export async function setupOwner(username, password) {
  const res = await fetch(`${BASE_URL}/auth/setup-owner`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || 'Owner setup failed');
  }
  setAuthSession(data);
  return data;
}

export async function loginUser(username, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.error || 'Login failed');
  }
  setAuthSession(data);
  return data;
}

export async function getMe() {
  return apiFetch('/auth/me');
}

// ==========================================
// Admin-Only User Management APIs
// ==========================================

export async function adminListUsers() {
  return apiFetch('/admin/users');
}

export async function adminCreateUser(payload) {
  return apiFetch('/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function adminUpdateUser(id, payload) {
  return apiFetch(`/admin/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function adminDeleteUser(id) {
  return apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
}

// Multi-Account Management APIs (Scoped to Logged-in User)
export async function getAccounts() {
  return apiFetch('/accounts');
}

export async function createAccount(name) {
  return apiFetch('/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export async function deleteAccount(id) {
  return apiFetch(`/accounts/${id}`, { method: 'DELETE' });
}

export async function connectAccount(id) {
  return apiFetch(`/accounts/${id}/connect`, { method: 'POST' });
}

// Mode 1 Config APIs
export async function getConfig() {
  return apiFetch('/config');
}

export async function updateConfig(data) {
  return apiFetch('/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function getStats() {
  return apiFetch('/stats');
}

export async function getLogs(limit = 50) {
  return apiFetch(`/logs?limit=${limit}`);
}

export async function getMessages(limit = 100) {
  return apiFetch(`/messages?limit=${limit}`);
}

export async function clearMessages() {
  return apiFetch('/messages/clear', { method: 'POST' });
}

export async function getWhatsAppStatus() {
  return apiFetch('/whatsapp/status');
}

export async function disconnectWhatsApp() {
  return apiFetch('/whatsapp/disconnect', { method: 'POST' });
}

export async function getWhatsAppChats(includeGroups = false, onlyUnread = false) {
  return apiFetch(
    `/whatsapp/chats?groups=${includeGroups ? 'true' : 'false'}&onlyUnread=${onlyUnread ? 'true' : 'false'}`
  );
}

export async function startAutomation() {
  return apiFetch('/automation/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

export async function stopAutomation() {
  return apiFetch('/automation/stop', { method: 'POST' });
}

export async function getAutomationStatus() {
  return apiFetch('/automation/status');
}

export async function uploadMedia(file) {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAuthToken();
  const activeId = getActiveAccountId();
  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(activeId ? { 'x-account-id': activeId } : {}),
    },
    body: formData,
  });

  if (res.status === 401) {
    clearAuthSession();
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed with status ${res.status}`);
  }

  return res.json();
}

export async function startMode2(payload) {
  return apiFetch('/mode2/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function startMode3(payload) {
  return apiFetch('/mode3/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getBulkStatus() {
  return apiFetch('/bulk/status');
}

export async function stopBulk() {
  return apiFetch('/bulk/stop', { method: 'POST' });
}
