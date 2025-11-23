const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.log("Uso: node scripts/check-user.js <email> <password>");
        return;
    }

    console.log(`Verificando usuario: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.log("Usuario NO encontrado.");
        return;
    }

    console.log("Usuario encontrado:", user.id, user.role);
    console.log("Tenant ID:", user.tenantId);

    if (!user.password) {
        console.log("El usuario no tiene contraseña configurada (probablemente OAuth).");
        return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    console.log("Contraseña válida:", isValid);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
