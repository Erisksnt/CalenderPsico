// components/patient/AvailabilityList.tsx
// Apresentação do psicólogo e seus horários disponíveis (single psychologist)

'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import BookingForm from './BookingForm';

interface Psychologist {
  id: string;
  name: string;
  bio?: string;
  specialties: string[];
  services: any[];
}

export default function AvailabilityList() {
  const [psychologist, setPsychologist] = useState<Psychologist | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPsychologist();
  }, []);

  const fetchPsychologist = async () => {
    try {
      const response = await fetch('/api/psychologists');
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        // Pega o primeiro (único) psicólogo registrado
        setPsychologist(data.data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do psicólogo:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!psychologist) {
    return <div className="text-center py-8 text-gray-600">Psicólogo não disponível no momento.</div>;
  }

  return (
    <div className="container mx-auto px-6">
      {showBookingForm ? (
        <div>
          <button
            onClick={() => setShowBookingForm(false)}
            className="mb-4 text-blue-600 hover:text-blue-700 font-bold"
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
