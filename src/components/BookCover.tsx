'use client'

import { useState } from 'react'

// Generative cover art: flat geometric compositions picked from the book id.
// Carries no text, so a title is never in the page twice.
const PALETTES = [
  { bg: '#1F3DFF', a: '#0A0A0B', b: '#FFFFFF' },
  { bg: '#FFC400', a: '#0A0A0B', b: '#1F3DFF' },
  { bg: '#FF5A36', a: '#0A0A0B', b: '#FFFFFF' },
  { bg: '#0A0A0B', a: '#1F3DFF', b: '#FFC400' },
  { bg: '#00A67E', a: '#0A0A0B', b: '#FFFFFF' },
  { bg: '#EEF0F3', a: '#1F3DFF', b: '#0A0A0B' },
]

type Palette = (typeof PALETTES)[number]

const COMPOSITIONS: ((p: Palette) => JSX.Element)[] = [
  (p) => (
    <>
      <circle cx="50" cy="70" r="36" fill={p.a} />
      <circle cx="78" cy="26" r="11" fill={p.b} />
    </>
  ),
  (p) => (
    <>
      <path d="M0 125V45a80 80 0 0 1 80 80z" fill={p.a} />
      <circle cx="80" cy="30" r="13" fill={p.b} />
    </>
  ),
  (p) => (
    <>
      <rect x="0" y="18" width="100" height="14" fill={p.a} />
      <rect x="0" y="40" width="68" height="14" fill={p.b} />
      <rect x="0" y="62" width="100" height="14" fill={p.a} />
      <rect x="0" y="84" width="42" height="14" fill={p.b} />
    </>
  ),
  (p) => (
    <>
      {[0, 1, 2, 3].flatMap((row) =>
        [0, 1, 2, 3].map((col) => (
          <circle
            key={`${row}-${col}`}
            cx={20 + col * 20}
            cy={28 + row * 22}
            r="7"
            fill={row === 1 && col === 2 ? p.b : p.a}
          />
        ))
      )}
    </>
  ),
  (p) => (
    <>
      <rect x="0" y="66" width="100" height="59" fill={p.a} />
      <rect x="14" y="20" width="30" height="46" fill={p.b} />
      <circle cx="72" cy="50" r="16" fill={p.b} />
    </>
  ),
  (p) => (
    <>
      <polygon points="0,125 100,48 100,125" fill={p.a} />
      <circle cx="32" cy="38" r="15" fill={p.b} />
    </>
  ),
]

interface BookCoverProps {
  id: number
  title?: string
  coverUrl?: string | null
  size?: 'md' | 'sm'
  // Taller frame for the book page
  tall?: boolean
  className?: string
}

export default function BookCover({ id, coverUrl, size = 'md', tall = false, className = '' }: BookCoverProps) {
  // A picture that fails to load (broken link, offline) falls back to the generated art
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(coverUrl) && !failed
  const n = Math.abs(id)
  const palette = PALETTES[(n * 5 + 1) % PALETTES.length]
  const composition = COMPOSITIONS[n % COMPOSITIONS.length]

  return (
    <div
      aria-hidden="true"
      className={`relative shrink-0 overflow-hidden ${
        size === 'sm' ? 'h-[70px] w-14' : tall ? 'aspect-[4/5] w-full' : 'aspect-[6/5] w-full'
      } ${className}`}
      style={{ backgroundColor: showImage ? '#EEF0F3' : palette.bg }}
    >
      {showImage ? (
        // Decorative: the title is in the text next to the cover
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl!}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          data-testid={`book-cover-image-${id}`}
          className={`h-full w-full object-contain ${size === 'sm' ? 'p-0.5' : 'p-5'}`}
        />
      ) : (
        <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
          {composition(palette)}
        </svg>
      )}
      <span className="absolute inset-x-0 bottom-0 h-1 bg-cobalt-500 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
    </div>
  )
}
