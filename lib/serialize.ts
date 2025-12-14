/**
 * Utility to serialize Prisma Decimal objects to plain values
 * for passing from Server Components to Client Components
 */

type SerializableValue = string | number | boolean | null | undefined | Date | SerializableObject | SerializableValue[]

interface SerializableObject {
    [key: string]: SerializableValue
}

type ConvertTo = 'number' | 'string'

/**
 * Recursively converts Decimal objects in an object
 * @param obj - Object to serialize
 * @param convertTo - Convert Decimals to 'number' (default) or 'string'
 */
export function serializeDecimal<T>(obj: T, convertTo: ConvertTo = 'number'): T {
    if (obj === null || obj === undefined) {
        return obj
    }

    if (Array.isArray(obj)) {
        return obj.map(item => serializeDecimal(item, convertTo)) as T
    }

    if (obj instanceof Date) {
        return obj as T
    }

    if (typeof obj === 'object') {
        // Check if it's a Decimal-like object (has toNumber method)
        if ('toNumber' in obj && typeof (obj as any).toNumber === 'function') {
            return (convertTo === 'string' ? String(obj) : (obj as any).toNumber()) as T
        }

        // Check if it's a Decimal-like object (Prisma Decimal)
        if (obj.constructor?.name === 'Decimal' || obj.constructor?.name === 'e') {
            return (convertTo === 'string' ? String(obj) : Number(obj)) as T
        }

        const result: Record<string, unknown> = {}
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[key] = serializeDecimal((obj as Record<string, unknown>)[key], convertTo)
            }
        }
        return result as T
    }

    return obj
}

/**
 * Serialize an array of objects with Decimal fields
 * @param items - Array of items to serialize
 * @param convertTo - Convert Decimals to 'number' (default) or 'string'
 */
export function serializeList<T>(items: T[], convertTo: ConvertTo = 'number'): T[] {
    return items.map(item => serializeDecimal(item, convertTo))
}
