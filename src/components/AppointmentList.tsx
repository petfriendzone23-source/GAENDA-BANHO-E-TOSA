import React from 'react';
import { format, parseISO, isToday, isAfter, startOfDay, isSameDay, addDays, subDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Filter, MoreVertical, Check, X, Clock, Edit2, Calendar, Trash2, ChevronLeft, ChevronRight, MessageCircle, FileText, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { AppData, Appointment, Client, Pet } from '../types';
import { cn } from '../utils/cn';
import { ClientDetails } from './ClientDetails';
import { WhatsAppModal } from './WhatsAppModal';

interface AppointmentListProps {
  data: AppData;
  onUpdateStatus: (id: string, status: Appointment['status']) => void;
  onDeleteAppointment: (id: string) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onNewAppointmentAtTime?: (time: string, date: string) => void;
  onUpdatePet?: (clientId: string, petId: string, updatedPet: Partial<Pet>) => void;
  onOpenReport: (appointment: Appointment) => void;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({ 
  data, 
  onUpdateStatus, 
  onDeleteAppointment,
  onEditAppointment, 
  onNewAppointmentAtTime, 
  onUpdatePet, 
  onOpenReport
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<Appointment['status'] | 'Todos'>('Todos');
  const [dateFilter, setDateFilter] = React.useState<'Hoje' | 'Próximos' | 'Data Específica' | 'Todos'>('Hoje');
  const [viewType, setViewType] = React.useState<'Lista' | 'Grade'>('Grade');
  const [customDate, setCustomDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);
  const [whatsappAppointment, setWhatsappAppointment] = React.useState<Appointment | null>(null);

  const handlePrevDay = () => {
    const currentDate = dateFilter === 'Data Específica' ? parseISO(customDate) : new Date();
    const prevDay = subDays(currentDate, 1);
    setCustomDate(format(prevDay, 'yyyy-MM-dd'));
    setDateFilter('Data Específica');
  };

  const handleNextDay = () => {
    const currentDate = dateFilter === 'Data Específica' ? parseISO(customDate) : new Date();
    const nextDay = addDays(currentDate, 1);
    setCustomDate(format(nextDay, 'yyyy-MM-dd'));
    setDateFilter('Data Específica');
  };

  const filteredAppointments = data.appointments
    .filter(app => {
      const client = data.clients.find(c => c.id === app.clientId);
      const pet = data.pets[app.clientId]?.find(p => p.id === app.petId);
      const matchesSearch = 
        client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.services || []).some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'Todos' || app.status === statusFilter;
      
      const appDate = parseISO(app.date);
      const today = startOfDay(new Date());
      
      let matchesDate = true;
      if (dateFilter === 'Hoje') {
        matchesDate = isToday(appDate);
      } else if (dateFilter === 'Próximos') {
        matchesDate = isAfter(appDate, today) && !isToday(appDate);
      } else if (dateFilter === 'Data Específica') {
        matchesDate = isSameDay(appDate, parseISO(customDate));
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      if (timeA[0] !== timeB[0]) return timeA[0] - timeB[0];
      return timeA[1] - timeB[1];
    });

  const hours = React.useMemo(() => {
    const startHour = parseInt((data.companyInfo.workingHours?.start || '08:00').split(':')[0], 10);
    const endHour = parseInt((data.companyInfo.workingHours?.end || '18:00').split(':')[0], 10);
    const length = endHour - startHour + 1;
    
    return Array.from({ length: Math.max(0, length) }, (_, i) => {
      const h = i + startHour;
      return `${h.toString().padStart(2, '0')}:00`;
    });
  }, [data.companyInfo.workingHours]);

  const weekDays = React.useMemo(() => {
    const baseDate = dateFilter === 'Data Específica' ? parseISO(customDate) : new Date();
    const start = startOfWeek(baseDate, { weekStartsOn: 1 }); // Monday
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [customDate, dateFilter]);

  const handleDayClick = (date: Date) => {
    setCustomDate(format(date, 'yyyy-MM-dd'));
    setDateFilter('Data Específica');
  };

  const getPackageProgress = (appointment: Appointment) => {
    if (!appointment.packageId) return null;
    
    const pkg = data.packages.find(p => p.id === appointment.packageId);
    if (!pkg) return null;
    
    const totalSessions = pkg.sessions;
    
    // Get all appointments for this client+pet+package sorted by date
    const relatedAppointments = data.appointments.filter(a => 
      a.clientId === appointment.clientId && 
      a.petId === appointment.petId && 
      a.packageId === appointment.packageId
    ).sort((a, b) => {
       const dateA = new Date(`${a.date}T${a.time}`);
       const dateB = new Date(`${b.date}T${b.time}`);
       return dateA.getTime() - dateB.getTime();
    });
    
    const index = relatedAppointments.findIndex(a => a.id === appointment.id);
    if (index === -1) return null;
    
    const currentSessionNumber = (index % totalSessions) + 1;
    
    return `${currentSessionNumber}/${totalSessions}`;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Agendamentos</h2>
          <p className="text-slate-500 mt-1">Gerencie todos os horários marcados.</p>
        </div>
      </header>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, pet ou serviço..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl justify-center">
            <button 
              onClick={() => setViewType('Grade')}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all",
                viewType === 'Grade' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Grade
            </button>
            <button 
              onClick={() => setViewType('Lista')}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all",
                viewType === 'Lista' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Lista
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center bg-slate-50 rounded-xl p-1">
              <button 
                onClick={handlePrevDay}
                className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-indigo-600 transition-all shadow-sm hover:shadow"
                title="Dia Anterior"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-2 px-3 border-l border-r border-slate-200 mx-1">
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <div className="flex flex-col sm:flex-row gap-2">
                  <select 
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value as any)}
                    className="bg-transparent border-none py-1 focus:ring-0 outline-none text-slate-600 font-medium text-sm w-full min-w-[100px]"
                  >
                    <option value="Hoje">Hoje</option>
                    <option value="Próximos">Próximos Dias</option>
                    <option value="Data Específica">Data Específica</option>
                    <option value="Todos">Todos os Dias</option>
                  </select>
                  {dateFilter === 'Data Específica' && (
                    <input 
                      type="date"
                      value={customDate}
                      onChange={e => setCustomDate(e.target.value)}
                      className="bg-transparent border-none py-1 focus:ring-0 outline-none text-slate-600 font-medium text-sm w-full border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-2"
                    />
                  )}
                </div>
              </div>

              <button 
                onClick={handleNextDay}
                className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-indigo-600 transition-all shadow-sm hover:shadow"
                title="Próximo Dia"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-1">
            <Filter size={18} className="text-slate-400 shrink-0" />
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-transparent border-none py-2 focus:ring-0 outline-none text-slate-600 font-medium text-sm w-full"
            >
              <option value="Todos">Status</option>
              <option value="Agendado">Agendado</option>
              <option value="Concluído">Concluído</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto pb-2 sm:pb-0 gap-2 no-scrollbar">
        {weekDays.map((day) => {
          const isSelected = dateFilter === 'Data Específica' 
            ? isSameDay(day, parseISO(customDate))
            : isToday(day) && dateFilter === 'Hoje';
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              className={cn(
                "flex-1 min-w-[80px] flex flex-col items-center p-3 rounded-2xl border transition-all",
                isSelected 
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105 z-10" 
                  : "bg-white border-slate-100 text-slate-500 hover:border-indigo-200 hover:bg-slate-50"
              )}
            >
              <span className={cn(
                "text-[10px] uppercase font-black tracking-widest mb-1",
                isSelected ? "text-indigo-100" : "text-slate-400"
              )}>
                {format(day, 'eee', { locale: ptBR })}
              </span>
              <span className="text-lg font-bold">
                {format(day, 'dd')}
              </span>
              {isToday(day) && !isSelected && (
                <div className="w-1 h-1 bg-indigo-500 rounded-full mt-1" />
              )}
            </button>
          );
        })}
      </div>

      {viewType === 'Grade' ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 divide-y divide-slate-100">
            {hours.map(hour => {
              const hourAppointments = filteredAppointments.filter(app => app.time.startsWith(hour.split(':')[0]));
              return (
                <div key={hour} className="flex flex-col sm:flex-row min-h-[100px] group hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0">
                  <div className="w-full sm:w-24 flex sm:flex-col items-center justify-between sm:justify-start p-4 sm:pt-4 sm:border-r border-slate-100 bg-slate-50/50">
                    <span className="text-sm font-black text-slate-900">{hour}</span>
                    <Clock size={14} className="text-slate-300 sm:mt-1 hidden sm:block" />
                    <span className="sm:hidden text-xs text-slate-500 font-medium">{hourAppointments.length} agendamentos</span>
                  </div>
                  <div 
                    className="flex-1 p-4 flex flex-col sm:flex-row flex-wrap gap-4 cursor-pointer"
                    onClick={() => {
                      if (onNewAppointmentAtTime) {
                        const dateToUse = dateFilter === 'Data Específica' ? customDate : new Date().toISOString().split('T')[0];
                        onNewAppointmentAtTime(hour, dateToUse);
                      }
                    }}
                  >
                    {hourAppointments.length > 0 ? (
                      hourAppointments.map(app => {
                        const client = data.clients.find(c => c.id === app.clientId);
                        const pet = data.pets[app.clientId]?.find(p => p.id === app.petId);
                        const progress = getPackageProgress(app);

                        return (
                          <motion.div
                            layoutId={app.id}
                            key={app.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(app);
                            }}
                            className={cn(
                              "w-full sm:flex-1 sm:min-w-[250px] sm:max-w-[400px] p-4 rounded-2xl border-2 cursor-pointer transition-all relative group/card",
                              app.status === 'Concluído' ? "bg-emerald-50 border-emerald-100 hover:border-emerald-300" :
                              app.status === 'Cancelado' ? "bg-rose-50 border-rose-100 hover:border-rose-300" :
                              app.packageId ? "bg-purple-50 border-purple-100 hover:border-purple-300 shadow-sm hover:shadow-md" :
                              "bg-indigo-50 border-indigo-100 hover:border-indigo-300 shadow-sm hover:shadow-md"
                            )}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm overflow-hidden relative",
                                    app.status === 'Concluído' ? "bg-emerald-500" :
                                    app.status === 'Cancelado' ? "bg-rose-500" :
                                    app.packageId ? "bg-purple-600" :
                                    "bg-indigo-600"
                                  )}>
                                    {pet?.photoUrl ? (
                                      <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                                    ) : (
                                      pet?.name[0]
                                    )}
                                  </div>
                                  <div className={cn(
                                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm",
                                    app.status === 'Concluído' ? "bg-emerald-500" :
                                    app.status === 'Cancelado' ? "bg-rose-500" :
                                    "bg-amber-500"
                                  )} />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 leading-tight">{pet?.name}</p>
                                  <p className="text-[10px] text-slate-500 font-medium">{client?.name}</p>
                                </div>
                              </div>
                              <div className="text-right flex flex-col items-end gap-1">
                                <p className="text-xs font-black text-slate-900">{app.time}</p>
                                <div className="flex items-center gap-1">
                                  {progress && (
                                    <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-md border border-purple-200">
                                      {progress}
                                    </span>
                                  )}
                                  <span className={cn(
                                    "text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-md",
                                    app.status === 'Agendado' ? "bg-amber-100 text-amber-700" : 
                                    app.status === 'Concluído' ? "bg-emerald-100 text-emerald-700" : 
                                    "bg-rose-100 text-rose-700"
                                  )}>
                                    {app.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(app.services || []).map(s => {
                                const service = data.services.find(ds => ds.name === s);
                                return (
                                  <span 
                                    key={s} 
                                    className="text-[9px] text-white px-2 py-0.5 rounded-md border font-bold"
                                    style={{
                                      backgroundColor: service?.color || '#64748b',
                                      borderColor: service?.color ? `${service.color}B3` : '#cbd5e1'
                                    }}
                                  >
                                    {s}
                                  </span>
                                );
                              })}
                            </div>
                            <div className="absolute top-2 right-2 flex gap-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteAppointment(app.id);
                                }}
                                className="p-1.5 bg-white rounded-lg shadow-sm text-rose-400 hover:text-rose-600 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={14} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setWhatsappAppointment(app);
                                }}
                                className="p-1.5 bg-white rounded-lg shadow-sm text-green-500 hover:text-green-600 hover:bg-green-50 transition-colors"
                                title="Enviar WhatsApp"
                              >
                                <MessageCircle size={14} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateStatus(app.id, 'Concluído');
                                }}
                                className={cn(
                                  "p-1.5 bg-white rounded-lg shadow-sm transition-colors",
                                  app.status === 'Concluído' ? "text-emerald-300 cursor-not-allowed" : "text-emerald-600 hover:bg-emerald-50"
                                )}
                                disabled={app.status === 'Concluído'}
                                title="Concluir"
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateStatus(app.id, 'Agendado');
                                }}
                                className={cn(
                                  "p-1.5 bg-white rounded-lg shadow-sm transition-colors",
                                  app.status === 'Agendado' ? "text-amber-300 cursor-not-allowed" : "text-amber-600 hover:bg-amber-50"
                                )}
                                disabled={app.status === 'Agendado'}
                                title="Re-agendar"
                              >
                                <Clock size={14} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateStatus(app.id, 'Cancelado');
                                }}
                                className={cn(
                                  "p-1.5 bg-white rounded-lg shadow-sm transition-colors",
                                  app.status === 'Cancelado' ? "text-rose-300 cursor-not-allowed" : "text-rose-600 hover:bg-rose-50"
                                )}
                                disabled={app.status === 'Cancelado'}
                                title="Cancelar"
                              >
                                <X size={14} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenReport(app);
                                }}
                                className={cn(
                                  "p-1.5 bg-white rounded-lg shadow-sm transition-colors",
                                  app.report
                                    ? "text-green-500 hover:text-green-600 hover:bg-green-50"
                                    : "text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                )}
                                title={app.report ? "Visualizar Relatório" : "Criar Relatório de Serviço"}
                              >
                                {app.report ? <Eye size={14} /> : <FileText size={14} />}
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditAppointment(app);
                                }}
                                className="p-1.5 bg-white rounded-lg shadow-sm text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Editar"
                              >
                                <Edit2 size={14} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl opacity-20 hover:opacity-50 transition-opacity">
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
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
                  const progress = getPackageProgress(app);
                  
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div 
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => setSelectedAppointment(app)}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all relative",
                            app.packageId 
                              ? "bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white" 
                              : "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
                          )}>
                            {pet?.photoUrl ? (
                              <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              pet?.name[0]
                            )}
                          </div>
                          <div>
                            <p className={cn(
                              "font-bold transition-colors",
                              app.packageId ? "text-slate-900 group-hover:text-purple-600" : "text-slate-900 group-hover:text-indigo-600"
                            )}>{pet?.name}</p>
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
                        <div className="flex flex-col items-start gap-1">
                          <span className={cn(
                            "text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full",
                            app.status === 'Agendado' ? "bg-amber-100 text-amber-700" : 
                            app.status === 'Concluído' ? "bg-emerald-100 text-emerald-700" : 
                            "bg-rose-100 text-rose-700"
                          )}>
                            {app.status}
                          </span>
                          {progress && (
                            <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                              {progress}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => onOpenReport(app)}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              app.report 
                                ? "hover:bg-green-50 text-green-500 hover:text-green-600"
                                : "hover:bg-blue-50 text-slate-400 hover:text-blue-600"
                            )}
                            title={app.report ? "Visualizar Relatório" : "Criar Relatório de Serviço"}
                          >
                            {app.report ? <Eye size={18} /> : <FileText size={18} />}
                          </button>
                          <button 
                            onClick={() => setWhatsappAppointment(app)}
                            className="p-2 hover:bg-green-50 text-green-500 hover:text-green-600 rounded-lg transition-all"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle size={18} />
                          </button>
                          <button 
                            onClick={() => onEditAppointment(app)}
                            className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => onUpdateStatus(app.id, 'Concluído')}
                            title="Concluir"
                            disabled={app.status === 'Concluído'}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              app.status === 'Concluído' ? "text-emerald-200 cursor-not-allowed" : "hover:bg-emerald-50 text-emerald-600"
                            )}
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            onClick={() => onUpdateStatus(app.id, 'Agendado')}
                            title="Re-agendar"
                            disabled={app.status === 'Agendado'}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              app.status === 'Agendado' ? "text-amber-200 cursor-not-allowed" : "hover:bg-amber-50 text-amber-600"
                            )}
                          >
                            <Clock size={18} />
                          </button>
                          <button 
                            onClick={() => onUpdateStatus(app.id, 'Cancelado')}
                            title="Cancelar"
                            disabled={app.status === 'Cancelado'}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              app.status === 'Cancelado' ? "text-rose-200 cursor-not-allowed" : "hover:bg-rose-50 text-rose-600"
                            )}
                          >
                            <X size={18} />
                          </button>
                          <button 
                            onClick={() => onDeleteAppointment(app.id)}
                            title="Excluir"
                            className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
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

      )}

      {selectedAppointment && (
        <ClientDetails 
          client={data.clients.find(c => c.id === selectedAppointment.clientId)!} 
          appointment={selectedAppointment}
          data={data} 
          showHistory={false}
          onClose={() => setSelectedAppointment(null)} 
          onUpdatePet={onUpdatePet}
        />
      )}

      {whatsappAppointment && (
        <WhatsAppModal
          isOpen={!!whatsappAppointment}
          onClose={() => setWhatsappAppointment(null)}
          appointment={whatsappAppointment}
          data={data}
        />
      )}
    </div>
  );
};
