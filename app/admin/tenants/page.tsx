import { getAllTenants } from "@/actions/admin"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TenantSwitcherButton } from "@/components/admin/tenant-switcher-button"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

export default async function AdminTenantsPage() {
    const tenants = await getAllTenants()

    const calculateMonthlyPayment = (tenant: any) => {
        let price = tenant.customPrice ?? tenant.assignedPlan?.price ?? 0

        if (tenant.discountType === "PERCENTAGE" && tenant.discountValue) {
            price = price - (price * (tenant.discountValue / 100))
        } else if (tenant.discountType === "FIXED" && tenant.discountValue) {
            price = price - tenant.discountValue
        }

        return Math.max(0, Math.round(price))
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Tenants</h1>
                <Link href="/admin/plans">
                    <Button variant="outline">
                        <Settings className="mr-2 h-4 w-4" />
                        Planes de Suscripción
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Organizaciones Registradas</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>RUT</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Mensualidad</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Usuarios</TableHead>
                                <TableHead>Pólizas</TableHead>
                                <TableHead>Registro</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tenants.map((tenant: any) => (
                                <TableRow key={tenant.id}>
                                    <TableCell className="font-medium">{tenant.name}</TableCell>
                                    <TableCell>{tenant.rut}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{tenant.assignedPlan?.name || tenant.plan || "Custom"}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        ${calculateMonthlyPayment(tenant).toLocaleString("es-CL")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={tenant.subscriptionStatus === "ACTIVE" ? "default" : "destructive"}
                                        >
                                            {tenant.subscriptionStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{tenant._count.users} / {tenant.maxUsers}</TableCell>
                                    <TableCell>{tenant._count.policies}</TableCell>
                                    <TableCell>
                                        {format(new Date(tenant.createdAt), "dd MMM yyyy", { locale: es })}
                                    </TableCell>
                                    <TableCell className="text-right flex justify-end gap-2">
                                        <Link href={`/admin/tenants/${tenant.id}`}>
                                            <Button variant="ghost" size="sm">
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <TenantSwitcherButton
                                            tenantId={tenant.id}
                                            tenantName={tenant.name}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
