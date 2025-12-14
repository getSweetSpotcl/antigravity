"use client"

import { UseFormReturn } from "react-hook-form"
import { InsuranceCompany } from "@prisma/client"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { INSURANCE_LINES, POLICY_TYPES_ES } from "@/lib/insurance-constants"

interface Step2Props {
    form: UseFormReturn<any>
    companies: InsuranceCompany[]
}

export const Step2InsuranceInfo = ({ form, companies }: Step2Props) => {
    const selectedCompanyId = form.watch("companyId")

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Compañía Aseguradora */}
                <FormField
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Compañía Aseguradora</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione compañía" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {companies.map((company) => (
                                        <SelectItem key={company.id} value={company.id}>
                                            {company.name}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="OTHER">Otra / No listada</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {selectedCompanyId === "OTHER" && (
                    <FormField
                        control={form.control}
                        name="customCompanyName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre de la Compañía</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ingrese el nombre de la compañía" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Rubro del Seguro */}
                <FormField
                    control={form.control}
                    name="insuranceLine"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Rubro / Ramo</FormLabel>
                            <Select
                                onValueChange={(val) => {
                                    field.onChange(val)
                                    // Auto-select policy type category based on line
                                    const line = INSURANCE_LINES[val as keyof typeof INSURANCE_LINES]
                                    if (line) {
                                        form.setValue("policyType", line.category)
                                    }
                                }}
                                value={field.value || ""}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione rubro" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Object.entries(INSURANCE_LINES).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>
                                            {value.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Determina los campos requeridos para el bien asegurado.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Tipo de Póliza (Categoría General) */}
                <FormField
                    control={form.control}
                    name="policyType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categoría de Póliza</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""} disabled>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Categoría automática" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Object.entries(POLICY_TYPES_ES).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>
                                            {value}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Duración Estimada */}
                <FormField
                    control={form.control}
                    name="policyDuration"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Duración (Meses)</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    {...field}
                                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    onWheel={(e) => e.currentTarget.blur()}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vigencia Desde (Opcional) */}
                <FormField
                    control={form.control}
                    name="validFrom"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Vigencia Desde (Estimada)</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP", { locale: es })
                                            ) : (
                                                <span>Seleccione fecha</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        locale={es}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Validez de la Cotización */}
                <FormField
                    control={form.control}
                    name="validUntil"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Cotización Válida Hasta</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP", { locale: es })
                                            ) : (
                                                <span>Seleccione fecha</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        locale={es}
                                        disabled={(date) =>
                                            date < new Date()
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormDescription>
                                Fecha límite para que el cliente acepte la cotización.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    )
}
