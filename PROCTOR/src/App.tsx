import React, { useState, useRef } from 'react';
import {
  Layers,
  Upload,
  FileText,
  X,
  Send,
  Loader2,
  Copy,
  Check,
  Download,
  AlertCircle,
  ChevronRight,
  Users,
  Settings2,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { generatePresentationOutline } from './services/geminiService';
import { cn } from './utils';

const AUDIENCES = [
  { id: 'managers', label: 'Managers / Supervisors', short: 'Managers' },
  { id: 'ceo', label: 'CEO / President', short: 'CEO' },
  { id: 'cfo', label: 'CFO / Finance', short: 'CFO' },
  { id: 'compliance', label: 'Compliance / Legal', short: 'Compliance' },
  { id: 'it', label: 'IT / Technology', short: 'IT' },
  { id: 'board', label: 'Board of Directors', short: 'Board' },
  { id: 'hr', label: 'HR / People Team', short: 'HR' },
  { id: 'ops', label: 'Operations Leadership', short: 'Ops' },
];

const PRESENTATION_TYPES = [
  { id: 'status', label: 'Status Update' },
  { id: 'strategic', label: 'Strategic Initiative' },
  { id: 'risk', label: 'Risk Review' },
  { id: 'compliance', label: 'Compliance Report' },
  { id: 'operational', label: 'Operational Review' },
  { id: 'change', label: 'Change Management Brief' },
  { id: 'budget', label: 'Budget / Financial Review' },
  { id: 'incident', label: 'Incident / Post-Mortem' },
];

export default function App() {
  const [primaryContent, setPrimaryContent] = useState('');
  const [executiveContext, setExecutiveContext] = useState('');
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [presentationType, setPresentationType] = useState(PRESENTATION_TYPES[0].id);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [outline, setOutline] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const toggleAudience = (id: string) => {
    setSelectedAudiences((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['text/plain', 'text/markdown', 'text/csv'];
    const allowedExtensions = ['.txt', '.md', '.csv', '.log'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      setError('Please upload a plain text file (.txt, .md, .csv). For Word/PDF, paste the content directly.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setPrimaryContent(text);
      setUploadedFileName(file.name);
      setError(null);
    };
    reader.onerror = () => setError('Failed to read file. Please try pasting the content instead.');
    reader.readAsText(file);

    // Reset input so the same file can be re-uploaded
    e.target.value = '';
  };

  const clearFile = () => {
    setPrimaryContent('');
    setUploadedFileName(null);
  };

  const handleGenerate = async () => {
    if (!primaryContent.trim()) {
      setError('Please provide primary content before generating.');
      return;
    }
    if (selectedAudiences.length === 0) {
      setError('Please select at least one target audience.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setOutline(null);

    try {
      const audienceLabels = selectedAudiences.map(
        (id) => AUDIENCES.find((a) => a.id === id)?.label || id
      );
      const typeLabel = PRESENTATION_TYPES.find((t) => t.id === presentationType)?.label || presentationType;

      const result = await generatePresentationOutline({
        primaryContent,
        executiveContext,
        audiences: audienceLabels,
        presentationType: typeLabel,
        apiKey: apiKey.trim() || undefined,
      });

      setOutline(result || 'No output returned.');
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error(err);
      setError('Failed to generate outline. Please check your API key and try again.');
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PROCTOR-outline-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startNew = () => {
    setOutline(null);
    setError(null);
  };

  const canGenerate = primaryContent.trim().length > 0 && selectedAudiences.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">

      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-10 border-b border-slate-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              <Settings2 className="w-4 h-4" />
              API Key
            </button>
            {outline && (
              <>
                <div className="w-px h-4 bg-slate-700" />
                <button
                  onClick={startNew}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New
                </button>
              </>
            )}
          </div>
        </div>

        {/* API Key Panel */}
        <AnimatePresence>
          {showApiKey && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="max-w-7xl mx-auto overflow-hidden"
            >
              <div className="pt-3 pb-1 flex items-center gap-3">
                <label className="text-xs text-slate-400 shrink-0 font-mono">GEMINI_API_KEY</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your Gemini API key (optional if env var is set)"
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Column: Inputs ── */}
        <div className="lg:col-span-5 space-y-5">

          {/* Primary Content */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  01 · Primary Content
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {uploadedFileName && (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    <FileText className="w-3 h-3" />
                    {uploadedFileName}
                    <button onClick={clearFile} className="ml-0.5 hover:text-blue-800">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-400 rounded-lg px-2.5 py-1 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.csv,.log"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
            <div className="p-4">
              <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                Paste or upload raw materials: meeting notes, emails, reports, policy documents, data
                summaries. Upload supports <span className="font-mono">.txt .md .csv</span> — for
                Word/PDF, copy-paste the text.
              </p>
              <textarea
                value={primaryContent}
                onChange={(e) => { setPrimaryContent(e.target.value); setUploadedFileName(null); }}
                placeholder="Paste meeting notes, reports, emails, policy excerpts, or any raw content here…"
                className="w-full h-52 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none font-sans"
              />
              <p className="text-right text-[10px] text-slate-400 font-mono mt-1">
                {primaryContent.length.toLocaleString()} characters
              </p>
            </div>
          </section>

          {/* Executive Context */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                02 · Executive Context
              </h2>
              <span className="ml-auto text-[10px] text-slate-400 italic">Optional</span>
            </div>
            <div className="p-4">
              <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                Provide executive communications, strategic priorities, or leadership directives that
                should frame how this presentation is positioned.
              </p>
              <textarea
                value={executiveContext}
                onChange={(e) => setExecutiveContext(e.target.value)}
                placeholder="e.g., 'Our Q3 focus is on cost reduction and operational efficiency. Leadership has indicated this initiative aligns with the 5-year transformation plan…'"
                className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none font-sans"
              />
            </div>
          </section>

          {/* Configuration */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                03 · Audience & Type
              </h2>
            </div>
            <div className="p-4 space-y-5">

              {/* Audience multi-select */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Target Audience <span className="text-red-400">*</span>
                </label>
                <p className="text-[11px] text-slate-400 mb-2">Select all that apply — output will include callouts for each.</p>
                <div className="flex flex-wrap gap-2">
                  {AUDIENCES.map((a) => {
                    const active = selectedAudiences.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggleAudience(a.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                          active
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                        )}
                      >
                        {a.short}
                      </button>
                    );
                  })}
                </div>
                {selectedAudiences.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
                    Selected: {selectedAudiences.map(id => AUDIENCES.find(a => a.id === id)?.label).join(' · ')}
                  </p>
                )}
              </div>

              {/* Presentation Type */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Presentation Type
                </label>
                <select
                  value={presentationType}
                  onChange={(e) => setPresentationType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  {PRESENTATION_TYPES.map((t) => (
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

          {/* Generate Button */}
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
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Building Presentation Blueprint…
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Generate Presentation Outline
              </>
            )}
          </button>

          {!canGenerate && !isGenerating && (
            <p className="text-center text-[11px] text-slate-400">
              {!primaryContent.trim() && 'Add primary content · '}
              {selectedAudiences.length === 0 && 'Select at least one audience'}
            </p>
          )}
        </div>

        {/* ── Right Column: Output ── */}
        <div className="lg:col-span-7" ref={outputRef}>
          <AnimatePresence mode="wait">
            {isGenerating && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Building your presentation blueprint…</p>
                  <p className="text-sm text-slate-400 mt-1">
                    PROCTOR is synthesizing your content into a structured outline.
                  </p>
                </div>
                <div className="flex gap-1 mt-2">
                  {['Analyzing content', 'Structuring outline', 'Tailoring to audience'].map((step, i) => (
                    <span key={step} className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {step}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {outline && !isGenerating && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Output header */}
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between sticky top-[73px] z-10">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700">Presentation Blueprint</h3>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      {PRESENTATION_TYPES.find(t => t.id === presentationType)?.label} ·{' '}
                      {selectedAudiences.map(id => AUDIENCES.find(a => a.id === id)?.short).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyToClipboard}
                      title="Copy to clipboard"
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-400 px-2.5 py-1.5 rounded-lg transition-all"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={downloadOutline}
                      title="Download as Markdown"
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-400 px-2.5 py-1.5 rounded-lg transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                    <button
                      onClick={startNew}
                      className="flex items-center gap-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      New
                    </button>
                  </div>
                </div>

                {/* Rendered Markdown */}
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl border border-dashed border-slate-300 p-16 flex flex-col items-center justify-center text-center space-y-5"
              >
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                  <Layers className="w-8 h-8 text-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-400 text-lg">Awaiting Content</p>
                  <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                    Add your raw content, select your audience, and PROCTOR will build a
                    structured leadership presentation outline.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-left mt-4 max-w-sm w-full">
                  {[
                    ['01', 'Paste or upload primary content'],
                    ['02', 'Add executive context (optional)'],
                    ['03', 'Select target audience'],
                    ['04', 'Generate your blueprint'],
                  ].map(([n, t]) => (
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
