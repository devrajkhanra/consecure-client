'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Link2, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { JointForm } from '@/components/joints/joint-form';
import {
    useJoints,
    useCreateJoint,
    useUpdateJoint,
    useUpdateJointStage,
    useDeleteJoint,
} from '@/hooks/use-joints';
import { useMaterials } from '@/hooks/use-materials';
import { JointStage } from '@/types';
import type { Joint, CreateJointDto, Material } from '@/types';

const STAGE_ORDER: JointStage[] = [
    JointStage.PENDING,
    JointStage.FITUP,
    JointStage.WELDING,
    JointStage.ERECTION,
    JointStage.COMPLETED,
];

const STAGE_LABEL: Record<JointStage, string> = {
    [JointStage.PENDING]: 'Pending',
    [JointStage.FITUP]: 'Fitup',
    [JointStage.WELDING]: 'Welding',
    [JointStage.ERECTION]: 'Erection',
    [JointStage.COMPLETED]: 'Completed',
};

const STAGE_CLASS: Record<JointStage, string> = {
    [JointStage.PENDING]: 'stage-pending',
    [JointStage.FITUP]: 'stage-fitup',
    [JointStage.WELDING]: 'stage-welding',
    [JointStage.ERECTION]: 'stage-erection',
    [JointStage.COMPLETED]: 'stage-completed',
};

interface JointTableProps {
    drawingId: string;
}

