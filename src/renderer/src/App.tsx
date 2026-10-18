// Główny komponent React: łączy wyszukiwanie, pobieranie profilu i historii oraz wybór widoku.
// Koordynuje ładowanie i błędy, a po zamknięciu szczegółów meczu przywraca profil i przewinięcie.

import { useLayoutEffect, useRef, useState } from 'react'
import { Swords } from 'lucide-react'
import { SearchForm } from './components/SearchForm'
import { PlayerProfile } from './components/PlayerProfile'
import { MatchHistory } from './components/MatchHistory'
import { MatchDetails } from './components/MatchDetails'
import { LoadingState } from './components/LoadingState'
import { useTrackerState } from './hooks/useTrackerState'
import { useGameAssets } from './hooks/useGameAssets'
import type { PlayerResponse } from './types/player'
import type { MatchDetailResponse } from './types/match'
import { requestJson } from './api/http'

function App(): React.JSX.Element {
  const { player, setPlayer, matches, setMatches, isLoading, setIsLoading, error, setError } =
    useTrackerState()
  // Grafiki ładują się niezależnie od profilu i statystyk, więc ich awaria nie blokuje danych.
  const assets = useGameAssets(matches)
  const [selectedMatch, setSelectedMatch] = useState<MatchDetailResponse | null>(null)
  // Ref zachowuje pozycję i fokus między renderami, ale jego zmiana nie wywołuje renderowania.
  const profilePosition = useRef<{ scrollY: number; element: HTMLElement | null }>({
    scrollY: 0,
    element: null
  })
  const restoreProfile = useRef(false)

  // Po zmianie widoku ustawiamy przewinięcie i fokus przed wyświetleniem klatki.
  useLayoutEffect(() => {
    if (selectedMatch) {
      window.scrollTo(0, 0)
      document.getElementById('match-view-title')?.focus({ preventScroll: true })
    } else if (restoreProfile.current) {
      restoreProfile.current = false
      profilePosition.current.element?.focus({ preventScroll: true })
      window.scrollTo(0, profilePosition.current.scrollY)
    }
  }, [selectedMatch])

  // Otwieramy już pobrany mecz, zapamiętując miejsce powrotu na liście.
  function openMatch(match: MatchDetailResponse): void {
    profilePosition.current = {
      scrollY: window.scrollY,
      element: document.activeElement instanceof HTMLElement ? document.activeElement : null
    }
    setSelectedMatch(match)
  }

  // Flaga pozwala przywrócić przewinięcie dopiero po ponownym pokazaniu profilu w DOM.
  function closeMatch(): void {
    restoreProfile.current = true
    setSelectedMatch(null)
  }

  // Oba requesty muszą się udać, zanim pokażemy profil i historię jako jeden widok.
  async function handleSearch(gameName: string, tagLine: string, region: string): Promise<void> {
    // sprawdzamy czy trwa już jakieś ładowanie profilu
    if (isLoading) {
      return
    }

    // resetujemy stare dane
    setIsLoading(true)
    setError(null)
    setPlayer(null)
    setMatches([])
    setSelectedMatch(null)

    try {
      // URLSearchParams koduje m.in. spacje i polskie znaki w parametrach adresu.
      const params = new URLSearchParams({ gameName: gameName, tagLine: tagLine, region: region })

      // Względny adres /api w trybie developerskim trafia przez proxy Vite do Springa.
      const PlayerURL = '/api/players/by-riot-id?' + params.toString()
      const playerData = await requestJson<PlayerResponse>(PlayerURL)

      // requestJson<T> opisuje typ oczekiwanej odpowiedzi; odczyt JSON i błędy są w http.ts.
      const MatchesURL = '/api/players/matches?' + params.toString()
      const matchesData = await requestJson<MatchDetailResponse[]>(MatchesURL)
      // Settery aktualizują stan Reacta, co powoduje ponowne wyrenderowanie widoku.
      setPlayer(playerData)
      setMatches(matchesData)
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Unable to load player data.')
      }
    } finally {
      // Kończymy ładowanie zarówno po sukcesie, jak i po błędzie któregokolwiek requestu.
      setIsLoading(false)
    }
  }
  return (
    <div className="app-shell">
      <header className="app-header">
        <a
          className="brand"
          href="#profile"
          onClick={(event) => {
            if (selectedMatch) {
              event.preventDefault()
              closeMatch()
            }
          }}
        >
          <Swords aria-hidden="true" />
          <span>
            LoL<span className="brand-light">Tracker</span>
          </span>
        </a>
      </header>
      <main>
        {/* Ukryty profil pozostaje zamontowany: powrót nie resetuje formularza ani historii. */}
        <div hidden={selectedMatch !== null}>
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
          {isLoading ? (
            <LoadingState />
          ) : error != null ? (
            <p role="alert">{error}</p>
          ) : player !== null ? (
            <>
              <PlayerProfile player={player} profileVersion={assets.profileVersion} />
              <MatchHistory
                matches={matches}
                playerPuuid={player.puuid}
                catalogs={assets.catalogs}
                onOpenMatch={openMatch}
              />
            </>
          ) : null}
        </div>
        {/* Inny key montuje szczegóły od nowa, resetując wybór uczestnika dla kolejnego meczu. */}
        {selectedMatch && player && (
          <MatchDetails
            key={selectedMatch.matchId}
            match={selectedMatch}
            playerPuuid={player.puuid}
            catalog={assets.catalogs[selectedMatch.gameVersion]}
            onBack={closeMatch}
          />
        )}
      </main>
      <footer>
        <span>LoL Tracker · Desktop</span>
      </footer>
    </div>
  )
}

export default App
