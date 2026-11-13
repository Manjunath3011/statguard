import React, { useState } from 'react';
import {
  SearchCode,
  CheckCircle2,
  Terminal,
  FileText,
  Save,
  ArrowLeft,
  ShieldAlert,
  Crosshair
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InvestigationStatus, SeverityLevel } from '../../types/network';

export const ThreatInvestigationPage: React.FC = () => {
  const { summary, selectedAlert, setSelectedAlert, updateAlertStatus, setActivePage } = useApp();
  const [analystNotes, setAnalystNotes] = useState(selectedAlert?.analystNotes || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync notes when selected alert changes
  React.useEffect(() => {
    setAnalystNotes(selectedAlert?.analystNotes || '');
    setSaveSuccess(false);
  }, [selectedAlert?.id]);

  if (!selectedAlert) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto space-y-4 cyber-grid">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
          <SearchCode className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-white font-heading">No Anomaly Selected for Investigation</h2>
        <p className="text-xs text-slate-400 font-light">
          Please select an anomaly from the Threat Detection Matrix or Dashboard to inspect mathematical deviations and triage actions.
        </p>
        <button
          onClick={() => setActivePage('detection')}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-[#080B12] rounded-xl text-xs font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)]"
        >
          Open Threat Matrix
        </button>
      </div>
    );
  }

  const rec = selectedAlert.packetRecord;
  const metrics = selectedAlert.metrics;
  const baselines = summary.featureBaselines;

  const handleStatusChange = (status: InvestigationStatus) => {
    updateAlertStatus(selectedAlert.id, status, analystNotes);
  };

  const handleSaveNotes = () => {
    updateAlertStatus(selectedAlert.id, selectedAlert.status, analystNotes);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const getTacticalRecommendations = () => {
    switch (selectedAlert.predictedAttack) {
      case 'DDoS Attack':
        return [
          'Activate edge CDN / upstream rate-limiting for destination IP address.',
          'Issue ingress ACL filter on edge router: drop excessive SYN packets targeting port ' + rec.destPort + '.',
          'Enable TCP SYN cookies (net.ipv4.tcp_syncookies=1) to prevent socket backlog queue exhaustion.',
          'Capture 60-second PCAP dump for packet payload signature analysis.'
        ];
      case 'Port Scanning':
        return [
          'Add source IP ' + rec.sourceIp + ' to perimeter drop table (iptables -A INPUT -s ' + rec.sourceIp + ' -j DROP).',
          'Audit perimeter firewall rules to ensure only intended public services are exposed.',
          'Verify if destination host responded with open TCP handshake on unexpected ports.',
          'Query threat intelligence feeds for historical reputation of source IP ' + rec.sourceIp + '.'
        ];
      case 'Brute Force Attack':
        return [
          'Lock or temporarily throttle authentication attempts on port ' + rec.destPort + '.',
          'Enforce Fail2ban or rate limiter to ban IP ' + rec.sourceIp + ' after 3 consecutive failures.',
          'Enforce Multi-Factor Authentication (MFA) and public key authentication.',
          'Inspect server authorization logs (/var/log/auth.log or Event ID 4625) for target usernames.'
        ];
      case 'Suspicious Data Exfiltration':
        return [
          'Immediately isolate internal host ' + rec.sourceIp + ' to quarantine VLAN pending forensic review.',
          'Inspect process tree and active TCP sockets on ' + rec.sourceIp + ' (netstat -tulpen / lsof -i).',
          'Review database access logs for mass SELECT queries or staging files created in /tmp or %TEMP%.',
          'Sinkhole external destination IP ' + rec.destIp + ' across recursive internal DNS resolvers.'
        ];
      case 'DoS Attack':
        return [
          'Inspect worker process CPU and memory utilization on ' + rec.destIp + '.',
          'Configure HTTP keep-alive timeouts and limit request payload body sizes.',
          'Apply connection rate limits per source IP on reverse proxy (Nginx limit_req_zone).'
        ];
      default:
        return [
          'Verify whether communication between ' + rec.sourceIp + ' and ' + rec.destIp + ' is authorized in enterprise network policy.',
          'Correlate host endpoint logs around timestamp ' + rec.timestamp + '.',
          'Inspect application layer payloads for anomalous protocol encapsulation.'
        ];
    }
  };

  const severityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-rose-300 bg-rose-950/80 border-rose-500/50 shadow-[0_0_10px_rgba(255,51,102,0.3)]';
      case 'HIGH':
        return 'text-amber-300 bg-amber-950/80 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      case 'MEDIUM':
        return 'text-purple-300 bg-purple-950/80 border-purple-500/50 shadow-[0_0_10px_rgba(149,101,255,0.2)]';
      case 'LOW':
        return 'text-cyan-300 bg-cyan-950/80 border-cyan-500/50 shadow-[0_0_10px_rgba(0,229,255,0.2)]';
    }
  };

  return (
    <div className="p-8 space-y-7 max-w-7xl mx-auto cyber-grid">
      {/* Back and Page Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#101827]/90 via-[#151E2D]/80 to-[#101827]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('detection')}
            className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-xl border border-cyan-500/20 transition-all"
            title="Back to Threat Matrix"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
                THREAT INVESTIGATION FORENSICS
              </h1>
              <span className={`text-[10px] font-semibold font-mono px-2.5 py-0.5 rounded-md border tracking-wider ${severityBadge(selectedAlert.severity)}`}>
                {selectedAlert.severity} SEVERITY
              </span>
            </div>
            <p className="text-xs text-cyan-300/80 mt-1 font-mono">
              Case Ref: <span className="font-bold text-white">{selectedAlert.id}</span> · Captured: <span className="text-slate-300">{rec.timestamp}</span>
            </p>
          </div>
        </div>

        {/* Anomaly Quick Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Incident Target:</span>
          <select
            value={selectedAlert.id}
            onChange={(e) => {
              const found = summary.anomalies.find(a => a.id === e.target.value);
              if (found) setSelectedAlert(found);
            }}
            className="bg-[#080B12] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono transition-all"
          >
            {summary.anomalies.map(anom => (
              <option key={anom.id} value={anom.id}>
                {anom.predictedAttack} - {anom.packetRecord.sourceIp} ({anom.compositeScore}/100)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Case Management & Workflow Status Bar */}
      <div className="p-5 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block">Incident Triage Lifecycle</span>
          <span className="text-sm font-bold text-white font-heading mt-0.5 block">
            Current Case State: <strong className="text-cyan-300 font-mono">{selectedAlert.status}</strong>
          </span>
        </div>

        {/* Workflow State Buttons */}
        <div className="flex flex-wrap items-center gap-2 font-mono">
          <button
            onClick={() => handleStatusChange('Under Investigation')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              selectedAlert.status === 'Under Investigation'
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'bg-[#101827] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            Under Investigation
          </button>
          <button
            onClick={() => handleStatusChange('Confirmed Threat')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              selectedAlert.status === 'Confirmed Threat'
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                : 'bg-[#101827] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            Confirmed Threat
          </button>
          <button
            onClick={() => handleStatusChange('False Positive')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              selectedAlert.status === 'False Positive'
                ? 'bg-slate-800 text-slate-200 border-slate-600 shadow-[0_0_12px_rgba(148,163,184,0.2)]'
                : 'bg-[#101827] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            False Positive
          </button>
          <button
            onClick={() => handleStatusChange('Resolved')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              selectedAlert.status === 'Resolved'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-[#101827] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* Grid: Left: Forensics & Statistical Comparison, Right: Recommendations & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Features & Statistical Comparison */}
        <div className="lg:col-span-2 space-y-6">
          {/* Traffic Flow Attributes */}
          <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-4">
            <h2 className="text-base font-bold text-white font-heading flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              <span>Network Flow Endpoint Telemetry</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-4 bg-[#101827] rounded-xl border border-cyan-500/15">
                <span className="text-slate-400 text-[10px] block font-sans font-light">Source Endpoint</span>
                <span className="text-white font-bold mt-1 block">{rec.sourceIp}</span>
                <span className="text-cyan-400 text-[10px] block">Port {rec.sourcePort}</span>
              </div>
              <div className="p-4 bg-[#101827] rounded-xl border border-cyan-500/15">
                <span className="text-slate-400 text-[10px] block font-sans font-light">Target Endpoint</span>
                <span className="text-cyan-300 font-bold mt-1 block">{rec.destIp}</span>
                <span className="text-cyan-400 text-[10px] block">Port {rec.destPort}</span>
              </div>
              <div className="p-4 bg-[#101827] rounded-xl border border-cyan-500/15">
                <span className="text-slate-400 text-[10px] block font-sans font-light">Protocol</span>
                <span className="text-white font-bold mt-1 block">{rec.protocol}</span>
                <span className="text-slate-400 text-[10px] block">IP Transport</span>
              </div>
              <div className="p-4 bg-[#101827] rounded-xl border border-cyan-500/15">
                <span className="text-slate-400 text-[10px] block font-sans font-light">Flow Duration</span>
                <span className="text-white font-bold mt-1 block">{rec.flowDuration} ms</span>
                <span className="text-slate-400 text-[10px] block">Session Active</span>
              </div>
            </div>
          </div>

          {/* Baseline vs Observed Values Table */}
          <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white font-heading">Statistical Baseline vs Observed Values</h2>
              <span className="text-xs font-mono text-slate-300">
                Composite Anomaly Score: <strong className="text-rose-400 text-sm">{selectedAlert.compositeScore}/100</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-[#0B0F19] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Network Dimension</th>
                    <th className="py-3 px-3 text-right">Historical Mean (μ)</th>
                    <th className="py-3 px-3 text-right">Upper IQR Bound</th>
                    <th className="py-3 px-3 text-right">Observed Value (X)</th>
                    <th className="py-3 px-3 text-right">Deviation / Z-Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-white">Packet Count</td>
                    <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                      {baselines.packetCount?.mean.toFixed(1) || '180'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                      {Math.round(baselines.packetCount?.upperBound || 60)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-white tabular-nums">
                      {rec.packetCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-bold tabular-nums">
                      <span className={rec.packetCount > (baselines.packetCount?.upperBound || 60) ? 'text-rose-400' : 'text-cyan-400'}>
                        {((rec.packetCount - (baselines.packetCount?.mean || 0)) / Math.max(1, baselines.packetCount?.stdDev || 1)).toFixed(2)}σ
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-semibold text-white">Total Bytes</td>
                    <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                      {Math.round((baselines.totalBytes?.mean || 150000) / 1024)} KB
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                      {Math.round((baselines.totalBytes?.upperBound || 25000) / 1024)} KB
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-white tabular-nums">
                      {rec.totalBytes > 1024 * 1024
                        ? `${(rec.totalBytes / (1024 * 1024)).toFixed(1)} MB`
                        : `${Math.round(rec.totalBytes / 1024)} KB`}
                    </td>
                    <td className="py-3 px-3 text-right font-bold tabular-nums">
                      <span className={rec.totalBytes > (baselines.totalBytes?.upperBound || 25000) ? 'text-rose-400' : 'text-cyan-400'}>
                        {((rec.totalBytes - (baselines.totalBytes?.mean || 0)) / Math.max(1, baselines.totalBytes?.stdDev || 1)).toFixed(2)}σ
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-semibold text-white">Connection Frequency</td>
                    <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                      {baselines.connectionFrequency?.mean.toFixed(1) || '45'} pps
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                      {Math.round(baselines.connectionFrequency?.upperBound || 70)} pps
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-white tabular-nums">
                      {rec.connectionFrequency} pps
                    </td>
                    <td className="py-3 px-3 text-right font-bold tabular-nums">
                      <span className={rec.connectionFrequency > (baselines.connectionFrequency?.upperBound || 70) ? 'text-rose-400' : 'text-cyan-400'}>
                        {((rec.connectionFrequency - (baselines.connectionFrequency?.mean || 0)) / Math.max(1, baselines.connectionFrequency?.stdDev || 1)).toFixed(2)}σ
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Triggered Detection Techniques & Explainable AI */}
          <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-4">
            <h2 className="text-base font-bold text-white font-heading">Detection Rationale & Invariants</h2>

            <div className="space-y-2">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Active Detection Algorithms:</span>
              <div className="flex flex-wrap gap-2">
                {selectedAlert.detectionMethods.map((m, i) => (
                  <span key={i} className="px-3 py-1 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-xs font-mono">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Anomaly Evaluation:</span>
              <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 font-light">
                {selectedAlert.primaryReasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Tactical SOC Recommendations & Notes */}
        <div className="space-y-6">
          {/* Tactical Recommendations */}
          <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-4">
            <h2 className="text-base font-bold text-white font-heading flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Recommended SOC Actions</span>
            </h2>
            <p className="text-xs text-slate-400 font-light">
              Guidance tailored for potential {selectedAlert.predictedAttack}:
            </p>

            <div className="space-y-2.5 pt-1">
              {getTacticalRecommendations().map((step, idx) => (
                <div key={idx} className="p-3.5 bg-[#101827] border border-cyan-500/15 rounded-xl text-xs flex items-start gap-3">
                  <span className="w-5 h-5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-slate-300 leading-relaxed font-light">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Analyst Case Notes */}
          <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white font-heading flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Analyst Case Notes</span>
              </h2>
              {saveSuccess && (
                <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </span>
              )}
            </div>
            <textarea
              value={analystNotes}
              onChange={(e) => setAnalystNotes(e.target.value)}
              placeholder="Record forensic observations, ticket IDs, host ownership, or escalation details..."
              rows={5}
              className="w-full bg-[#101827] border border-cyan-500/25 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(0,229,255,0.2)] font-mono transition-all"
            />
            <button
              onClick={handleSaveNotes}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-[#080B12] bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 rounded-xl transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)] font-heading"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Case Notes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
