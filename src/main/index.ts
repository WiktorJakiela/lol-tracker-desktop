// Główny proces Electron: tworzy okno aplikacji i obsługuje jej uruchamianie oraz zamykanie.
// Ładuje interfejs React do okna i otwiera zewnętrzne linki w przeglądarce systemowej.

import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1240,
    height: 920,
    minWidth: 760,
    minHeight: 600,
    title: 'LoL Tracker',
    backgroundColor: '#19191c',
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      // Preload udostępnia rendererowi wybrane API Electron przed uruchomieniem interfejsu.
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    // Pokazujemy okno dopiero po przygotowaniu pierwszego widoku, bez pustej początkowej klatki.
    mainWindow.show()
  })

  // Zamiast dodatkowego okna Electron otwieramy link w domyślnej przeglądarce systemowej.
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // W development ładujemy serwer Vite z odświeżaniem zmian, a po buildzie lokalny HTML.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Okna tworzymy po inicjalizacji Electron, gdy API aplikacji jest już gotowe.
app.whenReady().then(() => {
  // Identyfikator aplikacji używany przez Windows.
  electronApp.setAppUserModelId('com.electron')

  // Toolkit obsługuje F12 w development i blokuje zwykłe przeładowanie okna w produkcji.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Testowy kanał komunikacji między procesami z szablonu, nieużywany do requestów Riot.
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // Na macOS kliknięcie ikony w Docku może odtworzyć okno działającej aplikacji.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Po zamknięciu okien kończymy proces, poza macOS, gdzie aplikacja może pozostać aktywna.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
