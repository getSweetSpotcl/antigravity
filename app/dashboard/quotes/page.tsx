import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getQuotes, getInsuranceCompanies } from "@/actions/quote"
import { getClients } from "@/actions/client"
import { QuoteList } from "@/components/quotes/quote-list"
import { CreateQuoteDialogWrapper } from "@/components/quotes/create-quote-dialog-wrapper"
import { serializeList } from "@/lib/serialize"

export default async function QuotesPage() {
    const session = await auth()

    if (!session) {
        redirect("/auth/login")
    }

    const quotesRaw = await getQuotes()
    const clients = await getClients()
    const companies = await getInsuranceCompanies()

    const serializedQuotes = serializeList(quotesRaw, 'string') as any[]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Cotizaciones</h1>
                    <p className="text-muted-foreground">
                        Gestiona las propuestas y cotizaciones para tus clientes.
                    </p>
                </div>
                <CreateQuoteDialogWrapper clients={clients} companies={companies} />
            </div>
            <QuoteList quotes={serializedQuotes} />
        </div>
    )
}
