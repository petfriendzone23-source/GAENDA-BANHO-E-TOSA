import React from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AppointmentList } from './components/AppointmentList';
import { ClientList } from './components/ClientList';
import { BestClients } from './components/BestClients';
import { CalendarView } from './components/CalendarView';
import { ServiceList } from './components/ServiceList';
import { Settings } from './components/Settings';
import { AppointmentForm } from './components/AppointmentForm';
import { ClientForm } from './components/ClientForm';
import { AppData, Appointment, Client, Pet, Service, Package, CompanyInfo, WhatsAppTemplate } from './types';
import { loadData, saveData } from './utils/storage';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot, 
  query, 
  addDoc, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { PackageCommandList } from './components/PackageCommandList';

const cleanData = (obj: any) => {
  const newObj = { ...obj };
  Object.keys(newObj).forEach(key => {
    if (newObj[key] === undefined) {
      delete newObj[key];
    }
  });
  return newObj;
};

export default function App() {
  const [user, setUser] = React.useState<User | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [data, setData] = React.useState<AppData>(loadData());
  const [syncStatus, setSyncStatus] = React.useState<'synced' | 'syncing' | 'error' | 'offline'>('offline');
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isClientFormOpen, setIsClientFormOpen] = React.useState(false);
  const [editingClient, setEditingClient] = React.useState<{ client: Client, pets: Pet[] } | undefined>(undefined);
  const [editingAppointment, setEditingAppointment] = React.useState<Appointment | undefined>(undefined);
  const [zoomLevel, setZoomLevel] = React.useState(() => {
    const saved = localStorage.getItem('zoomLevel');
    return saved ? parseInt(saved, 10) : 100;
  });

  const [initialAppointmentData, setInitialAppointmentData] = React.useState<{time?: string, date?: string}>({});

  // Apply zoom level
  React.useEffect(() => {
    document.documentElement.style.fontSize = `${zoomLevel}%`;
    localStorage.setItem('zoomLevel', zoomLevel.toString());
  }, [zoomLevel]);

  // Firebase Auth Listener & Firestore Real-time Sync
  React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setUser(currentUser);
        if (currentUser) {
          setSyncStatus('syncing');
          
          const unsubscribers: (() => void)[] = [];

          // Helper for simple collections
          const setupListener = (collName: string, key: keyof AppData) => {
            try {
              const q = query(collection(db, `users/${currentUser.uid}/${collName}`));
              const unsub = onSnapshot(q, (snapshot) => {
                const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setData(prev => ({ ...prev, [key]: docs }));
                setSyncStatus('synced');
              }, (err) => {
                console.error(`Error syncing ${collName}:`, err);
                setSyncStatus('error');
              });
              unsubscribers.push(unsub);
            } catch (e) {
              console.error(`Failed to setup listener for ${collName}`, e);
            }
          };

          setupListener('appointments', 'appointments');
          setupListener('clients', 'clients');
          setupListener('services', 'services');
          setupListener('packages', 'packages');
          setupListener('whatsappTemplates', 'whatsappTemplates');

          // Special listener for Pets (Record structure)
          try {
            const qPets = query(collection(db, `users/${currentUser.uid}/pets`));
            const unsubPets = onSnapshot(qPets, (snapshot) => {
              const petsRecord: Record<string, Pet[]> = {};
              snapshot.docs.forEach(d => {
                const p = d.data() as any;
                if (!petsRecord[p.clientId]) petsRecord[p.clientId] = [];
                petsRecord[p.clientId].push({ id: d.id, ...p });
              });
              setData(prev => ({ ...prev, pets: petsRecord }));
            }, (err) => {
              console.error('Error syncing pets:', err);
              setSyncStatus('error');
            });
            unsubscribers.push(unsubPets);
          } catch (e) {
            console.error('Failed to setup pets listener', e);
          }

          // Listener for Company Info
          try {
            const unsubCompany = onSnapshot(doc(db, `users/${currentUser.uid}/settings`, 'companyInfo'), (docSnap) => {
              if (docSnap.exists()) {
                setData(prev => ({ ...prev, companyInfo: docSnap.data() as CompanyInfo }));
              }
            }, (err) => {
              console.error('Error syncing company info:', err);
            });
            unsubscribers.push(unsubCompany);
          } catch (e) {
            console.error('Failed to setup company listener', e);
          }

          return () => unsubscribers.forEach(unsub => unsub());
        } else {
          setSyncStatus('offline');
          setData(loadData());
        }
      } catch (globalErr) {
        console.error('Global auth error:', globalErr);
      } finally {
        setAuthLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleSaveClient = async (client: Client, pets: Pet[]) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      const { id: cid, ...clientData } = client;
      await setDoc(doc(db, `users/${user.uid}/clients`, cid), cleanData(clientData));

      // Handle pet deletions
      const existingPets = data.pets[cid] || [];
      const newPetIds = new Set(pets.map(p => p.id));
      const petsToDelete = existingPets.filter(p => !newPetIds.has(p.id));

      for (const pet of petsToDelete) {
        await deleteDoc(doc(db, `users/${user.uid}/pets`, pet.id));
      }

      for (const pet of pets) {
        const { id: pid, ...petData } = pet;
        await setDoc(doc(db, `users/${user.uid}/pets`, pid), cleanData({ ...petData, clientId: cid }));
      }

      setIsClientFormOpen(false);
      setEditingClient(undefined);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error saving client:', err);
      setSyncStatus('error');
    }
  };

  const handleSaveAppointments = async (appointments: Appointment[], client?: Client, pets?: Pet[]) => {
    if (!user) return;
    
    try {
      setSyncStatus('syncing');

      // 1. Save Client if new
      if (client) {
        const { id: cid, ...clientData } = client;
        await setDoc(doc(db, `users/${user.uid}/clients`, cid), clientData);

        // 2. Save Pets for this new client
        if (pets) {
          for (const pet of pets) {
            const { id: pid, ...petData } = pet;
            await setDoc(doc(db, `users/${user.uid}/pets`, pid), { ...petData, clientId: cid });
          }
        }
      }

      // 3. Save Appointments
      for (const app of appointments) {
        const { id, ...appData } = app;
        const dataToSave = cleanData({ ...appData, userId: user.uid });
        
        if (editingAppointment && app.id === editingAppointment.id) {
          // Update existing
          await setDoc(doc(db, `users/${user.uid}/appointments`, app.id), dataToSave);
        } else {
          // Add new - Using addDoc as requested
          await addDoc(collection(db, `users/${user.uid}/appointments`), dataToSave);
        }
      }

      setIsFormOpen(false);
      setEditingAppointment(undefined);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error saving appointments:', err);
      setSyncStatus('error');
    }
  };

  const handleUpdateStatus = async (id: string, status: Appointment['status']) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      await updateDoc(doc(db, `users/${user.uid}/appointments`, id), { status });
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error updating status:', err);
      setSyncStatus('error');
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!user) return;
    if (!window.confirm('Tem certeza que deseja excluir este agendamento?')) return;
    try {
      setSyncStatus('syncing');
      await deleteDoc(doc(db, `users/${user.uid}/appointments`, id));
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error deleting appointment:', err);
      setSyncStatus('error');
    }
  };

  const handleSaveService = async (service: Service) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      const { id, ...serviceData } = service;
      const dataToSave = cleanData(serviceData);
      if (id && !id.startsWith('temp_')) { // Assuming temp_ for new ones or just check if exists
        await setDoc(doc(db, `users/${user.uid}/services`, id), dataToSave);
      } else {
        await addDoc(collection(db, `users/${user.uid}/services`), dataToSave);
      }
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error saving service:', err);
      setSyncStatus('error');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      await deleteDoc(doc(db, `users/${user.uid}/services`, id));
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error deleting service:', err);
      setSyncStatus('error');
    }
  };

  const handleSavePackage = async (pkg: Package) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      const { id, ...packageData } = pkg;
      const dataToSave = cleanData(packageData);
      if (id && !id.startsWith('temp_')) {
        await setDoc(doc(db, `users/${user.uid}/packages`, id), dataToSave);
      } else {
        await addDoc(collection(db, `users/${user.uid}/packages`), dataToSave);
      }
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error saving package:', err);
      setSyncStatus('error');
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      await deleteDoc(doc(db, `users/${user.uid}/packages`, id));
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error deleting package:', err);
      setSyncStatus('error');
    }
  };

  const handleUpdatePet = async (clientId: string, petId: string, updatedPet: Partial<Pet>) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      await updateDoc(doc(db, `users/${user.uid}/pets`, petId), cleanData(updatedPet));
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error updating pet:', err);
      setSyncStatus('error');
    }
  };

  const handleSaveData = async (newData: AppData) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      // For companyInfo specifically as it's the main thing edited via onSaveData in Settings
      await setDoc(doc(db, `users/${user.uid}/settings`, 'companyInfo'), newData.companyInfo);
      
      // Also handle templates if they were changed
      // (This is a bit broad, but Settings uses onSaveData for templates too)
      // Ideally we'd have specific handlers for templates
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error saving data:', err);
      setSyncStatus('error');
    }
  };

  const handleSaveTemplate = async (template: WhatsAppTemplate) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      const { id, ...templateData } = template;
      const dataToSave = cleanData(templateData);
      if (id && !id.startsWith('temp_')) {
        await setDoc(doc(db, `users/${user.uid}/whatsappTemplates`, id), dataToSave);
      } else {
        await addDoc(collection(db, `users/${user.uid}/whatsappTemplates`), dataToSave);
      }
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error saving template:', err);
      setSyncStatus('error');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      await deleteDoc(doc(db, `users/${user.uid}/whatsappTemplates`, id));
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error deleting template:', err);
      setSyncStatus('error');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            data={data} 
            onNewAppointment={() => setIsFormOpen(true)} 
            onEditAppointment={(app) => {
              setEditingAppointment(app);
              setIsFormOpen(true);
            }}
          />
        );
      case 'agenda':
        return (
          <CalendarView 
            data={data} 
            onEditAppointment={(app) => {
              setEditingAppointment(app);
              setIsFormOpen(true);
            }}
          />
        );
      case 'appointments':
        return (
          <AppointmentList 
            data={data} 
            onUpdateStatus={handleUpdateStatus} 
            onDeleteAppointment={handleDeleteAppointment}
            onEditAppointment={(app) => {
              setEditingAppointment(app);
              setIsFormOpen(true);
            }}
            onNewAppointmentAtTime={(time, date) => {
              setInitialAppointmentData({ time, date });
              setIsFormOpen(true);
            }}
            onUpdatePet={handleUpdatePet}
          />
        );
      case 'clients':
        return (
          <ClientList 
            data={data} 
            onUpdatePet={handleUpdatePet} 
            onAddClient={() => setIsClientFormOpen(true)} 
            onEditClient={(client, pets) => {
              setEditingClient({ client, pets });
              setIsClientFormOpen(true);
            }}
          />
        );
      case 'best-clients':
        return <BestClients data={data} />;
      case 'services':
        return (
          <ServiceList 
            data={data} 
            onSaveService={handleSaveService} 
            onDeleteService={handleDeleteService}
            onSavePackage={handleSavePackage}
            onDeletePackage={handleDeletePackage}
          />
        );
      case 'package-commands':
        return (
          <PackageCommandList 
            data={data} 
            onEditAppointment={(app) => {
              setEditingAppointment(app);
              setIsFormOpen(true);
            }}
            onDeleteAppointment={handleDeleteAppointment}
          />
        );
      case 'settings':
        return (
          <Settings 
            zoomLevel={zoomLevel} 
            setZoomLevel={setZoomLevel} 
            data={data}
            onSaveData={handleSaveData}
            onSaveTemplate={handleSaveTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        );
      default:
        return <Dashboard data={data} onNewAppointment={() => setIsFormOpen(true)} />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} syncStatus={syncStatus}>
      {renderContent()}
      
      {isFormOpen && (
        <AppointmentForm 
          data={data} 
          onSave={handleSaveAppointments} 
          onClose={() => {
            setIsFormOpen(false);
            setEditingAppointment(undefined);
            setInitialAppointmentData({});
          }} 
          appointment={editingAppointment}
          initialData={initialAppointmentData}
        />
      )}

      {isClientFormOpen && (
        <ClientForm 
          onSave={handleSaveClient}
          onClose={() => {
            setIsClientFormOpen(false);
            setEditingClient(undefined);
          }}
          initialData={editingClient}
        />
      )}
    </Layout>
  );
}
