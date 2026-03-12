// lib/auth.ts
// Funções de autenticação e verificação de permissões

import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseClient, getCurrentUser } from './supabase';
import prisma from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Gera um JWT token
 */
export function generateJWT(userId: string, role: string): string {
  return jwt.sign(
    {
      userId,
      role,
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verifica e decodifica um JWT token
 */
export function verifyJWT(token: string): { userId: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: decoded.userId,
      role: decoded.role,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Extrai o token do header Authorization
 */
export function getTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Obtém o usuário a partir do token JWT
 */
export async function getUserFromToken(token: string) {
  const decoded = verifyJWT(token);
  if (!decoded) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  return user;
}

/**
 * Middleware para verificação de autenticação (para API Routes)
 */
export async function requireAuth(req: NextApiRequest, res: NextApiResponse) {
  try {
    const authHeader = req.headers.authorization;
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Não autorizado. Token não encontrado.',
      });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Não autorizado. Token inválido.',
      });
    }

    // Aqui você pode anexar o usuário ao req para usar posteriormente
    (req as any).user = user;
    return null;
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro ao verificar autenticação',
    });
  }
}

/**
 * Middleware para verificar se o usuário é psicólogo
 */
export async function requirePsychologist(req: NextApiRequest, res: NextApiResponse) {
  const authError = await requireAuth(req, res);
  if (authError) {
    return authError;
  }

  const user = (req as any).user;
  if (user.role !== 'PSYCHOLOGIST') {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado. Apenas psicólogos podem acessar este recurso.',
    });
  }

  return null;
}

/**
 * Middleware para verificar se o usuário é paciente
 */
export async function requirePatient(req: NextApiRequest, res: NextApiResponse) {
  const authError = await requireAuth(req, res);
  if (authError) {
    return authError;
  }

  const user = (req as any).user;
  if (user.role !== 'PATIENT') {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado. Apenas pacientes podem acessar este recurso.',
    });
  }

  return null;
}

/**
 * Valida um token de sessão Supabase
 */
export async function validateSupabaseToken(token: string) {
  try {
    const { data, error } = await supabaseClient.auth.getUser(token);
    
    if (error || !data.user) {
      return null;
    }

    return data.user;
  } catch (error) {
    return null;
  }
}

/**
 * Verifica se um usuário tem permissão para acessar um recurso
 */
export async function checkResourceAccess(
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return false;
  }

  if (resourceType === 'appointment') {
    const appointment = await prisma.appointment.findUnique({
      where: { id: resourceId },
    });

    if (!appointment) {
      return false;
    }

    // Psicólogo pode acessar seus próprios agendamentos
    // Paciente pode acessar seus próprios agendamentos
    if (user.role === 'PSYCHOLOGIST') {
      return appointment.psychologist_id === userId;
    } else if (user.role === 'PATIENT') {
      const patient = await prisma.patient.findFirst({
        where: { id: appointment.patient_id },
      });
      return patient ? true : false;
    }
  }

  if (resourceType === 'availability') {
    const availability = await prisma.availability.findUnique({
      where: { id: resourceId },
    });

    if (!availability) {
      return false;
    }

    // Apenas o psicólogo pode acessar sua própria disponibilidade
    if (user.role === 'PSYCHOLOGIST') {
      const psychologist = await prisma.psychologist.findUnique({
        where: { user_id: userId },
      });
      return psychologist ? availability.psychologist_id === psychologist.id : false;
    }
  }

  return false;
}

/**
 * Gera um hash de senha (função simples, use bcrypt em produção)
 */
export function hashPassword(password: string): string {
  // Em produção, use bcrypt: https://www.npmjs.com/package/bcrypt
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Compara uma senha com seu hash
 */
export function comparePassword(password: string, hash: string): boolean {
  // Em produção, use bcrypt
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex') === hash;
}
