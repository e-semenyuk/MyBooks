import { Book } from '@/types'
import BookCover from '@/components/BookCover'

interface BookCardProps {
  book: Book
  onAddToCart: (bookId: number) => void
}

export default function BookCard({ book, onAddToCart }: BookCardProps) {
  const isOutOfStock = book.stockQuantity === 0
  const isLowStock = book.stockQuantity > 0 && book.stockQuantity <= 5

  return (
    <article
      data-testid={`book-card-${book.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-stone-200 bg-white transition-colors duration-150 hover:border-ink-900"
    >
      <BookCover id={book.id} title={book.title} />

      <div className="flex flex-1 flex-col p-5">
        <div data-testid={`book-stock-badge-${book.id}`} className="mb-3">
          {isOutOfStock ? (
            <span className="badge badge-danger">Out of Stock</span>
          ) : isLowStock ? (
            <span className="badge badge-warning">Only {book.stockQuantity} left</span>
          ) : (
            <span className="badge badge-success">In Stock</span>
          )}
        </div>

        <h3
          data-testid={`book-title-${book.id}`}
          className="mb-1 line-clamp-2 font-serif text-xl font-semibold leading-snug tracking-tight text-ink-900"
        >
          {book.title}
        </h3>
        <p data-testid={`book-author-${book.id}`} className="mb-3 text-sm text-stone-600">
          {book.author}
        </p>

        {book.isbn && (
          <p className="mb-3 font-mono text-xs text-stone-500">ISBN {book.isbn}</p>
        )}

        <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-stone-600">
          {book.description || 'No description available'}
        </p>

        <div className="mt-auto">
          <div className="mb-4 flex items-end justify-between border-t border-stone-200 pt-4">
            <div>
              <p className="section-label mb-1">Price</p>
              <p
                data-testid={`book-price-${book.id}`}
                className="num font-serif text-2xl font-semibold text-ink-900"
              >
                ${book.price.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="section-label mb-1">Stock</p>
              <p
                data-testid={`book-stock-${book.id}`}
                className={`num text-base font-semibold ${
                  isOutOfStock ? 'text-danger' : isLowStock ? 'text-warning' : 'text-ink-800'
                }`}
              >
                {book.stockQuantity}
              </p>
            </div>
          </div>

          <button
            data-testid={`add-to-cart-button-${book.id}`}
            onClick={() => onAddToCart(book.id)}
            disabled={isOutOfStock}
            className="btn btn-primary w-full"
          >
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  )
}
