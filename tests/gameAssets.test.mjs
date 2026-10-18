// Testuje dobieranie wersji oraz tworzenie i zapamiętywanie katalogów grafik, także przy błędach pobierania.

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getAssetCatalog,
  getAssetVersions,
  profileIconUrl,
  resolveAssetVersion
} from '../src/renderer/src/api/gameAssets.ts'

const origin = 'https://ddragon.leagueoflegends.com'

test('versions retry after failed or invalid responses, then share a successful request', async (t) => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, `${origin}/api/versions.json`)
    assert.ok(options.signal instanceof AbortSignal)
    calls++
    if (calls === 1) throw new TypeError('Offline')
    return Response.json(calls === 2 ? [] : ['16.20.2', '16.20.1', '16.19.1', '../unsafe'])
  })
  await assert.rejects(getAssetVersions())
  await assert.rejects(getAssetVersions())
  const [first, second] = await Promise.all([getAssetVersions(), getAssetVersions()])
  assert.deepEqual(first, ['16.20.2', '16.20.1', '16.19.1'])
  assert.deepEqual(second, first)
  assert.equal(calls, 3)
})

for (const [input, expected] of [
  ['16.20.123.4567', '16.20.2'],
  ['16.20.1', '16.20.2'],
  ['16.20', '16.20.2'],
  ['16.19.987', '16.19.1'],
  ['16.2.1', undefined],
  ['14.19.123', undefined],
  ['unknown', undefined],
  ['', undefined]
]) {
  test(`resolves the correct patch for ${input || 'an empty game version'}`, () => {
    assert.equal(resolveAssetVersion(input, ['16.20.2', '16.20.1', '16.19.1']), expected)
  })
}

test('profile icon zero is valid; missing versions and invalid IDs have no image URL', () => {
  assert.equal(profileIconUrl('16.20.1', 0), `${origin}/cdn/16.20.1/img/profileicon/0.png`)
  assert.equal(profileIconUrl('16.20.1', 7123), `${origin}/cdn/16.20.1/img/profileicon/7123.png`)
  assert.equal(profileIconUrl(null, 7123), undefined)
  assert.equal(profileIconUrl('../unsafe', 7123), undefined)
  for (const id of [-1, 1.5, NaN, undefined]) assert.equal(profileIconUrl('16.20.1', id), undefined)
})

const fixtures = {
  'champion.json': {
    data: {
      Fiddlesticks: { key: '9', name: 'Fiddlesticks', image: { full: 'Fiddlesticks.png' } }
    }
  },
  'item.json': { data: { 1001: { name: 'Boots', image: { full: '1001.png' } } } },
  'summoner.json': {
    data: { SummonerFlash: { key: '4', name: 'Flash', image: { full: 'SummonerFlash.png' } } }
  },
  'runesReforged.json': [
    {
      id: 8000,
      name: 'Precision',
      icon: 'perk-images/Styles/7201_Precision.png',
      slots: [
        {
          runes: [
            {
              id: 8005,
              name: 'Press the Attack',
              icon: 'perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png'
            }
          ]
        }
      ]
    }
  ]
}

test('maps numeric IDs to real filenames and uses patch-scoped catalogs without API keys', async (t) => {
  const urls = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    urls.push(url)
    assert.equal(new URL(url).origin, origin)
    assert.equal(options.headers, undefined)
    return Response.json(fixtures[new URL(url).pathname.split('/').at(-1)])
  })
  const catalog = await getAssetCatalog('90.1.1')
  assert.equal(urls.length, 4)
  assert.ok(urls.every((url) => url.includes('/90.1.1/data/en_US/')))
  assert.equal(catalog.champions[9].src, `${origin}/cdn/90.1.1/img/champion/Fiddlesticks.png`)
  assert.equal(catalog.items[1001].name, 'Boots')
  assert.equal(catalog.items[1001].src, `${origin}/cdn/90.1.1/img/item/1001.png`)
  assert.equal(catalog.spells[4].src, `${origin}/cdn/90.1.1/img/spell/SummonerFlash.png`)
  assert.equal(catalog.runes[8000].name, 'Precision')
  assert.equal(catalog.spells[4].name, 'Flash')
  assert.equal(catalog.runes[5008].name, 'Adaptive force')
  assert.equal(
    catalog.runes[8005].src,
    `${origin}/cdn/img/perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png`
  )
  assert.equal(
    catalog.runes[5008].src,
    `${origin}/cdn/img/perk-images/StatMods/StatModsAdaptiveForceIcon.png`
  )
  assert.equal(catalog.items[999999], undefined)
  await getAssetCatalog('90.1.1')
  assert.equal(urls.length, 4)
})

test('a failed category does not hide other graphics and is retried on the next load', async (t) => {
  let itemCalls = 0
  let otherCalls = 0
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (url.endsWith('/item.json')) {
      itemCalls++
      if (itemCalls === 1) return new Response('', { status: 503 })
    } else otherCalls++
    return Response.json(fixtures[new URL(url).pathname.split('/').at(-1)])
  })
  const first = await getAssetCatalog('90.2.1')
  assert.deepEqual(first.items, {})
  assert.ok(first.champions[9])
  assert.ok(first.spells[4])
  assert.ok(first.runes[8005])
  const second = await getAssetCatalog('90.2.1')
  assert.ok(second.items[1001])
  assert.equal(itemCalls, 2)
  assert.equal(otherCalls, 3)
})

test('catalogs remain empty but usable when the CDN is offline', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('Offline')
  })
  const catalog = await getAssetCatalog('90.3.1')
  assert.deepEqual(catalog.champions, {})
  assert.deepEqual(catalog.items, {})
  assert.deepEqual(catalog.spells, {})
  assert.ok(catalog.runes[5008])
})

test('rejects unsafe versions before any request', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch')
  await assert.rejects(getAssetCatalog('../../unsafe'))
  assert.equal(fetch.mock.callCount(), 0)
})

test('does not create rune image URLs outside the expected Riot asset directory', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) =>
    Response.json(
      url.endsWith('/runesReforged.json')
        ? [
            {
              id: 999,
              name: 'Invalid',
              icon: 'https://example.com/image.png',
              slots: [{ runes: [{ id: 998, name: 'Invalid', icon: 'perk-images/../other.png' }] }]
            }
          ]
        : fixtures[new URL(url).pathname.split('/').at(-1)]
    )
  )
  const catalog = await getAssetCatalog('90.4.1')
  assert.equal(catalog.runes[999], undefined)
  assert.equal(catalog.runes[998], undefined)
})
