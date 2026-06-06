export interface Pet {
  id: string;
  name: string;
  breed: string;
  size: 'Pequeno' | 'Médio' | 'Grande';
  photoUrl?: string;
}

export interface Client {
  id: string;
  name: string;
  phones: string[];
  addresses: string[];
  email?: string;
  createdAt?: string; // ISO string
}

export interface ServiceReport {
  skinAndCoat: string[];
  ears: string[];
  nails: string[];
  ectoparasites: string[];
  productsUsed: string[];
  stressLevel: 'Calmo' | 'Agitado' | 'Medroso' | 'Reativo/Agressivo';
  waterAndDryerAcceptance: 'Boa' | 'Resistiu ao secador' | 'Medo de água';
  notes?: string;
  finishedTime?: string;
}

export interface ClientChoices {
  bandanaId?: string;
  bowId?: string;
  perfumeId?: string;
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
  packageId?: string;
  customServicePrices?: Record<string, number>;
  reports?: Record<string, ServiceReport>;
  clientChoices?: ClientChoices;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  color?: string;
  icon?: string;
}

export interface Package {
  id: string;
  name: string;
  serviceIds: string[];
  price: number;
  type: 'custom' | 'weekly' | 'monthly';
  sessions: number;
}

export interface WhatsAppTemplate {
  id: string;
  title: string;
  message: string;
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  logoUrl?: string;
  workingHours: {
    start: string; // HH:mm
    end: string;   // HH:mm
  };
}

export interface Product {
  id: string;
  name: string;
  type: 'bandana' | 'laço' | 'perfume';
  imageUrl?: string;
  isAvailable: boolean;
}

export interface AppSettings {
  darkMode: boolean;
}

export interface AppData {
  appointments: Appointment[];
  clients: Client[];
  pets: Record<string, Pet[]>;
  services: Service[];
  packages: Package[];
  whatsappTemplates: WhatsAppTemplate[];
  companyInfo: CompanyInfo;
  products: Product[];
  settings?: AppSettings;
}
