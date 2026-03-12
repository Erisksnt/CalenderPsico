// components/shared/Header.tsx
// Header/Navbar do site

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Verifica se o usuário está logado
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    setIsLoggedIn(!!token);
    setUserRole(role);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  return (
    <header className="bg-white shadow">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="font-bold text-2xl text-blue-600">
          🧠 CalenderPsico
        </Link>

        {/* Menu */}
        <ul className="flex gap-6 items-center">
          <li>
            <Link href="/" className="text-gray-600 hover:text-blue-600 transition">
              Início
            </Link>
          </li>

          {isLoggedIn ? (
            <>
              {userRole === 'PSYCHOLOGIST' && (
                <li>
                  <Link href="/psychologist/dashboard" className="text-gray-600 hover:text-blue-600 transition">
                    Dashboard
                  </Link>
                </li>
              )}

              {userRole === 'PATIENT' && (
                <li>
                  <Link href="/patient/schedule" className="text-gray-600 hover:text-blue-600 transition">
                    Agendar
                  </Link>
                </li>
              )}

              <li>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link href="/login" className="text-gray-600 hover:text-blue-600 transition">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                  Registrar
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}
