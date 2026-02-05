import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Job, CreateJobDto, UpdateJobDto } from '@/types';

const QUERY_KEY = 'jobs';

// Fetch all jobs
export function useJobs() {
    return useQuery({
        queryKey: [QUERY_KEY],
        queryFn: async (): Promise<Job[]> => {
            const { data } = await api.get<Job[]>('/jobs');
            return data;
        },
    });
}

// Fetch single job by ID
export function useJob(id: string | undefined) {
    return useQuery({
        queryKey: [QUERY_KEY, id],
        queryFn: async (): Promise<Job> => {
            const { data } = await api.get<Job>(`/jobs/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

// Fetch jobs by site ID
export function useJobsBySite(siteId: string | undefined) {
    return useQuery({
        queryKey: [QUERY_KEY, 'site', siteId],
        queryFn: async (): Promise<Job[]> => {
            const { data } = await api.get<Job[]>(`/jobs/site/${siteId}`);
            return data;
        },
        enabled: !!siteId,
    });
}

// Create job mutation
export function useCreateJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreateJobDto): Promise<Job> => {
            const { data } = await api.post<Job>('/jobs', dto);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'site', data.siteId] });
        },
    });
}

// Update job mutation
export function useUpdateJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, dto }: { id: string; dto: UpdateJobDto }): Promise<Job> => {
            const { data } = await api.patch<Job>(`/jobs/${id}`, dto);
            return data;
        },
        onSuccess: (data, { id }) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'site', data.siteId] });
        },
    });
}

// Delete job mutation
export function useDeleteJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string): Promise<void> => {
            await api.delete(`/jobs/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
    });
}
