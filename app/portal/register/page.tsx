import { getPortalSession } from "@/actions/portal-auth"
import { redirect } from "next/navigation"
import { PortalRegisterForm } from "@/components/portal/portal-register-form"
import Link from "next/link"

export default async function PortalRegisterPage() {
    const session = await getPortalSession()

    if (session) {
        redirect("/portal")
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Crear Cuenta
                        </h1>
                        <p className="text-gray-500 mt-2">
                            Regístrese para acceder al portal de clientes
                        </p>
                    </div>

                    <PortalRegisterForm />

                    <div className="mt-6 text-center text-sm">
                        <Link
                            href="/portal/login"
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            ¿Ya tiene cuenta? Inicie sesión
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
