import React, { useState, useEffect } from 'react';
import { NetworkPacketRecord, AnomalyDetectionResult } from '../../types/network';
import { Shield, ShieldAlert, Activity, Wifi, Server, Laptop, AlertTriangle, Eye, RefreshCw } from 'lucide-react';

interface Node {
  id: string;
  ip: string;
  label: string;
  type: 'core' | 'internal' | 'client' | 'external' | 'attacker';
  x: number;
  y: number;
  isAnomalous: boolean;
  attackCategory?: string;
  packetCount: number;
}

interface Link {
  id: string;
  source: string;
  target: string;
  protocol: string;
  isAnomalous: boolean;
  score: number;
  packets: number;
}

interface NetworkTopologyProps {
  records: NetworkPacketRecord[];
  anomalies: AnomalyDetectionResult[];
  datasetName: string;
}

export const NetworkTopologyVisualization: React.FC<NetworkTopologyProps> = ({
  records,
  anomalies,
  datasetName
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'anomalous' | 'internal'>('all');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredLink, setHoveredLink] = useState<Link | null>(null);

  // Generate nodes and links from actual dataset records
  const { nodes, links } = React.useMemo(() => {
    const nodeMap = new Map<string, Node>();
    const linkList: Link[] = [];

    // Central Core Defense Hub
    nodeMap.set('core', {
      id: 'core',
      ip: '10.0.0.1',
      label: 'STATGUARD Core Gateway',
      type: 'core',
      x: 450,
      y: 200,
      isAnomalous: false,
      packetCount: records.reduce((sum, r) => sum + r.packetCount, 0)
    });

    // Internal servers (fixed coordinates around center-right)
    const serverPositions: Record<string, { x: number; y: number; label: string }> = {
      '172.16.0.10': { x: 650, y: 130, label: 'Web Tier Gateway' },
      '172.16.0.15': { x: 680, y: 230, label: 'Database Cluster' },
      '172.16.0.22': { x: 640, y: 320, label: 'Internal API Host' },
      '8.8.8.8': { x: 550, y: 70, label: 'DNS Resolver' }
    };

    // Client endpoints (center-left)
    const clientPositions: Record<string, { x: number; y: number; label: string }> = {
      '192.168.1.45': { x: 260, y: 100, label: 'Internal Workstation Alpha' },
      '192.168.1.72': { x: 230, y: 180, label: 'Internal Workstation Beta' },
      '192.168.1.104': { x: 240, y: 260, label: 'SecOps Terminal' },
      '192.168.1.155': { x: 270, y: 330, label: 'Engineering Laptop' }
    };

    // Threat nodes (far-left and far-right)
    const attackerPositions: Record<string, { x: number; y: number; label: string }> = {
      '185.220.101.5': { x: 80, y: 90, label: 'External Botnet Node (Tor)' },
      '45.154.255.89': { x: 80, y: 200, label: 'Brute Force Threat Host' },
      '103.145.13.2': { x: 80, y: 310, label: 'Port Scanner Probe' },
      '194.26.29.112': { x: 820, y: 250, label: 'Exfiltration C2 Sinkhole' }
    };

    // Register primary servers
    Object.entries(serverPositions).forEach(([ip, pos]) => {
      nodeMap.set(ip, {
        id: ip,
        ip,
        label: pos.label,
        type: 'internal',
        x: pos.x,
        y: pos.y,
        isAnomalous: false,
        packetCount: 0
      });
    });

    // Register clients
    Object.entries(clientPositions).forEach(([ip, pos]) => {
      nodeMap.set(ip, {
        id: ip,
        ip,
        label: pos.label,
        type: 'client',
        x: pos.x,
        y: pos.y,
        isAnomalous: false,
        packetCount: 0
      });
    });

    // Map anomalies and record threats
    anomalies.forEach((anom, idx) => {
      const srcIp = anom.packetRecord.sourceIp;
      const destIp = anom.packetRecord.destIp;

      // Add attacker node if not present
      if (!nodeMap.has(srcIp)) {
        const fallbackPos = attackerPositions[srcIp] || {
          x: 100 + (idx % 3) * 60,
          y: 70 + (idx * 45) % 280,
          label: `Suspect Host ${srcIp}`
        };
        nodeMap.set(srcIp, {
          id: srcIp,
          ip: srcIp,
          label: attackerPositions[srcIp]?.label || `Suspect Host ${srcIp}`,
          type: 'attacker',
          x: fallbackPos.x,
          y: fallbackPos.y,
          isAnomalous: true,
          attackCategory: anom.predictedAttack,
          packetCount: anom.packetRecord.packetCount
        });
      } else {
        const existing = nodeMap.get(srcIp)!;
        existing.isAnomalous = true;
        existing.attackCategory = anom.predictedAttack;
        existing.packetCount += anom.packetRecord.packetCount;
      }

      // Mark destination node as targeted
      if (nodeMap.has(destIp)) {
        const destNode = nodeMap.get(destIp)!;
        destNode.isAnomalous = true;
      } else if (attackerPositions[destIp]) {
        nodeMap.set(destIp, {
          id: destIp,
          ip: destIp,
          label: attackerPositions[destIp].label,
          type: 'attacker',
          x: attackerPositions[destIp].x,
          y: attackerPositions[destIp].y,
          isAnomalous: true,
          attackCategory: anom.predictedAttack,
          packetCount: anom.packetRecord.packetCount
        });
      }

      // Link between source and dest
      linkList.push({
        id: `anom-link-${idx}`,
        source: srcIp,
        target: destIp,
        protocol: anom.packetRecord.protocol,
        isAnomalous: true,
        score: anom.compositeScore,
        packets: anom.packetRecord.packetCount
      });
    });

    // Add baseline flows for context
    records.slice(0, 18).forEach((r, idx) => {
      if (nodeMap.has(r.sourceIp) && nodeMap.has(r.destIp)) {
        linkList.push({
          id: `norm-link-${idx}`,
          source: r.sourceIp,
          target: r.destIp,
          protocol: r.protocol,
          isAnomalous: false,
          score: 15,
          packets: r.packetCount
        });
      }
    });

    return { nodes: Array.from(nodeMap.values()), links: linkList };
  }, [records, anomalies]);

  const filteredLinks = links.filter(l => {
    if (filterMode === 'anomalous') return l.isAnomalous;
    if (filterMode === 'internal') return !l.isAnomalous;
    return true;
  });

  return (
    <div className="relative rounded-3xl bg-gradient-to-br from-[#0B132B]/95 via-[#0D1836]/90 to-[#070D1F]/95 border border-cyan-500/20 backdrop-blur-2xl shadow-2xl p-6 overflow-hidden">
      {/* Ambient background glow blooms */}
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none"></div>

      {/* Top Header Controls */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cyan-500/15">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#00E5FF] animate-pulse"></span>
            <h2 className="text-lg font-bold text-white font-heading tracking-tight">
              Live Network Intelligence Topology
            </h2>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
              Interactive Graph View
            </span>
          </div>
          <p className="text-xs text-slate-300 font-light mt-0.5">
            Visualizes host telemetry, data transfer conduits, and flagged attack vectors across nodes.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#070D1F] border border-cyan-500/30 rounded-xl p-1 text-xs font-mono">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterMode === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-[0_0_10px_rgba(0,229,255,0.25)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Vectors ({links.length})
            </button>
            <button
              onClick={() => setFilterMode('anomalous')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterMode === 'anomalous'
                  ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Anomalies Only ({anomalies.length})
            </button>
            <button
              onClick={() => setFilterMode('internal')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterMode === 'internal'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Baseline Only
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Topology */}
      <div className="relative w-full h-[400px] overflow-hidden my-2 select-none">
        <svg className="w-full h-full" viewBox="0 0 900 400">
          <defs>
            {/* Linear gradients for links */}
            <linearGradient id="linkCyan" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#387BFF" stopOpacity="0.4" />
            </linearGradient>

            <linearGradient id="linkRed" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF3366" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FF6B6B" stopOpacity="0.5" />
            </linearGradient>

            {/* Glowing filters */}
            <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Render Connections / Links */}
          {filteredLinks.map(link => {
            const src = nodes.find(n => n.id === link.source);
            const dst = nodes.find(n => n.id === link.target);
            if (!src || !dst) return null;

            // Curved quadratic bezier arc
            const dx = dst.x - src.x;
            const dy = dst.y - src.y;
            const cx = (src.x + dst.x) / 2;
            const cy = (src.y + dst.y) / 2 - (link.isAnomalous ? 30 : -15);
            const pathData = `M ${src.x} ${src.y} Q ${cx} ${cy} ${dst.x} ${dst.y}`;

            return (
              <g key={link.id} onMouseEnter={() => setHoveredLink(link)} onMouseLeave={() => setHoveredLink(null)}>
                {/* Background thicker hover path */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="14"
                  className="cursor-pointer"
                />

                {/* Visible curved connector line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={link.isAnomalous ? 'url(#linkRed)' : 'url(#linkCyan)'}
                  strokeWidth={link.isAnomalous ? 2.5 : 1.5}
                  strokeDasharray={link.isAnomalous ? '6 3' : 'none'}
                  filter={link.isAnomalous ? 'url(#glowRed)' : 'none'}
                  className="transition-all duration-300"
                />

                {/* Animated Packet Pulse Dot */}
                <circle r={link.isAnomalous ? 3.5 : 2.5} fill={link.isAnomalous ? '#FF3366' : '#00E5FF'}>
                  <animateMotion
                    path={pathData}
                    dur={link.isAnomalous ? '1.8s' : '3.2s'}
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Alert Tag on Anomalous Links */}
                {link.isAnomalous && (
                  <text
                    x={cx}
                    y={cy - 6}
                    fill="#FF6B6B"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                    className="font-bold drop-shadow-[0_0_6px_rgba(255,51,102,0.8)]"
                  >
                    ALERT #{link.score}
                  </text>
                )}
              </g>
            );
          })}

          {/* Render Nodes */}
          {nodes.map(node => {
            const isCore = node.type === 'core';
            const isAttacker = node.type === 'attacker';
            const isInternal = node.type === 'internal';

            let nodeFill = '#0B132B';
            let strokeColor = '#00E5FF';
            let radius = 18;

            if (isCore) {
              radius = 26;
              strokeColor = '#00E5FF';
              nodeFill = '#071836';
            } else if (isAttacker) {
              radius = 20;
              strokeColor = '#FF3366';
              nodeFill = '#2A0B17';
            } else if (isInternal) {
              radius = 18;
              strokeColor = node.isAnomalous ? '#F59E0B' : '#38BDF8';
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer group"
              >
                {/* Outer pulsing ring for suspicious nodes */}
                {node.isAnomalous && (
                  <circle
                    r={radius + 8}
                    fill="none"
                    stroke={isAttacker ? '#FF3366' : '#F59E0B'}
                    strokeWidth="1.5"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}

                {/* Outer halo */}
                <circle
                  r={radius + 4}
                  fill={strokeColor}
                  fillOpacity="0.12"
                  stroke={strokeColor}
                  strokeWidth="1"
                  strokeOpacity="0.4"
                />

                {/* Main node circle */}
                <circle
                  r={radius}
                  fill={nodeFill}
                  stroke={strokeColor}
                  strokeWidth="2"
                  filter={node.isAnomalous ? 'url(#glowRed)' : 'url(#glowCyan)'}
                  className="transition-transform duration-200 group-hover:scale-110"
                />

                {/* Node icon label inside */}
                <text
                  textAnchor="middle"
                  dy="4"
                  fill="#FFFFFF"
                  fontSize={isCore ? '11' : '9'}
                  fontFamily="JetBrains Mono"
                  className="pointer-events-none font-bold"
                >
                  {isCore ? 'HUB' : isAttacker ? 'ATTK' : node.ip.split('.').pop()}
                </text>

                {/* Node IP Sub-Label */}
                <text
                  y={radius + 14}
                  textAnchor="middle"
                  fill={node.isAnomalous ? '#FF8080' : '#E2E8F0'}
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                  className="pointer-events-none font-semibold"
                >
                  {node.ip}
                </text>

                {/* Node Descriptive Role */}
                <text
                  y={radius + 26}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="8.5"
                  fontFamily="Inter"
                  className="pointer-events-none font-light"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Node Inspector Hover Card */}
        {selectedNode && (
          <div className="absolute top-4 right-4 z-20 w-72 rounded-2xl bg-[#091124]/95 border border-cyan-500/40 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Node Inspector</span>
                <h4 className="text-sm font-bold text-white font-mono mt-0.5">{selectedNode.ip}</h4>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-sans">{selectedNode.label}</p>

            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Node Type:</span>
                <span className="text-cyan-300 uppercase font-semibold">{selectedNode.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Flow Volume:</span>
                <span className="text-white font-bold">{selectedNode.packetCount.toLocaleString()} pkts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Threat Status:</span>
                <span className={selectedNode.isAnomalous ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {selectedNode.isAnomalous ? selectedNode.attackCategory || 'Suspicious Outlier' : 'Nominal'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Hovered Link Tooltip */}
        {hoveredLink && (
          <div className="absolute bottom-4 left-4 z-20 rounded-xl bg-[#080E1E]/95 border border-cyan-500/30 px-3.5 py-2 shadow-xl backdrop-blur-md text-xs font-mono flex items-center gap-3">
            <span className="text-cyan-400 font-bold">{hoveredLink.source} → {hoveredLink.target}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">Proto: {hoveredLink.protocol}</span>
            <span className="text-slate-400">|</span>
            <span className={hoveredLink.isAnomalous ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
              {hoveredLink.isAnomalous ? `Threat Score: ${hoveredLink.score}/100` : 'Nominal Flow'}
            </span>
          </div>
        )}
      </div>

      {/* Legend Bottom Bar */}
      <div className="relative z-10 pt-3 border-t border-cyan-500/15 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#071836] border-2 border-cyan-400 shadow-[0_0_8px_#00E5FF]"></span>
            <span className="text-slate-300">Defense Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#0B132B] border-2 border-[#38BDF8]"></span>
            <span className="text-slate-300">Protected Hosts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#2A0B17] border-2 border-rose-500 shadow-[0_0_8px_#FF3366]"></span>
            <span className="text-rose-300">Flagged Threat Vector</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500"></span>
            <span className="text-slate-400">Baseline Packet Flow</span>
          </div>
        </div>

        <div className="text-slate-400 text-[11px] font-sans">
          Click on any node to inspect telemetry bounds and threat classifications.
        </div>
      </div>
    </div>
  );
};
