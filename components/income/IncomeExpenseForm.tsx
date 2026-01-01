// income/components/IncomeExpenseForm.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { z } from 'zod';

// Zod Schema
const transactionSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) !== 0, {
      message: 'Amount must be a valid number and not zero'
    }),
  concept: z.string()
    .min(3, 'Concept must be at least 3 characters')
    .max(100, 'Concept must be less than 100 characters'),
  date: z.string()
    .min(1, 'Date is required')
    .refine((val) => {
      const date = new Date(val);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Fin del día
      return date <= today;
    }, {
      message: 'Date cannot be in the future'
    })
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface IncomeExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: TransactionFormData) => void | Promise<void>;
}

export const IncomeExpenseForm: React.FC<IncomeExpenseFormProps> = ({ 
  isOpen, 
  onClose,
  onSubmit 
}) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState<TransactionFormData>({
    amount: '',
    concept: '',
    date: today // Fecha de hoy por defecto
  });
  const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof TransactionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = transactionSchema.safeParse(formData);
    
    if (!result.success) {
      const formattedErrors: Partial<Record<keyof TransactionFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          formattedErrors[issue.path[0] as keyof TransactionFormData] = issue.message;
        }
      });
      setErrors(formattedErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(result.data);
      }
      
      // Resetear form y cerrar modal
      setFormData({ amount: '', concept: '', date: today });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      // Aquí puedes manejar el error, por ejemplo mostrando un toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ amount: '', concept: '', date: today });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="p-8 border w-full max-w-md shadow-lg rounded-lg bg-white relative">
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
          disabled={isSubmitting}
        >
          <X className="w-6 h-6" />
        </button>

        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">New Income/Expense</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                id="amount"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                disabled={isSubmitting}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent outline-none transition ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter amount"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* Concept */}
            <div>
              <label htmlFor="concept" className="block text-sm font-medium text-gray-700 mb-1">
                Concept
              </label>
              <input
                type="text"
                id="concept"
                value={formData.concept}
                onChange={(e) => handleInputChange('concept', e.target.value)}
                disabled={isSubmitting}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent outline-none transition ${
                  errors.concept ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter concept"
              />
              {errors.concept && (
                <p className="mt-1 text-sm text-red-600">{errors.concept}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                id="date"
                max={today}
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                disabled={isSubmitting}
                className={`w-full p-2 border rounded-lg outline-none transition
                  [&::-webkit-calendar-picker-indicator]:opacity-40
                  [&::-webkit-calendar-picker-indicator]:hover:opacity-100
                  [&::-webkit-calendar-picker-indicator]:cursor-pointer
                  focus:ring-2 focus:ring-gray-600 focus:border-transparent
                  text-gray-900
                  ${errors.date ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 font-medium rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-gray-600 text-white font-medium rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};