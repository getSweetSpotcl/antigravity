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
import { Textarea } from "@/components/ui/textarea"
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
                required: cov.required,
                cadNumber: ""
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

            {/* Campos globales de póliza chilena */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                    <FormField
                        control={form.control}
                        name="polNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>N° POL (Condiciones Generales)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej: POL-001" {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    Número de póliza de condiciones generales (1 por cotización)
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="md:col-span-2">
                    <FormField
                        control={form.control}
                        name="particularConditions"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Condiciones Particulares</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Condiciones específicas de esta póliza"
                                        {...field}
                                        value={field.value ?? ""}
                                        className="min-h-[100px] resize-y"
                                    />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    Condiciones particulares aplicables a toda la póliza
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
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
                                required: false,
                                cadNumber: ""
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
                                                <Input type="number" placeholder="0.00" {...field} value={field.value ?? ""} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" onWheel={(e) => e.currentTarget.blur()} />
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
                                                <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value ?? ""} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" onWheel={(e) => e.currentTarget.blur()} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            {/* Hidden code field */}
                            <input type="hidden" {...form.register(`coverages.${index}.code`)} />
                        </div>

                        {/* Campo CAD específico por cobertura */}
                        <div className="mt-3 pt-3 border-t">
                            <FormField
                                control={form.control}
                                name={`coverages.${index}.cadNumber`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">N° CAD (Cláusula Adicional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: CAD-123" {...field} value={field.value ?? ""} className="max-w-xs" />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            Número de cláusula adicional asociada a esta cobertura
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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

                {/* Moneda y Totales alineados */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                            <FormItem className="md:col-span-3">
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
                            <FormItem className="md:col-span-5">
                                <FormLabel>Monto Total Asegurado</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="0.00" {...field} value={field.value ?? ""} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" onWheel={(e) => e.currentTarget.blur()} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="totalPremium"
                        render={({ field }) => (
                            <FormItem className="md:col-span-4">
                                <FormLabel>Prima Total Neta</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        readOnly
                                        {...field}
                                        value={field.value ?? ""}
                                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        onWheel={(e) => e.currentTarget.blur()}
                                    />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    Calculado automáticamente
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Comisión Corredor */}
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <h4 className="font-medium mb-4 text-emerald-800">Comisión del Corredor</h4>
                    <div className="flex items-end gap-4">
                        <FormField
                            control={form.control}
                            name="commissionPercentage"
                            render={({ field }) => (
                                <FormItem className="w-32">
                                    <FormLabel>Porcentaje</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                placeholder="0"
                                                {...field}
                                                value={field.value ?? "0"}
                                                className="pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                onWheel={(e) => e.currentTarget.blur()}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex-1 grid grid-cols-3 gap-4">
                            <div className="bg-white p-3 rounded border border-emerald-200">
                                <p className="text-xs text-emerald-600 font-medium">Comisión Neta</p>
                                <p className="text-lg font-semibold text-emerald-700">
                                    {((parseFloat(form.watch("totalPremium") || "0") * (parseFloat(form.watch("commissionPercentage") || "0") / 100)).toFixed(2))} {currency}
                                </p>
                            </div>
                            <div className="bg-white p-3 rounded border border-emerald-200">
                                <p className="text-xs text-emerald-600 font-medium">IVA Comisión (19%)</p>
                                <p className="text-lg font-semibold text-emerald-700">
                                    {((parseFloat(form.watch("totalPremium") || "0") * (parseFloat(form.watch("commissionPercentage") || "0") / 100) * 0.19).toFixed(2))} {currency}
                                </p>
                            </div>
                            <div className="bg-white p-3 rounded border border-emerald-200">
                                <p className="text-xs text-emerald-600 font-medium">Total Comisión</p>
                                <p className="text-xl font-bold text-emerald-800">
                                    {((parseFloat(form.watch("totalPremium") || "0") * (parseFloat(form.watch("commissionPercentage") || "0") / 100) * 1.19).toFixed(2))} {currency}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resumen Total */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium mb-4 text-blue-800">Resumen Total</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-blue-200">
                            <span className="text-slate-600">Prima Total Neta</span>
                            <span className="font-medium">{parseFloat(form.watch("totalPremium") || "0").toFixed(2)} {currency}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-blue-200">
                            <span className="text-slate-600">IVA Prima (19%)</span>
                            <span className="font-medium">{(parseFloat(form.watch("totalPremium") || "0") * 0.19).toFixed(2)} {currency}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-blue-200">
                            <span className="text-slate-600">Comisión Corredor ({form.watch("commissionPercentage") || "0"}%)</span>
                            <span className="font-medium text-emerald-600">{(parseFloat(form.watch("totalPremium") || "0") * (parseFloat(form.watch("commissionPercentage") || "0") / 100)).toFixed(2)} {currency}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-blue-200">
                            <span className="text-slate-600">IVA Comisión (19%)</span>
                            <span className="font-medium text-emerald-600">{(parseFloat(form.watch("totalPremium") || "0") * (parseFloat(form.watch("commissionPercentage") || "0") / 100) * 0.19).toFixed(2)} {currency}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t-2 border-blue-300">
                            <span className="text-lg font-bold text-blue-800">TOTAL A PAGAR</span>
                            <span className="text-xl font-bold text-blue-800">
                                {(
                                    parseFloat(form.watch("totalPremium") || "0") * 1.19 +
                                    parseFloat(form.watch("totalPremium") || "0") * (parseFloat(form.watch("commissionPercentage") || "0") / 100) * 1.19
                                ).toFixed(2)} {currency}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Cuotas de Pago */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-medium mb-4 text-slate-700">Forma de Pago</h4>
                    <div className="flex items-end gap-6">
                        <FormField
                            control={form.control}
                            name="paymentInstallments"
                            render={({ field }) => (
                                <FormItem className="w-48">
                                    <FormLabel>Número de Cuotas</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar cuotas" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {[1, 3, 6, 10, 12].map((n) => (
                                                <SelectItem key={n} value={n.toString()}>
                                                    {n} {n === 1 ? "Cuota (Contado)" : "Cuotas"}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex-1 bg-white p-4 rounded border">
                            <p className="text-sm text-slate-500">Valor por Cuota</p>
                            <p className="text-2xl font-bold text-blue-700">
                                {((
                                    parseFloat(form.watch("totalPremium") || "0") * 1.19 +
                                    parseFloat(form.watch("totalPremium") || "0") * (parseFloat(form.watch("commissionPercentage") || "0") / 100) * 1.19
                                ) / parseInt(form.watch("paymentInstallments") || "1")).toFixed(2)} {currency}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}
