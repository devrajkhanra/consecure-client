'use client';

import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
    Upload,
    FileSpreadsheet,
    X,
    AlertCircle,
    Check,
    Loader2,
    Package,
} from 'lucide-react';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import api from '@/lib/api';
import type { Drawing, DrawingColumn, MaterialColumn, Material, CreateMaterialDto } from '@/types';
import { MaterialStatus } from '@/types';

interface ParsedMaterialRow {
    rowNumber: number;
    matchKey: string;
    matchedDrawing: Drawing | null;
    materialData: Record<string, unknown>;
    builtInFields: {
        status?: MaterialStatus;
        quantityRequired?: number;
        quantityIssued?: number;
        quantityUsed?: number;
        unit?: string;
        remarks?: string;
    };
    isValid: boolean;
    errors: string[];
}

interface MaterialExcelUploadDialogProps {
    jobId: string;
    drawings: Drawing[];
    drawingColumns: DrawingColumn[];
    materialColumns: MaterialColumn[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const BUILT_IN_FIELDS = ['status', 'quantityRequired', 'quantityIssued', 'quantityUsed', 'unit', 'remarks'];

export function MaterialExcelUploadDialog({
    jobId,
    drawings,
    drawingColumns,
    materialColumns,
    open,
    onOpenChange,
}: MaterialExcelUploadDialogProps) {
    const [matchColumnId, setMatchColumnId] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedMaterialRow[]>([]);
    const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const matchColumn = drawingColumns.find((c) => c.id === matchColumnId);

    const resetState = useCallback(() => {
        setFile(null);
        setParsedData([]);
        setExcelHeaders([]);
        setError(null);
        setIsLoading(false);
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const handleClose = useCallback(() => {
        resetState();
        setMatchColumnId('');
        onOpenChange(false);
    }, [onOpenChange, resetState]);

    const parseExcel = useCallback(
        async (selectedFile: File) => {
            if (!matchColumn) return;
            setIsLoading(true);
            setError(null);

            try {
                const buffer = await selectedFile.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

                if (workbook.SheetNames.length === 0) throw new Error('No sheets found');

                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
                    header: 1,
                    raw: false,
                }) as unknown[][];

                if (jsonData.length < 2) throw new Error('Excel must have a header row and at least one data row');

                const headers = (jsonData[0] || []).map((h) => String(h).trim());
                setExcelHeaders(headers);

                // The match column name must exist in Excel
                if (!headers.includes(matchColumn.name)) {
                    throw new Error(`Excel is missing the matching column "${matchColumn.name}". Add it to identify which drawing each material belongs to.`);
                }

                // Check material columns
                const missingRequired = materialColumns
                    .filter((mc) => mc.required && !headers.includes(mc.name))
                    .map((mc) => mc.name);
                if (missingRequired.length > 0) {
                    throw new Error(`Missing required material columns: ${missingRequired.join(', ')}`);
                }

                // Build drawing lookup by match column value
                const drawingLookup = new Map<string, Drawing>();
                for (const drawing of drawings) {
                    const key = String(drawing.data[matchColumn.name] ?? '').trim().toLowerCase();
                    if (key) drawingLookup.set(key, drawing);
                }

                // Parse rows
                const rows: ParsedMaterialRow[] = [];
                for (let i = 1; i < jsonData.length; i++) {
                    const rowArray = jsonData[i];
                    if (!rowArray || rowArray.every((c) => c === undefined || c === '')) continue;

                    const errors: string[] = [];
                    const matchKeyIndex = headers.indexOf(matchColumn.name);
                    const matchKey = String(rowArray[matchKeyIndex] ?? '').trim();
                    const matchedDrawing = drawingLookup.get(matchKey.toLowerCase()) ?? null;

                    if (!matchKey) {
                        errors.push(`Missing "${matchColumn.name}" value`);
                    } else if (!matchedDrawing) {
                        errors.push(`No drawing found with ${matchColumn.name} = "${matchKey}"`);
                    }

                    // Parse material column data
                    const materialData: Record<string, unknown> = {};
                    for (const mc of materialColumns) {
                        const idx = headers.indexOf(mc.name);
                        if (idx === -1) continue;
                        const val = rowArray[idx];
                        switch (mc.type) {
                            case 'number':
                                materialData[mc.name] = val !== undefined && val !== '' ? Number(val) : null;
                                break;
                            case 'boolean': {
                                const sv = String(val ?? '').toLowerCase();
                                materialData[mc.name] = ['true', 'yes', '1'].includes(sv);
                                break;
                            }
                            default:
                                materialData[mc.name] = val !== undefined ? String(val) : '';
                        }

                        if (mc.required && (val === undefined || val === null || val === '')) {
                            errors.push(`Missing required: ${mc.name}`);
                        }
                    }

                    // Parse built-in fields if present
                    const builtInFields: ParsedMaterialRow['builtInFields'] = {};
                    const statusIdx = headers.indexOf('status');
                    if (statusIdx !== -1 && rowArray[statusIdx]) {
                        const sv = String(rowArray[statusIdx]).toLowerCase();
                        if (Object.values(MaterialStatus).includes(sv as MaterialStatus)) {
                            builtInFields.status = sv as MaterialStatus;
                        }
                    }
                    const qrIdx = headers.indexOf('quantityRequired');
                    if (qrIdx !== -1 && rowArray[qrIdx] !== undefined && rowArray[qrIdx] !== '') builtInFields.quantityRequired = Number(rowArray[qrIdx]);
                    const qiIdx = headers.indexOf('quantityIssued');
                    if (qiIdx !== -1 && rowArray[qiIdx] !== undefined && rowArray[qiIdx] !== '') builtInFields.quantityIssued = Number(rowArray[qiIdx]);
                    const quIdx = headers.indexOf('quantityUsed');
                    if (quIdx !== -1 && rowArray[quIdx] !== undefined && rowArray[quIdx] !== '') builtInFields.quantityUsed = Number(rowArray[quIdx]);
                    const unitIdx = headers.indexOf('unit');
                    if (unitIdx !== -1 && rowArray[unitIdx]) builtInFields.unit = String(rowArray[unitIdx]);
                    const remIdx = headers.indexOf('remarks');
                    if (remIdx !== -1 && rowArray[remIdx]) builtInFields.remarks = String(rowArray[remIdx]);

                    rows.push({
                        rowNumber: i + 1,
                        matchKey,
                        matchedDrawing,
                        materialData,
                        builtInFields,
                        isValid: errors.length === 0,
                        errors,
                    });
                }

                if (rows.length === 0) throw new Error('No data rows found');
                setParsedData(rows);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to parse Excel file');
                setParsedData([]);
            } finally {
                setIsLoading(false);
            }
        },
        [matchColumn, drawings, materialColumns]
    );

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) {
                const ext = selectedFile.name.split('.').pop()?.toLowerCase();
                if (!['xlsx', 'xls'].includes(ext || '')) {
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

    const handleImport = useCallback(async () => {
        const validRows = parsedData.filter((r) => r.isValid && r.matchedDrawing);
        if (validRows.length === 0) {
            toast.error('No valid rows to import');
            return;
        }

        setIsImporting(true);
        try {
            let created = 0;
            for (const row of validRows) {
                const dto: CreateMaterialDto = {
                    data: row.materialData,
                    ...row.builtInFields,
                };
                await api.post<Material>(`/drawings/${row.matchedDrawing!.id}/materials`, dto);
                created++;
            }
            toast.success(`Successfully imported ${created} materials`);
            handleClose();
        } catch {
            toast.error('Failed to import some materials');
        } finally {
            setIsImporting(false);
        }
    }, [parsedData, handleClose]);

    const validCount = parsedData.filter((r) => r.isValid).length;
    const invalidCount = parsedData.filter((r) => !r.isValid).length;

    // Display material columns that exist in Excel
    const displayMatCols = materialColumns
        .filter((mc) => excelHeaders.includes(mc.name))
        .sort((a, b) => a.order - b.order);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Import Materials from Excel
                    </DialogTitle>
                    <DialogDescription>
                        Upload an Excel file with material data. A common column identifies which drawing each material belongs to.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4">
                    {/* Step 1: Select matching column */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Match materials to drawings by{' '}
                            <span className="text-muted-foreground">(select a drawing column)</span>
                        </label>
                        <Select value={matchColumnId} onValueChange={(v) => { setMatchColumnId(v); resetState(); }}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a drawing column to match on..." />
                            </SelectTrigger>
                            <SelectContent>
                                {drawingColumns
                                    .slice()
                                    .sort((a, b) => a.order - b.order)
                                    .map((dc) => (
                                        <SelectItem key={dc.id} value={dc.id}>
                                            {dc.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Step 2: File upload (only after column selected) */}
                    {matchColumnId && !file && (
                        <div
                            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
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
                                Include a &quot;{matchColumn?.name}&quot; column to match rows to drawings
                            </p>
                        </div>
                    )}

                    {/* File info */}
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

                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-2">Parsing Excel file...</span>
                        </div>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Column mapping info */}
                    {excelHeaders.length > 0 && !isLoading && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Detected Columns:</p>
                            <div className="flex flex-wrap gap-2">
                                {excelHeaders.map((h) => {
                                    const isMaterialCol = materialColumns.some((mc) => mc.name === h);
                                    const isMatchCol = h === matchColumn?.name;
                                    const isBuiltIn = BUILT_IN_FIELDS.includes(h);
                                    return (
                                        <Badge
                                            key={h}
                                            variant={isMatchCol ? 'default' : isMaterialCol || isBuiltIn ? 'secondary' : 'outline'}
                                        >
                                            {h}
                                            {isMatchCol && ' (match)'}
                                            {!isMaterialCol && !isMatchCol && !isBuiltIn && ' (ignored)'}
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
                                <span className="text-sm"><strong>{validCount}</strong> matched rows</span>
                            </div>
                            {invalidCount > 0 && (
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <span className="text-sm"><strong>{invalidCount}</strong> unmatched/errors</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Preview table */}
                    {parsedData.length > 0 && !isLoading && (
                        <div className="rounded-md border overflow-auto max-h-[300px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">Row</TableHead>
                                        <TableHead className="w-[70px]">Match</TableHead>
                                        <TableHead>{matchColumn?.name}</TableHead>
                                        {displayMatCols.map((mc) => (
                                            <TableHead key={mc.id}>{mc.name}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedData.slice(0, 50).map((row) => (
                                        <TableRow
                                            key={row.rowNumber}
                                            className={!row.isValid ? 'bg-red-50 dark:bg-red-950/20' : ''}
                                        >
                                            <TableCell className="font-mono text-muted-foreground text-xs">
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
                                            <TableCell className="text-sm font-medium">
                                                {row.matchKey || '-'}
                                            </TableCell>
                                            {displayMatCols.map((mc) => (
                                                <TableCell key={mc.id} className="text-sm max-w-[150px] truncate">
                                                    {String(row.materialData[mc.name] ?? '-')}
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
                                Import {validCount} Materials
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
