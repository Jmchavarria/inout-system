"use client"

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    SortingState,
    getSortedRowModel,
    ColumnFiltersState,
    getFilteredRowModel,
    VisibilityState,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import React from "react"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    showTotal?: boolean // Nueva prop opcional
    totalField?: string // Campo a sumar (por defecto 'amount')
    headerActions?: React.ReactNode
}

export function DataTable<TData, TValue>({
    columns,
    data,
    showTotal = false,
    totalField = "amount",
    headerActions
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = React.useState("")
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            columnVisibility,
        },
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: "includesString",
        initialState: {
            pagination: {
                pageSize: 4,
            },
        },
    })

    // Calcular total de los datos filtrados
    const calculateTotal = React.useMemo(() => {
        if (!showTotal) return 0

        const filteredData = table.getFilteredRowModel().rows.map(row => row.original)
        return filteredData.reduce((sum, item: any) => {
            const value = item[totalField]
            return sum + (typeof value === 'number' ? value : 0)
        }, 0)
    }, [table.getFilteredRowModel().rows, showTotal, totalField])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(Math.abs(amount));
    }

    return (
        <div>
            <div className="flex gap-2.5 py-4 justify-between">

                <div className="flex flex-1 gap-2.5">

                    <Input
                        placeholder="Buscar..."
                        value={globalFilter ?? ""}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="max-w-sm"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="">
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Prop para que el botón de agregar nuevo dato se alinee con los demás botones del header */}

                {headerActions}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader className="bg-gray-100">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
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
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Fila de total */}
                {showTotal && (
                    <div className="border-t bg-gray-50 px-6 py-3">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-700">
                                Total ({table.getFilteredRowModel().rows.length} registros):
                            </span>
                            <div className="flex gap-4">
                                <span className={`font-bold text-lg ${calculateTotal >= 0 ? "text-green-600" : "text-red-600"
                                    }`}>
                                    {calculateTotal >= 0 ? "+" : ""}{formatCurrency(calculateTotal)}
                                </span>
                                <div className="text-sm text-gray-500">
                                    <div>Ingresos: {formatCurrency(Math.max(calculateTotal, 0))}</div>
                                    <div>Egresos: {formatCurrency(Math.min(calculateTotal, 0))}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-end gap-2 py-4 pr-6 md:pr-8">
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
        </div>
    )
}