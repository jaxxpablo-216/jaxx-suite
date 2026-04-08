/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertOctagon, 
  Send, 
  FileText, 
  Settings, 
  Briefcase, 
  Info,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  ChevronRight,
  HelpCircle,
  ExternalLink,
  ArrowRight,
  Zap,
  RefreshCw,
  MoreHorizontal,
  Key,
  Cpu,
  User,
  LogOut,
  Download,
  AlertTriangle
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { auditCommunication, rewordSuggestion } from './services/geminiService';
import { cn } from './lib/utils';
import { WelcomeModal } from './components/WelcomeModal';

const PERSONAS = [
  { id: 'compliance', name: 'Strict Compliance Officer', description: 'Focuses on regulatory compliance, PII protection, and strict adherence to forbidden phrase lists.' },
  { id: 'success', name: 'Empathetic Customer Success Manager', description: 'Prioritizes professional empathy, clarity, and positive brand sentiment.' },
  { id: 'tech', name: 'Technical Support Lead', description: 'Focuses on technical accuracy, SLA commitments, and clear resolution paths.' },
  { id: 'service', name: 'Customer Service Associate', description: 'Focuses on excellent customer service: empathy, active listening, clear resolution, and positive brand representation.' },
  { id: 'executive', name: 'Executive Communications Director', description: 'Focuses on brevity, professional impact, and strategic alignment.' },
  { id: 'legal', name: 'Legal Counsel', description: 'Focuses on liability mitigation, precise legal terminology, and confidentiality.' }
];

const CONTEXT_SUGGESTIONS = [
  "High Priority",
  "Enterprise Customer",
  "Previous Escalation",
  "Refund Requested",
  "Technical Issue",
  "Billing Dispute",
  "New Customer",
  "Loyal Customer (5+ years)",
  "Urgent Response Needed",
  "Manager Review Required",
  "PII Detected",
  "Out of Scope Request",
  "Assertive",
  "Cooperative",
  "Urgent",
  "Authoritative",
  "Sympathetic",
  "Empathetic",
  "Formal",
  "Friendly"
];

const TONE_PRESETS = [
  { id: 'formal', name: 'Formal', description: 'Professional, structured, and respectful.' },
  { id: 'casual', name: 'Casual', description: 'Friendly, approachable, and conversational.' },
  { id: 'empathetic', name: 'Empathetic', description: 'Warm, validating, and human-centric.' },
  { id: 'direct', name: 'Direct and Concise', description: 'Brief, factual, and resolution-focused.' }
];

const PRIORITY_LEVELS = [
  { id: 'low', name: 'Low' },
  { id: 'medium', name: 'Medium' },
  { id: 'high', name: 'High' },
  { id: 'critical', name: 'Critical' }
];

const REGIONS = [
  { id: 'na', name: 'North America (NA)' },
  { id: 'emea', name: 'Europe, Middle East, Africa (EMEA)' },
  { id: 'apac', name: 'Asia-Pacific (APAC)' },
  { id: 'latam', name: 'Latin America (LATAM)' },
  { id: 'global', name: 'Global' }
];

const CUSTOMER_TIERS = [
  { id: 'free', name: 'Free / Community' },
  { id: 'pro', name: 'Pro / Individual' },
  { id: 'business', name: 'Business' },
  { id: 'enterprise', name: 'Enterprise' },
  { id: 'vip', name: 'VIP / Strategic' }
];

const MODELS = [
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', provider: 'google', description: 'Most capable model for complex reasoning and auditing.' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: 'google', description: 'Fast and efficient for quick audits.' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'OpenAI\'s flagship multimodal model.' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', description: 'Anthropic\'s high-performance model.' },
  { id: 'copilot', name: 'Microsoft Copilot', provider: 'microsoft', description: 'AI-powered productivity tool for Microsoft 365.' },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek', description: 'High-performance conversational AI model.' }
];

