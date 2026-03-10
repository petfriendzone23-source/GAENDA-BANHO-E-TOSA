import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import { Appointment, AppData, ServiceReport } from '../types';
import { X, Download, Dog, PawPrint, Sparkles, Droplets, Wind, HeartPulse, Scissors, Share2, Copy, CheckCircle2, MessageCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportViewerProps {
  appointment: Appointment;
  data: AppData;
  onClose: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ appointment, data, onClose }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = React.useState(false);
  const pet = data.pets[appointment.clientId]?.find(p => p.id === appointment.petId);
  const client = data.clients.find(c => c.id === appointment.clientId);
  const report = appointment.report as ServiceReport;

  const getBlob = async () => {
    if (reportRef.current === null) return null;
    const dataUrl = await toPng(reportRef.current, { cacheBust: true, backgroundColor: '#ffffff', quality: 0.95 });
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const handleDownload = async () => {
    const blob = await getBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `relatorio-${pet?.name?.toLowerCase().replace(' ', '-')}-${appointment.date}.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    try {
      const blob = await getBlob();
      if (!blob) return;
      
      const file = new File([blob], `relatorio-${pet?.name}.png`, { type: 'image/png' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Relatório de Serviço - ${pet?.name}`,
          text: `Confira o relatório de serviço do ${pet?.name} na ${data.companyInfo.name}!`,
        });
      } else {
        // Fallback to copy if share is not available
        handleCopy();
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      const blob = await getBlob();
      if (!blob) return;
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      console.error('Erro ao copiar imagem:', err);
      alert('Não foi possível copiar a imagem automaticamente. Por favor, use o botão de baixar.');
    }
  };

  const handleWhatsAppShare = async () => {
    try {
      // 1. Copiar a imagem para a área de transferência
      const blob = await getBlob();
      if (!blob) return;
      
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);

      // 2. Abrir o WhatsApp do cliente
      const clientPhone = client?.phones && client.phones.length > 0 ? client.phones[0] : null;
      
      if (clientPhone) {
        let cleanPhone = clientPhone.replace(/\D/g, '');
        // Garantir que tenha o código do país (Brasil = 55)
        if (cleanPhone.length <= 11) {
          cleanPhone = `55${cleanPhone}`;
        }
        const whatsappUrl = `https://wa.me/${cleanPhone}`;
        window.open(whatsappUrl, '_blank');
      } else {
        alert('Cliente não possui número de telefone cadastrado.');
      }
    } catch (err) {
      console.error('Erro ao compartilhar no WhatsApp:', err);
      alert('Não foi possível automatizar o processo. A imagem foi baixada, por favor anexe-a manualmente no WhatsApp.');
      handleDownload();
    }
  };

  if (!report || !pet || !client) return null;

  const renderSection = (title: string, items: string[] | undefined, icon: React.ReactNode) => (
    items && items.length > 0 && (
      <div>
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{title}</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map(item => <span key={item} className="bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1 rounded-full">{item}</span>)}
        </div>
      </div>
    )
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-slate-50 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in-0 zoom-in-95">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-slate-800">Visualizar Relatório</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-6" ref={reportRef}>
            <div className="p-6 border-2 border-slate-200 rounded-xl bg-white">
              <header className="flex items-center justify-between pb-4 border-b-2 border-slate-100">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800">Relatório de Serviço</h2>
                  <p className="text-slate-500 font-medium">{data.companyInfo.name}</p>
                </div>
                <PawPrint size={32} className="text-blue-400" />
              </header>
              <div className="flex justify-between items-center pt-4 mb-6">
                <div>
                  <p className="text-sm font-bold text-slate-800">{pet.name}</p>
                  <p className="text-xs text-slate-500">Tutor: {client.name}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Data do Serviço</p>
                  <p className="text-xs text-slate-500 text-right">{format(parseISO(appointment.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
                </div>
              </div>

              <div className="space-y-5">
                {renderSection('Pele e Pelagem', report.skinAndCoat, <Sparkles size={16} className="text-blue-500" />)}
                {renderSection('Ouvidos', report.ears, <Dog size={16} className="text-blue-500" />)}
                {renderSection('Unhas', report.nails, <Scissors size={16} className="text-blue-500" />)}
                {renderSection('Ectoparasitas', report.ectoparasites, <PawPrint size={16} className="text-blue-500" />)}
                {renderSection('Produtos Utilizados', report.productsUsed, <Droplets size={16} className="text-blue-500" />)}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <HeartPulse size={16} className="text-blue-500" />
                    <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Comportamento</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <p className="text-slate-600">Nível de Estresse:</p><p className="font-bold text-slate-800 text-right">{report.stressLevel}</p>
                    <p className="text-slate-600">Água/Secador:</p><p className="font-bold text-slate-800 text-right">{report.waterAndDryerAcceptance}</p>
                  </div>
                </div>

                {report.notes && (
                  <div>
                    <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-2">Observações</h4>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">{report.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap justify-end gap-3 shrink-0">
          <button
            onClick={handleWhatsAppShare}
            className="py-2.5 px-5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
            title="Abrir WhatsApp e Copiar Imagem"
          >
            <MessageCircle size={18} />
            {isCopied ? 'Copiado! Abrindo...' : 'Enviar WhatsApp'}
          </button>
          <button
            onClick={handleShare}
            className="py-2.5 px-5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            title="Outras opções de compartilhamento"
          >
            <Share2 size={18} className="text-blue-500" />
            Outros
          </button>
          <button
            onClick={handleDownload}
            className="py-2.5 px-5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Download size={18} />
            Baixar
          </button>
        </div>
      </div>
    </div>
  );
};
