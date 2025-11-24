// @ts-expect-error
import { Policy, Client, InsuranceCompany, Endorsement } from "@prisma/client"
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

interface EndorsementListProps {
    endorsements: Endorsement[]
}

export function EndorsementList({ endorsements }: EndorsementListProps) {
    const getTypeLabel = (type: string) => {
        switch (type) {
            case "GENERAL_MODIFICATION": return "Modificación"
            case "RENEWAL": return "Renovación"
            case "CANCELLATION": return "Cancelación"
            case "INCLUSION": return "Inclusión"
            case "EXCLUSION": return "Exclusión"
            default: return type
        }
    }

    const getTypeBadge = (type: string) => {
        switch (type) {
            case "RENEWAL": return "default"
            case "CANCELLATION": return "destructive"
            default: return "secondary"
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Número</TableHead>
                        <TableHead>Descripción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {endorsements.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                No hay endosos registrados.
                            </TableCell>
                        </TableRow>
                    ) : (
                        endorsements.map((endorsement) => (
                            <TableRow key={endorsement.id}>
                                <TableCell>
                                    {format(endorsement.date, "PPP", { locale: es })}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getTypeBadge(endorsement.type) as any}>
                                        {getTypeLabel(endorsement.type)}
                                    </Badge>
                                </TableCell>
                                <TableCell>{endorsement.number || "-"}</TableCell>
                                <TableCell>{endorsement.description}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
