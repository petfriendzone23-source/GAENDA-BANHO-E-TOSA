import React from 'react';
import { Trophy, DollarSign, Dog, User } from 'lucide-react';
import { AppData } from '../types';

interface BestClientsProps {
  data: AppData;
}

export const BestClients: React.FC<BestClientsProps> = ({ data }) => {
  const clientRevenue = data.clients.map(client => {
    const totalPaid = data.appointments
      .filter(app => app.clientId === client.id && app.status === 'Concluído')
      .reduce((acc, curr) => acc + curr.price, 0);
    
    const pets = data.pets[client.id] || [];
    const petNames = pets.map(p => p.name).join(', ');

    return {
      ...client,
      totalPaid,
      petNames
    };
  }).sort((a, b) => b.totalPaid - a.totalPaid);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Melhores Clientes</h2>
        <p className="text-slate-500 mt-1">Ranking de clientes por valor total investido em serviços concluídos.</p>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-50">
          {clientRevenue.length > 0 ? (
            clientRevenue.map((client, index) => (
              <div key={client.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-400 font-bold text-sm">
                    {index + 1}
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
                  {index === 0 && (
                    <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                      <Trophy size={24} />
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center">
              <p className="text-slate-400 font-medium">Nenhum dado de faturamento disponível.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
