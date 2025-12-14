import { LoginForm } from "@/components/auth/login-form"
import { Suspense } from "react"
import Link from "next/link"
import { Shield, FileText, PieChart, Briefcase, CheckCircle2, ArrowUpRight } from "lucide-react"

const LoginPage = () => {
    return (
        <div className="fixed inset-0 flex">
            {/* Left Side - Branding & Visual */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Base gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

                {/* Accent gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-teal-500/10" />

                {/* Geometric pattern */}
                <div className="absolute inset-0 opacity-[0.03]">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                {/* Floating orbs */}
                <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-[120px] animate-blob" />
                <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-teal-500/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 lg:p-16 w-full">
                    {/* Logo & Brand */}
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-white">
                                    GiCS
                                </h1>
                                <p className="text-xs font-medium text-slate-400 tracking-wide">
                                    GESTIÓN INTEGRAL PARA CORREDORES
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Main Hero Text */}
                    <div className="flex-1 flex flex-col justify-center max-w-lg">
                        <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                            Administra tu
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                                correduría de seguros
                            </span>
                            de forma inteligente
                        </h2>
                        <p className="text-lg text-slate-400 leading-relaxed mb-10">
                            Centraliza pólizas, cotizaciones, siniestros y comisiones en una plataforma diseñada para corredores chilenos.
                        </p>

                        {/* Feature Pills */}
                        <div className="flex flex-wrap gap-3 mb-10">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300">
                                <FileText className="w-4 h-4 text-blue-400" />
                                Cotizaciones
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300">
                                <Briefcase className="w-4 h-4 text-teal-400" />
                                Pólizas
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300">
                                <PieChart className="w-4 h-4 text-purple-400" />
                                Reportes
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-2xl font-bold text-white mb-1">99.9%</div>
                                <div className="text-xs text-slate-500">Uptime garantizado</div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-2xl font-bold text-white mb-1">+500</div>
                                <div className="text-xs text-slate-500">Corredores activos</div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-2xl font-bold text-white mb-1">24/7</div>
                                <div className="text-xs text-slate-500">Soporte técnico</div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            © 2024 GiCS. Todos los derechos reservados.
                        </p>
                        <Link href="/conocer-mas" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group">
                            <span>Conocer más</span>
                            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
                {/* Mobile Logo */}
                <div className="lg:hidden p-6 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-900">GiCS</h1>
                        </div>
                    </div>
                </div>

                {/* Form Container */}
                <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                    <div className="w-full max-w-md">
                        {/* Trust badges */}
                        <div className="hidden lg:flex items-center gap-4 mb-8 pb-8 border-b border-slate-200">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <CheckCircle2 className="w-4 h-4 text-teal-500" />
                                Datos cifrados
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <CheckCircle2 className="w-4 h-4 text-teal-500" />
                                CMF Compliant
                            </div>
                        </div>

                        <Suspense fallback={
                            <div className="flex items-center justify-center p-12">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full border-4 border-slate-200"></div>
                                    <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                                </div>
                            </div>
                        }>
                            <LoginForm />
                        </Suspense>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-0 lg:hidden text-center">
                    <p className="text-xs text-slate-400">
                        © 2024 GiCS. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
