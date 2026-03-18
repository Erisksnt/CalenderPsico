// components/patient/AvailabilityList.tsx
'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import BookingForm from './BookingForm';

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
}

interface Psychologist {
  id: string;
  name: string;
  bio?: string;
  specialties: string[];
  services: Service[];
}

export default function AvailabilityList() {
  const [psychologist, setPsychologist] = useState<Psychologist | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPsychologist();
  }, []);

  const fetchPsychologist = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ⚡ Chamada otimizada - já usa a API que melhoramos
      const response = await fetch('/api/psychologists');
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Erro ao carregar dados');
        return;
      }

      if (data.data && data.data.length > 0) {
        setPsychologist(data.data[0]);
      } else {
        setError('Psicólogo não encontrado');
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do psicólogo:', error);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !psychologist) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">
          {error || 'Psicólogo não disponível no momento.'}
        </p>
        <button
          onClick={fetchPsychologist}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6">
      {showBookingForm ? (
        <div>
          <button
            onClick={() => setShowBookingForm(false)}
            className="mb-4 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
          >
            ← Voltar
          </button>
          <BookingForm
            psychologistId={psychologist.id}
            onBookingComplete={() => setShowBookingForm(false)}
          />
        </div>
      ) : (
        <div>
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">{psychologist.name}</h1>

            {psychologist.bio && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h2 className="text-lg font-bold text-gray-700 mb-2">Sobre</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{psychologist.bio}</p>
              </div>
            )}

            {psychologist.specialties && psychologist.specialties.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-700 mb-3">Especialidades</h2>
                <div className="flex flex-wrap gap-2">
                  {psychologist.specialties.map((specialty, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-700 mb-3">Serviços e Valores</h2>
              {psychologist.services && psychologist.services.length > 0 ? (
                <div className="space-y-3">
                  {psychologist.services.map((service) => (
                    <div
                      key={service.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <p className="font-bold text-gray-800">{service.name}</p>
                        <p className="text-sm text-gray-600">Duração: {service.duration} minutos</p>
                      </div>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(service.price)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Nenhum serviço cadastrado</p>
              )}
            </div>

            <button
              onClick={() => setShowBookingForm(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition text-lg"
            >
              Agendar Consulta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}