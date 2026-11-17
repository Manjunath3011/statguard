import { API_CONFIG, API_ENDPOINTS } from '../config/api';
import {
  ApiAnalyzeRequest,
  ApiAnalyzeResponse,
  ApiDashboardResponse,
  ApiErrorInfo,
  ApiThreatInvestigationResponse,
  ApiThreatsQuery,
  ApiThreatsResponse,
  ApiUploadResponse,
  RawFastApiPayload
} from '../types/api';
import {
  AnomalyDetectionResult,
  AttackCategory,
  DatasetAnalysisSummary,
  InvestigationStatus,
  NetworkPacketRecord,
  PreprocessingStats,
  SeverityLevel,
  StatisticalMetricBreakdown
} from '../types/network';

export class StatGuardApiError extends Error {
  public readonly statusCode?: number;
  public readonly endpoint: string;
  public readonly isNetworkError: boolean;
  public readonly detail?: unknown;
  public readonly timestamp: string;

  constructor(params: ApiErrorInfo) {
    super(params.message);
    this.name = 'StatGuardApiError';
    this.statusCode = params.statusCode;
    this.endpoint = params.endpoint;
    this.isNetworkError = params.isNetworkError;
    this.detail = params.detail;
    this.timestamp = params.timestamp;
  }

  public toInfo(): ApiErrorInfo {
    return {
      message: this.message,
      statusCode: this.statusCode,
      endpoint: this.endpoint,
      isNetworkError: this.isNetworkError,
      detail: this.detail,
      timestamp: this.timestamp
    };
  }
}

export function createEmptySummary(datasetName = 'Awaiting Backend Dataset'): DatasetAnalysisSummary {
  return {
    datasetId: undefined,
    datasetName,
    analyzedAt: '',
    totalRecords: 0,
    totalPackets: 0,
    normalRecords: 0,
    anomalousRecords: 0,
    normalPercentage: 0,
    suspiciousPercentage: 0,
    anomalyRate: 0,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    networkRiskScore: 0,
    categoryCounts: {
      'DDoS Attack': 0,
      'DoS Attack': 0,
      'Port Scanning': 0,
      'Brute Force Attack': 0,
      'Suspicious Data Exfiltration': 0,
      'Network Flooding': 0,
      'Unusual Network Access': 0,
      'Normal Traffic': 0
    },
    protocolCounts: {},
    records: [],
    anomalies: [],
    preprocessing: {
      totalRawRows: 0,
      validRows: 0,
      duplicatesRemoved: 0,
      missingValuesHandled: 0,
      featuresNormalized: [],
      columnMapping: {},
      parsingErrors: []
    },
    timeSeries: [],
    methodCounts: {
      zScore: 0,
      iqr: 0,
      movingAvg: 0,
      isolationForest: 0,
      entropyValue: null
    },
    featureBaselines: {}
  };
}

function asNumber(val: unknown, fallback = 0): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = Number(val);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asString(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : fallback;
}

function asBoolean(val: unknown, fallback = false): boolean {
  return typeof val === 'boolean' ? val : fallback;
}

function asStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.map(v => String(v));
}

function normalizeSeverity(val: unknown): SeverityLevel {
  const upper = String(val || 'LOW').toUpperCase();
  if (upper === 'CRITICAL' || upper === 'HIGH' || upper === 'MEDIUM' || upper === 'LOW') {
    return upper;
  }
  return 'LOW';
}

function normalizeStatus(val: unknown): InvestigationStatus {
  const s = String(val || 'Under Investigation');
  if (
    s === 'Under Investigation' ||
    s === 'Confirmed Threat' ||
    s === 'False Positive' ||
    s === 'Resolved'
  ) {
    return s;
  }
  return 'Under Investigation';
}

