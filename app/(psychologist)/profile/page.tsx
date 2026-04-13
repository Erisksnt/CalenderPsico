'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PsychologistProfile {
  id: string;
  user_id: string;
  full_name: string;
  professional_bio: string;
  work_method: string;
  specialties: string[];
  photo_url?: string | null;
}

interface ProfileFormData {
  full_name: string;
  professional_bio: string;
  work_method: string;
  specialties: string[];
  photo_url: string;
}

const initialFormData: ProfileFormData = {
  full_name: '',
  professional_bio: '',
  work_method: '',
  specialties: [],
  photo_url: '',
};

export default function ProfilePage() {
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/psychologist/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.success) {
          const received: PsychologistProfile = data.data;
          setFormData({
            full_name: received.full_name || '',
            professional_bio: received.professional_bio || '',
            work_method: received.work_method || '',
            specialties: received.specialties || [],
            photo_url: received.photo_url || '',
          });
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'specialties') {
      const parsed = value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      setFormData((prev) => ({ ...prev, specialties: parsed }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/psychologist/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          specialties: formData.specialties,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        const updated: PsychologistProfile = data.data;
        setFormData({
          full_name: updated.full_name || '',
          professional_bio: updated.professional_bio || '',
          work_method: updated.work_method || '',
          specialties: updated.specialties || [],
          photo_url: updated.photo_url || '',
        });
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando perfil...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Editar perfil clínico</h1>

      {success && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✓ Perfil atualizado com sucesso!
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
        <div>
          <label className="block text-gray-700 font-bold mb-2">Nome completo</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-[#C2183A]"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">Apresentação profissional</label>
          <textarea
            name="professional_bio"
            value={formData.professional_bio}
            onChange={handleChange}
            rows={4}
            placeholder="Descreva sua experiência, abordagem terapêutica e foco de atendimento."
            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-[#C2183A]"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">Método de trabalho</label>
          <textarea
            name="work_method"
            value={formData.work_method}
            onChange={handleChange}
            rows={3}
            placeholder="Explique como você conduz o acompanhamento e quais práticas são prioritárias."
            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-[#C2183A]"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">Especialidades (separadas por vírgula)</label>
          <input
            type="text"
            name="specialties"
            value={formData.specialties.join(', ')}
            onChange={handleChange}
            placeholder="Ansiedade, Depressão, Relacionamentos..."
            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-[#C2183A]"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-bold mb-2">URL da foto de perfil (opcional)</label>
          <input
            type="text"
            name="photo_url"
            value={formData.photo_url}
            onChange={handleChange}
            placeholder="https://exemplo.com/foto.jpg"
            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-[#C2183A]"
          />
        </div>

        <div className="flex flex-col gap-3 pt-4 md:flex-row">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-[#C2183A] text-white py-3 rounded-full font-semibold hover:bg-[#a0162f] disabled:opacity-60 transition"
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 border border-gray-300 text-gray-800 py-3 rounded-full font-semibold hover:border-[#C2183A] hover:text-[#C2183A] transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
