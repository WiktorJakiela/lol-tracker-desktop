// Prezentuje profil gracza z backendu: ikonę, nazwę, poziom, region i wyniki rankingowe.
// Dobiera grafiki rang i etykiety, ale nie oblicza ponownie statystyk.

import { MapPin, Shield } from 'lucide-react'
import type { PlayerResponse } from '@renderer/types/player'
import { profileIconUrl } from '../api/gameAssets'
import { GameImage } from './GameImage'

// Vite dołącza lokalne emblematy do buildu i zwraca słownik ich gotowych adresów.
const rankImages = import.meta.glob<string>('../assets/ranks/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
})

const queueLabels: Record<string, string> = {
  RANKED_SOLO_5x5: 'Solo/Duo',
  RANKED_FLEX_SR: 'Flex',
  RANKED_TEAM_5x5: '5v5'
}

export function PlayerProfile({
  player,
  profileVersion
}: {
  player: PlayerResponse
  profileVersion: string | null
}): React.JSX.Element {
  return (
    <section className="profile-section" id="profile" aria-label="Player profile">
      <div className="identity">
        <GameImage
          className="player-monogram"
          src={profileIconUrl(profileVersion, player.profileIconId)}
          alt={`Player icon ${player.gameName}`}
          fallback={player.gameName.slice(0, 1)}
        />
        <div>
          <div className="eyebrow">SUMMONER PROFILE</div>
          <h1>
            {player.gameName}
            <span>#{player.tagLine}</span>
          </h1>
          <div className="identity-meta">
            <span>
              <MapPin size={13} aria-hidden="true" />
              {player.region}
            </span>
            <span>Level {player.level}</span>
          </div>
        </div>
      </div>
      <div className="ranks">
        {player.rankedEntries.length === 0 && <p className="rank-name">Unranked</p>}
        {player.rankedEntries.map((rank) => (
          <div className="rank" key={rank.queueType}>
            <GameImage
              className="rank-emblem"
              src={rankImages[`../assets/ranks/${rank.tier}.png`]}
              alt={`Rank ${rank.tier}`}
              fallback={<Shield size={24} aria-hidden="true" />}
            />
            <div>
              <div className="rank-queue">
                Ranked {queueLabels[rank.queueType] ?? rank.queueType}
              </div>
              <div className="rank-name">
                {rank.tier}
                {/* Najwyższe rangi wyświetlamy bez dywizji (np. challenger I), mimo że może wystąpić w danych Riot. */}
                {!['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(rank.tier) && ` ${rank.rank}`}
                <span>{rank.leaguePoints} LP</span>
              </div>
              <div className="rank-record">
                {rank.wins} W / {rank.losses} L <span>{rank.winrate}% win rate</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
