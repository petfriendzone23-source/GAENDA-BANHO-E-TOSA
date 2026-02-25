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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Edit2 } from 'lucide-react';
import { AppData, Appointment } from '../types';
import { cn } from '../utils/cn';
import { ClientDetails } from './ClientDetails';

interface CalendarViewProps {
  data: AppData;
  onEditAppointment: (appointment: Appointment) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ data, onEditAppointment }) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);

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
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 text-sm">{pet?.name}</p>
                        <p className="text-xs text-slate-500">{(app.services || []).join(', ')}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{client?.name}</p>
                      </div>
                      <button 
                        onClick={() => onEditAppointment(app)}
                        className="absolute top-2 right-2 p-1.5 bg-white shadow-sm border border-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 opacity-0 group-hover/item:opacity-100 transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
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
