import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
    try {
        const tenants = await prisma.tenant.findMany()
        const users = await prisma.user.findMany()
        return NextResponse.json({ tenants, users })
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}
