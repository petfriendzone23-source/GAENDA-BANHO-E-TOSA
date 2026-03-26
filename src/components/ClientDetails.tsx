import React from 'react';
import { X, Phone, MapPin, Dog, Calendar, Clock, DollarSign, CheckCircle2, AlertCircle, Trash2, Scissors, Camera, MessageSquare, FileText, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { AppData, Client, Pet, Appointment } from '../types';
import { cn } from '../utils/cn';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ServiceNote } from './ServiceNote';
import { PackageServiceNote } from './PackageServiceNote';
import { ImageUpload } from './ImageUpload';


interface ClientDetailsProps {
  client: Client;
  data: AppData;
  onClose: () => void;
  appointment?: Appointment;
  showHistory?: boolean;
  onUpdatePet?: (clientId: string, petId: string, updatedPet: Partial<Pet>) => void;
  onEdit?: () => void;
}

export const ClientDetails: React.FC<ClientDetailsProps> = ({ client, data, onClose, appointment, showHistory = true, onUpdatePet, onEdit }) => {
  const [showWhatsAppTemplates, setShowWhatsAppTemplates] = React.useState(false);
  const [targetPhone, setTargetPhone] = React.useState<string>('');
  const [showServiceNote, setShowServiceNote] = React.useState(false);
  const [expandedPhoto, setExpandedPhoto] = React.useState<string | null>(null);
  const [historyPage, setHistoryPage] = React.useState(1);
  const HISTORY_PER_PAGE = 5;

  const handleWhatsAppClick = (e: React.MouseEvent, phone: string) => {
    e.preventDefault();
    setTargetPhone(phone);
    if (data.whatsappTemplates && data.whatsappTemplates.length > 0) {
      setShowWhatsAppTemplates(true);
    } else {
      openWhatsApp(phone);
    }
  };

  const openWhatsApp = (phone: string, message: string = '') => {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setShowWhatsAppTemplates(false);
  };

  const clientPets = data.pets[client.id] || [];
  const clientAppointments = data.appointments
    .filter(a => a.clientId === client.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalHistoryPages = Math.ceil(clientAppointments.length / HISTORY_PER_PAGE);
  const paginatedHistory = clientAppointments.slice(
    (historyPage - 1) * HISTORY_PER_PAGE,
    historyPage * HISTORY_PER_PAGE
  );

  const isAppointmentView = !!appointment && !showHistory;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      {showWhatsAppTemplates && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/20 backdrop-blur-[1px] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-slate-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare size={20} className="text-emerald-600" />
                Escolha uma mensagem
              </h3>
              <button onClick={() => setShowWhatsAppTemplates(false)} className="p-1 hover:bg-slate-100 rounded-full">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              <button 
                onClick={() => openWhatsApp(targetPhone)}
                className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-slate-600 font-medium text-sm"
              >
                Iniciar conversa sem mensagem
              </button>
              {data.whatsappTemplates?.map(template => (
                <button 
                  key={template.id}
                  onClick={() => openWhatsApp(targetPhone, template.message)}
                  className="w-full text-left p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 hover:border-emerald-200 transition-all group"
                >
                  <p className="font-bold text-emerald-900 text-sm mb-1">{template.title}</p>
                  <p className="text-xs text-emerald-700/80 line-clamp-2">{template.message}</p>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={cn(
          "bg-white w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]",
          isAppointmentView ? "max-w-sm" : "max-w-3xl"
        )}
      >
        <header className={cn(
          "border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white",
          isAppointmentView ? "p-4" : "p-6"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "rounded-xl bg-white/10 flex items-center justify-center overflow-hidden",
              isAppointmentView ? "w-10 h-10 rounded-lg" : "w-16 h-16 rounded-2xl"
            )}>
              <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`} alt={client.name} />
            </div>
            <div>
              <h2 className={cn("font-bold", isAppointmentView ? "text-lg" : "text-2xl")}>{client.name}</h2>
              {!isAppointmentView && (
                <p className="text-slate-400 text-sm">Desde {clientAppointments.length > 0 ? format(parseISO(clientAppointments[clientAppointments.length - 1].date), 'MMMM yyyy', { locale: ptBR }) : 'sem registros'}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button onClick={onEdit} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Editar Cliente">
                <Edit2 size={20} />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={isAppointmentView ? 20 : 24} />
            </button>
          </div>
        </header>

        <div className={cn(
          "flex-1 overflow-y-auto",
          isAppointmentView ? "p-4 flex flex-col gap-3" : "p-6 grid grid-cols-1 md:grid-cols-3 gap-8"
        )}>
          {isAppointmentView && appointment ? (
             <>
               {/* Appointment Card - Hero */}
               <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
                  <div className={cn(
                    "p-3 text-center",
                    appointment.packageId ? "bg-purple-50" : "bg-indigo-50"
                  )}>
                     <div className="inline-flex p-2 rounded-lg bg-white shadow-sm mb-2 text-indigo-600">
                        <Scissors size={20} />
                     </div>
                     <h2 className="text-lg font-bold text-slate-900 mb-0.5 leading-tight">
                       {(appointment.services || []).join(', ')}
                     </h2>
                     <p className="text-xs font-medium text-slate-500">
                       {data.pets[appointment.clientId]?.find(p => p.id === appointment.petId)?.name}
                     </p>
                  </div>
                  
                  <div className="p-3 space-y-2">
                     <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
                           <Calendar size={14} className="text-indigo-500 mb-0.5" />
                           <span className="font-bold text-slate-900 block text-xs">
                             {format(parseISO(appointment.date), "dd 'de' MMM", { locale: ptBR })}
                           </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
                           <Clock size={14} className="text-indigo-500 mb-0.5" />
                           <span className="font-bold text-slate-900 block text-xs">
                             {appointment.time}
                           </span>
                        </div>
                     </div>

                     <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 text-white">
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Total</span>
                        <span className="text-base font-bold">R$ {appointment.price.toFixed(2)}</span>
                     </div>

                     {appointment.notes && (
                        <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-[10px] italic text-center">
                           "{appointment.notes}"
                        </div>
                     )}
                  </div>
               </div>

               {/* Client Quick Info */}
               <div className="flex flex-col gap-2">
                  <button 
                    onClick={(e) => handleWhatsAppClick(e, client.phones[0])}
                    className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 hover:bg-emerald-100 transition-colors w-full text-left group"
                  >
                     <div className="p-1.5 bg-white rounded-full text-emerald-600 shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                        <MessageSquare size={14} />
                     </div>
                     <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-emerald-600/70 uppercase">WhatsApp</p>
                        <p className="font-bold text-emerald-900 text-sm">{client.phones[0]}</p>
                     </div>
                  </button>
                  
                  {appointment && (
                    <button 
                      onClick={() => setShowServiceNote(true)}
                      className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-3 hover:bg-indigo-100 transition-colors w-full text-left group"
                    >
                       <div className="p-1.5 bg-white rounded-full text-indigo-600 shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                          <FileText size={14} />
                       </div>
                       <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-indigo-600/70 uppercase">Nota de Serviço</p>
                          <p className="font-bold text-indigo-900 text-sm">Gerar PDF do serviço</p>
                       </div>
                    </button>
                  )}
                  
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                     <div className="p-1.5 bg-white rounded-full text-slate-900 shadow-sm shrink-0 mt-0.5">
                        <MapPin size={14} />
                     </div>
                     <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Endereço</p>
                        {client.addresses && client.addresses[0] ? (
                          <a 
                             href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.addresses[0])}`}
                             target="_blank"
                             rel="noreferrer"
                             className="font-bold text-slate-900 text-sm leading-snug break-words hover:text-indigo-600 transition-colors block"
                          >
                             {client.addresses[0]}
                          </a>
                        ) : (
                          <p className="text-sm text-slate-400 italic">Endereço não cadastrado</p>
                        )}
                     </div>
                  </div>
               </div>
             </>
          ) : (
            <>
              {/* Sidebar: Info & Pets */}
              <div className="space-y-8">
                <section className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contatos</h3>
                  <div className="space-y-3">
                    {client.phones.map((phone, i) => (
                      <button 
                        key={i} 
                        onClick={(e) => handleWhatsAppClick(e, phone)}
                        className="flex items-center gap-3 text-slate-600 p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors w-full text-left"
                      >
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <Phone size={14} />
                        </div>
                        <span className="text-sm font-medium">{phone}</span>
                      </button>
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
                      <div key={pet.id} className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl bg-white text-indigo-600 shadow-sm flex items-center justify-center overflow-hidden group shrink-0">
                            {pet.photoUrl ? (
                              <img 
                                src={pet.photoUrl} 
                                alt={pet.name} 
                                className="w-full h-full object-cover cursor-zoom-in"
                                onClick={() => setExpandedPhoto(pet.photoUrl!)}
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Dog size={24} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-sm truncate">{pet.name}</p>
                            <p className="text-[10px] text-indigo-600 font-medium truncate">{pet.breed} • {pet.size}</p>
                          </div>
                        </div>

                        {onUpdatePet && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Foto do Pet</label>
                            <ImageUpload 
                              onUpload={(url) => onUpdatePet(client.id, pet.id, { photoUrl: url })}
                              currentImageUrl={pet.photoUrl}
                              folder="pets"
                            />
                          </div>
                        )}
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
                      {paginatedHistory.length > 0 ? (
                        <>
                          {paginatedHistory.map(app => (
                            <div key={app.id} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-indigo-200 transition-colors flex flex-col gap-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className={cn(
                                    "p-1.5 rounded-lg shrink-0",
                                    app.status === 'Concluído' ? "bg-emerald-100 text-emerald-600" :
                                    app.status === 'Agendado' ? "bg-amber-100 text-amber-600" :
                                    "bg-rose-100 text-rose-600"
                                  )}>
                                    {app.status === 'Concluído' ? <CheckCircle2 size={14} /> : 
                                     app.status === 'Agendado' ? <Clock size={14} /> : 
                                     <AlertCircle size={14} />}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 text-sm truncate">{(app.services || []).join(', ')}</p>
                                    <p className="text-[10px] text-slate-500 truncate">{data.pets[app.clientId]?.find(p => p.id === app.petId)?.name}</p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                  <p className="text-sm font-bold text-slate-900">R$ {app.price.toFixed(2)}</p>
                                  <p className={cn(
                                    "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md inline-block mt-0.5",
                                    app.status === 'Concluído' ? "bg-emerald-50 text-emerald-600" :
                                    app.status === 'Agendado' ? "bg-amber-50 text-amber-600" :
                                    "bg-rose-50 text-rose-600"
                                  )}>{app.status}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 pt-2 border-t border-slate-50 text-slate-500">
                                <div className="flex items-center gap-1.5">
                                  <Calendar size={12} />
                                  <span className="text-[11px] font-medium">{format(parseISO(app.date), "dd/MM/yyyy")}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Clock size={12} />
                                  <span className="text-[11px] font-medium">{app.time}</span>
                                </div>
                              </div>

                              {app.notes && (
                                <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-500 italic">
                                  "{app.notes}"
                                </div>
                              )}
                            </div>
                          ))}

                          {totalHistoryPages > 1 && (
                            <div className="flex items-center justify-between pt-4">
                              <p className="text-xs text-slate-500 font-medium">
                                Página <span className="text-slate-900 font-bold">{historyPage}</span> de <span className="text-slate-900 font-bold">{totalHistoryPages}</span>
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setHistoryPage(prev => Math.max(prev - 1, 1))}
                                  disabled={historyPage === 1}
                                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                                >
                                  <ChevronLeft size={16} />
                                </button>
                                <button
                                  onClick={() => setHistoryPage(prev => Math.min(prev + 1, totalHistoryPages))}
                                  disabled={historyPage === totalHistoryPages}
                                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                                >
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                          <p className="text-slate-400 font-medium">Nenhum serviço registrado ainda.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <footer className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-8 py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
            Fechar
          </button>
        </footer>
      </motion.div>

      {showServiceNote && appointment && (
        appointment.packageId ? (
          <PackageServiceNote
            client={client}
            appointment={appointment}
            allAppointments={data.appointments}
            pets={clientPets}
            allServices={data.services}
            allPackages={data.packages}
            companyInfo={data.companyInfo}
            onClose={() => setShowServiceNote(false)}
          />
        ) : (
          <ServiceNote 
            client={client} 
            appointment={appointment} 
            pets={clientPets} 
            allServices={data.services} 
            companyInfo={data.companyInfo}
            onClose={() => setShowServiceNote(false)} 
          />
        )
      )}

      {expandedPhoto && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setExpandedPhoto(null)}
        >
          <button 
            onClick={() => setExpandedPhoto(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={32} />
          </button>
          <img 
            src={expandedPhoto} 
            alt="Pet ampliado" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
};
