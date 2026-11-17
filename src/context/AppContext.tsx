import React, { createContext, useContext, useState, useEffect, useTransition, useCallback } from 'react';
import {
  DatasetAnalysisSummary,
  DetectionSettings,
  AnomalyDetectionResult,
  InvestigationStatus,
  NetworkPacketRecord
} from '../types/network';
import {
  ApiErrorInfo,
  ApiThreatInvestigationResponse,
  ApiThreatsQuery,
  ApiUploadResponse,
  DataSourceMode
} from '../types/api';
import { DEFAULT_SETTINGS, analyzeNetworkDataset } from '../utils/threatClassifier';
import {
  generateBenchmarkDataset,
  generateCleanBaselineDataset,
  generateFloodingDataset
} from '../utils/sampleData';
import { parseNetworkCSV } from '../utils/csvParser';
import {
  createEmptySummary,
  StatGuardApiError,
  statGuardApi
} from '../services/apiService';

export type NavigationPage =
  | 'dashboard'
  | 'monitoring'
  | 'upload'
  | 'statistical'
  | 'detection'
  | 'investigation'
  | 'reports'
  | 'settings';

export interface LivePacketEvent {
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
  threats: AnomalyDetectionResult[];
  settings: DetectionSettings;
  updateSettings: (newSettings: DetectionSettings) => void;
  loadSample: (type: 'benchmark' | 'clean' | 'flooding') => void;
  processUploadedFile: (content: string, fileName: string) => void;
  selectedAlert: AnomalyDetectionResult | null;
  setSelectedAlert: (alert: AnomalyDetectionResult | null) => void;
  selectAlertForInvestigation: (alert: AnomalyDetectionResult) => void;
  updateAlertStatus: (alertId: string, status: InvestigationStatus, notes?: string) => void;

  // FastAPI Backend Integration State & Actions
  backendBaseUrl: string;
  dataSourceMode: DataSourceMode;
  isDashboardLoading: boolean;
  dashboardError: ApiErrorInfo | null;
  isThreatsLoading: boolean;
  threatsError: ApiErrorInfo | null;
  isUploading: boolean;
  uploadError: ApiErrorInfo | null;
  lastUploadResult: ApiUploadResponse | null;
  isAnalyzing: boolean;
  analyzeError: ApiErrorInfo | null;
  lastAnalysisMessage: string | null;
  isInvestigating: boolean;
  investigationError: ApiErrorInfo | null;
  investigationDetails: ApiThreatInvestigationResponse | null;

  refreshDashboard: () => Promise<void>;
  refreshThreats: (query?: ApiThreatsQuery) => Promise<void>;
  uploadCsvToBackend: (file: File) => Promise<ApiUploadResponse | null>;
  runBackendAnalysis: (overrideSettings?: DetectionSettings) => Promise<boolean>;
  investigateThreatById: (threatId: string) => Promise<void>;
  clearErrors: () => void;

  // Simulated Live Monitoring State (Client-Side Probe)
  isMonitoringActive: boolean;
  setIsMonitoringActive: (active: boolean) => void;
  monitoringSpeed: number; // 1x, 2x, 4x
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

function toApiErrorInfo(err: unknown, endpoint: string): ApiErrorInfo {
  if (err instanceof StatGuardApiError) {
    return err.toInfo();
  }
  return {
    message: err instanceof Error ? err.message : 'Unexpected API error',
    endpoint,
    isNetworkError: false,
    timestamp: new Date().toISOString()
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<NavigationPage>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [settings, setSettings] = useState<DetectionSettings>(DEFAULT_SETTINGS);
  const [, startTransition] = useTransition();

  // Primary state — initialized empty until real FastAPI data is received
  const [summary, setSummary] = useState<DatasetAnalysisSummary>(() => createEmptySummary());
  const [threats, setThreats] = useState<AnomalyDetectionResult[]>([]);
  const [dataSourceMode, setDataSourceMode] = useState<DataSourceMode>('empty');

  const [selectedAlert, setSelectedAlert] = useState<AnomalyDetectionResult | null>(null);
  const [investigationDetails, setInvestigationDetails] =
    useState<ApiThreatInvestigationResponse | null>(null);

  // Loading & Error states for each backend integration flow
  const [isDashboardLoading, setIsDashboardLoading] = useState<boolean>(true);
  const [dashboardError, setDashboardError] = useState<ApiErrorInfo | null>(null);

  const [isThreatsLoading, setIsThreatsLoading] = useState<boolean>(false);
  const [threatsError, setThreatsError] = useState<ApiErrorInfo | null>(null);

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<ApiErrorInfo | null>(null);
  const [lastUploadResult, setLastUploadResult] = useState<ApiUploadResponse | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzeError, setAnalyzeError] = useState<ApiErrorInfo | null>(null);
  const [lastAnalysisMessage, setLastAnalysisMessage] = useState<string | null>(null);

  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);
  const [investigationError, setInvestigationError] = useState<ApiErrorInfo | null>(null);

