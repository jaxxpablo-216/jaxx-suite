import type { ProviderId } from './providers';
import { SYSTEM_INSTRUCTION } from './geminiService';

// ── Stored keys (localStorage per provider) ─────────────────────────────────

const STORAGE_KEY = (p: ProviderId) => `proctor_key_${p}`;

export function saveKey(provider: ProviderId, key: string) {
  if (key) localStorage.setItem(STORAGE_KEY(provider), key);
  else localStorage.removeItem(STORAGE_KEY(provider));
}

export function loadKey(provider: ProviderId): string {
  return localStorage.getItem(STORAGE_KEY(provider)) ?? '';
}

export function isConnected(provider: ProviderId): boolean {
  return loadKey(provider).length > 0;
}

/** True when a built-in (env-level) shared key exists for this provider. */
export function hasSharedKey(provider: ProviderId): boolean {
  if (provider === 'gemini') {
    return Boolean(process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_2);
  }
  return false;
}

/**
 * True when the provider can generate without the user supplying their own key.
 * Gemini: shared env key covers it.
 * Claude / OpenAI: always need a personal key.
 */
export function canGenerateWithoutKey(provider: ProviderId): boolean {
  return hasSharedKey(provider);
}

// ── Error helpers ────────────────────────────────────────────────────────────

function isQuota(s: string) {
  return s.includes('429') || s.includes('RESOURCE_EXHAUSTED') || s.includes('quota');
}

function friendlyError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (isQuota(raw))
    return 'Quota exceeded — wait a moment then retry, or switch to a different model.';
  if (raw.includes('401') || raw.includes('403') || raw.includes('API_KEY_INVALID') ||
      raw.includes('invalid x-api-key') || raw.includes('Unauthorized') ||
      raw.includes('Permission denied') || raw.includes('authentication'))
    return 'Invalid or unauthorized API key — please reconnect this provider.';
  if (raw.includes('404') || raw.includes('NOT_FOUND') || raw.includes('not found'))
    return 'Model not found — it may not be available on your key tier. Try a different model.';
  // Pass-through for "No X API key" so the UI can act on it
  if (/^No \w/.test(raw)) return raw;
  return `Generation failed: ${raw.slice(0, 200)}`;
}

// ── Gemini — direct REST v1 (bypasses SDK's v1beta default) ─────────────────
//
// The @google/genai SDK routes to v1beta by default, which rejects model IDs
// that are only available in the stable v1 endpoint. We call v1 directly so
// we own the exact URL and avoid any SDK-level routing surprises.

const GEMINI_V1 = 'https://generativelanguage.googleapis.com/v1/models';

const GEMINI_BODY = (prompt: string) => JSON.stringify({
  system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  generationConfig: { temperature: 0.4 },
});

async function parseGeminiResponse(resp: Response): Promise<string> {
  if (!resp.ok) throw new Error(await resp.text());
  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

/** Call Gemini with a developer API key (?key= query param). */
async function callGeminiKey(model: string, prompt: string, apiKey: string): Promise<string> {
  return parseGeminiResponse(
    await fetch(`${GEMINI_V1}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: GEMINI_BODY(prompt),
    })
  );
}

/**
 * Call Gemini with a Google OAuth2 Bearer token.
 * The token comes from the user's in-session Google sign-in — nothing is stored
 * beyond React state, and it is cleared when the tab is closed.
 */
async function callGeminiBearer(model: string, prompt: string, token: string): Promise<string> {
  return parseGeminiResponse(
    await fetch(`${GEMINI_V1}/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: GEMINI_BODY(prompt),
    })
  );
}

async function callGemini(model: string, prompt: string, googleToken?: string): Promise<string> {
  // Google sign-in session token takes priority over keys (user's own access)
  if (googleToken) return callGeminiBearer(model, prompt, googleToken);

  const storedKey = loadKey('gemini');
  const keys = storedKey
    ? [storedKey]
    : [process.env.GEMINI_API_KEY ?? '', process.env.GEMINI_API_KEY_2 ?? ''].filter(Boolean);

  if (keys.length === 0)
    throw new Error('No Gemini API key found — please connect Gemini in provider settings.');

  let lastErr: unknown;
  for (let i = 0; i < keys.length; i++) {
    try {
      return await callGeminiKey(model, prompt, keys[i]);
    } catch (err) {
      lastErr = err;
      const raw = String(err);
      if (isQuota(raw) && i < keys.length - 1) {
        console.warn(`[PROCTOR] Gemini key ${i + 1} quota hit, trying key ${i + 2}…`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// ── Claude ───────────────────────────────────────────────────────────────────

async function callClaude(model: string, prompt: string): Promise<string> {
  const key = loadKey('claude');
  if (!key)
    throw new Error('No Claude API key — connect Anthropic Claude in provider settings.');

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      system: SYSTEM_INSTRUCTION,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!resp.ok) throw new Error(await resp.text());
  const data = await resp.json();
  return data.content?.[0]?.text ?? '';
}

// ── OpenAI ───────────────────────────────────────────────────────────────────
//
// Reasoning models (o3-mini, o3, o1, o1-mini) have different parameter rules:
//   - Use max_completion_tokens instead of max_tokens
//   - Do not accept temperature
//   - Do not accept a system role message (prepend to user message instead)

const REASONING_MODELS = new Set(['o3-mini', 'o3', 'o1', 'o1-mini']);

async function callOpenAI(model: string, prompt: string): Promise<string> {
  const key = loadKey('openai');
  if (!key)
    throw new Error('No OpenAI API key — connect OpenAI in provider settings.');

  const isReasoning = REASONING_MODELS.has(model);

  const body: Record<string, unknown> = {
    model,
    messages: isReasoning
      ? [{ role: 'user', content: `${SYSTEM_INSTRUCTION}\n\n${prompt}` }]
      : [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          { role: 'user', content: prompt },
        ],
    ...(isReasoning
      ? { max_completion_tokens: 8192 }
      : { max_tokens: 8192, temperature: 0.4 }),
  };

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) throw new Error(await resp.text());
  const data = await resp.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ── Public entry point ───────────────────────────────────────────────────────

export async function generateOutline(inputs: {
  primaryContent: string;
  executiveContext: string;
  audiences: string[];
  presentationType: string;
  provider: ProviderId;
  model: string;
  /** Google OAuth2 Bearer token from sign-in-with-Google flow (session only). */
  googleToken?: string;
}): Promise<string> {
  const prompt = `
Please generate a full presentation blueprint based on the following inputs.

**Primary Content (Raw Materials):**
${inputs.primaryContent}

**Executive Context:**
${inputs.executiveContext || 'None provided.'}

**Target Audience:**
${inputs.audiences.length > 0 ? inputs.audiences.join(', ') : 'General Leadership'}

**Presentation Type:**
${inputs.presentationType}

Generate the complete PROCTOR Presentation Blueprint now.
`.trim();

  try {
    switch (inputs.provider) {
      case 'gemini': return await callGemini(inputs.model, prompt, inputs.googleToken);
      case 'claude': return await callClaude(inputs.model, prompt);
      case 'openai': return await callOpenAI(inputs.model, prompt);
      default: throw new Error(`Unknown provider: ${inputs.provider}`);
    }
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}
