---
name: form-dialogs
description: Patrón para crear diálogos de formulario consistentes con react-hook-form y Zod. Usar al crear diálogos de creación o edición de entidades.
---

# Skill: Form Dialogs

Este skill define el patrón estándar para crear diálogos de formulario en GiCS, asegurando consistencia en UX y manejo de estados.

## Estructura Base de un Form Dialog

```typescript
"use client"

import * as z from "zod"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"

import { EntitySchema } from "@/schemas/entity"
import { createEntity } from "@/actions/entity"
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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

interface CreateEntityDialogProps {
    // Props para datos dependientes (clientes, compañías, etc.)
}

export const CreateEntityDialog = ({ }: CreateEntityDialogProps) => {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const form = useForm<z.infer<typeof EntitySchema>>({
        resolver: zodResolver(EntitySchema),
        defaultValues: {
            field1: "",
            field2: "",
            // ...defaults
        },
    })

    const onSubmit = (values: z.infer<typeof EntitySchema>) => {
        startTransition(() => {
            createEntity(values)
                .then((data) => {
                    if (data.error) {
                        toast.error(data.error)
                    }

                    if (data.success) {
                        toast.success(data.success)
                        setOpen(false)
                        form.reset()
                        router.refresh()
                    }
                })
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Entidad
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Crear Entidad</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Campos del formulario */}

                        <Button type="submit" className="w-full" disabled={isPending}>
                            Crear Entidad
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
```

## Tipos de Campos

### Input de Texto

```tsx
<FormField
    control={form.control}
    name="fieldName"
    render={({ field }) => (
        <FormItem>
            <FormLabel>Etiqueta</FormLabel>
            <FormControl>
                <Input
                    disabled={isPending}
                    placeholder="Placeholder..."
                    {...field}
                />
            </FormControl>
            <FormMessage />
        </FormItem>
    )}
/>
```

### Input Numérico (Montos)

```tsx
<FormField
    control={form.control}
    name="amount"
    render={({ field }) => (
        <FormItem>
            <FormLabel>Monto</FormLabel>
            <FormControl>
                <Input
                    type="number"
                    step="0.01"
                    disabled={isPending}
                    {...field}
                />
            </FormControl>
            <FormMessage />
        </FormItem>
    )}
/>
```

### Select

```tsx
<FormField
    control={form.control}
    name="type"
    render={({ field }) => (
        <FormItem>
            <FormLabel>Tipo</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccione tipo" />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <FormMessage />
        </FormItem>
    )}
/>
```

### Select con Datos Dinámicos

```tsx
<FormField
    control={form.control}
    name="clientId"
    render={({ field }) => (
        <FormItem>
            <FormLabel>Cliente</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccione cliente" />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                            {client.firstName} {client.lastName}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <FormMessage />
        </FormItem>
    )}
/>
```

### Date Picker

```tsx
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

<FormField
    control={form.control}
    name="date"
    render={({ field }) => (
        <FormItem className="flex flex-col">
            <FormLabel>Fecha</FormLabel>
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
                                format(field.value, "PPP")
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
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
            <FormMessage />
        </FormItem>
    )}
/>
```

### Textarea

```tsx
<FormField
    control={form.control}
    name="description"
    render={({ field }) => (
        <FormItem>
            <FormLabel>Descripción</FormLabel>
            <FormControl>
                <Textarea
                    disabled={isPending}
                    placeholder="Descripción..."
                    className="resize-none"
                    {...field}
                />
            </FormControl>
            <FormMessage />
        </FormItem>
    )}
/>
```

### Checkbox

```tsx
<FormField
    control={form.control}
    name="isActive"
    render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
                <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                />
            </FormControl>
            <div className="space-y-1 leading-none">
                <FormLabel>Activo</FormLabel>
            </div>
        </FormItem>
    )}
/>
```

## Layouts de Campos

### Grid de 2 columnas

```tsx
<div className="grid grid-cols-2 gap-4">
    {/* Campo 1 */}
    {/* Campo 2 */}
</div>
```

### Grid de 3 columnas

```tsx
<div className="grid grid-cols-3 gap-4">
    {/* Campos */}
</div>
```

### Secciones separadas

```tsx
<div className="space-y-4">
    <div className="border-b pb-4">
        <h3 className="font-medium mb-3">Información General</h3>
        <div className="grid grid-cols-2 gap-4">
            {/* Campos */}
        </div>
    </div>

    <div className="border-b pb-4">
        <h3 className="font-medium mb-3">Detalles Financieros</h3>
        <div className="grid grid-cols-3 gap-4">
            {/* Campos */}
        </div>
    </div>
</div>
```

## Diálogo de Edición

```tsx
interface EditEntityDialogProps {
    entity: Entity
    trigger?: React.ReactNode
}

export const EditEntityDialog = ({ entity, trigger }: EditEntityDialogProps) => {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const form = useForm<z.infer<typeof EntitySchema>>({
        resolver: zodResolver(EntitySchema),
        defaultValues: {
            field1: entity.field1,
            field2: entity.field2,
            // Cargar valores existentes
        },
    })

    const onSubmit = (values: z.infer<typeof EntitySchema>) => {
        startTransition(() => {
            updateEntity(entity.id, values)
                .then((data) => {
                    if (data.error) {
                        toast.error(data.error)
                    }

                    if (data.success) {
                        toast.success(data.success)
                        setOpen(false)
                        router.refresh()
                    }
                })
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                    </Button>
                )}
            </DialogTrigger>
            {/* Contenido similar al de creación */}
        </Dialog>
    )
}
```

## Tamaños de DialogContent

```tsx
// Pequeño (campos simples)
<DialogContent className="sm:max-w-[425px]">

// Mediano (formularios estándar)
<DialogContent className="sm:max-w-[600px]">

// Grande (formularios complejos)
<DialogContent className="sm:max-w-[800px]">

// Extra grande (formularios multi-paso)
<DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
```

## Convenciones

### Nombres de Componentes

- `CreateEntityDialog` - Para creación
- `EditEntityDialog` - Para edición
- `EntityFormDialog` - Si maneja ambos casos

### Mensajes Toast

```tsx
// Éxito
toast.success("Póliza creada exitosamente")
toast.success("Cambios guardados")

// Error
toast.error(data.error) // Del servidor
toast.error("Error al guardar los cambios")
```

### Estados del Botón Submit

```tsx
<Button type="submit" className="w-full" disabled={isPending}>
    {isPending ? "Guardando..." : "Crear Entidad"}
</Button>
```

## Archivos de Referencia

- `components/policies/create-policy-dialog.tsx` - Ejemplo completo
- `components/claims/create-claim-dialog.tsx` - Con relaciones
- `components/quotes/create-quote-dialog.tsx` - Multi-paso
- `components/policies/endorsements/create-endorsement-dialog.tsx` - Entidad hija
