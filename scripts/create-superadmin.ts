import { config } from 'dotenv'
config() // Load .env file

import { prisma } from '../lib/db'
import bcrypt from 'bcryptjs'

async function main() {
    console.log('🔍 Verificando usuarios existentes...')

    const existingUsers = await prisma.user.findMany({
        include: {
            Tenant: true
        }
    })

    if (existingUsers.length > 0) {
        console.log('\n✅ Usuarios existentes:')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        existingUsers.forEach((user: any) => {
            console.log(`\n📧 Email: ${user.email}`)
            console.log(`👤 Nombre: ${user.name}`)
            console.log(`🏢 Corredora: ${user.Tenant?.name || 'N/A'}`)
            console.log(`🔑 Rol: ${user.role}`)
        })
        return
    }

    console.log('\n⚠️  No hay usuarios en la base de datos.')
    console.log('🔨 Creando usuario superadmin...\n')

    // Crear tenant
    const tenant = await prisma.tenant.create({
        data: {
            name: 'Corredora Demo',
            rut: '76.123.456-7',
            slug: 'demo',
        }
    })

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('Admin123!', 10)

    const admin = await prisma.user.create({
        data: {
            email: 'admin@demo.cl',
            name: 'Administrador',
            password: hashedPassword,
            role: 'BROKERAGE_ADMIN',
            tenantId: tenant.id,
        }
    })

    console.log('✅ Usuario superadmin creado exitosamente!\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Email:      admin@demo.cl')
    console.log('🔑 Contraseña: Admin123!')
    console.log('🏢 Corredora:  Corredora Demo')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
    .catch((e) => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
