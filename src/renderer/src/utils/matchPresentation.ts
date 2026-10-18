// Wspólne funkcje prezentacji meczów: etykiety kolejek i pozycji, formatowanie liczb oraz czasu.
// Grupuje też uczestników po teamId i ustawia drużynę wyszukiwanego gracza jako pierwszą.

import type {
  MatchDetailResponse,
  MatchParticipantResponse,
  MatchTeamResponse
} from '../types/match'

export const queueLabels: Record<number, string> = { 420: 'Solo/Duo', 440: 'Flex', 450: 'ARAM' }
export const roleLabels: Record<string, string> = {
  TOP: 'Top',
  JUNGLE: 'Jungle',
  MIDDLE: 'Mid',
  BOTTOM: 'ADC',
  UTILITY: 'Support'
}
// Formatujemy liczby i daty do wyświetlenia, nie przeliczając statystyk wyznaczonych w backendzie.
export const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
export const dateFormat = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

// Czas z API w sekundach pokazujemy jako minuty:sekundy.
export function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

interface MatchTeamGroup {
  teamId: number
  name: string
  team: MatchTeamResponse | undefined
  players: MatchParticipantResponse[]
}

// Łączy dane drużyn ze składami i ustawia drużynę wyszukiwanego gracza jako pierwszą.
export function groupMatchTeams(match: MatchDetailResponse, playerPuuid: string): MatchTeamGroup[] {
  const ownTeamId = match.participants.find((player) => player.puuid === playerPuuid)?.teamId
  // Kolejność uczestników nie określa drużyny. Zachowujemy też drużyny bez składu.
  const teamIds = [
    ...new Set([
      ...match.teams.map((team) => team.teamId),
      ...match.participants.map((player) => player.teamId)
    ])
  ].sort((a, b) => (a === b ? 0 : a === ownTeamId ? -1 : b === ownTeamId ? 1 : a - b))
  return teamIds.map((teamId, index) => ({
    teamId,
    name:
      teamId === ownTeamId
        ? 'Your team'
        : ownTeamId === undefined
          ? `Team ${index + 1}`
          : 'Opponents',
    team: match.teams.find((team) => team.teamId === teamId),
    players: match.participants.filter((player) => player.teamId === teamId)
  }))
}
