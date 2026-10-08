export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto flex w-full max-w-page flex-col gap-2 px-6 py-8 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-base font-semibold text-ink-900">Digital Bookstore</p>
        <p>&copy; {new Date().getFullYear()} Digital Bookstore. All rights reserved.</p>
      </div>
    </footer>
  )
}
