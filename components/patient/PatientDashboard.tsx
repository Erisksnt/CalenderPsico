// components/patient/PatientDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { formatDateTimeBR, getStatusName } from '@/lib/utils';
import Link from 'next/link';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  service: {
    name: string;
    duration: number;
    price: number;
  };
  psychologist: {
    name: string;
    bio?: string;
  };
}

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ⚡ Carregar em paralelo para ser mais rápido
    Promise.all([fetchUserData(), fetchAppointments()])
      .catch(err => {
        console.error('Erro ao carregar dashboard:', err);
        setError('Erro ao carregar seus dados. Tente novamente.');
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchUserData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      if (!token || !userId) return;

      const response = await fetch(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      if (data.success) {
        setUserName(data.data.name);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      throw error;
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        return;
      }

      // ✅ CORREÇÃO: Usar a rota existente com filtro
      const response = await fetch(`/api/appointments?patient_id=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao carregar agendamentos');
      }
      
      setAppointments(data.data || []);
      
      // Conta agendamentos futuros
      const now = new Date();
      const upcoming = (data.data || []).filter((apt: any) => {
        return new Date(apt.start_time) > now && apt.status !== 'CANCELLED';
      });
      setUpcomingCount(upcoming.length);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="mb-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">
          Bem-vindo, {userName || 'Paciente'}!
        </h1>
        <p className="text-blue-700">Gerencie seus agendamentos e marque novas consultas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
          <p className="text-gray-600 text-sm font-semibold uppercase tracking-wider">
            Próximas consultas
          </p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{upcomingCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
          <p className="text-gray-600 text-sm font-semibold uppercase tracking-wider">
            Total de agendamentos
          </p>
          <p className="text-3xl font-bold text-green-600 mt-2">{appointments.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
          <Link href="/patient/schedule">
            <button className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-bold">
              + Agendar Consulta
            </button>
          </Link>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Seus Agendamentos</h2>
        </div>
        
        {appointments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg text-gray-600 mb-4">Você ainda não tem nenhum agendamento</p>
            <Link href="/patient/schedule">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-bold">
                Agendar Primeira Consulta
              </button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">
                      {appointment.psychologist.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {appointment.service.name} • {appointment.service.duration} minutos
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold self-start ${
                      appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : appointment.status === 'COMPLETED'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {getStatusName(appointment.status)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-700">Data e Horário</p>
                    <p className="text-gray-900">{formatDateTimeBR(appointment.start_time)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Valor</p>
                    <p className="text-green-600 font-bold">
                      R$ {appointment.service.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                {appointment.notes && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="font-semibold text-blue-900 mb-1">Observações:</p>
                    <p className="text-blue-800 text-sm leading-relaxed">{appointment.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}