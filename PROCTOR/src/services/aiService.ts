import { GoogleGenAI } from '@google/genai';
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

// ── Quota / error helpers ────────────────────────────────────────────────────

function isQuota(err: unknown) {
  const s = String(err);
  return s.includes('429') || s.includes('RESOURCE_EXHAUSTED') || s.includes('quota');
}

function friendlyError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (isQuota(err)) return 'Quota exceeded. Wait a moment and try again, or switch to a different model or provider.';
  if (raw.includes('401') || raw.includes('API_KEY_INVALID') || raw.includes('invalid x-api-key'))
    return 'Invalid API key. Please reconnect this provider.';
  if (raw.includes('404') || raw.includes('NOT_FOUND') || raw.includes('not found'))
    return `Model not available: ${raw.split('"message"')[1]?.slice(0, 120) ?? raw.slice(0, 120)}`;
  return `Generation failed: ${raw.slice(0, 300)}`;
}

// ── Gemini ───────────────────────────────────────────────────────────────────

async function callGemini(model: string, prompt: string): Promise<string> {
  const envKey1 = process.env.GEMINI_API_KEY ?? '';
  const envKey2 = process.env.GEMINI_API_KEY_2 ?? '';
  const storedKey = loadKey('gemini');

  // Priority: stored key (user-provided) → env key 1 → env key 2
  const keys = storedKey
    ? [storedKey]
    : [envKey1, envKey2].filter(Boolean);

  if (keys.length === 0) throw new Error('No Gemini API key found. Please connect Gemini.');

  let lastErr: unknown;
  for (let i = 0; i < keys.length; i++) {
    try {
      const ai = new GoogleGenAI({ apiKey: keys[i] });
      const resp = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.4 },
      });
      return resp.text ?? '';
    } catch (err) {
      lastErr = err;
      if (isQuota(err) && i < keys.length - 1) {
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
  if (!key) throw new Error('No Claude API key. Please connect Anthropic Claude.');

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      system: SYSTEM_INSTRUCTION,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(body);
  }
  const data = await resp.json();
  return data.content?.[0]?.text ?? '';
}

// ── OpenAI ───────────────────────────────────────────────────────────────────

async function callOpenAI(model: string, prompt: string): Promise<string> {
  const key = loadKey('openai');
  if (!key) throw new Error('No OpenAI API key. Please connect OpenAI.');

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: prompt },
      ],
      max_tokens: 8192,
      temperature: 0.4,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(body);
  }
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
      case 'gemini': return await callGemini(inputs.model, prompt);
      case 'claude': return await callClaude(inputs.model, prompt);
      case 'openai': return await callOpenAI(inputs.model, prompt);
      default: throw new Error(`Unknown provider: ${inputs.provider}`);
    }
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}
