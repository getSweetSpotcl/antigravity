import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  getPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  updatePolicyStatus
} from "@/actions/policy"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Policy Actions", () => {
  const mockTenantId = "test-tenant-id"
  const mockPolicyId = "policy-123"

  const mockPolicy = {
    id: mockPolicyId,
    number: "POL-001",
    company: "Compañía de Seguros Test",
    companyId: "company-123",
    agentId: "agent-123",
    type: "GENERAL",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2025-01-01"),
    premium: 100,
    commission: 10,
    currency: "UF",
    clientId: "client-123",
    tenantId: mockTenantId,
    status: "ACTIVE",
    insuredProperty: "Propiedad Test",
    coverages: "Cobertura completa",
    deductibles: "10%",
    createdAt: new Date(),
    updatedAt: new Date(),
    quoteId: null,
    originalPolicyId: null,
    renewalNumber: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue(mockTenantId)
  })

  describe("getPolicies", () => {
    it("should return empty array when no tenant context", async () => {
      vi.mocked(getTenantContext).mockResolvedValueOnce(null)

      const result = await getPolicies()

      expect(result).toEqual([])
    })

    it("should return policies for tenant", async () => {
      const mockPolicies = [mockPolicy]
      vi.mocked(prisma.policy.findMany).mockResolvedValueOnce(mockPolicies as any)

      const result = await getPolicies()

      expect(result).toEqual(mockPolicies)
      expect(prisma.policy.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        include: expect.any(Object),
        orderBy: { createdAt: "desc" },
      })
    })

    it("should apply status filter", async () => {
      vi.mocked(prisma.policy.findMany).mockResolvedValueOnce([])

      await getPolicies({ status: "ACTIVE" })

      expect(prisma.policy.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId, status: "ACTIVE" },
        include: expect.any(Object),
        orderBy: { createdAt: "desc" },
      })
    })

    it("should apply type filter", async () => {
      vi.mocked(prisma.policy.findMany).mockResolvedValueOnce([])

      await getPolicies({ type: "AUTO" })

      expect(prisma.policy.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId, type: "AUTO" },
        include: expect.any(Object),
        orderBy: { createdAt: "desc" },
      })
    })

    it("should apply multiple filters", async () => {
      vi.mocked(prisma.policy.findMany).mockResolvedValueOnce([])

      await getPolicies({ status: "ACTIVE", type: "LIFE", clientId: "client-1" })

      expect(prisma.policy.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          status: "ACTIVE",
          type: "LIFE",
          clientId: "client-1",
        },
        include: expect.any(Object),
        orderBy: { createdAt: "desc" },
      })
    })
  })

  describe("getPolicyById", () => {
    it("should return null when no tenant context", async () => {
      vi.mocked(getTenantContext).mockResolvedValueOnce(null)

      const result = await getPolicyById(mockPolicyId)

      expect(result).toBeNull()
    })

    it("should return null when policy not found", async () => {
      vi.mocked(prisma.policy.findUnique).mockResolvedValueOnce(null)

      const result = await getPolicyById(mockPolicyId)

      expect(result).toBeNull()
    })

    it("should return null when policy belongs to different tenant", async () => {
      vi.mocked(prisma.policy.findUnique).mockResolvedValueOnce({
        ...mockPolicy,
        tenantId: "different-tenant",
      } as any)

      const result = await getPolicyById(mockPolicyId)

      expect(result).toBeNull()
    })

    it("should return policy when found and tenant matches", async () => {
      vi.mocked(prisma.policy.findUnique).mockResolvedValueOnce(mockPolicy as any)

      const result = await getPolicyById(mockPolicyId)

      expect(result).toEqual(mockPolicy)
      expect(prisma.policy.findUnique).toHaveBeenCalledWith({
        where: { id: mockPolicyId },
        include: expect.any(Object),
      })
    })
  })

  describe("createPolicy", () => {
    const validPolicyData = {
      number: "POL-002",
      company: "Nueva Compañía",
      companyId: "company-456",
      agentId: "agent-456",
      type: "AUTO" as const,
      startDate: new Date("2024-06-01"),
      endDate: new Date("2025-06-01"),
      premium: "200", // String as expected by schema
      commission: "20", // String as expected by schema
      currency: "UF" as const,
      clientId: "client-456",
      insuredProperty: "Auto nuevo",
      coverages: "Todo riesgo",
      deductibles: "5%",
    }

    it("should return error when no tenant context", async () => {
      vi.mocked(getTenantContext).mockResolvedValueOnce(null)

      const result = await createPolicy(validPolicyData)

      expect(result).toEqual({ error: "No autorizado" })
    })

    it("should return error for invalid fields", async () => {
      const result = await createPolicy({
        ...validPolicyData,
        number: "", // invalid - empty
        premium: "invalid", // invalid - not a number
      })

      expect(result).toEqual({ error: "Campos inválidos" })
    })

    it("should create policy successfully", async () => {
      const newPolicyId = "new-policy-id"
      vi.mocked(prisma.policy.create).mockResolvedValueOnce({
        ...mockPolicy,
        id: newPolicyId,
      } as any)

      const result = await createPolicy(validPolicyData)

      expect(result).toEqual({
        success: "Póliza creada exitosamente",
        policyId: newPolicyId,
      })
      expect(prisma.policy.create).toHaveBeenCalled()
    })

    it("should handle database error", async () => {
      vi.mocked(prisma.policy.create).mockRejectedValueOnce(new Error("DB Error"))

      const result = await createPolicy(validPolicyData)

      expect(result).toEqual({ error: "Error al crear la póliza" })
    })
  })

  describe("updatePolicy", () => {
    const updateData = {
      premium: 150,
      commission: 15,
    }

    it("should return error when no tenant context", async () => {
      vi.mocked(getTenantContext).mockResolvedValueOnce(null)

      const result = await updatePolicy(mockPolicyId, updateData)

      expect(result).toEqual({ error: "No autorizado" })
    })

    it("should return error when policy not found", async () => {
      vi.mocked(prisma.policy.findUnique).mockResolvedValueOnce(null)

      const result = await updatePolicy(mockPolicyId, updateData)

      expect(result).toEqual({ error: "Póliza no encontrada" })
    })

    it("should return error when policy belongs to different tenant", async () => {
      vi.mocked(prisma.policy.findUnique).mockResolvedValueOnce({
        ...mockPolicy,
        tenantId: "different-tenant",
      } as any)

      const result = await updatePolicy(mockPolicyId, updateData)

      expect(result).toEqual({ error: "Póliza no encontrada" })
    })

    it("should update policy successfully", async () => {
      vi.mocked(prisma.policy.findUnique).mockResolvedValueOnce(mockPolicy as any)
      vi.mocked(prisma.policy.update).mockResolvedValueOnce(mockPolicy as any)

      const result = await updatePolicy(mockPolicyId, updateData)

      expect(result).toEqual({ success: "Póliza actualizada exitosamente" })
      expect(prisma.policy.update).toHaveBeenCalledWith({
        where: { id: mockPolicyId },
        data: updateData,
      })
    })
  })

  describe("updatePolicyStatus", () => {
    it("should return error when no tenant context", async () => {
      vi.mocked(getTenantContext).mockResolvedValueOnce(null)

      const result = await updatePolicyStatus(mockPolicyId, "EXPIRED")

      expect(result).toEqual({ error: "No autorizado" })
    })

    it("should return error when policy not found", async () => {
      vi.mocked(prisma.policy.findUnique).mockResolvedValueOnce(null)

      const result = await updatePolicyStatus(mockPolicyId, "EXPIRED")

      expect(result).toEqual({ error: "Póliza no encontrada" })
    })

    it("should update status successfully", async () => {
      vi.mocked(prisma.policy.findUnique).mockResolvedValueOnce(mockPolicy as any)
      vi.mocked(prisma.policy.update).mockResolvedValueOnce(mockPolicy as any)

      const result = await updatePolicyStatus(mockPolicyId, "EXPIRED")

      expect(result).toEqual({ success: "Estado cambiado a EXPIRED" })
      expect(prisma.policy.update).toHaveBeenCalledWith({
        where: { id: mockPolicyId },
        data: { status: "EXPIRED" },
      })
    })
  })

  describe("deletePolicy", () => {
    it("should return error when no tenant context", async () => {
      vi.mocked(getTenantContext).mockResolvedValueOnce(null)

      const result = await deletePolicy(mockPolicyId)

      expect(result).toEqual({ error: "No autorizado" })
    })

    it("should return error when policy not found", async () => {
      vi.mocked(prisma.policy.findUnique).mockResolvedValueOnce(null)

      const result = await deletePolicy(mockPolicyId)

      expect(result).toEqual({ error: "Póliza no encontrada" })
    })

    it("should return error when policy has active claims", async () => {
      vi.mocked(prisma.policy.findUnique).mockResolvedValueOnce({
        ...mockPolicy,
        Claim: [
          { id: "claim-1", status: "REPORTED" },
          { id: "claim-2", status: "CLOSED" },
        ],
      } as any)

      const result = await deletePolicy(mockPolicyId)

      expect(result).toEqual({ error: "No se puede eliminar una póliza con siniestros activos" })
    })

    it("should soft delete (cancel) policy successfully", async () => {
      vi.mocked(prisma.policy.findUnique).mockResolvedValueOnce({
        ...mockPolicy,
        Claim: [{ id: "claim-1", status: "CLOSED" }],
      } as any)
      vi.mocked(prisma.policy.update).mockResolvedValueOnce(mockPolicy as any)

      const result = await deletePolicy(mockPolicyId)

      expect(result).toEqual({ success: "Póliza cancelada exitosamente" })
      expect(prisma.policy.update).toHaveBeenCalledWith({
        where: { id: mockPolicyId },
        data: { status: "CANCELLED" },
      })
    })

    it("should delete policy with no claims", async () => {
      vi.mocked(prisma.policy.findUnique).mockResolvedValueOnce({
        ...mockPolicy,
        Claim: [],
      } as any)
      vi.mocked(prisma.policy.update).mockResolvedValueOnce(mockPolicy as any)

      const result = await deletePolicy(mockPolicyId)

      expect(result).toEqual({ success: "Póliza cancelada exitosamente" })
    })
  })

  describe("Multi-tenancy isolation", () => {
    it("should always filter by tenantId in getPolicies", async () => {
      vi.mocked(prisma.policy.findMany).mockResolvedValueOnce([])

      await getPolicies()

      const callArgs = vi.mocked(prisma.policy.findMany).mock.calls[0][0]
      expect(callArgs?.where).toHaveProperty("tenantId", mockTenantId)
    })

    it("should verify tenant ownership in getPolicyById", async () => {
      const otherTenantPolicy = { ...mockPolicy, tenantId: "other-tenant" }
      vi.mocked(prisma.policy.findUnique).mockResolvedValueOnce(otherTenantPolicy as any)

      const result = await getPolicyById(mockPolicyId)

      expect(result).toBeNull()
    })

    it("should verify tenant ownership before update", async () => {
      const otherTenantPolicy = { ...mockPolicy, tenantId: "other-tenant" }
      vi.mocked(prisma.policy.findUnique).mockResolvedValueOnce(otherTenantPolicy as any)

      const result = await updatePolicy(mockPolicyId, { premium: 999 })

      expect(result).toEqual({ error: "Póliza no encontrada" })
      expect(prisma.policy.update).not.toHaveBeenCalled()
    })

    it("should verify tenant ownership before delete", async () => {
      const otherTenantPolicy = { ...mockPolicy, tenantId: "other-tenant", Claim: [] }
      vi.mocked(prisma.policy.findUnique).mockResolvedValueOnce(otherTenantPolicy as any)

      const result = await deletePolicy(mockPolicyId)

      expect(result).toEqual({ error: "Póliza no encontrada" })
      expect(prisma.policy.update).not.toHaveBeenCalled()
    })
  })
})
