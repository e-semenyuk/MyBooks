import { Book } from '@/types'

interface BookCardProps {
  book: Book
  onAddToCart: (bookId: number) => void
}

export default function BookCard({ book, onAddToCart }: BookCardProps) {
  return (
    <div className="card hover:shadow-xl transition-shadow">
      <h3 className="text-xl font-bold text-gray-900 mb-2">{book.title}</h3>
      <p className="text-gray-600 mb-2">by {book.author}</p>
      <p className="text-success text-lg font-bold mb-3">${book.price.toFixed(2)}</p>
      <p className="text-gray-700 text-sm mb-3 line-clamp-3">
        {book.description || 'No description available'}
      </p>
      <p className="text-warning text-sm mb-4">Stock: {book.stockQuantity} available</p>
      
      <button
        onClick={() => onAddToCart(book.id)}
        disabled={book.stockQuantity === 0}
        className={`btn w-full ${
          book.stockQuantity === 0 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'btn-primary'
        }`}
      >
        {book.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </div>
  )
}

