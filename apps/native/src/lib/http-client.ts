import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
// In React Native, environment variables from the shared package or expo-constants need careful handling.
// Assuming a fallback or standard import for now:
import { env } from "@UniSphere_cor/env/native";
import * as SecureStore from 'expo-secure-store';

const serverBaseURL = env.EXPO_PUBLIC_SERVER_URL;

export const httpClient = axios.create({
  baseURL: serverBaseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
});

// Since SecureStore operations are async, we manage a sync cache for interceptor speed,
// initialized on app load, or just await the store in the interceptor.
let accessTokenCache: string | null = null;

export const getAccessToken = async () => {
  if (accessTokenCache) return accessTokenCache;
  accessTokenCache = await SecureStore.getItemAsync("accessToken");
  return accessTokenCache;
};

export const getRefreshToken = async () => {
  return await SecureStore.getItemAsync("refreshToken");
};

export const setTokens = async (accessToken: string, refreshToken: string) => {
  accessTokenCache = accessToken;
  await SecureStore.setItemAsync("accessToken", accessToken);
  await SecureStore.setItemAsync("refreshToken", refreshToken);
};

export const clearTokens = async () => {
  accessTokenCache = null;
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
};

// Interceptor to add auth token
httpClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Interceptor to handle 401s and refresh tokens
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes("/auth/refresh") || originalRequest.url?.includes("/auth/login")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return httpClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        await clearTokens();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<any>(`${serverBaseURL}/api/v1/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;
        await setTokens(newAccessToken, newRefreshToken);

        httpClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return httpClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        await clearTokens();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
