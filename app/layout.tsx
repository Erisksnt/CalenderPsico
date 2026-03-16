// app/layout.tsx
// Layout raiz da aplicação

import type { Metadata } from 'next';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'CalenderPsico - Agendamento para Psicólogos',
  description: 'Sistema completo de agendamento online para psicólogos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-transparent text-[#101010]">
        <Header />
        <main className="min-h-screen py-12">
          <div className="container mx-auto px-6">{children}</div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
