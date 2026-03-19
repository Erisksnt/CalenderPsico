'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('📤 Enviando login...');
      
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('📥 Resposta:', { status: response.status, data });

      if (response.ok) {
        console.log('✅ Login OK, salvando token...');
        
        // 🔥 LINHA IMPORTANTE - SALVAR O TOKEN!
        localStorage.setItem('token', data.token);
        
        console.log('✅ Token salvo, redirecionando...');
        router.push('/admin');
      } else {
        console.log('❌ Login falhou:', data.error);
        setError(data?.error || 'Falha no login');
      }
    } catch (error) {
      console.error('🔥 Erro:', error);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 border rounded space-y-4">
      <h1 className="text-2xl font-bold text-[#101010]">Login do Administrador</h1>

      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          required
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#C2183A] focus:ring-2 focus:ring-[#C2183A]/30"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />

        <input
          type="password"
          required
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#C2183A] focus:ring-2 focus:ring-[#C2183A]/30"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[#C2183A] px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-[#a0162f] disabled:opacity-60"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      {error && <p className="text-[#C2183A] text-sm">{error}</p>}

      <div className="space-y-1 text-sm text-[#4d4d4d]">
        <Link className="text-[#C2183A] hover:text-[#a0162f]" href="/admin/forgot-password">
          Esqueceu a senha?
        </Link>
        <p>Acesso exclusivo para administradores</p>
      </div>
    </div>
  );
}