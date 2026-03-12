'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (response.ok) router.push('/admin');
    else setError('Falha no login');
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 border rounded space-y-3">
      <h1 className="text-2xl font-bold">Login do psicólogo</h1>
      <input className="border rounded p-2 w-full" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" className="border rounded p-2 w-full" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" />
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submit}>Entrar</button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
