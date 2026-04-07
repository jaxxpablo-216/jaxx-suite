import React from 'react';
import { ShieldCheck, Layout, Layers, ArrowRight, Zap, ExternalLink } from 'lucide-react';

const APPS = [
  {
    id: 'recore',
    name: 'Re:CORE',
    fullName: 'Revised Communications Oversight & Review Engine',
    description:
      'A high-stakes communications audit engine. Paste any draft reply and receive an instant AI-powered review covering tone, compliance, PII exposure, policy alignment, and risk flags — with three polished rewrite variants and audience-specific messaging, across six professional reviewer personas.',
    href: '/ReCORE/',
    icon: ShieldCheck,
    accent: 'emerald',
    tag: 'Compliance & Quality',
    features: ['Tone & compliance audit', '6 reviewer personas', 'Suggested rewrites', 'Escalation detection'],
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
  },
  {
    id: 'proctor',
    name: 'PROCTOR',
    fullName: 'Presentation Report & Outline Construction Tool for Organizational Resources',
    description:
      'A presentation architecture engine. Upload raw content, reports, or meeting notes alongside executive context, select your leadership audience, and instantly receive a structured, audience-tailored presentation outline — complete with talking points, anticipated Q&A, compliance flags, and a readiness checklist.',
    href: '/proctor/',
    icon: Layers,
    accent: 'blue',
    tag: 'Presentation Design',
    features: ['File & text input', 'Audience targeting', 'Structured outline', 'Q&A preparation'],
  },
];

const accentMap: Record<string, { bg: string; border: string; text: string; badge: string; icon: string; btn: string }> = {
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30 hover:border-emerald-400/60',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    icon: 'bg-emerald-500/15 text-emerald-400',
    btn: 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30 hover:border-amber-400/60',
    text: 'text-amber-400',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    icon: 'bg-amber-500/15 text-amber-400',
    btn: 'bg-amber-500 hover:bg-amber-400 text-neutral-950',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30 hover:border-blue-400/60',
    text: 'text-blue-400',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    icon: 'bg-blue-500/15 text-blue-400',
    btn: 'bg-blue-500 hover:bg-blue-400 text-white',
  },
};

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">

      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-5">
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
          </div>
          <div className="text-xs font-mono uppercase tracking-widest text-neutral-600">
            v1.0 · 2026
          </div>
        </div>
      </header>

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
          <p className="text-neutral-400 text-lg max-w-2xl leading-relaxed">
            Three specialized AI engines built for enterprise communication — from auditing a single draft
            reply to architecting a company-wide leadership rollout.
          </p>
        </div>
      </section>

      {/* App Cards */}
      <main className="flex-1 px-6 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {APPS.map((app) => {
            const colors = accentMap[app.accent];
            const Icon = app.icon;
            return (
              <div
                key={app.id}
                className={`relative flex flex-col border rounded-xl p-6 transition-all duration-300 bg-neutral-900/60 ${colors.border}`}
              >
                {/* Badge */}
                <div className="flex items-center justify-between mb-5">
                  <span className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded border ${colors.badge}`}>
                    {app.tag}
                  </span>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors.icon}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                {/* Name */}
                <h2 className="text-2xl font-bold tracking-tight mb-1">{app.name}</h2>
                <p className={`text-[10px] font-mono uppercase tracking-wider mb-4 ${colors.text}`}>
                  {app.fullName}
                </p>

                {/* Description */}
                <p className="text-sm text-neutral-400 leading-relaxed flex-1 mb-5">
                  {app.description}
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {app.features.map((f) => (
                    <span
                      key={f}
                      className="text-[10px] font-mono text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                {/* Launch button */}
                <a
                  href={app.href}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-sm transition-all active:scale-95 ${colors.btn}`}
                >
                  Launch {app.name}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            );
          })}
        </div>
      </main>

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
