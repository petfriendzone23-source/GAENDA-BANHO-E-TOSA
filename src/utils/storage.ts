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
        services: app.services || (app.service ? [app.service] : []),
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
