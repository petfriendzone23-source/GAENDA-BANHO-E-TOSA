import React, { useState } from 'react';
import { AppData, Appointment, Package, Client, Pet } from '../types';
import { Edit2, Trash2, Box, CheckCircle, Search, SortAsc, Calendar as CalendarIcon } from 'lucide-react';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PackageDetails } from './PackageDetails';

interface PackageCommandListProps {
  data: AppData;
  onEditAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
  onClosePackageCommand: (appointments: Appointment[]) => void;
  onDeletePackageCommand: (appointments: Appointment[]) => void;
  onRenewPackage: (clientId: string, petId: string, packageId: string) => void;
}

interface PackageCommand {
  key: string;
  client: Client | undefined;
  pet: Pet | undefined;
  package: Package | undefined;
  appointments: Appointment[];
}

export const PackageCommandList: React.FC<PackageCommandListProps> = ({ 
  data, 
  onEditAppointment, 
  onDeleteAppointment, 
  onClosePackageCommand,
  onDeletePackageCommand,
  onRenewPackage
}) => {
  const [selectedCommand, setSelectedCommand] = useState<{
    client: Client;
    pet: Pet;
    package: Package;
    appointments: Appointment[];
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');

  // Group appointments by package instance
  const packageCommands = data.appointments.reduce((acc, app) => {
    if (app.packageId) {
      // Use packageInstanceId if available, otherwise fallback to a composite key for legacy data
      const commandKey = app.packageInstanceId || `${app.clientId}-${app.petId}-${app.packageId}`;
      if (!acc[commandKey]) {
        const pkg = data.packages.find(p => p.id === app.packageId);
        const client = data.clients.find(c => c.id === app.clientId);
        const pet = data.pets[app.clientId]?.find(p => p.id === app.petId);
        acc[commandKey] = {
          key: commandKey,
          client,
          pet,
          package: pkg,
          appointments: [],
        };
      }
      acc[commandKey].appointments.push(app);
    }
    return acc;
  }, {} as Record<string, PackageCommand>);

  // Filter and Sort
  const filteredAndSortedCommands = (Object.values(packageCommands) as PackageCommand[])
    .filter(command => {
      const searchLower = searchTerm.toLowerCase();
      return (
        command.client?.name.toLowerCase().includes(searchLower) ||
        command.pet?.name.toLowerCase().includes(searchLower) ||
        command.package?.name.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return (a.client?.name || '').localeCompare(b.client?.name || '');
      } else {
        // Sort by next appointment date
        const nextA = a.appointments
          .filter(app => app.status === 'Agendado')
          .sort((appA, appB) => {
            const dateA = parseISO(`${appA.date}T${appA.time}`);
            const dateB = parseISO(`${appB.date}T${appB.time}`);
            return dateA.getTime() - dateB.getTime();
          })[0];

        const nextB = b.appointments
          .filter(app => app.status === 'Agendado')
          .sort((appA, appB) => {
            const dateA = parseISO(`${appA.date}T${appA.time}`);
            const dateB = parseISO(`${appB.date}T${appB.time}`);
            return dateA.getTime() - dateB.getTime();
          })[0];

        if (!nextA) return 1;
        if (!nextB) return -1;

        const dateA = parseISO(`${nextA.date}T${nextA.time}`);
        const dateB = parseISO(`${nextB.date}T${nextB.time}`);
        return dateA.getTime() - dateB.getTime();
      }
    });

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Comanda de Pacotes</h2>
          <p className="text-slate-500 mt-1">Gerencie os pacotes de serviços agendados.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Pesquisar cliente ou pet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full sm:w-64"
            />
          </div>

          <div className="relative flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 gap-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
            <SortAsc size={18} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'date')}
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer pr-2"
            >
              <option value="date">Ordenar por Data</option>
              <option value="name">Ordem Alfabética</option>
            </select>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente / Pet</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Pacote</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Progresso</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Próximo Agendamento</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAndSortedCommands.map((command) => {
                const completedSessions = command.appointments.filter(a => a.status === 'Concluído').length;
                const totalSessions = command.package?.sessions || command.appointments.length;
                const isPackageCompleted = completedSessions === totalSessions;
                const nextAppointment = command.appointments
                  .filter(a => a.status === 'Agendado')
                  .sort((a, b) => {
                    const dateA = parseISO(`${a.date}T${a.time}`);
                    const dateB = parseISO(`${b.date}T${b.time}`);
                    return dateA.getTime() - dateB.getTime();
                  })[0];

                return (
                  <tr 
                    key={command.key} 
                    className={`transition-colors cursor-pointer ${isPackageCompleted ? 'bg-emerald-50' : 'hover:bg-slate-50/50'}`}
                    onClick={() => {
                      if (command.client && command.pet && command.package) {
                        setSelectedCommand({
                          client: command.client,
                          pet: command.pet,
                          package: command.package,
                          appointments: command.appointments
                        });
                      }
                    }}
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{command.client?.name}</p>
                      <p className="text-xs text-slate-500">{command.pet?.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Box size={16} className="text-purple-600" />
                        <span className="font-medium text-slate-800">{command.package?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${isPackageCompleted ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {completedSessions} / {totalSessions}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {nextAppointment ? 
                        `${format(parseISO(nextAppointment.date), 'dd/MM/yyyy', { locale: ptBR })} às ${nextAppointment.time}` :
                        <span className="text-slate-400">N/A</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {isPackageCompleted && command.client && command.pet && command.package && (
                          <button
                            onClick={() => onRenewPackage(command.client.id, command.pet.id, command.package.id)}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-1"
                            title="Renovar Pacote"
                          >
                            <Box size={14} />
                            RENOVAR
                          </button>
                        )}
                        <button
                          onClick={() => onClosePackageCommand(command.appointments)}
                          disabled={!isPackageCompleted}
                          className="p-2 bg-emerald-100 text-emerald-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-200 enabled:shadow-sm"
                          title="Fechar Comanda"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button 
                          onClick={() => nextAppointment && onEditAppointment(nextAppointment)}
                          disabled={!nextAppointment}
                          className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Editar Próximo Agendamento"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => onDeletePackageCommand(command.appointments)}
                          className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                          title="Excluir Comanda e Agendamentos"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCommand && (
        <PackageDetails 
          packageInfo={selectedCommand} 
          onClose={() => setSelectedCommand(null)} 
        />
      )}
    </div>
  );
};
