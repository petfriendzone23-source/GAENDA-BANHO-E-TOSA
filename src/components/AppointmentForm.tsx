import React from 'react';
import { X, Save, User, Dog, Scissors, Calendar, Clock, DollarSign, Plus, Box, Search, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { AppData, Appointment, Client, Pet, Package } from '../types';
import { cn } from '../utils/cn';

interface AppointmentFormProps {
  data: AppData;
  onSave: (appointments: Appointment[], client?: Client, pets?: Pet[]) => void;
  onClose: () => void;
  appointment?: Appointment;
  initialData?: { 
    time?: string; 
    date?: string;
    clientId?: string;
    petId?: string;
    packageId?: string;
  };
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({ data, onSave, onClose, appointment, initialData }) => {
  const [step, setStep] = React.useState(1);
  const [isNewClient, setIsNewClient] = React.useState(false);
  
  // Form State
  const [clientId, setClientId] = React.useState(appointment?.clientId || initialData?.clientId || '');
  const [clientSearchTerm, setClientSearchTerm] = React.useState(
    (appointment?.clientId || initialData?.clientId) 
      ? data.clients.find(c => c.id === (appointment?.clientId || initialData?.clientId))?.name || '' 
      : ''
  );
  const [isClientDropdownOpen, setIsClientDropdownOpen] = React.useState(false);
  const [petId, setPetId] = React.useState(appointment?.petId || initialData?.petId || '');

  // Find related appointments if editing a package
  const relatedAppointments = React.useMemo(() => {
    if (appointment?.packageId) {
      return data.appointments
        .filter(a => 
          a.packageId === appointment.packageId && 
          a.clientId === appointment.clientId && 
          a.petId === appointment.petId
        )
        .sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`).getTime();
          const dateB = new Date(`${b.date}T${b.time}`).getTime();
          return dateA - dateB;
        });
    }
    return appointment ? [appointment] : [];
  }, [appointment, data.appointments]);

  const [sessions, setSessions] = React.useState(relatedAppointments.length || 1);
  const [sessionIds, setSessionIds] = React.useState<string[]>(
    relatedAppointments.length > 0 
      ? relatedAppointments.map(a => a.id) 
      : [appointment?.id || Math.random().toString(36).substr(2, 9)]
  );
  const [sessionDates, setSessionDates] = React.useState<string[]>(
    relatedAppointments.length > 0 
      ? relatedAppointments.map(a => a.date) 
      : [appointment?.date || initialData?.date || new Date().toISOString().split('T')[0]]
  );
  const [sessionTimes, setSessionTimes] = React.useState<string[]>(
    relatedAppointments.length > 0 
      ? relatedAppointments.map(a => a.time) 
      : [appointment?.time || initialData?.time || data.companyInfo.workingHours?.start || '08:00']
  );
  const [sessionServices, setSessionServices] = React.useState<string[][]>(
    relatedAppointments.length > 0 
      ? relatedAppointments.map(a => a.services) 
      : [appointment?.services || []]
  );
  const [sessionServicePrices, setSessionServicePrices] = React.useState<Record<string, number>>(appointment?.customServicePrices || {});
  const [price, setPrice] = React.useState(appointment?.price || 40);
  const [notes, setNotes] = React.useState(appointment?.notes || '');
  const [selectedPackageId, setSelectedPackageId] = React.useState<string | undefined>(appointment?.packageId || initialData?.packageId);

  // Handle initial package selection if provided in initialData
  React.useEffect(() => {
    if (initialData?.packageId && !appointment) {
      const pkg = data.packages.find(p => p.id === initialData.packageId);
      if (pkg) {
        const pkgServiceNames = pkg.serviceIds.map(sid => data.services.find(s => s.id === sid)?.name).filter(Boolean) as string[];
        setSessions(pkg.sessions);
        
        const newDates = [sessionDates[0]];
        const newTimes = [sessionTimes[0]];
        const newServices = [];
        
        while (newDates.length < pkg.sessions) {
          newDates.push(new Date().toISOString().split('T')[0]);
          newTimes.push(data.companyInfo.workingHours?.start || '08:00');
        }
        
        for (let i = 0; i < pkg.sessions; i++) {
          newServices.push([...pkgServiceNames]);
        }
        
        setSessionDates(newDates);
        setSessionTimes(newTimes);
        setSessionServices(newServices);
        setPrice(pkg.price);
      }
    }
  }, [initialData?.packageId, appointment, data.packages, data.services]);

  const togglePackage = (pkg: Package) => {
    const pkgServiceNames = pkg.serviceIds.map(sid => data.services.find(s => s.id === sid)?.name).filter(Boolean) as string[];
    
    // Check if all services of the package are already selected in the first session (simplified check)
    const allSelected = pkgServiceNames.every(name => sessionServices[0]?.includes(name));
    
    if (allSelected) {
      setSessions(1);
      setSessionIds([sessionIds[0]]);
      setSessionDates([sessionDates[0]]);
      setSessionTimes([sessionTimes[0]]);
      setSessionServices([[]]);
      setSelectedPackageId(undefined);
    } else {
      setSessions(pkg.sessions);
      
      const newIds = [...sessionIds];
      const newDates = [...sessionDates];
      const newTimes = [...sessionTimes];
      const newServices = [...sessionServices];
      
      while (newDates.length < pkg.sessions) {
        newIds.push(Math.random().toString(36).substr(2, 9));
        newDates.push(new Date().toISOString().split('T')[0]);
        newTimes.push(data.companyInfo.workingHours?.start || '08:00');
        newServices.push([]);
      }
      
      // Initialize all sessions with the package services (user can then prune them)
      const initializedServices = newServices.slice(0, pkg.sessions).map(() => [...pkgServiceNames]);
      
      setSessionIds(newIds.slice(0, pkg.sessions));
      setSessionDates(newDates.slice(0, pkg.sessions));
      setSessionTimes(newTimes.slice(0, pkg.sessions));
      setSessionServices(initializedServices);
      setPrice(pkg.price);
      setSelectedPackageId(pkg.id);
    }
  };

  const toggleServiceInSession = (sessionIdx: number, serviceName: string) => {
    const nextSessionServices = [...sessionServices];
    const currentServices = nextSessionServices[sessionIdx] || [];
    let nextPrices = { ...sessionServicePrices };
    
    if (currentServices.includes(serviceName)) {
      nextSessionServices[sessionIdx] = currentServices.filter(s => s !== serviceName);
      // Remove price override if it was the last instance of this service across all sessions
      const isUsedElsewhere = nextSessionServices.some((services, idx) => idx !== sessionIdx && services.includes(serviceName));
      if (!isUsedElsewhere) {
        delete nextPrices[serviceName];
      }
    } else {
      nextSessionServices[sessionIdx] = [...currentServices, serviceName];
      // Set default price if not already set
      if (!(serviceName in nextPrices)) {
        nextPrices[serviceName] = data.services.find(sv => sv.name === serviceName)?.price || 0;
      }
    }
    
    setSessionServices(nextSessionServices);
    setSessionServicePrices(nextPrices);
    
    // Recalculate price if not a fixed package price (simplified: always recalculate if custom)
    // If it was a package, the user might have changed it, so we should probably recalculate based on all services across all sessions
    const totalSum = nextSessionServices.reduce((acc, services) => {
      return acc + services.reduce((sAcc, sName) => {
        return sAcc + (nextPrices[sName] !== undefined ? nextPrices[sName] : (data.services.find(sv => sv.name === sName)?.price || 0));
      }, 0);
    }, 0);
    setPrice(totalSum);
  };

  const handleServicePriceChange = (serviceName: string, newPrice: number) => {
    const nextPrices = { ...sessionServicePrices, [serviceName]: newPrice };
    setSessionServicePrices(nextPrices);
    
    const totalSum = sessionServices.reduce((acc, services) => {
      return acc + services.reduce((sAcc, sName) => {
        return sAcc + (nextPrices[sName] !== undefined ? nextPrices[sName] : (data.services.find(sv => sv.name === sName)?.price || 0));
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

    const appointments: Appointment[] = sessionDates.map((d, idx) => {
      const existingApp = relatedAppointments[idx];
      const isEditing = !!existingApp;
      
      // Preserve existing reports if editing
      const updatedReports = isEditing ? existingApp.reports : undefined;

      return {
        ...(isEditing ? existingApp : {}),
        id: sessionIds[idx] || Math.random().toString(36).substr(2, 9),
        clientId: finalClientId,
        petId: finalPetId,
        services: sessionServices[idx] || [],
        date: d,
        time: sessionTimes[idx],
        status: isEditing ? existingApp.status : (appointment?.status || 'Agendado'),
        price: idx === 0 ? price : 0, 
        notes,
        packageId: selectedPackageId,
        customServicePrices: sessionServicePrices,
        ...(updatedReports ? { reports: updatedReports } : {}),
      };
    });

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
                <div className="space-y-1 relative">
                  <label className="text-sm font-semibold text-slate-700">Selecionar Cliente</label>
                  <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      value={clientSearchTerm}
                      onChange={e => {
                        setClientSearchTerm(e.target.value);
                        setIsClientDropdownOpen(true);
                        if (clientId) {
                          setClientId('');
                          setPetId('');
                        }
                      }}
                      onFocus={() => setIsClientDropdownOpen(true)}
                      placeholder="Digite o nome do cliente..."
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {isClientDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {data.clients
                        .filter(c => c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()))
                        .map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setClientId(c.id);
                              setClientSearchTerm(c.name);
                              setIsClientDropdownOpen(false);
                              // Auto-select first pet if available
                              const clientPets = data.pets[c.id] || [];
                              if (clientPets.length > 0) {
                                setPetId(clientPets[0].id);
                              }
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0"
                          >
                            <p className="font-bold text-slate-900">{c.name}</p>
                            {c.phones.length > 0 && (
                              <p className="text-xs text-slate-500">{c.phones[0]}</p>
                            )}
                          </button>
                        ))}
                      {data.clients.filter(c => c.name.toLowerCase().includes(clientSearchTerm.toLowerCase())).length === 0 && (
                        <div className="px-4 py-3 text-sm text-slate-500 italic">
                          Nenhum cliente encontrado.
                        </div>
                      )}
                    </div>
                  )}
                  {/* Backdrop to close dropdown */}
                  {isClientDropdownOpen && (
                    <div 
                      className="fixed inset-0 z-[-1]" 
                      onClick={() => setIsClientDropdownOpen(false)}
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Selecionar Pet</label>
                  <select 
                    required 
                    value={petId} 
                    onChange={e => setPetId(e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400" 
                    disabled={!clientId}
                  >
                    <option value="">Selecione...</option>
                    {clientId && data.pets[clientId]?.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.breed})</option>
                    ))}
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
              <label className="text-sm font-semibold text-slate-700">Pacote de Serviços</label>
              <div className="relative">
                <Box size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-700 appearance-none cursor-pointer"
                  value={selectedPackageId || ""}
                  onChange={(e) => {
                    const pkgId = e.target.value;
                    if (!pkgId) {
                      setSessions(1);
                      setSessionDates([sessionDates[0]]);
                      setSessionTimes([sessionTimes[0]]);
                      setSessionServices([[]]);
                      setSelectedPackageId(undefined);
                    } else {
                      const pkg = data.packages.find(p => p.id === pkgId);
                      if (pkg) togglePackage(pkg);
                    }
                  }}
                >
                  <option value="">Nenhum pacote (Serviço Avulso)</option>
                  {data.packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.sessions} sessões - R$ {pkg.price.toFixed(2)})
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {selectedPackageId && (
                <p className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg inline-block border border-amber-100">
                  Pacote selecionado: {data.packages.find(p => p.id === selectedPackageId)?.name}
                </p>
              )}
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
                          min={data.companyInfo.workingHours?.start || '08:00'}
                          max={data.companyInfo.workingHours?.end || '18:00'}
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
                      <select 
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            toggleServiceInSession(idx, e.target.value);
                          }
                        }}
                      >
                        <option value="">Adicionar serviço...</option>
                        {data.services.filter(s => !sessionServices[idx]?.includes(s.name)).map(s => (
                          <option key={s.id} value={s.name}>{s.name} (R$ {s.price.toFixed(2)})</option>
                        ))}
                      </select>
                      
                      {sessionServices[idx]?.length > 0 && (
                        <div className="flex flex-col gap-2 mt-2">
                          {sessionServices[idx].map(serviceName => {
                            const s = data.services.find(sv => sv.name === serviceName);
                            if (!s) return null;
                            const currentPrice = sessionServicePrices[s.name] !== undefined ? sessionServicePrices[s.name] : s.price;
                            
                            return (
                              <div key={s.id} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl p-2">
                                <span className="flex-1 text-xs font-bold text-indigo-700">{s.name}</span>
                                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                                  <span className="text-xs font-bold text-slate-400">R$</span>
                                  <input 
                                    type="number" 
                                    step="0.01"
                                    value={currentPrice}
                                    onChange={(e) => handleServicePriceChange(s.name, Number(e.target.value))}
                                    className="w-16 bg-transparent text-xs font-bold text-slate-700 outline-none"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleServiceInSession(idx, s.name)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Preço Total (R$)</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" step="0.01" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-600" />
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
