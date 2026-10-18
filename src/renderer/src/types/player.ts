// Typy odpowiedzi backendu dla profilu gracza i jego wpisów rankingowych.
// Pomagają TypeScriptowi sprawdzać użycie danych, ale nie walidują otrzymanego JSON w czasie działania.

export interface RankedEntryResponse {
  queueType: string
  tier: string
  rank: string
  leaguePoints: number
  wins: number
  losses: number
  gamesPlayed: number
  winrate: number
}

// Kontrakt profilu gracza, zgodny z polami backendowego PlayerResponse.
export interface PlayerResponse {
  puuid: string
  gameName: string
  tagLine: string
  region: string
  level: number
  profileIconId: number
  rankedEntries: RankedEntryResponse[]
}
