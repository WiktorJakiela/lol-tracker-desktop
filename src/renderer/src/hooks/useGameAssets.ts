// Hook pobierający katalogi grafik potrzebne dla wersji meczów oraz wersję ikony profilu.
// Udostępnia je komponentom niezależnie od pobierania statystyk i ignoruje wyniki starych efektów.

import { useEffect, useState } from 'react'
import { getAssetCatalog, getAssetVersions, resolveAssetVersion } from '../api/gameAssets'
import type { GameAssetCatalog } from '../api/gameAssets'
import type { MatchDetailResponse } from '../types/match'

interface GameAssets {
  profileVersion: string | null
  catalogs: Record<string, GameAssetCatalog>
}

export function useGameAssets(matches: MatchDetailResponse[]): GameAssets {
  const [assets, setAssets] = useState<GameAssets>({ profileVersion: null, catalogs: {} })

  useEffect(() => {
    let cancelled = false
    async function load(): Promise<void> {
      try {
        const versions = await getAssetVersions()
        if (cancelled) return
        // Ikona profilu korzysta z najnowszej wersji, a grafiki meczu z odpowiadającego mu patcha.
        setAssets({ profileVersion: versions[0], catalogs: {} })
        // Set usuwa powtórzenia, więc mecze z tego samego buildu korzystają z jednego katalogu.
        const gameVersions = [...new Set(matches.map((match) => match.gameVersion))]
        const entries = await Promise.all(
          gameVersions.map(async (gameVersion) => {
            const version = resolveAssetVersion(gameVersion, versions)
            if (!version) return null
            try {
              // as const zachowuje typ pary [wersja meczu, katalog], potrzebny do fromEntries.
              return [gameVersion, await getAssetCatalog(version)] as const
            } catch {
              return null
            }
          })
        )
        if (!cancelled) {
          setAssets({
            profileVersion: versions[0],
            // Odrzucamy niedostępne wersje i zamieniamy pary na słownik dostępny po gameVersion.
            catalogs: Object.fromEntries(entries.filter((entry) => entry !== null))
          })
        }
      } catch {
        // Statystyki pozostają dostępne, nawet gdy publiczny katalog grafik nie odpowiada.
      }
    }
    void load()
    return () => {
      // Nie przerywamy współdzielonych pobrań, tylko ignorujemy wynik starego efektu.
      cancelled = true
    }
  }, [matches])

  return assets
}
