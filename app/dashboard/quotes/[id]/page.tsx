import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { serializeDecimal } from "@/lib/serialize"
import { QuoteDetailWrapper } from "@/components/quotes/quote-detail-wrapper"

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()

    if (!session) {
        redirect("/auth/login")
    }

    const { id } = await params

    // Get quote with policy relation
    const quoteWithPolicy = await prisma.quote.findUnique({
        where: { id },
        include: {
            Client: true,
            InsuranceCompany: true,
            Tenant: true,
            Policy: true,
            QuoteAttachment: {
                orderBy: { createdAt: "desc" },
            },
            QuoteCommunication: {
                include: {
                    CommunicationAttachment: {
                        orderBy: { createdAt: "desc" },
                    },
                },
                orderBy: { createdAt: "desc" },
            },
        },
    })

    if (!quoteWithPolicy || quoteWithPolicy.tenantId !== session.user.tenantId) {
        redirect("/dashboard/quotes")
    }

    const clients = await prisma.client.findMany({
        where: { tenantId: session.user.tenantId },
        orderBy: { createdAt: "desc" },
    })

    const companies = await prisma.insuranceCompany.findMany({
        where: { tenantId: session.user.tenantId },
        orderBy: { name: "asc" },
    })

    const serializedQuoteWithPolicy = serializeDecimal(quoteWithPolicy, 'string') as any

    return (
        <QuoteDetailWrapper
            quote={serializedQuoteWithPolicy}
            clients={clients}
            companies={companies}
            currentUser={{
                name: session.user.name || null,
                email: session.user.email || null,
            }}
        />
    )
}
