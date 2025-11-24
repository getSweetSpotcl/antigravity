"use server"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET(request: Request) {
    try {
        // Security check - only allow this in production with a secret
        const { searchParams } = new URL(request.url)
        const secret = searchParams.get("secret")

        if (secret !== process.env.SETUP_SECRET) {
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

        // Create superadmin user
        const hashedPassword = await bcrypt.hash("Admin123!", 10)

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
            message: "Superadmin created successfully",
            credentials: {
                email: "superadmin@platform.com",
                password: "Admin123!",
                note: "Please change this password after first login"
            },
            user: {
                id: superadmin.id,
                email: superadmin.email,
                role: superadmin.role
            }
        })
    } catch (error) {
        console.error("Setup error:", error)
        return NextResponse.json({
            error: "Failed to create superadmin",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}
