'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import type { Spool, CreateSpoolDto } from '@/types';

interface SpoolFormProps {
    spool?: Spool;
    onSubmit: (data: CreateSpoolDto) => void;
    isLoading?: boolean;
    onCancel?: () => void;
}

export function SpoolForm({ spool, onSubmit, isLoading, onCancel }: SpoolFormProps) {
    const form = useForm({
        defaultValues: {
            spoolNumber: spool?.spoolNumber ?? '',
            status: spool?.status ?? '',
            description: spool?.description ?? '',
            remarks: spool?.remarks ?? '',
        },
    });

    const handleSubmit = form.handleSubmit((values) => {
        const dto: CreateSpoolDto = {
            spoolNumber: values.spoolNumber,
        };
        if (values.status) dto.status = values.status;
        if (values.description) dto.description = values.description;
        if (values.remarks) dto.remarks = values.remarks;
        onSubmit(dto);
    });

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormField
                    control={form.control}
                    name="spoolNumber"
                    rules={{ required: 'Spool number is required' }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Spool Number</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. SP-01, SPL-05" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Prefab, Installed (optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Main Header Assembly (optional)" {...field} />
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
                        {isLoading ? 'Saving...' : spool ? 'Update Spool' : 'Add Spool'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
