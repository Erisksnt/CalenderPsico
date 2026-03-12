// lib/api-response.ts
// Helper para respostas padronizadas da API

import { NextApiResponse } from 'next';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

/**
 * Envia uma resposta de sucesso
 */
export function sendSuccess<T>(
  res: NextApiResponse,
  data: T,
  message?: string,
  statusCode: number = 200
) {
  return res.status(statusCode).json({
    success: true,
    data,
    message: message || 'Operação realizada com sucesso',
  });
}

/**
 * Envia uma resposta de erro
 */
export function sendError(
  res: NextApiResponse,
  error: string,
  statusCode: number = 400,
  data?: any
) {
  return res.status(statusCode).json({
    success: false,
    error,
    data,
  });
}

/**
 * Envia um erro de validação
 */
export function sendValidationError(
  res: NextApiResponse,
  errors: { field: string; message: string }[]
) {
  return res.status(400).json({
    success: false,
    error: 'Erro de validação',
    data: { errors },
  });
}

/**
 * Envia um erro de método não permitido
 */
export function sendMethodNotAllowed(res: NextApiResponse) {
  return res.status(405).json({
    success: false,
    error: 'Método não permitido',
  });
}

/**
 * Envia um erro de não encontrado
 */
export function sendNotFound(res: NextApiResponse) {
  return res.status(404).json({
    success: false,
    error: 'Recurso não encontrado',
  });
}

/**
 * Envia um erro de não autorizado
 */
export function sendUnauthorized(res: NextApiResponse) {
  return res.status(401).json({
    success: false,
    error: 'Não autorizado',
  });
}

/**
 * Envia um erro de acesso negado
 */
export function sendForbidden(res: NextApiResponse) {
  return res.status(403).json({
    success: false,
    error: 'Acesso negado',
  });
}

/**
 * Envia um erro de conflito (ex: double booking)
 */
export function sendConflict(res: NextApiResponse, message: string) {
  return res.status(409).json({
    success: false,
    error: message || 'Conflito detectado',
  });
}

/**
 * Envia um erro de servidor interno
 */
export function sendInternalError(res: NextApiResponse, error?: any) {
  console.error('Erro interno do servidor:', error);
  return res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
  });
}

/**
 * Envia uma resposta paginada
 */
export function sendPaginated<T>(
  res: NextApiResponse,
  data: T[],
  total: number,
  page: number = 1,
  pageSize: number = 20
) {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
