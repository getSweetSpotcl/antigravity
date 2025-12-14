"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
    updateBrandingSettings,
    updateLogo,
    updateSignature,
    removeLogo,
    removeSignature,
    type BrandingFormValues,
} from "@/actions/branding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Loader2, Upload, Trash2, Palette, Building2, FileText } from "lucide-react"
import { toast } from "sonner"

const BrandingSchema = z.object({
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido").optional(),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido").optional(),
    footerText: z.string().max(500, "Máximo 500 caracteres").optional(),
    legalName: z.string().max(200).optional(),
    fantasyName: z.string().max(200).optional(),
    cmfRegistration: z.string().max(100).optional(),
    phone: z.string().max(50).optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    address: z.string().max(300).optional(),
    website: z.string().url("URL inválida").optional().or(z.literal("")),
})

interface BrandingSettings {
    id: string
    name: string
    logoUrl: string | null
    primaryColor: string | null
    secondaryColor: string | null
    signatureUrl: string | null
    footerText: string | null
    legalName: string | null
    fantasyName: string | null
    cmfRegistration: string | null
    phone: string | null
    email: string | null
    address: string | null
    website: string | null
}

interface BrandingFormProps {
    settings: BrandingSettings
}

export function BrandingForm({ settings }: BrandingFormProps) {
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)
    const [isUploadingLogo, setIsUploadingLogo] = useState(false)
    const [isUploadingSignature, setIsUploadingSignature] = useState(false)

    const form = useForm<BrandingFormValues>({
        resolver: zodResolver(BrandingSchema),
        defaultValues: {
            primaryColor: settings.primaryColor || "#3b82f6",
            secondaryColor: settings.secondaryColor || "#1e40af",
            footerText: settings.footerText || "",
            legalName: settings.legalName || "",
            fantasyName: settings.fantasyName || "",
            cmfRegistration: settings.cmfRegistration || "",
            phone: settings.phone || "",
            email: settings.email || "",
            address: settings.address || "",
            website: settings.website || "",
        },
    })

    const onSubmit = async (values: BrandingFormValues) => {
        setIsPending(true)
        try {
            const result = await updateBrandingSettings(values)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(result.success)
                router.refresh()
            }
        } catch {
            toast.error("Error al guardar")
        } finally {
            setIsPending(false)
        }
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast.error("Solo se permiten imágenes")
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error("El archivo no puede superar 2MB")
            return
        }

        setIsUploadingLogo(true)
        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) throw new Error("Error al subir")

            const { url } = await response.json()
            const result = await updateLogo(url)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Logo actualizado")
                router.refresh()
            }
        } catch {
            toast.error("Error al subir el logo")
        } finally {
            setIsUploadingLogo(false)
        }
    }

    const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast.error("Solo se permiten imágenes")
            return
        }

        if (file.size > 1 * 1024 * 1024) {
            toast.error("El archivo no puede superar 1MB")
            return
        }

        setIsUploadingSignature(true)
        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) throw new Error("Error al subir")

            const { url } = await response.json()
            const result = await updateSignature(url)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Firma actualizada")
                router.refresh()
            }
        } catch {
            toast.error("Error al subir la firma")
        } finally {
            setIsUploadingSignature(false)
        }
    }

    const handleRemoveLogo = async () => {
        const result = await removeLogo()
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(result.success)
            router.refresh()
        }
    }

    const handleRemoveSignature = async () => {
        const result = await removeSignature()
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(result.success)
            router.refresh()
        }
    }

    return (
        <div className="space-y-6">
            {/* Logo y Firma */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Logo de la Empresa
                        </CardTitle>
                        <CardDescription>
                            Se mostrará en documentos y el portal de clientes
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {settings.logoUrl ? (
                            <div className="flex items-center gap-4">
                                <img
                                    src={settings.logoUrl}
                                    alt="Logo"
                                    className="h-16 w-auto object-contain border rounded"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRemoveLogo}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                </Button>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                <p className="text-muted-foreground text-sm mb-2">
                                    Sin logo configurado
                                </p>
                            </div>
                        )}
                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                                id="logo-upload"
                                disabled={isUploadingLogo}
                            />
                            <label htmlFor="logo-upload">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    asChild
                                    disabled={isUploadingLogo}
                                >
                                    <span>
                                        {isUploadingLogo ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Upload className="h-4 w-4 mr-2" />
                                        )}
                                        {settings.logoUrl ? "Cambiar Logo" : "Subir Logo"}
                                    </span>
                                </Button>
                            </label>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Firma Digital
                        </CardTitle>
                        <CardDescription>
                            Firma del corredor para documentos oficiales
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {settings.signatureUrl ? (
                            <div className="flex items-center gap-4">
                                <img
                                    src={settings.signatureUrl}
                                    alt="Firma"
                                    className="h-12 w-auto object-contain border rounded bg-white"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRemoveSignature}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                </Button>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                <p className="text-muted-foreground text-sm mb-2">
                                    Sin firma configurada
                                </p>
                            </div>
                        )}
                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleSignatureUpload}
                                className="hidden"
                                id="signature-upload"
                                disabled={isUploadingSignature}
                            />
                            <label htmlFor="signature-upload">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    asChild
                                    disabled={isUploadingSignature}
                                >
                                    <span>
                                        {isUploadingSignature ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Upload className="h-4 w-4 mr-2" />
                                        )}
                                        {settings.signatureUrl ? "Cambiar Firma" : "Subir Firma"}
                                    </span>
                                </Button>
                            </label>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Formulario */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Colores */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Colores Corporativos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="primaryColor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Color Primario</FormLabel>
                                        <FormControl>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="color"
                                                    {...field}
                                                    className="w-12 h-10 p-1 cursor-pointer"
                                                />
                                                <Input
                                                    {...field}
                                                    placeholder="#3b82f6"
                                                    className="flex-1"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="secondaryColor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Color Secundario</FormLabel>
                                        <FormControl>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="color"
                                                    {...field}
                                                    className="w-12 h-10 p-1 cursor-pointer"
                                                />
                                                <Input
                                                    {...field}
                                                    placeholder="#1e40af"
                                                    className="flex-1"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Datos Legales */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Datos de la Empresa
                            </CardTitle>
                            <CardDescription>
                                Información que aparecerá en los documentos oficiales
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="legalName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Razón Social</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Corredora de Seguros SpA" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="fantasyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre de Fantasía</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Mi Corredora" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="cmfRegistration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Registro CMF</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="N° 12345" />
                                        </FormControl>
                                        <FormDescription>
                                            Número de registro en la CMF
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Teléfono</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="+56 2 1234 5678" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email de Contacto</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="email" placeholder="contacto@micorredora.cl" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sitio Web</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="https://www.micorredora.cl" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel>Dirección</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Av. Providencia 1234, Of. 567, Providencia" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Pie de Documento */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Pie de Documento</CardTitle>
                            <CardDescription>
                                Texto que aparecerá al final de los documentos generados
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="footerText"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="Corredora inscrita en el Registro de Corredores de Seguros de la CMF bajo el N° 12345. Este documento es informativo y no constituye póliza de seguro."
                                                className="min-h-[100px]"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Máximo 500 caracteres
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                "Guardar Configuración"
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
