// pages/api/income/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { auth } from '@/lib/auth';

// ─────────────────────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────────────────────
const getHttpStatus = (err: unknown): number => {
  if (err && typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    const candidates = [obj.status, obj.code];
    for (const c of candidates) {
      if (typeof c === 'number' && c >= 400 && c <= 599) return c;
    }
  }
  return 500;
};

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
  date: string; // YYYY-MM-DD
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
  date: z.string().optional(), // YYYY-MM-DD
  userId: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────
// Acceso dinámico al modelo para evitar error de tipos
// ─────────────────────────────────────────────────────────────
const prismaAny = prisma as any;

function getIncomeDelegate() {
  return prismaAny.transaction;
}

/**
 * findMany con "fallbacks" y filtrado por usuario
 */
async function safeFindMany(delegate: any, userId: string, isAdmin: boolean) {
  console.log(`🔍 [safeFindMany] Fetching records for userId: ${userId}, isAdmin: ${isAdmin}`);

  // Construir el whereClause: admin ve todo, user solo sus registros
  const whereClause = isAdmin ? {} : { userId };

  // Intento 1: con include + orderBy + where
  try {
    const result = await delegate.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    console.log(`✅ [safeFindMany] Success with include + orderBy + where. Found ${result.length} records`);
    return result;
  } catch (error) {
    console.log('⚠️ [safeFindMany] Failed with include + orderBy + where, trying orderBy + where only');
  }

  // Intento 2: sólo con orderBy + where
  try {
    const result = await delegate.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
    });
    console.log(`✅ [safeFindMany] Success with orderBy + where. Found ${result.length} records`);
    return result;
  } catch (error) {
    console.log('⚠️ [safeFindMany] Failed with orderBy + where, trying basic findMany with where');
  }

  // Intento 3: básico con where
  try {
    const result = await delegate.findMany({
      where: whereClause,
    });
    console.log(`✅ [safeFindMany] Success with where only. Found ${result.length} records`);
    return result;
  } catch (error) {
    console.log('⚠️ [safeFindMany] Failed with where, trying without filters (fallback)');
  }

  // Intento 4: sin filtros (fallback final - NO RECOMENDADO en producción)
  try {
    const result = await delegate.findMany();
    console.log('⚠️ [safeFindMany] Using unfiltered fallback - security risk!');
    // Filtrar manualmente en memoria si no hay otra opción
    if (!isAdmin) {
      return result.filter((r: any) => r.userId === userId);
    }
    return result;
  } catch (error) {
    console.error('❌ [safeFindMany] All attempts failed:', error);
    throw error;
  }
}

/**
 * create con "fallbacks": asocia automáticamente al usuario autenticado
 */
