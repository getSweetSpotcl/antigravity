"use client"

import { useState } from "react"
import { Shield, FileText, Users, Wallet, AlertTriangle, TrendingUp, Bell, Settings, LogOut, Search, Plus, ChevronRight, Calendar, Building2, Car, Home, Heart, FileCheck, BarChart3, Clock, CheckCircle, XCircle, ArrowUpRight, ArrowDownRight, Sparkles, Zap, Globe, Lock, Layers, Activity } from "lucide-react"

// Design 1: Corporate Blue - Profesional y Tradicional
const Design1 = () => (
  <div className="min-h-screen bg-slate-50 font-sans">
    {/* Sidebar */}
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#1e3a5f] text-white">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">GiCS</h1>
            <p className="text-xs text-sky-300">Insurance Platform</p>
          </div>
        </div>
      </div>
      <nav className="p-4 space-y-1">
        {[
          { icon: BarChart3, label: "Dashboard", active: true },
          { icon: FileText, label: "Cotizaciones" },
          { icon: FileCheck, label: "Pólizas" },
          { icon: AlertTriangle, label: "Siniestros" },
          { icon: Users, label: "Clientes" },
          { icon: Wallet, label: "Comisiones" },
        ].map((item, i) => (
          <a key={i} href="#" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${item.active ? 'bg-sky-500/20 text-sky-300' : 'text-slate-300 hover:bg-white/5'}`}>
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </a>
        ))}
      </nav>
    </aside>

    {/* Main Content */}
    <main className="ml-64 p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-500">Resumen de operaciones</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Buscar..." />
          </div>
          <button className="bg-sky-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-sky-700 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nueva Cotización
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { label: "Pólizas Activas", value: "156", change: "+12%", icon: FileCheck, color: "sky" },
          { label: "Cotizaciones", value: "43", change: "+8%", icon: FileText, color: "emerald" },
          { label: "Siniestros", value: "7", change: "-2", icon: AlertTriangle, color: "amber" },
          { label: "Comisiones", value: "234 UF", change: "+15%", icon: Wallet, color: "violet" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
              </div>
              <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-emerald-600' : 'text-red-600'} flex items-center gap-1`}>
                {stat.change.startsWith('+') ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Pólizas Recientes</h3>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Número</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Prima</th>
            </tr>
          </thead>
          <tbody>
            {[
              { num: "POL-2024-001", client: "Juan Pérez", type: "Auto", status: "Vigente", prima: "45.5 UF" },
              { num: "POL-2024-002", client: "María González", type: "Hogar", status: "Vigente", prima: "32.0 UF" },
              { num: "POL-2024-003", client: "Carlos López", type: "Vida", status: "Por Vencer", prima: "28.5 UF" },
            ].map((row, i) => (
              <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-sky-600">{row.num}</td>
                <td className="px-6 py-4 text-slate-700">{row.client}</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-sm">{row.type}</span></td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'Vigente' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-semibold text-slate-800">{row.prima}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  </div>
)

// Design 2: Modern Gradient - Vibrante y Moderno
const Design2 = () => (
  <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 font-sans">
    {/* Sidebar */}
    <aside className="fixed left-0 top-0 h-full w-72 bg-white/5 backdrop-blur-xl border-r border-white/10">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">GiCS</h1>
            <p className="text-xs text-violet-300 font-medium">Smart Insurance</p>
          </div>
        </div>
        <nav className="space-y-2">
          {[
            { icon: Activity, label: "Dashboard", active: true },
            { icon: FileText, label: "Cotizaciones" },
            { icon: Layers, label: "Pólizas" },
            { icon: Zap, label: "Siniestros" },
            { icon: Users, label: "Clientes" },
            { icon: TrendingUp, label: "Comisiones" },
          ].map((item, i) => (
            <a key={i} href="#" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.active ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-white border border-violet-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <item.icon className="h-5 w-5" />
              <span className="font-semibold">{item.label}</span>
              {item.active && <div className="ml-auto w-2 h-2 rounded-full bg-violet-400 animate-pulse" />}
            </a>
          ))}
        </nav>
      </div>
    </aside>

    {/* Main Content */}
    <main className="ml-72 p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-white">Dashboard</h2>
          <p className="text-slate-400">Bienvenido de vuelta</p>
        </div>
        <button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nueva Cotización
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { label: "Pólizas Activas", value: "156", icon: Layers, gradient: "from-cyan-500 to-blue-500" },
          { label: "Cotizaciones", value: "43", icon: FileText, gradient: "from-violet-500 to-purple-500" },
          { label: "Siniestros", value: "7", icon: Zap, gradient: "from-orange-500 to-red-500" },
          { label: "Comisiones", value: "234 UF", icon: TrendingUp, gradient: "from-emerald-500 to-teal-500" },
        ].map((stat, i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 group hover:bg-white/10 transition-all">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${stat.gradient} opacity-20 blur-2xl group-hover:opacity-30 transition-all`} />
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4 shadow-lg`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <p className="text-4xl font-black text-white">{stat.value}</p>
            <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">Pólizas Recientes</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Número</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
              <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Prima</th>
            </tr>
          </thead>
          <tbody>
            {[
              { num: "POL-2024-001", client: "Juan Pérez", type: "Auto", status: "Vigente", prima: "45.5 UF" },
              { num: "POL-2024-002", client: "María González", type: "Hogar", status: "Vigente", prima: "32.0 UF" },
              { num: "POL-2024-003", client: "Carlos López", type: "Vida", status: "Por Vencer", prima: "28.5 UF" },
            ].map((row, i) => (
              <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-all">
                <td className="px-6 py-4 font-bold text-violet-400">{row.num}</td>
                <td className="px-6 py-4 text-white">{row.client}</td>
                <td className="px-6 py-4"><span className="px-3 py-1 bg-white/10 text-white rounded-lg text-sm">{row.type}</span></td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${row.status === 'Vigente' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-bold text-white">{row.prima}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  </div>
)

// Design 3: Clean Minimal - Limpio y Minimalista
const Design3 = () => (
  <div className="min-h-screen bg-white font-sans">
    {/* Top Bar */}
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 z-50 flex items-center px-8">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
          <span className="text-white font-black text-sm">G</span>
        </div>
        <span className="text-xl font-bold tracking-tight">gics</span>
      </div>
      <nav className="ml-12 flex items-center gap-8">
        {["Dashboard", "Cotizaciones", "Pólizas", "Siniestros", "Clientes"].map((item, i) => (
          <a key={i} href="#" className={`text-sm font-medium ${i === 0 ? 'text-black' : 'text-slate-400 hover:text-black'} transition-colors`}>
            {item}
          </a>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-4">
        <button className="text-slate-400 hover:text-black">
          <Search className="h-5 w-5" />
        </button>
        <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">
          + Nueva
        </button>
      </div>
    </header>

    {/* Main Content */}
    <main className="pt-16 px-8 py-12 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-black mb-2">Dashboard</h1>
        <p className="text-slate-400">Resumen de tu cartera de seguros</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-8 mb-12">
        {[
          { label: "Pólizas", value: "156", sub: "activas" },
          { label: "Cotizaciones", value: "43", sub: "este mes" },
          { label: "Siniestros", value: "7", sub: "abiertos" },
          { label: "Comisiones", value: "234", sub: "UF pendientes" },
        ].map((stat, i) => (
          <div key={i} className="group">
            <p className="text-6xl font-bold text-black tracking-tight group-hover:text-slate-600 transition-colors">{stat.value}</p>
            <p className="text-sm text-slate-400 mt-2">{stat.label} <span className="text-slate-300">· {stat.sub}</span></p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-black">Actividad reciente</h2>
          <a href="#" className="text-sm text-slate-400 hover:text-black">Ver todo →</a>
        </div>
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase">Póliza</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase">Cliente</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase">Tipo</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-slate-400 uppercase">Estado</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-slate-400 uppercase">Prima</th>
              </tr>
            </thead>
            <tbody>
              {[
                { num: "POL-2024-001", client: "Juan Pérez", type: "Automóvil", status: "Vigente", prima: "45.5" },
                { num: "POL-2024-002", client: "María González", type: "Hogar", status: "Vigente", prima: "32.0" },
                { num: "POL-2024-003", client: "Carlos López", type: "Vida", status: "Por Vencer", prima: "28.5" },
              ].map((row, i) => (
                <tr key={i} className="border-t border-slate-50 hover:bg-slate-50 cursor-pointer">
                  <td className="px-6 py-5 font-medium text-black">{row.num}</td>
                  <td className="px-6 py-5 text-slate-600">{row.client}</td>
                  <td className="px-6 py-5 text-slate-400">{row.type}</td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 ${row.status === 'Vigente' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'Vigente' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-semibold text-black tabular-nums">{row.prima} UF</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
)

// Design 4: Nature Green - Fresco y Natural
const Design4 = () => (
  <div className="min-h-screen bg-stone-50 font-serif">
    {/* Sidebar */}
    <aside className="fixed left-0 top-0 h-full w-64 bg-emerald-950 text-white">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">GiCS</h1>
            <p className="text-xs text-emerald-300">Seguros Sustentables</p>
          </div>
        </div>
        <nav className="space-y-1">
          {[
            { icon: BarChart3, label: "Inicio", active: true },
            { icon: FileText, label: "Cotizaciones" },
            { icon: FileCheck, label: "Pólizas" },
            { icon: AlertTriangle, label: "Siniestros" },
            { icon: Users, label: "Clientes" },
            { icon: Wallet, label: "Comisiones" },
          ].map((item, i) => (
            <a key={i} href="#" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.active ? 'bg-emerald-800 text-emerald-100' : 'text-emerald-300 hover:text-white hover:bg-emerald-900'}`}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </aside>

    {/* Main Content */}
    <main className="ml-64 p-10">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-bold text-stone-800">Bienvenido</h2>
          <p className="text-stone-500 mt-1">Tu resumen del día</p>
        </div>
        <button className="bg-emerald-600 text-white px-5 py-3 rounded-full font-medium hover:bg-emerald-700 flex items-center gap-2 shadow-lg shadow-emerald-200">
          <Plus className="h-5 w-5" />
          Nueva Cotización
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        {[
          { label: "Pólizas Activas", value: "156", icon: FileCheck, bg: "bg-emerald-100", color: "text-emerald-700", iconColor: "text-emerald-600" },
          { label: "Cotizaciones", value: "43", icon: FileText, bg: "bg-teal-100", color: "text-teal-700", iconColor: "text-teal-600" },
          { label: "Siniestros", value: "7", icon: AlertTriangle, bg: "bg-amber-100", color: "text-amber-700", iconColor: "text-amber-600" },
          { label: "Comisiones", value: "234 UF", icon: Wallet, bg: "bg-stone-100", color: "text-stone-700", iconColor: "text-stone-600" },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} rounded-3xl p-6`}>
            <stat.icon className={`h-8 w-8 ${stat.iconColor} mb-4`} />
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-stone-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h3 className="text-xl font-semibold text-stone-800">Últimas pólizas</h3>
        </div>
        <table className="w-full">
          <thead className="bg-stone-50">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-semibold text-stone-400 uppercase tracking-wider">Número</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-stone-400 uppercase tracking-wider">Cliente</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-stone-400 uppercase tracking-wider">Tipo</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-stone-400 uppercase tracking-wider">Estado</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-stone-400 uppercase tracking-wider">Prima</th>
            </tr>
          </thead>
          <tbody>
            {[
              { num: "POL-2024-001", client: "Juan Pérez", type: "Auto", status: "Vigente", prima: "45.5 UF" },
              { num: "POL-2024-002", client: "María González", type: "Hogar", status: "Vigente", prima: "32.0 UF" },
              { num: "POL-2024-003", client: "Carlos López", type: "Vida", status: "Por Vencer", prima: "28.5 UF" },
            ].map((row, i) => (
              <tr key={i} className="border-t border-stone-50 hover:bg-stone-50">
                <td className="px-6 py-4 font-medium text-emerald-700">{row.num}</td>
                <td className="px-6 py-4 text-stone-700">{row.client}</td>
                <td className="px-6 py-4 text-stone-500">{row.type}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.status === 'Vigente' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-semibold text-stone-800">{row.prima}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  </div>
)

// Design 5: Neon Cyberpunk - Futurista y Bold
const Design5 = () => (
  <div className="min-h-screen bg-black font-mono">
    {/* Sidebar */}
    <aside className="fixed left-0 top-0 h-full w-64 bg-black border-r border-cyan-500/30">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 border-2 border-cyan-400 flex items-center justify-center relative">
            <Lock className="h-5 w-5 text-cyan-400" />
            <div className="absolute inset-0 bg-cyan-400/20 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-cyan-400 tracking-widest">GICS</h1>
            <p className="text-xs text-cyan-600">SYS.INSURANCE</p>
          </div>
        </div>
        <nav className="space-y-1">
          {[
            { icon: Activity, label: "DASHBOARD", active: true },
            { icon: FileText, label: "QUOTES" },
            { icon: Lock, label: "POLICIES" },
            { icon: Zap, label: "CLAIMS" },
            { icon: Users, label: "CLIENTS" },
            { icon: TrendingUp, label: "COMMISSIONS" },
          ].map((item, i) => (
            <a key={i} href="#" className={`flex items-center gap-3 px-4 py-3 border transition-all ${item.active ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-transparent text-slate-500 hover:text-cyan-400 hover:border-cyan-400/30'}`}>
              <item.icon className="h-4 w-4" />
              <span className="text-xs tracking-wider">{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </aside>

    {/* Main Content */}
    <main className="ml-64 p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wider">SYSTEM OVERVIEW</h2>
          <p className="text-cyan-600 text-sm">REAL-TIME DATA SYNC</p>
        </div>
        <button className="border-2 border-cyan-400 text-cyan-400 px-6 py-2 font-bold tracking-wider hover:bg-cyan-400 hover:text-black transition-all flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4" />
          NEW_QUOTE
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "ACTIVE_POLICIES", value: "156", status: "ONLINE" },
          { label: "PENDING_QUOTES", value: "043", status: "PROCESSING" },
          { label: "OPEN_CLAIMS", value: "007", status: "ALERT" },
          { label: "COMMISSION_UF", value: "234", status: "SYNCED" },
        ].map((stat, i) => (
          <div key={i} className="border border-cyan-500/30 bg-cyan-500/5 p-6 relative overflow-hidden group hover:border-cyan-400 transition-all">
            <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-400/10 blur-2xl group-hover:bg-cyan-400/20 transition-all" />
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-2 h-2 rounded-full ${stat.status === 'ALERT' ? 'bg-red-500 animate-pulse' : 'bg-cyan-400'}`} />
              <span className="text-xs text-cyan-600">{stat.status}</span>
            </div>
            <p className="text-4xl font-bold text-white font-mono">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-2 tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="border border-cyan-500/30 bg-cyan-500/5">
        <div className="p-4 border-b border-cyan-500/30 flex items-center justify-between">
          <h3 className="text-sm font-bold text-cyan-400 tracking-wider">RECENT_TRANSACTIONS</h3>
          <span className="text-xs text-cyan-600">LIVE</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-cyan-500/20">
              <th className="text-left px-4 py-3 text-xs text-cyan-600 tracking-wider">ID</th>
              <th className="text-left px-4 py-3 text-xs text-cyan-600 tracking-wider">CLIENT</th>
              <th className="text-left px-4 py-3 text-xs text-cyan-600 tracking-wider">TYPE</th>
              <th className="text-left px-4 py-3 text-xs text-cyan-600 tracking-wider">STATUS</th>
              <th className="text-right px-4 py-3 text-xs text-cyan-600 tracking-wider">VALUE</th>
            </tr>
          </thead>
          <tbody>
            {[
              { num: "POL_001", client: "PEREZ.J", type: "AUTO", status: "ACTIVE", prima: "45.5" },
              { num: "POL_002", client: "GONZALEZ.M", type: "HOME", status: "ACTIVE", prima: "32.0" },
              { num: "POL_003", client: "LOPEZ.C", type: "LIFE", status: "EXPIRING", prima: "28.5" },
            ].map((row, i) => (
              <tr key={i} className="border-t border-cyan-500/10 hover:bg-cyan-400/5">
                <td className="px-4 py-4 font-mono text-cyan-400">{row.num}</td>
                <td className="px-4 py-4 text-white">{row.client}</td>
                <td className="px-4 py-4 text-slate-400">{row.type}</td>
                <td className="px-4 py-4">
                  <span className={`text-xs font-mono ${row.status === 'ACTIVE' ? 'text-green-400' : 'text-yellow-400'}`}>
                    [{row.status}]
                  </span>
                </td>
                <td className="px-4 py-4 text-right font-mono text-white">{row.prima}_UF</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  </div>
)

// Design 6: Warm Elegant - Cálido y Elegante
const Design6 = () => (
  <div className="min-h-screen bg-amber-50/50 font-sans">
    {/* Sidebar */}
    <aside className="fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-amber-900 to-amber-950 text-white">
      <div className="p-8">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-900/50">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">GiCS</h1>
            <p className="text-amber-300 text-sm">Premium Insurance</p>
          </div>
        </div>
        <nav className="space-y-2">
          {[
            { icon: BarChart3, label: "Dashboard", active: true },
            { icon: FileText, label: "Cotizaciones" },
            { icon: FileCheck, label: "Pólizas" },
            { icon: AlertTriangle, label: "Siniestros" },
            { icon: Users, label: "Clientes" },
            { icon: Wallet, label: "Comisiones" },
          ].map((item, i) => (
            <a key={i} href="#" className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${item.active ? 'bg-white/10 text-amber-200 shadow-lg' : 'text-amber-100/60 hover:text-white hover:bg-white/5'}`}>
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </aside>

    {/* Main Content */}
    <main className="ml-72 p-10">
      <header className="flex items-center justify-between mb-10">
        <div>
          <p className="text-amber-600 font-medium mb-1">Buenas tardes,</p>
          <h2 className="text-3xl font-bold text-amber-950">Panel Principal</h2>
        </div>
        <button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 rounded-2xl font-semibold hover:shadow-xl hover:shadow-amber-200 transition-all flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nueva Cotización
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        {[
          { label: "Pólizas Activas", value: "156", change: "+12%", icon: FileCheck },
          { label: "Cotizaciones", value: "43", change: "+8%", icon: FileText },
          { label: "Siniestros", value: "7", change: "-2", icon: AlertTriangle },
          { label: "Comisiones", value: "234 UF", change: "+15%", icon: Wallet },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-amber-100 hover:shadow-lg hover:shadow-amber-100 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <stat.icon className="h-7 w-7 text-amber-600" />
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${stat.change.startsWith('+') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-4xl font-bold text-amber-950 mb-1">{stat.value}</p>
            <p className="text-amber-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-amber-100 overflow-hidden">
        <div className="p-6 border-b border-amber-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-amber-950">Pólizas Recientes</h3>
          <a href="#" className="text-amber-600 hover:text-amber-700 font-medium">Ver todas →</a>
        </div>
        <table className="w-full">
          <thead className="bg-amber-50/50">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-semibold text-amber-600 uppercase tracking-wider">Número</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-amber-600 uppercase tracking-wider">Cliente</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-amber-600 uppercase tracking-wider">Tipo</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-amber-600 uppercase tracking-wider">Estado</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-amber-600 uppercase tracking-wider">Prima</th>
            </tr>
          </thead>
          <tbody>
            {[
              { num: "POL-2024-001", client: "Juan Pérez", type: "Automóvil", status: "Vigente", prima: "45.5 UF" },
              { num: "POL-2024-002", client: "María González", type: "Hogar", status: "Vigente", prima: "32.0 UF" },
              { num: "POL-2024-003", client: "Carlos López", type: "Vida", status: "Por Vencer", prima: "28.5 UF" },
            ].map((row, i) => (
              <tr key={i} className="border-t border-amber-50 hover:bg-amber-50/50 cursor-pointer">
                <td className="px-6 py-5 font-semibold text-amber-700">{row.num}</td>
                <td className="px-6 py-5 text-amber-900">{row.client}</td>
                <td className="px-6 py-5"><span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm">{row.type}</span></td>
                <td className="px-6 py-5">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${row.status === 'Vigente' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                    <span className={`w-2 h-2 rounded-full ${row.status === 'Vigente' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-right font-bold text-amber-950">{row.prima}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  </div>
)

// Tab labels
const designs = [
  { id: 1, name: "Corporate Blue", desc: "Profesional y tradicional", component: Design1 },
  { id: 2, name: "Modern Gradient", desc: "Vibrante y moderno", component: Design2 },
  { id: 3, name: "Clean Minimal", desc: "Limpio y minimalista", component: Design3 },
  { id: 4, name: "Nature Green", desc: "Fresco y natural", component: Design4 },
  { id: 5, name: "Neon Cyberpunk", desc: "Futurista y bold", component: Design5 },
  { id: 6, name: "Warm Elegant", desc: "Cálido y elegante", component: Design6 },
]

export default function DesignPreviewPage() {
  const [activeTab, setActiveTab] = useState(1)
  const ActiveDesign = designs.find(d => d.id === activeTab)?.component || Design1

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Tab Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-16 gap-2 overflow-x-auto">
            <span className="text-slate-500 text-sm font-medium mr-4 whitespace-nowrap">Selecciona un diseño:</span>
            {designs.map((design) => (
              <button
                key={design.id}
                onClick={() => setActiveTab(design.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === design.id
                    ? 'bg-white text-slate-900'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {design.id}. {design.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Design Info */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold">{designs.find(d => d.id === activeTab)?.name}</h2>
            <p className="text-slate-400 text-sm">{designs.find(d => d.id === activeTab)?.desc}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm">¿Te gusta este diseño?</span>
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">
              Seleccionar este
            </button>
          </div>
        </div>
      </div>

      {/* Design Preview */}
      <div className="pt-32">
        <ActiveDesign />
      </div>
    </div>
  )
}
