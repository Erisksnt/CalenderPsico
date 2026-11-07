import Link from 'next/link';
import type { SiteSettings } from '@/lib/site-settings-types';

export default function Footer({ settings }: { settings: SiteSettings }) {
  const { brand, contacts, footer, navigation } = settings;

  return (
    <footer
      className="px-6 py-12 text-white sm:px-10 lg:px-16"
      style={{ backgroundColor: settings.appearance.colors.accent_dark }}
    >
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
        <div className="space-y-4">
          <img
            src="/images/logo-offwhite.png"
            alt={brand.name || 'Logo'}
            className="h-16 w-auto max-w-[240px] object-contain sm:h-28 sm:max-w-[280px]"
          />
          {brand.professional_title && <p className="text-sm opacity-75">{brand.professional_title}</p>}
          {brand.footer_description && <p className="max-w-sm text-sm leading-relaxed opacity-75">{brand.footer_description}</p>}
          {contacts.crp && (
            <p className="text-sm opacity-75">
              {footer.registration_label}: {contacts.crp}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {footer.navigation_heading && <h2 className="text-sm font-semibold uppercase tracking-wider">{footer.navigation_heading}</h2>}
          <ul className="space-y-2 text-sm opacity-80">
            {navigation.map((item) => (
              <li key={item.id}><Link href={item.href} className="hover:underline">{item.label}</Link></li>
            ))}
            <li>
              <Link href="/privacidade" className="hover:underline">
                {footer.privacy_label || 'Política de Privacidade'}
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          {footer.contact_heading && <h2 className="text-sm font-semibold uppercase tracking-wider">{footer.contact_heading}</h2>}
          <address className="space-y-2 text-sm not-italic opacity-80">
            {contacts.phone && (
              <p>
                <a href={`tel:${contacts.phone.replace(/\D/g, '')}`} className="hover:underline">
                  {contacts.phone}
                </a>
              </p>
            )}
            {contacts.email && <p><a href={`mailto:${contacts.email}`} className="hover:underline">{contacts.email}</a></p>}
            {contacts.address && <p>{contacts.address}</p>}
            {contacts.instagram_url && <p><a href={contacts.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:underline">Instagram</a></p>}
            {contacts.tiktok_url && <p><a href={contacts.tiktok_url} target="_blank" rel="noopener noreferrer" className="hover:underline">TikTok</a></p>}
            {contacts.whatsapp_link && <p><a href={contacts.whatsapp_link} target="_blank" rel="noopener noreferrer" className="hover:underline">WhatsApp</a></p>}
          </address>
        </div>
      </div>

      {brand.emergency_notice && (
        <p className="mx-auto mt-10 max-w-7xl border-t border-white/20 pt-6 text-xs leading-relaxed opacity-70">
          {brand.emergency_notice}
        </p>
      )}
      <p className="mx-auto mt-6 max-w-7xl text-xs opacity-60">
        © {new Date().getFullYear()} {brand.name}. {footer.copyright_text}
      </p>
    </footer>
  );
}