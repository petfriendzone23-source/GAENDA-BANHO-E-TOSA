import React from 'react';
import { X, Save, User, Dog, Scissors, Calendar, Clock, DollarSign, Plus, Box } from 'lucide-react';
import { motion } from 'motion/react';
import { AppData, Appointment, Client, Pet, Package } from '../types';
import { cn } from '../utils/cn';

interface AppointmentFormProps {
  data: AppData;
  onSave: (appointments: Appointment[], client?: Client, pets?: Pet[]) => void;
  onClose: () => void;
  appointment?: Appointment;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({ data, onSave, onClose, appointment }) => {
  const [step, setStep] = React.useState(1);
  const [isNewClient, setIsNewClient] = React.useState(false);
  
  // Form State
  const [clientId, setClientId] = React.useState(appointment?.clientId || '');
  const [petId, setPetId] = React.useState(appointment?.petId || '');
  const [sessions, setSessions] = React.useState(1);
  const [sessionDates, setSessionDates] = React.useState<string[]>([appointment?.date || new Date().toISOString().split('T')[0]]);
  const [sessionTimes, setSessionTimes] = React.useState<string[]>([appointment?.time || '09:00']);
  const [sessionServices, setSessionServices] = React.useState<string[][]>([appointment?.services || []]);
  const [price, setPrice] = React.useState(appointment?.price || 40);
  const [notes, setNotes] = React.useState(appointment?.notes || '');

  const togglePackage = (pkg: Package) => {
    const pkgServiceNames = pkg.serviceIds.map(sid => data.services.find(s => s.id === sid)?.name).filter(Boolean) as string[];
    
    // Check if all services of the package are already selected in the first session (simplified check)
    const allSelected = pkgServiceNames.every(name => sessionServices[0]?.includes(name));
    
    if (allSelected) {
      setSessions(1);
      setSessionDates([sessionDates[0]]);
      setSessionTimes([sessionTimes[0]]);
      setSessionServices([[]]);
    } else {
      setSessions(pkg.sessions);
      
      const newDates = [...sessionDates];
      const newTimes = [...sessionTimes];
      const newServices = [...sessionServices];
      
      while (newDates.length < pkg.sessions) {
        newDates.push(new Date().toISOString().split('T')[0]);
        newTimes.push('09:00');
        newServices.push([]);
      }
      
      // Initialize all sessions with the package services (user can then prune them)
      const initializedServices = newServices.slice(0, pkg.sessions).map(() => [...pkgServiceNames]);
      
      setSessionDates(newDates.slice(0, pkg.sessions));
      setSessionTimes(newTimes.slice(0, pkg.sessions));
      setSessionServices(initializedServices);
      setPrice(pkg.price);
    }
  };

  const toggleServiceInSession = (sessionIdx: number, serviceName: string) => {
    const nextSessionServices = [...sessionServices];
    const currentServices = nextSessionServices[sessionIdx] || [];
    
    if (currentServices.includes(serviceName)) {
      nextSessionServices[sessionIdx] = currentServices.filter(s => s !== serviceName);
    } else {
      nextSessionServices[sessionIdx] = [...currentServices, serviceName];
    }
    
    setSessionServices(nextSessionServices);
    
    // Recalculate price if not a fixed package price (simplified: always recalculate if custom)
    // If it was a package, the user might have changed it, so we should probably recalculate based on all services across all sessions
    const totalSum = nextSessionServices.reduce((acc, services) => {
      return acc + services.reduce((sAcc, sName) => {
        return sAcc + (data.services.find(sv => sv.name === sName)?.price || 0);
      }, 0);
    }, 0);
    setPrice(totalSum);
  };

  // New Client State
  const [clientName, setClientName] = React.useState('');
  const [clientPhones, setClientPhones] = React.useState<string[]>(['']);
  const [clientAddresses, setClientAddresses] = React.useState<string[]>(['']);
  const [newClientPets, setNewClientPets] = React.useState<{ name: string, breed: string, size: Pet['size'] }[]>([{ name: '', breed: '', size: 'Médio' }]);
  const [selectedPetIndex, setSelectedPetIndex] = React.useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalClientId = clientId;
    let finalPetId = petId;
    let newClient: Client | undefined;
    let createdPets: Pet[] | undefined;

    if (isNewClient) {
      finalClientId = Math.random().toString(36).substr(2, 9);
      createdPets = newClientPets.map(p => ({
        id: Math.random().toString(36).substr(2, 9),
        name: p.name,
        breed: p.breed,
        size: p.size
      }));
      
      finalPetId = createdPets[selectedPetIndex].id;
      
      newClient = { 
        id: finalClientId, 
        name: clientName, 
        phones: clientPhones.filter(p => p.trim() !== ''), 
        addresses: clientAddresses.filter(a => a.trim() !== '') 
      };
    }

    const appointments: Appointment[] = sessionDates.map((d, idx) => ({
      id: idx === 0 && appointment ? appointment.id : Math.random().toString(36).substr(2, 9),
      clientId: finalClientId,
      petId: finalPetId,
      services: sessionServices[idx] || [],
      date: d,
      time: sessionTimes[idx],
      status: appointment?.status || 'Agendado',
      price: idx === 0 ? price : 0, 
      notes,
    }));

    onSave(appointments, newClient, createdPets);
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
            <h2 className="text-xl font-bold">{appointment ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
            <p className="text-indigo-100 text-sm">{appointment ? 'Atualize os dados do agendamento.' : 'Preencha os dados para reservar o horário.'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Step 1: Client & Pet */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-bold mb-4">
              <User size={20} />
              <h3>Informações do Cliente e Pet</h3>
            </div>

            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setIsNewClient(false)}
                className={`flex-1 py-3 rounded-xl border-2 transition-all font-medium ${!isNewClient ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-500'}`}
              >
                Cliente Existente
              </button>
              <button
                type="button"
                onClick={() => setIsNewClient(true)}
                className={`flex-1 py-3 rounded-xl border-2 transition-all font-medium ${isNewClient ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-500'}`}
              >
                Novo Cliente
              </button>
            </div>

            {isNewClient ? (
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
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                name="selectedPet" 
                                checked={selectedPetIndex === idx} 
                                onChange={() => setSelectedPetIndex(idx)}
                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-xs font-medium text-slate-500">Agendar para este pet</span>
                            </label>
                            {newClientPets.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => {
                                  setNewClientPets(newClientPets.filter((_, i) => i !== idx));
                                  if (selectedPetIndex === idx) setSelectedPetIndex(0);
                                  else if (selectedPetIndex > idx) setSelectedPetIndex(selectedPetIndex - 1);
                                }}
                                className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Selecionar Cliente</label>
                  <select required value={clientId} onChange={e => setClientId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Selecione...</option>
                    {data.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Selecionar Pet</label>
                  <select required value={petId} onChange={e => setPetId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" disabled={!clientId}>
                    <option value="">Selecione...</option>
                    {clientId && data.pets[clientId]?.map(p => <option key={p.id} value={p.id}>{p.name} ({p.breed})</option>)}
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* Step 2: Service & Time */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-bold mb-4">
              <Scissors size={20} />
              <h3>Serviços e Horário</h3>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Pacotes Disponíveis</label>
              <div className="flex flex-wrap gap-2">
                {data.packages.map(pkg => {
                  const pkgServiceNames = pkg.serviceIds.map(sid => data.services.find(s => s.id === sid)?.name).filter(Boolean) as string[];
                  const isSelected = pkgServiceNames.every(name => sessionServices[0]?.includes(name));
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => togglePackage(pkg)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all flex items-center gap-2",
                        isSelected 
                          ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-100" 
                          : "bg-white border-slate-100 text-slate-500 hover:border-amber-200"
                      )}
                    >
                      <Box size={16} />
                      {pkg.name} (R$ {pkg.price})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Sessões e Serviços ({sessions} sessões)</label>
                {sessions > 1 && (
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                    Pacote Multi-sessão
                  </span>
                )}
              </div>
              
              <div className="space-y-6">
                {sessionDates.map((d, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                      <Calendar size={16} />
                      Sessão {idx + 1}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Data</label>
                        <input 
                          type="date" 
                          value={d} 
                          onChange={e => {
                            const next = [...sessionDates];
                            next[idx] = e.target.value;
                            setSessionDates(next);
                          }} 
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Horário</label>
                        <input 
                          type="time" 
                          value={sessionTimes[idx]} 
                          onChange={e => {
                            const next = [...sessionTimes];
                            next[idx] = e.target.value;
                            setSessionTimes(next);
                          }} 
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Serviços desta Sessão</label>
                      <div className="flex flex-wrap gap-2">
                        {data.services.map(s => {
                          const isSelected = sessionServices[idx]?.includes(s.name);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => toggleServiceInSession(idx, s.name)}
                              className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold border-2 transition-all",
                                isSelected 
                                  ? "bg-indigo-600 border-indigo-600 text-white" 
                                  : "bg-white border-slate-200 text-slate-500 hover:border-indigo-200"
                              )}
                            >
                              {s.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Preço Total do Pacote (R$)</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Observações</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]" placeholder="Ex: Alérgico a shampoo de coco..." />
            </div>
          </section>
        </form>

        <footer className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
            <Save size={20} />
            Salvar Agendamento
          </button>
        </footer>
      </motion.div>
    </div>
  );
};