  const backendBaseUrl = statGuardApi.getBaseUrl();

  const clearErrors = useCallback(() => {
    setDashboardError(null);
    setThreatsError(null);
    setUploadError(null);
    setAnalyzeError(null);
    setInvestigationError(null);
  }, []);

  // GET /api/dashboard
  const refreshDashboard = useCallback(async () => {
    setIsDashboardLoading(true);
    setDashboardError(null);
    try {
      const response = await statGuardApi.getDashboardMetrics();
      setSummary(response.summary);
      if (response.summary.anomalies.length > 0) {
        setThreats(response.summary.anomalies);
      }
      setDataSourceMode(response.hasDataset ? 'backend' : 'empty');
    } catch (err: unknown) {
      setDashboardError(toApiErrorInfo(err, '/api/dashboard'));
    } finally {
      setIsDashboardLoading(false);
    }
  }, []);

  // GET /api/threats
  const refreshThreats = useCallback(async (query?: ApiThreatsQuery) => {
    setIsThreatsLoading(true);
    setThreatsError(null);
    try {
      const response = await statGuardApi.getDetectedThreats(query);
      setThreats(response.threats);
      setSummary(prev => {
        if (prev.totalRecords === 0 && response.threats.length === 0) {
          return prev;
        }
        return {
          ...prev,
          anomalies: response.threats
        };
      });
    } catch (err: unknown) {
      setThreatsError(toApiErrorInfo(err, '/api/threats'));
    } finally {
      setIsThreatsLoading(false);
    }
  }, []);

  // Initial load from FastAPI backend
  useEffect(() => {
    void refreshDashboard();
    void refreshThreats();
  }, [refreshDashboard, refreshThreats]);

