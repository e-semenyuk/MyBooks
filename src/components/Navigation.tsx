'use client'

interface NavigationProps {
  currentPage: string
  cartCount: number
  onNavigate: (page: 'home' | 'cart' | 'checkout' | 'admin') => void
}

export default function Navigation({ currentPage, cartCount, onNavigate }: NavigationProps) {
  return (
    <nav className="bg-secondary text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-2xl font-bold">📚 Digital Bookstore</h1>
          
          <div className="flex gap-4">
            <button
              onClick={() => onNavigate('home')}
              className={`px-4 py-2 rounded-md transition-colors ${
                currentPage === 'home' 
                  ? 'bg-white/20' 
                  : 'hover:bg-white/10'
              }`}
            >
              Home
            </button>
            
            <button
              onClick={() => onNavigate('cart')}
              className={`px-4 py-2 rounded-md transition-colors ${
                currentPage === 'cart' 
                  ? 'bg-white/20' 
                  : 'hover:bg-white/10'
              }`}
            >
              Cart ({cartCount})
            </button>
            
            <button
              onClick={() => onNavigate('admin')}
              className={`px-4 py-2 rounded-md transition-colors ${
                currentPage === 'admin' 
                  ? 'bg-white/20' 
                  : 'hover:bg-white/10'
              }`}
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

