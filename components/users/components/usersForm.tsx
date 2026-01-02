// users/components/UserForm.tsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

import { userSchema, type UserFormData } from '@/components/users/validators/user.validators';
import { mapZodErrors } from '@/components/income/utils/mapZodErrors';

interface UserFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: (data: UserFormData) => void | Promise<void>;
    initialData?: Partial<UserFormData>; // 👈 para editar
}

export const UserForm: React.FC<UserFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData
}) => {
    const [formData, setFormData] = useState<UserFormData>({
        name: '',
        role: 'user'
    });

    const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 🔁 Cargar datos cuando es edición
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name ?? '',
                role: initialData.role ?? 'user'
            });
        }
    }, [initialData]);

    const handleChange = (field: keyof UserFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value as any }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = userSchema.safeParse(formData);

        if (!result.success) {
            setErrors(mapZodErrors<UserFormData>(result.error));
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit?.(result.data);
            setErrors({});
            onClose();
        } catch (err) {
            console.error('Error submitting user form:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="p-8 w-full max-w-md bg-white rounded-lg shadow-lg relative">
                <button
                    onClick={handleCancel}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                    disabled={isSubmitting}
                >
                    <X className="w-6 h-6" />
                </button>

                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    {initialData ? 'Edit User' : 'New User'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            disabled={isSubmitting}
                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-gray-600 transition ${errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Enter name"
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => handleChange('role', e.target.value)}
                            disabled={isSubmitting}
                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-gray-600 transition ${errors.role ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                        {errors.role && (
                            <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
                        >
                            {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
