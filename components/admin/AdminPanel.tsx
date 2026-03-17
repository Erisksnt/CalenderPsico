

'use client';

import { useEffect, useMemo, useState } from 'react';

const weekdays = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];
const defaultItems = weekdays.map((day_of_week) => ({
  day_of_week,
  is_blocked: true,
  start_time: '09:00',
  end_time: '18:00',
  session_duration: 50,
}));

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Appointment = {
  id: string;
  nome_paciente: string;
  email: string;
  telefone: string;
  mensagem?: string | null;
  data: string;
  hora: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
};

const statusLabel: Record<Appointment['status'], string> = {
  PENDING: 'Aguardando confirmação',
  CONFIRMED: 'Ambientação confirmada',
  CANCELLED: 'Solicitação cancelada',
  COMPLETED: 'Ambientação concluída',
};

function formatApiError(payload: unknown, status: number) {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const err = (payload as { error: unknown }).error;

    if (typeof err === 'string') return err;

    if (err && typeof err === 'object' && 'fieldErrors' in err) {
      const fields = Object.values((err as { fieldErrors?: Record<string, string[]> }).fieldErrors || {}).flat();
      if (fields.length) return fields.join(' | ');
    }

    if (err && typeof err === 'object' && 'formErrors' in err) {
      const formErrors = (err as { formErrors?: string[] }).formErrors || [];
      if (formErrors.length) return formErrors.join(' | ');
    }

    return JSON.stringify(err);
  }

  return `Erro ${status}`;
}


async function safeFetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const response = await fetch(url, init);
    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const errorData =
        payload && typeof payload === 'object' && 'error' in payload
          ? String((payload as { error: string }).error)
          : `Erro ${response.status}`;

      return {
        ok: false,
        status: response.status,
        data: payload,
        error: errorData,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: payload,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : 'Erro inesperado',
    };
  }
}

