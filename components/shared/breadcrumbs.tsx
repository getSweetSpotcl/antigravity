"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

// Route name translations
const routeNames: Record<string, string> = {
    dashboard: "Panel",
    clients: "Clientes",
    policies: "Pólizas",
    quotes: "Cotizaciones",
    claims: "Siniestros",
    companies: "Compañías",
    commissions: "Comisiones",
    renewals: "Renovaciones",
    reports: "Reportes",
    settings: "Configuración",
    admin: "Admin",
    tenants: "Inquilinos",
    plans: "Planes",
    portal: "Portal",
    messages: "Mensajes",
    new: "Nuevo",
}

interface BreadcrumbsProps {
    className?: string
    customLabels?: Record<string, string>
}

export function Breadcrumbs({ className, customLabels = {} }: BreadcrumbsProps) {
    const pathname = usePathname()

    // Generate breadcrumb items from pathname
    const generateBreadcrumbs = () => {
        const pathSegments = pathname.split("/").filter(Boolean)
        const breadcrumbs: { label: string; href: string; isCurrentPage: boolean }[] = []

        let currentPath = ""

        pathSegments.forEach((segment, index) => {
            currentPath += `/${segment}`
            const isCurrentPage = index === pathSegments.length - 1

            // Skip dynamic segments that look like IDs (e.g., UUIDs)
            const isId = segment.match(/^[a-zA-Z0-9]{20,}$/) || segment.match(/^[0-9a-f-]{36}$/i)

            // Get label from custom labels, route names, or use segment
            let label = customLabels[segment] || routeNames[segment]

            // For ID segments, try to use a descriptive label
            if (isId) {
                // Check previous segment to determine what kind of detail page this is
                const prevSegment = pathSegments[index - 1]
                switch (prevSegment) {
                    case "policies":
                        label = "Detalle de Póliza"
                        break
                    case "quotes":
                        label = "Detalle de Cotización"
                        break
                    case "claims":
                        label = "Detalle de Siniestro"
                        break
                    case "clients":
                        label = "Detalle de Cliente"
                        break
                    case "commissions":
                        label = "Detalle de Comisión"
                        break
                    case "tenants":
                        label = "Detalle de Inquilino"
                        break
                    default:
                        label = "Detalle"
                }
            }

            // Capitalize if no translation found and not an ID
            if (!label && !isId) {
                label = segment.charAt(0).toUpperCase() + segment.slice(1)
            }

            breadcrumbs.push({
                label: label || segment,
                href: currentPath,
                isCurrentPage,
            })
        })

        return breadcrumbs
    }

    const breadcrumbs = generateBreadcrumbs()

    // Don't render if we're at the root
    if (breadcrumbs.length <= 1) {
        return null
    }

    return (
        <nav
            aria-label="Breadcrumb"
            className={cn("flex items-center text-sm text-muted-foreground", className)}
        >
            <ol className="flex items-center gap-1">
                <li>
                    <Link
                        href="/dashboard"
                        className="flex items-center hover:text-foreground transition-colors"
                    >
                        <Home className="h-4 w-4" />
                        <span className="sr-only">Inicio</span>
                    </Link>
                </li>
                {breadcrumbs.slice(1).map((crumb, index) => (
                    <li key={crumb.href} className="flex items-center gap-1">
                        <ChevronRight className="h-4 w-4" />
                        {crumb.isCurrentPage ? (
                            <span
                                className="font-medium text-foreground"
                                aria-current="page"
                            >
                                {crumb.label}
                            </span>
                        ) : (
                            <Link
                                href={crumb.href}
                                className="hover:text-foreground transition-colors"
                            >
                                {crumb.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    )
}
