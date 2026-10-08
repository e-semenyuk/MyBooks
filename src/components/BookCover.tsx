// A typographic stand-in for a cover image: a deep tone chosen from the book
// id, the title's first letter in serif, and a thin brass rule. It carries no
// readable text so the title is announced and searchable only once, in the card.
const TONES = ['#151A22', '#1F2F3A', '#2E2A24', '#232B3E', '#2B2F2A', '#33252B']

interface BookCoverProps {
  id: number
  title: string
  size?: 'md' | 'sm'
  className?: string
}

export default function BookCover({ id, title, size = 'md', className = '' }: BookCoverProps) {
  const tone = TONES[Math.abs(id) % TONES.length]
  // "The Great Gatsby" is shelved under G
  const significant = title.trim().replace(/^(the|a|an)\s+/i, '') || title.trim()
  const initial = (significant.charAt(0) || '?').toUpperCase()
  const small = size === 'sm'

  return (
    <div
      aria-hidden="true"
      style={{ backgroundColor: tone }}
      className={`relative flex shrink-0 flex-col justify-between overflow-hidden ${
        small ? 'h-20 w-14 rounded-sm p-2' : 'aspect-[2/1] w-full p-5'
      } ${className}`}
    >
      <span className={`block bg-brass-500 ${small ? 'h-px w-5' : 'h-px w-10'}`} />
      <span
        className={`font-serif font-semibold leading-none text-white/90 ${
          small ? 'text-2xl' : 'text-5xl'
        }`}
      >
        {initial}
      </span>
      <span className="absolute inset-y-0 left-0 w-1 bg-black/25" />
    </div>
  )
}
