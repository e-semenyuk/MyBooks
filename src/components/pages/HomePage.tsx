'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import BookCard from '@/components/BookCard'
import Pagination from '@/components/Pagination'
import { CategoryWithCount, PagedBooks } from '@/types'
import { SearchIcon, XIcon } from '@/components/icons'

interface HomePageProps {
  showToast: (message: string, type: 'success' | 'error') => void
  updateCartCount: () => void
}

const SORT_OPTIONS = [
  { value: 'title', label: 'Title, A to Z' },
  { value: 'price_asc', label: 'Price, low to high' },
  { value: 'price_desc', label: 'Price, high to low' },
  { value: 'newest', label: 'Newest first' },
]

// Everything the shopper chooses lives in the URL, so a result page can be
// shared, reloaded and reached with the back button.
export default function HomePage({ showToast, updateCartCount }: HomePageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryString = searchParams.toString()

  const [result, setResult] = useState<PagedBooks | null>(null)
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)

  const current = useMemo(
    () => ({
      query: searchParams.get('query') ?? '',
      category: searchParams.get('category') ?? '',
      author: searchParams.get('author') ?? '',
      minPrice: searchParams.get('minPrice') ?? '',
      maxPrice: searchParams.get('maxPrice') ?? '',
      sort: searchParams.get('sort') ?? 'title',
      page: Number(searchParams.get('page') ?? '1') || 1,
    }),
    [searchParams]
  )

  // Text boxes are edited locally and applied on submit
  const [searchQuery, setSearchQuery] = useState(current.query)
  const [authorInput, setAuthorInput] = useState(current.author)
  const [minInput, setMinInput] = useState(current.minPrice)
  const [maxInput, setMaxInput] = useState(current.maxPrice)

  useEffect(() => {
    setSearchQuery(current.query)
    setAuthorInput(current.author)
    setMinInput(current.minPrice)
    setMaxInput(current.maxPrice)
  }, [current.query, current.author, current.minPrice, current.maxPrice])

  useEffect(() => {
    updateCartCount()
    fetch('/api/categories')
      .then((response) => (response.ok ? response.json() : []))
      .then(setCategories)
      .catch(() => setCategories([]))
    // run once; updateCartCount is stable for the lifetime of the app
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/books${queryString ? `?${queryString}` : ''}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Request failed')
        return (await response.json()) as PagedBooks
      })
      .then((data) => {
        if (cancelled) return
        setResult(data)
        // A page past the end comes back clamped; keep the URL honest
        if (data.page !== current.page && data.total > 0) {
          const next = new URLSearchParams(queryString)
          if (data.page === 1) next.delete('page')
          else next.set('page', String(data.page))
          router.replace(`${pathname}${next.toString() ? `?${next}` : ''}`)
        }
      })
      .catch((error) => {
        if (cancelled) return
        showToast('Failed to load books', 'error')
        console.error('Error loading books:', error)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // showToast and router are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString])

  const go = useCallback(
    (patch: Record<string, string | number | undefined>, keepPage = false) => {
      const next = new URLSearchParams(queryString)
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === '' || (key === 'sort' && value === 'title') || (key === 'page' && value === 1)) {
          next.delete(key)
        } else {
          next.set(key, String(value))
        }
      }
      if (!keepPage) next.delete('page')
      router.push(`${pathname}${next.toString() ? `?${next}` : ''}`)
    },
    [pathname, queryString, router]
  )

  const handleAddToCart = async (bookId: number) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, quantity: 1 }),
      })

      if (response.ok) {
        showToast('Book added to cart', 'success')
        updateCartCount()
      } else {
        const data = await response.json().catch(() => null)
        showToast(data?.error || 'Failed to add book to cart', 'error')
      }
    } catch (error) {
      showToast('Failed to add book to cart', 'error')
      console.error('Error adding to cart:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    go({ query: searchQuery.trim() })
  }

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    go({ author: authorInput.trim(), minPrice: minInput.trim(), maxPrice: maxInput.trim() })
  }

  const books = result?.items ?? []
  const total = result?.total ?? 0
  const hasFilters = Boolean(current.category || current.author || current.minPrice || current.maxPrice || current.query)
  const activeCategory = categories.find((c) => c.slug === current.category)

  const heading = current.query
    ? `Search Results (${total})`
    : activeCategory
      ? `${activeCategory.name} (${total})`
      : hasFilters
        ? `Filtered Books (${total})`
        : `All Books (${total})`

  const chip = (active: boolean) =>
    `border px-3 py-1.5 text-sm font-semibold transition-colors duration-150 ${
      active ? 'border-ink-950 bg-ink-950 text-white' : 'border-mist-300 bg-white text-ink-950 hover:border-ink-950'
    }`

  return (
    <div data-testid="home-page" className="animate-fade-in">
      <section data-testid="search-section" className="mb-10">
        <p className="section-label mb-8">01 / Catalog</p>
        <h2 className="hero-title mb-8">
          Read more<span className="text-cobalt-500">.</span>
        </h2>
        <p className="mb-10 max-w-xl text-lg text-ink-600">
          Classics and contemporary titles, in stock and ready to ship.
        </p>

        <form
          data-testid="search-form"
          onSubmit={handleSearch}
          className="flex max-w-3xl border-2 border-ink-950 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-cobalt-500"
        >
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-500" />
            <input
              data-testid="search-input"
              type="text"
              aria-label="Search books"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, or ISBN"
              className="h-14 w-full bg-white pl-12 pr-4 text-base text-ink-950 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
          <button
            data-testid="search-submit-button"
            type="submit"
            className="btn btn-primary min-h-[52px] border-0 px-8"
          >
            Search
          </button>
        </form>
      </section>

      <section data-testid="filters-panel" aria-label="Filters" className="mb-12 border-t-2 border-ink-950 pt-6">
        <div data-testid="category-chips" className="mb-6 flex flex-wrap gap-2">
          <button
            data-testid="category-chip-all"
            className={chip(!current.category)}
            aria-pressed={!current.category}
            onClick={() => go({ category: undefined })}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              data-testid={`category-chip-${category.slug}`}
              className={chip(current.category === category.slug)}
              aria-pressed={current.category === category.slug}
              onClick={() => go({ category: category.slug })}
            >
              {category.name} <span className="num font-mono text-xs opacity-70">{category.bookCount}</span>
            </button>
          ))}
        </div>

        <form onSubmit={applyFilters} className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_8rem_8rem_12rem_auto]">
          <div>
            <label htmlFor="filter-author" className="label">Author</label>
            <input
              id="filter-author"
              data-testid="filter-author-input"
              type="text"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
              className="input"
              placeholder="Any author"
            />
          </div>
          <div>
            <label htmlFor="filter-min" className="label">Min price</label>
            <input
              id="filter-min"
              data-testid="filter-min-price-input"
              type="number"
              min="0"
              step="0.01"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              className="input num"
            />
          </div>
          <div>
            <label htmlFor="filter-max" className="label">Max price</label>
            <input
              id="filter-max"
              data-testid="filter-max-price-input"
              type="number"
              min="0"
              step="0.01"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              className="input num"
            />
          </div>
          <div>
            <label htmlFor="sort-select" className="label">Sort by</label>
            <select
              id="sort-select"
              data-testid="sort-select"
              value={current.sort}
              onChange={(e) => go({ sort: e.target.value })}
              className="input"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button data-testid="filters-apply-button" type="submit" className="btn btn-secondary">
              Apply
            </button>
            {hasFilters && (
              <button
                data-testid="filters-clear-button"
                type="button"
                onClick={() => router.push(pathname)}
                className="btn btn-outline"
              >
                <XIcon className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </form>
      </section>

      {loading && !result ? (
        <div
          data-testid="books-loading"
          aria-busy="true"
          aria-label="Loading books"
          className="grid grid-cols-1 border-l border-t-2 border-ink-950 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border-b border-r border-mist-200">
              <div className="skeleton aspect-[6/5] w-full" />
              <div className="space-y-3 p-5">
                <div className="skeleton h-5 w-24" />
                <div className="skeleton h-7 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div data-testid="no-books-message" className="empty-state">
          <p className="section-label mb-4">0 results</p>
          <h3 className="panel-title mb-3">No books found</h3>
          <p className="mb-8 max-w-md text-ink-600">
            Try a different title, author or ISBN, change the filters, or browse the full catalog.
          </p>
          <button
            data-testid="view-all-books-button"
            onClick={() => router.push(pathname)}
            className="btn btn-primary"
          >
            View All Books
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-3 pb-5">
            <h3 data-testid="books-count" className="font-display text-2xl font-bold tracking-tight text-ink-950">
              {heading}
            </h3>
            {current.query && (
              <button
                data-testid="clear-search-button"
                onClick={() => go({ query: undefined })}
                className="flex items-center gap-1.5 text-sm font-semibold text-cobalt-500 underline underline-offset-4 transition-colors hover:text-cobalt-700"
              >
                <XIcon className="h-4 w-4" />
                Clear Search
              </button>
            )}
          </div>
          <div
            data-testid="books-grid"
            aria-busy={loading}
            className={`grid grid-cols-1 border-l border-t border-mist-200 transition-opacity duration-150 sm:grid-cols-2 lg:grid-cols-3 ${
              loading ? 'opacity-50' : ''
            }`}
          >
            {books.map((book) => (
              <BookCard key={book.id} book={book} onAddToCart={handleAddToCart} />
            ))}
          </div>
          <Pagination
            page={result?.page ?? 1}
            totalPages={result?.totalPages ?? 1}
            onChange={(page) => {
              go({ page }, true)
              window.scrollTo({ top: 0 })
            }}
          />
        </>
      )}
    </div>
  )
}
