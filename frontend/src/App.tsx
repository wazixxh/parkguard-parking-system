import React, { useState, useEffect } from 'react';
import apiClient, { api } from './services/api';
import type { User, PrintableCardData } from './types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import DashboardView from './pages/DashboardView';
import ScannerView from './pages/ScannerView';
import VehiclesView from './pages/VehiclesView';
import ParkingView from './pages/ParkingView';
import TransactionsView from './pages/TransactionsView';
import IncidentsView from './pages/IncidentsView';
import ReportsView from './pages/ReportsView';
import StaffView from './pages/StaffView';
import ZonesView from './pages/ZonesView';
import AuditView from './pages/AuditView';

// Modals
import LoginModal from './components/LoginModal';
import RegisterVehicleModal from './components/RegisterVehicleModal';
import RecordEntryModal from './components/RecordEntryModal';
import ReportIncidentModal from './components/ReportIncidentModal';
import AddStaffModal from './components/AddStaffModal';
import PrintableCardModal from './components/PrintableCardModal';
import ChangePasswordModal from './components/ChangePasswordModal';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Health & latency diagnostics
  const [apiOnline, setApiOnline] = useState<boolean>(true);
  const [apiLatency, setApiLatency] = useState<number | null>(null);

  // Modal dialog states
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [isEntryOpen, setIsEntryOpen] = useState<boolean>(false);
  const [isIncidentOpen, setIsIncidentOpen] = useState<boolean>(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState<boolean>(false);
  const [isPrintCardOpen, setIsPrintCardOpen] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  const [printableCard, setPrintableCard] = useState<PrintableCardData | null>(null);

  // Pre-filled modal contexts
  const [entryIdentifier, setEntryIdentifier] = useState<string>('');
  const [incidentIdentifier, setIncidentIdentifier] = useState<string>('');

  // Ping backend health
  const checkHealth = async () => {
    const start = performance.now();
    try {
      await apiClient.get('/health');
      const end = performance.now();
      setApiLatency(Math.round(end - start));
      setApiOnline(true);
    } catch {
      setApiOnline(false);
      setApiLatency(null);
    }
  };

  // Restore session
  const restoreUserSession = async () => {
    const token = localStorage.getItem('parkguard_token');
    const savedUser = localStorage.getItem('parkguard_user');
    if (token) {
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch {
          // ignore parsing error
        }
      }
      try {
        const freshUser = await api.getMe();
        setCurrentUser(freshUser);
        localStorage.setItem('parkguard_user', JSON.stringify(freshUser));
      } catch {
        // Token expired or invalid
        localStorage.removeItem('parkguard_token');
        localStorage.removeItem('parkguard_user');
        setCurrentUser(null);
      }
    }
  };

  useEffect(() => {
    checkHealth();
    restoreUserSession();

    const healthInterval = setInterval(checkHealth, 25000);

    const handleAuthChange = () => {
      restoreUserSession();
    };
    window.addEventListener('parkguard_auth_change', handleAuthChange);

    return () => {
      clearInterval(healthInterval);
      window.removeEventListener('parkguard_auth_change', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('parkguard_token');
    localStorage.removeItem('parkguard_user');
    setCurrentUser(null);
    if (['staff', 'zones', 'audit'].includes(currentTab)) {
      setCurrentTab('dashboard');
    }
  };

  const handleOpenPrintCard = async (vehicleId: number) => {
    try {
      const card = await api.getPrintableCard(vehicleId);
      setPrintableCard(card);
      setIsPrintCardOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to generate printable vehicle pass.');
    }
  };

  const handleOpenIncidentWithPlate = (plate: string) => {
    setIncidentIdentifier(plate);
    setIsIncidentOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0b10] text-[#f3f4f6]">
      {/* Universal Top Header & Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        apiOnline={apiOnline}
        apiLatency={apiLatency}
        onRefreshHealth={checkHealth}
      />

      {/* Main Dynamic Viewport */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigate={setCurrentTab}
            onOpenRegister={() => setIsRegisterOpen(true)}
            onOpenEntry={() => {
              setEntryIdentifier('');
              setIsEntryOpen(true);
            }}
            onOpenIncident={() => {
              setIncidentIdentifier('');
              setIsIncidentOpen(true);
            }}
          />
        )}

        {currentTab === 'scanner' && (
          <ScannerView
            onOpenRegisterWithPlate={() => setIsRegisterOpen(true)}
            onOpenPrintCard={handleOpenPrintCard}
            onOpenIncidentWithVehicle={handleOpenIncidentWithPlate}
          />
        )}

        {currentTab === 'vehicles' && (
          <VehiclesView
            onOpenRegister={() => setIsRegisterOpen(true)}
            onOpenPrintCard={handleOpenPrintCard}
          />
        )}

        {currentTab === 'parking' && (
          <ParkingView
            onOpenEntry={() => {
              setEntryIdentifier('');
              setIsEntryOpen(true);
            }}
          />
        )}

        {currentTab === 'transactions' && (
          <TransactionsView />
        )}

        {currentTab === 'incidents' && (
          <IncidentsView
            onOpenReportIncident={() => {
              setIncidentIdentifier('');
              setIsIncidentOpen(true);
            }}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView />
        )}

        {currentTab === 'staff' && (
          <StaffView
            onOpenAddStaff={() => setIsAddStaffOpen(true)}
          />
        )}

        {currentTab === 'zones' && (
          <ZonesView
            currentUser={currentUser}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        )}

        {currentTab === 'audit' && (
          <AuditView
            currentUser={currentUser}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        )}
      </main>

      {/* Mandatory Exact Footer */}
      <Footer />

      {/* Shared Application Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsLoginOpen(false);
        }}
      />

      <RegisterVehicleModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={(veh) => {
          setIsRegisterOpen(false);
          handleOpenPrintCard(veh.id);
        }}
      />

      <RecordEntryModal
        isOpen={isEntryOpen}
        initialIdentifier={entryIdentifier}
        onClose={() => setIsEntryOpen(false)}
        onSuccess={() => {
          setIsEntryOpen(false);
          // Auto switch to live parking if user logged entry
          if (currentTab !== 'parking' && currentTab !== 'scanner') {
            setCurrentTab('parking');
          }
        }}
      />

      <ReportIncidentModal
        isOpen={isIncidentOpen}
        initialVehicleIdentifier={incidentIdentifier}
        onClose={() => setIsIncidentOpen(false)}
        onSuccess={() => {
          setIsIncidentOpen(false);
          if (currentTab !== 'incidents') {
            setCurrentTab('incidents');
          }
        }}
      />

      <AddStaffModal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        onSuccess={() => {
          setIsAddStaffOpen(false);
        }}
      />

      <PrintableCardModal
        isOpen={isPrintCardOpen}
        cardData={printableCard}
        onClose={() => {
          setIsPrintCardOpen(false);
          setPrintableCard(null);
        }}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};

export default App;
