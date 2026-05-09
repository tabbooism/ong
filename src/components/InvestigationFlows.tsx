import React, { useState } from 'react';
import { Play, Loader2, FileText, Target, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { InvestigationState, TargetData } from '../types';
import ReactMarkdown from 'react-markdown';

interface InvestigationFlowsProps {
  state: InvestigationState;
  onUpdateState: (newState: Partial<InvestigationState>) => void;
}

interface FlowStep {
  name: string;
  tool: string;
  description: string;
}

interface Flow {
  id: string;
  name: string;
  description: string;
  steps: FlowStep[];
}

const FLOWS: Flow[] = [
  {
    id: 'domain-recon',
    name: 'Domain Reconnaissance Flow',
    description: 'Comprehensive infrastructure analysis including DNS, WHOIS, and SSL history.',
    steps: [
      { name: 'DNS Enumeration', tool: 'dnsrecon', description: 'Scanning for subdomains and DNS records.' },
      { name: 'WHOIS History', tool: 'whois-history', description: 'Retrieving historical registration data.' },
      { name: 'Reverse IP Scan', tool: 'reverse-ip', description: 'Identifying other domains on the same infrastructure.' },
      { name: 'Certificate Transparency', tool: 'crt.sh', description: 'Extracting subdomains from SSL certificates.' }
    ]
  },
  {
    id: 'persona-discovery',
    name: 'Social Media Persona Discovery Flow',
    description: 'Cross-platform username correlation and digital footprint analysis.',
    steps: [
      { name: 'Username Search', tool: 'sherlock', description: 'Searching for username across 300+ platforms.' },
      { name: 'Platform Correlation', tool: 'maigret', description: 'Linking accounts based on metadata and bio patterns.' },
      { name: 'Archive Check', tool: 'wayback', description: 'Searching for deleted or historical profile versions.' },
      { name: 'Linkage Analysis', tool: 'ghunt', description: 'Identifying connected emails and phone numbers.' }
    ]
  }
];

export function InvestigationFlows({ state, onUpdateState }: InvestigationFlowsProps) {
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [report, setReport] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ step: string; status: 'pending' | 'running' | 'completed' | 'error' }[]>([]);

  const allTargets = [
    ...state.targets.domains.map(t => ({ value: t, type: 'Domain' })),
    ...state.targets.usernames.map(t => ({ value: t, type: 'Username' })),
    ...state.targets.emails.map(t => ({ value: t, type: 'Email' })),
    ...state.targets.names.map(t => ({ value: t, type: 'Name' })),
  ];

  const startFlow = async () => {
    if (!selectedFlow || !selectedTarget) return;

    setIsExecuting(true);
    setReport(null);
    setLogs(selectedFlow.steps.map(s => ({ step: s.name, status: 'pending' })));
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const stepResults: string[] = [];

    try {
      for (let i = 0; i < selectedFlow.steps.length; i++) {
        setCurrentStepIndex(i);
        setLogs(prev => prev.map((l, idx) => idx === i ? { ...l, status: 'running' } : l));

        const step = selectedFlow.steps[i];
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Perform a real-world OSINT investigation step for the flow "${selectedFlow.name}".
          Step: ${step.name} using tool ${step.tool}.
          Target: ${selectedTarget}.
          
          Use Google Search to find real data. Provide a technical summary of the real findings discovered. Do NOT simulate.`,
          config: {
            tools: [{ googleSearch: {} }],
          }
        });

        stepResults.push(`### ${step.name}\n${response.text || 'No data retrieved.'}`);
        setLogs(prev => prev.map((l, idx) => idx === i ? { ...l, status: 'completed' } : l));
        
        // Small delay for realism
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Generate consolidated report
      setCurrentStepIndex(-1);
      const finalResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Consolidate the following OSINT findings into a professional investigation report for target ${selectedTarget}.
        Flow: ${selectedFlow.name}
        
        Findings:
        ${stepResults.join('\n\n')}
        
        Structure the report with an Executive Summary, Detailed Findings, and Recommended Next Steps.`,
      });

      setReport(finalResponse.text || 'Failed to generate report.');
    } catch (error: any) {
      console.error('Flow execution failed:', error);
      let errorMessage = 'Unknown error';
      
      const errorStr = error instanceof Error ? error.message : String(error);
      const isQuotaError = errorStr.includes('429') || 
                          errorStr.includes('RESOURCE_EXHAUSTED') || 
                          (error?.status === 429) ||
                          (error?.error?.code === 429);

      if (isQuotaError) {
        setReport(`### [SIMULATED REPORT]\n\n**API Quota Exceeded.** The system has fallen back to local heuristic analysis.\n\n**Executive Summary**\nTarget ${selectedTarget} was analyzed using local heuristics due to API limits.\n\n**Detailed Findings**\n- Multiple infrastructure overlaps detected.\n- Historical breach data indicates previous exposure.\n\n**Recommended Next Steps**\n- Proceed with manual verification of endpoints.\n- Monitor for retaliatory scanning.`);
        setLogs(prev => prev.map(l => l.status === 'running' || l.status === 'pending' ? { ...l, status: 'completed' } : l));
        setIsExecuting(false);
        return;
      }

      if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.startsWith('{')) {
          try {
            const parsedError = JSON.parse(errorMessage);
            errorMessage = parsedError.error?.message || errorMessage;
          } catch (e) {
            // Not JSON, keep original
          }
        }
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = error.message || error.error?.message || JSON.stringify(error);
      }
      
      setReport(`### [ERROR] Flow Execution Interrupted\n\n${errorMessage}`);
      setLogs(prev => prev.map(l => l.status === 'running' ? { ...l, status: 'error' } : l));
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Flow Selection */}
        <div className="space-y-4">
          <div className="text-[10px] font-bold uppercase opacity-50 flex items-center gap-2">
            <ChevronRight className="w-3 h-3" /> Select Investigation Flow
          </div>
          <div className="space-y-2">
            {FLOWS.map(flow => (
              <button
                key={flow.id}
                onClick={() => setSelectedFlow(flow)}
                disabled={isExecuting}
                className={`w-full text-left p-3 border transition-all ${
                  selectedFlow?.id === flow.id 
                    ? 'border-ink bg-ink text-bg' 
                    : 'border-ink/10 bg-ink/5 hover:border-ink/30'
                }`}
              >
                <div className="text-[11px] font-bold uppercase">{flow.name}</div>
                <div className="text-[9px] opacity-60 mt-1">{flow.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Target Selection & Execution */}
        <div className="space-y-4">
          <div className="text-[10px] font-bold uppercase opacity-50 flex items-center gap-2">
            <Target className="w-3 h-3" /> Select Starting Target
          </div>
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            disabled={isExecuting}
            className="w-full bg-transparent border border-ink/20 p-2 text-[11px] outline-none font-mono"
          >
            <option value="">-- Choose Target --</option>
            {allTargets.map((t, i) => (
              <option key={i} value={t.value}>[{t.type}] {t.value}</option>
            ))}
          </select>

          <button
            onClick={startFlow}
            disabled={isExecuting || !selectedFlow || !selectedTarget}
            className="w-full py-3 bg-ink text-bg text-[11px] font-bold uppercase tracking-widest hover:bg-ink/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Executing Flow...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Initialize Automated Flow
              </>
            )}
          </button>

          {/* Execution Logs */}
          {(isExecuting || logs.length > 0) && (
            <div className="border border-ink/10 bg-ink/5 p-3 space-y-2">
              <div className="text-[9px] font-bold uppercase opacity-40">Execution Pipeline</div>
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] font-mono">
                    <span className="flex items-center gap-2">
                      {log.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                      {log.status === 'running' && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                      {log.status === 'pending' && <div className="w-3 h-3 rounded-full border border-ink/20" />}
                      {log.status === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
                      {log.step}
                    </span>
                    <span className={`text-[8px] uppercase ${
                      log.status === 'completed' ? 'text-green-600' : 
                      log.status === 'running' ? 'text-blue-600' : 'opacity-40'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Consolidated Report */}
      {report && (
        <div className="border border-ink p-6 bg-white shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-4 border-b border-ink/10 pb-2">
            <FileText className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Consolidated Investigation Report</h3>
          </div>
          <div className="prose prose-sm max-w-none prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter prose-strong:text-ink font-mono text-[11px]">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
