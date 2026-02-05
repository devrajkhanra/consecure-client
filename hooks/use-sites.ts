import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Site, CreateSiteDto, UpdateSiteDto } from '@/types';

const QUERY_KEY = 'sites';

// Fetch all sites
export function useSites() {
    return useQuery({
        queryKey: [QUERY_KEY],
        queryFn: async (): Promise<Site[]> => {
            const { data } = await api.get<Site[]>('/sites');
            return data;
        },
    });
}

// Fetch single site by ID
export function useSite(id: string | undefined) {
    return useQuery({
        queryKey: [QUERY_KEY, id],
        queryFn: async (): Promise<Site> => {
            const { data } = await api.get<Site>(`/sites/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

// Fetch sites by project ID
export function useSitesByProject(projectId: string | undefined) {
    return useQuery({
        queryKey: [QUERY_KEY, 'project', projectId],
        queryFn: async (): Promise<Site[]> => {
            const { data } = await api.get<Site[]>(`/sites/project/${projectId}`);
            return data;
        },
        enabled: !!projectId,
    });
}

// Create site mutation
export function useCreateSite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreateSiteDto): Promise<Site> => {
            const { data } = await api.post<Site>('/sites', dto);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'project', data.projectId] });
        },
    });
}

// Update site mutation
export function useUpdateSite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, dto }: { id: string; dto: UpdateSiteDto }): Promise<Site> => {
            const { data } = await api.patch<Site>(`/sites/${id}`, dto);
            return data;
        },
        onSuccess: (data, { id }) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'project', data.projectId] });
        },
    });
}

// Delete site mutation
export function useDeleteSite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string): Promise<void> => {
            await api.delete(`/sites/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
    });
}
