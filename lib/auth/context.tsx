'use client';

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser, LoginCredentials, RegisterCredentials } from '@/types/auth';
import { Role } from '@/types/auth';
import { getAccessToken, getRefreshToken, setTokens, clearTokens, isTokenExpired } from './token';
import { loginApi, registerApi, refreshTokenApi, logoutApi } from './api';

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<void>;
    logout: () => Promise<void>;
    hasMinRole: (requiredRole: Role) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_HIERARCHY: Record<Role, number> = {
    [Role.SUPER_ADMIN]: 5,
    [Role.ADMIN]: 4,
    [Role.PROJECT_MANAGER]: 3,
    [Role.ENGINEER]: 2,
    [Role.VIEWER]: 1,
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Try to restore session from stored tokens on mount
    useEffect(() => {
        const token = getAccessToken();
        if (token && !isTokenExpired(token)) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({
                    id: payload.sub,
                    email: payload.email,
                    role: payload.role,
                    fullName: '', // Will be populated on next API call
                });
            } catch {
                clearTokens();
            }
        } else if (token && isTokenExpired(token)) {
            // Try to refresh
            const refresh = getRefreshToken();
            if (refresh) {
                refreshTokenApi(refresh)
                    .then((res) => {
                        setTokens(res.accessToken, res.refreshToken);
                        setUser(res.user);
                    })
                    .catch(() => {
                        clearTokens();
                    });
            } else {
                clearTokens();
            }
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (credentials: LoginCredentials) => {
        const response = await loginApi(credentials);
        setTokens(response.accessToken, response.refreshToken);
        setUser(response.user);
        router.push('/');
    }, [router]);

    const register = useCallback(async (credentials: RegisterCredentials) => {
        const response = await registerApi(credentials);
        setTokens(response.accessToken, response.refreshToken);
        setUser(response.user);
        router.push('/');
    }, [router]);

    const logout = useCallback(async () => {
        try {
            const token = getAccessToken();
            if (token) {
                await logoutApi(token);
            }
        } catch {
            // Ignore logout API errors
        } finally {
            clearTokens();
            setUser(null);
            router.push('/login');
        }
    }, [router]);

    const hasMinRole = useCallback((requiredRole: Role): boolean => {
        if (!user) return false;
        return (ROLE_HIERARCHY[user.role] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
    }, [user]);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                hasMinRole,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
