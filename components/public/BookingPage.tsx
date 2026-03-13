'use client';

import { useMemo, useState } from 'react';

const SUCCESS_MESSAGE = `Sua ambientação foi solicitada com sucesso e está aguardando a confirmação do psicólogo.

Essa conversa inicial servirá para que vocês possam se conhecer melhor e entender se desejam iniciar o processo terapêutico.

Você receberá a confirmação da agenda por e-mail ou contato telefônico.`;

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_REGEX = /^\d{10,11}$/;
const INITIAL_FORM_STATE = { nome: '', email: '', telefone: '', mensagem: '' };
const INITIAL_FIELD_ERRORS = { email: '', telefone: '' };

function todayISO() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
}

function getCurrentTimeSlot() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function BookingPage() {
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState(INITIAL_FIELD_ERRORS);
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successModalText, setSuccessModalText] = useState('');

  const minDate = useMemo(() => todayISO(), []);

  const visibleSlots = useMemo(() => {
    if (date !== minDate) return slots;
    const currentTime = getCurrentTimeSlot();
    return slots.filter((slot) => slot > currentTime);
  }, [date, minDate, slots]);

  function validateEmail(value: string) {
    const trimmed = value.trim();
    const valid = EMAIL_REGEX.test(trimmed);
    return valid ? '' : 'Insira um e-mail válido';
  }

  function validatePhone(value: string) {
    return PHONE_REGEX.test(value) ? '' : 'Insira um número de telefone válido';
  }

  function resetFlow() {
    setForm({ ...INITIAL_FORM_STATE });
    setFieldErrors({ ...INITIAL_FIELD_ERRORS });
    setDate('');
    setSelected('');
    setSlots([]);
    setMessage('');
  }

  function closeSuccessModal() {
    setIsSuccessModalOpen(false);
    setSuccessModalText('');
  }

  async function loadSlots(value: string) {
    if (!value || value < minDate) {
      setDate(value);
      setSlots([]);
      setSelected('');
      setMessage('Selecione uma data de hoje em diante para solicitar uma ambientação.');
      return;
    }

    setDate(value);
    setSelected('');
    setMessage('');
    const response = await fetch(`/api/public/slots?date=${value}`);
    const data = await response.json();
    setSlots(data.slots || []);
  }

  const hasFieldError = Boolean(fieldErrors.email || fieldErrors.telefone);
  const canSubmit = useMemo(
    () => Boolean(date && selected && form.nome && form.email && form.telefone && !hasFieldError),
    [date, selected, form, hasFieldError],
  );

  async function submit() {
    if (date < minDate) {
      setMessage('Não é possível solicitar ambientação em datas anteriores ao dia atual.');
      return;
    }

    const emailError = validateEmail(form.email);
    const phoneError = validatePhone(form.telefone);
    setFieldErrors({ email: emailError, telefone: phoneError });

    if (emailError || phoneError) {
      setMessage('Corrija os campos destacados para enviar sua solicitação de ambientação.');
      return;
    }

    setMessage('');
    const response = await fetch('/api/public/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, data: date, hora: selected }),
    });

    const data = await response.json();
    if (response.ok) {
      setSuccessModalText(data.message || SUCCESS_MESSAGE);
      resetFlow();
      setIsSuccessModalOpen(true);
    } else {
      setMessage(data.error || 'Erro ao enviar solicitação');
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Solicitar ambientação</h1>
      <p className="text-gray-700">A ambientação é uma conversa inicial para você conhecer o psicólogo e entender se deseja iniciar o processo terapêutico.</p>

      <div className="bg-white p-4 rounded border">
        <label className="block font-semibold mb-2">Escolha um dia para ambientação</label>
        <input type="date" min={minDate} className="border rounded p-2" value={date} onChange={(e) => loadSlots(e.target.value)} />
      </div>

      {date && (
        <div className="bg-white p-4 rounded border">
          <p className="font-semibold mb-2">Horários disponíveis para ambientação</p>
          <div className="flex flex-wrap gap-2">
            {visibleSlots.length === 0 && <span className="text-gray-500">Sem horários livres.</span>}
            {visibleSlots.map((slot) => (
              <button key={slot} onClick={() => setSelected(slot)} className={`px-3 py-2 border rounded ${selected === slot ? 'bg-blue-600 text-white' : ''}`}>
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="bg-white p-4 rounded border space-y-3">
          <h2 className="font-semibold">Seus dados para solicitar a ambientação</h2>
          <input placeholder="Nome" className="border rounded p-2 w-full" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <div>
            <input
              placeholder="Email"
              className="border rounded p-2 w-full"
              value={form.email}
              onChange={(e) => {
                const value = e.target.value;
                setForm({ ...form, email: value });
                setFieldErrors((prev) => ({ ...prev, email: value ? validateEmail(value) : '' }));
              }}
            />
            {fieldErrors.email && <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>}
          </div>
          <div>
            <input
              type="tel"
              inputMode="numeric"
              pattern="\d*"
              maxLength={11}
              placeholder="Telefone / WhatsApp"
              className="border rounded p-2 w-full"
              value={form.telefone}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, '');
                setForm({ ...form, telefone: digitsOnly });
                setFieldErrors((prev) => ({
                  ...prev,
                  telefone: digitsOnly ? validatePhone(digitsOnly) : '',
                }));
              }}
            />
            {fieldErrors.telefone && <p className="text-red-600 text-sm mt-1">{fieldErrors.telefone}</p>}
          </div>
          <textarea placeholder="Mensagem opcional" className="border rounded p-2 w-full" value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} />
          <button disabled={!canSubmit} onClick={submit} className="bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded">Solicitar ambientação</button>
        </div>
      )}

      {message && <p className="text-sm font-medium whitespace-pre-line">{message}</p>}

      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4" role="dialog" aria-modal="true">
            <h3 className="text-xl font-semibold">Solicitação enviada</h3>
            <p className="text-sm leading-relaxed whitespace-pre-line">{successModalText}</p>
            <button
              type="button"
              onClick={closeSuccessModal}
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
