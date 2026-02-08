'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Calculator, BarChart3, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

// Filter operators
export enum FilterOperator {
    EQUALS = 'EQUALS',
    NOT_EQUALS = 'NOT_EQUALS',
    CONTAINS = 'CONTAINS',
    GREATER_THAN = 'GREATER_THAN',
    LESS_THAN = 'LESS_THAN',
    GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
    LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
    IS_TRUE = 'IS_TRUE',
    IS_FALSE = 'IS_FALSE',
    IS_EMPTY = 'IS_EMPTY',
    IS_NOT_EMPTY = 'IS_NOT_EMPTY',
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

const filterOperatorLabels: Record<FilterOperator, string> = {
    [FilterOperator.EQUALS]: 'Equals',
    [FilterOperator.NOT_EQUALS]: 'Not Equals',
    [FilterOperator.CONTAINS]: 'Contains',
    [FilterOperator.GREATER_THAN]: 'Greater Than',
    [FilterOperator.LESS_THAN]: 'Less Than',
    [FilterOperator.GREATER_THAN_OR_EQUAL]: '≥ (Greater or Equal)',
    [FilterOperator.LESS_THAN_OR_EQUAL]: '≤ (Less or Equal)',
    [FilterOperator.IS_TRUE]: 'Is True',
    [FilterOperator.IS_FALSE]: 'Is False',
    [FilterOperator.IS_EMPTY]: 'Is Empty',
    [FilterOperator.IS_NOT_EMPTY]: 'Is Not Empty',
};

// Get available operators for a column type
function getOperatorsForType(type: ColumnType): FilterOperator[] {
    switch (type) {
        case ColumnType.NUMBER:
            return [
                FilterOperator.EQUALS,
                FilterOperator.NOT_EQUALS,
                FilterOperator.GREATER_THAN,
                FilterOperator.LESS_THAN,
                FilterOperator.GREATER_THAN_OR_EQUAL,
                FilterOperator.LESS_THAN_OR_EQUAL,
                FilterOperator.IS_EMPTY,
                FilterOperator.IS_NOT_EMPTY,
            ];
        case ColumnType.BOOLEAN:
            return [FilterOperator.IS_TRUE, FilterOperator.IS_FALSE];
        case ColumnType.TEXT:
            return [
                FilterOperator.EQUALS,
                FilterOperator.NOT_EQUALS,
                FilterOperator.CONTAINS,
                FilterOperator.IS_EMPTY,
                FilterOperator.IS_NOT_EMPTY,
            ];
        case ColumnType.DATE:
            return [
                FilterOperator.EQUALS,
                FilterOperator.NOT_EQUALS,
                FilterOperator.GREATER_THAN,
                FilterOperator.LESS_THAN,
                FilterOperator.IS_EMPTY,
                FilterOperator.IS_NOT_EMPTY,
            ];
        default:
            return [FilterOperator.EQUALS, FilterOperator.NOT_EQUALS];
    }
}

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

// Filter condition type
export interface FilterCondition {
    columnId: string;
    operator: FilterOperator;
    value?: string;
}

// Stat card configuration
export interface StatCardConfig {
    id: string;
    title: string;
    columnId: string;
    aggregation: AggregationType;
    filters?: FilterCondition[];
}

// Check if operator needs a value input
function operatorNeedsValue(operator: FilterOperator): boolean {
    return ![
        FilterOperator.IS_TRUE,
        FilterOperator.IS_FALSE,
        FilterOperator.IS_EMPTY,
        FilterOperator.IS_NOT_EMPTY,
    ].includes(operator);
}

// Apply filter to a single drawing
function matchesFilter(drawing: Drawing, filter: FilterCondition, columns: DrawingColumn[]): boolean {
    const column = columns.find((c) => c.id === filter.columnId);
    if (!column) return true;

    const value = drawing.data[column.name];
    const filterValue = filter.value ?? '';

    switch (filter.operator) {
        case FilterOperator.EQUALS:
            return String(value ?? '').toLowerCase() === filterValue.toLowerCase();
        case FilterOperator.NOT_EQUALS:
            return String(value ?? '').toLowerCase() !== filterValue.toLowerCase();
        case FilterOperator.CONTAINS:
            return String(value ?? '').toLowerCase().includes(filterValue.toLowerCase());
        case FilterOperator.GREATER_THAN:
            return Number(value) > Number(filterValue);
        case FilterOperator.LESS_THAN:
            return Number(value) < Number(filterValue);
        case FilterOperator.GREATER_THAN_OR_EQUAL:
            return Number(value) >= Number(filterValue);
        case FilterOperator.LESS_THAN_OR_EQUAL:
            return Number(value) <= Number(filterValue);
        case FilterOperator.IS_TRUE:
            return value === true;
        case FilterOperator.IS_FALSE:
            return value === false;
        case FilterOperator.IS_EMPTY:
            return value === undefined || value === null || value === '';
        case FilterOperator.IS_NOT_EMPTY:
            return value !== undefined && value !== null && value !== '';
        default:
            return true;
    }
}

// Filter drawings based on conditions
function filterDrawings(drawings: Drawing[], filters: FilterCondition[], columns: DrawingColumn[]): Drawing[] {
    if (!filters || filters.length === 0) return drawings;
    return drawings.filter((drawing) => filters.every((filter) => matchesFilter(drawing, filter, columns)));
}

// Calculate aggregation value
function calculateAggregation(
    drawings: Drawing[],
    column: DrawingColumn,
    aggregation: AggregationType,
    filters: FilterCondition[] | undefined,
    columns: DrawingColumn[]
): string | number {
    const filteredDrawings = filterDrawings(drawings, filters ?? [], columns);
    const values = filteredDrawings
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
        <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
            {cards.map((card) => {
                const column = getColumn(card.columnId);
                if (!column) return null;

                const value = calculateAggregation(drawings, column, card.aggregation, card.filters, columns);
                const hasFilters = card.filters && card.filters.length > 0;

                return (
                    <Card key={card.id} className="p-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-muted-foreground truncate">{card.title}</span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {hasFilters && <Filter className="h-3 w-3 text-primary" />}
                                <Calculator className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                        <div className="text-lg font-bold">{value}</div>
                    </Card>
                );
            })}

            {/* Add Card Button */}
            <Card
                className="p-3 border-dashed cursor-pointer hover:border-primary/50 transition-colors"
                onClick={onConfigureClick}
            >
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">Add Stat</span>
                </div>
            </Card>
        </div>
    );
}

