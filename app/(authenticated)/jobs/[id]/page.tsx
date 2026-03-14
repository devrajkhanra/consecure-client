'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Plus,
    Briefcase,
    MapPin,
    Table2,
    Settings2,
    MoreVertical,
    BarChart3,
    FileSpreadsheet,
    ChevronDown,
    ChevronRight,
    Info,
    Link2,
    Package,
    Import,
    Component,
    Network,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useJob, useUpdateJob, useDeleteJob } from '@/hooks/use-jobs';
import { useDrawingColumns } from '@/hooks/use-drawing-columns';
import { useDrawings, useCreateDrawing, useUpdateDrawing, useDeleteDrawing, useBulkCreateDrawings } from '@/hooks/use-drawings';
import { JobForm } from '@/components/jobs/job-form';
import { ColumnManager } from '@/components/drawings/column-manager';
import { MaterialColumnManager } from '@/components/materials/material-column-manager';
import { DrawingTable } from '@/components/drawings/drawing-table';
import { DrawingForm } from '@/components/drawings/drawing-form';
import { JobStatCards, StatCardConfigurator } from '@/components/jobs/stat-cards';
import { ExcelUploadDialog } from '@/components/drawings/excel-upload';
import { MaterialExcelUploadDialog } from '@/components/materials/material-excel-upload';
import { useMaterialColumns } from '@/hooks/use-material-columns';
import { useJobMaterials } from '@/hooks/use-materials';
import { SpoolTable } from '@/components/spools/spool-table';
import { ConnectionTable } from '@/components/drawing-connections/connection-table';
import { JobMaterialsTable } from '@/components/materials/job-materials-table';
import { JobJointsTable } from '@/components/joints/job-joints-table';
import { JobSpoolsTable } from '@/components/spools/job-spools-table';
import { JointTable } from '@/components/joints/joint-table';
import type { CreateJobDto, Drawing, CreateDrawingDto } from '@/types';

