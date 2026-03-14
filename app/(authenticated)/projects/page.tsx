'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectTable } from '@/components/projects/project-table';
import { ProjectForm } from '@/components/projects/project-form';
import {
    useProjects,
    useCreateProject,
    useUpdateProject,
    useDeleteProject,
} from '@/hooks/use-projects';
import type { Project, CreateProjectDto } from '@/types';

export default function ProjectsPage() {
    const { data: projects, isLoading, error } = useProjects();
    const createProject = useCreateProject();
    const updateProject = useUpdateProject();
    const deleteProject = useDeleteProject();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [deletingProject, setDeletingProject] = useState<Project | null>(null);

    const handleCreate = async (data: CreateProjectDto) => {
        try {
            await createProject.mutateAsync(data);
            toast.success('Project created successfully');
            setIsFormOpen(false);
        } catch (error) {
            toast.error('Failed to create project');
            console.error(error);
        }
    };

    const handleUpdate = async (data: CreateProjectDto) => {
        if (!editingProject) return;
        try {
            await updateProject.mutateAsync({ id: editingProject.id, dto: data });
            toast.success('Project updated successfully');
            setEditingProject(null);
        } catch (error) {
            toast.error('Failed to update project');
            console.error(error);
        }
    };

    const handleDelete = async () => {
        if (!deletingProject) return;
        try {
            await deleteProject.mutateAsync(deletingProject.id);
            toast.success('Project deleted successfully');
            setDeletingProject(null);
        } catch (error) {
            toast.error('Failed to delete project');
            console.error(error);
        }
    };

    if (error) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="text-center">
                    <h2 className="text-lg font-semibold">Failed to load projects</h2>
                    <p className="text-muted-foreground">Please try again later</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground">
                        Manage all your projects in one place
                    </p>
                </div>
                <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-[200px]" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
            ) : (
                <ProjectTable
                    data={projects ?? []}
                    onEdit={(project) => setEditingProject(project)}
                    onDelete={(project) => setDeletingProject(project)}
                />
            )}

            {/* Create Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                        <DialogDescription>
                            Fill in the details to create a new project
                        </DialogDescription>
                    </DialogHeader>
                    <ProjectForm
                        onSubmit={handleCreate}
                        isLoading={createProject.isPending}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                        <DialogDescription>
                            Update the project details
                        </DialogDescription>
                    </DialogHeader>
                    {editingProject && (
                        <ProjectForm
                            project={editingProject}
                            onSubmit={handleUpdate}
                            isLoading={updateProject.isPending}
                            onCancel={() => setEditingProject(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingProject} onOpenChange={() => setDeletingProject(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deletingProject?.name}&quot;? This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteProject.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
