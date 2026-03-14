import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import api from '@/lib/api';
import { useDrawings } from './use-drawings';
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

// Fetch all spools across ALL drawings for a job
export function useJobSpools(jobId: string | undefined) {
    const { data: drawings } = useDrawings(jobId);
    
    const results = useQueries({
        queries: (drawings ?? []).map((drawing) => ({
            queryKey: [QUERY_KEY, 'drawing', drawing.id],
            queryFn: async (): Promise<Spool[]> => {
                const { data } = await api.get<Spool[]>(`/drawings/${drawing.id}/spools`);
                return data;
            },
            staleTime: 1000 * 60 * 5,
        })),
        combine: (results) => {
            return {
                data: results.map((result) => result.data ?? []).flat(),
                isLoading: results.some((result) => result.isLoading),
                isError: results.some((result) => result.isError),
            };
        },
    });

    return {
        ...results,
        // If drawings haven't loaded yet, we are still loading overall
        isLoading: results.isLoading || (!!jobId && !drawings),
    };
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
