import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Zap, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: (dontShowAgain: boolean) => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onClose(dontShowAgain)}
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-neutral-900 px-8 py-10 text-white relative">
              <button 
                onClick={() => onClose(dontShowAgain)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Welcome to CORE</h2>
                  <p className="text-neutral-400 text-sm font-mono uppercase tracking-widest">
                    Communications Oversight & Review Engine
                  </p>
                </div>
              </div>
              <p className="text-neutral-300 leading-relaxed max-w-lg">
                CORE is a high-stakes quality gate designed to rigorously audit business communications for compliance, policy alignment, and risk mitigation.
              </p>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
              <section>
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Zap className="w-3 h-3 text-amber-500" />
                  What it can do
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-3 p-3 rounded-xl border border-neutral-100 bg-neutral-50/50">
                    <Search className="w-5 h-5 text-neutral-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-neutral-800">Compliance Audit</h4>
                      <p className="text-xs text-neutral-500 leading-relaxed">Scans for forbidden phrases and PII violations.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 rounded-xl border border-neutral-100 bg-neutral-50/50">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-neutral-800">Policy Alignment</h4>
                      <p className="text-xs text-neutral-500 leading-relaxed">Ensures drafts follow your specific SOPs and SLAs.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 rounded-xl border border-neutral-100 bg-neutral-50/50">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-neutral-800">Risk Mitigation</h4>
                      <p className="text-xs text-neutral-500 leading-relaxed">Identifies potential escalation paths and tone issues.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 rounded-xl border border-neutral-100 bg-neutral-50/50">
                    <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-neutral-800">Smart Suggestions</h4>
                      <p className="text-xs text-neutral-500 leading-relaxed">Provides polished alternatives and audience variants.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <HelpCircle className="w-3 h-3 text-emerald-500" />
                  How to use it
                </h3>
                <ol className="space-y-4">
                  <li className="flex gap-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-900 text-white text-[10px] font-bold shrink-0">1</span>
                    <div>
                      <p className="text-sm font-bold text-neutral-800">Login to your AI/LLM Account</p>
                      <p className="text-xs text-neutral-500">In order to use your favorite AI/LLM (Gemini, GPT-4, Claude, etc.), you need to login to that account via the "AI/LLM Selection Account Login" settings.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-900 text-white text-[10px] font-bold shrink-0">2</span>
                    <div>
                      <p className="text-sm font-bold text-neutral-800">Input Context</p>
                      <p className="text-xs text-neutral-500">Paste the original inquiry and your draft reply in the primary inputs.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-900 text-white text-[10px] font-bold shrink-0">3</span>
                    <div>
                      <p className="text-sm font-bold text-neutral-800">Configure Rules</p>
                      <p className="text-xs text-neutral-500">Update the Business Profile, SOPs, and Case Context if necessary.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-900 text-white text-[10px] font-bold shrink-0">4</span>
                    <div>
                      <p className="text-sm font-bold text-neutral-800">Run Audit</p>
                      <p className="text-xs text-neutral-500">Click "Run Comprehensive Audit" and wait for the high-stakes evaluation.</p>
                    </div>
                  </li>
                </ol>
              </section>
            </div>

            {/* Footer */}
            <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <span className="text-xs font-medium text-neutral-500 group-hover:text-neutral-700 transition-colors">
                  Don't show this again
                </span>
              </label>
              <button 
                onClick={() => onClose(dontShowAgain)}
                className="px-8 py-2.5 bg-neutral-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all active:scale-95 shadow-lg"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
