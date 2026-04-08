/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly GEMINI_API_KEY: string;
  readonly GEMINI_API_KEY_2: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// export {} makes this a module so declare global augmentation is valid
// under "moduleDetection": "force"
export {};

// Google Identity Services minimal types (loaded via <script> in index.html)
declare global {
  interface GisTokenResponse {
    access_token?: string;
    error?: string;
    error_description?: string;
  }

  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: GisTokenResponse) => void;
          }): { requestAccessToken(): void };
          revoke(token: string, done?: () => void): void;
        };
      };
    };
  }
}
