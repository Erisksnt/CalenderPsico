import { redirect } from 'next/navigation';
import { getAdminFromServerCookie } from '@/lib/auth';
import AdminPanel from '@/components/admin/AdminPanel';

export default async function AdminPage() {
  
  // ✅ Tenta verificar com cookie (pode falhar)
  const admin = await getAdminFromServerCookie();
  
  // Se não tiver cookie, ainda assim renderiza o painel
  // O AdminPanel vai verificar o token no cliente
  if (!admin) redirect('/login/admin');

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Painel do psicólogo</h1>
      <AdminPanel />
    </main>
  );
}