import { getAgentCommissions } from "@/actions/agent-commission"
import { AgentCommissionList } from "@/components/commissions/agent-commission-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Users } from "lucide-react"

export default async function AgentCommissionsPage() {
    const commissions = await getAgentCommissions()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/commissions">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Users className="h-6 w-6 text-sky-600" />
                            Comisiones de Vendedores
                        </h1>
                        <p className="text-slate-500">
                            Gestiona los pagos de comisiones a tus vendedores
                        </p>
                    </div>
                </div>
            </div>

            {commissions.length === 0 ? (
                <Card className="bg-white border-slate-200">
                    <CardHeader>
                        <CardTitle>Sin comisiones de vendedor</CardTitle>
                        <CardDescription>
                            Las comisiones de vendedor se generan automáticamente cuando:
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600">
                            <li>Se genera una comisión de corredora para una póliza</li>
                            <li>La póliza tiene un vendedor asignado</li>
                            <li>El vendedor tiene un porcentaje de comisión configurado</li>
                        </ul>
                        <div className="mt-4">
                            <Link href="/dashboard/settings">
                                <Button variant="outline">
                                    Configurar vendedores
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <AgentCommissionList commissions={commissions as any} />
            )}
        </div>
    )
}
