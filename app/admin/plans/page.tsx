import { getPlans } from "@/actions/admin-plans"
import { PlanDialog } from "@/components/admin/plan-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Users, HardDrive, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function PlansPage() {
    const plans = await getPlans()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/tenants">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Planes de Suscripción</h1>
                </div>
                <PlanDialog />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan: any) => (
                    <Card key={plan.id} className={!plan.isActive ? "opacity-60" : ""}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                            <Badge variant={plan.isActive ? "default" : "secondary"}>
                                {plan.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold mb-4">
                                ${plan.price.toLocaleString("es-CL")} <span className="text-sm font-normal text-muted-foreground">/mes</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-6 h-10">
                                {plan.description || "Sin descripción"}
                            </p>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-center text-sm">
                                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>Hasta {plan.maxUsers} usuarios</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <HardDrive className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>{Number(plan.maxStorage) / (1024 * 1024 * 1024)} GB Almacenamiento</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                                <span className="text-xs text-muted-foreground">
                                    {plan._count?.Tenant ?? 0} organizaciones
                                </span>
                                <div className="flex gap-2">
                                    <PlanDialog
                                        plan={plan}
                                        trigger={
                                            <Button variant="ghost" size="icon">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
