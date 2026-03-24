'use client';

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_REGEX = /^\d{10,11}$/;
const INITIAL_FORM_STATE = { nome: '', email: '', telefone: '', mensagem: '' };
const INITIAL_FIELD_ERRORS = { email: '', telefone: '' };
const WEEKDAY_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const WEEKDAY_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

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

function normalizeWeekdays(values?: number[]) {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values)).sort((a, b) => a - b);
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
  const [enabledWeekdays, setEnabledWeekdays] = useState<number[]>([]);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  const [consent, setConsent] = useState(false);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const minDate = useMemo(() => todayISO(), []);

  const visibleSlots = useMemo(() => {
    if (date !== minDate) return slots;
    const currentTime = getCurrentTimeSlot();
    return slots.filter((slot) => slot > currentTime);
  }, [date, minDate, slots]);

  useEffect(() => {
    let active = true;

    async function fetchAvailability() {
      try {
        const response = await fetch(`/api/public/slots?date=${minDate}`);
        const data = await response.json();
        if (!active) return;
        if (Array.isArray(data.enabledWeekdays)) {
          setEnabledWeekdays(normalizeWeekdays(data.enabledWeekdays));
        }
      } catch (error) {
        console.error('Erro ao carregar disponibilidade semanal:', error);
      } finally {
        if (active) setAvailabilityLoaded(true);
      }
    }

    fetchAvailability();
    return () => {
      active = false;
    };
  }, [minDate]);

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
    setConsent(false);
  }

  function closeSuccessModal() {
    setIsSuccessModalOpen(false);
    setSuccessModalText('');
  }

  function isWeekdayEnabled(value: string) {
    if (!value) return true;
    if (!enabledWeekdays.length) return true;
    const weekday = new Date(`${value}T00:00:00`).getDay();
    return enabledWeekdays.includes(weekday);
  }

  async function loadSlots(value: string) {
    if (!value || value < minDate) {
      setDate(value);
      setSlots([]);
      setSelected('');
      setMessage('Selecione uma data de hoje em diante para solicitar uma ambientação.');
      return;
    }

    if (!isWeekdayEnabled(value)) {
      const allowedDaysLabel = enabledWeekdays.length
        ? enabledWeekdays.map((weekday) => WEEKDAY_FULL[weekday]).join(', ')
        : 'nos dias marcados como disponíveis';
      setSlots([]);
      setSelected('');
      setMessage(`O psicólogo atende apenas ${allowedDaysLabel}. Escolha outra data.`);
      return;
    }

    setDate(value);
    setSelected('');
    setMessage('');

    try {
      const response = await fetch(`/api/public/slots?date=${value}`);
      const data = await response.json();
      if (Array.isArray(data.enabledWeekdays)) {
        setEnabledWeekdays(normalizeWeekdays(data.enabledWeekdays));
      }
      if (!response.ok) {
        setMessage(data.error || 'Erro ao buscar horários disponíveis.');
        setSlots([]);
        return;
      }

      setSlots(data.slots || []);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      setMessage('Erro ao carregar horários. Tente novamente em instantes.');
      setSlots([]);
    } finally {
      setAvailabilityLoaded(true);
    }
  }

  const hasFieldError = Boolean(fieldErrors.email || fieldErrors.telefone);
  const canSubmit = useMemo(
    () => Boolean(date && selected && form.nome && form.email && form.telefone && !hasFieldError && consent),
    [date, selected, form, hasFieldError, consent],
  );

  async function submit() {
    if (date < minDate) {
      setMessage('Não é possível solicitar ambientação em datas anteriores ao dia atual.');
      return;
    }

    if (!consent) {
      setMessage('Você precisa autorizar o uso dos seus dados para prosseguir.');
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
    try {
      const response = await fetch('/api/public/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, data: date, hora: selected }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessModalText(data.message); // ✅ usa a mensagem do backend
        resetFlow();
        setIsSuccessModalOpen(true);
      } else {
        setMessage(data.error || 'Erro ao enviar solicitação');
      }
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      setMessage('Não foi possível enviar a solicitação. Tente novamente mais tarde.');
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold text-[#101010]">Solicitar ambientação</h1>
      <p className="text-[#4d4d4d]">
        A ambientação é uma conversa inicial para você conhecer o psicólogo e entender se deseja iniciar o processo terapêutico.
      </p>

      <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
        <label className="block font-semibold mb-3 uppercase tracking-[0.2em] text-[11px] text-[#4d4d4d]">
          Escolha um dia para ambientação
        </label>
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            dateInputRef.current?.showPicker?.();
            dateInputRef.current?.focus();
          }}
          onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              dateInputRef.current?.showPicker?.();
              dateInputRef.current?.focus();
            }
          }}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[#101010] transition focus-within:border-[#C2183A] focus-within:ring-2 focus-within:ring-[#C2183A]/30"
        >
          <input
            ref={dateInputRef}
            type="date"
            min={minDate}
            value={date}
            onChange={(e) => loadSlots(e.target.value)}
            className="w-full appearance-none bg-transparent text-sm font-medium text-[#101010] outline-none"
          />
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-[11px] uppercase tracking-[0.4em] text-[#4d4d4d]">Dias disponíveis</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_SHORT.map((label, index) => {
              const isEnabled = enabledWeekdays.includes(index);
              return (
                <span
                  key={label}
                  title={WEEKDAY_FULL[index]}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                    isEnabled
                      ? 'border border-[#C2183A] bg-[#C2183A] text-white'
                      : 'border border-gray-200 bg-[#f7f7f7] text-[#4d4d4d]'
                  }`}
                >
                  {label}
                </span>
              );
            })}
          </div>
          {!availabilityLoaded && (
            <p className="text-[11px] text-[#4d4d4d]">Carregando disponibilidade semanal...</p>
          )}
          {availabilityLoaded && !enabledWeekdays.length && (
            <p className="text-[11px] text-[#4d4d4d]">Nenhum dia disponível foi configurado ainda.</p>
          )}
        </div>
      </div>

      {date && (
        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm space-y-3">
          <p className="font-semibold text-[#101010]">Horários disponíveis para ambientação</p>
          <div className="flex flex-wrap gap-3">
            {visibleSlots.length === 0 && (
              <span className="text-sm text-[#4d4d4d]">Sem horários livres.</span>
            )}
            {visibleSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelected(slot)}
                className={`px-3 py-2 rounded-full text-sm font-semibold transition focus-visible:outline-none ${
                  selected === slot
                    ? 'border border-[#C2183A] bg-[#C2183A] text-white'
                    : 'border border-gray-200 text-[#101010] hover:border-[#C2183A]'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm space-y-4">
          <h2 className="font-semibold text-[#101010]">Seus dados para solicitar a ambientação</h2>
          <input
            placeholder="Nome"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-[#101010] transition focus:border-[#C2183A] focus:ring-2 focus:ring-[#C2183A]/30"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
          <div>
            <input
              placeholder="Email"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-[#101010] transition focus:border-[#C2183A] focus:ring-2 focus:ring-[#C2183A]/30"
              value={form.email}
              onChange={(e) => {
                const value = e.target.value;
                setForm({ ...form, email: value });
                setFieldErrors((prev) => ({ ...prev, email: value ? validateEmail(value) : '' }));
              }}
            />
            {fieldErrors.email && (
              <p className="text-[11px] text-[#C2183A] mt-1">{fieldErrors.email}</p>
            )}
          </div>
          <div>
            <input
              type="tel"
              inputMode="numeric"
              pattern="\d*"
              maxLength={11}
              placeholder="Telefone / WhatsApp"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-[#101010] transition focus:border-[#C2183A] focus:ring-2 focus:ring-[#C2183A]/30"
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
            {fieldErrors.telefone && (
              <p className="text-[11px] text-[#C2183A] mt-1">{fieldErrors.telefone}</p>
            )}
          </div>
          <textarea
            placeholder="Mensagem opcional"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-[#101010] transition focus:border-[#C2183A] focus:ring-2 focus:ring-[#C2183A]/30"
            value={form.mensagem}
            onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
          />

          {/* CHECKBOX DE CONSENTIMENTO */}
          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#C2183A] focus:ring-[#C2183A]"
            />
            <label htmlFor="consent" className="text-sm text-gray-600 leading-relaxed">
              Autorizo o uso dos meus dados (nome, email, telefone) exclusivamente para agendamento 
              e comunicação sobre esta consulta. Entendo que meus dados não serão compartilhados com 
              terceiros.
            </label>
          </div>

          <button
            disabled={!canSubmit}
            onClick={submit}
            className="w-full rounded-full px-4 py-3 text-sm font-semibold tracking-wide text-white shadow-sm transition disabled:bg-[#f5d9df] disabled:text-[#9c1d30] bg-[#C2183A] hover:bg-[#a0162f]"
          >
            Solicitar ambientação
          </button>
        </div>
      )}

      {message && (
        <p className="text-sm font-medium text-[#4d4d4d] whitespace-pre-line">{message}</p>
      )}

      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl space-y-4" role="dialog" aria-modal="true">
            <h3 className="text-xl font-semibold text-[#101010]">Solicitação enviada</h3>
            <p className="text-sm leading-relaxed text-[#4d4d4d] whitespace-pre-line">{successModalText}</p>
            <button
              type="button"
              onClick={closeSuccessModal}
              className="w-full rounded-full bg-[#C2183A] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a0162f]"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}