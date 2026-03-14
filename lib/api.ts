import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types';
import { getAccessToken, getRefreshToken, setTokens, clearTokens, isTokenExpired } from '@/lib/auth/token';
import { refreshTokenApi } from '@/lib/auth/api';

// API base URL - adjust for production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Create axios instance with defaults
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function getValidAccessToken(): Promise<string | null> {
    const accessToken = getAccessToken();
    if (accessToken && !isTokenExpired(accessToken)) {
        return accessToken;
    }

    // Token is expired, try to refresh
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        clearTokens();
        return null;
    }

    // Avoid multiple concurrent refresh calls
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = refreshTokenApi(refreshToken)
        .then((response) => {
            setTokens(response.accessToken, response.refreshToken);
            return response.accessToken;
        })
        .catch(() => {
            clearTokens();
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
            return null as unknown as string;
        })
        .finally(() => {
            isRefreshing = false;
            refreshPromise = null;
        });

    return refreshPromise;
}

// Request interceptor - inject auth token
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await getValidAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (process.env.NODE_ENV === 'development') {
            console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            if (status === 401) {
                // Token might have expired during the request - try refresh once
                const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
                if (originalRequest && !originalRequest._retry) {
                    originalRequest._retry = true;
                    const newToken = await getValidAccessToken();
                    if (newToken) {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return api(originalRequest);
                    }
                }
                // If refresh fails, redirect to login
                clearTokens();
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            } else if (status === 403) {
                console.error('[API] Forbidden - insufficient permissions');
            } else if (status === 404) {
                console.error('[API] Resource not found');
            } else if (status >= 500) {
                console.error('[API] Server error:', data?.message);
            }

            return Promise.reject({
                statusCode: status,
                message: data?.message || 'An error occurred',
                error: data?.error,
            } as ApiError);
        } else if (error.request) {
            console.error('[API] Network error - no response received');
            return Promise.reject({
                statusCode: 0,
                message: 'Network error - please check your connection',
            } as ApiError);
        } else {
            console.error('[API] Request error:', error.message);
            return Promise.reject({
                statusCode: 0,
                message: error.message,
            } as ApiError);
        }
    }
);

export default api;
