"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateMyOrganization } from "@/actions/organization"
import { toast } from "sonner"
import { Pencil, Save, X } from "lucide-react"

interface OrganizationInfoProps {
    organization: {
        id: string
        name: string
        rut: string
        slug: string
        billingEmail: string | null
        billingAddress: string | null
        logoUrl: string | null
        createdAt: Date
    }
}

export function OrganizationInfo({ organization }: OrganizationInfoProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: organization.name,
        rut: organization.rut,
        billingEmail: organization.billingEmail || "",
        billingAddress: organization.billingAddress || ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await updateMyOrganization(formData)

            if (result.success) {
                toast.success(result.success)
                setIsEditing(false)
            } else if (result.error) {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error("Error al actualizar la organización")
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        setFormData({
            name: organization.name,
            rut: organization.rut,
            billingEmail: organization.billingEmail || "",
            billingAddress: organization.billingAddress || ""
        })
        setIsEditing(false)
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Información General</CardTitle>
                    <CardDescription>Datos básicos de tu organización</CardDescription>
                </div>
                {!isEditing && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre de la Organización</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rut">RUT</Label>
                            <Input
                                id="rut"
                                value={formData.rut}
                                onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="billingEmail">Email de Facturación</Label>
                            <Input
                                id="billingEmail"
                                type="email"
                                value={formData.billingEmail}
                                onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="billingAddress">Dirección de Facturación</Label>
                            <Input
                                id="billingAddress"
                                value={formData.billingAddress}
                                onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={loading}>
                                <Save className="h-4 w-4 mr-2" />
                                {loading ? "Guardando..." : "Guardar Cambios"}
                            </Button>
                            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Nombre</p>
                            <p className="font-medium">{organization.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">RUT</p>
                            <p className="font-medium">{organization.rut}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Email de Facturación</p>
                            <p className="font-medium">{organization.billingEmail || "No registrado"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Dirección de Facturación</p>
                            <p className="font-medium">{organization.billingAddress || "No registrada"}</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
