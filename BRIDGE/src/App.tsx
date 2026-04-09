import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  FileText,
  Layout,
  ChevronRight,
  Loader2,
  Copy,
  Check,
  Download,
  AlertCircle,
  History,
  Plus,
  ArrowLeft,
  ShieldCheck,
  Clock as ClockIcon,
  Users,
  MessageCircle,
  Repeat2,
  Wrench
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { generateRolloutPlan } from './services/gemini';
import { cn } from './utils';

interface PlanHistory {
  id: string;
  timestamp: number;
  input: string;
  output: string;
}

interface ArtifactDefinition {
  id: string;
  label: string;
  keywords: string[];
  description: string;
  icon: LucideIcon;
}

interface PlanArtifact extends ArtifactDefinition {
  status: 'complete' | 'missing';
  snippet: string;
}

interface TimelineInsight {
  id: string;
  phase: string;
  details: string;
}

interface PlanInsights {
  artifacts: PlanArtifact[];
  timeline: TimelineInsight[];
  feedback: string[];
}

const ARTIFACT_DEFINITIONS: ArtifactDefinition[] = [
  {
    id: 'cascade',
    label: 'Communication Cascade',
    keywords: ['communication cascade', 'cascade strategy', 'level 1', 'level 2', 'communication flow'],
    description:
      'Level-by-level messaging guide to keep executives, managers, and frontline associates aligned.',
    icon: Repeat2
  },
  {
    id: 'toolkit',
    label: 'Manager Toolkit',
    keywords: ['manager toolkit', 'talking points', 'conversation guidance', 'faq', "do's and don'ts"],
    description:
      'Tools, talking points, and guidance that enable managers to lead tough conversations confidently.',
    icon: Wrench
  },
  {
    id: 'risk',
    label: 'Risk Mitigation Plan',
    keywords: ['risk mitigation', 'contingency', 'prevent misinformation', 'risk response'],
    description: 'Steps to prevent, detect, and respond to rollout risks so disruption stays contained.',
    icon: ShieldCheck
  },
  {
    id: 'timeline',
    label: 'Rollout Timeline',
    keywords: ['implementation timeline', 'phase', 'timeline'],
    description: 'Structured phase plan from executive alignment through frontline support.',
    icon: ClockIcon
  },
  {
    id: 'feedback',
    label: 'Frontline Feedback Loop',
    keywords: ['frontline feedback', 'reporting cadence', 'closed-loop', 'feedback system'],
    description: 'Guidance for collecting, escalating, and acting on frontline sentiment.',
    icon: MessageCircle
  }
];

