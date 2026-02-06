'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
    History,
    Plus,
    Pencil,
    Trash2,
    GitMerge,
    GitBranch,
    ChevronDown,
    ChevronUp,
    User,
    Pause,
    ArrowUp,
    RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useDrawingChangeHistory, useJobChangeHistory } from '@/hooks/use-drawing-change-history';
import { ChangeType, type DrawingChangeHistory, type DrawingColumn } from '@/types';

// Icon and color mapping for change types
const changeTypeConfig: Record<ChangeType, { icon: React.ElementType; color: string; label: string }> = {
    [ChangeType.CREATED]: { icon: Plus, color: 'bg-green-500', label: 'Created' },
    [ChangeType.UPDATED]: { icon: Pencil, color: 'bg-blue-500', label: 'Updated' },
    [ChangeType.MERGED]: { icon: GitMerge, color: 'bg-purple-500', label: 'Merged' },
    [ChangeType.SPLIT]: { icon: GitBranch, color: 'bg-orange-500', label: 'Split' },
    [ChangeType.STOPPED]: { icon: Pause, color: 'bg-yellow-500', label: 'Stopped' },
    [ChangeType.REMOVED]: { icon: Trash2, color: 'bg-red-500', label: 'Removed' },
    [ChangeType.UPGRADED]: { icon: ArrowUp, color: 'bg-cyan-500', label: 'Upgraded' },
    [ChangeType.RESTORED]: { icon: RotateCcw, color: 'bg-emerald-500', label: 'Restored' },
};

interface ChangeHistoryItemProps {
    history: DrawingChangeHistory;
    columns?: DrawingColumn[];
}

function ChangeHistoryItem({ history, columns }: ChangeHistoryItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    const config = changeTypeConfig[history.changeType] || { icon: History, color: 'bg-gray-500', label: history.changeType };
    const Icon = config.icon;

    const hasDetails = history.previousData || history.newData || history.reason || history.relatedDrawingIds?.length;

    // Get column name by key
    const getColumnLabel = (key: string) => {
        const column = columns?.find((c) => c.name === key);
        return column?.name ?? key;
    };

    // Compare and get changed fields
    const getChangedFields = () => {
        if (!history.previousData || !history.newData) return [];

        const changes: { field: string; from: unknown; to: unknown }[] = [];
        const allKeys = new Set([
            ...Object.keys(history.previousData),
            ...Object.keys(history.newData),
        ]);

        allKeys.forEach((key) => {
            const prev = history.previousData?.[key];
            const next = history.newData?.[key];
            if (JSON.stringify(prev) !== JSON.stringify(next)) {
                changes.push({ field: key, from: prev, to: next });
            }
        });

        return changes;
    };

    const changedFields = getChangedFields();

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
                {/* Icon */}
                <div className={`p-2 rounded-full ${config.color} text-white flex-shrink-0`}>
                    <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">{config.label}</Badge>
                            {history.changedBy && (
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {history.changedBy}
                                </span>
                            )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {format(new Date(history.createdAt), 'MMM d, yyyy h:mm a')}
                        </span>
                    </div>

                    {history.reason && (
                        <p className="text-sm text-muted-foreground mt-1">{history.reason}</p>
                    )}

                    {/* Expandable details */}
                    {hasDetails && (
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="mt-2 h-7 px-2">
                                {isOpen ? (
                                    <>
                                        <ChevronUp className="h-4 w-4 mr-1" />
                                        Hide Details
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-4 w-4 mr-1" />
                                        Show Details
                                    </>
                                )}
                            </Button>
                        </CollapsibleTrigger>
                    )}

                    <CollapsibleContent>
                        <div className="mt-3 space-y-3">
                            {/* Show changed fields for UPDATED */}
                            {changedFields.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Changes:</p>
                                    <div className="space-y-1">
                                        {changedFields.map((change) => (
                                            <div
                                                key={change.field}
                                                className="text-sm bg-muted/50 rounded p-2"
                                            >
                                                <span className="font-medium">{getColumnLabel(change.field)}:</span>
                                                <span className="text-red-600 line-through ml-2">
                                                    {String(change.from ?? '(empty)')}
                                                </span>
                                                <span className="mx-2">→</span>
                                                <span className="text-green-600">
                                                    {String(change.to ?? '(empty)')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Show new data for CREATED */}
                            {history.changeType === ChangeType.CREATED && history.newData && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Initial Data:</p>
                                    <div className="text-sm bg-muted/50 rounded p-2">
                                        {Object.entries(history.newData).map(([key, value]) => (
                                            <div key={key}>
                                                <span className="font-medium">{getColumnLabel(key)}:</span>{' '}
                                                {String(value)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Related drawings for MERGE/SPLIT */}
                            {history.relatedDrawingIds && history.relatedDrawingIds.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Related Drawings:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {history.relatedDrawingIds.map((id) => (
                                            <Badge key={id} variant="secondary" className="text-xs">
                                                {id.substring(0, 8)}...
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CollapsibleContent>
                </div>
            </div>
        </Collapsible>
    );
}

interface DrawingHistoryDialogProps {
    jobId: string;
    drawingId: string;
    columns?: DrawingColumn[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DrawingHistoryDialog({
    jobId,
    drawingId,
    columns,
    open,
    onOpenChange,
}: DrawingHistoryDialogProps) {
    const { data: history, isLoading } = useDrawingChangeHistory(jobId, drawingId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Change History
                    </DialogTitle>
                    <DialogDescription>
                        View all changes made to this drawing
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-1/3" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : history && history.length > 0 ? (
                        <div>
                            {history.map((item) => (
                                <ChangeHistoryItem key={item.id} history={item} columns={columns} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No change history available</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

interface JobHistoryCardProps {
    jobId: string;
    columns?: DrawingColumn[];
    filterType?: string;
}

export function JobHistoryCard({ jobId, columns, filterType }: JobHistoryCardProps) {
    const { data: history, isLoading } = useJobChangeHistory(jobId, filterType);
    const [showAll, setShowAll] = useState(false);

    const displayHistory = showAll ? history : history?.slice(0, 5);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Recent Activity
                </CardTitle>
                <CardDescription>Recent changes to drawings in this job</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : displayHistory && displayHistory.length > 0 ? (
                    <>
                        <div>
                            {displayHistory.map((item) => (
                                <ChangeHistoryItem key={item.id} history={item} columns={columns} />
                            ))}
                        </div>
                        {history && history.length > 5 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAll(!showAll)}
                                className="w-full mt-4"
                            >
                                {showAll ? 'Show Less' : `Show All (${history.length})`}
                            </Button>
                        )}
                    </>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No activity yet</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
