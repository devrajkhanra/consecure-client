'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ProjectStatus } from '@/types';
import type { Project, CreateProjectDto } from '@/types';

const projectFormSchema = z.object({
    name: z.string().min(1, 'Project name is required').max(100),
    workOrderNumber: z.string().min(1, 'Work order number is required').max(50),
    location: z.string().min(1, 'Location is required').max(200),
    clientName: z.string().min(1, 'Client name is required').max(100),
    startDate: z.date({ message: 'Start date is required' }),
    endDate: z.date().optional().nullable(),
    status: z.nativeEnum(ProjectStatus).optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
    project?: Project;
    onSubmit: (data: CreateProjectDto) => void;
    isLoading?: boolean;
    onCancel?: () => void;
}

export function ProjectForm({ project, onSubmit, isLoading, onCancel }: ProjectFormProps) {
    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(projectFormSchema),
        defaultValues: {
            name: project?.name ?? '',
            workOrderNumber: project?.workOrderNumber ?? '',
            location: project?.location ?? '',
            clientName: project?.clientName ?? '',
            startDate: project?.startDate ? new Date(project.startDate) : undefined,
            endDate: project?.endDate ? new Date(project.endDate) : null,
            status: project?.status ?? ProjectStatus.BACKLOG,
        },
    });

    const handleSubmit = (values: ProjectFormValues) => {
        const dto: CreateProjectDto = {
            name: values.name,
            workOrderNumber: values.workOrderNumber,
            location: values.location,
            clientName: values.clientName,
            startDate: values.startDate.toISOString().split('T')[0],
            endDate: values.endDate ? values.endDate.toISOString().split('T')[0] : undefined,
            status: values.status,
        };
        onSubmit(dto);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter project name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="workOrderNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Work Order Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="WO-12345" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="clientName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Client Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter client name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                    <Input placeholder="123 Main St, City" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Start Date</FormLabel>
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
                                                {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>End Date (Optional)</FormLabel>
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
                                                {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value ?? undefined}
                                            onSelect={field.onChange}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value={ProjectStatus.BACKLOG}>Backlog</SelectItem>
                                        <SelectItem value={ProjectStatus.IN_PROGRESS}>In Progress</SelectItem>
                                        <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
                                        <SelectItem value={ProjectStatus.ON_HOLD}>On Hold</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-3">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
