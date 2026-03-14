import axios from 'axios';
import type { AuthResponse, LoginCredentials, RegisterCredentials } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Separate axios instance for auth calls (no interceptors to avoid circular deps)
const authApi = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

export async function loginApi(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await authApi.post<AuthResponse>('/auth/login', credentials);
    return data;
}

export async function registerApi(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { data } = await authApi.post<AuthResponse>('/auth/register', credentials);
    return data;
}

export async function refreshTokenApi(refreshToken: string): Promise<AuthResponse> {
    const { data } = await authApi.post<AuthResponse>('/auth/refresh', { refreshToken });
    return data;
}

export async function logoutApi(accessToken: string): Promise<void> {
    await authApi.post('/auth/logout', null, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
}
