import { describe, it, expect } from "vitest"
import { LoginSchema, RegisterSchema } from "@/schemas"

describe("LoginSchema", () => {
  describe("email validation", () => {
    it("should accept valid email", () => {
      const result = LoginSchema.safeParse({
        email: "test@example.com",
        password: "password123",
      })
      expect(result.success).toBe(true)
    })

    it("should reject invalid email", () => {
      const result = LoginSchema.safeParse({
        email: "invalid-email",
        password: "password123",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Ingrese un correo electrónico válido.")
      }
    })

    it("should reject empty email", () => {
      const result = LoginSchema.safeParse({
        email: "",
        password: "password123",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("password validation", () => {
    it("should accept non-empty password", () => {
      const result = LoginSchema.safeParse({
        email: "test@example.com",
        password: "a",
      })
      expect(result.success).toBe(true)
    })

    it("should reject empty password", () => {
      const result = LoginSchema.safeParse({
        email: "test@example.com",
        password: "",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Ingrese su contraseña.")
      }
    })
  })

  describe("complete validation", () => {
    it("should accept valid login data", () => {
      const result = LoginSchema.safeParse({
        email: "usuario@corredora.cl",
        password: "miPassword123",
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe("usuario@corredora.cl")
        expect(result.data.password).toBe("miPassword123")
      }
    })

    it("should reject when both fields are invalid", () => {
      const result = LoginSchema.safeParse({
        email: "not-an-email",
        password: "",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBe(2)
      }
    })
  })
})

describe("RegisterSchema", () => {
  const validData = {
    brokerageName: "Mi Corredora",
    brokerageRut: "12.345.678-9",
    name: "Juan Pérez",
    email: "juan@micorredora.cl",
    password: "password123",
  }

  describe("brokerageName validation", () => {
    it("should accept valid brokerage name", () => {
      const result = RegisterSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("should reject short brokerage name", () => {
      const result = RegisterSchema.safeParse({
        ...validData,
        brokerageName: "AB",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "El nombre de la corredora debe tener al menos 3 caracteres."
        )
      }
    })
  })

  describe("brokerageRut validation", () => {
    it("should accept valid RUT", () => {
      const result = RegisterSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("should reject short RUT", () => {
      const result = RegisterSchema.safeParse({
        ...validData,
        brokerageRut: "123456",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Ingrese un RUT válido.")
      }
    })
  })

  describe("name validation", () => {
    it("should accept valid name", () => {
      const result = RegisterSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("should reject short name", () => {
      const result = RegisterSchema.safeParse({
        ...validData,
        name: "AB",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "El nombre debe tener al menos 3 caracteres."
        )
      }
    })
  })

  describe("email validation", () => {
    it("should accept valid email", () => {
      const result = RegisterSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("should reject invalid email", () => {
      const result = RegisterSchema.safeParse({
        ...validData,
        email: "invalid",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Ingrese un correo electrónico válido."
        )
      }
    })
  })

  describe("password validation", () => {
    it("should accept password with 6+ characters", () => {
      const result = RegisterSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("should accept exactly 6 characters", () => {
      const result = RegisterSchema.safeParse({
        ...validData,
        password: "123456",
      })
      expect(result.success).toBe(true)
    })

    it("should reject password with less than 6 characters", () => {
      const result = RegisterSchema.safeParse({
        ...validData,
        password: "12345",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "La contraseña debe tener al menos 6 caracteres."
        )
      }
    })
  })

  describe("complete validation", () => {
    it("should parse all fields correctly", () => {
      const result = RegisterSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it("should reject when multiple fields are invalid", () => {
      const result = RegisterSchema.safeParse({
        brokerageName: "AB",
        brokerageRut: "123",
        name: "AB",
        email: "invalid",
        password: "123",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBe(5)
      }
    })
  })
})
