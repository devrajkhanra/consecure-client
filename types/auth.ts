export enum Role {
    SUPER_ADMIN = 'super_admin',
    ADMIN = 'admin',
    PROJECT_MANAGER = 'project_manager',
    ENGINEER = 'engineer',
    VIEWER = 'viewer',
}

export interface AuthUser {
    id: string;
    email: string;
    fullName: string;
    role: Role;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    password: string;
    fullName: string;
}

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUserDto {
    email: string;
    password: string;
    fullName: string;
    role?: Role;
}

export interface UpdateUserDto {
    fullName?: string;
    role?: Role;
    isActive?: boolean;
}

export interface ProjectMembership {
    id: string;
    userId: string;
    projectId: string;
    role: Role;
    user?: User;
    createdAt: string;
}

export interface AddProjectMemberDto {
    userId: string;
    role: Role;
}

export interface UpdateProjectMemberDto {
    role: Role;
}

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    isRead: boolean;
    createdAt: string;
}

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<Role, number> = {
    [Role.SUPER_ADMIN]: 5,
    [Role.ADMIN]: 4,
    [Role.PROJECT_MANAGER]: 3,
    [Role.ENGINEER]: 2,
    [Role.VIEWER]: 1,
};

export function hasMinRole(userRole: Role, requiredRole: Role): boolean {
    return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}

export function getRoleLabel(role: Role): string {
    const labels: Record<Role, string> = {
        [Role.SUPER_ADMIN]: 'Super Admin',
        [Role.ADMIN]: 'Admin',
        [Role.PROJECT_MANAGER]: 'Project Manager',
        [Role.ENGINEER]: 'Engineer',
        [Role.VIEWER]: 'Viewer',
    };
    return labels[role] ?? role;
}
