// app/privacidade/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidade - CalenderPsico',
  description: 'Política de privacidade do sistema de agendamento CalenderPsico',
};

export default function PrivacyPolicyPage() {
  return (
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
            Seus dados <strong>não são compartilhados com terceiros</strong>. As informações são acessadas apenas pela psicóloga responsável 
            e pelo sistema para fins de agendamento.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#101010] mb-3">4. Armazenamento e Segurança</h2>
          <p>
            Os dados são armazenados em ambiente seguro na plataforma Supabase, com criptografia em trânsito (HTTPS) 
            e medidas de proteção adequadas. As senhas são armazenadas de forma criptografada.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#101010] mb-3">5. Retenção de Dados</h2>
          <p>
            Os dados de agendamentos são mantidos pelo tempo necessário para fins de registro e histórico. 
            Agendamentos cancelados ou concluídos são automaticamente removidos após 30 dias.
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
            Para exercer qualquer um desses direitos, entre em contato pelo e-mail: <strong>santos.erisk@gmail.com</strong>
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
          <p className="mt-2">
            <strong>santos.erisk@gmail.com</strong>
          </p>
        </div>

        <div className="text-center pt-8">
          <Link href="/" className="text-[#C2183A] hover:text-[#a0162f] transition">
            ← Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}