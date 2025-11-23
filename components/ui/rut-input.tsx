"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { formatRut, validateRut } from "@/lib/rut-utils"

export interface RutInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value?: string
    onChange?: (value: string) => void
    onValidation?: (isValid: boolean) => void
}

const RutInput = React.forwardRef<HTMLInputElement, RutInputProps>(
    ({ className, value, onChange, onValidation, onBlur, ...props }, ref) => {
        const [internalValue, setInternalValue] = React.useState(value || "")
        const [isValid, setIsValid] = React.useState<boolean | null>(null)

        React.useEffect(() => {
            if (value !== undefined) {
                setInternalValue(value)
            }
        }, [value])

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value
            // Permitir solo números, puntos, guión y K
            const cleaned = newValue.replace(/[^0-9kK.-]/g, '').toUpperCase()
            setInternalValue(cleaned)
            onChange?.(cleaned)

            // Reset validation while typing
            if (isValid !== null) {
                setIsValid(null)
                onValidation?.(false)
            }
        }

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            if (internalValue) {
                const valid = validateRut(internalValue)
                setIsValid(valid)
                onValidation?.(valid)

                if (valid) {
                    const formatted = formatRut(internalValue)
                    setInternalValue(formatted)
                    onChange?.(formatted)
                }
            }
            onBlur?.(e)
        }

        return (
            <Input
                type="text"
                className={cn(
                    className,
                    isValid === false && "border-red-500 focus-visible:ring-red-500",
                    isValid === true && "border-emerald-500 focus-visible:ring-emerald-500"
                )}
                ref={ref}
                value={internalValue}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="12.345.678-9"
                {...props}
            />
        )
    }
)

RutInput.displayName = "RutInput"

export { RutInput }
