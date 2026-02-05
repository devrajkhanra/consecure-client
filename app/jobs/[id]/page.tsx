'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Plus,
    Briefcase,
    MapPin,
    Table2,
    Settings2,
    MoreVertical,
    BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useJob, useUpdateJob, useDeleteJob } from '@/hooks/use-jobs';
import { useDrawingColumns } from '@/hooks/use-drawing-columns';
import { useDrawings, useCreateDrawing, useUpdateDrawing, useDeleteDrawing } from '@/hooks/use-drawings';
import { JobForm } from '@/components/jobs/job-form';
import { ColumnManager } from '@/components/drawings/column-manager';
import { DrawingTable } from '@/components/drawings/drawing-table';
import { DrawingForm } from '@/components/drawings/drawing-form';
import { JobStatCards, StatCardConfigurator } from '@/components/jobs/stat-cards';
import type { CreateJobDto, Drawing, CreateDrawingDto } from '@/types';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { data: job, isLoading: jobLoading, error } = useJob(id);
    const { data: columns, isLoading: columnsLoading } = useDrawingColumns(id);
    const { data: drawings, isLoading: drawingsLoading } = useDrawings(id);
    const updateJob = useUpdateJob();
    const deleteJob = useDeleteJob();
    const createDrawing = useCreateDrawing();
    const updateDrawing = useUpdateDrawing();
    const deleteDrawing = useDeleteDrawing();

    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);
    const [isStatConfigOpen, setIsStatConfigOpen] = useState(false);
    const [isAddingDrawing, setIsAddingDrawing] = useState(false);
    const [editingDrawing, setEditingDrawing] = useState<Drawing | null>(null);
    const [deletingDrawing, setDeletingDrawing] = useState<Drawing | null>(null);

    const handleUpdate = async (data: CreateJobDto) => {
        try {
            await updateJob.mutateAsync({ id, dto: data });
            toast.success('Job updated successfully');
            setIsEditing(false);
        } catch (error) {
            toast.error('Failed to update job');
            console.error(error);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteJob.mutateAsync(id);
            toast.success('Job deleted successfully');
            router.push('/jobs');
        } catch (error) {
            toast.error('Failed to delete job');
            console.error(error);
        }
    };

    const handleCreateDrawing = async (data: CreateDrawingDto) => {
        try {
            await createDrawing.mutateAsync({ jobId: id, dto: data });
            toast.success('Drawing created successfully');
            setIsAddingDrawing(false);
        } catch (error) {
            toast.error('Failed to create drawing');
            console.error(error);
        }
    };

    const handleUpdateDrawing = async (data: CreateDrawingDto) => {
        if (!editingDrawing) return;
        try {
            await updateDrawing.mutateAsync({ jobId: id, drawingId: editingDrawing.id, dto: data });
            toast.success('Drawing updated successfully');
            setEditingDrawing(null);
        } catch (error) {
            toast.error('Failed to update drawing');
            console.error(error);
        }
    };

    const handleDeleteDrawing = async () => {
        if (!deletingDrawing) return;
        try {
            await deleteDrawing.mutateAsync({ jobId: id, drawingId: deletingDrawing.id });
            toast.success('Drawing deleted successfully');
            setDeletingDrawing(null);
        } catch (error) {
            toast.error('Failed to delete drawing');
            console.error(error);
        }
    };

    if (jobLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-[150px] w-full" />
                <Skeleton className="h-[300px] w-full" />
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="text-center">
                    <h2 className="text-lg font-semibold">Job not found</h2>
                    <p className="text-muted-foreground mb-4">The job you&apos;re looking for doesn&apos;t exist</p>
                    <Button asChild>
                        <Link href="/jobs">Back to Jobs</Link>
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
                        <Link href="/jobs">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{job.name}</h1>
                        {job.description && (
                            <p className="text-muted-foreground">{job.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Job
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsColumnConfigOpen(true)}>
                                <Settings2 className="mr-2 h-4 w-4" />
                                Configure Columns
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsStatConfigOpen(true)}>
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Configure Stats
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setIsDeleting(true)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Job
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Job Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Site</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Link
                            href={`/sites/${job.siteId}`}
                            className="text-xl font-bold hover:underline"
                        >
                            {job.site?.name ?? 'View Site'}
                        </Link>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Columns</CardTitle>
                        <Table2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{columns?.length ?? 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Drawings</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{drawings?.length ?? 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Custom Stat Cards */}
            {(columns?.length ?? 0) > 0 && (
                <JobStatCards
                    jobId={id}
                    columns={columns ?? []}
                    drawings={drawings ?? []}
                    onConfigureClick={() => setIsStatConfigOpen(true)}
                />
            )}

            {/* Drawings Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Drawings</CardTitle>
                        <CardDescription>Manage drawings for this job</CardDescription>
                    </div>
                    <Button
                        onClick={() => setIsAddingDrawing(true)}
                        disabled={!columns || columns.length === 0}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Drawing
                    </Button>
                </CardHeader>
                <CardContent>
                    {drawingsLoading || columnsLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : columns && columns.length === 0 ? (
                        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground">
                            <p>No columns configured yet.</p>
                            <Button variant="outline" size="sm" onClick={() => setIsColumnConfigOpen(true)}>
                                <Settings2 className="mr-2 h-4 w-4" />
                                Configure Columns
                            </Button>
                        </div>
                    ) : (
                        <DrawingTable
                            drawings={drawings ?? []}
                            columns={columns ?? []}
                            onEdit={(drawing) => setEditingDrawing(drawing)}
                            onDelete={(drawing) => setDeletingDrawing(drawing)}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Column Configuration Modal */}
            <Dialog open={isColumnConfigOpen} onOpenChange={setIsColumnConfigOpen}>
                <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle>Column Configuration</DialogTitle>
                        <DialogDescription>
                            Define the structure for your drawing list
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">
                        <ColumnManager jobId={id} />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Job Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Job</DialogTitle>
                        <DialogDescription>Update the job details</DialogDescription>
                    </DialogHeader>
                    <JobForm
                        job={job}
                        onSubmit={handleUpdate}
                        isLoading={updateJob.isPending}
                        onCancel={() => setIsEditing(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Job Confirmation */}
            <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Job</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{job.name}&quot;? This will also delete
                            all associated columns and drawings.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteJob.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Add Drawing Dialog */}
            <Dialog open={isAddingDrawing} onOpenChange={setIsAddingDrawing}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add Drawing</DialogTitle>
                        <DialogDescription>Add a new drawing entry</DialogDescription>
                    </DialogHeader>
                    <DrawingForm
                        columns={columns ?? []}
                        onSubmit={handleCreateDrawing}
                        isLoading={createDrawing.isPending}
                        onCancel={() => setIsAddingDrawing(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Drawing Dialog */}
            <Dialog open={!!editingDrawing} onOpenChange={() => setEditingDrawing(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Drawing</DialogTitle>
                        <DialogDescription>Update the drawing details</DialogDescription>
                    </DialogHeader>
                    {editingDrawing && (
                        <DrawingForm
                            columns={columns ?? []}
                            drawing={editingDrawing}
                            onSubmit={handleUpdateDrawing}
                            isLoading={updateDrawing.isPending}
                            onCancel={() => setEditingDrawing(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Drawing Confirmation */}
            <AlertDialog open={!!deletingDrawing} onOpenChange={() => setDeletingDrawing(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Drawing</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this drawing? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteDrawing}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteDrawing.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Stat Cards Configurator */}
            <StatCardConfigurator
                jobId={id}
                columns={columns ?? []}
                drawings={drawings ?? []}
                open={isStatConfigOpen}
                onOpenChange={setIsStatConfigOpen}
            />
        </div>
    );
}
