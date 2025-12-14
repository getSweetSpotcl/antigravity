---
name: frontend-design
description: Crea interfaces distintivas y de alta calidad para GiCS. Usa este skill cuando se pida crear componentes web, páginas o aplicaciones frontend con la identidad visual de GiCS.
---

# Frontend Design Skill - GiCS Insurance Platform

Skill para crear interfaces distintivas y de alta calidad para GiCS, el sistema de gestión integral para corredores de seguros chilenos. Evita la estética genérica "AI slop" y produce código frontend profesional, memorable y coherente con la identidad del producto.

## Contexto del Proyecto

- **Framework**: Next.js 15 con App Router
- **UI Library**: shadcn/ui + Radix UI + Tailwind CSS
- **Idioma UI**: Español (Chile)
- **Dominio**: Sistema de gestión de seguros (corredoras)
- **Marca**: GiCS - Gestión Integral para Corredores de Seguros

## Identidad Visual GiCS

### Paleta de Colores Principal

```css
/* Colores GiCS definidos en globals.css */
:root {
  /* Primario - Teal/Cyan Profesional */
  --gics-primary: 173 80% 40%;      /* cyan-600 */
  --gics-primary-light: 174 72% 56%; /* cyan-500 */
  --gics-primary-dark: 175 77% 26%;  /* cyan-800 */

  /* Secundario - Slate Elegante */
  --gics-secondary: 215 28% 17%;     /* slate-800 */
  --gics-secondary-light: 217 19% 27%; /* slate-700 */

  /* Acentos */
  --gics-accent: 45 93% 47%;         /* amber-500 */
}

/* Sidebar Dark Theme */
--sidebar-bg: 222 47% 11%;           /* slate-900 */
--sidebar-bg-accent: 217 33% 17%;    /* slate-800 */
--sidebar-text: 214 32% 91%;         /* slate-200 */
--sidebar-text-muted: 215 20% 65%;   /* slate-400 */
--sidebar-accent: 174 72% 56%;       /* cyan-500 */
```

### Clases Utilitarias GiCS

```css
/* Gradiente de texto para logo/títulos principales */
.text-gradient-gics {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Hover elegante para cards */
.card-hover {
  transition: all 0.2s ease-in-out;
}
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Stat cards con gradientes */
.stat-card-blue { background: linear-gradient(135deg, #eff6ff, #dbeafe); }
.stat-card-emerald { background: linear-gradient(135deg, #ecfdf5, #d1fae5); }
.stat-card-amber { background: linear-gradient(135deg, #fffbeb, #fef3c7); }
.stat-card-purple { background: linear-gradient(135deg, #f5f3ff, #ede9fe); }

/* Glassmorphism para top-nav */
.glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Pulse animation para estados activos */
.status-pulse {
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## Patrones de Diseño

### Status Badges con Dot Indicator

```tsx
// Patrón estándar para badges de estado
<Badge variant="outline" className={`${config.color} border gap-1.5`}>
    <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
    {config.label}
</Badge>

// Config de estados
const statusConfig = {
    ACTIVE: {
        label: "Vigente",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500"
    },
    IN_PROCESS: {
        label: "En Proceso",
        color: "bg-blue-100 text-blue-700 border-blue-200",
        dot: "bg-blue-500 status-pulse" // Con animación
    },
    // ...
}
```

### Stat Cards del Dashboard

```tsx
<Card className="stat-card-emerald border-0 shadow-sm card-hover">
    <CardContent className="p-6">
        <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10">
                <Wallet className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
                <p className="text-sm font-medium text-emerald-600">
                    Comisiones Pendientes
                </p>
                <p className="text-2xl font-bold text-emerald-700 tabular-nums">
                    {amount.toLocaleString("es-CL")} UF
                </p>
            </div>
        </div>
    </CardContent>
</Card>
```

### Sidebar Dark Theme

```tsx
// Sidebar con tema oscuro elegante
<aside className="bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-text))]">
    {/* Logo con gradiente */}
    <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/20">
            <Shield className="h-6 w-6 text-cyan-400" />
        </div>
        <span className="text-xl font-bold tracking-tight text-gradient-gics">
            GiCS
        </span>
    </div>

    {/* Nav items con hover */}
    <NavItem icon={<Icon />} label="Label" href="/path" />
