/// <reference types="vite/client" />

declare const __GIT_HASH__: string
declare const __BUILD_NUMBER__: string

declare module 'virtual:pwa-register/react' {
  import type { Dispatch, SetStateAction } from 'react'
  export function useRegisterSW(options?: {
    onRegistered?: (r: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: unknown) => void
  }): {
    needRefresh: [boolean, Dispatch<SetStateAction<boolean>>]
    offlineReady: [boolean, Dispatch<SetStateAction<boolean>>]
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
}