export function JointTable({ drawingId }: JointTableProps) {
    const { data: joints, isLoading } = useJoints(drawingId);
    const { data: materials } = useMaterials(drawingId);
    const createJoint = useCreateJoint();
    const updateJoint = useUpdateJoint();
    const updateJointStage = useUpdateJointStage();
    const deleteJoint = useDeleteJoint();

    const [isAdding, setIsAdding] = useState(false);
    const [editingJoint, setEditingJoint] = useState<Joint | null>(null);
    const [deletingJoint, setDeletingJoint] = useState<Joint | null>(null);

    const handleCreate = async (data: CreateJointDto) => {
        try {
            await createJoint.mutateAsync({ drawingId, dto: data });
            toast.success('Joint added successfully');
            setIsAdding(false);
        } catch {
            toast.error('Failed to add joint');
        }
    };

    const handleUpdate = async (data: CreateJointDto) => {
        if (!editingJoint) return;
        try {
            await updateJoint.mutateAsync({
                drawingId,
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
            await deleteJoint.mutateAsync({ drawingId, jointId: deletingJoint.id });
            toast.success('Joint deleted');
            setDeletingJoint(null);
        } catch {
            toast.error('Failed to delete joint');
        }
    };

    const handleStageChange = async (joint: Joint, newStage: JointStage) => {
        try {
            const dto: { stage: JointStage; fitupDate?: string; weldDate?: string; erectionDate?: string } = {
                stage: newStage,
            };
            const today = new Date().toISOString().split('T')[0];
            if (newStage === JointStage.FITUP && !joint.fitupDate) dto.fitupDate = today;
            if (newStage === JointStage.WELDING && !joint.weldDate) dto.weldDate = today;
            if (newStage === JointStage.ERECTION && !joint.erectionDate) dto.erectionDate = today;

            await updateJointStage.mutateAsync({ drawingId, jointId: joint.id, dto });
            toast.success(`Stage updated to ${STAGE_LABEL[newStage]}`);
        } catch {
            toast.error('Failed to update stage');
        }
    };

    // Resolve material name from ID
    const getMaterialName = (materialId: string | null | undefined): string => {
        if (!materialId) return '-';
        const mat = (materials ?? []).find((m: Material) => m.id === materialId);
        if (!mat) return materialId.slice(0, 8) + '…';
        const dataKeys = Object.keys(mat.data);
        if (dataKeys.length > 0) {
            const firstVal = mat.data[dataKeys[0]];
            if (firstVal) return String(firstVal);
        }
        return materialId.slice(0, 8) + '…';
    };

    // Build a detailed tooltip for a material
    const getMaterialTooltip = (materialId: string | null | undefined): string | null => {
        if (!materialId) return null;
        const mat = (materials ?? []).find((m: Material) => m.id === materialId);
        if (!mat) return null;
        const lines: string[] = [];
        for (const [key, val] of Object.entries(mat.data)) {
            if (val !== undefined && val !== null && val !== '') {
                lines.push(`${key}: ${String(val)}`);
            }
        }
        if (mat.status) lines.push(`Status: ${mat.status}`);
        if (mat.quantityRequired) lines.push(`Qty Required: ${mat.quantityRequired}`);
        if (mat.quantityIssued) lines.push(`Qty Issued: ${mat.quantityIssued}`);
        if (mat.quantityUsed) lines.push(`Qty Used: ${mat.quantityUsed}`);
        if (mat.unit) lines.push(`Unit: ${mat.unit}`);
        if (mat.remarks) lines.push(`Remarks: ${mat.remarks}`);
        return lines.length > 0 ? lines.join('\n') : null;
    };

    const formatDate = (dateStr: string | null | undefined): string => {
        if (!dateStr) return '-';
        try {
            return format(new Date(dateStr), 'MMM d, yyyy');
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Link2 className="h-4 w-4" />
                    Joints ({joints?.length ?? 0})
                </div>
                <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
                    <Plus className="mr-1 h-3 w-3" />
                    Add Joint
                </Button>
            </div>

            {isLoading ? (
                <Skeleton className="h-24 w-full" />
            ) : (joints?.length ?? 0) > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-xs">Joint No.</TableHead>
                                <TableHead className="text-xs">Material 1</TableHead>
                                <TableHead className="text-xs">Material 2</TableHead>
                                <TableHead className="text-xs">Stage</TableHead>
                                <TableHead className="text-xs">Fitup</TableHead>
                                <TableHead className="text-xs">Weld</TableHead>
                                <TableHead className="text-xs">Erection</TableHead>
                                <TableHead className="text-xs">Remarks</TableHead>
                                <TableHead className="text-xs w-20">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {joints?.map((joint) => (
                                <TableRow key={joint.id}>
                                    <TableCell className="font-mono text-sm font-semibold">
                                        {joint.jointNumber}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {joint.materialOneId ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-help border-b border-dotted border-muted-foreground/40">
                                                        {getMaterialName(joint.materialOneId)}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-xs whitespace-pre-line text-xs">
                                                    {getMaterialTooltip(joint.materialOneId) ?? 'No details available'}
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : ('-')}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {joint.materialTwoId ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-help border-b border-dotted border-muted-foreground/40">
                                                        {getMaterialName(joint.materialTwoId)}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-xs whitespace-pre-line text-xs">
                                                    {getMaterialTooltip(joint.materialTwoId) ?? 'No details available'}
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : ('-')}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-auto p-0">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-shadow hover:shadow-md ${STAGE_CLASS[joint.stage] ?? 'stage-pending'}`}
                                                    >
                                                        {joint.stage === JointStage.COMPLETED && <Check className="h-3 w-3" />}
                                                        {STAGE_LABEL[joint.stage] ?? joint.stage}
                                                    </span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-40">
                                                {STAGE_ORDER.map((stage) => (
                                                    <DropdownMenuItem
                                                        key={stage}
                                                        onClick={() => handleStageChange(joint, stage)}
                                                        disabled={joint.stage === stage}
                                                        className="gap-2"
                                                    >
                                                        {joint.stage === stage && (
                                                            <span className="text-primary">●</span>
                                                        )}
                                                        {joint.stage !== stage && (
                                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                        )}
                                                        {STAGE_LABEL[stage]}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {formatDate(joint.fitupDate)}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {formatDate(joint.weldDate)}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {formatDate(joint.erectionDate)}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                                        {joint.remarks ?? '-'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => setEditingJoint(joint)}
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                onClick={() => setDeletingJoint(joint)}
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
                    No joints created yet
                </div>
            )}

            {/* Add Joint Dialog */}
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Joint</DialogTitle>
                        <DialogDescription>Create a new joint connection between materials</DialogDescription>
                    </DialogHeader>
                    <JointForm
                        materials={materials ?? []}
                        onSubmit={handleCreate}
                        isLoading={createJoint.isPending}
                        onCancel={() => setIsAdding(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Joint Dialog */}
            <Dialog open={!!editingJoint} onOpenChange={() => setEditingJoint(null)}>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Joint</DialogTitle>
                        <DialogDescription>Update joint details</DialogDescription>
                    </DialogHeader>
                    {editingJoint && (
                        <JointForm
                            joint={editingJoint}
                            materials={materials ?? []}
                            onSubmit={handleUpdate}
                            isLoading={updateJoint.isPending}
                            onCancel={() => setEditingJoint(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Joint Confirmation */}
            <AlertDialog open={!!deletingJoint} onOpenChange={() => setDeletingJoint(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Joint</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete joint &quot;{deletingJoint?.jointNumber}&quot;?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteJoint.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
