'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
    FolderKanban,
    MapPin,
    Briefcase,
    LayoutDashboard,
    Settings,
    Shield,
    ChevronRight,
} from 'lucide-react';

const navigationItems = [
    {
        title: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
        iconClass: 'nav-icon-dashboard',
    },
    {
        title: 'Projects',
        href: '/projects',
        icon: FolderKanban,
        iconClass: 'nav-icon-projects',
    },
    {
        title: 'Sites',
        href: '/sites',
        icon: MapPin,
        iconClass: 'nav-icon-sites',
    },
    {
        title: 'Jobs',
        href: '/jobs',
        icon: Briefcase,
        iconClass: 'nav-icon-jobs',
    },
];

// Breadcrumb label from path
function getBreadcrumb(pathname: string): string[] {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return ['Dashboard'];
    const crumbs: string[] = [];
    if (segments[0]) crumbs.push(segments[0].charAt(0).toUpperCase() + segments[0].slice(1));
    if (segments.length > 1) crumbs.push('Details');
    return crumbs;
}

interface AppSidebarProps {
    children: React.ReactNode;
}

export function AppSidebar({ children }: AppSidebarProps) {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(href);
    };

    const breadcrumbs = getBreadcrumb(pathname);

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <Sidebar className="border-r border-sidebar-border">
                    <SidebarHeader className="flex h-14 items-center border-b border-sidebar-border px-6">
                        <Link href="/" className="flex items-center gap-3">
                            <div
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-md"
                                style={{
                                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                }}
                            >
                                <Shield className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-semibold tracking-tight">Consecure</span>
                                <span className="text-xs text-muted-foreground">Project Management</span>
                            </div>
                        </Link>
                    </SidebarHeader>

                    <SidebarContent className="px-3 py-4">
                        <SidebarGroup>
                            <SidebarGroupLabel className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Navigation
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {navigationItems.map((item) => (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive(item.href)}
                                                className="h-10 px-3"
                                            >
                                                <Link href={item.href} className="flex items-center gap-3">
                                                    <item.icon className={`h-4 w-4 ${item.iconClass}`} />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    <SidebarFooter className="border-t border-sidebar-border p-3">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton className="h-10 px-3">
                                    <Settings className="h-4 w-4 nav-icon-settings" />
                                    <span>Settings</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarFooter>
                </Sidebar>

                <main className="flex flex-1 flex-col">
                    <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <SidebarTrigger className="-ml-2" />
                        <Separator orientation="vertical" className="h-6" />
                        {/* Breadcrumb */}
                        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
                            {breadcrumbs.map((crumb, i) => (
                                <span key={i} className="flex items-center gap-1">
                                    {i > 0 && <ChevronRight className="h-3 w-3" />}
                                    <span className={i === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''}>
                                        {crumb}
                                    </span>
                                </span>
                            ))}
                        </nav>
                        <div className="flex-1" />
                    </header>
                    <div className="flex-1 overflow-auto p-6">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
