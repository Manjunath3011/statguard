import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  Activity,
  Layers,
  Flame,
  ArrowUpRight,
  Radio,
  Clock,
  TrendingUp,
  Cpu,
  Terminal,
  Zap,
  BarChart3,
  Sliders,
  Sparkles,
  PieChart as PieChartIcon,
  Shield,
  SearchCode,
  Lock,
  Network
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { NetworkTopologyVisualization } from './NetworkTopologyVisualization';

export const DashboardPage: React.FC = () => {
  const { summary, setActivePage, loadSample, selectAlertForInvestigation } = useApp();

  // Traffic time-series data for chart with mini sparkline values
  const timeSeriesData = React.useMemo(() => {
    return summary.records.slice(0, 36).map((r, i) => {
      const isAnom = summary.anomalies.some(a => a.packetRecord.id === r.id);
      return {
        time: r.timestamp.split('T')[1]?.substring(0, 8) || `T+${i * 10}s`,
        packetCount: r.packetCount,
        bytesKB: Math.round(r.totalBytes / 1024),
        isAnomaly: isAnom ? r.packetCount : null
      };
    });
  }, [summary]);

  // Mini sparklines for stats cards
  const sparklinePackets = React.useMemo(() => {
    return summary.records.slice(0, 12).map((r, i) => ({ v: r.packetCount }));
  }, [summary]);

  const sparklineAnomalies = React.useMemo(() => {
    return summary.records.slice(0, 12).map((r, i) => {
      const isAnom = summary.anomalies.some(a => a.packetRecord.id === r.id);
      return { v: isAnom ? 80 : 15 };
    });
  }, [summary]);

  // Donut chart: Normal vs Anomalous (Electric Cyan vs Neon Red)
  const donutData = React.useMemo(() => [
    { name: 'Normal Baseline Traffic', value: summary.normalRecords, color: '#00E5FF' },
    { name: 'Suspicious Anomalies', value: summary.anomalousRecords, color: '#FF3366' }
  ], [summary]);

  // Attack category distribution
  const attackCategoryData = React.useMemo(() => {
    return Object.entries(summary.categoryCounts)
      .filter(([cat]) => cat !== 'Normal Traffic')
      .map(([name, count]) => ({
        name: name.replace(' Attack', '').replace('Suspicious ', ''),
        count
      }))
      .filter(item => item.count > 0);
  }, [summary]);

  // Protocol breakdown
  const protocolData = React.useMemo(() => {
    return Object.entries(summary.protocolCounts).map(([proto, count]) => ({
      name: proto,
      value: count,
      color: proto === 'TCP' ? '#00E5FF' : proto === 'UDP' ? '#38BDF8' : proto === 'HTTPS' ? '#8B5CF6' : proto === 'SSH' ? '#F59E0B' : '#A78BFA'
    }));
  }, [summary]);

  const normalPct = summary.totalRecords > 0 ? (summary.normalRecords / summary.totalRecords) * 100 : 100;
  const suspiciousPct = summary.totalRecords > 0 ? (summary.anomalousRecords / summary.totalRecords) * 100 : 0;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* 1. HERO SECTION: Futuristic Cyber Intelligence Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#0B132B]/95 via-[#0D1A38]/90 to-[#0A1024]/95 border border-cyan-500/20 backdrop-blur-2xl shadow-2xl p-6 md:p-8 overflow-hidden">
        {/* Ambient atmospheric lighting */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono shadow-[0_0_12px_rgba(0,229,255,0.25)]">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00E5FF]"></span>
                <span className="font-semibold tracking-wider uppercase">DEFENSE SHIELD ENGAGED</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-300 text-xs font-mono">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Last Telemetry Sync: {new Date(summary.analyzedAt).toLocaleTimeString()}</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-heading">
              CYBER THREAT INTELLIGENCE CENTER
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl font-light leading-relaxed">
              Real-time statistical anomaly surveillance powered by parametric Z-scores, non-parametric IQR fences, rolling volatility envelopes, and tree-based Isolation Forest machine learning.
            </p>
          </div>

          {/* Quick Dataset Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-[#070D1F]/90 border border-cyan-500/25 p-2 rounded-2xl shadow-inner">
            <span className="text-xs font-mono text-cyan-400 pl-2">Capture Preset:</span>
            <div className="flex items-center gap-1 text-xs font-mono">
              <button
                onClick={() => loadSample('benchmark')}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/30 font-semibold transition-all shadow-[0_0_10px_rgba(0,229,255,0.2)]"
              >
                Multi-Vector
              </button>
              <button
                onClick={() => loadSample('clean')}
                className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all font-medium"
              >
                Clean Baseline
              </button>
              <button
                onClick={() => loadSample('flooding')}
                className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-rose-300 hover:bg-rose-500/10 transition-all font-medium"
              >
                Flooding Surge
              </button>
            </div>
          </div>
        </div>

        {/* Status ticker strip */}
        <div className="relative z-10 pt-5 mt-6 border-t border-cyan-500/15 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-cyan-300">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Inspection Mode: <strong className="text-white">Continuous Statistical Pipeline</strong></span>
            </span>
            <span className="hidden sm:inline-block">Target Dataset: <strong className="text-slate-200">{summary.datasetName}</strong></span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-300">Flows Processed: <strong className="text-cyan-400 font-bold">{summary.totalRecords.toLocaleString()}</strong></span>
            <button
              onClick={() => setActivePage('monitoring')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold group"
            >
              <span>Launch Live Monitor</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATISTICS CARDS: 5 Redesigned Metric Cards with Mini Trends & Glowing Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Card 1: Packets Analyzed */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0C152E]/90 to-[#080E20]/90 border border-cyan-500/25 shadow-lg transition-all hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(0,229,255,0.2)] group relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">Packets Analyzed</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.2)] group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
            {summary.records.reduce((acc, r) => acc + r.packetCount, 0).toLocaleString()}
          </div>
          <div className="h-9 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklinePackets}>
                <Area type="monotone" dataKey="v" stroke="#00E5FF" strokeWidth={2} fill="#00E5FF" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 font-light">
            In {summary.totalRecords.toLocaleString()} verified flows
          </div>
        </div>

        {/* Card 2: Normal Traffic Percentage */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0C1E26]/90 to-[#07131A]/90 border border-emerald-500/25 shadow-lg transition-all hover:border-emerald-400/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] group relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-300">Normal Baseline</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)] group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono tabular-nums tracking-tight">
            {normalPct.toFixed(1)}%
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-4 overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#10B981]"
              style={{ width: `${normalPct}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 font-light">
            {summary.normalRecords.toLocaleString()} flows within Gaussian bounds
          </div>
        </div>

        {/* Card 3: Detected Anomalies */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1C1826]/90 to-[#120E1C]/90 border border-amber-500/25 shadow-lg transition-all hover:border-amber-400/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] group relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-300">Detected Anomalies</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)] group-hover:scale-110 transition-transform">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-400 font-mono tabular-nums tracking-tight">
            {summary.anomalousRecords}
          </div>
          <div className="h-9 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sparklineAnomalies}>
                <Bar dataKey="v" fill="#F59E0B" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 font-light">
            {suspiciousPct.toFixed(1)}% outlier rate
          </div>
        </div>

        {/* Card 4: Critical Threats */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#240F1E]/90 to-[#170913]/90 border border-rose-500/30 shadow-lg transition-all hover:border-rose-400/60 hover:shadow-[0_0_20px_rgba(244,63,94,0.25)] group relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-rose-300">Critical Threats</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)] group-hover:scale-110 transition-transform">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-400 font-mono tabular-nums tracking-tight">
            {summary.criticalCount}
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#FF3366] animate-ping"></span>
            <span className="text-xs font-mono text-rose-300 font-semibold">URGENT SOC TRIAGE</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 font-light">
            Multi-variate critical breaches
          </div>
        </div>

        {/* Card 5: Network Risk Score */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1A112C]/90 to-[#10091E]/90 border border-purple-500/25 shadow-lg transition-all hover:border-purple-400/50 hover:shadow-[0_0_20px_rgba(149,101,255,0.2)] group relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-purple-300">Network Risk Rating</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_10px_rgba(149,101,255,0.2)] group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-extrabold font-mono tabular-nums tracking-tight ${summary.networkRiskScore > 60 ? 'text-rose-400' : summary.networkRiskScore > 30 ? 'text-amber-400' : 'text-cyan-400'}`}>
              {summary.networkRiskScore}
            </span>
            <span className="text-xs text-slate-400 font-mono">/100</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-4 overflow-hidden border border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-500 ${summary.networkRiskScore > 60 ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_8px_#FF3366]' : 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_8px_#00E5FF]'}`}
              style={{ width: `${summary.networkRiskScore}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 font-light">
            {summary.networkRiskScore > 60 ? 'Active Cyber Incident State' : summary.networkRiskScore > 30 ? 'Elevated Monitoring Level' : 'Nominal Operational State'}
          </div>
        </div>
      </div>

      {/* 3. NETWORK INTELLIGENCE VISUALIZATION (Core Interactive Topology View) */}
      <NetworkTopologyVisualization
        records={summary.records}
        anomalies={summary.anomalies}
        datasetName={summary.datasetName}
      />

      {/* 4. ANALYTICS SECTION: Multi-Dimensional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Traffic Volume Over Time (Glowing Area Chart) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-gradient-to-br from-[#0B132B]/95 via-[#0D1836]/90 to-[#070D1F]/95 border border-cyan-500/20 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white font-heading flex items-center gap-2">
                <span>Network Throughput & Volumetric Dynamics Over Time</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00E5FF]"></span>
              </h2>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                Dynamic flow throughput with moving average volatility fences
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 px-3 py-1 rounded-xl bg-[#070D1F] border border-cyan-500/30">
              Packet Rate / Flow
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="cyberAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.45} />
                    <stop offset="60%" stopColor="#387BFF" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#16223B" />
                <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#091124', borderColor: '#00E5FF50', borderRadius: '12px', fontSize: '12px', color: '#F1F5F9', boxShadow: '0 0 15px rgba(0,229,255,0.2)' }}
                  labelStyle={{ color: '#00E5FF', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="packetCount" stroke="#00E5FF" strokeWidth={2.5} fillOpacity={1} fill="url(#cyberAreaGrad)" name="Packet Volume" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Health Integrity Donut Chart */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0B132B]/95 via-[#0D1836]/90 to-[#070D1F]/95 border border-cyan-500/20 backdrop-blur-xl shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white font-heading">Traffic Health Integrity</h2>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Gaussian baseline compliance vs anomalous breach
            </p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="#070D1F"
                  strokeWidth={3}
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#091124', borderColor: '#00E5FF50', borderRadius: '12px', fontSize: '12px', color: '#F1F5F9' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-slate-800 text-xs font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00E5FF]"></span>
                <span className="text-slate-300 font-sans">Baseline Flows</span>
              </div>
              <span className="text-cyan-300 font-bold tabular-nums">{summary.normalRecords} ({normalPct.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#FF3366]"></span>
                <span className="text-slate-300 font-sans">Statistical Outliers</span>
              </div>
              <span className="text-rose-400 font-bold tabular-nums">{summary.anomalousRecords} ({suspiciousPct.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Analytics: Attack Category Distribution & Protocol Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attack Category Distribution Bar Chart */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0B132B]/95 via-[#0D1836]/90 to-[#070D1F]/95 border border-cyan-500/20 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white font-heading">Threat Category Distribution</h2>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                Multi-attribute heuristic cyberattack pattern predictions
              </p>
            </div>
            <button
              onClick={() => setActivePage('detection')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
            >
              <span>View Full Matrix</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-60 w-full">
            {attackCategoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-light">
                No attack categories active. Traffic strictly matches normal baseline.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attackCategoryData} layout="vertical" margin={{ left: 15, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#16223B" />
                  <XAxis type="number" stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis type="category" dataKey="name" stroke="#475569" width={115} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#091124', borderColor: '#00E5FF50', borderRadius: '12px', fontSize: '12px', color: '#F1F5F9' }}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[0, 6, 6, 0]} name="Flagged Flows" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Protocol Distribution & Bandwidth Breakdown */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0B132B]/95 via-[#0D1836]/90 to-[#070D1F]/95 border border-cyan-500/20 backdrop-blur-xl shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white font-heading">Protocol Volume Distribution</h2>
              <span className="text-xs font-mono text-cyan-400">Layer 4 Breakdown</span>
            </div>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Traffic distribution across TCP, UDP, ICMP, HTTPS, and SSH conduits
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 py-2">
            {protocolData.map(proto => (
              <div key={proto.name} className="p-3.5 bg-[#080E20] rounded-2xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-md" style={{ backgroundColor: proto.color }}></span>
                  <span className="text-xs font-semibold text-white font-mono">{proto.name}</span>
                </div>
                <span className="text-xs font-bold font-mono text-cyan-300 tabular-nums">
                  {proto.value} <span className="text-[10px] text-slate-400 font-normal">flows</span>
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between font-mono">
            <span>Overall Packet Volume:</span>
            <span className="text-white font-bold">{summary.records.reduce((s, r) => s + r.packetCount, 0).toLocaleString()} pkts</span>
          </div>
        </div>
      </div>

      {/* 5. THREAT INTELLIGENCE PANEL: Dedicated High Priority Suspicious Events */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#0B132B]/95 via-[#0D1836]/90 to-[#070D1F]/95 border border-cyan-500/20 backdrop-blur-xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#FF3366] animate-ping"></span>
              <h2 className="text-lg font-bold text-white font-heading tracking-tight">
                Threat Intelligence Surveillance Feed
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Prioritized high-severity outliers identified by multi-algorithm voting
            </p>
          </div>

          <button
            onClick={() => setActivePage('detection')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-cyan-300 bg-[#070D1F] hover:bg-cyan-950/40 border border-cyan-500/30 rounded-xl transition-all shadow-[0_0_12px_rgba(0,229,255,0.15)] font-mono self-start sm:self-auto"
          >
            <span>Open Complete Threat Matrix ({summary.anomalies.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Threat Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.anomalies.slice(0, 6).map(anom => (
            <div
              key={anom.id}
              className="p-4 rounded-2xl bg-[#080E20]/90 border border-slate-800/80 hover:border-cyan-500/40 transition-all shadow-md hover:shadow-[0_0_15px_rgba(0,229,255,0.15)] space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md border tracking-wider ${
                    anom.severity === 'CRITICAL'
                      ? 'text-rose-300 bg-rose-950/80 border-rose-500/50 shadow-[0_0_8px_rgba(255,51,102,0.3)]'
                      : anom.severity === 'HIGH'
                      ? 'text-amber-300 bg-amber-950/80 border-amber-500/50'
                      : 'text-cyan-300 bg-cyan-950/80 border-cyan-500/50'
                  }`}
                >
                  {anom.severity} · {anom.compositeScore}/100
                </span>

                <span className="text-[10px] font-mono text-slate-400">
                  {anom.packetRecord.timestamp.split('T')[1]?.substring(0, 8)}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white font-heading group-hover:text-cyan-300 transition-colors">
                  {anom.predictedAttack}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-light" title={anom.primaryReasons[0]}>
                  {anom.primaryReasons[0]}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block font-sans">Source Endpoint</span>
                  <span className="text-white font-semibold truncate block">{anom.packetRecord.sourceIp}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-sans">Target Endpoint</span>
                  <span className="text-cyan-300 font-semibold truncate block">{anom.packetRecord.destIp}:{anom.packetRecord.destPort}</span>
                </div>
              </div>

              <button
                onClick={() => selectAlertForInvestigation(anom)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#0B1530] hover:bg-cyan-950/60 border border-cyan-500/25 text-cyan-300 text-xs font-semibold transition-all"
              >
                <SearchCode className="w-3.5 h-3.5" />
                <span>Forensic Triage</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 6. STATISTICAL INSIGHTS: Comprehensive Comparison Cards for All 6 Methods */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#0B132B]/95 via-[#0D1836]/90 to-[#070D1F]/95 border border-cyan-500/20 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white font-heading">
              Statistical Evidence & Methodology Indicators
            </h2>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Mathematical invariants evaluated across active network packet distributions
            </p>
          </div>

          <button
            onClick={() => setActivePage('statistical')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono font-semibold"
          >
            <span>Launch Deep Engine Analyzer</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Method A: Z-Score */}
          <div className="p-5 rounded-2xl bg-[#080E20]/90 border border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-heading">A. Z-Score Parametric Model</span>
              <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                Z = (X - μ) / σ
              </span>
            </div>
            <p className="text-xs text-slate-300 font-light leading-relaxed">
              Calculates standardized deviations from the empirical distribution mean. Flags flows exceeding ±2.5σ.
            </p>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Flagged Breaches:</span>
              <span className="text-cyan-300 font-bold">
                {summary.anomalies.filter(a => a.metrics.zScoreFlagged).length} flows
              </span>
            </div>
          </div>

          {/* Method B: IQR */}
          <div className="p-5 rounded-2xl bg-[#080E20]/90 border border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-heading">B. Interquartile Range (IQR)</span>
              <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                Q3 + 1.5×IQR
              </span>
            </div>
            <p className="text-xs text-slate-300 font-light leading-relaxed">
              Non-parametric Tukey fences unaffected by skewed distributions. Identifies heavy-tailed exfiltration spikes.
            </p>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Upper Fence Outliers:</span>
              <span className="text-cyan-300 font-bold">
                {summary.anomalies.filter(a => a.metrics.iqrFlagged).length} flows
              </span>
            </div>
          </div>

          {/* Method C: Moving Average */}
          <div className="p-5 rounded-2xl bg-[#080E20]/90 border border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-heading">C. Moving Average (SMA)</span>
              <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                SMA ± 2σ Band
              </span>
            </div>
            <p className="text-xs text-slate-300 font-light leading-relaxed">
              Sliding 10-period temporal window dynamically capturing sudden volumetric step-ups and abrupt burst attacks.
            </p>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Surges Detected:</span>
              <span className="text-cyan-300 font-bold">
                {summary.anomalies.filter(a => a.metrics.movingAvgFlagged).length} flows
              </span>
            </div>
          </div>

          {/* Method D: Standard Deviation */}
          <div className="p-5 rounded-2xl bg-[#080E20]/90 border border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-heading">D. Variance & Dispersion</span>
              <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                σ Variance Analysis
              </span>
            </div>
            <p className="text-xs text-slate-300 font-light leading-relaxed">
              Tracks multi-feature coefficient of variation across packet counts, byte transfers, and connection frequency.
            </p>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Packet σ Spread:</span>
              <span className="text-cyan-300 font-bold">
                {(summary.featureBaselines.packetCount?.stdDev || 420).toFixed(1)}
              </span>
            </div>
          </div>

          {/* Method E: Isolation Forest */}
          <div className="p-5 rounded-2xl bg-[#080E20]/90 border border-purple-500/25 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-heading">E. Isolation Forest ML</span>
              <span className="text-[10px] font-mono text-purple-300 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30">
                iTree Ensemble
              </span>
            </div>
            <p className="text-xs text-slate-300 font-light leading-relaxed">
              Unsupervised tree-based partitioning that isolates rare multi-dimensional anomalies in shallow branch depths.
            </p>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">ML Isolated Nodes:</span>
              <span className="text-purple-300 font-bold">
                {summary.anomalies.filter(a => a.metrics.isolationForestFlagged).length} flows
              </span>
            </div>
          </div>

          {/* Method F: Shannon Entropy */}
          <div className="p-5 rounded-2xl bg-[#080E20]/90 border border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-heading">F. Shannon Entropy</span>
              <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                H(X) = -Σ P log₂ P
              </span>
            </div>
            <p className="text-xs text-slate-300 font-light leading-relaxed">
              Quantifies IP and port distribution dispersion. Entropy collapse indicates target concentration in DDoS/Flooding.
            </p>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Target IP Entropy:</span>
              <span className="text-cyan-300 font-bold">
                {(summary.anomalies[0]?.metrics.entropyValue || 2.4).toFixed(2)} bits
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
