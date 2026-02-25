import React from 'react';
import { Appointment, Client, Pet, Package } from '../types';
import { X, Calendar, CheckCircle, Clock, AlertCircle, Box } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../utils/cn';

interface PackageDetailsProps {
  packageInfo: {
    client: Client;
    pet: Pet;
    package: Package;
    appointments: Appointment[];
  };
  onClose: () => void;
}

export const PackageDetails: React.FC<PackageDetailsProps> = ({ packageInfo, onClose }) => {
  const { client, pet, package: pkg, appointments } = packageInfo;
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = parseISO(`${a.date}T${a.time}`);
    const dateB = parseISO(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  const completedCount = appointments.filter(a => a.status === 'Concluído').length;
  const totalCount = pkg?.sessions || appointments.length;
  const progress = (completedCount / totalCount) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <Box size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Nota de Serviço</h2>
              <p className="text-sm text-slate-500">Detalhes completos do pacote</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Cliente</p>
              <p className="font-bold text-slate-900">{client?.name}</p>
              <p className="text-sm text-slate-500">{client?.phones[0]}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Pet</p>
              <p className="font-bold text-slate-900">{pet?.name}</p>
              <p className="text-sm text-slate-500">{pet?.breed} • {pet?.size}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Pacote</p>
              <p className="font-bold text-indigo-600">{pkg?.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-600">{completedCount}/{totalCount}</span>
              </div>
            </div>
          </div>

          {/* Appointments List */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-slate-400" />
              Histórico de Sessões
            </h3>
            <div className="space-y-3">
              {sortedAppointments.map((app, index) => (
                <div 
                  key={app.id} 
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-all",
                    app.status === 'Concluído' ? "bg-emerald-50 border-emerald-100" : 
                    app.status === 'Cancelado' ? "bg-rose-50 border-rose-100 opacity-75" :
                    "bg-white border-slate-100"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                      app.status === 'Concluído' ? "bg-emerald-200 text-emerald-700" : 
                      app.status === 'Cancelado' ? "bg-rose-200 text-rose-700" :
                      "bg-slate-100 text-slate-500"
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        {format(parseISO(app.date), "dd 'de' MMMM", { locale: ptBR })}
                        <span className="text-slate-400 font-normal mx-2">•</span>
                        {app.time}
                      </p>
                      <p className="text-xs text-slate-500">{(app.services || []).join(', ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 text-sm">R$ {app.price.toFixed(2)}</span>
                    <div className={cn(
                      "px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1",
                      app.status === 'Concluído' ? "bg-emerald-100 text-emerald-700" : 
                      app.status === 'Cancelado' ? "bg-rose-100 text-rose-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {app.status === 'Concluído' && <CheckCircle size={12} />}
                      {app.status === 'Agendado' && <Clock size={12} />}
                      {app.status === 'Cancelado' && <AlertCircle size={12} />}
                      {app.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
