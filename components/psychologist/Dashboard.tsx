// components/psychologist/Dashboard.tsx
// Dashboard principal do psicólogo

'use client';

import { useEffect, useState } from 'react';
import { formatDateTimeBR, getStatusName } from '@/lib/utils';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  patient: {
    name: string;
    email: string;
    phone: string;
  };
  service: {
    name: string;
    duration: number;
  };
}

export default function Dashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/appointments', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setAppointments(data.data);

        // Calcula estatísticas
        const newStats = {
          total: data.data.length,
          scheduled: data.data.filter((a: any) => a.status === 'SCHEDULED').length,
          completed: data.data.filter((a: any) => a.status === 'COMPLETED').length,
          cancelled: data.data.filter((a: any) => a.status === 'CANCELLED').length,
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="container mx-auto px-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <p className="text-blue-800 font-bold text-sm">Total de Agendamentos</p>
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <p className="text-green-800 font-bold text-sm">Agendados</p>
          <p className="text-3xl font-bold text-green-600">{stats.scheduled}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-yellow-800 font-bold text-sm">Concluídos</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.completed}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800 font-bold text-sm">Cancelados</p>
          <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
        </div>
      </div>

      {/* Próximos agendamentos */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">Próximos Agendamentos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Paciente</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Serviço</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Data/Hora</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Ação</th>
              </tr>
            </thead>
            <tbody>
              {appointments.filter((a) => a.status === 'SCHEDULED').length > 0 ? (
                appointments
                  .filter((a) => a.status === 'SCHEDULED')
                  .sort(
                    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
                  )
                  .map((appointment) => (
                    <tr key={appointment.id} className="border-b border-gray-200">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold">{appointment.patient.name}</p>
                          <p className="text-sm text-gray-600">{appointment.patient.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{appointment.service.name}</td>
                      <td className="px-6 py-4">
                        {formatDateTimeBR(appointment.start_time)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm">
                          {getStatusName(appointment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-blue-600 hover:text-blue-700 font-bold text-sm">
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                    Nenhum agendamento programado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
