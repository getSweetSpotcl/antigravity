# Plan de Desarrollo - Antigravity

Sistema de gestión para corredoras de seguros en Chile.

## Estado Actual

### Fases Completadas

- [x] **Fase 1**: Seguridad y Limpieza de Código
- [x] **Fase 2**: Gestión de Pólizas Completa
- [x] **Fase 3**: Sistema de Renovaciones con Alertas
- [x] **Fase 4**: Siniestros - Denuncia y Seguimiento
- [x] **Fase 5**: Comisiones y Recepción de Pagos
- [x] **Fase 6**: Portal de Clientes
- [x] **Fase 7**: Documentos con Firma Digital y Branding
- [x] **Fase 8**: Reportes, Informes y Auditorías
- [x] **Fase 9**: UX, Búsqueda y Exportación

---

## Fases Pendientes

### Fase 5: Comisiones y Recepción de Pagos

**Objetivo:** Sistema para gestionar comisiones por póliza y registrar pagos recibidos.

#### 5.1 Modelo de Comisiones

**Archivos a crear/modificar:**
- `prisma/schema.prisma` - Agregar modelos `Commission` y `Payment`
- `actions/commission.ts` - CRUD de comisiones
- `schemas/commission.ts` - Validaciones

**Modelo Commission:**
```prisma
model Commission {
  id            String   @id @default(cuid())
  policyId      String
  policy        Policy   @relation(...)

  percentage    Decimal  @db.Decimal(5, 2)  // % de comisión
  amount        Decimal  @db.Decimal(12, 2) // Monto calculado
  currency      String   @default("UF")

  status        String   @default("PENDING") // PENDING, PAID, PARTIAL
  dueDate       DateTime?
  paidDate      DateTime?
  paidAmount    Decimal? @db.Decimal(12, 2)

  tenantId      String
  payments      CommissionPayment[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model CommissionPayment {
  id            String   @id @default(cuid())
  commissionId  String
  commission    Commission @relation(...)

  amount        Decimal  @db.Decimal(12, 2)
  paymentDate   DateTime
  paymentMethod String   // TRANSFER, CHECK, CASH
  reference     String?  // Número de transferencia, cheque, etc.
  notes         String?

  createdAt     DateTime @default(now())
}
```

**Funcionalidades:**
- [ ] Cálculo automático de comisiones al crear póliza
- [ ] Registro de pagos parciales o totales
- [ ] Dashboard de comisiones pendientes/pagadas
- [ ] Alertas de comisiones vencidas
- [ ] Reportes de comisiones por período

#### 5.2 Interfaz de Usuario

**Archivos a crear:**
- `app/dashboard/commissions/page.tsx` - Lista de comisiones
- `components/commissions/commission-list.tsx` - Tabla con filtros
- `components/commissions/register-payment-dialog.tsx` - Registrar pago
- `components/commissions/commission-summary.tsx` - Resumen financiero

**Tareas:**
- [ ] Página de comisiones con filtros (estado, período, cliente)
- [ ] Widget de comisiones en dashboard principal
- [ ] Diálogo para registrar pagos
- [ ] Vista de detalle de comisión con historial de pagos

---

### Fase 6: Portal de Clientes

**Objetivo:** Portal web donde los clientes pueden ver sus pólizas, reportar siniestros y descargar documentos.

#### 6.1 Autenticación de Clientes

**Archivos a crear/modificar:**
- `prisma/schema.prisma` - Agregar modelo `ClientUser`
- `app/portal/` - Rutas del portal
- `lib/auth-client.ts` - Autenticación separada para clientes

