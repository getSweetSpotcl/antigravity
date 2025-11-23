"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Bell, LayoutDashboard, Users, Settings, Zap, Shield } from "lucide-react"

export function DesignOptionB() {
    return (
        <div className="flex h-[600px] w-full overflow-hidden rounded-xl border shadow-2xl font-sans text-slate-900 bg-slate-50">
            {/* Sidebar with Gradient */}
            <div className="w-20 lg:w-64 bg-gradient-to-b from-indigo-600 to-violet-700 text-white flex flex-col shadow-lg z-10">
                <div className="h-20 flex items-center px-6">
                    <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                        <Zap className="text-white fill-white" size={20} />
                    </div>
                    <span className="ml-3 text-xl font-bold tracking-wide hidden lg:block">VIBRA</span>
                </div>
                <div className="p-4 space-y-2 flex-1">
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl font-medium cursor-pointer border border-white/10 shadow-inner">
                        <LayoutDashboard size={20} />
                        <span className="hidden lg:block">Dashboard</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-white/5 rounded-xl cursor-pointer transition-all">
                        <Users size={20} />
                        <span className="hidden lg:block">Clients</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-white/5 rounded-xl cursor-pointer transition-all">
                        <Shield size={20} />
                        <span className="hidden lg:block">Policies</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-[#F8FAFC]">
                {/* Header */}
                <header className="h-20 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-0">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                        Overview
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm transition-all w-64"
                            />
                        </div>
                        <Button size="icon" className="rounded-full bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 shadow-sm">
                            <Bell size={20} />
                        </Button>
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 cursor-pointer">
                            <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                <img src="https://github.com/shadcn.png" alt="User" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="p-8 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                            <div className="relative">
                                <p className="text-slate-500 font-medium mb-1">Total Revenue</p>
                                <h3 className="text-3xl font-bold text-slate-800">$45,231</h3>
                                <div className="flex items-center gap-1 text-emerald-500 text-sm mt-2 font-medium bg-emerald-50 w-fit px-2 py-1 rounded-lg">
                                    <span>+20.1%</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                            <div className="relative">
                                <p className="text-slate-500 font-medium mb-1">Active Policies</p>
                                <h3 className="text-3xl font-bold text-slate-800">1,203</h3>
                                <div className="flex items-center gap-1 text-indigo-500 text-sm mt-2 font-medium bg-indigo-50 w-fit px-2 py-1 rounded-lg">
                                    <span>+12 New</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                            <div className="relative h-full flex flex-col justify-between">
                                <div>
                                    <p className="text-indigo-100 font-medium mb-1">Pending Claims</p>
                                    <h3 className="text-3xl font-bold">24</h3>
                                </div>
                                <Button className="bg-white text-indigo-600 hover:bg-indigo-50 border-none w-full mt-4 rounded-xl font-bold">
                                    Review Now
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${i === 1 ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                                            {i === 1 ? <Shield size={24} /> : <Users size={24} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">New Policy Created</p>
                                            <p className="text-sm text-slate-500">Just now • by Admin</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-slate-900">$350.00</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
