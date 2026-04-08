/**
 * aiStore — shared localStorage interface for JAXX Suite.
 * All apps read from these keys so one setup covers the whole suite.
 *
 * Keys written:
 *   jaxx_key_gemini | jaxx_key_claude | jaxx_key_openai
 *   jaxx_provider
 *   jaxx_model
 */

import type { ProviderId } from './providers';

const KEY = (p: ProviderId) => `jaxx_key_${p}`;
const PROVIDER_KEY = 'jaxx_provider';
const MODEL_KEY    = 'jaxx_model';

export function saveKey(provider: ProviderId, key: string) {
  if (key) localStorage.setItem(KEY(provider), key);
  else localStorage.removeItem(KEY(provider));
}

export function loadKey(provider: ProviderId): string {
  return localStorage.getItem(KEY(provider)) ?? '';
}

export function isConnected(provider: ProviderId): boolean {
  return loadKey(provider).length > 0;
}

export function saveSelection(provider: ProviderId, model: string) {
  localStorage.setItem(PROVIDER_KEY, provider);
  localStorage.setItem(MODEL_KEY, model);
}

export function loadSelection(): { provider: ProviderId; model: string } | null {
  const provider = localStorage.getItem(PROVIDER_KEY) as ProviderId | null;
  const model    = localStorage.getItem(MODEL_KEY);
  if (!provider || !model) return null;
  return { provider, model };
}

/** True when a built-in shared Gemini key is available (injected at build time). */
export function hasSharedGeminiKey(): boolean {
  return Boolean(
    (process.env as Record<string, string | undefined>).GEMINI_API_KEY ||
    (process.env as Record<string, string | undefined>).GEMINI_API_KEY_2
  );
}
