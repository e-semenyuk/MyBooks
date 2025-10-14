# Migration Guide: Java Spring Boot → Next.js

This document explains the migration from the Java Spring Boot application to Next.js.

## Architecture Comparison

### Java Spring Boot (Original)
```
SimpleBookstore/
├── src/main/java/com/bookstore/
│   ├── controller/     → REST Controllers
│   ├── service/        → Business Logic
│   ├── repository/     → JPA Repositories
│   └── model/          → JPA Entities
└── src/main/resources/
    └── static/         → HTML/CSS/JS
```

### Next.js (New)
```
NextBookstore/
├── src/app/api/        → API Routes (replaces Controllers)
├── src/lib/services/   → Business Logic (replaces Services)
├── src/components/     → React Components (replaces static HTML)
└── prisma/             → Database Schema (replaces JPA Entities)
```

## Feature Mapping

| Feature | Java Spring Boot | Next.js |
|---------|-----------------|---------|
| **Framework** | Spring Boot 3.1 | Next.js 14 |
| **Language** | Java 17 | TypeScript 5 |
| **Database** | H2 (in-memory) | PostgreSQL (Supabase) |
| **ORM** | JPA/Hibernate | Prisma |
| **Frontend** | Vanilla JS | React + TypeScript |
| **Styling** | Custom CSS | Tailwind CSS |
| **Session** | HTTP Session | Cookie-based UUID |
| **Deployment** | JAR file | Vercel (Serverless) |
| **Build Tool** | Maven | npm/Node.js |

## Code Comparison

### 1. Models/Entities

**Java (JPA Entity)**
```java
@Entity
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Title is required")
    @Column(nullable = false)
    private String title;
    
    // ... getters/setters
}
```

**TypeScript (Prisma Schema)**
```prisma
model Book {
  id            Int      @id @default(autoincrement())
  title         String
  author        String
  price         Float
  stockQuantity Int      @default(0)
}
```

**TypeScript (Type Definition)**
```typescript
export interface Book {
  id: number
  title: string
  author: string
  price: number
  stockQuantity: number
}
```

### 2. Repository Layer

**Java (Spring Data JPA)**
```java
@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findByStockQuantityGreaterThan(Integer quantity);
    
    @Query("SELECT b FROM Book b WHERE " +
           "LOWER(b.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.author) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Book> searchBooks(@Param("query") String query);
}
```

**TypeScript (Prisma)**
```typescript
// No explicit repository class needed
const books = await prisma.book.findMany({
  where: { stockQuantity: { gt: 0 } }
})

const searchResults = await prisma.book.findMany({
  where: {
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { author: { contains: query, mode: 'insensitive' } }
    ]
  }
})
```

### 3. Service Layer

**Java**
```java
@Service
public class BookService {
    @Autowired
    private BookRepository bookRepository;
    
    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }
    
    public Book saveBook(Book book) {
        return bookRepository.save(book);
    }
}
```

**TypeScript**
```typescript
export class BookService {
  static async getAllBooks(): Promise<Book[]> {
    return await prisma.book.findMany()
  }
  
  static async createBook(data: CreateBookRequest): Promise<Book> {
    return await prisma.book.create({ data })
  }
}
```

### 4. Controller/API Routes

**Java (Spring Controller)**
```java
@RestController
@RequestMapping("/api/books")
public class BookController {
    @Autowired
    private BookService bookService;
    
    @GetMapping
    public ResponseEntity<List<Book>> getAllBooks() {
        return ResponseEntity.ok(bookService.getAllBooks());
    }
    
    @PostMapping
    public ResponseEntity<Book> createBook(@Valid @RequestBody Book book) {
        Book savedBook = bookService.saveBook(book);
        return new ResponseEntity<>(savedBook, HttpStatus.CREATED);
    }
}
```

**TypeScript (Next.js API Route)**
```typescript
// app/api/books/route.ts
export async function GET() {
  try {
    const books = await BookService.getAllBooks()
    return NextResponse.json(books)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const book = await BookService.createBook(body)
    return NextResponse.json(book, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create book' },
      { status: 500 }
    )
  }
}
```

### 5. Frontend

