/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_TSUKI_API_BASE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
