'use client';

import { useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ColumnForm } from '@/components/drawings/column-form';
import {
    useDrawingColumns,
    useCreateDrawingColumn,
    useUpdateDrawingColumn,
    useDeleteDrawingColumn,
} from '@/hooks/use-drawing-columns';
import { ColumnType, type DrawingColumn, type CreateDrawingColumnDto } from '@/types';

const typeLabels: Record<ColumnType, string> = {
    [ColumnType.TEXT]: 'Text',
    [ColumnType.NUMBER]: 'Number',
    [ColumnType.DATE]: 'Date',
    [ColumnType.BOOLEAN]: 'Boolean',
};

interface SortableColumnItemProps {
    column: DrawingColumn;
    onEdit: (column: DrawingColumn) => void;
    onDelete: (column: DrawingColumn) => void;
}

function SortableColumnItem({ column, onEdit, onDelete }: SortableColumnItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: column.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between rounded-lg border bg-background p-3"
        >
            <div className="flex items-center gap-3">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab touch-none hover:text-foreground text-muted-foreground"
                >
                    <GripVertical className="h-4 w-4" />
                </button>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{column.name}</span>
                        {column.required && (
                            <Badge variant="secondary" className="text-xs">
                                Required
                            </Badge>
                        )}
                        {column.isRevisionColumn && (
                            <Badge variant="default" className="text-xs">
                                Revision
                            </Badge>
                        )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {typeLabels[column.type]}
                    </span>
                </div>
            </div>
            <div className="flex gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(column)}
                >
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(column)}
                    className="text-destructive hover:text-destructive"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

interface ColumnManagerProps {
    jobId: string;
}

export function ColumnManager({ jobId }: ColumnManagerProps) {
    const { data: columns, isLoading, error } = useDrawingColumns(jobId);
    const createColumn = useCreateDrawingColumn();
    const updateColumn = useUpdateDrawingColumn();
    const deleteColumn = useDeleteDrawingColumn();

    const [isAdding, setIsAdding] = useState(false);
    const [editingColumn, setEditingColumn] = useState<DrawingColumn | null>(null);
    const [deletingColumn, setDeletingColumn] = useState<DrawingColumn | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const sortedColumns = columns?.slice().sort((a, b) => a.order - b.order) ?? [];
    const nextOrder = sortedColumns.length > 0 ? Math.max(...sortedColumns.map((c) => c.order)) + 1 : 0;

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = sortedColumns.findIndex((c) => c.id === active.id);
            const newIndex = sortedColumns.findIndex((c) => c.id === over.id);

            const reorderedColumns = arrayMove(sortedColumns, oldIndex, newIndex);

            // Update all affected columns with new order values
            try {
                await Promise.all(
                    reorderedColumns.map((column, index) =>
                        updateColumn.mutateAsync({
                            jobId,
                            columnId: column.id,
                            dto: {
                                name: column.name,
                                type: column.type,
                                required: column.required,
                                order: index,
                                isRevisionColumn: column.isRevisionColumn,
                            },
                        })
                    )
                );
            } catch (error) {
                toast.error('Failed to reorder columns');
                console.error(error);
            }
        }
    };

    const handleCreate = async (data: CreateDrawingColumnDto) => {
        try {
            await createColumn.mutateAsync({ jobId, dto: data });
            toast.success('Column created successfully');
            setIsAdding(false);
        } catch (error) {
            toast.error('Failed to create column');
            console.error(error);
        }
    };

    const handleUpdate = async (data: CreateDrawingColumnDto) => {
        if (!editingColumn) return;
        try {
            await updateColumn.mutateAsync({ jobId, columnId: editingColumn.id, dto: data });
            toast.success('Column updated successfully');
            setEditingColumn(null);
        } catch (error) {
            toast.error('Failed to update column');
            console.error(error);
        }
    };

    const handleDelete = async () => {
        if (!deletingColumn) return;
        try {
            await deleteColumn.mutateAsync({ jobId, columnId: deletingColumn.id });
            toast.success('Column deleted successfully');
            setDeletingColumn(null);
        } catch (error) {
            toast.error('Failed to delete column');
            console.error(error);
        }
    };

    if (error) {
        return (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                Failed to load columns. Please try again.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Drawing Columns</h3>
                <Button size="sm" onClick={() => setIsAdding(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Column
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : sortedColumns.length > 0 ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={sortedColumns.map((c) => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-2">
                            {sortedColumns.map((column) => (
                                <SortableColumnItem
                                    key={column.id}
                                    column={column}
                                    onEdit={setEditingColumn}
                                    onDelete={setDeletingColumn}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            ) : (
                <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                    No columns defined. Add columns to structure your drawing data.
                </div>
            )}

            {/* Add Column Dialog */}
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Column</DialogTitle>
                        <DialogDescription>
                            Define a new column for the drawing list
                        </DialogDescription>
                    </DialogHeader>
                    <ColumnForm
                        nextOrder={nextOrder}
                        onSubmit={handleCreate}
                        isLoading={createColumn.isPending}
                        onCancel={() => setIsAdding(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Column Dialog */}
            <Dialog open={!!editingColumn} onOpenChange={() => setEditingColumn(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Column</DialogTitle>
                        <DialogDescription>Update the column properties</DialogDescription>
                    </DialogHeader>
                    {editingColumn && (
                        <ColumnForm
                            column={editingColumn}
                            onSubmit={handleUpdate}
                            isLoading={updateColumn.isPending}
                            onCancel={() => setEditingColumn(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Column Confirmation */}
            <AlertDialog open={!!deletingColumn} onOpenChange={() => setDeletingColumn(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Column</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the &quot;{deletingColumn?.name}&quot; column?
                            This will remove this field from all existing drawings.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteColumn.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
