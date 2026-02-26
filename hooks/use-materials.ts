import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Material, MaterialSummary, CreateMaterialDto, UpdateMaterialDto, UpdateMaterialStatusDto } from '@/types';

const QUERY_KEY = 'materials';

// Fetch all materials for a drawing (with optional status filter)
export function useMaterials(drawingId: string | undefined, status?: string) {
    return useQuery({
        queryKey: [QUERY_KEY, 'drawing', drawingId, status],
        queryFn: async (): Promise<Material[]> => {
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            const url = `/drawings/${drawingId}/materials${params.toString() ? `?${params.toString()}` : ''}`;
            const { data } = await api.get<Material[]>(url);
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

// Fetch material summary for a job
export function useMaterialSummary(jobId: string | undefined) {
    return useQuery({
        queryKey: [QUERY_KEY, 'summary', jobId],
        queryFn: async (): Promise<MaterialSummary[]> => {
            const { data } = await api.get<MaterialSummary[]>(`/jobs/${jobId}/materials/summary`);
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
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'summary'] });
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
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'summary'] });
        },
    });
}

// Update material status mutation
export function useUpdateMaterialStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            drawingId,
            materialId,
            dto
        }: {
            drawingId: string;
            materialId: string;
            dto: UpdateMaterialStatusDto
        }): Promise<Material> => {
            const { data } = await api.patch<Material>(`/drawings/${drawingId}/materials/${materialId}/status`, dto);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'drawing', data.drawingId] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'job'] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'summary'] });
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
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'summary'] });
        },
    });
}