export default function App() {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlInput = params.get('input');
    if (urlInput) {
      setInput(urlInput);
    }
  }, []);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [history, setHistory] = useState<PlanHistory[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('bridge_history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PlanHistory[];
        if (parsed.length) {
          setHistory(parsed);
        }
      } catch (err) {
        console.error('Failed to parse stored history', err);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('bridge_history', JSON.stringify(history));
  }, [history]);

  const planInsights = useMemo<PlanInsights | null>(() => {
    if (!currentPlan) return null;
    return analyzePlan(currentPlan);
  }, [currentPlan]);

  const handleGenerate = async () => {
    if (!input.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    try {
      const plan = await generateRolloutPlan(input);
      if (plan) {
        setCurrentPlan(plan);
        const newEntry: PlanHistory = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          input: input,
          output: plan
        };
        setHistory(prev => [newEntry, ...prev]);
        
        // Scroll to result
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate plan. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!currentPlan) return;
    navigator.clipboard.writeText(currentPlan);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startNew = () => {
    setInput('');
    setCurrentPlan(null);
    setError(null);
  };

  const loadFromHistory = (entry: PlanHistory) => {
    setInput(entry.input);
    setCurrentPlan(entry.output);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header / Navigation */}
      <header className="border-b border-[#141414] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#E4E3E0]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <a href="/" className="p-1.5 hover:opacity-60 transition-opacity" title="Back to JAXX Suite">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div className="w-px h-5 bg-[#141414]/20" />
          <div className="w-8 h-8 bg-[#141414] flex items-center justify-center rounded-sm">
            <Layout className="text-[#E4E3E0] w-5 h-5" />
          </div>
          <h1 className="font-serif italic text-xl tracking-tight">BRIDGE Rollout Engine</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              const link = document.createElement('a');
              link.href = `${import.meta.env.BASE_URL}BRIDGE_Master_Prompt.md`;
              link.download = 'BRIDGE_Master_Prompt.md';
              link.click();
            }}
            className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest hover:opacity-60 transition-opacity border border-[#141414] px-3 py-1"
          >
            <Download className="w-4 h-4" />
            Download Prompt
          </button>
          <button 
            onClick={startNew}
            className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest hover:opacity-60 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Plan
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-65px)]">
        {/* Sidebar - History */}
        <aside className="lg:col-span-3 border-r border-[#141414] p-6 hidden lg:block overflow-y-auto max-h-[calc(100vh-65px)]">
          <div className="flex items-center gap-2 mb-6 opacity-50">
            <History className="w-4 h-4" />
            <span className="font-mono text-xs uppercase tracking-widest">Recent Plans</span>
          </div>
          <div className="space-y-4">
            {history.length === 0 && (
              <p className="text-sm opacity-40 italic">No history yet.</p>
            )}
            {history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => loadFromHistory(entry)}
                className="w-full text-left group border-b border-[#141414]/10 pb-3 hover:border-[#141414] transition-colors"
              >
                <p className="text-xs font-mono opacity-40 mb-1">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </p>
                <p className="text-sm line-clamp-2 font-medium group-hover:italic">
                  {entry.input}
                </p>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-9 p-6 lg:p-12 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-12">
            {/* Input Section */}
            <section className="space-y-6">
              <div className="space-y-2">
                <label className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-50 block">
                  01 / Executive Notes & Directives
                </label>
                <p className="text-lg font-serif leading-relaxed">
                  Provide brief notes, key points, or directives from leadership to transform into a strategic framework.
                </p>
              </div>

              <div className="relative group">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g., Next Steps: Before any broader announcements are made to the frontline associates, we will be scheduling a Leadership Sync..."
                  className="w-full h-48 bg-transparent border border-[#141414] p-6 focus:outline-none focus:ring-0 resize-none font-sans text-lg leading-relaxed placeholder:opacity-20 transition-all"
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={!input.trim() || isGenerating}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 bg-[#141414] text-[#E4E3E0] font-mono text-xs uppercase tracking-widest transition-all",
                      (!input.trim() || isGenerating) ? "opacity-20 cursor-not-allowed" : "hover:bg-[#141414]/90 active:scale-95"
                    )}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Generate Plan
                      </>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 font-mono text-xs uppercase tracking-wider bg-red-50 p-3 border border-red-200">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </section>

            {/* Results Section */}
            <AnimatePresence mode="wait">
              {currentPlan && (
                <motion.section
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  ref={resultRef}
                  className="space-y-8 pt-12 border-t border-[#141414]"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <label className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-50 block">
                        02 / Strategic Rollout Framework
                      </label>
                      <h2 className="text-3xl font-serif italic">The Strategic Plan</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={copyToClipboard}
                        className="p-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                        title="Copy to Clipboard"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

              {planInsights && (
                <section className="space-y-8">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 opacity-60" />
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#141414]/60">
                        03 / Leadership Intelligence Mesh
                      </p>
                      <p className="text-lg font-serif italic">Readiness Snapshot</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {planInsights.artifacts.map((artifact) => (
                      <article
                        key={artifact.id}
                        className="h-full rounded-2xl border border-[#141414]/10 bg-white/60 p-4 shadow-[0_12px_30px_rgba(20,20,20,0.08)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <artifact.icon className="w-5 h-5 text-[#141414]/80" />
                            <div>
                              <p className="text-sm font-semibold">{artifact.label}</p>
                              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#141414]/50">
                                {artifact.status === 'complete' ? 'Detected' : 'Needs more detail'}
                              </p>
                            </div>
                          </div>
                          <span
                            className={cn(
                              'text-[10px] font-mono uppercase tracking-[0.2em]',
                              artifact.status === 'complete' ? 'text-emerald-600' : 'text-amber-600'
                            )}
                          >
                            {artifact.status === 'complete' ? 'Ready' : 'Prompt'}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-[#141414]/80">
                          {artifact.snippet || artifact.description}
                        </p>
                      </article>
                    ))}
                  </div>

                  {planInsights.timeline.length > 0 && (
                    <section className="space-y-4">
                      <div className="flex items-center gap-2 text-[#141414]/60">
                        <ClockIcon className="w-4 h-4" />
                        <p className="text-[11px] font-mono uppercase tracking-[0.3em]">
                          Rollout Timeline Preview
                        </p>
                      </div>
                      <div className="space-y-3">
                        {planInsights.timeline.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-[#141414]/10 bg-[#E4E3E0]/50 p-4"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#141414]/60">
                                Phase {item.phase}
                              </p>
                              <ChevronRight className="w-4 h-4 opacity-30" />
                            </div>
                            <p className="mt-2 text-sm text-[#141414]/80">{item.details}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="space-y-3">
                    <div className="flex items-center gap-2 text-[#141414]/60">
                      <MessageCircle className="w-4 h-4" />
                      <div>
                        <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#141414]/60">
                          Frontline Feedback Signals
                        </p>
                        <p className="text-xs text-[#141414]/70">
                          Highlighted cues on intake channels & closing the loop.
                        </p>
                      </div>
                    </div>
                    {planInsights.feedback.length > 0 ? (
                      <div className="space-y-2">
                        {planInsights.feedback.map((line, index) => (
                          <p key={index} className="text-sm text-[#141414]/80">
                            • {line}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#141414]/70">
                        Encourage the AI to formalize the frontline feedback & reporting system.
                      </p>
                    )}
                  </section>
                </section>
              )}

                  <div className="prose prose-neutral max-w-none 
                    prose-headings:font-serif prose-headings:italic prose-headings:font-normal prose-headings:border-b prose-headings:border-[#141414]/10 prose-headings:pb-2 prose-headings:mt-12
                    prose-p:text-lg prose-p:leading-relaxed prose-p:text-[#141414]/80
                    prose-li:text-[#141414]/80 prose-li:text-lg
                    prose-strong:text-[#141414] prose-strong:font-semibold
                    prose-hr:border-[#141414]/20
                  ">
                    <ReactMarkdown>{currentPlan}</ReactMarkdown>
                  </div>

                  <div className="pt-12 flex justify-center">
                    <button
                      onClick={startNew}
                      className="group flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity"
                    >
                      <div className="w-12 h-12 rounded-full border border-[#141414] flex items-center justify-center group-hover:bg-[#141414] group-hover:text-[#E4E3E0] transition-all">
                        <Plus className="w-6 h-6" />
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-widest">Create Another Plan</span>
                    </button>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {!currentPlan && !isGenerating && (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-6 opacity-20">
                <FileText className="w-16 h-16 stroke-[1px]" />
                <div className="space-y-2">
                  <p className="font-serif italic text-2xl">Awaiting Directives</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em]">Ready to transform your vision into strategy</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#141414] px-6 py-4 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest opacity-40">
        <div>Â© 2026 Strategy Advisor AI</div>
        <div className="flex gap-6">
          <span>Confidential</span>
          <span>Leadership Only</span>
        </div>
      </footer>
    </div>
  );
}

function analyzePlan(text: string): PlanInsights {
  const artifacts: PlanArtifact[] = ARTIFACT_DEFINITIONS.map(def => {
    const snippet = extractSnippet(text, def.keywords);
    return {
      ...def,
      status: snippet ? 'complete' : 'missing',
      snippet: snippet || def.description
    };
  });

  const timeline = parseTimeline(text);
  const feedback = gatherFeedbackHighlights(text);

  return { artifacts, timeline, feedback };
}

function extractSnippet(text: string, keywords: string[]) {
  const lowerText = text.toLowerCase();
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    const index = lowerText.indexOf(lowerKeyword);
    if (index >= 0) {
      const start = Math.max(0, index - 60);
      const end = Math.min(text.length, index + lowerKeyword.length + 140);
      return text.slice(start, end).replace(/\s+/g, ' ').trim();
    }
  }
  return '';
}

function parseTimeline(text: string): TimelineInsight[] {
  const matches = Array.from(text.matchAll(/Phase\s*(\d+)[\s:\-–]+([^\n]+)/gi));
  if (matches.length === 0) {
    return parseImplementationTimeline(text);
  }

  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const rest = text.slice(start);
    const nextBreak = rest.search(/\n{2,}/);
    const block = nextBreak === -1 ? rest : rest.slice(0, nextBreak);
    const detail = block.replace(/Phase\s*\d+[:\-\s]*/i, '').trim().replace(/\s+/g, ' ');

    return {
      id: `${index}-${match[1] ?? index}`,
      phase: match[1] ?? `${index + 1}`,
      details: detail || match[0].trim()
    };
  });
}

function parseImplementationTimeline(text: string): TimelineInsight[] {
  const startIdx = text.search(/Implementation Timeline/i);
  if (startIdx === -1) return [];
  const remainder = text.slice(startIdx);
  const nextBreak = remainder.search(/\n{2,}/);
  const section = nextBreak === -1 ? remainder : remainder.slice(0, nextBreak);

  return section
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => /^Phase\s*\d+/i.test(line))
    .map((line, index) => {
      const phaseMatch = line.match(/Phase\s*(\d+)/i);
      return {
        id: `fallback-${index}`,
        phase: phaseMatch?.[1] ?? `${index + 1}`,
        details: line.replace(/Phase\s*\d+[:\-\s]*/i, '').trim() || line
      };
    });
}

function gatherFeedbackHighlights(text: string): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const filtered = sentences.filter(sentence =>
    /frontline|feedback|reporting|closed-loop|intake|inbox/i.test(sentence)
  );

  if (filtered.length) {
    return Array.from(new Set(filtered.map(sentence => sentence.replace(/\s+/g, ' ').trim()))).slice(0, 3);
  }

  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => /frontline feedback|reporting cadence|feedback system|closed-loop/i.test(line))
    .slice(0, 3)
    .map(line => line.replace(/\s+/g, ' ').replace(/^\W+/, '').trim());

  return lines;
}
