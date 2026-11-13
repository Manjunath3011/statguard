import React, { useState } from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  ArrowDownCircle,
  ArrowUpCircle,
  HardDrive,
  Zap,
  Radio,
  Sliders,
  Terminal,
  Wifi,
  Radar
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NetworkMonitoringPage: React.FC = () => {
  const {
    isMonitoringActive,
    setIsMonitoringActive,
    monitoringSpeed,
    setMonitoringSpeed,
    livePackets,
    liveIncomingPps,
    liveOutgoingPps,
    liveBytesSec,
    liveRecentThreats,
    injectLiveAttack,
    clearLiveStream
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'anomalies'>('all');

  const filteredPackets = activeTab === 'all'
    ? livePackets
    : livePackets.filter(p => p.isAnomaly);

  return (
    <div className="p-8 space-y-7 max-w-7xl mx-auto cyber-grid">
      {/* Page Header: Network Operations Center (NOC) */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#101827]/90 via-[#151E2D]/80 to-[#101827]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
              NETWORK OPERATIONS CENTER (NOC)
            </h1>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,229,255,0.25)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              REAL-TIME TELEMETRY PROBE
            </span>
          </div>
          <p className="text-xs text-slate-300 font-light mt-1">
            Simulated flow capture probe ingesting synthetic high-frequency traffic into live statistical deviation analyzers.
          </p>
        </div>

        {/* Stream Controls */}
        <div className="flex items-center gap-3">
          {/* Speed multiplier */}
          <div className="flex items-center bg-[#080B12] border border-cyan-500/30 rounded-xl p-1 text-xs">
            <button
              onClick={() => setMonitoringSpeed(1)}
              className={`px-3 py-1 rounded-lg transition-all font-mono text-[11px] ${
                monitoringSpeed === 1 ? 'bg-cyan-500 text-[#080B12] font-bold shadow-[0_0_10px_#00E5FF]' : 'text-slate-400 hover:text-white'
              }`}
            >
              1x
            </button>
            <button
              onClick={() => setMonitoringSpeed(2)}
              className={`px-3 py-1 rounded-lg transition-all font-mono text-[11px] ${
                monitoringSpeed === 2 ? 'bg-cyan-500 text-[#080B12] font-bold shadow-[0_0_10px_#00E5FF]' : 'text-slate-400 hover:text-white'
              }`}
            >
              2x
            </button>
            <button
              onClick={() => setMonitoringSpeed(4)}
              className={`px-3 py-1 rounded-lg transition-all font-mono text-[11px] ${
                monitoringSpeed === 4 ? 'bg-cyan-500 text-[#080B12] font-bold shadow-[0_0_10px_#00E5FF]' : 'text-slate-400 hover:text-white'
              }`}
            >
              4x
            </button>
          </div>

          <button
            onClick={() => setIsMonitoringActive(!isMonitoringActive)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
              isMonitoringActive
                ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40 hover:bg-amber-900/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-emerald-500 text-[#080B12] hover:bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
            }`}
          >
            {isMonitoringActive ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>PAUSE STREAM</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>RESUME STREAM</span>
              </>
            )}
          </button>

          <button
            onClick={clearLiveStream}
            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl border border-cyan-500/20 transition-all"
            title="Clear Stream History"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Stream Telemetry Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Incoming PPS */}
        <div className="p-5 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-md shadow-lg flex items-center justify-between transition-all hover:border-cyan-400/50">
          <div>
            <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-widest block">Ingress Rate</span>
            <span className="text-3xl font-bold font-mono text-white tabular-nums tracking-tight mt-1 block">
              {liveIncomingPps.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-light">packets / second</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.2)]">
            <ArrowDownCircle className="w-5 h-5 animate-bounce" />
          </div>
        </div>

        {/* Outgoing PPS */}
        <div className="p-5 rounded-2xl bg-[#151E2D]/90 border border-blue-500/20 backdrop-blur-md shadow-lg flex items-center justify-between transition-all hover:border-blue-400/50">
          <div>
            <span className="text-[10px] font-mono text-blue-300 uppercase tracking-widest block">Egress Volume</span>
            <span className="text-3xl font-bold font-mono text-white tabular-nums tracking-tight mt-1 block">
              {liveOutgoingPps.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-light">packets / second</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_12px_rgba(56,123,255,0.2)]">
            <ArrowUpCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Traffic Volume (Bytes/sec) */}
        <div className="p-5 rounded-2xl bg-[#151E2D]/90 border border-purple-500/20 backdrop-blur-md shadow-lg flex items-center justify-between transition-all hover:border-purple-400/50">
          <div>
            <span className="text-[10px] font-mono text-purple-300 uppercase tracking-widest block">Bandwidth Velocity</span>
            <span className="text-3xl font-bold font-mono text-white tabular-nums tracking-tight mt-1 block">
              {(liveBytesSec / (1024 * 1024)).toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-light">Megabytes / sec</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_12px_rgba(149,101,255,0.2)]">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>

        {/* Live Stream Triggers */}
        <div className="p-5 rounded-2xl bg-[#151E2D]/90 border border-rose-500/20 backdrop-blur-md shadow-lg flex items-center justify-between transition-all hover:border-rose-400/50">
          <div>
            <span className="text-[10px] font-mono text-rose-300 uppercase tracking-widest block">Active Threat Triggers</span>
            <span className="text-3xl font-bold font-mono text-rose-400 tabular-nums tracking-tight mt-1 block">
              {liveRecentThreats.length}
            </span>
            <span className="text-xs text-slate-400 font-light">alarms logged</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)]">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Cyber Attack Pattern Injection Testing Console */}
      <div className="p-6 rounded-2xl bg-[#101827]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-white">
              Tactical Cyberattack Injection Testing Harness
            </h2>
          </div>
          <span className="text-[11px] text-cyan-400/80 font-mono">
            Injects real-time synthetic traffic surges into online statistical estimators
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => injectLiveAttack('ddos')}
            className="p-3.5 bg-[#151E2D] hover:bg-[#1A263A] hover:border-rose-500/50 border border-slate-800 rounded-xl text-left transition-all group shadow-sm hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white group-hover:text-rose-400 block font-heading">
                DDoS Volumetric Surge
              </span>
              <span className="w-2 h-2 rounded-full bg-rose-400 group-hover:animate-ping"></span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block mt-1">
              +4,000 pkts/s on Port 80
            </span>
          </button>

          <button
            onClick={() => injectLiveAttack('portscan')}
            className="p-3.5 bg-[#151E2D] hover:bg-[#1A263A] hover:border-amber-500/50 border border-slate-800 rounded-xl text-left transition-all group shadow-sm hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white group-hover:text-amber-400 block font-heading">
                Port Scanning Sweep
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-400 group-hover:animate-ping"></span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block mt-1">
              Rapid multi-port cycle
            </span>
          </button>

          <button
            onClick={() => injectLiveAttack('bruteforce')}
            className="p-3.5 bg-[#151E2D] hover:bg-[#1A263A] hover:border-orange-500/50 border border-slate-800 rounded-xl text-left transition-all group shadow-sm hover:shadow-[0_0_15px_rgba(249,115,22,0.2)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white group-hover:text-orange-400 block font-heading">
                SSH Brute Force
              </span>
              <span className="w-2 h-2 rounded-full bg-orange-400 group-hover:animate-ping"></span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block mt-1">
              Port 22 credential flood
            </span>
          </button>

          <button
            onClick={() => injectLiveAttack('exfiltration')}
            className="p-3.5 bg-[#151E2D] hover:bg-[#1A263A] hover:border-purple-500/50 border border-slate-800 rounded-xl text-left transition-all group shadow-sm hover:shadow-[0_0_15px_rgba(149,101,255,0.2)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white group-hover:text-purple-400 block font-heading">
                Data Exfiltration
              </span>
              <span className="w-2 h-2 rounded-full bg-purple-400 group-hover:animate-ping"></span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block mt-1">
              20+ MB byte anomaly
            </span>
          </button>
        </div>
      </div>

      {/* Live Stream Table */}
      <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white font-heading">Live Telemetry Event Flow</h2>
            <div className="flex items-center bg-[#080B12] border border-cyan-500/25 rounded-lg p-0.5 text-xs font-mono">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Packets ({livePackets.length})
              </button>
              <button
                onClick={() => setActiveTab('anomalies')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'anomalies' ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                Flagged ({liveRecentThreats.length})
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#00E5FF]"></span>
            <span>Online Stream Pipe: <strong className="text-cyan-300">Ring Buffer Ingest</strong></span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[440px]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800 bg-[#0B0F19] sticky top-0 z-10">
              <tr>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Source Endpoint</th>
                <th className="py-3 px-3">Destination IP : Port</th>
                <th className="py-3 px-3">Proto</th>
                <th className="py-3 px-3 text-right">Packets</th>
                <th className="py-3 px-3 text-right">Bandwidth</th>
                <th className="py-3 px-3 text-right">Score</th>
                <th className="py-3 px-3 text-center">Threat Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredPackets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                    Awaiting streaming events from network prober...
                  </td>
                </tr>
              ) : (
                filteredPackets.map(pkt => (
                  <tr
                    key={pkt.id}
                    className={`transition-colors ${
                      pkt.isAnomaly
                        ? 'bg-rose-950/20 hover:bg-rose-950/30'
                        : 'hover:bg-cyan-500/5'
                    }`}
                  >
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{pkt.timestamp}</td>
                    <td className="py-2.5 px-3 font-semibold text-white font-mono">{pkt.sourceIp}</td>
                    <td className="py-2.5 px-3 text-cyan-300 font-mono">
                      {pkt.destIp}:{pkt.destPort}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{pkt.protocol}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-white font-mono">
                      {pkt.packetCount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-300 font-mono">
                      {pkt.bytes > 1024 * 1024 ? `${(pkt.bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(pkt.bytes / 1024)} KB`}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold font-mono">
                      <span className={pkt.score > 60 ? 'text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.4)]' : 'text-slate-300'}>
                        {pkt.score}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {pkt.isAnomaly ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md text-rose-300 bg-rose-950/80 border border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.25)]">
                          {pkt.attackType || 'ANOMALY DETECTED'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                          NORMAL
                        </span>
                      )}
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
