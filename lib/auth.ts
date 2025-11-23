import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import { authConfig } from "@/auth.config"
import { UserRole } from "@prisma/client"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { LoginSchema } from "@/schemas"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma) as any,
    session: { strategy: "jwt" },
    callbacks: {
        ...authConfig.callbacks,
        async session({ token, session }) {
            if (token.sub && session.user) {
                session.user.id = token.sub
            }

            if (token.role && session.user) {
                session.user.role = token.role as UserRole
            }

            if (token.tenantId && session.user) {
                session.user.tenantId = token.tenantId as string
            }

            return session
        },
        async jwt({ token }) {
            if (!token.sub) return token

            const existingUser = await prisma.user.findUnique({
                where: { id: token.sub }
            })

            if (!existingUser) return token

            token.role = existingUser.role
            token.tenantId = existingUser.tenantId

            return token
        }
    },
    providers: [
        Credentials({
            async authorize(credentials) {
                const validatedFields = LoginSchema.safeParse(credentials)

                if (validatedFields.success) {
                    const { email, password } = validatedFields.data

                    const user = await prisma.user.findUnique({
                        where: { email }
                    })

                    console.log("DEBUG: Login attempt for:", email)
                    console.log("DEBUG: User found:", !!user)

                    if (!user || !user.password) {
                        console.log("DEBUG: User not found or no password")
                        return null
                    }

                    const passwordsMatch = await bcrypt.compare(
                        password,
                        user.password
                    )

                    console.log("DEBUG: Password match:", passwordsMatch)

                    if (passwordsMatch) {
                        return {
                            ...user,
                            tenantId: user.tenantId ?? undefined
                        }
                    }
                }

                return null
            }
        })
    ],
})
