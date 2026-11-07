// app/privacidade/page.tsx
import Link from 'next/link';
import PublicShell from '@/components/public/PublicShell';
import { getPublishedSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Thais Almeida | Psicóloga',
  description: 'Política de privacidade do sistema de agendamento CalenderPsico',
};

export default async function PrivacyPolicyPage() {
  const settings = await getPublishedSiteSettings();
  return (
    <PublicShell settings={settings}>
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-[#101010] mb-6">Política de Privacidade</h1>
      <p className="text-sm text-[#4d4d4d] mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

      <div className="space-y-8 text-[#4d4d4d] leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-[#101010] mb-3">1. Informações Coletadas</h2>
          <p>
            Coletamos as seguintes informações fornecidas voluntariamente pelos pacientes durante o agendamento:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Nome completo</li>
            <li>Endereço de e-mail</li>
            <li>Número de telefone / WhatsApp</li>
            <li>Mensagem opcional</li>
            <li>Data e horário da consulta</li>
          </ul>
          <p className="mt-2">
            Essas informações são essenciais para o processo de agendamento e comunicação entre paciente e psicóloga.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#101010] mb-3">2. Finalidade do Tratamento</h2>
          <p>Os dados coletados são utilizados exclusivamente para:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Agendamento de consultas de ambientação</li>
            <li>Comunicação sobre o agendamento (confirmação, cancelamento, alterações)</li>
            <li>Contato entre paciente e psicóloga</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#101010] mb-3">3. Compartilhamento de Dados</h2>
          <p>
            Os dados são acessados pela psicóloga responsável e podem ser processados pelos provedores de infraestrutura
            e de e-mail configurados para operar o sistema, exclusivamente para armazenamento e comunicação sobre o
            agendamento. Eles não são vendidos nem utilizados para publicidade.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#101010] mb-3">4. Armazenamento e Segurança</h2>
          <p>
            Os dados de agendamento são armazenados no banco de dados configurado para o sistema e as imagens no
            armazenamento de mídia configurado. As senhas do painel são armazenadas como hashes. A infraestrutura de
            implantação deve proteger o tráfego com HTTPS e restringir o acesso aos dados.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#101010] mb-3">5. Retenção de Dados</h2>
          <p>
            Os dados são mantidos pelo tempo necessário para administrar os atendimentos. A exclusão não é automática:
            registros cancelados ou concluídos com mais de 30 dias podem ser removidos pelo administrador, e você pode
            solicitar a exclusão dos seus dados pelos canais de contato.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#101010] mb-3">6. Seus Direitos (LGPD)</h2>
          <p>
            De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Confirmar a existência de tratamento de seus dados</li>
            <li>Acessar seus dados</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
            <li>Solicitar a exclusão de seus dados</li>
            <li>Revogar o consentimento a qualquer momento</li>
          </ul>
          <p className="mt-2">
            Para exercer qualquer um desses direitos, utilize os canais de contato disponíveis neste site.
            {settings.contacts.email && (
              <> E-mail: <a className="underline" href={`mailto:${settings.contacts.email}`}>{settings.contacts.email}</a>.</>
            )}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#101010] mb-3">7. Consentimento</h2>
          <p>
            Ao marcar a caixa de consentimento no formulário de agendamento, você declara estar ciente e de acordo 
            com os termos desta Política de Privacidade.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#101010] mb-3">8. Alterações nesta Política</h2>
          <p>
            Esta política pode ser atualizada periodicamente. Qualquer alteração será publicada nesta página 
            com a data da última atualização.
          </p>
        </section>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-8">
          <h2 className="text-lg font-semibold text-[#101010] mb-2">Contato</h2>
          <p>Em caso de dúvidas sobre privacidade ou tratamento de dados, entre em contato:</p>
          {settings.contacts.email && (
            <p className="mt-2">
              <a className="font-semibold underline" href={`mailto:${settings.contacts.email}`}>{settings.contacts.email}</a>
            </p>
          )}
        </div>

        <div className="text-center pt-8">
          <Link href="/" className="text-[#C2183A] hover:text-[#a0162f] transition">
            ← Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
    </PublicShell>
  );
}