// Local storage key for info collapse state
function getInfoCollapseKey(jobId: string) {
    return `job-info-collapsed-${jobId}`;
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { data: job, isLoading: jobLoading, error } = useJob(id);
    const { data: columns, isLoading: columnsLoading } = useDrawingColumns(id);
    const { data: drawings, isLoading: drawingsLoading } = useDrawings(id);
    const { data: materialColumns } = useMaterialColumns(id);
    const { data: jobMaterials } = useJobMaterials(id);
    const updateJob = useUpdateJob();
    const deleteJob = useDeleteJob();
    const createDrawing = useCreateDrawing();
    const updateDrawing = useUpdateDrawing();
    const deleteDrawing = useDeleteDrawing();
    const bulkCreateDrawings = useBulkCreateDrawings();

    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);
    const [isStatConfigOpen, setIsStatConfigOpen] = useState(false);
    const [isAddingDrawing, setIsAddingDrawing] = useState(false);
    const [isExcelUploadOpen, setIsExcelUploadOpen] = useState(false);
    const [editingDrawing, setEditingDrawing] = useState<Drawing | null>(null);
    const [deletingDrawing, setDeletingDrawing] = useState<Drawing | null>(null);
    const [isMaterialColumnConfigOpen, setIsMaterialColumnConfigOpen] = useState(false);
    const [isMaterialExcelOpen, setIsMaterialExcelOpen] = useState(false);
    const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState<'drawings' | 'materials' | 'joints' | 'spools' | 'connections'>('drawings');

    // Load info collapse state
    useEffect(() => {
        const collapsed = localStorage.getItem(getInfoCollapseKey(id));
        setIsInfoCollapsed(collapsed === 'true');
    }, [id]);

    const toggleInfoCollapse = () => {
        const newState = !isInfoCollapsed;
        setIsInfoCollapsed(newState);
        localStorage.setItem(getInfoCollapseKey(id), String(newState));
    };

    const handleUpdate = async (data: CreateJobDto) => {
        try {
            await updateJob.mutateAsync({ id, dto: data });
            toast.success('Job updated successfully');
            setIsEditing(false);
        } catch (error) {
            toast.error('Failed to update job');
            console.error(error);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteJob.mutateAsync(id);
            toast.success('Job deleted successfully');
            router.push('/jobs');
        } catch (error) {
            toast.error('Failed to delete job');
            console.error(error);
        }
    };

    const handleCreateDrawing = async (data: CreateDrawingDto) => {
        try {
            await createDrawing.mutateAsync({ jobId: id, dto: data });
            toast.success('Drawing created successfully');
            setIsAddingDrawing(false);
        } catch (error) {
            toast.error('Failed to create drawing');
            console.error(error);
        }
    };

    const handleUpdateDrawing = async (data: CreateDrawingDto) => {
        if (!editingDrawing) return;
        try {
            await updateDrawing.mutateAsync({ jobId: id, drawingId: editingDrawing.id, dto: data });
            toast.success('Drawing updated successfully');
            setEditingDrawing(null);
        } catch (error) {
            toast.error('Failed to update drawing');
            console.error(error);
        }
    };

    const handleDeleteDrawing = async () => {
        if (!deletingDrawing) return;
        try {
            await deleteDrawing.mutateAsync({ jobId: id, drawingId: deletingDrawing.id });
            toast.success('Drawing deleted successfully');
            setDeletingDrawing(null);
        } catch (error) {
            toast.error('Failed to delete drawing');
            console.error(error);
        }
    };

    const handleBulkImport = async (drawings: Record<string, unknown>[]) => {
        await bulkCreateDrawings.mutateAsync({ jobId: id, drawings });
    };

    if (jobLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-[150px] w-full" />
                <Skeleton className="h-[300px] w-full" />
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="text-center">
                    <h2 className="text-lg font-semibold">Job not found</h2>
                    <p className="text-muted-foreground mb-4">The job you&apos;re looking for doesn&apos;t exist</p>
                    <Button asChild>
                        <Link href="/jobs">Back to Jobs</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/jobs">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{job.name}</h1>
                        {job.description && (
                            <p className="text-muted-foreground">{job.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Job
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsColumnConfigOpen(true)}>
                                <Settings2 className="mr-2 h-4 w-4" />
                                Configure Columns
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsMaterialColumnConfigOpen(true)}>
                                <Package className="mr-2 h-4 w-4" />
                                Configure Materials
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsStatConfigOpen(true)}>
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Configure Stats
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setIsDeleting(true)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Job
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Job Info - Compact & Collapsible */}
            <Collapsible open={!isInfoCollapsed} onOpenChange={toggleInfoCollapse}>
                <div className="flex items-center gap-2 mb-1">
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 px-1.5 gap-1">
                            {isInfoCollapsed ? (
                                <ChevronRight className="h-3.5 w-3.5" />
                            ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                            )}
                            <span className="text-xs font-medium text-muted-foreground">Info</span>
                        </Button>
                    </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                    <div className="flex flex-wrap gap-1.5">
                        <Link
                            href={`/sites/${job.siteId}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm hover:shadow-sm transition-all"
                            style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}
                        >
                            <MapPin className="h-3 w-3" style={{ color: '#3b82f6' }} />
                            <span className="text-xs" style={{ color: '#3b82f6' }}>Site:</span>
                            <span className="font-semibold truncate max-w-[120px]">{job.site?.name ?? 'View'}</span>
                        </Link>
                        <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm"
                            style={{ backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe' }}
                        >
                            <Table2 className="h-3 w-3" style={{ color: '#8b5cf6' }} />
                            <span className="text-xs" style={{ color: '#8b5cf6' }}>Columns:</span>
                            <span className="font-semibold">{columns?.length ?? 0}</span>
                        </div>
                        <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm"
                            style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}
                        >
                            <Briefcase className="h-3 w-3" style={{ color: '#10b981' }} />
                            <span className="text-xs" style={{ color: '#10b981' }}>Drawings:</span>
                            <span className="font-semibold">{drawings?.length ?? 0}</span>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>

            {/* Custom Stat Cards */}
            {(columns?.length ?? 0) > 0 && (
                <JobStatCards
                    jobId={id}
                    columns={columns ?? []}
                    drawings={drawings ?? []}
                    onConfigureClick={() => setIsStatConfigOpen(true)}
                />
            )}

            {/* Unified Toolbar: Tabs + Context Actions */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Tab Pills */}
                <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
                    <button
                        onClick={() => setActiveTab('drawings')}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                            activeTab === 'drawings'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Table2 className="h-3.5 w-3.5" />
                        Drawings
                        <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            activeTab === 'drawings' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>{drawings?.length ?? 0}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('materials')}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                            activeTab === 'materials'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Package className="h-3.5 w-3.5" />
                        Materials
                        <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            activeTab === 'materials' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>{jobMaterials?.length ?? 0}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('joints')}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                            activeTab === 'joints'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Link2 className="h-3.5 w-3.5" />
                        Joints
                    </button>
                    <button
                        onClick={() => setActiveTab('spools')}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                            activeTab === 'spools'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Component className="h-3.5 w-3.5" />
                        Spools
                    </button>
                    <button
                        onClick={() => setActiveTab('connections')}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                            activeTab === 'connections'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Network className="h-3.5 w-3.5" />
                        Connections
                    </button>
                </div>

                {/* Context-Sensitive Actions */}
                {activeTab === 'drawings' && (
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!columns || columns.length === 0}
                                >
                                    <Import className="mr-2 h-4 w-4" />
                                    Import
                                    <ChevronDown className="ml-1 h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => setIsExcelUploadOpen(true)}
                                    disabled={!columns || columns.length === 0}
                                >
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Import Drawings
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setIsMaterialExcelOpen(true)}
                                    disabled={!columns || columns.length === 0 || !materialColumns || materialColumns.length === 0}
                                >
                                    <Package className="mr-2 h-4 w-4" />
                                    Import Materials
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            size="sm"
                            onClick={() => setIsAddingDrawing(true)}
                            disabled={!columns || columns.length === 0}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Drawing
                        </Button>
                    </div>
                )}
            </div>

            {/* Tab Content */}
            {activeTab === 'drawings' ? (
                <div>
                    {drawingsLoading || columnsLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : columns && columns.length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-muted-foreground">
                            <Settings2 className="h-8 w-8 text-muted-foreground/50" />
                            <p>No columns configured yet</p>
                            <Button variant="outline" size="sm" onClick={() => setIsColumnConfigOpen(true)}>
                                Configure Columns
                            </Button>
                        </div>
                    ) : (
                        <DrawingTable
                            jobId={id}
                            drawings={drawings ?? []}
                            columns={columns ?? []}
                            onEdit={(drawing) => setEditingDrawing(drawing)}
                            onDelete={(drawing) => setDeletingDrawing(drawing)}
                        />
                    )}
                </div>
            ) : activeTab === 'materials' ? (
                <JobMaterialsTable jobId={id} />
            ) : activeTab === 'joints' ? (
                <JobJointsTable jobId={id} />
            ) : activeTab === 'spools' ? (
                <JobSpoolsTable jobId={id} />
            ) : activeTab === 'connections' ? (
                <div className="rounded-md border bg-card/50 p-4">
                    <ConnectionTable drawings={drawings ?? []} drawingColumns={columns ?? []} jobId={id} />
                </div>
            ) : null}

            {/* Column Configuration Modal */}
            <Dialog open={isColumnConfigOpen} onOpenChange={setIsColumnConfigOpen}>
                <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle>Column Configuration</DialogTitle>
                        <DialogDescription>
                            Define the structure for your drawing list
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">
                        <ColumnManager jobId={id} />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Material Column Configuration Modal */}
            <Dialog open={isMaterialColumnConfigOpen} onOpenChange={setIsMaterialColumnConfigOpen}>
                <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle>Material Column Configuration</DialogTitle>
                        <DialogDescription>
                            Define the structure for your material list
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">
                        <MaterialColumnManager jobId={id} />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Job Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Job</DialogTitle>
                        <DialogDescription>Update the job details</DialogDescription>
                    </DialogHeader>
                    <JobForm
                        job={job}
                        onSubmit={handleUpdate}
                        isLoading={updateJob.isPending}
                        onCancel={() => setIsEditing(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Job Confirmation */}
            <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Job</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{job.name}&quot;? This will also delete
                            all associated columns and drawings.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteJob.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Add Drawing Dialog */}
            <Dialog open={isAddingDrawing} onOpenChange={setIsAddingDrawing}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add Drawing</DialogTitle>
                        <DialogDescription>Add a new drawing entry</DialogDescription>
                    </DialogHeader>
                    <DrawingForm
                        columns={columns ?? []}
                        onSubmit={handleCreateDrawing}
                        isLoading={createDrawing.isPending}
                        onCancel={() => setIsAddingDrawing(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Drawing Dialog */}
            <Dialog open={!!editingDrawing} onOpenChange={() => setEditingDrawing(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Drawing</DialogTitle>
                        <DialogDescription>Update the drawing details</DialogDescription>
                    </DialogHeader>
                    {editingDrawing && (
                        <DrawingForm
                            columns={columns ?? []}
                            drawing={editingDrawing}
                            onSubmit={handleUpdateDrawing}
                            isLoading={updateDrawing.isPending}
                            onCancel={() => setEditingDrawing(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Drawing Confirmation */}
            <AlertDialog open={!!deletingDrawing} onOpenChange={() => setDeletingDrawing(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Drawing</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this drawing? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteDrawing}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteDrawing.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Stat Cards Configurator */}
            <StatCardConfigurator
                jobId={id}
                columns={columns ?? []}
                drawings={drawings ?? []}
                open={isStatConfigOpen}
                onOpenChange={setIsStatConfigOpen}
            />

            {/* Excel Upload Dialog */}
            <ExcelUploadDialog
                jobId={id}
                columns={columns ?? []}
                open={isExcelUploadOpen}
                onOpenChange={setIsExcelUploadOpen}
                onImport={handleBulkImport}
            />

            {/* Material Excel Upload Dialog */}
            <MaterialExcelUploadDialog
                jobId={id}
                drawings={drawings ?? []}
                drawingColumns={columns ?? []}
                materialColumns={materialColumns ?? []}
                open={isMaterialExcelOpen}
                onOpenChange={setIsMaterialExcelOpen}
            />
        </div>
    );
}
