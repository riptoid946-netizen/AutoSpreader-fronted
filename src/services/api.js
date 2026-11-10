// Base API URL supports Vercel -> Railway deployment (auto-adds https:// if missing)
let rawHost = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '') : '';
if (rawHost && !rawHost.startsWith('http://') && !rawHost.startsWith('https://')) {
  rawHost = `https://${rawHost}`;
}
const API_HOST = rawHost;
const BASE_URL = `${API_HOST}/api`;

export function getActiveAccountId() {
  return localStorage.getItem('wa_active_account') || 'default';
}

export function setActiveAccountId(id) {
  localStorage.setItem('wa_active_account', id);
  window.dispatchEvent(new CustomEvent('wa-account-changed', { detail: id }));
}

function getHeaders(customHeaders = {}) {
  return {
    'x-account-id': getActiveAccountId(),
    ...customHeaders,
  };
}

// Multi-Account Management APIs
export async function getAccounts() {
  const res = await fetch(`${BASE_URL}/accounts`, { headers: getHeaders() });
  return res.json();
}

export async function createAccount(name) {
  const res = await fetch(`${BASE_URL}/accounts`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function deleteAccount(id) {
  const res = await fetch(`${BASE_URL}/accounts/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return res.json();
}

export async function connectAccount(id) {
  const res = await fetch(`${BASE_URL}/accounts/${id}/connect`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return res.json();
}

// Mode 1 Config APIs
export async function getConfig() {
  const res = await fetch(`${BASE_URL}/config`, { headers: getHeaders() });
  return res.json();
}

export async function updateConfig(data) {
  const res = await fetch(`${BASE_URL}/config`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getStats() {
  const res = await fetch(`${BASE_URL}/stats`, { headers: getHeaders() });
  return res.json();
}

export async function getLogs(limit = 50) {
  const res = await fetch(`${BASE_URL}/logs?limit=${limit}`, { headers: getHeaders() });
  return res.json();
}

export async function getMessages(limit = 100) {
  const res = await fetch(`${BASE_URL}/messages?limit=${limit}`, { headers: getHeaders() });
  return res.json();
}

export async function clearMessages() {
  const res = await fetch(`${BASE_URL}/messages/clear`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return res.json();
}

export async function getWhatsAppStatus() {
  const res = await fetch(`${BASE_URL}/whatsapp/status`, { headers: getHeaders() });
  return res.json();
}

export async function disconnectWhatsApp() {
  const res = await fetch(`${BASE_URL}/whatsapp/disconnect`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return res.json();
}

export async function getWhatsAppChats(includeGroups = false) {
  const res = await fetch(`${BASE_URL}/whatsapp/chats?groups=${includeGroups ? 'true' : 'false'}`, {
    headers: getHeaders(),
  });
  return res.json();
}

export async function startAutomation() {
  const res = await fetch(`${BASE_URL}/automation/start`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({}),
  });
  return res.json();
}

export async function stopAutomation() {
  const res = await fetch(`${BASE_URL}/automation/stop`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return res.json();
}

export async function getAutomationStatus() {
  const res = await fetch(`${BASE_URL}/automation/status`, { headers: getHeaders() });
  return res.json();
}

export async function uploadMedia(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: { 'x-account-id': getActiveAccountId() },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed with status ${res.status}`);
  }

  return res.json();
}

export async function startMode2(payload) {
  const res = await fetch(`${BASE_URL}/mode2/start`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || 'Failed to start Mode 2');
  }
  return data;
}

export async function startMode3(payload) {
  const res = await fetch(`${BASE_URL}/mode3/start`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || 'Failed to start Mode 3');
  }
  return data;
}

export async function getBulkStatus() {
  const res = await fetch(`${BASE_URL}/bulk/status`, { headers: getHeaders() });
  return res.json();
}

export async function stopBulk() {
  const res = await fetch(`${BASE_URL}/bulk/stop`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return res.json();
}
