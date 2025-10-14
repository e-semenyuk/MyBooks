import { Book } from '@/types'

interface BookCardProps {
  book: Book
  onAddToCart: (bookId: number) => void
}

export default function BookCard({ book, onAddToCart }: BookCardProps) {
  const isOutOfStock = book.stockQuantity === 0
  const isLowStock = book.stockQuantity > 0 && book.stockQuantity <= 5
  
  return (
    <div className="group card-gradient hover-lift border-2 border-transparent hover:border-primary-200 overflow-hidden relative animate-fade-in flex flex-col h-full">
      {/* Stock badge */}
      <div className="absolute top-4 right-4 z-10">
        {isOutOfStock ? (
          <span className="badge badge-danger shadow-lg">Out of Stock</span>
        ) : isLowStock ? (
          <span className="badge badge-warning shadow-lg">Only {book.stockQuantity} left</span>
        ) : (
          <span className="badge badge-success shadow-lg">In Stock</span>
        )}
      </div>
      
      {/* Book icon background */}
      <div className="absolute top-0 right-0 text-8xl opacity-5 -mr-4 -mt-4 transform group-hover:scale-110 transition-transform duration-500">
        📖
      </div>
      
      <div className="relative flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors duration-300">
          {book.title}
        </h3>
        <p className="text-gray-600 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-sm font-medium">{book.author}</span>
        </p>
        
        {book.isbn && (
          <p className="text-xs text-gray-400 mb-3 font-mono">ISBN: {book.isbn}</p>
        )}
        
        <div className="mb-4">
          <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
            {book.description || 'No description available'}
          </p>
        </div>
        
        <div className="mt-auto">
        <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Price</p>
            <p className="text-3xl font-bold text-gradient">
              ${book.price.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Stock</p>
            <p className={`text-lg font-bold ${
              isOutOfStock ? 'text-red-500' : 
              isLowStock ? 'text-amber-600' : 
              'text-emerald-600'
            }`}>
              {book.stockQuantity}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => onAddToCart(book.id)}
          disabled={isOutOfStock}
          className={`btn w-full ${
            isOutOfStock 
              ? 'bg-gray-300 cursor-not-allowed hover:scale-100 shadow-none' 
              : 'btn-primary'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            {isOutOfStock ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Out of Stock
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Add to Cart
              </>
            )}
          </span>
        </button>
        </div>
      </div>
    </div>
  )
}

