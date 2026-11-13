import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { NetworkMonitoringPage } from './components/monitoring/NetworkMonitoringPage';
import { DatasetUploadPage } from './components/upload/DatasetUploadPage';
import { StatisticalAnalysisPage } from './components/statistical/StatisticalAnalysisPage';
import { ThreatDetectionPage } from './components/detection/ThreatDetectionPage';
import { ThreatInvestigationPage } from './components/investigation/ThreatInvestigationPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { Menu, X, Shield } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activePage } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'monitoring':
        return <NetworkMonitoringPage />;
      case 'upload':
        return <DatasetUploadPage />;
      case 'statistical':
        return <StatisticalAnalysisPage />;
      case 'detection':
        return <ThreatDetectionPage />;
      case 'investigation':
        return <ThreatInvestigationPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#080B12] text-[#E2E8F0] flex flex-col font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Cyber Command Header */}
      <Header />

      {/* Mobile Menu Toggle Bar */}
      <div className="lg:hidden bg-[#0B0F19] border-b border-cyan-500/15 px-4 py-2.5 flex items-center justify-between text-xs">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-4 h-4 text-cyan-400" /> : <Menu className="w-4 h-4 text-cyan-400" />}
          <span className="font-semibold font-mono uppercase tracking-wider text-[11px]">Command Grid</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="font-mono text-cyan-300 uppercase text-[11px] tracking-wider font-bold">
            {activePage}
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Collapsible Sidebar */}
        <div className="hidden lg:flex">
          <Sidebar />
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md lg:hidden flex">
            <div className="w-72 bg-[#0A0E17] h-full border-r border-cyan-500/20 shadow-2xl flex flex-col">
              <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm tracking-wider text-white font-heading">STATGUARD</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-cyan-400 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto" onClick={() => setMobileMenuOpen(false)}>
                <Sidebar />
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#080B12] cyber-grid">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
