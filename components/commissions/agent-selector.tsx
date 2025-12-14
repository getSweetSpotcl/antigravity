"use client"

import { useEffect, useState } from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getAgents } from "@/actions/user"
import { User } from "lucide-react"

interface Agent {
    id: string
    name: string | null
    email: string
    role: string
    defaultCommissionPercentage: number | null
}

interface AgentSelectorProps {
    value?: string
    onValueChange: (value: string | undefined) => void
    label?: string
    placeholder?: string
    showCommission?: boolean
    disabled?: boolean
}

export function AgentSelector({
    value,
    onValueChange,
    label = "Vendedor asignado",
    placeholder = "Seleccionar vendedor (opcional)",
    showCommission = true,
    disabled = false,
}: AgentSelectorProps) {
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadAgents = async () => {
            try {
                const data = await getAgents()
                setAgents(data as Agent[])
            } catch (error) {
                console.error("Error loading agents:", error)
            } finally {
                setLoading(false)
            }
        }
        loadAgents()
    }, [])

    const selectedAgent = agents.find((a) => a.id === value)

    return (
        <div className="space-y-2">
            {label && <Label className="text-slate-700">{label}</Label>}
            <Select
                value={value || ""}
                onValueChange={(val) => onValueChange(val === "" ? undefined : val)}
                disabled={disabled || loading}
            >
                <SelectTrigger className="bg-white">
                    <SelectValue placeholder={loading ? "Cargando..." : placeholder}>
                        {selectedAgent ? (
                            <span className="flex items-center gap-2">
                                <User className="h-4 w-4 text-slate-400" />
                                {selectedAgent.name || selectedAgent.email}
                            </span>
                        ) : null}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">Sin vendedor asignado</SelectItem>
                    {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                            <div className="flex flex-col">
                                <span className="font-medium">
                                    {agent.name || agent.email}
                                </span>
                                {showCommission && agent.defaultCommissionPercentage && (
                                    <span className="text-xs text-slate-500">
                                        Comisión: {Number(agent.defaultCommissionPercentage)}%
                                    </span>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {showCommission && selectedAgent?.defaultCommissionPercentage && (
                <p className="text-xs text-slate-500">
                    Este vendedor tiene una comisión por defecto del{" "}
                    <span className="font-medium">
                        {Number(selectedAgent.defaultCommissionPercentage)}%
                    </span>{" "}
                    sobre la comisión de corredora.
                </p>
            )}
        </div>
    )
}
