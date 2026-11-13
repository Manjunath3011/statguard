import React, { useState } from 'react';
import {
  Calculator,
  Activity,
  Sliders,
  TrendingUp,
  Brain,
  Hash,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { useApp } from '../../context/AppContext';
import {
  calculateZScore,
  calculateMovingAverages,
  calculateShannonEntropy
} from '../../utils/statistics';

export const StatisticalAnalysisPage: React.FC = () => {
  const { summary, settings, updateSettings } = useApp();
  const [activeTechnique, setActiveTechnique] = useState<'zscore' | 'iqr' | 'ma' | 'stddev' | 'iforest' | 'entropy'>('zscore');
  const [expandedExplanation, setExpandedExplanation] = useState<boolean>(true);

  // Baseline stats
  const packetBaselines = summary.featureBaselines.packetCount || {
    mean: 180, stdDev: 420, variance: 176400, median: 15, iqr: 18, q1: 8, q3: 26, lowerBound: 0, upperBound: 53, min: 2, max: 5500
  };
  const bytesBaselines = summary.featureBaselines.totalBytes || {
    mean: 150000, stdDev: 850000, variance: 722500000000, median: 7500, iqr: 12000, q1: 3000, q3: 15000, lowerBound: 0, upperBound: 33000, min: 120, max: 70000000
  };
  const freqBaselines = summary.featureBaselines.connectionFrequency || {
    mean: 45, stdDev: 180, variance: 32400, median: 12, iqr: 22, q1: 5, q3: 27, lowerBound: 0, upperBound: 60, min: 1, max: 6000
  };

  // Z-Score Distribution data bins
  const zScoreBins = React.useMemo(() => {
    const bins: { range: string; count: number; isOutlier: boolean }[] = [
      { range: '< -3.0σ', count: 0, isOutlier: true },
      { range: '-3σ to -2σ', count: 0, isOutlier: false },
      { range: '-2σ to -1σ', count: 0, isOutlier: false },
      { range: '-1σ to 0σ', count: 0, isOutlier: false },
      { range: '0σ to +1σ', count: 0, isOutlier: false },
      { range: '+1σ to +2σ', count: 0, isOutlier: false },
      { range: '+2σ to +2.5σ', count: 0, isOutlier: false },
      { range: '+2.5σ to +3σ', count: 0, isOutlier: false },
      { range: '> +3.0σ', count: 0, isOutlier: true }
    ];

    summary.records.forEach(r => {
      const z = calculateZScore(r.packetCount, packetBaselines.mean, packetBaselines.stdDev);
      if (z < -3) bins[0].count++;
      else if (z < -2) bins[1].count++;
      else if (z < -1) bins[2].count++;
      else if (z < 0) bins[3].count++;
      else if (z < 1) bins[4].count++;
      else if (z < 2) bins[5].count++;
      else if (z < 2.5) bins[6].count++;
      else if (z < 3) bins[7].count++;
      else bins[8].count++;
    });

    return bins;
  }, [summary, packetBaselines]);

  // Moving Average Chart data
  const maChartData = React.useMemo(() => {
    const packetCounts = summary.records.map(r => r.packetCount);
    const ma = calculateMovingAverages(packetCounts, settings.movingAvgWindowSize);

    return summary.records.slice(0, 45).map((r, i) => ({
      index: `#${i + 1}`,
      raw: r.packetCount,
      sma: Math.round(ma.sma[i] || 0),
      upperBand: Math.round(ma.upperBand[i] || 0)
    }));
  }, [summary, settings.movingAvgWindowSize]);

  // Shannon Entropy values
  const entropyStats = React.useMemo(() => {
    const allDestIps = summary.records.map(r => r.destIp);
    const allPorts = summary.records.map(r => r.destPort);
    const ipEntropy = calculateShannonEntropy(allDestIps);
    const portEntropy = calculateShannonEntropy(allPorts);
    return { ipEntropy, portEntropy };
  }, [summary]);

  return (
    <div className="p-8 space-y-7 max-w-7xl mx-auto cyber-grid">
      {/* Title */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#101827]/90 via-[#151E2D]/80 to-[#101827]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
            STATISTICAL DETECTION ENGINE
          </h1>
          <p className="text-xs text-cyan-300/80 mt-1 font-light">
            Mathematical parameterization, parametric/non-parametric thresholding, and entropy dispersion.
          </p>
        </div>

        {/* Global Threshold Quick Tuner with Cyan Glow */}
        <div className="flex items-center gap-3 bg-[#080B12] border border-cyan-500/30 rounded-xl p-2.5 text-xs shadow-[0_0_15px_rgba(0,229,255,0.15)]">
          <div className="flex items-center gap-3">
            <span className="text-slate-300 font-mono">Z-Score Cutoff:</span>
            <input
              type="range"
              min="1.5"
              max="4.0"
              step="0.1"
              value={settings.zScoreThreshold}
              onChange={(e) => updateSettings({ ...settings, zScoreThreshold: parseFloat(e.target.value) })}
              className="w-28 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono text-cyan-400 font-bold text-sm w-12 drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]">
              {settings.zScoreThreshold.toFixed(1)}σ
            </span>
          </div>
        </div>
      </div>

      {/* Technique Navigation Tabs with Cyan Gradient Indicators */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 border-b border-cyan-500/15">
        <button
          onClick={() => setActiveTechnique('zscore')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap font-heading ${
            activeTechnique === 'zscore'
              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
              : 'text-slate-400 hover:text-white hover:bg-[#151E2D] border border-transparent'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-cyan-400" />
          <span>A. Z-Score Analysis</span>
        </button>

        <button
          onClick={() => setActiveTechnique('iqr')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap font-heading ${
            activeTechnique === 'iqr'
              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
              : 'text-slate-400 hover:text-white hover:bg-[#151E2D] border border-transparent'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>B. Interquartile Range (IQR)</span>
        </button>

        <button
          onClick={() => setActiveTechnique('ma')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap font-heading ${
            activeTechnique === 'ma'
              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
              : 'text-slate-400 hover:text-white hover:bg-[#151E2D] border border-transparent'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          <span>C. Moving Average (MA)</span>
        </button>

        <button
          onClick={() => setActiveTechnique('stddev')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap font-heading ${
            activeTechnique === 'stddev'
              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
              : 'text-slate-400 hover:text-white hover:bg-[#151E2D] border border-transparent'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>D. Standard Deviation</span>
        </button>

        <button
          onClick={() => setActiveTechnique('iforest')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap font-heading ${
            activeTechnique === 'iforest'
              ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/10 text-purple-300 border border-purple-400/50 shadow-[0_0_15px_rgba(149,101,255,0.2)]'
              : 'text-slate-400 hover:text-white hover:bg-[#151E2D] border border-transparent'
          }`}
        >
          <Brain className="w-3.5 h-3.5 text-purple-400" />
          <span>E. Isolation Forest ML</span>
        </button>

        <button
          onClick={() => setActiveTechnique('entropy')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap font-heading ${
            activeTechnique === 'entropy'
              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
              : 'text-slate-400 hover:text-white hover:bg-[#151E2D] border border-transparent'
          }`}
        >
          <Hash className="w-3.5 h-3.5 text-cyan-400" />
          <span>F. Shannon Entropy</span>
        </button>
      </div>

      {/* TECHNIQUE CONTENT */}
      {activeTechnique === 'zscore' && (
        <div className="space-y-6">
          {/* Theory & Formula Card */}
          <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white font-heading">
                Technique A: Z-Score (Standard Score) Analysis
              </h2>
              <span className="font-mono text-cyan-300 text-xs px-3 py-1 rounded-xl bg-[#101827] border border-cyan-500/40 shadow-[0_0_10px_rgba(0,229,255,0.2)]">
                Formula: Z = (X - μ) / σ
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-light">
              The Z-score standardizes network traffic features by computing the signed number of standard deviations ($\sigma$) that an observed flow value ($X$) deviates above or below the historical feature mean ($\mu$). In network traffic, observations with $|Z| \ge {settings.zScoreThreshold.toFixed(1)}$ indicate severe anomalous surges typical of volumetric DDoS floods, credential stuffing bursts, or large data exfiltrations.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
              <div className="p-4 bg-[#101827] rounded-xl border border-cyan-500/15">
                <span className="text-slate-400 text-[10px] block font-sans">Mean Packet Count (μ)</span>
                <span className="text-white font-bold tabular-nums text-base mt-1 block">{packetBaselines.mean.toFixed(1)} pkts</span>
              </div>
              <div className="p-4 bg-[#101827] rounded-xl border border-cyan-500/15">
                <span className="text-slate-400 text-[10px] block font-sans">Standard Dev (σ)</span>
                <span className="text-cyan-400 font-bold tabular-nums text-base mt-1 block">{packetBaselines.stdDev.toFixed(1)}</span>
              </div>
              <div className="p-4 bg-[#101827] rounded-xl border border-cyan-500/15">
                <span className="text-slate-400 text-[10px] block font-sans">Threshold Cutoff</span>
                <span className="text-amber-400 font-bold tabular-nums text-base mt-1 block">±{settings.zScoreThreshold.toFixed(1)}σ</span>
              </div>
              <div className="p-4 bg-[#101827] rounded-xl border border-rose-500/20">
                <span className="text-slate-400 text-[10px] block font-sans">Flagged Outliers</span>
                <span className="text-rose-400 font-bold tabular-nums text-base mt-1 block">
                  {summary.anomalies.filter(a => a.metrics.zScoreFlagged).length} flows
                </span>
              </div>
            </div>
          </div>

          {/* Z-Score Distribution Chart */}
          <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-4">
            <div>
              <h3 className="text-base font-bold text-white font-heading">Empirical Z-Score Distribution of Packet Counts</h3>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                Bars beyond ±{settings.zScoreThreshold.toFixed(1)}σ represent statistical cyberattack candidates
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zScoreBins}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c283d" />
                  <XAxis dataKey="range" stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#00E5FF40', borderRadius: '12px', fontSize: '12px', color: '#F1F5F9' }}
                  />
                  <Bar dataKey="count" fill="#00E5FF" radius={[6, 6, 0, 0]} name="Observed Flows" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTechnique === 'iqr' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white font-heading">
                Technique B: Interquartile Range (IQR) Non-Parametric Fencing
              </h2>
              <span className="font-mono text-cyan-300 text-xs px-3 py-1 rounded-xl bg-[#101827] border border-cyan-500/40 shadow-[0_0_10px_rgba(0,229,255,0.2)]">
                Formula: IQR = Q3 - Q1
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Unlike Z-scores which assume a Gaussian normal distribution, Tukey's Interquartile Range (IQR) operates on non-parametric order statistics, making it robust against heavily skewed network distributions. Observations falling above Upper Fence ($Q3 + 1.5 \times IQR$) or below Lower Fence ($Q1 - 1.5 \times IQR$) are classified as non-parametric outliers.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 font-mono text-xs">
              <div className="p-4 bg-[#101827] rounded-xl border border-cyan-500/15">
                <span className="text-slate-400 text-[10px] block font-sans">First Quartile (Q1)</span>
                <span className="text-white font-bold tabular-nums text-base mt-1 block">{packetBaselines.q1} pkts</span>
              </div>
              <div className="p-4 bg-[#101827] rounded-xl border border-cyan-500/15">
                <span className="text-slate-400 text-[10px] block font-sans">Median (Q2)</span>
                <span className="text-white font-bold tabular-nums text-base mt-1 block">{packetBaselines.median} pkts</span>
              </div>
              <div className="p-4 bg-[#101827] rounded-xl border border-cyan-500/15">
                <span className="text-slate-400 text-[10px] block font-sans">Third Quartile (Q3)</span>
                <span className="text-white font-bold tabular-nums text-base mt-1 block">{packetBaselines.q3} pkts</span>
              </div>
              <div className="p-4 bg-[#101827] rounded-xl border border-cyan-500/15">
                <span className="text-slate-400 text-[10px] block font-sans">IQR Spread</span>
                <span className="text-cyan-400 font-bold tabular-nums text-base mt-1 block">{packetBaselines.iqr}</span>
              </div>
              <div className="p-4 bg-[#101827] rounded-xl border border-rose-500/20">
                <span className="text-slate-400 text-[10px] block font-sans">Upper Fence (Q3+1.5IQR)</span>
                <span className="text-rose-400 font-bold tabular-nums text-base mt-1 block">{Math.round(packetBaselines.upperBound)} pkts</span>
              </div>
            </div>
          </div>

          {/* Feature Comparison Box-plot Summary */}
          <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-4">
            <h3 className="text-base font-bold text-white font-heading">Multi-Feature IQR Threshold Boundaries</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 bg-[#101827] rounded-xl border border-cyan-500/20 space-y-2">
                <div className="text-cyan-400 font-bold font-heading text-sm">Packet Count IQR</div>
                <div className="flex justify-between text-slate-300">
                  <span>Lower Fence:</span>
                  <span className="tabular-nums">{Math.max(0, Math.round(packetBaselines.lowerBound))} pkts</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Upper Fence:</span>
                  <span className="tabular-nums font-bold text-rose-400">{Math.round(packetBaselines.upperBound)} pkts</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px] pt-1.5 border-t border-slate-800">
                  <span>Outliers Breached:</span>
                  <span className="text-cyan-400 font-bold">{summary.anomalies.filter(a => a.packetRecord.packetCount > packetBaselines.upperBound).length} flows</span>
                </div>
              </div>

              <div className="p-4 bg-[#101827] rounded-xl border border-cyan-500/20 space-y-2">
                <div className="text-cyan-400 font-bold font-heading text-sm">Total Bytes Transfer IQR</div>
                <div className="flex justify-between text-slate-300">
                  <span>Lower Fence:</span>
                  <span className="tabular-nums">0 B</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Upper Fence:</span>
                  <span className="tabular-nums font-bold text-rose-400">{Math.round(bytesBaselines.upperBound / 1024)} KB</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px] pt-1.5 border-t border-slate-800">
                  <span>Outliers Breached:</span>
                  <span className="text-cyan-400 font-bold">{summary.anomalies.filter(a => a.packetRecord.totalBytes > bytesBaselines.upperBound).length} flows</span>
                </div>
              </div>

              <div className="p-4 bg-[#101827] rounded-xl border border-cyan-500/20 space-y-2">
                <div className="text-cyan-400 font-bold font-heading text-sm">Connection Frequency IQR</div>
                <div className="flex justify-between text-slate-300">
                  <span>Lower Fence:</span>
                  <span className="tabular-nums">0 pps</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Upper Fence:</span>
                  <span className="tabular-nums font-bold text-rose-400">{Math.round(freqBaselines.upperBound)} pps</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px] pt-1.5 border-t border-slate-800">
                  <span>Outliers Breached:</span>
                  <span className="text-cyan-400 font-bold">{summary.anomalies.filter(a => a.packetRecord.connectionFrequency > freqBaselines.upperBound).length} flows</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTechnique === 'ma' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white font-heading">
                Technique C: Moving Average & Dynamic Bollinger Volatility Bands
              </h2>
              <span className="font-mono text-cyan-300 text-xs px-3 py-1 rounded-xl bg-[#101827] border border-cyan-500/40">
                Window: {settings.movingAvgWindowSize} periods
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Moving averages calculate a rolling temporal baseline of network traffic over sliding observation windows. By pairing the Simple Moving Average ($SMA_k$) with a rolling standard deviation band ($SMA_k + 2\sigma_k$), STATGUARD dynamically detects abrupt localized bursts, sudden step-ups, and sudden drops even when baseline traffic shifts over the working day.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-4">
            <div>
              <h3 className="text-base font-bold text-white font-heading">Observed Packet Counts vs Dynamic Volatility Envelope</h3>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                Points penetrating through the purple upper volatility envelope trigger immediate temporal surge alerts
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={maChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c283d" />
                  <XAxis dataKey="index" stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#00E5FF40', borderRadius: '12px', fontSize: '12px', color: '#F1F5F9' }}
                  />
                  <Line type="monotone" dataKey="raw" stroke="#00E5FF" strokeWidth={2.5} dot={false} name="Raw Packet Count" />
                  <Line type="monotone" dataKey="sma" stroke="#10B981" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="SMA Baseline" />
                  <Line type="monotone" dataKey="upperBand" stroke="#9565FF" strokeWidth={1.5} strokeDasharray="2 2" dot={false} name="Upper Volatility (+2σ)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTechnique === 'stddev' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white font-heading">
                Technique D: Standard Deviation & Feature Variance Analysis
              </h2>
              <span className="font-mono text-cyan-300 text-xs px-3 py-1 rounded-xl bg-[#101827] border border-cyan-500/40">
                Formula: σ = √ [ Σ(X - μ)² / (N - 1) ]
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Variance analysis tracks dispersion across packet counts, bytes transferred, and connection frequency. Significant expansion in standard deviation indicates that network flows are oscillating wildly, symptomatic of botnet synchronization or multi-source scanning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 font-mono text-xs space-y-3">
              <div className="text-sm font-bold font-heading text-cyan-400">Packet Count Variance</div>
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between"><span>Mean (μ):</span><span className="text-white font-bold">{packetBaselines.mean.toFixed(1)}</span></div>
                <div className="flex justify-between"><span>Std Dev (σ):</span><span className="text-white font-bold">{packetBaselines.stdDev.toFixed(1)}</span></div>
                <div className="flex justify-between"><span>Variance (σ²):</span><span className="text-cyan-400">{(packetBaselines.variance / 1000).toFixed(1)}k</span></div>
                <div className="flex justify-between"><span>Coeff of Variation:</span><span className="text-amber-400 font-bold">{(packetBaselines.stdDev / Math.max(1, packetBaselines.mean)).toFixed(2)}</span></div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 font-mono text-xs space-y-3">
              <div className="text-sm font-bold font-heading text-cyan-400">Total Bytes Variance</div>
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between"><span>Mean (μ):</span><span className="text-white font-bold">{Math.round(bytesBaselines.mean).toLocaleString()} B</span></div>
                <div className="flex justify-between"><span>Std Dev (σ):</span><span className="text-white font-bold">{Math.round(bytesBaselines.stdDev).toLocaleString()} B</span></div>
                <div className="flex justify-between"><span>Min - Max Range:</span><span className="text-cyan-400">{(bytesBaselines.max / (1024 * 1024)).toFixed(1)} MB</span></div>
                <div className="flex justify-between"><span>Coeff of Variation:</span><span className="text-amber-400 font-bold">{(bytesBaselines.stdDev / Math.max(1, bytesBaselines.mean)).toFixed(2)}</span></div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 font-mono text-xs space-y-3">
              <div className="text-sm font-bold font-heading text-cyan-400">Frequency Variance</div>
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between"><span>Mean (μ):</span><span className="text-white font-bold">{freqBaselines.mean.toFixed(1)} pps</span></div>
                <div className="flex justify-between"><span>Std Dev (σ):</span><span className="text-white font-bold">{freqBaselines.stdDev.toFixed(1)} pps</span></div>
                <div className="flex justify-between"><span>Max Spike:</span><span className="text-rose-400 font-bold">{freqBaselines.max} pps</span></div>
                <div className="flex justify-between"><span>Coeff of Variation:</span><span className="text-amber-400 font-bold">{(freqBaselines.stdDev / Math.max(1, freqBaselines.mean)).toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTechnique === 'iforest' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-purple-500/25 backdrop-blur-xl shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white font-heading">
                Technique E: Isolation Forest Machine Learning Ensemble
              </h2>
              <span className="font-mono text-purple-300 text-xs px-3 py-1 rounded-xl bg-[#101827] border border-purple-500/40">
                Ensemble: 35 Trees · Subsample: 64
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Isolation Forest explicitly isolates anomalies rather than profiling normal data points. Because anomalous network flows have few neighboring points and distinct multi-attribute signatures (e.g. extreme packet size with zero duration), they are partitioned in binary trees with significantly shorter path lengths $E(h(x))$ than normal cluster points.
            </p>
            <div className="p-3 bg-[#101827] rounded-xl border border-purple-500/30 font-mono text-xs text-purple-300">
              Anomaly Score: s(x, n) = 2^(-E(h(x)) / c(n)) · Scores &gt; 0.60 flag multi-variate statistical isolation.
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-4">
            <h3 className="text-base font-bold text-white font-heading">Isolation Forest Outlier Detection Results</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800 bg-[#0B0F19]">
                  <tr>
                    <th className="py-3 px-3">Flow ID</th>
                    <th className="py-3 px-3">Source Endpoint</th>
                    <th className="py-3 px-3">Destination Endpoint</th>
                    <th className="py-3 px-3 text-right">Packets</th>
                    <th className="py-3 px-3 text-right">Bytes</th>
                    <th className="py-3 px-3 text-right">iForest Score</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {summary.anomalies.slice(0, 8).map(anom => (
                    <tr key={anom.id} className="hover:bg-cyan-500/5 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400">{anom.packetRecord.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{anom.packetRecord.sourceIp}</td>
                      <td className="py-2.5 px-3 text-cyan-300">{anom.packetRecord.destIp}:{anom.packetRecord.destPort}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-white">{anom.packetRecord.packetCount.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-300">{(anom.packetRecord.totalBytes / 1024).toFixed(1)} KB</td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold text-purple-400">
                        {anom.metrics.isolationForestScore.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-semibold text-rose-300 bg-rose-950/80 px-2.5 py-0.5 rounded-md border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]">
                          ISOLATED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTechnique === 'entropy' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white font-heading">
                Technique F: Shannon Information Entropy Analysis
              </h2>
              <span className="font-mono text-cyan-300 text-xs px-3 py-1 rounded-xl bg-[#101827] border border-cyan-500/40">
                Formula: H(X) = - Σ P(x) · log₂(P(x))
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Shannon Entropy quantifies the uncertainty and spread of categorical network distributions (such as Destination IP addresses and Port numbers). In normal enterprise traffic, communication is dispersed across multiple internal servers and CDNs (moderate-to-high entropy). In DDoS and Flooding attacks, traffic collapses onto a single victim IP (entropy collapses towards 0). Conversely, during Port Scanning sweeps, entropy across destination ports surges to maximum dispersion.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 font-mono text-xs">
              <div className="p-5 bg-[#101827] rounded-xl border border-cyan-500/20 space-y-1">
                <span className="text-slate-400 text-[10px] block font-sans">Destination IP Entropy</span>
                <span className="text-3xl font-bold text-cyan-400 tabular-nums">
                  {entropyStats.ipEntropy.toFixed(2)} <span className="text-xs font-normal text-slate-400">bits</span>
                </span>
                <p className="text-[11px] text-slate-400 font-sans font-light mt-1.5">
                  Baseline healthy range: 2.5 - 4.5 bits. Collapses &lt; 1.5 bits indicate concentrated victim target.
                </p>
              </div>

              <div className="p-5 bg-[#101827] rounded-xl border border-purple-500/20 space-y-1">
                <span className="text-slate-400 text-[10px] block font-sans">Destination Port Entropy</span>
                <span className="text-3xl font-bold text-purple-400 tabular-nums">
                  {entropyStats.portEntropy.toFixed(2)} <span className="text-xs font-normal text-slate-400">bits</span>
                </span>
                <p className="text-[11px] text-slate-400 font-sans font-light mt-1.5">
                  Surges above 3.8 bits paired with low packet volume denote horizontal port scanning sweeps.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
