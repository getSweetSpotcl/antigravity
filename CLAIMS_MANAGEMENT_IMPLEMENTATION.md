# Implementación: Claims Management (Gestión de Siniestros)

**Fecha:** 22 de Noviembre de 2025  
**Estado:** ✅ Completado

## Resumen

Se ha implementado un sistema completo para la gestión de siniestros, permitiendo a los corredores reportar, seguir y gestionar el ciclo de vida completo de los siniestros asociados a pólizas activas.

## Componentes Implementados

### 1. Schema de Validación

**Archivo:** `schemas/claim.ts`

- `ClaimSchema`: Validación para creación de siniestros
  - `policyId`: Póliza afectada (requerido)
  - `description`: Descripción mínima de 10 caracteres
  - `date`: Fecha del siniestro (no puede ser futura)
  - `number`: Número de siniestro (opcional)

- `UpdateClaimStatusSchema`: Validación para cambio de estado
  - `claimId`: ID del siniestro
  - `status`: Nuevo estado (enum ClaimStatus)
  - `notes`: Notas opcionales

### 2. Server Actions

**Archivo:** `actions/claim.ts`

#### Funciones CRUD
- **`getClaims()`**: Obtiene todos los siniestros del tenant
  - Incluye relaciones con póliza, cliente y compañía
  - Ordenados por fecha de creación (más recientes primero)

- **`getClaimById(claimId)`**: Obtiene detalle de un siniestro específico
  - Validación de pertenencia al tenant
  - Incluye todas las relaciones necesarias

- **`createClaim(values)`**: Crea un nuevo siniestro
  - Valida que la póliza pertenezca al tenant
  - Estado inicial: `REPORTED`
  - Revalida rutas automáticamente

- **`updateClaimStatus(values)`**: Actualiza el estado del siniestro
  - Valida pertenencia al tenant
  - Estados disponibles:
    - `REPORTED` (Reportado)
    - `IN_PROCESS` (En Proceso)
    - `APPROVED` (Aprobado)
    - `REJECTED` (Rechazado)
    - `CLOSED` (Cerrado)

- **`getPoliciesForClaim()`**: Obtiene pólizas activas para selector
  - Solo pólizas con estado `ACTIVE`
  - Incluye información del cliente

### 3. Componentes de UI

#### `CreateClaimDialog`
Diálogo modal para reportar nuevos siniestros:
- Selector de póliza activa (muestra número y cliente)
- Selector de fecha (no permite fechas futuras)
- Campo de número de siniestro (opcional)
- Área de texto para descripción detallada (mínimo 10 caracteres)
- Validación en tiempo real con Zod

#### `ClaimList`
Tabla de siniestros con:
- Número de siniestro (enlace a detalle)
- Póliza afectada (enlace a detalle de póliza)
- Cliente
- Compañía aseguradora
- Fecha del siniestro
- Badge de estado con colores:
  - **Reportado**: Secondary (gris)
  - **En Proceso**: Default (azul)
  - **Aprobado**: Outline (verde)
  - **Rechazado**: Destructive (rojo)
  - **Cerrado**: Secondary (gris)
- Descripción truncada

#### `UpdateClaimStatus`
Card para actualizar estado:
- Selector de estado con todas las opciones
- Botón de actualización
- Deshabilita botón si estado no cambia
- Feedback con toast notifications

### 4. Páginas

#### `/dashboard/claims`
**Página principal de siniestros**
- Header con título y descripción
- Botón "Reportar Siniestro" (ícono AlertTriangle)
- Lista completa de siniestros
- Datos cargados server-side

#### `/dashboard/claims/[id]`
**Página de detalle de siniestro**
- Badge de estado prominente
- Fecha de reporte
- **Card de Información del Siniestro:**
  - Fecha del siniestro
  - Descripción completa
  
- **Card de Póliza Afectada:**
  - Número de póliza (enlace clickeable)
  - Información del cliente (nombre y RUT)
  - Compañía aseguradora

- **Timeline Visual:**
  - Muestra eventos cronológicos
  - Indicador visual con puntos y líneas
  - "Siniestro Reportado" (siempre presente)
  - Cambios de estado con timestamp

- **Card de Actualización de Estado:**
  - Selector de nuevo estado
  - Botón para confirmar cambio

### 5. Integración

✅ **Sidebar**: Enlace a "Siniestros" con ícono `ShieldAlert`  
✅ **Relación con Pólizas**: Enlaces bidireccionales  
✅ **Multi-tenant**: Todas las queries filtran por `tenantId`  
✅ **Seguridad**: Validación de sesión en todas las acciones

## Flujo de Trabajo

### Reportar Siniestro
1. Usuario navega a `/dashboard/claims`
2. Click en "Reportar Siniestro"
3. Selecciona póliza afectada del dropdown
4. Ingresa fecha del siniestro
5. Opcionalmente ingresa número de siniestro
6. Describe el siniestro (mínimo 10 caracteres)
7. Click en "Reportar Siniestro"
8. Sistema:
   - Valida póliza pertenece al tenant
   - Crea siniestro con estado `REPORTED`
   - Muestra confirmación
   - Recarga página para mostrar nuevo siniestro

### Gestionar Estado
1. Usuario navega a detalle del siniestro
2. Revisa información y timeline
3. Selecciona nuevo estado en el card lateral
4. Click en "Actualizar Estado"
5. Sistema:
   - Actualiza estado del siniestro
   - Actualiza timestamp `updatedAt`
   - Revalida páginas
   - Recarga para mostrar cambios

## Características Destacadas

✅ **Timeline Visual**: Representación clara del historial del siniestro  
✅ **Estado con Colores**: Badges con colores semánticos para rápida identificación  
✅ **Enlaces Inteligentes**: Navegación fluida entre siniestros, pólizas y clientes  
✅ **Validación Robusta**: No permite fechas futuras, valida pertenencia de pólizas  
✅ **UX Optimizada**: Campos calculados, truncado de texto, mensajes claros  
✅ **Multi-tenant Seguro**: Aislamiento completo de datos por tenant  

## Próximos Pasos Sugeridos

1. **Documentos Adjuntos**: Permitir subir fotos, PDFs del siniestro
2. **Comunicaciones**: Timeline de emails/llamadas con aseguradora
3. **Montos**: Agregar monto reclamado vs. monto aprobado
4. **Notificaciones**: Alertas automáticas por cambio de estado
5. **Reportes**: Estadísticas de siniestros por compañía/tipo
6. **Workflow Automatizado**: Emails automáticos según estado
7. **Integración con Aseguradoras**: APIs para seguimiento automático

## Testing Recomendado

- [ ] Crear siniestro para póliza activa
- [ ] Verificar que no permite seleccionar póliza de otro tenant
- [ ] Validar que fecha futura no se permite
- [ ] Cambiar estado secuencialmente (REPORTED → IN_PROCESS → APPROVED)
- [ ] Verificar timeline se actualiza correctamente
- [ ] Confirmar enlaces a póliza funcionan
- [ ] Probar filtros por estado (próxima funcionalidad)
- [ ] Verificar badges de colores por estado
