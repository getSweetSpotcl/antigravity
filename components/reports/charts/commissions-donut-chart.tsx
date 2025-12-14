"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CommissionsDonutChartProps {
  paidAmount: number
  pendingAmount: number
  title?: string
  description?: string
}

const COLORS = {
  paid: "hsl(160, 84%, 39%)",    // emerald
  pending: "hsl(43, 96%, 56%)",  // amber
}

export function CommissionsDonutChart({
  paidAmount,
  pendingAmount,
  title = "Cobrado vs Pendiente",
  description = "Estado de cobro de comisiones",
}: CommissionsDonutChartProps) {
  const total = paidAmount + pendingAmount
  const paidPercentage = total > 0 ? Math.round((paidAmount / total) * 100) : 0
  const pendingPercentage = total > 0 ? Math.round((pendingAmount / total) * 100) : 0

  const chartData = [
    { name: "Cobrado", value: paidAmount, percentage: paidPercentage },
    { name: "Pendiente", value: pendingAmount, percentage: pendingPercentage },
  ]

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="font-medium text-slate-900 dark:text-slate-100">{data.name}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {data.value.toLocaleString("es-CL", { minimumFractionDigits: 2 })} UF
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {data.percentage}% del total
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
        <div className="h-[250px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                <Cell fill={COLORS.paid} />
                <Cell fill={COLORS.pending} />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {paidPercentage}%
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">Cobrado</span>
          </div>
        </div>
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.paid }} />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Cobrado: {paidAmount.toLocaleString("es-CL", { minimumFractionDigits: 2 })} UF
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.pending }} />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Pendiente: {pendingAmount.toLocaleString("es-CL", { minimumFractionDigits: 2 })} UF
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