function normalizeAttackCategory(val: unknown): AttackCategory {
  const raw = String(val || 'Unusual Network Access');
  const valid: AttackCategory[] = [
    'DDoS Attack',
    'DoS Attack',
    'Port Scanning',
    'Brute Force Attack',
    'Suspicious Data Exfiltration',
    'Network Flooding',
    'Unusual Network Access',
    'Normal Traffic'
  ];
  const matched = valid.find(v => v.toLowerCase() === raw.toLowerCase());
  return matched || (raw as AttackCategory);
}

function normalizePacketRecord(raw: RawFastApiPayload, index = 0): NetworkPacketRecord {
  return {
    id: asString(raw.id ?? raw.record_id ?? raw.flow_id, `flow-${index + 1}`),
    timestamp: asString(raw.timestamp ?? raw.captured_at, new Date().toISOString()),
    sourceIp: asString(raw.sourceIp ?? raw.source_ip ?? raw.src_ip, '0.0.0.0'),
    destIp: asString(raw.destIp ?? raw.dest_ip ?? raw.dst_ip, '0.0.0.0'),
    sourcePort: asNumber(raw.sourcePort ?? raw.source_port ?? raw.src_port, 0),
    destPort: asNumber(raw.destPort ?? raw.dest_port ?? raw.dst_port, 0),
    protocol: asString(raw.protocol ?? raw.proto, 'TCP'),
    packetCount: asNumber(raw.packetCount ?? raw.packet_count ?? raw.packets, 0),
    packetLength: asNumber(raw.packetLength ?? raw.packet_length ?? raw.avg_packet_size, 0),
    flowDuration: asNumber(raw.flowDuration ?? raw.flow_duration ?? raw.duration_ms, 0),
    fwdPackets: asNumber(raw.fwdPackets ?? raw.fwd_packets, 0),
    bwdPackets: asNumber(raw.bwdPackets ?? raw.bwd_packets, 0),
    totalBytes: asNumber(raw.totalBytes ?? raw.total_bytes ?? raw.bytes, 0),
    connectionFrequency: asNumber(raw.connectionFrequency ?? raw.connection_frequency ?? raw.frequency, 0),
    rawRowData:
      raw.rawRowData && typeof raw.rawRowData === 'object'
        ? (raw.rawRowData as Record<string, string | number>)
        : undefined
  };
}

function normalizeMetrics(raw: RawFastApiPayload | undefined): StatisticalMetricBreakdown {
  const m = raw || {};
  return {
    zScore: asNumber(m.zScore ?? m.z_score, 0),
    zScoreFlagged: asBoolean(m.zScoreFlagged ?? m.z_score_flagged, false),
    iqrFlagged: asBoolean(m.iqrFlagged ?? m.iqr_flagged, false),
    iqrValue: asNumber(m.iqrValue ?? m.iqr_value, 0),
    iqrLowerBound: asNumber(m.iqrLowerBound ?? m.iqr_lower_bound, 0),
    iqrUpperBound: asNumber(m.iqrUpperBound ?? m.iqr_upper_bound, 0),
    movingAvgDeviation: asNumber(m.movingAvgDeviation ?? m.moving_avg_deviation, 0),
    movingAvgFlagged: asBoolean(m.movingAvgFlagged ?? m.moving_avg_flagged, false),
    entropyValue: asNumber(m.entropyValue ?? m.entropy_value, 0),
    entropyDeviation: asNumber(m.entropyDeviation ?? m.entropy_deviation, 0),
    entropyFlagged: asBoolean(m.entropyFlagged ?? m.entropy_flagged, false),
    isolationForestScore: asNumber(m.isolationForestScore ?? m.isolation_forest_score, 0),
    isolationForestFlagged: asBoolean(m.isolationForestFlagged ?? m.isolation_forest_flagged, false),
    compositeScore: asNumber(m.compositeScore ?? m.composite_score, 0)
  };
}

