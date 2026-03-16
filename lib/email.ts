import { formatDateTimeBR } from '@/lib/utils';

const rawApiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM || 'noreply@calenderpisco.com';
const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const sendgridEnabled = Boolean(rawApiKey);

export interface AppointmentConfirmationEmailPayload {
  token: string;
  patientName: string;
  serviceName: string;
  startTime: Date;
  endTime?: Date;
}

export async function sendConfirmationEmail(
  to: string,
  payload: AppointmentConfirmationEmailPayload
) {
  const confirmUrl = `${appUrl}/confirm/${payload.token}`;
  const startText = formatDateTimeBR(payload.startTime);
  const endText = payload.endTime ? formatDateTimeBR(payload.endTime) : null;
  const timeText = endText ? `${startText} - ${endText}` : startText;
  const subject = 'Confirme seu agendamento';
  const html = `
    <p>Olá ${payload.patientName},</p>
    <p>Seu agendamento de <strong>${payload.serviceName}</strong> foi registrado.</p>
    <p><strong>Data e hora:</strong> ${timeText}</p>
    <p>Clique abaixo para confirmar:</p>
    <p><a href="${confirmUrl}" target="_blank" rel="noreferrer">Confirmar agendamento</a></p>
    <p>Se você não agendou esse horário, desconsidere esta mensagem.</p>
  `;
  const text = `Olá ${payload.patientName}, confirme ${payload.serviceName} em ${timeText}: ${confirmUrl}`;

  if (!sendgridEnabled || !rawApiKey) {
    console.info(
      `[SENDGRID MOCK] ${subject} -> ${to}. Link: ${confirmUrl}. Payload: ${payload.serviceName}`
    );
    return;
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${rawApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao enviar e-mail pelo SendGrid (${response.status}): ${body}`);
  }
}
