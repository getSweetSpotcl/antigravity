"use client"

import {
  TrendingUp,
  TrendingDown,
  Minus,
  FileCheck,
  FileText,
  AlertTriangle,
  Wallet,
  Users,
  Building2,
  Calendar,
  DollarSign,
} from "lucide-react"
import { cn } from "@/lib/utils"

const iconMap = {
  FileCheck,
  FileText,
  AlertTriangle,
  Wallet,
  Users,
  Building2,
  Calendar,
  DollarSign,
} as const

type IconName = keyof typeof iconMap

interface StatCardProps {
  title: string
  value: string | number
  icon: IconName
  trend?: {
    value: number
    label?: string
  }
  iconBgColor?: string
  iconColor?: string
  className?: string
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  iconBgColor = "bg-sky-100 dark:bg-sky-900/30",
  iconColor = "text-sky-600 dark:text-sky-400",
  className,
}: StatCardProps) {
  const Icon = iconMap[icon]
  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.value > 0) return <TrendingUp className="h-4 w-4" />
    if (trend.value < 0) return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const getTrendColor = () => {
    if (!trend) return ""
    if (trend.value > 0) return "text-emerald-600 dark:text-emerald-400"
    if (trend.value < 0) return "text-red-600 dark:text-red-400"
    return "text-slate-500 dark:text-slate-400"
  }

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm transition-colors",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            iconBgColor
          )}
        >
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
        {trend && (
          <span
            className={cn(
              "text-sm font-medium flex items-center gap-1",
              getTrendColor()
            )}
          >
            {getTrendIcon()}
            {trend.value > 0 ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        {value}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{title}</p>
    </div>
  )
}
