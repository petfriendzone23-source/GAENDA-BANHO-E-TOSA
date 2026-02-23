import React from 'react';
import { X, Phone, MapPin, Dog, Calendar, Clock, DollarSign, CheckCircle2, AlertCircle, Trash2, Scissors } from 'lucide-react';
import { motion } from 'motion/react';
import { AppData, Client, Pet, Appointment } from '../types';
import { cn } from '../utils/cn';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientDetailsProps {
  client: Client;
  data: AppData;
  onClose: () => void;
  appointment?: Appointment;
  showHistory?: boolean;
}

export const ClientDetails: React.FC<ClientDetailsProps> = ({ client, data, onClose, appointment, showHistory = true }) => {
  const clientPets = data.pets[client.id] || [];
  const clientAppointments = data.appointments
    .filter(a => a.clientId === client.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden">
              <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`} alt={client.name} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{client.name}</h2>
              <p className="text-slate-400 text-sm">Desde {clientAppointments.length > 0 ? format(parseISO(clientAppointments[clientAppointments.length - 1].date), 'MMMM yyyy', { locale: ptBR }) : 'sem registros'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar: Info & Pets */}
          <div className="space-y-8">
            <section className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contatos</h3>
              <div className="space-y-3">
                {client.phones.map((phone, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-600">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Phone size={14} />
                    </div>
                    <span className="text-sm font-medium">{phone}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Endereços</h3>
              <div className="space-y-3">
                {client.addresses.map((address, i) => (
                  <div key={i} className="group relative">
                    <div className="flex items-start gap-3 text-slate-600 p-3 rounded-2xl bg-slate-50 border border-slate-100 group-hover:border-indigo-200 transition-colors">
                      <div className="p-2 bg-white rounded-lg mt-0.5 shadow-sm">
                        <MapPin size={14} className="text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium leading-relaxed block mb-2">{address}</span>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                          <MapPin size={12} />
                          Ver no Google Maps
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pets</h3>
              <div className="space-y-3">
                {clientPets.map(pet => (
                  <div key={pet.id} className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm">
                      <Dog size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{pet.name}</p>
                      <p className="text-[10px] text-indigo-600 font-medium">{pet.breed} • {pet.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Main Content: History or Appointment Details */}
          <div className="md:col-span-2 space-y-6">
            {appointment && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">Serviço Agendado</h3>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Hoje</span>
                </div>
                <div className="p-6 rounded-3xl border-2 border-indigo-500 bg-indigo-50/30 shadow-xl shadow-indigo-50">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-indigo-600 text-white">
                        <Scissors size={24} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{(appointment.services || []).join(', ')}</p>
                        <p className="text-slate-500 font-medium">{data.pets[appointment.clientId]?.find(p => p.id === appointment.petId)?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-600">R$ {appointment.price.toFixed(2)}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{appointment.status}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-indigo-100">
                    <div className="flex items-center gap-3 text-slate-700">
                      <Calendar size={18} className="text-indigo-600" />
                      <span className="font-bold">{format(parseISO(appointment.date), "dd 'de' MMMM", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-700">
                      <Clock size={18} className="text-indigo-600" />
                      <span className="font-bold">{appointment.time}</span>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="mt-6 p-4 bg-white rounded-2xl border border-indigo-100 text-sm text-slate-600 italic">
                      <p className="font-bold text-[10px] uppercase text-indigo-400 mb-1 not-italic tracking-wider">Observações</p>
                      "{appointment.notes}"
                    </div>
                  )}
                </div>
              </section>
            )}

            {showHistory && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">Histórico de Serviços</h3>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{clientAppointments.length} Registros</span>
                </div>

                <div className="space-y-4">
                  {clientAppointments.length > 0 ? (
                    clientAppointments.map(app => (
                      <div key={app.id} className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:border-indigo-200 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-xl",
                              app.status === 'Concluído' ? "bg-emerald-100 text-emerald-600" :
                              app.status === 'Agendado' ? "bg-amber-100 text-amber-600" :
                              "bg-rose-100 text-rose-600"
                            )}>
                              {app.status === 'Concluído' ? <CheckCircle2 size={18} /> : 
                               app.status === 'Agendado' ? <Clock size={18} /> : 
                               <AlertCircle size={18} />}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{(app.services || []).join(', ')}</p>
                              <p className="text-xs text-slate-500">{data.pets[app.clientId]?.find(p => p.id === app.petId)?.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">R$ {app.price.toFixed(2)}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{app.status}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                          <div className="flex items-center gap-2 text-slate-500">
                            <Calendar size={14} />
                            <span className="text-xs font-medium">{format(parseISO(app.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <Clock size={14} />
                            <span className="text-xs font-medium">{app.time}</span>
                          </div>
                        </div>

                        {app.notes && (
                          <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-500 italic">
                            "{app.notes}"
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <p className="text-slate-400 font-medium">Nenhum serviço registrado ainda.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <footer className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-8 py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
            Fechar
          </button>
        </footer>
      </motion.div>
    </div>
  );
};
