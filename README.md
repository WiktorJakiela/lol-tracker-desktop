# LoL Tracker Desktop

Desktop client for a League of Legends tracker, built with Electron, React and
TypeScript. It uses the separate [Spring Boot backend](https://github.com/WiktorJakiela/lol-tracker-api).

## Current Features

- Player lookup by Riot ID and region.
- Player level, profile icon and ranked statistics.
- Recent match history and full match details for both teams.
- Champion, item, summoner spell, rune and rank graphics.
- Loading states and error messages.

## Development

Requirements: Node.js 24, npm and the backend running at
`http://localhost:8080`. Configure the Riot API key in the backend only.

```sh
npm ci
npm run dev
```

The Vite development server forwards `/api` requests to the backend. Electron
opens the desktop window; the backend must be started separately.

## Verification

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

Tests use mocked responses and do not require a Riot API key.

## Project Layout

- `src/main`: Electron application lifecycle and desktop window.
- `src/preload`: bridge exposing selected Electron APIs to the renderer.
- `src/renderer/src`: React components, hooks, HTTP requests and response types.
- `tests`: HTTP, game asset and match presentation tests.

## Prototype Scope

The UI currently uses English; language selection is not implemented yet.
The backend address for packaged builds still needs to be configured before
distributing an installer: the Vite proxy is development-only.

Generated files and dependencies (`out`, `dist`, `node_modules`) are not tracked.
Never commit API keys or local `.env` files.

Game artwork belongs to Riot Games. Asset sources are documented in
[`src/renderer/src/assets/README.md`](src/renderer/src/assets/README.md).
