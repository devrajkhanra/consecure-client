'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ColumnType, type DrawingColumn, type Drawing, type CreateDrawingDto } from '@/types';

interface DrawingFormProps {
    columns: DrawingColumn[];
    drawing?: Drawing;
    onSubmit: (data: CreateDrawingDto) => void;
    isLoading?: boolean;
    onCancel?: () => void;
}

export function DrawingForm({ columns, drawing, onSubmit, isLoading, onCancel }: DrawingFormProps) {
    // Dynamically build the schema based on columns
    const schemaShape: Record<string, z.ZodTypeAny> = {};
    const sortedColumns = columns.slice().sort((a, b) => a.order - b.order);

    sortedColumns.forEach((column) => {
        let fieldSchema: z.ZodTypeAny;

        switch (column.type) {
            case ColumnType.NUMBER:
                fieldSchema = z.coerce.number();
                break;
            case ColumnType.DATE:
                fieldSchema = z.date();
                break;
            case ColumnType.BOOLEAN:
                fieldSchema = z.boolean();
                break;
            case ColumnType.TEXT:
            default:
                fieldSchema = z.string();
                break;
        }

        if (!column.required) {
            fieldSchema = fieldSchema.optional().nullable();
        } else if (column.type === ColumnType.TEXT) {
            fieldSchema = z.string().min(1, `${column.name} is required`);
        }

        schemaShape[column.name] = fieldSchema;
    });

    const formSchema = z.object(schemaShape);
    type FormValues = z.infer<typeof formSchema>;

    // Build default values
    const defaultValues: Record<string, unknown> = {};
    sortedColumns.forEach((column) => {
        const existingValue = drawing?.data?.[column.name];
        switch (column.type) {
            case ColumnType.BOOLEAN:
                defaultValues[column.name] = existingValue ?? false;
                break;
            case ColumnType.DATE:
                defaultValues[column.name] = existingValue ? new Date(existingValue as string) : undefined;
                break;
            case ColumnType.NUMBER:
                defaultValues[column.name] = existingValue ?? '';
                break;
            default:
                defaultValues[column.name] = existingValue ?? '';
        }
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    const handleSubmit = (values: FormValues) => {
        // Convert dates to ISO strings
        const data: Record<string, unknown> = {};
        sortedColumns.forEach((column) => {
            const value = values[column.name];
            if (column.type === ColumnType.DATE && value instanceof Date) {
                data[column.name] = value.toISOString().split('T')[0];
            } else if (value !== undefined && value !== null && value !== '') {
                data[column.name] = value;
            }
        });
        onSubmit({ data });
    };

    if (sortedColumns.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-8">
                No columns defined. Add columns first to create drawings.
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {sortedColumns.map((column) => (
                    <FormField
                        key={column.id}
                        control={form.control}
                        name={column.name}
                        render={({ field }) => {
                            switch (column.type) {
                                case ColumnType.BOOLEAN:
                                    return (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value as boolean}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>
                                                    {column.name}
                                                    {column.required && <span className="text-destructive ml-1">*</span>}
                                                </FormLabel>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    );

                                case ColumnType.DATE:
                                    return (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>
                                                {column.name}
                                                {column.required && <span className="text-destructive ml-1">*</span>}
                                            </FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                'w-full pl-3 text-left font-normal',
                                                                !field.value && 'text-muted-foreground'
                                                            )}
                                                        >
                                                            {field.value instanceof Date
                                                                ? format(field.value, 'PPP')
                                                                : 'Pick a date'}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value as Date | undefined}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    );

                                case ColumnType.NUMBER:
                                    return (
                                        <FormItem>
                                            <FormLabel>
                                                {column.name}
                                                {column.required && <span className="text-destructive ml-1">*</span>}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder={`Enter ${column.name.toLowerCase()}`}
                                                    {...field}
                                                    value={field.value as string | number}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    );

                                case ColumnType.TEXT:
                                default:
                                    return (
                                        <FormItem>
                                            <FormLabel>
                                                {column.name}
                                                {column.required && <span className="text-destructive ml-1">*</span>}
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={`Enter ${column.name.toLowerCase()}`}
                                                    {...field}
                                                    value={field.value as string}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    );
                            }
                        }}
                    />
                ))}

                <div className="flex justify-end gap-3 pt-4">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : drawing ? 'Update Drawing' : 'Create Drawing'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
