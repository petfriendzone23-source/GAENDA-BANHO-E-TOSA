import React from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AppointmentList } from './components/AppointmentList';
import { ClientList } from './components/ClientList';
import { BestClients } from './components/BestClients';
import { CalendarView } from './components/CalendarView';
import { ServiceList } from './components/ServiceList';
import { Settings } from './components/Settings';
import { Performance } from './components/Performance';
import { ProductManagement } from './components/ProductManagement';
import { ClientChoiceView } from './components/ClientChoiceView';
import { AppointmentForm } from './components/AppointmentForm';
import { ClientForm } from './components/ClientForm';
import { ReportViewer } from './components/ReportViewer';
import { ServiceReportForm } from './components/ServiceReportForm';
import { AppData, Appointment, Client, Pet, Service, Package, CompanyInfo, WhatsAppTemplate, ServiceReport, Product } from './types';
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
  updateDoc,
  getDocFromServer
} from 'firebase/firestore';
// Auth Screen Component
import AuthScreen from './components/AuthScreen';
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

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

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
  const [isReportFormOpen, setIsReportFormOpen] = React.useState(false);
  const [reportingAppointment, setReportingAppointment] = React.useState<Appointment | undefined>(undefined);
  const [viewingReport, setViewingReport] = React.useState<Appointment | undefined>(undefined);
  const [zoomLevel, setZoomLevel] = React.useState(() => {
    const saved = localStorage.getItem('zoomLevel');
    return saved ? parseInt(saved, 10) : 100;
  });

  const [initialAppointmentData, setInitialAppointmentData] = React.useState<{time?: string, date?: string}>({});

  // Cache logoUrl in localStorage for AuthScreen
  React.useEffect(() => {
    if (data.companyInfo.logoUrl) {
      localStorage.setItem('cachedLogoUrl', data.companyInfo.logoUrl);
    }
  }, [data.companyInfo.logoUrl]);

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

          setupListener('agendamentos', 'appointments');
          setupListener('clientes', 'clients');
          setupListener('servicos', 'services');
          setupListener('pacotes', 'packages');
          setupListener('whatsappTemplates', 'whatsappTemplates');
          setupListener('produtos', 'products');

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
      await setDoc(doc(db, `users/${user.uid}/clientes`, cid), cleanData(clientData));

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
        await setDoc(doc(db, `users/${user.uid}/clientes`, cid), clientData);

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
        
        // Check if appointment already exists in our local data
        const exists = data.appointments.some(existing => existing.id === app.id);
        
        if (exists) {
          // Update existing
          await setDoc(doc(db, `users/${user.uid}/agendamentos`, app.id), dataToSave);
        } else {
          // Add new
          // If it has an ID from the form, we can use setDoc to keep it, 
          // or use addDoc if we want Firestore to generate one.
          // The form generates IDs, so let's use setDoc to preserve them.
          await setDoc(doc(db, `users/${user.uid}/agendamentos`, app.id), dataToSave);
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
      await updateDoc(doc(db, `users/${user.uid}/agendamentos`, id), { status });
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
      await deleteDoc(doc(db, `users/${user.uid}/agendamentos`, id));
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
        await setDoc(doc(db, `users/${user.uid}/servicos`, id), dataToSave);
      } else {
        await addDoc(collection(db, `users/${user.uid}/servicos`), dataToSave);
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
      await deleteDoc(doc(db, `users/${user.uid}/servicos`, id));
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
        await setDoc(doc(db, `users/${user.uid}/pacotes`, id), dataToSave);
      } else {
        await addDoc(collection(db, `users/${user.uid}/pacotes`), dataToSave);
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
      await deleteDoc(doc(db, `users/${user.uid}/pacotes`, id));
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

  const handleRestoreBackup = async (restoredData: AppData) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      
      // 1. Restore Company Info
      if (restoredData.companyInfo) {
        await setDoc(doc(db, `users/${user.uid}/settings`, 'companyInfo'), restoredData.companyInfo);
      }

      // 2. Restore Collections
      const collectionsToRestore = [
        { key: 'appointments', path: 'agendamentos' },
        { key: 'clients', path: 'clientes' },
        { key: 'services', path: 'servicos' },
        { key: 'packages', path: 'pacotes' },
        { key: 'whatsappTemplates', path: 'whatsappTemplates' },
      ];

      for (const coll of collectionsToRestore) {
        const items = restoredData[coll.key as keyof AppData] as any[];
        if (Array.isArray(items)) {
          for (const item of items) {
            const { id, ...itemData } = item;
            if (id) {
              await setDoc(doc(db, `users/${user.uid}/${coll.path}`, id), cleanData(itemData));
            }
          }
        }
      }

      // 3. Restore Pets
      if (restoredData.pets) {
        for (const clientId in restoredData.pets) {
          const pets = restoredData.pets[clientId];
          if (Array.isArray(pets)) {
            for (const pet of pets) {
              const { id, ...petData } = pet;
              if (id) {
                await setDoc(doc(db, `users/${user.uid}/pets`, id), cleanData({ ...petData, clientId }));
              }
            }
          }
        }
      }

      setSyncStatus('synced');
      // We don't strictly need to reload as onSnapshot will update, 
      // but it helps clear any stale local state if needed.
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error('Error restoring backup:', err);
      setSyncStatus('error');
      throw err;
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

  const handleSaveProduct = async (product: Partial<Product>) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      const { id, ...productData } = product;
      const dataToSave = cleanData(productData);
      if (id && !id.startsWith('temp_')) {
        await setDoc(doc(db, `users/${user.uid}/produtos`, id), dataToSave);
      } else {
        await addDoc(collection(db, `users/${user.uid}/produtos`), dataToSave);
      }
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error saving product:', err);
      setSyncStatus('error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!user) return;
    try {
      setSyncStatus('syncing');
      await deleteDoc(doc(db, `users/${user.uid}/produtos`, id));
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error deleting product:', err);
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

  const handleClosePackageCommand = async (appointments: Appointment[]) => {
    if (!user) return;
    if (!window.confirm('Tem certeza que deseja fechar esta comanda? Esta ação não pode ser desfeita.')) return;
    try {
      setSyncStatus('syncing');
      for (const app of appointments) {
        await updateDoc(doc(db, `users/${user.uid}/agendamentos`, app.id), { packageId: '' });
      }
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error closing package command:', err);
      setSyncStatus('error');
    }
  };

  const handleDeletePackageCommand = async (appointments: Appointment[]) => {
    if (!user) return;
    if (!window.confirm('Tem certeza que deseja excluir esta comanda e TODOS os agendamentos relacionados? Esta ação não pode ser desfeita.')) return;
    try {
      setSyncStatus('syncing');
      for (const app of appointments) {
        await deleteDoc(doc(db, `users/${user.uid}/agendamentos`, app.id));
      }
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error deleting package command:', err);
      setSyncStatus('error');
    }
  };

  const handleSaveReport = async (report: ServiceReport) => {
    if (!user || !reportingAppointment) return;
    try {
      setSyncStatus('syncing');
      await updateDoc(doc(db, `users/${user.uid}/agendamentos`, reportingAppointment.id), { report });
      setSyncStatus('synced');
      setIsReportFormOpen(false);
      
      // Find the updated appointment in the current data
      const updatedAppointment = { ...reportingAppointment, report };
      setViewingReport(updatedAppointment);
      setReportingAppointment(undefined);
    } catch (err) {
      console.error('Error saving report:', err);
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
            onOpenReport={(app) => {
              if (app.report) {
                setViewingReport(app);
              } else {
                setReportingAppointment(app);
                setIsReportFormOpen(true);
              }
            }}
            adminUid={user?.uid}
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
      case 'performance':
        return <Performance data={data} />;
      case 'products':
        return (
          <ProductManagement 
            data={data} 
            onSave={handleSaveProduct} 
            onDelete={handleDeleteProduct} 
          />
        );
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
            onClosePackageCommand={handleClosePackageCommand}
            onDeletePackageCommand={handleDeletePackageCommand}
            onRenewPackage={async (clientId, petId, packageId, appointments) => {
              if (window.confirm('Deseja renovar este pacote? Uma nova contagem será iniciada e o histórico atual será preservado.')) {
                try {
                  setSyncStatus('syncing');
                  // Instead of deleting, we "archive" the appointments by removing the package link
                  // This keeps them in the history and performance reports
                  for (const app of appointments) {
                    await updateDoc(doc(db, `users/${user.uid}/agendamentos`, app.id), { 
                      packageId: '',
                      packageInstanceId: '' 
                    });
                  }
                  setSyncStatus('synced');
                  setInitialAppointmentData({ clientId, petId, packageId });
                  setIsFormOpen(true);
                } catch (err) {
                  console.error('Error renewing package:', err);
                  setSyncStatus('error');
                }
              }
            }}
            onOpenReport={(app) => {
              if (app.report) {
                setViewingReport(app);
              } else {
                setReportingAppointment(app);
                setIsReportFormOpen(true);
              }
            }}
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
            onRestoreBackup={handleRestoreBackup}
          />
        );
      default:
        return <Dashboard data={data} onNewAppointment={() => setIsFormOpen(true)} />;
    }
  };

  const params = new URLSearchParams(window.location.search);
  const choiceId = params.get('choice');
  const adminUid = params.get('uid');

  if (choiceId && adminUid) {
    return <ClientChoiceView appointmentId={choiceId} adminUid={adminUid} />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} syncStatus={syncStatus} logoUrl={data.companyInfo.logoUrl}>
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

      {isReportFormOpen && reportingAppointment && (
        <ServiceReportForm 
          appointment={reportingAppointment}
          data={data}
          onSave={handleSaveReport}
          onClose={() => {
            setIsReportFormOpen(false);
            setReportingAppointment(undefined);
          }}
        />
      )}

      {viewingReport && (
        <ReportViewer 
          appointment={viewingReport} 
          onClose={() => setViewingReport(undefined)} 
          data={data}
          onEdit={() => {
            setReportingAppointment(viewingReport);
            setViewingReport(undefined);
            setIsReportFormOpen(true);
          }}
        />
      )}
    </Layout>
  );
}
