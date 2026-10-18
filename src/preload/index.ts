// Mostek między procesem Electron a interfejsem React.
// Udostępnia na window wybrane API Electron; requesty do backendu wykonuje osobno renderer.

import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Miejsce na własne API mostka; obecnie renderer pobiera dane backendu przez fetch.
const api = {}

// Przy izolacji kontekstów jawnie wystawiamy funkcje na window, zamiast udostępniać cały Node.js.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // Wariant szablonu dla wyłączonej izolacji; deklaracje Window znajdują się w index.d.ts.
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
