// app/(psychologist)/availability/page.tsx
// Página de gerenciamento de disponibilidades

'use client';

import { useEffect, useState, FormEvent } from 'react';
import { getDayOfWeekName } from '@/lib/utils';

interface Availability {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_blocked: boolean;
}

export default function AvailabilityPage() {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayOfWeek, setDayOfWeek] = useState('MONDAY');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAvailabilities();
  }, []);

  const fetchAvailabilities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/availability', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setAvailabilities(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar disponibilidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Horário adicionado com sucesso!');
        await fetchAvailabilities();
        setStartTime('09:00');
        setEndTime('12:00');
      } else {
        setError(data.error || 'Erro ao adicionar horário');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este horário?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/availability/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchAvailabilities();
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Gerenciar Disponibilidades</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Adicionar Horário</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <div className="mb-4">
            <label className="block font-bold mb-2">Dia da Semana</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="w-full border rounded px-4 py-2"
            >
              <option value="MONDAY">Segunda</option>
              <option value="TUESDAY">Terça</option>
              <option value="WEDNESDAY">Quarta</option>
              <option value="THURSDAY">Quinta</option>
              <option value="FRIDAY">Sexta</option>
              <option value="SATURDAY">Sábado</option>
              <option value="SUNDAY">Domingo</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block font-bold mb-2">Hora de Início</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border rounded px-4 py-2"
            />
          </div>

          <div className="mb-6">
            <label className="block font-bold mb-2">Hora de Término</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border rounded px-4 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Adicionando...' : 'Adicionar Horário'}
          </button>
        </form>

        {/* Lista */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Horários Configurados</h2>

          {availabilities.length === 0 ? (
            <p className="text-gray-600">Nenhum horário configurado.</p>
          ) : (
            <div className="space-y-2">
              {availabilities.map((avail) => (
                <div
                  key={avail.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded border"
                >
                  <div>
                    <p className="font-bold">{getDayOfWeekName(avail.day_of_week)}</p>
                    <p className="text-sm text-gray-600">
                      {avail.start_time} - {avail.end_time}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(avail.id)}
                    className="text-red-600 hover:text-red-700 font-bold"
                  >
                    Deletar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
