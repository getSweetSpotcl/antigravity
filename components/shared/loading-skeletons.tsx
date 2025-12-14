"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Table skeleton
interface TableSkeletonProps {
    rows?: number
    columns?: number
    className?: string
    showHeader?: boolean
}

export function TableSkeleton({
    rows = 5,
    columns = 5,
    className,
    showHeader = true,
}: TableSkeletonProps) {
    return (
        <div className={cn("w-full", className)}>
            {showHeader && (
                <div className="flex gap-4 p-4 border-b">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton key={i} className="h-4 flex-1" />
                    ))}
                </div>
            )}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4 p-4 border-b last:border-0">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={colIndex} className="h-4 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    )
}

// Card skeleton
interface CardSkeletonProps {
    className?: string
    showHeader?: boolean
    headerLines?: number
    contentLines?: number
}

export function CardSkeleton({
    className,
    showHeader = true,
    headerLines = 1,
    contentLines = 3,
}: CardSkeletonProps) {
    return (
        <Card className={className}>
            {showHeader && (
                <CardHeader>
                    {Array.from({ length: headerLines }).map((_, i) => (
                        <Skeleton key={i} className={cn("h-5", i === 0 ? "w-1/3" : "w-1/4")} />
                    ))}
                </CardHeader>
            )}
            <CardContent className="space-y-3">
                {Array.from({ length: contentLines }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className="h-4"
                        style={{ width: `${Math.random() * 40 + 60}%` }}
                    />
                ))}
            </CardContent>
        </Card>
    )
}

// Stats card skeleton
interface StatsSkeletonProps {
    count?: number
    className?: string
}

export function StatsSkeleton({ count = 4, className }: StatsSkeletonProps) {
    return (
        <div className={cn("grid gap-4", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-7 w-20 mb-1" />
                        <Skeleton className="h-3 w-16" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

// Detail page skeleton
export function DetailPageSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <CardSkeleton key={i} contentLines={2} />
                ))}
            </div>

            {/* Content */}
            <div className="grid gap-6 md:grid-cols-2">
                <CardSkeleton contentLines={5} />
                <CardSkeleton contentLines={5} />
            </div>
        </div>
    )
}

// List page skeleton
export function ListPageSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <TableSkeleton rows={10} columns={6} />
                </CardContent>
            </Card>
        </div>
    )
}

// Form skeleton
interface FormSkeletonProps {
    fields?: number
    columns?: 1 | 2
    className?: string
}

export function FormSkeleton({ fields = 6, columns = 2, className }: FormSkeletonProps) {
    return (
        <div
            className={cn(
                "grid gap-4",
                columns === 2 ? "md:grid-cols-2" : "grid-cols-1",
                className
            )}
        >
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
        </div>
    )
}

// Dashboard skeleton
export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>

            {/* Stats */}
            <StatsSkeleton
                count={4}
                className="md:grid-cols-2 lg:grid-cols-4"
            />

            {/* Charts and tables */}
            <div className="grid gap-6 md:grid-cols-2">
                <CardSkeleton contentLines={8} />
                <CardSkeleton contentLines={8} />
            </div>

            <CardSkeleton contentLines={10} />
        </div>
    )
}

// Avatar skeleton
interface AvatarSkeletonProps {
    size?: "sm" | "md" | "lg"
    showName?: boolean
    className?: string
}

export function AvatarSkeleton({ size = "md", showName = false, className }: AvatarSkeletonProps) {
    const sizeClasses = {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12",
    }

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <Skeleton className={cn("rounded-full", sizeClasses[size])} />
            {showName && (
                <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
            )}
        </div>
    )
}
