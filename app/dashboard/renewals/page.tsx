import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getPoliciesNearingExpiration } from "@/actions/renewal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { RenewPolicyDialog } from "@/components/policies/renewals/renew-policy-dialog"
import { AlertCircle } from "lucide-react"

export default async function Page() {
    const session = await auth()

    if (!session?.user?.tenantId) {
        redirect("/auth/login")
    }

    const policiesNearingExpiration = await getPoliciesNearingExpiration(60) // 60 días

    const criticalPolicies = policiesNearingExpiration.filter(
        (p) => differenceInDays(p.endDate, new Date()) <= 15
    )
    const upcomingPolicies = policiesNearingExpiration.filter(
        (p) => differenceInDays(p.endDate, new Date()) > 15
    )

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Renovaciones</h2>
                <p className="text-muted-foreground">
                    Gestiona las pólizas próximas a vencer y sus renovaciones.
                </p>
            </div>

            {criticalPolicies.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-800">
                            <AlertCircle className="h-5 w-5" />
                            Pólizas Críticas (Vencen en 15 días o menos)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Póliza</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Compañía</TableHead>
                                    <TableHead>Vencimiento</TableHead>
                                    <TableHead>Días Restantes</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {criticalPolicies.map((policy) => {
                                    const daysLeft = differenceInDays(policy.endDate, new Date())
                                    return (
                                        <TableRow key={policy.id}>
                                            <TableCell className="font-medium">{policy.number}</TableCell>
                                            <TableCell>
                                                {policy.client.firstName} {policy.client.lastName}
                                            </TableCell>
                                            <TableCell>
                                                {policy.insuranceCompany?.name || policy.company}
                                            </TableCell>
                                            <TableCell>
                                                {format(policy.endDate, "PPP", { locale: es })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="destructive">{daysLeft} días</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <RenewPolicyDialog policy={policy} />
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Próximas Renovaciones (16-60 días)</CardTitle>
                </CardHeader>
                <CardContent>
                    {upcomingPolicies.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No hay pólizas próximas a vencer en este período.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Póliza</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Compañía</TableHead>
                                    <TableHead>Vencimiento</TableHead>
                                    <TableHead>Días Restantes</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {upcomingPolicies.map((policy) => {
                                    const daysLeft = differenceInDays(policy.endDate, new Date())
                                    return (
                                        <TableRow key={policy.id}>
                                            <TableCell className="font-medium">{policy.number}</TableCell>
                                            <TableCell>
                                                {policy.client.firstName} {policy.client.lastName}
                                            </TableCell>
                                            <TableCell>
                                                {policy.insuranceCompany?.name || policy.company}
                                            </TableCell>
                                            <TableCell>
                                                {format(policy.endDate, "PPP", { locale: es })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{daysLeft} días</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <RenewPolicyDialog policy={policy} />
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
