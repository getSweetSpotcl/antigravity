"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { startOfMonth, endOfMonth, format } from "date-fns"

export interface FecuRow {
    rutCorredor: string
    rutCompania: string
    nroPoliza: string
    rutAsegurado: string
    nombreAsegurado: string
    ramo: string
    inicioVigencia: string
    finVigencia: string
    moneda: string
    primaNeta: number
    comision: number
    tipoMovimiento: string
}

export const generateFecuReport = async (month: number, year: number): Promise<FecuRow[]> => {
    const session = await auth()

    if (!session || !session.user?.tenantId) {
        throw new Error("No autorizado")
    }

    const startDate = startOfMonth(new Date(year, month))
    const endDate = endOfMonth(new Date(year, month))

    // Obtener tenant para el RUT del corredor
    const tenant = await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
    })

    if (!tenant) throw new Error("Tenant no encontrado")

    // Obtener pólizas del mes (creadas o renovadas)
    // Nota: En un sistema real FECU, se reportan movimientos. Aquí usaremos fecha de creación o inicio.
    const policies = await prisma.policy.findMany({
        where: {
            tenantId: session.user.tenantId,
            OR: [
                {
                    startDate: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                {
                    // También incluir renovaciones que ocurran en este mes
                    status: "RENEWED",
                    updatedAt: {
                        gte: startDate,
                        lte: endDate,
                    }
                }
            ]
        },
        include: {
            Client: true,
            InsuranceCompany: true,
        },
    })

    const fecuRows: FecuRow[] = policies.map((policy: any) => {
        return {
            rutCorredor: tenant.rut || "S/I",
            rutCompania: policy.InsuranceCompany?.rut || "S/I",
            nroPoliza: policy.number,
            rutAsegurado: policy.Client.rut,
            nombreAsegurado: `${policy.Client.firstName} ${policy.Client.lastName}`,
            ramo: policy.type,
            inicioVigencia: format(policy.startDate, "dd/MM/yyyy"),
            finVigencia: format(policy.endDate, "dd/MM/yyyy"),
            moneda: policy.currency,
            primaNeta: Number(policy.premium),
            comision: Number(policy.commission),
            tipoMovimiento: policy.status === "RENEWED" ? "RENOVACION" : "NUEVO",
        }
    })

    return fecuRows
}
