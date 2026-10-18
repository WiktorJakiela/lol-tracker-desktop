// Testuje format czasu i grupowanie uczestników, w tym brakujące metadane oraz dopasowanie po PUUID.

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  groupMatchTeams,
  formatDuration,
  numberFormat,
  dateFormat
} from '../src/renderer/src/utils/matchPresentation.ts'

test('groups interleaved players by teamId and puts the searched team first', () => {
  const participants = [
    { puuid: 'other', teamId: 100, gameName: 'Same name' },
    { puuid: 'own', teamId: 200, gameName: 'Same name' },
    { puuid: 'ally', teamId: 200 },
    { puuid: 'opponent', teamId: 100 }
  ]
  const teams = [
    { teamId: 100, kills: 8 },
    { teamId: 200, kills: 12 }
  ]
  const result = groupMatchTeams({ participants, teams }, 'own')
  assert.deepEqual(
    result.map((group) => group.teamId),
    [200, 100]
  )
  assert.deepEqual(
    result.map((group) => group.name),
    ['Your team', 'Opponents']
  )
  assert.deepEqual(
    result[0].players.map((player) => player.puuid),
    ['own', 'ally']
  )
  assert.deepEqual(
    result[1].players.map((player) => player.puuid),
    ['other', 'opponent']
  )
  assert.equal(result[0].team, teams[1])
  assert.deepEqual(
    participants.map((player) => player.puuid),
    ['other', 'own', 'ally', 'opponent']
  )
})

test('missing team metadata does not hide participants', () => {
  const result = groupMatchTeams(
    {
      teams: [],
      participants: [
        { puuid: 'own', teamId: 200 },
        { puuid: 'other', teamId: 100 }
      ]
    },
    'own'
  )
  assert.deepEqual(
    result.map((group) => group.teamId),
    [200, 100]
  )
  assert.equal(result[0].team, undefined)
  assert.equal(result[1].players.length, 1)
})

test('declared empty teams stay visible and duplicate team IDs do not create duplicate groups', () => {
  const result = groupMatchTeams(
    {
      teams: [{ teamId: 100 }, { teamId: 200 }, { teamId: 100 }],
      participants: [{ puuid: 'own', teamId: 100 }]
    },
    'own'
  )
  assert.equal(result.length, 2)
  assert.deepEqual(result[1].players, [])
})

test('an unknown searched player does not mislabel either team as their own', () => {
  const result = groupMatchTeams(
    {
      teams: [{ teamId: 200 }, { teamId: 100 }],
      participants: []
    },
    'missing'
  )
  assert.deepEqual(
    result.map((group) => group.teamId),
    [100, 200]
  )
  assert.deepEqual(
    result.map((group) => group.name),
    ['Team 1', 'Team 2']
  )
})

test('an empty match has no fabricated teams', () => {
  assert.deepEqual(groupMatchTeams({ teams: [], participants: [] }, 'own'), [])
})

test('match duration formats seconds with zero padding', () => {
  assert.equal(formatDuration(0), '0:00')
  assert.equal(formatDuration(65), '1:05')
  assert.equal(formatDuration(1973), '32:53')
})

test('uses English number and date formatting for the interface', () => {
  assert.equal(numberFormat.format(1234.56), '1,234.56')
  assert.equal(dateFormat.resolvedOptions().locale, 'en-US')
})
