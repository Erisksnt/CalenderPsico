// app/(patient)/layout.tsx
// Layout para páginas do paciente

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Verifica se o usuário está autenticado
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    // Se não está logado, redireciona para login
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    // Se está logado como psicólogo, redireciona para dashboard do psicólogo
    if (userRole === 'PSYCHOLOGIST') {
      router.push('/psychologist/dashboard');
    }
  }, [router]);

  return <div className="container mx-auto px-6">{children}</div>;
}
