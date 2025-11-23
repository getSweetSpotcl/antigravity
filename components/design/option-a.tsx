"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Bell, LayoutDashboard, Users, FileText, Settings, CheckCircle2, AlertCircle } from "lucide-react"

export function DesignOptionA() {
    return (
        <div className="flex h-[600px] w-full overflow-hidden rounded-xl border shadow-2xl font-sans text-slate-900">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r flex flex-col">
                <div className="h-16 flex items-center px-6 border-b">
                    <span className="text-xl font-extrabold text-blue-600 tracking-tight">Bony.</span>
                </div>
                <div className="p-4 space-y-1">
                    <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg font-medium cursor-pointer">
                        <LayoutDashboard size={20} />
                        <span>Projects</span>
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                        <Users size={20} />
                        <span>Directory</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                        <Settings size={20} />
                        <span>Settings</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-[#F0F4F8] flex flex-col">
                {/* Header */}
                <header className="h-16 bg-white border-b px-8 flex items-center justify-between">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search insurance..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600">
                            <Bell size={20} />
                        </Button>
                        <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                            GC
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="p-8 overflow-y-auto">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge className="bg-amber-400 hover:bg-amber-500 text-white border-none px-3 py-1 rounded-full shadow-sm shadow-amber-200">
                                    Need Attention
                                    <span className="ml-2 bg-white/20 px-1.5 rounded-full text-xs">4</span>
                                </Badge>
                                <h2 className="text-2xl font-bold text-slate-800">Fisher Residence</h2>
                            </div>
                            <p className="text-slate-500 text-sm">#PROJ-12345 • 32 East Street, Cityville</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-8 border-b border-slate-200 mb-8">
                        <button className="pb-4 text-blue-600 font-semibold border-b-2 border-blue-600">Subcontractors</button>
                        <button className="pb-4 text-slate-500 hover:text-slate-700 font-medium">Requirements</button>
                        <button className="pb-4 text-slate-500 hover:text-slate-700 font-medium">Documents</button>
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-xl font-bold text-slate-900">Lippo Plaza Singapore</h3>
                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">Active</Badge>
                                </div>
                                <p className="text-sm text-slate-400">General Liability Insurance</p>
                            </div>
                            <Button variant="outline" className="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-lg">
                                Edit Details
                            </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-8 mt-8">
                            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                <div className="flex items-center gap-2 text-blue-600 mb-2 font-semibold">
                                    <CheckCircle2 size={18} />
                                    <span>Approved</span>
                                </div>
                                <p className="text-2xl font-bold text-slate-900">$1,200</p>
                                <p className="text-xs text-slate-500 mt-1">Annual Premium</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-2 text-slate-500 mb-2 font-medium">
                                    <AlertCircle size={18} />
                                    <span>Expiration</span>
                                </div>
                                <p className="text-lg font-semibold text-slate-900">Aug 23, 2025</p>
                                <p className="text-xs text-slate-400 mt-1">320 days left</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
