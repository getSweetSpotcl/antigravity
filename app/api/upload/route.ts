import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { checkRateLimit, getClientIP, rateLimitPresets, createRateLimitedResponse } from "@/lib/rate-limit"

export async function POST(request: Request): Promise<NextResponse> {
    // Rate limiting for uploads
    const ip = getClientIP(request)
    const rateLimit = checkRateLimit(ip, {
        ...rateLimitPresets.upload,
        identifier: "upload",
    })

    if (!rateLimit.success) {
        return createRateLimitedResponse() as NextResponse
    }

    const body = (await request.json()) as HandleUploadBody

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname, clientPayload) => {
                const session = await auth()
                if (!session?.user) {
                    throw new Error("No autorizado")
                }

                // Validar extensión y tamaño si es necesario
                // Retornar token con metadatos permitidos
                return {
                    allowedContentTypes: ["image/jpeg", "image/png", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
                    tokenPayload: JSON.stringify({
                        userId: session.user.id,
                        tenantId: session.user.tenantId,
                    }),
                }
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                // La referencia se guarda en la DB a través del server action
            },
        })

        return NextResponse.json(jsonResponse)
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 } // Bad Request
        )
    }
}
