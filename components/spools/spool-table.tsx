'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { SpoolForm } from './spool-form';
import { useSpools, useCreateSpool, useUpdateSpool, useDeleteSpool } from '@/hooks/use-spools';
import type { Spool, CreateSpoolDto } from '@/types';

interface SpoolTableProps {
    drawingId: string;
}

export function SpoolTable({ drawingId }: SpoolTableProps) {
    const { data: spools, isLoading } = useSpools(drawingId);
    const createSpool = useCreateSpool();
    const updateSpool = useUpdateSpool();
    const deleteSpool = useDeleteSpool();

    const [isAdding, setIsAdding] = useState(false);
    const [editingSpool, setEditingSpool] = useState<Spool | null>(null);
    const [deletingSpool, setDeletingSpool] = useState<Spool | null>(null);

    const handleCreate = async (data: CreateSpoolDto) => {
        try {
            await createSpool.mutateAsync({ drawingId, data });
            toast.success('Spool added successfully');
            setIsAdding(false);
        } catch {
            toast.error('Failed to add spool');
        }
    };

    const handleUpdate = async (data: CreateSpoolDto) => {
        if (!editingSpool) return;
        try {
            await updateSpool.mutateAsync({
                drawingId,
                id: editingSpool.id,
                data,
            });
            toast.success('Spool updated successfully');
            setEditingSpool(null);
        } catch {
            toast.error('Failed to update spool');
        }
    };

    const handleDelete = async () => {
        if (!deletingSpool) return;
        try {
            await deleteSpool.mutateAsync({ drawingId, id: deletingSpool.id });
            toast.success('Spool deleted');
            setDeletingSpool(null);
        } catch {
            toast.error('Failed to delete spool');
        }
    };

    if (isLoading) {
        return <div className="p-4 text-center text-sm text-muted-foreground">Loading spools...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Spools</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage prefabricated assemblies for this drawing.
                    </p>
                </div>
                <Dialog open={isAdding} onOpenChange={setIsAdding}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Spool
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Spool</DialogTitle>
                            <DialogDescription>
                                Create a new prefabricated assembly for this drawing.
                            </DialogDescription>
                        </DialogHeader>
                        <SpoolForm
                            onSubmit={handleCreate}
                            isLoading={createSpool.isPending}
                            onCancel={() => setIsAdding(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">Spool No.</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Remarks</TableHead>
                            <TableHead className="w-[120px] text-right">Added</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!spools || spools.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No spools added yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            spools.map((spool) => (
                                <TableRow key={spool.id}>
                                    <TableCell className="font-mono text-sm font-semibold">
                                        {spool.spoolNumber}
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium ring-1 ring-inset ring-muted-foreground/20">
                                            {spool.status || 'N/A'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {spool.description || '-'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                                        {spool.remarks || '-'}
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">
                                        {format(new Date(spool.createdAt), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setEditingSpool(spool)}
                                            >
                                                <Pencil className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setDeletingSpool(spool)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!editingSpool} onOpenChange={(open) => !open && setEditingSpool(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Spool</DialogTitle>
                        <DialogDescription>
                            Update the details for this spool assembly.
                        </DialogDescription>
                    </DialogHeader>
                    {editingSpool && (
                        <SpoolForm
                            spool={editingSpool}
                            onSubmit={handleUpdate}
                            isLoading={updateSpool.isPending}
                            onCancel={() => setEditingSpool(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingSpool} onOpenChange={(open) => !open && setDeletingSpool(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete spool{' '}
                            <span className="font-semibold">{deletingSpool?.spoolNumber}</span> and remove
                            it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Spool
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
