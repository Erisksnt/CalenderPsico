import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './database';
import bcrypt from 'bcryptjs';

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
export const COOKIE_NAME = 'admin_session';

export type AuthPayload = {
  userId: string;
  email: string;
  role: 'ADMIN' | 'PSYCHOLOGIST';
  psychologistId?: string;
  // ⚡ Adicionar dados básicos ao payload para evitar banco
  userName?: string;
  userProfile?: {
    id: string;
    full_name?: string;
    photo_url?: string;
  };
};

export function createToken(payload: AuthPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function getTokenFromHeader(authHeader?: string | null): string | null {
  if (!authHeader) return null;
  const [prefix, token] = authHeader.split(' ');
  return prefix === 'Bearer' && token ? token : null;
}

function getTokenFromCookieHeader(cookieHeader?: string | null): string | null {
  if (!cookieHeader) return null;
  return cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${COOKIE_NAME}=`))
    ?.split('=')[1] ?? null;
}

export function buildAuthCookie(token: string) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`;
}

export function clearAuthCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

// ✅ VERSÃO OTIMIZADA - SEM QUERY NO BANCO!
export function getAuthenticatedUser(request: Request) {
  const bearerToken = getTokenFromHeader(request.headers.get('authorization'));
  const cookieToken = getTokenFromCookieHeader(request.headers.get('cookie'));
  const token = bearerToken || cookieToken;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  // ✅ Retorna os dados do token, SEM buscar no banco!
  return {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
    psychologist: payload.psychologistId ? { id: payload.psychologistId } : null,
    profile: payload.userProfile ? {
      id: payload.userProfile.id,
      full_name: payload.userProfile.full_name,
      photo_url: payload.userProfile.photo_url
    } : null
  };
}

// ⚡ Função específica para quando PRECISA do banco (raro)
export async function getAuthenticatedUserWithDB(request: Request) {
  const user = getAuthenticatedUser(request);
  if (!user) return null;

  // Só busca no banco se realmente precisar de dados completos
  return prisma.user.findUnique({
    where: { id: user.id },
    include: {
      profile: true,
      psychologist: true,
    },
  });
}

export async function getAdminFromRequest(request: Request) {
  const user = getAuthenticatedUser(request); // ✅ Agora SEM query!
  if (!user || user.role !== 'ADMIN') return null;
  return user;
}

export async function getAdminFromServerCookie() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
    psychologist: payload.psychologistId ? { id: payload.psychologistId } : null,
  };
}

export const verifyJWT = verifyToken;
export const generateJWT = (userId: string, role: 'ADMIN' | 'PSYCHOLOGIST', email = '') =>
  createToken({ userId, role, email });