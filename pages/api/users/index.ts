// pages/api/users/index.ts
// API para gestión de usuarios - Solo accesible por administradores

// ============================================================================
// IMPORTACIONES
// ============================================================================

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';      // Cliente de base de datos
import { requireRole } from '@/lib/rbac';   // Middleware de autorización
import { z } from 'zod';                    // Validación de esquemas

// ============================================================================
// DEFINICIÓN DE TIPOS
// ============================================================================

// Roles válidos en el sistema
type Role = 'admin' | 'user';

// Esquema de validación para crear nuevos usuarios
const createSchema = z.object({
  name: z.string().min(2).max(100),          // Nombre: mínimo 2, máximo 100 caracteres
  role: z.enum(['admin', 'user']),           // Rol: debe ser exactamente 'admin' o 'user'
  email: z.string().email().optional(),      // Email: válido y opcional
  tel: z.string().optional(),                // Teléfono: string opcional
});

// DTO (Data Transfer Object) para usuarios - estructura que se envía al cliente
type UserDTO = {
  id: string;           // ID único del usuario
  name: string | null;  // Nombre (puede ser null)
  email: string | null; // Email (puede ser null)
  tel: string | null;   // Teléfono (puede ser null)
  role: Role;           // Rol normalizado
  createdAt: string;    // Fecha de creación en formato ISO string
};

// Respuesta para listar usuarios
type ListResponse = { items: UserDTO[] };

// Posibles tipos de error que puede devolver la API
type ErrorKey =
  | 'unauthorized'      // Usuario no autenticado
  | 'forbidden'         // Usuario autenticado pero sin permisos
  | 'invalid_body'      // Datos de entrada inválidos
  | 'method_not_allowed'// Método HTTP no permitido
  | 'internal_error';   // Error interno del servidor

// Estructura de respuesta de error
type ErrorResponse = { error: ErrorKey; details?: unknown };

// ============================================================================
// FUNCIONES HELPER
// ============================================================================

// Normaliza cualquier valor a 'admin' | 'user'
// Necesario porque Prisma devuelve roles como string genérico
const toRole = (r: unknown): Role => {
  // Si ya es un rol válido, lo retorna directamente
  if (r === 'admin' || r === 'user') return r;
  
  // Convierte a string, lo pone en minúsculas y valida
  const s = String(r ?? '').toLowerCase();
  return s === 'admin' ? 'admin' : 'user'; // Default a 'user' si no es 'admin'
};

// Convierte un usuario de Prisma al formato DTO para el cliente
const toUserDTO = (u: {
  id: string;
  name: string | null;
  email: string | null;
  tel: string | null;
  role: string;        // ← Importante: Prisma devuelve string genérico
  createdAt: Date;
}): UserDTO => ({
  id: u.id,
  name: u.name,
  email: u.email,
  tel: u.tel,
  role: toRole(u.role),                    // Normaliza el rol
  createdAt: u.createdAt.toISOString(),    // Convierte Date a string ISO
});

// Extrae el código de status HTTP de un error
const getStatusFromError = (err: unknown): number => {
  if (err && typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    const s = obj.status ?? obj.code;      // Busca propiedades status o code
    if (typeof s === 'number' && s >= 400 && s <= 599) return s;
  }
  return 500; // Default a error interno del servidor
};

// ============================================================================
// HANDLERS POR MÉTODO HTTP
// ============================================================================

// Maneja peticiones GET - Lista todos los usuarios
async function handleGet(
  _req: NextApiRequest,  // El underscore indica que no usamos req
  res: NextApiResponse<ListResponse | ErrorResponse>
) {
  // Consulta usuarios de la base de datos
  const rows = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      tel: true,
      role: true,        // Prisma devuelve como string
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },  // Más recientes primero
    take: 100,                       // Límite de 100 usuarios (paginación básica)
  });

  // Convierte cada usuario al formato DTO y responde
  return res.status(200).json({ items: rows.map(toUserDTO) });
}

// Maneja peticiones POST - Crea un nuevo usuario
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<UserDTO | ErrorResponse>
) {
  // Valida los datos de entrada contra el esquema
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    // Si la validación falla, devuelve error 400 con detalles
    return res
      .status(400)
      .json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  // Extrae los datos validados
  const { name, role, email, tel } = parsed.data;

  // Crea el usuario en la base de datos
  const created = await prisma.user.create({
    data: { 
      name, 
      role, 
      email: email ?? null,  // Convierte undefined a null para consistencia
      tel: tel ?? null       // Convierte undefined a null para consistencia
    },
    select: {
      id: true,
      name: true,
      email: true,
      tel: true,
      role: true,            // Prisma devuelve como string
      createdAt: true,
    },
  });

  // Responde con el usuario creado convertido a DTO
  return res.status(201).json(toUserDTO(created));
}

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListResponse | UserDTO | ErrorResponse>
) {
  try {
    // 🔒 AUTORIZACIÓN: Solo administradores pueden acceder a esta API
    await requireRole(req, ['admin']);

    // Ruteo por método HTTP
    if (req.method === 'GET') return handleGet(req, res);   // Listar usuarios
    if (req.method === 'POST') return handlePost(req, res); // Crear usuario

    // Si el método no está soportado
    return res.status(405).json({ error: 'method_not_allowed' });
    
  } catch (err: unknown) {
    // Manejo centralizado de errores
    const code = getStatusFromError(err);        // Extrae código de status
    
    // Mapea códigos de status a tipos de error
    const error: ErrorKey =
      code === 401
        ? 'unauthorized'    // No autenticado
        : code === 403
        ? 'forbidden'       // Sin permisos (usuario normal intentando acceder)
        : 'internal_error'; // Cualquier otro error
        
    return res.status(code).json({ error });
  }
}