import Link from "next/link"
import { Shield, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
    title: "Términos y Condiciones - GiCS",
    description: "Términos y condiciones generales de uso de la plataforma GiCS",
}

export default function TerminosPage() {
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
                        Términos y Condiciones de Uso
                    </h1>
                    <p className="text-slate-500 mb-8">Última actualización: {new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                    <div className="prose prose-slate max-w-none">
                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Aceptación de los Términos</h2>
                            <p className="text-slate-600 mb-4">
                                Al acceder y utilizar la plataforma GiCS (&quot;la Plataforma&quot;), usted acepta quedar vinculado por estos
                                Términos y Condiciones de Uso. Si no está de acuerdo con alguna parte de estos términos, no debe
                                utilizar la Plataforma.
                            </p>
                            <p className="text-slate-600">
                                Estos términos constituyen un acuerdo legal entre usted (el &quot;Usuario&quot;) y GiCS (el &quot;Proveedor&quot;)
                                para el uso de los servicios de gestión de correduría de seguros.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">2. Descripción del Servicio</h2>
                            <p className="text-slate-600 mb-4">
                                GiCS es una plataforma de software como servicio (SaaS) diseñada para corredores de seguros en Chile,
                                que proporciona herramientas para:
                            </p>
                            <ul className="list-disc pl-6 text-slate-600 space-y-1">
                                <li>Gestión de cotizaciones de seguros</li>
                                <li>Administración de pólizas y endosos</li>
                                <li>Seguimiento de siniestros</li>
                                <li>Control de comisiones</li>
                                <li>Gestión de clientes</li>
                                <li>Generación de reportes</li>
                                <li>Comunicaciones con clientes</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">3. Registro y Cuenta de Usuario</h2>

                            <h3 className="text-lg font-medium text-slate-800 mb-2">3.1 Requisitos de Registro</h3>
                            <p className="text-slate-600 mb-4">
                                Para utilizar la Plataforma, debe registrarse proporcionando información veraz, completa y actualizada.
                                Debe ser mayor de edad y tener capacidad legal para contratar. Si actúa en nombre de una empresa,
                                declara tener autorización para vincular a dicha empresa.
                            </p>

                            <h3 className="text-lg font-medium text-slate-800 mb-2">3.2 Seguridad de la Cuenta</h3>
                            <p className="text-slate-600 mb-4">
                                Usted es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las
                                actividades que ocurran bajo su cuenta. Debe notificarnos inmediatamente cualquier uso no autorizado.
                            </p>

                            <h3 className="text-lg font-medium text-slate-800 mb-2">3.3 Veracidad de la Información</h3>
                            <p className="text-slate-600">
                                Se compromete a proporcionar información precisa y a mantenerla actualizada. El proporcionar
                                información falsa puede resultar en la suspensión o cancelación de su cuenta.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">4. Uso Aceptable</h2>
                            <p className="text-slate-600 mb-4">Al usar la Plataforma, usted se compromete a:</p>
                            <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-1">
                                <li>Cumplir con todas las leyes y regulaciones aplicables en Chile</li>
                                <li>No utilizar la Plataforma para fines ilegales o no autorizados</li>
                                <li>No intentar acceder a cuentas o datos de otros usuarios</li>
                                <li>No interferir con el funcionamiento de la Plataforma</li>
                                <li>No transmitir virus, malware u otro código malicioso</li>
                                <li>No realizar actividades que puedan dañar la reputación del Proveedor</li>
                            </ul>
                            <p className="text-slate-600">
                                El incumplimiento de estas normas puede resultar en la suspensión inmediata de su cuenta.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">5. Propiedad Intelectual</h2>

                            <h3 className="text-lg font-medium text-slate-800 mb-2">5.1 Derechos del Proveedor</h3>
                            <p className="text-slate-600 mb-4">
                                La Plataforma, incluyendo su diseño, código, funcionalidades, logotipos y contenido, son propiedad
                                exclusiva del Proveedor y están protegidos por leyes de propiedad intelectual.
                            </p>

                            <h3 className="text-lg font-medium text-slate-800 mb-2">5.2 Licencia de Uso</h3>
                            <p className="text-slate-600 mb-4">
                                Se le otorga una licencia limitada, no exclusiva, no transferible y revocable para usar la Plataforma
                                de acuerdo con estos términos, mientras mantenga una suscripción activa.
                            </p>

                            <h3 className="text-lg font-medium text-slate-800 mb-2">5.3 Datos del Usuario</h3>
                            <p className="text-slate-600">
                                Usted mantiene la propiedad de los datos que ingresa en la Plataforma. Nos otorga una licencia
                                para procesar, almacenar y mostrar dichos datos según sea necesario para proporcionar el servicio.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">6. Privacidad y Protección de Datos</h2>
                            <p className="text-slate-600">
                                El tratamiento de datos personales se rige por nuestra{" "}
                                <Link href="/privacidad" className="text-blue-600 hover:underline">Política de Privacidad</Link>,
                                que forma parte integral de estos términos. Al usar la Plataforma, acepta el tratamiento de sus
                                datos conforme a dicha política.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">7. Disponibilidad del Servicio</h2>
                            <p className="text-slate-600 mb-4">
                                Nos esforzamos por mantener la Plataforma disponible 24/7, con un objetivo de disponibilidad del 99.9%.
                                Sin embargo, no garantizamos disponibilidad ininterrumpida y podemos:
                            </p>
                            <ul className="list-disc pl-6 text-slate-600 space-y-1">
                                <li>Realizar mantenimientos programados (notificados con anticipación)</li>
                                <li>Suspender temporalmente el servicio por emergencias técnicas</li>
                                <li>Modificar o descontinuar funcionalidades con previo aviso</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">8. Limitación de Responsabilidad</h2>
                            <p className="text-slate-600 mb-4">
                                La Plataforma se proporciona &quot;tal cual&quot; y &quot;según disponibilidad&quot;. En la máxima medida permitida
                                por la ley chilena:
                            </p>
                            <ul className="list-disc pl-6 text-slate-600 space-y-1">
                                <li>No garantizamos que la Plataforma esté libre de errores</li>
                                <li>No somos responsables por pérdidas indirectas, incidentales o consecuentes</li>
                                <li>No somos responsables por decisiones comerciales basadas en datos de la Plataforma</li>
                                <li>Nuestra responsabilidad total está limitada al monto pagado por el servicio en los últimos 12 meses</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">9. Indemnización</h2>
                            <p className="text-slate-600">
                                Usted acepta indemnizar y mantener indemne al Proveedor, sus directores, empleados y agentes,
                                de cualquier reclamo, pérdida o daño que surja del uso indebido de la Plataforma o del
                                incumplimiento de estos términos.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">10. Terminación</h2>
                            <p className="text-slate-600 mb-4">
                                Podemos suspender o terminar su acceso a la Plataforma en cualquier momento si:
                            </p>
                            <ul className="list-disc pl-6 text-slate-600 mb-4 space-y-1">
                                <li>Incumple estos términos</li>
                                <li>No paga las tarifas aplicables</li>
                                <li>Realiza actividades fraudulentas o ilegales</li>
                                <li>Lo requerimos por orden judicial o administrativa</li>
                            </ul>
                            <p className="text-slate-600">
                                Usted puede cancelar su cuenta en cualquier momento. Al terminar, perderá acceso a la Plataforma
                                y sus datos serán tratados según nuestra Política de Privacidad.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">11. Modificaciones a los Términos</h2>
                            <p className="text-slate-600">
                                Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán
                                notificados a través de la Plataforma o por correo electrónico con al menos 30 días de anticipación.
                                El uso continuado de la Plataforma después de los cambios constituye aceptación de los nuevos términos.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">12. Legislación Aplicable y Jurisdicción</h2>
                            <p className="text-slate-600">
                                Estos términos se rigen por las leyes de la República de Chile. Cualquier disputa será sometida
                                a la jurisdicción de los tribunales ordinarios de justicia de Santiago de Chile, renunciando
                                expresamente a cualquier otro fuero que pudiera corresponder.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">13. Disposiciones Generales</h2>
                            <ul className="list-disc pl-6 text-slate-600 space-y-2">
                                <li>
                                    <strong>Cesión:</strong> No puede ceder sus derechos bajo estos términos sin nuestro consentimiento previo por escrito.
                                </li>
                                <li>
                                    <strong>Divisibilidad:</strong> Si alguna disposición es declarada inválida, las demás mantendrán su vigencia.
                                </li>
                                <li>
                                    <strong>Acuerdo Completo:</strong> Estos términos, junto con la Política de Privacidad, constituyen el acuerdo completo entre las partes.
                                </li>
                                <li>
                                    <strong>Renuncia:</strong> La falta de ejercicio de un derecho no constituye renuncia al mismo.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-900 mb-4">14. Contacto</h2>
                            <p className="text-slate-600">
                                Para consultas sobre estos términos, puede contactarnos a través de la Plataforma o
                                enviando un correo a soporte@gics.cl
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
