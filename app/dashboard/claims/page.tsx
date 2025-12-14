import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getClaims, getPoliciesForClaim } from "@/actions/claim"
import { ClaimList } from "@/components/claims/claim-list"
import { CreateClaimDialog } from "@/components/claims/create-claim-dialog"
import { serializeList } from "@/lib/serialize"

export default async function ClaimsPage() {
    const session = await auth()

    if (!session?.user?.tenantId) {
        redirect("/auth/login")
    }

    const [claimsRaw, policiesRaw] = await Promise.all([
        getClaims(),
        getPoliciesForClaim(),
    ])

    const claims = serializeList(claimsRaw)
    const policies = serializeList(policiesRaw)

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Siniestros</h2>
                    <p className="text-muted-foreground">
                        Gestiona los siniestros reportados y su tramitación.
                    </p>
                </div>
                <CreateClaimDialog policies={policies} />
            </div>

            <ClaimList claims={claims} />
        </div>
    )
}
