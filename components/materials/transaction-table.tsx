'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionForm } from '@/components/materials/transaction-form';
import {
    useMaterialTransactions,
    useCreateMaterialTransaction,
    useUpdateMaterialTransaction,
    useDeleteMaterialTransaction,
} from '@/hooks/use-material-transactions';
import type { MaterialTransaction, CreateMaterialTransactionDto } from '@/types';
import { MaterialTransactionType } from '@/types';

const TYPE_VARIANT: Record<MaterialTransactionType, 'default' | 'secondary' | 'outline'> = {
    [MaterialTransactionType.ISSUED]: 'default',
    [MaterialTransactionType.USED]: 'secondary',
    [MaterialTransactionType.RETURNED]: 'outline',
};

const TYPE_LABEL: Record<MaterialTransactionType, string> = {
    [MaterialTransactionType.ISSUED]: 'Issued',
    [MaterialTransactionType.USED]: 'Used',
    [MaterialTransactionType.RETURNED]: 'Returned',
};

interface TransactionTableProps {
    materialId: string;
}

export function TransactionTable({ materialId }: TransactionTableProps) {
    const { data: transactions, isLoading } = useMaterialTransactions(materialId);
    const createTransaction = useCreateMaterialTransaction();
    const updateTransaction = useUpdateMaterialTransaction();
    const deleteTransaction = useDeleteMaterialTransaction();

    const [isAdding, setIsAdding] = useState(false);
    const [editingTxn, setEditingTxn] = useState<MaterialTransaction | null>(null);
    const [deletingTxn, setDeletingTxn] = useState<MaterialTransaction | null>(null);

    const handleCreate = async (data: CreateMaterialTransactionDto) => {
        try {
            await createTransaction.mutateAsync({ materialId, dto: data });
            toast.success('Transaction added');
            setIsAdding(false);
        } catch {
            toast.error('Failed to add transaction');
        }
    };

    const handleUpdate = async (data: CreateMaterialTransactionDto) => {
        if (!editingTxn) return;
        try {
            await updateTransaction.mutateAsync({
                materialId,
                transactionId: editingTxn.id,
                dto: data,
            });
            toast.success('Transaction updated');
            setEditingTxn(null);
        } catch {
            toast.error('Failed to update transaction');
        }
    };

    const handleDelete = async () => {
        if (!deletingTxn) return;
        try {
            await deleteTransaction.mutateAsync({
                materialId,
                transactionId: deletingTxn.id,
            });
            toast.success('Transaction deleted');
            setDeletingTxn(null);
        } catch {
            toast.error('Failed to delete transaction');
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <ArrowRightLeft className="h-3 w-3" />
                    Transactions ({transactions?.length ?? 0})
                </div>
                <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => setIsAdding(true)}>
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                </Button>
            </div>

            {isLoading ? (
                <Skeleton className="h-16 w-full" />
            ) : (transactions?.length ?? 0) > 0 ? (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-xs">Type</TableHead>
                                <TableHead className="text-xs">Doc No.</TableHead>
                                <TableHead className="text-xs">Date</TableHead>
                                <TableHead className="text-xs text-right">Qty</TableHead>
                                <TableHead className="text-xs">Remarks</TableHead>
                                <TableHead className="text-xs w-16">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions?.map((txn) => (
                                <TableRow key={txn.id}>
                                    <TableCell>
                                        <Badge variant={TYPE_VARIANT[txn.transactionType] ?? 'outline'} className="text-xs">
                                            {TYPE_LABEL[txn.transactionType] ?? txn.transactionType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs font-mono">
                                        {txn.documentNumber}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {(() => {
                                            try {
                                                return format(new Date(txn.transactionDate), 'MMM d, yyyy');
                                            } catch {
                                                return txn.transactionDate;
                                            }
                                        })()}
                                    </TableCell>
                                    <TableCell className="text-xs text-right font-mono">
                                        {Number(txn.quantity).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                                        {txn.remarks ?? '-'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-0.5">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => setEditingTxn(txn)}
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-destructive hover:text-destructive"
                                                onClick={() => setDeletingTxn(txn)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="text-center py-3 text-xs text-muted-foreground border rounded-md">
                    No transactions recorded
                </div>
            )}

            {/* Add Transaction Dialog */}
            <Dialog open={isAdding} onOpenChange={setIsAdding}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Transaction</DialogTitle>
                        <DialogDescription>Record a material issuance, usage, or return</DialogDescription>
                    </DialogHeader>
                    <TransactionForm
                        onSubmit={handleCreate}
                        isLoading={createTransaction.isPending}
                        onCancel={() => setIsAdding(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Transaction Dialog */}
            <Dialog open={!!editingTxn} onOpenChange={() => setEditingTxn(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Transaction</DialogTitle>
                        <DialogDescription>Update transaction details</DialogDescription>
                    </DialogHeader>
                    {editingTxn && (
                        <TransactionForm
                            transaction={editingTxn}
                            onSubmit={handleUpdate}
                            isLoading={updateTransaction.isPending}
                            onCancel={() => setEditingTxn(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Transaction Confirmation */}
            <AlertDialog open={!!deletingTxn} onOpenChange={() => setDeletingTxn(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure? This will recalculate the material quantities.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteTransaction.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
