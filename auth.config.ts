import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    trustHost: true,
    session: { strategy: "jwt" },
    pages: {
        signIn: "/auth/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
            const isRoot = nextUrl.pathname === "/"

            if (isRoot) {
                if (isLoggedIn) {
                    return Response.redirect(new URL("/dashboard", nextUrl))
                }
                return Response.redirect(new URL("/auth/login", nextUrl))
            }

            if (isOnDashboard) {
                if (isLoggedIn) return true
                return Response.redirect(new URL("/auth/login", nextUrl))
            } else if (isLoggedIn) {
                // Redirect to dashboard if already logged in and on home/login
                // return Response.redirect(new URL("/dashboard", nextUrl))
            }
            return true
        },
        async session({ token, session }) {
            if (token.sub && session.user) {
                session.user.id = token.sub
            }
            // Note: Role and TenantId will be added in the main auth.ts callback
            // because we might need DB access there, although JWT callback in auth.ts handles it.
            return session
        },
        async jwt({ token }) {
            return token
        }
    },
    providers: [], // Add providers here
} satisfies NextAuthConfig
