import React, { useState, useRef, useEffect } from 'react';
import {
  Layers, Upload, FileText, X, Send, Loader2, Copy, Check,
  Download, AlertCircle, ChevronRight, Users, Settings2,
  ArrowLeft, Plus, ExternalLink, CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { generateOutline, saveKey, loadKey, isConnected, hasSharedKey } from './services/aiService';
import {
  PROVIDERS, DEFAULT_PROVIDER, DEFAULT_MODEL_BY_PROVIDER,
  type ProviderId, type ProviderDef, type ModelDef,
} from './services/providers';
import { cn } from './utils';

const AUDIENCES = [
  { id: 'managers',   label: 'Managers / Supervisors', short: 'Managers' },
  { id: 'ceo',        label: 'CEO / President',         short: 'CEO' },
  { id: 'cfo',        label: 'CFO / Finance',           short: 'CFO' },
  { id: 'compliance', label: 'Compliance / Legal',      short: 'Compliance' },
  { id: 'it',         label: 'IT / Technology',         short: 'IT' },
  { id: 'board',      label: 'Board of Directors',      short: 'Board' },
  { id: 'hr',         label: 'HR / People Team',        short: 'HR' },
  { id: 'ops',        label: 'Operations Leadership',   short: 'Ops' },
];

const PRESENTATION_TYPES = [
  { id: 'status',      label: 'Status Update' },
  { id: 'strategic',   label: 'Strategic Initiative' },
  { id: 'risk',        label: 'Risk Review' },
  { id: 'compliance',  label: 'Compliance Report' },
  { id: 'operational', label: 'Operational Review' },
  { id: 'change',      label: 'Change Management Brief' },
  { id: 'budget',      label: 'Budget / Financial Review' },
  { id: 'incident',    label: 'Incident / Post-Mortem' },
];

const SPEED_COLOR: Record<string, string> = {
  Fast:      'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Balanced:  'text-blue-400 bg-blue-400/10 border-blue-400/20',
  Thorough:  'text-violet-400 bg-violet-400/10 border-violet-400/20',
};

// ── Connect Modal ─────────────────────────────────────────────────────────────

function ConnectModal({
  provider,
  onSave,
  onClose,
}: {
  provider: ProviderDef;
  onSave: (key: string) => void;
  onClose: () => void;
}) {
  const [key, setKey] = useState(loadKey(provider.id));
  const [show, setShow] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="text-2xl">{provider.logo}</div>
          <div>
            <h2 className="text-base font-bold text-white">Connect {provider.label}</h2>
            <p className="text-xs text-slate-400">{provider.tagline}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-5">
          <div className="flex gap-3 p-3 bg-slate-800 rounded-xl">
            <span className="text-[10px] font-mono font-bold text-blue-400 mt-0.5 shrink-0">01</span>
            <div className="text-xs text-slate-300 leading-relaxed">
              {provider.keyHelpText}.{' '}
              <a
                href={provider.keyHelpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-0.5"
              >
                Open <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-slate-800 rounded-xl">
            <span className="text-[10px] font-mono font-bold text-blue-400 mt-0.5 shrink-0">02</span>
            <p className="text-xs text-slate-300">Copy your key and paste it below.</p>
          </div>
          <div className="flex gap-3 p-3 bg-slate-800 rounded-xl">
            <span className="text-[10px] font-mono font-bold text-blue-400 mt-0.5 shrink-0">03</span>
            <p className="text-xs text-slate-300">
              Your key is stored <strong className="text-white">only in this browser</strong> — never sent anywhere except the AI provider's API.
            </p>
          </div>
        </div>

        {/* Key input */}
        <label className="block text-xs font-medium text-slate-400 mb-1.5">{provider.keyLabel}</label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={provider.keyPlaceholder}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[10px] font-mono"
          >
            {show ? 'hide' : 'show'}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {loadKey(provider.id) && (
            <button
              onClick={() => { saveKey(provider.id, ''); onSave(''); onClose(); }}
              className="px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/50 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-colors ml-auto"
          >
            Cancel
          </button>
          <button
            onClick={() => { saveKey(provider.id, key.trim()); onSave(key.trim()); onClose(); }}
            disabled={!key.trim()}
            className={cn(
              'px-4 py-2 text-xs font-bold rounded-lg transition-all',
              key.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            )}
          >
            Save & Connect
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Model Card ────────────────────────────────────────────────────────────────

function ModelCard({
  model,
  selected,
  onClick,
}: {
  model: ModelDef;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-xl border transition-all',
        selected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{model.label}</span>
            {model.badge && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {model.badge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{model.description}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={cn('text-[10px] font-mono px-1.5 py-0.5 rounded border', SPEED_COLOR[model.speed])}>
              {model.speed}
            </span>
            <span className="text-[10px] font-mono text-slate-500">{model.contextWindow} context</span>
          </div>
        </div>
        <div className={cn(
          'w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center',
          selected ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
        )}>
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
      </div>
    </button>
  );
}

// ── Settings Panel (provider + model) ────────────────────────────────────────

function SettingsPanel({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  connectedMap,
  onConnectRequest,
}: {
  selectedProvider: ProviderId;
  selectedModel: string;
  onProviderChange: (p: ProviderId) => void;
  onModelChange: (m: string) => void;
  connectedMap: Record<ProviderId, boolean>;
  onConnectRequest: (p: ProviderId) => void;
}) {
  const provider = PROVIDERS.find(p => p.id === selectedProvider)!;
  const connected = connectedMap[selectedProvider];

  return (
    <div className="max-w-7xl mx-auto pt-4 pb-3">

      {/* Provider tabs */}
      <div className="flex items-center gap-1 mb-4">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => onProviderChange(p.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
              selectedProvider === p.id
                ? 'bg-white/10 border-white/20 text-white'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            <span>{p.logo}</span>
            {p.label}
            {connectedMap[p.id] && (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            )}
          </button>
        ))}
      </div>

      {/* Connection status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', connected ? 'bg-emerald-400' : 'bg-slate-600')} />
          <span className="text-xs text-slate-400">
            {connected ? `${provider.label} connected` : `${provider.label} not connected`}
          </span>
          {selectedProvider === 'gemini' && !connected && (
            <span className="text-[10px] text-slate-500">(using built-in key)</span>
          )}
        </div>
        <button
          onClick={() => onConnectRequest(selectedProvider)}
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-lg border transition-all',
            connected
              ? 'text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'
              : 'text-blue-400 border-blue-500/40 hover:bg-blue-500/10'
          )}
        >
          {connected ? 'Manage key' : 'Connect'}
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Model cards */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {provider.models.map((m) => (
          <ModelCard
            key={m.id}
            model={m}
            selected={selectedModel === m.id}
            onClick={() => onModelChange(m.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [primaryContent, setPrimaryContent]     = useState('');
  const [executiveContext, setExecutiveContext]  = useState('');
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [presentationType, setPresentationType] = useState(PRESENTATION_TYPES[0].id);
  const [uploadedFiles, setUploadedFiles]       = useState<Array<{ name: string; size: number }>>([]);

  const [selectedProvider, setSelectedProvider] = useState<ProviderId>(DEFAULT_PROVIDER);
  const [selectedModel, setSelectedModel]       = useState(DEFAULT_MODEL_BY_PROVIDER[DEFAULT_PROVIDER]);
  const [showSettings, setShowSettings]         = useState(false);
  const [connectTarget, setConnectTarget]       = useState<ProviderId | null>(null);
  const [connectedMap, setConnectedMap]         = useState<Record<ProviderId, boolean>>({
    gemini: false, claude: false, openai: false,
  });

  const [isGenerating, setIsGenerating]         = useState(false);
  const [outline, setOutline]                   = useState<string | null>(null);
  const [error, setError]                       = useState<string | null>(null);
  const [copied, setCopied]                     = useState(false);
  const [sharedKeyDismissed, setSharedKeyDismissed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputRef    = useRef<HTMLDivElement>(null);

  // Sync connected state from localStorage on mount
  useEffect(() => {
    setConnectedMap({
      gemini: isConnected('gemini'),
      claude: isConnected('claude'),
      openai: isConnected('openai'),
    });
  }, []);

  const handleProviderChange = (p: ProviderId) => {
    setSelectedProvider(p);
    setSelectedModel(DEFAULT_MODEL_BY_PROVIDER[p]);
  };

  const handleConnectionSaved = (provider: ProviderId) => {
    setConnectedMap(prev => ({ ...prev, [provider]: isConnected(provider) }));
  };

  const toggleAudience = (id: string) => {
    setSelectedAudiences(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const MAX_FILES = 20;
    const MAX_BYTES = 5 * 1024 * 1024;
    const allowedExtensions = ['.txt', '.md', '.csv', '.log'];

    if (files.length > MAX_FILES) {
      setError(`Too many files. Maximum is ${MAX_FILES}.`);
      e.target.value = '';
      return;
    }
    const invalid = files.find(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return !allowedExtensions.includes(ext);
    });
    if (invalid) {
      setError(`"${invalid.name}" not supported. Use .txt, .md, or .csv.`);
      e.target.value = '';
      return;
    }
    const total = files.reduce((s, f) => s + f.size, 0);
    if (total > MAX_BYTES) {
      setError(`Combined size ${(total / 1024 / 1024).toFixed(1)} MB exceeds 5 MB limit.`);
      e.target.value = '';
      return;
    }

    setError(null);
    let done = 0;
    const results: string[] = new Array(files.length).fill('');
    files.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = ev => {
        results[i] = `--- ${file.name} ---\n${ev.target?.result as string}`;
        if (++done === files.length) {
          setPrimaryContent(results.join('\n\n'));
          setUploadedFiles(files.map(f => ({ name: f.name, size: f.size })));
        }
      };
      reader.onerror = () => setError(`Failed to read "${file.name}".`);
      reader.readAsText(file);
    });
    e.target.value = '';
  };

  const clearFile = (name?: string) => {
    if (!name || uploadedFiles.length <= 1) {
      setPrimaryContent('');
      setUploadedFiles([]);
    } else {
      setUploadedFiles(prev => prev.filter(f => f.name !== name));
      const sections = primaryContent.split(/\n\n(?=--- .+ ---\n)/);
      setPrimaryContent(sections.filter(s => !s.startsWith(`--- ${name} ---`)).join('\n\n'));
    }
  };

  const handleGenerate = async () => {
    if (!primaryContent.trim()) { setError('Please add primary content.'); return; }
    if (!selectedAudiences.length) { setError('Select at least one audience.'); return; }

    setIsGenerating(true);
    setError(null);
    setOutline(null);

    try {
      const result = await generateOutline({
        primaryContent,
        executiveContext,
        audiences: selectedAudiences.map(id => AUDIENCES.find(a => a.id === id)?.label || id),
        presentationType: PRESENTATION_TYPES.find(t => t.id === presentationType)?.label || presentationType,
        provider: selectedProvider,
        model: selectedModel,
      });
      setOutline(result || 'No output returned.');
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!outline) return;
    navigator.clipboard.writeText(outline);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadOutline = () => {
    if (!outline) return;
    const blob = new Blob([outline], { type: 'text/markdown' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `PROCTOR-outline-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeProvider   = PROVIDERS.find(p => p.id === selectedProvider)!;
  const activeModel      = activeProvider.models.find(m => m.id === selectedModel);
  const canGenerate      = primaryContent.trim().length > 0 && selectedAudiences.length > 0;
  const showSharedBanner = !connectedMap[selectedProvider] && hasSharedKey(selectedProvider) && !sharedKeyDismissed;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">

      {/* ── Header ── */}
      <header className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-10 border-b border-slate-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <a href="/" className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </a>
            <div className="w-px h-5 bg-slate-700" />
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Layers className="text-blue-400 w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">PROCTOR</h1>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Presentation Report & Outline Construction Tool
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(s => !s)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg"
            >
              <span className="text-sm">{activeProvider.logo}</span>
              <span className="hidden sm:inline">{activeModel?.label ?? activeProvider.label}</span>
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showSettings && 'rotate-180')} />
            </button>
            {outline && (
              <>
                <div className="w-px h-4 bg-slate-700" />
                <button
                  onClick={() => { setOutline(null); setError(null); }}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New
                </button>
              </>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-800 mt-3"
            >
              <SettingsPanel
                selectedProvider={selectedProvider}
                selectedModel={selectedModel}
                onProviderChange={handleProviderChange}
                onModelChange={setSelectedModel}
                connectedMap={connectedMap}
                onConnectRequest={p => setConnectTarget(p)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Connect Modal ── */}
      <AnimatePresence>
        {connectTarget && (
          <ConnectModal
            provider={PROVIDERS.find(p => p.id === connectTarget)!}
            onSave={() => handleConnectionSaved(connectTarget)}
            onClose={() => setConnectTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Shared-key notice ── */}
      <AnimatePresence>
        {showSharedBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-blue-950/60 border-b border-blue-800/50"
          >
            <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center gap-3 flex-wrap">
              <span className="text-blue-300 text-[11px]">✦</span>
              <p className="text-[11px] text-blue-200 flex-1 leading-relaxed">
                Running on PROCTOR's shared Gemini key — may hit rate limits under heavy use.
                <button
                  onClick={() => setConnectTarget('gemini')}
                  className="ml-1.5 underline underline-offset-2 text-blue-300 hover:text-white transition-colors"
                >
                  Use your own free key
                </button>{' '}
                for private, unlimited access.
              </p>
              <button
                onClick={() => setSharedKeyDismissed(true)}
                className="text-blue-500 hover:text-blue-300 transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Inputs */}
        <div className="lg:col-span-5 space-y-5">

          {/* Primary Content */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">01 · Primary Content</h2>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {uploadedFiles.length > 0 && (
                  uploadedFiles.length === 1 ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      <FileText className="w-3 h-3" />
                      {uploadedFiles[0].name}
                      <button onClick={() => clearFile(uploadedFiles[0].name)} className="ml-0.5 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      <FileText className="w-3 h-3" />
                      {uploadedFiles.length} files
                      <button onClick={() => clearFile()} className="ml-0.5 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-400 rounded-lg px-2.5 py-1 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload File
                </button>
                <input ref={fileInputRef} type="file" accept=".txt,.md,.csv,.log" multiple onChange={handleFileUpload} className="hidden" />
              </div>
            </div>
            <div className="p-4">
              <p className="text-[11px] text-slate-400 mb-2">
                Paste or upload raw materials. Supports <span className="font-mono">.txt .md .csv</span> — up to <span className="font-mono">20 files / 5 MB</span> combined.
              </p>
              <textarea
                value={primaryContent}
                onChange={e => { setPrimaryContent(e.target.value); setUploadedFiles([]); }}
                placeholder="Paste meeting notes, reports, emails, policy excerpts, or any raw content here…"
                className="w-full h-52 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
              <p className="text-right text-[10px] text-slate-400 font-mono mt-1">{primaryContent.length.toLocaleString()} characters</p>
            </div>
          </section>

          {/* Executive Context */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">02 · Executive Context</h2>
              <span className="ml-auto text-[10px] text-slate-400 italic">Optional</span>
            </div>
            <div className="p-4">
              <p className="text-[11px] text-slate-400 mb-2">Strategic priorities, leadership directives, or framing context.</p>
              <textarea
                value={executiveContext}
                onChange={e => setExecutiveContext(e.target.value)}
                placeholder="e.g., 'Q3 focus is cost reduction and operational efficiency…'"
                className="w-full h-28 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </section>

          {/* Audience & Type */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">03 · Audience & Type</h2>
            </div>
            <div className="p-4 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Target Audience <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {AUDIENCES.map(a => {
                    const active = selectedAudiences.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggleAudience(a.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                          active ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                        )}
                      >
                        {a.short}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Presentation Type</label>
                <select
                  value={presentationType}
                  onChange={e => setPresentationType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  {PRESENTATION_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 text-red-700 font-mono text-xs bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className={cn(
              'w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-sm transition-all',
              canGenerate && !isGenerating
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-[0.98]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            )}
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 animate-spin" />Building Presentation Blueprint…</>
            ) : (
              <><Send className="w-5 h-5" />Generate Presentation Outline</>
            )}
          </button>

          {/* Active model pill */}
          {!isGenerating && (
            <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-slate-400">
              <span>{activeProvider.logo}</span>
              <span>{activeProvider.label} · {activeModel?.label ?? selectedModel}</span>
              <button
                onClick={() => setShowSettings(s => !s)}
                className="text-slate-500 hover:text-blue-500 transition-colors"
              >
                <Settings2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Output */}
        <div className="lg:col-span-7" ref={outputRef}>
          <AnimatePresence mode="wait">
            {isGenerating && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Building your presentation blueprint…</p>
                  <p className="text-sm text-slate-400 mt-1">
                    {activeProvider.logo} {activeProvider.label} · {activeModel?.label}
                  </p>
                </div>
                <div className="flex gap-1 flex-wrap justify-center mt-2">
                  {['Analyzing content', 'Structuring outline', 'Tailoring to audience'].map(step => (
                    <span key={step} className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{step}</span>
                  ))}
                </div>
              </motion.div>
            )}

            {outline && !isGenerating && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between sticky top-[73px] z-10">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">Presentation Blueprint</h3>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      {activeProvider.logo} {activeProvider.label} · {activeModel?.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-400 px-2.5 py-1.5 rounded-lg transition-all"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={downloadOutline}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-400 px-2.5 py-1.5 rounded-lg transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                    <button
                      onClick={() => { setOutline(null); setError(null); }}
                      className="flex items-center gap-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      New
                    </button>
                  </div>
                </div>
                <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                  <div className="markdown-body text-sm leading-relaxed">
                    <ReactMarkdown>{outline}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            )}

            {!outline && !isGenerating && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white rounded-xl border border-dashed border-slate-300 p-16 flex flex-col items-center justify-center text-center space-y-5"
              >
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                  <Layers className="w-8 h-8 text-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-400 text-lg">Awaiting Content</p>
                  <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                    Add your raw content, select your audience, and PROCTOR will build a structured leadership presentation outline.
                  </p>
                </div>
                {/* Provider quick-select */}
                <div className="flex gap-2 mt-2">
                  {PROVIDERS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleProviderChange(p.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all',
                        selectedProvider === p.id
                          ? 'border-blue-300 bg-blue-50 text-blue-600 font-semibold'
                          : 'border-slate-200 text-slate-500 hover:border-slate-400'
                      )}
                    >
                      {p.logo} {p.label}
                      {connectedMap[p.id] && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-left mt-2 max-w-sm w-full">
                  {[['01', 'Paste or upload primary content'], ['02', 'Add executive context (optional)'], ['03', 'Select target audience'], ['04', 'Generate your blueprint']].map(([n, t]) => (
                    <div key={n} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-mono font-bold text-blue-400 mt-0.5">{n}</span>
                      <span className="text-xs text-slate-500 leading-snug">{t}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-6 py-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-slate-400 bg-white">
        <span>PROCTOR · Presentation Outline Engine</span>
        <a href="/" className="hover:text-slate-600 transition-colors">← JAXX Suite</a>
      </footer>
    </div>
  );
}
