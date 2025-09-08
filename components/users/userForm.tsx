'use client';

import { useEffect } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui';

const userSchema = z.object({
  name: z
    .string()
    .min(1, 'The name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/, 'Only letters and spaces allowed')
    .trim(),
  role: z.string().min(1, 'Please select a role'),
});

export type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  onSubmit: (data: UserFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  editingUser?: { name: string; role?: 'admin' | 'user' } | null;
}

// 🔧 Función auxiliar para obtener valores por defecto
const getDefaultValues = (editingUser: UserFormProps['editingUser']) => ({
  name: editingUser?.name ?? '',
  role: editingUser?.role ?? '',
});

// 🔧 Función auxiliar para obtener el título
const getFormTitle = (editingUser: UserFormProps['editingUser']) =>
  editingUser ? 'Edit User' : 'Create User';

// 🔧 Función auxiliar para obtener el texto del botón
const getSubmitButtonText = (
  isLoading: boolean,
  editingUser: UserFormProps['editingUser']
) => {
  if (isLoading) {
    return (
      <div className='flex items-center'>
        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
        Processing...
      </div>
    );
  }
  return editingUser ? 'Update User' : 'Create User';
};

type RHFForm = UseFormReturn<UserFormData>;

// 🔧 Componente para el campo de nombre (sin any)
const NameField = ({
  form,
  isLoading,
}: {
  form: RHFForm;
  isLoading: boolean;
}) => (
  <FormField
    control={form.control}
    name='name'
    render={({ field }) => (
      <FormItem className='space-y-3'>
        <FormLabel className='text-sm font-medium text-gray-700'>
          Name
        </FormLabel>
        <FormControl>
          <Input
            placeholder='Enter full name'
            disabled={isLoading}
            className='h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500'
            {...field}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

// 🔧 Componente para el campo de rol (sin any)
const RoleField = ({
  form,
  isLoading,
}: {
  form: RHFForm;
  isLoading: boolean;
}) => (
  <FormField
    control={form.control}
    name='role'
    render={({ field }) => (
      <FormItem className='space-y-3'>
        <FormLabel className='text-sm font-medium text-gray-700'>
          Role
        </FormLabel>
        <Select
          value={field.value}
          onValueChange={field.onChange}
          disabled={isLoading}
        >
          <FormControl>
            <SelectTrigger className='h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500'>
              <SelectValue placeholder='Select a role' />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value='admin'>Administrator</SelectItem>
            <SelectItem value='user'>User</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
);

// 🔧 Componente para los botones de acción
const FormActions = ({
  onCancel,
  isLoading,
  isFormValid,
  editingUser,
}: {
  onCancel?: () => void;
  isLoading: boolean;
  isFormValid: boolean;
  editingUser: UserFormProps['editingUser'];
}) => (
  <div className='flex gap-3 pt-6'>
    {onCancel && (
      <Button
        type='button'
        variant='outline'
        onClick={onCancel}
        disabled={isLoading}
        className='flex-1 h-11 border-gray-200 hover:bg-gray-50 text-gray-700'
      >
        Cancel
      </Button>
    )}
    <Button
      type='submit'
      disabled={isLoading || !isFormValid}
      className={`${onCancel ? 'flex-1' : 'w-full'} h-11`}
    >
      {getSubmitButtonText(isLoading, editingUser)}
    </Button>
  </div>
);

export default function UserEditForm({
  onSubmit,
  onCancel,
  isLoading = false,
  editingUser = null,
}: UserFormProps) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    mode: 'onChange',
    defaultValues: getDefaultValues(editingUser),
  });

  // 🔁 Efecto para resetear el formulario cuando cambia el usuario
  useEffect(() => {
    form.reset(getDefaultValues(editingUser));
  }, [editingUser, form]);

  // 🔧 Handler para envío del formulario
  const handleSubmit = (data: UserFormData) => {
    onSubmit(data);
    if (!editingUser) {
      form.reset({ name: '', role: '' });
    }
  };

  // 🔧 Handler para cancelar
  const handleCancel = () => {
    form.reset(getDefaultValues(editingUser));
    onCancel?.();
  };

  return (
    <div className='w-full max-w-xl mx-auto'>
      <Card className='border-0 shadow-lg'>
        <CardHeader className='pb-6'>
          <CardTitle className='text-2xl font-bold text-center text-gray-900'>
            {getFormTitle(editingUser)}
          </CardTitle>
        </CardHeader>

        <CardContent className='px-8 pb-8'>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className='space-y-6'
            >
              <NameField form={form} isLoading={isLoading} />
              <RoleField form={form} isLoading={isLoading} />
              <FormActions
                onCancel={handleCancel}
                isLoading={isLoading}
                isFormValid={form.formState.isValid}
                editingUser={editingUser}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