export default function AdminPanel() {
  const [profile, setProfile] = useState({ full_name: '', photo_url: '', professional_bio: '', work_method: '', specialties: '' });
  const [availability, setAvailability] = useState(defaultItems);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [editingProfile, setEditingProfile] = useState(true);
  const [editingAvailability, setEditingAvailability] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadAll() {
    setMessage(null);

    const [profileRes, availabilityRes, appointmentsRes] = await Promise.all([
      safeFetchJson<Record<string, unknown> | null>('/api/admin/profile'),
      safeFetchJson<Array<typeof defaultItems[number]>>('/api/admin/availability'),
      safeFetchJson<Appointment[]>('/api/admin/appointments'),
    ]);

    if (profileRes.ok && profileRes.data) {
      const p = profileRes.data as {
        full_name?: string;
        photo_url?: string | null;
        professional_bio?: string;
        work_method?: string;
        specialties?: string[];
      };
      setProfile({
        full_name: p.full_name || '',
        photo_url: p.photo_url || '',
        professional_bio: p.professional_bio || '',
        work_method: p.work_method || '',
        specialties: (p.specialties || []).join(', '),
      });
      if (p.full_name || p.professional_bio) setEditingProfile(false);
    }

    if (availabilityRes.ok && Array.isArray(availabilityRes.data) && availabilityRes.data.length) {
      setAvailability(availabilityRes.data);
      setEditingAvailability(false);
    }

    if (appointmentsRes.ok && Array.isArray(appointmentsRes.data)) {
      setAppointments(appointmentsRes.data);
    }

    const errors = [profileRes, availabilityRes, appointmentsRes].filter((result) => !result.ok).map((result) => result.error);
    if (errors.length) {
      setMessage({ type: 'error', text: `Alguns dados não puderam ser carregados: ${errors.join(' | ')}` });
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (photoFile) {
      const url = URL.createObjectURL(photoFile);
      setPhotoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPhotoPreview(profile.photo_url || '');
  }, [photoFile, profile.photo_url]);

  async function saveProfile() {
    const specialties = profile.specialties.split(',').map((s) => s.trim()).filter(Boolean);
    const photoUrl = photoFile ? await fileToDataUrl(photoFile) : profile.photo_url;
    const result = await safeFetchJson('/api/admin/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profile, specialties, photo_url: photoUrl }),
    });

    if (!result.ok) {
      setMessage({ type: 'error', text: `Não foi possível salvar o perfil: ${result.error}` });
      return;
    }

    await loadAll();
    setEditingProfile(false);
    setPhotoFile(null);
    setMessage({ type: 'success', text: 'Perfil salvo com sucesso.' });
  }

  async function saveAvailability() {
    const result = await safeFetchJson('/api/admin/availability', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: availability.map((item) => ({ ...item, session_duration: Number(item.session_duration) })) }),
    });

    if (!result.ok) {
      setMessage({ type: 'error', text: `Não foi possível salvar a disponibilidade: ${result.error}` });
      return;
    }

    await loadAll();
    setEditingAvailability(false);
    setMessage({ type: 'success', text: 'Disponibilidade salva com sucesso.' });
  }

  async function updateStatus(id: string, status: 'CONFIRMED' | 'CANCELLED') {
    const result = await safeFetchJson(`/api/admin/appointments/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!result.ok) {
      setMessage({ type: 'error', text: `Não foi possível atualizar status: ${result.error}` });
      return;
    }

    await loadAll();
  }

  const enabledAvailability = useMemo(() => availability.filter((item) => !item.is_blocked), [availability]);
  const pendingAppointments = useMemo(() => appointments.filter((a) => a.status === 'PENDING'), [appointments]);
  const doneAppointments = useMemo(() => appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED'), [appointments]);
  const cancelledAppointments = useMemo(() => appointments.filter((a) => a.status === 'CANCELLED'), [appointments]);

  return (
    <div className="space-y-6 pb-8">
      {message && (
        <div className={`rounded border px-4 py-3 text-sm ${message.type === 'success' ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <section className="bg-white border rounded p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-xl text-[#101010]">Perfil do Psicólogo</h2>
          {!editingProfile && (
            <button
              className="text-[#C2183A] font-medium transition hover:text-[#a0162f]"
              onClick={() => setEditingProfile(true)}
            >
              Editar perfil
            </button>
          )}
        </div>

        {editingProfile ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#4d4d4d]">Foto de perfil</p>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="Prévia da foto" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[11px] font-semibold uppercase tracking-[0.3em] text-[#4d4d4d]">
                      Foto
                    </div>
                  )}
                </div>
                <label className="cursor-pointer rounded-full border border-[#C2183A] px-4 py-2 text-sm font-semibold text-[#C2183A] transition hover:bg-[#ffe5e7]">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setPhotoFile(file);
                    }}
                  />
                  {photoFile ? 'Trocar imagem' : 'Selecionar imagem'}
                </label>
                {photoFile && (
                  <span className="text-sm text-[#4d4d4d]">{photoFile.name}</span>
                )}
              </div>
            </div>
            <input className="border p-2 rounded w-full" placeholder="Nome completo" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
            <textarea className="border p-2 rounded w-full" placeholder="Bio profissional / sobre" value={profile.professional_bio} onChange={(e) => setProfile({ ...profile, professional_bio: e.target.value })} />
            <textarea className="border p-2 rounded w-full" placeholder="Método de trabalho" value={profile.work_method} onChange={(e) => setProfile({ ...profile, work_method: e.target.value })} />
            <input className="border p-2 rounded w-full" placeholder="Especialidades separadas por vírgula" value={profile.specialties} onChange={(e) => setProfile({ ...profile, specialties: e.target.value })} />
            <button
              className="inline-flex items-center justify-center rounded-full bg-[#C2183A] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a0162f]"
              onClick={saveProfile}
            >
              Salvar perfil
            </button>
          </div>
        ) : (
          <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
            <div className="flex gap-4 items-start">
              {profile.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
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
          <h2 className="font-bold text-xl text-[#101010]">Disponibilidade de pré-consulta</h2>
          {!editingAvailability && (
            <button
              className="text-[#C2183A] font-medium transition hover:text-[#a0162f]"
              onClick={() => setEditingAvailability(true)}
            >
              Editar disponibilidade
            </button>
          )}
        </div>

        {editingAvailability ? (
          <>
            <div className="space-y-2">
              {availability.map((item, i) => (
                <div key={item.day_of_week} className="grid grid-cols-5 gap-2 items-center">
                  <span>{item.day_of_week}</span>
                  <input
                    type="checkbox"
                    className="availability-checkbox"
                    checked={!item.is_blocked}
                    onChange={(e) => {
                      const next = [...availability]; next[i].is_blocked = !e.target.checked; setAvailability(next);
                    }}
                  />
                  <input className="border p-1 rounded" type="time" value={item.start_time} onChange={(e) => { const next = [...availability]; next[i].start_time = e.target.value; setAvailability(next); }} />
                  <input className="border p-1 rounded" type="time" value={item.end_time} onChange={(e) => { const next = [...availability]; next[i].end_time = e.target.value; setAvailability(next); }} />
                  <input className="border p-1 rounded" type="number" min={30} max={120} value={item.session_duration} onChange={(e) => { const next = [...availability]; next[i].session_duration = Number(e.target.value); setAvailability(next); }} />
                </div>
              ))}
            </div>
            <button
              className="inline-flex items-center justify-center rounded-full bg-[#C2183A] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a0162f]"
              onClick={saveAvailability}
            >
              Salvar disponibilidade
            </button>
          </>
        ) : (
          <div className="space-y-1 text-sm text-gray-800">
            {enabledAvailability.length ? enabledAvailability.map((item) => (
              <p key={item.day_of_week}><strong>{item.day_of_week}:</strong> {item.start_time} - {item.end_time}</p>
            )) : <p>Nenhum horário disponível selecionado.</p>}
          </div>
        )}
      </section>

      <section className="bg-white border rounded p-5 space-y-6">
        <h2 className="font-bold text-xl">Solicitações de pré-consulta</h2>

        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Solicitações pendentes de validação</h3>
          {pendingAppointments.map((a) => (
            <div key={a.id} className="border rounded p-3 space-y-1">
              <p className="font-semibold">{a.nome_paciente}</p>
              <p className="text-sm">Email: {a.email}</p>
              <p className="text-sm">Telefone: {a.telefone}</p>
              <p className="text-sm">Data solicitada: {a.data}</p>
              <p className="text-sm">Horário solicitado: {a.hora}</p>
              <p className="text-sm">Mensagem: {a.mensagem || 'Não informada'}</p>
              <p className="text-sm font-medium">Status: {statusLabel[a.status]}</p>
              <div className="flex gap-2">
                <button className="inline-flex items-center justify-center rounded-full bg-green-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-green-700" onClick={() => updateStatus(a.id, 'CONFIRMED')}>Confirmar</button>
                <button className="inline-flex items-center justify-center rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white transition hover:bg-red-700" onClick={() => updateStatus(a.id, 'CANCELLED')}>Cancelar</button>
              </div>
            </div>
          ))}
          {pendingAppointments.length === 0 && <p className="text-sm text-gray-500">Nenhuma solicitação pendente de validação.</p>}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Solicitações concluídas</h3>
          {doneAppointments.map((a) => (
            <div key={a.id} className="border rounded p-3 space-y-1 bg-green-50 border-green-200">
              <p className="font-semibold">{a.nome_paciente}</p>
              <p className="text-sm">Data: {a.data} às {a.hora}</p>
              <p className="text-sm">Status: {statusLabel[a.status]}</p>
            </div>
          ))}
          {doneAppointments.length === 0 && <p className="text-sm text-gray-500">Nenhuma solicitação concluída.</p>}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Solicitações canceladas</h3>
          {cancelledAppointments.map((a) => (
            <div key={a.id} className="border rounded p-3 space-y-1 bg-red-50 border-red-200">
              <p className="font-semibold">{a.nome_paciente}</p>
              <p className="text-sm">Data: {a.data} às {a.hora}</p>
              <p className="text-sm">Status: {statusLabel[a.status]}</p>
            </div>
          ))}
          {cancelledAppointments.length === 0 && <p className="text-sm text-gray-500">Nenhuma solicitação cancelada.</p>}
        </div>
      </section>
    </div>
  );
}
