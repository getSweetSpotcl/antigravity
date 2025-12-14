import Link from "next/link"
import { AlertCircle, Calculator, Clock, Activity, ChevronRight, Briefcase } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface ActivityItem {
    type: "policy" | "claim" | "quote"
    id: string
    title: string
    description: string
    date: Date
}

interface RecentActivityProps {
    activities: ActivityItem[]
}

const getActivityConfig = (type: ActivityItem["type"]) => {
    switch (type) {
        case "policy":
            return {
                icon: <Briefcase className="h-4 w-4" />,
                bgColor: "bg-sky-100",
                textColor: "text-sky-600",
                label: "Póliza"
            }
        case "claim":
            return {
                icon: <AlertCircle className="h-4 w-4" />,
                bgColor: "bg-red-100",
                textColor: "text-red-600",
                label: "Siniestro"
            }
        case "quote":
            return {
                icon: <Calculator className="h-4 w-4" />,
                bgColor: "bg-emerald-100",
                textColor: "text-emerald-600",
                label: "Cotización"
            }
    }
}

const getActivityLink = (activity: ActivityItem) => {
    switch (activity.type) {
        case "policy":
            return `/dashboard/policies/${activity.id}`
        case "claim":
            return `/dashboard/claims/${activity.id}`
        case "quote":
            return `/dashboard/quotes/${activity.id}`
    }
}

export function RecentActivity({ activities }: RecentActivityProps) {
    if (activities.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-slate-600" />
                        </div>
                        Actividad Reciente
                    </h3>
                </div>
                <div className="p-6">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                            <Clock className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">
                            Sin actividad reciente
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Las acciones realizadas aparecerán aquí
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-slate-600" />
                    </div>
                    Actividad Reciente
                </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {activities.map((activity, index) => {
                    const config = getActivityConfig(activity.type)
                    return (
                        <Link
                            key={`${activity.type}-${activity.id}-${index}`}
                            href={getActivityLink(activity)}
                            className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                        >
                            <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${config.bgColor} ${config.textColor} flex-shrink-0`}>
                                {config.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{activity.title}</p>
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${config.bgColor} ${config.textColor}`}>
                                        {config.label}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {activity.description}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <p className="text-xs text-slate-400">
                                    {formatDistanceToNow(new Date(activity.date), {
                                        addSuffix: true,
                                        locale: es,
                                    })}
                                </p>
                                <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
