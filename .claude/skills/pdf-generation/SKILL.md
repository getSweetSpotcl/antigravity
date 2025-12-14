---
name: pdf-generation
description: Generación de documentos PDF con @react-pdf/renderer. Usar cuando se necesite crear cotizaciones, certificados, reportes o estados de cuenta en PDF.
---

# Skill: PDF Generation

Este skill documenta la generación de documentos PDF en GiCS usando `@react-pdf/renderer`.

## Librería

```bash
npm install @react-pdf/renderer
```

## Estructura de un Documento PDF

```tsx
// components/entity/pdf/entity-document.tsx
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
    Image,
} from "@react-pdf/renderer"

// Registrar fuentes (opcional)
Font.register({
    family: "Inter",
    src: "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2",
})

// Estilos
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: "Helvetica",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: "#0891b2", // cyan-600
        paddingBottom: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#0891b2",
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#1e293b", // slate-800
        textTransform: "uppercase",
    },
    row: {
        flexDirection: "row",
        marginBottom: 5,
    },
    label: {
        width: 120,
        fontWeight: "bold",
        color: "#64748b", // slate-500
    },
    value: {
        flex: 1,
        color: "#1e293b",
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#f1f5f9", // slate-100
        padding: 8,
        fontWeight: "bold",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0", // slate-200
        padding: 8,
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
        fontSize: 8,
        color: "#94a3b8", // slate-400
        textAlign: "center",
    },
})

interface EntityDocumentProps {
    entity: EntityType
    tenant: TenantType
}

export const EntityDocument = ({ entity, tenant }: EntityDocumentProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                {tenant.logoUrl && (
                    <Image src={tenant.logoUrl} style={{ width: 120 }} />
                )}
                <View>
                    <Text style={styles.title}>{tenant.name}</Text>
                    <Text>{tenant.address}</Text>
                    <Text>{tenant.phone}</Text>
                </View>
            </View>

            {/* Contenido */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Información</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Campo:</Text>
                    <Text style={styles.value}>{entity.field}</Text>
                </View>
            </View>

            {/* Tabla */}
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={{ width: "50%" }}>Descripción</Text>
                    <Text style={{ width: "25%", textAlign: "right" }}>Monto</Text>
                    <Text style={{ width: "25%", textAlign: "right" }}>Prima</Text>
                </View>
                {items.map((item, i) => (
                    <View key={i} style={styles.tableRow}>
                        <Text style={{ width: "50%" }}>{item.name}</Text>
                        <Text style={{ width: "25%", textAlign: "right" }}>
                            {item.amount} UF
                        </Text>
                        <Text style={{ width: "25%", textAlign: "right" }}>
                            {item.premium} UF
                        </Text>
                    </View>
                ))}
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
                {tenant.footerText || `© ${new Date().getFullYear()} ${tenant.name}`}
            </Text>
        </Page>
    </Document>
)
```

## Botón de Descarga

```tsx
// components/entity/pdf/download-button.tsx
"use client"

import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EntityDocument } from "./entity-document"

interface DownloadButtonProps {
    entity: EntityType
    tenant: TenantType
    fileName?: string
}

export function DownloadEntityButton({
    entity,
    tenant,
    fileName,
}: DownloadButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false)

    const handleDownload = async () => {
        setIsGenerating(true)
        try {
            const blob = await pdf(
                <EntityDocument entity={entity} tenant={tenant} />
            ).toBlob()

            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = fileName || `documento-${entity.number}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Error generating PDF:", error)
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isGenerating}
        >
            {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Download className="h-4 w-4" />
            )}
        </Button>
    )
}
```

## Tipos de Documentos en GiCS

### 1. Cotización PDF

```tsx
// components/quotes/pdf/quote-document.tsx
export const QuoteDocument = ({ quote, tenant }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Logo y datos del corredor */}
            <Header tenant={tenant} />

            {/* Número y fecha de cotización */}
            <QuoteInfo quote={quote} />

            {/* Datos del cliente/tomador */}
            <ClientSection quote={quote} />

            {/* Datos del asegurado */}
            <InsuredSection quote={quote} />

            {/* Bien asegurado */}
            <PropertySection quote={quote} />

            {/* Tabla de coberturas */}
            <CoveragesTable coverages={quote.coverages} />

            {/* Totales */}
            <TotalsSection quote={quote} />

            {/* Términos y condiciones */}
            <TermsSection tenant={tenant} />

            {/* Firma */}
            {tenant.signatureUrl && (
                <SignatureSection tenant={tenant} />
            )}

            <Footer tenant={tenant} />
        </Page>
    </Document>
)
```

### 2. Certificado de Póliza

Contenido típico:
- Datos del corredor
- Número de póliza
- Datos del asegurado
- Vigencia
- Coberturas contratadas
- Compañía aseguradora
- Firma del corredor

### 3. Reporte de Siniestro

Contenido típico:
- Datos de la póliza
- Fecha y descripción del siniestro
- Estado actual
- Historial de cambios
- Montos (reclamado, aprobado, pagado)
- Adjuntos relacionados

### 4. Estado de Cuenta de Comisiones

Contenido típico:
- Periodo del reporte
- Lista de comisiones pendientes
- Lista de comisiones cobradas en el periodo
- Totales
- Detalle de pagos recibidos

## Formateo de Datos

### Fechas

```tsx
import { format } from "date-fns"
import { es } from "date-fns/locale"

const formattedDate = format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: es })
// "15 de enero de 2024"
```

### Montos

```tsx
const formattedAmount = Number(amount).toLocaleString("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})
// "1.234,56"
```

### RUT

```tsx
import { formatRut } from "@/lib/rut-utils"
const formattedRut = formatRut(rut)
// "12.345.678-9"
```

## Colores del Tema

```tsx
const colors = {
    primary: "#0891b2",     // cyan-600 (GiCS)
    secondary: "#1e293b",   // slate-800
    muted: "#64748b",       // slate-500
    border: "#e2e8f0",      // slate-200
    background: "#f1f5f9",  // slate-100
    success: "#10b981",     // emerald-500
    warning: "#f59e0b",     // amber-500
    error: "#ef4444",       // red-500
}
```

## Consideraciones

### Performance
- Generar PDFs en el cliente para evitar carga del servidor
- Usar `useMemo` para datos pesados
- Mostrar loading state durante generación

### Compatibilidad
- `@react-pdf/renderer` no funciona en SSR
- Usar `"use client"` en componentes de descarga
- Las imágenes deben ser URLs accesibles o base64

### Branding
- Usar logo del tenant desde `tenant.logoUrl`
- Colores configurables desde tenant (opcional)
- Footer personalizable con `tenant.footerText`

## Archivos de Referencia

- `components/quotes/pdf/quote-document.tsx` - Documento de cotización
- `components/quotes/pdf/download-button.tsx` - Botón de descarga
