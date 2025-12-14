import { getPortalSession } from "@/actions/portal-auth"
import { redirect } from "next/navigation"
import { PortalLoginForm } from "@/components/portal/portal-login-form"
import Link from "next/link"

export default async function PortalLoginPage() {
    const session = await getPortalSession()

    if (session) {
        redirect("/portal")
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Portal de Clientes
                        </h1>
                        <p className="text-gray-500 mt-2">
                            Ingrese sus credenciales para acceder
                        </p>
                    </div>

                    <PortalLoginForm />

                    <div className="mt-6 text-center text-sm">
                        <Link
                            href="/portal/register"
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            ¿No tiene cuenta? Regístrese aquí
                        </Link>
                    </div>
                </div>

                <p className="text-center text-gray-500 text-sm mt-6">
                    ¿Problemas para acceder?{" "}
                    <Link href="/portal/login" className="text-blue-600 hover:underline">
                        Recuperar contraseña
                    </Link>
                </p>
            </div>
        </div>
    )
}
