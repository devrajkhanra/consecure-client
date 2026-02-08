'use client';

import { useState, Fragment } from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2, Check, X, History, ChevronDown, ChevronRight, Package } from 'lucide-react';
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
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ColumnType, type Drawing, type DrawingColumn } from '@/types';
import { DrawingHistoryDialog } from '@/components/drawings/change-history';
import { MaterialTable } from '@/components/materials/material-table';
import { useMaterialColumns } from '@/hooks/use-material-columns';

interface DrawingTableProps {
    jobId: string;
    drawings: Drawing[];
    columns: DrawingColumn[];
    onEdit: (drawing: Drawing) => void;
    onDelete: (drawing: Drawing) => void;
}

export function DrawingTable({ jobId, drawings, columns, onEdit, onDelete }: DrawingTableProps) {
    const [page, setPage] = useState(0);
    const [historyDrawingId, setHistoryDrawingId] = useState<string | null>(null);
    const [expandedDrawingId, setExpandedDrawingId] = useState<string | null>(null);
    const { data: materialColumns } = useMaterialColumns(jobId);
    const pageSize = 10;

    const sortedColumns = columns.slice().sort((a, b) => a.order - b.order);
    const paginatedDrawings = drawings.slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil(drawings.length / pageSize);

    const toggleRow = (drawingId: string) => {
        setExpandedDrawingId(expandedDrawingId === drawingId ? null : drawingId);
    };

    const renderCellValue = (drawing: Drawing, column: DrawingColumn) => {
        const value = drawing.data[column.name];

        if (value === undefined || value === null || value === '') {
            return <span className="text-muted-foreground">-</span>;
        }

        switch (column.type) {
            case ColumnType.BOOLEAN:
                return value ? (
                    <Check className="h-4 w-4 text-green-600" />
                ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                );
            case ColumnType.DATE:
                try {
                    return format(new Date(value as string), 'MMM d, yyyy');
                } catch {
                    return String(value);
                }
            case ColumnType.NUMBER:
                return (
                    <span className="font-mono">{Number(value).toLocaleString()}</span>
                );
            case ColumnType.TEXT:
            default:
                return <span className="max-w-[200px] truncate">{String(value)}</span>;
        }
    };

    if (sortedColumns.length === 0) {
        return (
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                No columns defined. Add columns first to create drawings.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30px]"></TableHead>
                            {sortedColumns.map((column) => (
                                <TableHead key={column.id}>
                                    {column.name}
                                    {column.required && (
                                        <span className="text-destructive ml-1">*</span>
                                    )}
                                </TableHead>
                            ))}
                            <TableHead className="w-[70px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedDrawings.length > 0 ? (
                            paginatedDrawings.map((drawing) => (
                                <Fragment key={drawing.id}>
                                    <TableRow
                                        className={expandedDrawingId === drawing.id ? "bg-muted/50" : ""}
                                    >
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => toggleRow(drawing.id)}
                                            >
                                                {expandedDrawingId === drawing.id ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TableCell>
                                        {sortedColumns.map((column) => (
                                            <TableCell key={column.id}>
                                                {renderCellValue(drawing, column)}
                                            </TableCell>
                                        ))}
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => toggleRow(drawing.id)}>
                                                        <Package className="mr-2 h-4 w-4" />
                                                        Materials
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onEdit(drawing)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setHistoryDrawingId(drawing.id)}>
                                                        <History className="mr-2 h-4 w-4" />
                                                        History
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => onDelete(drawing)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                    {expandedDrawingId === drawing.id && (
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableCell colSpan={sortedColumns.length + 2} className="p-4">
                                                <div className="pl-8">
                                                    <MaterialTable
                                                        drawingId={drawing.id}
                                                        columns={materialColumns ?? []}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </Fragment>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={sortedColumns.length + 2}
                                    className="h-24 text-center"
                                >
                                    No drawings found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {page * pageSize + 1} to{' '}
                        {Math.min((page + 1) * pageSize, drawings.length)} of {drawings.length}{' '}
                        drawings
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

            {/* History Dialog */}
            {historyDrawingId && (
                <DrawingHistoryDialog
                    jobId={jobId}
                    drawingId={historyDrawingId}
                    columns={columns}
                    open={!!historyDrawingId}
                    onOpenChange={(open) => !open && setHistoryDrawingId(null)}
                />
            )}
        </div>
    );
}
