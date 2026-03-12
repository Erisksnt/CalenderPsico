// app/(psychologist)/profile/page.tsx
// Página para editar perfil do psicólogo

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PsychologistProfile {
  id: string;
  name: string;
  bio?: string;
  specialties: string[];
  registration_number: string;
  phone?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<PsychologistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<Partial<PsychologistProfile>>({});
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/psychologists/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
        setFormData(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'specialties') {
      setFormData({
        ...formData,
        specialties: value.split(',').map((s) => s.trim()),
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/psychologists/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        setProfile(data.data);
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Editar Perfil</h1>

      {success && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ Perfil atualizado com sucesso!
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
        <div>
          <label className="block text-gray-700 font-bold mb-2">Nome Completo</label>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-600"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">Telefone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            placeholder="(11) 98765-4321"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">Apresentação Profissional</label>
          <textarea
            name="bio"
            value={formData.bio || ''}
            onChange={handleChange}
            rows={4}
            placeholder="Descreva sua experiência, abordagens terapêuticas, e especialidades..."
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">CRP (Conselho Regional de Psicologia)</label>
          <input
            type="text"
            name="registration_number"
            value={formData.registration_number || ''}
            onChange={handleChange}
            placeholder="12345/SP"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-600 bg-gray-100 cursor-not-allowed"
            disabled
          />
          <p className="text-sm text-gray-600 mt-1">CRP não pode ser alterado</p>
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">Especialidades (separadas por vírgula)</label>
          <input
            type="text"
            name="specialties"
            value={formData.specialties?.join(', ') || ''}
            onChange={handleChange}
            placeholder="Ansiedade, Depressão, Relacionamentos..."
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-300 text-gray-800 py-3 rounded font-bold hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
