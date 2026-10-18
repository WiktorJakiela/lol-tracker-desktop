// Obsługuje publiczny katalog Data Dragon, dobiera wersje i łączy ID z nazwami oraz adresami grafik.
// Zapamiętuje pobrania katalogów, aby komponenty nie wysyłały wielokrotnie tych samych requestów.

const origin = 'https://ddragon.leagueoflegends.com'
// Dla każdego URL zapisujemy trwające pobieranie lub jego udany wynik, aby nie powtarzać requestów.
const requests = new Map<string, Promise<unknown>>()

export interface GameAsset {
  name: string
  src: string
}

// Słowniki łączą ID z odpowiedzi backendu z nazwą i adresem grafiki dla danego patcha gry.
export interface GameAssetCatalog {
  version: string
  champions: Record<string, GameAsset>
  items: Record<string, GameAsset>
  spells: Record<string, GameAsset>
  runes: Record<string, GameAsset>
}

interface DataFile<T> {
  data: Record<string, T>
}

interface Definition {
  name: string
  image: { full: string }
}

interface KeyedDefinition extends Definition {
  key: string
}

interface RuneDefinition {
  id: number
  name: string
  icon: string
}

interface RuneStyle extends RuneDefinition {
  slots: { runes: RuneDefinition[] }[]
}

// Cache istnieje tylko w pamięci aplikacji, nie zapisujemy katalogów na dysku.
async function getJson<T>(url: string): Promise<T> {
  let request = requests.get(url)
  if (!request) {
    request = fetch(url, { signal: AbortSignal.timeout(10_000) })
      .then((response) => {
        if (!response.ok) throw new Error(`Asset catalog: HTTP ${response.status}`)
        return response.json() as Promise<unknown>
      })
      .catch((error: unknown) => {
        // Usuwamy nieudany wpis, aby kolejne wywołanie mogło rozpocząć nowe pobieranie.
        requests.delete(url)
        throw error
      })
    requests.set(url, request)
  }
  return (await request) as T
}

// Sprawdza format dostępnych wersji, kolejność od najnowszej pochodzi z katalogu Riot.
export async function getAssetVersions(): Promise<string[]> {
  const url = `${origin}/api/versions.json`
  const data = await getJson<unknown>(url)
  if (Array.isArray(data)) {
    const versions = data.filter(
      (version): version is string => typeof version === 'string' && /^\d+\.\d+\.\d+$/.test(version)
    )
    if (versions.length > 0) return versions
  }
  requests.delete(url)
  throw new Error('No asset versions available')
}

// Numer buildu meczu może być inny niż katalogu, dopasowujemy dwie pierwsze części wersji.
export function resolveAssetVersion(gameVersion: string, versions: string[]): string | undefined {
  const patch = /^(\d+)\.(\d+)(?:\.|$)/.exec(gameVersion)
  if (!patch) return undefined
  return versions.find((version) => version.startsWith(`${patch[1]}.${patch[2]}.`))
}

// Buduje adres ikony profilu, undefined uruchamia zastępczy widok w GameImage.
export function profileIconUrl(version: string | null, id: number): string | undefined {
  if (!version || !/^\d+\.\d+\.\d+$/.test(version) || !Number.isInteger(id) || id < 0)
    return undefined
  return `${origin}/cdn/${version}/img/profileicon/${id}.png`
}

// Akceptujemy tylko ścieżki run z katalogu Riot, bez segmentów zmieniających katalog.
function runeImageUrl(path: string): string | undefined {
  if (
    !path.startsWith('perk-images/') ||
    path.split('/').some((part) => part === '..' || part === '.')
  ) {
    return undefined
  }
  return `${origin}/cdn/img/${path.split('/').map(encodeURIComponent).join('/')}`
}

// Pobiera definicje grafik i buduje wspólny katalog dla konkretnej wersji gry.
export async function getAssetCatalog(version: string): Promise<GameAssetCatalog> {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid asset version')
  const base = `${origin}/cdn/${version}`
  // Kategorie pobieramy równolegle, awaria jednej nie ukrywa pozostałych.
  const [champions, items, spells, runeStyles] = await Promise.all([
    getJson<DataFile<KeyedDefinition>>(`${base}/data/en_US/champion.json`).catch(() => null),
    getJson<DataFile<Definition>>(`${base}/data/en_US/item.json`).catch(() => null),
    getJson<DataFile<KeyedDefinition>>(`${base}/data/en_US/summoner.json`).catch(() => null),
    getJson<RuneStyle[]>(`${base}/data/en_US/runesReforged.json`).catch(() => null)
  ])
  const catalog: GameAssetCatalog = { version, champions: {}, items: {}, spells: {}, runes: {} }
  for (const champion of Object.values(champions?.data ?? {})) {
    catalog.champions[champion.key] = {
      name: champion.name,
      src: `${base}/img/champion/${encodeURIComponent(champion.image.full)}`
    }
  }
  for (const [id, item] of Object.entries(items?.data ?? {})) {
    catalog.items[id] = {
      name: item.name,
      src: `${base}/img/item/${encodeURIComponent(item.image.full)}`
    }
  }
  for (const spell of Object.values(spells?.data ?? {})) {
    catalog.spells[spell.key] = {
      name: spell.name,
      src: `${base}/img/spell/${encodeURIComponent(spell.image.full)}`
    }
  }
  // W jednym słowniku umieszczamy ikony drzewek i konkretnych run z ich slotów.
  for (const style of runeStyles ?? []) {
    for (const rune of [style, ...style.slots.flatMap((slot) => slot.runes)]) {
      const src = runeImageUrl(rune.icon)
      if (src) catalog.runes[rune.id] = { name: rune.name, src }
    }
  }
  // Odłamki statystyk uzupełniamy osobno, bo nie są częścią listy drzewek run.
  const shards: [number, string, string][] = [
    [5001, 'Scaling health', 'HealthScaling'],
    [5002, 'Armor', 'Armor'],
    [5003, 'Magic resist', 'MagicRes'],
    [5005, 'Attack speed', 'AttackSpeed'],
    [5007, 'Ability haste', 'CDRScaling'],
    [5008, 'Adaptive force', 'AdaptiveForce'],
    [5010, 'Move speed', 'MovementSpeed'],
    [5011, 'Health', 'HealthPlus'],
    [5013, 'Tenacity', 'Tenacity']
  ]
  for (const [id, name, file] of shards) {
    catalog.runes[id] = {
      name,
      src: `${origin}/cdn/img/perk-images/StatMods/StatMods${file}Icon.png`
    }
  }
  return catalog
}
