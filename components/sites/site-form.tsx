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
import { useProjects } from '@/hooks/use-projects';
import type { Site, CreateSiteDto } from '@/types';

const siteFormSchema = z.object({
    name: z.string().min(1, 'Site name is required').max(100),
    address: z.string().min(1, 'Address is required').max(200),
    projectId: z.string().uuid('Please select a project'),
});

type SiteFormValues = z.infer<typeof siteFormSchema>;

interface SiteFormProps {
    site?: Site;
    projectId?: string;
    onSubmit: (data: CreateSiteDto) => void;
    isLoading?: boolean;
    onCancel?: () => void;
}

export function SiteForm({ site, projectId, onSubmit, isLoading, onCancel }: SiteFormProps) {
    const { data: projects, isLoading: projectsLoading } = useProjects();

    const form = useForm<SiteFormValues>({
        resolver: zodResolver(siteFormSchema),
        defaultValues: {
            name: site?.name ?? '',
            address: site?.address ?? '',
            projectId: site?.projectId ?? projectId ?? '',
        },
    });

    const handleSubmit = (values: SiteFormValues) => {
        onSubmit(values);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Site Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter site name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                                <Input placeholder="456 Oak Ave, Springfield" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {!projectId && (
                    <FormField
                        control={form.control}
                        name="projectId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={projectsLoading}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a project" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {projects?.map((project) => (
                                            <SelectItem key={project.id} value={project.id}>
                                                {project.name} ({project.workOrderNumber})
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
                        {isLoading ? 'Saving...' : site ? 'Update Site' : 'Create Site'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
