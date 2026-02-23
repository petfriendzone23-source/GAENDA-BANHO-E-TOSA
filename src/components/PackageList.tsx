import React from 'react';
import { Plus, Box, Edit2, Trash2, Save, X, DollarSign, Check } from 'lucide-react';
import { AppData, Package, Service } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';

interface PackageListProps {
  data: AppData;
  onSavePackage: (pkg: Package) => void;
  onDeletePackage: (id: string) => void;
}

export const PackageList: React.FC<PackageListProps> = ({ data, onSavePackage, onDeletePackage }) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);
  
  // Form state
  const [name, setName] = React.useState('');
  const [price, setPrice] = React.useState<number>(0);
  const [selectedServiceIds, setSelectedServiceIds] = React.useState<string[]>([]);

  const handleEdit = (pkg: Package) => {
    setEditingId(pkg.id);
    setName(pkg.name);
    setPrice(pkg.price);
    setSelectedServiceIds(pkg.serviceIds);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setName('');
    setPrice(0);
    setSelectedServiceIds([]);
  };

  const handleSave = () => {
    if (!name.trim() || selectedServiceIds.length === 0) return;
    
    onSavePackage({
      id: editingId || Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      price: price,
      serviceIds: selectedServiceIds
    });
    
    handleCancel();
  };

  const toggleService = (id: string) => {
    const next = selectedServiceIds.includes(id)
      ? selectedServiceIds.filter(sid => sid !== id)
      : [...selectedServiceIds, id];
    setSelectedServiceIds(next);
    
    // Auto-calculate price based on sum of services (optional, user can override)
    const sum = next.reduce((acc, sid) => {
      const s = data.services.find(sv => sv.id === sid);
      return acc + (s?.price || 0);
    }, 0);
    setPrice(sum);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Pacotes</h2>
          <p className="text-slate-500 mt-1">Crie combos de serviços com preços especiais.</p>
        </div>
        {!isAdding && !editingId && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Novo Pacote
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
              className="bg-white p-6 rounded-2xl border-2 border-indigo-500 shadow-xl shadow-indigo-50 col-span-full md:col-span-2 lg:col-span-1"
            >
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Box size={18} className="text-indigo-600" />
                {editingId ? 'Editar Pacote' : 'Novo Pacote'}
              </h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Nome do Pacote</label>
                  <input 
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ex: Combo Mensal"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Serviços Inclusos</label>
                  <div className="flex flex-wrap gap-2">
                    {data.services.map(s => {
                      const isSelected = selectedServiceIds.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleService(s.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2",
                            isSelected 
                              ? "bg-indigo-600 border-indigo-600 text-white" 
                              : "bg-white border-slate-100 text-slate-500 hover:border-indigo-100"
                          )}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Preço do Pacote (R$)</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="number"
                      value={price}
                      onChange={e => setPrice(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-600"
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

          {data.packages.map((pkg) => (
            editingId !== pkg.id && (
              <motion.div
                layout
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                    <Box size={24} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(pkg)}
                      className="p-2 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => onDeletePackage(pkg.id)}
                      className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">{pkg.name}</h4>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {pkg.serviceIds.map(sid => {
                      const s = data.services.find(sv => sv.id === sid);
                      return (
                        <span key={sid} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-medium">
                          {s?.name || 'Serviço Removido'}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-1 text-indigo-600 font-bold mt-3">
                    <span className="text-sm">R$</span>
                    <span className="text-2xl">{pkg.price.toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