  // POST /api/upload
  const uploadCsvToBackend = useCallback(async (file: File): Promise<ApiUploadResponse | null> => {
    setIsUploading(true);
    setUploadError(null);
    setAnalyzeError(null);
    setLastAnalysisMessage(null);
    try {
      const result = await statGuardApi.uploadDatasetCsv(file);
      setLastUploadResult(result);

      if (result.summary) {
        setSummary(result.summary);
        setThreats(result.summary.anomalies);
        setDataSourceMode('backend');
      } else {
        setSummary(prev => ({
          ...prev,
          datasetId: result.datasetId || prev.datasetId,
          datasetName: result.datasetName || file.name,
          preprocessing: result.preprocessing
        }));
      }

      return result;
    } catch (err: unknown) {
      setUploadError(toApiErrorInfo(err, '/api/upload'));
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  // POST /api/analyze
  const runBackendAnalysis = useCallback(
    async (overrideSettings?: DetectionSettings): Promise<boolean> => {
      setIsAnalyzing(true);
      setAnalyzeError(null);
      setDashboardError(null);
      setThreatsError(null);

      try {
        const activeSettings = overrideSettings ?? settings;
        const response = await statGuardApi.analyzeDataset({
          datasetId: lastUploadResult?.datasetId ?? summary.datasetId,
          datasetName: lastUploadResult?.datasetName ?? (dataSourceMode === 'backend' ? summary.datasetName : undefined),
          settings: activeSettings
        });

        setSummary(response.summary);
        setThreats(response.summary.anomalies);
        setDataSourceMode(
          response.summary.totalRecords > 0 || response.summary.anomalies.length > 0
            ? 'backend'
            : 'empty'
        );
        setSelectedAlert(
          response.summary.anomalies.length > 0 ? response.summary.anomalies[0] : null
        );
        setLastAnalysisMessage(response.message || 'Statistical analysis completed via FastAPI.');

        // Also synchronize GET /api/dashboard and GET /api/threats if backend persists analysis state
        try {
          const [dashRes, threatsRes] = await Promise.allSettled([
            statGuardApi.getDashboardMetrics(),
            statGuardApi.getDetectedThreats()
          ]);
          if (dashRes.status === 'fulfilled' && dashRes.value.hasDataset) {
            setSummary(dashRes.value.summary);
          }
          if (threatsRes.status === 'fulfilled' && threatsRes.value.threats.length > 0) {
            setThreats(threatsRes.value.threats);
          }
        } catch {
          // Keep direct POST /api/analyze summary if secondary sync endpoints are optional
        }

        return true;
      } catch (err: unknown) {
        setAnalyzeError(toApiErrorInfo(err, '/api/analyze'));
        return false;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [settings, lastUploadResult, summary.datasetId, summary.datasetName, dataSourceMode]
  );

  // GET /api/investigate/{id}
  const investigateThreatById = useCallback(async (threatId: string) => {
    setIsInvestigating(true);
    setInvestigationError(null);
    try {
      const detail = await statGuardApi.getThreatInvestigation(threatId);
      setInvestigationDetails(detail);
      setSelectedAlert(detail.threat);
    } catch (err: unknown) {
      setInvestigationError(toApiErrorInfo(err, `/api/investigate/${threatId}`));
    } finally {
      setIsInvestigating(false);
    }
  }, []);

  const updateSettings = (newSettings: DetectionSettings) => {
    setSettings(newSettings);
    if (dataSourceMode === 'simulated' && summary.records.length > 0) {
      startTransition(() => {
        const reanalyzed = analyzeNetworkDataset(
          summary.records,
          newSettings,
          summary.datasetName,
          summary.preprocessing
        );
        setSummary(reanalyzed);
        setThreats(reanalyzed.anomalies);
        if (selectedAlert) {
          const found = reanalyzed.anomalies.find(a => a.id === selectedAlert.id);
          if (found) setSelectedAlert(found);
        }
      });
    }
  };

  // Explicit client-side simulated benchmark presets (clearly separated from real FastAPI detection)
  const loadSample = (type: 'benchmark' | 'clean' | 'flooding') => {
    let records: NetworkPacketRecord[];
    let name: string;
    if (type === 'benchmark') {
      records = generateBenchmarkDataset();
      name = 'CIC-IDS2017 & UNSW-NB15 Simulated Benchmark';
    } else if (type === 'clean') {
      records = generateCleanBaselineDataset();
      name = 'Enterprise Baseline Simulated Network';
    } else {
      records = generateFloodingDataset();
      name = 'Simulated Network Flooding Scenario';
    }

    clearErrors();
    startTransition(() => {
      const result = analyzeNetworkDataset(records, settings, name);
      setSummary(result);
      setThreats(result.anomalies);
      setDataSourceMode('simulated');
      setInvestigationDetails(null);
      setSelectedAlert(result.anomalies.length > 0 ? result.anomalies[0] : null);
    });
  };

  // Client-side CSV fallback parser helper (retained only if explicitly invoked)
  const processUploadedFile = (content: string, fileName: string) => {
    const { records, stats } = parseNetworkCSV(content);
    startTransition(() => {
      const result = analyzeNetworkDataset(records, settings, fileName, stats);
      setSummary(result);
      setThreats(result.anomalies);
      setDataSourceMode('simulated');
      setSelectedAlert(result.anomalies.length > 0 ? result.anomalies[0] : null);
      setActivePage('detection');
    });
  };

  const selectAlertForInvestigation = (alert: AnomalyDetectionResult) => {
    setSelectedAlert(alert);
    setInvestigationDetails(null);
    setInvestigationError(null);
    setActivePage('investigation');

    if (dataSourceMode !== 'simulated') {
      void investigateThreatById(alert.id);
    }
  };

  const updateAlertStatus = (alertId: string, status: InvestigationStatus, notes?: string) => {
    const updater = (a: AnomalyDetectionResult) =>
      a.id === alertId
        ? {
            ...a,
            status,
            analystNotes: notes !== undefined ? notes : a.analystNotes,
            updatedAt: new Date().toISOString()
          }
        : a;

    setSummary(prev => ({
      ...prev,
      anomalies: prev.anomalies.map(updater)
    }));
    setThreats(prev => prev.map(updater));

    if (selectedAlert && selectedAlert.id === alertId) {
      setSelectedAlert(prev =>
        prev
          ? {
              ...prev,
              status,
              analystNotes: notes !== undefined ? notes : prev.analystNotes,
              updatedAt: new Date().toISOString()
            }
          : null
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Real-Time Simulated Network Monitoring Engine (Client-Side Probe)
  // ---------------------------------------------------------------------------
  const [isMonitoringActive, setIsMonitoringActive] = useState<boolean>(true);
  const [monitoringSpeed, setMonitoringSpeed] = useState<number>(1);
  const [livePackets, setLivePackets] = useState<LivePacketEvent[]>([]);
  const [liveRecentThreats, setLiveRecentThreats] = useState<LivePacketEvent[]>([]);
  const [liveIncomingPps, setLiveIncomingPps] = useState<number>(340);
  const [liveOutgoingPps, setLiveOutgoingPps] = useState<number>(290);
  const [liveBytesSec, setLiveBytesSec] = useState<number>(450000);
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
      const sport = 40000 + Math.floor(Math.random() * 25000);
      let dport = [80, 443, 53, 5432, 22][Math.floor(Math.random() * 5)];
      let protocol = dport === 53 ? 'UDP' : 'TCP';
      let packetCount = Math.floor(5 + Math.random() * 20);
      let bytes = packetCount * Math.floor(200 + Math.random() * 600);

      if (injectedAttack || Math.random() < 0.08) {
        isAttack = true;
        const chosen =
          injectedAttack || ['ddos', 'portscan', 'exfiltration', 'bruteforce'][Math.floor(Math.random() * 4)];

        if (chosen === 'ddos') {
          attackType = 'DDoS Flood Surge (Simulated)';
          srcIp = `185.220.${Math.floor(100 + Math.random() * 50)}.${Math.floor(1 + Math.random() * 250)}`;
          dstIp = '172.16.0.10';
          dport = 80;
          packetCount = Math.floor(3500 + Math.random() * 2000);
          bytes = packetCount * 64;
          score = Math.floor(88 + Math.random() * 10);
        } else if (chosen === 'portscan') {
          attackType = 'Port Scanning Probe (Simulated)';
          srcIp = '103.145.13.2';
          dstIp = '172.16.0.15';
          dport = Math.floor(20 + Math.random() * 1000);
          packetCount = 2;
          bytes = 120;
          score = Math.floor(65 + Math.random() * 15);
        } else if (chosen === 'exfiltration') {
          attackType = 'Data Exfiltration Outflow (Simulated)';
          srcIp = '172.16.0.15';
          dstIp = '194.26.29.112';
          dport = 8443;
          packetCount = 14500;
          bytes = 21000000;
          score = Math.floor(92 + Math.random() * 6);
        } else {
          attackType = 'SSH Brute Force (Simulated)';
          srcIp = '45.154.255.89';
          dstIp = '172.16.0.10';
          dport = 22;
          protocol = 'SSH';
          packetCount = 35;
          bytes = 6800;
          score = Math.floor(74 + Math.random() * 12);
        }

        if (injectedAttack) {
          setInjectedAttack(null);
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
        threats,
        settings,
        updateSettings,
        loadSample,
        processUploadedFile,
        selectedAlert,
        setSelectedAlert,
        selectAlertForInvestigation,
        updateAlertStatus,
        backendBaseUrl,
        dataSourceMode,
        isDashboardLoading,
        dashboardError,
        isThreatsLoading,
        threatsError,
        isUploading,
        uploadError,
        lastUploadResult,
        isAnalyzing,
        analyzeError,
        lastAnalysisMessage,
        isInvestigating,
        investigationError,
        investigationDetails,
        refreshDashboard,
        refreshThreats,
        uploadCsvToBackend,
        runBackendAnalysis,
        investigateThreatById,
        clearErrors,
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