const PROVIDER_INSTRUCTIONS = {
  google: {
    url: "https://aistudio.google.com/app/apikey",
    steps: [
      "Visit Google AI Studio API Keys page.",
      "Create a new API key in a new or existing project.",
      "Click 'Select My Google API Key' below to securely link it."
    ]
  },
  openai: {
    url: "https://platform.openai.com/api-keys",
    steps: [
      "Log in to your OpenAI Platform account.",
      "Navigate to the API Keys section.",
      "Create a new secret key and paste it into the field below."
    ]
  },
  anthropic: {
    url: "https://console.anthropic.com/settings/keys",
    steps: [
      "Log in to the Anthropic Console.",
      "Go to Settings > API Keys.",
      "Generate a new key and paste it into the field below."
    ]
  },
  microsoft: {
    url: "https://azure.microsoft.com/en-us/products/ai-services/openai-service",
    steps: [
      "Log in to your Azure Portal.",
      "Navigate to Azure OpenAI Service.",
      "Get your API key from the Keys and Endpoint section."
    ]
  },
  deepseek: {
    url: "https://platform.deepseek.com/api_keys",
    steps: [
      "Log in to the DeepSeek Platform.",
      "Navigate to the API Keys section.",
      "Create a new API key and paste it into the field below."
    ]
  }
};

const DEFAULT_POLICIES = '';

const DEFAULT_CONTEXT = '';

