"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createPortalClaim } from "@/actions/portal-claim"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { PolicyType } from "@prisma/client"

const POLICY_TYPE_LABELS: Record<PolicyType, string> = {
    GENERAL: "General",
    LIFE: "Vida",
    HEALTH: "Salud",
    AUTO: "Automóvil",
    HOME: "Hogar",
    GUARANTEE: "Garantía",
}

const ClaimSchema = z.object({
    policyId: z.string().min(1, "Seleccione una póliza"),
    date: z.date({ message: "Fecha del siniestro requerida" }),
    description: z.string().min(10, "Describa el siniestro (mínimo 10 caracteres)"),
    claimAmount: z.string().optional(),
})

type ClaimFormValues = z.infer<typeof ClaimSchema>

interface Policy {
    id: string
    number: string
    type: PolicyType
    InsuranceCompany: { name: string } | null
    company: string
    Client: {
        Tenant: {
            name: string
            slug: string
            id: string
        }
    }
}

interface PortalClaimFormProps {
    policies: Policy[]
}

export function PortalClaimForm({ policies }: PortalClaimFormProps) {
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)

    const form = useForm<ClaimFormValues>({
        resolver: zodResolver(ClaimSchema),
        defaultValues: {
            policyId: "",
            description: "",
            claimAmount: "",
        },
    })

    const onSubmit = async (values: ClaimFormValues) => {
        setIsPending(true)
        try {
            const result = await createPortalClaim(values)

            if (result.error) {
                toast.error(result.error)
            } else if (result.success) {
                toast.success(result.success)
                router.push("/portal/claims")
            }
        } catch {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="policyId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Póliza Afectada</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={isPending}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione la póliza" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {policies.map((policy) => (
                                        <SelectItem key={policy.id} value={policy.id}>
                                            <div className="flex flex-col">
                                                <span>
                                                    {policy.number} - {POLICY_TYPE_LABELS[policy.type]}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {policy.InsuranceCompany?.name || policy.company} • {policy.Client.Tenant.name}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Fecha del Siniestro</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                            disabled={isPending}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP", { locale: es })
                                            ) : (
                                                <span>Seleccione una fecha</span>
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
                                        disabled={(date) =>
                                            date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                        locale={es}
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormDescription>
                                Fecha en que ocurrió el siniestro
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descripción del Siniestro</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="Describa lo ocurrido con el mayor detalle posible..."
                                    className="min-h-[120px]"
                                    disabled={isPending}
                                />
                            </FormControl>
                            <FormDescription>
                                Incluya detalles como lugar, circunstancias, daños observados, etc.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="claimAmount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Monto Estimado del Daño (opcional)</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    disabled={isPending}
                                />
                            </FormControl>
                            <FormDescription>
                                Estimación del monto del daño en UF (si lo conoce)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isPending}
                        className="flex-1"
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isPending} className="flex-1">
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            "Reportar Siniestro"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
