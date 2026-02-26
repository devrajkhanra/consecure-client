'use client';

import { useState, Fragment } from 'react';
import { Plus, Pencil, Trash2, Package, ChevronDown, ChevronRight } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MaterialForm } from '@/components/materials/material-form';
import { TransactionTable } from '@/components/materials/transaction-table';
import {
    useMaterials,
    useCreateMaterial,
    useUpdateMaterial,
    useDeleteMaterial,
} from '@/hooks/use-materials';
import type { MaterialColumn, Material, CreateMaterialDto } from '@/types';
import { ColumnType, MaterialStatus } from '@/types';

const STATUS_VARIANT: Record<MaterialStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    [MaterialStatus.REQUIRED]: 'outline',
    [MaterialStatus.PENDING]: 'secondary',
    [MaterialStatus.ISSUED]: 'default',
    [MaterialStatus.USED]: 'default',
    [MaterialStatus.RETURNED]: 'secondary',
    [MaterialStatus.REJECTED]: 'destructive',
};

const STATUS_LABEL: Record<MaterialStatus, string> = {
    [MaterialStatus.REQUIRED]: 'Required',
    [MaterialStatus.PENDING]: 'Pending',
    [MaterialStatus.ISSUED]: 'Issued',
    [MaterialStatus.USED]: 'Used',
    [MaterialStatus.RETURNED]: 'Returned',
    [MaterialStatus.REJECTED]: 'Rejected',
};

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
    const [expandedMaterialId, setExpandedMaterialId] = useState<string | null>(null);

    const sortedColumns = columns.slice().sort((a, b) => a.order - b.order);

    const toggleExpand = (materialId: string) => {
        setExpandedMaterialId(expandedMaterialId === materialId ? null : materialId);
    };

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

    const formatQty = (value: number | undefined | null): string => {
        if (value === undefined || value === null) return '-';
        return Number(value).toLocaleString();
    };

    // Total dynamic + built-in columns + expand + actions
    const totalColSpan = sortedColumns.length + 7;

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
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30px]"></TableHead>
                                {sortedColumns.map((col) => (
                                    <TableHead key={col.id} className="text-xs">
                                        {col.name}
                                    </TableHead>
                                ))}
                                <TableHead className="text-xs">Status</TableHead>
                                <TableHead className="text-xs text-right">Req</TableHead>
                                <TableHead className="text-xs text-right">Issued</TableHead>
                                <TableHead className="text-xs text-right">Used</TableHead>
                                <TableHead className="text-xs">Unit</TableHead>
                                <TableHead className="w-20 text-xs">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {materials?.map((material) => (
                                <Fragment key={material.id}>
                                    <TableRow className={expandedMaterialId === material.id ? 'bg-muted/50' : ''}>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0"
                                                onClick={() => toggleExpand(material.id)}
                                            >
                                                {expandedMaterialId === material.id ? (
                                                    <ChevronDown className="h-3 w-3" />
                                                ) : (
                                                    <ChevronRight className="h-3 w-3" />
                                                )}
                                            </Button>
                                        </TableCell>
                                        {sortedColumns.map((col) => (
                                            <TableCell key={col.id} className="text-sm">
                                                {formatCellValue(material.data[col.name], col.type)}
                                            </TableCell>
                                        ))}
                                        <TableCell>
                                            <Badge variant={STATUS_VARIANT[material.status] ?? 'outline'} className="text-xs">
                                                {STATUS_LABEL[material.status] ?? material.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-right font-mono">
                                            {formatQty(material.quantityRequired)}
                                        </TableCell>
                                        <TableCell className="text-sm text-right font-mono">
                                            {formatQty(material.quantityIssued)}
                                        </TableCell>
                                        <TableCell className="text-sm text-right font-mono">
                                            {formatQty(material.quantityUsed)}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {material.unit ?? '-'}
                                        </TableCell>
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
                                    {expandedMaterialId === material.id && (
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableCell colSpan={totalColSpan} className="p-3">
                                                <div className="pl-6">
                                                    <TransactionTable materialId={material.id} />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </Fragment>
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
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
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
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
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
