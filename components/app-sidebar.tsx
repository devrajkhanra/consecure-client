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
} from 'lucide-react';

const navigationItems = [
    {
        title: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
    },
    {
        title: 'Projects',
        href: '/projects',
        icon: FolderKanban,
    },
    {
        title: 'Sites',
        href: '/sites',
        icon: MapPin,
    },
    {
        title: 'Jobs',
        href: '/jobs',
        icon: Briefcase,
    },
];

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

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <Sidebar className="border-r border-sidebar-border">
                    <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
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
                                                    <item.icon className="h-4 w-4" />
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
                                    <Settings className="h-4 w-4" />
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
