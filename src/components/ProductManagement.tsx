import React, { useState } from 'react';
import { Product, AppData } from '../types';
import { Plus, Trash2, Image as ImageIcon, Check, X, Tag, Package, Wind, Flower, Sparkles, Edit2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageUpload } from './ImageUpload';

interface ProductManagementProps {
  data: AppData;
  onSave: (product: Partial<Product>) => void;
  onDelete: (id: string) => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({ data, onSave, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    type: 'bandana',
    imageUrl: '',
    isAvailable: true
  });

  const handleSave = async () => {
    if (!formData.name || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(formData);
      setFormData({ name: '', type: 'bandana', imageUrl: '', isAvailable: true });
      setIsAdding(false);
      setEditingId(null);
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (product: Product) => {
    setFormData(product);
    setEditingId(product.id);
    setIsAdding(true);
  };

  const productTypes = [
    { id: 'bandana', label: 'Bandana', icon: Sparkles, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'laço', label: 'Laço', icon: Flower, color: 'text-pink-500', bg: 'bg-pink-50' },
    { id: 'perfume', label: 'Perfume', icon: Wind, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Gestão de Acessórios</h2>
          <p className="text-slate-500 mt-1">Gerencie bandanas, laços e perfumes para seus clientes.</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setEditingId(null);
            setFormData({ name: '', type: 'bandana', imageUrl: '', isAvailable: true });
          }}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </header>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Produto</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Bandana Xadrez Azul"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {productTypes.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.id as Product['type'] })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                          formData.type === type.id 
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                            : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        <type.icon size={20} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Foto do Produto</label>
                  <ImageUpload 
                    onUpload={(url) => setFormData({ ...formData, imageUrl: url })}
                    currentImageUrl={formData.imageUrl}
                    folder="products"
                  />
                  <p className="text-[10px] text-slate-400 italic ml-1">
                    Dica: Se o upload falhar, você pode colar o link direto da imagem.
                  </p>
                </div>

              <div className="flex flex-col justify-end gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Check size={20} />
                  )}
                  {isSaving ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Adicionar Produto')}
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.products?.map(product => {
          const typeInfo = productTypes.find(t => t.id === product.type)!;
          return (
            <motion.div
              layout
              key={product.id}
              className="bg-white group rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="aspect-square relative bg-slate-50">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <typeInfo.icon size={64} />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <div className={`${typeInfo.bg} ${typeInfo.color} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-white/50 backdrop-blur-md`}>
                    {typeInfo.label}
                  </div>
                </div>
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(product)}
                    className="p-2 bg-white/90 backdrop-blur-md text-slate-600 rounded-xl shadow-lg hover:text-indigo-600 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(product.id)}
                    className="p-2 bg-white/90 backdrop-blur-md text-slate-600 rounded-xl shadow-lg hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <h4 className="font-bold text-slate-900 leading-tight">{product.name}</h4>
                  <button
                    onClick={() => onSave({ ...product, isAvailable: !product.isAvailable })}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                      product.isAvailable 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-red-50 text-red-600 border border-red-100'
                    }`}
                  >
                    {product.isAvailable ? 'Disponível' : 'Esgotado'}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {(!data.products || data.products.length === 0) && !isAdding && (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
          <Package size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-900">Nenhum produto cadastrado</h3>
          <p className="text-slate-500 mt-1">Comece adicionando bandanas, laços ou perfumes.</p>
          <button
            onClick={() => setIsAdding(true)}
            className="mt-6 px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            Adicionar Primeiro Produto
          </button>
        </div>
      )}
    </div>
  );
};
