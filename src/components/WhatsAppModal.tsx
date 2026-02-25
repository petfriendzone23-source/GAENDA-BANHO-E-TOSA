import React, { useState, useEffect } from 'react';
import { AppData, Appointment, WhatsAppTemplate } from '../types';
import { X, MessageCircle, Copy, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  data: AppData;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isOpen, onClose, appointment, data }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [message, setMessage] = useState('');

  const client = data.clients.find(c => c.id === appointment.clientId);
  const pet = data.pets[appointment.clientId]?.find(p => p.id === appointment.petId);
  
  // Default templates if none exist
  const defaultTemplates: WhatsAppTemplate[] = [
    {
      id: 'temp_1',
      name: 'Lembrete de Agendamento',
      content: 'Olá {nome}, passando para lembrar do agendamento do {pet} para {servico} no dia {data} às {hora}. Podemos confirmar?'
    },
    {
      id: 'temp_2',
      name: 'Agendamento Confirmado',
      content: 'Oi {nome}! O agendamento do {pet} para {servico} está confirmado para {data} às {hora}. Até lá!'
    },
    {
      id: 'temp_3',
      name: 'Aviso de Atraso',
      content: 'Olá {nome}, notamos que o {pet} ainda não chegou para o agendamento de {hora}. Está tudo bem?'
    },
    {
      id: 'temp_4',
      name: 'Serviço Concluído',
      content: 'Oie {nome}! O {pet} já está pronto e ficou lindo! Pode vir buscar quando quiser. 🥰'
    }
  ];

  const templates = data.whatsappTemplates && data.whatsappTemplates.length > 0 
    ? data.whatsappTemplates 
    : defaultTemplates;

  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  useEffect(() => {
    if (selectedTemplateId && client && pet) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        let formattedMessage = template.content;
        
        // Replace placeholders
        formattedMessage = formattedMessage.replace(/{nome}/g, client.name.split(' ')[0]);
        formattedMessage = formattedMessage.replace(/{pet}/g, pet.name);
        formattedMessage = formattedMessage.replace(/{servico}/g, (appointment.services || []).join(', '));
        formattedMessage = formattedMessage.replace(/{data}/g, format(parseISO(appointment.date), 'dd/MM', { locale: ptBR }));
        formattedMessage = formattedMessage.replace(/{hora}/g, appointment.time);
        
        setMessage(formattedMessage);
      }
    }
  }, [selectedTemplateId, appointment, client, pet, templates]);

  if (!isOpen || !client) return null;

  const handleSend = () => {
    const phone = client.phones[0].replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/55${phone}?text=${encodedMessage}`, '_blank');
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    alert('Mensagem copiada para a área de transferência!');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              <MessageCircle size={18} />
            </div>
            <h3 className="font-bold text-slate-900">Enviar Mensagem</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Selecione o Modelo</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-green-500 outline-none"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none resize-none text-sm"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500 mb-1 font-bold uppercase">Destinatário</p>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900">{client.name}</p>
                <p className="text-xs text-slate-500">{client.phones[0]}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <Copy size={18} />
            Copiar
          </button>
          <button
            onClick={handleSend}
            className="flex-1 py-2.5 px-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink size={18} />
            Abrir WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
