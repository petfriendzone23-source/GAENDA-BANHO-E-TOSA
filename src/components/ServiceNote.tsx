import React from 'react';
import { Appointment, Client, Pet, Service } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2pdf from 'html2pdf.js';
import { Download, X } from 'lucide-react';
import { motion } from 'motion/react';

interface ServiceNoteProps {
  appointment: Appointment;
  client: Client;
  pet: Pet;
  services: Service[];
  onClose: () => void;
}

export const ServiceNote: React.FC<ServiceNoteProps> = ({ appointment, client, pet, services, onClose }) => {
  const serviceNoteRef = React.useRef<HTMLDivElement>(null);

  const handleDownloadPdf = () => {
    if (serviceNoteRef.current) {
      const opt = {
        margin: 1,
        filename: `nota_servico_${client.name.replace(/\s/g, '_')}_${format(parseISO(appointment.date), 'yyyyMMdd')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      html2pdf().from(serviceNoteRef.current).set(opt).save();
    }
  };

  const totalServicesPrice = appointment.services.reduce((sum, serviceName) => {
    const service = services.find(s => s.name === serviceName);
    return sum + (service?.price || 0);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <h2 className="text-xl font-bold">Nota de Serviço</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div ref={serviceNoteRef} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900">PetGroom Serviços</h3>
              <p className="text-slate-500 text-sm">Rua Fictícia, 123 - Cidade, Estado</p>
              <p className="text-slate-500 text-sm">(11) 98765-4321 | contato@petgroom.com</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 border-b pb-4 border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Cliente</p>
                <p className="font-bold text-slate-900">{client.name}</p>
                <p className="text-sm text-slate-600">{client.phones[0]}</p>
                <p className="text-sm text-slate-600">{client.addresses[0]}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase">Data do Serviço</p>
                <p className="font-bold text-slate-900">{format(parseISO(appointment.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                <p className="text-sm text-slate-600">{appointment.time}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Pet</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center overflow-hidden">
                  {pet.photoUrl ? (
                    <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-indigo-600 text-lg font-bold">{pet.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{pet.name}</p>
                  <p className="text-sm text-slate-600">{pet.breed} - {pet.size}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Serviços Realizados</p>
              <ul className="space-y-2">
                {appointment.services.map((serviceName, i) => {
                  const service = services.find(s => s.name === serviceName);
                  return (
                    <li key={i} className="flex justify-between items-center text-slate-700">
                      <span className="font-medium">{serviceName}</span>
                      <span className="font-bold">R$ {service?.price.toFixed(2) || '0.00'}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <p className="text-lg font-bold text-slate-900">Total</p>
              <p className="text-xl font-bold text-indigo-600">R$ {totalServicesPrice.toFixed(2)}</p>
            </div>

            {appointment.notes && (
              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 italic">
                <p className="font-bold text-[10px] uppercase text-slate-400 mb-1 not-italic">Observações</p>
                "{appointment.notes}"
              </div>
            )}
          </div>
        </div>

        <footer className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all">
            Fechar
          </button>
          <button onClick={handleDownloadPdf} className="px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2">
            <Download size={20} />
            Baixar PDF
          </button>
        </footer>
      </motion.div>
    </div>
  );
};
