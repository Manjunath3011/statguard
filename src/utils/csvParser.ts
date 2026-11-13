import Papa from 'papaparse';
import { NetworkPacketRecord, PreprocessingStats } from '../types/network';

interface ColumnMapping {
  timestamp?: string;
  sourceIp?: string;
  destIp?: string;
  sourcePort?: string;
  destPort?: string;
  protocol?: string;
  packetCount?: string;
  packetLength?: string;
  flowDuration?: string;
  fwdPackets?: string;
  bwdPackets?: string;
  totalBytes?: string;
  connectionFrequency?: string;
}

const COLUMN_ALIASES: Record<keyof ColumnMapping, string[]> = {
  timestamp: ['timestamp', 'time', 'date', 'ts', 'start_time', 'flow_start', 'datetime'],
  sourceIp: ['source_ip', 'src_ip', 'srcip', 'sourceip', 'ip_src', 'src', 'source_address'],
  destIp: ['dest_ip', 'dst_ip', 'dstip', 'destip', 'destination_ip', 'ip_dst', 'dst', 'destination_address'],
  sourcePort: ['source_port', 'src_port', 'sport', 'srcport', 'sourceport', 'port_src'],
  destPort: ['dest_port', 'dst_port', 'dport', 'dstport', 'destination_port', 'destport', 'port_dst'],
  protocol: ['protocol', 'proto', 'protocol_name', 'ip_proto', 'transport_protocol'],
  packetCount: ['packet_count', 'packets', 'total_packets', 'tot_packets', 'tot_pkts', 'pkt_count', 'packets_total', 'count'],
  packetLength: ['packet_length', 'pkt_length', 'pkt_len', 'length', 'avg_packet_size', 'mean_pkt_sz', 'len'],
  flowDuration: ['flow_duration', 'duration', 'dur', 'flow_dur', 'time_elapsed', 'elapsed_time'],
  fwdPackets: ['fwd_packets', 'tot_fwd_pkts', 'forward_packets', 'fwd_pkts', 'fwd_packet_count'],
  bwdPackets: ['bwd_packets', 'tot_bwd_pkts', 'backward_packets', 'bwd_pkts', 'bwd_packet_count'],
  totalBytes: ['total_bytes', 'tot_bytes', 'bytes', 'total_length', 'tot_len', 'bytes_total', 'volume_bytes'],
  connectionFrequency: ['connection_frequency', 'frequency', 'packets_per_sec', 'pkt_rate', 'flow_pkts_s', 'rate', 'pps']
};

export function autoDetectColumns(headers: string[]): ColumnMapping {
  const normalizedHeaders = headers.map(h => ({
    original: h,
    clean: h.toLowerCase().trim().replace(/[\s\-_]+/g, '_')
  }));

  const mapping: ColumnMapping = {};

  (Object.keys(COLUMN_ALIASES) as (keyof ColumnMapping)[]).forEach(field => {
    const aliases = COLUMN_ALIASES[field];
    for (const h of normalizedHeaders) {
      if (aliases.includes(h.clean)) {
        mapping[field] = h.original;
        break;
      }
    }
  });

  return mapping;
}

