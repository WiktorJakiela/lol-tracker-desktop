// Pełny widok już pobranego meczu: pokazuje obie drużyny, ich itemy, bany i objectivy.
// Wybór konkretnego gracza zmienia panel jego statystyk i run.

import { useState } from 'react'
import { ArrowLeft, Ban, Clock3 } from 'lucide-react'
import type { GameAssetCatalog } from '../api/gameAssets'
import type {
  MatchDetailResponse,
  MatchParticipantResponse,
  MatchTeamResponse
} from '../types/match'
import {
  dateFormat,
  formatDuration,
  groupMatchTeams,
  numberFormat,
  queueLabels,
  roleLabels
} from '../utils/matchPresentation'
import { GameImage } from './GameImage'
import { MatchRunes } from './MatchRunes'
import { ChampionPortrait, ItemList } from './PlayerLoadout'

interface MatchDetailsProps {
  match: MatchDetailResponse
  playerPuuid: string
  catalog?: GameAssetCatalog
  onBack: () => void
}

export function MatchDetails({
  match,
  playerPuuid,
  catalog,
  onBack
}: MatchDetailsProps): React.JSX.Element {
  // Wybór zmienia tylko dolny panel statystyk, bez kolejnego requestu.
  const [inspected, setInspected] = useState(
    match.participants.find((player) => player.puuid === playerPuuid) ??
      match.participants[0] ??
      null
  )
  const started = new Date(match.gameStartTimestamp)
  return (
    <section className="match-view" aria-labelledby="match-view-title">
      <header className="match-view-heading">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
          title="Back to player profile"
          aria-label="Back to player profile"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <div>
          <h1 id="match-view-title" tabIndex={-1}>
            {queueLabels[match.queueId] ?? `Queue ${match.queueId}`}
          </h1>
          <div className="match-view-meta">
            <time dateTime={started.toISOString()}>{dateFormat.format(started)}</time>
            <span>
              <Clock3 size={13} aria-hidden="true" />
              {formatDuration(match.gameDuration)}
            </span>
            <span>Patch {match.gameVersion.split('.').slice(0, 2).join('.')}</span>
          </div>
        </div>
      </header>
      <div className="scoreboards">
        {groupMatchTeams(match, playerPuuid).map(({ teamId, name, team, players }) => {
          // Przy braku danych drużyny próbujemy odczytać wynik z jej uczestnika.
          const won = team?.win ?? players[0]?.win
          return (
            <section
              key={teamId}
              className={`team-scoreboard ${won === undefined ? '' : won ? 'win' : 'loss'}`}
              aria-label={name}
            >
              <header className="team-heading">
                <div>
                  <h2>{name}</h2>
                  <p>{won === undefined ? 'Result unavailable' : won ? 'Victory' : 'Defeat'}</p>
                </div>
                {team && <span>{team.kills} kills</span>}
              </header>
              <div className="team-participants">
                {players.length === 0 && <p className="history-empty">Team roster unavailable</p>}
                {players.map((player, index) => (
                  <ParticipantRow
                    key={`${player.puuid}-${index}`}
                    player={player}
                    catalog={catalog}
                    isSearched={player.puuid === playerPuuid}
                    isSelected={player === inspected}
                    onSelect={() => setInspected(player)}
                  />
                ))}
              </div>
              <div className="team-bans" aria-label={`Bans: ${name}`}>
                <span>Bans</span>
                {team && team.bannedChampionIds.length > 0 ? (
                  team.bannedChampionIds.map((id, index) => (
                    <GameImage
                      key={index}
                      className="ban-portrait"
                      src={id > 0 ? catalog?.champions[id]?.src : undefined}
                      alt={id > 0 ? (catalog?.champions[id]?.name ?? `Champion #${id}`) : 'No ban'}
                      fallback={<Ban size={14} aria-hidden="true" />}
                    />
                  ))
                ) : (
                  <span>No data</span>
                )}
              </div>
              {team && <TeamObjectives team={team} />}
            </section>
          )
        })}
      </div>
      {match.participants.length === 0 && (
        <p className="history-empty">Match participant data unavailable</p>
      )}
      {inspected && (
        <section className="participant-detail" aria-label="Selected player statistics">
          <h2>
            {inspected.gameName || 'Player'}
            <span className="participant-tag">#{inspected.tagLine}</span>
          </h2>
          <p>
            {catalog?.champions[inspected.championId]?.name ?? inspected.championName} ·{' '}
            {roleLabels[inspected.role] ?? (inspected.role || 'Unknown role')}
          </p>
          <MatchRunes runes={inspected.runes} catalog={catalog} />
          <dl className="detail-stats">
            {[
              ['KDA', inspected.kda === null ? 'Perfect' : numberFormat.format(inspected.kda)],
              ['Kill participation', `${numberFormat.format(inspected.killParticipation)}%`],
              [
                'CS / min',
                inspected.csPerMinute === null
                  ? 'No data'
                  : numberFormat.format(inspected.csPerMinute)
              ],
              ['Gold earned', numberFormat.format(inspected.goldEarned)],
              ['Damage to champions', numberFormat.format(inspected.damageToChampions)],
              ['Damage taken', numberFormat.format(inspected.damageTaken)],
              ['Vision score', numberFormat.format(inspected.visionScore)]
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </section>
  )
}

// isSearched wskazuje właściciela profilu, a isSelected uczestnika aktualnie oglądanego w panelu.
function ParticipantRow({
  player,
  catalog,
  isSearched,
  isSelected,
  onSelect
}: {
  player: MatchParticipantResponse
  catalog?: GameAssetCatalog
  isSearched: boolean
  isSelected: boolean
  onSelect: () => void
}): React.JSX.Element {
  const champion = catalog?.champions[player.championId]?.name ?? player.championName
  return (
    <button
      type="button"
      className={`participant-row${isSelected ? ' is-selected' : ''}${isSearched ? ' is-searched' : ''}`}
      aria-pressed={isSelected}
      onClick={onSelect}
      title={`Player statistics ${player.gameName || 'Player'}#${player.tagLine}`}
    >
      <span className="score-identity">
        <ChampionPortrait player={player} catalog={catalog} />
        <span className="score-name">
          <strong>{player.gameName || 'Player'}</strong>
          <span>#{player.tagLine}</span>
          <span>
            {champion} · {roleLabels[player.role] ?? (player.role || 'Unknown role')}
          </span>
        </span>
      </span>
      <span className="score-performance">
        <strong className="score-kda">
          {player.kills} / <span>{player.deaths}</span> / {player.assists}
        </strong>
        <span>
          {numberFormat.format(player.cs)} CS · {numberFormat.format(player.killParticipation)}% KP
        </span>
        <span>{numberFormat.format(player.goldEarned)} gold</span>
        <span>{numberFormat.format(player.visionScore)} vision score</span>
      </span>
      <span className="score-loadout">
        <ItemList itemIds={player.itemIds} catalog={catalog} className="participant-items" />
        {/* Skrót pokazuje runę kluczową i poboczne drzewko, komplet run jest w dolnym panelu. */}
        {player.runes && (
          <span className="score-runes" aria-label="Runes">
            {[player.runes.primaryRuneIds[0], player.runes.secondaryStyleId].map((id, index) =>
              id === undefined ? null : (
                <GameImage
                  key={index}
                  className="score-rune"
                  src={catalog?.runes[id]?.src}
                  alt={catalog?.runes[id]?.name ?? `Rune #${id}`}
                />
              )
            )}
          </span>
        )}
      </span>
    </button>
  )
}

// Liczniki objectivów są przygotowane w backendzie, tutaj przypisujemy im etykiety do wyświetlenia.
function TeamObjectives({ team }: { team: MatchTeamResponse }): React.JSX.Element {
  return (
    <dl className="team-objectives">
      {[
        ['Barons', team.baronKills],
        ['Dragons', team.dragonKills],
        ['Void Grubs', team.hordeKills],
        ['Rift Heralds', team.riftHeraldKills],
        ['Towers', team.towerKills],
        ['Inhibitors', team.inhibitorKills]
      ].map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
