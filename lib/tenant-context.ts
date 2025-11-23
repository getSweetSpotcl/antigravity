import { auth } from "@/lib/auth"
import { cookies } from "next/headers"

export const ADMIN_TENANT_COOKIE = "x-admin-tenant-context"

export async function getTenantContext(): Promise<string | null> {
    const session = await auth()

    if (!session || !session.user) {
        return null
    }

    // Si no es super admin, siempre usa su tenant asignado
    if (session.user.role !== "SUPER_ADMIN") {
        return session.user.tenantId || null
    }

    // Si es super admin, verificar si hay un contexto activo
    const cookieStore = await cookies()
    const adminContext = cookieStore.get(ADMIN_TENANT_COOKIE)

    if (adminContext?.value) {
        return adminContext.value
    }

    // Si no hay contexto, usar su tenant home
    return session.user.tenantId || null
}

export async function isSuperAdmin(): Promise<boolean> {
    const session = await auth()
    return session?.user?.role === "SUPER_ADMIN"
}
