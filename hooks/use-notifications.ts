'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Notification } from '@/types/auth';

export function useNotifications(unreadOnly = false) {
    return useQuery<Notification[]>({
        queryKey: ['notifications', { unreadOnly }],
        queryFn: async () => {
            const { data } = await api.get('/notifications', {
                params: { unreadOnly: unreadOnly ? 'true' : undefined },
            });
            return data;
        },
        refetchInterval: 30000, // Poll every 30s
    });
}

export function useUnreadCount() {
    return useQuery<{ count: number }>({
        queryKey: ['notifications', 'unread-count'],
        queryFn: async () => {
            const { data } = await api.get('/notifications/unread-count');
            return data;
        },
        refetchInterval: 15000, // Poll every 15s
    });
}

export function useMarkNotificationRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.patch(`/notifications/${id}/read`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

export function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const { data } = await api.patch('/notifications/read-all');
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}
