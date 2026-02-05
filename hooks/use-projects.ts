import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Project, CreateProjectDto, UpdateProjectDto } from '@/types';

const QUERY_KEY = 'projects';

// Fetch all projects
export function useProjects() {
    return useQuery({
        queryKey: [QUERY_KEY],
        queryFn: async (): Promise<Project[]> => {
            const { data } = await api.get<Project[]>('/projects');
            return data;
        },
    });
}

// Fetch single project by ID
export function useProject(id: string | undefined) {
    return useQuery({
        queryKey: [QUERY_KEY, id],
        queryFn: async (): Promise<Project> => {
            const { data } = await api.get<Project>(`/projects/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

// Create project mutation
export function useCreateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreateProjectDto): Promise<Project> => {
            const { data } = await api.post<Project>('/projects', dto);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
    });
}

// Update project mutation
export function useUpdateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, dto }: { id: string; dto: UpdateProjectDto }): Promise<Project> => {
            const { data } = await api.patch<Project>(`/projects/${id}`, dto);
            return data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
        },
    });
}

// Delete project mutation
export function useDeleteProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string): Promise<void> => {
            await api.delete(`/projects/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
    });
}
