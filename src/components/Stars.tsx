import { StarIcon } from '@/components/icons'

// Read-only star row. The label carries the meaning for screen readers.
export default function Stars({ value, className = 'h-4 w-4' }: { value: number; className?: string }) {
  return (
    <span className="inline-flex text-cobalt-500" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} filled={n <= Math.round(value)} className={className} aria-hidden="true" />
      ))}
    </span>
  )
}
