// Wyświetla wskaźnik ładowania, gdy App czeka na profil i historię, sam nie pobiera danych.
// Atrybut role=status udostępnia komunikat ładowania czytnikom ekranu.

import { LoaderCircle } from 'lucide-react'

export function LoadingState(): React.JSX.Element {
  return (
    <section className="loading-state" role="status" aria-atomic="true">
      <LoaderCircle className="loading-spinner" size={32} aria-hidden="true" />
      <p>Loading player data…</p>
    </section>
  )
}
