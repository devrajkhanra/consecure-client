'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, ArrowRight } from 'lucide-react';
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
import { ConnectionForm } from './connection-form';
import { useDrawingConnections, useCreateDrawingConnection, useUpdateDrawingConnection, useDeleteDrawingConnection } from '@/hooks/use-drawing-connections';
import { useSpools } from '@/hooks/use-spools';
import { useJobMaterials } from '@/hooks/use-materials';
import { useJoints } from '@/hooks/use-joints';
import type { Drawing, DrawingColumn, DrawingConnection, CreateDrawingConnectionDto, Spool, Joint } from '@/types';

interface ConnectionTableProps {
    drawings: Drawing[];
    drawingColumns: DrawingColumn[];
    jobId: string;
}

export function ConnectionTable({ drawings, drawingColumns, jobId }: ConnectionTableProps) {
    const { data: allConnections, isLoading } = useDrawingConnections();
    const createConn = useCreateDrawingConnection();
    const updateConn = useUpdateDrawingConnection();
    const deleteConn = useDeleteDrawingConnection();

    // Fetch resources needed for the form
    // Note: useJobMaterials returns all materials for the job
    const { data: materials } = useJobMaterials(jobId);
    
    // We don't have a single hook for all spools/joints in a job yet,
    // so we'll mock them or rely on what's available for now. 
    // Ideally the API would provide `/jobs/:id/spools` and `/jobs/:id/joints`
    // For now we'll pass empty arrays or data we have if we only do per-drawing.
    // Given the constraints, let's keep them as empty arrays or avoid fetching them 
    // all if it's too much. The form only needs them if the user chooses to specify a SPOOL/JOINT.
    // We can fetch them per drawing if needed, but for the entire job, we might not have it.
    // Let's pass empty arrays for now, the user can type remarks instead.
    const spools: Spool[] = [];
    const joints: Joint[] = [];

    const [isAdding, setIsAdding] = useState(false);
    const [editingConn, setEditingConn] = useState<DrawingConnection | null>(null);
    const [deletingConn, setDeletingConn] = useState<DrawingConnection | null>(null);

    // Filter connections to only those where drawingOne or drawingTwo is in this job
    const jobDrawingIds = new Set(drawings.map(d => d.id));
    const connections = allConnections?.filter(c => jobDrawingIds.has(c.drawingOneId) || jobDrawingIds.has(c.drawingTwoId)) ?? [];

    const handleCreate = async (data: CreateDrawingConnectionDto) => {
        try {
            // Clean up 'none' values to undefined
            if (data.materialId === 'none') data.materialId = undefined;
            if (data.spoolId === 'none') data.spoolId = undefined;
            if (data.jointId === 'none') data.jointId = undefined;

            await createConn.mutateAsync(data);
            toast.success('Connection added successfully');
            setIsAdding(false);
        } catch {
            toast.error('Failed to add connection');
        }
    };

    const handleUpdate = async (data: CreateDrawingConnectionDto) => {
        if (!editingConn) return;
        try {
            if (data.materialId === 'none') data.materialId = undefined;
            if (data.spoolId === 'none') data.spoolId = undefined;
            if (data.jointId === 'none') data.jointId = undefined;

            await updateConn.mutateAsync({
                id: editingConn.id,
                data,
            });
            toast.success('Connection updated successfully');
            setEditingConn(null);
        } catch {
            toast.error('Failed to update connection');
        }
    };

    const handleDelete = async () => {
        if (!deletingConn) return;
        try {
            await deleteConn.mutateAsync(deletingConn.id);
            toast.success('Connection deleted');
            setDeletingConn(null);
        } catch {
            toast.error('Failed to delete connection');
        }
    };

    // Helper to format drawing label
    const getDrawingLabel = (drawingId: string) => {
        const d = drawings.find(x => x.id === drawingId);
        if (!d) return `External (${drawingId.slice(0, 8)})`;
        const sortedCols = [...drawingColumns].sort((a, b) => a.order - b.order);
        if (sortedCols.length > 0) {
            return String(d.data[sortedCols[0]?.name] ?? `Drawing ${d.id.slice(0, 8)}`);
        }
        return `Drawing ${d.id.slice(0, 8)}`;
    };

    if (isLoading) {
        return <div className="p-4 text-center text-sm text-muted-foreground">Loading connections...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Drawing Connections</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage cross-drawing links and tie-in points.
                    </p>
                </div>
                <Dialog open={isAdding} onOpenChange={setIsAdding}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Connection
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add Drawing Connection</DialogTitle>
                            <DialogDescription>
                                Create a link connecting two drawings.
                            </DialogDescription>
                        </DialogHeader>
                        <ConnectionForm
                            drawings={drawings}
                            drawingColumns={drawingColumns}
                            materials={materials ?? []}
                            spools={spools}
                            joints={joints}
                            onSubmit={handleCreate}
                            isLoading={createConn.isPending}
                            onCancel={() => setIsAdding(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Source Drawing</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Target Drawing</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {connections.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No connections added yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            connections.map((conn) => (
                                <TableRow key={conn.id}>
                                    <TableCell className="font-medium text-sm">
                                        <span className="text-primary">{getDrawingLabel(conn.drawingOneId)}</span>
                                    </TableCell>
                                    <TableCell>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </TableCell>
                                    <TableCell className="font-medium text-sm">
                                        <span className="text-primary">{getDrawingLabel(conn.drawingTwoId)}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex py-1 px-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-accent/50 text-accent-foreground border">
                                            {conn.connectionType}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {conn.description || '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setEditingConn(conn)}
                                            >
                                                <Pencil className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setDeletingConn(conn)}
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

            <Dialog open={!!editingConn} onOpenChange={(open) => !open && setEditingConn(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Connection</DialogTitle>
                        <DialogDescription>
                            Update the details of this cross-drawing link.
                        </DialogDescription>
                    </DialogHeader>
                    {editingConn && (
                        <ConnectionForm
                            connection={editingConn}
                            drawings={drawings}
                            drawingColumns={drawingColumns}
                            materials={materials ?? []}
                            spools={spools}
                            joints={joints}
                            onSubmit={handleUpdate}
                            isLoading={updateConn.isPending}
                            onCancel={() => setEditingConn(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingConn} onOpenChange={(open) => !open && setDeletingConn(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this connection and remove
                            it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Connection
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
