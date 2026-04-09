/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace NodeJS {
  interface ProcessEnv {
    GEMINI_API_KEY?: string;
    GEMINI_API_KEY_2?: string;
    API_KEY?: string;
    DISABLE_HMR?: string;
  }
}
