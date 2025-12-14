import { getPortalSession, getClientIdsByRut } from "@/actions/portal-auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { PortalClaimForm } from "@/components/portal/portal-claim-form"

export default async function PortalNewClaimPage() {
    const session = await getPortalSession()

    if (!session) {
        redirect("/portal/login")
    }

    // Multi-corredor: obtener todos los clientIds del usuario
    const clientIds = await getClientIdsByRut(session.user.rut)

    // Obtener pólizas activas del cliente de todos sus corredores
    const policies = await prisma.policy.findMany({
        where: {
            clientId: { in: clientIds },
            status: "ACTIVE",
        },
        select: {
            id: true,
            number: true,
            type: true,
            InsuranceCompany: {
                select: { name: true },
            },
            company: true,
            Client: {
                include: {
                    Tenant: {
                        select: { name: true, slug: true, id: true },
                    },
                },
            },
        },
        orderBy: { number: "asc" },
    })

    if (policies.length === 0) {
        return (
            <div className="container py-8 px-4">
                <Link href="/portal/claims">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Button>
                </Link>

                <Card className="max-w-2xl mx-auto">
                    <CardContent className="py-12 text-center">
                        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No tiene pólizas activas</h3>
                        <p className="text-muted-foreground mt-2">
                            Para reportar un siniestro, primero debe tener una póliza vigente.
                            Contacte a su corredor para más información.
                        </p>
                        <Link href="/portal/messages" className="mt-4 inline-block">
                            <Button variant="outline">
                                Contactar Corredor
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container py-8 px-4">
            <Link href="/portal/claims">
                <Button variant="ghost" size="sm" className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Siniestros
                </Button>
            </Link>

            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Reportar Siniestro
                        </CardTitle>
                        <CardDescription>
                            Complete el formulario para reportar un siniestro. Su corredor se pondrá
                            en contacto para el seguimiento.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PortalClaimForm policies={policies} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
