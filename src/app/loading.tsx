export default function Loading() {
  return (
    <div data-testid="page-loading" aria-busy="true" aria-label="Loading" className="space-y-4">
      <div className="skeleton h-14 w-72" />
      <div className="skeleton h-48 w-full" />
    </div>
  )
}
