'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Separator } from '@/components/ui/separator';
import type { MaterialColumn, Material, CreateMaterialDto } from '@/types';
import { ColumnType, MaterialStatus } from '@/types';

const STATUS_OPTIONS: { value: MaterialStatus; label: string }[] = [
    { value: MaterialStatus.REQUIRED, label: 'Required' },
    { value: MaterialStatus.PENDING, label: 'Pending' },
    { value: MaterialStatus.ISSUED, label: 'Issued' },
    { value: MaterialStatus.USED, label: 'Used' },
    { value: MaterialStatus.RETURNED, label: 'Returned' },
    { value: MaterialStatus.REJECTED, label: 'Rejected' },
];

interface MaterialFormProps {
    columns: MaterialColumn[];
    material?: Material;
    onSubmit: (data: CreateMaterialDto) => void;
    isLoading?: boolean;
    onCancel?: () => void;
}

export function MaterialForm({ columns, material, onSubmit, isLoading, onCancel }: MaterialFormProps) {
    const defaultValues: Record<string, unknown> = {};
    columns.forEach((col) => {
        const existingValue = material?.data?.[col.name];
        switch (col.type) {
            case ColumnType.BOOLEAN:
                defaultValues[col.name] = existingValue ?? false;
                break;
            case ColumnType.NUMBER:
                defaultValues[col.name] = existingValue ?? '';
                break;
            default:
                defaultValues[col.name] = existingValue ?? '';
        }
    });

    // Built-in fields
    defaultValues['_status'] = material?.status ?? MaterialStatus.REQUIRED;
    defaultValues['_quantityRequired'] = material?.quantityRequired ?? '';
    defaultValues['_quantityIssued'] = material?.quantityIssued ?? '';
    defaultValues['_quantityUsed'] = material?.quantityUsed ?? '';
    defaultValues['_unit'] = material?.unit ?? '';
    defaultValues['_remarks'] = material?.remarks ?? '';

    const form = useForm({
        defaultValues,
    });

    const handleSubmit = (values: Record<string, unknown>) => {
        // Process dynamic column data
        const processedData: Record<string, unknown> = {};
        columns.forEach((col) => {
            const value = values[col.name];
            switch (col.type) {
                case ColumnType.NUMBER:
                    processedData[col.name] = value !== '' ? Number(value) : null;
                    break;
                case ColumnType.BOOLEAN:
                    processedData[col.name] = Boolean(value);
                    break;
                default:
                    processedData[col.name] = value;
            }
        });

        const dto: CreateMaterialDto = {
            data: processedData,
            status: values['_status'] as MaterialStatus,
            quantityRequired: values['_quantityRequired'] !== '' ? Number(values['_quantityRequired']) : undefined,
            quantityIssued: values['_quantityIssued'] !== '' ? Number(values['_quantityIssued']) : undefined,
            quantityUsed: values['_quantityUsed'] !== '' ? Number(values['_quantityUsed']) : undefined,
            unit: (values['_unit'] as string) || undefined,
            remarks: (values['_remarks'] as string) || undefined,
        };

        onSubmit(dto);
    };

    if (columns.length === 0) {
        return (
            <div className="text-sm text-muted-foreground py-4">
                No columns defined. Add material columns first.
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* Dynamic columns */}
                {columns.map((col) => (
                    <FormField
                        key={col.id}
                        control={form.control}
                        name={col.name}
                        rules={{ required: col.required ? `${col.name} is required` : false }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {col.name}
                                    {col.required && <span className="text-destructive ml-1">*</span>}
                                </FormLabel>
                                <FormControl>
                                    {col.type === ColumnType.BOOLEAN ? (
                                        <div className="flex items-center">
                                            <Switch
                                                checked={Boolean(field.value)}
                                                onCheckedChange={field.onChange}
                                            />
                                        </div>
                                    ) : col.type === ColumnType.NUMBER ? (
                                        <Input
                                            type="number"
                                            step="any"
                                            {...field}
                                            value={field.value as string}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                    ) : col.type === ColumnType.DATE ? (
                                        <Input
                                            type="date"
                                            {...field}
                                            value={field.value as string}
                                        />
                                    ) : (
                                        <Input
                                            {...field}
                                            value={field.value as string}
                                        />
                                    )}
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ))}

                <Separator />

                {/* Built-in fields */}
                <div className="space-y-4">
                    <p className="text-sm font-medium text-muted-foreground">Tracking Details</p>

                    {/* Status */}
                    <FormField
                        control={form.control}
                        name="_status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Quantities */}
                    <div className="grid grid-cols-3 gap-3">
                        <FormField
                            control={form.control}
                            name="_quantityRequired"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Qty Required</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="any"
                                            placeholder="0"
                                            {...field}
                                            value={field.value as string}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="_quantityIssued"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Qty Issued</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="any"
                                            placeholder="0"
                                            {...field}
                                            value={field.value as string}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="_quantityUsed"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Qty Used</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="any"
                                            placeholder="0"
                                            {...field}
                                            value={field.value as string}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Unit */}
                    <FormField
                        control={form.control}
                        name="_unit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Unit</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="e.g. meters, kg, pieces"
                                        {...field}
                                        value={field.value as string}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Remarks */}
                    <FormField
                        control={form.control}
                        name="_remarks"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Remarks</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Additional notes..."
                                        rows={2}
                                        {...field}
                                        value={field.value as string}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : material ? 'Update' : 'Add Material'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
