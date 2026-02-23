import React from 'react';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { AppData, Appointment } from '../types';
import { cn } from '../utils/cn';

interface DashboardProps {
  data: AppData;
  onNewAppointment: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onNewAppointment }) => {
  const todayAppointments = data.appointments.filter(a => isToday(parseISO(a.date)));
  const completedToday = todayAppointments.filter(a => a.status === 'Concluído').length;
  const pendingToday = todayAppointments.filter(a => a.status === 'Agendado').length;
  
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
            <h3 className="text-xl font-bold text-slate-900">Próximos Agendamentos</h3>
            <button className="text-indigo-600 text-sm font-semibold hover:underline">Ver todos</button>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {todayAppointments.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {todayAppointments.slice(0, 5).map((app) => {
                  const client = data.clients.find(c => c.id === app.clientId);
                  const pet = data.pets[app.clientId]?.find(p => p.id === app.petId);
                  return (
                    <div key={app.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                          {pet?.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{pet?.name} <span className="text-slate-400 font-normal">({pet?.breed})</span></p>
                          <p className="text-sm text-slate-500">{client?.name} • {(app.services || []).join(', ')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{app.time}</p>
                        <span className={cn(
                          "text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full",
                          app.status === 'Agendado' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        )}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <AlertCircle size={32} />
                </div>
                <p className="text-slate-500 font-medium">Nenhum agendamento para hoje.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900">Serviços Populares</h3>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            {['Banho', 'Tosa', 'Banho e Tosa'].map((service) => (
              <div key={service} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-slate-700 font-medium">{service}</span>
                </div>
                <span className="text-slate-400 text-sm">
                  {data.appointments.filter(a => (a.services || []).includes(service as any)).length} agend.
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
