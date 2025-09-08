// pages/api/me.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@/lib/auth';

type Role = 'admin' | 'user';
type OkResponse = { 
  userId: string; 
  role: Role;
  name?: string;
  email?: string;
  image?: string;
};
type ErrResponse = { error: 'unauthorized' | 'forbidden' };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OkResponse | ErrResponse>
) {
  try {
    // Usar Better Auth para obtener la sesión completa
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    // Devolver información completa del usuario
    return res.status(200).json({ 
      userId: session.user.id,
      role: (session.user as any).role || 'user', // Ajusta según tu esquema
      name: session.user.name,
      email: session.user.email,
      image: session.user.image || '',
    });
  } catch (err) {
    console.error('Error getting session:', err);
    return res.status(401).json({ error: 'unauthorized' });
  }
}