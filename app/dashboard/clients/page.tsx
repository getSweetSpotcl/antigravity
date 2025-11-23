import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getClients } from "@/actions/client"
import { ClientList } from "@/components/clients/client-list"
import { CreateClientDialog } from "@/components/clients/create-client-dialog"

const ClientsPage = async () => {
    const session = await auth()

    if (!session) {
        redirect("/auth/login")
    }

    const clients = await getClients()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground">Gestiona tu cartera de clientes y prospectos.</p>
                </div>
                <CreateClientDialog />
            </div>

            <ClientList clients={clients} />
        </div>
    );
}

export default ClientsPage;
