// Wyświetla pełny zestaw run uczestnika, oba drzewka i odłamki statystyk.
// ID pochodzą z backendu, a nazwy i ikony z przekazanego katalogu grafik.

import type { GameAssetCatalog } from '../api/gameAssets'
import type { MatchRunesResponse } from '../types/match'
import { GameImage } from './GameImage'

export function MatchRunes({
  runes,
  catalog
}: {
  runes: MatchRunesResponse | null
  catalog?: GameAssetCatalog
}): React.JSX.Element | null {
  if (!runes) return null
  // Wspólna struktura pozwala wyrenderować oba drzewka i odłamki tym samym fragmentem JSX.
  const groups = [
    {
      name: catalog?.runes[runes.primaryStyleId]?.name ?? 'Primary path',
      ids: runes.primaryRuneIds
    },
    {
      name: catalog?.runes[runes.secondaryStyleId]?.name ?? 'Secondary path',
      ids: runes.secondaryRuneIds
    },
    { name: 'Shards', ids: [runes.offenseShardId, runes.flexShardId, runes.defenseShardId] }
  ]
  return (
    <div className="match-runes" aria-label="Player runes">
      {groups.map((group) => (
        <div className="rune-group" key={group.name}>
          <span className="rune-group-name">{group.name}</span>
          <div className="rune-list">
            {group.ids.map((id, index) => (
              <GameImage
                key={`${id}-${index}`}
                className="rune-icon"
                src={catalog?.runes[id]?.src}
                alt={catalog?.runes[id]?.name ?? `Rune #${id}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
