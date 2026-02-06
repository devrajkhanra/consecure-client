'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { DrawingChangeHistory, CreateDrawingChangeHistoryDto } from '@/types';

// Query keys
export const drawingChangeHistoryKeys = {
    all: ['drawing-change-history'] as const,
    byDrawing: (jobId: string, drawingId: string) => [...drawingChangeHistoryKeys.all, 'drawing', jobId, drawingId] as const,
    byDrawingOnly: (drawingId: string) => [...drawingChangeHistoryKeys.all, 'drawing', drawingId] as const,
    byJob: (jobId: string) => [...drawingChangeHistoryKeys.all, 'job', jobId] as const,
};

// Get change history for a specific drawing (with jobId)
export function useDrawingChangeHistory(jobId: string, drawingId: string) {
    return useQuery({
        queryKey: drawingChangeHistoryKeys.byDrawing(jobId, drawingId),
        queryFn: async () => {
            const { data } = await api.get<DrawingChangeHistory[]>(
                `/jobs/${jobId}/drawings/${drawingId}/history`
            );
            return data;
        },
        enabled: !!jobId && !!drawingId,
    });
}

// Get change history for a specific drawing (without jobId - alternative endpoint)
export function useDrawingChangeHistoryByDrawingId(drawingId: string) {
    return useQuery({
        queryKey: drawingChangeHistoryKeys.byDrawingOnly(drawingId),
        queryFn: async () => {
            const { data } = await api.get<DrawingChangeHistory[]>(`/drawings/${drawingId}/history`);
            return data;
        },
        enabled: !!drawingId,
    });
}

// Get all change history for a job (with optional type filter)
export function useJobChangeHistory(jobId: string, type?: string) {
    return useQuery({
        queryKey: [...drawingChangeHistoryKeys.byJob(jobId), type],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (type) params.append('type', type);
            const { data } = await api.get<DrawingChangeHistory[]>(
                `/jobs/${jobId}/change-history${params.toString() ? `?${params.toString()}` : ''}`
            );
            return data;
        },
        enabled: !!jobId,
    });
}

// Create a change history entry (usually done automatically by backend, but available if needed)
export function useCreateDrawingChangeHistory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            jobId,
            drawingId,
            dto,
        }: {
            jobId: string;
            drawingId: string;
            dto: CreateDrawingChangeHistoryDto;
        }) => {
            const { data } = await api.post<DrawingChangeHistory>(
                `/jobs/${jobId}/drawings/${drawingId}/history`,
                dto
            );
            return data;
        },
        onSuccess: (_, { jobId, drawingId }) => {
            queryClient.invalidateQueries({ queryKey: drawingChangeHistoryKeys.byDrawing(jobId, drawingId) });
            queryClient.invalidateQueries({ queryKey: drawingChangeHistoryKeys.byJob(jobId) });
        },
    });
}
