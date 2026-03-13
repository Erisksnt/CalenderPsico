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
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        router.push('/admin');
      } else {
        setError(data?.error || 'Falha no login');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 border rounded space-y-3">
      <h1 className="text-2xl font-bold">Login do psicólogo</h1>

      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          required
          className="border rounded p-2 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          required
          className="border rounded p-2 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
        />
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-300">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div className="flex justify-between text-sm">
        <Link className="text-blue-600 hover:underline" href="/admin/forgot-password">
          Esqueceu a senha?
        </Link>
        <Link className="text-blue-600 hover:underline" href="/admin/register">
          Criar conta
        </Link>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
