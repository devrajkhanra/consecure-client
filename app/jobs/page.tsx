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
import { JobTable } from '@/components/jobs/job-table';
import { JobForm } from '@/components/jobs/job-form';
import {
    useJobs,
    useCreateJob,
    useUpdateJob,
    useDeleteJob,
} from '@/hooks/use-jobs';
import type { Job, CreateJobDto } from '@/types';

export default function JobsPage() {
    const { data: jobs, isLoading, error } = useJobs();
    const createJob = useCreateJob();
    const updateJob = useUpdateJob();
    const deleteJob = useDeleteJob();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [deletingJob, setDeletingJob] = useState<Job | null>(null);

    const handleCreate = async (data: CreateJobDto) => {
        try {
            await createJob.mutateAsync(data);
            toast.success('Job created successfully');
            setIsFormOpen(false);
        } catch (error) {
            toast.error('Failed to create job');
            console.error(error);
        }
    };

    const handleUpdate = async (data: CreateJobDto) => {
        if (!editingJob) return;
        try {
            await updateJob.mutateAsync({ id: editingJob.id, dto: data });
            toast.success('Job updated successfully');
            setEditingJob(null);
        } catch (error) {
            toast.error('Failed to update job');
            console.error(error);
        }
    };

    const handleDelete = async () => {
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

    if (error) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="text-center">
                    <h2 className="text-lg font-semibold">Failed to load jobs</h2>
                    <p className="text-muted-foreground">Please try again later</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
                    <p className="text-muted-foreground">
                        Manage all jobs across your sites
                    </p>
                </div>
                <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Job
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-[200px]" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
            ) : (
                <JobTable
                    data={jobs ?? []}
                    onEdit={(job) => setEditingJob(job)}
                    onDelete={(job) => setDeletingJob(job)}
                    showSite
                />
            )}

            {/* Create Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Job</DialogTitle>
                        <DialogDescription>
                            Fill in the details to create a new job
                        </DialogDescription>
                    </DialogHeader>
                    <JobForm
                        onSubmit={handleCreate}
                        isLoading={createJob.isPending}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingJob} onOpenChange={() => setEditingJob(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Job</DialogTitle>
                        <DialogDescription>
                            Update the job details
                        </DialogDescription>
                    </DialogHeader>
                    {editingJob && (
                        <JobForm
                            job={editingJob}
                            onSubmit={handleUpdate}
                            isLoading={updateJob.isPending}
                            onCancel={() => setEditingJob(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingJob} onOpenChange={() => setDeletingJob(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Job</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deletingJob?.name}&quot;? This will also
                            delete all associated drawings and columns.
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
        </div>
    );
}
