const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  const [email, password, name = "Admin", role = "SUPER_ADMIN"] = process.argv.slice(2)

  if (!email || !password) {
    throw new Error("Usage: node scripts/provision-admin.cjs <email> <password> [name] [role]")
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      name,
      role,
    },
    create: {
      email,
      password: hashedPassword,
      name,
      role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  })

  console.log(JSON.stringify(user))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })