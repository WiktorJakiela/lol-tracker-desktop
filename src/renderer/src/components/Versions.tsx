// Komponent diagnostyczny z szablonu, wyświetla wersje Electron, Chromium i Node.js.
// Obecny App go nie używa, dane odczytuje z API udostępnionego przez preload.

import { useState } from 'react'

function Versions(): React.JSX.Element {
  const [versions] = useState(window.electron.process.versions)

  return (
    <ul className="versions">
      <li className="electron-version">Electron v{versions.electron}</li>
      <li className="chrome-version">Chromium v{versions.chrome}</li>
      <li className="node-version">Node v{versions.node}</li>
    </ul>
  )
}

export default Versions
