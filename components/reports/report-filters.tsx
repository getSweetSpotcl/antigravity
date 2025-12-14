"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { CalendarIcon, Download } from "lucide-react"
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface ReportFiltersProps {
    onDateRangeChange: (startDate: Date, endDate: Date) => void
    onExport?: (format: "excel" | "pdf") => void
    showExport?: boolean
    isLoading?: boolean
}

export function ReportFilters({
    onDateRangeChange,
    onExport,
    showExport = true,
    isLoading = false,
}: ReportFiltersProps) {
    const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()))
    const [endDate, setEndDate] = useState<Date>(new Date())
    const [preset, setPreset] = useState<string>("this-month")

    const handlePresetChange = (value: string) => {
        setPreset(value)
        const now = new Date()
        let start: Date
        let end: Date = now

        switch (value) {
            case "today":
                start = now
                break
            case "last-7":
                start = subDays(now, 7)
                break
            case "last-30":
                start = subDays(now, 30)
                break
            case "this-month":
                start = startOfMonth(now)
                break
            case "last-month":
                start = startOfMonth(subMonths(now, 1))
                end = endOfMonth(subMonths(now, 1))
                break
            case "last-3-months":
                start = subMonths(now, 3)
                break
            case "this-year":
                start = startOfYear(now)
                break
            case "last-year":
                start = startOfYear(subMonths(now, 12))
                end = new Date(now.getFullYear() - 1, 11, 31)
                break
            default:
                start = startOfMonth(now)
        }

        setStartDate(start)
        setEndDate(end)
        onDateRangeChange(start, end)
    }

    const handleStartDateChange = (date: Date | undefined) => {
        if (date) {
            setStartDate(date)
            setPreset("custom")
            onDateRangeChange(date, endDate)
        }
    }

    const handleEndDateChange = (date: Date | undefined) => {
        if (date) {
            setEndDate(date)
            setPreset("custom")
            onDateRangeChange(startDate, date)
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/40 rounded-lg border">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Período:</span>
                <Select value={preset} onValueChange={handlePresetChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Seleccionar período" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Hoy</SelectItem>
                        <SelectItem value="last-7">Últimos 7 días</SelectItem>
                        <SelectItem value="last-30">Últimos 30 días</SelectItem>
                        <SelectItem value="this-month">Este mes</SelectItem>
                        <SelectItem value="last-month">Mes anterior</SelectItem>
                        <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
                        <SelectItem value="this-year">Este año</SelectItem>
                        <SelectItem value="last-year">Año anterior</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-[130px] justify-start text-left font-normal",
                                !startDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "dd/MM/yyyy") : "Desde"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={handleStartDateChange}
                            locale={es}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                <span className="text-muted-foreground">-</span>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-[130px] justify-start text-left font-normal",
                                !endDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "dd/MM/yyyy") : "Hasta"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={handleEndDateChange}
                            locale={es}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {showExport && onExport && (
                <div className="flex items-center gap-2 ml-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onExport("excel")}
                        disabled={isLoading}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Excel
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onExport("pdf")}
                        disabled={isLoading}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                    </Button>
                </div>
            )}
        </div>
    )
}