</aside>
```

### Top Navigation con Glassmorphism

```tsx
<header className="glass border-b sticky top-0 z-30">
    <div className="h-16 flex items-center justify-between px-6">
        {/* Content */}
    </div>
</header>
```

### Montos Financieros

```tsx
// Monto con moneda
<span className="font-bold text-teal-700 tabular-nums">
    {Number(amount).toLocaleString("es-CL", { minimumFractionDigits: 2 })}
</span>
<span className="text-xs font-medium text-muted-foreground ml-1">
    {currency}
</span>

// Monto grande destacado
<p className="text-2xl font-bold text-emerald-700 tabular-nums">
    {amount.toLocaleString("es-CL", { minimumFractionDigits: 0 })}
    <span className="text-sm font-semibold ml-1">UF</span>
</p>
```

### Widget Cards

```tsx
<Card className="border-slate-200/80 shadow-sm">
    <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg font-bold">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600">
                <Icon className="h-5 w-5" />
            </div>
            Título del Widget
        </CardTitle>
    </CardHeader>
    <CardContent>
        {/* Contenido */}
    </CardContent>
</Card>
```

### Summary Boxes con Gradiente

```tsx
<div className="grid grid-cols-2 gap-3">
    <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 border border-amber-200/50">
        <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-600">
                <Clock className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                Pendientes
            </span>
        </div>
        <p className="text-2xl font-bold text-amber-700 tabular-nums">
            {amount}
            <span className="text-sm font-semibold ml-1">UF</span>
        </p>
    </div>
</div>
```

## Colores Semánticos por Contexto

| Contexto | Color | Uso |
|----------|-------|-----|
| Éxito/Activo | Emerald | Pólizas vigentes, aprobados, pagado |
| Pendiente | Amber | En espera, por vencer |
| Error/Rechazado | Red | Vencidos, rechazados, cancelados |
| Información | Blue | En proceso, enviados |
| Neutral | Slate | Borradores, cerrados |
| Financiero | Teal/Cyan | Comisiones, montos importantes |

## Tipografía

```tsx
// Título de página
<h1 className="text-2xl font-bold tracking-tight">Título</h1>

// Subtítulo con contexto
<p className="text-muted-foreground">Descripción o contexto</p>

// Etiquetas pequeñas uppercase
<span className="text-xs font-semibold uppercase tracking-wide">
    Etiqueta
</span>

// Números financieros (siempre con tabular-nums)
<span className="tabular-nums font-bold">1.234,56</span>
```

## Animaciones y Transiciones

```tsx
// Hover suave para cards
className="transition-all duration-200 hover:shadow-md"

// Card hover con elevación
className="card-hover" // Clase utilitaria

// Staggered animation para listas
style={{ animationDelay: `${index * 50}ms` }}

// Status pulse para estados activos
className="status-pulse"

// Page transition
className="page-transition" // animate-in fade-in slide-in-from-top-4
```

## Layout y Espaciado

```tsx
// Espaciado entre secciones: generoso
<div className="space-y-6">

// Grids responsivos
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

// Padding de cards
<CardContent className="p-6">

// Gaps en flex
<div className="flex items-center gap-3">
```

## Checklist de Calidad GiCS

Antes de entregar código frontend, verificar:

- [ ] ¿Usa la paleta de colores GiCS?
- [ ] ¿Los estados tienen dot indicators con colores semánticos?
- [ ] ¿Los montos usan `tabular-nums` y formato chileno?
- [ ] ¿Las cards tienen `shadow-sm` y bordes sutiles?
- [ ] ¿El sidebar mantiene el tema oscuro?
- [ ] ¿Los iconos tienen contenedores con fondo?
- [ ] ¿Las transiciones son suaves (200ms)?
- [ ] ¿El texto está en español?

## Archivos de Referencia

- `app/globals.css` - Variables CSS y utilidades
- `components/dashboard/app-sidebar.tsx` - Sidebar dark theme
- `components/dashboard/top-nav.tsx` - Glassmorphism nav
- `app/dashboard/page.tsx` - Dashboard con stat cards
- `components/quotes/quote-list.tsx` - Lista con badges
- `components/dashboard/commissions-widget.tsx` - Widget con gradientes
