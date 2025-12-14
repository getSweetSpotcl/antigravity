"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { Bell, Shield, AlertTriangle, Wallet, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { getNotifications, type NotificationsData } from "@/actions/notifications"

export function NotificationsPopover() {
    const [open, setOpen] = useState(false)
    const [data, setData] = useState<NotificationsData | null>(null)
    const [isPending, startTransition] = useTransition()

    // Fetch notifications when popover opens
    useEffect(() => {
        if (open && !data) {
            startTransition(async () => {
                const notifications = await getNotifications()
                setData(notifications)
            })
        }
    }, [open, data])

    // Refresh data when popover opens (after first load)
    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (isOpen) {
            startTransition(async () => {
                const notifications = await getNotifications()
                setData(notifications)
            })
        }
    }

    const hasNotifications = data && data.total > 0

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <Bell className="h-5 w-5" />
                    {/* Notification badge */}
                    {data && data.total > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900">
                            {data.total > 9 ? "9+" : data.total}
                        </span>
                    )}
                    {!data && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sky-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                    )}
                    <span className="sr-only">Notificaciones</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 overflow-hidden" align="end">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b dark:border-slate-700">
                    <h4 className="font-semibold text-sm">Notificaciones</h4>
                    {hasNotifications && (
                        <span className="text-xs text-muted-foreground">
                            {data.total} pendiente{data.total !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>

                {/* Content */}
                {isPending && !data ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : !hasNotifications ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                            <Bell className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Sin notificaciones
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Todo al día
                        </p>
                    </div>
                ) : (
                    <div className="max-h-[400px] overflow-y-auto">
                        <div className="p-2 space-y-1 pb-2">
                            {/* Policies expiring */}
                            {data.policies.length > 0 && (
                                <NotificationSection
                                    icon={Shield}
                                    title="Pólizas por vencer"
                                    color="amber"
                                    count={data.policies.length}
                                >
                                    {data.policies.map((policy) => (
                                        <NotificationItem
                                            key={policy.id}
                                            href={`/dashboard/policies/${policy.id}`}
                                            title={policy.number}
                                            subtitle={policy.clientName}
                                            badge={`${policy.daysRemaining} días`}
                                            badgeColor="amber"
                                            onClick={() => setOpen(false)}
                                        />
                                    ))}
                                </NotificationSection>
                            )}

                            {/* Pending claims */}
                            {data.claims.length > 0 && (
                                <NotificationSection
                                    icon={AlertTriangle}
                                    title="Siniestros pendientes"
                                    color="red"
                                    count={data.claims.length}
                                >
                                    {data.claims.map((claim) => (
                                        <NotificationItem
                                            key={claim.id}
                                            href={`/dashboard/claims/${claim.id}`}
                                            title={claim.number || claim.policyNumber}
                                            subtitle={claim.clientName}
                                            badge={claim.status === "REPORTED" ? "Reportado" : "En proceso"}
                                            badgeColor={claim.status === "REPORTED" ? "amber" : "blue"}
                                            onClick={() => setOpen(false)}
                                        />
                                    ))}
                                </NotificationSection>
                            )}

                            {/* Overdue commissions */}
                            {data.commissions.length > 0 && (
                                <NotificationSection
                                    icon={Wallet}
                                    title="Comisiones vencidas"
                                    color="orange"
                                    count={data.commissions.length}
                                >
                                    {data.commissions.map((commission) => (
                                        <NotificationItem
                                            key={commission.id}
                                            href={`/dashboard/commissions/${commission.id}`}
                                            title={commission.policyNumber}
                                            subtitle={`${commission.amount.toLocaleString("es-CL", { minimumFractionDigits: 2 })} ${commission.currency}`}
                                            badge={`${commission.daysOverdue}d vencida`}
                                            badgeColor="red"
                                            onClick={() => setOpen(false)}
                                        />
                                    ))}
                                </NotificationSection>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                {hasNotifications && (
                    <div className="border-t dark:border-slate-700 p-2">
                        <Link
                            href="/dashboard/renewals"
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium text-primary hover:bg-accent rounded-md transition-colors"
                        >
                            Ver todas las alertas
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}

// Section component
interface NotificationSectionProps {
    icon: React.ElementType
    title: string
    color: "amber" | "red" | "orange" | "blue"
    count: number
    children: React.ReactNode
}

function NotificationSection({ icon: Icon, title, color, count, children }: NotificationSectionProps) {
    const colorClasses = {
        amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
        red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
        orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    }

    return (
        <div className="mb-2">
            <div className="flex items-center gap-2 px-2 py-1.5">
                <div className={`flex items-center justify-center w-6 h-6 rounded-md ${colorClasses[color]}`}>
                    <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-1">
                    {title}
                </span>
                <span className="text-xs text-muted-foreground">
                    {count}
                </span>
            </div>
            <div className="space-y-0.5">
                {children}
            </div>
        </div>
    )
}

// Item component
interface NotificationItemProps {
    href: string
    title: string
    subtitle: string
    badge: string
    badgeColor: "amber" | "red" | "orange" | "blue"
    onClick?: () => void
}

function NotificationItem({ href, title, subtitle, badge, badgeColor, onClick }: NotificationItemProps) {
    const badgeClasses = {
        amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
        red: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
        orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400",
        blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
    }

    return (
        <Link
            href={href}
            onClick={onClick}
            className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-accent transition-colors group"
        >
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{title}</p>
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badgeClasses[badgeColor]}`}>
                    {badge}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
            </div>
        </Link>
    )
}
