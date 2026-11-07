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

    // Recarrega a página
    window.location.reload();
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
      setMessage(`A psicóloga atende apenas ${allowedDaysLabel}. Escolha outra data.`);
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
        body: JSON.stringify({ ...form, data: date, hora: selected, consent }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessModalText(data.message);
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
    <div className="min-h-screen bg-[#FAF6F1] pt-28 pb-20 px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header da página */}
        <div className="text-center space-y-2 mb-10">
          <p className="text-xs tracking-[0.4em] uppercase text-[#9E7B7B] font-medium">
            Primeiro passo
          </p>
          <h1
            className="text-3xl md:text-4xl font-semibold text-[#2D2020]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Agendar consulta
          </h1>
          <p className="text-[#6B4F4F] max-w-md mx-auto">
            A pré-consulta é uma conversa inicial para você conhecer a psicóloga e entender se deseja iniciar o processo terapêutico.
          </p>
        </div>

        {/* CARD — Escolha de data */}
        <div className="bg-white border border-[#C9A9A6]/20 p-6 rounded-2xl shadow-[0_2px_20px_rgba(201,169,166,0.1)]">
          <label className="block font-semibold mb-3 uppercase tracking-[0.2em] text-[11px] text-[#9E7B7B]">
            Escolha um dia
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
            className="w-full rounded-xl border border-[#C9A9A6]/50 bg-white px-4 py-3 text-sm font-medium text-[#2D2020] transition focus-within:border-[#C9A9A6] focus-within:ring-2 focus-within:ring-[#C9A9A6]/20 cursor-pointer"
          >
            <input
              ref={dateInputRef}
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => loadSlots(e.target.value)}
              className="w-full appearance-none bg-transparent text-sm font-medium text-[#2D2020] outline-none"
            />
          </div>

          <div className="mt-4 space-y-1">
            <p className="text-[11px] uppercase tracking-[0.4em] text-[#9E7B7B]">Dias disponíveis</p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_SHORT.map((label, index) => {
                const isEnabled = enabledWeekdays.includes(index);
                return (
                  <span
                    key={label}
                    title={WEEKDAY_FULL[index]}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                      isEnabled
                        ? 'border border-[#C9A9A6] bg-[#C9A9A6] text-white'
                        : 'border border-[#C9A9A6]/20 bg-[#FAF6F1] text-[#9E7B7B]'
                    }`}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
            {!availabilityLoaded && (
              <p className="text-[11px] text-[#9E7B7B]">Carregando disponibilidade semanal...</p>
            )}
            {availabilityLoaded && !enabledWeekdays.length && (
              <p className="text-[11px] text-[#9E7B7B]">Nenhum dia disponível foi configurado ainda.</p>
            )}
          </div>
        </div>

        {/* CARD — Horários */}
        {date && (
          <div className="bg-white border border-[#C9A9A6]/20 p-6 rounded-2xl shadow-[0_2px_20px_rgba(201,169,166,0.1)] space-y-3">
            <p
              className="font-semibold text-[#2D2020]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Horários disponíveis
            </p>
            <div className="flex flex-wrap gap-3">
              {visibleSlots.length === 0 && (
                <span className="text-sm text-[#9E7B7B]">Sem horários livres para este dia.</span>
              )}
              {visibleSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelected(slot)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition focus-visible:outline-none ${
                    selected === slot
                      ? 'border border-[#C9A9A6] bg-[#C9A9A6] text-white shadow-md'
                      : 'border border-[#C9A9A6]/40 text-[#6B4F4F] hover:border-[#C9A9A6] hover:bg-[#C9A9A6]/10'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CARD — Formulário */}
        {selected && (
          <div className="bg-white border border-[#C9A9A6]/20 p-6 rounded-2xl shadow-[0_2px_20px_rgba(201,169,166,0.1)] space-y-4">
            <h2
              className="font-semibold text-[#2D2020]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Seus dados
            </h2>

            <input
              placeholder="Nome completo"
              className="w-full rounded-xl border border-[#C9A9A6]/50 px-4 py-3 text-sm text-[#2D2020] outline-none transition focus:border-[#C9A9A6] focus:ring-2 focus:ring-[#C9A9A6]/20 placeholder:text-[#9E7B7B]/60"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />

            <div>
              <input
                placeholder="E-mail"
                className="w-full rounded-xl border border-[#C9A9A6]/50 px-4 py-3 text-sm text-[#2D2020] outline-none transition focus:border-[#C9A9A6] focus:ring-2 focus:ring-[#C9A9A6]/20 placeholder:text-[#9E7B7B]/60"
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
                className="w-full rounded-xl border border-[#C9A9A6]/50 px-4 py-3 text-sm text-[#2D2020] outline-none transition focus:border-[#C9A9A6] focus:ring-2 focus:ring-[#C9A9A6]/20 placeholder:text-[#9E7B7B]/60"
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
              placeholder="Mensagem opcional sobre contato ou disponibilidade"
              rows={3}
              aria-describedby="booking-message-help"
              className="w-full rounded-xl border border-[#C9A9A6]/50 px-4 py-3 text-sm text-[#2D2020] outline-none transition focus:border-[#C9A9A6] focus:ring-2 focus:ring-[#C9A9A6]/20 placeholder:text-[#9E7B7B]/60 resize-none"
              value={form.mensagem}
              onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
            />
            <p id="booking-message-help" className="text-xs text-[#6B4F4F]">
              Evite compartilhar informações clínicas ou outros dados sensíveis nesta etapa.
            </p>

            {/* CHECKBOX DE CONSENTIMENTO */}
            <div className="flex items-start gap-3 pt-1">
              <input
                type="checkbox"
                id="consent"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#C9A9A6] text-[#C9A9A6] focus:ring-[#C9A9A6]"
              />
              <label htmlFor="consent" className="text-sm text-[#6B4F4F] leading-relaxed">
                Autorizo o uso dos meus dados para o agendamento e comunicações sobre esta consulta,
                inclusive o processamento necessário pelos provedores do sistema. Li a{' '}
                <a className="underline" href="/privacidade">Política de Privacidade</a>.
              </label>
            </div>

            <button
              disabled={!canSubmit}
              onClick={submit}
              className="w-full rounded-full px-4 py-3 text-sm font-semibold tracking-wide text-white shadow-sm transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 bg-[#C9A9A6] hover:bg-[#9E7B7B] disabled:bg-[#C9A9A6]/50"
            >
              Solicitar ambientação
            </button>
          </div>
        )}

        {/* Mensagem de erro/info */}
        {message && (
          <p className="text-sm font-medium text-[#6B4F4F] whitespace-pre-line bg-[#C9A9A6]/10 rounded-xl px-4 py-3 border border-[#C9A9A6]/20">
            {message}
          </p>
        )}

        {/* MODAL DE SUCESSO */}
        {isSuccessModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2020]/60 backdrop-blur-sm px-4">
            <div
              className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl space-y-5"
              role="dialog"
              aria-modal="true"
            >
              {/* Ícone */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-[#C9A9A6]/20 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="14" stroke="#C9A9A6" strokeWidth="1.5"/>
                    <path d="M10 16l4 4 8-8" stroke="#C9A9A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <h3
                className="text-xl font-semibold text-[#2D2020] text-center"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Solicitação enviada!
              </h3>
              <p className="text-sm leading-relaxed text-[#6B4F4F] whitespace-pre-line text-center">
                {successModalText}
              </p>
              <button
                type="button"
                onClick={closeSuccessModal}
                className="w-full rounded-full bg-[#C9A9A6] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9E7B7B]"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
