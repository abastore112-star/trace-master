/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_CLOUD_HQ_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
