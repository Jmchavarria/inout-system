// components/screens/IncomeAndExpenses.tsx
'use client'; // Directiva de Next.js 13+ para componentes del cliente

// Importaciones de React hooks necesarios
import { useEffect, useMemo, useState } from 'react';
// Importación de íconos de Lucide React
import { Plus } from 'lucide-react';
// Importación del componente de tabla de datos personalizado
import { DataTable } from '@/components/dataTable';
// Importación de componentes relacionados con transacciones/ingresos
import { NewTransactionForm, columns, type Income } from '@/components/income';
// Importación del componente Button personalizado
import { Button } from '@/components/ui';

// ============================================================================
// DEFINICIÓN DE TIPOS
// ============================================================================

// Tipo para los datos del formulario de nueva transacción
type FormData = { 
  concept: string;  // Concepto de la transacción
  amount: string;   // Monto como string (viene del input)
  date: string;     // Fecha en formato string
};

// Tipo para los roles de usuario en el sistema
type Role = 'admin' | 'user';

// Tipo de respuesta de la API /me para obtener el rol del usuario
type MeResponse = { role: Role };

// Tipo para los datos de transacción que vienen de la API
type IncomeApi = {
  id: string | number;                    // ID único de la transacción
  concept?: string | null;                // Concepto/descripción (opcional)
  amount?: number | string | null;        // Monto (puede ser número o string)
  date?: string | null;                   // Fecha (opcional)
  user?: {                                // Información del usuario (opcional)
    id?: string | number | null;
    name?: string | null;
    email?: string | null;
  } | null;
};

// Tipo de respuesta para la lista de transacciones
type IncomeListResponse = { items: IncomeApi[] };

// Tipo de respuesta para crear una nueva transacción
type CreateIncomeResponse = IncomeApi;

// ============================================================================
// FUNCIONES HELPER PARA NORMALIZACIÓN DE DATOS
// ============================================================================

// Normaliza strings que pueden ser null/undefined a string vacío
const normalizeString = (value: string | null | undefined): string => {
  return value ?? ''; // Operador nullish coalescing - retorna '' si value es null/undefined
};

// Normaliza números que pueden venir como string, null o undefined
const normalizeNumber = (value: number | string | null | undefined): number => {
  return Number(value ?? 0); // Convierte a número, usa 0 como fallback
};

// Normaliza fechas extrayendo solo la parte YYYY-MM-DD
const normalizeDate = (date: string | null | undefined): string => {
  return (date ?? '').slice(0, 10); // Toma solo los primeros 10 caracteres (fecha)
};

// Normaliza la información del usuario
const normalizeUser = (user: IncomeApi['user']) => ({
  id: String(user?.id ?? ''),           // Convierte ID a string
  name: normalizeString(user?.name),    // Normaliza nombre
  email: normalizeString(user?.email),  // Normaliza email
});

// Función principal que normaliza una transacción de la API al formato interno
function normalizeIncome(t: IncomeApi): Income {
  return {
    id: String(t.id ?? ''),               // ID como string
    concept: normalizeString(t.concept),  // Concepto normalizado
    amount: normalizeNumber(t.amount),    // Monto como número
    date: normalizeDate(t.date),          // Fecha normalizada
    user: normalizeUser(t.user),          // Usuario normalizado
  };
}

// ============================================================================
// FUNCIÓN HELPER PARA PETICIONES HTTP
// ============================================================================

// Función genérica para hacer peticiones HTTP con manejo de errores
async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  // Si la respuesta no es exitosa (status 200-299)
  if (!response.ok) {
    let message = `HTTP ${response.status}`; // Mensaje por defecto
    
    try {
      // Intenta extraer el mensaje de error del JSON de respuesta
      const errorData = (await response.json()) as { error?: string };
      if (errorData?.error) message = errorData.error;
    } catch {
      // Si no puede parsear el JSON de error, usa el mensaje por defecto
    }
    throw new Error(message);
  }

  // Convierte la respuesta a JSON y retorna con el tipo especificado
  return (await response.json()) as T;
}

// ============================================================================
// HOOKS PERSONALIZADOS
// ============================================================================

// Hook para obtener y manejar el rol del usuario actual
const useUserRole = () => {
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    // Controlador para cancelar la petición si el componente se desmonta
    const abortController = new AbortController();

    const fetchUserRole = async () => {
      try {
        // Hace petición a la API /me para obtener información del usuario
        const data = await fetchJSON<MeResponse>('/api/me', {
          signal: abortController.signal, // Permite cancelar la petición
        });
        setRole(data.role); // Establece el rol obtenido
      } catch {
        // Si hay error, asigna rol de usuario por defecto
        setRole('user');
      }
    };

    fetchUserRole(); // Ejecuta la función
    
    // Cleanup: cancela la petición si el componente se desmonta
    return () => abortController.abort();
  }, []); // Se ejecuta solo una vez al montar el componente

  return role; // Retorna el rol actual
};

// Hook para manejar la carga y estado de las transacciones
const useTransactions = () => {
  const [isLoading, setIsLoading] = useState(true);     // Estado de carga
  const [items, setItems] = useState<Income[]>([]);     // Lista de transacciones
  const [error, setError] = useState<string | null>(null); // Estado de error

  // Función para cargar transacciones desde la API
  const loadTransactions = async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);   // Inicia estado de carga
      setError(null);       // Limpia errores previos

      // Hace petición a la API de transacciones
      const data = await fetchJSON<IncomeListResponse>('/api/income', {
        signal, // Permite cancelar la petición
      });
      
      // Normaliza todas las transacciones recibidas
      const normalizedItems = data.items.map(normalizeIncome);
      setItems(normalizedItems); // Actualiza el estado con las transacciones
      
    } catch (e: unknown) {
      // Si es una cancelación explícita, no hacer nada
      if (e instanceof DOMException && e.name === 'AbortError') return;
      
      // Para otros errores, establecer mensaje de error
      setError('No se pudieron cargar las transacciones');
    } finally {
      // Solo actualizar loading si la petición no fue cancelada
      if (!signal?.aborted) setIsLoading(false);
    }
  };

  useEffect(() => {
    // Controlador para cancelar la petición
    const abortController = new AbortController();
    loadTransactions(abortController.signal); // Carga inicial de datos
    
    // Cleanup: cancela la petición al desmontar
    return () => abortController.abort();
  }, []); // Se ejecuta solo una vez

  // Retorna el estado y las funciones para manejarlo
  return { items, setItems, isLoading, error, setError };
};

