'use client';

import { useState, Fragment } from 'react';
import {
    Package,
    ChevronDown,
    ChevronRight,
    SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionTable } from '@/components/materials/transaction-table';
import { useJobMaterials } from '@/hooks/use-materials';
import { useDrawings } from '@/hooks/use-drawings';
import { useDrawingColumns } from '@/hooks/use-drawing-columns';
import { useMaterialColumns } from '@/hooks/use-material-columns';
import { ColumnType, MaterialStatus } from '@/types';
import type { Drawing } from '@/types';

const STATUS_VARIANT: Record<MaterialStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    [MaterialStatus.REQUIRED]: 'outline',
    [MaterialStatus.PENDING]: 'secondary',
    [MaterialStatus.ISSUED]: 'default',
    [MaterialStatus.USED]: 'default',
    [MaterialStatus.RETURNED]: 'secondary',
    [MaterialStatus.REJECTED]: 'destructive',
};

const STATUS_LABEL: Record<MaterialStatus, string> = {
    [MaterialStatus.REQUIRED]: 'Required',
    [MaterialStatus.PENDING]: 'Pending',
    [MaterialStatus.ISSUED]: 'Issued',
    [MaterialStatus.USED]: 'Used',
    [MaterialStatus.RETURNED]: 'Returned',
    [MaterialStatus.REJECTED]: 'Rejected',
};

interface JobMaterialsTableProps {
    jobId: string;
}

export function JobMaterialsTable({ jobId }: JobMaterialsTableProps) {
    const { data: materials, isLoading: materialsLoading } = useJobMaterials(jobId);
    const { data: allDrawings } = useDrawings(jobId);
    const { data: drawingColumns } = useDrawingColumns(jobId);
    const { data: materialColumns } = useMaterialColumns(jobId);

    // Build a lookup map: drawingId -> Drawing
    const drawingsMap = new Map<string, Drawing>();
    if (allDrawings) {
        for (const d of allDrawings) {
            drawingsMap.set(d.id, d);
        }
    }

    const [visibleDrawingCols, setVisibleDrawingCols] = useState<Set<string>>(new Set());
    const [expandedMaterialId, setExpandedMaterialId] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const pageSize = 25;

    const sortedDrawingCols = (drawingColumns ?? []).slice().sort((a, b) => a.order - b.order);
    const sortedMaterialCols = (materialColumns ?? []).slice().sort((a, b) => a.order - b.order);
    const activeDrawingCols = sortedDrawingCols.filter((col) => visibleDrawingCols.has(col.id));

    const paginatedMaterials = (materials ?? []).slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil((materials?.length ?? 0) / pageSize);

    const toggleDrawingCol = (colId: string) => {
        setVisibleDrawingCols((prev) => {
            const next = new Set(prev);
            if (next.has(colId)) {
                next.delete(colId);
            } else {
                next.add(colId);
            }
            return next;
        });
    };

    const toggleExpand = (materialId: string) => {
        setExpandedMaterialId(expandedMaterialId === materialId ? null : materialId);
    };

    const formatCellValue = (value: unknown, type: ColumnType): string => {
        if (value === undefined || value === null) return '-';
        switch (type) {
            case ColumnType.BOOLEAN:
                return value === true ? '✓' : '✗';
            case ColumnType.DATE:
                return value ? new Date(value as string).toLocaleDateString() : '-';
            default:
                return String(value);
        }
    };

    const formatQty = (value: number | undefined | null): string => {
        if (value === undefined || value === null) return '-';
        return Number(value).toLocaleString();
    };

    // Total columns for colSpan in expanded row
    const totalColSpan = activeDrawingCols.length + sortedMaterialCols.length + 7; // expand + status + req + issued + used + unit + remarks

    if (materialsLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span className="font-medium">{materials?.length ?? 0} materials across all drawings</span>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <SlidersHorizontal className="mr-2 h-4 w-4" />
                            Drawing Columns ({visibleDrawingCols.size})
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Show Drawing Columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {sortedDrawingCols.map((col) => (
                            <DropdownMenuCheckboxItem
                                key={col.id}
                                checked={visibleDrawingCols.has(col.id)}
                                onCheckedChange={() => toggleDrawingCol(col.id)}
                            >
                                {col.name}
                            </DropdownMenuCheckboxItem>
                        ))}
                        {sortedDrawingCols.length === 0 && (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">No drawing columns configured</div>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Table */}
            {(materials?.length ?? 0) > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30px]"></TableHead>
                                {/* Drawing columns */}
                                {activeDrawingCols.map((col) => (
                                    <TableHead key={`dc-${col.id}`} className="text-xs bg-muted/30">
                                        <span className="text-primary/70">⊞</span> {col.name}
                                    </TableHead>
                                ))}
                                {/* Material columns */}
                                {sortedMaterialCols.map((col) => (
                                    <TableHead key={`mc-${col.id}`} className="text-xs">
                                        {col.name}
                                    </TableHead>
                                ))}
                                <TableHead className="text-xs">Status</TableHead>
                                <TableHead className="text-xs text-right">Req</TableHead>
                                <TableHead className="text-xs text-right">Issued</TableHead>
                                <TableHead className="text-xs text-right">Used</TableHead>
                                <TableHead className="text-xs">Unit</TableHead>
                                <TableHead className="text-xs">Remarks</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedMaterials.map((material) => (
                                <Fragment key={material.id}>
                                    <TableRow className={expandedMaterialId === material.id ? 'bg-muted/50' : ''}>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0"
                                                onClick={() => toggleExpand(material.id)}
                                            >
                                                {expandedMaterialId === material.id ? (
                                                    <ChevronDown className="h-3 w-3" />
                                                ) : (
                                                    <ChevronRight className="h-3 w-3" />
                                                )}
                                            </Button>
                                        </TableCell>
                                        {/* Drawing column values from the parent drawing */}
                                        {activeDrawingCols.map((col) => {
                                            const parentDrawing = drawingsMap.get(material.drawingId);
                                            return (
                                                <TableCell key={`dc-${col.id}`} className="text-sm bg-muted/10">
                                                    {formatCellValue(
                                                        parentDrawing?.data?.[col.name],
                                                        col.type
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                        {/* Material column values */}
                                        {sortedMaterialCols.map((col) => (
                                            <TableCell key={`mc-${col.id}`} className="text-sm">
                                                {formatCellValue(material.data[col.name], col.type)}
                                            </TableCell>
                                        ))}
                                        <TableCell>
                                            <Badge variant={STATUS_VARIANT[material.status] ?? 'outline'} className="text-xs">
                                                {STATUS_LABEL[material.status] ?? material.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-right font-mono">
                                            {formatQty(material.quantityRequired)}
                                        </TableCell>
                                        <TableCell className="text-sm text-right font-mono">
                                            {formatQty(material.quantityIssued)}
                                        </TableCell>
                                        <TableCell className="text-sm text-right font-mono">
                                            {formatQty(material.quantityUsed)}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {material.unit ?? '-'}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                                            {material.remarks ?? '-'}
                                        </TableCell>
                                    </TableRow>
                                    {expandedMaterialId === material.id && (
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableCell colSpan={totalColSpan} className="p-3">
                                                <div className="pl-6">
                                                    <TransactionTable materialId={material.id} />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="flex h-32 items-center justify-center text-muted-foreground border rounded-md">
                    No materials found across drawings in this job.
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Page {page + 1} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page === totalPages - 1}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