export function normalizeAnomalyResult(raw: RawFastApiPayload, index = 0): AnomalyDetectionResult {
  const packetRaw =
    (raw.packetRecord as RawFastApiPayload | undefined) ||
    (raw.packet_record as RawFastApiPayload | undefined) ||
    raw;
  const metricsRaw =
    (raw.metrics as RawFastApiPayload | undefined) ||
    (raw.statistical_metrics as RawFastApiPayload | undefined);

  const compositeScore = asNumber(
    raw.compositeScore ?? raw.composite_score ?? raw.risk_score ?? raw.score ?? metricsRaw?.composite_score,
    0
  );

  return {
    id: asString(raw.id ?? raw.threat_id ?? raw.anomaly_id, `threat-${index + 1}`),
    packetRecord: normalizePacketRecord(packetRaw, index),
    compositeScore,
    severity: normalizeSeverity(raw.severity),
    predictedAttack: normalizeAttackCategory(raw.predictedAttack ?? raw.predicted_attack ?? raw.attack_type ?? raw.category),
    detectionMethods: asStringArray(raw.detectionMethods ?? raw.detection_methods ?? raw.algorithms),
    primaryReasons: asStringArray(raw.primaryReasons ?? raw.primary_reasons ?? raw.reasons),
    metrics: normalizeMetrics(metricsRaw),
    status: normalizeStatus(raw.status),
    analystNotes: asString(raw.analystNotes ?? raw.analyst_notes, ''),
    updatedAt: asString(raw.updatedAt ?? raw.updated_at, new Date().toISOString())
  };
}

function normalizePreprocessing(raw: RawFastApiPayload | undefined): PreprocessingStats {
  const p = raw || {};
  const mappingRaw = (p.columnMapping ?? p.column_mapping) as Record<string, string> | undefined;
  return {
    totalRawRows: asNumber(p.totalRawRows ?? p.total_raw_rows ?? p.total_rows, 0),
    validRows: asNumber(p.validRows ?? p.valid_rows, 0),
    duplicatesRemoved: asNumber(p.duplicatesRemoved ?? p.duplicates_removed, 0),
    missingValuesHandled: asNumber(p.missingValuesHandled ?? p.missing_values_handled, 0),
    featuresNormalized: asStringArray(p.featuresNormalized ?? p.features_normalized),
    columnMapping: mappingRaw && typeof mappingRaw === 'object' ? mappingRaw : {},
    parsingErrors: asStringArray(p.parsingErrors ?? p.parsing_errors)
  };
}

function normalizeFeatureBaselines(
  raw: RawFastApiPayload | undefined
): DatasetAnalysisSummary['featureBaselines'] {
  if (!raw || typeof raw !== 'object') return {};
  const result: DatasetAnalysisSummary['featureBaselines'] = {};

  Object.entries(raw).forEach(([key, value]) => {
    if (!value || typeof value !== 'object') return;
    const b = value as RawFastApiPayload;
    const camelKey =
      key === 'packet_count'
        ? 'packetCount'
        : key === 'total_bytes'
        ? 'totalBytes'
        : key === 'connection_frequency'
        ? 'connectionFrequency'
        : key === 'flow_duration'
        ? 'flowDuration'
        : key;

    result[camelKey] = {
      mean: asNumber(b.mean, 0),
      stdDev: asNumber(b.stdDev ?? b.std_dev, 0),
      variance: asNumber(b.variance, 0),
      median: asNumber(b.median, 0),
      iqr: asNumber(b.iqr, 0),
      q1: asNumber(b.q1, 0),
      q3: asNumber(b.q3, 0),
      lowerBound: asNumber(b.lowerBound ?? b.lower_bound, 0),
      upperBound: asNumber(b.upperBound ?? b.upper_bound, 0),
      min: asNumber(b.min, 0),
      max: asNumber(b.max, 0)
    };
  });

  return result;
}

