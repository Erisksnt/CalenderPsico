// app/layout.tsx
// Layout raiz da aplicação — Identidade Visual Thaís Almeida

import type { Metadata } from 'next';
import './globals.css';
import { initializeSystem } from '@/lib/init';
if (typeof window === 'undefined') initializeSystem().catch(console.error);

export const metadata: Metadata = {
  title: 'Thais Almeida | Psicóloga',
  icons: {
    icon: '/images/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
