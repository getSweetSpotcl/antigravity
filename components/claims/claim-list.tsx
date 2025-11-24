// @ts-ignore
import { Claim, Policy, Client, InsuranceCompany, ClaimStatus } from "@prisma/client"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface ClaimWithPolicy extends Claim {
    policy: Policy & {
        client: Client
        insuranceCompany: InsuranceCompany | null
    }
}

interface ClaimListProps {
    claims: any[]
}

const getStatusLabel = (status: ClaimStatus) => {
    const labels: Record<ClaimStatus, string> = {
        REPORTED: "Reportado",
        IN_PROCESS: "En Proceso",
        APPROVED: "Aprobado",
        REJECTED: "Rechazado",
        CLOSED: "Cerrado",
    }
    return labels[status] || status
}

const getStatusVariant = (status: ClaimStatus): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<ClaimStatus, "default" | "secondary" | "destructive" | "outline"> = {
        REPORTED: "secondary",
        IN_PROCESS: "default",
        APPROVED: "outline",
        REJECTED: "destructive",
        CLOSED: "secondary",
    }
    return variants[status] || "secondary"
}

export function ClaimList({ claims }: ClaimListProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Póliza</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Compañía</TableHead>
                        <TableHead>Fecha Siniestro</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Descripción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {claims.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                No hay siniestros reportados.
                            </TableCell>
                        </TableRow>
                    ) : (
                        claims.map((claim) => (
                            <TableRow key={claim.id}>
                                <TableCell className="font-medium">
                                    <Link
                                        href={`/dashboard/claims/${claim.id}`}
                                        className="hover:underline text-blue-600"
                                    >
                                        {claim.number || "-"}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Link
                                        href={`/dashboard/policies/${claim.policyId}`}
                                        className="hover:underline text-blue-600"
                                    >
                                        {claim.policy.number}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    {claim.policy.client.firstName} {claim.policy.client.lastName}
                                </TableCell>
                                <TableCell>
                                    {claim.policy.insuranceCompany?.name || claim.policy.company}
                                </TableCell>
                                <TableCell>{format(claim.date, "PPP", { locale: es })}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(claim.status)}>
                                        {getStatusLabel(claim.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="max-w-xs truncate">{claim.description}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
