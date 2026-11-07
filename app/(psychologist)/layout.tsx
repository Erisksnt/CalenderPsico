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
      router.push('/login/admin');
    }
  }, [router]);

  return (
    <div className="container mx-auto px-6">
      {children}
    </div>
  );
}
