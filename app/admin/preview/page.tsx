import { redirect } from 'next/navigation';
import { getAdminFromServerCookie } from '@/lib/auth';
import { getAdminSiteSettings } from '@/lib/site-settings';
import SitePreviewClient from '@/components/admin/SitePreviewClient';

export const dynamic = 'force-dynamic';

export default async function AdminPreviewPage() {
  const admin = await getAdminFromServerCookie();
  if (!admin || admin.role !== 'ADMIN') redirect('/login/admin');

  try {
    const { draft } = await getAdminSiteSettings();
    return <SitePreviewClient initialSettings={draft} />;
  } catch (error) {
    console.error('Erro ao carregar preview administrativo:', error);
    throw error;
  }
}
