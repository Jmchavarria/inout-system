"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const transactionSchema = z.object({
    concept: z
        .string()
        .min(1, "The concept is required")
        .min(3, "Minimum 3 characters")
        .max(100, "Maximum 100 characters")
        .trim(),

    amount: z
        .string()
        .min(1, "The amount is required")
        .regex(/^-?\d+(\.\d{1,2})?$/, "Enter a valid number")
        .refine((val) => {
            const num = parseFloat(val);
            return !isNaN(num) && num !== 0;
        }, "Amount cannot be zero")
        .refine((val) => {
            const num = parseFloat(val);
            return Math.abs(num) <= 999999999;
        }, "Amount too large"),

    date: z
        .string()
        .min(1, "The date is required")
        .refine((val) => {
            const selectedDate = new Date(val);
            const today = new Date();
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(today.getFullYear() - 1);

            return selectedDate <= today && selectedDate >= oneYearAgo;
        }, "Date must be within the last year and not in the future")
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface NewTransactionFormProps {
    onSubmit: (data: TransactionFormData) => void;
    onCancel?: () => void;
    isLoading?: boolean;
}

export default function NewTransactionForm({
    onSubmit,
    onCancel,
    isLoading = false
}: NewTransactionFormProps) {
    const form = useForm<TransactionFormData>({
        resolver: zodResolver(transactionSchema),
        mode: "onChange",
        defaultValues: {
            amount: '',
            concept: '',
            date: new Date().toISOString().split('T')[0]
        }
    });

    const handleSubmit = (data: TransactionFormData) => {
        onSubmit(data);
        form.reset();
    };

    const handleCancel = () => {
        form.reset();
        onCancel?.();
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            <Card className="border-0 shadow-lg">
                <CardHeader className="pb-6">
                    <CardTitle className="text-2xl font-bold text-center text-gray-900">
                        New Transaction
                    </CardTitle>
                </CardHeader>
                
                <CardContent className="px-8 pb-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                            
                            <FormField
                                control={form.control}
                                name="concept"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel className="text-sm font-medium text-gray-700">
                                            Concept
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Product sale, office supplies, consulting fee..."
                                                disabled={isLoading}
                                                className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs text-gray-500">
                                            {form.formState.errors.concept ? (
                                                <FormMessage />
                                            ) : (
                                                "Briefly describe the transaction (3-100 characters)"
                                            )}
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel className="text-sm font-medium text-gray-700">
                                            Amount
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                placeholder="850000 or -320000"
                                                disabled={isLoading}
                                                className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 font-mono"
                                                {...field}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^-0-9.]/g, '');
                                                    field.onChange(value);
                                                }}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs text-gray-500">
                                            {form.formState.errors.amount ? (
                                                <FormMessage />
                                            ) : (
                                                "Positive for income, negative for expenses. Cannot be zero"
                                            )}
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel className="text-sm font-medium text-gray-700">
                                            Date
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                disabled={isLoading}
                                                className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                                max={new Date().toISOString().split('T')[0]}
                                                min={new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0]}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs text-gray-500">
                                            {form.formState.errors.date ? (
                                                <FormMessage />
                                            ) : (
                                                "Transaction date (within the last year)"
                                            )}
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />

                            <div className="flex gap-3 pt-6">
                                {onCancel && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCancel}
                                        disabled={isLoading}
                                        className="flex-1 h-11 border-gray-200 hover:bg-gray-50 text-gray-700"
                                    >
                                        Cancel
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    disabled={isLoading || !form.formState.isValid}
                                    className={`${onCancel ? 'flex-1' : 'w-full'} h-11 `}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Processing...
                                        </div>
                                    ) : (
                                        "Create transaction"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}