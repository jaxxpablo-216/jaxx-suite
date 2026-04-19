// landing/src/components/LoginScreen.tsx
import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, Loader2, Key } from 'lucide-react';
import { motion } from 'motion/react';
import { authenticate, saveSession, seedSuperadmin } from '../services/auth';
import type { Employee } from '../services/auth';
import { cn } from '../utils/cn'; // I will create this utility if not exist, or inline twMerge/clsx

export function LoginScreen({ onLogin }: { onLogin: (emp: Employee) => void }) {
  const [employeeId, setEmployeeId] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Developer seeding logic for 2025-998
  const [seedMsg, setSeedMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !token) return;
    setError('');
    setLoading(true);
    try {
      const user = await authenticate(employeeId, token);
      if (user) {
        saveSession(user);
        onLogin(user);
      } else {
        setError('Invalid Employee ID or Token, or Token expired.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred during login constraints.');
    }
    setLoading(false);
  };

  const handleSeed = async () => {
    try {
      setSeedMsg('Generating...');
      const newToken = await seedSuperadmin('2025-998', 9999);
      setSeedMsg(`Superadmin (2025-998) token created: ${newToken}`);
    } catch (err: any) {
      setSeedMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center border border-neutral-700 shadow-inner">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">JAXX Suite Access</h1>
            <p className="text-sm text-neutral-400">Enter your Employee ID and Access Token to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Employee ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. 2025-998"
                  className="w-full bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all pl-11 font-mono"
                />
                <Lock className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Access Token
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your 16-char token"
                  className="w-full bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all pl-11 font-mono"
                />
                <Key className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl flex items-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !employeeId || !token}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-4 py-3.5 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Authenticate
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Dev Seed Button (to fulfill the user's immediate request without CLI access) */}
          <div className="mt-8 pt-6 border-t border-neutral-800/50 text-center">
            <button
              onClick={handleSeed}
              className="text-xs text-neutral-500 hover:text-white transition-colors underline decoration-neutral-700 underline-offset-4"
            >
              [Dev] Seed Master Token for 2025-998
            </button>
            {seedMsg && (
              <p className="mt-4 text-[11px] font-mono p-3 bg-neutral-950/50 text-emerald-400 border border-emerald-500/20 rounded-lg break-all">
                {seedMsg}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
