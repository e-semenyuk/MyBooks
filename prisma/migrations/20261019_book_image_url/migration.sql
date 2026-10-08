-- Book pictures: an optional link next to the uploaded cover.

ALTER TABLE "Book" ADD COLUMN "imageUrl" TEXT;

-- Demo books get their cover picture (only where no link is set yet).
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/15257423-L.jpg' WHERE "title" = '1984' AND "author" = 'George Orwell' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/14369845-L.jpg' WHERE "title" = 'The Great Gatsby' AND "author" = 'F. Scott Fitzgerald' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/15153500-L.jpg' WHERE "title" = 'To Kill a Mockingbird' AND "author" = 'Harper Lee' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/15043406-L.jpg' WHERE "title" = 'Pride and Prejudice' AND "author" = 'Jane Austen' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/15172466-L.jpg' WHERE "title" = 'The Catcher in the Rye' AND "author" = 'J.D. Salinger' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/15170948-L.jpg' WHERE "title" = 'Brave New World' AND "author" = 'Aldous Huxley' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/11978426-L.jpg' WHERE "title" = 'Moby-Dick' AND "author" = 'Herman Melville' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/14624642-L.jpg' WHERE "title" = 'The Hobbit' AND "author" = 'J.R.R. Tolkien' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/15171080-L.jpg' WHERE "title" = 'Fahrenheit 451' AND "author" = 'Ray Bradbury' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/15164202-L.jpg' WHERE "title" = 'Jane Eyre' AND "author" = 'Charlotte Bronte' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/14020316-L.jpg' WHERE "title" = 'Dune' AND "author" = 'Frank Herbert' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/14389185-L.jpg' WHERE "title" = 'Neuromancer' AND "author" = 'William Gibson' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/14920821-L.jpg' WHERE "title" = 'The Left Hand of Darkness' AND "author" = 'Ursula K. Le Guin' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/14828149-L.jpg' WHERE "title" = 'The Martian Chronicles' AND "author" = 'Ray Bradbury' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/15231478-L.jpg' WHERE "title" = 'A Wizard of Earthsea' AND "author" = 'Ursula K. Le Guin' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/15244480-L.jpg' WHERE "title" = 'The Fellowship of the Ring' AND "author" = 'J.R.R. Tolkien' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/13409756-L.jpg' WHERE "title" = 'The Name of the Wind' AND "author" = 'Patrick Rothfuss' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/14657945-L.jpg' WHERE "title" = 'Good Omens' AND "author" = 'Terry Pratchett and Neil Gaiman' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/15159278-L.jpg' WHERE "title" = 'And Then There Were None' AND "author" = 'Agatha Christie' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/4638176-L.jpg' WHERE "title" = 'The Hound of the Baskervilles' AND "author" = 'Arthur Conan Doyle' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/12498395-L.jpg' WHERE "title" = 'Gone Girl' AND "author" = 'Gillian Flynn' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/11518032-L.jpg' WHERE "title" = 'The Big Sleep' AND "author" = 'Raymond Chandler' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/11481587-L.jpg' WHERE "title" = 'Sapiens' AND "author" = 'Yuval Noah Harari' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/15111148-L.jpg' WHERE "title" = 'The Pragmatic Programmer' AND "author" = 'Andrew Hunt and David Thomas' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/13290715-L.jpg' WHERE "title" = 'Thinking, Fast and Slow' AND "author" = 'Daniel Kahneman' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/14829099-L.jpg' WHERE "title" = 'A Brief History of Time' AND "author" = 'Stephen Hawking' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/8261438-L.jpg' WHERE "title" = 'The Guns of August' AND "author" = 'Barbara W. Tuchman' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/10382021-L.jpg' WHERE "title" = 'SPQR' AND "author" = 'Mary Beard' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/15233611-L.jpg' WHERE "title" = 'The Silk Roads' AND "author" = 'Peter Frankopan' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/14617883-L.jpg' WHERE "title" = 'Persuasion' AND "author" = 'Jane Austen' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/10745175-L.jpg' WHERE "title" = 'Outlander' AND "author" = 'Diana Gabaldon' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/15222783-L.jpg' WHERE "title" = 'Me Before You' AND "author" = 'Jojo Moyes' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/14981306-L.jpg' WHERE "title" = 'Leaves of Grass' AND "author" = 'Walt Whitman' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/6974152-L.jpg' WHERE "title" = 'Ariel' AND "author" = 'Sylvia Plath' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/15162565-L.jpg' WHERE "title" = 'Milk and Honey' AND "author" = 'Rupi Kaur' AND "imageUrl" IS NULL;
UPDATE "Book" SET "imageUrl" = 'https://covers.openlibrary.org/b/id/15184471-L.jpg' WHERE "title" = 'The Waste Land' AND "author" = 'T.S. Eliot' AND "imageUrl" IS NULL;
