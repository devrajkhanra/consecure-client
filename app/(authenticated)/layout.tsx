'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { AppSidebar } from '@/components/app-sidebar';

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <AppSidebar>
                {children}
            </AppSidebar>
        </AuthGuard>
    );
}
