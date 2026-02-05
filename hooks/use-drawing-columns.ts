import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { DrawingColumn, CreateDrawingColumnDto, UpdateDrawingColumnDto } from '@/types';

const QUERY_KEY = 'drawing-columns';

// Fetch all columns for a job
export function useDrawingColumns(jobId: string | undefined) {
    return useQuery({
        queryKey: [QUERY_KEY, jobId],
        queryFn: async (): Promise<DrawingColumn[]> => {
            const { data } = await api.get<DrawingColumn[]>(`/jobs/${jobId}/columns`);
            return data;
        },
        enabled: !!jobId,
    });
}

// Create column mutation
export function useCreateDrawingColumn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ jobId, dto }: { jobId: string; dto: CreateDrawingColumnDto }): Promise<DrawingColumn> => {
            const { data } = await api.post<DrawingColumn>(`/jobs/${jobId}/columns`, dto);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.jobId] });
        },
    });
}

// Update column mutation
export function useUpdateDrawingColumn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            jobId,
            columnId,
            dto
        }: {
            jobId: string;
            columnId: string;
            dto: UpdateDrawingColumnDto
        }): Promise<DrawingColumn> => {
            const { data } = await api.patch<DrawingColumn>(`/jobs/${jobId}/columns/${columnId}`, dto);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.jobId] });
        },
    });
}

// Delete column mutation
export function useDeleteDrawingColumn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ jobId, columnId }: { jobId: string; columnId: string }): Promise<void> => {
            await api.delete(`/jobs/${jobId}/columns/${columnId}`);
        },
        onSuccess: (_, { jobId }) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, jobId] });
        },
    });
}
