import Link from 'next/link';
import prisma from '@/lib/database';

async function loadProfile() {
  try {
    const profile = await prisma.profile.findFirst({
      orderBy: { updated_at: 'desc' },
    });

    return profile;
  } catch {
    return null;
  }
}

export default async function Home() {
  const profile = await loadProfile();
  const specialties = profile?.specialties || ['Ansiedade', 'Depressão', 'Autoconhecimento'];

  return (
    <div className="space-y-10 pb-16 text-[#101010]">
      <section
        className="bg-white border border-gray-200 rounded-[32px] p-8 md:p-10 text-center"
        style={{ boxShadow: 'var(--shadow-soft)' }}
      >
        <div className="flex flex-col items-center gap-5">
          {profile?.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photo_url}
              alt={profile.full_name}
              className="w-32 h-32 rounded-full object-cover ring-2 ring-[#C2183A]/30"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-semibold text-gray-400">
              ?
            </div>
          )}
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.4em] text-[#4d4d4d]">Psicólogo(a) clínico(a)</p>
            <h1 className="text-4xl md:text-5xl font-semibold">{profile?.full_name || 'CalenderPsico'}</h1>
          </div>
        </div>
        <p className="mt-6 max-w-3xl mx-auto text-base leading-relaxed text-[#4d4d4d]">
          {profile?.professional_bio ||
            'Consultas presenciais e online com foco em acolhimento, planejamento terapêutico e evolução mensurável.'}
        </p>
        <p className="mt-4 text-sm max-w-3xl mx-auto text-[#4d4d4d]">
          <strong>Método de trabalho:</strong>{' '}
          {profile?.work_method ||
            'Escuta ativa, responsabilidade compartilhada e metas claras para cada etapa do acompanhamento.'}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {specialties.map((item) => (
            <span
              key={item}
              className="rounded-full border border-gray-200 px-4 py-1 text-sm text-[#4d4d4d] bg-gray-50 shadow-inner"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 md:flex-row md:justify-center">
          <Link href="/agendar" className="btn-primary">
            Ver disponibilidade
          </Link>
        </div>
      </section>

      <section
        className="bg-white border border-gray-200 rounded-[28px] p-8 md:p-10 grid gap-8 md:grid-cols-2"
        style={{ boxShadow: 'var(--shadow-soft)' }}
      >
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.5em] text-[#4d4d4d]">Como funciona</p>
          <h2 className="text-3xl font-semibold">Experiência minimalista com foco em confiança.</h2>
          <p className="text-sm leading-relaxed text-[#4d4d4d]">
            Cada etapa é acompanhada por transparência, pequenos relatórios de progresso e estímulo ao protagonismo do paciente.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              title: 'Pré-consulta',
              detail: 'Entrevista inicial para entender histórico e expectativas.',
            },
            {
              title: 'Plano personalizado',
              detail: 'Estratégia terapêutica com metas curtas, médias e longas.',
            },
            {
              title: 'Apoio contínuo',
              detail: 'Revisões de agenda, feedback regular e materiais de apoio.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-100 bg-gray-50/90 px-5 py-4 shadow-sm"
            >
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-[#4d4d4d]">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
