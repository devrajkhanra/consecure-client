'use client';

import { useState } from 'react';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    SortingState,
    ColumnFiltersState,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2, Eye, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Project } from '@/types';
import { ProjectStatus } from '@/types';

interface ProjectTableProps {
    data: Project[];
    onEdit: (project: Project) => void;
    onDelete: (project: Project) => void;
}

const statusVariants: Record<ProjectStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    [ProjectStatus.BACKLOG]: 'secondary',
    [ProjectStatus.IN_PROGRESS]: 'default',
    [ProjectStatus.COMPLETED]: 'outline',
    [ProjectStatus.ON_HOLD]: 'destructive',
};

const statusLabels: Record<ProjectStatus, string> = {
    [ProjectStatus.BACKLOG]: 'Backlog',
    [ProjectStatus.IN_PROGRESS]: 'In Progress',
    [ProjectStatus.COMPLETED]: 'Completed',
    [ProjectStatus.ON_HOLD]: 'On Hold',
};

export function ProjectTable({ data, onEdit, onDelete }: ProjectTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const columns: ColumnDef<Project>[] = [
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="-ml-4"
                >
                    Project Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <Link
                    href={`/projects/${row.original.id}`}
                    className="font-medium hover:underline"
                >
                    {row.getValue('name')}
                </Link>
            ),
        },
        {
            accessorKey: 'workOrderNumber',
            header: 'Work Order',
            cell: ({ row }) => (
                <span className="font-mono text-sm">{row.getValue('workOrderNumber')}</span>
            ),
        },
        {
            accessorKey: 'clientName',
            header: 'Client',
        },
        {
            accessorKey: 'location',
            header: 'Location',
            cell: ({ row }) => (
                <span className="max-w-[200px] truncate">{row.getValue('location')}</span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.getValue('status') as ProjectStatus;
                return (
                    <Badge variant={statusVariants[status]}>
                        {statusLabels[status]}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'startDate',
            header: 'Start Date',
            cell: ({ row }) => format(new Date(row.getValue('startDate')), 'MMM d, yyyy'),
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const project = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/projects/${project.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(project)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete(project)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        state: {
            sorting,
            columnFilters,
        },
    });

    return (
        <div className="space-y-4">
            <Input
                placeholder="Filter projects..."
                value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                    table.getColumn('name')?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
            />
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No projects found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
