import { config } from 'dotenv'
config()

import { prisma } from '../lib/db'

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            tenantId: true,
            Tenant: { select: { name: true } }
        }
    })

    if (users.length === 0) {
        console.log('❌ No hay usuarios en la base de datos')
    } else {
        console.log('✅ Usuarios encontrados:')
        users.forEach(u => {
            const tenantName = u.Tenant ? u.Tenant.name : 'N/A'
            console.log(`  - ${u.email} (${u.role}) - Tenant: ${tenantName}`)
        })
    }
}

main().catch(console.error)
