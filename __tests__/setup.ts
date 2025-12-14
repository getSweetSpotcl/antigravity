import "@testing-library/jest-dom"
import { vi } from "vitest"

// Mock next/headers for Server Actions
vi.mock("next/headers", () => ({
    headers: vi.fn().mockResolvedValue(new Headers({
        "x-forwarded-for": "127.0.0.1",
    })),
    cookies: vi.fn().mockResolvedValue({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
    }),
}))

// Mock rate limiting to always allow in tests
vi.mock("@/lib/rate-limit", () => ({
    checkRateLimit: vi.fn().mockReturnValue({
        success: true,
        remaining: 100,
        resetAt: Date.now() + 60000,
        headers: {},
    }),
    getClientIPFromHeaders: vi.fn().mockReturnValue("127.0.0.1"),
    rateLimitPresets: {
        public: { limit: 100, windowInSeconds: 60 },
        auth: { limit: 10, windowInSeconds: 60 },
        login: { limit: 5, windowInSeconds: 60 },
        register: { limit: 3, windowInSeconds: 3600 },
        passwordReset: { limit: 3, windowInSeconds: 900 },
        expensive: { limit: 20, windowInSeconds: 60 },
        upload: { limit: 30, windowInSeconds: 3600 },
    },
}))

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
    }),
    usePathname: () => "/dashboard",
    useSearchParams: () => new URLSearchParams(),
}))

// Mock next-auth
vi.mock("next-auth/react", () => ({
    useSession: () => ({
        data: {
            user: {
                id: "test-user-id",
                name: "Test User",
                email: "test@example.com",
                role: "BROKERAGE_ADMIN",
                tenantId: "test-tenant-id",
            },
        },
        status: "authenticated",
    }),
    SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock Prisma client for testing
vi.mock("@/lib/db", () => ({
    prisma: {
        client: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        policy: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
        quote: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        claim: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        insuranceCompany: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        tenant: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
        auditLog: {
            create: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}))

// Mock tenant context
vi.mock("@/lib/tenant-context", () => ({
    getTenantContext: vi.fn().mockResolvedValue("test-tenant-id"),
    ADMIN_TENANT_COOKIE: "admin-tenant-context",
}))

// Suppress console errors in tests
const originalError = console.error
beforeAll(() => {
    console.error = (...args: unknown[]) => {
        if (
            typeof args[0] === "string" &&
            args[0].includes("Warning: ReactDOM.render is no longer supported")
        ) {
            return
        }
        originalError.call(console, ...args)
    }
})

afterAll(() => {
    console.error = originalError
})
