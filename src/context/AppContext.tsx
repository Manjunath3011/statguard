import React, { createContext, useContext, useState, useEffect, useTransition } from 'react';
import {
  DatasetAnalysisSummary,
  DetectionSettings,
  AnomalyDetectionResult,
  InvestigationStatus,
  NetworkPacketRecord
} from '../types/network';
import { DEFAULT_SETTINGS, analyzeNetworkDataset } from '../utils/threatClassifier';
import {
  generateBenchmarkDataset,
  generateCleanBaselineDataset,
  generateFloodingDataset
} from '../utils/sampleData';
import { parseNetworkCSV } from '../utils/csvParser';

export type NavigationPage =
  | 'dashboard'
  | 'monitoring'
  | 'upload'
  | 'statistical'
  | 'detection'
  | 'investigation'
  | 'reports'
  | 'settings';

interface LivePacketEvent {
  id: string;
  timestamp: string;
  sourceIp: string;
  destIp: string;
  sourcePort: number;
  destPort: number;
  protocol: string;
  packetCount: number;
  bytes: number;
  isAnomaly: boolean;
  attackType?: string;
  score: number;
}

interface AppContextType {
  activePage: NavigationPage;
  setActivePage: (page: NavigationPage) => void;
  summary: DatasetAnalysisSummary;
  settings: DetectionSettings;
  updateSettings: (newSettings: DetectionSettings) => void;
  loadSample: (type: 'benchmark' | 'clean' | 'flooding') => void;
  processUploadedFile: (content: string, fileName: string) => void;
  selectedAlert: AnomalyDetectionResult | null;
  setSelectedAlert: (alert: AnomalyDetectionResult | null) => void;
  selectAlertForInvestigation: (alert: AnomalyDetectionResult) => void;
  updateAlertStatus: (alertId: string, status: InvestigationStatus, notes?: string) => void;

  // Live Monitoring State
  isMonitoringActive: boolean;
  setIsMonitoringActive: (active: boolean) => void;
  monitoringSpeed: number; // 1x, 2x, 5x
  setMonitoringSpeed: (speed: number) => void;
  livePackets: LivePacketEvent[];
  liveIncomingPps: number;
  liveOutgoingPps: number;
  liveBytesSec: number;
  liveRecentThreats: LivePacketEvent[];
  injectLiveAttack: (type: 'ddos' | 'portscan' | 'exfiltration' | 'bruteforce') => void;
  clearLiveStream: () => void;
  // Sidebar Collapsible state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<NavigationPage>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [settings, setSettings] = useState<DetectionSettings>(DEFAULT_SETTINGS);
  const [, startTransition] = useTransition();

  // Initialize with the realistic benchmark dataset
  const [summary, setSummary] = useState<DatasetAnalysisSummary>(() => {
    const initialRecords = generateBenchmarkDataset();
    return analyzeNetworkDataset(initialRecords, DEFAULT_SETTINGS, 'CIC-IDS2017 & UNSW-NB15 Benchmark Blend');
  });

  const [selectedAlert, setSelectedAlert] = useState<AnomalyDetectionResult | null>(() => {
    return summary.anomalies.length > 0 ? summary.anomalies[0] : null;
  });

  // Re-run analysis when settings change
  const updateSettings = (newSettings: DetectionSettings) => {
    setSettings(newSettings);
    startTransition(() => {
      const reanalyzed = analyzeNetworkDataset(summary.records, newSettings, summary.datasetName, summary.preprocessing);
      setSummary(reanalyzed);
      if (selectedAlert) {
        const found = reanalyzed.anomalies.find(a => a.id === selectedAlert.id);
        if (found) setSelectedAlert(found);
      }
    });
  };

  const loadSample = (type: 'benchmark' | 'clean' | 'flooding') => {
    let records: NetworkPacketRecord[];
    let name: string;
    if (type === 'benchmark') {
      records = generateBenchmarkDataset();
      name = 'CIC-IDS2017 & UNSW-NB15 Benchmark Blend';
    } else if (type === 'clean') {
      records = generateCleanBaselineDataset();
      name = 'Enterprise Baseline Clean Network';
    } else {
      records = generateFloodingDataset();
      name = 'High-Volume Network Flooding Scenario';
    }

    startTransition(() => {
      const result = analyzeNetworkDataset(records, settings, name);
      setSummary(result);
      setSelectedAlert(result.anomalies.length > 0 ? result.anomalies[0] : null);
    });
  };

  const processUploadedFile = (content: string, fileName: string) => {
    const { records, stats } = parseNetworkCSV(content);
    startTransition(() => {
      const result = analyzeNetworkDataset(records, settings, fileName, stats);
      setSummary(result);
      setSelectedAlert(result.anomalies.length > 0 ? result.anomalies[0] : null);
      setActivePage('detection');
    });
  };

  const selectAlertForInvestigation = (alert: AnomalyDetectionResult) => {
    setSelectedAlert(alert);
    setActivePage('investigation');
  };

  const updateAlertStatus = (alertId: string, status: InvestigationStatus, notes?: string) => {
    setSummary(prev => {
      const updatedAnomalies = prev.anomalies.map(a => {
        if (a.id === alertId) {
          return {
            ...a,
            status,
            analystNotes: notes !== undefined ? notes : a.analystNotes,
            updatedAt: new Date().toISOString()
          };
        }
        return a;
      });

      return {
        ...prev,
        anomalies: updatedAnomalies
      };
    });

    if (selectedAlert && selectedAlert.id === alertId) {
      setSelectedAlert(prev => prev ? {
        ...prev,
        status,
        analystNotes: notes !== undefined ? notes : prev.analystNotes,
        updatedAt: new Date().toISOString()
      } : null);
    }
  };

