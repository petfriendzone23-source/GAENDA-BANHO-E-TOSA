import React, { useState } from 'react';
import { AppData } from '../types';
import { Users, Calendar, Box, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths, addMonths, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PerformanceProps {
  data: AppData;
}

export const Performance: React.FC<PerformanceProps> = ({ data }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Group packages by their first appointment date
  const packageInstances = new Map<string, Date>();
  
  data.appointments.forEach(app => {
    if (app.packageId) {
      const commandKey = app.packageInstanceId || `${app.clientId}-${app.petId}-${app.packageId}`;
      const appDate = parseISO(app.date);
      
      if (!packageInstances.has(commandKey)) {
        packageInstances.set(commandKey, appDate);
      } else {
        const existingDate = packageInstances.get(commandKey)!;
        if (appDate.getTime() < existingDate.getTime()) {
          packageInstances.set(commandKey, appDate);
        }
      }
    }
  });

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  // 1. Packages started in the selected month
  let packagesStartedInMonth = 0;
  packageInstances.forEach(startDate => {
    if (isWithinInterval(startDate, { start: monthStart, end: monthEnd })) {
      packagesStartedInMonth++;
    }
  });

  // 2. Single services (avulsos) in the selected month
  const singleServicesThisMonth = data.appointments.filter(app => {
    if (app.packageId) return false;
    const appDate = parseISO(app.date);
    return isWithinInterval(appDate, { start: monthStart, end: monthEnd });
  }).length;

  // 3. New clients registered in the selected month
  const newClients = data.clients.filter(client => {
    if (!client.createdAt) return false;
    const createdAt = parseISO(client.createdAt);
    return isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
  }).length;

  const stats = [
    {
      label: 'Pacotes Agendados',
      value: packagesStartedInMonth,
      icon: Box,
      color: 'bg-purple-500',
      description: 'Pacotes que iniciaram este mês'
    },
    {
      label: 'Serviços Avulsos',
      value: singleServicesThisMonth,
      icon: Calendar,
      color: 'bg-emerald-500',
      description: 'Atendimentos fora de pacotes no mês'
    },
    {
      label: 'Novos Clientes',
      value: newClients,
      icon: Users,
      color: 'bg-blue-500',
      description: 'Clientes cadastrados este mês'
    }
  ];

  // Calculate chart data for the last 6 months
  const chartInterval = {
    start: subMonths(new Date(), 5),
    end: new Date()
  };

  const monthsInInterval = eachMonthOfInterval(chartInterval);

  const chartData = monthsInInterval.map(month => {
    const mStart = startOfMonth(month);
    const mEnd = endOfMonth(month);
    
    let pkgsStarted = 0;
    packageInstances.forEach(startDate => {
      if (isWithinInterval(startDate, { start: mStart, end: mEnd })) {
        pkgsStarted++;
      }
    });

    const sngServices = data.appointments.filter(app => {
      if (app.packageId) return false;
      const appDate = parseISO(app.date);
      return isWithinInterval(appDate, { start: mStart, end: mEnd });
    }).length;

    const nClients = data.clients.filter(client => {
      if (!client.createdAt) return false;
      const createdAt = parseISO(client.createdAt);
      return isWithinInterval(createdAt, { start: mStart, end: mEnd });
    }).length;

    return {
      name: format(month, 'MMM', { locale: ptBR }),
      fullDate: format(month, 'MMMM yyyy', { locale: ptBR }),
      pacotes: pkgsStarted,
      avulsos: sngServices,
      clientes: nClients
    };
  });

  const handlePrevMonth = () => setSelectedDate(subMonths(selectedDate, 1));
  const handleNextMonth = () => setSelectedDate(addMonths(selectedDate, 1));

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Performance</h2>
          <p className="text-slate-500 mt-1">Acompanhe as métricas e o crescimento do seu negócio.</p>
        </div>

        <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
          <button 
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-600"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="px-4 py-2 min-w-[160px] text-center">
            <span className="font-bold text-slate-900 capitalize">
              {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
            </span>
          </div>
          <button 
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-600"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg shadow-opacity-20`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
              </div>
            </div>
            <p className="text-sm text-slate-500">{stat.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Métricas por Mês</h3>
            <p className="text-sm text-slate-500">Histórico de pacotes, serviços e clientes nos últimos 6 meses</p>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                dy={10}
                className="capitalize"
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-xl space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">{payload[0].payload.fullDate}</p>
                        <p className="text-sm font-bold text-purple-600">
                          Pacotes Iniciados: {payload.find(p => p.dataKey === 'pacotes')?.value}
                        </p>
                        <p className="text-sm font-bold text-emerald-600">
                          Serviços Avulsos: {payload.find(p => p.dataKey === 'avulsos')?.value}
                        </p>
                        <p className="text-sm font-bold text-blue-600">
                          Novos Clientes: {payload.find(p => p.dataKey === 'clientes')?.value}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="pacotes" name="Pacotes Iniciados" fill="#a855f7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avulsos" name="Serviços Avulsos" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="clientes" name="Novos Clientes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
