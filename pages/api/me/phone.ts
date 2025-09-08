// pages/api/me/phone.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { parse } from 'cookie';

type ErrorKey =
  | 'internal_error'
  | 'method_not_allowed'
  | 'No autenticado'
  | 'tel requerido'
  | 'forbidden_user_mismatch';
type ErrorResponse = { error: ErrorKey; message?: string };
type GetResponse = { tel: string };
type PostResponse = { ok: true; tel: string };
type ApiResponse = GetResponse | PostResponse | ErrorResponse | void;

const getErrorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown';

const SESSION_COOKIE_KEYS = [
  '__Secure-better-auth.session_token',
  'better-auth.session_token',
  'session-token',
  'session',
] as const;

const tryGetSessionUserId = async (cookieHeader?: string): Promise<string | undefined> => {
  try {
    const headers = new Headers();
    if (cookieHeader) headers.set('cookie', cookieHeader);
    const session = await auth.api.getSession({ headers });
    const id = session?.user?.id;
    return typeof id === 'string' ? id : undefined;
  } catch (e: unknown) {
    console.error('getSession error:', e);
    return undefined;
  }
};

const getTokenFromCookies = (cookieHeader?: string): string | undefined => {
  const cookies = parse(cookieHeader ?? '');
  for (const key of SESSION_COOKIE_KEYS) {
    const v = cookies[key];
    if (v) return v;
  }
  return undefined;
};

const getUserIdByToken = async (token: string): Promise<string | undefined> => {
  const row = await prisma.session.findUnique({ where: { token } });
  if (!row) return undefined;
  if (row.expiresAt <= new Date()) return undefined;
  return row.userId;
};

async function getUserIdFromRequest(req: NextApiRequest): Promise<string | undefined> {
  const cookieHeader = req.headers.cookie;

  const sessionId = await tryGetSessionUserId(cookieHeader);
  if (sessionId) return sessionId;

  const token = getTokenFromCookies(cookieHeader);
  if (!token) return undefined;

  return getUserIdByToken(token);
}

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
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (req.method === 'GET') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tel: true },
      });
      res.status(200).json({ tel: user?.tel ?? '' });
      return;
    }

    if (req.method === 'POST') {
      const { tel, userId: userIdFromClient } = (req.body ?? {}) as {
        tel?: string;
        userId?: string;
      };

      if (typeof tel !== 'string' || tel.trim() === '') {
        res.status(400).json({ error: 'tel requerido' });
        return;
      }
      if (userIdFromClient && userIdFromClient !== userId) {
        res.status(403).json({ error: 'forbidden_user_mismatch' });
        return;
      }

      await prisma.user.update({ where: { id: userId }, data: { tel } });
      res.status(200).json({ ok: true, tel });
      return;
    }

    res.status(405).json({ error: 'method_not_allowed' });
  } catch (err: unknown) {
    console.error('[/api/me/phone] ERROR:', err);
    res.status(500).json({ error: 'internal_error', message: getErrorMessage(err) });
  }
}
