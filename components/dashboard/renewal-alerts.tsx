import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ArrowRight, Calendar, Clock, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface RenewalAlert {
    id: string
    number: string
    clientName: string
    company: string
    endDate: Date
    daysRemaining: number
    type: string
}

interface RenewalAlertsProps {
    alerts: RenewalAlert[]
}

export function RenewalAlerts({ alerts }: RenewalAlertsProps) {
    if (alerts.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-sky-600" />
                        </div>
                        Próximas Renovaciones
                    </h3>
                </div>
                <div className="p-6">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                            <Clock className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">
                            Sin renovaciones pendientes
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            No hay pólizas por vencer en los próximos 30 días
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    const criticalCount = alerts.filter((a) => a.daysRemaining <= 7).length

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${criticalCount > 0 ? "bg-amber-100" : "bg-sky-100"}`}>
                        {criticalCount > 0 ? (
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                        ) : (
                            <Calendar className="h-5 w-5 text-sky-600" />
                        )}
                    </div>
                    <div>
                        <span>Próximas Renovaciones</span>
                        {criticalCount > 0 && (
                            <p className="text-xs font-medium text-amber-600 mt-0.5">
                                {criticalCount} {criticalCount > 1 ? "vencen" : "vence"} esta semana
                            </p>
                        )}
                    </div>
                </h3>
                <Link href="/dashboard/renewals" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1">
                    Ver todas
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {alerts.map((alert, index) => (
                    <Link
                        key={alert.id}
                        href={`/dashboard/policies/${alert.id}`}
                        className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`
                                w-2 h-2 rounded-full flex-shrink-0
                                ${alert.daysRemaining <= 7 ? "bg-red-500" :
                                  alert.daysRemaining <= 15 ? "bg-amber-500" : "bg-sky-500"}
                            `} />
                            <div className="min-w-0">
                                <p className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate">{alert.number}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {alert.clientName}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                                <span className={`
                                    px-2 py-1 rounded-full text-xs font-medium
                                    ${alert.daysRemaining <= 7 ? "bg-red-100 text-red-700" :
                                      alert.daysRemaining <= 15 ? "bg-amber-100 text-amber-700" :
                                      "bg-sky-100 text-sky-700"}
                                `}>
                                    {alert.daysRemaining} días
                                </span>
                                <p className="text-xs text-slate-400 mt-1">
                                    {format(new Date(alert.endDate), "dd MMM", { locale: es })}
                                </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
