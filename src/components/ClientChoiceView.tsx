import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { Appointment, Product, AppData, ClientChoices } from '../types';
import { motion } from 'motion/react';
import { Check, Loader2, ShoppingBag, Sparkles, Wind, Flower } from 'lucide-react';

interface ClientChoiceViewProps {
  appointmentId: string;
  adminUid: string;
}

export const ClientChoiceView: React.FC<ClientChoiceViewProps> = ({ appointmentId, adminUid }) => {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [choices, setChoices] = useState<ClientChoices>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch appointment
        const appDoc = await getDoc(doc(db, `users/${adminUid}/appointments`, appointmentId));
        if (appDoc.exists()) {
          const appData = appDoc.data() as Appointment;
          setAppointment({ id: appDoc.id, ...appData });
          setChoices(appData.clientChoices || {});
        }

        // Fetch products
        const unsubProducts = onSnapshot(doc(db, `users/${adminUid}/settings`, 'companyInfo'), () => {
          // Just to trigger if needed, but we need the products collection
        });

        // Actually we need the products collection
        const productsRef = doc(db, `users/${adminUid}/settings`, 'products'); // Wait, products is a collection
        // Let's use a simple getDoc for now or a proper listener if we want real-time
      } catch (err) {
        console.error('Error fetching choice data:', err);
      } finally {
        setLoading(false);
      }
    };

    // Real-time listener for products
    const productsUnsub = onSnapshot(
      doc(db, `users/${adminUid}/settings`, 'products'), // This is wrong, it's a collection
      () => {}
    );
    
    // Correct way to fetch collection in this context without full AppData sync
    // I'll just use a simpler approach: fetch them once
    const fetchProducts = async () => {
      const { collection, getDocs } = await import('firebase/firestore');
      const querySnapshot = await getDocs(collection(db, `users/${adminUid}/products`));
      const prods = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setProducts(prods.filter(p => p.isAvailable));
    };

    fetchData();
    fetchProducts();
  }, [appointmentId, adminUid]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, `users/${adminUid}/appointments`, appointmentId), {
        clientChoices: choices
      });
      setSuccess(true);
    } catch (err) {
      console.error('Error saving choices:', err);
      alert('Erro ao salvar suas escolhas. Por favor, tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Inválido</h1>
          <p className="text-slate-600">Não conseguimos encontrar este agendamento.</p>
        </div>
      </div>
    );
  }

  const bandanas = products.filter(p => p.type === 'bandana');
  const bows = products.filter(p => p.type === 'laço');
  const perfumes = products.filter(p => p.type === 'perfume');

  if (success) {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4 text-center text-white">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md"
        >
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black mb-4 uppercase tracking-tight">Tudo Pronto!</h1>
          <p className="text-indigo-100 text-lg mb-8">
            Suas escolhas foram enviadas com sucesso. Mal podemos esperar para ver seu pet!
          </p>
          <button 
            onClick={() => setSuccess(false)}
            className="px-8 py-3 bg-white text-indigo-600 font-bold rounded-2xl shadow-xl hover:bg-indigo-50 transition-colors"
          >
            Editar Escolhas
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <Sparkles size={20} />
            </div>
            <h1 className="font-black text-slate-900 uppercase tracking-tight">Personalize o Banho</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-12">
        <section>
          <div className="flex items-center gap-2 mb-6 text-indigo-600">
            <ShoppingBag size={20} />
            <h2 className="text-xl font-black uppercase tracking-tight">1. Escolha a Bandana</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {bandanas.map(p => (
              <button
                key={p.id}
                onClick={() => setChoices(prev => ({ ...prev, bandanaId: p.id }))}
                className={`relative group text-left p-3 rounded-3xl border-2 transition-all duration-300 ${
                  choices.bandanaId === p.id 
                    ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-600/10' 
                    : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <div className="aspect-square rounded-2xl overflow-hidden mb-3 bg-slate-100">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Sparkles size={32} />
                    </div>
                  )}
                </div>
                <p className="font-bold text-slate-900 text-sm truncate">{p.name}</p>
                {choices.bandanaId === p.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6 text-pink-500">
            <Flower size={20} />
            <h2 className="text-xl font-black uppercase tracking-tight">2. Escolha o Laço</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {bows.map(p => (
              <button
                key={p.id}
                onClick={() => setChoices(prev => ({ ...prev, bowId: p.id }))}
                className={`relative group text-left p-3 rounded-3xl border-2 transition-all duration-300 ${
                  choices.bowId === p.id 
                    ? 'border-pink-500 bg-pink-50/50 ring-4 ring-pink-500/10' 
                    : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <div className="aspect-square rounded-2xl overflow-hidden mb-3 bg-slate-100">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Flower size={32} />
                    </div>
                  )}
                </div>
                <p className="font-bold text-slate-900 text-sm truncate">{p.name}</p>
                {choices.bowId === p.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6 text-emerald-500">
            <Wind size={20} />
            <h2 className="text-xl font-black uppercase tracking-tight">3. Escolha o Perfume</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {perfumes.map(p => (
              <button
                key={p.id}
                onClick={() => setChoices(prev => ({ ...prev, perfumeId: p.id }))}
                className={`relative group text-left p-3 rounded-3xl border-2 transition-all duration-300 ${
                  choices.perfumeId === p.id 
                    ? 'border-emerald-500 bg-emerald-50/50 ring-4 ring-emerald-500/10' 
                    : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <div className="aspect-square rounded-2xl overflow-hidden mb-3 bg-slate-100">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Wind size={32} />
                    </div>
                  )}
                </div>
                <p className="font-bold text-slate-900 text-sm truncate">{p.name}</p>
                {choices.perfumeId === p.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-20">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Salvando...
              </>
            ) : (
              'Confirmar Escolhas'
            )}
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-bold">
            Powered by Pet Friends Zone
          </p>
        </div>
      </div>
    </div>
  );
};
