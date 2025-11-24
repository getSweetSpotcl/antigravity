import { PrismaClient } from '.prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('🔍 Buscando usuarios en la base de datos...\n')

        const users = await prisma.user.findMany({
            include: {
                tenant: true
            }
        })

        if (users.length === 0) {
            console.log('❌ No hay usuarios en la base de datos\n')
            return
        }

        console.log(`✅ Se encontraron ${users.length} usuario(s):\n`)

        users.forEach((user, index) => {
            console.log(`${index + 1}. Email: ${user.email}`)
            console.log(`   Nombre: ${user.name}`)
            console.log(`   Rol: ${user.role}`)
            console.log(`   Tenant: ${user.tenant?.name || 'N/A'}`)
            console.log(`   ID: ${user.id}`)
            console.log('')
        })
    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