// Filter builder component
interface FilterBuilderProps {
    columns: DrawingColumn[];
    filters: FilterCondition[];
    onChange: (filters: FilterCondition[]) => void;
}

function FilterBuilder({ columns, filters, onChange }: FilterBuilderProps) {
    const addFilter = () => {
        if (columns.length === 0) return;
        const firstColumn = columns[0];
        const operators = getOperatorsForType(firstColumn.type);
        onChange([
            ...filters,
            {
                columnId: firstColumn.id,
                operator: operators[0],
                value: '',
            },
        ]);
    };

    const updateFilter = (index: number, updates: Partial<FilterCondition>) => {
        const newFilters = [...filters];
        newFilters[index] = { ...newFilters[index], ...updates };

        // Reset operator and value when column changes
        if (updates.columnId) {
            const column = columns.find((c) => c.id === updates.columnId);
            if (column) {
                const operators = getOperatorsForType(column.type);
                newFilters[index].operator = operators[0];
                newFilters[index].value = '';
            }
        }

        onChange(newFilters);
    };

    const removeFilter = (index: number) => {
        onChange(filters.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label>Filters (Optional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addFilter}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Filter
                </Button>
            </div>

            {filters.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    No filters applied. Add filters to aggregate specific data.
                </p>
            )}

            {filters.map((filter, index) => {
                const column = columns.find((c) => c.id === filter.columnId);
                const operators = column ? getOperatorsForType(column.type) : [];
                const needsValue = operatorNeedsValue(filter.operator);

                return (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
                        <Select
                            value={filter.columnId}
                            onValueChange={(v) => updateFilter(index, { columnId: v })}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {columns.map((col) => (
                                    <SelectItem key={col.id} value={col.id}>
                                        {col.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filter.operator}
                            onValueChange={(v) => updateFilter(index, { operator: v as FilterOperator })}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {operators.map((op) => (
                                    <SelectItem key={op} value={op}>
                                        {filterOperatorLabels[op]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {needsValue && (
                            <Input
                                value={filter.value ?? ''}
                                onChange={(e) => updateFilter(index, { value: e.target.value })}
                                placeholder="Value"
                                className="w-[120px]"
                            />
                        )}

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFilter(index)}
                            className="text-destructive hover:text-destructive flex-shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                );
            })}
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
    const [filters, setFilters] = useState<FilterCondition[]>([]);

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

        // Build title with filter info
        let defaultTitle = `${aggregationLabels[selectedAggregation]} of ${column.name}`;
        if (filters.length > 0) {
            const filterDesc = filters
                .map((f) => {
                    const col = columns.find((c) => c.id === f.columnId);
                    return `${col?.name ?? ''} ${filterOperatorLabels[f.operator].toLowerCase()}${f.value ? ` "${f.value}"` : ''}`;
                })
                .join(', ');
            defaultTitle = `${aggregationLabels[selectedAggregation]} where ${filterDesc}`;
        }

        const newCard: StatCardConfig = {
            id: crypto.randomUUID(),
            title: cardTitle || defaultTitle,
            columnId: selectedColumn,
            aggregation: selectedAggregation,
            filters: filters.length > 0 ? [...filters] : undefined,
        };

        saveCards([...cards, newCard]);
        setCardTitle('');
        setSelectedColumn('');
        setFilters([]);
    };

    const handleRemoveCard = (cardId: string) => {
        saveCards(cards.filter((c) => c.id !== cardId));
    };

    const getColumn = (columnId: string) => columns.find((c) => c.id === columnId);

    // Get filter summary for display
    const getFilterSummary = (cardFilters: FilterCondition[] | undefined) => {
        if (!cardFilters || cardFilters.length === 0) return null;
        return cardFilters
            .map((f) => {
                const col = columns.find((c) => c.id === f.columnId);
                return `${col?.name ?? '?'}`;
            })
            .join(', ');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Configure Stat Cards</DialogTitle>
                    <DialogDescription>
                        Add stat cards with aggregations and optional filters to analyze your drawing data
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-6 py-4">
                    {/* Current Cards */}
                    {cards.length > 0 && (
                        <div className="space-y-3">
                            <Label>Current Cards</Label>
                            {cards.map((card) => {
                                const column = getColumn(card.columnId);
                                const filterSummary = getFilterSummary(card.filters);
                                return (
                                    <div
                                        key={card.id}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">{card.title}</p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <span>{aggregationLabels[card.aggregation]} of {column?.name ?? 'Unknown'}</span>
                                                    {filterSummary && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            <Filter className="h-2 w-2 mr-1" />
                                                            {filterSummary}
                                                        </Badge>
                                                    )}
                                                </div>
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
                                    <Label htmlFor="column">Aggregate Column</Label>
                                    <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a column to aggregate" />
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
                                        <Label htmlFor="aggregation">Aggregation Type</Label>
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
                                    <FilterBuilder
                                        columns={columns}
                                        filters={filters}
                                        onChange={setFilters}
                                    />
                                )}

                                {selectedColumn && (
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Card Title (Optional)</Label>
                                        <Input
                                            id="title"
                                            value={cardTitle}
                                            onChange={(e) => setCardTitle(e.target.value)}
                                            placeholder="Auto-generated if empty"
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