export default function App() {
  const [originalMessage, setOriginalMessage] = useState('');
  const [draftReply, setDraftReply] = useState('');
  const [persona, setPersona] = useState(PERSONAS[0].id);
  const [tone, setTone] = useState(TONE_PRESETS[0].id);
  const [companyPolicies, setCompanyPolicies] = useState(DEFAULT_POLICIES);
  const [caseContext, setCaseContext] = useState(DEFAULT_CONTEXT);
  const [casePriority, setCasePriority] = useState(PRIORITY_LEVELS[1].id);
  const [region, setRegion] = useState(REGIONS[0].id);
  const [customerTier, setCustomerTier] = useState(CUSTOMER_TIERS[0].id);
  
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [customApiKey, setCustomApiKey] = useState('');
  const [useUserKey, setUseUserKey] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSaveBeforeLogout, setIsSaveBeforeLogout] = useState(false);

  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [improvedReplies, setImprovedReplies] = useState<{ label: string, content: string }[]>([]);
  const [activeImprovedReplyIndex, setActiveImprovedReplyIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);
  const [isRewording, setIsRewording] = useState(false);
  const [isRewordModalOpen, setIsRewordModalOpen] = useState(false);
  const [suggestionToRewordIndex, setSuggestionToRewordIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [suggestedActionsContent, setSuggestedActionsContent] = useState('');

  useEffect(() => {
    const skipWelcome = localStorage.getItem('core_skip_welcome') === 'true';
    if (!skipWelcome) {
      setIsWelcomeOpen(true);
    }
    // Pre-populate API key from JAXX Suite landing page setup.
    const jaxxKey = localStorage.getItem('jaxx_key_gemini') || localStorage.getItem('proctor_key_gemini');
    if (jaxxKey) {
      setCustomApiKey(jaxxKey);
      setUseUserKey(true);
    }
  }, []);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = (saveData: boolean) => {
    if (saveData) {
      // In a real app, this would trigger a download or save to cloud
      const dataToSave = {
        originalMessage,
        draftReply,
        auditResult,
        suggestions,
        timestamp: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CORE-session-${new Date().getTime()}.json`;
      a.click();
    }

    // Clear all state
    setOriginalMessage('');
    setDraftReply('');
    setAuditResult('');
    setImprovedReplies([]);
    setSuggestions([]);
    setCompanyPolicies(DEFAULT_POLICIES);
    setCaseContext(DEFAULT_CONTEXT);
    setCasePriority(PRIORITY_LEVELS[1].id);
    setRegion(REGIONS[0].id);
    setCustomerTier(CUSTOMER_TIERS[0].id);
    setPersona(PERSONAS[0].id);
    setTone(TONE_PRESETS[0].id);
    setCustomApiKey('');
    setUseUserKey(false);
    
    setIsLogoutModalOpen(false);
    setIsWelcomeOpen(true); // Show welcome screen again
  };

  const handleCloseWelcome = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem('core_skip_welcome', 'true');
    }
    setIsWelcomeOpen(false);
  };

  const addContextSuggestion = (suggestion: string) => {
    setCaseContext(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return suggestion;
      if (trimmed.endsWith('.') || trimmed.endsWith(',')) return `${trimmed} ${suggestion}`;
      return `${trimmed}, ${suggestion}`;
    });
  };

  const extractSuggestedActions = (markdown: string) => {
    const sectionHeader = 'L) SUGGESTED ACTIONS';
    const index = markdown.indexOf(sectionHeader);
    if (index === -1) return '';
    
    const content = markdown.substring(index + sectionHeader.length).trim();
    // Stop at the next section if it exists
    const nextSectionMatch = content.match(/\n[A-Z]\)/);
    if (nextSectionMatch) {
      return content.substring(0, nextSectionMatch.index).trim();
    }
    return content;
  };

  const parseSuggestions = (markdown: string) => {
    const actions = extractSuggestedActions(markdown);
    if (!actions) return [];
    
    // Split by bullet points or numbered lists
    const lines = actions.split(/\n[-*•\d.]+/).map(s => s.trim()).filter(s => s.length > 0);
    return lines.slice(0, 3); // Ensure exactly 3 or fewer
  };

  const parseImprovedReplies = (markdown: string) => {
    const sectionHeader = 'F) SUGGESTED IMPROVED REPLY';
    const index = markdown.indexOf(sectionHeader);
    if (index === -1) return [];
    
    let content = markdown.substring(index + sectionHeader.length).trim();
    const nextSectionMatch = content.match(/\n[A-Z]\)/);
    if (nextSectionMatch) {
      content = content.substring(0, nextSectionMatch.index).trim();
    }

    const variants = [
      { label: 'Full and Detailed', tag: '[FULL AND DETAILED]' },
      { label: 'Trimmed Down', tag: '[TRIMMED DOWN]' },
      { label: 'Concise', tag: '[CONCISE]' }
    ];

    const results: { label: string, content: string }[] = [];

    variants.forEach((v, i) => {
      const startTag = v.tag;
      const startIndex = content.indexOf(startTag);
      if (startIndex !== -1) {
        const nextTag = variants[i + 1]?.tag;
        const endIndex = nextTag ? content.indexOf(nextTag) : content.length;
        const variantContent = content.substring(startIndex + startTag.length, endIndex).trim();
        if (variantContent) {
          results.push({ label: v.label, content: variantContent });
        }
      }
    });

    return results;
  };

  const getMarkdownWithoutSections = (markdown: string) => {
    let result = markdown;
    const sectionsToRemove = ['F) SUGGESTED IMPROVED REPLY', 'L) SUGGESTED ACTIONS'];
    
    sectionsToRemove.forEach(header => {
      const index = result.indexOf(header);
      if (index !== -1) {
        const before = result.substring(0, index).trim();
        let after = result.substring(index + header.length).trim();
        const nextSectionMatch = after.match(/\n[A-Z]\)/);
        if (nextSectionMatch) {
          after = after.substring(nextSectionMatch.index).trim();
        } else {
          after = '';
        }
        result = `${before}\n\n${after}`;
      }
    });
    
    return result;
  };

  const handleExportClick = () => {
    if (!auditResult) return;
    const actions = extractSuggestedActions(auditResult);
    if (actions) {
      setSuggestedActionsContent(actions);
      setIsExportModalOpen(true);
    } else {
      setError("No 'Suggested Actions' section found in the audit result.");
    }
  };

  const confirmExport = () => {
    const targetUrl = `/bridge/?input=${encodeURIComponent(suggestedActionsContent)}`;
    
    // Copy to clipboard as fallback
    navigator.clipboard.writeText(suggestedActionsContent);
    
    // Open in new window
    window.open(targetUrl, '_blank');
    setIsExportModalOpen(false);
  };

  const handleAudit = async () => {
    if (!originalMessage || !draftReply) {
      setError("Please provide both the Original Message and the Draft Reply.");
      return;
    }

    setIsAuditing(true);
    setError(null);
    setAuditResult(null);

    try {
      const modelInfo = MODELS.find(m => m.id === selectedModel);
      const result = await auditCommunication({
        originalMessage,
        draftReply,
        persona: PERSONAS.find(p => p.id === persona)?.name || persona,
        tone: TONE_PRESETS.find(t => t.id === tone)?.name || tone,
        companyPolicies,
        caseContext,
        casePriority: PRIORITY_LEVELS.find(p => p.id === casePriority)?.name || casePriority,
        region: REGIONS.find(r => r.id === region)?.name || region,
        customerTier: CUSTOMER_TIERS.find(t => t.id === customerTier)?.name || customerTier,
        model: selectedModel,
        provider: modelInfo?.provider || 'google',
        apiKey: useUserKey ? customApiKey : undefined
      });
      setAuditResult(result || "No result returned.");
      if (result) {
        setSuggestions(parseSuggestions(result));
        setImprovedReplies(parseImprovedReplies(result));
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during the audit. Please check your API key and inputs.");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleRewordClick = (index: number) => {
    setSuggestionToRewordIndex(index);
    setIsRewordModalOpen(true);
  };

  const confirmReword = async () => {
    if (suggestionToRewordIndex === null) return;
    
    const suggestionToReword = suggestions[suggestionToRewordIndex];
    setIsRewordModalOpen(false);
    setIsRewording(true);
    
    try {
      const modelInfo = MODELS.find(m => m.id === selectedModel);
      const reworded = await rewordSuggestion({
        originalMessage,
        draftReply,
        persona: PERSONAS.find(p => p.id === persona)?.name || persona,
        tone: TONE_PRESETS.find(t => t.id === tone)?.name || tone,
        suggestionToReword,
        companyPolicies,
        caseContext,
        model: selectedModel,
        provider: modelInfo?.provider || 'google',
        apiKey: useUserKey ? customApiKey : undefined
      });
      
      if (reworded) {
        // Replace the suggestion and clear others as per user request
        setSuggestions([reworded.trim()]);
        setActiveSuggestionIndex(0);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to reword suggestion.");
    } finally {
      setIsRewording(false);
    }
  };

  const handleSelectGoogleKey = async () => {
    try {
      // @ts-ignore
      if (window.aistudio && window.aistudio.openSelectKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        setUseUserKey(true);
        // The key is automatically injected into process.env.API_KEY by the platform
      } else {
        setError("API Key selection is only available in the AI Studio environment.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to open API key selection dialog.");
    }
  };

  const isReady = auditResult?.includes('✅ READY TO SEND');
  const isBlocked = auditResult?.includes('⛔ DO NOT SEND YET');

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors" title="Back to JAXX Suite">
              <ArrowRight className="w-4 h-4 text-neutral-400 rotate-180" />
            </a>
            <div className="h-4 w-px bg-neutral-200" />
            <div className="bg-neutral-900 p-2 rounded-lg">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                Re:CORE
              </h1>
              <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
                Revised Communications Oversight & Review Engine
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <Cpu className="w-4 h-4" />
              AI/LLM Selection Account Login
            </button>
            <div className="h-4 w-px bg-neutral-200" />
            <button 
              onClick={handleLogout}
              className="p-1.5 hover:bg-red-50 text-neutral-400 hover:text-red-600 rounded-lg transition-all"
              title="Close Session"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <div className="h-4 w-px bg-neutral-200" />
            <button 
              onClick={() => setIsWelcomeOpen(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              How to use
            </button>
            <div className="h-4 w-px bg-neutral-200" />
            <button 
              onClick={() => {
                setOriginalMessage("Hi, I've been waiting for my refund for 2 weeks. This is unacceptable.");
                setDraftReply("I guess we are working on it. Probably next week. As per my last email, we are busy.");
              }}
              className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Load Example
            </button>
            <div className="h-4 w-px bg-neutral-200" />
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              System Online
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2">
              <FileText className="w-4 h-4 text-neutral-500" />
              <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider">Primary Inputs</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1.5">Original Message</label>
                <textarea 
                  value={originalMessage}
                  onChange={(e) => setOriginalMessage(e.target.value)}
                  placeholder="Paste the message you are drafting a reply to"
                  className="w-full h-32 p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all resize-none font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1.5">Draft Reply</label>
                <textarea 
                  value={draftReply}
                  onChange={(e) => setDraftReply(e.target.value)}
                  placeholder="Paste your proposed response here..."
                  className="w-full h-48 p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all resize-none font-sans"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2">
              <Settings className="w-4 h-4 text-neutral-500" />
              <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider">Configuration</h2>
            </div>
            <div className="p-4 space-y-4">
              <details className="group" open>
                <summary className="flex items-center justify-between cursor-pointer list-none py-2 hover:bg-neutral-50 rounded px-2 -mx-2 transition-colors">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-600">Reviewer Persona</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="mt-2 space-y-2">
                  <p className="text-[11px] text-neutral-500 leading-relaxed italic">
                    Select the persona CORE will adopt to audit your communication. Each persona has unique priorities and tone requirements.
                  </p>
                  <select 
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 transition-all"
                  >
                    {PERSONAS.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-neutral-400 font-medium">
                    {PERSONAS.find(p => p.id === persona)?.description}
                  </p>
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none py-2 hover:bg-neutral-50 rounded px-2 -mx-2 transition-colors">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-600">Target Tone</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="mt-2 space-y-2">
                  <p className="text-[11px] text-neutral-500 leading-relaxed italic">
                    Specify the desired tone for the response. CORE will audit the draft against this target.
                  </p>
                  <select 
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 transition-all"
                  >
                    {TONE_PRESETS.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-neutral-400 font-medium">
                    {TONE_PRESETS.find(t => t.id === tone)?.description}
                  </p>
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none py-2 hover:bg-neutral-50 rounded px-2 -mx-2 transition-colors">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-600">Company Policies</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="mt-2 space-y-2">
                  <p className="text-[11px] text-neutral-500 leading-relaxed italic">
                    Define specific SOPs, SLAs, or internal rules that CORE should check against.
                  </p>
                  <textarea 
                    value={companyPolicies}
                    onChange={(e) => setCompanyPolicies(e.target.value)}
                    placeholder="e.g., SOP-001: Always verify identity..."
                    className="w-full h-48 p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 transition-all resize-none font-sans"
                  />
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none py-2 hover:bg-neutral-50 rounded px-2 -mx-2 transition-colors">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-600">Case Context</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="mt-2 space-y-2">
                  <p className="text-[11px] text-neutral-500 leading-relaxed italic">
                    Add background information or some historical data for better drafting of suggestions.
                  </p>
                  <textarea 
                    value={caseContext}
                    onChange={(e) => setCaseContext(e.target.value)}
                    placeholder="e.g., Customer has been with us for 5 years, previous ticket #123..."
                    className="w-full h-32 p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 transition-all resize-none font-sans"
                  />
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none py-2 hover:bg-neutral-50 rounded px-2 -mx-2 transition-colors">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-600">Case Metadata</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="mt-2 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Priority</label>
                    <select 
                      value={casePriority}
                      onChange={(e) => setCasePriority(e.target.value)}
                      className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:ring-2 focus:ring-neutral-900 transition-all"
                    >
                      {PRIORITY_LEVELS.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Region</label>
                    <select 
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:ring-2 focus:ring-neutral-900 transition-all"
                    >
                      {REGIONS.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Customer Tier</label>
                    <select 
                      value={customerTier}
                      onChange={(e) => setCustomerTier(e.target.value)}
                      className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:ring-2 focus:ring-neutral-900 transition-all"
                    >
                      {CUSTOMER_TIERS.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none py-2 hover:bg-neutral-50 rounded px-2 -mx-2 transition-colors">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-600">Context Suggestions</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="mt-2 space-y-3">
                  <p className="text-[11px] text-neutral-500 leading-relaxed italic">
                    Click a suggestion below to quickly add it to your Case Context.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CONTEXT_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => addContextSuggestion(suggestion)}
                        className="text-[10px] font-bold px-2 py-1 bg-neutral-100 text-neutral-600 rounded-md border border-neutral-200 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all active:scale-95"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </details>
            </div>
          </section>

          <button 
            onClick={handleAudit}
            disabled={isAuditing}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2",
              isAuditing ? "bg-neutral-400 cursor-not-allowed" : "bg-neutral-900 hover:bg-black active:scale-[0.98]"
            )}
          >
            {isAuditing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Performing Audit...
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Run Comprehensive Audit
              </>
            )}
          </button>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-sm">
              <AlertOctagon className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7">
          {!auditResult && !isAuditing && (
            <div className="h-full min-h-[600px] bg-white rounded-xl border border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-400 p-12 text-center">
              <div className="bg-neutral-50 p-6 rounded-full mb-4">
                <ShieldCheck className="w-12 h-12 text-neutral-200" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-500 mb-2">Awaiting Input</h3>
              <p className="max-w-xs text-sm">
                Provide the original message and your draft reply to begin the high-stakes audit process.
              </p>
            </div>
          )}

          {isAuditing && (
            <div className="h-full min-h-[600px] bg-white rounded-xl border border-neutral-200 p-8 space-y-8 animate-pulse">
              <div className="h-12 bg-neutral-100 rounded-lg w-1/3" />
              <div className="space-y-4">
                <div className="h-4 bg-neutral-100 rounded w-full" />
                <div className="h-4 bg-neutral-100 rounded w-full" />
                <div className="h-4 bg-neutral-100 rounded w-3/4" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-neutral-100 rounded-xl" />
                <div className="h-24 bg-neutral-100 rounded-xl" />
              </div>
              <div className="h-64 bg-neutral-100 rounded-xl w-full" />
            </div>
          )}

          {auditResult && (
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-full">
              {/* Status Banner */}
              <div className={cn(
                "px-6 py-4 flex items-center justify-between border-b",
                isReady ? "bg-emerald-50 border-emerald-100" : 
                isBlocked ? "bg-red-50 border-red-100" : "bg-neutral-50 border-neutral-200"
              )}>
                <div className="flex items-center gap-3">
                  {isReady ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : isBlocked ? (
                    <XCircle className="w-6 h-6 text-red-600" />
                  ) : (
                    <AlertOctagon className="w-6 h-6 text-amber-600" />
                  )}
                  <div>
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      isReady ? "text-emerald-700" : isBlocked ? "text-red-700" : "text-amber-700"
                    )}>
                      Audit Status
                    </span>
                    <h3 className={cn(
                      "text-lg font-bold",
                      isReady ? "text-emerald-900" : isBlocked ? "text-red-900" : "text-amber-900"
                    )}>
                      {isReady ? "READY TO SEND" : isBlocked ? "DO NOT SEND YET" : "REVIEW REQUIRED"}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(auditResult)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors text-neutral-500"
                  title="Copy Audit Log"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>

              {/* Audit Content */}
              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                <div className="markdown-body">
                  <Markdown>{getMarkdownWithoutSections(auditResult)}</Markdown>
                </div>

                {/* Improved Replies Section */}
                {improvedReplies.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-neutral-100 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-4 h-4 text-neutral-400" />
                      <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">F) Suggested Improved Replies</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {improvedReplies.map((reply, idx) => (
                        <div key={idx} className="space-y-2">
                          <button 
                            onClick={() => setActiveImprovedReplyIndex(activeImprovedReplyIndex === idx ? null : idx)}
                            className={cn(
                              "w-full px-4 py-3 rounded-xl border flex items-center justify-between transition-all",
                              activeImprovedReplyIndex === idx 
                                ? "bg-neutral-900 border-neutral-900 text-white shadow-md" 
                                : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-900"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono opacity-50">0{idx + 1}</span>
                              <span className="text-sm font-bold">{reply.label}</span>
                            </div>
                            <ChevronRight className={cn("w-4 h-4 transition-transform", activeImprovedReplyIndex === idx && "rotate-90")} />
                          </button>
                          
                          <AnimatePresence>
                            {activeImprovedReplyIndex === idx && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-6 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4">
                                  <div className="markdown-body text-sm">
                                    <Markdown>{reply.content}</Markdown>
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => navigator.clipboard.writeText(reply.content)}
                                      className="flex-1 py-2.5 rounded-lg bg-white border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-100 flex items-center justify-center gap-1.5 transition-all"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                      Copy Suggested Reply
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interactive Suggestions Section */}
                {suggestions.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-neutral-100 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-4 h-4 text-neutral-400" />
                      <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">L) Suggested Actions</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {suggestions.map((suggestion, idx) => (
                        <div key={idx} className="space-y-2">
                          <button 
                            onClick={() => setActiveSuggestionIndex(activeSuggestionIndex === idx ? null : idx)}
                            className={cn(
                              "w-full px-4 py-3 rounded-xl border flex items-center justify-between transition-all",
                              activeSuggestionIndex === idx 
                                ? "bg-neutral-900 border-neutral-900 text-white shadow-md" 
                                : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-900"
                            )}
                          >
                            <span className="text-sm font-bold">Suggestion #{idx + 1}</span>
                            <ChevronRight className={cn("w-4 h-4 transition-transform", activeSuggestionIndex === idx && "rotate-90")} />
                          </button>
                          
                          <AnimatePresence>
                            {activeSuggestionIndex === idx && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4">
                                  <p className="text-sm text-neutral-700 leading-relaxed italic">
                                    "{suggestion}"
                                  </p>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => navigator.clipboard.writeText(suggestion)}
                                      className="flex-1 py-2 rounded-lg bg-white border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-100 flex items-center justify-center gap-1.5 transition-all"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                      Copy Text
                                    </button>
                                    <button 
                                      onClick={() => handleRewordClick(idx)}
                                      disabled={isRewording}
                                      className="flex-1 py-2 rounded-lg bg-white border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-100 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                                    >
                                      {isRewording ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                      Reword
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Action */}
              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-center items-center">
                <button 
                  onClick={handleExportClick}
                  className="px-8 py-3 rounded-xl font-bold text-white bg-neutral-900 hover:bg-black flex items-center gap-2 transition-all shadow-lg active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  Export Suggested Actions to BRIDGE
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-neutral-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
          <span>CORE v9.3.0-stable</span>
          <div className="flex gap-4">
            <span>Compliance: ISO-27001</span>
            <span>Audit Logic: Gemini 3.1 Pro</span>
            <span>Session: {new Date().toISOString()}</span>
          </div>
        </div>
      </footer>

      {/* Model Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                <div className="flex items-center gap-3">
                  <div className="bg-neutral-900 p-2 rounded-lg">
                    <Cpu className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900">AI/LLM Selection Account Login</h3>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-neutral-400" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest">Select LLM Provider</label>
                  <div className="grid grid-cols-2 gap-3">
                    {MODELS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedModel(m.id)}
                        className={cn(
                          "p-4 rounded-xl border text-left transition-all group",
                          selectedModel === m.id 
                            ? "bg-neutral-900 border-neutral-900 text-white shadow-lg" 
                            : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-900"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider opacity-60">{m.provider}</span>
                          {selectedModel === m.id && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <h4 className="font-bold text-sm mb-1">{m.name}</h4>
                        <p className={cn(
                          "text-[10px] leading-relaxed",
                          selectedModel === m.id ? "text-neutral-300" : "text-neutral-500"
                        )}>
                          {m.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-neutral-100" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-neutral-400" />
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">API Key Management</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400">Use personal key</span>
                      <button 
                        onClick={() => setUseUserKey(!useUserKey)}
                        className={cn(
                          "w-8 h-4 rounded-full transition-colors relative",
                          useUserKey ? "bg-emerald-500" : "bg-neutral-200"
                        )}
                      >
                        <div className={cn(
                          "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                          useUserKey ? "left-4.5" : "left-0.5"
                        )} />
                      </button>
                    </div>
                  </div>

                  {useUserKey ? (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Provider-specific instructions */}
                      <div className="bg-neutral-50 border border-neutral-100 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">How to login to your account</h5>
                          <a 
                            href={PROVIDER_INSTRUCTIONS[MODELS.find(m => m.id === selectedModel)?.provider as keyof typeof PROVIDER_INSTRUCTIONS]?.url || '#'} 
                            target="_blank" 
                            className="text-[10px] font-bold text-neutral-900 hover:underline flex items-center gap-1"
                          >
                            Open Dashboard <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                        <ul className="space-y-2">
                          {PROVIDER_INSTRUCTIONS[MODELS.find(m => m.id === selectedModel)?.provider as keyof typeof PROVIDER_INSTRUCTIONS]?.steps.map((step, i) => (
                            <li key={i} className="flex gap-2 text-[11px] text-neutral-600 leading-relaxed">
                              <span className="font-bold text-neutral-400">{i + 1}.</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {MODELS.find(m => m.id === selectedModel)?.provider === 'google' ? (
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl space-y-3">
                          <p className="text-xs text-emerald-800 leading-relaxed">
                            For Google Gemini models, you can use the platform's secure account selector. This ensures your credentials are managed securely.
                          </p>
                          <button 
                            onClick={handleSelectGoogleKey}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                          >
                            <User className="w-4 h-4" />
                            Login to Google AI Account
                          </button>
                          <p className="text-[10px] text-emerald-600 text-center">
                            Requires a paid Google Cloud project. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">Learn more</a>
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-neutral-500 italic">
                            Enter your {MODELS.find(m => m.id === selectedModel)?.provider} API key or token below to login to your account.
                          </p>
                          <input 
                            type="password"
                            value={customApiKey}
                            onChange={(e) => setCustomApiKey(e.target.value)}
                            placeholder={`Enter ${MODELS.find(m => m.id === selectedModel)?.provider} API Key`}
                            className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 transition-all"
                          />
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="bg-neutral-50 border border-neutral-100 p-4 rounded-xl">
                      <p className="text-xs text-neutral-500 leading-relaxed italic">
                        Currently using default system tokens. Switch to "Use personal key" to login to your own account and use your preferred AI/LLM.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-neutral-50 border-t border-neutral-100">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full py-3 bg-neutral-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-lg"
                >
                  Save & Apply Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogoutModalOpen(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-2 rounded-lg">
                  <LogOut className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900">Close Session & Logout?</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                  <p className="text-sm text-red-700 leading-relaxed">
                    Any data or report that has not been saved will be lost. This will clear all inputs, audit results, and account settings for this session.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => confirmLogout(true)}
                  className="w-full py-3 rounded-xl font-bold text-white bg-neutral-900 hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  Save Everything & Logout
                </button>
                <button 
                  onClick={() => confirmLogout(false)}
                  className="w-full py-3 rounded-xl font-bold text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                >
                  Logout & Delete All Data
                </button>
                <button 
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="w-full py-3 rounded-xl font-bold text-neutral-500 hover:bg-neutral-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <WelcomeModal 
        isOpen={isWelcomeOpen} 
        onClose={handleCloseWelcome} 
      />

      {/* Export Confirmation Modal */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExportModalOpen(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-neutral-100 p-2 rounded-lg">
                  <ExternalLink className="w-5 h-5 text-neutral-600" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900">Exporting Suggested Actions</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                <p className="text-sm text-neutral-600 leading-relaxed">
                  You are about to export the three suggested actions to the BRIDGE application.
                </p>
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">What happens next:</p>
                  <ul className="text-xs text-neutral-600 space-y-2">
                    <li className="flex gap-2">
                      <div className="w-1 h-1 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
                      The "Suggested Actions" will be copied to your clipboard.
                    </li>
                    <li className="flex gap-2">
                      <div className="w-1 h-1 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
                      A new browser tab will open for the BRIDGE application.
                    </li>
                    <li className="flex gap-2">
                      <div className="w-1 h-1 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
                      The text will be passed to the application via the URL.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsExportModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-neutral-500 hover:bg-neutral-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmExport}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-neutral-900 hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  Proceed
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reword Confirmation Modal */}
      <AnimatePresence>
        {isRewordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRewordModalOpen(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900">Reword Suggestion?</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Rewording this suggestion will focus the engine on this specific action. 
                  <span className="block mt-2 font-bold text-red-600">Note: The other 2 suggestions will be deleted to give space for the rewording of your preferred suggestion.</span>
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsRewordModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-neutral-500 hover:bg-neutral-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmReword}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-neutral-900 hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  Confirm Reword
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
