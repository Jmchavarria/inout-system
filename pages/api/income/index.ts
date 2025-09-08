// pages/api/income/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

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

/**
 * Intenta localizar un "delegate" compatible para ingresos.
 * 
 * IMPORTANTE: Si conoces el nombre exacto de tu modelo, descomenta la línea
 * correspondiente y elimina el resto para evitar errores.
 */
function getIncomeDelegate() {
  return prismaAny.transaction; // ← USA TU MODELO REAL
}
/**
 * findMany con "fallbacks": intenta incluir usuario y ordenar por fecha;
 * si el esquema no lo soporta, va degradando hasta que funcione.
 */
async function safeFindMany(delegate: any) {
  console.log('🔍 [safeFindMany] Attempting to fetch income records...');

  // Intento 1: con include + orderBy date
  try {
    const result = await delegate.findMany({
      orderBy: { date: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    console.log('✅ [safeFindMany] Success with include + orderBy');
    return result;
  } catch (error) {
    console.log('⚠️ [safeFindMany] Failed with include + orderBy, trying orderBy only');
  }

  // Intento 2: sólo con orderBy date
  try {
    const result = await delegate.findMany({
      orderBy: { date: 'desc' },
    });
    console.log('✅ [safeFindMany] Success with orderBy only');
    return result;
  } catch (error) {
    console.log('⚠️ [safeFindMany] Failed with orderBy, trying basic findMany');
  }

  // Intento 3: básico sin orderBy/include
  try {
    const result = await delegate.findMany();
    console.log('✅ [safeFindMany] Success with basic findMany');
    return result;
  } catch (error) {
    console.error('❌ [safeFindMany] All attempts failed:', error);
    throw error;
  }
}

/**
 * create con "fallbacks": prueba a crear conectando usuario por relation,
 * si no existe, prueba con userId plano; elimina date si no existe, etc.
 */
async function safeCreate(delegate: any, data: {
  concept: string;
  amount: number;
  date?: string;
  userId?: string;
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
  if (data.userId) {
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
      console.log('⚠️ [safeCreate] Failed with userId, trying without user reference');
    }
  }

  // Intento 4: sin userId con include
  try {
    const result = await delegate.create({
      data: base,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    console.log('✅ [safeCreate] Success with include, no user');
    return result;
  } catch (error) {
    console.log('⚠️ [safeCreate] Failed with include, trying basic create');
  }

  // Intento 5: básico sin include
  try {
    const result = await delegate.create({ data: base });
    console.log('✅ [safeCreate] Success with basic create');
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
  // Concepto: Tu modelo Transaction usa 'concept'
  const concept: string = String(row?.concept ?? '');

  // Monto: Tu modelo Transaction usa 'amount' (Decimal)
  const amountNum = Number(row?.amount ?? 0);

  // Fecha: intenta date/createdAt
  const rawDate = row?.date ?? row?.createdAt ?? new Date();
  const date = toYMD(new Date(rawDate));

  // Usuario
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

    // ✅ PERMITE ACCESO A ADMIN Y USER
    await requireRole(req, ['admin', 'user']);
    console.log('✅ [API /income] Role check passed');

    const delegate = getIncomeDelegate();
    if (!delegate) {
      console.error('❌ [API /income] No income model found');
      res.status(500).json({
        error: 'internal_error',
        details: 'No se encontró un modelo de ingresos en Prisma Client. Verifica tu schema.prisma y asegúrate de tener un modelo como Income, Transaction, etc.',
      });
      return;
    }

    if (req.method === 'GET') {
      console.log('📋 [API /income] Processing GET request');
      const rows = await safeFindMany(delegate);
      const items = (rows as any[]).map(normalizeIncome);
      console.log(`✅ [API /income] Returning ${items.length} items`);
      res.status(200).json({ items });
      return;
    }

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

      const created = await safeCreate(delegate, parsed.data);
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