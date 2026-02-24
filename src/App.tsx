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
import { AppData, Appointment, Client, Pet, Service, Package } from './types';
import { loadData, saveData } from './utils/storage';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Login } from './components/Login';

export default function App() {
  const [user, setUser] = React.useState<User | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [data, setData] = React.useState<AppData>(loadData());
  const [isFormOpen, setIsFormOpen] = React.useState(false);
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

  // Firebase Auth Listener
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Load data from Firestore
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const firestoreData = docSnap.data() as AppData;
            setData(firestoreData);
            saveData(firestoreData);
          }
        } catch (err) {
          console.error('Erro ao carregar dados do Firestore:', err);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync state with storage and Firestore
  React.useEffect(() => {
    if (user) {
      const syncFirestore = async () => {
        try {
          await setDoc(doc(db, 'users', user.uid), data);
        } catch (err) {
          console.error('Erro ao salvar dados no Firestore:', err);
        }
      };
      syncFirestore();
    }
  }, [data, user]);

  const handleSaveAppointments = (appointments: Appointment[], client?: Client, pets?: Pet[]) => {
    const newData = { ...data };
    
    if (client && pets && pets.length > 0) {
      newData.clients.push(client);
      newData.pets[client.id] = pets;
    }
    
    appointments.forEach(appointment => {
      const index = newData.appointments.findIndex(a => a.id === appointment.id);
      if (index !== -1) {
        newData.appointments[index] = appointment;
      } else {
        newData.appointments.push(appointment);
      }
    });
    
    setData(newData);
    saveData(newData);
    setIsFormOpen(false);
    setEditingAppointment(undefined);
  };

  const handleUpdateStatus = (id: string, status: Appointment['status']) => {
    const newData = { ...data };
    const index = newData.appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      newData.appointments[index].status = status;
      setData(newData);
      saveData(newData);
    }
  };

  const handleSaveService = (service: Service) => {
    const newData = { ...data };
    const index = newData.services.findIndex(s => s.id === service.id);
    if (index !== -1) {
      newData.services[index] = service;
    } else {
      newData.services.push(service);
    }
    saveData(newData);
    setData(newData);
  };

  const handleDeleteService = (id: string) => {
    const newData = { ...data };
    newData.services = newData.services.filter(s => s.id !== id);
    saveData(newData);
    setData(newData);
  };

  const handleSavePackage = (pkg: Package) => {
    const newData = { ...data };
    const index = newData.packages.findIndex(p => p.id === pkg.id);
    if (index !== -1) {
      newData.packages[index] = pkg;
    } else {
      newData.packages.push(pkg);
    }
    saveData(newData);
    setData(newData);
  };

  const handleDeletePackage = (id: string) => {
    const newData = { ...data };
    newData.packages = newData.packages.filter(p => p.id !== id);
    saveData(newData);
    setData(newData);
  };

  const handleUpdatePet = (clientId: string, petId: string, updatedPet: Partial<Pet>) => {
    const newData = { ...data };
    const pets = newData.pets[clientId];
    if (pets) {
      const index = pets.findIndex(p => p.id === petId);
      if (index !== -1) {
        pets[index] = { ...pets[index], ...updatedPet };
        setData(newData);
        saveData(newData);
      }
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
        return <ClientList data={data} onUpdatePet={handleUpdatePet} />;
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
      case 'settings':
        return (
          <Settings 
            zoomLevel={zoomLevel} 
            setZoomLevel={setZoomLevel} 
            data={data}
            onSaveData={(newData) => {
              setData(newData);
              saveData(newData);
            }}
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
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
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
    </Layout>
  );
}
