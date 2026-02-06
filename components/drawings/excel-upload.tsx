'use client';

import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, X, AlertCircle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import type { DrawingColumn } from '@/types';

interface ParsedRow {
    rowNumber: number;
    data: Record<string, unknown>;
    isValid: boolean;
    errors: string[];
}

interface ExcelUploadDialogProps {
    jobId: string;
    columns: DrawingColumn[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (drawings: Record<string, unknown>[]) => Promise<void>;
}

export function ExcelUploadDialog({
    jobId,
    columns,
    open,
    onOpenChange,
    onImport,
}: ExcelUploadDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
    const [excelColumns, setExcelColumns] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = useCallback(() => {
        setFile(null);
        setParsedData([]);
        setExcelColumns([]);
        setError(null);
        setIsLoading(false);
        setIsImporting(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const handleClose = useCallback(() => {
        resetState();
        onOpenChange(false);
    }, [onOpenChange, resetState]);

    const validateRow = useCallback(
        (rowData: Record<string, unknown>, rowNumber: number): ParsedRow => {
            const errors: string[] = [];

            // Check required columns
            columns.forEach((col) => {
                if (col.required) {
                    const value = rowData[col.name];
                    if (value === undefined || value === null || value === '') {
                        errors.push(`Missing required field: ${col.name}`);
                    }
                }
            });

            // Validate data types
            columns.forEach((col) => {
                const value = rowData[col.name];
                if (value !== undefined && value !== null && value !== '') {
                    switch (col.type) {
                        case 'number':
                            if (isNaN(Number(value))) {
                                errors.push(`${col.name} should be a number`);
                            }
                            break;
                        case 'boolean':
                            const strVal = String(value).toLowerCase();
                            if (!['true', 'false', 'yes', 'no', '1', '0'].includes(strVal)) {
                                errors.push(`${col.name} should be a boolean (yes/no, true/false)`);
                            }
                            break;
                        case 'date':
                            // Excel dates are often numbers, so we'll accept those
                            if (typeof value !== 'number' && isNaN(Date.parse(String(value)))) {
                                errors.push(`${col.name} should be a valid date`);
                            }
                            break;
                    }
                }
            });

            return {
                rowNumber,
                data: rowData,
                isValid: errors.length === 0,
                errors,
            };
        },
        [columns]
    );

    const processValue = useCallback(
        (value: unknown, column: DrawingColumn): unknown => {
            if (value === undefined || value === null || value === '') {
                return column.type === 'boolean' ? false : '';
            }

            switch (column.type) {
                case 'number':
                    return Number(value);
                case 'boolean': {
                    const strVal = String(value).toLowerCase();
                    return ['true', 'yes', '1'].includes(strVal);
                }
                case 'date':
                    // Handle Excel date serial numbers
                    if (typeof value === 'number') {
                        const date = XLSX.SSF.parse_date_code(value);
                        if (date) {
                            return new Date(date.y, date.m - 1, date.d).toISOString().split('T')[0];
                        }
                    }
                    return String(value);
                default:
                    return String(value);
            }
        },
        []
    );

    const parseExcel = useCallback(
        async (selectedFile: File) => {
            setIsLoading(true);
            setError(null);

            try {
                const buffer = await selectedFile.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

                if (workbook.SheetNames.length === 0) {
                    throw new Error('No sheets found in the Excel file');
                }

                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
                    header: 1,
                    raw: false,
                }) as unknown[][];

                if (jsonData.length < 2) {
                    throw new Error('Excel file must have at least a header row and one data row');
                }

                // First row is headers
                const headers = (jsonData[0] || []).map((h) => String(h).trim());
                setExcelColumns(headers);

                // Check if all job columns exist in the Excel
                const missingColumns = columns
                    .filter((col) => col.required && !headers.includes(col.name))
                    .map((col) => col.name);

                if (missingColumns.length > 0) {
                    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
                }

                // Parse data rows
                const rows: ParsedRow[] = [];
                for (let i = 1; i < jsonData.length; i++) {
                    const rowArray = jsonData[i];
                    if (!rowArray || rowArray.every((cell) => cell === undefined || cell === '')) {
                        continue; // Skip empty rows
                    }

                    const rowData: Record<string, unknown> = {};

                    // Map Excel columns to job columns
                    headers.forEach((header, index) => {
                        const column = columns.find((c) => c.name === header);
                        if (column) {
                            rowData[header] = processValue(rowArray[index], column);
                        } else {
                            // Include unmatched columns as text
                            rowData[header] = rowArray[index] !== undefined ? String(rowArray[index]) : '';
                        }
                    });

                    rows.push(validateRow(rowData, i + 1));
                }

                if (rows.length === 0) {
                    throw new Error('No data rows found in the Excel file');
                }

                setParsedData(rows);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to parse Excel file');
                setParsedData([]);
            } finally {
                setIsLoading(false);
            }
        },
        [columns, processValue, validateRow]
    );

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) {
                const validTypes = [
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel',
                    '.xlsx',
                    '.xls',
                ];
                const extension = selectedFile.name.split('.').pop()?.toLowerCase();

                if (!validTypes.includes(selectedFile.type) && !['xlsx', 'xls'].includes(extension || '')) {
                    setError('Please upload a valid Excel file (.xlsx or .xls)');
                    return;
                }

                setFile(selectedFile);
                parseExcel(selectedFile);
            }
        },
        [parseExcel]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile) {
                setFile(droppedFile);
                parseExcel(droppedFile);
            }
        },
        [parseExcel]
    );

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    }, []);

    const handleImport = useCallback(async () => {
        const validRows = parsedData.filter((row) => row.isValid);
        if (validRows.length === 0) {
            toast.error('No valid rows to import');
            return;
        }

        setIsImporting(true);
        try {
            await onImport(validRows.map((row) => row.data));
            toast.success(`Successfully imported ${validRows.length} drawings`);
            handleClose();
        } catch (err) {
            toast.error('Failed to import drawings');
        } finally {
            setIsImporting(false);
        }
    }, [parsedData, onImport, handleClose]);

    const validCount = parsedData.filter((row) => row.isValid).length;
    const invalidCount = parsedData.filter((row) => !row.isValid).length;

    // Get display columns (job columns that exist in Excel)
    const displayColumns = columns.filter((col) => excelColumns.includes(col.name));

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Import Drawings from Excel
                    </DialogTitle>
                    <DialogDescription>
                        Upload an Excel file with drawing data. The first row should contain column names
                        matching your job columns.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4">
                    {/* File Upload Area */}
                    {!file && (
                        <div
                            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-lg font-medium">Drop your Excel file here</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                or click to browse (supports .xlsx, .xls)
                            </p>
                        </div>
                    )}

                    {/* File Info & Loading */}
                    {file && (
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                                <div>
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={resetState}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-2">Parsing Excel file...</span>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Column Mapping Info */}
                    {excelColumns.length > 0 && !isLoading && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Detected Columns:</p>
                            <div className="flex flex-wrap gap-2">
                                {excelColumns.map((col) => {
                                    const jobColumn = columns.find((c) => c.name === col);
                                    return (
                                        <Badge
                                            key={col}
                                            variant={jobColumn ? 'default' : 'secondary'}
                                        >
                                            {col}
                                            {jobColumn?.required && ' *'}
                                            {!jobColumn && ' (ignored)'}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    {parsedData.length > 0 && !isLoading && (
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="text-sm">
                                    <strong>{validCount}</strong> valid rows
                                </span>
                            </div>
                            {invalidCount > 0 && (
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <span className="text-sm">
                                        <strong>{invalidCount}</strong> rows with errors
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Preview Table */}
                    {parsedData.length > 0 && !isLoading && displayColumns.length > 0 && (
                        <div className="rounded-md border overflow-auto max-h-[300px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[60px]">Row</TableHead>
                                        <TableHead className="w-[80px]">Status</TableHead>
                                        {displayColumns.map((col) => (
                                            <TableHead key={col.id}>
                                                {col.name}
                                                {col.required && <span className="text-destructive ml-1">*</span>}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedData.slice(0, 50).map((row) => (
                                        <TableRow
                                            key={row.rowNumber}
                                            className={!row.isValid ? 'bg-red-50 dark:bg-red-950/20' : ''}
                                        >
                                            <TableCell className="font-mono text-muted-foreground">
                                                {row.rowNumber}
                                            </TableCell>
                                            <TableCell>
                                                {row.isValid ? (
                                                    <Check className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <span title={row.errors.join('\n')}>
                                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                                    </span>
                                                )}
                                            </TableCell>
                                            {displayColumns.map((col) => (
                                                <TableCell key={col.id} className="max-w-[200px] truncate">
                                                    {String(row.data[col.name] ?? '-')}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {parsedData.length > 50 && (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                    Showing 50 of {parsedData.length} rows
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-shrink-0">
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={validCount === 0 || isImporting}
                    >
                        {isImporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Import {validCount} Drawings
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
