"use client"

import { UseFormReturn } from "react-hook-form"
import { InsuranceCompany } from "@prisma/client"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { INSURANCE_LINES, POLICY_TYPES_ES } from "@/lib/insurance-constants"

interface Step5Props {
    form: UseFormReturn<any>
    companies: InsuranceCompany[]
}

export const Step5Review = ({ form, companies }: Step5Props) => {
    const values = form.getValues()
    const company = companies.find(c => c.id === values.companyId)
    const insuranceLineLabel = INSURANCE_LINES[values.insuranceLine as keyof typeof INSURANCE_LINES]?.label
    const policyTypeLabel = POLICY_TYPES_ES[values.policyType as keyof typeof POLICY_TYPES_ES]

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-800">
                <h3 className="font-semibold mb-2">Resumen de la Cotización</h3>
                <p className="text-sm">
                    Por favor revisa todos los datos antes de crear la cotización. Una vez creada, podrás descargar el PDF o enviarla por correo.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cliente y Partes */}
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Cliente y Partes</h4>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-muted-foreground">Tomador:</span>
                            <span className="font-medium">{values.contractorName}</span>

                            <span className="text-muted-foreground">RUT:</span>
                            <span>{values.contractorRut}</span>

                            <span className="text-muted-foreground">Asegurado:</span>
                            <span className="font-medium">{values.insuredName || values.contractorName}</span>

                            <span className="text-muted-foreground">Beneficiario:</span>
                            <span>{values.beneficiaryName || "No especificado"}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Seguro y Vigencia */}
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Seguro</h4>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-muted-foreground">Compañía:</span>
                            <span className="font-medium">{company?.name}</span>

                            <span className="text-muted-foreground">Rubro:</span>
                            <span>{insuranceLineLabel}</span>

                            <span className="text-muted-foreground">Tipo:</span>
                            <span>{policyTypeLabel}</span>

                            <span className="text-muted-foreground">Vigencia Desde:</span>
                            <span>{values.validFrom ? format(values.validFrom, "PPP", { locale: es }) : "A definir"}</span>

                            <span className="text-muted-foreground">Duración:</span>
                            <span>{values.policyDuration} meses</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Coberturas y Primas */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Coberturas y Primas</h4>

                    <div className="space-y-2">
                        {values.coverages?.map((cov: any, index: number) => (
                            <div key={index} className="flex justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                                <span>{cov.name}</span>
                                <div className="flex gap-4">
                                    <span className="text-muted-foreground">Monto: {cov.insuredAmount} {values.currency}</span>
                                    <span className="font-medium">{cov.premium} {values.currency}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center pt-2">
                        <span className="font-semibold">Prima Total Neta</span>
                        <span className="text-xl font-bold text-blue-600">
                            {values.totalPremium} {values.currency}
                        </span>
                    </div>
                </CardContent>
            </Card>

            <Separator className="my-4" />

            {/* Notas Adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notas para el Cliente (Opcional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Observaciones que aparecerán en la cotización..."
                                    className="h-32"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="internalNotes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notas Internas (Solo Corredora)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Apuntes privados para gestión interna..."
                                    className="h-32 bg-yellow-50"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    )
}
