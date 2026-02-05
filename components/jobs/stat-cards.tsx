'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Hash, Calculator, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColumnType, type DrawingColumn, type Drawing } from '@/types';

// Aggregation types
export enum AggregationType {
    COUNT = 'COUNT',
    SUM = 'SUM',
    AVERAGE = 'AVERAGE',
    MIN = 'MIN',
    MAX = 'MAX',
    COUNT_TRUE = 'COUNT_TRUE',
    COUNT_FALSE = 'COUNT_FALSE',
}

const aggregationLabels: Record<AggregationType, string> = {
    [AggregationType.COUNT]: 'Count',
    [AggregationType.SUM]: 'Sum',
    [AggregationType.AVERAGE]: 'Average',
    [AggregationType.MIN]: 'Minimum',
    [AggregationType.MAX]: 'Maximum',
    [AggregationType.COUNT_TRUE]: 'Count (True)',
    [AggregationType.COUNT_FALSE]: 'Count (False)',
};

// Get available aggregations for a column type
function getAggregationsForType(type: ColumnType): AggregationType[] {
    switch (type) {
        case ColumnType.NUMBER:
            return [AggregationType.COUNT, AggregationType.SUM, AggregationType.AVERAGE, AggregationType.MIN, AggregationType.MAX];
        case ColumnType.BOOLEAN:
            return [AggregationType.COUNT, AggregationType.COUNT_TRUE, AggregationType.COUNT_FALSE];
        case ColumnType.TEXT:
        case ColumnType.DATE:
        default:
            return [AggregationType.COUNT];
    }
}

// Stat card configuration
export interface StatCardConfig {
    id: string;
    title: string;
    columnId: string;
    aggregation: AggregationType;
}

// Calculate aggregation value
function calculateAggregation(
    drawings: Drawing[],
    column: DrawingColumn,
    aggregation: AggregationType
): string | number {
    const values = drawings
        .map((d) => d.data[column.name])
        .filter((v) => v !== undefined && v !== null && v !== '');

    switch (aggregation) {
        case AggregationType.COUNT:
            return values.length;
        case AggregationType.SUM: {
            const sum = values.reduce<number>((acc, v) => acc + (Number(v) || 0), 0);
            return Number.isInteger(sum) ? sum : sum.toFixed(2);
        }
        case AggregationType.AVERAGE: {
            if (values.length === 0) return 0;
            const avg = values.reduce<number>((acc, v) => acc + (Number(v) || 0), 0) / values.length;
            return avg.toFixed(2);
        }
        case AggregationType.MIN: {
            const nums = values.map(Number).filter((n) => !isNaN(n));
            return nums.length > 0 ? Math.min(...nums) : '-';
        }
        case AggregationType.MAX: {
            const nums = values.map(Number).filter((n) => !isNaN(n));
            return nums.length > 0 ? Math.max(...nums) : '-';
        }
        case AggregationType.COUNT_TRUE:
            return values.filter((v) => v === true).length;
        case AggregationType.COUNT_FALSE:
            return values.filter((v) => v === false).length;
        default:
            return 0;
    }
}

// Local storage key for saving card configs
function getStorageKey(jobId: string) {
    return `job-stats-config-${jobId}`;
}

interface JobStatCardsProps {
    jobId: string;
    columns: DrawingColumn[];
    drawings: Drawing[];
    onConfigureClick: () => void;
}

export function JobStatCards({ jobId, columns, drawings, onConfigureClick }: JobStatCardsProps) {
    const [cards, setCards] = useState<StatCardConfig[]>([]);

    // Load from local storage
    useEffect(() => {
        const saved = localStorage.getItem(getStorageKey(jobId));
        if (saved) {
            try {
                setCards(JSON.parse(saved));
            } catch {
                setCards([]);
            }
        }
    }, [jobId]);

    // Get column by ID
    const getColumn = (columnId: string) => columns.find((c) => c.id === columnId);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => {
                const column = getColumn(card.columnId);
                if (!column) return null;

                const value = calculateAggregation(drawings, column, card.aggregation);

                return (
                    <Card key={card.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <Calculator className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{value}</div>
                            <p className="text-xs text-muted-foreground">
                                {aggregationLabels[card.aggregation]} of {column.name}
                            </p>
                        </CardContent>
                    </Card>
                );
            })}

            {/* Add Card Button */}
            <Card
                className="border-dashed cursor-pointer hover:border-primary/50 transition-colors"
                onClick={onConfigureClick}
            >
                <CardContent className="flex h-full items-center justify-center py-6">
                    <div className="flex flex-col items-center text-muted-foreground">
                        <Plus className="h-8 w-8 mb-2" />
                        <span className="text-sm">Add Stat Card</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

