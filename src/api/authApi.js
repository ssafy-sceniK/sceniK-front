import { API_BASE_URL, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, http } from './http.js';

export const GOOGLE_OAUTH_URL = `${API_BASE_URL.replace(/\/$/, '')}/auth/oauth/google`;
export const KAKAO_OAUTH_URL = `${API_BASE_URL.replace(/\/$/, '')}/auth/oauth/kakao`;

export function readAccessToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function readRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function saveAccessToken(token, refreshToken = token) {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearAccessToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function normalizeUser(user = {}) {
  const userId = user.userId ?? user.id;
  return {
    ...user,
    id: user.id ?? userId,
    userId,
    password: undefined,
  };
}

export async function signup(payload) {
  const { data } = await http.post('/auth/signup', payload);
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? data.accessToken,
    user: normalizeUser(data.user),
  };
}

export async function login(payload) {
  const { data } = await http.post('/auth/login', payload);
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? data.accessToken,
    user: normalizeUser(data.user),
  };
}

export async function exchangeOAuthCode(code) {
  const { data } = await http.post('/auth/oauth/exchange', { code });
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? data.accessToken,
    user: normalizeUser(data.user),
  };
}

export async function checkEmailAvailability(email) {
  const { data } = await http.get('/auth/check-email', { params: { email } });
  return data;
}

export async function logout() {
  await http.post('/auth/logout');
}

export async function refreshToken() {
  const { data } = await http.post('/auth/token/refresh', {
    refreshToken: readRefreshToken(),
  });
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? data.accessToken,
    user: normalizeUser(data.user),
  };
}

export async function fetchMe() {
  const { data } = await http.get('/users/me');
  return normalizeUser(data.user ?? data);
}

export async function updateMe(payload) {
  const { data } = await http.patch('/users/me', payload);
  return normalizeUser(data.user ?? data);
}
