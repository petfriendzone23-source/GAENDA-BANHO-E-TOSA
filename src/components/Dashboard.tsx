import React from 'react';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, TrendingUp, CheckCircle2, AlertCircle, Edit2, Scissors, Box } from 'lucide-react';
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

  const totalRevenue = data.appointments
    .filter(a => a.status === 'Concluído')
    .reduce((acc, curr) => acc + curr.price, 0);

  const stats = [
    { label: 'Hoje', value: todayAppointments.length, icon: CalendarIcon, color: 'bg-blue-500' },
    { label: 'Concluídos', value: completedToday, icon: CheckCircle2, color: 'bg-emerald-500' },
    { label: 'Pendentes', value: pendingToday, icon: Clock, color: 'bg-amber-500' },
    { label: 'Faturamento', value: `R$ ${totalRevenue.toFixed(2)}`, icon: TrendingUp, color: 'bg-indigo-500' },
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <h3 className="text-xl font-bold text-slate-900">Serviços Populares</h3>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            {data.services.slice(0, 5).map((service) => (
              <div key={service.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-slate-700 font-medium">{service.name}</span>
                </div>
                <span className="text-slate-400 text-sm">
                  {data.appointments.filter(a => (a.services || []).includes(service.name)).length} agend.
                </span>
              </div>
            ))}
          </div>
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
