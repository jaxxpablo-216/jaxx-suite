import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Layout, Layers, ArrowRight, Zap, ExternalLink,
  X, CheckCircle2, Check, ChevronDown, BookOpen, Key,
  Info, Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import {
  PROVIDERS, DEFAULT_PROVIDER, DEFAULT_MODEL_BY_PROVIDER,
  type ProviderId, type ProviderDef, type ModelDef,
} from './services/providers';
import {
  saveKey, loadKey, isConnected, saveSelection, loadSelection, hasSharedGeminiKey,
} from './services/aiStore';
import { LoginScreen } from './components/LoginScreen';
import { AdminPortal } from './components/AdminPortal';
import { Employee, getSession, clearSession } from './services/auth';

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(...inputs));
}

// ── Speed badge colours ────────────────────────────────────────────────────────
const SPEED_COLOR: Record<string, string> = {
  Fast:     'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Balanced: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  Thorough: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
};

// ── Connect Modal ──────────────────────────────────────────────────────────────
function ConnectModal({
  provider, onSave, onClose,
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
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="text-2xl">{provider.logo}</div>
          <div>
            <h2 className="text-base font-bold text-white">Connect {provider.label}</h2>
            <p className="text-xs text-neutral-400">{provider.tagline}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-neutral-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex gap-3 p-3 bg-neutral-800 rounded-xl">
            <span className="text-[10px] font-mono font-bold text-blue-400 mt-0.5 shrink-0">01</span>
            <div className="text-xs text-neutral-300 leading-relaxed">
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
          <div className="flex gap-3 p-3 bg-neutral-800 rounded-xl">
            <span className="text-[10px] font-mono font-bold text-blue-400 mt-0.5 shrink-0">02</span>
            <p className="text-xs text-neutral-300">Copy your key and paste it below.</p>
          </div>
          <div className="flex gap-3 p-3 bg-neutral-800 rounded-xl">
            <span className="text-[10px] font-mono font-bold text-blue-400 mt-0.5 shrink-0">03</span>
            <p className="text-xs text-neutral-300">
              Your key is stored <strong className="text-white">only in this browser</strong> — never sent anywhere except the AI provider's API.
            </p>
          </div>
        </div>

        <label className="block text-xs font-medium text-neutral-400 mb-1.5">{provider.keyLabel}</label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={provider.keyPlaceholder}
            className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 pr-10 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-[10px] font-mono"
          >
            {show ? 'hide' : 'show'}
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          {loadKey(provider.id) && (
            <button
              onClick={() => { saveKey(provider.id, ''); onSave(''); onClose(); }}
              className="px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/50 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white border border-neutral-700 rounded-lg transition-colors ml-auto">
            Cancel
          </button>
          <button
            onClick={() => { saveKey(provider.id, key.trim()); onSave(key.trim()); onClose(); }}
            disabled={!key.trim()}
            className={cn(
              'px-4 py-2 text-xs font-bold rounded-lg transition-all',
              key.trim() ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
            )}
          >
            Save & Connect
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Model Card ─────────────────────────────────────────────────────────────────
function ModelCard({ model, selected, onClick }: { model: ModelDef; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-xl border transition-all',
        selected ? 'border-blue-500 bg-blue-500/10' : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-500'
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
          <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">{model.description}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={cn('text-[10px] font-mono px-1.5 py-0.5 rounded border', SPEED_COLOR[model.speed])}>
              {model.speed}
            </span>
            <span className="text-[10px] font-mono text-neutral-500">{model.contextWindow} context</span>
          </div>
        </div>
        <div className={cn(
          'w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center',
          selected ? 'border-blue-500 bg-blue-500' : 'border-neutral-600'
        )}>
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
      </div>
    </button>
  );
}

// ── Provider Setup Section ─────────────────────────────────────────────────────
function ProviderSetup({
  selectedProvider, selectedModel, connectedMap,
  onProviderChange, onModelChange, onConnectRequest, onSaved,
}: {
  selectedProvider: ProviderId;
  selectedModel: string;
  connectedMap: Record<ProviderId, boolean>;
  onProviderChange: (p: ProviderId) => void;
  onModelChange: (m: string) => void;
  onConnectRequest: (p: ProviderId) => void;
  onSaved: () => void;
}) {
  const provider   = PROVIDERS.find(p => p.id === selectedProvider)!;
  const connected  = connectedMap[selectedProvider];
  const isGemini   = selectedProvider === 'gemini';
  const sharedAvail = isGemini && hasSharedGeminiKey();

  return (
    <div className="space-y-4">
      {/* Provider tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => onProviderChange(p.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
              selectedProvider === p.id
                ? 'bg-white/10 border-white/20 text-white'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/5'
            )}
          >
            <span>{p.logo}</span>
            {p.label}
            {connectedMap[p.id] && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </button>
        ))}
      </div>

      {/* Gemini shared key notice */}
      {isGemini && sharedAvail && !connected && (
        <div className="flex items-center gap-2 p-2.5 bg-blue-950/40 border border-blue-800/40 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
          <p className="text-[11px] text-blue-300 flex-1">
            JAXX shared Gemini key active — may rate-limit under heavy use.
          </p>
          <button
            onClick={() => onConnectRequest('gemini')}
            className="text-[10px] font-medium text-blue-400 hover:text-blue-200 whitespace-nowrap"
          >
            Use own key →
          </button>
        </div>
      )}

      {/* Connection row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', (connected || sharedAvail) ? 'bg-emerald-400' : 'bg-neutral-600')} />
          <span className="text-xs text-neutral-400">
            {connected
              ? `${provider.label} connected (your key)`
              : sharedAvail
              ? `${provider.label} available via shared key`
              : `${provider.label} — API key required`}
          </span>
        </div>
        <button
          onClick={() => onConnectRequest(selectedProvider)}
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-lg border transition-all',
            connected
              ? 'text-neutral-400 border-neutral-700 hover:border-neutral-500 hover:text-white'
              : 'text-blue-400 border-blue-500/40 hover:bg-blue-500/10'
          )}
        >
          {connected ? 'Manage key' : 'Connect'}
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Model cards */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
        {provider.models.map((m) => (
          <ModelCard
            key={m.id}
            model={m}
            selected={selectedModel === m.id}
            onClick={() => onModelChange(m.id)}
          />
        ))}
      </div>

      {/* Save */}
      <button
        onClick={onSaved}
        className="w-full py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-[0.98]"
      >
        Save Preference — Apply to All Tools
      </button>
    </div>
  );
}

// ── Help & Guide Section ───────────────────────────────────────────────────────
const GUIDE_STEPS = [
  {
    n: '01',
    title: 'Connect your AI provider',
    body: 'Pick Gemini, Claude, or OpenAI above and save your API key. It\'s stored only in your browser — never on our servers. Gemini works out of the box via our shared key if you prefer.',
  },
  {
    n: '02',
    title: 'Choose your model',
    body: 'Select the model that fits your workload. "Recommended" badges indicate the best speed-to-quality ratio for each tool\'s typical task.',
  },
  {
    n: '03',
    title: 'Open any tool',
    body: 'Launch Re:CORE, BRIDGE, or PROCTOR. Your provider, model, and API key carry over automatically — no re-entry needed.',
  },
  {
    n: '04',
    title: 'Generate',
    body: 'Each tool takes different inputs (draft reply, exec notes, raw content) and produces structured, leadership-ready output in seconds.',
  },
];

const APP_TIPS = [
  {
    name: 'Re:CORE',
    color: 'text-emerald-400',
    border: 'border-emerald-500/20',
    tips: [
      'Paste both the original message and your draft reply for the most accurate audit.',
      'Try multiple reviewer personas on the same draft to catch different risk angles.',
      'Use the Compliance Officer persona before any external-facing communication.',
    ],
  },
  {
    name: 'BRIDGE',
    color: 'text-amber-400',
    border: 'border-amber-500/20',
    tips: [
      'Even a single bullet point of exec context produces a full rollout framework.',
      'The manager training modules section is ideal for pre-all-hands prep.',
      'Download the output as Markdown to paste directly into Notion or Confluence.',
    ],
  },
  {
    name: 'PROCTOR',
    color: 'text-blue-400',
    border: 'border-blue-500/20',
    tips: [
      'Upload up to 20 files (.txt, .md, .csv) as raw source material in one go.',
      'Select multiple audiences to get a blended outline covering all stakeholders.',
      'The Executive Context box is where you add leadership framing — use it.',
    ],
  },
];

function HelpGuide() {
  const [open, setOpen] = useState(false);
  return (
    <section className="border-t border-neutral-800">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-neutral-900/40 transition-colors"
      >
        <div className="flex items-center gap-2 text-neutral-400">
          <BookOpen className="w-4 h-4" />
          <span className="text-xs font-mono uppercase tracking-widest">Help &amp; Usage Guide</span>
        </div>
        <ChevronDown className={cn('w-4 h-4 text-neutral-500 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-10 max-w-6xl mx-auto space-y-10">

              {/* Quick start */}
              <div>
                <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-widest mb-4">Quick Start</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {GUIDE_STEPS.map((s) => (
                    <div key={s.n} className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                      <span className="text-[10px] font-mono font-bold text-blue-400 block mb-2">{s.n}</span>
                      <p className="text-sm font-semibold text-white mb-1.5">{s.title}</p>
                      <p className="text-[12px] text-neutral-400 leading-relaxed">{s.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per-app tips */}
              <div>
                <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-widest mb-4">Tool Tips</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {APP_TIPS.map((app) => (
                    <div key={app.name} className={cn('p-4 bg-neutral-900 border rounded-xl', app.border)}>
                      <p className={cn('text-xs font-bold uppercase tracking-wider mb-3', app.color)}>{app.name}</p>
                      <ul className="space-y-2">
                        {app.tips.map((tip, i) => (
                          <li key={i} className="flex gap-2 text-[12px] text-neutral-400 leading-relaxed">
                            <span className={cn('mt-0.5 shrink-0', app.color)}>→</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy note */}
              <div className="flex items-start gap-3 p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <Lock className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-neutral-300">API Key Privacy</p>
                  <p className="text-[12px] text-neutral-500 leading-relaxed">
                    Your API keys are stored exclusively in your browser's <code className="font-mono text-neutral-400">localStorage</code> under <code className="font-mono text-neutral-400">jaxx_key_*</code> keys.
                    They are never transmitted to JAXX servers — only sent directly to the AI provider's API endpoint when you generate output.
                    Clearing your browser storage removes all keys. Each tool also lets you disconnect a provider individually.
                  </p>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ── App cards data ─────────────────────────────────────────────────────────────
const APPS = [
  {
    id: 'recore',
    name: 'Re:CORE',
    fullName: 'Revised Communications Oversight & Review Engine',
    description:
      'A high-stakes communications audit engine. Paste any draft reply and receive an AI-powered review covering tone, compliance, PII exposure, policy alignment, and risk flags — with three polished rewrite variants and audience-specific messaging, across six professional reviewer personas.',
    href: '/ReCORE/',
    icon: ShieldCheck,
    accent: 'emerald',
    tag: 'Compliance & Quality',
    features: ['Tone & compliance audit', '6 reviewer personas', 'Suggested rewrites', 'Escalation detection'],
    keyProvider: 'gemini' as ProviderId,
  },
  {
    id: 'bridge',
    name: 'BRIDGE',
    fullName: 'Business Rollout Intelligence & Directive Guidance Engine',
    description:
      'A strategic leadership rollout engine. Transform brief executive notes or directives into a comprehensive change-management framework — complete with communication cascade plans, manager toolkits, scenario-based training modules, and a frontline feedback system.',
    href: '/bridge/',
    icon: Layout,
    accent: 'amber',
    tag: 'Change Management',
    features: ['Communication cascade', 'Manager toolkit', 'Risk mitigation plan', 'Rollout timeline'],
    keyProvider: 'gemini' as ProviderId,
  },
  {
    id: 'proctor',
    name: 'PROCTOR',
    fullName: 'Presentation Report & Outline Construction Tool',
    description:
      'A presentation architecture engine. Upload raw content, reports, or meeting notes alongside executive context, select your leadership audience, and instantly receive a structured, audience-tailored presentation outline — complete with talking points, anticipated Q&A, and a readiness checklist.',
    href: '/proctor/',
    icon: Layers,
    accent: 'blue',
    tag: 'Presentation Design',
    features: ['File & text input', 'Audience targeting', 'Structured outline', 'Q&A preparation'],
    keyProvider: null,
  },
];

const accentMap: Record<string, { bg: string; border: string; text: string; badge: string; icon: string; btn: string; ready: string }> = {
  emerald: {
    bg:     'bg-emerald-500/10',
    border: 'border-emerald-500/30 hover:border-emerald-400/60',
    text:   'text-emerald-400',
    badge:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    icon:   'bg-emerald-500/15 text-emerald-400',
    btn:    'bg-emerald-500 hover:bg-emerald-400 text-neutral-950',
    ready:  'text-emerald-400',
  },
  amber: {
    bg:     'bg-amber-500/10',
    border: 'border-amber-500/30 hover:border-amber-400/60',
    text:   'text-amber-400',
    badge:  'bg-amber-500/15 text-amber-400 border-amber-500/25',
    icon:   'bg-amber-500/15 text-amber-400',
    btn:    'bg-amber-500 hover:bg-amber-400 text-neutral-950',
    ready:  'text-amber-400',
  },
  blue: {
    bg:     'bg-blue-500/10',
    border: 'border-blue-500/30 hover:border-blue-400/60',
    text:   'text-blue-400',
    badge:  'bg-blue-500/15 text-blue-400 border-blue-500/25',
    icon:   'bg-blue-500/15 text-blue-400',
    btn:    'bg-blue-500 hover:bg-blue-400 text-white',
    ready:  'text-blue-400',
  },
};

// ── Main App ───────────────────────────────────────────────────────────────────
export default function App() {
  const saved = loadSelection();
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>(saved?.provider ?? DEFAULT_PROVIDER);
  const [selectedModel,    setSelectedModel]    = useState(saved?.model ?? DEFAULT_MODEL_BY_PROVIDER[DEFAULT_PROVIDER]);
  const [connectedMap,     setConnectedMap]     = useState<Record<ProviderId, boolean>>({
    gemini: false, claude: false, openai: false,
  });
  const [connectTarget, setConnectTarget] = useState<ProviderId | null>(null);
  const [setupOpen,     setSetupOpen]     = useState(false);
  const [saved2,        setSaved2]        = useState(false);

  const [activeUser, setActiveUser] = useState<Employee | null>(getSession);
  const [activeTab, setActiveTab] = useState<'tools' | 'admin'>('tools');

  const handleLogout = () => {
    clearSession();
    setActiveUser(null);
  };

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

  const handleSaveSelection = () => {
    saveSelection(selectedProvider, selectedModel);
    setSaved2(true);
    setTimeout(() => setSaved2(false), 2000);
  };

  const activeProvider = PROVIDERS.find(p => p.id === selectedProvider)!;
  const activeModel    = activeProvider.models.find(m => m.id === selectedModel);
  const anyConnected   = Object.values(connectedMap).some(Boolean) || hasSharedGeminiKey();

  if (!activeUser) {
    return <LoginScreen onLogin={emp => { setActiveUser(emp); handleConnectionSaved('gemini'); }} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">

      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-5 sticky top-0 z-10 bg-neutral-950/95 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
              <Zap className="w-4 h-4 text-neutral-950" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">JAXX Suite</span>
              <span className="ml-2 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                Enterprise AI Tools
              </span>
            </div>
            
            {activeUser.role === 'Superadmin' && (
              <div className="ml-6 flex items-center gap-2 bg-neutral-900 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('tools')}
                  className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-colors", activeTab === 'tools' ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300")}
                >
                  Suite
                </button>
                <button
                  onClick={() => setActiveTab('admin')}
                  className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-colors", activeTab === 'admin' ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-300")}
                >
                  Admin Portal
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Connection status pill */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500">
              <div className={cn('w-1.5 h-1.5 rounded-full', anyConnected ? 'bg-emerald-400' : 'bg-neutral-600')} />
              {anyConnected
                ? `${activeProvider.logo} ${activeModel?.label ?? selectedProvider}`
                : 'No provider connected'}
            </div>
            <button
              onClick={() => setSetupOpen(o => !o)}
              className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 px-3 py-1.5 rounded-lg transition-all"
            >
              <Key className="w-3.5 h-3.5" />
              AI Setup
              <ChevronDown className={cn('w-3 h-3 transition-transform', setupOpen && 'rotate-180')} />
            </button>
            <div className="w-px h-4 bg-neutral-800" />
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-neutral-500 hover:text-red-400 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Inline AI Setup Panel */}
        <AnimatePresence>
          {setupOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-neutral-800 mt-4"
            >
              <div className="max-w-6xl mx-auto pt-4 pb-3">
                {saved2 && (
                  <div className="flex items-center gap-2 mb-3 text-xs text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    Saved — all tools will use {activeProvider.label} · {activeModel?.label}
                  </div>
                )}
                <ProviderSetup
                  selectedProvider={selectedProvider}
                  selectedModel={selectedModel}
                  connectedMap={connectedMap}
                  onProviderChange={handleProviderChange}
                  onModelChange={setSelectedModel}
                  onConnectRequest={p => setConnectTarget(p)}
                  onSaved={handleSaveSelection}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Connect Modal */}
      <AnimatePresence>
        {connectTarget && (
          <ConnectModal
            provider={PROVIDERS.find(p => p.id === connectTarget)!}
            onSave={() => handleConnectionSaved(connectTarget)}
            onClose={() => setConnectTarget(null)}
          />
        )}
      </AnimatePresence>

      {activeTab === 'admin' ? (
        <main className="flex-1">
          <AdminPortal />
        </main>
      ) : (
        <>
          {/* Hero */}
          <section className="border-b border-neutral-800 px-6 py-16">
            <div className="max-w-6xl mx-auto">
              <p className="text-xs font-mono uppercase tracking-[0.25em] text-neutral-500 mb-4">
                AI-Powered Communication Suite
              </p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-4">
                Communicate with<br />
                <span className="text-neutral-400">clarity, compliance, and confidence.</span>
              </h1>
              <p className="text-neutral-400 text-lg max-w-2xl leading-relaxed mb-6">
                Three specialized AI engines built for enterprise communication. Connect your AI provider
                once — your key and model preference carry into every tool automatically.
              </p>
              {/* Setup CTA if nothing connected */}
              {!anyConnected && (
                <button
                  onClick={() => setSetupOpen(true)}
                  className="flex items-center gap-2 text-sm font-semibold text-blue-400 border border-blue-500/40 hover:bg-blue-500/10 px-4 py-2 rounded-lg transition-all"
                >
                  <Key className="w-4 h-4" />
                  Connect AI Provider to get started
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {anyConnected && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {activeProvider.logo} {activeProvider.label} · {activeModel?.label} — ready across all tools
                </div>
              )}
            </div>
          </section>

          {/* App Cards */}
          <main className="flex-1 px-6 py-12">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">Tools</p>
                {anyConnected && (
                  <p className="text-[10px] font-mono text-neutral-600">
                    Using {activeProvider.logo} {activeProvider.label} · {activeModel?.label}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {APPS.map((app) => {
                  const colors = accentMap[app.accent];
                  const Icon = app.icon;
                  const toolReady = anyConnected;
                  return (
                    <div
                      key={app.id}
                      className={cn(
                        'relative flex flex-col border rounded-xl p-6 transition-all duration-300 bg-neutral-900/60',
                        colors.border
                      )}
                    >
                      {/* Badge */}
                      <div className="flex items-center justify-between mb-5">
                        <span className={cn('text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded border', colors.badge)}>
                          {app.tag}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {toolReady && (
                            <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-500">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Ready
                            </div>
                          )}
                          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', colors.icon)}>
                            <Icon className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      <h2 className="text-2xl font-bold tracking-tight mb-1">{app.name}</h2>
                      <p className={cn('text-[10px] font-mono uppercase tracking-wider mb-4', colors.text)}>
                        {app.fullName}
                      </p>
                      <p className="text-sm text-neutral-400 leading-relaxed flex-1 mb-5">
                        {app.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {app.features.map((f) => (
                          <span key={f} className="text-[10px] font-mono text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded">
                            {f}
                          </span>
                        ))}
                      </div>

                      <a
                        href={app.href}
                        className={cn(
                          'flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-sm transition-all active:scale-95',
                          colors.btn
                        )}
                      >
                        Launch {app.name}
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </main>

          {/* Help & Guide */}
          <HelpGuide />
        </>
      )}

      {/* Privacy banner */}
      <div className="border-t border-neutral-800 px-6 py-3 bg-neutral-900/30">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-[10px] font-mono text-neutral-600">
          <Info className="w-3 h-3 shrink-0" />
          API keys stored in browser localStorage only · Never transmitted to JAXX servers · Clear browser storage to remove all keys
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-800 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-600">
          <span>© 2026 JAXX Suite · Confidential · Leadership Use Only</span>
          <span className="flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            jaxx-micro-saas.web.app
          </span>
        </div>
      </footer>
    </div>
  );
}
