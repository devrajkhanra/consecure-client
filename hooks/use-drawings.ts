import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Drawing, CreateDrawingDto, UpdateDrawingDto } from '@/types';

const QUERY_KEY = 'drawings';

// Fetch all drawings for a job
export function useDrawings(jobId: string | undefined) {
    return useQuery({
        queryKey: [QUERY_KEY, jobId],
        queryFn: async (): Promise<Drawing[]> => {
            const { data } = await api.get<Drawing[]>(`/jobs/${jobId}/drawings`);
            return data;
        },
        enabled: !!jobId,
    });
}

// Create drawing mutation
export function useCreateDrawing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ jobId, dto }: { jobId: string; dto: CreateDrawingDto }): Promise<Drawing> => {
            const { data } = await api.post<Drawing>(`/jobs/${jobId}/drawings`, dto);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.jobId] });
        },
    });
}

// Update drawing mutation
export function useUpdateDrawing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            jobId,
            drawingId,
            dto
        }: {
            jobId: string;
            drawingId: string;
            dto: UpdateDrawingDto
        }): Promise<Drawing> => {
            const { data } = await api.patch<Drawing>(`/jobs/${jobId}/drawings/${drawingId}`, dto);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.jobId] });
        },
    });
}

// Delete drawing mutation
export function useDeleteDrawing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ jobId, drawingId }: { jobId: string; drawingId: string }): Promise<void> => {
            await api.delete(`/jobs/${jobId}/drawings/${drawingId}`);
        },
        onSuccess: (_, { jobId }) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, jobId] });
        },
    });
}

// Bulk create drawings mutation (for Excel import)
export function useBulkCreateDrawings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            jobId,
            drawings,
        }: {
            jobId: string;
            drawings: Record<string, unknown>[];
        }): Promise<Drawing[]> => {
            // Create drawings sequentially to avoid overwhelming the server
            const results: Drawing[] = [];
            for (const data of drawings) {
                const { data: drawing } = await api.post<Drawing>(`/jobs/${jobId}/drawings`, { data });
                results.push(drawing);
            }
            return results;
        },
        onSuccess: (_, { jobId }) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, jobId] });
        },
    });
}

