import {
  AnomalyDetectionResult,
  DatasetAnalysisSummary,
  DetectionSettings,
  InvestigationStatus,
  NetworkPacketRecord,
  PreprocessingStats
} from '../types/network';

export type DataSourceMode = 'backend' | 'simulated' | 'empty';

export interface ApiErrorInfo {
  message: string;
  statusCode?: number;
  endpoint: string;
  isNetworkError: boolean;
  detail?: unknown;
  timestamp: string;
}

export interface ApiUploadResponse {
  datasetId: string;
  datasetName: string;
  filename: string;
  totalRows: number;
  validRows: number;
  message: string;
  uploadedAt: string;
  preprocessing: PreprocessingStats;
  summary?: DatasetAnalysisSummary;
}

export interface ApiAnalyzeRequest {
  datasetId?: string;
  datasetName?: string;
  settings: DetectionSettings;
}

export interface ApiAnalyzeResponse {
  summary: DatasetAnalysisSummary;
  message?: string;
}

export interface ApiDashboardResponse {
  summary: DatasetAnalysisSummary;
  hasDataset: boolean;
}

export interface ApiThreatsQuery {
  severity?: string;
  category?: string;
  search?: string;
}

export interface ApiThreatsResponse {
  threats: AnomalyDetectionResult[];
  total: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface ApiThreatInvestigationResponse {
  threat: AnomalyDetectionResult;
  featureBaselines?: DatasetAnalysisSummary['featureBaselines'];
  tacticalRecommendations?: string[];
  rawFlowDetails?: Record<string, unknown>;
}

export interface ApiThreatStatusUpdateRequest {
  status: InvestigationStatus;
  analystNotes?: string;
}

export interface RawFastApiPayload {
  [key: string]: unknown;
}

export type RawPacketRecordPayload = Partial<NetworkPacketRecord> & RawFastApiPayload;
