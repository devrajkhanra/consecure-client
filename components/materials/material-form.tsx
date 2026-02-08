'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import type { MaterialColumn, Material, CreateMaterialDto } from '@/types';
import { ColumnType } from '@/types';

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

    const form = useForm({
        defaultValues,
    });

    const handleSubmit = (values: Record<string, unknown>) => {
        // Process values based on column types
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
        onSubmit({ data: processedData });
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
