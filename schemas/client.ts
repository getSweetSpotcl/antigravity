import * as z from "zod"

function validateRut(rut: string): boolean {
    if (!/^[0-9]+-[0-9kK]{1}$/.test(rut)) return false
    const [body, dv] = rut.split("-")
    let suma = 0
    let multiplo = 2

    for (let i = 1; i <= body.length; i++) {
        const index = multiplo * parseInt(rut.charAt(body.length - i))
        suma = suma + index
        if (multiplo < 7) {
            multiplo = multiplo + 1
        } else {
            multiplo = 2
        }
    }

    const dvEsperado = 11 - (suma % 11)
    const dvCalculado = dvEsperado === 11 ? "0" : dvEsperado === 10 ? "k" : dvEsperado.toString()

    return dvCalculado.toLowerCase() === dv.toLowerCase()
}

export const ClientSchema = z.object({
    rut: z.string().min(8, {
        message: "RUT inválido"
    }).refine(validateRut, {
        message: "RUT inválido (Formato: 12345678-9)"
    }),
    firstName: z.string().min(2, {
        message: "El nombre es requerido"
    }),
    lastName: z.string().min(2, {
        message: "El apellido es requerido"
    }),
    email: z.string().email({
        message: "Email inválido"
    }),
    phone: z.string().optional(),
    address: z.string().optional(),
})
