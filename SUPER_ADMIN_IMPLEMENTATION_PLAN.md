# Plan de Implementación: Super Admin & Gestión de Tenants

## Objetivos
1.  Habilitar un panel de administración exclusivo para usuarios `SUPER_ADMIN`.
2.  Permitir la gestión centralizada de Tenants (crear, editar, configurar límites, facturación).
3.  Implementar funcionalidad de "Impersonación" o "Cambio de Contexto" para que un Super Admin pueda operar dentro de cualquier Tenant.

## 1. Actualización del Modelo de Datos (Prisma)

Necesitamos agregar campos para controlar las suscripciones y límites de cada Tenant.

```prisma
model Tenant {
  // ... campos existentes
  
  // Configuración de Suscripción
  plan              String    @default("FREE") // FREE, PRO, ENTERPRISE
  subscriptionStatus String   @default("ACTIVE") // ACTIVE, PAST_DUE, CANCELED
  
  // Límites
  maxUsers          Int       @default(5)
  maxStorage        Int       @default(1073741824) // 1GB en bytes
  
  // Facturación
  billingEmail      String?
  billingAddress    String?
  
  // ... relaciones
}
```

## 2. Arquitectura de "Cambio de Contexto" (Tenant Switcher)

Para permitir que un Super Admin opere en diferentes tenants sin cerrar sesión, implementaremos un mecanismo de **Contexto de Administración**.

### Estrategia
1.  **Cookie de Contexto**: Usaremos una cookie segura (`x-admin-tenant-context`) para almacenar el ID del tenant activo cuando un Super Admin decide "entrar" a un tenant.
2.  **Helper de Autenticación**: Crearemos una función `getTenantContext()` que:
    *   Obtiene la sesión del usuario.
    *   Si el usuario es `SUPER_ADMIN` y existe la cookie de contexto, devuelve el ID de la cookie.
    *   Si no, devuelve el `tenantId` original del usuario.
3.  **Middleware/Actions Refactor**: Actualizaremos las Server Actions críticas para usar `getTenantContext()` en lugar de `session.user.tenantId` directamente.

## 3. Interfaz de Usuario (UI)

### A. Admin Dashboard (`/admin`)
Un nuevo layout separado del dashboard principal, accesible solo para `SUPER_ADMIN`.
*   **`/admin/tenants`**: Tabla con todos los tenants, estado, plan y métricas rápidas.
*   **`/admin/tenants/[id]`**: Vista detallada para editar configuración, ver usuarios y facturación.
*   **`/admin/users`**: Buscador global de usuarios.

### B. Tenant Switcher
Un componente en el Sidebar (o Header) visible solo para Super Admins.
*   Dropdown con buscador de tenants.
*   Al seleccionar uno, invoca una Server Action `switchAdminContext(tenantId)` y recarga la página.
*   Indicador visual claro de que se está en "Modo Administración" de otro tenant.

## 4. Pasos de Ejecución

1.  **Database**: Actualizar schema y ejecutar migración.
2.  **Backend**: 
    *   Crear `actions/admin.ts` (CRUD Tenants).
    *   Implementar `switchAdminContext` action.
    *   Crear helper `lib/tenant-context.ts`.
3.  **Frontend Admin**:
    *   Crear layout `/app/admin`.
    *   Implementar listado y formularios de Tenant.
4.  **Integración**:
    *   Agregar Tenant Switcher al Sidebar principal.
    *   Refactorizar acciones existentes (Quote, Policy, Client) para respetar el contexto.

## 5. Validación
*   Verificar que un usuario normal NO pueda acceder a `/admin`.
*   Verificar que el Super Admin pueda cambiar de tenant y ver los datos correspondientes (clientes, pólizas) de ese tenant específico.
