import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const COOKIE_NAME = 'admin_session';

type AuthPayload = { userId: string; email: string; role?: string };

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
  return prefix === 'Bearer' ? token : null;
}

export async function getAdminFromRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const token = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${COOKIE_NAME}=`))
    ?.split('=')[1];

  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return prisma.user.findUnique({ where: { id: payload.userId } });
}

export async function getAdminFromServerCookie() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return prisma.user.findUnique({ where: { id: payload.userId } });
}

export function buildAuthCookie(token: string) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`;
}

export function clearAuthCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function checkTimeSlotConflict() {
  return false;
}

// legacy compatibility
export const verifyJWT = verifyToken;
export const generateJWT = (userId: string, role: string) => createToken({ userId, email: '', role });
