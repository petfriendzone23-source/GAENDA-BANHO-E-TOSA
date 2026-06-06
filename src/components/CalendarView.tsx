import React from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Edit2, Share2, ArrowUp, ArrowDown } from 'lucide-react';
import { AppData, Appointment } from '../types';
import { cn } from '../utils/cn';
import { ClientDetails } from './ClientDetails';
import { AVAILABLE_ICONS } from './ServiceList';

interface CalendarViewProps {
  data: AppData;
  onEditAppointment: (appointment: Appointment) => void;
  adminUid?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ data, onEditAppointment, adminUid }) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);

  const getClientFrequency = (clientId: string) => {
    const todayEnd = new Date();
    const history = data.appointments
      .filter(a => a.clientId === clientId && parseISO(a.date) <= todayEnd)
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    if (history.length <= 1) return { level: 'red' as const, trend: 'none' as const };

    let totalGap = 0;
    for (let i = 1; i < history.length; i++) {
        totalGap += (parseISO(history[i].date).getTime() - parseISO(history[i-1].date).getTime()) / (1000 * 60 * 60 * 24);
    }
    const avgGap = totalGap / (history.length - 1);

    let level: 'red' | 'yellow' | 'green' = 'red';
    if (avgGap <= 15) level = 'green';
    else if (avgGap <= 31) level = 'yellow';
    
    let trend: 'up' | 'down' | 'none' = 'none';
    if (history.length >= 3) {
      const recentGap = (parseISO(history[history.length-1].date).getTime() - parseISO(history[history.length-2].date).getTime()) / (1000 * 60 * 60 * 24);
      if (recentGap > avgGap * 1.5) trend = 'down';
      else if (recentGap < avgGap * 0.6) trend = 'up';
    }

    return { level, trend };
  };

  const FrequencyIndicator = ({ frequency }: { frequency: ReturnType<typeof getClientFrequency> }) => {
    if (!frequency) return null;
    
    return (
      <div className="flex flex-col items-center gap-0.5 ml-2" title={
        frequency.level === 'green' ? 'Cliente frequente' :
        frequency.level === 'yellow' ? 'Frequência média' :
        'Baixa frequência'
      }>
        <div className="flex flex-col gap-[2px] bg-slate-200/50 p-[3px] rounded-full border border-slate-200/50">
          <div className={cn("w-1.5 h-1.5 rounded-full transition-colors", frequency.level === 'red' ? 'bg-rose-500 shadow-[0_0_2px_rgba(244,63,94,0.8)]' : 'bg-slate-300/50')} />
          <div className={cn("w-1.5 h-1.5 rounded-full transition-colors", frequency.level === 'yellow' ? 'bg-amber-400 shadow-[0_0_2px_rgba(251,191,36,0.8)]' : 'bg-slate-300/50')} />
          <div className={cn("w-1.5 h-1.5 rounded-full transition-colors", frequency.level === 'green' ? 'bg-emerald-500 shadow-[0_0_2px_rgba(16,185,129,0.8)]' : 'bg-slate-300/50')} />
        </div>
        {frequency.trend === 'up' && <ArrowUp size={10} className="text-emerald-500 shrink-0" strokeWidth={4} />}
        {frequency.trend === 'down' && <ArrowDown size={10} className="text-rose-500 shrink-0" strokeWidth={4} />}
      </div>
    );
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const appointmentsForSelectedDate = data.appointments.filter(app => 
    isSameDay(parseISO(app.date), selectedDate)
  ).sort((a, b) => a.time.localeCompare(b.time));

  const handleShareChoiceLink = (appointment: Appointment) => {
    if (!adminUid) return;
    const baseUrl = window.location.origin + window.location.pathname;
    const link = `${baseUrl}?choice=${appointment.id}&uid=${adminUid}`;
    
    navigator.clipboard.writeText(link).then(() => {
      alert('Link de escolha copiado para a área de transferência!');
    }).catch(err => {
      console.error('Erro ao copiar link:', err);
      alert('Erro ao copiar link. Tente novamente.');
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Agenda</h2>
          <p className="text-slate-500 mt-1">Visualize a disponibilidade e compromissos mensais.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-slate-50">
            <h3 className="text-xl font-bold text-slate-900 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={prevMonth}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={nextMonth}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-50">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dayAppointments = data.appointments.filter(app => isSameDay(parseISO(app.date), day));
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "h-24 md:h-32 p-2 border-r border-b border-slate-50 text-left transition-all relative group",
                    !isCurrentMonth && "bg-slate-50/50 text-slate-300",
                    isSelected && "bg-indigo-50/50 ring-2 ring-inset ring-indigo-500 z-10",
                    isCurrentMonth && "hover:bg-slate-50"
                  )}
                >
                  <span className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold",
                    isToday && !isSelected && "bg-indigo-600 text-white",
                    isSelected && "text-indigo-600",
                    !isToday && !isSelected && "text-slate-700"
                  )}>
                    {format(day, 'd')}
                  </span>

                  <div className="mt-2 space-y-1 overflow-hidden">
                    {dayAppointments.slice(0, 2).map(app => {
                      const firstService = data.services.find(s => s.name === (app.services || [])[0]);
                      return (
                        <div 
                          key={app.id} 
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium truncate text-white"
                          style={{ backgroundColor: firstService?.color || '#64748b' }}
                        >
                          {app.time} {data.pets[app.clientId]?.find(p => p.id === app.petId)?.name}
                        </div>
                      );
                    })}
                    {dayAppointments.length > 2 && (
                      <div className="text-[10px] text-slate-400 font-medium pl-1">
                        + {dayAppointments.length - 2} mais
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CalendarIcon size={20} className="text-indigo-600" />
              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </h3>

            {appointmentsForSelectedDate.length > 0 ? (
              <div className="space-y-4">
                {appointmentsForSelectedDate.map(app => {
                  const client = data.clients.find(c => c.id === app.clientId);
                  const pet = data.pets[app.clientId]?.find(p => p.id === app.petId);
                  return (
                    <div 
                      key={app.id} 
                      className={cn(
                        "flex gap-4 p-3 rounded-2xl border group/item relative cursor-pointer transition-colors",
                        app.packageId ? "bg-purple-50 border-purple-100 hover:border-purple-200" : "bg-slate-50 border-slate-100 hover:border-indigo-200"
                      )}
                      onClick={() => setSelectedAppointment(app)}
                    >
                      <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-slate-200 pr-4">
                        <span className="text-sm font-bold text-slate-900">{app.time}</span>
                        <Clock size={14} className="text-slate-400 mt-1" />
                      </div>
                      <div className="flex-1 flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{pet?.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {AVAILABLE_ICONS.map(availableIcon => {
                              const selectedServicesForThisIcon = (app.services || []).filter(s => {
                                const ds = data.services.find(d => d.name === s);
                                return (ds?.icon || 'Scissors') === availableIcon.id;
                              });
                              const isSelected = selectedServicesForThisIcon.length > 0;
                              const ds = isSelected ? data.services.find(d => d.name === selectedServicesForThisIcon[0]) : null;
                              const IconComp = availableIcon.icon;
                              return (
                                <div
                                  key={availableIcon.id}
                                  title={isSelected ? selectedServicesForThisIcon.join(', ') : availableIcon.label}
                                  className="flex items-center justify-center rounded border p-[4px] transition-all"
                                  style={{
                                    borderColor: isSelected ? (ds?.color || '#cbd5e1') : 'rgba(148, 163, 184, 0.2)',
                                    backgroundColor: isSelected ? `${ds?.color || '#cbd5e1'}20` : 'transparent',
                                    color: isSelected ? (ds?.color || '#cbd5e1') : '#cbd5e1'
                                  }}
                                >
                                  <IconComp size={14} strokeWidth={isSelected ? 2.5 : 1.5} />
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1.5">{client?.name}</p>
                        </div>
                        {client && <FrequencyIndicator frequency={getClientFrequency(client.id)} />}
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-all">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareChoiceLink(app);
                          }}
                          className="p-1.5 bg-white shadow-sm border border-slate-100 rounded-lg text-indigo-500 hover:text-indigo-700 transition-colors"
                          title="Compartilhar Link de Escolha"
                        >
                          <Share2 size={14} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditAppointment(app);
                          }}
                          className="p-1.5 bg-white shadow-sm border border-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-slate-400 text-sm">Nenhum agendamento para este dia.</p>
              </div>
            )}
          </div>

          <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100">
            <h4 className="font-bold mb-2">Dica de Disponibilidade</h4>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Os horários da manhã costumam ser os mais procurados. Tente oferecer descontos para agendamentos no meio da tarde para equilibrar sua agenda.
            </p>
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