  // ---------------------------------------------------------------------------
  // Real-Time Simulated Network Monitoring Engine
  // ---------------------------------------------------------------------------
  const [isMonitoringActive, setIsMonitoringActive] = useState<boolean>(true);
  const [monitoringSpeed, setMonitoringSpeed] = useState<number>(1);
  const [livePackets, setLivePackets] = useState<LivePacketEvent[]>([]);
  const [liveRecentThreats, setLiveRecentThreats] = useState<LivePacketEvent[]>([]);
  const [liveIncomingPps, setLiveIncomingPps] = useState<number>(340);
  const [liveOutgoingPps, setLiveOutgoingPps] = useState<number>(290);
  const [liveBytesSec, setLiveBytesSec] = useState<number>(450000);

  // Live attack injection queue
  const [injectedAttack, setInjectedAttack] = useState<string | null>(null);

  const injectLiveAttack = (type: 'ddos' | 'portscan' | 'exfiltration' | 'bruteforce') => {
    setInjectedAttack(type);
  };

  const clearLiveStream = () => {
    setLivePackets([]);
    setLiveRecentThreats([]);
  };

  useEffect(() => {
    if (!isMonitoringActive) return;

    const intervalTime = Math.max(250, 1000 / monitoringSpeed);
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString();

      let isAttack = false;
      let attackType = '';
      let score = Math.floor(8 + Math.random() * 15);
      let srcIp = `192.168.1.${Math.floor(10 + Math.random() * 200)}`;
      let dstIp = `172.16.0.${Math.floor(2 + Math.random() * 25)}`;
      let sport = 40000 + Math.floor(Math.random() * 25000);
      let dport = [80, 443, 53, 5432, 22][Math.floor(Math.random() * 5)];
      let protocol = dport === 53 ? 'UDP' : 'TCP';
      let packetCount = Math.floor(5 + Math.random() * 20);
      let bytes = packetCount * Math.floor(200 + Math.random() * 600);

      // Handle injected attack or sporadic anomaly
      if (injectedAttack || Math.random() < 0.08) {
        isAttack = true;
        const chosen = injectedAttack || ['ddos', 'portscan', 'exfiltration', 'bruteforce'][Math.floor(Math.random() * 4)];

        if (chosen === 'ddos') {
          attackType = 'DDoS Flood Surge';
          srcIp = `185.220.${Math.floor(100 + Math.random() * 50)}.${Math.floor(1 + Math.random() * 250)}`;
          dstIp = '172.16.0.10';
          dport = 80;
          packetCount = Math.floor(3500 + Math.random() * 2000);
          bytes = packetCount * 64;
          score = Math.floor(88 + Math.random() * 10);
        } else if (chosen === 'portscan') {
          attackType = 'Port Scanning Probe';
          srcIp = '103.145.13.2';
          dstIp = '172.16.0.15';
          dport = Math.floor(20 + Math.random() * 1000);
          packetCount = 2;
          bytes = 120;
          score = Math.floor(65 + Math.random() * 15);
        } else if (chosen === 'exfiltration') {
          attackType = 'Data Exfiltration Outflow';
          srcIp = '172.16.0.15';
          dstIp = '194.26.29.112';
          dport = 8443;
          packetCount = 14500;
          bytes = 21000000;
          score = Math.floor(92 + Math.random() * 6);
        } else {
          attackType = 'SSH Brute Force';
          srcIp = '45.154.255.89';
          dstIp = '172.16.0.10';
          dport = 22;
          protocol = 'SSH';
          packetCount = 35;
          bytes = 6800;
          score = Math.floor(74 + Math.random() * 12);
        }

        if (injectedAttack) {
          setInjectedAttack(null); // consume one-shot injection
        }
      }

      const event: LivePacketEvent = {
        id: `live-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: timeStr,
        sourceIp: srcIp,
        destIp: dstIp,
        sourcePort: sport,
        destPort: dport,
        protocol,
        packetCount,
        bytes,
        isAnomaly: isAttack,
        attackType: isAttack ? attackType : undefined,
        score
      };

      setLivePackets(prev => [event, ...prev.slice(0, 49)]);

      if (isAttack) {
        setLiveRecentThreats(prev => [event, ...prev.slice(0, 19)]);
      }

      // Update PPS rates
      setLiveIncomingPps(prev => {
        const delta = Math.floor((Math.random() - 0.48) * 35);
        return Math.max(120, prev + delta + (isAttack ? 400 : 0));
      });
      setLiveOutgoingPps(prev => {
        const delta = Math.floor((Math.random() - 0.48) * 30);
        return Math.max(90, prev + delta);
      });
      setLiveBytesSec(prev => {
        const delta = Math.floor((Math.random() - 0.48) * 45000);
        return Math.max(180000, prev + delta + (isAttack ? 1500000 : 0));
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isMonitoringActive, monitoringSpeed, injectedAttack]);

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        summary,
        settings,
        updateSettings,
        loadSample,
        processUploadedFile,
        selectedAlert,
        setSelectedAlert,
        selectAlertForInvestigation,
        updateAlertStatus,
        isMonitoringActive,
        setIsMonitoringActive,
        monitoringSpeed,
        setMonitoringSpeed,
        livePackets,
        liveIncomingPps,
        liveOutgoingPps,
        liveBytesSec,
        liveRecentThreats,
        injectLiveAttack,
        clearLiveStream,
        sidebarCollapsed,
        setSidebarCollapsed
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
