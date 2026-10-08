import Link from 'next/link'
import { Book } from '@/types'
import BookCover from '@/components/BookCover'
import { ArrowRightIcon } from '@/components/icons'

interface BookCardProps {
  book: Book
  onAddToCart: (bookId: number) => void
}

// One cell of the catalog grid. The grid draws the outer rules; the cell draws
// its right and bottom edge so cells share borders.
export default function BookCard({ book, onAddToCart }: BookCardProps) {
  const isOutOfStock = book.stockQuantity === 0
  const isLowStock = book.stockQuantity > 0 && book.stockQuantity <= 5

  return (
    <article
      data-testid={`book-card-${book.id}`}
      className="group flex h-full flex-col border-b border-r border-mist-200 bg-white"
    >
      <BookCover id={book.id} title={book.title} />

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div data-testid={`book-stock-badge-${book.id}`}>
            {isOutOfStock ? (
              <span className="badge badge-danger">Out of Stock</span>
            ) : isLowStock ? (
              <span className="badge badge-warning">Only {book.stockQuantity} left</span>
            ) : (
              <span className="badge badge-success">In Stock</span>
            )}
          </div>
          {book.isbn && <p className="truncate font-mono text-[11px] text-ink-500">{book.isbn}</p>}
        </div>

        <h3
          data-testid={`book-title-${book.id}`}
          className="mb-1 line-clamp-2 font-display text-2xl font-bold leading-tight tracking-tight text-ink-950 decoration-cobalt-500 decoration-2 underline-offset-4 group-hover:underline"
        >
          <Link href={`/books/${book.id}`} data-testid={`book-link-${book.id}`}>
            {book.title}
          </Link>
        </h3>
        <p data-testid={`book-author-${book.id}`} className="mb-4 text-sm font-medium text-ink-600">
          {book.author}
        </p>

        <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-ink-600">
          {book.description || 'No description available'}
        </p>

        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="section-label mb-1">Price</p>
            <p
              data-testid={`book-price-${book.id}`}
              className="num font-display text-3xl font-extrabold tracking-tight text-ink-950"
            >
              ${book.price.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="section-label mb-1">Stock</p>
            <p
              data-testid={`book-stock-${book.id}`}
              className={`num font-mono text-base font-semibold ${
                isOutOfStock ? 'text-danger' : isLowStock ? 'text-warning' : 'text-ink-950'
              }`}
            >
              {book.stockQuantity}
            </p>
          </div>
        </div>
      </div>

      <button
        data-testid={`add-to-cart-button-${book.id}`}
        onClick={() => onAddToCart(book.id)}
        disabled={isOutOfStock}
        className="btn btn-primary min-h-[52px] w-full justify-between border-x-0 border-b-0 px-5"
      >
        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        {!isOutOfStock && <ArrowRightIcon className="h-5 w-5" />}
      </button>
    </article>
  )
}