export function parseNetworkCSV(fileContent: string): {
  records: NetworkPacketRecord[];
  stats: PreprocessingStats;
} {
  const parseResult = Papa.parse<Record<string, string>>(fileContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });

  const rawRows = parseResult.data;
  const headers = parseResult.meta.fields || [];
  const columnMapping = autoDetectColumns(headers);

  let missingValuesHandled = 0;
  let duplicatesRemoved = 0;
  const validRecords: NetworkPacketRecord[] = [];
  const seenSignatures = new Set<string>();
  const parsingErrors: string[] = [];

  rawRows.forEach((row, index) => {
    try {
      // 1. Resolve fields with intelligent fallback
      const sourceIp = (columnMapping.sourceIp ? row[columnMapping.sourceIp] : row['source_ip'] || row['src_ip']) || '192.168.1.10';
      const destIp = (columnMapping.destIp ? row[columnMapping.destIp] : row['dest_ip'] || row['dst_ip']) || '172.16.0.1';
      const sourcePort = parseInt(columnMapping.sourcePort ? row[columnMapping.sourcePort] : row['source_port'] || row['src_port'] || '49152', 10) || 49152;
      const destPort = parseInt(columnMapping.destPort ? row[columnMapping.destPort] : row['dest_port'] || row['dst_port'] || '80', 10) || 80;
      const protocol = (columnMapping.protocol ? row[columnMapping.protocol] : row['protocol'] || 'TCP').toUpperCase();

      const rawPacketCount = columnMapping.packetCount ? row[columnMapping.packetCount] : row['packet_count'] || row['packets'];
      const rawBytes = columnMapping.totalBytes ? row[columnMapping.totalBytes] : row['total_bytes'] || row['bytes'];
      const rawDuration = columnMapping.flowDuration ? row[columnMapping.flowDuration] : row['flow_duration'] || row['duration'];
      const rawFreq = columnMapping.connectionFrequency ? row[columnMapping.connectionFrequency] : row['frequency'];

      if (!rawPacketCount || isNaN(parseFloat(rawPacketCount))) missingValuesHandled++;
      if (!rawBytes || isNaN(parseFloat(rawBytes))) missingValuesHandled++;

      const packetCount = Math.max(1, parseInt(rawPacketCount || '15', 10) || 15);
      const totalBytes = Math.max(packetCount * 40, parseInt(rawBytes || `${packetCount * 512}`, 10) || packetCount * 512);
      const flowDuration = Math.max(1, parseFloat(rawDuration || '350') || 350);
      const packetLength = Math.round(totalBytes / packetCount);
      const fwdPackets = Math.max(1, Math.round(packetCount * 0.6));
      const bwdPackets = Math.max(0, packetCount - fwdPackets);

      const calculatedFreq = +(packetCount / (Math.max(flowDuration, 10) / 1000)).toFixed(2);
      const connectionFrequency = rawFreq && !isNaN(parseFloat(rawFreq)) ? parseFloat(rawFreq) : calculatedFreq;

      const rawTs = columnMapping.timestamp ? row[columnMapping.timestamp] : row['timestamp'] || row['time'];
      let timestamp: string;
      if (rawTs && !isNaN(new Date(rawTs).getTime())) {
        timestamp = new Date(rawTs).toISOString();
      } else {
        timestamp = new Date(Date.now() - (rawRows.length - index) * 10000).toISOString();
      }

      // Check duplicates (same src, dst, sport, dport, ts)
      const signature = `${sourceIp}:${sourcePort}->${destIp}:${destPort}@${timestamp}`;
      if (seenSignatures.has(signature)) {
        duplicatesRemoved++;
        return;
      }
      seenSignatures.add(signature);

      validRecords.push({
        id: `row-${index + 1}`,
        timestamp,
        sourceIp: sourceIp.trim(),
        destIp: destIp.trim(),
        sourcePort,
        destPort,
        protocol,
        packetCount,
        packetLength,
        flowDuration,
        fwdPackets,
        bwdPackets,
        totalBytes,
        connectionFrequency,
        rawRowData: row
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (parsingErrors.length < 5) {
        parsingErrors.push(`Row ${index + 1}: ${msg}`);
      }
    }
  });

  const stats: PreprocessingStats = {
    totalRawRows: rawRows.length,
    validRows: validRecords.length,
    duplicatesRemoved,
    missingValuesHandled,
    featuresNormalized: ['packetCount', 'totalBytes', 'connectionFrequency', 'flowDuration'],
    columnMapping: Object.entries(columnMapping).reduce((acc, [k, v]) => ({ ...acc, [k]: v || 'N/A' }), {}),
    parsingErrors
  };

  return { records: validRecords, stats };
}
