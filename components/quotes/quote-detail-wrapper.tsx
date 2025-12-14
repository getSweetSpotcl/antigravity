"use client"

import dynamic from "next/dynamic"
import type { Client, InsuranceCompany } from "@prisma/client"

// Dynamic import to avoid hydration mismatch with Radix UI Tabs
const QuoteDetailView = dynamic(
    () => import("@/components/quotes/quote-detail-view").then(mod => ({ default: mod.QuoteDetailView })),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }
)

interface QuoteDetailWrapperProps {
    quote: any
    clients: Client[]
    companies: InsuranceCompany[]
    currentUser?: {
        name: string | null
        email: string | null
    }
}

export function QuoteDetailWrapper({ quote, clients, companies, currentUser }: QuoteDetailWrapperProps) {
    return (
        <QuoteDetailView
            quote={quote}
            clients={clients}
            companies={companies}
            currentUser={currentUser}
        />
    )
}
