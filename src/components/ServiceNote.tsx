import React from 'react';
import { Appointment, Client, Pet, Service, CompanyInfo } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toPng } from 'html-to-image';
import { Download, X, Share2, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface ServiceNoteProps {
  appointment: Appointment;
  client: Client;
  pets: Pet[]; // Changed from single pet to array of pets
  allServices: Service[]; // Added allServices prop
  companyInfo: CompanyInfo;
  onClose: () => void;
}

export const ServiceNote: React.FC<ServiceNoteProps> = ({ appointment, client, pets, allServices, companyInfo, onClose }) => {
  const serviceNoteRef = React.useRef<HTMLDivElement>(null);
  const [isGeneratingImage, setIsGeneratingImage] = React.useState(false);

  const relevantPet = pets.find(p => p.id === appointment.petId);

  const totalServicesPrice = appointment.price;

  const handleGenerateImage = async (share = false) => {
    if (!serviceNoteRef.current) return;
    setIsGeneratingImage(true);
    console.log("Iniciando geração de imagem...");
    try {
      // Ensure the element is visible and has a white background for the capture
      const dataUrl = await toPng(serviceNoteRef.current, { 
        quality: 1, 
        backgroundColor: '#ffffff',
        style: {
          borderRadius: '0',
          border: 'none'
        }
      });
      
      if (share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `nota_${client.name.replace(/\s/g, '_')}.png`, { type: 'image/png' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Nota de Serviço',
            text: `Nota de serviço para ${relevantPet?.name}`,
          });
        } else {
          // Fallback to download if share is not supported
          const link = document.createElement('a');
          link.download = `nota_${client.name.replace(/\s/g, '_')}.png`;
          link.href = dataUrl;
          link.click();
        }
      } else {
        const link = document.createElement('a');
        link.download = `nota_${client.name.replace(/\s/g, '_')}.png`;
        link.href = dataUrl;
        link.click();
      }
      console.log("Imagem gerada com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      alert("Erro ao gerar imagem. Por favor, tente novamente.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  console.log("ServiceNote render:", { 
    petId: appointment.petId, 
    foundPet: !!relevantPet 
  });

  // Don't return null, show a message if data is missing
  if (!relevantPet) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Dados não encontrados</h2>
          <p className="text-slate-500 mb-6">
            Não foi possível carregar as informações do pet para este agendamento.
          </p>
          <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">
            Fechar
          </button>
        </div>
      </div>
    );
  }

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
              <h3 className="text-2xl font-bold text-slate-900">{companyInfo.name}</h3>
              <p className="text-slate-500 text-sm">{companyInfo.address}</p>
              <p className="text-slate-500 text-sm">{companyInfo.phone}</p>
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
                  const price = appointment.customServicePrices?.[serviceName] ?? service?.price ?? 0;
                  return (
                    <li key={i} className="flex justify-between items-center text-slate-700">
                      <span className="font-medium">{serviceName}</span>
                      <span className="font-bold">R$ {price.toFixed(2)}</span>
                    </li>
                  );
                })}
                {(() => {
                  const calculatedSum = appointment.services.reduce((sum, serviceName) => {
                    const service = allServices.find(s => s.name === serviceName);
                    return sum + (appointment.customServicePrices?.[serviceName] ?? service?.price ?? 0);
                  }, 0);
                  const adjustment = appointment.price - calculatedSum;
                  
                  if (Math.abs(adjustment) > 0.01) {
                    return (
                      <li className="flex justify-between items-center text-slate-500 italic border-t border-dashed border-slate-200 pt-2 mt-2">
                        <span className="font-medium">Ajuste / Desconto</span>
                        <span className="font-bold">R$ {adjustment.toFixed(2)}</span>
                      </li>
                    );
                  }
                  return null;
                })()}
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

        <footer className="p-6 border-t border-slate-100 bg-slate-50 flex flex-wrap justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all">
            Fechar
          </button>
          <button 
            onClick={() => handleGenerateImage(false)} 
            className="px-6 py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isGeneratingImage}
          >
            {isGeneratingImage ? 'Gerando...' : 'Baixar Imagem'}
            {!isGeneratingImage && <Download size={20} />}
          </button>
          <button 
            onClick={() => handleGenerateImage(true)} 
            className="px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isGeneratingImage}
          >
            {isGeneratingImage ? 'Gerando...' : 'Enviar para Cliente'}
            {!isGeneratingImage && <Share2 size={20} />}
          </button>
        </footer>
      </motion.div>


    </div>
  );
};
