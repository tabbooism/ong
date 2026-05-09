import React, { useState } from 'react';
import { Users, Search, Link as LinkIcon, ExternalLink, ShieldAlert, Loader2, Share2, Info, Activity, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InvestigationState } from '../types';
import { GoogleGenAI } from "@google/genai";

interface SocialMediaSearchProps {
  state: InvestigationState;
  onUpdateState: (newState: Partial<InvestigationState>) => void;
}

interface SocialProfile {
  platform: string;
  url: string;
  username: string;
  bio?: string;
  confidence: 'High' | 'Medium' | 'Low';
  reasoning: string;
}

export function SocialMediaSearch({ state, onUpdateState }: SocialMediaSearchProps) {
  const [target, setTarget] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SocialProfile[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const correlateSocialMedia = async () => {
    if (!target) return;
    
    setIsSearching(true);
    setResults([]);
    setSuggestions([]);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Perform an OSINT social media correlation for the target identifier: "${target}".
      Your goal is to find associated accounts on platforms like Twitter/X, LinkedIn, GitHub, Instagram, and specialized forums.
      
      Analyze potential profile links, common bio patterns, and shared identifiers.
      
      Return a JSON object with two fields:
      1. "profiles": An array of objects, each with:
         - platform: Name of the platform (e.g., "Twitter", "GitHub")
         - url: Full URL to the suspected profile
         - username: Username on that platform
         - bio: Short description found or inferred
         - confidence: "High", "Medium", or "Low"
         - reasoning: Brief sentence explaining why this is likely a match (e.g., "Identical handle", "Bio refers to [X]", "Links back to domain [Y]")
      2. "suggestions": An array of strings representing other potential leads (e.g., "Found mention of @alternate_handle", "Associated with email domain @example.com")
      
      Be realistic and provide high-confidence common OSINT patterns.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }]
        }
      });

      const data = JSON.parse(response.text || '{"profiles":[], "suggestions":[]}');
      setResults(data.profiles || []);
      setSuggestions(data.suggestions || []);
    } catch (err: any) {
      console.error("Social media correlation failed:", err);
      setError(err.message || "Failed to correlate social media accounts.");
    } finally {
      setIsSearching(false);
    }
  };

  const addProfileToInvestigation = (profile: SocialProfile) => {
    // Add to targets.other and entities
    const newEntity = {
      id: `soc_${Date.now()}`,
      label: `${profile.platform}: ${profile.username}`,
      type: 'user' as const,
      data: profile
    };

    onUpdateState({
      targets: {
        ...state.targets,
        usernames: [...new Set([...state.targets.usernames, profile.username])]
      },
      entities: [...state.entities, newEntity]
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-lg shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight uppercase">Social Media Correlator</h2>
            <p className="text-xs text-zinc-500 font-mono italic">Cross-platform profile linkage & identity resolution</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && correlateSocialMedia()}
              placeholder="Enter username (e.g., @johndoe) or email..."
              className="w-full bg-black border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-all placeholder:text-zinc-700"
            />
          </div>
          <button
            onClick={correlateSocialMedia}
            disabled={isSearching || !target}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all flex items-center gap-2 group"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            )}
            {isSearching ? "Correlating..." : "Correlate"}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-950/20 border border-red-900/50 rounded-lg flex items-center gap-2 text-red-400 text-xs font-mono">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Results List */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
            <Activity className="w-3 h-3" />
            Correlation Results
          </h3>
          
          <AnimatePresence mode="popLayout">
            {results.length > 0 ? (
              results.map((profile, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/50 p-4 rounded-xl transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold border border-zinc-700 group-hover:bg-blue-500/20 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all">
                        {profile.platform[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-200">{profile.platform}</span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest",
                            profile.confidence === 'High' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                            profile.confidence === 'Medium' ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                            "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                          )}>
                            {profile.confidence} Confidence
                          </span>
                        </div>
                        <span className="text-xs text-zinc-500 font-mono italic">@{profile.username}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addProfileToInvestigation(profile)}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
                        title="Add to investigation"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <a
                        href={profile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-zinc-800 hover:bg-blue-600 text-zinc-400 hover:text-white rounded-lg transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                  
                  {profile.bio && (
                    <p className="text-xs text-zinc-400 mb-3 line-clamp-2 italic border-l-2 border-zinc-800 pl-3">
                      "{profile.bio}"
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-[9px] text-zinc-500 bg-black/30 p-2 rounded-lg border border-zinc-800/50">
                    <Info className="w-3 h-3 text-blue-500" />
                    <span className="uppercase tracking-wider font-bold">Matching Logic:</span>
                    <span className="font-mono">{profile.reasoning}</span>
                  </div>
                </motion.div>
              ))
            ) : isSearching ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-zinc-900/50 animate-pulse rounded-xl border border-zinc-800" />
              ))
            ) : (
              <div className="p-12 border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-600 gap-3 italic text-sm">
                <Search className="w-8 h-8 opacity-20" />
                No correlation data available. Initialize scan above.
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Suggestions Sidebar */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
            <LinkIcon className="w-3 h-3" />
            Pivot Suggestions
          </h3>
          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl min-h-[200px]">
            {suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.map((suggestion, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-3 p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-lg hover:border-blue-500/30 transition-all cursor-pointer group"
                    onClick={() => setTarget(suggestion.split(' ').pop()?.replace(/[@]/g, '') || '')}
                  >
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 group-hover:scale-125 transition-transform" />
                    <span className="text-[10px] text-zinc-400 group-hover:text-zinc-200 transition-colors font-mono">
                      {suggestion}
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : isSearching ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-10 bg-zinc-900 rounded-lg" />
                <div className="h-10 bg-zinc-900 rounded-lg" />
                <div className="h-10 bg-zinc-900 rounded-lg" />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-[10px] text-zinc-700 italic text-center p-4">
                Execute correlation to identify potential pivoting vectors and linked identities.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