// Hook para manejar la creación de nuevas transacciones
const useCreateTransaction = (
  isAdmin: boolean, // Si el usuario es administrador
  setItems: React.Dispatch<React.SetStateAction<Income[]>>, // Función para actualizar lista
  setError: React.Dispatch<React.SetStateAction<string | null>> // Función para mostrar errores
) => {
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado de envío

  const createTransaction = async (data: FormData) => {
    // Verificar permisos: solo admin puede crear transacciones
    if (!isAdmin) {
      setError('No tienes permiso para crear transacciones.');
      return false;
    }

    setIsSubmitting(true); // Inicia estado de envío
    setError(null);        // Limpia errores previos

    try {
      // Prepara los datos para enviar a la API
      const payload = {
        concept: data.concept.trim(),  // Limpia espacios del concepto
        amount: Number(data.amount),   // Convierte monto a número
        date: data.date,               // Fecha tal como viene
      };

      // Hace petición POST para crear la transacción
      const createdTransaction = await fetchJSON<CreateIncomeResponse>(
        '/api/income/create',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload), // Convierte datos a JSON
        }
      );

      // Normaliza la transacción creada
      const normalizedTransaction = normalizeIncome(createdTransaction);
      
      // Agrega la nueva transacción al inicio de la lista
      setItems((prevItems) => [normalizedTransaction, ...prevItems]);
      
      return true; // Indica éxito
      
    } catch (e: unknown) {
      // Maneja errores de creación
      const errorMessage = e instanceof Error 
        ? e.message 
        : 'No se pudo crear la transacción';
      setError(errorMessage);
      return false; // Indica fallo
      
    } finally {
      setIsSubmitting(false); // Termina estado de envío
    }
  };

  // Retorna la función de creación y el estado de envío
  return { createTransaction, isSubmitting };
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function IncomeAndExpenses() {
  // Estado para controlar la visibilidad del formulario de nueva transacción
  const [showForm, setShowForm] = useState(false);
  
  // Obtiene el rol del usuario actual
  const role = useUserRole();
  
  // Obtiene el estado y funciones para manejar transacciones
  const { items, setItems, isLoading, error, setError } = useTransactions();
  
  // Determina si el usuario es administrador
  const isAdmin = role === 'admin';

  // Obtiene la función para crear transacciones y su estado
  const { createTransaction, isSubmitting } = useCreateTransaction(
    isAdmin,
    setItems,
    setError
  );

  // Maneja el envío del formulario de nueva transacción
  const handleNewTransaction = async (data: FormData) => {
    const success = await createTransaction(data); // Intenta crear la transacción
    if (success) {
      setShowForm(false); // Si fue exitoso, cierra el formulario
    }
    // Si falla, el formulario permanece abierto para mostrar el error
  };

  // Memoriza las acciones del header para evitar re-renders innecesarios
  const headerActions = useMemo(
    () =>
      isAdmin ? ( // Solo muestra el botón si es administrador
        <Button onClick={() => setShowForm(true)} disabled={isLoading}>
          <Plus className='mr-2 h-4 w-4' />
          New
        </Button>
      ) : null, // Si no es admin, no muestra nada
    [isAdmin, isLoading] // Solo recalcula si cambia el rol o el estado de carga
  );

  // ============================================================================
  // RENDERIZADO DEL COMPONENTE
  // ============================================================================

  return (
    // Contenedor principal que usa toda la altura disponible
    <div className='h-full flex flex-col'>
      
      {/* Header fijo que no hace scroll */}
      <div className='flex-shrink-0 px-6 py-4 border-b bg-white'>
        <div className='flex items-center justify-between'>
          {/* Título de la página */}
          <h2 className='text-2xl font-bold text-gray-900'>Income and expenses</h2>
          {/* Botón para crear nueva transacción (solo si es admin) */}
          {headerActions}
        </div>
        
        {/* Mensaje de error si existe */}
        {error && (
          <div
            role='alert' // Accesibilidad: indica que es un mensaje de alerta
            className='mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'
          >
            {error}
          </div>
        )}
      </div>

      {/* Contenido principal sin scroll - altura fija */}
      <div className='flex-1 px-6 py-4 overflow-hidden'>
        {/* Contenedor que usa todo el ancho y alto disponible */}
        <div className='w-full h-full'>
          <DataTable
            columns={columns}              // Definición de columnas de la tabla
            data={items}                   // Datos de las transacciones
            showFinancialSummary           // Muestra resumen financiero
            isLoading={isLoading}          // Estado de carga
            headerActions={null}           // No pasa acciones porque ya están en el header
          />
        </div>
      </div>

      {/* Modal para formulario de nueva transacción */}
      {showForm && isAdmin && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <NewTransactionForm
            onSubmit={handleNewTransaction}         // Función que maneja el envío
            onCancel={() => setShowForm(false)}     // Función para cancelar/cerrar
            isLoading={isSubmitting}                // Estado de envío del formulario
          />
        </div>
      )}
    </div>
  );
}