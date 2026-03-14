import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Joint, CreateJointDto, UpdateJointDto, UpdateJointStageDto } from '@/types';

const QUERY_KEY = 'joints';

// Fetch all joints for a drawing
export function useJoints(drawingId: string | undefined) {
    return useQuery({
        queryKey: [QUERY_KEY, drawingId],
        queryFn: async (): Promise<Joint[]> => {
            const { data } = await api.get<Joint[]>(`/drawings/${drawingId}/joints`);
            return data;
        },
        enabled: !!drawingId,
    });
}

// Create joint mutation
export function useCreateJoint() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ drawingId, dto }: { drawingId: string; dto: CreateJointDto }): Promise<Joint> => {
            const { data } = await api.post<Joint>(`/drawings/${drawingId}/joints`, dto);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.drawingId] });
        },
    });
}

// Update joint mutation
export function useUpdateJoint() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            drawingId,
            jointId,
            dto,
        }: {
            drawingId: string;
            jointId: string;
            dto: UpdateJointDto;
        }): Promise<Joint> => {
            const { data } = await api.patch<Joint>(`/drawings/${drawingId}/joints/${jointId}`, dto);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.drawingId] });
        },
    });
}

// Update joint stage mutation (auto-marks materials as used when stage >= fitup)
export function useUpdateJointStage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            drawingId,
            jointId,
            dto,
        }: {
            drawingId: string;
            jointId: string;
            dto: UpdateJointStageDto;
        }): Promise<Joint> => {
            const { data } = await api.patch<Joint>(`/drawings/${drawingId}/joints/${jointId}/stage`, dto);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.drawingId] });
            // Also invalidate materials since stage update auto-marks materials as used
            queryClient.invalidateQueries({ queryKey: ['materials'] });
        },
    });
}

// Delete joint mutation
export function useDeleteJoint() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ drawingId, jointId }: { drawingId: string; jointId: string }): Promise<void> => {
            await api.delete(`/drawings/${drawingId}/joints/${jointId}`);
        },
        onSuccess: (_, { drawingId }) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, drawingId] });
        },
    });
}
