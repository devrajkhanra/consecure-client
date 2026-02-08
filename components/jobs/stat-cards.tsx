'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, BarChart3, Filter, X, ChevronDown, ChevronRight, Settings2, GripVertical, Layers } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
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
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
    [AggregationType.AVERAGE]: 'Avg',
    [AggregationType.MIN]: 'Min',
    [AggregationType.MAX]: 'Max',
    [AggregationType.COUNT_TRUE]: '✓',
    [AggregationType.COUNT_FALSE]: '✗',
};

const filterOperatorLabels: Record<FilterOperator, string> = {
    [FilterOperator.EQUALS]: 'Equals',
    [FilterOperator.NOT_EQUALS]: 'Not Equals',
    [FilterOperator.CONTAINS]: 'Contains',
    [FilterOperator.GREATER_THAN]: 'Greater Than',
    [FilterOperator.LESS_THAN]: 'Less Than',
    [FilterOperator.GREATER_THAN_OR_EQUAL]: '≥',
    [FilterOperator.LESS_THAN_OR_EQUAL]: '≤',
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
    groupId?: string; // Group ID for merged cards
}

// Group configuration
export interface StatCardGroup {
    id: string;
    name: string;
    cardIds: string[];
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

// Local storage keys
function getStorageKey(jobId: string) {
    return `job-stats-config-${jobId}`;
}

function getCollapseKey(jobId: string) {
    return `job-stats-collapsed-${jobId}`;
}

function getGroupsKey(jobId: string) {
    return `job-stats-groups-${jobId}`;
}

// Draggable stat card item
interface DraggableStatCardProps {
    card: StatCardConfig;
    value: string | number;
    hasFilters: boolean;
}

function DraggableStatCard({ card, value, hasFilters }: DraggableStatCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: card.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border bg-muted/30 text-xs cursor-move select-none hover:bg-muted/50 transition-colors"
            {...attributes}
            {...listeners}
        >
            <GripVertical className="h-2.5 w-2.5 text-muted-foreground/50" />
            {hasFilters && <Filter className="h-2 w-2 text-primary" />}
            <span className="text-muted-foreground truncate max-w-[80px]">{card.title}:</span>
            <span className="font-semibold">{value}</span>
        </div>
    );
}

// Grouped stat cards display
interface StatCardGroupDisplayProps {
    group: StatCardGroup;
    cards: StatCardConfig[];
    drawings: Drawing[];
    columns: DrawingColumn[];
}

function StatCardGroupDisplay({ group, cards, drawings, columns }: StatCardGroupDisplayProps) {
    const groupCards = cards.filter((c) => group.cardIds.includes(c.id));

    const getColumn = (columnId: string) => columns.find((c) => c.id === columnId);

    return (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md border-2 border-primary/20 bg-primary/5 text-xs">
            <Layers className="h-3 w-3 text-primary/60 mr-0.5" />
            <span className="text-muted-foreground font-medium">{group.name}:</span>
            {groupCards.map((card, idx) => {
                const column = getColumn(card.columnId);
                if (!column) return null;
                const value = calculateAggregation(drawings, column, card.aggregation, card.filters, columns);
                return (
                    <span key={card.id} className="flex items-center gap-0.5">
                        {idx > 0 && <span className="text-muted-foreground/50">|</span>}
                        <span className="font-semibold">{value}</span>
                    </span>
                );
            })}
        </div>
    );
}

interface JobStatCardsProps {
    jobId: string;
    columns: DrawingColumn[];
    drawings: Drawing[];
    onConfigureClick: () => void;
}

