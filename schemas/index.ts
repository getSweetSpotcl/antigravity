import * as z from "zod"

export const RegisterSchema = z.object({
    brokerageName: z.string().min(3, {
        message: "El nombre de la corredora debe tener al menos 3 caracteres.",
    }),
    brokerageRut: z.string().min(8, {
        message: "Ingrese un RUT válido.",
    }),
    name: z.string().min(3, {
        message: "El nombre debe tener al menos 3 caracteres.",
    }),
    email: z.string().email({
        message: "Ingrese un correo electrónico válido.",
    }),
    password: z.string().min(6, {
        message: "La contraseña debe tener al menos 6 caracteres.",
    }),
})

export const LoginSchema = z.object({
    email: z.string().email({
        message: "Ingrese un correo electrónico válido.",
    }),
    password: z.string().min(1, {
        message: "Ingrese su contraseña.",
    }),
})

export const InviteUserSchema = z.object({
    name: z.string().min(3, {
        message: "El nombre debe tener al menos 3 caracteres.",
    }),
    email: z.string().email({
        message: "Ingrese un correo electrónico válido.",
    }),
    password: z.string().min(6, {
        message: "La contraseña debe tener al menos 6 caracteres.",
    }),
})
