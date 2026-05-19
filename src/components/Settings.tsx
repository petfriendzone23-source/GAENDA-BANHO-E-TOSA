import React from 'react';
import { 
  Minus, 
  Plus, 
  Type, 
  MessageSquare, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Building2, 
  LogOut, 
  Clock, 
  Upload, 
  Image as ImageIcon,
  Database,
  Download,
  FileJson,
  ChevronDown,
  ChevronUp,
  Smartphone
} from 'lucide-react';
import { AppData, WhatsAppTemplate, CompanyInfo } from '../types';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUpload } from './ImageUpload';
import { cn } from '../utils/cn';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

interface SettingsProps {
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
  data: AppData;
  onSaveData: (data: AppData) => void;
  onSaveTemplate: (template: WhatsAppTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onRestoreBackup?: (data: AppData) => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({ 
  zoomLevel, 
  setZoomLevel, 
  data, 
  onSaveData,
  onSaveTemplate,
  onDeleteTemplate,
  onRestoreBackup
}) => {
  const [editingTemplate, setEditingTemplate] = React.useState<WhatsAppTemplate | null>(null);
  const [isAddingNew, setIsAddingNew] = React.useState(false);
  const [newTemplate, setNewTemplate] = React.useState<Partial<WhatsAppTemplate>>({ title: '', message: '' });
  const [companyInfo, setCompanyInfo] = React.useState<CompanyInfo>(data.companyInfo);
  const [isEditingCompany, setIsEditingCompany] = React.useState(false);
  const [openSection, setOpenSection] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const backupInputRef = React.useRef<HTMLInputElement>(null);
  
  const { deferredPrompt, promptInstall } = useInstallPrompt();

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

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

  const handleLogoUpload = (url: string) => {
    setCompanyInfo({ ...companyInfo, logoUrl: url });
  };

  const handleCreateBackup = () => {
    const backupData = JSON.stringify(data, null, 2);
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pet-friends-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm('ATENÇÃO: Restaurar um backup irá substituir TODOS os dados atuais (agendamentos, clientes, pets, serviços, etc). Esta ação não pode ser desfeita. Deseja continuar?')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const restoredData = JSON.parse(event.target?.result as string);
          
          // Basic validation
          if (!restoredData.clients || !restoredData.appointments) {
            throw new Error('Arquivo de backup inválido.');
          }

          if (onRestoreBackup) {
            await onRestoreBackup(restoredData);
            alert('Backup restaurado com sucesso! O aplicativo será atualizado.');
          } else {
            // Fallback if onRestoreBackup is not provided
            onSaveData(restoredData);
            alert('Backup carregado. Algumas informações podem levar um tempo para sincronizar.');
          }
        } catch (err) {
          console.error('Erro ao restaurar backup:', err);
          alert('Erro ao processar o arquivo de backup. Verifique se o arquivo é um JSON válido exportado por este aplicativo.');
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
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
    <div className="max-w-2xl mx-auto p-6 space-y-4 pb-24">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Configurações</h2>
        <p className="text-slate-500">Personalize sua experiência no aplicativo.</p>
      </div>

      {/* 1. Logotipo da Empresa */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <button 
          onClick={() => toggleSection('logo')}
          className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ImageIcon size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-slate-900">Logotipo da Empresa</h3>
              <p className="text-slate-500 text-xs">Altere a imagem da sua marca</p>
            </div>
          </div>
          {openSection === 'logo' ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
        </button>

        <AnimatePresence>
          {openSection === 'logo' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-8 border-t border-slate-100 flex flex-col items-center gap-6">
                <ImageUpload 
                  onUpload={handleLogoUpload}
                  currentImageUrl={companyInfo.logoUrl || data.companyInfo.logoUrl}
                  folder="logos"
                  className="w-full"
                />
                {(companyInfo.logoUrl !== data.companyInfo.logoUrl) && (
                  <button 
                    onClick={handleSaveCompanyInfo}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-100"
                  >
                    <Save size={18} />
                    Salvar Novo Logo
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 2. Informações da Empresa */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <button 
          onClick={() => toggleSection('info')}
          className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Building2 size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-slate-900">Informações da Empresa</h3>
              <p className="text-slate-500 text-xs">Nome, endereço e contato</p>
            </div>
          </div>
          {openSection === 'info' ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
        </button>

        <AnimatePresence>
          {openSection === 'info' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-6 border-t border-slate-100 space-y-4">
                <div className="flex justify-end">
                  {!isEditingCompany && (
                    <button 
                      onClick={() => setIsEditingCompany(true)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                </div>
                {isEditingCompany ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Nome da Empresa</label>
                      <input 
                        type="text" 
                        value={companyInfo.name}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Endereço</label>
                      <input 
                        type="text" 
                        value={companyInfo.address}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Telefone</label>
                      <input 
                        type="text" 
                        value={companyInfo.phone}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={handleSaveCompanyInfo}
                        className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Save size={18} /> Salvar
                      </button>
                      <button 
                        onClick={() => {
                          setCompanyInfo(data.companyInfo);
                          setIsEditingCompany(false);
                        }}
                        className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <X size={18} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Nome</p>
                      <p className="font-medium text-slate-700">{data.companyInfo.name}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Telefone</p>
                      <p className="font-medium text-slate-700">{data.companyInfo.phone}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl md:col-span-2">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Endereço</p>
                      <p className="font-medium text-slate-700">{data.companyInfo.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 3. Horário de Funcionamento */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <button 
          onClick={() => toggleSection('hours')}
          className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Clock size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-slate-900">Horário de Funcionamento</h3>
              <p className="text-slate-500 text-xs">Defina seus horários de atendimento</p>
            </div>
          </div>
          {openSection === 'hours' ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
        </button>

        <AnimatePresence>
          {openSection === 'hours' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-6 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Abertura</label>
                    <input 
                      type="time" 
                      value={companyInfo.workingHours.start}
                      onChange={(e) => setCompanyInfo({
                        ...companyInfo,
                        workingHours: { ...companyInfo.workingHours, start: e.target.value }
                      })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Fechamento</label>
                    <input 
                      type="time" 
                      value={companyInfo.workingHours.end}
                      onChange={(e) => setCompanyInfo({
                        ...companyInfo,
                        workingHours: { ...companyInfo.workingHours, end: e.target.value }
                      })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                {(companyInfo.workingHours.start !== data.companyInfo.workingHours.start || 
                  companyInfo.workingHours.end !== data.companyInfo.workingHours.end) && (
                  <button 
                    onClick={handleSaveCompanyInfo}
                    className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> Salvar Horários
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 4. Tamanho da Fonte */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <button 
          onClick={() => toggleSection('font')}
          className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Type size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-slate-900">Aparência</h3>
              <p className="text-slate-500 text-xs">Ajuste o tamanho da fonte e tema do sistema</p>
            </div>
          </div>
          {openSection === 'font' ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
        </button>

        <AnimatePresence>
          {openSection === 'font' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-6 border-t border-slate-100 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-3 block">Escala da Interface</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={handleDecrease}
                        className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        title="Diminuir"
                      >
                        <Minus size={20} />
                      </button>
                      <div className="text-center min-w-[80px]">
                        <span className="text-2xl font-bold text-indigo-600">{Math.round(zoomLevel)}%</span>
                      </div>
                      <button 
                        onClick={handleIncrease}
                        className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        title="Aumentar"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    <button 
                      onClick={() => setZoomLevel(100)}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Resetar
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 block">Modo Noturno</h4>
                      <p className="text-xs text-slate-500 mt-1">Ativar tema escuro no sistema</p>
                    </div>
                    <button
                      onClick={() => {
                        const newSettings = { ...data.settings, darkMode: !data.settings?.darkMode };
                        onSaveData({ ...data, settings: newSettings });
                      }}
                      className={cn(
                        "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
                        data.settings?.darkMode ? "bg-indigo-600" : "bg-slate-200"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                          data.settings?.darkMode ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Exemplo de Visualização</p>
                  <p className="text-slate-700">
                    Este é um texto de exemplo para você ver como o tamanho da fonte afeta a leitura no Pet Friends Zone.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 5. Modelos de WhatsApp */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <button 
          onClick={() => toggleSection('whatsapp')}
          className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <MessageSquare size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-slate-900">Modelos de WhatsApp</h3>
              <p className="text-slate-500 text-xs">Mensagens rápidas para clientes</p>
            </div>
          </div>
          {openSection === 'whatsapp' ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
        </button>

        <AnimatePresence>
          {openSection === 'whatsapp' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-6 border-t border-slate-100 space-y-4">
                <div className="flex justify-end">
                  {!isAddingNew && (
                    <button 
                      onClick={() => {
                        setIsAddingNew(true);
                        setEditingTemplate(null);
                        setNewTemplate({ title: '', message: '' });
                      }}
                      className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  )}
                </div>
                {isAddingNew && (
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-indigo-900">{editingTemplate ? 'Editar Modelo' : 'Novo Modelo'}</h4>
                      <button onClick={() => setIsAddingNew(false)} className="text-indigo-400 hover:text-indigo-600">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="Título do Modelo (ex: Lembrete de Banho)"
                        value={newTemplate.title}
                        onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <textarea 
                        placeholder="Mensagem... Use {cliente}, {pet}, {data}, {hora} como variáveis."
                        value={newTemplate.message}
                        onChange={(e) => setNewTemplate({ ...newTemplate, message: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                      <button 
                        onClick={handleSaveTemplate}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Save size={18} /> Salvar Modelo
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  {data.whatsappTemplates.map((template) => (
                    <div key={template.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-900">{template.title}</h4>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => startEditing(template)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2">{template.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 6. Instalação do Aplicativo */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <button 
          onClick={() => toggleSection('install')}
          className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Smartphone size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-slate-900">Instalar Aplicativo</h3>
              <p className="text-slate-500 text-xs">Instale no seu dispositivo para acesso rápido</p>
            </div>
          </div>
          {openSection === 'install' ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
        </button>

        <AnimatePresence>
          {openSection === 'install' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-6 border-t border-slate-100">
                <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <h4 className="font-bold text-slate-900">Pet Friends Zone</h4>
                    <p className="text-sm text-slate-600">
                      Instale nosso aplicativo no seu celular ou computador para uma experiência mais rápida, acesso offline aos dados em cache e um ícone direto na sua tela inicial.
                    </p>
                  </div>
                  <div>
                    {deferredPrompt ? (
                      <button 
                        onClick={promptInstall}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center gap-2 whitespace-nowrap"
                      >
                        <Smartphone size={20} /> Instalar Agora
                      </button>
                    ) : (
                      <div className="px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-medium border border-emerald-100 text-sm text-center">
                        <p>App já instalado<br/>ou navegador incompatível</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 7. Backup do Sistema */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <button 
          onClick={() => toggleSection('backup')}
          className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Database size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-slate-900">Backup e Restauração</h3>
              <p className="text-slate-500 text-xs">Segurança dos seus dados</p>
            </div>
          </div>
          {openSection === 'backup' ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
        </button>

        <AnimatePresence>
          {openSection === 'backup' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-6 border-t border-slate-100">
                <p className="text-slate-500 text-sm mb-4">
                  Mantenha seus dados seguros exportando um backup ou restaurando um anterior.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={handleCreateBackup}
                    className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 mb-3 transition-colors">
                      <Download size={24} />
                    </div>
                    <span className="font-bold text-slate-700 group-hover:text-indigo-900">Criar Backup</span>
                    <span className="text-xs text-slate-400 mt-1">Exportar dados para JSON</span>
                  </button>

                  <button 
                    onClick={() => backupInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:bg-amber-50 hover:border-amber-200 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-amber-600 mb-3 transition-colors">
                      <FileJson size={24} />
                    </div>
                    <span className="font-bold text-slate-700 group-hover:text-amber-900">Restaurar Backup</span>
                    <span className="text-xs text-slate-400 mt-1">Importar arquivo JSON</span>
                  </button>
                  <input 
                    type="file" 
                    ref={backupInputRef} 
                    onChange={handleRestoreBackup} 
                    accept=".json" 
                    className="hidden" 
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 7. Sair do Sistema */}
      <section className="pt-4">
        <button 
          onClick={handleLogout}
          className="w-full p-4 bg-rose-50 text-rose-600 rounded-2xl font-bold hover:bg-rose-100 transition-all flex items-center justify-center gap-2 border border-rose-100"
        >
          <LogOut size={20} />
          Sair do Sistema
        </button>
        <div className="text-center mt-6">
          <p className="text-slate-400 text-xs font-medium">Pet Friends Zone v1.0.0</p>
        </div>
      </section>
    </div>
  );
};
