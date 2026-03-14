'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Role } from '@/types/auth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
    requiredRole?: Role;
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
    const { isAuthenticated, isLoading, hasMinRole } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (requiredRole && !hasMinRole(requiredRole)) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center space-y-2">
                    <h2 className="text-lg font-semibold">Access Denied</h2>
                    <p className="text-sm text-muted-foreground">
                        You do not have permission to access this page.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
