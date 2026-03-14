import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Spool, CreateSpoolDto, UpdateSpoolDto } from '@/types';

const QUERY_KEY = 'spools';

// Fetch all spools for a drawing
export function useSpools(drawingId: string | undefined) {
    return useQuery({
        queryKey: [QUERY_KEY, 'drawing', drawingId],
        queryFn: async (): Promise<Spool[]> => {
            const { data } = await api.get<Spool[]>(`/drawings/${drawingId}/spools`);
            return data;
        },
        enabled: !!drawingId,
    });
}

export function useCreateSpool() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ drawingId, data }: { drawingId: string; data: CreateSpoolDto }) => {
            const response = await api.post<Spool>(`/drawings/${drawingId}/spools`, data);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'drawing', variables.drawingId] });
        },
    });
}

export function useUpdateSpool() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ drawingId, id, data }: { drawingId: string; id: string; data: UpdateSpoolDto }) => {
            const response = await api.patch<Spool>(`/drawings/${drawingId}/spools/${id}`, data);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'drawing', variables.drawingId] });
        },
    });
}

export function useDeleteSpool() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ drawingId, id }: { drawingId: string; id: string }) => {
            await api.delete(`/drawings/${drawingId}/spools/${id}`);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'drawing', variables.drawingId] });
        },
    });
}
