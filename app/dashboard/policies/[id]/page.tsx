import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { EndorsementList } from "@/components/policies/endorsements/endorsement-list"
import { CreateEndorsementDialog } from "@/components/policies/endorsements/create-endorsement-dialog"

export default async function PolicyDetailPage({ params }: { params: { id: string } }) {
    const session = await auth()

    if (!session?.user?.tenantId) {
        redirect("/auth/login")
    }

    const policy = await prisma.policy.findUnique({
        where: {
            id: params.id,
        },
        include: {
            client: true,
            insuranceCompany: true,
            endorsements: {
                orderBy: {
                    date: "desc",
                },
            },
        },
    })

    if (!policy || policy.tenantId !== session.user.tenantId) {
        redirect("/dashboard/policies")
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center space-x-4">
                <Link href="/dashboard/policies">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">Póliza {policy.number}</h2>
                <Badge variant={policy.status === "ACTIVE" ? "default" : "secondary"}>
                    {policy.status}
                </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Cliente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {policy.client.firstName} {policy.client.lastName}
                        </div>
                        <p className="text-xs text-muted-foreground">{policy.client.rut}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Compañía</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {policy.insuranceCompany?.name || policy.company}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Vigencia</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm">
                            Desde: {format(policy.startDate, "PPP", { locale: es })}
                        </div>
                        <div className="text-sm">
                            Hasta: {format(policy.endDate, "PPP", { locale: es })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Endosos y Movimientos</h3>
                    <CreateEndorsementDialog policyId={policy.id} />
                </div>
                <EndorsementList endorsements={policy.endorsements} />
            </div>
        </div>
    )
}
