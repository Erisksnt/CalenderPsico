// app/(psychologist)/layout.tsx
// Layout para páginas do psicólogo

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PsychologistLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Verifica se o usuário está autenticado e é psicólogo
    const userRole = localStorage.getItem('userRole');
    if (!userRole || userRole !== 'PSYCHOLOGIST') {
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className="container mx-auto px-6">
      <nav className="mb-8 flex gap-4 border-b pb-4">
        <a href="/psychologist/dashboard" className="font-bold text-blue-600 hover:text-blue-700">
          Dashboard
        </a>
        <a href="/psychologist/availability" className="font-bold text-blue-600 hover:text-blue-700">
          Disponibilidades
        </a>
        <a href="/psychologist/services" className="font-bold text-blue-600 hover:text-blue-700">
          Serviços
        </a>
        <a href="/psychologist/appointments" className="font-bold text-blue-600 hover:text-blue-700">
          Agendamentos
        </a>
      </nav>
      {children}
    </div>
  );
}
