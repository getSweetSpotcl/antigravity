import { getTenantById } from "@/actions/admin"
import { getPlans } from "@/actions/admin-plans"
import { getBillingRecords } from "@/actions/admin-billing"
import { TenantEditForm } from "@/components/admin/tenant-edit-form"
import { BillingTable } from "@/components/admin/billing-table"
import { TenantGeneralInfo } from "@/components/admin/tenant-general-info"
import { TenantUsers } from "@/components/admin/tenant-users"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const tenant = await getTenantById(id) as any
    const plans = await getPlans()
    const billingRecords = await getBillingRecords(id)

    if (!tenant) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/tenants">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{tenant.name}</h1>
                    <p className="text-muted-foreground text-sm">ID: {tenant.id}</p>
                </div>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="subscription">Suscripción</TabsTrigger>
                    <TabsTrigger value="billing">Facturación</TabsTrigger>
                    <TabsTrigger value="users">Usuarios</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <TenantGeneralInfo tenant={tenant} />
                </TabsContent>

                <TabsContent value="subscription">
                    <TenantEditForm tenant={tenant} plans={plans} />
                </TabsContent>

                <TabsContent value="billing">
                    <BillingTable tenantId={id} records={billingRecords} />
                </TabsContent>

                <TabsContent value="users">
                    <TenantUsers users={tenant.users || []} tenantId={id} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
