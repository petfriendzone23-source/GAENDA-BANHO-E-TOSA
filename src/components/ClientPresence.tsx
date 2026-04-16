import React, { useState, useMemo } from 'react';
import { AppData, Client, Appointment } from '../types';
import { differenceInDays, differenceInWeeks, differenceInMonths, parseISO, isBefore, isToday } from 'date-fns';
import { MessageCircle, Clock, User, ChevronLeft, ChevronRight, Activity } from 'lucide-react';

interface ClientPresenceProps {
  data: AppData;
}

interface ProcessedClient {
  client: Client;
  lastAppointment: Appointment | null;
  daysSince: number;
  weeksSince: number;
  monthsSince: number;
}

export const ClientPresence: React.FC<ClientPresenceProps> = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const processedClients = useMemo(() => {
    const today = new Date();

    const result: ProcessedClient[] = data.clients.map(client => {
      // Find past or today's appointments for this client
      const pastAppointments = data.appointments
        .filter(a => a.clientId === client.id && (isBefore(parseISO(a.date), today) || isToday(parseISO(a.date))))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const lastAppointment = pastAppointments.length > 0 ? pastAppointments[0] : null;

      let daysSince = 0;
      let weeksSince = 0;
      let monthsSince = 0;

      if (lastAppointment) {
        const lastAppDate = parseISO(lastAppointment.date);
        daysSince = differenceInDays(today, lastAppDate);
        weeksSince = differenceInWeeks(today, lastAppDate);
        monthsSince = differenceInMonths(today, lastAppDate);
      }

      return {
        client,
        lastAppointment,
        daysSince,
        weeksSince,
        monthsSince
      };
    });

    // Sort by longest time since last visit (those with past appointments first, then daysSince)
    // Clients with no appointments are placed at the end
    result.sort((a, b) => {
      if (!a.lastAppointment && !b.lastAppointment) return 0;
      if (!a.lastAppointment) return 1;
      if (!b.lastAppointment) return -1;
      return b.daysSince - a.daysSince;
    });

    return result;
  }, [data.clients, data.appointments]);

  const totalPages = Math.ceil(processedClients.length / itemsPerPage);
  const paginatedClients = processedClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openWhatsApp = (client: Client, petName: string = '', weeks: number, months: number) => {
    const phone = client.phones[0]?.replace(/\D/g, '');
    if (!phone) {
      alert("Este cliente não possui um número de telefone cadastrado.");
      return;
    }
    
    let timeText = '';
    if (months > 0) {
      timeText = `${months} ${months === 1 ? 'mês' : 'meses'}`;
    } else if (weeks > 0) {
      timeText = `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    } else {
      timeText = 'alguns dias';
    }

    const message = `Olá, ${client.name}! Tudo bem? Notamos que faz ${timeText} desde a última visita do(a) ${petName ? petName : 'seu pet'} e estamos com saudades! Gostaria de agendar um novo horário?`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
          <Activity size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Presença do Cliente</h1>
          <p className="text-slate-500">Acompanhe há quanto tempo seus clientes não visitam o petshop.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 font-semibold text-slate-600">Cliente</th>
                <th className="p-4 font-semibold text-slate-600">Última Visita</th>
                <th className="p-4 font-semibold text-slate-600">Tempo Ausente</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedClients.map(({ client, lastAppointment, weeksSince, monthsSince, daysSince }, idx) => {
                const latestPetId = lastAppointment?.petId;
                const petName = latestPetId ? data.pets[client.id]?.find(p => p.id === latestPetId)?.name : data.pets[client.id]?.[0]?.name;

                return (
                  <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{client.name}</p>
                          <p className="text-xs text-slate-500">{client.phones[0]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {lastAppointment ? (
                        <div>
                          <p className="font-medium text-slate-700">
                            {new Date(lastAppointment.date).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-slate-500">Pet: {petName || 'N/A'}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">Sem visitas</p>
                      )}
                    </td>
                    <td className="p-4">
                      {lastAppointment ? (
                        <div className="flex items-center gap-2">
                          <Clock size={16} className={monthsSince >= 2 ? "text-rose-500" : monthsSince >= 1 ? "text-amber-500" : "text-emerald-500"} />
                          <div>
                            <span className="font-bold text-slate-700">
                              {monthsSince > 0 ? `${monthsSince} ${monthsSince === 1 ? 'mês' : 'meses'}` : `${weeksSince} ${weeksSince === 1 ? 'semana' : 'semanas'}`}
                            </span>
                            {monthsSince > 0 && weeksSince % 4 > 0 && (
                              <span className="text-sm text-slate-500 ml-1">e {weeksSince % 4} {weeksSince % 4 === 1 ? 'sem.' : 'sems.'}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {lastAppointment && (
                        <button
                          onClick={() => openWhatsApp(client, petName || '', weeksSince, monthsSince)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#25D366]/10 text-[#075E54] hover:bg-[#25D366]/20 font-bold rounded-xl transition-colors"
                        >
                          <MessageCircle size={18} />
                          <span className="hidden sm:inline">Mensagem</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {paginatedClients.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-sm text-slate-500">
              Página <span className="font-bold text-slate-700">{currentPage}</span> de <span className="font-bold text-slate-700">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                title="Página Anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                title="Próxima Página"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
