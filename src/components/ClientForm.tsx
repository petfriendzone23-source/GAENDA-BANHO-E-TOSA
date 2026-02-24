import React from 'react';
import { X, Save, User, Dog, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { Client, Pet } from '../types';

interface ClientFormProps {
  onSave: (client: Client, pets: Pet[]) => void;
  onClose: () => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ onSave, onClose }) => {
  const [clientName, setClientName] = React.useState('');
  const [clientPhones, setClientPhones] = React.useState<string[]>(['']);
  const [clientAddresses, setClientAddresses] = React.useState<string[]>(['']);
  const [newClientPets, setNewClientPets] = React.useState<{ name: string, breed: string, size: Pet['size'] }[]>([{ name: '', breed: '', size: 'Médio' }]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const clientId = Math.random().toString(36).substr(2, 9);
    const createdPets: Pet[] = newClientPets.map(p => ({
      id: Math.random().toString(36).substr(2, 9),
      name: p.name,
      breed: p.breed,
      size: p.size
    }));
    
    const newClient: Client = { 
      id: clientId, 
      name: clientName, 
      phones: clientPhones.filter(p => p.trim() !== ''), 
      addresses: clientAddresses.filter(a => a.trim() !== '') 
    };

    onSave(newClient, createdPets);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
          <div>
            <h2 className="text-xl font-bold">Novo Cadastro de Cliente</h2>
            <p className="text-indigo-100 text-sm">Cadastre o dono e seus pets no sistema.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-bold mb-4">
              <User size={20} />
              <h3>Informações do Cliente</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Nome do Dono</label>
                <input required value={clientName} onChange={e => setClientName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: João Silva" />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Telefones</label>
                  <button 
                    type="button" 
                    onClick={() => setClientPhones([...clientPhones, ''])}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Plus size={14} /> Adicionar Telefone
                  </button>
                </div>
                {clientPhones.map((phone, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      required={idx === 0}
                      value={phone} 
                      onChange={e => {
                        const next = [...clientPhones];
                        next[idx] = e.target.value;
                        setClientPhones(next);
                      }} 
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      placeholder="(11) 99999-9999" 
                    />
                    {clientPhones.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => setClientPhones(clientPhones.filter((_, i) => i !== idx))}
                        className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Endereços</label>
                  <button 
                    type="button" 
                    onClick={() => setClientAddresses([...clientAddresses, ''])}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Plus size={14} /> Adicionar Endereço
                  </button>
                </div>
                {clientAddresses.map((address, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      required={idx === 0}
                      value={address} 
                      onChange={e => {
                        const next = [...clientAddresses];
                        next[idx] = e.target.value;
                        setClientAddresses(next);
                      }} 
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      placeholder="Rua, Número, Bairro, Cidade" 
                    />
                    {clientAddresses.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => setClientAddresses(clientAddresses.filter((_, i) => i !== idx))}
                        className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Pets do Cliente</label>
                  <button 
                    type="button" 
                    onClick={() => setNewClientPets([...newClientPets, { name: '', breed: '', size: 'Médio' }])}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Plus size={14} /> Adicionar Pet
                  </button>
                </div>
                
                <div className="space-y-6">
                  {newClientPets.map((pet, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 relative space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <Dog size={16} />
                          </div>
                          <span className="font-bold text-slate-900 text-sm">Pet #{idx + 1}</span>
                        </div>
                        {newClientPets.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => {
                              setNewClientPets(newClientPets.filter((_, i) => i !== idx));
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Nome</label>
                          <input 
                            required 
                            value={pet.name} 
                            onChange={e => {
                              const next = [...newClientPets];
                              next[idx].name = e.target.value;
                              setNewClientPets(next);
                            }} 
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                            placeholder="Ex: Rex" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Raça</label>
                          <input 
                            required 
                            value={pet.breed} 
                            onChange={e => {
                              const next = [...newClientPets];
                              next[idx].breed = e.target.value;
                              setNewClientPets(next);
                            }} 
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                            placeholder="Ex: Poodle" 
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Porte</label>
                          <select 
                            value={pet.size} 
                            onChange={e => {
                              const next = [...newClientPets];
                              next[idx].size = e.target.value as any;
                              setNewClientPets(next);
                            }} 
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                          >
                            <option>Pequeno</option>
                            <option>Médio</option>
                            <option>Grande</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </form>

        <footer className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
            <Save size={20} />
            Cadastrar Cliente
          </button>
        </footer>
      </motion.div>
    </div>
  );
};
