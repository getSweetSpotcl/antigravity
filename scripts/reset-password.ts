import 'dotenv/config'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
    const email = 'admin@demo.cl'
    const newPassword = 'Admin123!'
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // First, check if user exists
    const checkResult = await pool.query(
        'SELECT id, email, name, role FROM "User" WHERE email = $1',
        [email]
    )

    if (checkResult.rows.length === 0) {
        console.log('❌ Usuario no encontrado:', email)
        console.log('\n📋 Usuarios existentes:')
        const allUsers = await pool.query('SELECT email, name, role FROM "User"')
        allUsers.rows.forEach(u => {
            console.log(`  - ${u.email} (${u.role})`)
        })

        if (allUsers.rows.length === 0) {
            console.log('  No hay usuarios en la base de datos')
        }
    } else {
        // Update password
        await pool.query(
            'UPDATE "User" SET password = $1 WHERE email = $2',
            [hashedPassword, email]
        )
        console.log('✅ Contraseña actualizada para:', email)
        console.log('🔑 Nueva contraseña:', newPassword)
    }

    await pool.end()
}

main().catch(console.error)
