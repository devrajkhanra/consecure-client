'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
    Component,
    SlidersHorizontal,
    Pencil,
    Trash2,
} from 'lucide-react';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { SpoolForm } from './spool-form';
import { useJobSpools, useUpdateSpool, useDeleteSpool } from '@/hooks/use-spools';
import { useDrawings } from '@/hooks/use-drawings';
import { useDrawingColumns } from '@/hooks/use-drawing-columns';
import { ColumnType } from '@/types';
import type { Drawing, Spool, CreateSpoolDto } from '@/types';
import { toast } from 'sonner';

interface JobSpoolsTableProps {
    jobId: string;
}

export function JobSpoolsTable({ jobId }: JobSpoolsTableProps) {
    const { data: spools, isLoading: spoolsLoading } = useJobSpools(jobId);
    const { data: allDrawings } = useDrawings(jobId);
    const { data: drawingColumns } = useDrawingColumns(jobId);
    
    const updateSpool = useUpdateSpool();
    const deleteSpool = useDeleteSpool();

    const drawingsMap = new Map<string, Drawing>(allDrawings?.map(d => [d.id, d]) ?? []);

    const [visibleDrawingCols, setVisibleDrawingCols] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(0);
    const pageSize = 25;

    const [editingSpool, setEditingSpool] = useState<Spool | null>(null);
    const [deletingSpool, setDeletingSpool] = useState<Spool | null>(null);

    const sortedDrawingCols = (drawingColumns ?? []).slice().sort((a, b) => a.order - b.order);
    const activeDrawingCols = sortedDrawingCols.filter((col) => visibleDrawingCols.has(col.id));

    const paginatedSpools = (spools ?? []).slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil((spools?.length ?? 0) / pageSize);

    const toggleDrawingCol = (colId: string) => {
        setVisibleDrawingCols((prev) => {
            const next = new Set(prev);
            if (next.has(colId)) next.delete(colId);
            else next.add(colId);
            return next;
        });
    };

    const formatCellValue = (value: unknown, type: ColumnType): string => {
        if (value === undefined || value === null) return '-';
        switch (type) {
            case ColumnType.BOOLEAN: return value === true ? '✓' : '✗';
            case ColumnType.DATE: return value ? new Date(value as string).toLocaleDateString() : '-';
            default: return String(value);
        }
    };

    const handleUpdate = async (data: CreateSpoolDto) => {
        if (!editingSpool) return;
        try {
            await updateSpool.mutateAsync({
                drawingId: editingSpool.drawingId,
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
            await deleteSpool.mutateAsync({ drawingId: deletingSpool.drawingId, id: deletingSpool.id });
            toast.success('Spool deleted');
            setDeletingSpool(null);
        } catch {
            toast.error('Failed to delete spool');
        }
    };

    if (spoolsLoading) {
        return (
            <div className="space-y-3 p-4 border rounded-md">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4 rounded-md border bg-card p-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Component className="h-4 w-4" />
                    <span className="font-medium">{spools?.length ?? 0} spools across all drawings</span>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <SlidersHorizontal className="mr-2 h-4 w-4" />
                            Drawing Columns ({visibleDrawingCols.size})
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Show Drawing Columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {sortedDrawingCols.map((col) => (
                            <DropdownMenuCheckboxItem
                                key={col.id}
                                checked={visibleDrawingCols.has(col.id)}
                                onCheckedChange={() => toggleDrawingCol(col.id)}
                            >
                                {col.name}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            {/* Drawing Columns First */}
                            {activeDrawingCols.map((col) => (
                                <TableHead key={`head-dwg-${col.id}`} className="whitespace-nowrap font-semibold">
                                    <span className="text-xs text-muted-foreground mr-1">Dwg</span>
                                    {col.name}
                                </TableHead>
                            ))}
                            <TableHead className="whitespace-nowrap font-semibold">Spool No.</TableHead>
                            <TableHead className="whitespace-nowrap font-semibold">Status</TableHead>
                            <TableHead className="whitespace-nowrap font-semibold">Description</TableHead>
                            <TableHead className="whitespace-nowrap font-semibold">Remarks</TableHead>
                            <TableHead className="whitespace-nowrap font-semibold text-right">Added</TableHead>
                            <TableHead className="whitespace-nowrap font-semibold text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedSpools.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={activeDrawingCols.length + 6} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Component className="h-8 w-8 text-muted-foreground/50" />
                                        <p>No spools found across drawings.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedSpools.map((spool) => {
                                const drawing = drawingsMap.get(spool.drawingId);
                                return (
                                    <TableRow key={spool.id} className="hover:bg-muted/30 transition-colors">
                                        {/* Dynamic Drawing Columns */}
                                        {activeDrawingCols.map((col) => (
                                            <TableCell key={`cell-dwg-${col.id}-${spool.id}`} className="max-w-[200px] truncate text-sm">
                                                {drawing?.data?.[col.name]
                                                    ? formatCellValue(drawing.data[col.name], col.type)
                                                    : '-'}
                                            </TableCell>
                                        ))}

                                        <TableCell className="font-mono text-sm font-semibold whitespace-nowrap">
                                            {spool.spoolNumber}
                                        </TableCell>

                                        <TableCell>
                                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium ring-1 ring-inset ring-muted-foreground/20">
                                                {spool.status || 'N/A'}
                                            </span>
                                        </TableCell>

                                        <TableCell className="text-sm max-w-[200px] truncate" title={spool.description || '-'}>
                                            {spool.description || '-'}
                                        </TableCell>

                                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={spool.remarks || '-'}>
                                            {spool.remarks || '-'}
                                        </TableCell>

                                        <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                                            {format(new Date(spool.createdAt), 'MMM d, yyyy')}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-muted"
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
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-muted-foreground">
                        Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, spools?.length ?? 0)} of {spools?.length ?? 0} spools
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={page === 0}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                            disabled={page === totalPages - 1}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Editing Dialog */}
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

            {/* Deletion Dialog */}
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
