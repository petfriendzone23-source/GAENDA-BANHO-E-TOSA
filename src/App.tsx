import React from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AppointmentList } from './components/AppointmentList';
import { ClientList } from './components/ClientList';
import { CalendarView } from './components/CalendarView';
import { ServiceList } from './components/ServiceList';
import { AppointmentForm } from './components/AppointmentForm';
import { AppData, Appointment, Client, Pet, Service, Package } from './types';
import { loadData, saveData } from './utils/storage';

export default function App() {
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [data, setData] = React.useState<AppData>(loadData());
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] = React.useState<Appointment | undefined>(undefined);

  // Sync state with storage
  React.useEffect(() => {
    setData(loadData());
  }, []);

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
          />
        );
      case 'clients':
        return <ClientList data={data} />;
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
          <div className="py-20 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Configurações</h2>
            <p className="text-slate-500 mt-2">Em breve: Gerenciamento de serviços, preços e horários de funcionamento.</p>
          </div>
        );
      default:
        return <Dashboard data={data} onNewAppointment={() => setIsFormOpen(true)} />;
    }
  };

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
          }} 
          appointment={editingAppointment}
        />
      )}
    </Layout>
  );
}
