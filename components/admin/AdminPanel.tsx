'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SiteSettings, PhotoFrameStyle } from '@/lib/site-settings-types';
import { DEFAULT_SITE_SETTINGS, SITE_SECTION_IDS } from '@/lib/site-settings-types';
import SitePreviewFrame from '@/components/admin/SitePreviewFrame';

const WEEKDAY_OPTIONS = [
  { value: 'MONDAY', label: 'Segunda-feira' },
  { value: 'TUESDAY', label: 'Terça-feira' },
  { value: 'WEDNESDAY', label: 'Quarta-feira' },
  { value: 'THURSDAY', label: 'Quinta-feira' },
  { value: 'FRIDAY', label: 'Sexta-feira' },
  { value: 'SATURDAY', label: 'Sábado' },
  { value: 'SUNDAY', label: 'Domingo' },
];

const SECTION_LABELS = {
  hero: 'Seção principal',
  about: 'Sobre mim',
  appointments: 'Atendimentos',
  method: 'Método e abordagem',
  identification: 'Identificação',
  closing_cta: 'Chamada para contato',
} as const;

const WEEKDAY_LABELS = WEEKDAY_OPTIONS.reduce<Record<string, string>>((map, option) => {
  map[option.value] = option.label;
  return map;
}, {});
const getWeekdayLabel = (day_of_week: string) => WEEKDAY_LABELS[day_of_week] ?? day_of_week;

const buildEmptyAvailability = () =>
  WEEKDAY_OPTIONS.map(({ value }) => ({
    day_of_week: value,
    is_blocked: true,
    start_time: '09:00',
    end_time: '18:00',
    session_duration: 50,
  }));

type AvailabilityFormItem = ReturnType<typeof buildEmptyAvailability>[number];

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

type MediaAsset = {
  id: string;
  public_url: string;
  mime_type: string;
  byte_size: number;
  alt_text: string;
  created_at: string;
  usedIn: string[];
};

type ContentRevision = {
  id: string;
  version: number;
  action: string;
  created_at: string;
};

const statusLabel: Record<Appointment['status'], string> = {
  PENDING: 'Aguardando Aprovação',
  CONFIRMED: 'Consulta Aprovada',
  CANCELLED: 'Solicitação Recusada',
  COMPLETED: 'Atendimento Realizado',
};

