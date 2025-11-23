"use client"

import { UseFormReturn, useFieldArray } from "react-hook-form"
import { Plus, Trash2, RefreshCw } from "lucide-react"
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { COMMON_COVERAGES, INSURANCE_LINES } from "@/lib/insurance-constants"
import { useEffect } from "react"
import { toast } from "sonner"

interface Step4Props {
    form: UseFormReturn<any>
}

export const Step4Coverages = ({ form }: Step4Props) => {
    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "coverages",
    })

    const insuranceLine = form.watch("insuranceLine")
    const currency = form.watch("currency")

    // Función para cargar coberturas sugeridas
    const loadSuggestedCoverages = () => {
        const lineConfig = INSURANCE_LINES[insuranceLine as keyof typeof INSURANCE_LINES]
        if (!lineConfig) return

        let suggestions: readonly any[] = []

        if (lineConfig.category === "AUTO") {
            suggestions = COMMON_COVERAGES.AUTO
        } else if ((lineConfig.category as string) === "LIFE" || (lineConfig.category as string) === "HEALTH") {
            suggestions = COMMON_COVERAGES.VIDA
        } else if (insuranceLine === "RESPONSABILIDAD_CIVIL") {
            suggestions = COMMON_COVERAGES.RESPONSABILIDAD_CIVIL
        } else if (insuranceLine === "TRANSPORTE") {
            suggestions = COMMON_COVERAGES.TRANSPORTE
        } else if (insuranceLine === "TODO_RIESGO_CONSTRUCCION") {
            suggestions = COMMON_COVERAGES.INGENIERIA
        } else if (lineConfig.category === "GUARANTEE") {
            suggestions = COMMON_COVERAGES.GARANTIA
        } else {
            suggestions = COMMON_COVERAGES.INCENDIO
        }

        if (suggestions) {
            const formattedCoverages = suggestions.map(cov => ({
                code: cov.code,
                name: cov.name,
                insuredAmount: "",
                premium: "",
                deductible: "",
                required: cov.required
            }))
            replace(formattedCoverages)
            toast.success("Coberturas sugeridas cargadas correctamente")
        }
    }

    // Cargar sugerencias si la lista está vacía al montar
    useEffect(() => {
        if (fields.length === 0 && insuranceLine) {
            loadSuggestedCoverages()
        }
    }, [])

    // Calcular totales automáticamente
    const coverages = form.watch("coverages")
    useEffect(() => {
        if (coverages && Array.isArray(coverages)) {
            const total = coverages.reduce((sum: number, cov: any) => {
                // Reemplazar comas por puntos si es necesario y parsear
                const premiumStr = String(cov.premium || "0").replace(",", ".")
                const premium = parseFloat(premiumStr)
                return sum + (isNaN(premium) ? 0 : premium)
            }, 0)

            // Solo actualizar si el valor ha cambiado para evitar loops infinitos
            const currentTotal = form.getValues("totalPremium")
            if (currentTotal !== total.toFixed(2)) {
                form.setValue("totalPremium", total.toFixed(2), {
                    shouldValidate: true,
                    shouldDirty: true
                })
            }
        }
    }, [JSON.stringify(coverages), form]) // Usar stringify para detectar cambios profundos

    return (
        <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-lg border space-y-4">
                <div className="flex items-end gap-4">
                    <div className="flex-1 space-y-2">
                        <Label>Monto Asegurado (Default)</Label>
                        <Input
                            placeholder="Ej: 1000"
                            id="default-amount"
                        />
                    </div>
                    <div className="flex-1 space-y-2">
                        <Label>Deducible (Default)</Label>
                        <Input
                            placeholder="Ej: 10"
                            id="default-deductible"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            const amount = (document.getElementById("default-amount") as HTMLInputElement).value
                            const deductible = (document.getElementById("default-deductible") as HTMLInputElement).value

                            if (!amount && !deductible) return

                            const currentCoverages = form.getValues("coverages")
                            const updatedCoverages = currentCoverages.map((cov: any) => ({
                                ...cov,
                                insuredAmount: amount || cov.insuredAmount,
                                deductible: deductible || cov.deductible
                            }))

                            replace(updatedCoverages)
                            toast.success("Valores actualizados en todas las coberturas")
                        }}
                    >
                        Aplicar a Todas
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Coberturas y Primas</h3>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={loadSuggestedCoverages}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Cargar Sugeridas
                    </Button>
                    <Button
                        type="button"
                        variant="default"
                        onClick={() => {
                            const defaultAmount = (document.getElementById("default-amount") as HTMLInputElement)?.value || ""
                            const defaultDeductible = (document.getElementById("default-deductible") as HTMLInputElement)?.value || ""

                            append({
                                code: `COV-${Date.now()}`,
                                name: "",
                                insuredAmount: defaultAmount,
                                premium: "",
                                deductible: defaultDeductible,
                                required: false
                            })
                            toast.success("Nueva cobertura agregada")
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Cobertura
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg bg-slate-50 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">
                                Cobertura {index + 1}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-4">
                                <FormField
                                    control={form.control}
                                    name={`coverages.${index}.name`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Nombre Cobertura</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: Incendio Edificio" {...field} value={field.value ?? ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <FormField
                                    control={form.control}
                                    name={`coverages.${index}.insuredAmount`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Monto Asegurado ({currency})</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0.00" {...field} value={field.value ?? ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <FormField
                                    control={form.control}
                                    name={`coverages.${index}.deductible`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Deducible ({currency})</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: 5 UF" {...field} value={field.value ?? ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name={`coverages.${index}.premium`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Prima Neta ({currency})</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value ?? ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            {/* Hidden code field */}
                            <input type="hidden" {...form.register(`coverages.${index}.code`)} />
                        </div>
                    </div>
                ))}

                {fields.length === 0 && (
                    <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
                        No hay coberturas agregadas. Haz clic en "Cargar Sugeridas" o agrega una manualmente.
                    </div>
                )}
            </div>

            <Separator className="my-6" />

            <div className="bg-slate-100 p-6 rounded-lg space-y-6">
                <h3 className="text-lg font-medium">Resumen Económico</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Moneda</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione moneda" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="UF">UF - Unidad de Fomento</SelectItem>
                                        <SelectItem value="CLP">CLP - Pesos Chilenos</SelectItem>
                                        <SelectItem value="USD">USD - Dólares</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="totalInsuredAmount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monto Total Asegurado</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="0.00" {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="totalPremium"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-blue-700">Prima Total Neta</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        className="font-bold text-lg"
                                        readOnly
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Calculado automáticamente (sin IVA)
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </div >
    )
}
