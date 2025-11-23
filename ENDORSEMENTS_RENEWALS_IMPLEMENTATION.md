# Implementación: Endorsements & Renewals Workflow

**Fecha:** 22 de Noviembre de 2025  
**Estado:** ✅ Completado

## Resumen

Se ha implementado un sistema completo para la gestión de endosos (modificaciones de pólizas) y renovaciones automáticas, permitiendo a los corredores mantener un control preciso del ciclo de vida de las pólizas.

## Componentes Implementados

### 1. Schema de Base de Datos

**Archivo:** `prisma/schema.prisma`

Se agregaron los siguientes enums y campos:

```prisma
enum PolicyStatus {
  ACTIVE
  EXPIRED
  CANCELLED
  RENEWED
}

enum EndorsementType {
  GENERAL_MODIFICATION
  RENEWAL
  CANCELLATION
  INCLUSION
  EXCLUSION
}
```

- **Policy**: Agregado campo `status: PolicyStatus`
- **Endorsement**: Agregado campo `type: EndorsementType`

### 2. Schemas de Validación

**Archivo:** `schemas/endorsement.ts`

- `EndorsementSchema`: Validación Zod para creación de endosos
- Campos: `policyId`, `type`, `description`, `date`, `number`

### 3. Server Actions

#### `actions/endorsement.ts`
- `createEndorsement`: Crea un endoso y actualiza el estado de la póliza según el tipo
  - Si es `CANCELLATION` → marca póliza como `CANCELLED`
  - Si es `RENEWAL` → marca póliza como `RENEWED`

#### `actions/renewal.ts`
- `getPoliciesNearingExpiration(daysAhead)`: Obtiene pólizas próximas a vencer
- `renewPolicy(policyId, newEndDate)`: Renueva una póliza y crea endoso automático
- `markPolicyAsExpired(policyId)`: Marca póliza como expirada

### 4. Componentes de UI

#### Endosos
- **`CreateEndorsementDialog`**: Diálogo para registrar nuevos endosos
  - Selector de tipo de endoso
  - Campo de descripción
  - Selector de fecha
  - Número de endoso (opcional)

- **`EndorsementList`**: Tabla de endosos con badges por tipo
  - Muestra fecha, tipo, número y descripción
  - Badges con colores según tipo (Renovación: default, Cancelación: destructive)

#### Renovaciones
- **`RenewPolicyDialog`**: Diálogo para renovar pólizas
  - Muestra información del cliente
  - Fecha de vencimiento actual
  - Selector de nueva fecha (no puede ser anterior al vencimiento actual)
  - Crea endoso automático de tipo RENEWAL

### 5. Páginas

#### `/dashboard/policies/[id]`
Página de detalle de póliza que incluye:
- Información general (cliente, compañía, vigencia)
- Badge de estado de la póliza
- Sección de "Endosos y Movimientos"
- Botón para crear nuevo endoso
- Lista de endosos históricos

#### `/dashboard/renewals`
Dashboard de renovaciones que muestra:
- **Sección Crítica**: Pólizas que vencen en ≤15 días (fondo naranja, alerta)
- **Sección Próximas**: Pólizas que vencen en 16-60 días
- Tabla con:
  - Número de póliza
  - Cliente
  - Compañía
  - Fecha de vencimiento
  - Días restantes (badge)
  - Botón de renovación

### 6. Navegación

Se agregó el ítem "Renovaciones" al sidebar con ícono `RefreshCw`.

## Flujo de Trabajo

### Creación de Endoso
1. Usuario navega a detalle de póliza
2. Click en "Nuevo Endoso"
3. Selecciona tipo, fecha y descripción
4. Sistema crea endoso y actualiza estado de póliza si corresponde
5. Revalida la página para mostrar cambios

### Renovación de Póliza
1. Usuario navega a `/dashboard/renewals`
2. Visualiza pólizas críticas y próximas
3. Click en "Renovar" en la póliza deseada
4. Selecciona nueva fecha de vencimiento
5. Sistema:
   - Crea endoso de tipo RENEWAL
   - Actualiza `endDate` de la póliza
   - Marca póliza como RENEWED
6. Recarga página para reflejar cambios

## Características Destacadas

✅ **Alertas Visuales**: Pólizas críticas destacadas con fondo naranja  
✅ **Validación de Fechas**: No permite renovar con fecha anterior al vencimiento  
✅ **Historial Completo**: Todos los endosos quedan registrados  
✅ **Actualización Automática de Estado**: El estado de la póliza se actualiza según el tipo de endoso  
✅ **Multi-tenant**: Todas las queries filtran por `tenantId`  
✅ **Seguridad**: Validación de sesión en todas las acciones  

## Próximos Pasos Sugeridos

1. **Notificaciones**: Implementar alertas por email/SMS para pólizas próximas a vencer
2. **Automatización**: Crear job que marque automáticamente pólizas como EXPIRED
3. **Reportes**: Dashboard con métricas de renovaciones (tasa de renovación, ingresos proyectados)
4. **Workflow de Aprobación**: Para endosos que requieran autorización
5. **Integración con Cotizaciones**: Generar cotización automática para renovación

## Testing Recomendado

- [ ] Crear endoso de cada tipo y verificar cambio de estado
- [ ] Renovar póliza y verificar creación de endoso automático
- [ ] Verificar que pólizas próximas a vencer aparezcan en dashboard
- [ ] Validar que no se puedan renovar pólizas con fecha pasada
- [ ] Confirmar que el historial de endosos se muestre correctamente
