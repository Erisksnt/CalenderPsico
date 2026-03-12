// app/(psychologist)/appointments/page.tsx
// Página de agendamentos do psicólogo

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
  notes?: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('SCHEDULED');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/appointments?status=${selectedStatus}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setAppointments(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchAppointments();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Agendamentos</h1>

      <div className="mb-6 flex gap-2">
        {['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setSelectedStatus(status);
              setLoading(true);
              fetchAppointments();
            }}
            className={`px-4 py-2 rounded font-bold transition ${
              selectedStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {getStatusName(status)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {appointments.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            Nenhum agendamento com status "{getStatusName(selectedStatus)}"
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold">Paciente</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Serviço</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Data/Hora</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Ação</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold">{appointment.patient.name}</p>
                        <p className="text-sm text-gray-600">{appointment.patient.email}</p>
                        <p className="text-sm text-gray-600">{appointment.patient.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p>{appointment.service.name}</p>
                      <p className="text-sm text-gray-600">{appointment.service.duration}min</p>
                    </td>
                    <td className="px-6 py-4">
                      {formatDateTimeBR(appointment.start_time)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded text-sm font-bold ${
                          appointment.status === 'SCHEDULED'
                            ? 'bg-green-100 text-green-700'
                            : appointment.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {getStatusName(appointment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={appointment.status}
                        onChange={(e) =>
                          handleUpdateStatus(appointment.id, e.target.value)
                        }
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="SCHEDULED">Agendado</option>
                        <option value="COMPLETED">Concluído</option>
                        <option value="CANCELLED">Cancelado</option>
                        <option value="NO_SHOW">Não compareceu</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
