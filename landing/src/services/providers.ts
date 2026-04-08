export type ProviderId = 'gemini' | 'claude' | 'openai';

export interface ModelDef {
  id: string;
  label: string;
  description: string;
  contextWindow: string;
  speed: 'Fast' | 'Balanced' | 'Thorough';
  badge?: string;
}

export interface ProviderDef {
  id: ProviderId;
  label: string;
  logo: string; // emoji stand-in until we add SVGs
  tagline: string;
  keyLabel: string;
  keyPlaceholder: string;
  keyHelpUrl: string;
  keyHelpText: string;
  models: ModelDef[];
}

export const PROVIDERS: ProviderDef[] = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    logo: '✦',
    tagline: 'Google\'s multimodal AI — large context, fast responses.',
    keyLabel: 'Gemini API Key',
    keyPlaceholder: 'AIza…',
    keyHelpUrl: 'https://aistudio.google.com/apikey',
    keyHelpText: 'Get your free key at aistudio.google.com',
    models: [
      {
        id: 'gemini-2.5-flash',
        label: 'Gemini 2.5 Flash',
        description: 'Latest generation. Best speed-to-quality balance for structured documents.',
        contextWindow: '1M tokens',
        speed: 'Fast',
        badge: 'Recommended',
      },
      {
        id: 'gemini-2.5-pro',
        label: 'Gemini 2.5 Pro',
        description: 'Highest reasoning quality. Best for complex, multi-audience presentations.',
        contextWindow: '1M tokens',
        speed: 'Thorough',
        badge: 'Best Quality',
      },
    ],
  },
  {
    id: 'claude',
    label: 'Anthropic Claude',
    logo: '◆',
    tagline: 'Renowned for nuanced, well-structured professional writing.',
    keyLabel: 'Claude API Key',
    keyPlaceholder: 'sk-ant-…',
    keyHelpUrl: 'https://console.anthropic.com/settings/keys',
    keyHelpText: 'Get your key at console.anthropic.com',
    models: [
      {
        id: 'claude-opus-4-6',
        label: 'Claude Opus 4.6',
        description: 'Most capable Claude. Exceptional at structured executive communication.',
        contextWindow: '200K tokens',
        speed: 'Thorough',
        badge: 'Best Quality',
      },
      {
        id: 'claude-sonnet-4-6',
        label: 'Claude Sonnet 4.6',
        description: 'Best balance of quality and speed. Ideal for most presentation outlines.',
        contextWindow: '200K tokens',
        speed: 'Balanced',
        badge: 'Recommended',
      },
      {
        id: 'claude-haiku-4-5-20251001',
        label: 'Claude Haiku 4.5',
        description: 'Fast and cost-efficient. Good for quick drafts and shorter content.',
        contextWindow: '200K tokens',
        speed: 'Fast',
      },
    ],
  },
  {
    id: 'openai',
    label: 'OpenAI / Copilot',
    logo: '⬡',
    tagline: 'Powered by GPT-4o. Broad reasoning with strong document structure.',
    keyLabel: 'OpenAI API Key',
    keyPlaceholder: 'sk-…',
    keyHelpUrl: 'https://platform.openai.com/api-keys',
    keyHelpText: 'Get your key at platform.openai.com',
    models: [
      {
        id: 'gpt-4o',
        label: 'GPT-4o',
        description: 'Flagship model. Strong structured output and executive-level tone.',
        contextWindow: '128K tokens',
        speed: 'Balanced',
        badge: 'Recommended',
      },
      {
        id: 'gpt-4o-mini',
        label: 'GPT-4o Mini',
        description: 'Faster and lighter. Good for quick outlines and shorter source content.',
        contextWindow: '128K tokens',
        speed: 'Fast',
      },
      {
        id: 'o3-mini',
        label: 'o3-mini',
        description: 'Advanced reasoning model. Excellent for risk, compliance, and financial reviews.',
        contextWindow: '200K tokens',
        speed: 'Thorough',
        badge: 'Best Reasoning',
      },
    ],
  },
];

export const DEFAULT_PROVIDER: ProviderId = 'gemini';
export const DEFAULT_MODEL_BY_PROVIDER: Record<ProviderId, string> = {
  gemini: 'gemini-2.5-flash',
  claude: 'claude-sonnet-4-6',
  openai: 'gpt-4o',
};