export function JobStatCards({ jobId, columns, drawings, onConfigureClick }: JobStatCardsProps) {
    const [cards, setCards] = useState<StatCardConfig[]>([]);
    const [groups, setGroups] = useState<StatCardGroup[]>([]);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

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
        const savedGroups = localStorage.getItem(getGroupsKey(jobId));
        if (savedGroups) {
            try {
                setGroups(JSON.parse(savedGroups));
            } catch {
                setGroups([]);
            }
        }
        const collapsed = localStorage.getItem(getCollapseKey(jobId));
        setIsCollapsed(collapsed === 'true');
    }, [jobId]);

    // Save cards order
    const saveCards = (newCards: StatCardConfig[]) => {
        setCards(newCards);
        localStorage.setItem(getStorageKey(jobId), JSON.stringify(newCards));
    };

    // Save collapse state
    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem(getCollapseKey(jobId), String(newState));
    };

    // Handle drag end for reordering
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = cards.findIndex((c) => c.id === active.id);
            const newIndex = cards.findIndex((c) => c.id === over.id);
            const reordered = arrayMove(cards, oldIndex, newIndex);
            saveCards(reordered);
        }
    };

    // Get column by ID
    const getColumn = (columnId: string) => columns.find((c) => c.id === columnId);

    // Get ungrouped cards
    const ungroupedCards = cards.filter((c) => !groups.some((g) => g.cardIds.includes(c.id)));

    // Don't render if no cards
    if (cards.length === 0) {
        return (
            <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed cursor-pointer hover:border-primary/50 transition-colors text-muted-foreground"
                onClick={onConfigureClick}
            >
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="text-xs">Add stat cards</span>
            </div>
        );
    }

    return (
        <Collapsible open={!isCollapsed} onOpenChange={() => toggleCollapse()}>
            <div className="flex items-center gap-1.5 mb-0.5">
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-5 px-1 gap-0.5">
                        {isCollapsed ? (
                            <ChevronRight className="h-3 w-3" />
                        ) : (
                            <ChevronDown className="h-3 w-3" />
                        )}
                        <span className="text-[10px] font-medium text-muted-foreground">Stats</span>
                        <Badge variant="secondary" className="h-3.5 px-1 text-[9px] ml-0.5">{cards.length}</Badge>
                    </Button>
                </CollapsibleTrigger>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        onConfigureClick();
                    }}
                >
                    <Settings2 className="h-2.5 w-2.5" />
                </Button>
            </div>

            <CollapsibleContent>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={ungroupedCards.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
                        <div className="flex flex-wrap gap-1">
                            {/* Render groups first */}
                            {groups.map((group) => (
                                <StatCardGroupDisplay
                                    key={group.id}
                                    group={group}
                                    cards={cards}
                                    drawings={drawings}
                                    columns={columns}
                                />
                            ))}

                            {/* Render ungrouped draggable cards */}
                            {ungroupedCards.map((card) => {
                                const column = getColumn(card.columnId);
                                if (!column) return null;
                                const value = calculateAggregation(drawings, column, card.aggregation, card.filters, columns);
                                const hasFilters = card.filters && card.filters.length > 0;
                                return (
                                    <DraggableStatCard
                                        key={card.id}
                                        card={card}
                                        value={value}
                                        hasFilters={hasFilters}
                                    />
                                );
                            })}
                        </div>
                    </SortableContext>
                </DndContext>
            </CollapsibleContent>
        </Collapsible>
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
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className="text-xs">Filters</Label>
                <Button type="button" variant="outline" size="sm" className="h-6 text-xs" onClick={addFilter}>
                    <Plus className="h-2.5 w-2.5 mr-1" />
                    Add
                </Button>
            </div>

            {filters.length === 0 && (
                <p className="text-xs text-muted-foreground">No filters</p>
            )}

            {filters.map((filter, index) => {
                const column = columns.find((c) => c.id === filter.columnId);
                const operators = column ? getOperatorsForType(column.type) : [];
                const needsValue = operatorNeedsValue(filter.operator);

                return (
                    <div key={index} className="flex items-center gap-1.5 p-1.5 rounded border bg-muted/30">
                        <Select
                            value={filter.columnId}
                            onValueChange={(v) => updateFilter(index, { columnId: v })}
                        >
                            <SelectTrigger className="h-7 w-[100px] text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {columns.map((col) => (
                                    <SelectItem key={col.id} value={col.id} className="text-xs">
                                        {col.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filter.operator}
                            onValueChange={(v) => updateFilter(index, { operator: v as FilterOperator })}
                        >
                            <SelectTrigger className="h-7 w-[90px] text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {operators.map((op) => (
                                    <SelectItem key={op} value={op} className="text-xs">
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
                                className="h-7 w-[80px] text-xs"
                            />
                        )}

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFilter(index)}
                            className="h-6 w-6 text-destructive hover:text-destructive"
                        >
                            <X className="h-3 w-3" />
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
    const [groups, setGroups] = useState<StatCardGroup[]>([]);
    const [selectedColumn, setSelectedColumn] = useState<string>('');
    const [selectedAggregation, setSelectedAggregation] = useState<AggregationType>(AggregationType.COUNT);
    const [cardTitle, setCardTitle] = useState('');
    const [filters, setFilters] = useState<FilterCondition[]>([]);
    const [groupName, setGroupName] = useState('');
    const [selectedCardsForGroup, setSelectedCardsForGroup] = useState<string[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

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
        const savedGroups = localStorage.getItem(getGroupsKey(jobId));
        if (savedGroups) {
            try {
                setGroups(JSON.parse(savedGroups));
            } catch {
                setGroups([]);
            }
        }
    }, [jobId]);

    // Save functions
    const saveCards = (newCards: StatCardConfig[]) => {
        setCards(newCards);
        localStorage.setItem(getStorageKey(jobId), JSON.stringify(newCards));
    };

    const saveGroups = (newGroups: StatCardGroup[]) => {
        setGroups(newGroups);
        localStorage.setItem(getGroupsKey(jobId), JSON.stringify(newGroups));
    };

    // Available aggregations for selected column
    const availableAggregations = useMemo(() => {
        const column = columns.find((c) => c.id === selectedColumn);
        if (!column) return [AggregationType.COUNT];
        return getAggregationsForType(column.type);
    }, [selectedColumn, columns]);

    useEffect(() => {
        if (availableAggregations.length > 0 && !availableAggregations.includes(selectedAggregation)) {
            setSelectedAggregation(availableAggregations[0]);
        }
    }, [availableAggregations, selectedAggregation]);

    const handleAddCard = () => {
        if (!selectedColumn) return;
        const column = columns.find((c) => c.id === selectedColumn);
        if (!column) return;

        let defaultTitle = `${aggregationLabels[selectedAggregation]} ${column.name}`;
        if (filters.length > 0) {
            const filterDesc = filters
                .map((f) => {
                    const col = columns.find((c) => c.id === f.columnId);
                    return col?.name ?? '';
                })
                .join(',');
            defaultTitle = `${aggregationLabels[selectedAggregation]} (${filterDesc})`;
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
        // Also remove from any groups
        const newGroups = groups.map((g) => ({
            ...g,
            cardIds: g.cardIds.filter((id) => id !== cardId),
        })).filter((g) => g.cardIds.length > 0);
        saveGroups(newGroups);
    };

    const handleCreateGroup = () => {
        if (!groupName || selectedCardsForGroup.length < 2) return;

        const newGroup: StatCardGroup = {
            id: crypto.randomUUID(),
            name: groupName,
            cardIds: selectedCardsForGroup,
        };

        saveGroups([...groups, newGroup]);
        setGroupName('');
        setSelectedCardsForGroup([]);
    };

    const handleRemoveGroup = (groupId: string) => {
        saveGroups(groups.filter((g) => g.id !== groupId));
    };

    const toggleCardSelection = (cardId: string) => {
        setSelectedCardsForGroup((prev) =>
            prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
        );
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = cards.findIndex((c) => c.id === active.id);
            const newIndex = cards.findIndex((c) => c.id === over.id);
            saveCards(arrayMove(cards, oldIndex, newIndex));
        }
    };

    const getColumn = (columnId: string) => columns.find((c) => c.id === columnId);

    // Cards not in any group
    const ungroupedCards = cards.filter((c) => !groups.some((g) => g.cardIds.includes(c.id)));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Configure Stat Cards</DialogTitle>
                    <DialogDescription>
                        Drag cards to reorder. Group similar cards together for compact display.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-3">
                    {/* Current Cards - Draggable */}
                    {cards.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-xs">Cards (drag to reorder)</Label>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext items={cards.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
                                    <div className="flex flex-wrap gap-1.5">
                                        {cards.map((card) => {
                                            const column = getColumn(card.columnId);
                                            const value = column
                                                ? calculateAggregation(drawings, column, card.aggregation, card.filters, columns)
                                                : '-';
                                            const isSelected = selectedCardsForGroup.includes(card.id);
                                            const isInGroup = groups.some((g) => g.cardIds.includes(card.id));

                                            return (
                                                <DraggableCardItem
                                                    key={card.id}
                                                    card={card}
                                                    value={value}
                                                    isSelected={isSelected}
                                                    isInGroup={isInGroup}
                                                    onToggleSelect={() => toggleCardSelection(card.id)}
                                                    onRemove={() => handleRemoveCard(card.id)}
                                                />
                                            );
                                        })}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}

                    {/* Groups */}
                    {groups.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-xs">Groups</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {groups.map((group) => (
                                    <div key={group.id} className="flex items-center gap-1 px-2 py-1 rounded border-2 border-primary/30 bg-primary/10 text-xs">
                                        <Layers className="h-3 w-3 text-primary" />
                                        <span className="font-medium">{group.name}</span>
                                        <Badge variant="secondary" className="h-4 px-1 text-[10px]">{group.cardIds.length}</Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4 text-destructive hover:text-destructive"
                                            onClick={() => handleRemoveGroup(group.id)}
                                        >
                                            <X className="h-2.5 w-2.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Create Group */}
                    {ungroupedCards.length >= 2 && (
                        <div className="space-y-2 pt-2 border-t">
                            <Label className="text-xs">Create Group (select 2+ cards above)</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="Group name"
                                    className="h-7 text-xs flex-1"
                                />
                                <Button
                                    onClick={handleCreateGroup}
                                    disabled={!groupName || selectedCardsForGroup.length < 2}
                                    size="sm"
                                    className="h-7 text-xs"
                                >
                                    <Layers className="h-3 w-3 mr-1" />
                                    Group ({selectedCardsForGroup.length})
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Add New Card */}
                    <div className="space-y-3 pt-3 border-t">
                        <Label className="text-xs">Add New Card</Label>

                        {columns.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No columns. Add columns first.</p>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Column</Label>
                                        <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Select column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {columns.map((column) => (
                                                    <SelectItem key={column.id} value={column.id} className="text-xs">
                                                        {column.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {selectedColumn && (
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">Aggregation</Label>
                                            <Select
                                                value={selectedAggregation}
                                                onValueChange={(v) => setSelectedAggregation(v as AggregationType)}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableAggregations.map((agg) => (
                                                        <SelectItem key={agg} value={agg} className="text-xs">
                                                            {aggregationLabels[agg]}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                {selectedColumn && (
                                    <FilterBuilder
                                        columns={columns}
                                        filters={filters}
                                        onChange={setFilters}
                                    />
                                )}

                                {selectedColumn && (
                                    <Input
                                        value={cardTitle}
                                        onChange={(e) => setCardTitle(e.target.value)}
                                        placeholder="Custom title (optional)"
                                        className="h-8 text-xs"
                                    />
                                )}

                                <Button
                                    onClick={handleAddCard}
                                    disabled={!selectedColumn}
                                    size="sm"
                                    className="w-full h-8 text-xs"
                                >
                                    <Plus className="mr-1 h-3 w-3" />
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

// Draggable card item for configurator
interface DraggableCardItemProps {
    card: StatCardConfig;
    value: string | number;
    isSelected: boolean;
    isInGroup: boolean;
    onToggleSelect: () => void;
    onRemove: () => void;
}

function DraggableCardItem({ card, value, isSelected, isInGroup, onToggleSelect, onRemove }: DraggableCardItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: card.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`inline-flex items-center gap-1 px-1.5 py-1 rounded border text-xs transition-all ${isSelected ? 'border-primary bg-primary/10' : isInGroup ? 'border-primary/30 bg-primary/5' : 'bg-muted/30'
                }`}
        >
            <div className="cursor-move" {...attributes} {...listeners}>
                <GripVertical className="h-3 w-3 text-muted-foreground/50" />
            </div>
            <button
                onClick={onToggleSelect}
                disabled={isInGroup}
                className={`flex items-center gap-1 ${isInGroup ? 'opacity-50' : 'hover:text-primary'}`}
            >
                {card.filters && card.filters.length > 0 && <Filter className="h-2 w-2 text-primary" />}
                <span className="truncate max-w-[80px]">{card.title}</span>
                <span className="font-semibold">{value}</span>
            </button>
            <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 text-destructive hover:text-destructive"
                onClick={onRemove}
            >
                <Trash2 className="h-2.5 w-2.5" />
            </Button>
        </div>
    );
}
