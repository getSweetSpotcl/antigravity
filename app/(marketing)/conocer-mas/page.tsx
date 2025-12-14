import Link from "next/link"
import { Shield, FileText, PieChart, Briefcase, Users, Clock, CheckCircle2, ArrowRight, ChartBar, Lock, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ConocerMasPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-900">GiCS</h1>
                            <p className="text-[10px] font-medium text-slate-500 tracking-wide">GESTIÓN INTEGRAL PARA CORREDORES</p>
                        </div>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/auth/login">
                            <Button variant="ghost">Iniciar sesión</Button>
                        </Link>
                        <Link href="/auth/login">
                            <Button>Comenzar ahora</Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden py-20 lg:py-32">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-teal-50 opacity-50" />
                <div className="max-w-7xl mx-auto px-6 relative">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                            <Zap className="w-4 h-4" />
                            Plataforma líder para corredores de seguros en Chile
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                            Gestiona tu correduría de forma
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500"> inteligente</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-10 leading-relaxed">
                            GiCS centraliza todas las operaciones de tu correduría en una sola plataforma:
                            cotizaciones, pólizas, siniestros, comisiones y mucho más.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/auth/login">
                                <Button size="lg" className="w-full sm:w-auto">
                                    Comenzar gratis
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                            <Button size="lg" variant="outline" className="w-full sm:w-auto">
                                Ver demostración
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                            Todo lo que necesitas en un solo lugar
                        </h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Herramientas diseñadas específicamente para el mercado chileno de seguros
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={FileText}
                            title="Cotizaciones"
                            description="Genera cotizaciones profesionales en PDF, envíalas por email y haz seguimiento del estado de cada una."
                            color="blue"
                        />
                        <FeatureCard
                            icon={Briefcase}
                            title="Pólizas"
                            description="Gestiona todo el ciclo de vida de las pólizas: emisión, endosos, renovaciones y vencimientos."
                            color="teal"
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Siniestros"
                            description="Registra y da seguimiento a los siniestros de tus clientes con un flujo de trabajo completo."
                            color="purple"
                        />
                        <FeatureCard
                            icon={ChartBar}
                            title="Comisiones"
                            description="Calcula automáticamente las comisiones y mantén un control detallado de tus ingresos."
                            color="amber"
                        />
                        <FeatureCard
                            icon={Users}
                            title="Clientes"
                            description="Base de datos centralizada de clientes con validación de RUT chileno y toda su información."
                            color="rose"
                        />
                        <FeatureCard
                            icon={PieChart}
                            title="Reportes"
                            description="Dashboards y reportes para tomar decisiones informadas sobre tu cartera de clientes."
                            color="indigo"
                        />
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-8 text-center">
                        <StatCard number="500+" label="Corredores activos" />
                        <StatCard number="50.000+" label="Pólizas gestionadas" />
                        <StatCard number="99.9%" label="Uptime garantizado" />
                        <StatCard number="24/7" label="Soporte técnico" />
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                                Diseñado para el mercado chileno
                            </h2>
                            <div className="space-y-6">
                                <BenefitItem
                                    icon={CheckCircle2}
                                    title="Validación de RUT"
                                    description="Verificación automática de RUT chileno en todos los formularios."
                                />
                                <BenefitItem
                                    icon={CheckCircle2}
                                    title="Soporte para UF"
                                    description="Trabaja con valores en UF, la unidad de cuenta más usada en seguros."
                                />
                                <BenefitItem
                                    icon={CheckCircle2}
                                    title="CMF Compliant"
                                    description="Cumple con los requisitos de la Comisión para el Mercado Financiero."
                                />
                                <BenefitItem
                                    icon={CheckCircle2}
                                    title="Multi-compañía"
                                    description="Gestiona pólizas de múltiples aseguradoras desde una sola plataforma."
                                />
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-video rounded-2xl bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center">
                                <div className="text-center p-8">
                                    <Lock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                                    <p className="text-lg font-semibold text-slate-700">Datos 100% seguros</p>
                                    <p className="text-slate-600">Encriptación de extremo a extremo</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                        Comienza a gestionar tu correduría hoy
                    </h2>
                    <p className="text-lg text-slate-600 mb-10">
                        Únete a más de 500 corredores que ya confían en GiCS para administrar su negocio.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/auth/login">
                            <Button size="lg" className="w-full sm:w-auto">
                                Crear cuenta gratis
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="w-full sm:w-auto">
                            Contactar ventas
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-slate-900 text-slate-400">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                                    <Shield className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-white font-bold">GiCS</span>
                            </div>
                            <p className="text-sm">
                                Gestión Integral para Corredores de Seguros
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Producto</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/conocer-mas" className="hover:text-white transition-colors">Características</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">Precios</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">Integraciones</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Empresa</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/conocer-mas" className="hover:text-white transition-colors">Nosotros</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">Contacto</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/privacidad" className="hover:text-white transition-colors">Política de Privacidad</Link></li>
                                <li><Link href="/terminos" className="hover:text-white transition-colors">Términos de Uso</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-slate-800 text-center text-sm">
                        <p>© {new Date().getFullYear()} GiCS. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function FeatureCard({ icon: Icon, title, description, color }: { icon: React.ElementType, title: string, description: string, color: string }) {
    const colors: Record<string, string> = {
        blue: "bg-blue-100 text-blue-600",
        teal: "bg-teal-100 text-teal-600",
        purple: "bg-purple-100 text-purple-600",
        amber: "bg-amber-100 text-amber-600",
        rose: "bg-rose-100 text-rose-600",
        indigo: "bg-indigo-100 text-indigo-600",
    }

    return (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-lg transition-shadow">
            <div className={`w-12 h-12 rounded-xl ${colors[color]} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-600">{description}</p>
        </div>
    )
}

function StatCard({ number, label }: { number: string, label: string }) {
    return (
        <div>
            <div className="text-4xl lg:text-5xl font-bold text-white mb-2">{number}</div>
            <div className="text-slate-400">{label}</div>
        </div>
    )
}

function BenefitItem({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
    return (
        <div className="flex gap-4">
            <div className="flex-shrink-0">
                <Icon className="w-6 h-6 text-teal-500" />
            </div>
            <div>
                <h4 className="font-semibold text-slate-900 mb-1">{title}</h4>
                <p className="text-slate-600">{description}</p>
            </div>
        </div>
    )
}
