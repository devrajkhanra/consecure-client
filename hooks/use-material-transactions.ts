import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { MaterialTransaction, CreateMaterialTransactionDto, UpdateMaterialTransactionDto } from '@/types';

const QUERY_KEY = 'material-transactions';
const MATERIALS_KEY = 'materials';

// Fetch all transactions for a material
export function useMaterialTransactions(materialId: string | undefined) {
    return useQuery({
        queryKey: [QUERY_KEY, materialId],
        queryFn: async (): Promise<MaterialTransaction[]> => {
            const { data } = await api.get<MaterialTransaction[]>(`/materials/${materialId}/transactions`);
            return data;
        },
        enabled: !!materialId,
    });
}

// Create transaction mutation
export function useCreateMaterialTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            materialId,
            dto,
        }: {
            materialId: string;
            dto: CreateMaterialTransactionDto;
        }): Promise<MaterialTransaction> => {
            const { data } = await api.post<MaterialTransaction>(`/materials/${materialId}/transactions`, dto);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.materialId] });
            // Also invalidate parent material since quantities/status auto-sync
            queryClient.invalidateQueries({ queryKey: [MATERIALS_KEY] });
        },
    });
}

// Update transaction mutation
export function useUpdateMaterialTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            materialId,
            transactionId,
            dto,
        }: {
            materialId: string;
            transactionId: string;
            dto: UpdateMaterialTransactionDto;
        }): Promise<MaterialTransaction> => {
            const { data } = await api.patch<MaterialTransaction>(
                `/materials/${materialId}/transactions/${transactionId}`,
                dto
            );
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.materialId] });
            queryClient.invalidateQueries({ queryKey: [MATERIALS_KEY] });
        },
    });
}

// Delete transaction mutation
export function useDeleteMaterialTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            materialId,
            transactionId,
        }: {
            materialId: string;
            transactionId: string;
        }): Promise<void> => {
            await api.delete(`/materials/${materialId}/transactions/${transactionId}`);
        },
        onSuccess: (_, { materialId }) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY, materialId] });
            queryClient.invalidateQueries({ queryKey: [MATERIALS_KEY] });
        },
    });
}
