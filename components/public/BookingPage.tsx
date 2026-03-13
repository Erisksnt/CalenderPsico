'use client';

import { useMemo, useState } from 'react';

function todayISO() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
}

export default function BookingPage() {
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', mensagem: '' });

  const minDate = useMemo(() => todayISO(), []);

  async function loadSlots(value: string) {
    if (!value || value < minDate) {
      setDate(value);
      setSlots([]);
      setSelected('');
      setMessage('Selecione uma data de hoje em diante para solicitar uma pré-consulta.');
      return;
    }

    setDate(value);
    setSelected('');
    setMessage('');
    const response = await fetch(`/api/public/slots?date=${value}`);
    const data = await response.json();
    setSlots(data.slots || []);
  }

  const canSubmit = useMemo(() => date && selected && form.nome && form.email && form.telefone, [date, selected, form]);

  async function submit() {
    if (date < minDate) {
      setMessage('Não é possível solicitar pré-consulta em datas anteriores ao dia atual.');
      return;
    }

    const response = await fetch('/api/public/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, data: date, hora: selected }),
    });

    const data = await response.json();
    if (response.ok) {
      setMessage(data.message);
      await loadSlots(date);
    } else {
      setMessage(data.error || 'Erro ao enviar solicitação');
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Solicitar pré-consulta</h1>
      <p className="text-gray-700">A pré-consulta é uma conversa inicial para você conhecer o psicólogo e entender se deseja iniciar o processo terapêutico.</p>

      <div className="bg-white p-4 rounded border">
        <label className="block font-semibold mb-2">Escolha um dia para pré-consulta</label>
        <input type="date" min={minDate} className="border rounded p-2" value={date} onChange={(e) => loadSlots(e.target.value)} />
      </div>

      {date && (
        <div className="bg-white p-4 rounded border">
          <p className="font-semibold mb-2">Horários disponíveis para pré-consulta</p>
          <div className="flex flex-wrap gap-2">
            {slots.length === 0 && <span className="text-gray-500">Sem horários livres.</span>}
            {slots.map((slot) => (
              <button key={slot} onClick={() => setSelected(slot)} className={`px-3 py-2 border rounded ${selected === slot ? 'bg-blue-600 text-white' : ''}`}>
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="bg-white p-4 rounded border space-y-3">
          <h2 className="font-semibold">Seus dados para solicitar a pré-consulta</h2>
          <input placeholder="Nome" className="border rounded p-2 w-full" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <input placeholder="Email" className="border rounded p-2 w-full" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Telefone / WhatsApp" className="border rounded p-2 w-full" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          <textarea placeholder="Mensagem opcional" className="border rounded p-2 w-full" value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} />
          <button disabled={!canSubmit} onClick={submit} className="bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded">Solicitar pré-consulta</button>
        </div>
      )}

      {message && <p className="text-sm font-medium whitespace-pre-line">{message}</p>}
    </div>
  );
}
