import type { CSSProperties, ReactNode } from 'react';
import type { SiteSettings } from '@/lib/site-settings-types';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import SocialFloat from '@/components/shared/SocialFloat';
import ScrollReveal from '@/components/public/ScrollReveal';

const HEADING_FONT_STACKS: Record<SiteSettings['appearance']['heading_font'], string> = {
  'The Seasons': '"The Seasons", "Palatino Linotype", "Book Antiqua", Georgia, serif',
  'Cormorant Garamond': '"Cormorant Garamond", "Palatino Linotype", Georgia, serif',
  'Playfair Display': '"Playfair Display", "Palatino Linotype", Georgia, serif',
  Georgia: 'Georgia, serif',
};

const BODY_FONT_STACKS: Record<SiteSettings['appearance']['body_font'], string> = {
  Garet: 'Garet, "Century Gothic", "Trebuchet MS", Arial, sans-serif',
  Inter: 'Inter, "Segoe UI", Arial, sans-serif',
  Montserrat: 'Montserrat, "Century Gothic", Arial, sans-serif',
  'Open Sans': '"Open Sans", "Segoe UI", Arial, sans-serif',
  Arial: 'Arial, sans-serif',
};

export default function PublicShell({
  settings,
  children,
}: {
  settings: SiteSettings;
  children: ReactNode;
}) {
  const style = {
    '--site-accent': settings.appearance.colors.accent,
    '--site-accent-dark': settings.appearance.colors.accent_dark,
    '--site-text': settings.appearance.colors.text,
    '--site-body': settings.appearance.colors.text_muted,
    '--site-surface': settings.appearance.colors.surface,
    '--site-heading-font': HEADING_FONT_STACKS[settings.appearance.heading_font],
    '--site-heading-font-size': `${settings.appearance.heading_font_size}px`,
    '--site-body-font-size': `${settings.appearance.body_font_size}px`,
    backgroundColor: settings.appearance.colors.background,
    color: settings.appearance.colors.text_muted,
    fontFamily: BODY_FONT_STACKS[settings.appearance.body_font],
  } as CSSProperties;

  return (
    <div className="site-theme min-h-screen" style={style}>
      <ScrollReveal>
        <Header settings={settings} />
        <main>{children}</main>
        <Footer settings={settings} />
      </ScrollReveal>
      <SocialFloat settings={settings} />
    </div>
  );
}
