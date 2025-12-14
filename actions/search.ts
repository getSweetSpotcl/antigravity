"use server"

import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export interface SearchResult {
    id: string
    type: "client" | "policy" | "claim" | "quote" | "company"
    title: string
    subtitle: string
    url: string
    metadata?: Record<string, string>
}

export interface SearchResults {
    clients: SearchResult[]
    policies: SearchResult[]
    claims: SearchResult[]
    quotes: SearchResult[]
    companies: SearchResult[]
    total: number
}

export async function globalSearch(query: string): Promise<SearchResults> {
    const tenantId = await getTenantContext()

    if (!tenantId) {
        return {
            clients: [],
            policies: [],
            claims: [],
            quotes: [],
            companies: [],
            total: 0,
        }
    }

    if (!query || query.length < 2) {
        return {
            clients: [],
            policies: [],
            claims: [],
            quotes: [],
            companies: [],
            total: 0,
        }
    }

    const searchTerm = query.toLowerCase()

    // Search in parallel for better performance
    const [clients, policies, claims, quotes, companies] = await Promise.all([
        // Search clients
        prisma.client.findMany({
            where: {
                tenantId,
                OR: [
                    { firstName: { contains: searchTerm, mode: "insensitive" } },
                    { lastName: { contains: searchTerm, mode: "insensitive" } },
                    { rut: { contains: searchTerm, mode: "insensitive" } },
                    { email: { contains: searchTerm, mode: "insensitive" } },
                    { phone: { contains: searchTerm, mode: "insensitive" } },
                ],
            },
            take: 5,
            orderBy: { updatedAt: "desc" },
        }),

        // Search policies
        prisma.policy.findMany({
            where: {
                tenantId,
                OR: [
                    { number: { contains: searchTerm, mode: "insensitive" } },
                    { Client: { firstName: { contains: searchTerm, mode: "insensitive" } } },
                    { Client: { lastName: { contains: searchTerm, mode: "insensitive" } } },
                    { company: { contains: searchTerm, mode: "insensitive" } },
                ],
            },
            include: {
                Client: { select: { firstName: true, lastName: true } },
                InsuranceCompany: { select: { name: true } },
            },
            take: 5,
            orderBy: { updatedAt: "desc" },
        }),

        // Search claims
        prisma.claim.findMany({
            where: {
                tenantId,
                OR: [
                    { number: { contains: searchTerm, mode: "insensitive" } },
                    { description: { contains: searchTerm, mode: "insensitive" } },
                    { Policy: { Client: { firstName: { contains: searchTerm, mode: "insensitive" } } } },
                    { Policy: { Client: { lastName: { contains: searchTerm, mode: "insensitive" } } } },
                    { Policy: { number: { contains: searchTerm, mode: "insensitive" } } },
                ],
            },
            include: {
                Policy: {
                    select: {
                        number: true,
                        Client: { select: { firstName: true, lastName: true } },
                    },
                },
            },
            take: 5,
            orderBy: { updatedAt: "desc" },
        }),

        // Search quotes
        prisma.quote.findMany({
            where: {
                tenantId,
                OR: [
                    { quoteNumber: { contains: searchTerm, mode: "insensitive" } },
                    { prospectName: { contains: searchTerm, mode: "insensitive" } },
                    { contractorName: { contains: searchTerm, mode: "insensitive" } },
                    { contractorRut: { contains: searchTerm, mode: "insensitive" } },
                    { contractorEmail: { contains: searchTerm, mode: "insensitive" } },
                    { insuredName: { contains: searchTerm, mode: "insensitive" } },
                    { insuredRut: { contains: searchTerm, mode: "insensitive" } },
                ],
            },
            include: {
                InsuranceCompany: { select: { name: true } },
            },
            take: 5,
            orderBy: { updatedAt: "desc" },
        }),

        // Search insurance companies
        prisma.insuranceCompany.findMany({
            where: {
                tenantId,
                OR: [
                    { name: { contains: searchTerm, mode: "insensitive" } },
                    { rut: { contains: searchTerm, mode: "insensitive" } },
                ],
            },
            take: 5,
            orderBy: { name: "asc" },
        }),
    ])

    const results: SearchResults = {
        clients: clients.map((client) => {
            const fullName = `${client.firstName} ${client.lastName}`
            return {
                id: client.id,
                type: "client" as const,
                title: fullName,
                subtitle: client.rut || client.email || "",
                url: `/dashboard/clients?search=${encodeURIComponent(fullName)}`,
                metadata: {
                    email: client.email || "",
                    phone: client.phone || "",
                },
            }
        }),

        policies: policies.map((policy) => ({
            id: policy.id,
            type: "policy" as const,
            title: `Póliza ${policy.number}`,
            subtitle: `${policy.Client.firstName} ${policy.Client.lastName} - ${policy.InsuranceCompany?.name || policy.company}`,
            url: `/dashboard/policies/${policy.id}`,
            metadata: {
                type: policy.type,
                status: policy.status,
            },
        })),

        claims: claims.map((claim) => ({
            id: claim.id,
            type: "claim" as const,
            title: claim.number ? `Siniestro ${claim.number}` : `Siniestro ${claim.id.slice(0, 8)}`,
            subtitle: `${claim.Policy.Client.firstName} ${claim.Policy.Client.lastName} - Póliza ${claim.Policy.number}`,
            url: `/dashboard/claims/${claim.id}`,
            metadata: {
                status: claim.status,
            },
        })),

        quotes: quotes.map((quote) => {
            const clientName = quote.contractorName || quote.insuredName || quote.prospectName || "Sin nombre"
            return {
                id: quote.id,
                type: "quote" as const,
                title: quote.quoteNumber ? `Cotización ${quote.quoteNumber}` : `Cotización ${quote.id.slice(0, 8)}`,
                subtitle: `${clientName} - ${quote.InsuranceCompany?.name || "Sin compañía"}`,
                url: `/dashboard/quotes/${quote.id}`,
                metadata: {
                    status: quote.status,
                },
            }
        }),

        companies: companies.map((company) => ({
            id: company.id,
            type: "company" as const,
            title: company.name,
            subtitle: company.rut || "",
            url: `/dashboard/companies?search=${encodeURIComponent(company.name)}`,
        })),

        total:
            clients.length + policies.length + claims.length + quotes.length + companies.length,
    }

    return results
}

// Get recent searches from local storage (client-side) - this is just for type definition
export interface RecentSearch {
    query: string
    timestamp: number
    resultCount: number
}

// Quick navigation items
export interface QuickAction {
    id: string
    title: string
    description: string
    url: string
    shortcut?: string
    icon: string
}
