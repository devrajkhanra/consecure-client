'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useUnreadCount, useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const { data: unreadData } = useUnreadCount();
    const { data: notifications } = useNotifications();
    const markRead = useMarkNotificationRead();
    const markAllRead = useMarkAllNotificationsRead();

    const unreadCount = unreadData?.count ?? 0;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h4 className="text-sm font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => markAllRead.mutate()}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {!notifications || notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        notifications.slice(0, 20).map((notification) => (
                            <div
                                key={notification.id}
                                className={`flex flex-col gap-1 border-b px-4 py-3 text-sm transition-colors hover:bg-muted/50 ${
                                    !notification.isRead ? 'bg-primary/5' : ''
                                }`}
                                onClick={() => {
                                    if (!notification.isRead) {
                                        markRead.mutate(notification.id);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="font-medium">{notification.title}</span>
                                    {!notification.isRead && (
                                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                    )}
                                </div>
                                <span className="text-muted-foreground line-clamp-2">
                                    {notification.message}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
