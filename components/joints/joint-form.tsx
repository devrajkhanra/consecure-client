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
import type { Joint, CreateJointDto, Material } from '@/types';

interface JointFormProps {
    joint?: Joint;
    materials: Material[];
    onSubmit: (data: CreateJointDto) => void;
    isLoading?: boolean;
    onCancel?: () => void;
}

export function JointForm({ joint, materials, onSubmit, isLoading, onCancel }: JointFormProps) {
    const form = useForm({
        defaultValues: {
            jointNumber: joint?.jointNumber ?? '',
            materialOneId: joint?.materialOneId ?? '',
            materialTwoId: joint?.materialTwoId ?? '',
            remarks: joint?.remarks ?? '',
        },
    });

    const handleSubmit = form.handleSubmit((values) => {
        const dto: CreateJointDto = {
            jointNumber: values.jointNumber,
        };
        if (values.materialOneId) dto.materialOneId = values.materialOneId;
        if (values.materialTwoId) dto.materialTwoId = values.materialTwoId;
        if (values.remarks) dto.remarks = values.remarks;
        onSubmit(dto);
    });

    // Helper to get a material display name from its dynamic data
    const getMaterialLabel = (material: Material): string => {
        const dataKeys = Object.keys(material.data);
        if (dataKeys.length > 0) {
            const firstVal = material.data[dataKeys[0]];
            if (firstVal) return String(firstVal);
        }
        return `Material ${material.id.slice(0, 8)}`;
    };

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormField
                    control={form.control}
                    name="jointNumber"
                    rules={{ required: 'Joint number is required' }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Joint Number</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. F01, M05" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="materialOneId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Material 1</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select material (optional)" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {materials.map((m) => (
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

                <FormField
                    control={form.control}
                    name="materialTwoId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Material 2</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select material (optional)" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {materials.map((m) => (
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
                        {isLoading ? 'Saving...' : joint ? 'Update Joint' : 'Add Joint'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
