"use client"

import { Wallet, AlertTriangle, ArrowRight, Clock, ChevronRight, CheckCircle, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { differenceInDays } from "date-fns"

interface AgentCommissionSummary {
    pending: {
        count: number
        amount: number
    }
    overdue: {
        count: number
        amount: number
    }
}

interface CommissionsWidgetProps {
    summary: {
        pending: {
            count: number
            amount: number
        }
        overdue: {
            count: number
            amount: number
        }
        upcomingDue: Array<{
            id: string
            pendingAmount: unknown
            currency: string
            dueDate: Date | null
            installment: number | null
            totalInstallments: number | null
            Policy: {
                number: string
                Client: {
                    firstName: string
                    lastName: string
                }
                InsuranceCompany: {
                    name: string
                } | null
            }
        }>
    } | null
    agentSummary?: AgentCommissionSummary | null
}

export function CommissionsWidget({ summary, agentSummary }: CommissionsWidgetProps) {
    if (!summary) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-emerald-600" />
                        </div>
                        Comisiones Pendientes
                    </h3>
                </div>
                <div className="p-6">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-emerald-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">
                            Sin comisiones pendientes
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Todas las comisiones han sido cobradas
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    const { pending, overdue, upcomingDue } = summary
    const totalAmount = pending.amount + overdue.amount

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <span>Comisiones</span>
                        <p className="text-xs font-medium text-emerald-600 mt-0.5">
                            {totalAmount.toLocaleString("es-CL", { minimumFractionDigits: 0 })} UF por cobrar
                        </p>
                    </div>
                </h3>
                <Link href="/dashboard/commissions" className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
                    Ver todas
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
            <div className="p-6 space-y-4">
                {/* Summary boxes */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 border border-amber-200/50">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-600">
                                <Clock className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Pendientes</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-700 tabular-nums">
                            {pending.amount.toLocaleString("es-CL", { minimumFractionDigits: 0 })}
                            <span className="text-sm font-semibold ml-1">UF</span>
                        </p>
                        <p className="text-xs text-amber-600 mt-1">{pending.count} comisiones</p>
                    </div>

                    <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 p-4 border border-red-200/50">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-100 text-red-600">
                                <AlertTriangle className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-semibold text-red-800 uppercase tracking-wide">Vencidas</span>
                        </div>
                        <p className="text-2xl font-bold text-red-700 tabular-nums">
                            {overdue.amount.toLocaleString("es-CL", { minimumFractionDigits: 0 })}
                            <span className="text-sm font-semibold ml-1">UF</span>
                        </p>
                        <p className="text-xs text-red-600 mt-1">{overdue.count} comisiones</p>
                    </div>
                </div>

                {/* Upcoming due list */}
                {upcomingDue.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                            Próximos Vencimientos
                        </h4>
                        <div className="space-y-2">
                            {upcomingDue.map((commission, index) => {
                                const daysUntilDue = commission.dueDate
                                    ? differenceInDays(new Date(commission.dueDate), new Date())
                                    : null

                                return (
                                    <Link
                                        key={commission.id}
                                        href={`/dashboard/commissions/${commission.id}`}
                                        className="block group"
                                    >
                                        <div
                                            className="flex items-center justify-between rounded-xl border border-slate-200/80 p-3 hover:bg-slate-50/80 hover:border-slate-300/80 transition-all"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-sm truncate">
                                                    {commission.Policy.number}
                                                    {commission.installment && (
                                                        <span className="text-muted-foreground font-normal ml-1">
                                                            ({commission.installment}/{commission.totalInstallments})
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {commission.Policy.Client.firstName} {commission.Policy.Client.lastName}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                                <div className="text-right">
                                                    <p className="font-bold text-sm tabular-nums text-emerald-700">
                                                        {Number(commission.pendingAmount).toLocaleString("es-CL", {
                                                            minimumFractionDigits: 2,
                                                        })}{" "}
                                                        <span className="text-xs font-medium">{commission.currency}</span>
                                                    </p>
                                                    {daysUntilDue !== null && (
                                                        <Badge
                                                            variant="secondary"
                                                            className={`
                                                                text-[10px] font-medium mt-0.5
                                                                ${daysUntilDue <= 3 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}
                                                            `}
                                                        >
                                                            {daysUntilDue === 0
                                                                ? "Hoy"
                                                                : daysUntilDue === 1
                                                                ? "Mañana"
                                                                : `${daysUntilDue} días`}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                )}

                {upcomingDue.length === 0 && pending.count === 0 && overdue.count === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                            <CheckCircle className="h-6 w-6 text-emerald-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">
                            Sin comisiones pendientes
                        </p>
                    </div>
                )}

                {/* Agent Commissions Section */}
                {agentSummary && (agentSummary.pending.count > 0 || agentSummary.overdue.count > 0) && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <Link
                            href="/dashboard/commissions/agents"
                            className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/50 hover:border-sky-300/50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-sky-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-sky-800">Pagos a Vendedores</p>
                                    <p className="text-xs text-sky-600">{agentSummary.pending.count + agentSummary.overdue.count} comisiones pendientes</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-sky-700">
                                    {(agentSummary.pending.amount + agentSummary.overdue.amount).toLocaleString("es-CL", { minimumFractionDigits: 0 })} UF
                                </span>
                                <ChevronRight className="h-4 w-4 text-sky-400 group-hover:text-sky-600 transition-colors" />
                            </div>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
