export interface Pet {
  id: string;
  name: string;
  breed: string;
  size: 'Pequeno' | 'Médio' | 'Grande';
}

export interface Client {
  id: string;
  name: string;
  phones: string[];
  addresses: string[];
  email?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  petId: string;
  services: string[];
  date: string; // ISO string
  time: string; // HH:mm
  status: 'Agendado' | 'Concluído' | 'Cancelado';
  price: number;
  notes?: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
}

export interface Package {
  id: string;
  name: string;
  serviceIds: string[];
  price: number;
}

export interface AppData {
  appointments: Appointment[];
  clients: Client[];
  pets: Record<string, Pet[]>; // clientId -> Pet[]
  services: Service[];
  packages: Package[];
}
