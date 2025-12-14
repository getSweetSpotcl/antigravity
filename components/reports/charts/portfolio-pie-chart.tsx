"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PortfolioPieChartProps {
  data: {
    type: string
    count: number
    premium: number
    percentage: string | number
  }[]
  title?: string
  description?: string
}

const COLORS = [
  "hsl(199, 89%, 48%)", // sky-500
  "hsl(160, 84%, 39%)", // emerald-500
  "hsl(262, 83%, 58%)", // violet-500
  "hsl(43, 96%, 56%)",  // amber-400
  "hsl(0, 72%, 51%)",   // red-500
  "hsl(217, 91%, 60%)", // blue-500
]

const typeLabels: Record<string, string> = {
  GENERAL: "General",
  LIFE: "Vida",
  HEALTH: "Salud",
  AUTO: "Automotriz",
  HOME: "Hogar",
  GUARANTEE: "Garantía",
}

interface ChartDataItem {
  name: string
  value: number
  count: number
  percentage: string | number
  [key: string]: string | number
}

export function PortfolioPieChart({
  data,
  title = "Distribución por Ramo",
  description = "Composición de la cartera por tipo de seguro",
}: PortfolioPieChartProps) {
  const chartData: ChartDataItem[] = data.map((item) => ({
    name: typeLabels[item.type] || item.type,
    value: item.premium,
    count: item.count,
    percentage: item.percentage,
  }))

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataItem }> }) => {
    if (active && payload && payload.length) {
      const tooltipData = payload[0].payload
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="font-medium text-slate-900 dark:text-slate-100">{tooltipData.name}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Prima: {tooltipData.value.toLocaleString("es-CL", { minimumFractionDigits: 2 })} UF
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Pólizas: {tooltipData.count}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Porcentaje: {tooltipData.percentage}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-slate-600 dark:text-slate-400">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
