import type { SiteSettings } from '@/lib/site-settings-types';

export default function SocialFloat({ settings }: { settings: SiteSettings }) {
  const links = [
    { href: settings.contacts.whatsapp_link, label: 'WhatsApp' },
    { href: settings.contacts.instagram_url, label: 'Instagram' },
    { href: settings.contacts.tiktok_url, label: 'TikTok' },
  ].filter((link) => link.href);

  if (links.length === 0) return null;

  return (
    <aside
      aria-label="Canais de contato"
      className="fixed bottom-5 right-5 z-20 flex flex-col gap-2"
    >
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
            link.label === 'WhatsApp'
              ? 'bg-[#25D366]'
              : link.label === 'Instagram'
                ? 'bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#4F5BD5]'
                : 'bg-black'
          }`}
          aria-label={`Acessar ${link.label}`}
        >
          <SocialIcon name={link.label} />
        </a>
      ))}
    </aside>
  );
}

function SocialIcon({ name }: { name: string }) {
  if (name === 'WhatsApp') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
        <path d="M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.5 0 .14 5.35.14 11.93c0 2.1.55 4.15 1.6 5.96L.05 24l6.27-1.64a11.94 11.94 0 0 0 5.76 1.47h.01c6.57 0 11.93-5.35 11.93-11.93 0-3.19-1.24-6.19-3.5-8.42ZM12.09 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.98.99-3.63-.23-.37a9.87 9.87 0 0 1-1.52-5.26c0-5.46 4.44-9.9 9.9-9.9a9.83 9.83 0 0 1 7 2.9 9.83 9.83 0 0 1 2.9 7c0 5.46-4.45 9.9-9.91 9.9Zm5.43-7.41c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.47-2.4-1.49-.89-.79-1.49-1.77-1.67-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.68-1.64-.93-2.25-.24-.59-.49-.51-.68-.52h-.58c-.2 0-.53.07-.81.38-.28.3-1.06 1.04-1.06 2.53s1.09 2.94 1.24 3.14c.15.2 2.15 3.28 5.2 4.6.73.31 1.3.5 1.74.64.73.23 1.4.2 1.92.12.59-.09 1.77-.73 2.02-1.44.25-.71.25-1.32.17-1.45-.07-.13-.27-.2-.57-.35Z" />
      </svg>
    );
  }

  if (name === 'Instagram') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="18" cy="6" r="1" className="fill-current stroke-none" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.32V2h-3.47v13.67a2.89 2.89 0 0 1-2.89 2.89 2.89 2.89 0 1 1 2.89-2.89c0-.2-.02-.4-.06-.6V11.5a6.37 6.37 0 1 0 3.53 5.7V9.87a8.27 8.27 0 0 0 4.84 1.55V7.96a4.85 4.85 0 0 1-1.07-.12Z" />
    </svg>
  );
}
