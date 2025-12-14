"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { portalRegister } from "@/actions/portal-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner"
import { Loader2, Mail, Lock, CreditCard, Building2 } from "lucide-react"

const RegisterSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
    rut: z.string().min(1, "RUT requerido"),
    tenantSlug: z.string().min(1, "Código de corredora requerido"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
})

type RegisterFormValues = z.infer<typeof RegisterSchema>

export function PortalRegisterForm() {
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
            rut: "",
            tenantSlug: "",
        },
    })

    const onSubmit = async (values: RegisterFormValues) => {
        setIsPending(true)
        try {
            const result = await portalRegister(values)

            if (result.error) {
                toast.error(result.error)
            } else if (result.success) {
                toast.success(result.success)
                router.push("/portal/login")
            }
        } catch {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="tenantSlug"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Código de Corredora</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        {...field}
                                        placeholder="mi-corredora"
                                        className="pl-10"
                                        disabled={isPending}
                                    />
                                </div>
                            </FormControl>
                            <FormDescription>
                                Código proporcionado por su corredor de seguros
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="rut"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>RUT</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        {...field}
                                        placeholder="12.345.678-9"
                                        className="pl-10"
                                        disabled={isPending}
                                    />
                                </div>
                            </FormControl>
                            <FormDescription>
                                Debe coincidir con el RUT registrado en la corredora
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        {...field}
                                        type="email"
                                        placeholder="correo@ejemplo.cl"
                                        className="pl-10"
                                        disabled={isPending}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        {...field}
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10"
                                        disabled={isPending}
                                    />
                                </div>
                            </FormControl>
                            <FormDescription>
                                Mínimo 8 caracteres
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirmar Contraseña</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        {...field}
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10"
                                        disabled={isPending}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registrando...
                        </>
                    ) : (
                        "Crear Cuenta"
                    )}
                </Button>
            </form>
        </Form>
    )
}
