const { PrismaClient } = require('@prisma/client')
console.log('PrismaClient:', PrismaClient)
try {
    const prisma = new PrismaClient()
    console.log('Prisma instance created')
} catch (e) {
    console.error('Error creating instance:', e)
}
