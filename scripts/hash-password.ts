import bcrypt from 'bcryptjs'

async function hashPassword() {
  const password = process.argv[2] || 'admin123'
  const hashedPassword = await bcrypt.hash(password, 10)
  console.log('\n✅ Password hashed successfully!')
  console.log(`\nOriginal: ${password}`)
  console.log(`Hashed:   ${hashedPassword}`)
  console.log('\nUse this hashed password in your SQL file.\n')
}

hashPassword()

