import { generateMonthlyBilling } from "@/actions/admin-billing"
import { NextResponse } from "next/server"

/**
 * Cron job para generar cobros mensuales
 *
 * Configuración en vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/generate-invoices",
 *     "schedule": "0 8 25 * *"  // Día 25 de cada mes a las 8:00 UTC
 *   }]
 * }
 *
 * Los cobros se generan el día 25 con vencimiento el día 5 del mes siguiente.
 */
export async function GET(request: Request) {
    // Verificar autorización con CRON_SECRET
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        // Usar la función de generación de billing con skipAuth para cron
        const result = await generateMonthlyBilling({ skipAuth: true })

        if (result.error) {
            console.error("Error in billing cron:", result.error)
            return NextResponse.json({ success: false, error: result.error }, { status: 500 })
        }

        console.log("Billing cron completed:", result.success)
        console.log("Details:", JSON.stringify(result.results, null, 2))

        return NextResponse.json({
            success: true,
            message: result.success,
            generated: result.results?.generated || 0,
            skipped: result.results?.skipped || 0,
            errors: result.results?.errors || 0,
            details: result.results?.details || []
        })
    } catch (error) {
        console.error("Error in billing cron:", error)
        return NextResponse.json(
            { success: false, error: "Error interno del servidor" },
            { status: 500 }
        )
    }
}
