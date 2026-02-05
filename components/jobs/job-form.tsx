'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useSites } from '@/hooks/use-sites';
import type { Job, CreateJobDto } from '@/types';

const jobFormSchema = z.object({
    name: z.string().min(1, 'Job name is required').max(100),
    description: z.string().max(500).optional(),
    siteId: z.string().uuid('Please select a site'),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

interface JobFormProps {
    job?: Job;
    siteId?: string;
    onSubmit: (data: CreateJobDto) => void;
    isLoading?: boolean;
    onCancel?: () => void;
}

export function JobForm({ job, siteId, onSubmit, isLoading, onCancel }: JobFormProps) {
    const { data: sites, isLoading: sitesLoading } = useSites();

    const form = useForm<JobFormValues>({
        resolver: zodResolver(jobFormSchema),
        defaultValues: {
            name: job?.name ?? '',
            description: job?.description ?? '',
            siteId: job?.siteId ?? siteId ?? '',
        },
    });

    const handleSubmit = (values: JobFormValues) => {
        const dto: CreateJobDto = {
            name: values.name,
            siteId: values.siteId,
            description: values.description || undefined,
        };
        onSubmit(dto);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Job Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter job name" {...field} />
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
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Enter job description"
                                    className="resize-none"
                                    rows={3}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {!siteId && (
                    <FormField
                        control={form.control}
                        name="siteId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Site</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={sitesLoading}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a site" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {sites?.map((site) => (
                                            <SelectItem key={site.id} value={site.id}>
                                                {site.name} - {site.address}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <div className="flex justify-end gap-3">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : job ? 'Update Job' : 'Create Job'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
