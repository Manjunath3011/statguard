import { NetworkPacketRecord } from '../types/network';

/**
 * Generates synthetic benchmark network traffic datasets for demonstration,
 * testing, and comparative statistical validation.
 */

// Normal baseline IP addresses
const NORMAL_INTERNAL_IPS = [
  '192.168.1.45', '192.168.1.72', '192.168.1.104', '192.168.1.118',
  '192.168.1.155', '192.168.1.190', '10.0.0.12', '10.0.0.44'
];

const NORMAL_SERVERS = [
  '172.16.0.10', // Web Server
  '172.16.0.15', // Database Server
  '172.16.0.22', // Internal API Gateway
  '8.8.8.8',     // Public DNS
  '1.1.1.1',     // Cloudflare DNS
  '142.250.190.46', // Google CDN
  '151.101.65.140'  // Fastly CDN
];

const ATTACKER_IPS = [
  '185.220.101.5',  // Tor exit node simulation
  '45.154.255.89',  // External brute force bot
  '103.145.13.2',   // Port scanner botnet
  '91.240.118.172', // DDoS botnet agent
  '194.26.29.112'   // Suspicious C2 server
];

export function generateBenchmarkDataset(): NetworkPacketRecord[] {
  const records: NetworkPacketRecord[] = [];
  let recordId = 1;
  const baseTime = Date.now() - 3600 * 1000; // 1 hour ago

  // 1. Generate normal background traffic (120 flows)
  for (let i = 0; i < 120; i++) {
    const srcIp = NORMAL_INTERNAL_IPS[Math.floor(Math.random() * NORMAL_INTERNAL_IPS.length)];
    const destIp = NORMAL_SERVERS[Math.floor(Math.random() * NORMAL_SERVERS.length)];
    const isDns = destIp === '8.8.8.8' || destIp === '1.1.1.1';
    const isWeb = destIp.startsWith('142.') || destIp.startsWith('151.') || destIp === '172.16.0.10';

    const protocol = isDns ? 'UDP' : 'TCP';
    const destPort = isDns ? 53 : (isWeb ? (Math.random() > 0.3 ? 443 : 80) : 5432);
    const sourcePort = 49152 + Math.floor(Math.random() * 15000);

    const fwdPackets = isDns ? Math.floor(1 + Math.random() * 3) : Math.floor(6 + Math.random() * 18);
    const bwdPackets = isDns ? Math.floor(1 + Math.random() * 3) : Math.floor(8 + Math.random() * 25);
    const packetCount = fwdPackets + bwdPackets;
    const packetLength = isDns ? Math.floor(64 + Math.random() * 80) : Math.floor(450 + Math.random() * 550);
    const totalBytes = packetCount * packetLength;
    const flowDuration = isDns ? Math.floor(15 + Math.random() * 40) : Math.floor(120 + Math.random() * 850);
    const connectionFrequency = +(packetCount / (Math.max(flowDuration, 20) / 1000)).toFixed(2);

    const timestamp = new Date(baseTime + i * 25000 + Math.floor(Math.random() * 5000)).toISOString();

    records.push({
      id: `flow-${recordId++}`,
      timestamp,
      sourceIp: srcIp,
      destIp,
      sourcePort,
      destPort,
      protocol,
      packetCount,
      packetLength,
      flowDuration,
      fwdPackets,
      bwdPackets,
      totalBytes,
      connectionFrequency
    });
  }

  // 2. Inject DDoS Attack Burst (Target: 172.16.0.10 web server, extreme packet count, low entropy)
  const ddosTime = baseTime + 1200 * 1000;
  for (let i = 0; i < 15; i++) {
    const srcIp = ATTACKER_IPS[i % ATTACKER_IPS.length];
    const packetCount = Math.floor(2800 + Math.random() * 3500); // extreme Z-score > 4
    const packetLength = Math.floor(64 + Math.random() * 128);
    const flowDuration = Math.floor(450 + Math.random() * 800);
    const connectionFrequency = +(packetCount / (flowDuration / 1000)).toFixed(2); // e.g. 4000+ pps

    records.push({
      id: `flow-${recordId++}`,
      timestamp: new Date(ddosTime + i * 2000).toISOString(),
      sourceIp: srcIp,
      destIp: '172.16.0.10',
      sourcePort: 10000 + Math.floor(Math.random() * 40000),
      destPort: 80,
      protocol: 'TCP',
      packetCount,
      packetLength,
      flowDuration,
      fwdPackets: packetCount,
      bwdPackets: Math.floor(packetCount * 0.02),
      totalBytes: packetCount * packetLength,
      connectionFrequency
    });
  }

  // 3. Inject Port Scanning Activity (Attacker probe cycling across ports 21..1024, tiny packet counts)
  const scanTime = baseTime + 1800 * 1000;
  const scanPorts = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 1433, 3306, 3389, 8080];
  for (let i = 0; i < scanPorts.length; i++) {
    records.push({
      id: `flow-${recordId++}`,
      timestamp: new Date(scanTime + i * 1500).toISOString(),
      sourceIp: '103.145.13.2',
      destIp: '172.16.0.15',
      sourcePort: 51234,
      destPort: scanPorts[i],
      protocol: 'TCP',
      packetCount: 2, // SYN then RST/ACK
      packetLength: 60,
      flowDuration: 45,
      fwdPackets: 1,
      bwdPackets: 1,
      totalBytes: 120,
      connectionFrequency: 44.4
    });
  }

  // 4. Inject SSH Brute Force Burst (Target: port 22, repetitive auth attempts)
  const bruteTime = baseTime + 2400 * 1000;
  for (let i = 0; i < 10; i++) {
    records.push({
      id: `flow-${recordId++}`,
      timestamp: new Date(bruteTime + i * 4000).toISOString(),
      sourceIp: '45.154.255.89',
      destIp: '172.16.0.10',
      sourcePort: 40000 + i,
      destPort: 22,
      protocol: 'SSH',
      packetCount: 24,
      packetLength: 210,
      flowDuration: 280,
      fwdPackets: 12,
      bwdPackets: 12,
      totalBytes: 5040,
      connectionFrequency: 85.7
    });
  }

  // 5. Inject Suspicious Data Exfiltration (Outbound massive byte volume from internal DB host)
  const exfilTime = baseTime + 3000 * 1000;
  for (let i = 0; i < 4; i++) {
    const totalBytes = Math.floor(45000000 + Math.random() * 25000000); // 45MB - 70MB per flow
    const packetCount = Math.floor(32000 + Math.random() * 12000);
    const flowDuration = Math.floor(18000 + Math.random() * 5000);

    records.push({
      id: `flow-${recordId++}`,
      timestamp: new Date(exfilTime + i * 35000).toISOString(),
      sourceIp: '172.16.0.15', // Database server!
      destIp: '194.26.29.112', // Unknown external IP
      sourcePort: 5432,
      destPort: 8443,
      protocol: 'HTTPS',
      packetCount,
      packetLength: 1460,
      flowDuration,
      fwdPackets: Math.floor(packetCount * 0.98),
      bwdPackets: Math.floor(packetCount * 0.02),
      totalBytes,
      connectionFrequency: +(packetCount / (flowDuration / 1000)).toFixed(2)
    });
  }

  // Sort chronological
  return records.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function generateCleanBaselineDataset(): NetworkPacketRecord[] {
  const records: NetworkPacketRecord[] = [];
  let recordId = 1;
  const baseTime = Date.now() - 3600 * 1000;

  for (let i = 0; i < 90; i++) {
    const srcIp = NORMAL_INTERNAL_IPS[Math.floor(Math.random() * NORMAL_INTERNAL_IPS.length)];
    const destIp = NORMAL_SERVERS[Math.floor(Math.random() * NORMAL_SERVERS.length)];
    const isDns = destIp === '8.8.8.8';
    const protocol = isDns ? 'UDP' : 'TCP';
    const destPort = isDns ? 53 : (Math.random() > 0.5 ? 443 : 80);

    const fwdPackets = Math.floor(4 + Math.random() * 14);
    const bwdPackets = Math.floor(6 + Math.random() * 18);
    const packetCount = fwdPackets + bwdPackets;
    const packetLength = Math.floor(250 + Math.random() * 450);
    const totalBytes = packetCount * packetLength;
    const flowDuration = Math.floor(100 + Math.random() * 600);
    const connectionFrequency = +(packetCount / (Math.max(flowDuration, 30) / 1000)).toFixed(2);

    records.push({
      id: `clean-${recordId++}`,
      timestamp: new Date(baseTime + i * 30000).toISOString(),
      sourceIp: srcIp,
      destIp,
      sourcePort: 49152 + Math.floor(Math.random() * 10000),
      destPort,
      protocol,
      packetCount,
      packetLength,
      flowDuration,
      fwdPackets,
      bwdPackets,
      totalBytes,
      connectionFrequency
    });
  }

  return records;
}

