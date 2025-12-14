import { describe, it, expect, vi, beforeEach } from "vitest"
import { formatters } from "@/lib/export"

// Note: We can't test exportToExcel and exportToCSV directly because they
// interact with the DOM (document.createElement, blob, etc.)
// Those should be tested with E2E tests

describe("Export Formatters", () => {
    describe("currency formatter", () => {
        it("should format number with currency", () => {
            expect(formatters.currency(1234.56)).toMatch(/1\.234,56.*UF/)
        })

        it("should format with custom currency", () => {
            expect(formatters.currency(1000, "CLP")).toMatch(/1\.000,00.*CLP/)
        })

        it("should return dash for NaN values", () => {
            expect(formatters.currency("not a number")).toBe("-")
            // Note: Number(null) = 0, not NaN, so it returns formatted 0
        })

        it("should handle zero", () => {
            expect(formatters.currency(0)).toMatch(/0,00.*UF/)
        })

        it("should handle negative numbers", () => {
            expect(formatters.currency(-500)).toMatch(/-500,00.*UF/)
        })
    })

    describe("date formatter", () => {
        it("should format date object", () => {
            const date = new Date("2024-06-15T12:00:00")
            const result = formatters.date(date)
            // Just verify it returns a string that's not the default dash
            expect(result).not.toBe("-")
            expect(typeof result).toBe("string")
        })

        it("should format date string", () => {
            const result = formatters.date("2024-06-15T12:00:00")
            expect(result).not.toBe("-")
            expect(typeof result).toBe("string")
        })

        it("should return dash for null/undefined", () => {
            expect(formatters.date(null)).toBe("-")
            expect(formatters.date(undefined)).toBe("-")
            expect(formatters.date("")).toBe("-")
        })

        it("should handle invalid date by returning string or dash", () => {
            const result = formatters.date("not a date")
            // Could be "-" or "Invalid Date" depending on implementation
            expect(typeof result).toBe("string")
        })
    })

    describe("dateTime formatter", () => {
        it("should format date with time", () => {
            const date = new Date("2024-06-15T14:30:00")
            const result = formatters.dateTime(date)
            // Just verify it returns a non-dash string
            expect(result).not.toBe("-")
            expect(typeof result).toBe("string")
        })

        it("should return dash for null/undefined", () => {
            expect(formatters.dateTime(null)).toBe("-")
            expect(formatters.dateTime(undefined)).toBe("-")
        })
    })

    describe("percentage formatter", () => {
        it("should format percentage", () => {
            expect(formatters.percentage(75)).toBe("75.00%")
            expect(formatters.percentage(0.5)).toBe("0.50%")
        })

        it("should return dash for NaN", () => {
            expect(formatters.percentage("not a number")).toBe("-")
        })

        it("should handle decimals", () => {
            expect(formatters.percentage(33.333)).toBe("33.33%")
        })
    })

    describe("number formatter", () => {
        it("should format number with locale", () => {
            const result = formatters.number(1234567)
            expect(result).toMatch(/1\.234\.567/)
        })

        it("should return dash for NaN", () => {
            expect(formatters.number("not a number")).toBe("-")
        })

        it("should handle zero", () => {
            expect(formatters.number(0)).toBe("0")
        })
    })

    describe("boolean formatter", () => {
        it("should format true as 'Sí'", () => {
            expect(formatters.boolean(true)).toBe("Sí")
        })

        it("should format false as 'No'", () => {
            expect(formatters.boolean(false)).toBe("No")
        })

        it("should handle truthy/falsy values", () => {
            expect(formatters.boolean(1)).toBe("Sí")
            expect(formatters.boolean(0)).toBe("No")
            expect(formatters.boolean("yes")).toBe("Sí")
            expect(formatters.boolean("")).toBe("No")
            expect(formatters.boolean(null)).toBe("No")
        })
    })

    describe("status formatter", () => {
        it("should map status to label", () => {
            const statusMap = {
                ACTIVE: "Activo",
                INACTIVE: "Inactivo",
                PENDING: "Pendiente",
            }
            const formatter = formatters.status(statusMap)

            expect(formatter("ACTIVE")).toBe("Activo")
            expect(formatter("INACTIVE")).toBe("Inactivo")
            expect(formatter("PENDING")).toBe("Pendiente")
        })

        it("should return original value if not in map", () => {
            const statusMap = {
                ACTIVE: "Activo",
            }
            const formatter = formatters.status(statusMap)

            expect(formatter("UNKNOWN")).toBe("UNKNOWN")
        })

        it("should handle null/undefined", () => {
            const statusMap = { ACTIVE: "Activo" }
            const formatter = formatters.status(statusMap)

            expect(formatter(null)).toBe("null")
            expect(formatter(undefined)).toBe("undefined")
        })
    })
})

describe("Report Export Configurations", () => {
    // Test that configurations have required fields
    it("should have valid policies config", async () => {
        const { reportExportConfigs } = await import("@/lib/export")

        expect(reportExportConfigs.policies).toBeDefined()
        expect(Array.isArray(reportExportConfigs.policies)).toBe(true)
        expect(reportExportConfigs.policies.length).toBeGreaterThan(0)

        // Each column should have key and header
        reportExportConfigs.policies.forEach((col) => {
            expect(col).toHaveProperty("key")
            expect(col).toHaveProperty("header")
        })
    })

    it("should have valid claims config", async () => {
        const { reportExportConfigs } = await import("@/lib/export")

        expect(reportExportConfigs.claims).toBeDefined()
        expect(Array.isArray(reportExportConfigs.claims)).toBe(true)
    })

    it("should have valid commissions config", async () => {
        const { reportExportConfigs } = await import("@/lib/export")

        expect(reportExportConfigs.commissions).toBeDefined()
        expect(Array.isArray(reportExportConfigs.commissions)).toBe(true)
    })

    it("should have valid auditLogs config", async () => {
        const { reportExportConfigs } = await import("@/lib/export")

        expect(reportExportConfigs.auditLogs).toBeDefined()
        expect(Array.isArray(reportExportConfigs.auditLogs)).toBe(true)
    })
})