interface StatCardConfiguratorProps {
    jobId: string;
    columns: DrawingColumn[];
    drawings: Drawing[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function StatCardConfigurator({
    jobId,
    columns,
    drawings,
    open,
    onOpenChange,
}: StatCardConfiguratorProps) {
    const [cards, setCards] = useState<StatCardConfig[]>([]);
    const [selectedColumn, setSelectedColumn] = useState<string>('');
    const [selectedAggregation, setSelectedAggregation] = useState<AggregationType>(AggregationType.COUNT);
    const [cardTitle, setCardTitle] = useState('');

    // Load from local storage
    useEffect(() => {
        const saved = localStorage.getItem(getStorageKey(jobId));
        if (saved) {
            try {
                setCards(JSON.parse(saved));
            } catch {
                setCards([]);
            }
        }
    }, [jobId]);

    // Save to local storage whenever cards change
    const saveCards = (newCards: StatCardConfig[]) => {
        setCards(newCards);
        localStorage.setItem(getStorageKey(jobId), JSON.stringify(newCards));
    };

    // Get available aggregations for selected column
    const availableAggregations = useMemo(() => {
        const column = columns.find((c) => c.id === selectedColumn);
        if (!column) return [AggregationType.COUNT];
        return getAggregationsForType(column.type);
    }, [selectedColumn, columns]);

    // Reset aggregation when column changes
    useEffect(() => {
        if (availableAggregations.length > 0 && !availableAggregations.includes(selectedAggregation)) {
            setSelectedAggregation(availableAggregations[0]);
        }
    }, [availableAggregations, selectedAggregation]);

    const handleAddCard = () => {
        if (!selectedColumn) return;

        const column = columns.find((c) => c.id === selectedColumn);
        if (!column) return;

        const newCard: StatCardConfig = {
            id: crypto.randomUUID(),
            title: cardTitle || `${aggregationLabels[selectedAggregation]} of ${column.name}`,
            columnId: selectedColumn,
            aggregation: selectedAggregation,
        };

        saveCards([...cards, newCard]);
        setCardTitle('');
        setSelectedColumn('');
    };

    const handleRemoveCard = (cardId: string) => {
        saveCards(cards.filter((c) => c.id !== cardId));
    };

    const getColumn = (columnId: string) => columns.find((c) => c.id === columnId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Configure Stat Cards</DialogTitle>
                    <DialogDescription>
                        Add or remove stat cards that show aggregations of your drawing data
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-6 py-4">
                    {/* Current Cards */}
                    {cards.length > 0 && (
                        <div className="space-y-3">
                            <Label>Current Cards</Label>
                            {cards.map((card) => {
                                const column = getColumn(card.columnId);
                                return (
                                    <div
                                        key={card.id}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">{card.title}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {aggregationLabels[card.aggregation]} of {column?.name ?? 'Unknown'}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveCard(card.id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Add New Card */}
                    <div className="space-y-4 pt-4 border-t">
                        <Label>Add New Card</Label>

                        {columns.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No columns configured. Add columns first to create stat cards.
                            </p>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="column">Column</Label>
                                    <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {columns.map((column) => (
                                                <SelectItem key={column.id} value={column.id}>
                                                    <div className="flex items-center gap-2">
                                                        {column.name}
                                                        <Badge variant="outline" className="text-xs">
                                                            {column.type}
                                                        </Badge>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedColumn && (
                                    <div className="space-y-2">
                                        <Label htmlFor="aggregation">Aggregation</Label>
                                        <Select
                                            value={selectedAggregation}
                                            onValueChange={(v) => setSelectedAggregation(v as AggregationType)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableAggregations.map((agg) => (
                                                    <SelectItem key={agg} value={agg}>
                                                        {aggregationLabels[agg]}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {selectedColumn && (
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Card Title (Optional)</Label>
                                        <Input
                                            id="title"
                                            value={cardTitle}
                                            onChange={(e) => setCardTitle(e.target.value)}
                                            placeholder={`${aggregationLabels[selectedAggregation]} of ${columns.find((c) => c.id === selectedColumn)?.name ?? ''}`}
                                        />
                                    </div>
                                )}

                                <Button
                                    onClick={handleAddCard}
                                    disabled={!selectedColumn}
                                    className="w-full"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Card
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
