import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { MaterialColumn, CreateMaterialColumnDto, UpdateMaterialColumnDto } from '@/types';

const QUERY_KEY = 'material-columns';

// Fetch all material columns for a job
export function useMaterialColumns(jobId: string | undefined) {
    return useQuery({
        queryKey: [QUERY_KEY, jobId],
        queryFn: async (): Promise<MaterialColumn[]> => {
            const { data } = await api.get<MaterialColumn[]>(`/jobs/${jobId}/material-columns`);
            return data;
        },
        enabled: !!jobId,
    });
}

// Create material column mutation
export function useCreateMaterialColumn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ jobId, dto }: { jobId: string; dto: CreateMaterialColumnDto }): Promise<MaterialColumn> => {
            const { data } = await api.post<MaterialColumn>(`/jobs/${jobId}/material-columns`, dto);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.jobId] });
        },
    });
}

// Update material column mutation
export function useUpdateMaterialColumn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            jobId,
            columnId,
            dto
        }: {
            jobId: string;
            columnId: string;
            dto: UpdateMaterialColumnDto
        }): Promise<MaterialColumn> => {
            const { data } = await api.patch<MaterialColumn>(`/jobs/${jobId}/material-columns/${columnId}`, dto);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.jobId] });
        },
    });
}

// Delete material column mutation
export function useDeleteMaterialColumn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ jobId, columnId }: { jobId: string; columnId: string }): Promise<void> => {
            await api.delete(`/jobs/${jobId}/material-columns/${columnId}`);
        },
        onSuccess: (_, { jobId }) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, jobId] });
        },
    });
}
