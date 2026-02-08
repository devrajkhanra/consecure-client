'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
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
import { MaterialForm } from '@/components/materials/material-form';
import {
    useMaterials,
    useCreateMaterial,
    useUpdateMaterial,
    useDeleteMaterial,
} from '@/hooks/use-materials';
import type { MaterialColumn, Material, CreateMaterialDto } from '@/types';
import { ColumnType } from '@/types';

interface MaterialTableProps {
    drawingId: string;
    columns: MaterialColumn[];
}

export function MaterialTable({ drawingId, columns }: MaterialTableProps) {
    const { data: materials, isLoading, error } = useMaterials(drawingId);
    const createMaterial = useCreateMaterial();
    const updateMaterial = useUpdateMaterial();
    const deleteMaterial = useDeleteMaterial();

    const [isAdding, setIsAdding] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);

    const sortedColumns = columns.slice().sort((a, b) => a.order - b.order);

    const handleCreate = async (data: CreateMaterialDto) => {
        try {
            await createMaterial.mutateAsync({ drawingId, dto: data });
            toast.success('Material added successfully');
            setIsAdding(false);
        } catch (error) {
            toast.error('Failed to add material');
            console.error(error);
        }
    };

    const handleUpdate = async (data: CreateMaterialDto) => {
        if (!editingMaterial) return;
        try {
            await updateMaterial.mutateAsync({
                drawingId,
                materialId: editingMaterial.id,
                dto: data,
            });
            toast.success('Material updated successfully');
            setEditingMaterial(null);
        } catch (error) {
            toast.error('Failed to update material');
            console.error(error);
        }
    };

    const handleDelete = async () => {
        if (!deletingMaterial) return;
        try {
            await deleteMaterial.mutateAsync({
                drawingId,
                materialId: deletingMaterial.id,
            });
            toast.success('Material deleted successfully');
            setDeletingMaterial(null);
        } catch (error) {
            toast.error('Failed to delete material');
            console.error(error);
        }
    };

    const formatCellValue = (value: unknown, type: ColumnType): string => {
        if (value === undefined || value === null) return '-';
        switch (type) {
            case ColumnType.BOOLEAN:
                return value === true ? '✓' : '✗';
            case ColumnType.DATE:
                return value ? new Date(value as string).toLocaleDateString() : '-';
            default:
                return String(value);
        }
    };

    if (error) {
        return (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
                Failed to load materials
            </div>
        );
    }

    if (columns.length === 0) {
        return (
            <div className="text-sm text-muted-foreground py-2">
                Configure material columns first to add materials.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Package className="h-4 w-4" />
                    Materials ({materials?.length ?? 0})
                </div>
                <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                </Button>
            </div>

            {isLoading ? (
                <Skeleton className="h-24 w-full" />
            ) : (materials?.length ?? 0) > 0 ? (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {sortedColumns.map((col) => (
                                    <TableHead key={col.id} className="text-xs">
                                        {col.name}
                                    </TableHead>
                                ))}
                                <TableHead className="w-20 text-xs">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {materials?.map((material) => (
                                <TableRow key={material.id}>
                                    {sortedColumns.map((col) => (
                                        <TableCell key={col.id} className="text-sm">
                                            {formatCellValue(material.data[col.name], col.type)}
                                        </TableCell>
                                    ))}
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => setEditingMaterial(material)}
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                onClick={() => setDeletingMaterial(material)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="text-center py-4 text-sm text-muted-foreground border rounded-md">
                    No materials added yet
                </div>
            )}

            {/* Add Material Dialog */}
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Material</DialogTitle>
                        <DialogDescription>Add a new material to this drawing</DialogDescription>
                    </DialogHeader>
                    <MaterialForm
                        columns={sortedColumns}
                        onSubmit={handleCreate}
                        isLoading={createMaterial.isPending}
                        onCancel={() => setIsAdding(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Material Dialog */}
            <Dialog open={!!editingMaterial} onOpenChange={() => setEditingMaterial(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Material</DialogTitle>
                        <DialogDescription>Update material details</DialogDescription>
                    </DialogHeader>
                    {editingMaterial && (
                        <MaterialForm
                            columns={sortedColumns}
                            material={editingMaterial}
                            onSubmit={handleUpdate}
                            isLoading={updateMaterial.isPending}
                            onCancel={() => setEditingMaterial(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Material Confirmation */}
            <AlertDialog open={!!deletingMaterial} onOpenChange={() => setDeletingMaterial(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Material</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this material?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMaterial.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