export function normalizeDashboardSummary(payload: RawFastApiPayload): DatasetAnalysisSummary {
  const root =
    payload.summary && typeof payload.summary === 'object'
      ? (payload.summary as RawFastApiPayload)
      : payload;

  const rawRecords = Array.isArray(root.records)
    ? (root.records as RawFastApiPayload[]).map((r, i) => normalizePacketRecord(r, i))
    : [];

  const rawAnomaliesSource = Array.isArray(root.anomalies)
    ? root.anomalies
    : Array.isArray(root.threats)
    ? root.threats
    : [];
  const rawAnomalies = (rawAnomaliesSource as RawFastApiPayload[]).map((a, i) =>
    normalizeAnomalyResult(a, i)
  );

  const totalRecords = asNumber(root.totalRecords ?? root.total_records, rawRecords.length);
  const anomalousRecords = asNumber(
    root.anomalousRecords ?? root.anomalous_records ?? root.total_anomalies,
    rawAnomalies.length
  );
  const normalRecords = asNumber(
    root.normalRecords ?? root.normal_records,
    Math.max(0, totalRecords - anomalousRecords)
  );

  const rawCategoryCounts =
    (root.categoryCounts ?? root.category_counts ?? root.attack_categories) as
      | Record<string, unknown>
      | undefined;

  const emptyCategories = createEmptySummary().categoryCounts;
  if (rawCategoryCounts && typeof rawCategoryCounts === 'object') {
    Object.entries(rawCategoryCounts).forEach(([cat, count]) => {
      emptyCategories[normalizeAttackCategory(cat)] = asNumber(count, 0);
    });
  }

  const rawProtocols = (root.protocolCounts ?? root.protocol_counts) as
    | Record<string, unknown>
    | undefined;
  const protocolCounts: Record<string, number> = {};
  if (rawProtocols && typeof rawProtocols === 'object') {
    Object.entries(rawProtocols).forEach(([proto, count]) => {
      protocolCounts[proto] = asNumber(count, 0);
    });
  }

  const rawTimeSeries = Array.isArray(root.timeSeries ?? root.time_series)
    ? ((root.timeSeries ?? root.time_series) as RawFastApiPayload[]).map((pt, i) => ({
        time: asString(pt.time ?? pt.timestamp, `T+${i}`),
        packetCount: asNumber(pt.packetCount ?? pt.packet_count ?? pt.packets, 0),
        bytesKB: asNumber(pt.bytesKB ?? pt.bytes_kb, Math.round(asNumber(pt.total_bytes, 0) / 1024)),
        isAnomaly:
          pt.isAnomaly !== undefined && pt.isAnomaly !== null
            ? asNumber(pt.isAnomaly, 0)
            : pt.is_anomaly !== undefined && pt.is_anomaly !== null
            ? asNumber(pt.is_anomaly, 0)
            : null
      }))
    : undefined;

  const rawMethodCounts = (root.methodCounts ?? root.method_counts) as
    | RawFastApiPayload
    | undefined;

  const totalPackets =
    root.totalPackets !== undefined || root.total_packets !== undefined
      ? asNumber(root.totalPackets ?? root.total_packets, 0)
      : rawRecords.reduce((acc, r) => acc + r.packetCount, 0);

  const anomalyRate = asNumber(
    root.anomalyRate ?? root.anomaly_rate ?? root.suspicious_percentage,
    totalRecords > 0 ? (anomalousRecords / totalRecords) * 100 : 0
  );

  const normalPercentage = asNumber(
    root.normalPercentage ?? root.normal_percentage,
    totalRecords > 0 ? (normalRecords / totalRecords) * 100 : 0
  );

  return {
    datasetId: asString(root.datasetId ?? root.dataset_id, '') || undefined,
    datasetName: asString(
      root.datasetName ?? root.dataset_name,
      totalRecords > 0 ? 'FastAPI Active Capture' : 'No Active Dataset'
    ),
    analyzedAt: asString(root.analyzedAt ?? root.analyzed_at, ''),
    totalRecords,
    totalPackets,
    normalRecords,
    anomalousRecords,
    normalPercentage,
    suspiciousPercentage: anomalyRate,
    anomalyRate,
    criticalCount: asNumber(root.criticalCount ?? root.critical_count ?? root.critical_threats, 0),
    highCount: asNumber(root.highCount ?? root.high_count, 0),
    mediumCount: asNumber(root.mediumCount ?? root.medium_count, 0),
    lowCount: asNumber(root.lowCount ?? root.low_count, 0),
    networkRiskScore: asNumber(root.networkRiskScore ?? root.network_risk_score ?? root.risk_score, 0),
    categoryCounts: emptyCategories,
    protocolCounts,
    records: rawRecords,
    anomalies: rawAnomalies,
    preprocessing: normalizePreprocessing(
      (root.preprocessing as RawFastApiPayload | undefined) ?? undefined
    ),
    timeSeries: rawTimeSeries,
    methodCounts: rawMethodCounts
      ? {
          zScore: asNumber(rawMethodCounts.zScore ?? rawMethodCounts.z_score, 0),
          iqr: asNumber(rawMethodCounts.iqr, 0),
          movingAvg: asNumber(rawMethodCounts.movingAvg ?? rawMethodCounts.moving_avg, 0),
          isolationForest: asNumber(
            rawMethodCounts.isolationForest ?? rawMethodCounts.isolation_forest,
            0
          ),
          entropyValue:
            rawMethodCounts.entropyValue !== undefined && rawMethodCounts.entropyValue !== null
              ? asNumber(rawMethodCounts.entropyValue, 0)
              : rawMethodCounts.entropy_value !== undefined && rawMethodCounts.entropy_value !== null
              ? asNumber(rawMethodCounts.entropy_value, 0)
              : null
        }
      : undefined,
    featureBaselines: normalizeFeatureBaselines(
      (root.featureBaselines ?? root.feature_baselines) as RawFastApiPayload | undefined
    )
  };
}

