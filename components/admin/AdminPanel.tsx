'use client';

import { useEffect, useMemo, useState } from 'react';

const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const defaultItems = weekdays.map((_, weekday) => ({ weekday, enabled: false, start_time: '09:00', end_time: '18:00', session_duration: 50 }));

type Appointment = {
  id: string;
  nome_paciente: string;
  email: string;
  telefone: string;
  mensagem?: string | null;
  data: string;
  hora: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
};

const statusLabel: Record<Appointment['status'], string> = {
  pending: 'Aguardando confirmação',
  confirmed: 'Pré-consulta confirmada',
  cancelled: 'Solicitação cancelada',
  completed: 'Pré-consulta concluída',
};

export default function AdminPanel() {
  const [profile, setProfile] = useState({ full_name: '', photo_url: '', professional_bio: '', work_method: '', specialties: '' });
  const [availability, setAvailability] = useState(defaultItems);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [editingProfile, setEditingProfile] = useState(true);
  const [editingAvailability, setEditingAvailability] = useState(true);

  async function loadAll() {
    const [p, a, ap] = await Promise.all([
      fetch('/api/admin/profile').then((r) => r.json()),
      fetch('/api/admin/availability').then((r) => r.json()),
      fetch('/api/admin/appointments').then((r) => r.json()),
    ]);

    if (p) {
      setProfile({ ...p, photo_url: p.photo_url || '', specialties: (p.specialties || []).join(', ') });
      if (p.full_name || p.professional_bio) setEditingProfile(false);
    }
    if (Array.isArray(a) && a.length) {
      setAvailability(a);
      setEditingAvailability(false);
    }
    if (Array.isArray(ap)) setAppointments(ap);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function saveProfile() {
    await fetch('/api/admin/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profile, specialties: profile.specialties.split(',').map((s) => s.trim()).filter(Boolean) }),
    });
    await loadAll();
    setEditingProfile(false);
  }

  async function saveAvailability() {
    await fetch('/api/admin/availability', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: availability.map((item) => ({ ...item, session_duration: Number(item.session_duration) })) }),
    });
    await loadAll();
    setEditingAvailability(false);
  }

  async function updateStatus(id: string, status: 'confirmed' | 'cancelled') {
    await fetch(`/api/admin/appointments/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadAll();
  }

  const enabledAvailability = useMemo(() => availability.filter((item) => item.enabled), [availability]);

  return (
    <div className="space-y-6 pb-8">
      <section className="bg-white border rounded p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-xl">Perfil do Psicólogo</h2>
          {!editingProfile && (
            <button className="text-blue-700 font-medium" onClick={() => setEditingProfile(true)}>✏ Editar perfil</button>
          )}
        </div>

        {editingProfile ? (
          <div className="space-y-3">
            <input className="border p-2 rounded w-full" placeholder="Nome completo" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
            <input className="border p-2 rounded w-full" placeholder="URL da foto" value={profile.photo_url} onChange={(e) => setProfile({ ...profile, photo_url: e.target.value })} />
            <textarea className="border p-2 rounded w-full" placeholder="Bio profissional / sobre" value={profile.professional_bio} onChange={(e) => setProfile({ ...profile, professional_bio: e.target.value })} />
            <textarea className="border p-2 rounded w-full" placeholder="Método de trabalho" value={profile.work_method} onChange={(e) => setProfile({ ...profile, work_method: e.target.value })} />
            <input className="border p-2 rounded w-full" placeholder="Especialidades separadas por vírgula" value={profile.specialties} onChange={(e) => setProfile({ ...profile, specialties: e.target.value })} />
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={saveProfile}>Salvar perfil</button>
          </div>
        ) : (
          <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
            <div className="flex gap-4 items-start">
              {profile.photo_url ? (
                <img src={profile.photo_url} alt={profile.full_name || 'Foto profissional'} className="w-20 h-20 object-cover rounded-full border" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">Foto</div>
              )}
              <div>
                <h3 className="text-xl font-semibold">{profile.full_name || 'Nome não informado'}</h3>
                <p className="text-sm text-gray-700"><strong>Especialidades:</strong> {profile.specialties || 'Não informadas'}</p>
              </div>
            </div>
            <div>
              <p className="font-semibold">Sobre / Bio</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{profile.professional_bio || 'Bio não informada.'}</p>
            </div>
            <div>
              <p className="font-semibold">Método de trabalho</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{profile.work_method || 'Método não informado.'}</p>
            </div>
          </div>
        )}
      </section>

      <section className="bg-white border rounded p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-xl">Disponibilidade de pré-consulta</h2>
          {!editingAvailability && (
            <button className="text-blue-700 font-medium" onClick={() => setEditingAvailability(true)}>✏ Editar disponibilidade</button>
          )}
        </div>

        {editingAvailability ? (
          <>
            <div className="space-y-2">
              {availability.map((item, i) => (
                <div key={item.weekday} className="grid grid-cols-5 gap-2 items-center">
                  <span>{weekdays[item.weekday]}</span>
                  <input type="checkbox" checked={item.enabled} onChange={(e) => {
                    const next = [...availability]; next[i].enabled = e.target.checked; setAvailability(next);
                  }} />
                  <input className="border p-1 rounded" type="time" value={item.start_time} onChange={(e) => { const next = [...availability]; next[i].start_time = e.target.value; setAvailability(next); }} />
                  <input className="border p-1 rounded" type="time" value={item.end_time} onChange={(e) => { const next = [...availability]; next[i].end_time = e.target.value; setAvailability(next); }} />
                  <input className="border p-1 rounded" type="number" min={30} max={120} value={item.session_duration} onChange={(e) => { const next = [...availability]; next[i].session_duration = Number(e.target.value); setAvailability(next); }} />
                </div>
              ))}
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={saveAvailability}>Salvar disponibilidade</button>
          </>
        ) : (
          <div className="space-y-1 text-sm text-gray-800">
            {enabledAvailability.length ? enabledAvailability.map((item) => (
              <p key={item.weekday}><strong>{weekdays[item.weekday]}:</strong> {item.start_time} - {item.end_time}</p>
            )) : <p>Nenhum horário disponível selecionado.</p>}
          </div>
        )}
      </section>

      <section className="bg-white border rounded p-5">
        <h2 className="font-bold text-xl mb-3">Solicitações de pré-consulta</h2>
        <div className="space-y-3">
          {appointments.map((a) => (
            <div key={a.id} className="border rounded p-3 space-y-1">
              <p className="font-semibold">{a.nome_paciente}</p>
              <p className="text-sm">Email: {a.email}</p>
              <p className="text-sm">Telefone: {a.telefone}</p>
              <p className="text-sm">Data solicitada: {a.data}</p>
              <p className="text-sm">Horário solicitado: {a.hora}</p>
              <p className="text-sm">Mensagem: {a.mensagem || 'Não informada'}</p>
              <p className="text-sm font-medium">Status: {statusLabel[a.status]}</p>

              {a.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <button className="px-3 py-1 border rounded" onClick={() => updateStatus(a.id, 'confirmed')}>Confirmar pré-consulta</button>
                  <button className="px-3 py-1 border rounded" onClick={() => updateStatus(a.id, 'cancelled')}>Cancelar solicitação</button>
                </div>
              )}
            </div>
          ))}
          {appointments.length === 0 && <p className="text-sm text-gray-500">Ainda não há solicitações de pré-consulta.</p>}
        </div>
      </section>
    </div>
  );
}
