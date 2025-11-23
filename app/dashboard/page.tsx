import { auth } from "@/lib/auth"

const DashboardPage = async () => {
    const session = await auth()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Resumen</h1>
                <p className="text-muted-foreground">
                    Bienvenido de vuelta, {session?.user?.name}
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Placeholder cards for stats */}
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Total Clientes</h3>
                    </div>
                    <div className="text-2xl font-bold">0</div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Pólizas Activas</h3>
                    </div>
                    <div className="text-2xl font-bold">0</div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Primas del Mes</h3>
                    </div>
                    <div className="text-2xl font-bold">$0</div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Siniestros Activos</h3>
                    </div>
                    <div className="text-2xl font-bold">0</div>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
