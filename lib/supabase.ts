// lib/supabase.ts
// Configuração e client do Supabase para autenticação

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variáveis de ambiente Supabase não configuradas');
}

/**
 * Cliente Supabase para operações do lado do cliente
 * Use este client em componentes React
 */
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Cliente Supabase com service role key para operações do servidor
 * Use apenas em API Routes (nunca exponha a service role key ao cliente)
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Registra um novo usuário via Supabase Auth
 */
export async function signUpUser(email: string, password: string) {
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.user;
  } catch (error) {
    throw error;
  }
}

/**
 * Faz login com email e senha
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Faz logout do usuário
 */
export async function signOut() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Obtém a sessão atual
 */
export async function getSession() {
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
      throw new Error(error.message);
    }
    return data.session;
  } catch (error) {
    throw error;
  }
}

/**
 * Obtém o usuário atualmente autenticado
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error) {
      throw new Error(error.message);
    }
    return data.user;
  } catch (error) {
    throw error;
  }
}

/**
 * Envia um link de reset de senha
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Atualiza a senha do usuário
 */
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabaseClient.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Obtém o usuário autenticado pelo admin
 * Use apenas no servidor
 */
export async function getAdminUser(userId: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error) {
      throw new Error(error.message);
    }

    return data.user;
  } catch (error) {
    throw error;
  }
}

/**
 * Cria um novo usuário via admin
 * Use apenas no servidor
 */
export async function createAdminUser(email: string, password: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.user;
  } catch (error) {
    throw error;
  }
}

/**
 * Deleta um usuário via admin
 * Use apenas no servidor
 */
export async function deleteAdminUser(userId: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    throw error;
  }
}
