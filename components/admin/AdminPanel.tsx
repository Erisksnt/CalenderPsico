'use client';

import { useEffect, useState } from 'react';

const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const defaultItems = weekdays.map((_, weekday) => ({ weekday, enabled: false, start_time: '09:00', end_time: '18:00', session_duration: 50 }));

export default function AdminPanel() {
  const [profile, setProfile] = useState({ full_name: '', photo_url: '', professional_bio: '', work_method: '', specialties: '' });
  const [availability, setAvailability] = useState(defaultItems);
  const [appointments, setAppointments] = useState<any[]>([]);

  async function loadAll() {
    const [p, a, ap] = await Promise.all([
      fetch('/api/admin/profile').then((r) => r.json()),
      fetch('/api/admin/availability').then((r) => r.json()),
      fetch('/api/admin/appointments').then((r) => r.json()),
    ]);

    if (p) {
      setProfile({ ...p, photo_url: p.photo_url || '', specialties: (p.specialties || []).join(', ') });
    }
    if (Array.isArray(a) && a.length) setAvailability(a);
    if (Array.isArray(ap)) setAppointments(ap);
  }

  useEffect(() => { loadAll(); }, []);

  async function saveProfile() {
    await fetch('/api/admin/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profile, specialties: profile.specialties.split(',').map((s) => s.trim()).filter(Boolean) }),
    });
    await loadAll();
  }

  async function saveAvailability() {
    await fetch('/api/admin/availability', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: availability.map((item) => ({ ...item, session_duration: Number(item.session_duration) })) }),
    });
    await loadAll();
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadAll();
  }

  return (
    <div className="space-y-6">
      <section className="bg-white border rounded p-4 space-y-3">
        <h2 className="font-bold text-xl">Perfil público</h2>
        <input className="border p-2 rounded w-full" placeholder="Nome completo" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
        <input className="border p-2 rounded w-full" placeholder="URL da foto" value={profile.photo_url} onChange={(e) => setProfile({ ...profile, photo_url: e.target.value })} />
        <textarea className="border p-2 rounded w-full" placeholder="Apresentação" value={profile.professional_bio} onChange={(e) => setProfile({ ...profile, professional_bio: e.target.value })} />
        <textarea className="border p-2 rounded w-full" placeholder="Método de trabalho" value={profile.work_method} onChange={(e) => setProfile({ ...profile, work_method: e.target.value })} />
        <input className="border p-2 rounded w-full" placeholder="Especialidades separadas por vírgula" value={profile.specialties} onChange={(e) => setProfile({ ...profile, specialties: e.target.value })} />
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={saveProfile}>Salvar perfil</button>
      </section>

      <section className="bg-white border rounded p-4">
        <h2 className="font-bold text-xl mb-3">Disponibilidade semanal</h2>
        <div className="space-y-2">
          {availability.map((item, i) => (
            <div key={item.weekday} className="grid grid-cols-5 gap-2 items-center">
              <span>{weekdays[item.weekday]}</span>
              <input type="checkbox" checked={item.enabled} onChange={(e) => {
                const next = [...availability]; next[i].enabled = e.target.checked; setAvailability(next);
              }} />
              <input className="border p-1 rounded" type="time" value={item.start_time} onChange={(e) => { const next = [...availability]; next[i].start_time = e.target.value; setAvailability(next); }} />
              <input className="border p-1 rounded" type="time" value={item.end_time} onChange={(e) => { const next = [...availability]; next[i].end_time = e.target.value; setAvailability(next); }} />
              <input className="border p-1 rounded" type="number" value={item.session_duration} onChange={(e) => { const next = [...availability]; next[i].session_duration = Number(e.target.value); setAvailability(next); }} />
            </div>
          ))}
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded mt-4" onClick={saveAvailability}>Salvar disponibilidade</button>
      </section>

      <section className="bg-white border rounded p-4">
        <h2 className="font-bold text-xl mb-3">Consultas</h2>
        <div className="space-y-2">
          {appointments.map((a) => (
            <div key={a.id} className="border rounded p-3 flex justify-between items-center">
              <div>
                <p className="font-semibold">{a.nome_paciente} - {a.data} {a.hora}</p>
                <p className="text-sm">{a.telefone} | {a.email}</p>
                <p className="text-sm">Status: {a.status}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 border rounded" onClick={() => updateStatus(a.id, 'confirmed')}>Confirmar</button>
                <button className="px-3 py-1 border rounded" onClick={() => updateStatus(a.id, 'cancelled')}>Cancelar</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
