// components/psychologist/PsychologistDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { formatDateTimeBR, getStatusName } from '@/lib/utils';
import Link from 'next/link';

interface PsychologistProfile {
  id: string;
  name: string;
  bio?: string;
  specialties: string[];
  registration_number: string;
  phone?: string;
}

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

interface TimeBlock {
  id: string;
  start_time: string;
  end_time: string;
  reason: string;
}

export default function PsychologistDashboard() {
  const [profile, setProfile] = useState<PsychologistProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'agenda' | 'bloqueios'>('overview');
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // ⚡ Carregar tudo em paralelo
      await Promise.all([fetchProfile(), fetchAppointments(), fetchTimeBlocks()]);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) return;

      // ✅ Rota CORRETA: /api/psychologist/profile (singular) que já otimizamos
      const response = await fetch('/api/psychologist/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      throw error; // Propagar erro para o Promise.all
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // ⚡ FILTRO CORRETO - buscar apenas agendamentos do psicólogo
      const response = await fetch('/api/appointments?role=psychologist', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setAppointments(data.data || []);

        const newStats = {
          total: data.data?.length || 0,
          scheduled: data.data?.filter((a: any) => a.status === 'SCHEDULED').length || 0,
          completed: data.data?.filter((a: any) => a.status === 'COMPLETED').length || 0,
          cancelled: data.data?.filter((a: any) => a.status === 'CANCELLED').length || 0,
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      throw error;
    }
  };

  const fetchTimeBlocks = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // ✅ Rota já otimizada
      const response = await fetch('/api/psychologists/time-blocks', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setTimeBlocks(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar bloqueios:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadDashboardData}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const scheduledAppointments = appointments
    .filter((a) => a.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return (
    <div className="py-8">
      {/* Perfil Header */}
      {profile && (
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
              <p className="text-blue-100 mb-3">{profile.bio || 'Psicólogo profissional'}</p>
              <div className="flex gap-4 text-sm">
                <span className="bg-blue-500 px-3 py-1 rounded">CRP: {profile.registration_number}</span>
                {profile.phone && <span className="bg-blue-500 px-3 py-1 rounded">{profile.phone}</span>}
              </div>
              {profile.specialties && profile.specialties.length > 0 && (
                <div className="mt-4">
                  <p className="text-blue-100 text-sm mb-2">Especialidades:</p>
                  <div className="flex gap-2 flex-wrap">
                    {profile.specialties.map((spec, idx) => (
                      <span key={idx} className="bg-blue-500 px-3 py-1 rounded text-sm">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link href="/psychologist/profile">
              <button className="bg-white text-blue-600 px-6 py-2 rounded font-bold hover:bg-blue-50 transition">
                Editar Perfil
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b bg-white p-4 rounded-lg shadow">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-2 font-bold border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Resumo
        </button>
        <button
          onClick={() => setActiveTab('agenda')}
          className={`px-6 py-2 font-bold border-b-2 transition ${
            activeTab === 'agenda'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Agenda ({stats.scheduled})
        </button>
        <button
          onClick={() => setActiveTab('bloqueios')}
          className={`px-6 py-2 font-bold border-b-2 transition ${
            activeTab === 'bloqueios'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Datas Bloqueadas ({timeBlocks.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-blue-800 font-bold text-sm mb-2 uppercase tracking-wider">Total</p>
              <p className="text-4xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="text-green-800 font-bold text-sm mb-2 uppercase tracking-wider">Agendadas</p>
              <p className="text-4xl font-bold text-green-600">{stats.scheduled}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <p className="text-purple-800 font-bold text-sm mb-2 uppercase tracking-wider">Concluídas</p>
              <p className="text-4xl font-bold text-purple-600">{stats.completed}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-800 font-bold text-sm mb-2 uppercase tracking-wider">Canceladas</p>
              <p className="text-4xl font-bold text-red-600">{stats.cancelled}</p>
            </div>
          </div>
        </>
      )}

      {/* Agenda Tab */}
      {activeTab === 'agenda' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">Próximas Consultas</h2>
          </div>
          {scheduledAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Paciente</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Serviço</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Data/Hora</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Contato</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledAppointments.map((apt) => (
                    <tr key={apt.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-gray-800">{apt.patient.name}</td>
                      <td className="px-6 py-4 text-gray-700">{apt.service.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatDateTimeBR(apt.start_time)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{apt.patient.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-600 mb-4">Nenhuma consulta agendada</p>
              <Link href="/psychologist/availability">
                <button className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 font-bold">
                  Gerenciar Disponibilidade
                </button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Bloqueios Tab */}
      {activeTab === 'bloqueios' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Datas Bloqueadas</h2>
            <Link href="/psychologist/availability">
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold">
                + Bloquear Data
              </button>
            </Link>
          </div>
          {timeBlocks.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {timeBlocks.map((block) => (
                <div key={block.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-800">{block.reason}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDateTimeBR(block.start_time)} até {formatDateTimeBR(block.end_time)}
                      </p>
                    </div>
                    <button className="text-red-600 hover:text-red-700 font-bold text-sm">
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-600">
              <p>Nenhuma data bloqueada</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}