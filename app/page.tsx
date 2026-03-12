// app/page.tsx
// Página inicial/home

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AvailabilityList from '@/components/patient/AvailabilityList';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verifica se usuário está logado
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    setIsLoggedIn(!!token);
    setUserRole(role);
    setIsLoading(false);

    // Se psicólogo está logado, redireciona para dashboard
    if (token && role === 'PSYCHOLOGIST') {
      router.push('/psychologist/dashboard');
    }
  }, [router]);

  if (isLoading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="container mx-auto px-6 mb-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">🧠 CalenderPsico</h1>
          <p className="text-xl text-gray-600 mb-8">
            Plataforma simplificada de agendamento online para psicólogos e pacientes
          </p>
          
          {!isLoggedIn && (
            <div className="flex gap-4 justify-center">
              <Link
                href="/register"
                className="bg-blue-600 text-white px-8 py-3 rounded font-bold hover:bg-blue-700 transition"
              >
                Começar Agora
              </Link>
              <Link
                href="/login"
                className="border border-blue-600 text-blue-600 px-8 py-3 rounded font-bold hover:bg-blue-50 transition"
              >
                Fazer Login
              </Link>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-bold mb-2">Agendamento Fácil</h3>
            <p className="text-gray-600">
              Pacientes podem visualizar horários disponíveis e agendar em minutos
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-bold mb-2">Segurança</h3>
            <p className="text-gray-600">
              Autenticação segura e proteção de dados dos pacientes
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Dashboard</h3>
            <p className="text-gray-600">
              Psicólogos têm controle total sobre sua agenda
            </p>
          </div>
        </div>
      </section>

      {/* Disponibilidades - Apenas para usuários não autenticados */}
      {!isLoggedIn && (
        <section className="bg-white py-12 mb-16">
          <AvailabilityList />
        </section>
      )}

      {/* CTA - Apenas para usuários não autenticados */}
      {!isLoggedIn && (
        <section className="container mx-auto px-6 bg-blue-600 text-white rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Está pronto para começar?</h2>
          <p className="text-xl mb-8">
            Crie sua conta agora e comece a gerenciar sua agenda
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded font-bold hover:bg-gray-100 transition"
          >
            Registrar-se Gratuitamente
          </Link>
        </section>
      )}

      {/* Mensagem para usuarios logados */}
      {isLoggedIn && userRole === 'PATIENT' && (
        <section className="bg-white py-12">
          <AvailabilityList />
        </section>
      )}
    </div>
  );
}
