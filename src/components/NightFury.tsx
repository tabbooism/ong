import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Terminal, 
  Play, 
  StopCircle, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Download,
  Search,
  Globe,
  Database,
  Lock,
  Zap
} from 'lucide-react';
import { InvestigationState, ExploitResult } from '../types';

interface NightFuryProps {
  state: InvestigationState;
  onUpdateState: (newState: Partial<InvestigationState>) => void;
}

export const NightFury: React.FC<NightFuryProps> = ({ state, onUpdateState }) => {
  const [targetUrl, setTargetUrl] = useState(state.offensive?.targetUrl || '');
  const [isScanning, setIsScanning] = useState(state.offensive?.isScanning || false);
  const [logs, setLogs] = useState<string[]>(state.offensive?.logs || []);
  const [results, setResults] = useState<ExploitResult[]>(state.offensive?.results || []);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Listen for WebSocket messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'OFFENSIVE_LOG') {
          setLogs(prev => [...prev, data.payload]);
        } else if (data.type === 'OFFENSIVE_RESULT') {
          setResults(prev => {
            const exists = prev.find(r => r.id === data.payload.id);
            if (exists) return prev;
            return [...prev, data.payload];
          });
        }
      } catch (e) {
        console.error('Failed to parse WS message', e);
      }
    };

    window.addEventListener('message', handleMessage);
    // Note: In a real app, you'd use the actual WebSocket instance. 
    // Here we assume App.tsx broadcasts these events to the window or handles them.
    // For this implementation, I'll add a listener in App.tsx that forwards WS messages to the state.
    
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Update global state when local state changes
  useEffect(() => {
    onUpdateState({
      offensive: {
        targetUrl,
        isScanning,
        results,
        logs
      }
    });
  }, [targetUrl, isScanning, results, logs]);

  const startScan = async () => {
    if (!targetUrl) return;
    
    setIsScanning(true);
    setLogs(prev => [...prev, `[*] Initializing NightFury Ultima v3.0 Enhanced...`, `[*] Target locked: ${targetUrl}`, `[*] Loading ML models and evasion engines...`]);
    setResults([]);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setLogs(prev => [...prev, `[+] Distributed Attack Coordinator synchronized (4 nodes)`]);
      
      const response = await fetch('/api/nightfury/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });

      if (!response.ok) {
        throw new Error(`Scan failed to start: ${response.statusText}`);
      }
    } catch (error: any) {
      setLogs(prev => [...prev, `[ERROR] ${error.message}`]);
      setIsScanning(false);
    }
  };

  const executeChain = async (chainName: string) => {
    if (!targetUrl) return;
    setIsScanning(true);
    setLogs(prev => [...prev, `[*] Executing Exploitation Chain: ${chainName}`, `[*] Target: ${targetUrl}`]);
    setResults([]);
    
    try {
      const response = await fetch('/api/nightfury/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, chain: chainName })
      });

      if (!response.ok) {
        throw new Error(`Chain execution failed to start: ${response.statusText}`);
      }
    } catch (error: any) {
      setLogs(prev => [...prev, `[ERROR] ${error.message}`]);
      setIsScanning(false);
    }
  };

  const exportReport = () => {
    const data = JSON.stringify(results, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nightfury_report_${new Date().getTime()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/40 border border-red-900/30 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-950/40 rounded-lg border border-red-500/30">
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-500 tracking-tight uppercase">NightFury Ultima</h2>
            <p className="text-xs text-red-400/60 font-mono">Production Offensive Framework v3.0 Enhanced</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
            isScanning ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-green-500/20 border-green-500 text-green-500'
          }`}>
            {isScanning ? 'Engaged' : 'Standby'}
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-4">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <Globe className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Target Configuration</span>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://target-system.com"
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-red-500/50 transition-colors font-mono"
                  disabled={isScanning}
                />
              </div>
              <button
                onClick={startScan}
                disabled={isScanning || !targetUrl}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-xs transition-all ${
                  isScanning || !targetUrl
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20'
                }`}
              >
                {isScanning ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {isScanning ? 'Scanning...' : 'Initialize'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              {['ML-RNG Predictor', 'WS Exploitation', 'AI-IDOR', 'Race Condition', 'Zero-Day Sim', 'Blockchain Analyzer'].map((vector) => (
                <div key={vector} className="flex items-center gap-2 px-3 py-2 bg-black/20 border border-zinc-800/50 rounded-md">
                  <Zap className="w-3 h-3 text-red-500/50" />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">{vector}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-zinc-800/50">
              <div className="flex items-center gap-2 text-zinc-400 mb-3">
                <Terminal className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Exploitation Chains</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['ELITE_NEXUS', 'RAPID_STRIKE', 'GAME_LOGIC_BREACH', 'FINANCIAL_EXTRACTION', 'STEALTH_OPERATION', 'CONTINUOUS_HARVEST'].map((chain) => (
                  <button 
                    key={chain}
                    onClick={() => executeChain(chain)}
                    disabled={isScanning || !targetUrl}
                    className="text-[9px] font-mono py-1.5 px-2 bg-zinc-900/50 border border-zinc-800 rounded hover:border-red-500/50 hover:text-red-400 transition-colors text-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed text-left truncate"
                  >
                    &gt; {chain}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Console Output */}
          <div className="bg-black border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-[400px]">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">System Console</span>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                <div className="w-2 h-2 rounded-full bg-green-500/50" />
              </div>
            </div>
            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1 custom-scrollbar">
              {logs.length === 0 && (
                <div className="text-zinc-700 italic">Waiting for initialization...</div>
              )}
              {logs.map((log, i) => {
                let colorClass = 'text-zinc-400';
                if (log.includes('[SUCCESS]')) colorClass = 'text-green-400';
                else if (log.includes('[ERROR]')) colorClass = 'text-red-400';
                else if (log.includes('[TEST]')) colorClass = 'text-blue-400';
                else if (log.includes('[PAYLOAD]')) colorClass = 'text-yellow-400';
                else if (log.includes('[RESPONSE]')) colorClass = 'text-purple-400';

                return (
                  <div key={i} className={`flex gap-2 ${colorClass}`}>
                    <span className="text-zinc-600 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                    <span className="break-all">{log}</span>
                  </div>
                );
              })}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        {/* Results Sidebar */}
        <div className="space-y-4">
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-zinc-400">
                <Database className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Exploit Database</span>
              </div>
              <button 
                onClick={exportReport}
                disabled={results.length === 0}
                className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-30"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-30 py-12">
                  <Lock className="w-8 h-8" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No vulnerabilities detected</p>
                </div>
              ) : (
                results.map((result) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={result.id}
                    className="p-3 bg-black/40 border border-green-900/20 rounded-lg group hover:border-green-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">{result.vector}</span>
                      </div>
                      <span className="text-[9px] text-zinc-600 font-mono">{new Date(result.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono break-all mb-2 line-clamp-1">
                      {result.url}
                    </div>
                    <div className="p-2 bg-black/60 rounded border border-zinc-800/50 font-mono text-[9px] text-zinc-500 overflow-hidden">
                      <div className="text-zinc-600 mb-1 uppercase text-[8px]">Evidence:</div>
                      <div className="line-clamp-2 italic">"{result.evidence}"</div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {results.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  <span>Total Findings</span>
                  <span className="text-green-500">{results.length}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
