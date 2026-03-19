// components/patient/BookingForm.tsx
'use client';

import { useState } from 'react';

interface BookingFormProps {
  psychologistId: string;
  onBookingComplete: () => void;
}

export default function BookingForm({ psychologistId, onBookingComplete }: BookingFormProps) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    data: '',
    hora: '',
    mensagem: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/public/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          psychologistId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao agendar');
      }

      alert('Agendamento realizado com sucesso!');
      onBookingComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-[#101010]">Agendar Consulta</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome Completo *
          </label>
          <input
            type="text"
            required
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C2183A] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C2183A] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone *
          </label>
          <input
            type="tel"
            required
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C2183A] focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data *
            </label>
            <input
              type="date"
              required
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C2183A] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horário *
            </label>
            <input
              type="time"
              required
              value={formData.hora}
              onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C2183A] focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mensagem (opcional)
          </label>
          <textarea
            rows={3}
            value={formData.mensagem}
            onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C2183A] focus:border-transparent"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#C2183A] text-white py-2 rounded-lg hover:bg-[#a0162f] transition font-bold disabled:opacity-50"
          >
            {loading ? 'Agendando...' : 'Confirmar Agendamento'}
          </button>
          <button
            type="button"
            onClick={onBookingComplete}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-bold"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}