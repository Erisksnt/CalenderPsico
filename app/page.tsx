import type { Metadata } from 'next';
import SitePage from '@/components/public/SitePage';
import { getPublishedSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublishedSiteSettings();
  return {
    title: 'Thais Almeida | Psicóloga',
    description: settings.hero.subtitle || undefined,
  };
}

export default async function HomePage() {
  const settings = await getPublishedSiteSettings();
  return <SitePage settings={settings} />;
}
