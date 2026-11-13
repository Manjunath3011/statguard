import React, { useState } from 'react';
import {
  Search,
  ArrowUpDown,
  SearchCode,
  Download,
  ShieldAlert,
  Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SeverityLevel } from '../../types/network';
import { exportAnomaliesAsCSV } from '../../utils/pdfGenerator';

export const ThreatDetectionPage: React.FC = () => {
  const { summary, selectAlertForInvestigation } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'score' | 'time'>('score');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Filter anomalies
  const filteredAnomalies = React.useMemo(() => {
    return summary.anomalies.filter(anom => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesIp = anom.packetRecord.sourceIp.toLowerCase().includes(query) ||
          anom.packetRecord.destIp.toLowerCase().includes(query);
        const matchesCat = anom.predictedAttack.toLowerCase().includes(query);
        const matchesProto = anom.packetRecord.protocol.toLowerCase().includes(query);
        const matchesPort = anom.packetRecord.destPort.toString().includes(query);
        if (!matchesIp && !matchesCat && !matchesProto && !matchesPort) return false;
      }

      // Severity filter
      if (selectedSeverity !== 'ALL' && anom.severity !== selectedSeverity) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && anom.predictedAttack !== selectedCategory) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortField === 'score') {
        return sortAsc ? a.compositeScore - b.compositeScore : b.compositeScore - a.compositeScore;
      } else {
        const tA = new Date(a.packetRecord.timestamp).getTime();
        const tB = new Date(b.packetRecord.timestamp).getTime();
        return sortAsc ? tA - tB : tB - tA;
      }
    });
  }, [summary.anomalies, searchQuery, selectedSeverity, selectedCategory, sortField, sortAsc]);

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
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#101827]/90 via-[#151E2D]/80 to-[#101827]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
            THREAT SURVEILLANCE & ANOMALY MATRIX
          </h1>
          <p className="text-xs text-cyan-300/80 mt-1 font-light">
            Multivariate statistical anomaly scoring and probabilistic cyberattack pattern classification.
          </p>
        </div>

        <button
          onClick={() => exportAnomaliesAsCSV(summary)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-cyan-300 bg-[#151E2D] hover:bg-cyan-950/40 hover:border-cyan-400/50 border border-cyan-500/25 rounded-xl transition-all shadow-[0_0_12px_rgba(0,229,255,0.15)]"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Export Anomalies CSV</span>
        </button>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl bg-[#151E2D]/85 border border-cyan-500/15 backdrop-blur-md">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Total Records</span>
          <span className="text-xl font-bold font-mono text-white tabular-nums mt-0.5 block">{summary.totalRecords}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#151E2D]/85 border border-emerald-500/20 backdrop-blur-md">
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Normal Baseline</span>
          <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-0.5 block">{summary.normalRecords}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#151E2D]/85 border border-amber-500/20 backdrop-blur-md">
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">Anomalies</span>
          <span className="text-xl font-bold font-mono text-amber-400 tabular-nums mt-0.5 block">{summary.anomalousRecords}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#151E2D]/85 border border-cyan-500/15 backdrop-blur-md">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Anomaly Rate</span>
          <span className="text-xl font-bold font-mono text-cyan-300 tabular-nums mt-0.5 block">{summary.anomalyRate.toFixed(1)}%</span>
        </div>
        <div className="p-4 rounded-xl bg-[#151E2D]/85 border border-rose-500/20 backdrop-blur-md">
          <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block">Critical</span>
          <span className="text-xl font-bold font-mono text-rose-400 tabular-nums mt-0.5 block">{summary.criticalCount}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#151E2D]/85 border border-orange-500/20 backdrop-blur-md">
          <span className="text-[10px] font-mono text-orange-400 uppercase tracking-wider block">High Severity</span>
          <span className="text-xl font-bold font-mono text-orange-400 tabular-nums mt-0.5 block">{summary.highCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by IP, port, attack classification, or protocol..."
              className="w-full bg-[#080B12] border border-cyan-500/25 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(0,229,255,0.25)] transition-all font-mono"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-[#080B12] border border-cyan-500/25 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono transition-all"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Threat:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#080B12] border border-cyan-500/25 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono transition-all"
            >
              <option value="ALL">All Attack Categories</option>
              <option value="DDoS Attack">DDoS Attack</option>
              <option value="DoS Attack">DoS Attack</option>
              <option value="Port Scanning">Port Scanning</option>
              <option value="Brute Force Attack">Brute Force Attack</option>
              <option value="Suspicious Data Exfiltration">Data Exfiltration</option>
              <option value="Network Flooding">Network Flooding</option>
              <option value="Unusual Network Access">Unusual Network Access</option>
            </select>
          </div>

          {/* Sort Toggle */}
          <button
            onClick={() => {
              if (sortField === 'score') {
                setSortAsc(!sortAsc);
              } else {
                setSortField('score');
                setSortAsc(false);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#080B12] hover:bg-cyan-950/40 border border-cyan-500/25 rounded-xl text-xs font-mono text-cyan-300 transition-all"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>Score {sortField === 'score' ? (sortAsc ? '↑' : '↓') : ''}</span>
          </button>
        </div>
      </div>

      {/* Main Anomalies Table with Futuristic Styling */}
      <div className="p-1 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-[#0B0F19] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Source Endpoint</th>
                <th className="py-3.5 px-4">Destination IP : Port</th>
                <th className="py-3.5 px-4">Proto</th>
                <th className="py-3.5 px-4">Potential Threat Classification</th>
                <th className="py-3.5 px-4 text-right">Packets / Bytes</th>
                <th className="py-3.5 px-4 text-right">Score</th>
                <th className="py-3.5 px-4 text-center">Severity</th>
                <th className="py-3.5 px-4 text-right">Triage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredAnomalies.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-light">
                    No anomalies match the selected filters or search query.
                  </td>
                </tr>
              ) : (
                filteredAnomalies.map(anom => (
                  <tr key={anom.id} className="hover:bg-cyan-500/5 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {anom.packetRecord.timestamp.split('T')[1]?.substring(0, 8) || anom.packetRecord.timestamp.substring(11, 19)}
                    </td>

                    {/* Source IP */}
                    <td className="py-3.5 px-4 font-semibold text-white font-mono">
                      {anom.packetRecord.sourceIp}
                      <span className="text-[10px] text-slate-400 block font-mono font-normal">
                        Port {anom.packetRecord.sourcePort}
                      </span>
                    </td>

                    {/* Destination IP */}
                    <td className="py-3.5 px-4 text-cyan-300 font-mono">
                      {anom.packetRecord.destIp}
                      <span className="text-[10px] text-cyan-400/70 block font-mono">
                        Port {anom.packetRecord.destPort}
                      </span>
                    </td>

                    {/* Protocol */}
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {anom.packetRecord.protocol}
                    </td>

                    {/* Potential attack category */}
                    <td className="py-3.5 px-4 font-medium text-white">
                      <div className="font-bold text-white font-heading">{anom.predictedAttack}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 max-w-xs mt-0.5 font-light" title={anom.primaryReasons.join(' ')}>
                        {anom.primaryReasons[0]}
                      </div>
                    </td>

                    {/* Packets & Bytes */}
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-300">
                      <div className="text-white font-semibold">{anom.packetRecord.packetCount.toLocaleString()} pkts</div>
                      <div className="text-[10px] text-slate-400">
                        {anom.packetRecord.totalBytes > 1024 * 1024
                          ? `${(anom.packetRecord.totalBytes / (1024 * 1024)).toFixed(1)} MB`
                          : `${Math.round(anom.packetRecord.totalBytes / 1024)} KB`}
                      </div>
                    </td>

                    {/* Statistical score */}
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      <span className={`text-base font-bold ${anom.compositeScore >= 75 ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]' : anom.compositeScore >= 50 ? 'text-amber-400' : 'text-cyan-400'}`}>
                        {anom.compositeScore}
                      </span>
                      <span className="text-[10px] text-slate-500 block">/100</span>
                    </td>

                    {/* Risk severity */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-md border tracking-wider font-mono ${severityBadge(anom.severity)}`}>
                        {anom.severity}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => selectAlertForInvestigation(anom)}
                        className="flex items-center gap-1.5 ml-auto px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 rounded-xl transition-all shadow-[0_0_10px_rgba(0,229,255,0.2)] whitespace-nowrap"
                      >
                        <SearchCode className="w-3.5 h-3.5" />
                        <span>Investigate</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
