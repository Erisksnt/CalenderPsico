'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { SiteSettings } from '@/lib/site-settings-types';

export default function Header({ settings }: { settings: SiteSettings }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const contactHref = settings.contacts.whatsapp_link || '/agendar';

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-[var(--site-accent)]/15 bg-[var(--site-surface)]/95 backdrop-blur shadow-sm"
      style={{ backgroundColor: settings.appearance.colors.surface }}
    >
      <nav className="w-full h-16 sm:h-24 relative flex items-center justify-between px-6 sm:px-12">

        {/* LOGO: Tamanho compacto no mobile (fluxo normal) e grande com absolute no desktop */}
        <Link href="/" aria-label={settings.brand.name || 'Página inicial'} className="shrink-0 relative flex items-center">
          {settings.brand.logo_url ? (
            <img
              src={settings.brand.logo_url}
              alt={settings.brand.name || 'Logo'}
              className="h-16 w-auto max-w-[160px] object-contain sm:h-28 sm:max-w-[340px] sm:absolute sm:left-0 sm:top-1/2 sm:-translate-y-1/2 transition-all duration-300"
            />
          ) : (
            <span className="font-display text-xl sm:text-2xl font-semibold">{settings.brand.name}</span>
          )}
        </Link>

        {/* Espaçamento reservado apenas para o desktop para acomodar a logo absoluta */}
        <div className="hidden sm:block w-[280px]" aria-hidden="true" />

        {/* Botão do Menu Mobile */}
        <button
          type="button"
          className="rounded-lg border border-current/20 px-3.5 py-2 text-sm font-medium lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          Menu
        </button>

        {/* Navegação e Botão de Ação */}
        <div
          id="site-navigation"
          className={`${
            menuOpen ? 'flex' : 'hidden'
          } absolute top-full left-0 w-full flex-col items-start gap-4 bg-[var(--site-surface)] border-b border-[var(--site-accent)]/15 px-6 py-6 shadow-xl lg:static lg:w-auto lg:flex lg:flex-row lg:items-center lg:gap-8 lg:bg-transparent lg:border-none lg:p-0 lg:shadow-none z-50`}
        >
          {settings.navigation.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium tracking-wide uppercase hover:opacity-75 transition-opacity py-1 lg:py-0 w-full lg:w-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {item.label}
            </Link>
          ))}
          {settings.hero.cta_text && (
            <a
              href={contactHref}
              target={settings.contacts.whatsapp_link ? '_blank' : undefined}
              rel={settings.contacts.whatsapp_link ? 'noopener noreferrer' : undefined}
              className="btn-marsala w-full lg:w-auto text-center px-5 py-2.5 text-sm tracking-wide uppercase shadow-md mt-2 lg:mt-0"
              onClick={() => setMenuOpen(false)}
            >
              {settings.hero.cta_text}
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}