import React from 'react';
import { X, Save, User, Dog, Scissors, Calendar, Clock, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';
import { AppData, Appointment, Client, Pet, ServiceType } from '../types';
import { cn } from '../utils/cn';

interface AppointmentFormProps {
  data: AppData;
  onSave: (appointment: Appointment, client?: Client, pet?: Pet) => void;
  onClose: () => void;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({ data, onSave, onClose }) => {
  const [step, setStep] = React.useState(1);
  const [isNewClient, setIsNewClient] = React.useState(false);
  
  // Form State
  const [clientId, setClientId] = React.useState('');
  const [petId, setPetId] = React.useState('');
  const [selectedServices, setSelectedServices] = React.useState<ServiceType[]>(['Banho']);
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = React.useState('09:00');
  const [price, setPrice] = React.useState(40);
  const [notes, setNotes] = React.useState('');

  // New Client State
  const [clientName, setClientName] = React.useState('');
  const [clientPhone, setClientPhone] = React.useState('');
  const [petName, setPetName] = React.useState('');
  const [petBreed, setPetBreed] = React.useState('');
  const [petSize, setPetSize] = React.useState<Pet['size']>('Médio');

  const services: { name: ServiceType; price: number }[] = [
    { name: 'Banho', price: 40 },
    { name: 'Tosa', price: 50 },
    { name: 'Banho e Tosa', price: 80 },
    { name: 'Hidratação', price: 30 },
    { name: 'Corte de Unha', price: 15 },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalClientId = clientId;
    let finalPetId = petId;
    let newClient: Client | undefined;
    let newPet: Pet | undefined;

    if (isNewClient) {
      finalClientId = Math.random().toString(36).substr(2, 9);
      finalPetId = Math.random().toString(36).substr(2, 9);
      newClient = { id: finalClientId, name: clientName, phone: clientPhone };
      newPet = { id: finalPetId, name: petName, breed: petBreed, size: petSize };
    }

    const appointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      clientId: finalClientId,
      petId: finalPetId,
      services: selectedServices,
      date,
      time,
      status: 'Agendado',
      price,
      notes,
    };

    onSave(appointment, newClient, newPet);
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
            <h2 className="text-xl font-bold">Novo Agendamento</h2>
            <p className="text-indigo-100 text-sm">Preencha os dados para reservar o horário.</p>
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
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Nome do Dono</label>
                  <input required value={clientName} onChange={e => setClientName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: João Silva" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Telefone</label>
                  <input required value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="(11) 99999-9999" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Nome do Pet</label>
                  <input required value={petName} onChange={e => setPetName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Rex" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Raça</label>
                  <input required value={petBreed} onChange={e => setPetBreed(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Golden Retriever" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Porte</label>
                  <select value={petSize} onChange={e => setPetSize(e.target.value as any)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option>Pequeno</option>
                    <option>Médio</option>
                    <option>Grande</option>
                  </select>
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
              <label className="text-sm font-semibold text-slate-700">Serviços Selecionados</label>
              <div className="flex flex-wrap gap-2">
                {services.map(s => {
                  const isSelected = selectedServices.includes(s.name);
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => {
                        let next;
                        if (isSelected) {
                          next = selectedServices.filter(item => item !== s.name);
                        } else {
                          next = [...selectedServices, s.name];
                        }
                        setSelectedServices(next);
                        
                        // Recalculate total price
                        const newPrice = next.reduce((acc, curr) => {
                          return acc + (services.find(sv => sv.name === curr)?.price || 0);
                        }, 0);
                        setPrice(newPrice);
                      }}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium border-2 transition-all",
                        isSelected 
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100" 
                          : "bg-white border-slate-100 text-slate-500 hover:border-indigo-200"
                      )}
                    >
                      {s.name} (R$ {s.price})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Preço Total (R$)</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Data</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Horário</label>
                <div className="relative">
                  <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
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
