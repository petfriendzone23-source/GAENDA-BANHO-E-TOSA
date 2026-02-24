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
  pets: Pet[]; // Changed from single pet to array of pets
  allServices: Service[]; // Added allServices prop
  onClose: () => void;
}

export const ServiceNote: React.FC<ServiceNoteProps> = ({ appointment, client, pets, allServices, onClose }) => {
  const serviceNoteRef = React.useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  const relevantPet = pets.find(p => p.id === appointment.petId); // Find the specific pet for the appointment

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    console.log("Iniciando geração de PDF...");
    try {
      const opt = {
        margin: 1,
        filename: `nota_servico_${client.name.replace(/\s/g, '_')}_${format(parseISO(appointment.date), 'yyyyMMdd')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      console.log("Opções de PDF:", opt);
      const pdfContent = generatePdfHtml(); // Get HTML string from helper function
      console.log("Conteúdo HTML para PDF:", pdfContent);

      await html2pdf().from(pdfContent).set(opt).save();
      console.log("PDF gerado e salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      // Optionally, show a user-friendly error message
    } finally {
      setIsGeneratingPdf(false);
      console.log("Geração de PDF finalizada.");
    }
  };

  const totalServicesPrice = appointment.services.reduce((sum, serviceName) => {
    const service = allServices.find(s => s.name === serviceName); // Use allServices to find price
    return sum + (service?.price || 0);
  }, 0);

  const generatePdfHtml = () => {
    return `
      <div style="padding: 1in; font-family: sans-serif; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.5rem; font-weight: bold; color: #1e293b;">PetGroom Serviços</h3>
          <p style="color: #64748b; font-size: 0.875rem;">Rua Fictícia, 123 - Cidade, Estado</p>
          <p style="color: #64748b; font-size: 0.875rem;">(11) 98765-4321 | contato@petgroom.com</p>
        </div>

        <div style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #f1f5f9;">
          <div style="margin-bottom: 1rem;">
            <p style="font-size: 0.75rem; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Cliente</p>
            <p style="font-weight: bold; color: #1e293b;">${client.name}</p>
            <p style="font-size: 0.875rem; color: #475569;">${client.phones[0]}</p>
            <p style="font-size: 0.875rem; color: #475569;">${client.addresses[0]}</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 0.75rem; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Data do Serviço</p>
            <p style="font-weight: bold; color: #1e293b;">${format(parseISO(appointment.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            <p style="font-size: 0.875rem; color: #475569;">${appointment.time}</p>
          </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <p style="font-size: 0.75rem; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.5rem;">Pet</p>
          <div style="margin-bottom: 0.5rem;">
            ${relevantPet.photoUrl ? 
              `<img src="${relevantPet.photoUrl}" alt="${relevantPet.name}" style="width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; object-fit: cover; display: inline-block; vertical-align: middle; margin-right: 0.75rem;" />` :
              `<span style="width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; background-color: #eef2ff; color: #4f46e5; font-size: 1.125rem; font-weight: bold; display: inline-flex; align-items: center; justify-content: center; vertical-align: middle; margin-right: 0.75rem;">${relevantPet.name.charAt(0)}</span>`
            }
            <span style="font-weight: bold; color: #1e293b; vertical-align: middle;">${relevantPet.name}</span>
          </div>
          <p style="font-size: 0.875rem; color: #475569; margin-left: 3.25rem;">${relevantPet.breed} - ${relevantPet.size}</p>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <p style="font-size: 0.75rem; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.5rem;">Serviços Realizados</p>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${appointment.services.map((serviceName, i) => {
              const service = allServices.find(s => s.name === serviceName);
              return `
                <li key="${i}" style="display: flex; justify-content: space-between; align-items: center; color: #475569; margin-bottom: 0.5rem;">
                  <span style="font-weight: 500;">${serviceName}</span>
                  <span style="font-weight: bold;">R$ ${(service?.price || 0).toFixed(2)}</span>
                </li>
              `;
            }).join('')}
          </ul>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid #f1f5f9;">
          <p style="font-size: 1.125rem; font-weight: bold; color: #1e293b;">Total</p>
          <p style="font-size: 1.25rem; font-weight: bold; color: #4f46e5;">R$ ${totalServicesPrice.toFixed(2)}</p>
        </div>

        ${appointment.notes ? `
          <div style="margin-top: 1.5rem; padding: 1rem; background-color: #f8fafc; border-radius: 0.75rem; border: 1px solid #f1f5f9; font-size: 0.875rem; color: #475569; font-style: italic;">
            <p style="font-weight: bold; font-size: 0.625rem; text-transform: uppercase; color: #94a3b8; margin-bottom: 0.25rem; font-style: normal;">Observações</p>
            "${appointment.notes}"
          </div>
        ` : ''}
      </div>
    `;
  };

  if (!relevantPet) return null; // Handle case where pet is not found

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
            {/* Visible content for display */}
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
                  {relevantPet.photoUrl ? (
                    <img src={relevantPet.photoUrl} alt={relevantPet.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-indigo-600 text-lg font-bold">{relevantPet.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{relevantPet.name}</p>
                  <p className="text-sm text-slate-600">{relevantPet.breed} - {relevantPet.size}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Serviços Realizados</p>
              <ul className="space-y-2">
                {appointment.services.map((serviceName, i) => {
                  const service = allServices.find(s => s.name === serviceName);
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
          <button 
            onClick={handleDownloadPdf} 
            className="px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
            {!isGeneratingPdf && <Download size={20} />}
          </button>
        </footer>
      </motion.div>


    </div>
  );
};
