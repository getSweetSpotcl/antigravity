"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CommissionsBarChartProps {
  data: {
    status: string
    count: number
    amount: number
  }[]
  title?: string
  description?: string
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  PAID: "Pagado",
}

const statusColors: Record<string, string> = {
  PENDING: "hsl(43, 96%, 56%)",  // amber
  PARTIAL: "hsl(217, 91%, 60%)", // blue
  PAID: "hsl(160, 84%, 39%)",    // emerald
}

export function CommissionsBarChart({
  data,
  title = "Comisiones por Estado",
  description = "Distribución de comisiones según su estado de cobro",
}: CommissionsBarChartProps) {
  const chartData = data.map((item) => ({
    name: statusLabels[item.status] || item.status,
    monto: item.amount,
    cantidad: item.count,
    fill: statusColors[item.status] || "hsl(215, 16%, 47%)",
  }))

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="font-medium text-slate-900 dark:text-slate-100">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-slate-600 dark:text-slate-400">
              {entry.name === "monto" ? "Monto" : "Cantidad"}:{" "}
              {entry.name === "monto"
                ? `${entry.value.toLocaleString("es-CL", { minimumFractionDigits: 2 })} UF`
                : entry.value}
            </p>
          ))}
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
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis
                dataKey="name"
                tick={{ fill: "currentColor" }}
                className="text-slate-600 dark:text-slate-400"
              />
              <YAxis
                tick={{ fill: "currentColor" }}
                className="text-slate-600 dark:text-slate-400"
                tickFormatter={(value) => `${value.toLocaleString("es-CL")} UF`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="monto"
                radius={[4, 4, 0, 0]}
                fill="hsl(199, 89%, 48%)"
              >
                {chartData.map((entry, index) => (
                  <rect key={`rect-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
