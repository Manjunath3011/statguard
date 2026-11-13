import { jsPDF } from 'jspdf';
import { DatasetAnalysisSummary } from '../types/network';

export function generatePdfSecurityReport(summary: DatasetAnalysisSummary): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header Background bar - Matte Black Luxury
  doc.setFillColor(24, 24, 24);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Title
  doc.setTextColor(245, 245, 245);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('STATGUARD // CYBER THREAT INTELLIGENCE AUDIT', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(192, 192, 192); // metallic silver
  doc.text(`Generated: ${new Date().toLocaleString()} | Scope: ${summary.datasetName}`, 14, 20);

  y = 38;

  // Executive Threat Assessment Summary Card
  doc.setFillColor(248, 250, 252); // light slate
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 38, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. Executive Threat Assessment', 18, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Network Risk Score: ${summary.networkRiskScore} / 100`, 18, y + 17);
  doc.text(`Total Records Analyzed: ${summary.totalRecords.toLocaleString()}`, 18, y + 24);
  doc.text(`Anomaly Rate: ${summary.anomalyRate.toFixed(2)}% (${summary.anomalousRecords} flagged flows)`, 18, y + 31);

  doc.text(`Critical Threats: ${summary.criticalCount}`, 115, y + 17);
  doc.text(`High Severity: ${summary.highCount}`, 115, y + 24);
  doc.text(`Medium / Low: ${summary.mediumCount + summary.lowCount}`, 115, y + 31);

  y += 48;

  // Statistical Engine Methodology Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Statistical Engine Methodology & Invariants', 14, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const methodologyText = [
    'STATGUARD employs five complementary statistical and machine learning algorithms to isolate cyber threats:',
    '• Z-Score Analysis: Standardized distance from the empirical feature mean: Z = (X - μ) / σ.',
    '• Interquartile Range (IQR): Non-parametric dispersion fencing: [Q1 - 1.5×IQR, Q3 + 1.5×IQR].',
    '• Moving Average Analysis: Rolling multi-period dynamic volatility envelopes identifying sudden spikes.',
    '• Shannon Entropy H(X): -Σ P(x) log2 P(x) evaluating IP/port concentration changes (e.g. DDoS collapse vs Port Scan sweep).',
    '• Isolation Forest: Randomized binary partition ensemble scoring multi-variate feature isolation depths.'
  ];
  methodologyText.forEach(line => {
    doc.text(line, 14, y);
    y += 5.5;
  });

  y += 6;

  // Attack Category Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Detected Cyberattack Classification Matrix', 14, y);
  y += 7;

  const categories = Object.entries(summary.categoryCounts).filter(([cat, count]) => cat !== 'Normal Traffic' && count > 0);
  if (categories.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No suspicious attack patterns detected. Traffic profile matches baseline.', 14, y);
    y += 8;
  } else {
    categories.forEach(([cat, count]) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`• ${cat}: ${count} flagged flows`, 14, y);
      y += 5;
    });
  }

  y += 8;

  // Top Flagged Threats Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('4. High Priority Anomaly Records', 14, y);
  y += 6;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Timestamp', 16, y + 5);
  doc.text('Source IP', 54, y + 5);
  doc.text('Destination IP', 85, y + 5);
  doc.text('Proto', 120, y + 5);
  doc.text('Attack Classification', 135, y + 5);
  doc.text('Score', 178, y + 5);
  y += 7;

  const topAnomalies = summary.anomalies.slice(0, 12);
  topAnomalies.forEach((anom, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageWidth - 28, 6.5, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);

    const tsShort = anom.packetRecord.timestamp.split('T')[1]?.substring(0, 8) || anom.packetRecord.timestamp.substring(11, 19);
    doc.text(tsShort, 16, y + 4.5);
    doc.text(anom.packetRecord.sourceIp, 54, y + 4.5);
    doc.text(anom.packetRecord.destIp, 85, y + 4.5);
    doc.text(anom.packetRecord.protocol, 120, y + 4.5);
    doc.text(anom.predictedAttack, 135, y + 4.5);

    // Score styling
    doc.setFont('helvetica', 'bold');
    if (anom.severity === 'CRITICAL') doc.setTextColor(220, 38, 38);
    else if (anom.severity === 'HIGH') doc.setTextColor(234, 88, 12);
    else doc.setTextColor(13, 148, 136);

    doc.text(`${anom.compositeScore}`, 180, y + 4.5);
    y += 6.5;
  });

  y += 10;
  if (y > 265) {
    doc.addPage();
    y = 20;
  }

  // Recommended Tactical Remediations
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('5. Security Operations Center (SOC) Action Plan', 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const actions = [
    '1. Perimeter Ingress Rules: Apply rate limiting or CIDR null-routing on repeated high Z-score source addresses.',
    '2. Endpoint Forensics: Investigate internal database hosts exhibiting high exfiltration byte volume anomalies.',
    '3. Service Hardening: Limit exposed SSH / RDP authentication services behind MFA and VPN gateways.',
    '4. Ongoing Calibration: Re-evaluate statistical moving average windows to tune baseline against organic traffic growth.'
  ];
  actions.forEach(action => {
    doc.text(action, 14, y);
    y += 5;
  });

  // Footer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('CONFIDENTIAL // STATGUARD Statistical Cyber Attack Detection System', 14, 290);

  // Trigger browser download
  const filename = `STATGUARD-Security-Report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

export function exportAnomaliesAsCSV(summary: DatasetAnalysisSummary): void {
  const headers = [
    'ID',
    'Timestamp',
    'Source IP',
    'Destination IP',
    'Source Port',
    'Destination Port',
    'Protocol',
    'Packet Count',
    'Total Bytes',
    'Connection Frequency (pps)',
    'Composite Anomaly Score',
    'Severity',
    'Predicted Attack Category',
    'Detection Methods',
    'Primary Reasons',
    'Investigation Status'
  ];

  const rows = summary.anomalies.map(a => [
    a.id,
    `"${a.packetRecord.timestamp}"`,
    a.packetRecord.sourceIp,
    a.packetRecord.destIp,
    a.packetRecord.sourcePort,
    a.packetRecord.destPort,
    a.packetRecord.protocol,
    a.packetRecord.packetCount,
    a.packetRecord.totalBytes,
    a.packetRecord.connectionFrequency,
    a.compositeScore,
    a.severity,
    `"${a.predictedAttack}"`,
    `"${a.detectionMethods.join('; ')}"`,
    `"${a.primaryReasons.join('; ')}"`,
    `"${a.status}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `STATGUARD-Anomalies-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
