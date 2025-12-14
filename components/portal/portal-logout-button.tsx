"use client"

import { useRouter } from "next/navigation"
import { portalLogout } from "@/actions/portal-auth"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { LogOut } from "lucide-react"

export function PortalLogoutButton() {
    const router = useRouter()

    const handleLogout = async () => {
        await portalLogout()
        router.push("/portal/login")
        router.refresh()
    }

    return (
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
        </DropdownMenuItem>
    )
}
