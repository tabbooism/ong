import React, { useState } from 'react';
import { Key, Plus, Trash2, Link as LinkIcon, Copy, CheckCircle, Server, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InvestigationState, SSHKey } from '../types';

interface SSHKeyManagerProps {
  state: InvestigationState;
  onUpdateState: (newState: Partial<InvestigationState>) => void;
}

export function SSHKeyManager({ state, onUpdateState }: SSHKeyManagerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [targetToAssociate, setTargetToAssociate] = useState('');

  const generateKey = async () => {
    if (!newKeyName.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ssh/generate', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to generate key');
      
      const { publicKey, privateKey } = await response.json();
      
      const newKey: SSHKey = {
        id: `ssh_${Date.now()}`,
        name: newKeyName.trim(),
        publicKey,
        privateKey,
        associatedTargets: [],
        createdAt: new Date().toISOString()
      };

      onUpdateState({
        sshKeys: [...state.sshKeys, newKey]
      });
      setNewKeyName('');
    } catch (error: any) {
      console.error("Error generating SSH key:", error);
      alert(`Failed to generate SSH key: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteKey = (id: string) => {
    onUpdateState({
      sshKeys: state.sshKeys.filter(k => k.id !== id)
    });
    if (selectedKeyId === id) setSelectedKeyId(null);
  };

  const associateTarget = (keyId: string) => {
    if (!targetToAssociate.trim()) return;
    
    onUpdateState({
      sshKeys: state.sshKeys.map(k => {
        if (k.id === keyId) {
          return {
            ...k,
            associatedTargets: [...new Set([...k.associatedTargets, targetToAssociate.trim()])]
          };
        }
        return k;
      })
    });
    setTargetToAssociate('');
    setSelectedKeyId(null);
  };

  const removeTarget = (keyId: string, target: string) => {
    onUpdateState({
      sshKeys: state.sshKeys.map(k => {
        if (k.id === keyId) {
          return {
            ...k,
            associatedTargets: k.associatedTargets.filter(t => t !== target)
          };
        }
        return k;
      })
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const availableTargets = [...new Set([
    ...state.targets.domains,
    ...state.targets.other.filter(t => t.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) // IPs
  ])];

  return (
    <div className="bg-black border border-zinc-800 rounded-lg overflow-hidden flex flex-col md:flex-row">
      {/* Left Panel: Key Generation & List */}
      <div className="w-full md:w-1/2 bg-zinc-950 p-4 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col">
        <div className="flex items-center gap-2 mb-4 text-zinc-300">
          <Key className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-bold uppercase tracking-widest">SSH Key Management</h3>
        </div>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key Name (e.g., prod-access)"
            className="flex-1 bg-black border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-300 focus:border-emerald-500 focus:outline-none transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && generateKey()}
          />
          <button
            onClick={generateKey}
            disabled={isGenerating || !newKeyName.trim()}
            className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : <><Plus className="w-3 h-3" /> Generate</>}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
          {state.sshKeys.length === 0 ? (
            <div className="text-xs text-zinc-600 italic text-center py-8">
              No SSH keys generated yet.
            </div>
          ) : (
            <AnimatePresence>
              {state.sshKeys.map(key => (
                <motion.div
                  key={key.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-black border border-zinc-800 rounded p-3"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-xs font-bold text-zinc-200">{key.name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-1">
                        Created: {new Date(key.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSelectedKeyId(selectedKeyId === key.id ? null : key.id)}
                        className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                        title="Associate Target"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteKey(key.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                        title="Delete Key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-zinc-900 p-2 rounded border border-zinc-800 group">
                    <div className="flex-1 truncate font-mono text-[10px] text-zinc-400">
                      {key.publicKey.substring(0, 40)}...
                    </div>
                    <button
                      onClick={() => copyToClipboard(key.publicKey, key.id)}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Copy Public Key"
                    >
                      {copiedKeyId === key.id ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {key.associatedTargets.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Associated Targets</div>
                      <div className="flex flex-wrap gap-1">
                        {key.associatedTargets.map(target => (
                          <span key={target} className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-mono">
                            <Server className="w-2.5 h-2.5" />
                            {target}
                            <button onClick={() => removeTarget(key.id, target)} className="hover:text-red-400 ml-1">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedKeyId === key.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-zinc-800 flex gap-2"
                    >
                      <select
                        value={targetToAssociate}
                        onChange={(e) => setTargetToAssociate(e.target.value)}
                        className="flex-1 bg-black border border-zinc-800 rounded p-1.5 text-xs font-mono text-zinc-300 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select Target...</option>
                        {availableTargets.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => associateTarget(key.id)}
                        disabled={!targetToAssociate}
                        className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                      >
                        Link
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Right Panel: Private Key View (Mocked for security in real app, but shown here for demo) */}
      <div className="w-full md:w-1/2 bg-black p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-4 text-zinc-500 border-b border-zinc-800 pb-2">
          <Key className="w-4 h-4" />
          <span className="text-[10px] font-mono uppercase tracking-widest">Private Key Viewer</span>
        </div>
        
        <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-4 overflow-y-auto custom-scrollbar relative group">
          {state.sshKeys.length > 0 ? (
            <>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => copyToClipboard(state.sshKeys[0].privateKey, 'private')}
                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition-colors"
                  title="Copy Private Key"
                >
                  {copiedKeyId === 'private' ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="text-[10px] font-mono text-zinc-500 whitespace-pre-wrap break-all">
                {state.sshKeys[0].privateKey}
              </pre>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-700 italic">
              Select or generate a key to view details.
            </div>
          )}
        </div>
        {state.sshKeys.length > 0 && (
          <div className="mt-2 text-[10px] text-red-500/70 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            Warning: Private keys are shown for demonstration purposes. Never share them.
          </div>
        )}
      </div>
    </div>
  );
}
