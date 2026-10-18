// Wyświetla listę skrótów meczów i miniatury obu drużyn, wyszukanego gracza dopasowuje po PUUID.
// Po kliknięciu przekazuje wybrany mecz do App, bez dodatkowego requestu.

import { ChevronRight, Clock3 } from 'lucide-react'
import type { MatchDetailResponse, MatchParticipantResponse } from '@renderer/types/match'
import type { GameAssetCatalog } from '../api/gameAssets'
import {
  dateFormat,
  formatDuration,
  groupMatchTeams,
  numberFormat,
  queueLabels,
  roleLabels
} from '../utils/matchPresentation'
import { GameImage } from './GameImage'
import { ChampionPortrait, ItemList } from './PlayerLoadout'

interface MatchHistoryProps {
  matches: MatchDetailResponse[]
  playerPuuid: string | null
  catalogs: Record<string, GameAssetCatalog>
  onOpenMatch: (match: MatchDetailResponse) => void
}

export function MatchHistory({
  matches,
  playerPuuid,
  catalogs,
  onOpenMatch
}: MatchHistoryProps): React.JSX.Element | null {
  if (playerPuuid === null) return null
  return (
    <section className="history-section" aria-labelledby="history-title">
      <div className="history-heading">
        <div>
          <div className="eyebrow">RECENT GAMES</div>
          <h2 id="history-title">
            Match history <span>{matches.length}</span>
          </h2>
        </div>
      </div>
      <div className="match-list">
        {matches.length === 0 && <p className="history-empty">No matches found</p>}
        {matches.map((match) => (
          <MatchCard
            key={match.matchId}
            match={match}
            participant={match.participants.find((entry) => entry.puuid === playerPuuid)}
            catalog={catalogs[match.gameVersion]}
            onOpenMatch={onOpenMatch}
          />
        ))}
      </div>
    </section>
  )
}

// Miniatury obu drużyn korzystają z tych samych zasad grupowania co pełne szczegóły.
function TeamPreview({
  match,
  participant,
  catalog
}: {
  match: MatchDetailResponse
  participant: MatchParticipantResponse
  catalog?: GameAssetCatalog
}): React.JSX.Element {
  return (
    <span className="team-previews" aria-label="Team rosters">
      {groupMatchTeams(match, participant.puuid).map(({ teamId, name, players }) => (
        <span key={teamId} className="team-preview" role="group" aria-label={name}>
          {players.length === 0 ? (
            <span className="team-roster-empty">Roster unavailable</span>
          ) : (
            <span className="team-roster">
              {players.map((player, index) => {
                const selected = player.puuid === participant.puuid
                const champion = catalog?.champions[player.championId]
                const label = `${player.gameName || 'Player'}#${player.tagLine}: ${champion?.name ?? player.championName}${selected ? ' (searched player)' : ''}`
                return (
                  <span
                    key={`${player.puuid}-${index}`}
                    className={selected ? 'team-player is-current-player' : 'team-player'}
                    aria-current={selected ? 'true' : undefined}
                  >
                    <GameImage
                      className="team-portrait"
                      src={champion?.src}
                      alt={label}
                      fallback={player.championName.slice(0, 2)}
                    />
                  </span>
                )
              })}
            </span>
          )}
        </span>
      ))}
    </span>
  )
}

// Prezentuje statystyki z backendu i przekazuje wybrany mecz do App, bez nowego requestu.
function MatchCard({
  match,
  participant,
  catalog,
  onOpenMatch
}: {
  match: MatchDetailResponse
  participant: MatchParticipantResponse | undefined
  catalog?: GameAssetCatalog
  onOpenMatch: (match: MatchDetailResponse) => void
}): React.JSX.Element {
  const queue = queueLabels[match.queueId] ?? `Queue ${match.queueId}`
  const duration = formatDuration(match.gameDuration)
  const startDate = new Date(match.gameStartTimestamp)
  // Brak uczestnika nie odbiera możliwości obejrzenia pozostałych danych meczu.
  if (participant === undefined) {
    return (
      <article className="match-unavailable">
        <strong>Player statistics unavailable</strong>
        <span>
          {queue} · {duration}
        </span>
        <button type="button" className="unavailable-match-link" onClick={() => onOpenMatch(match)}>
          Match details <ChevronRight size={16} aria-hidden="true" />
        </button>
      </article>
    )
  }
  return (
    <article className={`match-card ${participant.win ? 'win' : 'loss'}`}>
      <button
        type="button"
        className="match-open"
        onClick={() => onOpenMatch(match)}
        aria-label={`${participant.championName}, ${participant.win ? 'victory' : 'defeat'}, ${dateFormat.format(startDate)}. Match details`}
      >
        <span className="match-result">
          <strong>{participant.win ? 'Victory' : 'Defeat'}</strong>
          <span>{queue}</span>
          <time dateTime={startDate.toISOString()}>{dateFormat.format(startDate)}</time>
          <span className="match-duration">
            <Clock3 size={12} aria-hidden="true" />
            {duration}
          </span>
        </span>
        <span className="champion">
          <ChampionPortrait player={participant} catalog={catalog} />
          <span className="champion-description">
            <strong>
              {catalog?.champions[participant.championId]?.name ?? participant.championName}
            </strong>
            <span>{roleLabels[participant.role] ?? (participant.role || 'Unknown role')}</span>
          </span>
        </span>
        <span className="kda">
          <strong>
            {participant.kills}
            <span> / </span>
            <span className="deaths">{participant.deaths}</span>
            <span> / </span>
            {participant.assists}
          </strong>
          <span>
            {participant.kda === null ? 'Perfect' : numberFormat.format(participant.kda)} KDA
          </span>
        </span>
        <span className="farm">
          <strong>{numberFormat.format(participant.cs)} CS</strong>
          <span>
            {participant.csPerMinute === null
              ? 'N/A'
              : numberFormat.format(participant.csPerMinute)}{' '}
            / min
          </span>
          <span>{numberFormat.format(participant.killParticipation)}% KP</span>
        </span>
        <ItemList itemIds={participant.itemIds} catalog={catalog} />
        <TeamPreview match={match} participant={participant} catalog={catalog} />
        <ChevronRight className="match-open-icon" size={18} aria-hidden="true" />
      </button>
    </article>
  )
}
