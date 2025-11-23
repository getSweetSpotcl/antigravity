import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getUsers } from "@/actions/user"
import { getMyBillingInfo } from "@/actions/billing"
import { getMyOrganization } from "@/actions/organization"
import { UserList } from "@/components/settings/user-list"
import { InviteUserForm } from "@/components/settings/invite-user-form"
import { BillingInfo } from "@/components/settings/billing-info"
import { OrganizationInfo } from "@/components/settings/organization-info"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const SettingsPage = async () => {
    const session = await auth()

    if (!session) {
        redirect("/auth/login")
    }

    const users = await getUsers()
    const billingData = await getMyBillingInfo()
    const organization = await getMyOrganization()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Configuración</h1>
                <p className="text-muted-foreground">Administra tu corredora, usuarios y suscripción.</p>
            </div>

            <Separator />

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="users">Usuarios</TabsTrigger>
                    <TabsTrigger value="billing">Suscripción y Facturación</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <OrganizationInfo organization={organization} />
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Usuarios</h2>
                            <UserList users={users} />
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold mb-4">Invitar Agente</h2>
                            <InviteUserForm />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="billing">
                    <BillingInfo data={billingData} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default SettingsPage;


