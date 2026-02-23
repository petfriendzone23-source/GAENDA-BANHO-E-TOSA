export type ServiceType = 'Banho' | 'Tosa' | 'Banho e Tosa' | 'Hidratação' | 'Corte de Unha';

export interface Pet {
  id: string;
  name: string;
  breed: string;
  size: 'Pequeno' | 'Médio' | 'Grande';
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  petId: string;
  services: ServiceType[];
  date: string; // ISO string
  time: string; // HH:mm
  status: 'Agendado' | 'Concluído' | 'Cancelado';
  price: number;
  notes?: string;
}

export interface AppData {
  appointments: Appointment[];
  clients: Client[];
  pets: Record<string, Pet[]>; // clientId -> Pet[]
}
