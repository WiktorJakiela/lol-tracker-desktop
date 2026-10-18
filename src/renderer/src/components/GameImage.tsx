// Wspólny komponent grafiki, pokazuje obraz albo zastępnik, gdy adresu brakuje lub pobranie się nie uda.
// Wymiary wynikają z przekazanej klasy CSS, więc podmiana obrazu nie przesuwa układu.

import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import type { ReactNode } from 'react'

interface GameImageProps {
  src?: string
  alt: string
  className: string
  fallback?: ReactNode
}

export function GameImage({ src, alt, className, fallback }: GameImageProps): React.JSX.Element {
  // Zapamiętujemy wadliwy URL, by inny adres mógł się poprawnie załadować.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  return (
    <span className={`game-image ${className}`} title={alt}>
      {src && src !== failedSrc ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span className="game-image-fallback" role="img" aria-label={alt}>
          {fallback ?? <ImageOff size={16} aria-hidden="true" />}
        </span>
      )}
    </span>
  )
}
