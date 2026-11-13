import React from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  FileCode,
  Printer,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generatePdfSecurityReport, exportAnomaliesAsCSV } from '../../utils/pdfGenerator';

export const ReportsPage: React.FC = () => {
  const { summary } = useApp();

  const exportAsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(summary, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `STATGUARD-Audit-${summary.datasetName.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 space-y-7 max-w-7xl mx-auto cyber-grid">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#101827]/90 via-[#151E2D]/80 to-[#101827]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
            FORENSIC AUDITS & DATA EXPORT
          </h1>
          <p className="text-xs text-cyan-300/80 mt-1 font-light">
            Generate executive compliance reports, export anomalous flow records, and download complete JSON telemetry packages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-300 bg-[#151E2D] hover:bg-cyan-950/40 hover:border-cyan-400/50 border border-cyan-500/25 rounded-xl transition-all"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Print View</span>
          </button>
          <button
            onClick={() => generatePdfSecurityReport(summary)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#080B12] bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 rounded-xl shadow-[0_0_15px_rgba(0,229,255,0.35)] transition-all font-heading"
          >
            <Download className="w-4 h-4" />
            <span>Generate PDF Audit</span>
          </button>
        </div>
      </div>

      {/* 3 Quick Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PDF Security Report */}
        <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/25 backdrop-blur-xl shadow-lg space-y-5 flex flex-col justify-between transition-all hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(0,229,255,0.2)] group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.2)] group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 stroke-[1.75]" />
            </div>
            <h2 className="text-base font-bold text-white font-heading">Executive Security Audit PDF</h2>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Complete multi-page compliance report containing network risk scores, methodology breakdowns, classified threat matrix, and SOC remediation directives.
            </p>
          </div>
          <button
            onClick={() => generatePdfSecurityReport(summary)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-[#080B12] bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 rounded-xl transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)] font-heading"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>
        </div>

        {/* CSV Anomalies Export */}
        <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-emerald-500/25 backdrop-blur-xl shadow-lg space-y-5 flex flex-col justify-between transition-all hover:border-emerald-400/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)] group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-6 h-6 stroke-[1.75]" />
            </div>
            <h2 className="text-base font-bold text-white font-heading">Anomalous Flows (CSV)</h2>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Export all flagged statistical outliers including timestamps, source/destination IPs, ports, Z-scores, and classification categories for SIEM ingestion.
            </p>
          </div>
          <button
            onClick={() => exportAnomaliesAsCSV(summary)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#101827] hover:bg-[#1A263A] hover:border-emerald-400/50 border border-emerald-500/30 rounded-xl transition-all shadow-sm font-heading"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Anomalies CSV</span>
          </button>
        </div>

        {/* Full Forensic JSON Bundle */}
        <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-purple-500/25 backdrop-blur-xl shadow-lg space-y-5 flex flex-col justify-between transition-all hover:border-purple-400/60 hover:shadow-[0_0_20px_rgba(149,101,255,0.2)] group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_12px_rgba(149,101,255,0.2)] group-hover:scale-110 transition-transform">
              <FileCode className="w-6 h-6 stroke-[1.75]" />
            </div>
            <h2 className="text-base font-bold text-white font-heading">Complete Forensic JSON Bundle</h2>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Full structured dataset export with baseline feature distributions, preprocessing metrics, mathematical constants, and analyst case notes.
            </p>
          </div>
          <button
            onClick={exportAsJson}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#101827] hover:bg-[#1A263A] hover:border-purple-400/50 border border-purple-500/30 rounded-xl transition-all shadow-sm font-heading"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>Download JSON Bundle</span>
          </button>
        </div>
      </div>

      {/* Report Preview Document */}
      <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Real-Time Preview</span>
            <h2 className="text-lg font-bold text-white font-heading mt-0.5">STATGUARD Cyber Threat Audit Summary</h2>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            Target Capture: <strong className="text-white font-bold">{summary.datasetName}</strong>
          </span>
        </div>

        {/* Threat Scorecard & Overview */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400">1. Threat Scorecard & Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 bg-[#101827] rounded-xl border border-cyan-500/15">
              <span className="text-slate-400 text-[10px] block font-sans font-light">Network Risk Rating</span>
              <span className={`text-2xl font-bold mt-1 block ${summary.networkRiskScore > 50 ? 'text-rose-400' : 'text-cyan-400'}`}>
                {summary.networkRiskScore} / 100
              </span>
            </div>
            <div className="p-4 bg-[#101827] rounded-xl border border-cyan-500/15">
              <span className="text-slate-400 text-[10px] block font-sans font-light">Total Flows Ingested</span>
              <span className="text-2xl font-bold text-white mt-1 block">{summary.totalRecords}</span>
            </div>
            <div className="p-4 bg-[#101827] rounded-xl border border-cyan-500/15">
              <span className="text-slate-400 text-[10px] block font-sans font-light">Statistical Outlier Rate</span>
              <span className="text-2xl font-bold text-amber-400 mt-1 block">{summary.anomalyRate.toFixed(2)}%</span>
            </div>
            <div className="p-4 bg-[#101827] rounded-xl border border-rose-500/20">
              <span className="text-slate-400 text-[10px] block font-sans font-light">Critical Incidents</span>
              <span className="text-2xl font-bold text-rose-400 mt-1 block">{summary.criticalCount}</span>
            </div>
          </div>
        </div>

        {/* Classified Cyber Threat Distribution */}
        <div className="space-y-3 pt-2">
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400">2. Classified Cyber Threat Distribution</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            {Object.entries(summary.categoryCounts).map(([cat, count]) => (
              <div key={cat} className="p-3 bg-[#101827] rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300 font-sans font-light">{cat}</span>
                <span className={`font-bold tabular-nums ${count > 0 && cat !== 'Normal Traffic' ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Baseline Statistics Reference */}
        <div className="space-y-3 pt-2">
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-slate-400">3. Historical Baseline Feature Bounds</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-[#0B0F19] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Dimension</th>
                  <th className="py-2.5 px-3 text-right">Mean (μ)</th>
                  <th className="py-2.5 px-3 text-right">Std Dev (σ)</th>
                  <th className="py-2.5 px-3 text-right">Q1 (25%)</th>
                  <th className="py-2.5 px-3 text-right">Median (50%)</th>
                  <th className="py-2.5 px-3 text-right">Q3 (75%)</th>
                  <th className="py-2.5 px-3 text-right">Upper IQR Fence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {Object.entries(summary.featureBaselines).map(([feat, b]) => (
                  <tr key={feat}>
                    <td className="py-2.5 px-3 font-semibold text-white">{feat}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{b.mean > 1000 ? Math.round(b.mean).toLocaleString() : b.mean.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{b.stdDev > 1000 ? Math.round(b.stdDev).toLocaleString() : b.stdDev.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{b.q1 > 1000 ? Math.round(b.q1).toLocaleString() : b.q1.toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{b.median > 1000 ? Math.round(b.median).toLocaleString() : b.median.toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{b.q3 > 1000 ? Math.round(b.q3).toLocaleString() : b.q3.toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-rose-400 font-bold">{b.upperBound > 1000 ? Math.round(b.upperBound).toLocaleString() : b.upperBound.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
