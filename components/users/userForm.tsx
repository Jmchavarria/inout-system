"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card, CardHeader, CardTitle, CardContent, Button, Input,
    Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui";

const userSchema = z.object({
    name: z
        .string()
        .min(1, "The name is required")
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name is too long")
        .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/, "Only letters and spaces allowed")
        .trim(),

    role: z
        .string()
        .min(1, "Please select a role")
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
    onSubmit: (data: UserFormData) => void;
    onCancel?: () => void;
    isLoading?: boolean;
    editingUser?: { name: string; role?: string } | null;
}

export default function UserEditForm({
    onSubmit,
    onCancel,
    isLoading = false,
    editingUser = null
}: UserFormProps) {
    const form = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        mode: "onChange",
        defaultValues: {
            name: editingUser?.name || '',
            role: editingUser?.role || ''
        }
    });

    const handleSubmit = (data: UserFormData) => {
        onSubmit(data);
        if (!editingUser) {
            form.reset();
        }
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
                        {editingUser ? "Edit User" : "Create User"}
                    </CardTitle>
                </CardHeader>

                <CardContent className="px-8 pb-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

                            {/* Campo Nombre */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel className="text-sm font-medium text-gray-700">
                                            Name
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter full name"
                                                disabled={isLoading}
                                                className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs text-gray-500">
                                            {form.formState.errors.name && <FormMessage />}
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />

                            {/* Campo Rol */}
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel className="text-sm font-medium text-gray-700">
                                            Role
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="admin">Administrator</SelectItem>
                                                <SelectItem value="manager">Manager</SelectItem>
                                                <SelectItem value="employee">Employee</SelectItem>
                                                <SelectItem value="intern">Intern</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-xs text-gray-500">
                                            {form.formState.errors.role && <FormMessage />}
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />

                            {/* Botones */}
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
                                    className={`${onCancel ? 'flex-1' : 'w-full'} h-11 bg-blue-600 hover:bg-blue-700`}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Processing...
                                        </div>
                                    ) : (
                                        editingUser ? "Update User" : "Create User"
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