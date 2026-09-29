import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlantProvider } from './context/PlantContext';
import { Navbar, PageId } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductionPage } from './pages/ProductionPage';
import { RawMaterialsPage } from './pages/RawMaterialsPage';
import { PremixPage } from './pages/PremixPage';
import { PPBagsPage } from './pages/PPBagsPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { SparePartsPage } from './pages/SparePartsPage';
import { ReportsPage } from './pages/ReportsPage';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If not authenticated, always show the Login page
  if (!isAuthenticated || currentPage === 'login') {
    return <LoginPage onLoginSuccess={() => setCurrentPage('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-[#f3f6fb] flex flex-col text-slate-800">
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />

      <main className="flex-1 pb-16 lg:pb-8">
        {currentPage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
        {currentPage === 'production' && <ProductionPage />}
        {currentPage === 'raw_materials' && <RawMaterialsPage />}
        {currentPage === 'premix' && <PremixPage />}
        {currentPage === 'pp_bags' && <PPBagsPage />}
        {currentPage === 'maintenance' && <MaintenancePage />}
        {currentPage === 'spare_parts' && <SparePartsPage />}
        {currentPage === 'reports' && <ReportsPage />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <PlantProvider>
        <AppContent />
      </PlantProvider>
    </AuthProvider>
  );
}
