// components/patient/BookingForm.tsx
// Formulário de agendamento de consulta

'use client';

import { FormEvent, useEffect, useState } from 'react';
import { formatDateTimeBR, formatCurrency } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
}

interface BookingFormProps {
  psychologistId: string;
  onBookingComplete?: () => void;
}

export default function BookingForm({ psychologistId, onBookingComplete }: BookingFormProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Carrega serviços ao abrir o formulário
  useEffect(() => {
    fetchServices();
  }, [psychologistId]);

  const fetchServices = async () => {
    try {
      const response = await fetch(`/api/services?psychologist_id=${psychologistId}`);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        setServices(data.data);
        // Seleciona automaticamente o primeiro (e único) serviço
        setSelectedService(data.data[0].id);
      }
    } catch {
      console.error('Erro ao carregar serviços');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: selectedService,
          patient_name: patientName,
          patient_email: patientEmail,
          patient_phone: patientPhone,
          start_time: new Date(`${selectedDate}T${selectedTime}`).toISOString(),
          notes,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Erro ao agendar');
        return;
      }

      setSuccess(true);
      onBookingComplete?.();

      // Limpa o formulário
      setPatientName('');
      setPatientEmail('');
      setPatientPhone('');
      setSelectedDate('');
      setSelectedTime('');
      setNotes('');
    } catch (err) {
      setError('Erro ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  const selectedServiceData = services.find((s) => s.id === selectedService);

  if (success) {
    return (
      <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-green-700 mb-4">✅ Agendamento Confirmado!</h2>
        <p className="text-gray-700 mb-2">
          Enviamos um email de confirmação para <strong>{patientEmail}</strong>
        </p>
        <p className="text-gray-700 mb-4">
          Verifique seu email para confirmar o agendamento.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Fazer outro agendamento
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Agendar Consulta</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Serviço</label>
        {selectedServiceData ? (
          <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3">
            <p className="font-bold text-blue-900">{selectedServiceData.name}</p>
            <p className="text-sm text-gray-600">Duração: {selectedServiceData.duration} minutos</p>
            <p className="text-sm text-blue-700 font-bold">Valor: {formatCurrency(selectedServiceData.price)}</p>
            {selectedServiceData.description && (
              <p className="text-sm text-gray-600 mt-2">{selectedServiceData.description}</p>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-3">Carregando serviços...</div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Nome</label>
        <input
          type="text"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Seu nome completo"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Email</label>
        <input
          type="email"
          value={patientEmail}
          onChange={(e) => setPatientEmail(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="seu@email.com"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Telefone</label>
        <input
          type="tel"
          value={patientPhone}
          onChange={(e) => setPatientPhone(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="(11) 99999-9999"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Data</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Horário</label>
        <input
          type="time"
          value={selectedTime}
          onChange={(e) => setSelectedTime(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 font-bold mb-2">Observações (opcional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Algo que gostaria de relatar?"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !selectedService}
        className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? 'Agendando...' : 'Confirmar Agendamento'}
      </button>
    </form>
  );
}
