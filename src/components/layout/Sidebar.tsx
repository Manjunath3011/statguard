import React from 'react';
import {
  LayoutDashboard,
  Activity,
  UploadCloud,
  Calculator,
  ShieldAlert,
  SearchCode,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Radio,
  UserCheck
} from 'lucide-react';
import { useApp, NavigationPage } from '../../context/AppContext';

interface NavItem {
  id: NavigationPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeTone?: 'cyan' | 'amber' | 'rose' | 'slate';
}

export const Sidebar: React.FC = () => {
  const {
    activePage,
    setActivePage,
    summary,
    isMonitoringActive,
    sidebarCollapsed,
    setSidebarCollapsed
  } = useApp();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    {
      id: 'monitoring',
      label: 'Live Stream NOC',
      icon: Activity,
      badge: isMonitoringActive ? 'LIVE' : 'OFF',
      badgeTone: isMonitoringActive ? 'cyan' : 'slate'
    },
    { id: 'upload', label: 'Dataset Ingestion', icon: UploadCloud },
    { id: 'statistical', label: 'Statistical Engine', icon: Calculator },
    {
      id: 'detection',
      label: 'Threat Matrix',
      icon: ShieldAlert,
      badge: summary.anomalousRecords > 0 ? summary.anomalousRecords : undefined,
      badgeTone: summary.criticalCount > 0 ? 'rose' : 'amber'
    },
    {
      id: 'investigation',
      label: 'Threat Forensics',
      icon: SearchCode
    },
    { id: 'reports', label: 'Audit Reports', icon: FileText },
    { id: 'settings', label: 'Calibration', icon: Settings }
  ];

  return (
    <aside
      className={`bg-[#0A0E17]/95 backdrop-blur-xl border-r border-cyan-500/15 flex flex-col justify-between shrink-0 select-none transition-all duration-300 relative z-20 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header & Brand Logo */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-cyan-500/15">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 via-blue-600/30 to-purple-600/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                  <Shield className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#00E5FF] animate-pulse"></span>
              </div>
              <div>
                <span className="text-sm font-bold tracking-wider text-white font-heading block">
                  STATGUARD
                </span>
                <span className="text-[10px] font-mono text-cyan-400/80 tracking-widest block uppercase">
                  Cyber Command
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 via-blue-600/30 to-purple-600/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                <Shield className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#00E5FF] animate-pulse"></span>
            </div>
          )}

          {/* Collapse/Expand Toggle Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`p-1.5 rounded-lg border border-cyan-500/20 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors ${
              sidebarCollapsed ? 'hidden' : 'block'
            }`}
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1">
          {!sidebarCollapsed && (
            <div className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase px-3 pt-2 mb-2 font-mono flex items-center justify-between">
              <span>Navigation Grid</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 shadow-[0_0_6px_#00E5FF]"></span>
            </div>
          )}

          <nav className="space-y-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent text-white border border-cyan-400/40 shadow-[0_0_15px_-3px_rgba(0,229,255,0.25)]'
                      : 'text-slate-400 hover:bg-[#151E2D]/80 hover:text-slate-100 hover:border-slate-700/60 border border-transparent'
                  }`}
                >
                  {/* Left Cyan Accent Pillar on Active */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-400 rounded-r shadow-[0_0_8px_#00E5FF]"></div>
                  )}

                  <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'mx-auto' : ''}`}>
                    <Icon
                      className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-cyan-400 drop-shadow-[0_0_6px_rgba(0,229,255,0.6)]' : 'text-slate-400 group-hover:text-cyan-300'
                      }`}
                    />
                    {!sidebarCollapsed && (
                      <span className="whitespace-nowrap font-medium tracking-tight">
                        {item.label}
                      </span>
                    )}
                  </div>

                  {!sidebarCollapsed && item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border tracking-wider ${
                        item.badgeTone === 'cyan'
                          ? 'text-cyan-300 bg-cyan-950/60 border-cyan-500/40 shadow-[0_0_8px_rgba(0,229,255,0.2)]'
                          : item.badgeTone === 'rose'
                          ? 'text-rose-300 bg-rose-950/60 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                          : item.badgeTone === 'amber'
                          ? 'text-amber-300 bg-amber-950/60 border-amber-500/40'
                          : 'text-slate-400 bg-slate-900 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Collapsed State Toggle button */}
        {sidebarCollapsed && (
          <div className="p-3 text-center">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-2 rounded-xl border border-cyan-500/20 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors mx-auto"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dataset Telemetry Preview Pill (Expanded Mode Only) */}
        {!sidebarCollapsed && (
          <div className="mx-3 mt-4 p-3 rounded-xl bg-[#101827]/80 border border-cyan-500/20 shadow-inner space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>Active Target</span>
              </span>
              <span className="text-cyan-400 font-bold tabular-nums">
                {summary.totalRecords} flows
              </span>
            </div>
            <p className="text-xs font-medium text-slate-200 truncate" title={summary.datasetName}>
              {summary.datasetName}
            </p>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
              <div>
                <span className="text-slate-400 text-[10px] block">Threat Risk</span>
                <span className={`font-bold ${summary.networkRiskScore > 50 ? 'text-rose-400' : 'text-cyan-400'}`}>
                  {summary.networkRiskScore} / 100
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">Outliers</span>
                <span className="text-amber-400 font-bold tabular-nums">{summary.anomalousRecords}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Profile Section at the Bottom */}
      <div className="p-3 border-t border-cyan-500/15 bg-[#080B12]/80">
        {!sidebarCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#101827]/60 border border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-[0_0_10px_rgba(0,229,255,0.3)]">
                SG
              </div>
              <div className="leading-tight">
                <span className="text-xs font-semibold text-slate-200 block truncate max-w-[100px]">
                  SecOps Lead
                </span>
                <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]"></span>
                  <span>SURVEILLANCE</span>
                </span>
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
              SOC-1
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-[0_0_10px_rgba(0,229,255,0.3)]" title="SecOps Lead (SOC-1)">
            SG
          </div>
        )}
      </div>
    </aside>
  );
};
