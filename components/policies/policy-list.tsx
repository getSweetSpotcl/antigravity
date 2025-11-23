import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Policy, Client } from "@prisma/client"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface PolicyWithClient extends Policy {
    client: Client
}

interface PolicyListProps {
    policies: PolicyWithClient[]
}

export const PolicyList = ({ policies }: PolicyListProps) => {
    if (policies.length === 0) {
        return (
            <div className="text-center p-10 text-muted-foreground">
                No hay pólizas registradas.
            </div>
        )
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Número</TableHead>
                            <TableHead>Compañía</TableHead>
                            <TableHead>Ramo</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Vigencia</TableHead>
                            <TableHead>Prima</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {policies.map((policy) => (
                            <TableRow key={policy.id}>
                                <TableCell className="font-medium">
                                    <Link href={`/dashboard/policies/${policy.id}`} className="hover:underline text-blue-600">
                                        {policy.number}
                                    </Link>
                                </TableCell>
                                <TableCell>{policy.company}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{policy.type}</Badge>
                                </TableCell>
                                <TableCell>{policy.client.firstName} {policy.client.lastName}</TableCell>
                                <TableCell>
                                    {format(new Date(policy.startDate), "dd/MM/yyyy")} - {format(new Date(policy.endDate), "dd/MM/yyyy")}
                                </TableCell>
                                <TableCell>
                                    {Number(policy.premium).toFixed(2)} {policy.currency}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
