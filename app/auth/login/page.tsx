import { LoginForm } from "@/components/auth/login-form"
import { Suspense } from "react"
import { Shield, TrendingUp, Users, Lock } from "lucide-react"

const LoginPage = () => {
    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding & Visual */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
                    <div className="absolute top-40 right-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-20 left-40 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-12 py-12 text-white w-full">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                                <Shield className="w-8 h-8" />
                            </div>
                            <h1 className="text-4xl font-bold">Seguros SaaS</h1>
                        </div>
                        <p className="text-xl text-blue-100">
                            Plataforma integral para corredoras de seguros
                        </p>
                    </div>

                    <div className="space-y-6 mt-12">
                        <div className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-1">Gestión Eficiente</h3>
                                <p className="text-blue-100 text-sm">
                                    Administra pólizas, cotizaciones y siniestros en un solo lugar
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-1">Multi-tenant</h3>
                                <p className="text-blue-100 text-sm">
                                    Gestiona múltiples corredoras desde una sola plataforma
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <Lock className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-1">Seguridad Garantizada</h3>
                                <p className="text-blue-100 text-sm">
                                    Tus datos protegidos con los más altos estándares de seguridad
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-12">
                        <p className="text-sm text-blue-200">
                            © 2024 Seguros SaaS. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="w-full max-w-md">
                    <Suspense fallback={
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    }>
                        <LoginForm />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
