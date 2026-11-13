import {
  NetworkPacketRecord,
  AnomalyDetectionResult,
  AttackCategory,
  SeverityLevel,
  StatisticalMetricBreakdown,
  DetectionSettings,
  DatasetAnalysisSummary,
  PreprocessingStats
} from '../types/network';
import {
  calculateFeatureStats,
  calculateZScore,
  calculateMovingAverages,
  calculateShannonEntropy,
  IsolationForest
} from './statistics';

export const DEFAULT_SETTINGS: DetectionSettings = {
  zScoreThreshold: 2.5,
  iqrMultiplier: 1.5,
  isolationForestContamination: 0.10,
  entropyWindowSize: 25,
  entropyLowThreshold: 1.2,
  movingAvgWindowSize: 10,
  riskWeights: {
    packetVolume: 0.25,
    byteVolume: 0.25,
    frequency: 0.20,
    duration: 0.10,
    entropy: 0.10,
    isolationForest: 0.10
  },
  severityThresholds: {
    critical: 75,
    high: 55,
    medium: 35
  }
};

/**
 * Analyzes a collection of network packet records using multi-tiered statistical techniques
 */
export function analyzeNetworkDataset(
  records: NetworkPacketRecord[],
  settings: DetectionSettings = DEFAULT_SETTINGS,
  datasetName: string = 'Network Traffic Dataset',
  preprocessing?: PreprocessingStats
): DatasetAnalysisSummary {
  if (records.length === 0) {
    return {
      datasetName,
      analyzedAt: new Date().toISOString(),
      totalRecords: 0,
      normalRecords: 0,
      anomalousRecords: 0,
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
      preprocessing: preprocessing || {
        totalRawRows: 0,
        validRows: 0,
        duplicatesRemoved: 0,
        missingValuesHandled: 0,
        featuresNormalized: [],
        columnMapping: {},
        parsingErrors: []
      },
      featureBaselines: {}
    };
  }

  // 1. Extract feature numerical arrays for baseline statistics
  const packetCounts = records.map(r => r.packetCount);
  const totalBytes = records.map(r => r.totalBytes);
  const frequencies = records.map(r => r.connectionFrequency);
  const durations = records.map(r => r.flowDuration);
  const packetLengths = records.map(r => r.packetLength);

  const baselinePacketCount = calculateFeatureStats(packetCounts, settings.iqrMultiplier);
  const baselineTotalBytes = calculateFeatureStats(totalBytes, settings.iqrMultiplier);
  const baselineFrequency = calculateFeatureStats(frequencies, settings.iqrMultiplier);
  const baselineDuration = calculateFeatureStats(durations, settings.iqrMultiplier);
  const baselinePacketLength = calculateFeatureStats(packetLengths, settings.iqrMultiplier);

  // 2. Moving Average analysis over packet count sequence
  const maPacketResults = calculateMovingAverages(packetCounts, settings.movingAvgWindowSize);

  // 3. Train Isolation Forest model on normalized numerical features
  const iForest = new IsolationForest(35, 64);
  const featureMatrix = records.map(r => [
    baselinePacketCount.stdDev > 0 ? (r.packetCount - baselinePacketCount.mean) / baselinePacketCount.stdDev : 0,
    baselineTotalBytes.stdDev > 0 ? (r.totalBytes - baselineTotalBytes.mean) / baselineTotalBytes.stdDev : 0,
    baselineFrequency.stdDev > 0 ? (r.connectionFrequency - baselineFrequency.mean) / baselineFrequency.stdDev : 0,
    baselineDuration.stdDev > 0 ? (r.flowDuration - baselineDuration.mean) / baselineDuration.stdDev : 0
  ]);
  iForest.fit(featureMatrix);

  // 4. Calculate Global & Sliding Shannon Entropy
  const allDestIps = records.map(r => r.destIp);
  const globalDestIpEntropy = calculateShannonEntropy(allDestIps);

  // 5. Evaluate each record across all statistical techniques
  const anomalies: AnomalyDetectionResult[] = [];
  const categoryCounts: Record<AttackCategory, number> = {
    'DDoS Attack': 0,
    'DoS Attack': 0,
    'Port Scanning': 0,
    'Brute Force Attack': 0,
    'Suspicious Data Exfiltration': 0,
    'Network Flooding': 0,
    'Unusual Network Access': 0,
    'Normal Traffic': 0
  };
  const protocolCounts: Record<string, number> = {};

  records.forEach((record, index) => {
    protocolCounts[record.protocol] = (protocolCounts[record.protocol] || 0) + 1;

    // A. Z-Scores
    const zPacket = calculateZScore(record.packetCount, baselinePacketCount.mean, baselinePacketCount.stdDev);
    const zBytes = calculateZScore(record.totalBytes, baselineTotalBytes.mean, baselineTotalBytes.stdDev);
    const zFreq = calculateZScore(record.connectionFrequency, baselineFrequency.mean, baselineFrequency.stdDev);
    const zDuration = calculateZScore(record.flowDuration, baselineDuration.mean, baselineDuration.stdDev);
    const maxAbsZ = Math.max(Math.abs(zPacket), Math.abs(zBytes), Math.abs(zFreq), Math.abs(zDuration));
    const zFlagged = maxAbsZ >= settings.zScoreThreshold;

    // B. IQR Boundaries
    const iqrPacketFlagged = record.packetCount > baselinePacketCount.upperBound || record.packetCount < baselinePacketCount.lowerBound;
    const iqrBytesFlagged = record.totalBytes > baselineTotalBytes.upperBound || record.totalBytes < baselineTotalBytes.lowerBound;
    const iqrFreqFlagged = record.connectionFrequency > baselineFrequency.upperBound || record.connectionFrequency < baselineFrequency.lowerBound;
    const iqrFlagged = iqrPacketFlagged || iqrBytesFlagged || iqrFreqFlagged;

    // C. Moving Average Deviation
    const expectedSMA = maPacketResults.sma[index] || baselinePacketCount.mean;
    const maUpper = maPacketResults.upperBand[index] || baselinePacketCount.upperBound;
    const maDev = expectedSMA > 0 ? (record.packetCount - expectedSMA) / expectedSMA : 0;
    const maFlagged = record.packetCount > maUpper;

    // D. Local Window Entropy (Surrounding records)
    const windowStart = Math.max(0, index - Math.floor(settings.entropyWindowSize / 2));
    const windowEnd = Math.min(records.length, windowStart + settings.entropyWindowSize);
    const windowDestIps = records.slice(windowStart, windowEnd).map(r => r.destIp);
    const localEntropy = calculateShannonEntropy(windowDestIps);
    const entropyDeviation = globalDestIpEntropy > 0 ? (globalDestIpEntropy - localEntropy) / globalDestIpEntropy : 0;
    const entropyFlagged = localEntropy < settings.entropyLowThreshold && records.length > 15;

    // E. Isolation Forest Anomaly Score
    const ifScore = iForest.score(featureMatrix[index]);
    const ifFlagged = ifScore >= 0.62;

    // F. Compute Composite Statistical Anomaly Score (0 to 100)
    // Combines normalized Z-score, IQR violation weight, MA deviation, Entropy anomaly, and iForest score
    let scoreAcc = 0;

    // Z-Score component (0 - 30 points)
    const zContribution = Math.min(30, (maxAbsZ / 4.0) * 30);
    scoreAcc += zContribution;

    // IQR component (0 - 20 points)
    if (iqrFlagged) {
      let violations = (iqrPacketFlagged ? 1 : 0) + (iqrBytesFlagged ? 1 : 0) + (iqrFreqFlagged ? 1 : 0);
      scoreAcc += Math.min(20, violations * 8);
    }

    // Moving average surge component (0 - 15 points)
    if (maFlagged) {
      scoreAcc += Math.min(15, Math.max(5, maDev * 10));
    }

    // Isolation forest component (0 - 20 points)
    if (ifScore > 0.5) {
      scoreAcc += ((ifScore - 0.5) / 0.5) * 20;
    }

    // Entropy anomaly component (0 - 15 points)
    if (entropyFlagged) {
      scoreAcc += Math.min(15, entropyDeviation * 15);
    }

    const compositeScore = Math.min(100, Math.max(0, Math.round(scoreAcc)));

    // Multi-factor detection methods & reasons
    const detectionMethods: string[] = [];
    const primaryReasons: string[] = [];

    if (zFlagged) {
      detectionMethods.push(`Z-Score Analysis (|Z| = ${maxAbsZ.toFixed(2)} ≥ ${settings.zScoreThreshold})`);
      if (Math.abs(zPacket) >= settings.zScoreThreshold) {
        primaryReasons.push(`Packet volume deviated by ${zPacket.toFixed(1)}σ from normal distribution baseline.`);
      }
      if (Math.abs(zBytes) >= settings.zScoreThreshold) {
        primaryReasons.push(`Byte transfer size deviated by ${zBytes.toFixed(1)}σ from statistical mean.`);
      }
      if (Math.abs(zFreq) >= settings.zScoreThreshold) {
        primaryReasons.push(`Connection burst frequency deviated by ${zFreq.toFixed(1)}σ.`);
      }
    }

    if (iqrFlagged) {
      detectionMethods.push(`Interquartile Range (IQR Outlier Boundary)`);
      if (iqrPacketFlagged) {
        primaryReasons.push(`Packet count (${record.packetCount.toLocaleString()}) exceeded Q3 + 1.5×IQR boundary (${Math.round(baselinePacketCount.upperBound).toLocaleString()}).`);
      }
      if (iqrBytesFlagged) {
        primaryReasons.push(`Byte transfer volume (${(record.totalBytes / 1024).toFixed(1)} KB) breached upper IQR fence.`);
      }
    }

    if (maFlagged) {
      detectionMethods.push(`Moving Average Surge (Bollinger Upper Band Breached)`);
      primaryReasons.push(`Abrupt localized traffic spike exceeding dynamic ${settings.movingAvgWindowSize}-period moving average band.`);
    }

    if (entropyFlagged) {
      detectionMethods.push(`Shannon Entropy Anomaly (Target IP Concentration)`);
      primaryReasons.push(`Target IP distribution entropy collapsed to ${localEntropy.toFixed(2)} bits, indicating focused victim concentration.`);
    }

    if (ifFlagged) {
      detectionMethods.push(`Isolation Forest ML (Path Isolation Score ${ifScore.toFixed(2)})`);
      primaryReasons.push(`Multi-dimensional feature vector was rapidly isolated in shallow decision trees.`);
    }

    const metrics: StatisticalMetricBreakdown = {
      zScore: maxAbsZ,
      zScoreFlagged: zFlagged,
      iqrFlagged,
      iqrValue: baselinePacketCount.iqr,
      iqrLowerBound: baselinePacketCount.lowerBound,
      iqrUpperBound: baselinePacketCount.upperBound,
      movingAvgDeviation: maDev,
      movingAvgFlagged: maFlagged,
      entropyValue: localEntropy,
      entropyDeviation,
      entropyFlagged,
      isolationForestScore: ifScore,
      isolationForestFlagged: ifFlagged,
      compositeScore
    };

    // Determine Severity
    let severity: SeverityLevel = 'LOW';
    if (compositeScore >= settings.severityThresholds.critical) {
      severity = 'CRITICAL';
    } else if (compositeScore >= settings.severityThresholds.high) {
      severity = 'HIGH';
    } else if (compositeScore >= settings.severityThresholds.medium) {
      severity = 'MEDIUM';
    }

    // Determine Potential Cyberattack Category (requires statistical anomaly + signature alignment)
    const isAnomalous = detectionMethods.length >= 2 || compositeScore >= settings.severityThresholds.medium;
    let predictedAttack: AttackCategory = 'Normal Traffic';

    if (isAnomalous) {
      // 1. Port Scanning: Multiple unique ports, low packets per connection, moderate frequency
      if (
        (record.destPort < 1024 || record.destPort > 30000) &&
        record.packetCount <= 12 &&
        record.flowDuration < 500 &&
        record.connectionFrequency > baselineFrequency.median
      ) {
        predictedAttack = 'Port Scanning';
      }
      // 2. Brute Force Attack: Repeated hits on authentication ports (22, 3389, 21, 8080, 443) with high frequency
      else if (
        [21, 22, 23, 80, 443, 3389, 8080, 5432, 3306].includes(record.destPort) &&
        record.connectionFrequency >= baselineFrequency.upperBound &&
        record.packetCount < 30
      ) {
        predictedAttack = 'Brute Force Attack';
      }
      // 3. DDoS Attack: Extreme packet count + high bytes + low entropy (focused target)
      else if (
        (record.packetCount > baselinePacketCount.upperBound * 2.5 || zPacket > 3.0) &&
        (entropyFlagged || record.connectionFrequency > baselineFrequency.upperBound)
      ) {
        predictedAttack = 'DDoS Attack';
      }
      // 4. DoS Attack: Abnormally high packet rate or duration targeting specific service availability
      else if (record.packetCount > baselinePacketCount.upperBound || zPacket > 2.5) {
        predictedAttack = 'DoS Attack';
      }
      // 5. Suspicious Data Exfiltration: Unusually high byte volume or outbound payload with low packet frequency
      else if (record.totalBytes > baselineTotalBytes.upperBound && (record.packetCount / Math.max(1, record.totalBytes)) < 0.05) {
        predictedAttack = 'Suspicious Data Exfiltration';
      }
      // 6. Network Flooding: Extremely high frequency burst
      else if (record.connectionFrequency > baselineFrequency.upperBound) {
        predictedAttack = 'Network Flooding';
      }
      // 7. Unusual Network Access
      else {
        predictedAttack = 'Unusual Network Access';
      }

      categoryCounts[predictedAttack]++;

      anomalies.push({
        id: `anom-${record.id || index}`,
        packetRecord: record,
        compositeScore,
        severity,
        predictedAttack,
        detectionMethods,
        primaryReasons: primaryReasons.length > 0 ? primaryReasons : ['Multi-variate statistical deviation from baseline'],
        metrics,
        status: 'Under Investigation',
        updatedAt: new Date().toISOString()
      });
    } else {
      categoryCounts['Normal Traffic']++;
    }
  });

  const totalRecords = records.length;
  const anomalousRecords = anomalies.length;
  const normalRecords = totalRecords - anomalousRecords;
  const anomalyRate = totalRecords > 0 ? (anomalousRecords / totalRecords) * 100 : 0;

  const criticalCount = anomalies.filter(a => a.severity === 'CRITICAL').length;
  const highCount = anomalies.filter(a => a.severity === 'HIGH').length;
  const mediumCount = anomalies.filter(a => a.severity === 'MEDIUM').length;
  const lowCount = anomalies.filter(a => a.severity === 'LOW').length;

  // Composite Network Risk Score: weighted sum of severity levels normalized to 0-100
  let calculatedRisk = 0;
  if (totalRecords > 0) {
    calculatedRisk = Math.min(
      100,
      Math.round(
        (criticalCount * 25 + highCount * 12 + mediumCount * 4 + lowCount * 1) /
          Math.max(1, totalRecords * 0.15)
      )
    );
  }

  return {
    datasetName,
    analyzedAt: new Date().toISOString(),
    totalRecords,
    normalRecords,
    anomalousRecords,
    anomalyRate,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    networkRiskScore: calculatedRisk,
    categoryCounts,
    protocolCounts,
    records,
    anomalies: anomalies.sort((a, b) => b.compositeScore - a.compositeScore),
    preprocessing: preprocessing || {
      totalRawRows: totalRecords,
      validRows: totalRecords,
      duplicatesRemoved: 0,
      missingValuesHandled: 0,
      featuresNormalized: ['packetCount', 'totalBytes', 'connectionFrequency', 'flowDuration'],
      columnMapping: {},
      parsingErrors: []
    },
    featureBaselines: {
      packetCount: baselinePacketCount,
      totalBytes: baselineTotalBytes,
      connectionFrequency: baselineFrequency,
      flowDuration: baselineDuration,
      packetLength: baselinePacketLength
    }
  };
}
