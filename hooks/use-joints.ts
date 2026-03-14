import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import api from '@/lib/api';
import { useDrawings } from './use-drawings';
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

// Fetch all joints across ALL drawings for a job
export function useJobJoints(jobId: string | undefined) {
    const { data: drawings } = useDrawings(jobId);
    
    const results = useQueries({
        queries: (drawings ?? []).map((drawing) => ({
            queryKey: [QUERY_KEY, drawing.id],
            queryFn: async (): Promise<Joint[]> => {
                const { data } = await api.get<Joint[]>(`/drawings/${drawing.id}/joints`);
                return data;
            },
            staleTime: 1000 * 60 * 5, // Cache for 5 mins to prevent spam
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
