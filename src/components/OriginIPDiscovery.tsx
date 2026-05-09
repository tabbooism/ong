import React, { useState, useEffect } from 'react';
import { Globe, Search, Server, ShieldAlert, Activity, CheckCircle, XCircle, Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InvestigationState } from '../types';

interface OriginIPDiscoveryProps {
  state: InvestigationState;
  onUpdateState: (newState: Partial<InvestigationState>) => void;
}

interface DiscoveryResult {
  ip: string;
  provider: string;
  asn: string;
  confidence: 'High' | 'Medium' | 'Low';
  methods: string[];
}

export function OriginIPDiscovery({ state, onUpdateState }: OriginIPDiscoveryProps) {
  const [target, setTarget] = useState(state.targets.domains[0] || '');
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<DiscoveryResult | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'DISCOVERY_LOG') {
          setLogs(prev => [...prev, data.payload]);
        } else if (data.type === 'DISCOVERY_RESULT') {
          setResult(data.payload);
          setIsScanning(false);
        }
      } catch (e) {
        console.error('Failed to parse WS message', e);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const runDiscovery = async () => {
    if (!target) return;
    
    setIsScanning(true);
    setLogs([]);
    setResult(null);

    try {
      const response = await fetch('/api/origin-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });

      if (!response.ok) {
        throw new Error(`Discovery failed to start: ${response.statusText}`);
      }
    } catch (error: any) {
      setLogs(prev => [...prev, `[ERROR] Discovery failed: ${error.message}`]);
      setIsScanning(false);
    }
  };

  const addToTargets = () => {
    if (!result) return;
    
    const newEntity = {
      id: `e_${Date.now()}`,
      label: result.ip,
      type: 'ip' as const
    };

    onUpdateState({
      targets: {
        ...state.targets,
        other: [...new Set([...state.targets.other, result.ip])]
      },
      entities: [...state.entities, newEntity]
    });
  };

  return (
    <div className="bg-black border border-zinc-800 rounded-lg overflow-hidden flex flex-col md:flex-row">
      {/* Control Panel */}
      <div className="w-full md:w-1/3 bg-zinc-950 p-4 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col">
        <div className="flex items-center gap-2 mb-4 text-zinc-300">
          <Globe className="w-4 h-4 text-blue-500" />
          <h3 className="text-xs font-bold uppercase tracking-widest">Origin IP Discovery</h3>
        </div>
        
        <p className="text-[10px] text-zinc-500 mb-6 font-mono">
          Bypass CDNs (Cloudflare, Fastly, etc.) to uncover the true hosting infrastructure using SSL history, Shodan, and Censys.
        </p>

        <div className="space-y-4 flex-1">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Target Domain</label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g., runehall.com"
              className="w-full bg-black border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-300 focus:border-blue-500 focus:outline-none transition-colors"
              disabled={isScanning}
            />
          </div>

          <button
            onClick={runDiscovery}
            disabled={isScanning || !target}
            className="w-full py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded text-xs font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Discovering...
              </>
            ) : (
              <>
                <Search className="w-3 h-3" />
                Find Origin IP
              </>
            )}
          </button>
        </div>

        {/* Result Card */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-blue-950/20 border border-blue-900/50 rounded-lg space-y-3"
            >
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Discovery Complete</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-baseline border-b border-blue-900/30 pb-1">
                  <span className="text-[10px] text-zinc-500 uppercase">Origin IP</span>
                  <span className="text-sm font-mono text-zinc-200 font-bold">{result.ip}</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-blue-900/30 pb-1">
                  <span className="text-[10px] text-zinc-500 uppercase">Provider</span>
                  <span className="text-xs text-zinc-300">{result.provider}</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-blue-900/30 pb-1">
                  <span className="text-[10px] text-zinc-500 uppercase">ASN</span>
                  <span className="text-xs text-zinc-300">{result.asn}</span>
                </div>
                <div className="flex justify-between items-baseline pb-1">
                  <span className="text-[10px] text-zinc-500 uppercase">Confidence</span>
                  <span className="text-xs text-green-400 font-bold">{result.confidence}</span>
                </div>
              </div>

              <button
                onClick={addToTargets}
                className="w-full mt-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-3 h-3" />
                Add to Targets
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Terminal Output */}
      <div className="w-full md:w-2/3 bg-black p-4 h-64 md:h-auto flex flex-col">
        <div className="flex items-center gap-2 mb-2 text-zinc-500 border-b border-zinc-800 pb-2">
          <Server className="w-3 h-3" />
          <span className="text-[10px] font-mono uppercase tracking-widest">Discovery Logs</span>
        </div>
        <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 custom-scrollbar">
          {logs.length === 0 && !isScanning && (
            <div className="text-zinc-700 italic h-full flex items-center justify-center">
              Ready to initiate discovery sequence...
            </div>
          )}
          {logs.map((log, i) => {
            let colorClass = 'text-zinc-400';
            if (log.includes('[SUCCESS]') || log.includes('[+]')) colorClass = 'text-green-400';
            else if (log.includes('[ERROR]')) colorClass = 'text-red-400';
            else if (log.includes('[!]')) colorClass = 'text-yellow-400';
            else if (log.includes('[*]')) colorClass = 'text-blue-400';

            return (
              <div key={i} className={`flex gap-2 ${colorClass}`}>
                <span className="text-zinc-600 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                <span className="break-all">{log}</span>
              </div>
            );
          })}
          {isScanning && (
            <div className="flex gap-2 text-zinc-500 animate-pulse mt-2">
              <span className="shrink-0">[{new Date().toLocaleTimeString()}]</span>
              <span>_</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
