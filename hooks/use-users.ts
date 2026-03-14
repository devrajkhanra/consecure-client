'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User, CreateUserDto, UpdateUserDto, ProjectMembership, AddProjectMemberDto, UpdateProjectMemberDto } from '@/types/auth';

export function useUsers() {
    return useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const { data } = await api.get('/users');
            return data;
        },
    });
}

export function useUser(id: string) {
    return useQuery<User>({
        queryKey: ['users', id],
        queryFn: async () => {
            const { data } = await api.get(`/users/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (dto: CreateUserDto) => {
            const { data } = await api.post('/users', dto);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, dto }: { id: string; dto: UpdateUserDto }) => {
            const { data } = await api.patch(`/users/${id}`, dto);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

export function useDeactivateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete(`/users/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

// Project Membership hooks
export function useProjectMembers(projectId: string) {
    return useQuery<ProjectMembership[]>({
        queryKey: ['project-members', projectId],
        queryFn: async () => {
            const { data } = await api.get(`/users/projects/${projectId}/members`);
            return data;
        },
        enabled: !!projectId,
    });
}

export function useAddProjectMember() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ projectId, dto }: { projectId: string; dto: AddProjectMemberDto }) => {
            const { data } = await api.post(`/users/projects/${projectId}/members`, dto);
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['project-members', variables.projectId] });
        },
    });
}

export function useUpdateProjectMemberRole() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ projectId, userId, dto }: { projectId: string; userId: string; dto: UpdateProjectMemberDto }) => {
            const { data } = await api.patch(`/users/projects/${projectId}/members/${userId}`, dto);
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['project-members', variables.projectId] });
        },
    });
}

export function useRemoveProjectMember() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
            const { data } = await api.delete(`/users/projects/${projectId}/members/${userId}`);
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['project-members', variables.projectId] });
        },
    });
}
