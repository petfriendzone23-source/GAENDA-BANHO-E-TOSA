import React from 'react';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, TrendingUp, CheckCircle2, AlertCircle, Edit2, Scissors, Box, Dog } from 'lucide-react';
import { motion } from 'motion/react';
import { AppData, Appointment, Client } from '../types';
import { cn } from '../utils/cn';
import { ClientDetails } from './ClientDetails';

interface DashboardProps {
  data: AppData;
  onNewAppointment: () => void;
  onEditAppointment: (appointment: Appointment) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onNewAppointment, onEditAppointment }) => {
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);
  const todayAppointments = data.appointments.filter(a => isToday(parseISO(a.date)));
  const completedToday = todayAppointments.filter(a => a.status === 'Concluído').length;
  const pendingToday = todayAppointments.filter(a => a.status === 'Agendado').length;
  
  const todayPackages = todayAppointments.filter(a => !!a.packageId).length;
  const todayServices = todayAppointments.filter(a => !a.packageId).length;

  const nextAppointment = todayAppointments
    .filter(a => a.status === 'Agendado')
    .sort((a, b) => {
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      if (timeA[0] !== timeB[0]) return timeA[0] - timeB[0];
      return timeA[1] - timeB[1];
    })[0];

  const nextClient = nextAppointment ? data.clients.find(c => c.id === nextAppointment.clientId) : null;
  const nextPet = nextAppointment ? data.pets[nextAppointment.clientId]?.find(p => p.id === nextAppointment.petId) : null;

  const stats = [
    { label: 'Hoje', value: todayAppointments.length, icon: CalendarIcon, color: 'bg-blue-500' },
    { label: 'Concluídos', value: completedToday, icon: CheckCircle2, color: 'bg-emerald-500' },
    { label: 'Pendentes', value: pendingToday, icon: Clock, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Olá, Bem-vindo!</h2>
          <p className="text-slate-500 mt-1">Aqui está o que está acontecendo hoje, {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}.</p>
        </div>
        <button 
          onClick={onNewAppointment}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
        >
          <CalendarIcon size={20} />
          Novo Agendamento
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl text-white", stat.color)}>
                <stat.icon size={24} />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Resumo do Dia</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:border-indigo-200 transition-all">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Scissors size={32} />
              </div>
              <p className="text-slate-500 font-medium">Serviços Avulsos</p>
              <p className="text-4xl font-black text-slate-900 mt-2">{todayServices}</p>
              <p className="text-xs text-slate-400 mt-2">Agendados para hoje</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:border-amber-200 transition-all">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition-all">
                <Box size={32} />
              </div>
              <p className="text-slate-500 font-medium">Sessões de Pacotes</p>
              <p className="text-4xl font-black text-slate-900 mt-2">{todayPackages}</p>
              <p className="text-xs text-slate-400 mt-2">Agendados para hoje</p>
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-2xl font-bold mb-2">Total de Atendimentos</h4>
              <p className="text-indigo-100 mb-6">Você tem um total de {todayAppointments.length} compromissos hoje.</p>
              <div className="flex gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-1">Concluídos</p>
                  <p className="text-2xl font-bold">{completedToday}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-1">Pendentes</p>
                  <p className="text-2xl font-bold">{pendingToday}</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12">
              <CalendarIcon size={200} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900">Próximo Cliente</h3>
          {nextAppointment ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-3xl border-2 border-indigo-500 shadow-xl shadow-indigo-100 relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0">
                    {nextPet?.photoUrl ? (
                      <img src={nextPet.photoUrl} alt={nextPet.name} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <Dog size={32} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Cliente da Vez</p>
                    <h4 className="text-2xl font-black text-slate-900 truncate">{nextPet?.name}</h4>
                    <p className="text-slate-500 font-medium truncate">{nextClient?.name}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Horário</p>
                      <p className="font-bold text-slate-900">{nextAppointment.time}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm">
                      <Scissors size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Serviços</p>
                      <p className="font-bold text-slate-900">{(nextAppointment.services || []).join(', ')}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedAppointment(nextAppointment)}
                  className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                >
                  Ver Detalhes
                </button>
              </div>
              <div className="absolute -right-6 -top-6 text-indigo-50 opacity-[0.03] rotate-12 pointer-events-none">
                <Dog size={160} />
              </div>
            </motion.div>
          ) : (
            <div className="bg-white p-10 rounded-3xl border border-dashed border-slate-200 text-center">
              <p className="text-slate-400 font-medium">Nenhum agendamento pendente para hoje.</p>
            </div>
          )}
        </div>
      </div>

      {selectedAppointment && (
        <ClientDetails 
          client={data.clients.find(c => c.id === selectedAppointment.clientId)!} 
          appointment={selectedAppointment}
          data={data} 
          showHistory={false}
          onClose={() => setSelectedAppointment(null)} 
        />
      )}
    </div>
  );
};
