# Plan de Mejora de Listas - Antigravity

## Resumen Ejecutivo

Este plan detalla la implementación de búsqueda, paginación, filtrado y ordenamiento para todas las listas de la aplicación. Se utilizará un enfoque de componentes reutilizables con una arquitectura que soporte tanto filtrado client-side (para datasets pequeños) como server-side (para datasets grandes).

## Estado Actual

| Componente | Búsqueda | Filtrado | Ordenamiento | Paginación |
|------------|----------|----------|--------------|------------|
| policy-list.tsx | ✅ Parcial | ✅ Status, Tipo | ❌ | ❌ |
| commission-list.tsx | ✅ Parcial | ✅ Status | ❌ | ❌ |
| quote-list.tsx | ❌ | ❌ | ❌ | ❌ |
| claim-list.tsx | ❌ | ❌ | ❌ | ❌ |
| client-list.tsx | ❌ | ❌ | ❌ | ❌ |
| user-list.tsx | ❌ | ❌ | ❌ | ❌ |
| endorsement-list.tsx | ❌ | ❌ | ❌ | ❌ |

---

## Arquitectura Propuesta

### Fase 1: Componentes Base Reutilizables

#### 1.1 DataTable Genérico (`components/ui/data-table.tsx`)

```typescript
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  searchFields?: (keyof T)[]
  filterable?: FilterConfig[]
  sortable?: boolean
  paginated?: boolean
  pageSize?: number
  pageSizeOptions?: number[]
  emptyMessage?: string
  loading?: boolean
}
```

**Características:**
- Integración con `@tanstack/react-table` para manejo de estado
- Soporte para columnas con ordenamiento clickeable
- Búsqueda global con debounce (300ms)
- Filtros configurables por columna
- Paginación con selector de tamaño de página
- Estado persistente en URL (query params)

#### 1.2 Componentes de UI Específicos

```
components/ui/
├── data-table/
│   ├── data-table.tsx          # Componente principal
│   ├── data-table-toolbar.tsx  # Búsqueda + Filtros
│   ├── data-table-pagination.tsx
│   ├── data-table-column-header.tsx  # Header sorteable
│   ├── data-table-faceted-filter.tsx # Filtros tipo faceted
│   └── data-table-view-options.tsx   # Toggle de columnas
```

#### 1.3 Hook Personalizado (`hooks/use-data-table.ts`)

```typescript
interface UseDataTableOptions<T> {
  data: T[]
  columns: ColumnDef<T>[]
  defaultSorting?: SortingState
  defaultPageSize?: number
  searchFields?: string[]
  filterFields?: FilterFieldConfig[]
  persistInUrl?: boolean
}

function useDataTable<T>(options: UseDataTableOptions<T>) {
  // Retorna: table instance, handlers, estados
}
```

---

### Fase 2: Implementación por Lista

#### 2.1 Lista de Pólizas (`policy-list.tsx`)

**Filtros:**
- Estado: `ACTIVE`, `EXPIRED`, `CANCELLED`, `RENEWED`
- Tipo: `GENERAL`, `LIFE`, `HEALTH`, `AUTO`, `HOME`, `GUARANTEE`
- Compañía de seguros (dropdown dinámico)
- Rango de fechas de vigencia

**Búsqueda:** Número, compañía, cliente, RUT

**Ordenamiento:**
- Número de póliza
- Fecha de inicio (default: desc)
- Fecha de término
- Prima
- Cliente

**Paginación:** 10, 25, 50, 100 registros

---

#### 2.2 Lista de Cotizaciones (`quote-list.tsx`)

**Filtros:**
- Estado: `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`
- Tipo de póliza
- Compañía de seguros
- Rango de fechas

**Búsqueda:** Cliente/prospecto, número, compañía

**Ordenamiento:**
- Fecha de creación (default: desc)
- Prima total
- Cliente
- Estado

**Paginación:** 10, 25, 50 registros

---

#### 2.3 Lista de Siniestros (`claim-list.tsx`)

**Filtros:**
- Estado: `REPORTED`, `IN_PROCESS`, `APPROVED`, `REJECTED`, `CLOSED`
- Compañía de seguros
- Rango de fechas del siniestro
- Rango de montos

**Búsqueda:** Número, cliente, póliza, descripción

**Ordenamiento:**
- Fecha del siniestro (default: desc)
- Monto reclamado
- Estado
- Cliente

**Paginación:** 10, 25, 50 registros

---

#### 2.4 Lista de Clientes (`client-list.tsx`)

**Filtros:**
- Con pólizas activas (sí/no)
- Con cotizaciones pendientes (sí/no)

**Búsqueda:** RUT, nombre, email, teléfono

**Ordenamiento:**
- Nombre (default: asc)
- RUT
- Fecha de registro
- Cantidad de pólizas

**Paginación:** 10, 25, 50, 100 registros

---

#### 2.5 Lista de Comisiones (`commission-list.tsx`)

**Filtros:**
- Estado: `PENDING`, `PARTIAL`, `PAID`, `OVERDUE`, `CANCELLED`
- Compañía de seguros
- Rango de fechas de vencimiento
- Rango de montos

**Búsqueda:** Póliza, cliente, RUT

**Ordenamiento:**
- Fecha de vencimiento (default: asc para pendientes)
- Monto
- Monto pendiente
- Estado

**Paginación:** 10, 25, 50 registros

**Nota especial:** Mantener el resumen de totales (Total, Pagado, Pendiente)

