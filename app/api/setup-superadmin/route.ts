import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { checkRateLimit, getClientIP, rateLimitPresets, createRateLimitedResponse } from "@/lib/rate-limit"

export async function GET(request: Request) {
    // Rate limiting - very strict for setup endpoints
    const ip = getClientIP(request)
    const rateLimit = checkRateLimit(ip, {
        ...rateLimitPresets.auth,
        limit: 5, // Very strict: 5 requests per minute
        identifier: "setup-superadmin",
    })

    if (!rateLimit.success) {
        return createRateLimitedResponse()
    }

    try {
        // Security check - require secret from environment
        const { searchParams } = new URL(request.url)
        const secret = searchParams.get("secret")

        if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if superadmin already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: "superadmin@platform.com" }
        })

        if (existingUser) {
            return NextResponse.json({
                message: "Superadmin already exists",
                email: existingUser.email
            })
        }

        // Create platform tenant
        const tenant = await prisma.tenant.create({
            data: {
                name: "Platform Admin",
                rut: "00.000.000-0",
                slug: "platform",
            }
        })

        // Create superadmin user with secure password from env or generate one
        const initialPassword = process.env.INITIAL_ADMIN_PASSWORD || "Admin123!"
        const hashedPassword = await bcrypt.hash(initialPassword, 10)

        const superadmin = await prisma.user.create({
            data: {
                email: "superadmin@platform.com",
                name: "Super Admin",
                password: hashedPassword,
                role: "SUPER_ADMIN",
                tenantId: tenant.id,
            }
        })

        return NextResponse.json({
            success: true,
            message: "Superadmin created successfully. Check server logs or env for initial password.",
            user: {
                id: superadmin.id,
                email: superadmin.email,
                role: superadmin.role
            }
        })
    } catch (error) {
        return NextResponse.json({
            error: "Failed to create superadmin",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}