async function safeCreate(delegate: any, data: {
  concept: string;
  amount: number;
  date?: string;
  userId: string; // Ahora es requerido
}) {
  console.log('🔍 [safeCreate] Attempting to create income record:', data);

  // Construimos base
  const base = {
    concept: data.concept,
    amount: data.amount,
  } as any;

  // Agregar fecha si se proporciona
  if (data.date) {
    base.date = new Date(data.date);
  }

  // Intento 1: con relación user.connect
  try {
    const result = await delegate.create({
      data: { ...base, user: { connect: { id: data.userId } } },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    console.log('✅ [safeCreate] Success with user.connect + include');
    return result;
  } catch (error) {
    console.log('⚠️ [safeCreate] Failed with user.connect, trying userId field');
  }

  // Intento 2: con userId plano + include
  try {
    const result = await delegate.create({
      data: { ...base, userId: data.userId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    console.log('✅ [safeCreate] Success with userId + include');
    return result;
  } catch (error) {
    console.log('⚠️ [safeCreate] Failed with include, trying without include');
  }

  // Intento 3: con userId sin include
  try {
    const result = await delegate.create({
      data: { ...base, userId: data.userId }
    });
    console.log('✅ [safeCreate] Success with userId only');
    return result;
  } catch (error) {
    console.error('❌ [safeCreate] All create attempts failed:', error);
    throw error;
  }
}

/**
 * Normaliza un registro cualquiera a IncomePayload.
 */
function normalizeIncome(row: any): IncomePayload {
  const concept: string = String(row?.concept ?? '');
  const amountNum = Number(row?.amount ?? 0);
  const rawDate = row?.date ?? row?.createdAt ?? new Date();
  const date = toYMD(new Date(rawDate));

  const user =
    row?.user && typeof row.user === 'object'
      ? {
        id: String(row.user.id ?? ''),
        name: row.user.name ?? null,
        email: row.user.email ?? null,
      }
      : null;

  return {
    id: String(row?.id ?? ''),
    concept: String(concept),
    amount: Number(amountNum),
    date,
    user,
  };
}

// ─────────────────────────────────────────────────────────────
// Handler Principal
// ─────────────────────────────────────────────────────────────
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
): Promise<void> {
  res.setHeader('Allow', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    console.log(`🔍 [API /income] ${req.method} request received`);

    // ✅ Verificar autenticación y obtener sesión
    // Convertir headers de Next.js al formato que espera Better Auth
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value[0] : value);
      }
    });

    const session = await auth.api.getSession({ headers });
    
    if (!session?.user) {
      console.log('❌ [API /income] No session found');
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    const userId = session.user.id;

    // 🔍 Obtener el rol del usuario desde la base de datos
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      console.log('❌ [API /income] User not found in database');
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    const userRole = (user.role || 'user').toLowerCase();
    const isAdmin = userRole === 'admin';

    console.log(`✅ [API /income] Authenticated: userId=${userId}, role=${userRole}, isAdmin=${isAdmin}`);

    // ✅ PERMITE ACCESO A ADMIN Y USER
    await requireRole(req, ['admin', 'user']);
    console.log('✅ [API /income] Role check passed');

    const delegate = getIncomeDelegate();
    if (!delegate) {
      console.error('❌ [API /income] No income model found');
      res.status(500).json({
        error: 'internal_error',
        details: 'No se encontró un modelo de ingresos en Prisma Client.',
      });
      return;
    }

    // ═══════════════════════════════════════════════════════════
    // GET: Obtener transacciones (filtradas por usuario)
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'GET') {
      console.log('📋 [API /income] Processing GET request');
      const rows = await safeFindMany(delegate, userId, isAdmin);
      const items = (rows as any[]).map(normalizeIncome);
      console.log(`✅ [API /income] Returning ${items.length} items`);
      res.status(200).json({ items });
      return;
    }

    // ═══════════════════════════════════════════════════════════
    // POST: Crear transacción (asociada al usuario autenticado)
    // ═══════════════════════════════════════════════════════════
    if (req.method === 'POST') {
      console.log('📋 [API /income] Processing POST request');
      const parsed = createIncomeSchema.safeParse(req.body);
      if (!parsed.success) {
        console.log('❌ [API /income] Invalid request body:', parsed.error);
        res.status(400).json({
          error: 'invalid_body',
          details: parsed.error.flatten()
        });
        return;
      }

      // ✅ Forzar userId del usuario autenticado (ignorar el del body por seguridad)
      const dataToCreate = {
        ...parsed.data,
        userId: userId, // Siempre usar el userId de la sesión
      };

      const created = await safeCreate(delegate, dataToCreate);
      const payload = normalizeIncome(created);
      console.log('✅ [API /income] Income created successfully');
      res.status(201).json(payload);
      return;
    }

    res.status(405).json({ error: 'method_not_allowed' });

  } catch (err: unknown) {
    console.error('❌ [API /income] Error:', err);
    const code = getHttpStatus(err);
    const error: ErrorResponse['error'] =
      code === 401
        ? 'unauthorized'
        : code === 403
          ? 'forbidden'
          : 'internal_error';

    res.status(code).json({ error, details: err instanceof Error ? err.message : 'Unknown error' });
  }
}