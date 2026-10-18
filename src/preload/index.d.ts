// Opisuje TypeScriptowi API mostka na window; samo udostępnienie wykonuje preload/index.ts.

import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
  }
}
