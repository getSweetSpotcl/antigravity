import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
    try {
        // Verificar usuarios existentes
        const existingUsers = await prisma.user.findMany({
            include: {
                tenant: true
            }
        })

        if (existingUsers.length > 0) {
            return NextResponse.json({
                message: 'Ya existen usuarios en la base de datos',
                users: existingUsers.map(user => ({
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    tenant: user.tenant?.name
                }))
            })
        }

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

        return NextResponse.json({
            success: true,
            message: 'Usuario superadmin creado exitosamente',
            credentials: {
                email: 'admin@demo.cl',
                password: 'Admin123!',
                tenant: 'Corredora Demo'
            }
        })
    } catch (error) {
        console.error('Error creating superadmin:', error)
        return NextResponse.json(
            { error: 'Error al crear el usuario superadmin' },
            { status: 500 }
        )
    }
}
