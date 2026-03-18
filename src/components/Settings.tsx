import React from 'react';
import { Minus, Plus, Type, MessageSquare, Trash2, Edit2, Save, X, Building2, LogOut, Clock, Upload, Image as ImageIcon } from 'lucide-react';
import { AppData, WhatsAppTemplate, CompanyInfo } from '../types';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface SettingsProps {
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
  data: AppData;
  onSaveData: (data: AppData) => void;
  onSaveTemplate: (template: WhatsAppTemplate) => void;
  onDeleteTemplate: (id: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  zoomLevel, 
  setZoomLevel, 
  data, 
  onSaveData,
  onSaveTemplate,
  onDeleteTemplate
}) => {
  const [editingTemplate, setEditingTemplate] = React.useState<WhatsAppTemplate | null>(null);
  const [isAddingNew, setIsAddingNew] = React.useState(false);
  const [newTemplate, setNewTemplate] = React.useState<Partial<WhatsAppTemplate>>({ title: '', message: '' });
  const [companyInfo, setCompanyInfo] = React.useState<CompanyInfo>(data.companyInfo);
  const [isEditingCompany, setIsEditingCompany] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleIncrease = () => {
    setZoomLevel(Math.min(zoomLevel + 6.25, 150)); // Max 150%
  };

  const handleDecrease = () => {
    setZoomLevel(Math.max(zoomLevel - 6.25, 75)); // Min 75%
  };

  const handleSaveTemplate = () => {
    if (!newTemplate.title || !newTemplate.message) return;

    const template: WhatsAppTemplate = {
      id: editingTemplate?.id || `temp_${Math.random().toString(36).substr(2, 9)}`,
      title: newTemplate.title as string,
      message: newTemplate.message as string
    };

    onSaveTemplate(template);
    setEditingTemplate(null);
    setIsAddingNew(false);
    setNewTemplate({ title: '', message: '' });
  };

  const handleSaveCompanyInfo = () => {
    const newData = { ...data, companyInfo };
    onSaveData(newData);
    setIsEditingCompany(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64
        alert('A imagem é muito grande. Por favor, escolha uma imagem menor que 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyInfo({ ...companyInfo, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este modelo?')) {
      onDeleteTemplate(id);
    }
  };

  const startEditing = (template: WhatsAppTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({ title: template.title, message: template.message });
    setIsAddingNew(true);
  };

  const handleLogout = async () => {
    if (window.confirm('Deseja realmente sair do sistema?')) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Erro ao sair:', err);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 pb-24">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Configurações</h2>
        <p className="text-slate-500">Personalize sua experiência no aplicativo.</p>
      </div>

      {/* Logo Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon size={20} className="text-indigo-600" />
            Logotipo da Empresa
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            Este logo aparecerá no cabeçalho e na tela de login.
          </p>
        </div>
        <div className="p-8 flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
              {companyInfo.logoUrl || data.companyInfo.logoUrl ? (
                <img 
                  src={companyInfo.logoUrl || data.companyInfo.logoUrl} 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <img 
                  src="/logo.png" 
                  alt="Logo Padrão" 
                  className="w-full h-full object-contain opacity-50"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-2xl"
            >
              <Upload size={24} />
              <span className="text-xs font-bold mt-1">Alterar</span>
            </button>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleLogoUpload} 
            accept="image/*" 
            className="hidden" 
          />
          {(companyInfo.logoUrl !== data.companyInfo.logoUrl) && (
            <button 
              onClick={handleSaveCompanyInfo}
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Save size={18} />
              Salvar Novo Logo
            </button>
          )}
        </div>
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
              <span className="font-bold text-indigo-600">Pet Friends Zone</span> ajuda você a gerenciar seu negócio.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock size={20} className="text-amber-600" />
              Horário de Funcionamento
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Defina o horário de abertura e fechamento da sua loja.
            </p>
          </div>
          {!isEditingCompany && (
            <button 
              onClick={() => setIsEditingCompany(true)}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
            >
              <Edit2 size={16} />
              Editar
            </button>
          )}
        </div>

        <div className="p-6">
          {isEditingCompany ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Horário de Abertura</label>
                  <input 
                    type="time" 
                    value={companyInfo.workingHours?.start || '08:00'}
                    onChange={(e) => setCompanyInfo({ 
                      ...companyInfo, 
                      workingHours: { ...companyInfo.workingHours, start: e.target.value } 
                    })}
                    className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Horário de Fechamento</label>
                  <input 
                    type="time" 
                    value={companyInfo.workingHours?.end || '18:00'}
                    onChange={(e) => setCompanyInfo({ 
                      ...companyInfo, 
                      workingHours: { ...companyInfo.workingHours, end: e.target.value } 
                    })}
                    className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => {
                    setCompanyInfo(data.companyInfo);
                    setIsEditingCompany(false);
                  }}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveCompanyInfo}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Save size={16} />
                  Salvar Alterações
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Abertura</p>
                <p className="font-bold text-slate-900 mt-1">{data.companyInfo.workingHours?.start || '08:00'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Fechamento</p>
                <p className="font-bold text-slate-900 mt-1">{data.companyInfo.workingHours?.end || '18:00'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 size={20} className="text-blue-600" />
              Informações da Empresa
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Estes dados aparecerão nas notas de serviço geradas.
            </p>
          </div>
          {!isEditingCompany && (
            <button 
              onClick={() => setIsEditingCompany(true)}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
            >
              <Edit2 size={16} />
              Editar
            </button>
          )}
        </div>

        <div className="p-6">
          {isEditingCompany ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Loja</label>
                  <input 
                    type="text" 
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                    className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone</label>
                  <input 
                    type="text" 
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                    className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Endereço</label>
                <input 
                  type="text" 
                  value={companyInfo.address}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                  className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => {
                    setCompanyInfo(data.companyInfo);
                    setIsEditingCompany(false);
                  }}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveCompanyInfo}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Save size={16} />
                  Salvar Alterações
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Nome da Loja</p>
                <p className="font-bold text-slate-900 mt-1">{data.companyInfo.name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Telefone</p>
                <p className="font-bold text-slate-900 mt-1">{data.companyInfo.phone}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Endereço</p>
                <p className="font-bold text-slate-900 mt-1">{data.companyInfo.address}</p>
              </div>
            </div>
          )}
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
                    placeholder="Olá {nome}! Gostaríamos de confirmar o agendamento do {pet}..."
                    rows={4}
                    className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                  <div className="text-xs text-slate-500 mt-2 p-2 bg-slate-100 rounded-lg border border-slate-200">
                    <span className="font-bold">Variáveis disponíveis:</span>
                    <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                      <code className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">{'{nome}'}</code>
                      <code className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">{'{pet}'}</code>
                      <code className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">{'{serviço}'}</code>
                      <code className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">{'{data}'}</code>
                      <code className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">{'{horas}'}</code>
                    </div>
                  </div>
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

      <div className="pt-4">
        <button 
          onClick={handleLogout}
          className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold hover:bg-rose-100 transition-all flex items-center justify-center gap-2 border border-rose-100 shadow-sm"
        >
          <LogOut size={20} />
          Sair do Sistema
        </button>
        <p className="text-center text-slate-400 text-xs mt-4">
          Pet Friends Zone v1.0.0 • Versão PWA instalável
        </p>
      </div>
    </div>
  );
};