async function parseErrorDetail(response: Response): Promise<{ message: string; detail?: unknown }> {
  const contentType = response.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      const json = (await response.json()) as RawFastApiPayload;
      if (typeof json.detail === 'string') {
        return { message: json.detail, detail: json };
      }
      if (Array.isArray(json.detail)) {
        const formatted = json.detail
          .map(item => {
            if (item && typeof item === 'object' && 'msg' in item) {
              return String((item as RawFastApiPayload).msg);
            }
            return JSON.stringify(item);
          })
          .join('; ');
        return { message: formatted || `HTTP ${response.status} validation error`, detail: json };
      }
      if (typeof json.message === 'string') {
        return { message: json.message, detail: json };
      }
      return { message: `FastAPI returned HTTP ${response.status} (${response.statusText})`, detail: json };
    }
    const text = await response.text();
    return {
      message: text.trim() || `FastAPI returned HTTP ${response.status} (${response.statusText})`,
      detail: text
    };
  } catch {
    return { message: `FastAPI returned HTTP ${response.status} (${response.statusText})` };
  }
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = API_CONFIG.defaultTimeoutMs, headers, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${API_CONFIG.baseUrl}${endpoint}`;

  const isFormData = typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;
  const mergedHeaders: HeadersInit = isFormData
    ? {
        Accept: 'application/json',
        ...(headers || {})
      }
    : {
        Accept: 'application/json',
        ...(fetchOptions.body ? { 'Content-Type': 'application/json' } : {}),
        ...(headers || {})
      };

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      mode: API_CONFIG.corsMode,
      credentials: API_CONFIG.credentials,
      headers: mergedHeaders,
      signal: controller.signal
    });

    if (!response.ok) {
      const parsed = await parseErrorDetail(response);
      throw new StatGuardApiError({
        message: parsed.message,
        statusCode: response.status,
        endpoint,
        isNetworkError: false,
        detail: parsed.detail,
        timestamp: new Date().toISOString()
      });
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (err: unknown) {
    if (err instanceof StatGuardApiError) {
      throw err;
    }

    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new StatGuardApiError({
        message: `Request to ${endpoint} timed out after ${Math.round(timeoutMs / 1000)}s.`,
        endpoint,
        isNetworkError: true,
        timestamp: new Date().toISOString()
      });
    }

    const rawMsg = err instanceof Error ? err.message : 'Network error';
    const isCorsOrOffline =
      rawMsg.toLowerCase().includes('failed to fetch') ||
      rawMsg.toLowerCase().includes('networkerror') ||
      rawMsg.toLowerCase().includes('load failed');

    throw new StatGuardApiError({
      message: isCorsOrOffline
        ? `Unable to reach FastAPI backend at ${API_CONFIG.baseUrl}${endpoint}. Verify the Python server is running and CORS allows this origin.`
        : rawMsg,
      endpoint,
      isNetworkError: true,
      detail: err,
      timestamp: new Date().toISOString()
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export const statGuardApi = {
  getBaseUrl(): string {
    return API_CONFIG.baseUrl;
  },

  async uploadDatasetCsv(file: File): Promise<ApiUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const payload = await apiFetch<RawFastApiPayload>(API_ENDPOINTS.UPLOAD, {
      method: 'POST',
      body: formData,
      timeoutMs: API_CONFIG.uploadTimeoutMs
    });

    const preprocessing = normalizePreprocessing(
      (payload.preprocessing as RawFastApiPayload | undefined) ?? payload
    );
    const datasetId = asString(payload.datasetId ?? payload.dataset_id, '');
    const filename = asString(payload.filename ?? payload.file_name, file.name);
    const datasetName = asString(payload.datasetName ?? payload.dataset_name, filename);
    const totalRows = asNumber(
      payload.totalRows ?? payload.total_rows ?? payload.total_records,
      preprocessing.totalRawRows
    );
    const validRows = asNumber(payload.validRows ?? payload.valid_rows, preprocessing.validRows || totalRows);

    const normalizedSummary =
      payload.summary && typeof payload.summary === 'object'
        ? normalizeDashboardSummary(payload.summary as RawFastApiPayload)
        : undefined;

    return {
      datasetId,
      datasetName,
      filename,
      totalRows,
      validRows,
      message: asString(payload.message, `Dataset "${filename}" uploaded successfully.`),
      uploadedAt: asString(payload.uploadedAt ?? payload.uploaded_at, new Date().toISOString()),
      preprocessing: {
        ...preprocessing,
        totalRawRows: preprocessing.totalRawRows || totalRows,
        validRows: preprocessing.validRows || validRows
      },
      summary: normalizedSummary
    };
  },

  async analyzeDataset(params: ApiAnalyzeRequest): Promise<ApiAnalyzeResponse> {
    const requestBody = {
      dataset_id: params.datasetId,
      dataset_name: params.datasetName,
      settings: {
        z_score_threshold: params.settings.zScoreThreshold,
        iqr_multiplier: params.settings.iqrMultiplier,
        isolation_forest_contamination: params.settings.isolationForestContamination,
        entropy_window_size: params.settings.entropyWindowSize,
        entropy_low_threshold: params.settings.entropyLowThreshold,
        moving_avg_window_size: params.settings.movingAvgWindowSize,
        risk_weights: {
          packet_volume: params.settings.riskWeights.packetVolume,
          byte_volume: params.settings.riskWeights.byteVolume,
          frequency: params.settings.riskWeights.frequency,
          duration: params.settings.riskWeights.duration,
          entropy: params.settings.riskWeights.entropy,
          isolation_forest: params.settings.riskWeights.isolationForest
        },
        severity_thresholds: params.settings.severityThresholds
      }
    };

    const payload = await apiFetch<RawFastApiPayload>(API_ENDPOINTS.ANALYZE, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    const summary = normalizeDashboardSummary(payload);
    return {
      summary,
      message: asString(payload.message, 'Statistical analysis completed.')
    };
  },

  async getDashboardMetrics(): Promise<ApiDashboardResponse> {
    const payload = await apiFetch<RawFastApiPayload>(API_ENDPOINTS.DASHBOARD, {
      method: 'GET'
    });

    const summary = normalizeDashboardSummary(payload);
    const hasDataset =
      typeof payload.has_dataset === 'boolean'
        ? payload.has_dataset
        : typeof payload.hasDataset === 'boolean'
        ? payload.hasDataset
        : summary.totalRecords > 0 || summary.anomalies.length > 0;

    return {
      summary,
      hasDataset
    };
  },

  async getDetectedThreats(query?: ApiThreatsQuery): Promise<ApiThreatsResponse> {
    const searchParams = new URLSearchParams();
    if (query?.severity && query.severity !== 'ALL') searchParams.set('severity', query.severity);
    if (query?.category && query.category !== 'ALL') searchParams.set('category', query.category);
    if (query?.search?.trim()) searchParams.set('search', query.search.trim());

    const qs = searchParams.toString();
    const endpoint = qs ? `${API_ENDPOINTS.THREATS}?${qs}` : API_ENDPOINTS.THREATS;

    const payload = await apiFetch<RawFastApiPayload | RawFastApiPayload[]>(endpoint, {
      method: 'GET'
    });

    const rawList = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.threats)
      ? (payload.threats as RawFastApiPayload[])
      : Array.isArray(payload.anomalies)
      ? (payload.anomalies as RawFastApiPayload[])
      : Array.isArray(payload.items)
      ? (payload.items as RawFastApiPayload[])
      : [];

    const threats = rawList.map((item, idx) => normalizeAnomalyResult(item, idx));
    const objPayload = Array.isArray(payload) ? {} : payload;

    return {
      threats,
      total: asNumber(objPayload.total, threats.length),
      criticalCount: asNumber(
        objPayload.criticalCount ?? objPayload.critical_count,
        threats.filter(t => t.severity === 'CRITICAL').length
      ),
      highCount: asNumber(
        objPayload.highCount ?? objPayload.high_count,
        threats.filter(t => t.severity === 'HIGH').length
      ),
      mediumCount: asNumber(
        objPayload.mediumCount ?? objPayload.medium_count,
        threats.filter(t => t.severity === 'MEDIUM').length
      ),
      lowCount: asNumber(
        objPayload.lowCount ?? objPayload.low_count,
        threats.filter(t => t.severity === 'LOW').length
      )
    };
  },

  async getThreatInvestigation(id: string): Promise<ApiThreatInvestigationResponse> {
    const endpoint = API_ENDPOINTS.INVESTIGATE(id);
    const payload = await apiFetch<RawFastApiPayload>(endpoint, {
      method: 'GET'
    });

    const rawThreat =
      payload.threat && typeof payload.threat === 'object'
        ? (payload.threat as RawFastApiPayload)
        : payload.anomaly && typeof payload.anomaly === 'object'
        ? (payload.anomaly as RawFastApiPayload)
        : payload;

    const threat = normalizeAnomalyResult(rawThreat);
    const baselinesRaw = (payload.featureBaselines ?? payload.feature_baselines) as
      | RawFastApiPayload
      | undefined;

    const recommendationsRaw = payload.tacticalRecommendations ?? payload.tactical_recommendations ?? payload.recommendations;

    return {
      threat,
      featureBaselines: baselinesRaw ? normalizeFeatureBaselines(baselinesRaw) : undefined,
      tacticalRecommendations: Array.isArray(recommendationsRaw)
        ? recommendationsRaw.map(r => String(r))
        : undefined,
      rawFlowDetails:
        payload.rawFlowDetails && typeof payload.rawFlowDetails === 'object'
          ? (payload.rawFlowDetails as Record<string, unknown>)
          : undefined
    };
  }
};
