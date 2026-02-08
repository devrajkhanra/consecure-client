'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ColumnType } from '@/types';
import type { MaterialColumn, CreateMaterialColumnDto } from '@/types';

const columnFormSchema = z.object({
    name: z.string().min(1, 'Column name is required').max(50),
    type: z.nativeEnum(ColumnType),
    required: z.boolean(),
    order: z.number().int().min(0),
});

type ColumnFormValues = z.infer<typeof columnFormSchema>;

interface MaterialColumnFormProps {
    column?: MaterialColumn;
    nextOrder?: number;
    onSubmit: (data: CreateMaterialColumnDto) => void;
    isLoading?: boolean;
    onCancel?: () => void;
}

export function MaterialColumnForm({ column, nextOrder = 0, onSubmit, isLoading, onCancel }: MaterialColumnFormProps) {
    const form = useForm<ColumnFormValues>({
        resolver: zodResolver(columnFormSchema),
        defaultValues: {
            name: column?.name ?? '',
            type: column?.type ?? ColumnType.TEXT,
            required: column?.required ?? false,
            order: column?.order ?? nextOrder,
        },
    });

    const handleSubmit = (values: ColumnFormValues) => {
        onSubmit(values);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Column Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Material Name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Column Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={ColumnType.TEXT}>Text</SelectItem>
                                    <SelectItem value={ColumnType.NUMBER}>Number</SelectItem>
                                    <SelectItem value={ColumnType.DATE}>Date</SelectItem>
                                    <SelectItem value={ColumnType.BOOLEAN}>Boolean</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Display Order</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min={0}
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="required"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <FormLabel>Required Field</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                    Users must fill this field when adding materials
                                </p>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-3">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : column ? 'Update Column' : 'Create Column'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
