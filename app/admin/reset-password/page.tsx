'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    setMessage('');

    const response = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data?.error || 'Não foi possível redefinir a senha');
      return;
    }

    setMessage('Senha redefinida com sucesso. Faça login com a nova senha.');
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 border rounded space-y-3">
      <h1 className="text-2xl font-bold">Redefinir senha</h1>
      {!token && <p className="text-red-600 text-sm">Token ausente.</p>}
      <input type="password" className="border rounded p-2 w-full" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nova senha (mínimo 8 caracteres)" />
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submit} disabled={!token}>Salvar nova senha</button>
      {message && <p className="text-green-700 text-sm">{message}</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <p className="text-sm"><Link className="text-blue-600" href="/admin/login">Ir para login</Link></p>
    </div>
  );
}
