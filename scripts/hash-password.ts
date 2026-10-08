import bcrypt from 'bcryptjs'

// Usage: npx tsx scripts/hash-password.ts <password>
async function hashPassword() {
  const password = process.argv[2]
  if (!password) {
    console.error('Usage: npx tsx scripts/hash-password.ts <password>')
    process.exit(1)
  }
  const hashedPassword = await bcrypt.hash(password, 10)
  console.log(hashedPassword)
}

hashPassword()
