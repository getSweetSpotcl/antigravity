import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PortfolioReport } from "@/components/reports/portfolio-report"
import { ProductionReportClient } from "@/components/reports/production-report-client"
import { CommissionsReportClient } from "@/components/reports/commissions-report-client"
import { ClaimsReportClient } from "@/components/reports/claims-report-client"
import { FecuReportDialog } from "@/components/reports/fecu-dialog"
import { Briefcase, TrendingUp, DollarSign, AlertTriangle, FileSpreadsheet } from "lucide-react"

export default async function ReportsPage() {
    const session = await auth()

    if (!session?.user?.tenantId) {
        redirect("/auth/login")
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Centro de Reportes</h2>
                    <p className="text-muted-foreground">
                        Genera y exporta reportes de tu corredora
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <FecuReportDialog />
                </div>
            </div>

            <Tabs defaultValue="portfolio" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none lg:flex">
                    <TabsTrigger value="portfolio" className="gap-2">
                        <Briefcase className="h-4 w-4" />
                        <span className="hidden sm:inline">Cartera</span>
                    </TabsTrigger>
                    <TabsTrigger value="production" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="hidden sm:inline">Producción</span>
                    </TabsTrigger>
                    <TabsTrigger value="commissions" className="gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="hidden sm:inline">Comisiones</span>
                    </TabsTrigger>
                    <TabsTrigger value="claims" className="gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="hidden sm:inline">Siniestralidad</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="portfolio">
                    <PortfolioReport />
                </TabsContent>

                <TabsContent value="production">
                    <ProductionReportClient />
                </TabsContent>

                <TabsContent value="commissions">
                    <CommissionsReportClient />
                </TabsContent>

                <TabsContent value="claims">
                    <ClaimsReportClient />
                </TabsContent>
            </Tabs>
        </div>
    )
}
