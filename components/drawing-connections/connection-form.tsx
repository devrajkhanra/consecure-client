'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { ConnectionType, MaterialStatus, JointStage } from '@/types';
import type { DrawingConnection, CreateDrawingConnectionDto, Drawing, Material, Spool, Joint, DrawingColumn } from '@/types';

// Helper to get formatted drawing label
function getDrawingLabel(drawing: Drawing, columns: DrawingColumn[]): string {
    const sortedCols = [...columns].sort((a, b) => a.order - b.order);
    if (sortedCols.length > 0) {
        return String(drawing.data[sortedCols[0]?.name] ?? `Drawing ${drawing.id.slice(0, 8)}`);
    }
    return `Drawing ${drawing.id.slice(0, 8)}`;
}

// Helper to get formatted material label
function getMaterialLabel(material: Material): string {
    const keys = Object.keys(material.data);
    if (keys.length > 0 && material.data[keys[0]]) {
        return String(material.data[keys[0]]);
    }
    return `Material ${material.id.slice(0, 8)}`;
}

interface ConnectionFormProps {
    connection?: DrawingConnection;
    drawings: Drawing[];
    drawingColumns: DrawingColumn[];
    materials: Material[];
    spools: Spool[];
    joints: Joint[];
    onSubmit: (data: CreateDrawingConnectionDto) => void;
    isLoading?: boolean;
    onCancel?: () => void;
}

export function ConnectionForm({
    connection,
    drawings,
    drawingColumns,
    materials,
    spools,
    joints,
    onSubmit,
    isLoading,
    onCancel,
}: ConnectionFormProps) {
    const form = useForm({
        defaultValues: {
            drawingOneId: connection?.drawingOneId ?? '',
            drawingTwoId: connection?.drawingTwoId ?? '',
            connectionType: connection?.connectionType ?? ConnectionType.MATERIAL,
            materialId: connection?.materialId ?? '',
            spoolId: connection?.spoolId ?? '',
            jointId: connection?.jointId ?? '',
            description: connection?.description ?? '',
            remarks: connection?.remarks ?? '',
        },
    });

    const currentType = form.watch('connectionType');

    const availableMaterials = materials.filter(m => 
        m.status === MaterialStatus.ISSUED || 
        m.status === MaterialStatus.USED || 
        m.id === connection?.materialId
    );

    const availableSpools = spools.filter(s => {
        if (s.id === connection?.spoolId) return true;
        if (!s.status) return true;
        const lower = s.status.toLowerCase();
        return lower.includes('issued') || lower.includes('used');
    });

    const availableJoints = joints.filter(j => 
        j.stage === JointStage.WELDING || 
        j.stage === JointStage.ERECTION || 
        j.stage === JointStage.COMPLETED || 
        j.id === connection?.jointId
    );

    const handleSubmit = form.handleSubmit((values) => {
        const dto: CreateDrawingConnectionDto = {
            drawingOneId: values.drawingOneId,
            drawingTwoId: values.drawingTwoId,
            connectionType: values.connectionType,
        };

        if (values.connectionType === ConnectionType.MATERIAL && values.materialId) {
            dto.materialId = values.materialId;
        } else if (values.connectionType === ConnectionType.SPOOL && values.spoolId) {
            dto.spoolId = values.spoolId;
        } else if (values.connectionType === ConnectionType.JOINT && values.jointId) {
            dto.jointId = values.jointId;
        }

        if (values.description) dto.description = values.description;
        if (values.remarks) dto.remarks = values.remarks;

        onSubmit(dto);
    });

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="drawingOneId"
                        rules={{ required: 'Source drawing is required' }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Source Drawing (Drawing 1)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select drawing..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {drawings.map((d) => (
                                            <SelectItem key={d.id} value={d.id}>
                                                {getDrawingLabel(d, drawingColumns)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="drawingTwoId"
                        rules={{ required: 'Target drawing is required' }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Target Drawing (Drawing 2)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select drawing..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {drawings.map((d) => (
                                            <SelectItem key={d.id} value={d.id}>
                                                {getDrawingLabel(d, drawingColumns)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="connectionType"
                    rules={{ required: 'Connection type is required' }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Connection Entity Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={ConnectionType.MATERIAL}>Material</SelectItem>
                                    <SelectItem value={ConnectionType.SPOOL}>Spool</SelectItem>
                                    <SelectItem value={ConnectionType.JOINT}>Joint</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {currentType === ConnectionType.MATERIAL && (
                    <FormField
                        control={form.control}
                        name="materialId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Specific Material (Optional)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select linked material..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none" className="italic text-muted-foreground">None / Unknown</SelectItem>
                                        {availableMaterials.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {getMaterialLabel(m)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {currentType === ConnectionType.SPOOL && (
                    <FormField
                        control={form.control}
                        name="spoolId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Specific Spool (Optional)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select linked spool..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none" className="italic text-muted-foreground">None / Unknown</SelectItem>
                                        {availableSpools.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.spoolNumber}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {currentType === ConnectionType.JOINT && (
                    <FormField
                        control={form.control}
                        name="jointId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Specific Joint (Optional)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select linked joint..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none" className="italic text-muted-foreground">None / Unknown</SelectItem>
                                        {availableJoints.map((j) => (
                                            <SelectItem key={j.id} value={j.id}>
                                                {j.jointNumber}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Tie-in point A to B (optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Remarks</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Additional notes (optional)"
                                    className="resize-none"
                                    rows={2}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-2">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : connection ? 'Update Connection' : 'Add Connection'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
