"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Income = {
    id: string
    concept: string
    amount: number // + ingreso, - egreso
    date: string // YYYY-MM-DD
    user: { id: string; name: string; email: string }
}

export const columns: ColumnDef<Income>[] = [
    {
        accessorKey: "concept",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Concept
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },

    },
    {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => {
            const amount = row.getValue("amount") as number
            return (
                <span className={amount >= 0 ? "text-green-600" : "text-red-600"}>
                    {amount >= 0 ? `+${amount}` : amount}
                </span>
            )
        },
    },
    {
        accessorKey: "date",
        header: "Date",
    },
    {
        accessorFn: (row) => `${row.user.name} ${row.user.email}`, 
        id: "user",
        header: "User",
        cell: ({ row }) => {
            const user = row.original.user
            return (
                <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                </div>
            )
        },
    },
    {
        id: "action",
        header: "Action",
        cell: ({ row }) => {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => console.log("Edit", row.original)}>
                            Edit
                        </DropdownMenuItem>
                        {/* <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => console.log("Delete", row.original)}
                        >
                            Delete
                        </DropdownMenuItem> */}
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
