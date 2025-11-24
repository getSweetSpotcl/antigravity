import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
// @ts-ignore
import { Client } from "@prisma/client"
import { Card, CardContent } from "@/components/ui/card"
import { ClientActions } from "./client-actions"

interface ClientListProps {
    clients: Client[]
}

export const ClientList = ({ clients }: ClientListProps) => {
    if (clients.length === 0) {
        return (
            <div className="text-center p-10 text-muted-foreground">
                No hay clientes registrados.
            </div>
        )
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>RUT</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.map((client) => (
                            <TableRow key={client.id}>
                                <TableCell className="font-medium">{client.rut}</TableCell>
                                <TableCell>{client.firstName} {client.lastName}</TableCell>
                                <TableCell>{client.email}</TableCell>
                                <TableCell>{client.phone}</TableCell>
                                <TableCell>
                                    <ClientActions client={client} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
