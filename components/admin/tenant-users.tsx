"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface TenantUsersProps {
    users: any[]
    tenantId: string
}

export function TenantUsers({ users, tenantId }: TenantUsersProps) {
    const getRoleBadge = (role: string) => {
        switch (role) {
            case "SUPER_ADMIN":
                return <Badge variant="destructive">Super Admin</Badge>
            case "ADMIN":
                return <Badge variant="default">Admin</Badge>
            case "AGENT":
                return <Badge variant="secondary">Agente</Badge>
            default:
                return <Badge variant="outline">{role}</Badge>
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Usuarios</CardTitle>
                <CardDescription>
                    Lista de usuarios pertenecientes a esta organización
                </CardDescription>
            </CardHeader>
            <CardContent>
                {users.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No hay usuarios registrados
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={user.role === "SUPER_ADMIN"}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
