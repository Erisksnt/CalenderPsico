'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    const response = await fetch('/api/admin/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data?.error || 'Falha no cadastro');
      return;
    }

    router.push('/admin/login');
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 border rounded space-y-3">
      <h1 className="text-2xl font-bold">Criar conta do psicólogo</h1>
      <input className="border rounded p-2 w-full" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" className="border rounded p-2 w-full" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha (mínimo 8 caracteres)" />
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submit}>Criar conta</button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <p className="text-sm">Já tem conta? <Link className="text-blue-600" href="/admin/login">Fazer login</Link></p>
    </div>
  );
}
