// pages/api/me.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Role = 'admin' | 'user';

type OkResponse = {
  userId: string;
  role: Role;
  name?: string;
  email?: string;
  image?: string;
};

type ErrResponse = { 
  error: 'unauthorized' | 'forbidden' | 'server_error';
  message?: string;
};

// Normaliza cualquier string a 'admin' | 'user' - VERSIÓN CORREGIDA
const toRole = (r: unknown): 'admin' | 'user' => {
  console.log('🔍 [toRole] Input value:', r);
  console.log('🔍 [toRole] Input type:', typeof r);
  
  // Primero verificar valores exactos
  if (r === 'admin' || r === 'user') {
    console.log('✅ [toRole] Exact match:', r);
    return r;
  }
  
  // Normalizar string: trim y lowercase
  const normalized = String(r ?? '').trim().toLowerCase();
  console.log('🔍 [toRole] Normalized value:', normalized);
  
  const result = normalized === 'admin' ? 'admin' : 'user';
  console.log('✅ [toRole] Final result:', result);
  
  return result;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OkResponse | ErrResponse>
) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'server_error', 
      message: 'Method not allowed' 
    });
  }

  try {
    console.log('🔍 [API /me] Getting session...');
    
    // Obtener sesión del usuario
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    // Verificar que existe sesión y usuario
    if (!session || !session.user) {
      console.log('❌ [API /me] No session found');
      return res.status(401).json({ error: 'unauthorized' });
    }

    console.log('📋 [API /me] Session user ID:', session.user.id);

    // Consultar usuario en la base de datos
    console.log('🔍 [API /me] Querying user from database...');
    
    const userFromDb = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        name: true,
        email: true,
        image: true,
        role: true 
      }
    });
    
    console.log('📋 [API /me] User from database:', userFromDb);
    console.log('📋 [API /me] Raw role from DB:', userFromDb?.role);

    // Verificar que el usuario existe en la DB
    if (!userFromDb) {
      console.log('❌ [API /me] User not found in database');
      return res.status(404).json({ 
        error: 'server_error',
        message: 'User not found in database'
      });
    }

    // Normalizar el rol desde la base de datos
    const finalRole = toRole(userFromDb.role);
    console.log('✅ [API /me] Final role after normalization:', finalRole);

    const response: OkResponse = {
      userId: userFromDb.id, 
      role: finalRole,
      name: userFromDb.name || undefined,
      email: userFromDb.email || undefined,
      image: userFromDb.image || undefined,
    };

    console.log('✅ [API /me] Sending response:', response);
    return res.status(200).json(response);

  } catch (err) {
    console.error('❌ [API /me] Unexpected error:', err);
    return res.status(500).json({ 
      error: 'server_error',
      message: 'Internal server error'
    });
  }
}