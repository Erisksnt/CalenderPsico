// components/patient/PatientDashboard.tsx
// Dashboard principal do paciente com seus agendamentos

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

  useEffect(() => {
    fetchAppointments();
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      if (!token) return;

      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      if (data.success) {
        setUserName(data.data.name);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/appointments/my', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAppointments(data.data || []);
        
        // Conta agendamentos futuros
        const now = new Date();
        const upcoming = (data.data || []).filter((apt: any) => {
          return new Date(apt.start_time) > now && apt.status !== 'CANCELLED';
        });
        setUpcomingCount(upcoming.length);
      }
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-gray-600 text-sm font-semibold">PRÓXIMAS CONSULTAS</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{upcomingCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
          <p className="text-gray-600 text-sm font-semibold">TOTAL DE AGENDAMENTOS</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{appointments.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
          <Link href="/patient/schedule" className="block">
            <button className="w-full bg-purple-600 text-white py-3 rounded hover:bg-purple-700 transition font-bold">
              + AGENDAR NOVA CONSULTA
            </button>
          </Link>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Seus Agendamentos</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Carregando agendamentos...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <p className="text-lg mb-4">Você ainda não tem nenhum agendamento</p>
            <Link href="/patient/schedule">
              <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
                Agendar Agora
              </button>
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">
                      {appointment.psychologist.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {appointment.service.name} • {appointment.service.duration} minutos
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      appointment.status === 'SCHEDULED'
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {getStatusName(appointment.status)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                  <div>
                    <p className="font-semibold">Data/Hora</p>
                    <p>{formatDateTimeBR(appointment.start_time)}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Valor</p>
                    <p className="text-green-600 font-bold">
                      R$ {appointment.service.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                {appointment.notes && (
                  <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                    <p className="font-semibold text-blue-900">Notas:</p>
                    <p className="text-blue-800">{appointment.notes}</p>
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
