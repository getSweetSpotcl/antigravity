"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
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
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { updateTenant } from "@/actions/admin"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const TenantSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    planId: z.string().optional(),
    subscriptionStatus: z.string(),
    maxUsers: z.number().min(1),

    customPrice: z.union([z.number(), z.string()]).optional().nullable(),
    discountType: z.string().optional().nullable(),
    discountValue: z.union([z.number(), z.string()]).optional().nullable(),
    billingDay: z.number().min(1).max(28).default(1),
    useCustomPrice: z.boolean().default(false),
})

interface TenantEditFormProps {
    tenant: any
    plans: any[]
}

export function TenantEditForm({ tenant, plans }: TenantEditFormProps) {
    const router = useRouter()

    const form = useForm<any>({
        resolver: zodResolver(TenantSchema),
        defaultValues: {
            name: tenant.name,
            planId: tenant.planId || "custom",
            subscriptionStatus: tenant.subscriptionStatus,
            maxUsers: tenant.maxUsers,

            customPrice: tenant.customPrice || "",
            discountType: tenant.discountType || "NONE",
            discountValue: tenant.discountValue || "",
            billingDay: tenant.billingDay || 1,
            useCustomPrice: !!tenant.customPrice,
        },
    })

    const selectedPlanId = form.watch("planId")
    const useCustomPrice = form.watch("useCustomPrice")
    const customPrice = form.watch("customPrice")
    const discountType = form.watch("discountType")
    const discountValue = form.watch("discountValue")

    const selectedPlan = plans.find(p => p.id === selectedPlanId)
    const basePrice = selectedPlan ? selectedPlan.price : 0

    // Calcular precio final estimado
    const calculateFinalPrice = () => {
        let price = useCustomPrice && customPrice ? Number(customPrice) : basePrice

        if (discountType === "PERCENTAGE" && discountValue) {
            price = price - (price * (Number(discountValue) / 100))
        } else if (discountType === "FIXED" && discountValue) {
            price = price - Number(discountValue)
        }

        return Math.max(0, Math.round(price))
    }

    const finalPrice = calculateFinalPrice()

    // Actualizar límites cuando cambia el plan
    const handlePlanChange = (planId: string) => {
        form.setValue("planId", planId)
        if (planId !== "custom") {
            const plan = plans.find(p => p.id === planId)
            if (plan) {
                form.setValue("maxUsers", plan.maxUsers)
                // Aquí podríamos actualizar storage también si estuviera en el form
            }
        }
    }

    const onSubmit = async (values: z.infer<typeof TenantSchema>) => {
        try {
            const planName = plans.find(p => p.id === values.planId)?.name || "Custom"

            // Limpiar valores si no se usan
            const payload = {
                ...values,
                planName, // Enviamos el nombre para compatibilidad legacy
                customPrice: values.useCustomPrice ? values.customPrice : null,
                discountType: values.discountType === "NONE" ? null : values.discountType,
                discountValue: values.discountType === "NONE" ? null : values.discountValue,
            }

            const result = await updateTenant(tenant.id, payload)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Organización actualizada")
                router.refresh()
            }
        } catch (error) {
            toast.error("Error al actualizar")
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre de la Organización</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="planId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Plan Suscrito</FormLabel>
                                <Select
                                    onValueChange={handlePlanChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar plan" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="custom">Personalizado / Legacy</SelectItem>
                                        {plans.map((plan) => (
                                            <SelectItem key={plan.id} value={plan.id}>
                                                {plan.name} (${plan.price.toLocaleString("es-CL")})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Al cambiar el plan se actualizarán los límites por defecto.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="subscriptionStatus"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado de Suscripción</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Estado" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="TRIAL">Prueba (Trial)</SelectItem>
                                        <SelectItem value="ACTIVE">Activo</SelectItem>
                                        <SelectItem value="PAST_DUE">Pago Pendiente</SelectItem>
                                        <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                                        <SelectItem value="CANCELED">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Sección de Precios y Descuentos */}
                <div className="border rounded-lg p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">Configuración de Precios</h3>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Precio Personalizado</FormLabel>
                            <FormDescription>
                                Sobrescribir el precio base del plan (${basePrice.toLocaleString("es-CL")})
                            </FormDescription>
                        </div>
                        <FormField
                            control={form.control}
                            name="useCustomPrice"
                            render={({ field }) => (
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            )}
                        />
                    </div>

                    {useCustomPrice && (
                        <FormField
                            control={form.control}
                            name="customPrice"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Precio Base Personalizado (CLP)</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="number" placeholder="Ej: 45000" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <FormField
                            control={form.control}
                            name="discountType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Descuento</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value || "NONE"}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sin descuento" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="NONE">Sin descuento</SelectItem>
                                            <SelectItem value="PERCENTAGE">Porcentaje (%)</SelectItem>
                                            <SelectItem value="FIXED">Monto Fijo ($)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {discountType !== "NONE" && discountType && (
                            <FormField
                                control={form.control}
                                name="discountValue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor del Descuento</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="number" placeholder={discountType === "PERCENTAGE" ? "Ej: 10" : "Ej: 5000"} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t mt-4">
                        <span className="font-medium">Total Mensual Estimado:</span>
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                            ${finalPrice.toLocaleString("es-CL")}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="billingDay"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Día de Facturación Mensual</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={String(field.value)}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar día" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                                            <SelectItem key={day} value={String(day)}>
                                                Día {day}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Se generará el cobro automáticamente este día.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="maxUsers"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Límite de Usuarios</FormLabel>
                                <FormControl>
                                    <Input {...field} type="number" />
                                </FormControl>
                                <FormDescription>
                                    Usuarios actuales: {tenant.users.length}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end">
                    <Button type="submit">Guardar Cambios</Button>
                </div>
            </form>
        </Form>
    )
}
