// Typy odpowiedzi backendu dla meczu, uczestników, drużyn i run.
// Opisują kształt danych dla komponentów; nie pobierają ich ani nie wykonują obliczeń.

export interface MatchDetailResponse {
  matchId: string
  gameStartTimestamp: number
  gameDuration: number
  queueId: number
  gameVersion: string
  participants: MatchParticipantResponse[]
  teams: MatchTeamResponse[]
}

// KDA, KP i CS/min oblicza backend; kda=null oznacza brak zgonów, a csPerMinute=null brak poprawnego czasu.
export interface MatchParticipantResponse {
  puuid: string
  gameName: string
  tagLine: string
  teamId: number
  win: boolean
  championId: number
  championName: string
  championLevel: number
  role: string
  kills: number
  deaths: number
  assists: number
  kda: number | null
  killParticipation: number
  cs: number
  csPerMinute: number | null
  goldEarned: number
  visionScore: number
  itemIds: number[]
  summoner1Id: number
  summoner2Id: number
  damageToChampions: number
  damageTaken: number
  runes: MatchRunesResponse | null
}

// Wynik, bany i cele mapy dla jednej drużyny, łączonej z uczestnikami przez teamId.
export interface MatchTeamResponse {
  teamId: number
  win: boolean
  kills: number
  bannedChampionIds: number[]
  baronKills: number
  dragonKills: number
  hordeKills: number
  riftHeraldKills: number
  towerKills: number
  inhibitorKills: number
}

// Identyfikatory drzewek, run i odłamków, które katalog grafik zamienia na nazwy i obrazy.
export interface MatchRunesResponse {
  primaryStyleId: number
  secondaryStyleId: number
  primaryRuneIds: number[]
  secondaryRuneIds: number[]
  offenseShardId: number
  flexShardId: number
  defenseShardId: number
}
