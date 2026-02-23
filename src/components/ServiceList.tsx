import React from 'react';
import { Plus, Scissors, Edit2, Trash2, Save, X, DollarSign, Box } from 'lucide-react';
import { AppData, Service, Package } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { PackageList } from './PackageList';

interface ServiceListProps {
  data: AppData;
  onSaveService: (service: Service) => void;
  onDeleteService: (id: string) => void;
  onSavePackage: (pkg: Package) => void;
  onDeletePackage: (id: string) => void;
}

export const ServiceList: React.FC<ServiceListProps> = ({ 
  data, 
  onSaveService, 
  onDeleteService,
  onSavePackage,
  onDeletePackage
}) => {
  const [activeSubTab, setActiveSubTab] = React.useState<'services' | 'packages'>('services');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);
  
  // Form state
  const [name, setName] = React.useState('');
  const [price, setPrice] = React.useState<number>(0);

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setName(service.name);
    setPrice(service.price);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setName('');
    setPrice(0);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    
    onSaveService({
      id: editingId || Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      price: price
    });
    
    handleCancel();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-1">
        <button 
          onClick={() => setActiveSubTab('services')}
          className={cn(
            "pb-3 px-4 text-sm font-bold transition-all relative",
            activeSubTab === 'services' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <div className="flex items-center gap-2">
            <Scissors size={16} />
            Serviços Individuais
          </div>
          {activeSubTab === 'services' && (
            <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
          )}
        </button>
        <button 
          onClick={() => setActiveSubTab('packages')}
          className={cn(
            "pb-3 px-4 text-sm font-bold transition-all relative",
            activeSubTab === 'packages' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <div className="flex items-center gap-2">
            <Box size={16} />
            Pacotes
          </div>
          {activeSubTab === 'packages' && (
            <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
          )}
        </button>
      </div>

      {activeSubTab === 'services' ? (
        <>
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Serviços</h2>
              <p className="text-slate-500 mt-1">Gerencie os serviços oferecidos e seus respectivos valores.</p>
            </div>
            {!isAdding && !editingId && (
              <button 
                onClick={() => setIsAdding(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Novo Serviço
              </button>
            )}
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {(isAdding || editingId) && (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white p-6 rounded-2xl border-2 border-indigo-500 shadow-xl shadow-indigo-50"
                >
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Scissors size={18} className="text-indigo-600" />
                    {editingId ? 'Editar Serviço' : 'Novo Serviço'}
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Nome do Serviço</label>
                      <input 
                        autoFocus
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Ex: Banho Premium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Preço (R$)</label>
                      <div className="relative">
                        <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="number"
                          value={price}
                          onChange={e => setPrice(Number(e.target.value))}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={handleCancel}
                        className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleSave}
                        className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                      >
                        <Save size={18} />
                        Salvar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {data.services.map((service) => (
                editingId !== service.id && (
                  <motion.div
                    layout
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                        <Scissors size={24} />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(service)}
                          className="p-2 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => onDeleteService(service.id)}
                          className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{service.name}</h4>
                      <div className="flex items-center gap-1 text-indigo-600 font-bold mt-1">
                        <span className="text-sm">R$</span>
                        <span className="text-2xl">{service.price.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span>{data.appointments.filter(a => (a.services || []).includes(service.name)).length} agendamentos</span>
                    </div>
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <PackageList 
          data={data} 
          onSavePackage={onSavePackage} 
          onDeletePackage={onDeletePackage} 
        />
      )}
    </div>
  );
};
