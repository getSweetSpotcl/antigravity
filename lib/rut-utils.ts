/**
 * Valida y formatea RUT chileno
 */

// Limpiar RUT (quitar puntos y guión)
export function cleanRut(rut: string): string {
    return rut.replace(/[.-]/g, '').toUpperCase()
}

// Formatear RUT (agregar puntos y guión)
export function formatRut(rut: string): string {
    const cleaned = cleanRut(rut)
    if (cleaned.length < 2) return rut

    const dv = cleaned.slice(-1)
    const number = cleaned.slice(0, -1)

    // Agregar puntos cada 3 dígitos
    const formatted = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

    return `${formatted}-${dv}`
}

// Calcular dígito verificador
export function calculateDV(rut: string): string {
    const cleaned = cleanRut(rut).slice(0, -1) // Quitar DV si existe
    let sum = 0
    let multiplier = 2

    for (let i = cleaned.length - 1; i >= 0; i--) {
        sum += parseInt(cleaned[i]) * multiplier
        multiplier = multiplier === 7 ? 2 : multiplier + 1
    }

    const remainder = sum % 11
    const dv = 11 - remainder

    if (dv === 11) return '0'
    if (dv === 10) return 'K'
    return dv.toString()
}

// Validar RUT completo
export function validateRut(rut: string): boolean {
    if (!rut || rut.trim() === '') return false

    const cleaned = cleanRut(rut)

    // Debe tener al menos 2 caracteres (número + DV)
    if (cleaned.length < 2) return false

    const dv = cleaned.slice(-1)
    const number = cleaned.slice(0, -1)

    // El número debe ser numérico
    if (!/^\d+$/.test(number)) return false

    // Calcular y comparar DV
    const calculatedDV = calculateDV(cleaned)

    return dv === calculatedDV
}

// Validar y formatear RUT
export function validateAndFormatRut(rut: string): { valid: boolean; formatted: string; error?: string } {
    if (!rut || rut.trim() === '') {
        return { valid: false, formatted: '', error: 'RUT es requerido' }
    }

    const isValid = validateRut(rut)

    if (!isValid) {
        return { valid: false, formatted: rut, error: 'RUT inválido' }
    }

    const formatted = formatRut(rut)
    return { valid: true, formatted }
}

// Hook para input de RUT con formateo automático
export function useRutInput(initialValue: string = '') {
    const [value, setValue] = React.useState(initialValue)
    const [error, setError] = React.useState<string | null>(null)

    const handleChange = (newValue: string) => {
        // Permitir solo números, puntos, guión y K
        const cleaned = newValue.replace(/[^0-9kK.-]/g, '')
        setValue(cleaned)
        setError(null)
    }

    const handleBlur = () => {
        if (value) {
            const result = validateAndFormatRut(value)
            if (result.valid) {
                setValue(result.formatted)
                setError(null)
            } else {
                setError(result.error || 'RUT inválido')
            }
        }
    }

    return {
        value,
        error,
        onChange: handleChange,
        onBlur: handleBlur,
        isValid: value ? validateRut(value) : null,
    }
}

// Importar React para el hook
import React from 'react'
