'use client';

import { useState } from 'react';
import {
    Link2,
    SlidersHorizontal,
    Pencil,
    Trash2,
    CheckCircle2,
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { JointForm } from './joint-form';
import { useJobJoints, useUpdateJoint, useUpdateJointStage, useDeleteJoint } from '@/hooks/use-joints';
import { useDrawings } from '@/hooks/use-drawings';
import { useDrawingColumns } from '@/hooks/use-drawing-columns';
import { useJobMaterials } from '@/hooks/use-materials';
import { ColumnType, JointStage } from '@/types';
import type { Drawing, Joint, CreateJointDto, Material } from '@/types';
import { toast } from 'sonner';

const STAGE_LABEL: Record<JointStage, string> = {
    [JointStage.PENDING]: 'Pending',
    [JointStage.FITUP]: 'Fitup',
    [JointStage.WELDING]: 'Welding',
    [JointStage.ERECTION]: 'Erection',
    [JointStage.COMPLETED]: 'Completed',
};

// Extracted from original joint-table for visual consistency
const getStageBadgeClass = (stage: JointStage) => {
    switch (stage) {
        case JointStage.FITUP:
            return "bg-gradient-to-r from-blue-500/10 to-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30";
        case JointStage.WELDING:
            return "bg-gradient-to-r from-amber-500/10 to-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)] animate-pulse-glow";
        case JointStage.ERECTION:
            return "bg-gradient-to-r from-purple-500/10 to-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30";
        case JointStage.COMPLETED:
            return "bg-gradient-to-r from-emerald-500/10 to-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
        case JointStage.PENDING:
        default:
            return "bg-muted text-muted-foreground border-border";
    }
};

interface JobJointsTableProps {
    jobId: string;
}

export function JobJointsTable({ jobId }: JobJointsTableProps) {
    const { data: joints, isLoading: jointsLoading } = useJobJoints(jobId);
    const { data: allDrawings } = useDrawings(jobId);
    const { data: drawingColumns } = useDrawingColumns(jobId);
    const { data: jobMaterials } = useJobMaterials(jobId);
    
    const updateJoint = useUpdateJoint();
    const updateJointStage = useUpdateJointStage();
    const deleteJoint = useDeleteJoint();

    // Map lookups for fast retrieval
    const drawingsMap = new Map<string, Drawing>(allDrawings?.map(d => [d.id, d]) ?? []);
    const materialsMap = new Map<string, Material>(jobMaterials?.map(m => [m.id, m]) ?? []);

    const [visibleDrawingCols, setVisibleDrawingCols] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(0);
    const pageSize = 25;

    const [editingJoint, setEditingJoint] = useState<Joint | null>(null);
    const [deletingJoint, setDeletingJoint] = useState<Joint | null>(null);

    const sortedDrawingCols = (drawingColumns ?? []).slice().sort((a, b) => a.order - b.order);
    const activeDrawingCols = sortedDrawingCols.filter((col) => visibleDrawingCols.has(col.id));

    const paginatedJoints = (joints ?? []).slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil((joints?.length ?? 0) / pageSize);

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

    const getMaterialLabel = (materialId: string | null | undefined): string => {
        if (!materialId) return '-';
        const material = materialsMap.get(materialId);
        if (!material) return `Unknown (${materialId.slice(0, 8)})`;
        const dataKeys = Object.keys(material.data);
        if (dataKeys.length > 0 && material.data[dataKeys[0]]) {
            return String(material.data[dataKeys[0]]);
        }
        return `Material ${material.id.slice(0, 8)}`;
    };

    const handleUpdate = async (data: CreateJointDto) => {
        if (!editingJoint) return;
        try {
            await updateJoint.mutateAsync({
                drawingId: editingJoint.drawingId,
                jointId: editingJoint.id,
                dto: data,
            });
            toast.success('Joint updated successfully');
            setEditingJoint(null);
        } catch {
            toast.error('Failed to update joint');
        }
    };

    const handleDelete = async () => {
        if (!deletingJoint) return;
        try {
            await deleteJoint.mutateAsync({ drawingId: deletingJoint.drawingId, jointId: deletingJoint.id });
            toast.success('Joint deleted');
            setDeletingJoint(null);
        } catch {
            toast.error('Failed to delete joint');
        }
    };

    const handleStageChange = async (joint: Joint, newStage: JointStage) => {
        try {
            const dto: { stage: JointStage; fitupDate?: string; weldDate?: string; erectionDate?: string } = { stage: newStage };
            const today = new Date().toISOString().split('T')[0];
            if (newStage === JointStage.FITUP && !joint.fitupDate) dto.fitupDate = today;
            if (newStage === JointStage.WELDING && !joint.weldDate) dto.weldDate = today;
            if (newStage === JointStage.ERECTION && !joint.erectionDate) dto.erectionDate = today;

            await updateJointStage.mutateAsync({ drawingId: joint.drawingId, jointId: joint.id, dto });
            toast.success(`Stage updated to ${STAGE_LABEL[newStage]}`);
        } catch {
            toast.error('Failed to update stage');
        }
    };

    if (jointsLoading) {
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
                    <Link2 className="h-4 w-4" />
                    <span className="font-medium">{joints?.length ?? 0} joints across all drawings</span>
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
                            <TableHead className="whitespace-nowrap font-semibold">Joint No.</TableHead>
                            <TableHead className="whitespace-nowrap font-semibold">Stage</TableHead>
                            <TableHead className="whitespace-nowrap font-semibold">Material 1</TableHead>
                            <TableHead className="whitespace-nowrap font-semibold">Material 2</TableHead>
                            <TableHead className="whitespace-nowrap font-semibold">Remarks</TableHead>
                            <TableHead className="whitespace-nowrap font-semibold text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedJoints.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={activeDrawingCols.length + 6} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Link2 className="h-8 w-8 text-muted-foreground/50" />
                                        <p>No joints found across drawings.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedJoints.map((joint) => {
                                const drawing = drawingsMap.get(joint.drawingId);
                                return (
                                    <TableRow key={joint.id} className="hover:bg-muted/30 transition-colors">
                                        {/* Dynamic Drawing Columns */}
                                        {activeDrawingCols.map((col) => (
                                            <TableCell key={`cell-dwg-${col.id}-${joint.id}`} className="max-w-[200px] truncate text-sm">
                                                {drawing?.data?.[col.name]
                                                    ? formatCellValue(drawing.data[col.name], col.type)
                                                    : '-'}
                                            </TableCell>
                                        ))}

                                        <TableCell className="font-mono text-sm font-semibold whitespace-nowrap">
                                            {joint.jointNumber}
                                        </TableCell>

                                        <TableCell>
                                            <Select
                                                defaultValue={joint.stage}
                                                onValueChange={(val) => handleStageChange(joint, val as JointStage)}
                                            >
                                                <SelectTrigger className={`h-8 w-[130px] text-xs font-semibold rounded-full border px-3 ${getStageBadgeClass(joint.stage)}`}>
                                                    <div className="flex items-center gap-1.5">
                                                        {joint.stage === JointStage.COMPLETED && <CheckCircle2 className="h-3.5 w-3.5" />}
                                                        <SelectValue />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.values(JointStage).map((stage) => (
                                                        <SelectItem key={stage} value={stage} className="text-xs font-medium">
                                                            {STAGE_LABEL[stage]}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>

                                        <TableCell className="text-sm max-w-[150px] truncate" title={getMaterialLabel(joint.materialOneId)}>
                                            {getMaterialLabel(joint.materialOneId)}
                                        </TableCell>
                                        <TableCell className="text-sm max-w-[150px] truncate" title={getMaterialLabel(joint.materialTwoId)}>
                                            {getMaterialLabel(joint.materialTwoId)}
                                        </TableCell>

                                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={joint.remarks || '-'}>
                                            {joint.remarks || '-'}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-muted"
                                                    onClick={() => setEditingJoint(joint)}
                                                >
                                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => setDeletingJoint(joint)}
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
                        Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, joints?.length ?? 0)} of {joints?.length ?? 0} joints
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
            <Dialog open={!!editingJoint} onOpenChange={(open) => !open && setEditingJoint(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Joint</DialogTitle>
                        <DialogDescription>
                            Update joint details. Modifying stages will track material consumption automatically.
                        </DialogDescription>
                    </DialogHeader>
                    {editingJoint && (
                        <JointForm
                            joint={editingJoint}
                            materials={jobMaterials ?? []}
                            onSubmit={handleUpdate}
                            isLoading={updateJoint.isPending}
                            onCancel={() => setEditingJoint(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Deletion Dialog */}
            <AlertDialog open={!!deletingJoint} onOpenChange={(open) => !open && setDeletingJoint(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete joint{' '}
                            <span className="font-semibold">{deletingJoint?.jointNumber}</span> and remove
                            it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Joint
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
