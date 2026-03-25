import { AppData, Appointment, Client, Pet } from '../types';

const STORAGE_KEY = 'petgroom_data';

const initialData: AppData = {
  appointments: [
    {
      id: '1',
      clientId: 'c1',
      petId: 'p1',
      services: ['Banho e Tosa'],
      date: new Date().toISOString().split('T')[0],
      time: '14:30',
      status: 'Agendado',
      price: 80,
      notes: 'Cuidado com as orelhas.'
    }
  ],
  clients: [
    { id: 'c1', name: 'Ana Oliveira', phones: ['(11) 98765-4321'], addresses: ['Rua das Flores, 123'] }
  ],
  pets: {
    'c1': [{ id: 'p1', name: 'Bolinha', breed: 'Poodle', size: 'Pequeno' }]
  },
  services: [
    { id: '1', name: 'Banho', price: 40, color: '#3b82f6' },
    { id: '2', name: 'Tosa', price: 50, color: '#8b5cf6' },
    { id: '3', name: 'Banho e Tosa', price: 80, color: '#10b981' },
    { id: '4', name: 'Hidratação', price: 30, color: '#f59e0b' },
    { id: '5', name: 'Corte de Unha', price: 15, color: '#ef4444' },
  ],
  packages: [
    { id: 'pkg1', name: 'Combo Banho + Tosa', serviceIds: ['1', '2'], price: 80, type: 'custom', sessions: 1 }
  ],
  whatsappTemplates: [],
  companyInfo: {
    name: 'Pet Friends Zone',
    address: 'Rua Fictícia, 123 - Cidade, Estado',
    phone: '(11) 98765-4321',
    workingHours: {
      start: '08:00',
      end: '18:00'
    }
  },
  products: []
};

export const loadData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return initialData;
  try {
    const parsed = JSON.parse(stored) as any;
    
    // Migrate appointments
    if (parsed.appointments) {
      parsed.appointments = parsed.appointments.map((app: any) => ({
        ...app,
        services: app.services.map((s: any) => 
          typeof s === 'string' ? s : s.name
        ),
      }));
    }

    // Migrate clients
    if (parsed.clients) {
      parsed.clients = parsed.clients.map((client: any) => ({
        ...client,
        phones: client.phones || (client.phone ? [client.phone] : []),
        addresses: client.addresses || [],
      }));
    }

    // Migrate services
    if (!parsed.services) {
      parsed.services = initialData.services;
    }

    // Migrate packages
    if (!parsed.packages) {
      parsed.packages = initialData.packages || [];
    } else {
      parsed.packages = parsed.packages.map((pkg: any) => ({
        ...pkg,
        type: pkg.type || 'custom',
        sessions: pkg.sessions || 1
      }));
    }

    // Migrate whatsappTemplates
    if (!parsed.whatsappTemplates) {
      parsed.whatsappTemplates = [];
    }

    // Migrate companyInfo
    if (!parsed.companyInfo) {
      parsed.companyInfo = initialData.companyInfo;
    } else if (!parsed.companyInfo.workingHours) {
      parsed.companyInfo.workingHours = initialData.companyInfo.workingHours;
    }

    // Migrate products
    if (!parsed.products) {
      parsed.products = [];
    }

    return parsed as AppData;
  } catch (e) {
    console.error('Failed to parse stored data', e);
    return initialData;
  }
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const addClient = (client: Client, pet: Pet) => {
  const data = loadData();
  data.clients.push(client);
  data.pets[client.id] = [pet];
  saveData(data);
};

export const addAppointment = (appointment: Appointment) => {
  const data = loadData();
  data.appointments.push(appointment);
  saveData(data);
};

export const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
  const data = loadData();
  const index = data.appointments.findIndex(a => a.id === id);
  if (index !== -1) {
    data.appointments[index].status = status;
    saveData(data);
  }
};
