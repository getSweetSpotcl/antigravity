require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🌱 Seeding database...')

    // Create demo tenant
    const tenant = await prisma.tenant.upsert({
        where: { rut: '76000000-0' },
        update: {},
        create: {
            name: 'Demo Corredora de Seguros',
            rut: '76000000-0',
            slug: 'demo',
        },
    })

    console.log('✅ Tenant created:', tenant.name)

    // Create superadmin user
    const hashedPassword = await bcrypt.hash('Admin123!', 10)

    const admin = await prisma.user.upsert({
        where: { email: 'admin@demo.cl' },
        update: {},
        create: {
            email: 'admin@demo.cl',
            name: 'Admin Demo',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            tenantId: tenant.id,
        },
    })

    console.log('✅ Admin user created:', admin.email)

    // Create Insurance Companies (principales aseguradoras chilenas)
    const companies = [
        { name: 'HDI Seguros', rut: '99006000-6', contact: 'Ejecutivo Comercial', email: 'contacto@hdi.cl', phone: '+56 2 2660 8000' },
        { name: 'Mapfre Seguros', rut: '99007000-5', contact: 'Mesa de Ayuda', email: 'info@mapfre.cl', phone: '+56 600 6277 373' },
        { name: 'Consorcio Seguros', rut: '99004000-9', contact: 'Atención Corredores', email: 'corredores@consorcio.cl', phone: '+56 2 2391 3000' },
        { name: 'BCI Seguros', rut: '99008000-4', contact: 'Servicio al Cliente', email: 'seguros@bci.cl', phone: '+56 600 692 2000' },
        { name: 'Chilena Consolidada (Zurich)', rut: '99240000-K', contact: 'Ejecutivo Comercial', email: 'contacto@zurich.cl', phone: '+56 2 2938 1000' },
        { name: 'Liberty Seguros', rut: '99003000-K', contact: 'Mesa Central', email: 'info@libertyseguros.cl', phone: '+56 2 2581 9000' },
        { name: 'SURA Seguros', rut: '99005000-8', contact: 'Atención Corredores', email: 'corredores@segurossura.cl', phone: '+56 2 2385 3000' },
        { name: 'Reale Seguros', rut: '76239000-1', contact: 'Comercial', email: 'contacto@reale.cl', phone: '+56 2 2589 3000' },
        { name: 'Zenit Seguros', rut: '99567000-8', contact: 'Comercial', email: 'contacto@zenitseguros.cl', phone: '+56 2 2655 5000' },
        { name: 'Confuturo', rut: '99021000-9', contact: 'Vida', email: 'contacto@confuturo.cl', phone: '+56 600 600 1200' },
        { name: 'MetLife Chile', rut: '99019000-8', contact: 'Vida', email: 'contacto@metlife.cl', phone: '+56 2 2826 4000' },
        { name: 'Principal Vida', rut: '99020000-3', contact: 'Vida', email: 'contacto@principal.cl', phone: '+56 2 2200 1000' },
        { name: 'Security Vida', rut: '99018000-2', contact: 'Vida', email: 'contacto@security.cl', phone: '+56 2 2584 4000' },
        { name: 'Ohio National', rut: '96897000-K', contact: 'Vida', email: 'contacto@ohionational.cl', phone: '+56 2 2369 3000' },
        { name: '4 Life Seguros', rut: '76146000-6', contact: 'Vida', email: 'contacto@4life.cl', phone: '+56 2 2956 3000' },
        { name: 'AIG Seguros', rut: '99045000-K', contact: 'Generales', email: 'contacto@aig.cl', phone: '+56 2 2490 8000' },
        { name: 'Chubb Seguros', rut: '99044000-4', contact: 'Generales', email: 'contacto@chubb.cl', phone: '+56 2 2549 8000' },
        { name: 'Starr Insurance', rut: '76468000-7', contact: 'Generales', email: 'contacto@starr.cl', phone: '+56 2 2307 8000' },
        { name: 'Berkley', rut: '76576000-4', contact: 'Generales', email: 'contacto@berkley.cl', phone: '+56 2 2599 8000' },
        { name: 'Continental', rut: '99046000-5', contact: 'Generales', email: 'contacto@continental.cl', phone: '+56 2 2636 6000' },
        { name: 'Fid Seguros', rut: '76979000-6', contact: 'Generales', email: 'contacto@fidseguros.cl', phone: '+56 2 2594 8000' },
        { name: 'Porvenir', rut: '77276000-8', contact: 'Garantía', email: 'contacto@porvenir.cl', phone: '+56 2 2899 8000' },
        { name: 'Renta Nacional', rut: '99014000-0', contact: 'Generales', email: 'contacto@rentanacional.cl', phone: '+56 2 2670 8000' },
        { name: 'Saceem', rut: '99526000-4', contact: 'Crédito', email: 'contacto@saceem.cl', phone: '+56 2 2696 8000' },
        { name: 'Southbridge', rut: '99045000-K', contact: 'Generales', email: 'contacto@southbridge.cl', phone: '+56 2 2351 8000' },
        { name: 'Unnio', rut: '76424000-7', contact: 'Generales', email: 'contacto@unnio.cl', phone: '+56 2 2598 8000' },
        { name: 'BNP Paribas Cardif', rut: '96935000-5', contact: 'Generales', email: 'contacto@cardif.cl', phone: '+56 2 2412 8000' },
        { name: 'Assurant', rut: '76226000-0', contact: 'Generales', email: 'contacto@assurant.cl', phone: '+56 2 2585 8000' },
    ]

    for (const company of companies) {
        const existing = await prisma.insuranceCompany.findFirst({
            where: { rut: company.rut, tenantId: tenant.id },
        })

        if (!existing) {
            await prisma.insuranceCompany.create({
                data: {
                    ...company,
                    tenantId: tenant.id,
                },
            })
        }
    }

    console.log(`✅ Created ${companies.length} insurance companies`)

    console.log('🎉 Seeding completed!')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
