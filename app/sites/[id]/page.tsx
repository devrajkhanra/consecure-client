'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Briefcase,
    Plus,
    MapPin,
    FolderKanban,
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
import { useSite, useUpdateSite, useDeleteSite } from '@/hooks/use-sites';
import { useJobsBySite, useCreateJob, useDeleteJob } from '@/hooks/use-jobs';
import { SiteForm } from '@/components/sites/site-form';
import { JobForm } from '@/components/jobs/job-form';
import type { CreateSiteDto, Job, CreateJobDto } from '@/types';

export default function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { data: site, isLoading: siteLoading, error } = useSite(id);
    const { data: jobs, isLoading: jobsLoading } = useJobsBySite(id);
    const updateSite = useUpdateSite();
    const deleteSite = useDeleteSite();
    const createJob = useCreateJob();
    const deleteJob = useDeleteJob();

    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAddingJob, setIsAddingJob] = useState(false);
    const [deletingJob, setDeletingJob] = useState<Job | null>(null);

    const handleUpdate = async (data: CreateSiteDto) => {
        try {
            await updateSite.mutateAsync({ id, dto: data });
            toast.success('Site updated successfully');
            setIsEditing(false);
        } catch (error) {
            toast.error('Failed to update site');
            console.error(error);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteSite.mutateAsync(id);
            toast.success('Site deleted successfully');
            router.push('/sites');
        } catch (error) {
            toast.error('Failed to delete site');
            console.error(error);
        }
    };

    const handleCreateJob = async (data: CreateJobDto) => {
        try {
            await createJob.mutateAsync(data);
            toast.success('Job created successfully');
            setIsAddingJob(false);
        } catch (error) {
            toast.error('Failed to create job');
            console.error(error);
        }
    };

    const handleDeleteJob = async () => {
        if (!deletingJob) return;
        try {
            await deleteJob.mutateAsync(deletingJob.id);
            toast.success('Job deleted successfully');
            setDeletingJob(null);
        } catch (error) {
            toast.error('Failed to delete job');
            console.error(error);
        }
    };

    if (siteLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-[150px] w-full" />
                <Skeleton className="h-[300px] w-full" />
            </div>
        );
    }

    if (error || !site) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="text-center">
                    <h2 className="text-lg font-semibold">Site not found</h2>
                    <p className="text-muted-foreground mb-4">The site you&apos;re looking for doesn&apos;t exist</p>
                    <Button asChild>
                        <Link href="/sites">Back to Sites</Link>
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
                        <Link href="/sites">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{site.name}</h1>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{site.address}</span>
                        </div>
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

            {/* Site Details */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Project</CardTitle>
                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Link
                            href={`/projects/${site.projectId}`}
                            className="text-xl font-bold hover:underline"
                        >
                            {site.project?.name ?? 'View Project'}
                        </Link>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{jobs?.length ?? 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Jobs Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Jobs</CardTitle>
                        <CardDescription>Manage jobs for this site</CardDescription>
                    </div>
                    <Button onClick={() => setIsAddingJob(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Job
                    </Button>
                </CardHeader>
                <CardContent>
                    {jobsLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : jobs && jobs.length > 0 ? (
                        <div className="space-y-3">
                            {jobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="flex items-center justify-between rounded-lg border p-4"
                                >
                                    <Link
                                        href={`/jobs/${job.id}`}
                                        className="flex items-center gap-3 hover:underline"
                                    >
                                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{job.name}</p>
                                            {job.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    {job.description}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/jobs/${job.id}`}>View</Link>
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setDeletingJob(job)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-32 items-center justify-center text-muted-foreground">
                            No jobs yet. Add one to get started.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Site Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Site</DialogTitle>
                        <DialogDescription>Update the site details</DialogDescription>
                    </DialogHeader>
                    <SiteForm
                        site={site}
                        onSubmit={handleUpdate}
                        isLoading={updateSite.isPending}
                        onCancel={() => setIsEditing(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Site Confirmation */}
            <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Site</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{site.name}&quot;? This will also delete
                            all associated jobs.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteSite.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Add Job Dialog */}
            <Dialog open={isAddingJob} onOpenChange={setIsAddingJob}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Job</DialogTitle>
                        <DialogDescription>Add a new job to this site</DialogDescription>
                    </DialogHeader>
                    <JobForm
                        siteId={id}
                        onSubmit={handleCreateJob}
                        isLoading={createJob.isPending}
                        onCancel={() => setIsAddingJob(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Job Confirmation */}
            <AlertDialog open={!!deletingJob} onOpenChange={() => setDeletingJob(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Job</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deletingJob?.name}&quot;? This will also
                            delete all associated drawings.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteJob}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteJob.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
