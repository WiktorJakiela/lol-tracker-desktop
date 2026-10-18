// Formularz nazwy gracza, tagu i regionu, przechowuje wartości pól w lokalnym stanie Reacta.
// Nie wysyła requestów: po zatwierdzeniu wywołuje funkcję onSearch przekazaną przez App.

import { useState } from 'react'
import { LoaderCircle, Search } from 'lucide-react'

interface SearchFormProps {
  isLoading: boolean
  // App przekazuje funkcję, która otrzyma wartości formularza, interfejs opisuje jej typ.
  onSearch: (gameName: string, tagLine: string, region: string) => void
}
export function SearchForm(props: SearchFormProps): React.JSX.Element {
  // value i onChange łączą pola ze stanem Reacta, który jest źródłem ich aktualnych wartości.
  const [gameName, setGameName] = useState('')
  const [tagLine, setTagline] = useState('')
  const [region, setRegion] = useState('EUNE')
  return (
    <section className="search-section" aria-label="Player search">
      <div className="section-caption">
        <span>LEAGUE OF LEGENDS</span>
        <span>Player profile</span>
      </div>
      <form
        className="search-form"
        onSubmit={(event) => {
          // Zatrzymujemy zwykłe wysłanie formularza i przeładowanie strony.
          event.preventDefault()
          props.onSearch(gameName, tagLine, region)
        }}
      >
        <label className="region-input">
          Region
          <select name="region" value={region} onChange={(event) => setRegion(event.target.value)}>
            <option>EUNE</option>
            <option>EUW</option>
            <option>NA</option>
            <option>KR</option>
          </select>
        </label>
        <label className="name-input">
          Player name
          <input
            name="gameName"
            placeholder="Player name"
            value={gameName}
            onChange={(event) => setGameName(event.target.value)}
            autoComplete="off"
            required
          />
        </label>
        <label className="tag-input">
          Tag
          <input
            name="tagLine"
            placeholder="TAG"
            value={tagLine}
            onChange={(event) => setTagline(event.target.value)}
            autoComplete="off"
            required
          />
        </label>
        <button className="search-button" disabled={props.isLoading} type="submit">
          {props.isLoading ? (
            <LoaderCircle className="loading-spinner" size={18} aria-hidden="true" />
          ) : (
            <Search size={18} aria-hidden="true" />
          )}
          {props.isLoading ? 'Loading…' : 'Search'}
        </button>
      </form>
    </section>
  )
}
