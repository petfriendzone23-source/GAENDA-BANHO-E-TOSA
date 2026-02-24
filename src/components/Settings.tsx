import React from 'react';
import { Minus, Plus, Type, MessageSquare, Trash2, Edit2, Save, X } from 'lucide-react';
import { AppData, WhatsAppTemplate } from '../types';

interface SettingsProps {
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
  data: AppData;
  onSaveData: (data: AppData) => void;
}

export const Settings: React.FC<SettingsProps> = ({ zoomLevel, setZoomLevel, data, onSaveData }) => {
  const [editingTemplate, setEditingTemplate] = React.useState<WhatsAppTemplate | null>(null);
  const [isAddingNew, setIsAddingNew] = React.useState(false);
  const [newTemplate, setNewTemplate] = React.useState<Partial<WhatsAppTemplate>>({ title: '', message: '' });

  const handleIncrease = () => {
    setZoomLevel(Math.min(zoomLevel + 6.25, 150)); // Max 150%
  };

  const handleDecrease = () => {
    setZoomLevel(Math.max(zoomLevel - 6.25, 75)); // Min 75%
  };

  const handleSaveTemplate = () => {
    if (!newTemplate.title || !newTemplate.message) return;

    const newData = { ...data };
    if (editingTemplate) {
      const index = newData.whatsappTemplates.findIndex(t => t.id === editingTemplate.id);
      if (index !== -1) {
        newData.whatsappTemplates[index] = { ...editingTemplate, ...newTemplate } as WhatsAppTemplate;
      }
    } else {
      const template: WhatsAppTemplate = {
        id: Math.random().toString(36).substr(2, 9),
        title: newTemplate.title,
        message: newTemplate.message
      };
      newData.whatsappTemplates.push(template);
    }

    onSaveData(newData);
    setEditingTemplate(null);
    setIsAddingNew(false);
    setNewTemplate({ title: '', message: '' });
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este modelo?')) {
      const newData = { ...data };
      newData.whatsappTemplates = newData.whatsappTemplates.filter(t => t.id !== id);
      onSaveData(newData);
    }
  };

  const startEditing = (template: WhatsAppTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({ title: template.title, message: template.message });
    setIsAddingNew(true);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 pb-24">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Configurações</h2>
        <p className="text-slate-500">Personalize sua experiência no aplicativo.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Type size={20} className="text-indigo-600" />
            Tamanho da Fonte e Visualização
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            Ajuste o tamanho do texto e dos elementos na tela para melhor leitura.
          </p>
        </div>

        <div className="p-8 flex flex-col items-center gap-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={handleDecrease}
              disabled={zoomLevel <= 75}
              className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Minus size={24} />
            </button>

            <div className="text-center min-w-[100px]">
              <span className="text-3xl font-bold text-slate-900">{Math.round((zoomLevel / 100) * 16)}px</span>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                {zoomLevel === 100 ? 'Padrão' : `${zoomLevel}%`}
              </p>
            </div>

            <button 
              onClick={handleIncrease}
              disabled={zoomLevel >= 150}
              className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-200"
            >
              <Plus size={24} />
            </button>
          </div>

          <div className="w-full max-w-md bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-center text-slate-600">
              Exemplo de texto: <br/>
              <span className="font-bold text-indigo-600">PetGroom</span> ajuda você a gerenciar seu negócio.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare size={20} className="text-emerald-600" />
              Modelos de Mensagem WhatsApp
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Crie mensagens pré-definidas para enviar aos clientes.
            </p>
          </div>
          {!isAddingNew && (
            <button 
              onClick={() => {
                setEditingTemplate(null);
                setNewTemplate({ title: '', message: '' });
                setIsAddingNew(true);
              }}
              className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 text-sm font-bold"
            >
              <Plus size={16} />
              Novo Modelo
            </button>
          )}
        </div>

        <div className="p-6 space-y-4">
          {isAddingNew && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900">{editingTemplate ? 'Editar Modelo' : 'Novo Modelo'}</h4>
                <button onClick={() => setIsAddingNew(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título do Modelo</label>
                  <input 
                    type="text" 
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                    placeholder="Ex: Lembrete de Agendamento"
                    className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mensagem</label>
                  <textarea 
                    value={newTemplate.message}
                    onChange={(e) => setNewTemplate({ ...newTemplate, message: e.target.value })}
                    placeholder="Olá! Gostaríamos de confirmar seu agendamento para..."
                    rows={4}
                    className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">Dica: Use a mensagem para agilizar o contato.</p>
                </div>
                <div className="flex justify-end pt-2">
                  <button 
                    onClick={handleSaveTemplate}
                    disabled={!newTemplate.title || !newTemplate.message}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Save size={16} />
                    Salvar Modelo
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {data.whatsappTemplates && data.whatsappTemplates.length > 0 ? (
              data.whatsappTemplates.map(template => (
                <div key={template.id} className="p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors group">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{template.title}</h4>
                      <p className="text-slate-500 text-sm mt-1 line-clamp-2">{template.message}</p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEditing(template)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              !isAddingNew && (
                <div className="text-center py-8 text-slate-400 italic">
                  Nenhum modelo de mensagem criado.
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
