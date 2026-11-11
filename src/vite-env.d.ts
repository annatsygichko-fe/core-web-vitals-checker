/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional Google API key for PageSpeed Insights (raises the request quota). */
  readonly VITE_PSI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
