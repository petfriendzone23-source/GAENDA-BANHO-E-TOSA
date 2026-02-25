import React, { useState } from 'react';
import { AppData, Appointment, Package, Client, Pet } from '../types';
import { Edit2, Trash2, Box, CheckCircle } from 'lucide-react';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PackageDetails } from './PackageDetails';

interface PackageCommandListProps {
  data: AppData;
  onEditAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
  onClosePackageCommand: (appointments: Appointment[]) => void;
  onDeletePackageCommand: (appointments: Appointment[]) => void;
}

export const PackageCommandList: React.FC<PackageCommandListProps> = ({ 
  data, 
  onEditAppointment, 
  onDeleteAppointment, 
  onClosePackageCommand,
  onDeletePackageCommand
}) => {
  const [selectedCommand, setSelectedCommand] = useState<{
    client: Client;
    pet: Pet;
    package: Package;
    appointments: Appointment[];
  } | null>(null);

  // Group appointments by package instance
  const packageCommands = data.appointments.reduce((acc, app) => {
    if (app.packageId) {
      // A unique key for each package instance for a client's pet
      const commandKey = `${app.clientId}-${app.petId}-${app.packageId}`;
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
  }, {} as Record<string, { key: string; client: any; pet: any; package: Package | undefined; appointments: Appointment[] }>);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Comanda de Pacotes</h2>
        <p className="text-slate-500 mt-1">Gerencie os pacotes de serviços agendados.</p>
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
              {Object.values(packageCommands).map(command => {
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
