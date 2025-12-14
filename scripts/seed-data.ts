import 'dotenv/config'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// Helper to generate random date within range
function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper to generate random decimal
function randomDecimal(min: number, max: number, decimals = 2): number {
    return Number((Math.random() * (max - min) + min).toFixed(decimals))
}

// Generate CUID-like ID
function generateId(): string {
    return 'c' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Chilean RUT generator (simplified)
function generateRut(): string {
    const num = Math.floor(Math.random() * 30000000) + 5000000
    const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    const dv = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'K'][Math.floor(Math.random() * 11)]
    return `${formatted}-${dv}`
}

async function main() {
    console.log('🌱 Iniciando carga de datos de prueba...\n')

    // Get the tenant
    const tenantResult = await pool.query('SELECT id FROM "Tenant" LIMIT 1')
    if (tenantResult.rows.length === 0) {
        console.log('❌ No se encontró ningún tenant. Crea primero un usuario.')
        return
    }
    const tenantId = tenantResult.rows[0].id
    console.log('✅ Tenant encontrado:', tenantId)

    // Create Insurance Companies
    console.log('\n📦 Creando compañías de seguros...')
    const companies = [
        { name: 'Mapfre Seguros', rut: '96.572.800-8', email: 'contacto@mapfre.cl', phone: '+56 2 2580 2000' },
        { name: 'HDI Seguros', rut: '76.079.116-5', email: 'contacto@hdi.cl', phone: '+56 2 2828 8000' },
        { name: 'Liberty Seguros', rut: '99.012.000-8', email: 'contacto@liberty.cl', phone: '+56 2 2351 2000' },
        { name: 'Sura Chile', rut: '99.301.000-6', email: 'contacto@sura.cl', phone: '+56 2 2350 7000' },
        { name: 'BCI Seguros', rut: '96.579.280-3', email: 'contacto@bciseguros.cl', phone: '+56 2 2692 8000' },
    ]

    const companyIds: string[] = []
    for (const company of companies) {
        const id = generateId()
        await pool.query(
            `INSERT INTO "InsuranceCompany" (id, name, rut, email, phone, "tenantId", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
             ON CONFLICT DO NOTHING`,
            [id, company.name, company.rut, company.email, company.phone, tenantId]
        )
        companyIds.push(id)
    }
    console.log(`  ✅ ${companies.length} compañías creadas`)

    // Create Clients
    console.log('\n👥 Creando clientes...')
    const clientNames = [
        { firstName: 'Juan', lastName: 'Pérez González' },
        { firstName: 'María', lastName: 'López Muñoz' },
        { firstName: 'Carlos', lastName: 'Rodríguez Silva' },
        { firstName: 'Ana', lastName: 'Martínez Vargas' },
        { firstName: 'Pedro', lastName: 'García Soto' },
        { firstName: 'Sofía', lastName: 'Fernández Torres' },
        { firstName: 'Diego', lastName: 'Sánchez Rojas' },
        { firstName: 'Valentina', lastName: 'Díaz Herrera' },
        { firstName: 'Sebastián', lastName: 'Muñoz Castro' },
        { firstName: 'Camila', lastName: 'Espinoza Vera' },
    ]

    const clientIds: string[] = []
    for (const client of clientNames) {
        const id = generateId()
        const rut = generateRut()
        const email = `${client.firstName.toLowerCase()}.${client.lastName.split(' ')[0].toLowerCase()}@email.cl`
        const phone = `+56 9 ${Math.floor(10000000 + Math.random() * 90000000)}`

        try {
            await pool.query(
                `INSERT INTO "Client" (id, rut, "firstName", "lastName", email, phone, "tenantId", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
                [id, rut, client.firstName, client.lastName, email, phone, tenantId]
            )
            clientIds.push(id)
        } catch (e) {
            // Skip if duplicate RUT
        }
    }
    console.log(`  ✅ ${clientIds.length} clientes creados`)

    // Create Quotes
    console.log('\n📋 Creando cotizaciones...')
    const policyTypes = ['AUTO', 'HOME', 'LIFE', 'HEALTH', 'GENERAL', 'GUARANTEE']
    const quoteStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED']

    const quoteIds: string[] = []
    for (let i = 0; i < 15; i++) {
        const id = generateId()
        const clientId = clientIds[Math.floor(Math.random() * clientIds.length)]
        const companyId = companyIds[Math.floor(Math.random() * companyIds.length)]
        const policyType = policyTypes[Math.floor(Math.random() * policyTypes.length)]
        const status = quoteStatuses[Math.floor(Math.random() * quoteStatuses.length)]
        const validUntil = randomDate(new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))
        const premium = randomDecimal(10, 500)
        const quoteNumber = `COT-${String(i + 1).padStart(4, '0')}`

        const coverages = JSON.stringify({
            daños: { monto: randomDecimal(1000, 10000), deducible: randomDecimal(1, 5) },
            robo: { monto: randomDecimal(500, 5000), deducible: randomDecimal(1, 3) },
            responsabilidadCivil: { monto: randomDecimal(1000, 5000), deducible: 0 },
        })

        await pool.query(
            `INSERT INTO "Quote" (id, "quoteNumber", "clientId", "companyId", "policyType", status, "totalPremium", currency, coverages, "validUntil", "tenantId", "createdAt", "updatedAt", "commissionPercentage")
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'UF', $8, $9, $10, NOW(), NOW(), $11)`,
            [id, quoteNumber, clientId, companyId, policyType, status, premium, coverages, validUntil, tenantId, randomDecimal(10, 25)]
        )
        quoteIds.push(id)
    }
    console.log(`  ✅ ${quoteIds.length} cotizaciones creadas`)

    // Create Policies
    console.log('\n📄 Creando pólizas...')
    const policyStatuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'EXPIRED', 'CANCELLED'] // Weighted towards ACTIVE

    const policyIds: string[] = []
    for (let i = 0; i < 20; i++) {
        const id = generateId()
        const clientId = clientIds[Math.floor(Math.random() * clientIds.length)]
        const companyId = companyIds[Math.floor(Math.random() * companyIds.length)]
        const policyType = policyTypes[Math.floor(Math.random() * policyTypes.length)]
        const status = policyStatuses[Math.floor(Math.random() * policyStatuses.length)]
        const startDate = randomDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), new Date())
        const endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000)
        const premium = randomDecimal(50, 800)
        const commission = randomDecimal(premium * 0.1, premium * 0.25)
        const policyNumber = `POL-${String(i + 1).padStart(5, '0')}`

        // Get company name
        const companyResult = await pool.query('SELECT name FROM "InsuranceCompany" WHERE id = $1', [companyId])
        const companyName = companyResult.rows[0]?.name || 'Compañía'

        const coverages = JSON.stringify({
            coberturaPrincipal: { monto: randomDecimal(5000, 50000), deducible: randomDecimal(1, 5) },
            coberturaAdicional: { monto: randomDecimal(1000, 10000), deducible: randomDecimal(1, 3) },
        })

        await pool.query(
            `INSERT INTO "Policy" (id, number, company, "companyId", type, status, "startDate", "endDate", premium, commission, currency, "clientId", "tenantId", coverages, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'UF', $11, $12, $13, NOW(), NOW())`,
            [id, policyNumber, companyName, companyId, policyType, status, startDate, endDate, premium, commission, clientId, tenantId, coverages]
        )
        policyIds.push(id)
    }
    console.log(`  ✅ ${policyIds.length} pólizas creadas`)

    // Create Claims
    console.log('\n🚨 Creando siniestros...')
    const claimStatuses = ['REPORTED', 'IN_PROCESS', 'APPROVED', 'REJECTED', 'CLOSED']
    const claimDescriptions = [
        'Accidente de tránsito en intersección',
        'Daño por inundación en propiedad',
        'Robo de vehículo estacionado',
        'Incendio parcial en cocina',
        'Daño a terceros por colisión',
        'Robo con fuerza en domicilio',
        'Daño por granizo en vehículo',
        'Choque por alcance trasero',
        'Filtraciones por lluvia',
        'Daño a parabrisas',
    ]

    for (let i = 0; i < 12; i++) {
        const id = generateId()
        const policyId = policyIds[Math.floor(Math.random() * policyIds.length)]
        const status = claimStatuses[Math.floor(Math.random() * claimStatuses.length)]
        const date = randomDate(new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), new Date())
        const description = claimDescriptions[Math.floor(Math.random() * claimDescriptions.length)]
        const claimNumber = `SIN-${String(i + 1).padStart(4, '0')}`
        const claimAmount = randomDecimal(100, 5000)
        const approvedAmount = status === 'APPROVED' || status === 'CLOSED' ? randomDecimal(claimAmount * 0.5, claimAmount) : null

        await pool.query(
            `INSERT INTO "Claim" (id, number, description, status, date, "policyId", "tenantId", "claimAmount", "approvedAmount", currency, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'UF', NOW(), NOW())`,
            [id, claimNumber, description, status, date, policyId, tenantId, claimAmount, approvedAmount]
        )
    }
    console.log('  ✅ 12 siniestros creados')

    // Create Commissions
    console.log('\n💰 Creando comisiones...')
    const commissionStatuses = ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE']

    for (let i = 0; i < policyIds.length; i++) {
        const policyId = policyIds[i]

        // Get policy premium
        const policyResult = await pool.query('SELECT premium, "startDate" FROM "Policy" WHERE id = $1', [policyId])
        const premium = parseFloat(policyResult.rows[0].premium)
        const startDate = new Date(policyResult.rows[0].startDate)

        const percentage = randomDecimal(15, 25)
        const amount = premium * (percentage / 100)
        const status = commissionStatuses[Math.floor(Math.random() * commissionStatuses.length)]
        const paidAmount = status === 'PAID' ? amount : status === 'PARTIAL' ? randomDecimal(0, amount) : 0
        const pendingAmount = amount - paidAmount
        const dueDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)

        const id = generateId()
        await pool.query(
            `INSERT INTO "Commission" (id, "policyId", percentage, "baseAmount", amount, currency, status, "paidAmount", "pendingAmount", "dueDate", "tenantId", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, 'UF', $6, $7, $8, $9, $10, NOW(), NOW())`,
            [id, policyId, percentage, premium, amount, status, paidAmount, pendingAmount, dueDate, tenantId]
        )
    }
    console.log(`  ✅ ${policyIds.length} comisiones creadas`)

    // Create Endorsements
    console.log('\n📝 Creando endosos...')
    const endorsementTypes = ['GENERAL_MODIFICATION', 'INCLUSION', 'EXCLUSION']
    const endorsementDescriptions = [
        'Modificación de suma asegurada',
        'Inclusión de cobertura adicional',
        'Cambio de beneficiario',
        'Actualización de datos del asegurado',
        'Exclusión de cobertura específica',
        'Ampliación de vigencia',
    ]

    for (let i = 0; i < 8; i++) {
        const id = generateId()
        const policyId = policyIds[Math.floor(Math.random() * policyIds.length)]
        const type = endorsementTypes[Math.floor(Math.random() * endorsementTypes.length)]
        const description = endorsementDescriptions[Math.floor(Math.random() * endorsementDescriptions.length)]
        const date = randomDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date())
        const effectiveDate = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000)
        const premiumChange = type === 'INCLUSION' ? randomDecimal(5, 50) : type === 'EXCLUSION' ? -randomDecimal(5, 30) : 0
        const number = `END-${String(i + 1).padStart(4, '0')}`

        await pool.query(
            `INSERT INTO "Endorsement" (id, number, type, description, date, "policyId", "effectiveDate", "premiumChange", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
            [id, number, type, description, date, policyId, effectiveDate, premiumChange]
        )
    }
    console.log('  ✅ 8 endosos creados')

    console.log('\n✅ Carga de datos completada exitosamente!')
    console.log('\n📊 Resumen:')
    console.log(`   - ${companies.length} compañías de seguros`)
    console.log(`   - ${clientIds.length} clientes`)
    console.log(`   - ${quoteIds.length} cotizaciones`)
    console.log(`   - ${policyIds.length} pólizas`)
    console.log('   - 12 siniestros')
    console.log(`   - ${policyIds.length} comisiones`)
    console.log('   - 8 endosos')

    await pool.end()
}

main().catch(console.error)