**Java (Vanilla JavaScript)**
```javascript
async function loadBooks() {
    const response = await fetch('/api/books');
    const books = await response.json();
    displayBooks(books);
}

function displayBooks(books) {
    const grid = document.getElementById('books-grid');
    grid.innerHTML = books.map(book => `
        <div class="book-card">
            <h3>${book.title}</h3>
            <p>${book.author}</p>
            <button onclick="addToCart(${book.id})">Add to Cart</button>
        </div>
    `).join('');
}
```

**TypeScript (React Component)**
```typescript
export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([])
  
  useEffect(() => {
    loadBooks()
  }, [])
  
  const loadBooks = async () => {
    const response = await fetch('/api/books')
    const data = await response.json()
    setBooks(data)
  }
  
  return (
    <div className="grid grid-cols-3 gap-6">
      {books.map(book => (
        <BookCard 
          key={book.id} 
          book={book} 
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  )
}
```

## Session Management

### Java Spring Boot
```java
@PostMapping("/cart")
public ResponseEntity<CartItem> addToCart(
    @RequestBody AddToCartRequest request,
    HttpSession session
) {
    String sessionId = session.getId();
    CartItem item = cartService.addToCart(sessionId, request);
    return ResponseEntity.ok(item);
}
```

### Next.js
```typescript
// lib/session.ts
export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get('bookstore_session_id')?.value
  
  if (!sessionId) {
    sessionId = uuidv4()
    cookieStore.set('bookstore_session_id', sessionId, {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true
    })
  }
  
  return sessionId
}

// app/api/cart/route.ts
export async function POST(request: NextRequest) {
  const sessionId = await getOrCreateSessionId()
  const body = await request.json()
  const item = await CartService.addToCart(sessionId, body.bookId, body.quantity)
  return NextResponse.json(item)
}
```

## Database Configuration

### Java (application.properties)
```properties
spring.datasource.url=jdbc:h2:mem:bookstore
spring.jpa.hibernate.ddl-auto=create-drop
```

### Next.js (.env.local + Prisma)
```env
DATABASE_URL="postgresql://user:pass@host:5432/bookstore"
```

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Key Differences

### 1. **Deployment Model**
- **Java**: Traditional server (runs continuously, handles requests)
- **Next.js**: Serverless functions (spin up on demand, auto-scale)

### 2. **Type Safety**
- **Java**: Compile-time type checking (strongly typed)
- **TypeScript**: Compile-time + runtime type checking (strongly typed + Prisma validation)

### 3. **Database**
- **Java**: In-memory H2 (resets on restart)
- **Next.js**: Persistent PostgreSQL (data persists)

### 4. **Frontend**
- **Java**: Server-rendered HTML + vanilla JS
- **Next.js**: React (component-based, reactive state management)

### 5. **Development Experience**
- **Java**: Compile → Run → Restart server
- **Next.js**: Hot reload (instant updates)

### 6. **Scaling**
- **Java**: Vertical scaling (bigger server)
- **Next.js**: Horizontal scaling (Vercel handles automatically)

## Benefits of Next.js Version

✅ **Modern Stack**: Latest web technologies (React, TypeScript)  
✅ **Better UX**: Fast, interactive UI with React  
✅ **Serverless**: No server management, auto-scaling  
✅ **Type Safety**: Full TypeScript coverage  
✅ **Developer Experience**: Hot reload, great tooling  
✅ **Cost Effective**: Free tier on Vercel + Supabase  
✅ **Global CDN**: Fast loading worldwide  
✅ **Persistent Database**: Data survives restarts  

## Migration Checklist

- [x] Convert JPA entities to Prisma schema
- [x] Migrate repositories to Prisma queries
- [x] Convert services to TypeScript classes
- [x] Rewrite controllers as API routes
- [x] Build React frontend
- [x] Implement session management
- [x] Set up Supabase database
- [x] Configure Vercel deployment
- [x] Create seed data
- [x] Write documentation

## Next Steps

1. Test all features in development
2. Deploy to Vercel
3. Monitor performance
4. Add authentication (if needed)
5. Add more features (reviews, ratings, etc.)

---

**Questions?** Check the [README.md](./README.md) for detailed documentation!

