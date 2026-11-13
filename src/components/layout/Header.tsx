import React from 'react';
import { Shield, Upload, Download, Activity, Bell } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generatePdfSecurityReport } from '../../utils/pdfGenerator';

export const Header: React.FC = () => {
  const { summary, activePage, setActivePage, isMonitoringActive } = useApp();

  return (
    <header className="h-16 bg-[#0B0F19]/90 backdrop-blur-md border-b border-cyan-500/15 px-6 flex items-center justify-between gap-8 shrink-0 z-20">
      {/* Zone 1: Single Brand wordmark element */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.25)]">
          <Shield className="w-4 h-4 stroke-[2]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold tracking-wider text-white font-heading uppercase">
            STATGUARD
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] text-cyan-400 font-mono tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00E5FF] animate-pulse"></span>
            ACTIVE CYBER SURVEILLANCE
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden lg:flex items-center gap-7 text-xs font-medium text-slate-300">
        <button
          onClick={() => setActivePage('dashboard')}
          className={`whitespace-nowrap transition-all hover:text-cyan-400 tracking-wide ${
            activePage === 'dashboard' ? 'text-cyan-400 font-semibold drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]' : ''
          }`}
        >
          Command Center
        </button>
        <button
          onClick={() => setActivePage('monitoring')}
          className={`whitespace-nowrap transition-all hover:text-cyan-400 tracking-wide flex items-center gap-1.5 ${
            activePage === 'monitoring' ? 'text-cyan-400 font-semibold drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]' : ''
          }`}
        >
          <span>Live Stream NOC</span>
          {isMonitoringActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00E5FF] animate-ping"></span>
          )}
        </button>
        <button
          onClick={() => setActivePage('statistical')}
          className={`whitespace-nowrap transition-all hover:text-cyan-400 tracking-wide ${
            activePage === 'statistical' ? 'text-cyan-400 font-semibold drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]' : ''
          }`}
        >
          Statistical Engine
        </button>
        <button
          onClick={() => setActivePage('detection')}
          className={`whitespace-nowrap transition-all hover:text-cyan-400 tracking-wide ${
            activePage === 'detection' ? 'text-cyan-400 font-semibold drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]' : ''
          }`}
        >
          Threat Matrix
        </button>
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setActivePage('upload')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-300 bg-[#151E2D] hover:bg-cyan-950/40 hover:border-cyan-400/50 border border-cyan-500/25 rounded-lg transition-all shadow-[0_0_10px_rgba(0,229,255,0.1)] whitespace-nowrap"
          title="Upload or change network dataset"
        >
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
          <span>Upload CSV</span>
        </button>
        <button
          onClick={() => generatePdfSecurityReport(summary)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#080B12] bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 font-semibold rounded-lg shadow-[0_0_15px_rgba(0,229,255,0.35)] transition-all whitespace-nowrap"
          title="Export forensic audit PDF report"
        >
          <Download className="w-3.5 h-3.5 text-[#080B12]" />
          <span>Export Audit</span>
        </button>
      </div>
    </header>
  );
};
