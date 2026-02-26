'use client';

import { useState, useCallback, Fragment } from 'react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    Check,
    X,
    History,
    ChevronDown,
    ChevronRight,
    Package,
    Download,
    FileText,
    SlidersHorizontal,
} from 'lucide-react';
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
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
    const { data: materialColumns } = useMaterialColumns(jobId);
    const pageSize = 25;

    const allSortedColumns = columns.slice().sort((a, b) => a.order - b.order);
    const visibleColumns = allSortedColumns.filter((col) => !hiddenColumns.has(col.id));
    const paginatedDrawings = drawings.slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil(drawings.length / pageSize);

    const toggleRow = (drawingId: string) => {
        setExpandedDrawingId(expandedDrawingId === drawingId ? null : drawingId);
    };

    const toggleColumnVisibility = (columnId: string) => {
        setHiddenColumns((prev) => {
            const next = new Set(prev);
            if (next.has(columnId)) {
                next.delete(columnId);
            } else {
                next.add(columnId);
            }
            return next;
        });
    };

    const getCellStringValue = (drawing: Drawing, column: DrawingColumn): string => {
        const value = drawing.data[column.name];
        if (value === undefined || value === null || value === '') return '';

        switch (column.type) {
            case ColumnType.BOOLEAN:
                return value ? 'Yes' : 'No';
            case ColumnType.DATE:
                try {
                    return format(new Date(value as string), 'MMM d, yyyy');
                } catch {
                    return String(value);
                }
            case ColumnType.NUMBER:
                return Number(value).toLocaleString();
            case ColumnType.TEXT:
            default:
                return String(value);
        }
    };

    const handleDownloadExcel = useCallback(() => {
        const headers = visibleColumns.map((col) => col.name);
        const rows = drawings.map((drawing) =>
            visibleColumns.map((col) => getCellStringValue(drawing, col))
        );

        const wsData = [headers, ...rows];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Auto-size columns
        const colWidths = headers.map((h, i) => {
            const maxLen = Math.max(
                h.length,
                ...rows.map((r) => (r[i] ?? '').length)
            );
            return { wch: Math.min(maxLen + 2, 40) };
        });
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Drawings');
        XLSX.writeFile(wb, 'drawings.xlsx');
    }, [drawings, visibleColumns]);

    const handleDownloadPdf = useCallback(() => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const headers = visibleColumns.map((col) => col.name);
        const rows = drawings.map((drawing) =>
            visibleColumns.map((col) => getCellStringValue(drawing, col))
        );

        doc.setFontSize(14);
        doc.text('Drawings List', 14, 15);
        doc.setFontSize(9);
        doc.setTextColor(128);
        doc.text(`Generated on ${format(new Date(), 'MMM d, yyyy HH:mm')}`, 14, 22);

        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 28,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [41, 37, 36], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 248, 248] },
            margin: { left: 14, right: 14 },
        });

        doc.save('drawings.pdf');
    }, [drawings, visibleColumns]);

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

    if (allSortedColumns.length === 0) {
        return (
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                No columns defined. Add columns first to create drawings.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-end gap-1.5">
                {/* Column Visibility */}
                <DropdownMenu>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8">
                                    <SlidersHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Toggle columns</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {allSortedColumns.map((column) => (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                checked={!hiddenColumns.has(column.id)}
                                onCheckedChange={() => toggleColumnVisibility(column.id)}
                            >
                                {column.name}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Download Excel */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleDownloadExcel}
                            disabled={drawings.length === 0}
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Download Excel</TooltipContent>
                </Tooltip>

                {/* Download PDF */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleDownloadPdf}
                            disabled={drawings.length === 0}
                        >
                            <FileText className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Download PDF</TooltipContent>
                </Tooltip>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30px]"></TableHead>
                            {visibleColumns.map((column) => (
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
                                        {visibleColumns.map((column) => (
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
                                            <TableCell colSpan={visibleColumns.length + 2} className="p-4">
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
                                    colSpan={visibleColumns.length + 2}
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
