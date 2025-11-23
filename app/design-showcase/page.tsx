import { DesignOptionA } from "@/components/design/option-a"
import { DesignOptionB } from "@/components/design/option-b"
import { DesignOptionC } from "@/components/design/option-c"

export default function DesignShowcasePage() {
    return (
        <div className="min-h-screen bg-slate-100 p-8 space-y-16">
            <div className="max-w-6xl mx-auto text-center space-y-4">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Design Direction Showcase</h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Please review the following 3 design directions. Each represents a different aesthetic approach for the SaaS platform.
                </p>
            </div>

            <div className="max-w-7xl mx-auto space-y-20">
                {/* Option A */}
                <section className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-800">Option A: Clean Professional</h2>
                        <p className="text-slate-500">Minimalist, airy, inspired by "Bony" reference. Focus on whitespace and soft shadows.</p>
                    </div>
                    <DesignOptionA />
                </section>

                {/* Option B */}
                <section className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-800">Option B: Vibrant Glass</h2>
                        <p className="text-slate-500">Modern, colorful, gradients and glassmorphism. Trendy and high-energy.</p>
                    </div>
                    <DesignOptionB />
                </section>

                {/* Option C */}
                <section className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-800">Option C: Dark Premium</h2>
                        <p className="text-slate-500">High contrast, dark sidebar, corporate and solid feel. Data-dense.</p>
                    </div>
                    <DesignOptionC />
                </section>
            </div>
        </div>
    )
}
