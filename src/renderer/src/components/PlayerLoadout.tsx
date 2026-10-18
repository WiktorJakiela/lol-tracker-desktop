// Wspólne elementy itemów uczestnika dla historii i szczegółów meczu.
// ChampionPortrait pokazuje postać, level i summoner spelle, a ItemList zachowuje układ slotów itemów.

import { Package, Zap } from 'lucide-react'
import type { GameAssetCatalog } from '../api/gameAssets'
import type { MatchParticipantResponse } from '../types/match'
import { GameImage } from './GameImage'

// Wspólny portret z levem i summoner spellami, używany w historii oraz pełnym widoku meczu.
export function ChampionPortrait({
  player,
  catalog
}: {
  player: MatchParticipantResponse
  catalog?: GameAssetCatalog
}): React.JSX.Element {
  const champion = catalog?.champions[player.championId]
  return (
    <span className="champion-avatar">
      <GameImage
        className="champion-portrait"
        src={champion?.src}
        alt={champion?.name ?? player.championName}
        fallback={player.championName.slice(0, 2)}
      />
      <span className="champion-level" title={`Champion level: ${player.championLevel}`}>
        {player.championLevel}
      </span>
      <span className="champion-spells" aria-label="Summoner spells">
        {[player.summoner1Id, player.summoner2Id].map((id, index) => (
          <GameImage
            key={index}
            className="spell-icon"
            src={catalog?.spells[id]?.src}
            alt={catalog?.spells[id]?.name ?? `Spell #${id}`}
            fallback={<Zap size={12} aria-hidden="true" />}
          />
        ))}
      </span>
    </span>
  )
}

// Zachowuje sloty backendu, w tym puste miejsca, indeks identyfikuje slot, a nie przedmiot.
export function ItemList({
  itemIds,
  catalog,
  className = ''
}: {
  itemIds: number[]
  catalog?: GameAssetCatalog
  className?: string
}): React.JSX.Element {
  return (
    <span className={`item-list ${className}`} aria-label="Items">
      {itemIds.map((id, index) => {
        // Katalog może jeszcze się ładować, opcjonalny odczyt pozwala pokazać zastępczą ikonę.
        const item = catalog?.items[id]
        const label = id === 0 ? 'Empty slot' : (item?.name ?? `Item #${id}`)
        return (
          <span className="item-slot" key={index} title={label}>
            {id === 0 ? (
              <span className="item-placeholder" aria-label={label} role="img" />
            ) : (
              <GameImage
                className="item-image"
                src={item?.src}
                alt={label}
                fallback={<Package size={14} aria-hidden="true" />}
              />
            )}
          </span>
        )
      })}
    </span>
  )
}
