'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    MapPin,
    Plus,
    Calendar,
    Building2,
    FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useProject, useUpdateProject, useDeleteProject } from '@/hooks/use-projects';
import { useSitesByProject, useCreateSite, useDeleteSite } from '@/hooks/use-sites';
import { ProjectForm } from '@/components/projects/project-form';
import { SiteForm } from '@/components/sites/site-form';
import { ProjectStatus } from '@/types';
import type { CreateProjectDto, Site, CreateSiteDto } from '@/types';

const statusVariants: Record<ProjectStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    [ProjectStatus.BACKLOG]: 'secondary',
    [ProjectStatus.IN_PROGRESS]: 'default',
    [ProjectStatus.COMPLETED]: 'outline',
    [ProjectStatus.ON_HOLD]: 'destructive',
};

const statusLabels: Record<ProjectStatus, string> = {
    [ProjectStatus.BACKLOG]: 'Backlog',
    [ProjectStatus.IN_PROGRESS]: 'In Progress',
    [ProjectStatus.COMPLETED]: 'Completed',
    [ProjectStatus.ON_HOLD]: 'On Hold',
};

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { data: project, isLoading: projectLoading, error } = useProject(id);
    const { data: sites, isLoading: sitesLoading } = useSitesByProject(id);
    const updateProject = useUpdateProject();
    const deleteProject = useDeleteProject();
    const createSite = useCreateSite();
    const deleteSite = useDeleteSite();

    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAddingSite, setIsAddingSite] = useState(false);
    const [deletingSite, setDeletingSite] = useState<Site | null>(null);

    const handleUpdate = async (data: CreateProjectDto) => {
        try {
            await updateProject.mutateAsync({ id, dto: data });
            toast.success('Project updated successfully');
            setIsEditing(false);
        } catch (error) {
            toast.error('Failed to update project');
            console.error(error);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteProject.mutateAsync(id);
            toast.success('Project deleted successfully');
            router.push('/projects');
        } catch (error) {
            toast.error('Failed to delete project');
            console.error(error);
        }
    };

    const handleCreateSite = async (data: CreateSiteDto) => {
        try {
            await createSite.mutateAsync(data);
            toast.success('Site created successfully');
            setIsAddingSite(false);
        } catch (error) {
            toast.error('Failed to create site');
            console.error(error);
        }
    };

    const handleDeleteSite = async () => {
        if (!deletingSite) return;
        try {
            await deleteSite.mutateAsync(deletingSite.id);
            toast.success('Site deleted successfully');
            setDeletingSite(null);
        } catch (error) {
            toast.error('Failed to delete site');
            console.error(error);
        }
    };

    if (projectLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[300px] w-full" />
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="text-center">
                    <h2 className="text-lg font-semibold">Project not found</h2>
                    <p className="text-muted-foreground mb-4">The project you&apos;re looking for doesn&apos;t exist</p>
                    <Button asChild>
                        <Link href="/projects">Back to Projects</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/projects">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                            <Badge variant={statusVariants[project.status]}>
                                {statusLabels[project.status]}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground font-mono">{project.workOrderNumber}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button variant="destructive" onClick={() => setIsDeleting(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Project Details */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Client</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{project.clientName}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Location</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm">{project.location}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Start Date</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">
                            {format(new Date(project.startDate), 'MMM d, yyyy')}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">End Date</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">
                            {project.endDate
                                ? format(new Date(project.endDate), 'MMM d, yyyy')
                                : 'TBD'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sites Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Sites</CardTitle>
                        <CardDescription>Manage sites for this project</CardDescription>
                    </div>
                    <Button onClick={() => setIsAddingSite(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Site
                    </Button>
                </CardHeader>
                <CardContent>
                    {sitesLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : sites && sites.length > 0 ? (
                        <div className="space-y-3">
                            {sites.map((site) => (
                                <div
                                    key={site.id}
                                    className="flex items-center justify-between rounded-lg border p-4"
                                >
                                    <Link
                                        href={`/sites/${site.id}`}
                                        className="flex items-center gap-3 hover:underline"
                                    >
                                        <MapPin className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{site.name}</p>
                                            <p className="text-sm text-muted-foreground">{site.address}</p>
                                        </div>
                                    </Link>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/sites/${site.id}`}>
                                                <FileText className="mr-2 h-4 w-4" />
                                                View
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setDeletingSite(site)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-32 items-center justify-center text-muted-foreground">
                            No sites yet. Add one to get started.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Project Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                        <DialogDescription>Update the project details</DialogDescription>
                    </DialogHeader>
                    <ProjectForm
                        project={project}
                        onSubmit={handleUpdate}
                        isLoading={updateProject.isPending}
                        onCancel={() => setIsEditing(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Project Confirmation */}
            <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{project.name}&quot;? This will also delete
                            all associated sites and jobs.
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

            {/* Add Site Dialog */}
            <Dialog open={isAddingSite} onOpenChange={setIsAddingSite}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Site</DialogTitle>
                        <DialogDescription>Add a new site to this project</DialogDescription>
                    </DialogHeader>
                    <SiteForm
                        projectId={id}
                        onSubmit={handleCreateSite}
                        isLoading={createSite.isPending}
                        onCancel={() => setIsAddingSite(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Site Confirmation */}
            <AlertDialog open={!!deletingSite} onOpenChange={() => setDeletingSite(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Site</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deletingSite?.name}&quot;? This will also
                            delete all associated jobs.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteSite}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteSite.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
