import Link from 'next/link';
import prisma from '@/lib/database';

async function loadProfile() {
  try {
    return await prisma.profile.findFirst({ orderBy: { created_at: 'asc' } });
  } catch {
    return null;
  }
}

export default async function Home() {
  const profile = await loadProfile();

  return (
    <div className="container mx-auto px-4 space-y-8">
      <section className="bg-white border rounded p-8 text-center space-y-4">
        {profile?.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.photo_url} alt={profile.full_name} className="w-32 h-32 rounded-full object-cover mx-auto" />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-200 mx-auto" />
        )}
        <h1 className="text-4xl font-bold">{profile?.full_name || 'Psicólogo(a)'}</h1>
        <p className="text-gray-700 max-w-2xl mx-auto">{profile?.professional_bio || 'Apresentação profissional disponível em breve.'}</p>
        <p className="max-w-2xl mx-auto"><strong>Método de trabalho:</strong> {profile?.work_method || 'Abordagem centrada no paciente com escuta ativa e plano terapêutico personalizado.'}</p>
        <div>
          <h2 className="font-semibold">Especialidades</h2>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {(profile?.specialties || ['Ansiedade', 'Depressão']).map((item: string) => (
              <span key={item} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">{item}</span>
            ))}
          </div>
        </div>
        <Link href="/agendar" className="inline-block bg-blue-600 text-white px-6 py-3 rounded font-semibold">
          Agende um horário comigo
        </Link>
      </section>
    </div>
  );
}
