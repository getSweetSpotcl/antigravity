import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, password } = body

        if (!email) {
            return NextResponse.json({ error: "Email requerido" }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
        }

        let passwordMatch = false
        if (password && user.password) {
            passwordMatch = await bcrypt.compare(password, user.password)
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
                hasPassword: !!user.password,
                passwordMatch
            }
        })
    } catch (error) {
        console.error("Debug API Error:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                tenantId: true,
                createdAt: true
            }
        })
        return NextResponse.json(users)
    } catch (error) {
        return NextResponse.json({ error: "Error" }, { status: 500 })
    }
}
