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
import type { MaterialTransaction, CreateMaterialTransactionDto } from '@/types';
import { MaterialTransactionType } from '@/types';

const TRANSACTION_TYPES: { value: MaterialTransactionType; label: string }[] = [
    { value: MaterialTransactionType.ISSUED, label: 'Issued' },
    { value: MaterialTransactionType.USED, label: 'Used' },
    { value: MaterialTransactionType.RETURNED, label: 'Returned' },
];

interface TransactionFormProps {
    transaction?: MaterialTransaction;
    onSubmit: (data: CreateMaterialTransactionDto) => void;
    isLoading?: boolean;
    onCancel?: () => void;
}

export function TransactionForm({ transaction, onSubmit, isLoading, onCancel }: TransactionFormProps) {
    const form = useForm({
        defaultValues: {
            transactionType: transaction?.transactionType ?? MaterialTransactionType.ISSUED,
            quantity: transaction?.quantity?.toString() ?? '',
            documentNumber: transaction?.documentNumber ?? '',
            transactionDate: transaction?.transactionDate
                ? new Date(transaction.transactionDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
            remarks: transaction?.remarks ?? '',
        },
    });

    const handleSubmit = (values: Record<string, unknown>) => {
        onSubmit({
            transactionType: values.transactionType as MaterialTransactionType,
            quantity: Number(values.quantity),
            documentNumber: values.documentNumber as string,
            transactionDate: values.transactionDate as string,
            remarks: (values.remarks as string) || undefined,
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        control={form.control}
                        name="transactionType"
                        rules={{ required: 'Type is required' }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type <span className="text-destructive">*</span></FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {TRANSACTION_TYPES.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>
                                                {t.label}
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
                        name="quantity"
                        rules={{
                            required: 'Quantity is required',
                            validate: (v) => Number(v) > 0 || 'Must be greater than 0',
                        }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quantity <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="any"
                                        placeholder="0"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.value)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        control={form.control}
                        name="documentNumber"
                        rules={{ required: 'Document number is required' }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Document No. <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="INV-2026-001" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="transactionDate"
                        rules={{ required: 'Date is required' }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Remarks</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Optional notes..." rows={2} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-3 pt-2">
                    {onCancel && (
                        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" size="sm" disabled={isLoading}>
                        {isLoading ? 'Saving...' : transaction ? 'Update' : 'Add Transaction'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
