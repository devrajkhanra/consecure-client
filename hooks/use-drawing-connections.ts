import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { DrawingConnection, CreateDrawingConnectionDto, UpdateDrawingConnectionDto } from '@/types';

const QUERY_KEY = 'drawing-connections';

// Fetch all connections (globally)
export function useDrawingConnections() {
    return useQuery({
        queryKey: [QUERY_KEY],
        queryFn: async (): Promise<DrawingConnection[]> => {
            const { data } = await api.get<DrawingConnection[]>('/drawing-connections');
            return data;
        },
    });
}

// Fetch all connections for a specific drawing
export function useDrawingConnectionsForDrawing(drawingId: string | undefined) {
    return useQuery({
        queryKey: [QUERY_KEY, 'drawing', drawingId],
        queryFn: async (): Promise<DrawingConnection[]> => {
            const { data } = await api.get<DrawingConnection[]>(`/drawing-connections/drawing/${drawingId}`);
            return data;
        },
        enabled: !!drawingId,
    });
}

export function useCreateDrawingConnection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateDrawingConnectionDto) => {
            const response = await api.post<DrawingConnection>('/drawing-connections', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
    });
}

export function useUpdateDrawingConnection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateDrawingConnectionDto }) => {
            const response = await api.patch<DrawingConnection>(`/drawing-connections/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
    });
}

export function useDeleteDrawingConnection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/drawing-connections/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
    });
}
