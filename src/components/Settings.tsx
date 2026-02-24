import React from 'react';
import { Minus, Plus, Type } from 'lucide-react';

interface SettingsProps {
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
}

export const Settings: React.FC<SettingsProps> = ({ zoomLevel, setZoomLevel }) => {
  const handleIncrease = () => {
    setZoomLevel(Math.min(zoomLevel + 6.25, 150)); // Max 150%
  };

  const handleDecrease = () => {
    setZoomLevel(Math.max(zoomLevel - 6.25, 75)); // Min 75%
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
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
    </div>
  );
};
