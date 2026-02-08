import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Material, CreateMaterialDto, UpdateMaterialDto } from '@/types';

const QUERY_KEY = 'materials';

// Fetch all materials for a drawing
export function useMaterials(drawingId: string | undefined) {
    return useQuery({
        queryKey: [QUERY_KEY, 'drawing', drawingId],
        queryFn: async (): Promise<Material[]> => {
            const { data } = await api.get<Material[]>(`/drawings/${drawingId}/materials`);
            return data;
        },
        enabled: !!drawingId,
    });
}

// Fetch all materials for a job
export function useJobMaterials(jobId: string | undefined) {
    return useQuery({
        queryKey: [QUERY_KEY, 'job', jobId],
        queryFn: async (): Promise<Material[]> => {
            const { data } = await api.get<Material[]>(`/jobs/${jobId}/materials`);
            return data;
        },
        enabled: !!jobId,
    });
}

// Create material mutation
export function useCreateMaterial() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ drawingId, dto }: { drawingId: string; dto: CreateMaterialDto }): Promise<Material> => {
            const { data } = await api.post<Material>(`/drawings/${drawingId}/materials`, dto);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'drawing', data.drawingId] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'job'] });
        },
    });
}

// Update material mutation
export function useUpdateMaterial() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            drawingId,
            materialId,
            dto
        }: {
            drawingId: string;
            materialId: string;
            dto: UpdateMaterialDto
        }): Promise<Material> => {
            const { data } = await api.patch<Material>(`/drawings/${drawingId}/materials/${materialId}`, dto);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'drawing', data.drawingId] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'job'] });
        },
    });
}

// Delete material mutation
export function useDeleteMaterial() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ drawingId, materialId }: { drawingId: string; materialId: string }): Promise<void> => {
            await api.delete(`/drawings/${drawingId}/materials/${materialId}`);
        },
        onSuccess: (_, { drawingId }) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'drawing', drawingId] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'job'] });
        },
    });
}