**Modelo ClientUser:**
```prisma
model ClientUser {
  id            String   @id @default(cuid())
  clientId      String
  client        Client   @relation(...)

  email         String   @unique
  password      String
  emailVerified DateTime?
  lastLogin     DateTime?
  isActive      Boolean  @default(true)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

**Tareas:**
- [ ] Registro de clientes con verificación de email
- [ ] Login separado para clientes (`/portal/login`)
- [ ] Recuperación de contraseña
- [ ] Middleware de autenticación para rutas `/portal/*`

#### 6.2 Funcionalidades del Portal

**Archivos a crear:**
- `app/portal/page.tsx` - Dashboard del cliente
- `app/portal/policies/page.tsx` - Mis pólizas
- `app/portal/policies/[id]/page.tsx` - Detalle de póliza
- `app/portal/claims/page.tsx` - Mis siniestros
- `app/portal/claims/new/page.tsx` - Reportar siniestro
- `app/portal/documents/page.tsx` - Mis documentos

**Tareas:**
- [ ] Dashboard con resumen de pólizas activas
- [ ] Lista de pólizas con estado y vencimiento
- [ ] Detalle de póliza con coberturas
- [ ] Formulario para reportar siniestros
- [ ] Seguimiento de siniestros reportados
- [ ] Descarga de documentos (pólizas, certificados)
- [ ] Notificaciones de vencimientos

#### 6.3 Comunicación

**Tareas:**
- [ ] Sistema de mensajes cliente-corredor
- [ ] Notificaciones por email al cliente
- [ ] Historial de comunicaciones

---

### Fase 7: Documentos con Firma Digital y Branding

**Objetivo:** Generación de documentos PDF con logo/firma del corredor y firma electrónica del cliente.

#### 7.1 Configuración de Branding

**Archivos a crear/modificar:**
- `prisma/schema.prisma` - Agregar campos de branding a `Tenant`
- `app/dashboard/settings/branding/page.tsx` - Configuración
- `components/settings/branding-form.tsx` - Formulario

**Campos a agregar a Tenant:**
```prisma
model Tenant {
  // ... campos existentes

  // Branding
  primaryColor    String?  @default("#667eea")
  secondaryColor  String?  @default("#764ba2")
  logoUrl         String?  // Ya existe
  signatureUrl    String?  // Firma digital del corredor
  footerText      String?  // Texto para pie de documentos

  // Datos legales
  legalName       String?  // Razón social
  fantasyName     String?  // Nombre de fantasía
  cmfRegistration String?  // Registro CMF
}
```

**Tareas:**
- [ ] Página de configuración de branding
- [ ] Upload de logo y firma digital
- [ ] Selector de colores corporativos
- [ ] Preview de documentos con branding

#### 7.2 Generación de Documentos PDF

**Archivos a crear/modificar:**
- `components/documents/pdf-templates/` - Templates de documentos
- `lib/pdf-generator.ts` - Generador de PDFs
- `app/api/documents/generate/route.ts` - API de generación

**Templates a crear:**
- [ ] Propuesta/Cotización (`quote-proposal.tsx`)
- [ ] Certificado de Cobertura (`coverage-certificate.tsx`)
- [ ] Carta de Denuncia de Siniestro (`claim-report.tsx`)
- [ ] Liquidación de Comisiones (`commission-statement.tsx`)
- [ ] Informe de Cartera (`portfolio-report.tsx`)

**Tareas:**
- [ ] Integrar branding en templates existentes
- [ ] Crear nuevos templates de documentos
- [ ] Agregar firma del corredor a documentos
- [ ] Sistema de numeración de documentos

#### 7.3 Firma Electrónica del Cliente

**Opciones de implementación:**
1. Firma simple (checkbox de aceptación + IP/timestamp)
2. Firma avanzada con proveedor externo (e-certchile, etc.)

**Tareas:**
- [ ] Definir tipo de firma a implementar
- [ ] Crear componente de firma
- [ ] Almacenar evidencia de firma
- [ ] Validar firmas en documentos

---

### Fase 8: Reportes, Informes y Auditorías

**Objetivo:** Sistema de reportes regulatorios (CMF/FECU) y auditoría de acciones.

#### 8.1 Reportes Regulatorios

**Archivos a crear:**
- `app/dashboard/reports/page.tsx` - Centro de reportes
- `app/dashboard/reports/fecu/page.tsx` - Reportes FECU
- `actions/reports.ts` - Generación de reportes
- `lib/fecu-generator.ts` - Generador de reportes FECU

**Reportes a implementar:**
- [ ] Cartera de Pólizas Vigentes
- [ ] Producción por Período (primas nuevas)
- [ ] Comisiones Devengadas vs Pagadas
- [ ] Siniestralidad por Ramo
- [ ] Reporte FECU (formato CMF)
- [ ] Reporte de Renovaciones
- [ ] Análisis de Cartera por Compañía

**Tareas:**
- [ ] Página de reportes con selección de tipo y período
- [ ] Generación de reportes en formato Excel
- [ ] Generación de reportes en formato PDF
- [ ] Programación de reportes automáticos
- [ ] Envío de reportes por email

#### 8.2 Sistema de Auditoría

**Archivos a crear/modificar:**
- `prisma/schema.prisma` - Agregar modelo `AuditLog`
- `lib/audit.ts` - Funciones de auditoría
- `app/dashboard/settings/audit/page.tsx` - Visor de auditoría

**Modelo AuditLog:**
```prisma
model AuditLog {
  id          String   @id @default(cuid())
  tenantId    String
  userId      String?
  userName    String?

  action      String   // CREATE, UPDATE, DELETE, LOGIN, etc.
  entity      String   // Policy, Claim, Client, etc.
  entityId    String?

  oldValues   Json?
  newValues   Json?
  ipAddress   String?
  userAgent   String?

  createdAt   DateTime @default(now())

  @@index([tenantId])
  @@index([entity, entityId])
  @@index([createdAt])
}
```

**Tareas:**
- [ ] Implementar logging automático de acciones
- [ ] Visor de auditoría con filtros
- [ ] Exportación de logs
- [ ] Retención configurable de logs

---

### Fase 9: UX, Búsqueda y Exportación

**Objetivo:** Mejorar la experiencia de usuario con búsqueda global, exportación de datos y mejoras de interfaz.

#### 9.1 Búsqueda Global

**Archivos a crear:**
- `components/search/global-search.tsx` - Componente de búsqueda
- `app/api/search/route.ts` - API de búsqueda
- `actions/search.ts` - Lógica de búsqueda

**Tareas:**
- [ ] Búsqueda unificada (clientes, pólizas, siniestros)
- [ ] Resultados agrupados por tipo
- [ ] Atajos de teclado (Cmd+K / Ctrl+K)
- [ ] Historial de búsquedas recientes
- [ ] Sugerencias mientras escribe

#### 9.2 Exportación de Datos

**Archivos a crear:**
- `lib/export.ts` - Funciones de exportación
- `components/shared/export-button.tsx` - Botón reutilizable

**Tareas:**
- [ ] Exportar listas a Excel (.xlsx)
- [ ] Exportar listas a CSV
- [ ] Exportar a PDF
- [ ] Exportación con filtros aplicados
- [ ] Exportación programada por email

#### 9.3 Mejoras de UX

**Tareas:**
- [ ] Modo oscuro
- [ ] Breadcrumbs de navegación
- [ ] Indicadores de carga (skeletons)
- [ ] Notificaciones toast mejoradas
- [ ] Tooltips informativos
- [ ] Tour de onboarding para nuevos usuarios
- [ ] Atajos de teclado documentados
- [ ] Responsive design mejorado

---

### Fase 10: Testing y Seguridad

**Objetivo:** Asegurar la calidad del código con testing y medidas de seguridad.

> **Nota:** CI/CD y deployment se realizarán manualmente.

#### 10.1 Testing

**Archivos a crear:**
- `__tests__/` - Tests unitarios
- `vitest.config.ts` - Configuración de Vitest

**Tareas:**
- [ ] Configurar Vitest como framework de testing
- [ ] Tests unitarios para server actions principales
- [ ] Tests unitarios para utilidades (RUT, export, etc.)
- [ ] Tests de integración para API routes críticas

#### 10.2 Seguridad

**Tareas:**
- [ ] Auditoría de dependencias (npm audit)
- [ ] Headers de seguridad (CSP, HSTS, X-Frame-Options, etc.)
- [ ] Rate limiting en API routes públicas
- [ ] Validación de inputs en todos los endpoints
- [ ] Sanitización de outputs

---

## Priorización Recomendada

1. **Alta prioridad (Core business):**
   - Fase 5: Comisiones (ingresos del corredor)
   - Fase 8.1: Reportes básicos

2. **Media prioridad (Valor agregado):**
   - Fase 6: Portal de Clientes
   - Fase 7: Documentos con Branding
   - Fase 9.1: Búsqueda Global

3. **Mejora continua:**
   - Fase 9.2-9.3: UX y Exportación
   - Fase 10: Infraestructura

---

## Notas Técnicas

### Stack Tecnológico
- **Framework:** Next.js 16 (App Router)
- **Base de datos:** PostgreSQL con Prisma ORM
- **Autenticación:** NextAuth v5 (beta)
- **UI:** shadcn/ui + Tailwind CSS
- **Email:** Resend
- **Archivos:** Vercel Blob
- **PDF:** @react-pdf/renderer

### Variables de Entorno Requeridas
```env
# Ya configuradas
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
BLOB_READ_WRITE_TOKEN=

# Por configurar
RESEND_API_KEY=
RESEND_FROM_EMAIL=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=

# Opcionales (Fase 10)
SENTRY_DSN=
```

### Convenciones de Código
- Server Actions en `/actions/*.ts`
- Schemas de validación en `/schemas/*.ts`
- Componentes UI en `/components/ui/`
- Componentes de feature en `/components/{feature}/`
- Multi-tenancy via `getTenantContext()`

---

*Última actualización: Noviembre 2025*
