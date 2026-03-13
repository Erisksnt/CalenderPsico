'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    setMessage('');

    const response = await fetch('/api/admin/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data?.error || 'Não foi possível enviar o link');
      return;
    }

    setMessage(data.message);
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 border rounded space-y-3">
      <h1 className="text-2xl font-bold">Esqueceu a senha?</h1>
      <p className="text-sm text-gray-600">Informe seu email para receber um link de redefinição.</p>
      <input className="border rounded p-2 w-full" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submit}>Enviar link</button>
      {message && <p className="text-green-700 text-sm">{message}</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <p className="text-sm"><Link className="text-blue-600" href="/admin/login">Voltar ao login</Link></p>
    </div>
  );
}
