import React from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Filter, MoreVertical, Check, X, Clock, Edit2 } from 'lucide-react';
import { AppData, Appointment, Client } from '../types';
import { cn } from '../utils/cn';
import { ClientDetails } from './ClientDetails';

interface AppointmentListProps {
  data: AppData;
  onUpdateStatus: (id: string, status: Appointment['status']) => void;
  onEditAppointment: (appointment: Appointment) => void;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({ data, onUpdateStatus, onEditAppointment }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<Appointment['status'] | 'Todos'>('Todos');
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);

  const filteredAppointments = data.appointments
    .filter(app => {
      const client = data.clients.find(c => c.id === app.clientId);
      const pet = data.pets[app.clientId]?.find(p => p.id === app.petId);
      const matchesSearch = 
        client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.services || []).some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'Todos' || app.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Agendamentos</h2>
          <p className="text-slate-500 mt-1">Gerencie todos os horários marcados.</p>
        </div>
      </header>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, pet ou serviço..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-400 ml-2" />
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600 font-medium"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Agendado">Agendado</option>
            <option value="Concluído">Concluído</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Pet / Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Serviço</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Data / Hora</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Preço</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((app) => {
                  const client = data.clients.find(c => c.id === app.clientId);
                  const pet = data.pets[app.clientId]?.find(p => p.id === app.petId);
                  
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div 
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => client && setSelectedClient(client)}
                        >
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            {pet?.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{pet?.name}</p>
                            <p className="text-xs text-slate-500">{client?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-700">{(app.services || []).join(', ')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-slate-900">{format(parseISO(app.date), "dd/MM/yyyy")}</p>
                          <p className="text-slate-500">{app.time}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-900">R$ {app.price.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full",
                          app.status === 'Agendado' ? "bg-amber-100 text-amber-700" : 
                          app.status === 'Concluído' ? "bg-emerald-100 text-emerald-700" : 
                          "bg-rose-100 text-rose-700"
                        )}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => onEditAppointment(app)}
                            className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          {app.status === 'Agendado' && (
                            <>
                              <button 
                                onClick={() => onUpdateStatus(app.id, 'Concluído')}
                                title="Concluir"
                                className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                              >
                                <Check size={18} />
                              </button>
                              <button 
                                onClick={() => onUpdateStatus(app.id, 'Cancelado')}
                                title="Cancelar"
                                className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                              >
                                <X size={18} />
                              </button>
                            </>
                          )}
                          <button className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors">
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Nenhum agendamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedClient && (
        <ClientDetails 
          client={selectedClient} 
          data={data} 
          onClose={() => setSelectedClient(null)} 
        />
      )}
    </div>
  );
};
