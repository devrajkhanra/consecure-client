import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types';

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

// Request interceptor for logging and auth tokens
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Add auth token if available (future implementation)
        // const token = localStorage.getItem('accessToken');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }

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
    (error: AxiosError<ApiError>) => {
        if (error.response) {
            // Server responded with error status
            const status = error.response.status;
            const data = error.response.data;

            if (status === 401) {
                // Handle unauthorized - redirect to login (future implementation)
                console.error('[API] Unauthorized - redirecting to login');
            } else if (status === 403) {
                console.error('[API] Forbidden - insufficient permissions');
            } else if (status === 404) {
                console.error('[API] Resource not found');
            } else if (status >= 500) {
                console.error('[API] Server error:', data?.message);
            }

            // Return a standardized error
            return Promise.reject({
                statusCode: status,
                message: data?.message || 'An error occurred',
                error: data?.error,
            } as ApiError);
        } else if (error.request) {
            // Request was made but no response received
            console.error('[API] Network error - no response received');
            return Promise.reject({
                statusCode: 0,
                message: 'Network error - please check your connection',
            } as ApiError);
        } else {
            // Something happened in setting up the request
            console.error('[API] Request error:', error.message);
            return Promise.reject({
                statusCode: 0,
                message: error.message,
            } as ApiError);
        }
    }
);

export default api;
