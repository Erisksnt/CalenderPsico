// app/(patient)/schedule/page.tsx
// Página de agendamento para pacientes

'use client';

import { useEffect, useState } from 'react';
import PatientDashboard from '@/components/patient/PatientDashboard';
import AvailabilityList from '@/components/patient/AvailabilityList';

export default function SchedulePage() {
  const [view, setView] = useState<'dashboard' | 'schedule'>('dashboard');

  return (
    <div className="py-8">
      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b">
        <button
          onClick={() => setView('dashboard')}
          className={`px-6 py-3 font-bold border-b-2 transition ${
            view === 'dashboard'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Meus Agendamentos
        </button>
        <button
          onClick={() => setView('schedule')}
          className={`px-6 py-3 font-bold border-b-2 transition ${
            view === 'schedule'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Agendar Consulta
        </button>
      </div>

      {/* Content */}
      {view === 'dashboard' ? <PatientDashboard /> : <AvailabilityList />}
    </div>
  );
}
