// Punkt startowy interfejsu: wczytuje tracker.css i montuje komponent App w elemencie root.

import './assets/tracker.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// Montujemy App w elemencie root z HTML; StrictMode dodaje kontrole developerskie, nie drugi widok.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
