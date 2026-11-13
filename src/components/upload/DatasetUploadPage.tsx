import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Database,
  Cpu,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DatasetUploadPage: React.FC = () => {
  const { summary, loadSample, processUploadedFile } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setUploadError('Please select a valid CSV file (.csv format)');
      return;
    }

    setUploadError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text || text.trim().length === 0) {
          throw new Error('CSV file appears to be empty.');
        }
        processUploadedFile(text, file.name);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error reading CSV file';
        setUploadError(msg);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Error reading uploaded file.');
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const downloadSampleCsv = () => {
    const sampleHeaders = 'timestamp,source_ip,dest_ip,source_port,dest_port,protocol,packet_count,total_bytes,flow_duration,frequency';
    const sampleRows = [
      '2026-11-11T12:00:00Z,192.168.1.45,172.16.0.10,51234,80,TCP,18,9216,450,40.0',
      '2026-11-11T12:00:15Z,192.168.1.72,8.8.8.8,54321,53,UDP,2,140,25,80.0',
      '2026-11-11T12:00:30Z,185.220.101.5,172.16.0.10,41200,80,TCP,3450,220800,600,5750.0',
      '2026-11-11T12:00:45Z,103.145.13.2,172.16.0.15,60000,22,TCP,2,120,40,50.0',
      '2026-11-11T12:01:00Z,172.16.0.15,194.26.29.112,5432,8443,HTTPS,14000,20440000,12000,1166.6'
    ];
    const content = [sampleHeaders, ...sampleRows].join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'statguard-network-traffic-sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const prep = summary.preprocessing;

  return (
    <div className="p-8 space-y-7 max-w-7xl mx-auto cyber-grid">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#101827]/90 via-[#151E2D]/80 to-[#101827]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
            DATASET INGESTION & FEATURE NORMALIZATION
          </h1>
          <p className="text-xs text-cyan-300/80 font-light mt-1">
            Upload custom network flow CSV files or instantiate high-volume cyberattack benchmark captures.
          </p>
        </div>

        <button
          onClick={downloadSampleCsv}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-cyan-300 bg-[#151E2D] hover:bg-cyan-950/40 hover:border-cyan-400/50 border border-cyan-500/25 rounded-xl transition-all shadow-[0_0_12px_rgba(0,229,255,0.15)]"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Download Sample Template</span>
        </button>
      </div>

      {/* Upload Zone & Benchmark Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drag & Drop File Upload Area */}
        <div className="lg:col-span-2">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_25px_rgba(0,229,255,0.25)]'
                : 'border-cyan-500/25 hover:border-cyan-400/60 bg-[#151E2D]/80 hover:bg-[#151E2D] shadow-lg'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
              <UploadCloud className="w-7 h-7" />
            </div>

            <h2 className="text-base font-bold text-white font-heading">
              {isProcessing ? 'Normalizing Dataset & Extracting Features...' : 'Drop Network Traffic CSV or Browse Files'}
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1.5 font-light">
              Automatic feature detection for Wireshark, Zeek/Bro, NetFlow, CIC-IDS2017, and UNSW-NB15 schemas.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2 text-[10px] font-mono text-cyan-300">
              <span className="px-2.5 py-1 bg-[#101827] rounded-lg border border-cyan-500/20">Source / Dest IP</span>
              <span className="px-2.5 py-1 bg-[#101827] rounded-lg border border-cyan-500/20">Port</span>
              <span className="px-2.5 py-1 bg-[#101827] rounded-lg border border-cyan-500/20">Protocol</span>
              <span className="px-2.5 py-1 bg-[#101827] rounded-lg border border-cyan-500/20">Packet Count</span>
              <span className="px-2.5 py-1 bg-[#101827] rounded-lg border border-cyan-500/20">Byte Volume</span>
              <span className="px-2.5 py-1 bg-[#101827] rounded-lg border border-cyan-500/20">Flow Duration</span>
            </div>

            {uploadError && (
              <div className="mt-4 p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-300 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Curated Benchmark Presets */}
        <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white font-heading">Benchmark Cyber Captures</h2>
            </div>
            <p className="text-xs text-slate-400 font-light mt-1">
              Test detection algorithms instantly using vetted cyber threat datasets:
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => loadSample('benchmark')}
              className="w-full text-left p-3.5 rounded-xl bg-[#101827] hover:bg-[#1A263A] border border-cyan-500/20 hover:border-cyan-400/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-cyan-400 font-heading">
                  CIC-IDS2017 & UNSW-NB15 Blend
                </span>
                <span className="text-[10px] font-mono text-cyan-400">160 Flows</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-light">
                Multi-vector cyberattack capture: DDoS surge, SSH brute-force, port scanning, and DB exfiltration.
              </p>
            </button>

            <button
              onClick={() => loadSample('clean')}
              className="w-full text-left p-3.5 rounded-xl bg-[#101827] hover:bg-[#1A263A] border border-emerald-500/20 hover:border-emerald-400/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-emerald-400 font-heading">
                  Enterprise Baseline Clean Network
                </span>
                <span className="text-[10px] font-mono text-emerald-400">90 Flows</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-light">
                Corporate intra-office HTTP, HTTPS, DNS, and SQL query flows conforming to Gaussian normality.
              </p>
            </button>

            <button
              onClick={() => loadSample('flooding')}
              className="w-full text-left p-3.5 rounded-xl bg-[#101827] hover:bg-[#1A263A] border border-rose-500/20 hover:border-rose-400/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-rose-400 font-heading">
                  High-Volume Flooding Attack
                </span>
                <span className="text-[10px] font-mono text-rose-400">75 Flows</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-light">
                Heavy packet bursts and connection frequency spikes intended to exhaust server buffer capacity.
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Preprocessing Statistics and Auto-Mapping Report */}
      <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-white font-heading">Dataset Preprocessing Pipeline Summary</h2>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            Active Scope: <strong className="text-white font-bold">{summary.datasetName}</strong>
          </span>
        </div>

        {/* 4 Preprocessing Stat Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#101827] p-4 rounded-xl border border-cyan-500/15">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Raw Flows Ingested</span>
            <span className="text-2xl font-bold font-mono text-white tabular-nums mt-1 block">
              {prep.totalRawRows.toLocaleString()}
            </span>
          </div>
          <div className="bg-[#101827] p-4 rounded-xl border border-emerald-500/20">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Verified Clean Flows</span>
            <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums mt-1 block">
              {prep.validRows.toLocaleString()}
            </span>
          </div>
          <div className="bg-[#101827] p-4 rounded-xl border border-amber-500/20">
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">Duplicates Purged</span>
            <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums mt-1 block">
              {prep.duplicatesRemoved}
            </span>
          </div>
          <div className="bg-[#101827] p-4 rounded-xl border border-cyan-500/20">
            <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider block">Imputed Missing Values</span>
            <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums mt-1 block">
              {prep.missingValuesHandled}
            </span>
          </div>
        </div>

        {/* Detected Column Auto-Mapping */}
        <div className="pt-2">
          <h3 className="text-xs font-semibold text-white mb-2.5 font-mono uppercase tracking-wider">
            Auto-Mapped Network Features
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs font-mono">
            {Object.entries(prep.columnMapping).map(([internalKey, mappedHeader]) => (
              <div key={internalKey} className="p-2.5 bg-[#101827] rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block font-sans font-light">{internalKey}</span>
                <span className="text-cyan-300 font-bold truncate block mt-0.5" title={mappedHeader}>
                  {mappedHeader}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Normalized Features */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">Standardized Normalized Dimensions:</span>
          {prep.featuresNormalized.map(feat => (
            <span key={feat} className="px-2.5 py-0.5 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-mono text-[11px]">
              {feat} (Standard Scaler)
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
