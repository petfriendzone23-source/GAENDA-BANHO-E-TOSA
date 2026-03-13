import React, { useState } from 'react';
import { Appointment, ServiceReport, AppData } from '../types';
import { X, Save, FileText } from 'lucide-react';
import { MultiSelect } from './MultiSelect';

interface ServiceReportFormProps {
  appointment: Appointment;
  serviceName: string;
  data: AppData;
  onSave: (report: ServiceReport) => void;
  onClose: () => void;
}

const reportOptions = {
  skinAndCoat: ['Sem alteração', 'Presença de nós', 'Vermelhidão/Alergias', 'Ferimentos'],
  ears: ['Limpos', 'Excesso de cera', 'Odor forte'],
  nails: ['Cortadas', 'Lixadas', 'Já estavam curtas'],
  ectoparasites: ['Nenhum encontrado', 'Presença de pulgas', 'Presença de carrapatos'],
  productsUsed: [
    'Shampoo Neutralizador de Odores',
    'Shampoo Neutro',
    'Pré-shampoo',
    'Condicionador',
    'Branqueador',
    'Shampoo Liso Intenso',
    'Creme de Hidratação',
    'Finalizador',
    'Perfume',
  ],
};

export const ServiceReportForm: React.FC<ServiceReportFormProps> = ({ appointment, serviceName, data, onSave, onClose }) => {
  const [report, setReport] = useState<ServiceReport>(appointment.reports?.[serviceName] || {
    skinAndCoat: [],
    ears: [],
    nails: [],
    ectoparasites: [],
    productsUsed: [],
    stressLevel: 'Calmo',
    waterAndDryerAcceptance: 'Boa',
    notes: '',
  });

  const pet = data.pets[appointment.clientId]?.find(p => p.id === appointment.petId);

  const handleSave = () => {
    onSave(report);
  };

  const handleChange = (field: keyof ServiceReport, value: any) => {
    setReport(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Relatório do {pet?.name}</h3>
              <p className="text-sm text-slate-500">{serviceName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <h4 className="font-bold text-slate-800 mb-3">Relatório Sobre</h4>
              <div className="space-y-4">
                <MultiSelect label="Pele e Pelagem" options={reportOptions.skinAndCoat} selected={report.skinAndCoat} onChange={(val) => handleChange('skinAndCoat', val)} />
                <MultiSelect label="Ouvidos" options={reportOptions.ears} selected={report.ears} onChange={(val) => handleChange('ears', val)} />
                <MultiSelect label="Unhas" options={reportOptions.nails} selected={report.nails} onChange={(val) => handleChange('nails', val)} />
                <MultiSelect label="Ectoparasitas" options={reportOptions.ectoparasites} selected={report.ectoparasites} onChange={(val) => handleChange('ectoparasites', val)} />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 mb-3">Comportamento Durante o Manejo</h4>
              <div className="space-y-4">
                <SelectField 
                  label="Nível de Estresse"
                  value={report.stressLevel}
                  onChange={(e) => handleChange('stressLevel', e.target.value)}
                  options={['Calmo', 'Agitado', 'Medroso', 'Reativo/Agressivo']}
                />
                <SelectField 
                  label="Aceitação a Água/Secador"
                  value={report.waterAndDryerAcceptance}
                  onChange={(e) => handleChange('waterAndDryerAcceptance', e.target.value)}
                  options={['Boa', 'Resistiu ao secador', 'Medo de água']}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-bold text-slate-800 mb-3">Detalhes Técnicos do Serviço</h4>
              <MultiSelect label="Produtos Usados" options={reportOptions.productsUsed} selected={report.productsUsed} onChange={(val) => handleChange('productsUsed', val)} />
            </div>
            <div className="md:col-span-2">
              <h4 className="font-bold text-slate-800 mb-3">Observações Adicionais</h4>
              <textarea 
                value={report.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                placeholder="Alguma observação extra sobre o pet..."
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="py-2.5 px-5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="py-2.5 px-5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Save size={18} />
            Salvar Relatório
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
    <input type="text" {...props} className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
  </div>
);

const SelectField = ({ label, options, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
    <select {...props} className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm">
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);
