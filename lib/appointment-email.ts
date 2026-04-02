import { addMinutes } from 'date-fns';
import nodemailer from 'nodemailer';
import { formatDateTimeBR, sanitizeString } from '@/lib/utils';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 0);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
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

  const htmlNotes = safeNotes ? `<p><strong>Mensagem:</strong> ${safeNotes}</p>` : '';

  const html = `
    <p>Olá ${safePatientName},</p>
    <p>Sua consulta com ${psychologistLabel} foi confirmada.</p>
    <p><strong>Data e hora:</strong> ${formattedDateTime}</p>
    <p><strong>Local:</strong> ${location}</p>
    ${htmlNotes}
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
