import React from 'react';
import {
  Sliders,
  RotateCcw,
  ShieldAlert,
  Brain,
  CheckCircle2,
  Cpu,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEFAULT_SETTINGS } from '../../utils/threatClassifier';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, summary } = useApp();
  const [savedBadge, setSavedBadge] = React.useState(false);

  const handleChange = (newSettings: typeof settings) => {
    updateSettings(newSettings);
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 1500);
  };

  const handleReset = () => {
    updateSettings(DEFAULT_SETTINGS);
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 1500);
  };

  return (
    <div className="p-8 space-y-7 max-w-7xl mx-auto cyber-grid">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#101827]/90 via-[#151E2D]/80 to-[#101827]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
            ENGINE CALIBRATION & HEURISTICS
          </h1>
          <p className="text-xs text-cyan-300/80 mt-1 font-light">
            Real-time tuning of statistical variance cutoffs, non-parametric multipliers, and ML isolation parameters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedBadge && (
            <span className="text-xs text-cyan-400 font-mono flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Applied to {summary.totalRecords} active flows</span>
            </span>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-300 bg-[#151E2D] hover:bg-cyan-950/40 hover:border-cyan-400/50 border border-cyan-500/25 rounded-xl transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset to Defaults</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Statistical Thresholds */}
        <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white font-heading">Parametric & Non-Parametric Sensitivities</h2>
          </div>

          {/* Z-Score Threshold */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="text-white font-semibold font-heading">Z-Score Outlier Cutoff (σ)</label>
              <span className="font-mono text-cyan-400 font-bold text-sm drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]">
                {settings.zScoreThreshold.toFixed(1)}σ
              </span>
            </div>
            <input
              type="range"
              min="1.5"
              max="4.0"
              step="0.1"
              value={settings.zScoreThreshold}
              onChange={(e) => handleChange({ ...settings, zScoreThreshold: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 font-light">
              Flows with absolute Z-score exceeding this cutoff trigger parametric anomaly flags. Recommended: 2.5σ (98.8% normal coverage).
            </p>
          </div>

          {/* IQR Multiplier */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs">
              <label className="text-white font-semibold font-heading">Interquartile Range (IQR) Multiplier</label>
              <span className="font-mono text-cyan-400 font-bold text-sm drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]">
                {settings.iqrMultiplier.toFixed(1)}×
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleChange({ ...settings, iqrMultiplier: 1.5 })}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono border transition-all ${
                  settings.iqrMultiplier === 1.5
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_12px_rgba(0,229,255,0.25)] font-bold'
                    : 'bg-[#101827] text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                1.5× (Tukey Standard)
              </button>
              <button
                onClick={() => handleChange({ ...settings, iqrMultiplier: 3.0 })}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono border transition-all ${
                  settings.iqrMultiplier === 3.0
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_12px_rgba(0,229,255,0.25)] font-bold'
                    : 'bg-[#101827] text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                3.0× (Extreme Outliers Only)
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-light">
              Defines upper fence: Q3 + k×IQR. 1.5 flags mild outliers; 3.0 flags only extreme deviations.
            </p>
          </div>

          {/* Moving Average Window */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs">
              <label className="text-white font-semibold font-heading">Moving Average Window Size (SMA)</label>
              <span className="font-mono text-cyan-400 font-bold text-sm drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]">
                {settings.movingAvgWindowSize} periods
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={settings.movingAvgWindowSize}
              onChange={(e) => handleChange({ ...settings, movingAvgWindowSize: parseInt(e.target.value, 10) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 font-light">
              Number of contiguous temporal flows used to construct dynamic Bollinger volatility envelopes.
            </p>
          </div>

          {/* Entropy Threshold */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs">
              <label className="text-white font-semibold font-heading">Shannon Entropy Collapse Cutoff (bits)</label>
              <span className="font-mono text-cyan-400 font-bold text-sm drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]">
                {settings.entropyLowThreshold.toFixed(1)} bits
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={settings.entropyLowThreshold}
              onChange={(e) => handleChange({ ...settings, entropyLowThreshold: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 font-light">
              Local IP dispersion below this value triggers target victimization / DDoS concentration alarms.
            </p>
          </div>
        </div>

        {/* Section 2: Severity Score Thresholds & ML Parameters */}
        <div className="space-y-6">
          {/* Severity Thresholds */}
          <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white font-heading">Composite Severity Boundaries (0 - 100)</h2>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-3.5 bg-[#101827] rounded-xl border border-rose-500/30">
                <span className="text-rose-400 font-sans font-semibold">Critical Severity Threshold:</span>
                <span className="font-bold text-white tabular-nums">≥ {settings.severityThresholds.critical} pts</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-[#101827] rounded-xl border border-amber-500/30">
                <span className="text-amber-400 font-sans font-semibold">High Severity Threshold:</span>
                <span className="font-bold text-white tabular-nums">≥ {settings.severityThresholds.high} pts</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-[#101827] rounded-xl border border-purple-500/30">
                <span className="text-purple-400 font-sans font-semibold">Medium Severity Threshold:</span>
                <span className="font-bold text-white tabular-nums">≥ {settings.severityThresholds.medium} pts</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-[#101827] rounded-xl border border-cyan-500/30">
                <span className="text-cyan-400 font-sans font-semibold">Low Severity Baseline:</span>
                <span className="font-bold text-white tabular-nums">&lt; {settings.severityThresholds.medium} pts</span>
              </div>
            </div>
          </div>

          {/* Machine Learning Model Hyperparameters */}
          <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-purple-500/25 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Brain className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white font-heading">Isolation Forest Hyperparameters</h2>
            </div>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Ensemble Estimator Trees:</span>
                <span className="text-white font-bold">35 Trees</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Sub-Sample Batch Size (Ψ):</span>
                <span className="text-white font-bold">64 samples</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Tree Max Partition Depth:</span>
                <span className="text-white font-bold">6 levels (log₂ 64)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Anomaly Score Cutoff:</span>
                <span className="text-purple-400 font-bold drop-shadow-[0_0_6px_rgba(149,101,255,0.5)]">s(x, n) ≥ 0.62</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
