import React from 'react';
import { Search, Plus, Phone, Mail, Dog, MoreHorizontal, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppData, Client, Pet } from '../types';
import { cn } from '../utils/cn';
import { ClientDetails } from './ClientDetails';

interface ClientListProps {
  data: AppData;
  onUpdatePet?: (clientId: string, petId: string, updatedPet: Partial<Pet>) => void;
  onAddClient?: () => void;
  onEditClient?: (client: Client, pets: Pet[]) => void;
  onDeleteClient?: (clientId: string) => void;
}

const ITEMS_PER_PAGE = 12;

export const ClientList: React.FC<ClientListProps> = ({ data, onUpdatePet, onAddClient, onEditClient, onDeleteClient }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);

  const filteredClients = data.clients.filter(c => {
    const matchesClient = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phones.some(p => p.includes(searchTerm));
    
    const clientPets = data.pets[c.id] || [];
    const matchesPet = clientPets.some(pet => pet.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesClient || matchesPet;
  });

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Clientes</h2>
          <p className="text-slate-500 mt-1">Gerencie sua base de clientes e seus pets.</p>
        </div>
        <button 
          onClick={onAddClient}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Adicionar Cliente
        </button>
      </header>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar por nome do cliente, telefone ou nome do pet..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-100 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedClients.length > 0 ? (
          paginatedClients.map((client) => {
            const clientPets = data.pets[client.id] || [];
            return (
              <div 
                key={client.id} 
                onClick={() => setSelectedClient(client)}
                className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`} alt={client.name} className="rounded-full w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm truncate pr-2">{client.name}</h4>
                      <button className="p-1 text-slate-400 hover:bg-slate-50 rounded-lg shrink-0">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {client.phones[0] && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] truncate">
                          <Phone size={10} className="shrink-0" />
                          <span className="truncate">{client.phones[0]}</span>
                          {client.phones.length > 1 && <span className="text-slate-400 text-[9px] bg-slate-100 px-1 rounded">+{client.phones.length - 1}</span>}
                        </div>
                      )}
                      {client.addresses[0] && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] truncate">
                          <MapPin size={10} className="shrink-0" />
                          <span className="truncate">{client.addresses[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-slate-50">
                  <div className="flex flex-wrap gap-1.5">
                    {clientPets.map(pet => (
                      <div key={pet.id} className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50/50 text-indigo-700 rounded-md border border-indigo-100/50">
                        {pet.photoUrl ? (
                          <img src={pet.photoUrl} alt={pet.name} className="w-3 h-3 rounded-full object-cover shrink-0" />
                        ) : (
                          <Dog size={10} className="shrink-0" />
                        )}
                        <span className="text-[10px] font-semibold truncate max-w-[80px]">{pet.name}</span>
                      </div>
                    ))}
                    {clientPets.length === 0 && (
                      <span className="text-[10px] text-slate-400 italic">Sem pets cadastrados</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">Nenhum cliente encontrado.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="text-sm text-slate-500">
            Mostrando <span className="font-bold text-slate-900">{startIndex + 1}</span> a <span className="font-bold text-slate-900">{Math.min(startIndex + ITEMS_PER_PAGE, filteredClients.length)}</span> de <span className="font-bold text-slate-900">{filteredClients.length}</span> clientes
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "w-10 h-10 rounded-lg text-sm font-bold transition-all",
                    currentPage === page 
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                      : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {selectedClient && (
        <ClientDetails 
          client={selectedClient} 
          data={data} 
          onClose={() => setSelectedClient(null)} 
          onUpdatePet={onUpdatePet}
          onEdit={() => onEditClient?.(selectedClient, data.pets[selectedClient.id] || [])}
          onDeleteClient={() => {
            if (onDeleteClient) {
              onDeleteClient(selectedClient.id);
              setSelectedClient(null);
            }
          }}
        />
      )}
    </div>
  );
};
