// app/(psychologist)/services/page.tsx
// Página de gerenciamento de serviços

'use client';

import { useEffect, useState, FormEvent } from 'react';
import { formatCurrency } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  color: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('60');
  const [price, setPrice] = useState('100');
  const [color, setColor] = useState('#3B82F6');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/services', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setServices(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
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
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description: description || undefined,
          duration: parseInt(duration),
          price: parseFloat(price),
          color,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Serviço criado com sucesso!');
        await fetchServices();
        setName('');
        setDescription('');
        setDuration('60');
        setPrice('100');
        setColor('#3B82F6');
      } else {
        setError(data.error || 'Erro ao criar serviço');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este serviço?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/services/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchServices();
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Gerenciar Serviços</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Novo Serviço</h2>

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
            <label className="block font-bold mb-2">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded px-4 py-2"
              placeholder="Ex: Sessão individual"
            />
          </div>

          <div className="mb-4">
            <label className="block font-bold mb-2">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-4 py-2"
              rows={3}
            />
          </div>

          <div className="mb-4">
            <label className="block font-bold mb-2">Duração (minutos)</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full border rounded px-4 py-2">
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">60 minutos</option>
              <option value="90">90 minutos</option>
              <option value="120">120 minutos</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block font-bold mb-2">Preço (R$)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              step="0.01"
              className="w-full border rounded px-4 py-2"
            />
          </div>

          <div className="mb-6">
            <label className="block font-bold mb-2">Cor</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 border rounded cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Criando...' : 'Criar Serviço'}
          </button>
        </form>

        {/* Lista */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Serviços Criados</h2>

          {services.length === 0 ? (
            <p className="text-gray-600">Nenhum serviço criado.</p>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="p-4 bg-gray-50 rounded border-l-4"
                  style={{ borderLeftColor: service.color }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold">{service.name}</p>
                      <p className="text-sm text-gray-600">
                        {service.duration}min • {formatCurrency(service.price)}
                      </p>
                      {service.description && (
                        <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="text-red-600 hover:text-red-700 font-bold text-sm"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
