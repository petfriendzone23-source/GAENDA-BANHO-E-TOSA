import React, { useState } from 'react';
import { AppData } from '../types';
import { Users, Calendar, Box, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths, addMonths, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PerformanceProps {
  data: AppData;
}

export const Performance: React.FC<PerformanceProps> = ({ data }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Calculate chart data for the last 6 months
  const chartInterval = {
    start: subMonths(new Date(), 5),
    end: new Date()
  };

  const monthsInInterval = eachMonthOfInterval(chartInterval);

  const chartData = monthsInInterval.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const count = data.appointments.filter(app => {
      const appDate = parseISO(app.date);
      return isWithinInterval(appDate, { start: monthStart, end: monthEnd });
    }).length;

    return {
      name: format(month, 'MMM', { locale: ptBR }),
      fullDate: format(month, 'MMMM yyyy', { locale: ptBR }),
      count
    };
  });

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const newClients = data.clients.filter(client => {
    if (!client.createdAt) return false;
    const createdAt = parseISO(client.createdAt);
    return isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
  });

  const monthAppointments = data.appointments.filter(app => {
    const appDate = parseISO(app.date);
    return isWithinInterval(appDate, { start: monthStart, end: monthEnd });
  });

  // Count unique package instances in the month
  const monthPackages = monthAppointments.reduce((acc, app) => {
    if (app.packageId) {
      const commandKey = app.packageInstanceId || `${app.clientId}-${app.petId}-${app.packageId}`;
      acc.add(commandKey);
    }
    return acc;
  }, new Set<string>());

  const stats = [
    {
      label: 'Novos Clientes',
      value: newClients.length,
      icon: Users,
      color: 'bg-blue-500',
      description: 'Clientes cadastrados este mês'
    },
    {
      label: 'Atendimentos',
      value: monthAppointments.length,
      icon: Calendar,
      color: 'bg-emerald-500',
      description: 'Total de agendamentos no mês'
    },
    {
      label: 'Pacotes Ativos',
      value: monthPackages.size,
      icon: Box,
      color: 'bg-purple-500',
      description: 'Pacotes com agendamentos este mês'
    }
  ];

  const handlePrevMonth = () => setSelectedDate(subMonths(selectedDate, 1));
  const handleNextMonth = () => setSelectedDate(addMonths(selectedDate, 1));

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Performance</h2>
          <p className="text-slate-500 mt-1">Acompanhe o crescimento do seu negócio.</p>
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
            <h3 className="text-xl font-bold text-slate-900">Atendimentos por Mês</h3>
            <p className="text-sm text-slate-500">Volume de agendamentos nos últimos 6 meses</p>
          </div>
        </div>

        <div className="h-[300px] w-full">
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
                      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">{payload[0].payload.fullDate}</p>
                        <p className="text-lg font-black text-slate-900">{payload[0].value} Atendimentos</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="count" 
                radius={[6, 6, 0, 0]} 
                barSize={40}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === chartData.length - 1 ? '#4f46e5' : '#e2e8f0'} 
                    className="transition-all duration-300"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
