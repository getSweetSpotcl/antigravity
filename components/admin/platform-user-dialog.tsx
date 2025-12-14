"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { createPlatformUser, updatePlatformUser, deletePlatformUser } from "@/actions/admin"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

const UserSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres").optional().or(z.literal("")),
    tenantId: z.string().optional(),
})

interface PlatformUserDialogProps {
    user?: any
    tenants: any[]
    trigger?: React.ReactNode
}

export function PlatformUserDialog({ user, tenants, trigger }: PlatformUserDialogProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const isEditing = !!user

    const form = useForm<any>({
        resolver: zodResolver(
            isEditing
                ? UserSchema.extend({ password: z.string().optional().or(z.literal("")) })
                : UserSchema.extend({ password: z.string().min(6, "Mínimo 6 caracteres") })
        ),
        defaultValues: {
            name: user?.name || "",
            email: user?.email || "",
            password: "",
            tenantId: user?.Tenant?.id || "none",
        },
    })

    const onSubmit = async (values: z.infer<typeof UserSchema>) => {
        try {
            const payload = {
                ...values,
                tenantId: values.tenantId === "none" ? undefined : values.tenantId,
                password: values.password || undefined,
            }

            if (isEditing) {
                const result = await updatePlatformUser(user.id, payload)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success("Usuario actualizado")
                    setOpen(false)
                    router.refresh()
                }
            } else {
                if (!values.password) {
                    toast.error("La contraseña es requerida")
                    return
                }
                const result = await createPlatformUser(payload as any)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success("Usuario creado")
                    setOpen(false)
                    form.reset()
                    router.refresh()
                }
            }
        } catch (error) {
            toast.error("Error al guardar el usuario")
        }
    }

    const handleDelete = async () => {
        try {
            const result = await deletePlatformUser(user.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Usuario eliminado")
                setOpen(false)
                router.refresh()
            }
        } catch (error) {
            toast.error("Error al eliminar el usuario")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Super Admin
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Usuario" : "Crear Super Admin"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Nombre completo" />
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
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="email" placeholder="admin@ejemplo.cl" />
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
                                    <FormLabel>{isEditing ? "Nueva Contraseña (opcional)" : "Contraseña"}</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="password" placeholder={isEditing ? "Dejar vacío para mantener" : "Mínimo 6 caracteres"} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="tenantId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tenant Principal</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar tenant" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Sin tenant asignado</SelectItem>
                                            {tenants.map((tenant) => (
                                                <SelectItem key={tenant.id} value={tenant.id}>
                                                    {tenant.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Tenant por defecto al iniciar sesión (puede cambiar entre cualquier tenant)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-between gap-2 pt-4">
                            {isEditing && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button type="button" variant="destructive" size="sm">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Eliminar
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción no se puede deshacer. El usuario perderá acceso a la plataforma.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            <div className="flex gap-2 ml-auto">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit">Guardar</Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
