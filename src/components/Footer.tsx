export default function Footer() {
  return (
    <footer className="bg-ink-950 text-white">
      <div className="mx-auto grid w-full max-w-page gap-8 px-6 py-14 md:grid-cols-12">
        <div className="md:col-span-8">
          <p className="flex items-center gap-3 font-display text-4xl font-extrabold tracking-tight">
            <span aria-hidden="true" className="h-5 w-5 bg-cobalt-500" />
            bookstore
          </p>
          <p className="mt-3 max-w-md text-sm text-ink-300">
            A curated catalog of books, delivered.
          </p>
        </div>
        <p className="font-mono text-xs text-ink-300 md:col-span-4 md:text-right">
          &copy; {new Date().getFullYear()} Bookstore. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
