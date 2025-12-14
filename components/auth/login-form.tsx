"use client"

import * as z from "zod"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSearchParams } from "next/navigation"
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react"

import { LoginSchema } from "@/schemas"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { login } from "@/actions/login"
import { toast } from "sonner"
import Link from "next/link"

export const LoginForm = () => {
    const searchParams = useSearchParams()
    const urlError = searchParams.get("error") === "OAuthAccountNotLinked"
        ? "Email en uso con otro proveedor!"
        : ""

    const [error, setError] = useState<string | undefined>("")
    const [success, setSuccess] = useState<string | undefined>("")
    const [isPending, startTransition] = useTransition()

    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const onSubmit = (values: z.infer<typeof LoginSchema>) => {
        setError("")
        setSuccess("")

        startTransition(() => {
            login(values)
                .then((data) => {
                    if (data?.error) {
                        form.reset()
                        setError(data.error)
                        toast.error(data.error)
                    }
                })
                .catch((error) => {
                    // NextAuth throws NEXT_REDIRECT on successful login - ignore it
                    const errorMessage = error?.message || ""
                    const errorDigest = error?.digest || ""
                    if (errorMessage.includes("NEXT_REDIRECT") || errorDigest.includes("NEXT_REDIRECT")) {
                        return // Successful redirect, don't show error
                    }
                    setError("Algo salió mal")
                    toast.error("Algo salió mal")
                })
        })
    }

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">
                    Iniciar sesión
                </h2>
                <p className="text-slate-500">
                    Ingresa a tu cuenta para gestionar tu correduría
                </p>
            </div>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 font-medium">Email</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <Input
                                                {...field}
                                                disabled={isPending}
                                                placeholder="tu@email.com"
                                                type="email"
                                                className="pl-11 h-12 bg-white! text-slate-900! border-slate-200! placeholder:text-slate-400! dark:bg-white! dark:text-slate-900! dark:border-slate-200! dark:placeholder:text-slate-400! focus:border-blue-500 focus:ring-blue-500 transition-all"
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
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-slate-700 font-medium">Contraseña</FormLabel>
                                        <Link
                                            href="/auth/forgot-password"
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </Link>
                                    </div>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                            <Input
                                                {...field}
                                                disabled={isPending}
                                                placeholder="••••••••"
                                                type="password"
                                                className="pl-11 h-12 bg-white! text-slate-900! border-slate-200! placeholder:text-slate-400! dark:bg-white! dark:text-slate-900! dark:border-slate-200! dark:placeholder:text-slate-400! focus:border-blue-500 focus:ring-blue-500 transition-all"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-emerald-800 font-medium">{success}</p>
                        </div>
                    )}

                    <Button
                        disabled={isPending}
                        type="submit"
                        className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 transition-all duration-200 group rounded-xl"
                    >
                        {isPending ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Ingresando...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span>Continuar</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        )}
                    </Button>
                </form>
            </Form>

            {/* Footer */}
            <div className="mt-8 text-center">
                <p className="text-sm text-slate-600">
                    ¿No tienes una cuenta?{" "}
                    <Link
                        href="/auth/register"
                        className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
                    >
                        Regístrate aquí
                    </Link>
                </p>
            </div>
        </div>
    )
}