export function generateFloodingDataset(): NetworkPacketRecord[] {
  const records: NetworkPacketRecord[] = [];
  let recordId = 1;
  const baseTime = Date.now() - 1800 * 1000;

  for (let i = 0; i < 75; i++) {
    const isFlood = i % 3 === 0;
    const srcIp = isFlood ? ATTACKER_IPS[i % ATTACKER_IPS.length] : NORMAL_INTERNAL_IPS[i % NORMAL_INTERNAL_IPS.length];
    const packetCount = isFlood ? Math.floor(4000 + Math.random() * 5000) : Math.floor(15 + Math.random() * 30);
    const packetLength = isFlood ? 128 : 500;
    const flowDuration = isFlood ? 400 : 800;

    records.push({
      id: `flood-${recordId++}`,
      timestamp: new Date(baseTime + i * 15000).toISOString(),
      sourceIp: srcIp,
      destIp: '172.16.0.10',
      sourcePort: 30000 + Math.floor(Math.random() * 20000),
      destPort: isFlood ? 80 : 443,
      protocol: 'TCP',
      packetCount,
      packetLength,
      flowDuration,
      fwdPackets: packetCount,
      bwdPackets: 5,
      totalBytes: packetCount * packetLength,
      connectionFrequency: +(packetCount / (flowDuration / 1000)).toFixed(2)
    });
  }

  return records;
}
