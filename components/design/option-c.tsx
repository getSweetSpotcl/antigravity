"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Bell, LayoutDashboard, Users, FileText, PieChart, MoreHorizontal } from "lucide-react"

export function DesignOptionC() {
    return (
        <div className="flex h-[600px] w-full overflow-hidden rounded-xl border shadow-2xl font-sans text-slate-900 bg-white">
            {/* Sidebar Dark */}
            <div className="w-64 bg-[#0F172A] text-slate-300 flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <span className="text-lg font-semibold text-white tracking-wider uppercase">Antigravity</span>
                </div>
                <div className="p-4 space-y-1">
                    <div className="text-xs font-bold text-slate-500 uppercase px-4 py-2 mt-2">Main Menu</div>
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-600 text-white rounded-md font-medium cursor-pointer shadow-lg shadow-blue-900/20">
                        <LayoutDashboard size={18} />
                        <span>Dashboard</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2.5 hover:text-white hover:bg-slate-800 rounded-md cursor-pointer transition-colors">
                        <Users size={18} />
                        <span>Clients</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2.5 hover:text-white hover:bg-slate-800 rounded-md cursor-pointer transition-colors">
                        <FileText size={18} />
                        <span>Policies</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2.5 hover:text-white hover:bg-slate-800 rounded-md cursor-pointer transition-colors">
                        <PieChart size={18} />
                        <span>Reports</span>
                    </div>
                </div>
                <div className="mt-auto p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-slate-700"></div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white">Admin User</p>
                            <p className="text-xs text-slate-500">Brokerage</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-slate-50">
                {/* Header */}
                <header className="h-16 bg-white border-b px-8 flex items-center justify-between shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800">Dashboard Overview</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center border rounded-md px-3 py-1.5 bg-slate-50">
                            <Search className="text-slate-400 mr-2" size={16} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-transparent border-none text-sm outline-none w-48"
                            />
                        </div>
                        <Button variant="outline" size="sm" className="text-slate-600">
                            <Bell size={16} className="mr-2" />
                            Notifications
                        </Button>
                    </div>
                </header>

                {/* Content */}
                <div className="p-8 overflow-y-auto">
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        {[
                            { label: "Total Clients", value: "1,234", change: "+12%", color: "text-blue-600" },
                            { label: "Active Policies", value: "856", change: "+5%", color: "text-emerald-600" },
                            { label: "Claims", value: "23", change: "-2%", color: "text-amber-600" },
                            { label: "Revenue", value: "$45K", change: "+18%", color: "text-violet-600" },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{stat.label}</p>
                                <div className="flex items-end justify-between mt-2">
                                    <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                                    <span className={`text-xs font-bold ${stat.color} bg-slate-50 px-1.5 py-0.5 rounded`}>{stat.change}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Recent Policies</h3>
                            <Button variant="ghost" size="sm" className="text-blue-600">View All</Button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                            JD
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">John Doe</p>
                                            <p className="text-xs text-slate-500">Auto Insurance • Policy #12345</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                                        <p className="text-sm font-medium text-slate-900">$1,200</p>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                            <MoreHorizontal size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
