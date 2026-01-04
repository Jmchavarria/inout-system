// pages/api/income/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// ─────────────────────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────────────────────
const toYMD = (d: Date): string => d.toISOString().slice(0, 10);

// ─────────────────────────────────────────────────────────────
// Tipos de respuesta
// ─────────────────────────────────────────────────────────────
type ErrorKey =
  | 'unauthorized'
  | 'forbidden'
  | 'invalid_body'
  | 'method_not_allowed'
  | 'internal_error';

type ErrorResponse = { error: ErrorKey; details?: unknown };

type IncomePayload = {
  id: string;
  concept: string;
  amount: number;
  date: string;
  user: { id: string; name: string | null; email: string | null } | null;
};

type GetResponse = { items: IncomePayload[] };
type PostResponse = IncomePayload;
type ApiResponse = GetResponse | PostResponse | ErrorResponse | void;

// ─────────────────────────────────────────────────────────────
// Validación de entrada
// ─────────────────────────────────────────────────────────────
const createIncomeSchema = z.object({
  concept: z.string().min(1, 'concept is required'),
  amount: z.number(),
  date: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────
// Helpers optimizados
// ─────────────────────────────────────────────────────────────

/**
 * ✅ OPTIMIZADO: Convierte headers de Next.js a Headers estándar
 */
function toWebHeaders(reqHeaders: NextApiRequest['headers']): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(reqHeaders)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value[0] : value);
    }
  }
  return headers;
}

/**
 * ✅ OPTIMIZADO: Normaliza un registro a IncomePayload
 */
function normalizeIncome(row: any): IncomePayload {
  const rawDate = row?.date ?? row?.createdAt ?? new Date();
  
  return {
    id: String(row?.id ?? ''),
    concept: String(row?.concept ?? ''),
    amount: Number(row?.amount ?? 0),
    date: toYMD(new Date(rawDate)),
    user: row?.user ? {
      id: String(row.user.id),
      name: row.user.name ?? null,
      email: row.user.email ?? null,
    } : null,
  };
}

// ─────────────────────────────────────────────────────────────
// Handler Principal
// ─────────────────────────────────────────────────────────────
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
): Promise<void> {
  // ✅ OPTIMIZACIÓN: Cache headers para reducir carga
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
  res.setHeader('Allow', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    // ✅ OPTIMIZADO: Verificar autenticación una sola vez
    const headers = toWebHeaders(req.headers);
    const session = await auth.api.getSession({ headers });

    if (!session?.user?.id) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    const userId = session.user.id;

    // ✅ OPTIMIZACIÓN: Obtener role desde la sesión si está disponible
    // Si Better Auth ya incluye el role en la sesión, no necesitas esta query
    const userRole = (session.user as any).role;
    
    // Solo consultar DB si el role no viene en la sesión
    let role = userRole;
    if (!role) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      role = user?.role;
    }

    // ✅ Verificar permisos (admin o user pueden acceder)
    if (!role || !['admin', 'user'].includes(role)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    // ═══════════════════════════════════════════════════════════
    // GET: Obtener transacciones
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'GET') {
      // ✅ OPTIMIZADO: Query simple y directa con índice
      const rows = await prisma.transaction.findMany({
        orderBy: { date: 'desc' },
        include: { 
          user: { 
            select: { id: true, name: true, email: true } 
          } 
        },
        // ✅ OPCIONAL: Limitar resultados para mejor performance
        // take: 100,
      });

      const items = rows.map(normalizeIncome);
      res.status(200).json({ items });
      return;
    }

    // ═══════════════════════════════════════════════════════════
    // POST: Crear transacción
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'POST') {
      // ✅ Solo admins pueden crear
      if (role !== 'admin') {
        res.status(403).json({ error: 'forbidden' });
        return;
      }

      const parsed = createIncomeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'invalid_body',
          details: parsed.error.flatten()
        });
        return;
      }

      // ✅ OPTIMIZADO: Create simple sin try-catch en cascada
      const created = await prisma.transaction.create({
        data: {
          concept: parsed.data.concept,
          amount: parsed.data.amount,
          date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
          userId: userId, // Siempre usar el userId autenticado
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      const payload = normalizeIncome(created);
      res.status(201).json(payload);
      return;
    }

    res.status(405).json({ error: 'method_not_allowed' });

  } catch (err: unknown) {
    console.error('❌ [API /income] Error:', err);
    
    const statusCode = err && typeof err === 'object' && 'code' in err 
      ? (err as any).code 
      : 500;

    res.status(statusCode).json({ 
      error: 'internal_error',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}