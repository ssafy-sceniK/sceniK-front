import axios from 'axios';
import { getCurrentLocale } from '../i18n/index.js';
import { attachUserMessage, unwrapApiData } from './error.js';

export const AUTH_TOKEN_KEY = 'scenik-access-token';
export const REFRESH_TOKEN_KEY = 'scenik-refresh-token';
export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api';
const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+\-.]*:/i;
const API_UPLOAD_PATH_PATTERN = /^(?:\/?api\/uploads\/|\/?uploads\/)/i;

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

function browserOrigin() {
  return globalThis.location?.origin || 'http://localhost';
}

function apiOrigin() {
  try {
    return new URL(API_BASE_URL, browserOrigin()).origin;
  } catch {
    return browserOrigin();
  }
}

export function resolveApiAssetUrl(value) {
  const url = String(value ?? '').trim();
  if (!url) return '';
  if (ABSOLUTE_URL_PATTERN.test(url) || url.startsWith('//')) return url;
  if (!API_UPLOAD_PATH_PATTERN.test(url)) return url;

  const uploadPath = url.startsWith('/') ? url : `/${url}`;
  const apiPath = uploadPath.startsWith('/uploads/') ? `/api${uploadPath}` : uploadPath;

  try {
    return new URL(apiPath, apiOrigin()).toString();
  } catch {
    return apiPath;
  }
}

http.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['Accept-Language'] = getCurrentLocale();
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const isAuthRequest = original?.url?.includes('/auth/login')
      || original?.url?.includes('/auth/signup')
      || original?.url?.includes('/auth/oauth/exchange')
      || original?.url?.includes('/auth/token/refresh');

    if (status !== 401 || !refreshToken || original?._retry || isAuthRequest) {
      return Promise.reject(attachUserMessage(error));
    }

    original._retry = true;
    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh`, { refreshToken });
      const tokenPayload = unwrapApiData(data) ?? {};
      if (tokenPayload.accessToken) localStorage.setItem(AUTH_TOKEN_KEY, tokenPayload.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokenPayload.refreshToken ?? tokenPayload.accessToken ?? refreshToken);
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${tokenPayload.accessToken}`;
      original.headers['Accept-Language'] = getCurrentLocale();
      return http(original);
    } catch (refreshError) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return Promise.reject(attachUserMessage(refreshError));
    }
  },
);
