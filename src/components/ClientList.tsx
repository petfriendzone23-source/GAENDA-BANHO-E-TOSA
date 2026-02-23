import React from 'react';
import { Search, Plus, Phone, Mail, Dog, MoreHorizontal, MapPin } from 'lucide-react';
import { AppData, Client } from '../types';
import { ClientDetails } from './ClientDetails';

interface ClientListProps {
  data: AppData;
}

export const ClientList: React.FC<ClientListProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);

  const filteredClients = data.clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phones.some(p => p.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Clientes</h2>
          <p className="text-slate-500 mt-1">Gerencie sua base de clientes e seus pets.</p>
        </div>
        <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
          <Plus size={20} />
          Adicionar Cliente
        </button>
      </header>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar por nome ou telefone..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-100 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => {
            const clientPets = data.pets[client.id] || [];
            return (
              <div 
                key={client.id} 
                onClick={() => setSelectedClient(client)}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`} alt={client.name} className="rounded-2xl" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{client.name}</h4>
                      <div className="space-y-1 mt-1">
                        {client.phones.map((phone, i) => (
                          <div key={i} className="flex items-center gap-2 text-slate-500 text-xs">
                            <Phone size={12} />
                            <span>{phone}</span>
                          </div>
                        ))}
                        {client.addresses.map((address, i) => (
                          <div key={i} className="flex items-center gap-2 text-slate-500 text-xs">
                            <MapPin size={12} />
                            <span>{address}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
                    <MoreHorizontal size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pets</p>
                  {clientPets.map(pet => (
                    <div key={pet.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Dog size={18} className="text-indigo-500" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{pet.name}</p>
                          <p className="text-[10px] text-slate-500">{pet.breed} • {pet.size}</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-500 font-medium">
                        {data.appointments.filter(a => a.petId === pet.id).length} visitas
                      </span>
                    </div>
                  ))}
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

      {selectedClient && (
        <ClientDetails 
          client={selectedClient} 
          data={data} 
          onClose={() => setSelectedClient(null)} 
        />
      )}
    </div>
  );
};
