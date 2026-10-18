// Hook grupujący profil, mecze, stan ładowania i błąd wraz z setterami używanymi przez App.
// Każde wywołanie hooka ma własny stan, to nie jest globalny magazyn danych.

import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { PlayerResponse } from '@renderer/types/player'
import type { MatchDetailResponse } from '@renderer/types/match'
// Kształt wyniku hooka: aktualne dane oraz settery, którymi App może je aktualizować.
interface TrackerState {
  player: PlayerResponse | null
  setPlayer: Dispatch<SetStateAction<PlayerResponse | null>>
  matches: MatchDetailResponse[]
  setMatches: Dispatch<SetStateAction<MatchDetailResponse[]>>
  isLoading: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
  error: string | null
  setError: Dispatch<SetStateAction<string | null>>
}

export function useTrackerState(): TrackerState {
  // Zaczynamy bez danych gracza, wypełniają je dopiero zakończone requesty do backendu.
  const [player, setPlayer] = useState<PlayerResponse | null>(null)
  const [matches, setMatches] = useState<MatchDetailResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return {
    player,
    setPlayer,
    matches,
    setMatches,
    isLoading,
    setIsLoading,
    error,
    setError
  }
}
