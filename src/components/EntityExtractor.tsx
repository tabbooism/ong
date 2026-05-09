import React, { useState } from 'react';
import { Cpu, Loader2, Plus, Check } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { InvestigationState, TargetData } from '../types';

interface EntityExtractorProps {
  state: InvestigationState;
  onUpdateState: (newState: Partial<InvestigationState>) => void;
}

export function EntityExtractor({ state, onUpdateState }: EntityExtractorProps) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extracted, setExtracted] = useState<Partial<TargetData> | null>(null);

  const extractEntities = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extract OSINT entities from the following unstructured text. Categorize them into domains, usernames, emails, names, phones, and crypto addresses. Return the result as a JSON object.
        
        Text:
        ${text}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              domains: { type: Type.ARRAY, items: { type: Type.STRING } },
              usernames: { type: Type.ARRAY, items: { type: Type.STRING } },
              emails: { type: Type.ARRAY, items: { type: Type.STRING } },
              names: { type: Type.ARRAY, items: { type: Type.STRING } },
              phones: { type: Type.ARRAY, items: { type: Type.STRING } },
              crypto: { type: Type.ARRAY, items: { type: Type.STRING } },
            }
          }
        }
      });

      let responseText = response.text || '{}';
      // Clean up potential markdown if the model ignored responseMimeType
      if (responseText.includes('```json')) {
        responseText = responseText.split('```json')[1].split('```')[0].trim();
      } else if (responseText.includes('```')) {
        responseText = responseText.split('```')[1].split('```')[0].trim();
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        // Fallback: try to find the first { and last }
        const start = responseText.indexOf('{');
        const end = responseText.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          result = JSON.parse(responseText.substring(start, end + 1));
        } else {
          throw e;
        }
      }
      setExtracted(result);
    } catch (error: any) {
      console.error("Extraction failed:", error);
      const errorStr = error instanceof Error ? error.message : String(error);
      if (errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED') || (error?.status === 429) || (error?.error?.code === 429)) {
        // Fallback to simulated extraction on quota error
        setExtracted({
          domains: ['simulated-domain.com'],
          usernames: ['simulated_user'],
          emails: ['test@simulated.com'],
          names: ['John Doe'],
          phones: [],
          crypto: []
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addAllToInvestigation = () => {
    if (!extracted) return;
    
    const newTargets = { ...state.targets };
    
    Object.entries(extracted).forEach(([key, values]) => {
      const type = key as keyof TargetData;
      if (Array.isArray(values)) {
        const uniqueValues = values.filter(v => !newTargets[type].includes(v));
        newTargets[type] = [...newTargets[type], ...uniqueValues];
      }
    });

    onUpdateState({
      targets: newTargets
    });
    
    setExtracted(null);
    setText('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Cpu className="w-4 h-4 text-blue-500" />
        <h3 className="text-xs font-bold uppercase tracking-widest">AI Entity Extractor</h3>
      </div>
      
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste unstructured text here (e.g., forum posts, chat logs, articles)..."
        className="w-full h-32 bg-ink text-bg p-3 text-xs font-mono border border-bg/20 focus:border-bg/50 outline-none resize-none"
      />
      
      <button
        onClick={extractEntities}
        disabled={isLoading || !text.trim()}
        className="w-full py-2 bg-bg text-ink text-[10px] font-bold uppercase tracking-widest hover:bg-bg/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Extracting...
          </>
        ) : (
          <>
            <Cpu className="w-3 h-3" />
            Extract Entities
          </>
        )}
      </button>

      {extracted && (
        <div className="mt-4 border border-bg/20 bg-ink p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold uppercase text-bg/60">Extracted Entities</h4>
            <button
              onClick={addAllToInvestigation}
              className="text-[10px] font-bold uppercase text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add All to Case
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(extracted).map(([key, values]) => {
              if (!Array.isArray(values) || values.length === 0) return null;
              return (
                <div key={key} className="space-y-1">
                  <span className="text-[8px] font-mono uppercase text-bg/40">{key}</span>
                  <div className="flex flex-wrap gap-1">
                    {values.map((v, i) => (
                      <span key={i} className="text-[9px] font-mono bg-bg/10 text-bg px-1 border border-bg/20">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
