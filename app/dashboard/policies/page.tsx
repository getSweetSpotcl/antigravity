import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getPolicies } from "@/actions/policy"
import { getClients } from "@/actions/client"
import { PolicyList } from "@/components/policies/policy-list"
import { CreatePolicyDialog } from "@/components/policies/create-policy-dialog"
import { serializeList } from "@/lib/serialize"

const PoliciesPage = async () => {
    const session = await auth()

    if (!session) {
        redirect("/auth/login")
    }

    const policiesRaw = await getPolicies()
    const clients = await getClients()

    const serializedPolicies = serializeList(policiesRaw)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pólizas</h1>
                    <p className="text-muted-foreground">Administra las pólizas vigentes, renovaciones y endosos.</p>
                </div>
                <CreatePolicyDialog clients={clients} />
            </div>

            <PolicyList policies={serializedPolicies} />
        </div>
    );
}

export default PoliciesPage;
