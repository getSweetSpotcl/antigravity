import Link from "next/link"
import { Shield, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
    title: "Política de Privacidad - GiCS",
    description: "Política de privacidad y protección de datos personales de GiCS",
}

export default function PrivacidadPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-900">GiCS</h1>
                        </div>
                    </Link>
                    <Link href="/conocer-mas">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 lg:p-12">
                    <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                        Política de Privacidad
                    </h1>
                    <p className="text-slate-500 mb-8">Última actualización: {new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                    <div className="prose prose-slate max-w-none">
                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Introducción</h2>
                            <p className="text-slate-600 mb-4">
                                GiCS (&quot;nosotros&quot;, &quot;nuestro&quot; o &quot;la Plataforma&quot;) se compromete a proteger la privacidad de los usuarios
                                de nuestra plataforma de gestión para corredores de seguros. Esta Política de Privacidad explica cómo
                                recopilamos, usamos, compartimos y protegemos la información personal de nuestros usuarios.
                            </p>
                            <p className="text-slate-600">
                                Al utilizar GiCS, usted acepta las prácticas descritas en esta política. Le recomendamos leerla
                                detenidamente para comprender cómo tratamos su información.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">2. Información que Recopilamos</h2>
                            <p className="text-slate-600 mb-4">Recopilamos los siguientes tipos de información:</p>

                            <h3 className="text-lg font-medium text-slate-800 mb-2">2.1 Información de Registro</h3>
                            <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-1">
                                <li>Nombre completo y datos de contacto</li>
                                <li>RUT (Rol Único Tributario)</li>
                                <li>Correo electrónico</li>
                                <li>Información de la empresa o correduría</li>
                                <li>Credenciales de acceso (contraseñas encriptadas)</li>
                            </ul>

                            <h3 className="text-lg font-medium text-slate-800 mb-2">2.2 Información de Clientes</h3>
                            <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-1">
                                <li>Datos personales de asegurados (nombre, RUT, dirección, contacto)</li>
                                <li>Información de pólizas y coberturas</li>
                                <li>Historial de siniestros</li>
                                <li>Documentos adjuntos relacionados con seguros</li>
                            </ul>

                            <h3 className="text-lg font-medium text-slate-800 mb-2">2.3 Información de Uso</h3>
                            <ul className="list-disc pl-6 text-slate-600 space-y-1">
                                <li>Registros de acceso y actividad en la plataforma</li>
                                <li>Dirección IP y datos del dispositivo</li>
                                <li>Preferencias de configuración</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">3. Uso de la Información</h2>
                            <p className="text-slate-600 mb-4">Utilizamos la información recopilada para:</p>
                            <ul className="list-disc pl-6 text-slate-600 space-y-1">
                                <li>Proporcionar y mantener los servicios de la plataforma</li>
                                <li>Procesar cotizaciones, pólizas y siniestros</li>
                                <li>Generar reportes y análisis para su correduría</li>
                                <li>Calcular comisiones y gestión financiera</li>
                                <li>Enviar notificaciones importantes sobre vencimientos y renovaciones</li>
                                <li>Mejorar y personalizar la experiencia del usuario</li>
                                <li>Cumplir con obligaciones legales y regulatorias</li>
                                <li>Prevenir fraudes y garantizar la seguridad</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">4. Compartir Información</h2>
                            <p className="text-slate-600 mb-4">
                                No vendemos ni alquilamos información personal a terceros. Podemos compartir información en los siguientes casos:
                            </p>
                            <ul className="list-disc pl-6 text-slate-600 space-y-1">
                                <li><strong>Compañías de seguros:</strong> Para procesar cotizaciones y pólizas según lo requiera su operación</li>
                                <li><strong>Proveedores de servicios:</strong> Empresas que nos ayudan a operar la plataforma (hosting, email, etc.)</li>
                                <li><strong>Requisitos legales:</strong> Cuando sea requerido por ley o autoridades competentes</li>
                                <li><strong>Con su consentimiento:</strong> En cualquier otro caso, solicitaremos su autorización expresa</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">5. Seguridad de los Datos</h2>
                            <p className="text-slate-600 mb-4">
                                Implementamos medidas de seguridad técnicas y organizativas para proteger su información:
                            </p>
                            <ul className="list-disc pl-6 text-slate-600 space-y-1">
                                <li>Encriptación de datos en tránsito y en reposo</li>
                                <li>Autenticación segura con contraseñas hasheadas</li>
                                <li>Control de acceso basado en roles</li>
                                <li>Aislamiento de datos por tenant (multi-tenancy)</li>
                                <li>Respaldos regulares de información</li>
                                <li>Monitoreo continuo de seguridad</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">6. Retención de Datos</h2>
                            <p className="text-slate-600">
                                Conservamos su información durante el tiempo que mantenga una cuenta activa y por el período
                                adicional requerido por la legislación chilena aplicable al sector de seguros. Los datos de
                                pólizas y siniestros se mantienen según los plazos de prescripción legales.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">7. Sus Derechos</h2>
                            <p className="text-slate-600 mb-4">
                                De acuerdo con la Ley 19.628 sobre Protección de la Vida Privada, usted tiene derecho a:
                            </p>
                            <ul className="list-disc pl-6 text-slate-600 space-y-1">
                                <li>Acceder a sus datos personales</li>
                                <li>Rectificar datos inexactos o incompletos</li>
                                <li>Solicitar la eliminación de sus datos (cuando sea legalmente posible)</li>
                                <li>Oponerse al tratamiento de sus datos</li>
                                <li>Solicitar la portabilidad de sus datos</li>
                            </ul>
                            <p className="text-slate-600 mt-4">
                                Para ejercer estos derechos, contacte a nuestro equipo de soporte.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">8. Cookies y Tecnologías Similares</h2>
                            <p className="text-slate-600">
                                Utilizamos cookies esenciales para el funcionamiento de la plataforma, incluyendo la gestión
                                de sesiones y preferencias del usuario. No utilizamos cookies de seguimiento o publicidad de terceros.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">9. Cambios a esta Política</h2>
                            <p className="text-slate-600">
                                Podemos actualizar esta Política de Privacidad ocasionalmente. Le notificaremos cualquier cambio
                                significativo a través de la plataforma o por correo electrónico. Le recomendamos revisar esta
                                página periódicamente.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">10. Contacto</h2>
                            <p className="text-slate-600">
                                Si tiene preguntas sobre esta Política de Privacidad o sobre cómo manejamos sus datos,
                                puede contactarnos a través de nuestra plataforma o enviando un correo a soporte@gics.cl
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 border-t border-slate-200 bg-white">
                <div className="max-w-4xl mx-auto px-6 text-center text-sm text-slate-500">
                    <p>© {new Date().getFullYear()} GiCS. Todos los derechos reservados.</p>
                    <div className="flex justify-center gap-6 mt-4">
                        <Link href="/privacidad" className="hover:text-slate-900 transition-colors">Privacidad</Link>
                        <Link href="/terminos" className="hover:text-slate-900 transition-colors">Términos de Uso</Link>
                        <Link href="/conocer-mas" className="hover:text-slate-900 transition-colors">Nosotros</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
