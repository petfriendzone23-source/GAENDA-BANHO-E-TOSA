import React from 'react';
import { Appointment, Client, Pet, Service, Package, CompanyInfo } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toPng } from 'html-to-image';
import { Download, X, Share2 } from 'lucide-react';
import { motion } from 'motion/react';

interface PackageServiceNoteProps {
  appointment: Appointment;
  allAppointments: Appointment[];
  client: Client;
  pets: Pet[];
  allServices: Service[];
  allPackages: Package[];
  companyInfo: CompanyInfo;
  onClose: () => void;
}

export const PackageServiceNote: React.FC<PackageServiceNoteProps> = ({ 
  appointment, 
  allAppointments,
  client, 
  pets, 
  allServices, 
  allPackages, 
  companyInfo, 
  onClose 
}) => {
  const serviceNoteRef = React.useRef<HTMLDivElement>(null);
  const [isGeneratingImage, setIsGeneratingImage] = React.useState(false);

  const relevantPet = pets.find(p => p.id === appointment.petId);
  const relevantPackage = allPackages.find(p => p.id === appointment.packageId);

  const relatedAppointments = allAppointments
    .filter(a => a.clientId === appointment.clientId && a.petId === appointment.petId && a.packageId === appointment.packageId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let packageInstanceAppointments: Appointment[] = [];
  if (relevantPackage) {
    let startIndex = -1;
    for (let i = 0; i < relatedAppointments.length; i++) {
      if (relatedAppointments[i].id === appointment.id) {
        for (let j = i; j >= 0; j--) {
          if (relatedAppointments[j].price > 0) {
            startIndex = j;
            break;
          }
        }
        break;
      }
    }
    
    if (startIndex !== -1) {
      packageInstanceAppointments = relatedAppointments.slice(startIndex, startIndex + relevantPackage.sessions);
    } else {
      const index = relatedAppointments.findIndex(a => a.id === appointment.id);
      const start = Math.floor(index / relevantPackage.sessions) * relevantPackage.sessions;
      packageInstanceAppointments = relatedAppointments.slice(start, start + relevantPackage.sessions);
    }
  }

  if (packageInstanceAppointments.length === 0) {
    packageInstanceAppointments = [appointment];
  }

  const packageDays = packageInstanceAppointments.map(app => {
    const dayServices = (app.services || []).map(serviceName => {
      const service = allServices.find(s => s.name === serviceName);
      return {
        name: serviceName,
        price: service?.price || 0
      };
    });
    const dayTotal = dayServices.reduce((sum, s) => sum + s.price, 0);
    return {
      date: app.date,
      time: app.time,
      services: dayServices,
      dayTotal
    };
  });

  const totalFullPrice = packageDays.reduce((sum, day) => sum + day.dayTotal, 0);
  const packagePrice = packageInstanceAppointments.reduce((sum, app) => sum + (app.price || 0), 0);
  const discountAmount = Math.max(0, totalFullPrice - packagePrice);

  const handleGenerateImage = async (share = false) => {
    if (!serviceNoteRef.current) return;
    setIsGeneratingImage(true);
    console.log("Iniciando geração de imagem para pacote...");
    try {
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
        const file = new File([blob], `nota_pacote_${client.name.replace(/\s/g, '_')}.png`, { type: 'image/png' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Nota de Serviço (Pacote)',
            text: `Nota de serviço de pacote para ${relevantPet?.name}`,
          });
        } else {
          const link = document.createElement('a');
          link.download = `nota_pacote_${client.name.replace(/\s/g, '_')}.png`;
          link.href = dataUrl;
          link.click();
        }
      } else {
        const link = document.createElement('a');
        link.download = `nota_pacote_${client.name.replace(/\s/g, '_')}.png`;
        link.href = dataUrl;
        link.click();
      }
      console.log("Imagem de pacote gerada com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar imagem de pacote:", error);
      alert("Erro ao gerar imagem. Por favor, tente novamente.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  console.log("PackageServiceNote render:", { 
    petId: appointment.petId, 
    foundPet: !!relevantPet, 
    foundPackage: !!relevantPackage 
  });

  // Don't return null, show a message if data is missing
  if (!relevantPet || !relevantPackage) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Dados não encontrados</h2>
          <p className="text-slate-500 mb-6">
            Não foi possível carregar as informações do pet ou do pacote para este agendamento.
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
          <h2 className="text-xl font-bold">Nota de Serviço (Pacote)</h2>
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
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Pacote: {relevantPackage.name}</p>
              <div className="space-y-4">
                {packageDays.map((day, i) => (
                  <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200">
                      <span className="font-bold text-slate-700 text-sm">
                        Sessão {i + 1} - {format(parseISO(day.date), 'dd/MM/yyyy')} às {day.time}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">R$ {day.dayTotal.toFixed(2)}</span>
                    </div>
                    <ul className="space-y-1">
                      {day.services.map((service, j) => (
                        <li key={j} className="flex justify-between items-center text-slate-600 text-xs">
                          <span>{service.name}</span>
                          <span>R$ {service.price.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <p className="text-sm font-bold text-slate-500">Total dos Serviços (sem desconto)</p>
              <p className="text-base font-bold text-slate-500">R$ {totalFullPrice.toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm font-bold text-emerald-600">Desconto do Pacote</p>
              <p className="text-base font-bold text-emerald-600">- R$ {discountAmount.toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
              <p className="text-xl font-bold text-slate-900">Valor Final do Pacote</p>
              <p className="text-2xl font-bold text-indigo-600">R$ {packagePrice.toFixed(2)}</p>
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
