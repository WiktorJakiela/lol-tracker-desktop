// Testuje requestJson: sukces, komunikaty błędów HTTP, problemy z połączeniem, timeout i niepoprawny JSON.

import assert from 'node:assert/strict'
import test from 'node:test'
import { requestJson } from '../src/renderer/src/api/http.ts'

const url = '/api/players/by-riot-id?gameName=Test&tagLine=ABC&region=EUNE'
const httpFallback = 'Unable to retrieve data. HTTP error: 503'
const timeoutMessage = 'The server did not respond in time. Please try again.'

test('returns parsed JSON and supplies a 15 second deadline', async (t) => {
  const data = { puuid: 'test-puuid', gameName: 'Test' }
  const controller = new AbortController()
  t.mock.method(AbortSignal, 'timeout', (milliseconds) => {
    assert.equal(milliseconds, 15_000)
    return controller.signal
  })
  t.mock.method(globalThis, 'fetch', async (address, options) => {
    assert.equal(address, url)
    assert.equal(options.signal, controller.signal)
    assert.equal(options.headers.Accept, 'application/json')
    return Response.json(data)
  })
  assert.deepEqual(await requestJson(url), data)
})

test('accepts an empty match history as a successful result', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json([]))
  assert.deepEqual(await requestJson('/api/players/matches'), [])
})

for (const [status, message] of [
  [400, 'Invalid region'],
  [404, 'Player not found'],
  [429, 'Rate limit exceeded'],
  [503, 'Riot API is unavailable']
]) {
  test(`preserves the backend message for HTTP ${status}`, async (t) => {
    t.mock.method(globalThis, 'fetch', async () => Response.json({ message }, { status }))
    await assert.rejects(requestJson(url), { message })
  })
}

test('trims the backend message', async (t) => {
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ message: '  Player not found  ' }, { status: 404 })
  )
  await assert.rejects(requestJson(url), { message: 'Player not found' })
})

for (const [label, body] of [
  ['missing message', '{}'],
  ['empty message', '{"message":""}'],
  ['whitespace message', '{"message":"   "}'],
  ['numeric message', '{"message":42}'],
  ['null message', '{"message":null}'],
  ['object message', '{"message":{}}'],
  ['null body', 'null'],
  ['array body', '[]'],
  ['string body', '"text"'],
  ['HTML body', '<html>Unavailable</html>'],
  ['empty body', ''],
  ['malformed JSON', '{"message":']
]) {
  test(`uses a safe HTTP fallback for ${label}`, async (t) => {
    t.mock.method(globalThis, 'fetch', async () => new Response(body, { status: 503 }))
    await assert.rejects(requestJson(url), { message: httpFallback })
  })
}

test('translates a network failure', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('Failed to fetch')
  })
  await assert.rejects(requestJson(url), {
    message: 'Unable to connect to the server. Check your connection and try again.'
  })
})

test('translates a timeout before receiving a response', async (t) => {
  const controller = new AbortController()
  t.mock.method(AbortSignal, 'timeout', () => controller.signal)
  t.mock.method(globalThis, 'fetch', async () => {
    controller.abort()
    throw new DOMException('Timed out', 'TimeoutError')
  })
  await assert.rejects(requestJson(url), { message: timeoutMessage })
})

for (const status of [200, 503]) {
  test(`translates a timeout while reading an HTTP ${status} body`, async (t) => {
    const controller = new AbortController()
    t.mock.method(AbortSignal, 'timeout', () => controller.signal)
    const response = new Response('', { status })
    t.mock.method(response, 'json', async () => {
      controller.abort()
      throw new DOMException('Timed out', 'TimeoutError')
    })
    t.mock.method(globalThis, 'fetch', async () => response)
    await assert.rejects(requestJson(url), { message: timeoutMessage })
  })
}

test('hides technical parsing errors from a successful HTTP response', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>Not JSON</html>'))
  await assert.rejects(requestJson(url), {
    message: 'The server returned an invalid response. Please try again.'
  })
})
