// components/auth/RegisterForm.tsx
// Formulário de registro

'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<'PSYCHOLOGIST' | 'PATIENT'>('PATIENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (role === 'PSYCHOLOGIST' && !registrationNumber) {
      setError('Número de registro (CRP) é obrigatório para psicólogos');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role,
          name,
          phone,
          registration_number: registrationNumber,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Erro ao registrar');
        return;
      }

      // Redireciona para login
      router.push('/login');
    } catch (err) {
      setError('Erro ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6">Registrar</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Tipo de Usuário</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'PSYCHOLOGIST' | 'PATIENT')}
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="PATIENT">Paciente</option>
          <option value="PSYCHOLOGIST">Psicólogo</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Nome Completo</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Seu Nome"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="seu@email.com"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Telefone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="(11) 99999-9999"
        />
      </div>

      {role === 'PSYCHOLOGIST' && (
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">CRP (ex: 06/123456)</label>
          <input
            type="text"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="06/123456"
          />
        </div>
      )}

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="••••••"
        />
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 font-bold mb-2">Confirmar Senha</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? 'Registrando...' : 'Registrar'}
      </button>

      <p className="text-center mt-4 text-gray-600">
        Já tem conta?{' '}
        <a href="/login" className="text-blue-600 hover:text-blue-700 font-bold">
          Faça login
        </a>
      </p>
    </form>
  );
}