function EditableStringList({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold">{label}</legend>
      {values.map((value, index) => (
        <div key={`${index}-${value.slice(0, 12)}`} className="flex items-start gap-2">
          <label className="sr-only">{`${label}, item ${index + 1}`}</label>
          <textarea
            rows={2}
            className="min-w-0 flex-1 rounded-xl border p-3 text-sm"
            value={value}
            onChange={(event) => {
              const next = [...values];
              next[index] = event.target.value;
              onChange(next);
            }}
          />
          <div className="flex flex-col gap-1">
            <button type="button" aria-label="Mover item para cima" disabled={index === 0} onClick={() => {
              const next = [...values];
              [next[index - 1], next[index]] = [next[index], next[index - 1]];
              onChange(next);
            }}>↑</button>
            <button type="button" aria-label="Mover item para baixo" disabled={index === values.length - 1} onClick={() => {
              const next = [...values];
              [next[index + 1], next[index]] = [next[index], next[index + 1]];
              onChange(next);
            }}>↓</button>
            <button type="button" aria-label="Remover item" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}>×</button>
          </div>
        </div>
      ))}
      <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => onChange([...values, ''])}>
        Adicionar item
      </button>
    </fieldset>
  );
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'overview' | 'editor' | 'social' | 'media' | 'appointments'>('overview');
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editorSection, setEditorSection] = useState<'hero' | 'about' | 'appointments' | 'method' | 'identification' | 'cta' | 'layout'>('hero');
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaAltText, setMediaAltText] = useState('');
  const [uploadingLibraryMedia, setUploadingLibraryMedia] = useState(false);
  const [revisions, setRevisions] = useState<ContentRevision[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [deletingRevisionId, setDeletingRevisionId] = useState<string | null>(null);
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);

  // Estados de Agendamento e Disponibilidade
  const [availability, setAvailability] = useState<AvailabilityFormItem[]>(() => buildEmptyAvailability());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [editingAvailability, setEditingAvailability] = useState(false);
  const [appointmentFilter, setAppointmentFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('PENDING');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setMessage(null);
    const headers = {
      'Content-Type': 'application/json',
    };

    try {
      const [settingsRes, availRes, appRes] = await Promise.all([
        fetch('/api/admin/site-settings', { headers, cache: 'no-store' }),
        fetch('/api/admin/availability', { headers, cache: 'no-store' }),
        fetch('/api/admin/appointments', { headers, cache: 'no-store' }),
      ]);
      if ([settingsRes, availRes, appRes].some((response) => response.status === 401)) {
        window.location.assign('/login/admin');
        return;
      }
      if (![settingsRes, availRes, appRes].every((response) => response.ok)) {
        throw new Error('Não foi possível carregar todos os dados administrativos.');
      }

      const settingsData = await settingsRes.json();
      setSettings(settingsData);
      setHasUnpublishedChanges(
        settingsRes.headers.get('X-Has-Unpublished-Changes') === 'true',
      );

      const availData = await availRes.json();
      if (Array.isArray(availData)) {
        const merged = buildEmptyAvailability().map((item) => {
          const existing = availData.find((row) => row.day_of_week === item.day_of_week);
          return existing ? { ...item, ...existing } : item;
        });
        setAvailability(merged);
      }

      const appData = await appRes.json();
      if (Array.isArray(appData)) setAppointments(appData);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível carregar os dados do painel.',
      });
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Salvar configurações visuais / contatos
  async function handleSaveSettings(customSettings?: SiteSettings): Promise<boolean> {
    setSavingSettings(true);
    setMessage(null);

    const payload = customSettings || settings;

    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const resData = await res.json();

      if (!res.ok) {
        const details = Array.isArray(resData.details)
          ? resData.details
            .map((detail: { field?: unknown; message?: unknown }) => {
              const field = typeof detail.field === 'string' ? detail.field : '';
              const message = typeof detail.message === 'string' ? detail.message : '';
              return [field, message].filter(Boolean).join(': ');
            })
            .filter(Boolean)
          : [];
        const errorMessage = typeof resData.error === 'string'
          ? resData.error
          : 'Erro ao salvar configurações.';
        throw new Error([errorMessage, ...details].join(' '));
      }

      if (resData.data) {
        setSettings(resData.data);
      }
      setHasUnpublishedChanges(true);
      setMessage({ type: 'success', text: 'Rascunho salvo. Ele ainda não está visível publicamente.' });
      return true;
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Falha ao salvar o rascunho.',
      });
      return false;
    } finally {
      setSavingSettings(false);
    }
  }

  async function publishSettings() {
    const saved = await handleSaveSettings();
    if (!saved) return;

    try {
      const response = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível publicar.');
      setSettings(result.settings);
      setHasUnpublishedChanges(false);
      setMessage({ type: 'success', text: 'Nova versão publicada.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível publicar.',
      });
    }
  }

  async function discardSettings() {
    if (!window.confirm('Descartar todas as alterações não publicadas?')) return;
    try {
      const response = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'discard' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível descartar o rascunho.');
      setSettings(result.settings);
      setHasUnpublishedChanges(false);
      setMessage({ type: 'success', text: 'Rascunho descartado.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível descartar o rascunho.',
      });
    }
  }

  const loadMedia = useCallback(async () => {
    setLoadingMedia(true);
    try {
      const response = await fetch('/api/admin/media', { cache: 'no-store' });
      if (response.status === 401) {
        window.location.assign('/login/admin');
        return;
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível carregar as mídias.');
      setMediaAssets(result.assets);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível carregar as mídias.',
      });
    } finally {
      setLoadingMedia(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'media' || activeTab === 'editor') void loadMedia();
  }, [activeTab, loadMedia]);

  const loadRevisions = useCallback(async () => {
    setLoadingRevisions(true);
    try {
      const response = await fetch('/api/admin/site-settings/revisions', { cache: 'no-store' });
      if (response.status === 401) {
        window.location.assign('/login/admin');
        return;
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível carregar o histórico.');
      setRevisions(result);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível carregar o histórico.',
      });
    } finally {
      setLoadingRevisions(false);
    }
  }, []);

  async function restoreRevision(revisionId: string) {
    if (!window.confirm('Restaurar esta versão como rascunho? O conteúdo público não será alterado até publicar.')) {
      return;
    }
    try {
      const response = await fetch('/api/admin/site-settings/revisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível restaurar a versão.');
      setSettings(result.settings);
      setHasUnpublishedChanges(true);
      setMessage({ type: 'success', text: 'Versão restaurada como rascunho. Revise e publique quando desejar.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível restaurar a versão.',
      });
    }
  }

  async function deleteRevision(revision: ContentRevision) {
    if (!window.confirm(`Excluir a versão ${revision.version} do histórico? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setDeletingRevisionId(revision.id);
    try {
      const response = await fetch('/api/admin/site-settings/revisions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionId: revision.id }),
      });
      const result = await response.json();
      if (response.status === 401) {
        window.location.assign('/login/admin');
        return;
      }
      if (!response.ok) throw new Error(result.error || 'Não foi possível excluir a versão.');

      setRevisions((current) => current.filter((item) => item.id !== revision.id));
      setMessage({ type: 'success', text: `Versão ${revision.version} excluída do histórico.` });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível excluir a versão.',
      });
    } finally {
      setDeletingRevisionId(null);
    }
  }

  async function uploadLibraryMedia(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!mediaAltText.trim()) {
      setMessage({ type: 'error', text: 'Informe o texto alternativo antes de enviar a imagem.' });
      return;
    }

    setUploadingLibraryMedia(true);
    try {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('altText', mediaAltText.trim());
      const response = await fetch('/api/admin/media', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível enviar a imagem.');
      setMediaAltText('');
      await loadMedia();
      setMessage({ type: 'success', text: 'Imagem adicionada à biblioteca.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível enviar a imagem.',
      });
    } finally {
      event.target.value = '';
      setUploadingLibraryMedia(false);
    }
  }

  async function deleteMedia(assetId: string) {
    try {
      const response = await fetch(`/api/admin/media/${assetId}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível remover a imagem.');
      setMediaAssets((current) => current.filter((asset) => asset.id !== assetId));
      setMessage({ type: 'success', text: 'Imagem removida da biblioteca.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível remover a imagem.',
      });
    }
  }

  // Upload validado para o storage persistente do projeto
  async function handlePhotoUpload(
    section: 'hero' | 'about',
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!settings[section].photo_alt.trim()) {
      setMessage({ type: 'error', text: 'Informe o texto alternativo da foto antes do upload.' });
      e.target.value = '';
      return;
    }

    try {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('altText', settings[section].photo_alt);
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível enviar a imagem.');
      
      const updated = {
        ...settings,
        [section]: {
          ...settings[section],
          photo_url: result.url,
          photo_alt: result.altText,
        },
      };

      setSettings(updated);
      await handleSaveSettings(updated);
      await loadMedia();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro ao enviar a imagem.',
      });
    }
  }

  // Atualizar status de agendamento
  async function updateAppointmentStatus(id: string, status: 'CONFIRMED' | 'CANCELLED') {
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error();

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
      setMessage({
        type: 'success',
        text: `Solicitação ${status === 'CONFIRMED' ? 'aprovada' : 'recusada'} com sucesso!`,
      });
    } catch {
      setMessage({ type: 'error', text: 'Não foi possível atualizar o status do agendamento.' });
    }
  }

  // Salvar disponibilidade
  async function saveAvailability() {
    try {
      const res = await fetch('/api/admin/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: availability.map((item) => ({
            ...item,
            session_duration: Number(item.session_duration),
          })),
        }),
      });

      if (!res.ok) throw new Error();

      setEditingAvailability(false);
      setMessage({ type: 'success', text: 'Horários de disponibilidade salvos com sucesso!' });
    } catch {
      setMessage({ type: 'error', text: 'Erro ao salvar disponibilidade.' });
    }
  }

  async function handleAdminLogout() {
    try {
      const response = await fetch('/api/admin/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Não foi possível encerrar a sessão.');
      window.location.assign('/login/admin');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível encerrar a sessão.',
      });
    }
  }

  const counts = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter((a) => a.status === 'PENDING').length,
      confirmed: appointments.filter((a) => a.status === 'CONFIRMED').length,
      cancelled: appointments.filter((a) => a.status === 'CANCELLED').length,
    };
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    if (appointmentFilter === 'ALL') return appointments;
    return appointments.filter((a) => a.status === appointmentFilter);
  }, [appointments, appointmentFilter]);

  const frameOptions: { value: PhotoFrameStyle; label: string; desc: string }[] = [
    { value: 'arch', label: 'Arco Clássico', desc: 'Estilo portal editorial e acolhedor (Recomendado)' },
    { value: 'rounded', label: 'Bordas Suaves', desc: 'Arredondado contemporâneo e elegante' },
    { value: 'oval', label: 'Formato Oval', desc: 'Silhueta orgânica e fluida' },
    { value: 'bordered', label: 'Moldura Dupla', desc: 'Passe-partout refinado em degradê marsala' },
  ];

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* MENSAGEM DE FEEDBACK */}
      {message && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-sm shadow-sm animate-fade-in-up ${
            message.type === 'success'
              ? 'bg-[#FAF0F2] border-[#7C1D30]/20 text-[#7C1D30]'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-base">{message.type === 'success' ? '✨' : '⚠️'}</span>
            <span className="font-medium">{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs font-bold uppercase tracking-wider opacity-60 hover:opacity-100"
          >
            Fechar
          </button>
        </div>
      )}

      {/* HEADER DE BOAS-VINDAS DO PAINEL */}
      <div className="bg-gradient-to-r from-[#7C1D30] to-[#5C1020] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white p-0.5 border border-white/20 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-psicologa.jpg" alt="Logo" className="w-full h-full object-cover rounded-full" />
          </div>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Painel de Gestão
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold uppercase tracking-wider text-white transition-colors"
          >
            Ver Site Oficial ↗
          </a>
          <button
            type="button"
            onClick={handleAdminLogout}
            className="rounded-full border border-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white"
          >
            Sair
          </button>
        </div>
      </div>

      {/* NAVEGAÇÃO ENTRE ABAS MODULARES */}
      <div className="flex flex-wrap gap-2 border-b border-[#7C1D30]/15 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-semibold transition-all ${
            activeTab === 'overview'
              ? 'bg-[#7C1D30] text-white shadow-md'
              : 'text-[#604C51] hover:bg-[#7C1D30]/10 hover:text-[#7C1D30]'
          }`}
        >
          Visão geral
        </button>
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'editor'
              ? 'bg-[#7C1D30] text-white shadow-md'
              : 'text-[#604C51] hover:bg-[#7C1D30]/10 hover:text-[#7C1D30]'
          }`}
        >
          <span>Editor da Página Inicial</span>
        </button>

        <button
          onClick={() => setActiveTab('social')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'social'
              ? 'bg-[#7C1D30] text-white shadow-md'
              : 'text-[#604C51] hover:bg-[#7C1D30]/10 hover:text-[#7C1D30]'
          }`}
        >
          <span>Redes Sociais & Contatos</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 relative ${
            activeTab === 'appointments'
              ? 'bg-[#7C1D30] text-white shadow-md'
              : 'text-[#604C51] hover:bg-[#7C1D30]/10 hover:text-[#7C1D30]'
          }`}
        >
          <span>Gerenciar Solicitações de Agenda</span>
          {counts.pending > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-[#FAF0F2] text-[#7C1D30]">
              {counts.pending}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-semibold transition-all ${
            activeTab === 'media'
              ? 'bg-[#7C1D30] text-white shadow-md'
              : 'text-[#604C51] hover:bg-[#7C1D30]/10 hover:text-[#7C1D30]'
          }`}
        >
          Biblioteca de mídia
        </button>
      </div>

      {activeTab === 'overview' && (
        <section className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border bg-white p-6">
            <h2 className="text-xl font-semibold">Solicitações pendentes</h2>
            <p className="mt-3 text-4xl font-bold text-[#7C1D30]">{counts.pending}</p>
            <button type="button" onClick={() => setActiveTab('appointments')} className="mt-5 text-sm font-semibold underline">
              Abrir agendamentos
            </button>
          </div>
          <div className="rounded-3xl border bg-white p-6">
            <h2 className="text-xl font-semibold">Publicação do site</h2>
            <p className="mt-3 text-sm">
              {hasUnpublishedChanges ? 'Há alterações salvas como rascunho.' : 'O rascunho está sincronizado com a versão publicada.'}
            </p>
            <button type="button" onClick={() => setActiveTab('editor')} className="mt-5 text-sm font-semibold underline">
              Abrir editor
            </button>
          </div>
        </section>
      )}

      {activeTab === 'media' && (
        <section className="space-y-5 rounded-3xl border bg-white p-6">
          <div>
            <h2 className="text-xl font-semibold">Biblioteca de mídia</h2>
            <p className="mt-1 text-sm text-gray-600">Imagens persistentes, com referência de uso antes da remoção.</p>
          </div>
          <div className="grid gap-3 rounded-2xl border p-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="space-y-1 text-sm font-medium">
              Texto alternativo da imagem
              <input
                type="text"
                maxLength={300}
                value={mediaAltText}
                onChange={(event) => setMediaAltText(event.target.value)}
                className="w-full rounded-xl border p-3 text-sm font-normal"
              />
            </label>
            <label className="cursor-pointer rounded-full bg-[#7C1D30] px-5 py-3 text-center text-sm font-semibold text-white">
              {uploadingLibraryMedia ? 'Enviando...' : 'Enviar imagem'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploadingLibraryMedia}
                className="sr-only"
                onChange={uploadLibraryMedia}
              />
            </label>
            <p className="text-xs text-gray-600 sm:col-span-2">JPG, PNG ou WEBP; até 5 MB. Informe um texto alternativo para acessibilidade.</p>
          </div>
          {loadingMedia ? (
            <p role="status">Carregando mídias…</p>
          ) : mediaAssets.length === 0 ? (
            <p>Nenhuma imagem enviada.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mediaAssets.map((asset) => (
                <li key={asset.id} className="space-y-3 rounded-2xl border p-4">
                  <img src={asset.public_url} alt={asset.alt_text} className="h-48 w-full rounded-xl object-cover" />
                  <p className="break-all text-xs">{asset.alt_text || 'Sem texto alternativo'}</p>
                  <p className="text-xs text-gray-600">
                    {(asset.byte_size / 1024).toFixed(0)} KB
                  </p>
                  {asset.usedIn.length > 0 && (
                    <ul className="text-xs text-gray-600">
                      {asset.usedIn.map((usage) => <li key={usage}>{usage}</li>)}
                    </ul>
                  )}
                  <button
                    type="button"
                    disabled={asset.usedIn.length > 0}
                    onClick={() => deleteMedia(asset.id)}
                    className="rounded-lg border border-red-300 px-3 py-2 text-xs text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          ABA 1: EDITOR VISUAL DA PÁGINA INICIAL (ESPELHO EDITÁVEL)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'editor' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#7C1D30]/15 shadow-sm">
            <div>
              <h2
                className="text-xl font-bold text-[#25181B]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Planejador & Editor da Página Inicial
              </h2>
              <p className="text-xs text-[#8B7378]">
                Altere textos, faça upload de fotos e selecione molduras para cada seção da sua landing page.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLivePreview(!showLivePreview)}
                className="px-4 py-2 rounded-full border border-[#7C1D30]/30 text-xs font-semibold text-[#7C1D30] hover:bg-[#7C1D30]/5 transition-colors"
              >
                {showLivePreview ? 'Ocultar Preview' : '👁️'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const shouldShow = !showRevisionHistory;
                  setShowRevisionHistory(shouldShow);
                  if (shouldShow) void loadRevisions();
                }}
                className="rounded-full border px-4 py-2 text-xs font-semibold"
              >
                {showRevisionHistory ? 'Ocultar histórico' : 'Histórico de versões'}
              </button>
              <button
                type="button"
                onClick={() => handleSaveSettings()}
                disabled={savingSettings}
                className="btn-marsala text-xs py-2.5 px-5 shadow-sm"
              >
                {savingSettings ? 'Salvando...' : 'Salvar rascunho'}
              </button>
              <button
                type="button"
                onClick={publishSettings}
                disabled={savingSettings}
                className="rounded-full bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                Publicar
              </button>
              <button
                type="button"
                onClick={discardSettings}
                disabled={!hasUnpublishedChanges || savingSettings}
                className="rounded-full border border-red-300 px-4 py-2.5 text-xs font-semibold text-red-700 disabled:opacity-50"
              >
                Descartar
              </button>
            </div>
          </div>

          {showRevisionHistory && (
            <section className="space-y-3 rounded-3xl border bg-white p-5" aria-label="Histórico de versões publicadas">
              <div>
                <h3 className="font-semibold">Versões publicadas</h3>
              </div>
              {loadingRevisions ? (
                <p role="status">Carregando histórico…</p>
              ) : revisions.length === 0 ? (
                <p className="text-sm text-gray-600">Ainda não há versões anteriores publicadas.</p>
              ) : (
                <ul className="space-y-2">
                  {revisions.map((revision) => (
                    <li key={revision.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                      <p className="text-sm">
                        Versão {revision.version} · {new Date(revision.created_at).toLocaleString('pt-BR')}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => restoreRevision(revision.id)}
                          disabled={deletingRevisionId !== null}
                          className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50"
                        >
                          Restaurar como rascunho
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRevision(revision)}
                          disabled={deletingRevisionId !== null}
                          className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                        >
                          {deletingRevisionId === revision.id ? 'Excluindo…' : 'Excluir'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* Sub-navegação das seções da página inicial */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'hero', label: '1. Seção Principal (Hero)' },
              { id: 'about', label: '2. Seção Sobre Mim' },
              { id: 'appointments', label: '3. Atendimentos' },
              { id: 'method', label: '4. Método / Abordagem' },
              { id: 'identification', label: '5. Identificação' },
              { id: 'cta', label: '6. Banner de Agendamento' },
              { id: 'layout', label: 'Estrutura e aparência' },
            ].map((sec) => (
              <button
                key={sec.id}
                onClick={() => setEditorSection(sec.id as typeof editorSection)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  editorSection === sec.id
                    ? 'bg-[#FAF0F2] text-[#7C1D30] border border-[#7C1D30]/30 font-bold'
                    : 'text-[#604C51] bg-white border border-gray-200 hover:border-[#7C1D30]/20'
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>

          <div className={`grid grid-cols-1 ${showLivePreview ? 'lg:grid-cols-2' : ''} gap-8`}>
            {/* FORMULÁRIO DE EDIÇÃO POR SEÇÃO */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#7C1D30]/15 shadow-sm space-y-6">
              {/* 1. SEÇÃO HERO */}
              {editorSection === 'hero' && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="border-b border-[#7C1D30]/10 pb-4">
                    <h3 className="font-bold text-lg text-[#25181B]">Seção Principal (Hero)</h3>
                    <p className="text-xs text-[#8B7378]">Primeira impressão do seu site ao carregar.</p>
                  </div>

                  {/* Foto da Hero e Moldura */}
                  <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#7C1D30]/15 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#7C1D30]">
                      Foto Principal da Página Inicial
                    </p>

                    <div className="flex flex-wrap items-center gap-6">
                      <div className="w-28 h-36 rounded-2xl overflow-hidden border-2 border-[#7C1D30]/20 bg-white shrink-0 shadow-sm">
                        {settings.hero.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={settings.hero.photo_url}
                            alt="Prévia Hero"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[#8B7378] text-center p-2">
                            Sem foto personalizada
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[#7C1D30] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#5C1020] transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload('hero', e)}
                          />
                          <span>📷 Fazer Upload de Nova Foto</span>
                        </label>
                        <p className="text-[11px] text-[#8B7378]">
                          JPG, PNG ou WEBP; até 5 MB.
                        </p>
                        {settings.hero.photo_url && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = {
                                ...settings,
                                hero: { ...settings.hero, photo_url: '' },
                              };
                              setSettings(updated);
                              handleSaveSettings(updated);
                            }}
                            className="text-xs text-red-600 hover:underline block"
                          >
                            Remover foto personalizada
                          </button>
                        )}
                      </div>
                    </div>
                    <label className="block space-y-1 text-xs font-semibold">
                      Texto alternativo da foto
                      <input
                        type="text"
                        maxLength={300}
                        value={settings.hero.photo_alt}
                        onChange={(event) => setSettings({
                          ...settings,
                          hero: { ...settings.hero, photo_alt: event.target.value },
                        })}
                        className="w-full rounded-xl border p-3 text-sm font-normal"
                      />
                    </label>
                    <label className="block space-y-1 text-xs font-semibold">
                      Ou selecionar da biblioteca
                      <select
                        value={mediaAssets.find((asset) => asset.public_url === settings.hero.photo_url)?.id ?? ''}
                        onChange={(event) => {
                          const asset = mediaAssets.find((item) => item.id === event.target.value);
                          setSettings({
                            ...settings,
                            hero: {
                              ...settings.hero,
                              photo_url: asset?.public_url ?? '',
                              photo_alt: asset?.alt_text ?? '',
                            },
                          });
                        }}
                        className="w-full rounded-xl border p-3 text-sm font-normal"
                      >
                        <option value="">Selecione uma imagem</option>
                        {mediaAssets.map((asset) => (
                          <option key={asset.id} value={asset.id}>{asset.alt_text || asset.public_url}</option>
                        ))}
                      </select>
                    </label>

                    {/* Seletor de Moldura */}
                    <div className="pt-3 border-t border-[#7C1D30]/10">
                      <label className="block text-xs font-bold text-[#25181B] mb-2">
                        Estilo de Moldura da Foto:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {frameOptions.map((opt) => (
                          <button
                            type="button"
                            key={opt.value}
                            onClick={() =>
                              setSettings({
                                ...settings,
                                hero: { ...settings.hero, photo_frame: opt.value },
                              })
                            }
                            className={`p-3 rounded-xl text-left border transition-all text-xs ${
                              settings.hero.photo_frame === opt.value
                                ? 'border-[#7C1D30] bg-[#FAF0F2] text-[#7C1D30] font-bold'
                                : 'border-gray-200 hover:border-[#7C1D30]/30'
                            }`}
                          >
                            <p className="font-semibold">{opt.label}</p>
                            <p className="text-[10px] text-[#8B7378] font-normal mt-0.5">{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Textos da Hero */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#25181B] mb-1">
                        Selo Superior (Badge):
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                        value={settings.hero.badge}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            hero: { ...settings.hero, badge: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#25181B] mb-1">
                        Título Principal:
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                        value={settings.hero.title}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            hero: { ...settings.hero, title: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#25181B] mb-1">
                        Destaque em Itálico do Título (tom Marsala):
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                        value={settings.hero.title_highlight}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            hero: { ...settings.hero, title_highlight: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#25181B] mb-1">
                        Subtítulo / Descrição:
                      </label>
                      <textarea
                        rows={3}
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                        value={settings.hero.subtitle}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            hero: { ...settings.hero, subtitle: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#25181B] mb-1">
                        Texto do Botão de Agendamento:
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                        value={settings.hero.cta_text}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            hero: { ...settings.hero, cta_text: e.target.value },
                          })
                        }
                      />
                    </div>

                    <EditableStringList
                      label="Especialidades ou tópicos do Hero"
                      values={settings.hero.specialties}
                      onChange={(specialties) =>
                        setSettings({ ...settings, hero: { ...settings.hero, specialties } })
                      }
                    />
                    <EditableStringList
                      label="Destaques complementares"
                      values={settings.hero.highlights}
                      onChange={(highlights) =>
                        setSettings({ ...settings, hero: { ...settings.hero, highlights } })
                      }
                    />
                  </div>
                </div>
              )}

              {/* 2. SEÇÃO SOBRE MIM */}
              {editorSection === 'about' && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="border-b border-[#7C1D30]/10 pb-4">
                    <h3 className="font-bold text-lg text-[#25181B]">Seção Sobre Mim</h3>
                    <p className="text-xs text-[#8B7378]">Conte sua história, missão e diferenciais clínicos.</p>
                  </div>

                  {/* Foto da Seção Sobre e Moldura */}
                  <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#7C1D30]/15 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#7C1D30]">
                      Foto da Seção Sobre Mim
                    </p>

                    <div className="flex flex-wrap items-center gap-6">
                      <div className="w-28 h-36 rounded-2xl overflow-hidden border-2 border-[#7C1D30]/20 bg-white shrink-0 shadow-sm">
                        {settings.about.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={settings.about.photo_url}
                            alt="Prévia Sobre"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[#8B7378] text-center p-2">
                            Sem foto personalizada
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[#7C1D30] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#5C1020] transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload('about', e)}
                          />
                          <span>📷 Fazer Upload de Foto para Sobre Mim</span>
                        </label>
                        <p className="text-[11px] text-[#8B7378]">
                          Pode ser uma foto diferente da principal da Hero!
                        </p>
                        {settings.about.photo_url && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = {
                                ...settings,
                                about: { ...settings.about, photo_url: '' },
                              };
                              setSettings(updated);
                              handleSaveSettings(updated);
                            }}
                            className="text-xs text-red-600 hover:underline block"
                          >
                            Remover foto personalizada
                          </button>
                        )}
                      </div>
                    </div>
                    <label className="block space-y-1 text-xs font-semibold">
                      Texto alternativo da foto
                      <input
                        type="text"
                        maxLength={300}
                        value={settings.about.photo_alt}
                        onChange={(event) => setSettings({
                          ...settings,
                          about: { ...settings.about, photo_alt: event.target.value },
                        })}
                        className="w-full rounded-xl border p-3 text-sm font-normal"
                      />
                    </label>
                    <label className="block space-y-1 text-xs font-semibold">
                      Ou selecionar da biblioteca
                      <select
                        value={mediaAssets.find((asset) => asset.public_url === settings.about.photo_url)?.id ?? ''}
                        onChange={(event) => {
                          const asset = mediaAssets.find((item) => item.id === event.target.value);
                          setSettings({
                            ...settings,
                            about: {
                              ...settings.about,
                              photo_url: asset?.public_url ?? '',
                              photo_alt: asset?.alt_text ?? '',
                            },
                          });
                        }}
                        className="w-full rounded-xl border p-3 text-sm font-normal"
                      >
                        <option value="">Selecione uma imagem</option>
                        {mediaAssets.map((asset) => (
                          <option key={asset.id} value={asset.id}>{asset.alt_text || asset.public_url}</option>
                        ))}
                      </select>
                    </label>

                    {/* Seletor de Moldura */}
                    <div className="pt-3 border-t border-[#7C1D30]/10">
                      <label className="block text-xs font-bold text-[#25181B] mb-2">
                        Estilo de Moldura da Foto:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {frameOptions.map((opt) => (
                          <button
                            type="button"
                            key={opt.value}
                            onClick={() =>
                              setSettings({
                                ...settings,
                                about: { ...settings.about, photo_frame: opt.value },
                              })
                            }
                            className={`p-3 rounded-xl text-left border transition-all text-xs ${
                              settings.about.photo_frame === opt.value
                                ? 'border-[#7C1D30] bg-[#FAF0F2] text-[#7C1D30] font-bold'
                                : 'border-gray-200 hover:border-[#7C1D30]/30'
                            }`}
                          >
                            <p className="font-semibold">{opt.label}</p>
                            <p className="text-[10px] text-[#8B7378] font-normal mt-0.5">{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#25181B] mb-1">
                        Título da Seção Sobre:
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                        value={settings.about.title}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            about: { ...settings.about, title: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#25181B] mb-1">
                        Primeiro Parágrafo da Biografia:
                      </label>
                      <textarea
                        rows={3}
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                        value={settings.about.paragraph_1}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            about: { ...settings.about, paragraph_1: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#25181B] mb-1">
                        Segundo Parágrafo:
                      </label>
                      <textarea
                        rows={3}
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                        value={settings.about.paragraph_2}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            about: { ...settings.about, paragraph_2: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#25181B] mb-1">
                        Método de Atuação:
                      </label>
                      <textarea
                        rows={2}
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                        value={settings.about.work_method}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            about: { ...settings.about, work_method: e.target.value },
                          })
                        }
                      />
                    </div>
                    <label className="block space-y-1 text-xs font-semibold">
                      Título curto da seção
                      <input
                        type="text"
                        value={settings.about.badge}
                        onChange={(event) => setSettings({
                          ...settings,
                          about: { ...settings.about, badge: event.target.value },
                        })}
                        className="w-full rounded-xl border p-3 text-sm font-normal"
                      />
                    </label>
                    <label className="block space-y-1 text-xs font-semibold">
                      Título da lista de diferenciais
                      <input
                        type="text"
                        value={settings.about.features_heading}
                        onChange={(event) => setSettings({
                          ...settings,
                          about: { ...settings.about, features_heading: event.target.value },
                        })}
                        className="w-full rounded-xl border p-3 text-sm font-normal"
                      />
                    </label>
                    <EditableStringList
                      label="Diferenciais do atendimento"
                      values={settings.about.features}
                      onChange={(features) => setSettings({
                        ...settings,
                        about: { ...settings.about, features },
                      })}
                    />
                    <label className="block space-y-1 text-xs font-semibold">
                      Texto do botão de contato
                      <input
                        type="text"
                        value={settings.about.cta_text}
                        onChange={(event) => setSettings({
                          ...settings,
                          about: { ...settings.about, cta_text: event.target.value },
                        })}
                        className="w-full rounded-xl border p-3 text-sm font-normal"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* 3. SEÇÃO DE ATENDIMENTOS */}
              {editorSection === 'appointments' && (
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-bold">Como são os atendimentos?</h3>
                    <p className="text-sm text-gray-600">Edite modalidade, duração e textos de cada coluna.</p>
                  </div>
                  {([
                    ['badge', 'Identificador da seção'],
                    ['title', 'Título'],
                    ['modality_label', 'Rótulo da modalidade'],
                    ['modality', 'Modalidade'],
                    ['duration_label', 'Rótulo da duração'],
                    ['duration', 'Duração'],
                  ] as const).map(([field, label]) => (
                    <label key={field} className="block space-y-1 text-sm font-semibold">
                      {label}
                      <input
                        value={settings.appointments[field]}
                        onChange={(event) => setSettings({
                          ...settings,
                          appointments: { ...settings.appointments, [field]: event.target.value },
                        })}
                        className="w-full rounded-xl border p-3 font-normal"
                      />
                    </label>
                  ))}
                  <EditableStringList
                    label="Textos principais"
                    values={settings.appointments.paragraphs}
                    onChange={(paragraphs) => setSettings({
                      ...settings,
                      appointments: { ...settings.appointments, paragraphs },
                    })}
                  />
                  <EditableStringList
                    label="Textos complementares"
                    values={settings.appointments.complementary_paragraphs}
                    onChange={(complementary_paragraphs) => setSettings({
                      ...settings,
                      appointments: { ...settings.appointments, complementary_paragraphs },
                    })}
                  />
                </div>
              )}

              {/* 4. SEÇÃO MÉTODO / ABORDAGEM */}
              {editorSection === 'method' && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="border-b border-[#7C1D30]/10 pb-4">
                    <h3 className="font-bold text-lg text-[#25181B]">Método e Abordagem</h3>
                    <p className="text-xs text-[#8B7378]">Explique como funciona o processo psicoterapêutico.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#25181B] mb-1">Título:</label>
                      <input
                        type="text"
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                        value={settings.method.title}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            method: { ...settings.method, title: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#25181B] mb-1">Subtítulo:</label>
                      <input
                        type="text"
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                        value={settings.method.subtitle}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            method: { ...settings.method, subtitle: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div className="space-y-3 pt-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#7C1D30]">
                        Passos do Processo Terapêutico:
                      </p>
                      {settings.method.steps.map((st, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#7C1D30]/15 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#7C1D30]">{st.number}</span>
                            <input
                              type="text"
                              className="w-full p-2 rounded-lg border border-gray-200 text-xs font-semibold"
                              value={st.title}
                              onChange={(e) => {
                                const nextSteps = [...settings.method.steps];
                                nextSteps[i] = { ...st, title: e.target.value };
                                setSettings({
                                  ...settings,
                                  method: { ...settings.method, steps: nextSteps },
                                });
                              }}
                            />
                          </div>
                          <textarea
                            rows={2}
                            className="w-full p-2 rounded-lg border border-gray-200 text-xs text-[#604C51]"
                            value={st.description}
                            onChange={(e) => {
                              const nextSteps = [...settings.method.steps];
                              nextSteps[i] = { ...st, description: e.target.value };
                              setSettings({
                                ...settings,
                                method: { ...settings.method, steps: nextSteps },
                              });
                            }}
                          />
                          <div className="flex items-center justify-between gap-2">
                            <input
                              aria-label={`Número da etapa ${i + 1}`}
                              className="w-24 rounded-lg border p-2 text-xs"
                              value={st.number}
                              onChange={(e) => {
                                const nextSteps = [...settings.method.steps];
                                nextSteps[i] = { ...st, number: e.target.value };
                                setSettings({ ...settings, method: { ...settings.method, steps: nextSteps } });
                              }}
                            />
                            <div className="flex gap-2">
                              <button type="button" disabled={i === 0} onClick={() => {
                                const nextSteps = [...settings.method.steps];
                                [nextSteps[i - 1], nextSteps[i]] = [nextSteps[i], nextSteps[i - 1]];
                                setSettings({ ...settings, method: { ...settings.method, steps: nextSteps } });
                              }}>Mover acima</button>
                              <button type="button" disabled={i === settings.method.steps.length - 1} onClick={() => {
                                const nextSteps = [...settings.method.steps];
                                [nextSteps[i + 1], nextSteps[i]] = [nextSteps[i], nextSteps[i + 1]];
                                setSettings({ ...settings, method: { ...settings.method, steps: nextSteps } });
                              }}>Mover abaixo</button>
                              <button type="button" onClick={() => setSettings({
                                ...settings,
                                method: { ...settings.method, steps: settings.method.steps.filter((_, index) => index !== i) },
                              })}>Remover</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="rounded-lg border px-3 py-2 text-sm"
                        onClick={() => setSettings({
                          ...settings,
                          method: {
                            ...settings.method,
                            steps: [...settings.method.steps, { number: '', title: '', description: '' }],
                          },
                        })}
                      >
                        Adicionar etapa
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. SEÇÃO IDENTIFICAÇÃO */}
              {editorSection === 'identification' && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="border-b border-[#7C1D30]/10 pb-4">
                    <h3 className="font-bold text-lg text-[#25181B]">Seção &quot;Você se Identifica?&quot;</h3>
                    <p className="text-xs text-[#8B7378]">Dores e situações com as quais o paciente se identifica.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#25181B] mb-1">Título:</label>
                      <input
                        type="text"
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                        value={settings.identification.title}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            identification: { ...settings.identification, title: e.target.value },
                          })
                        }
                      />
                    </div>

                    <label className="block space-y-1 text-xs font-semibold">
                      Identificador da seção
                      <input
                        value={settings.identification.badge}
                        onChange={(e) => setSettings({
                          ...settings,
                          identification: { ...settings.identification, badge: e.target.value },
                        })}
                        className="w-full rounded-xl border p-3 text-sm font-normal"
                      />
                    </label>
                    <label className="block space-y-1 text-xs font-semibold">
                      Subtítulo
                      <textarea
                        value={settings.identification.subtitle}
                        onChange={(e) => setSettings({
                          ...settings,
                          identification: { ...settings.identification, subtitle: e.target.value },
                        })}
                        className="w-full rounded-xl border p-3 text-sm font-normal"
                      />
                    </label>
                    <fieldset className="space-y-3">
                      <legend className="text-sm font-semibold">Cards de identificação</legend>
                      {settings.identification.items.map((item, index) => (
                        <div key={`${index}-${item.title}`} className="space-y-2 rounded-xl border p-3">
                          <label className="block space-y-1 text-xs">
                            Título do card
                            <input
                              value={item.title}
                              onChange={(e) => {
                                const items = [...settings.identification.items];
                                items[index] = { ...item, title: e.target.value };
                                setSettings({ ...settings, identification: { ...settings.identification, items } });
                              }}
                              className="w-full rounded-lg border p-2 text-sm"
                            />
                          </label>
                          <label className="block space-y-1 text-xs">
                            Descrição do card
                            <textarea
                              value={item.description}
                              onChange={(e) => {
                                const items = [...settings.identification.items];
                                items[index] = { ...item, description: e.target.value };
                                setSettings({ ...settings, identification: { ...settings.identification, items } });
                              }}
                              className="w-full rounded-lg border p-2 text-sm"
                            />
                          </label>
                          <div className="flex gap-2">
                            <button type="button" disabled={index === 0} onClick={() => {
                              const items = [...settings.identification.items];
                              [items[index - 1], items[index]] = [items[index], items[index - 1]];
                              setSettings({ ...settings, identification: { ...settings.identification, items } });
                            }}>Mover acima</button>
                            <button type="button" disabled={index === settings.identification.items.length - 1} onClick={() => {
                              const items = [...settings.identification.items];
                              [items[index + 1], items[index]] = [items[index], items[index + 1]];
                              setSettings({ ...settings, identification: { ...settings.identification, items } });
                            }}>Mover abaixo</button>
                            <button type="button" onClick={() => setSettings({
                              ...settings,
                              identification: {
                                ...settings.identification,
                                items: settings.identification.items.filter((_, itemIndex) => itemIndex !== index),
                              },
                            })}>Remover card</button>
                          </div>
                        </div>
                      ))}
                      <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setSettings({
                        ...settings,
                        identification: {
                          ...settings.identification,
                          items: [...settings.identification.items, { icon: '', title: '', description: '' }],
                        },
                      })}>Adicionar card</button>
                    </fieldset>
                    <label className="block space-y-1 text-xs font-semibold">
                      Texto do botão
                      <input
                        value={settings.identification.cta_text}
                        onChange={(e) => setSettings({
                          ...settings,
                          identification: { ...settings.identification, cta_text: e.target.value },
                        })}
                        className="w-full rounded-xl border p-3 text-sm font-normal"
                      />
                    </label>

                    <div>
                      <label className="block text-xs font-semibold text-[#25181B] mb-1">Frase de Conforto Final:</label>
                      <input
                        type="text"
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                        value={settings.identification.bottom_text}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            identification: { ...settings.identification, bottom_text: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 5. SEÇÃO CTA BANNER */}
              {editorSection === 'cta' && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="border-b border-[#7C1D30]/10 pb-4">
                    <h3 className="font-bold text-lg text-[#25181B]">Banner Final de Agendamento</h3>
                    <p className="text-xs text-[#8B7378]">Chamada final antes do rodapé.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#25181B] mb-1">Título de Fechamento:</label>
                      <input
                        type="text"
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                        value={settings.closing_cta.title}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            closing_cta: { ...settings.closing_cta, title: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#25181B] mb-1">Subtítulo Acolhedor:</label>
                      <textarea
                        rows={2}
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                        value={settings.closing_cta.subtitle}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            closing_cta: { ...settings.closing_cta, subtitle: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#25181B] mb-1">Texto do Botão:</label>
                      <input
                        type="text"
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                        value={settings.closing_cta.button_text}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            closing_cta: { ...settings.closing_cta, button_text: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {editorSection === 'layout' && (
                <div className="space-y-8">
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-bold">Identidade, estrutura e aparência</h3>
                    <p className="text-sm text-gray-600">Organize seções e ajuste tokens seguros do design.</p>
                  </div>

                  <fieldset className="grid gap-4 sm:grid-cols-2">
                    <legend className="mb-3 text-sm font-semibold">Identidade e rodapé</legend>
                    {([
                      ['name', 'Nome'],
                      ['professional_title', 'Título profissional'],
                      ['logo_url', 'Endereço da logo'],
                    ] as const).map(([field, label]) => (
                      <label key={field} className="space-y-1 text-xs font-semibold">
                        {label}
                        <input
                          value={settings.brand[field]}
                          onChange={(event) => setSettings({
                            ...settings,
                            brand: { ...settings.brand, [field]: event.target.value },
                          })}
                          className="w-full rounded-xl border p-3 text-sm font-normal"
                        />
                      </label>
                    ))}
                    <label className="space-y-1 text-xs font-semibold">
                      Ou selecionar logo da biblioteca
                      <select
                        value={mediaAssets.find((asset) => asset.public_url === settings.brand.logo_url)?.id ?? ''}
                        onChange={(event) => {
                          const asset = mediaAssets.find((item) => item.id === event.target.value);
                          setSettings({
                            ...settings,
                            brand: { ...settings.brand, logo_url: asset?.public_url ?? '' },
                          });
                        }}
                        className="w-full rounded-xl border p-3 text-sm font-normal"
                      >
                        <option value="">Selecione uma imagem</option>
                        {mediaAssets.map((asset) => (
                          <option key={asset.id} value={asset.id}>{asset.alt_text || asset.public_url}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-xs font-semibold sm:col-span-2">
                      Texto institucional do rodapé
                      <textarea
                        value={settings.brand.footer_description}
                        onChange={(event) => setSettings({
                          ...settings,
                          brand: { ...settings.brand, footer_description: event.target.value },
                        })}
                        className="w-full rounded-xl border p-3 text-sm font-normal"
                      />
                    </label>
                    <label className="space-y-1 text-xs font-semibold sm:col-span-2">
                      Aviso de emergência
                      <textarea
                        value={settings.brand.emergency_notice}
                        onChange={(event) => setSettings({
                          ...settings,
                          brand: { ...settings.brand, emergency_notice: event.target.value },
                        })}
                        className="w-full rounded-xl border p-3 text-sm font-normal"
                      />
                    </label>
                  </fieldset>

                  <fieldset className="grid gap-4 sm:grid-cols-2">
                    <legend className="mb-3 text-sm font-semibold">Textos do rodapé</legend>
                    {([
                      ['navigation_heading', 'Título da navegação'],
                      ['contact_heading', 'Título dos contatos'],
                      ['registration_label', 'Rótulo do registro profissional'],
                      ['privacy_label', 'Link de privacidade'],
                      ['copyright_text', 'Texto de direitos autorais'],
                    ] as const).map(([field, label]) => (
                      <label key={field} className="space-y-1 text-xs font-semibold">
                        {label}
                        <input
                          value={settings.footer[field]}
                          onChange={(event) => setSettings({
                            ...settings,
                            footer: { ...settings.footer, [field]: event.target.value },
                          })}
                          className="w-full rounded-xl border p-3 text-sm font-normal"
                        />
                      </label>
                    ))}
                  </fieldset>

                  <fieldset className="space-y-3">
                    <legend className="text-sm font-semibold">Links de navegação</legend>
                    {settings.navigation.map((item, index) => (
                      <div key={`${item.id}-${index}`} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-2">
                        <label className="space-y-1 text-xs">
                          Rótulo
                          <input value={item.label} onChange={(event) => {
                            const navigation = [...settings.navigation];
                            navigation[index] = { ...item, label: event.target.value };
                            setSettings({ ...settings, navigation });
                          }} className="w-full rounded-lg border p-2 text-sm" />
                        </label>
                        <label className="space-y-1 text-xs">
                          Destino
                          <input value={item.href} onChange={(event) => {
                            const navigation = [...settings.navigation];
                            navigation[index] = { ...item, href: event.target.value };
                            setSettings({ ...settings, navigation });
                          }} className="w-full rounded-lg border p-2 text-sm" />
                        </label>
                        <div className="flex gap-2 sm:col-span-2">
                          <button type="button" disabled={index === 0} onClick={() => {
                            const navigation = [...settings.navigation];
                            [navigation[index - 1], navigation[index]] = [navigation[index], navigation[index - 1]];
                            setSettings({ ...settings, navigation });
                          }}>Mover acima</button>
                          <button type="button" disabled={index === settings.navigation.length - 1} onClick={() => {
                            const navigation = [...settings.navigation];
                            [navigation[index + 1], navigation[index]] = [navigation[index], navigation[index + 1]];
                            setSettings({ ...settings, navigation });
                          }}>Mover abaixo</button>
                          <button type="button" onClick={() => setSettings({
                            ...settings,
                            navigation: settings.navigation.filter((_, itemIndex) => itemIndex !== index),
                          })}>Remover link</button>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setSettings({
                      ...settings,
                      navigation: [...settings.navigation, { id: `link-${Date.now()}`, label: '', href: '/' }],
                    })}>Adicionar link</button>
                  </fieldset>

                  <fieldset className="space-y-3">
                    <legend className="text-sm font-semibold">Seções, ordem e visibilidade</legend>
                    {settings.sections.order.map((section, index) => (
                      <div key={section} className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
                        <label className="flex flex-1 items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={settings.sections.visibility[section]}
                            onChange={(event) => setSettings({
                              ...settings,
                              sections: {
                                ...settings.sections,
                                visibility: { ...settings.sections.visibility, [section]: event.target.checked },
                              },
                            })}
                          />
                          {SECTION_LABELS[section]}
                        </label>
                        <button type="button" disabled={index === 0} onClick={() => {
                          const order = [...settings.sections.order];
                          [order[index - 1], order[index]] = [order[index], order[index - 1]];
                          setSettings({ ...settings, sections: { ...settings.sections, order } });
                        }}>Mover acima</button>
                        <button type="button" disabled={index === settings.sections.order.length - 1} onClick={() => {
                          const order = [...settings.sections.order];
                          [order[index + 1], order[index]] = [order[index], order[index + 1]];
                          setSettings({ ...settings, sections: { ...settings.sections, order } });
                        }}>Mover abaixo</button>
                      </div>
                    ))}
                    <p className="text-xs text-gray-600">Seções disponíveis: {SITE_SECTION_IDS.length}</p>
                  </fieldset>

                  <fieldset>
                    <legend className="mb-3 text-sm font-semibold">Paleta</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {([
                        ['background', 'Fundo'],
                        ['surface', 'Superfície'],
                        ['accent', 'Destaque'],
                        ['accent_dark', 'Destaque escuro'],
                        ['text', 'Cor dos títulos'],
                        ['text_muted', 'Cor dos textos do corpo'],
                      ] as const).map(([color, label]) => (
                        <label key={color} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">
                          {label}
                          <input
                            type="color"
                            value={settings.appearance.colors[color]}
                            onChange={(event) => setSettings({
                              ...settings,
                              appearance: {
                                ...settings.appearance,
                                colors: { ...settings.appearance.colors, [color]: event.target.value },
                              },
                            })}
                          />
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1 text-sm font-semibold">
                      Fonte de títulos
                      <select value={settings.appearance.heading_font} onChange={(event) => setSettings({
                        ...settings,
                        appearance: { ...settings.appearance, heading_font: event.target.value as SiteSettings['appearance']['heading_font'] },
                      })} className="w-full rounded-xl border p-3 font-normal">
                        <option value="The Seasons">The Seasons</option>
                        <option value="Cormorant Garamond">Cormorant Garamond</option>
                        <option value="Playfair Display">Playfair Display</option>
                        <option value="Georgia">Georgia</option>
                      </select>
                    </label>
                    <label className="space-y-1 text-sm font-semibold">
                      Fonte de corpo
                      <select value={settings.appearance.body_font} onChange={(event) => setSettings({
                        ...settings,
                        appearance: { ...settings.appearance, body_font: event.target.value as SiteSettings['appearance']['body_font'] },
                      })} className="w-full rounded-xl border p-3 font-normal">
                        <option value="Garet">Garet</option>
                        <option value="Inter">Inter</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Arial">Arial</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm font-semibold">
                      Tamanho dos títulos: {settings.appearance.heading_font_size}px
                      <input
                        type="range"
                        min="24"
                        max="72"
                        step="1"
                        value={settings.appearance.heading_font_size}
                        onChange={(event) => setSettings({
                          ...settings,
                          appearance: {
                            ...settings.appearance,
                            heading_font_size: Number(event.target.value),
                          },
                        })}
                        className="w-full accent-[#7C1D30]"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-semibold">
                      Tamanho dos textos: {settings.appearance.body_font_size}px
                      <input
                        type="range"
                        min="12"
                        max="24"
                        step="1"
                        value={settings.appearance.body_font_size}
                        onChange={(event) => setSettings({
                          ...settings,
                          appearance: {
                            ...settings.appearance,
                            body_font_size: Number(event.target.value),
                          },
                        })}
                        className="w-full accent-[#7C1D30]"
                      />
                    </label>
                  </div>

                  <fieldset>
                    <legend className="mb-3 text-sm font-semibold">Alinhamento do conteúdo</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {SITE_SECTION_IDS.map((section) => (
                        <label key={section} className="space-y-1 text-sm">
                          {SECTION_LABELS[section]}
                          <select
                            value={settings.appearance.alignment[section]}
                            onChange={(event) => setSettings({
                              ...settings,
                              appearance: {
                                ...settings.appearance,
                                alignment: {
                                  ...settings.appearance.alignment,
                                    [section]: event.target.value === 'center' ? 'center' : 'left',
                                },
                              },
                            })}
                            className="w-full rounded-xl border p-3"
                          >
                            <option value="left">À esquerda</option>
                            <option value="center">Centralizado</option>
                          </select>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <label className="flex items-center gap-3 rounded-xl border p-4 text-sm">
                    <input
                      type="checkbox"
                      checked={settings.appearance.decorative_dividers}
                      onChange={(event) => setSettings({
                        ...settings,
                        appearance: {
                          ...settings.appearance,
                          decorative_dividers: event.target.checked,
                        },
                      })}
                    />
                    Exibir divisórias entre as seções
                  </label>

                  <label className="block space-y-1 text-sm font-semibold">
                    Espaçamento vertical das seções
                    <select
                      value={settings.appearance.section_spacing}
                      onChange={(event) => setSettings({
                        ...settings,
                        appearance: {
                          ...settings.appearance,
                          section_spacing:
                            event.target.value === 'compact'
                              ? 'compact'
                              : event.target.value === 'spacious'
                                ? 'spacious'
                                : 'comfortable',
                        },
                      })}
                      className="w-full rounded-xl border p-3 font-normal"
                    >
                      <option value="compact">Compacto</option>
                      <option value="comfortable">Confortável</option>
                      <option value="spacious">Amplo</option>
                    </select>
                  </label>
                </div>
              )}

              <div className="pt-4 border-t border-[#7C1D30]/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveSettings()}
                  disabled={savingSettings}
                  className="btn-marsala text-xs py-3 px-8 shadow-md"
                >
                  {savingSettings ? 'Salvando...' : 'Salvar Alterações desta Seção'}
                </button>
              </div>
            </div>

            {/* Preview completo renderizado pelos mesmos componentes públicos */}
            {showLivePreview && (
              <div className="sticky top-4 min-w-0 rounded-3xl border-2 border-[#7C1D30]/20 bg-[#FAF7F2] p-4 shadow-inner">
                <SitePreviewFrame settings={settings} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          ABA 2: GESTÃO DE REDES SOCIAIS E CONTATOS (DINÂMICO)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'social' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#7C1D30]/15 shadow-sm space-y-8 animate-fade-in-up">
          <div>
            <h2
              className="text-xl font-bold text-[#25181B]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Gestão de Redes Sociais & Contatos
            </h2>
            <p className="text-xs text-[#8B7378] mt-1">
              Nenhum link fica fixado no código. Tudo o que você alterar aqui atualizará instantaneamente
              o cabeçalho, o rodapé, os botões flutuantes e os links de agendamento de todo o site.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* WhatsApp */}
            <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#7C1D30]/15 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 text-[#25D366] flex items-center justify-center font-bold">
                  WA
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#25181B]">WhatsApp Oficial</h3>
                  <p className="text-[11px] text-[#8B7378]">Destino dos botões de agendamento do site</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#25181B] mb-1">
                  Número de WhatsApp (com DDD e DDI):
                </label>
                <input
                  type="text"
                  placeholder="Ex: 5511991244821"
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                  value={settings.contacts.whatsapp_number}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contacts: { ...settings.contacts, whatsapp_number: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#25181B] mb-1">
                  Mensagem Padrão de Abertura:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Olá! Quero agendar um horário."
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                  value={settings.contacts.whatsapp_message}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contacts: { ...settings.contacts, whatsapp_message: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#25181B] mb-1">
                  Link Completo do WhatsApp:
                </label>
                <input
                  type="text"
                  className="w-full p-3 rounded-xl border border-gray-200 text-xs font-mono text-[#604C51] focus:border-[#7C1D30] focus:outline-none"
                  value={settings.contacts.whatsapp_link}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contacts: { ...settings.contacts, whatsapp_link: e.target.value },
                    })
                  }
                />
                <p className="text-[10px] text-[#8B7378] mt-1">
                  Se você preencher apenas o número e a mensagem, o link será atualizado automaticamente ao salvar.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href={settings.contacts.whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#25D366] font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <span>Testar link do WhatsApp agora</span>
                  <span>↗</span>
                </a>
              </div>
            </div>

            {/* Instagram e TikTok */}
            <div className="space-y-6">
              {/* Instagram */}
              <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#7C1D30]/15 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E4B3BC]/30 text-[#7C1D30] flex items-center justify-center font-bold">
                    IG
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#25181B]">Instagram Profissional</h3>
                    <p className="text-[11px] text-[#8B7378]">Link do perfil exibido no rodapé e no flutuante</p>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="https://"
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                  value={settings.contacts.instagram_url}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contacts: { ...settings.contacts, instagram_url: e.target.value },
                    })
                  }
                />

                <a
                  href={settings.contacts.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#7C1D30] font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <span>Ver perfil no Instagram</span>
                  <span>↗</span>
                </a>
              </div>

              {/* TikTok */}
              <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#7C1D30]/15 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black/10 text-[#25181B] flex items-center justify-center font-bold">
                    TT
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#25181B]">TikTok</h3>
                    <p className="text-[11px] text-[#8B7378]">Vídeos e conteúdos dinâmicos</p>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="https://"
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                  value={settings.contacts.tiktok_url}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contacts: { ...settings.contacts, tiktok_url: e.target.value },
                    })
                  }
                />

                <a
                  href={settings.contacts.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#25181B] font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <span>Ver perfil no TikTok</span>
                  <span>↗</span>
                </a>
              </div>

              {/* CRP Profissional */}
              <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#7C1D30]/15 space-y-3">
                <h3 className="font-bold text-sm text-[#25181B]">Registro Profissional (CRP)</h3>
                <input
                  type="text"
                  placeholder="Ex: 06/204918"
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#7C1D30] focus:outline-none"
                  value={settings.contacts.crp}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contacts: { ...settings.contacts, crp: e.target.value },
                    })
                  }
                />
              </div>

              <fieldset className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#7C1D30]/15 space-y-3">
                <legend className="font-bold text-sm text-[#25181B]">Dados exibidos no rodapé</legend>
                {([
                  ['phone', 'Telefone de contato'],
                  ['email', 'E-mail de contato'],
                  ['address', 'Apresentação / modalidade de atendimento'],
                ] as const).map(([field, label]) => (
                  <label key={field} className="block space-y-1 text-xs font-semibold text-[#25181B]">
                    {label}
                    {field === 'address' ? (
                      <textarea
                        rows={3}
                        value={settings.contacts[field]}
                        onChange={(event) => setSettings({
                          ...settings,
                          contacts: { ...settings.contacts, [field]: event.target.value },
                        })}
                        className="w-full rounded-xl border border-gray-200 p-3 text-sm font-normal focus:border-[#7C1D30] focus:outline-none"
                      />
                    ) : (
                      <input
                        type={field === 'email' ? 'email' : 'tel'}
                        value={settings.contacts[field]}
                        onChange={(event) => setSettings({
                          ...settings,
                          contacts: { ...settings.contacts, [field]: event.target.value },
                        })}
                        className="w-full rounded-xl border border-gray-200 p-3 text-sm font-normal focus:border-[#7C1D30] focus:outline-none"
                      />
                    )}
                  </label>
                ))}
              </fieldset>
            </div>
          </div>

          <div className="pt-4 border-t border-[#7C1D30]/10 flex justify-end">
            <button
              type="button"
              onClick={() => handleSaveSettings()}
              disabled={savingSettings}
              className="btn-marsala text-sm py-3 px-8 shadow-md"
            >
              {savingSettings ? 'Salvando...' : '💾 Salvar e Atualizar Contatos no Site'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          ABA 3: GESTÃO DE SOLICITAÇÕES DE AGENDAMENTO (MANTIDA E APRIMORADA)
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'appointments' && (
        <div className="space-y-8 animate-fade-in-up">
          {/* CARDS DE RESUMO DE SOLICITAÇÕES */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#7C1D30]/15 shadow-sm space-y-1">
              <p className="text-xs text-[#8B7378] font-medium uppercase tracking-wider">Total Geral</p>
              <p className="text-3xl font-bold text-[#25181B]">{counts.total}</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF0F2] border border-[#7C1D30]/30 shadow-sm space-y-1">
              <p className="text-xs text-[#7C1D30] font-bold uppercase tracking-wider">Aguardando Validação</p>
              <p className="text-3xl font-bold text-[#7C1D30]">{counts.pending}</p>
            </div>

            <div className="p-5 rounded-2xl bg-green-50 border border-green-200 shadow-sm space-y-1">
              <p className="text-xs text-green-700 font-bold uppercase tracking-wider">Confirmadas / Aprovadas</p>
              <p className="text-3xl font-bold text-green-800">{counts.confirmed}</p>
            </div>

            <div className="p-5 rounded-2xl bg-red-50 border border-red-200 shadow-sm space-y-1">
              <p className="text-xs text-red-700 font-bold uppercase tracking-wider">Canceladas / Recusadas</p>
              <p className="text-3xl font-bold text-red-800">{counts.cancelled}</p>
            </div>
          </div>

          {/* LISTA DE SOLICITAÇÕES COM FILTROS */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#7C1D30]/15 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#7C1D30]/10 pb-5">
              <div>
                <h2
                  className="text-xl font-bold text-[#25181B]"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Solicitações de Agendamento
                </h2>
                <p className="text-xs text-[#8B7378]">
                  Visualize, aprove ou recuse os pedidos de consulta enviados pelos pacientes.
                </p>
              </div>

              {/* Filtros rápidos */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'PENDING', label: `Pendentes (${counts.pending})` },
                  { key: 'CONFIRMED', label: `Aprovadas (${counts.confirmed})` },
                  { key: 'CANCELLED', label: `Recusadas (${counts.cancelled})` },
                  { key: 'ALL', label: `Todas (${counts.total})` },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setAppointmentFilter(f.key as typeof appointmentFilter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      appointmentFilter === f.key
                        ? 'bg-[#7C1D30] text-white shadow-sm'
                        : 'bg-[#FAF7F2] text-[#604C51] hover:bg-[#7C1D30]/10'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ITENS DE AGENDAMENTO */}
            <div className="space-y-4">
              {filteredAppointments.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#FAF7F2] border border-dashed border-[#7C1D30]/20 space-y-2">
                  <p className="text-2xl">🌱</p>
                  <p className="font-semibold text-sm text-[#25181B]">
                    Nenhuma solicitação encontrada nesta categoria.
                  </p>
                  <p className="text-xs text-[#8B7378]">
                    Novos agendamentos solicitados pelos pacientes aparecerão aqui instantaneamente.
                  </p>
                </div>
              ) : (
                filteredAppointments.map((a) => {
                  const cleanPhone = a.telefone.replace(/\D/g, '');
                  const zapMsg = encodeURIComponent(
                    `Olá ${a.nome_paciente}, tudo bem? Sou ${settings.brand.name || 'a psicóloga'}. Vi sua solicitação para a consulta em ${a.data} às ${a.hora}.`
                  );
                  const patientZapUrl = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${zapMsg}`;

                  return (
                    <div
                      key={a.id}
                      className={`p-6 rounded-2xl border transition-all duration-200 space-y-4 ${
                        a.status === 'PENDING'
                          ? 'bg-[#FAF0F2]/40 border-[#7C1D30]/30 shadow-sm'
                          : a.status === 'CONFIRMED'
                          ? 'bg-green-50/50 border-green-200'
                          : 'bg-gray-50 border-gray-200 opacity-75'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-base text-[#25181B]">{a.nome_paciente}</h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                a.status === 'PENDING'
                                  ? 'bg-[#7C1D30] text-white'
                                  : a.status === 'CONFIRMED'
                                  ? 'bg-green-700 text-white'
                                  : 'bg-red-700 text-white'
                              }`}
                            >
                              {statusLabel[a.status]}
                            </span>
                          </div>
                          <p className="text-xs text-[#8B7378] mt-0.5">
                            Data e Horário Solicitado:{' '}
                            <strong className="text-[#25181B]">{a.data} às {a.hora}</strong>
                          </p>
                        </div>

                        {/* Botão de contato rápido com o paciente via WhatsApp */}
                        <a
                          href={patientZapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366] text-white text-xs font-semibold hover:bg-[#1EBE5D] transition-colors self-start sm:self-center"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          <span>Falar no WhatsApp</span>
                        </a>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#604C51] bg-white/70 p-3 rounded-xl border border-gray-100">
                        <p><strong>E-mail:</strong> {a.email}</p>
                        <p><strong>Telefone:</strong> {a.telefone}</p>
                        {a.mensagem && (
                          <p className="sm:col-span-2 pt-1 border-t border-gray-100 mt-1">
                            <strong>Mensagem do paciente:</strong> {a.mensagem}
                          </p>
                        )}
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex items-center gap-3 pt-1">
                        {a.status !== 'CONFIRMED' && (
                          <button
                            onClick={() => updateAppointmentStatus(a.id, 'CONFIRMED')}
                            className="px-4 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white text-xs font-semibold shadow-sm transition-colors"
                          >
                            ✓ Aprovar Agendamento
                          </button>
                        )}

                        {a.status !== 'CANCELLED' && (
                          <button
                            onClick={() => updateAppointmentStatus(a.id, 'CANCELLED')}
                            className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors"
                          >
                            ✕ Recusar / Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* GESTÃO DE DISPONIBILIDADE SEMANAL (MANTIDA E INTEGRADA) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#7C1D30]/15 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#7C1D30]/10 pb-4">
              <div>
                <h3
                  className="text-lg font-bold text-[#25181B]"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Configuração de Horários da Semana
                </h3>
                <p className="text-xs text-[#8B7378]">
                  Defina os dias da semana e os blocos de horário em que você aceita atendimentos.
                </p>
              </div>

              <button
                onClick={() => setEditingAvailability(!editingAvailability)}
                className="text-xs font-bold uppercase tracking-wider text-[#7C1D30] hover:underline"
              >
                {editingAvailability ? 'Concluir Edição' : 'Editar Horários'}
              </button>
            </div>

            {editingAvailability ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  {availability.map((item, i) => (
                    <div
                      key={item.day_of_week}
                      className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-3 rounded-xl border border-gray-200 items-center text-xs"
                    >
                      <span className="font-semibold text-sm text-[#25181B]">
                        {getWeekdayLabel(item.day_of_week)}
                      </span>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="availability-checkbox"
                          checked={!item.is_blocked}
                          onChange={(e) => {
                            const next = [...availability];
                            next[i].is_blocked = !e.target.checked;
                            setAvailability(next);
                          }}
                        />
                        <span>{item.is_blocked ? 'Bloqueado' : 'Disponível'}</span>
                      </label>

                      <div className="flex items-center gap-1">
                        <span>De:</span>
                        <input
                          type="time"
                          className="border p-1.5 rounded-lg w-full text-xs"
                          value={item.start_time}
                          onChange={(e) => {
                            const next = [...availability];
                            next[i].start_time = e.target.value;
                            setAvailability(next);
                          }}
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span>Até:</span>
                        <input
                          type="time"
                          className="border p-1.5 rounded-lg w-full text-xs"
                          value={item.end_time}
                          onChange={(e) => {
                            const next = [...availability];
                            next[i].end_time = e.target.value;
                            setAvailability(next);
                          }}
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span>Duração (min):</span>
                        <input
                          type="number"
                          min={30}
                          max={120}
                          className="border p-1.5 rounded-lg w-full text-xs"
                          value={item.session_duration}
                          onChange={(e) => {
                            const next = [...availability];
                            next[i].session_duration = Number(e.target.value);
                            setAvailability(next);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={saveAvailability}
                    className="btn-marsala text-xs py-2.5 px-6"
                  >
                    Salvar Horários da Semana
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {availability.map((item) => (
                  <div
                    key={item.day_of_week}
                    className={`p-3.5 rounded-xl border text-xs ${
                      !item.is_blocked
                        ? 'bg-[#FAF0F2] border-[#7C1D30]/20 text-[#7C1D30]'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}
                  >
                    <p className="font-bold">{getWeekdayLabel(item.day_of_week)}</p>
                    <p className="mt-1">
                      {!item.is_blocked
                        ? `${item.start_time} às ${item.end_time} (${item.session_duration} min)`
                        : 'Sem atendimento'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
