import { addMinutes } from 'date-fns';
import nodemailer from 'nodemailer';
import { formatDateTimeBR, sanitizeString } from '@/lib/utils';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 0);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = SMTP_USER; // Usar o mesmo email do usuário SMTP como remetente
const DEFAULT_DURATION = Number(process.env.DEFAULT_SESSION_DURATION_MINUTES ?? 60);
const DURATION_MINUTES =
  Number.isFinite(DEFAULT_DURATION) && DEFAULT_DURATION > 0 ? DEFAULT_DURATION : 60;

const senderAvailable =
  Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM && SMTP_PORT > 0);

const transporter = senderAvailable
  ? nodemailer.createTransport({
      host: SMTP_HOST!,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER!,
        pass: SMTP_PASS!,
      },
    })
  : null;

function formatUtcForCalendar(date: Date) {
  return date
    .toISOString()
    .replace(/\.\d{3}/, '')
    .replace(/[-:]/g, '');
}

function escapeCalendarValue(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/[\r\n]+/g, '\\n')
    .replace(/([,;])/g, '\\$1');
}

function buildLocationText(location?: string) {
  return location?.trim() || 'Atendimento online com psicóloga';
}

function buildGoogleCalendarLink({
  summary,
  details,
  location,
  startUtc,
  endUtc,
}: {
  summary: string;
  details: string;
  location: string;
  startUtc: string;
  endUtc: string;
}) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: summary,
    dates: `${startUtc}/${endUtc}`,
    details,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildCalendarAttachment({
  appointmentId,
  summary,
  description,
  startDate,
  endDate,
  patientName,
  patientEmail,
  fromEmail,
}: {
  appointmentId: string;
  summary: string;
  description: string;
  startDate: Date;
  endDate: Date;
  patientName: string;
  patientEmail: string;
  fromEmail: string;
}) {
  const startUtc = formatUtcForCalendar(startDate);
  const endUtc = formatUtcForCalendar(endDate);
  const nowUtc = formatUtcForCalendar(new Date());
  const safeDescription = escapeCalendarValue(description);
  const safePatientName = escapeCalendarValue(patientName);
  const safeSummary = escapeCalendarValue(summary);

  return [
    'BEGIN:VCALENDAR',
    'METHOD:REQUEST',
    'PRODID:-//CalenderPisco//PT-BR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `UID:${appointmentId}@calenderpisco`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${safeSummary}`,
    `DESCRIPTION:${safeDescription}`,
    `ORGANIZER;CN=CalenderPisco:mailto:${fromEmail}`,
    `ATTENDEE;CN=${safePatientName};RSVP=TRUE:mailto:${patientEmail}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export interface AppointmentRequestedEmailOptions {
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  date: string;
  time: string;
  notes?: string | null;
}

export interface AppointmentConfirmedEmailOptions {
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  date: string;
  time: string;
  psychologistName?: string;
  notes?: string | null;
  durationMinutes?: number;
  location?: string;
}

export async function sendAppointmentRequestedEmail(options: AppointmentRequestedEmailOptions) {
  if (!transporter) {
    console.info('[SMTP] credenciais não configuradas; pulando envio de e-mail de solicitação de agendamento.');
    return;
  }

  const recipientEmail = SMTP_USER;
  const safePatientName = sanitizeString(options.patientName || 'Paciente');
  const safeNotes = options.notes ? sanitizeString(options.notes) : null;
  const safePhone = options.patientPhone?.trim() || 'não informado';

  const subject = `Nova solicitação de ambientação de ${safePatientName}`;
  const html = `
    <p>Olá,</p>
    <p>O paciente <strong>${safePatientName}</strong> solicitou uma ambientação no dia <strong>${options.date}</strong> às <strong>${options.time}</strong>.</p>
    <p><strong>E-mail do paciente:</strong> ${options.patientEmail}</p>
    <p><strong>Telefone do paciente:</strong> ${safePhone}</p>
    ${safeNotes ? `<p><strong>Mensagem do paciente:</strong> ${safeNotes}</p>` : ''}
    <p>Por favor, acesse o painel administrativo para aceitar ou cancelar esta solicitação. </p>
    </p> https://psicology-gold.vercel.app/ </p>
  `;

  const text = `Olá,

O paciente ${options.patientName} solicitou uma ambientação no dia ${options.date} às ${options.time}.

E-mail do paciente: ${options.patientEmail}
Telefone do paciente: ${safePhone}
${safeNotes ? `Mensagem do paciente: ${safeNotes}
` : ''}
Acesse o painel administrativo para aceitar ou cancelar esta solicitação.`;

  await transporter.sendMail({
    from: SMTP_FROM!,
    to: recipientEmail,
    subject,
    html,
    text: text.trim(),
  });
}

export async function sendAppointmentConfirmedEmail(options: AppointmentConfirmedEmailOptions) {
  if (!transporter) {
    console.info('[SMTP] credenciais não configuradas; pulando envio de e-mail de confirmação.');
    return;
  }

  const appointmentStart = new Date(`${options.date}T${options.time}:00`);
  if (Number.isNaN(appointmentStart.getTime())) {
    console.warn('[SMTP] data ou hora inválida, não é possível gerar o e-mail.', {
      date: options.date,
      time: options.time,
    });
    return;
  }

  const duration =
    options.durationMinutes && options.durationMinutes > 0
      ? options.durationMinutes
      : DURATION_MINUTES;
  const appointmentEnd = addMinutes(appointmentStart, duration);
  const formattedDateTime = formatDateTimeBR(appointmentStart);

  const psychologistLabel = options.psychologistName?.trim() || 'sua psicóloga';
  const safePatientName = sanitizeString(options.patientName || 'Paciente');
  const safeNotes = options.notes ? sanitizeString(options.notes) : null;

  const summary = `Consulta confirmada com ${psychologistLabel}`;
  const description = `Consulta confirmada para ${formattedDateTime}${
    safeNotes ? `\n${safeNotes}` : ''
  }`;
  const location = buildLocationText(options.location);
  const startUtc = formatUtcForCalendar(appointmentStart);
  const endUtc = formatUtcForCalendar(appointmentEnd);
  const googleLink = buildGoogleCalendarLink({
    summary,
    details: description,
    location,
    startUtc,
    endUtc,
  });

  const html = `
    <p>Olá ${safePatientName},</p>
    <p>Sua consulta com ${psychologistLabel} foi confirmada.</p>
    <p><strong>Data e hora:</strong> ${formattedDateTime}</p>
    <p><strong>Local:</strong> ${location}</p>
    <p><a href="${googleLink}" target="_blank" rel="noreferrer">Adicionar ao Google Agenda</a></p>
  `;

  const text = `
    Olá ${options.patientName},
    Sua consulta com ${psychologistLabel} foi confirmada para ${formattedDateTime}.
    Adicione ao Google Agenda: ${googleLink}
  `;

  await transporter.sendMail({
    from: SMTP_FROM!,
    to: options.patientEmail,
    subject: summary,
    html,
    text: text.trim(),
    attachments: [
      {
        filename: 'consulta.ics',
        content: buildCalendarAttachment({
          appointmentId: options.appointmentId,
          summary,
          description,
          startDate: appointmentStart,
          endDate: appointmentEnd,
          patientName: sanitizeString(options.patientName),
          patientEmail: options.patientEmail,
          fromEmail: SMTP_FROM!,
        }),
        contentType: 'text/calendar; charset=UTF-8; method=REQUEST',
      },
    ],
  });
}