---

#### 2.6 Lista de Usuarios (`user-list.tsx`)

**Filtros:**
- Rol: `SUPER_ADMIN`, `BROKERAGE_ADMIN`, `AGENT`
- Estado: Activo/Inactivo

**Búsqueda:** Nombre, email

**Ordenamiento:**
- Nombre (default: asc)
- Email
- Rol
- Fecha de creación

**Paginación:** 10, 25, 50 registros

---

#### 2.7 Lista de Endosos (`endorsement-list.tsx`)

**Filtros:**
- Tipo: `GENERAL_MODIFICATION`, `RENEWAL`, `CANCELLATION`, `INCLUSION`, `EXCLUSION`

**Búsqueda:** Número, descripción

**Ordenamiento:**
- Fecha (default: desc)
- Tipo
- Cambio de prima

**Paginación:** Opcional (generalmente pocos por póliza)

---

### Fase 3: Mejoras de UX

#### 3.1 Estado Persistente en URL

Los filtros, búsqueda, ordenamiento y página actual se guardarán en query params:
```
/dashboard/policies?status=ACTIVE&type=AUTO&sort=startDate:desc&page=2&size=25&q=mapfre
```

**Beneficios:**
- URLs compartibles
- Navegación con botón atrás
- Bookmarks

#### 3.2 Indicadores Visuales

- Loading skeletons durante carga
- Contador de resultados filtrados vs total
- Indicador de filtros activos con opción "Limpiar todos"
- Highlight de texto buscado en resultados

#### 3.3 Accesibilidad

- Navegación por teclado completa
- ARIA labels en controles
- Anuncios de lectores de pantalla para cambios de estado

---

## Plan de Implementación

### Sprint 1: Infraestructura Base (Prioridad Alta)

| Tarea | Archivo | Estimación |
|-------|---------|------------|
| Instalar @tanstack/react-table | package.json | - |
| Crear DataTable base | components/ui/data-table/data-table.tsx | - |
| Crear DataTableToolbar | components/ui/data-table/data-table-toolbar.tsx | - |
| Crear DataTablePagination | components/ui/data-table/data-table-pagination.tsx | - |
| Crear DataTableColumnHeader | components/ui/data-table/data-table-column-header.tsx | - |
| Crear hook useDataTable | hooks/use-data-table.ts | - |

### Sprint 2: Listas Principales (Prioridad Alta)

| Tarea | Archivo |
|-------|---------|
| Refactorizar PolicyList | components/policies/policy-list.tsx |
| Refactorizar QuoteList | components/quotes/quote-list.tsx |
| Refactorizar ClaimList | components/claims/claim-list.tsx |

### Sprint 3: Listas Secundarias (Prioridad Media)

| Tarea | Archivo |
|-------|---------|
| Refactorizar ClientList | components/clients/client-list.tsx |
| Refactorizar CommissionList | components/commissions/commission-list.tsx |
| Refactorizar UserList | components/settings/user-list.tsx |

### Sprint 4: Listas Menores y Pulido (Prioridad Baja)

| Tarea | Archivo |
|-------|---------|
| Refactorizar EndorsementList | components/policies/endorsements/endorsement-list.tsx |
| Implementar URL state persistence | lib/url-state.ts |
| Agregar loading skeletons | - |
| Testing y QA | - |

---

## Dependencias Nuevas

```json
{
  "@tanstack/react-table": "^8.x"
}
```

---

## Estructura de Archivos Final

```
components/
├── ui/
│   └── data-table/
│       ├── index.ts
│       ├── data-table.tsx
│       ├── data-table-toolbar.tsx
│       ├── data-table-pagination.tsx
│       ├── data-table-column-header.tsx
│       ├── data-table-faceted-filter.tsx
│       └── data-table-view-options.tsx
├── policies/
│   └── policy-list.tsx (refactorizado)
├── quotes/
│   └── quote-list.tsx (refactorizado)
├── claims/
│   └── claim-list.tsx (refactorizado)
├── clients/
│   └── client-list.tsx (refactorizado)
├── commissions/
│   └── commission-list.tsx (refactorizado)
└── settings/
    └── user-list.tsx (refactorizado)

hooks/
└── use-data-table.ts

lib/
└── url-state.ts
```

---

## Consideraciones Técnicas

### Client-side vs Server-side

**Client-side (actual):** Adecuado para datasets < 1000 registros
- Pros: Respuesta instantánea, sin llamadas a servidor
- Cons: Carga inicial pesada, memoria del navegador

**Server-side (futuro):** Necesario para datasets > 1000 registros
- Implementar cuando se necesite
- Requiere modificar server actions para aceptar parámetros de paginación/filtrado

### Performance

- Implementar virtualización para listas muy largas (react-virtual)
- Debounce en búsqueda (300ms)
- Memoización de filtros y ordenamiento
- Lazy loading de opciones de filtros

---

## Métricas de Éxito

1. **Usabilidad:** Usuarios pueden encontrar registros en < 3 clicks
2. **Performance:** Tiempo de filtrado < 100ms para datasets normales
3. **Consistencia:** Todas las listas tienen la misma UX
4. **Accesibilidad:** Cumplimiento WCAG 2.1 AA

---

## Notas Adicionales

- Mantener compatibilidad con exportación a Excel/CSV existente
- Los filtros deben poder resetearse individualmente y en grupo
- Considerar modo mobile con filtros colapsables
- Agregar indicador visual cuando hay filtros activos
