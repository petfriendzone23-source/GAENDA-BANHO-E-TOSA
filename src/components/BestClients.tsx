import React from 'react';
import { Trophy, DollarSign, Dog, User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { subMonths, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { AppData } from '../types';
import { cn } from '../utils/cn';

interface BestClientsProps {
  data: AppData;
}

type Period = 'all' | '6months' | '12months' | 'custom';

export const BestClients: React.FC<BestClientsProps> = ({ data }) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [period, setPeriod] = React.useState<Period>('all');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  const ITEMS_PER_PAGE = 10;

  const filteredRevenue = React.useMemo(() => {
    let dateRange: { start: Date; end: Date } | null = null;

    if (period === '6months') {
      dateRange = { start: subMonths(new Date(), 6), end: new Date() };
    } else if (period === '12months') {
      dateRange = { start: subMonths(new Date(), 12), end: new Date() };
    } else if (period === 'custom' && startDate && endDate) {
      dateRange = { start: startOfDay(parseISO(startDate)), end: endOfDay(parseISO(endDate)) };
    }

    const clients = data.clients.map(client => {
      const totalPaid = data.appointments
        .filter(app => {
          if (app.clientId !== client.id || app.status !== 'Concluído') return false;
          if (!dateRange) return true;
          const appDate = parseISO(app.date);
          return isWithinInterval(appDate, dateRange);
        })
        .reduce((acc, curr) => acc + curr.price - (curr.discount || 0), 0);
      
      const pets = data.pets[client.id] || [];
      const petNames = pets.map(p => p.name).join(', ');

      return {
        ...client,
        totalPaid,
        petNames
      };
    })
    .filter(c => c.totalPaid > 0)
    .sort((a, b) => b.totalPaid - a.totalPaid);

    return clients;
  }, [data, period, startDate, endDate]);

  const totalPages = Math.ceil(filteredRevenue.length / ITEMS_PER_PAGE);
  const paginatedClients = filteredRevenue.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [period, startDate, endDate]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Melhores Clientes</h2>
          <p className="text-slate-500 mt-1">Ranking de clientes por valor total investido em serviços concluídos.</p>
        </div>
      </header>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-500" />
              Filtrar por Período
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="w-full p-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600 font-medium"
            >
              <option value="all">Todo o período</option>
              <option value="6months">Últimos 6 meses</option>
              <option value="12months">Últimos 12 meses</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {period === 'custom' && (
            <>
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Início</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600 font-medium"
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fim</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600 font-medium"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-50">
          {paginatedClients.length > 0 ? (
            paginatedClients.map((client, index) => {
              const rank = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
              return (
                <div key={client.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm",
                      rank === 1 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"
                    )}>
                      {rank}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <User size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">{client.name}</h4>
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <Dog size={14} className="text-indigo-400" />
                          <span>{client.petNames || 'Sem pet cadastrado'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pago</p>
                      <div className="flex items-center gap-1.5 text-emerald-600 font-black text-xl">
                        <DollarSign size={18} />
                        <span>{client.totalPaid.toFixed(2)}</span>
                      </div>
                    </div>
                    {rank === 1 && (
                      <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                        <Trophy size={24} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-20 text-center">
              <p className="text-slate-400 font-medium">Nenhum dado de faturamento disponível para este período.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500 font-medium">
              Página <span className="text-slate-900 font-bold">{currentPage}</span> de <span className="text-slate-900 font-bold">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
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
