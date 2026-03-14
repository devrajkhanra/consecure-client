'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { Role, getRoleLabel } from '@/types/auth';
import type { User, CreateUserDto, UpdateUserDto } from '@/types/auth';
import { useUsers, useCreateUser, useUpdateUser, useDeactivateUser } from '@/hooks/use-users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_COLORS: Record<Role, string> = {
    [Role.SUPER_ADMIN]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    [Role.ADMIN]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    [Role.PROJECT_MANAGER]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [Role.ENGINEER]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    [Role.VIEWER]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

function CreateUserDialog() {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>(Role.VIEWER);
    const createUser = useCreateUser();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createUser.mutateAsync({ email, fullName, password, role });
            toast.success('User created successfully');
            setOpen(false);
            setEmail('');
            setFullName('');
            setPassword('');
            setRole(Role.VIEWER);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to create user');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                            Add a new user to the system with a specific role.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="create-fullName">Full Name</Label>
                            <Input
                                id="create-fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="create-email">Email</Label>
                            <Input
                                id="create-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="create-password">Password</Label>
                            <Input
                                id="create-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="create-role">Role</Label>
                            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(Role).map((r) => (
                                        <SelectItem key={r} value={r}>
                                            {getRoleLabel(r)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={createUser.isPending}>
                            {createUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create User
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditUserDialog({ user }: { user: User }) {
    const [open, setOpen] = useState(false);
    const [fullName, setFullName] = useState(user.fullName);
    const [role, setRole] = useState<Role>(user.role);
    const updateUser = useUpdateUser();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateUser.mutateAsync({ id: user.id, dto: { fullName, role } });
            toast.success('User updated successfully');
            setOpen(false);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to update user');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user details and role assignment.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input value={user.email} disabled />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-fullName">Full Name</Label>
                            <Input
                                id="edit-fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-role">Role</Label>
                            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(Role).map((r) => (
                                        <SelectItem key={r} value={r}>
                                            {getRoleLabel(r)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={updateUser.isPending}>
                            {updateUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminUsersPage() {
    const { hasMinRole } = useAuth();
    const { data: users, isLoading } = useUsers();
    const deactivateUser = useDeactivateUser();

    if (!hasMinRole(Role.ADMIN)) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-2">
                    <Shield className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">Access Denied</h2>
                    <p className="text-sm text-muted-foreground">
                        You need Admin or higher privileges to access this page.
                    </p>
                </div>
            </div>
        );
    }

    const handleDeactivate = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to deactivate ${userName}?`)) return;
        try {
            await deactivateUser.mutateAsync(userId);
            toast.success('User deactivated');
        } catch (err: any) {
            toast.error(err?.message || 'Failed to deactivate user');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage user accounts, roles, and permissions.
                    </p>
                </div>
                <CreateUserDialog />
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : !users || users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.fullName}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={ROLE_COLORS[user.role]}>
                                            {getRoleLabel(user.role)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.isActive ? 'default' : 'destructive'}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <EditUserDialog user={user} />
                                            {user.isActive && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => handleDeactivate(user.id, user.fullName)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
