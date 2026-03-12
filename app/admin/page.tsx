import { redirect } from 'next/navigation';
import { getAdminFromServerCookie } from '@/lib/auth';
import AdminPanel from '@/components/admin/AdminPanel';

export default async function AdminPage() {
  const admin = await getAdminFromServerCookie();
  if (!admin) redirect('/admin/login');

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">Painel administrativo</h1>
      <AdminPanel />
    </div>
  );
}
