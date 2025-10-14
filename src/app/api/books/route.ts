import { NextRequest, NextResponse } from 'next/server'
import { BookService } from '@/lib/services/bookService'
import { CreateBookRequest } from '@/types'

// GET /api/books - Get all books or search books
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')

    const books = query 
      ? await BookService.searchBooks(query)
      : await BookService.getAllBooks()

    return NextResponse.json(books)
  } catch (error) {
    console.error('Error fetching books:', error)
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    )
  }
}

// POST /api/books - Create a new book
export async function POST(request: NextRequest) {
  try {
    const body: CreateBookRequest = await request.json()

    // Validation
    if (!body.title || !body.author || body.price === undefined || body.stockQuantity === undefined) {
      return NextResponse.json(
        { error: 'Title, author, price, and stock quantity are required' },
        { status: 400 }
      )
    }

    const book = await BookService.createBook(body)
    return NextResponse.json(book, { status: 201 })
  } catch (error) {
    console.error('Error creating book:', error)
    return NextResponse.json(
      { error: 'Failed to create book' },
      { status: 500 }
    )
  }
}

