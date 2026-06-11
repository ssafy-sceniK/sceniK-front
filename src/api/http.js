import axios from 'axios';
import { attachUserMessage, unwrapApiData } from './error.js';

export const AUTH_TOKEN_KEY = 'scenik-access-token';
export const REFRESH_TOKEN_KEY = 'scenik-refresh-token';
export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
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
      return http(original);
    } catch (refreshError) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return Promise.reject(attachUserMessage(refreshError));
    }
  },
);
