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
import { SiteTable } from '@/components/sites/site-table';
import { SiteForm } from '@/components/sites/site-form';
import {
    useSites,
    useCreateSite,
    useUpdateSite,
    useDeleteSite,
} from '@/hooks/use-sites';
import type { Site, CreateSiteDto } from '@/types';

export default function SitesPage() {
    const { data: sites, isLoading, error } = useSites();
    const createSite = useCreateSite();
    const updateSite = useUpdateSite();
    const deleteSite = useDeleteSite();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSite, setEditingSite] = useState<Site | null>(null);
    const [deletingSite, setDeletingSite] = useState<Site | null>(null);

    const handleCreate = async (data: CreateSiteDto) => {
        try {
            await createSite.mutateAsync(data);
            toast.success('Site created successfully');
            setIsFormOpen(false);
        } catch (error) {
            toast.error('Failed to create site');
            console.error(error);
        }
    };

    const handleUpdate = async (data: CreateSiteDto) => {
        if (!editingSite) return;
        try {
            await updateSite.mutateAsync({ id: editingSite.id, dto: data });
            toast.success('Site updated successfully');
            setEditingSite(null);
        } catch (error) {
            toast.error('Failed to update site');
            console.error(error);
        }
    };

    const handleDelete = async () => {
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

    if (error) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="text-center">
                    <h2 className="text-lg font-semibold">Failed to load sites</h2>
                    <p className="text-muted-foreground">Please try again later</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sites</h1>
                    <p className="text-muted-foreground">
                        Manage all sites across your projects
                    </p>
                </div>
                <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Site
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-[200px]" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
            ) : (
                <SiteTable
                    data={sites ?? []}
                    onEdit={(site) => setEditingSite(site)}
                    onDelete={(site) => setDeletingSite(site)}
                    showProject
                />
            )}

            {/* Create Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Site</DialogTitle>
                        <DialogDescription>
                            Fill in the details to create a new site
                        </DialogDescription>
                    </DialogHeader>
                    <SiteForm
                        onSubmit={handleCreate}
                        isLoading={createSite.isPending}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingSite} onOpenChange={() => setEditingSite(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Site</DialogTitle>
                        <DialogDescription>
                            Update the site details
                        </DialogDescription>
                    </DialogHeader>
                    {editingSite && (
                        <SiteForm
                            site={editingSite}
                            onSubmit={handleUpdate}
                            isLoading={updateSite.isPending}
                            onCancel={() => setEditingSite(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
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
                            onClick={handleDelete}
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
