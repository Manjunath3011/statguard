export type Protocol = 'TCP' | 'UDP' | 'ICMP' | 'HTTP' | 'HTTPS' | 'DNS' | 'SSH' | string;

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AttackCategory =
  | 'DDoS Attack'
  | 'DoS Attack'
  | 'Port Scanning'
  | 'Brute Force Attack'
  | 'Suspicious Data Exfiltration'
  | 'Network Flooding'
  | 'Unusual Network Access'
  | 'Normal Traffic';

export type InvestigationStatus = 'Under Investigation' | 'Confirmed Threat' | 'False Positive' | 'Resolved';

export interface NetworkPacketRecord {
  id: string;
  timestamp: string;
  sourceIp: string;
  destIp: string;
  sourcePort: number;
  destPort: number;
  protocol: Protocol;
  packetCount: number;
  packetLength: number; // average or max bytes
  flowDuration: number; // in milliseconds or seconds
  fwdPackets: number;
  bwdPackets: number;
  totalBytes: number;
  connectionFrequency: number; // packets/connections per second
  rawRowData?: Record<string, string | number>;
}

export interface StatisticalMetricBreakdown {
  zScore: number;
  zScoreFlagged: boolean;
  iqrFlagged: boolean;
  iqrValue: number;
  iqrLowerBound: number;
  iqrUpperBound: number;
  movingAvgDeviation: number;
  movingAvgFlagged: boolean;
  entropyValue: number;
  entropyDeviation: number;
  entropyFlagged: boolean;
  isolationForestScore: number; // 0 to 1, >0.6 typically anomalous
  isolationForestFlagged: boolean;
  compositeScore: number; // 0 to 100
}

export interface AnomalyDetectionResult {
  id: string;
  packetRecord: NetworkPacketRecord;
  compositeScore: number;
  severity: SeverityLevel;
  predictedAttack: AttackCategory;
  detectionMethods: string[];
  primaryReasons: string[];
  metrics: StatisticalMetricBreakdown;
  status: InvestigationStatus;
  analystNotes?: string;
  updatedAt: string;
}

export interface PreprocessingStats {
  totalRawRows: number;
  validRows: number;
  duplicatesRemoved: number;
  missingValuesHandled: number;
  featuresNormalized: string[];
  columnMapping: Record<string, string>;
  parsingErrors: string[];
}

export interface DatasetAnalysisSummary {
  datasetName: string;
  analyzedAt: string;
  totalRecords: number;
  normalRecords: number;
  anomalousRecords: number;
  anomalyRate: number; // percentage
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  networkRiskScore: number; // 0 to 100
  categoryCounts: Record<AttackCategory, number>;
  protocolCounts: Record<string, number>;
  records: NetworkPacketRecord[];
  anomalies: AnomalyDetectionResult[];
  preprocessing: PreprocessingStats;
  featureBaselines: Record<string, {
    mean: number;
    stdDev: number;
    variance: number;
    median: number;
    iqr: number;
    q1: number;
    q3: number;
    lowerBound: number;
    upperBound: number;
    min: number;
    max: number;
  }>;
}

export interface DetectionSettings {
  zScoreThreshold: number; // default: 2.5
  iqrMultiplier: number; // default: 1.5
  isolationForestContamination: number; // default: 0.10
  entropyWindowSize: number; // default: 20
  entropyLowThreshold: number; // default: 1.2
  movingAvgWindowSize: number; // default: 10
  riskWeights: {
    packetVolume: number;
    byteVolume: number;
    frequency: number;
    duration: number;
    entropy: number;
    isolationForest: number;
  };
  severityThresholds: {
    critical: number; // e.g. 80
    high: number; // e.g. 60
    medium: number; // e.g. 35
  };
}
