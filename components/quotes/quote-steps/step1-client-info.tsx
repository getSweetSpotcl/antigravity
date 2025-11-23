"use client"

import { UseFormReturn } from "react-hook-form"
import { Client } from "@prisma/client"
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { RutInput } from "@/components/ui/rut-input"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface Step1Props {
    form: UseFormReturn<any>
    clients: Client[]
}

export const Step1ClientInfo = ({ form, clients }: Step1Props) => {
    const [isProspect, setIsProspect] = useState(false)
    const sameAsContractor = form.watch("sameAsContractor")

    // Effect to clear/set fields when toggling client/prospect
    useEffect(() => {
        if (!isProspect) {
            form.setValue("prospectName", "")
        } else {
            form.setValue("clientId", "")
        }
    }, [isProspect, form])

    // Effect to auto-fill contractor info when selecting a client
    const handleClientSelect = (clientId: string) => {
        form.setValue("clientId", clientId)
        const client = clients.find(c => c.id === clientId)
        if (client) {
            form.setValue("contractorName", `${client.firstName} ${client.lastName}`)
            form.setValue("contractorRut", client.rut)
            form.setValue("contractorEmail", client.email)
            form.setValue("contractorPhone", client.phone)
        }
    }

    return (
        <div className="space-y-6">
            {/* Selección de Tipo de Cliente */}
            <div className="flex items-center gap-4 p-1 bg-slate-100 rounded-lg">
                <Button
                    type="button"
                    variant={!isProspect ? "default" : "ghost"}
                    onClick={() => setIsProspect(false)}
                    className="flex-1 rounded-md"
                >
                    Cliente Existente
                </Button>
                <Button
                    type="button"
                    variant={isProspect ? "default" : "ghost"}
                    onClick={() => setIsProspect(true)}
                    className="flex-1 rounded-md"
                >
                    Nuevo Prospecto
                </Button>
            </div>

            {/* Selección de Cliente o Nombre de Prospecto */}
            {!isProspect ? (
                <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cliente</FormLabel>
                            <Select onValueChange={handleClientSelect} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione un cliente..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {clients.map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.firstName} {client.lastName} - {client.rut}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            ) : (
                <FormField
                    control={form.control}
                    name="prospectName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre del Prospecto</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Empresa Fantasma SpA" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}

            <Separator className="my-4" />

            {/* Datos del Tomador (Contratante) */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Datos del Tomador (Contratante)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="contractorName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre o Razón Social</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nombre completo" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="contractorRut"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>RUT</FormLabel>
                                <FormControl>
                                    <RutInput
                                        {...field}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="contractorEmail"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="contacto@ejemplo.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="contractorPhone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Teléfono</FormLabel>
                                <FormControl>
                                    <Input placeholder="+56 9 1234 5678" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <Separator className="my-4" />

            {/* Datos del Asegurado */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Datos del Asegurado</h3>
                    <FormField
                        control={form.control}
                        name="sameAsContractor"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-2">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        Mismo que el Tomador
                                    </FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />
                </div>

                {!sameAsContractor && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <FormField
                            control={form.control}
                            name="insuredName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre Asegurado</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nombre completo" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="insuredRut"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>RUT Asegurado</FormLabel>
                                    <FormControl>
                                        <RutInput {...field} onChange={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="insuredAddress"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel>Dirección del Asegurado</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Dirección completa" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}
            </div>

            <Separator className="my-4" />

            {/* Datos del Beneficiario (Opcional) */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Beneficiario (Opcional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="beneficiaryType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione tipo" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="ASEGURADO">El mismo Asegurado</SelectItem>
                                        <SelectItem value="BANCO">Banco / Acreedor</SelectItem>
                                        <SelectItem value="TERCERO">Tercero</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="beneficiaryName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nombre del beneficiario" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="beneficiaryRut"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>RUT</FormLabel>
                                <FormControl>
                                    <RutInput {...field} onChange={field.onChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </div>
    )
}
