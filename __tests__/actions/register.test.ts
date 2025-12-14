import { describe, it, expect, vi, beforeEach } from "vitest"
import { register } from "@/actions/register"
import { prisma } from "@/lib/db"

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
  },
}))

describe("register action", () => {
  const validData = {
    brokerageName: "Mi Corredora Test",
    brokerageRut: "12.345.678-9",
    name: "Juan Pérez",
    email: "juan@test.com",
    password: "password123",
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("validation", () => {
    it("should return error for invalid fields", async () => {
      const result = await register({
        brokerageName: "AB", // too short
        brokerageRut: "123", // too short
        name: "AB", // too short
        email: "invalid", // invalid email
        password: "123", // too short
      })

      expect(result).toEqual({ error: "Campos inválidos" })
    })

    it("should return error for invalid email", async () => {
      const result = await register({
        ...validData,
        email: "not-an-email",
      })

      expect(result).toEqual({ error: "Campos inválidos" })
    })

    it("should return error for short password", async () => {
      const result = await register({
        ...validData,
        password: "12345",
      })

      expect(result).toEqual({ error: "Campos inválidos" })
    })
  })

  describe("existing user check", () => {
    it("should return error if email already exists", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "existing-user",
        email: validData.email,
        name: "Existing User",
        password: "hashed",
        role: "BROKERAGE_ADMIN",
        tenantId: "tenant-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await register(validData)

      expect(result).toEqual({ error: "El correo ya está en uso" })
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: validData.email },
      })
    })
  })

  describe("existing tenant check", () => {
    it("should return error if RUT already exists", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce({
        id: "existing-tenant",
        name: "Existing Corredora",
        rut: validData.brokerageRut,
        slug: "existing-corredora",
        createdAt: new Date(),
        updatedAt: new Date(),
        planId: null,
        primaryColor: null,
        secondaryColor: null,
        logoUrl: null,
        signatureUrl: null,
        footerText: null,
        legalName: null,
        fantasyName: null,
        cmfRegistration: null,
        phone: null,
        email: null,
        address: null,
        website: null,
      })

      const result = await register(validData)

      expect(result).toEqual({ error: "Una corredora con este RUT ya existe" })
      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { rut: validData.brokerageRut },
      })
    })
  })

  describe("successful registration", () => {
    it("should create tenant and user in transaction", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
        const mockTx = {
          tenant: {
            create: vi.fn().mockResolvedValue({
              id: "new-tenant-id",
              name: validData.brokerageName,
              rut: validData.brokerageRut,
              slug: "mi-corredora-test",
            }),
          },
          user: {
            create: vi.fn().mockResolvedValue({
              id: "new-user-id",
              name: validData.name,
              email: validData.email,
            }),
          },
        }
        await callback(mockTx as any)
      })

      const result = await register(validData)

      expect(result).toEqual({ success: "Corredora registrada exitosamente!" })
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it("should handle transaction error", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.$transaction).mockRejectedValueOnce(new Error("DB Error"))

      const result = await register(validData)

      expect(result).toEqual({ error: "Algo salió mal al registrar la corredora" })
    })
  })

  describe("password hashing", () => {
    it("should hash password before storing", async () => {
      const bcrypt = await import("bcryptjs")

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.$transaction).mockResolvedValueOnce(undefined)

      await register(validData)

      expect(bcrypt.default.hash).toHaveBeenCalledWith(validData.password, 10)
    })
  })
})
