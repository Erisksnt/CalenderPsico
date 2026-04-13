'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isAdminSection = Boolean(
    pathname?.startsWith('/admin') &&
    pathname !== '/admin/login'
  );

  const isPublicPage = !pathname?.startsWith('/admin');

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('token');
      router.push('/admin/login');
      setLoggingOut(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200/70 shadow-sm">
      <nav className="container mx-auto px-6 py-5 flex items-center justify-between gap-6">
        <Link href="/" className="font-semibold text-xl tracking-tight text-[#101010]">
          CalenderPsico
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium text-[#4d4d4d]">
          {isAdminSection ? (
            // ✅ ÁREA ADMIN LOGADO - só mostra o botão de logout
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-full bg-[#C2183A] px-5 py-2 text-white tracking-wide shadow-md transition hover:bg-[#a0162f] disabled:opacity-60"
            >
              {loggingOut ? 'Saindo...' : 'Encerrar sessão'}
            </button>
          ) : isPublicPage ? (
            // ✅ PÁGINAS PÚBLICAS - mostra os dois links
            <>
              <Link href="/admin" className="transition hover:text-[#C2183A]">
                Login
              </Link>
              <Link
                href="/agendar"
                className="rounded-full bg-[#C2183A] px-5 py-2 text-white tracking-wide shadow-md transition hover:bg-[#a0162f]"
              >
                Agendar pré-consulta
              </Link>
            </>
          ) : null}
        </div>
      </nav>
    </header>
  );
}