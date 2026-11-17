import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Database,
  Play,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DatasetUploadPage: React.FC = () => {
  const {
    summary,
    loadSample,
    uploadCsvToBackend,
    runBackendAnalysis,
    isUploading,
    uploadError,
    lastUploadResult,
    isAnalyzing,
    analyzeError,
    lastAnalysisMessage,
    dataSourceMode,
    setActivePage
  } = useApp();

  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setLocalError('Please select a valid CSV file (.csv format)');
      return;
    }

    if (file.size === 0) {
      setLocalError('CSV file appears to be empty.');
      return;
    }

    setLocalError(null);
    setSelectedFileName(file.name);
    await uploadCsvToBackend(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleTriggerAnalysis = async () => {
    const ok = await runBackendAnalysis();
    if (ok) {
      setActivePage('detection');
    }
  };

  const downloadSampleCsv = () => {
    const sampleHeaders =
      'timestamp,source_ip,dest_ip,source_port,dest_port,protocol,packet_count,total_bytes,flow_duration,frequency';
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
  const activeError = localError || uploadError?.message || analyzeError?.message || null;

  return (
    <div className="p-8 space-y-7 max-w-7xl mx-auto cyber-grid">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#101827]/90 via-[#151E2D]/80 to-[#101827]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-heading">
            DATASET INGESTION & FEATURE NORMALIZATION
          </h1>
          <p className="text-xs text-cyan-300/80 font-light mt-1">
            Upload network flow CSV files to FastAPI (<span className="font-mono">POST /api/upload</span>) and trigger statistical threat detection (<span className="font-mono">POST /api/analyze</span>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={downloadSampleCsv}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-cyan-300 bg-[#151E2D] hover:bg-cyan-950/40 hover:border-cyan-400/50 border border-cyan-500/25 rounded-xl transition-all shadow-[0_0_12px_rgba(0,229,255,0.15)]"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download Sample Template</span>
          </button>

          <button
            onClick={() => void handleTriggerAnalysis()}
            disabled={isUploading || isAnalyzing}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#080B12] bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 rounded-xl transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)] disabled:opacity-60 font-heading"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{isAnalyzing ? 'Running Analysis...' : 'Run Statistical Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Upload Zone & Benchmark Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drag & Drop File Upload Area */}
        <div className="lg:col-span-2 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_25px_rgba(0,229,255,0.25)]'
                : 'border-cyan-500/25 hover:border-cyan-400/60 bg-[#151E2D]/80 hover:bg-[#151E2D] shadow-lg'
            } ${isUploading ? 'opacity-80 cursor-wait' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  void handleFile(e.target.files[0]);
                  e.target.value = '';
                }
              }}
              className="hidden"
            />

            <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
              {isUploading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <UploadCloud className="w-7 h-7" />
              )}
            </div>

            <h2 className="text-base font-bold text-white font-heading">
              {isUploading
                ? `Uploading "${selectedFileName || 'CSV'}" to FastAPI Backend...`
                : 'Drop Network Traffic CSV or Browse Files'}
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1.5 font-light">
              Files are transmitted directly to <span className="font-mono text-cyan-300">POST /api/upload</span> for normalization across Wireshark, Zeek/Bro, NetFlow, CIC-IDS2017, and UNSW-NB15 schemas.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2 text-[10px] font-mono text-cyan-300">
              <span className="px-2.5 py-1 bg-[#101827] rounded-lg border border-cyan-500/20">Source / Dest IP</span>
              <span className="px-2.5 py-1 bg-[#101827] rounded-lg border border-cyan-500/20">Port</span>
              <span className="px-2.5 py-1 bg-[#101827] rounded-lg border border-cyan-500/20">Protocol</span>
              <span className="px-2.5 py-1 bg-[#101827] rounded-lg border border-cyan-500/20">Packet Count</span>
              <span className="px-2.5 py-1 bg-[#101827] rounded-lg border border-cyan-500/20">Byte Volume</span>
              <span className="px-2.5 py-1 bg-[#101827] rounded-lg border border-cyan-500/20">Flow Duration</span>
            </div>

            {activeError && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="mt-5 p-3.5 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-center justify-center gap-2 text-left"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{activeError}</span>
              </div>
            )}
          </div>

          {/* Backend Upload Confirmation & Analyze Prompt */}
          {lastUploadResult && !uploadError && (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-200 font-heading">
                    {lastUploadResult.message}
                  </div>
                  <div className="text-[11px] text-emerald-300/80 font-mono mt-0.5">
                    Dataset: {lastUploadResult.datasetName}
                    {lastUploadResult.datasetId ? ` · ID: ${lastUploadResult.datasetId}` : ''} ·{' '}
                    {lastUploadResult.validRows.toLocaleString()} valid flows ready
                  </div>
                  {lastAnalysisMessage && (
                    <div className="text-[11px] text-cyan-300 font-mono mt-1">
                      {lastAnalysisMessage}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => void handleTriggerAnalysis()}
                disabled={isAnalyzing}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-[#080B12] font-bold text-xs font-heading shrink-0 shadow-[0_0_12px_rgba(0,229,255,0.25)] disabled:opacity-60"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze Dataset (POST /api/analyze)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Curated Simulated Benchmark Presets */}
        <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white font-heading">Simulated Benchmark Captures</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-500/30">
                CLIENT-SIDE DEMO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-light mt-1">
              Preview local synthetic captures for offline UI testing (explicitly flagged as simulated data, not FastAPI backend detection):
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
                Multi-vector simulated capture: DDoS surge, SSH brute-force, port scanning, and DB exfiltration.
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
                Simulated intra-office HTTP, HTTPS, DNS, and SQL query flows conforming to Gaussian normality.
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
                Simulated packet bursts and connection frequency spikes intended to exhaust server buffer capacity.
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Preprocessing Statistics and Auto-Mapping Report */}
      <div className="p-6 rounded-2xl bg-[#151E2D]/90 border border-cyan-500/20 backdrop-blur-xl shadow-lg space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-white font-heading">Dataset Preprocessing Pipeline Summary</h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span
              className={`px-2 py-0.5 rounded border text-[10px] ${
                dataSourceMode === 'simulated'
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                  : dataSourceMode === 'backend'
                  ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
            >
              {dataSourceMode === 'simulated'
                ? 'SIMULATED DEMO'
                : dataSourceMode === 'backend'
                ? 'FASTAPI BACKEND'
                : 'STANDBY'}
            </span>
            <span className="text-cyan-400">
              Active Scope: <strong className="text-white font-bold">{summary.datasetName}</strong>
            </span>
          </div>
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
          {Object.keys(prep.columnMapping).length === 0 ? (
            <div className="p-4 rounded-xl bg-[#101827] border border-dashed border-slate-800 text-xs text-slate-400 font-light">
              No column mapping metadata loaded yet. Upload a CSV file to POST /api/upload to inspect feature extraction.
            </div>
          ) : (
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
          )}
        </div>

        {/* Normalized Features */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">Standardized Normalized Dimensions:</span>
          {prep.featuresNormalized.length === 0 ? (
            <span className="text-slate-500 font-mono text-[11px]">Pending ingestion</span>
          ) : (
            prep.featuresNormalized.map(feat => (
              <span
                key={feat}
                className="px-2.5 py-0.5 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-mono text-[11px]"
              >
                {feat} (Standard Scaler)
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
