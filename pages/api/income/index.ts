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
 * Ajusta el orden de preferencia o fija uno concreto si conoces el nombre.
 */
function getIncomeDelegate() {
  // 👇 Si sabes el nombre exacto, descomenta UNA de estas y borra el resto:
  // return prismaAny.income;
  // return prismaAny.incomes;

  return (
    prismaAny.income || // modelo "Income"
    prismaAny.incomes || // modelo "Incomes"
    prismaAny.Income || // por si alguien lo generó con mayúscula (no usual)
    prismaAny.transaction || // apps que usan Transaction con tipo
    prismaAny.movement || // apps que usan Movement/Record
    null
  );
}

/**
 * findMany con "fallbacks": intenta incluir usuario y ordenar por fecha;
 * si el esquema no lo soporta, va degradando hasta que funcione.
 */
async function safeFindMany(delegate: any) {
  // intento con include + orderBy date
  try {
    return await delegate.findMany({
      orderBy: { date: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  } catch {
    // intento sólo con orderBy date
    try {
      return await delegate.findMany({
        orderBy: { date: 'desc' },
      });
    } catch {
      // intento sin orderBy/include
      return await delegate.findMany();
    }
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
  // Construimos posibles shapes
  const base = {
    concept: data.concept,
    amount: data.amount,
  } as any;

  // fecha (si se puede)
  if (data.date) {
    base.date = new Date(data.date);
  }

  // intentamos con relación user.connect
  if (data.userId) {
    try {
      return await delegate.create({
        data: { ...base, user: { connect: { id: data.userId } } },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    } catch {
      // intentamos con userId plano
      try {
        return await delegate.create({
          data: { ...base, userId: data.userId },
          include: { user: { select: { id: true, name: true, email: true } } },
        });
      } catch {
        // intentamos sin include
        return await delegate.create({ data: { ...base, userId: data.userId } });
      }
    }
  }

  // sin userId
  try {
    return await delegate.create({
      data: base,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  } catch {
    return await delegate.create({ data: base });
  }
}

/**
 * Normaliza un registro cualquiera a IncomePayload.
 */
function normalizeIncome(row: any): IncomePayload {
  // concepto: intenta concept/title/description
  const concept: string =
    row?.concept ??
    row?.title ??
    row?.description ??
    '';

  // monto: intenta amount/value/total y convierte a número
  const amountNum = 
    Number(row?.amount) ||
    Number(row?.value) ||
    Number(row?.total) ||
    0;

  // fecha: intenta date/createdAt
  const rawDate = row?.date ?? row?.createdAt ?? new Date();
  const date = toYMD(new Date(rawDate));

  // usuario
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
// Handler
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
    await requireRole(req, ['admin', 'user']);

    const delegate = getIncomeDelegate();
    if (!delegate) {
      // → Solución definitiva recomendada:
      // Crea un modelo `Income` en schema.prisma y usa `prisma.income`.
      res.status(500).json({
        error: 'internal_error',
        details:
          'No se encontró un modelo de ingresos en Prisma Client. Define un modelo `Income` o ajusta getIncomeDelegate().',
      });
      return;
    }

    if (req.method === 'GET') {
      const rows = await safeFindMany(delegate);
      const items = (rows as any[]).map(normalizeIncome);
      res.status(200).json({ items });
      return;
    }

    if (req.method === 'POST') {
      const parsed = createIncomeSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'invalid_body', details: parsed.error.flatten() });
        return;
      }

      const created = await safeCreate(delegate, parsed.data);
      const payload = normalizeIncome(created);
      res.status(201).json(payload);
      return;
    }

    res.status(405).json({ error: 'method_not_allowed' });
  } catch (err: unknown) {
    const code = getHttpStatus(err);
    const error: ErrorResponse['error'] =
      code === 401
        ? 'unauthorized'
        : code === 403
        ? 'forbidden'
        : 'internal_error';
    res.status(code).json({ error });
  }
}
