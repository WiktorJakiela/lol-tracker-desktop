// Wspólna obsługa requestów JSON do backendu.
// Komponent App korzysta z requestJson zamiast powtarzać obsługę fetch dla każdego endpointu.

const requestTimeoutMs = 15_000
const timeoutMessage = 'The server did not respond in time. Please try again.'

// Odczytuje komunikat ApiErrorResponse, przy innym formacie zachowuje ogólny opis statusu HTTP.
async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Unable to retrieve data. HTTP error: ${response.status}`
  try {
    // unknown wymusza sprawdzenie kształtu danych, zanim odczytamy pole message.
    const data: unknown = await response.json()
    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string' &&
      data.message.trim() !== ''
    ) {
      return data.message.trim()
    }
  } catch {
    // Proxy lub serwer mogą zwrócić HTML albo pustą odpowiedź zamiast JSON.
    return fallback
  }
  return fallback
}

// Wspólne pobieranie JSON
// Typ T służy TypeScriptowi, rzutowanie as T nie sprawdza struktury JSON w czasie działania.
export async function requestJson<T>(url: string): Promise<T> {
  // Ten sam sygnał obejmuje oczekiwanie na odpowiedź oraz odczyt jej treści.
  const signal = AbortSignal.timeout(requestTimeoutMs)
  let response: Response
  try {
    response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  } catch {
    throw new Error(
      signal.aborted
        ? timeoutMessage
        : 'Unable to connect to the server. Check your connection and try again.'
    )
  }

  // fetch sam nie rzuca wyjątku dla 404 czy 503, dlatego sprawdzamy status odpowiedzi.
  if (!response.ok) {
    const message = await readErrorMessage(response)
    throw new Error(signal.aborted ? timeoutMessage : message)
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new Error(
      signal.aborted ? timeoutMessage : 'The server returned an invalid response. Please try again.'
    )
  }
}
