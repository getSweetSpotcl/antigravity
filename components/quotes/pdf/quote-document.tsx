import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer"
import { Quote, Client, InsuranceCompany, Tenant } from "@prisma/client"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Registrar fuentes si es necesario (usaremos standard fonts por ahora para simplicidad)

const styles = StyleSheet.create({
    page: {
        flexDirection: "column",
        backgroundColor: "#FFFFFF",
        padding: 30,
        fontFamily: "Helvetica",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
        paddingBottom: 10,
    },
    logo: {
        width: 100,
        height: 40,
        objectFit: "contain",
    },
    companyInfo: {
        textAlign: "right",
    },
    companyName: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#1E293B",
    },
    companyDetails: {
        fontSize: 9,
        color: "#64748B",
    },
    titleSection: {
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#0F172A",
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 10,
        color: "#64748B",
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#334155",
        backgroundColor: "#F1F5F9",
        padding: 5,
        marginBottom: 8,
    },
    row: {
        flexDirection: "row",
        marginBottom: 4,
    },
    label: {
        width: "30%",
        fontSize: 9,
        color: "#64748B",
        fontWeight: "bold",
    },
    value: {
        width: "70%",
        fontSize: 9,
        color: "#0F172A",
    },
    table: {
        display: "flex",
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRightWidth: 0,
        borderBottomWidth: 0,
        marginTop: 10,
    },
    tableRow: {
        margin: "auto",
        flexDirection: "row",
    },
    tableColHeader: {
        width: "50%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: "#F8FAFC",
        padding: 5,
    },
    tableCol: {
        width: "50%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 5,
    },
    tableCellHeader: {
        margin: "auto",
        fontSize: 9,
        fontWeight: "bold",
        color: "#475569",
    },
    tableCell: {
        margin: "auto",
        fontSize: 9,
        color: "#334155",
    },
    totalSection: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
        paddingTop: 10,
        alignItems: "flex-end",
    },
    totalRow: {
        flexDirection: "row",
        marginBottom: 5,
    },
    totalLabel: {
        width: 100,
        fontSize: 10,
        fontWeight: "bold",
        color: "#64748B",
        textAlign: "right",
        paddingRight: 10,
    },
    totalValue: {
        width: 100,
        fontSize: 12,
        fontWeight: "bold",
        color: "#0F172A",
        textAlign: "right",
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: "center",
        fontSize: 8,
        color: "#94A3B8",
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
        paddingTop: 10,
    },
})

interface QuoteDocumentProps {
    quote: Quote & {
        client: Client | null
        company: InsuranceCompany | null
        tenant: Tenant
    }
}

export const QuoteDocument = ({ quote }: QuoteDocumentProps) => {
    const coverages = quote.coverages as any[] || []
    const propertyDetails = quote.insuredProperty as any || {}

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        {/* Placeholder for Logo if available */}
                        <Text style={{ fontSize: 20, fontWeight: "bold", color: "#2563EB" }}>
                            {quote.tenant.name}
                        </Text>
                    </View>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>{quote.tenant.name}</Text>
                        <Text style={styles.companyDetails}>RUT: {quote.tenant.rut}</Text>
                        <Text style={styles.companyDetails}>Fecha: {format(new Date(), "dd/MM/yyyy")}</Text>
                    </View>
                </View>

                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>Cotización de Seguro</Text>
                    <Text style={styles.subtitle}>N° {quote.quoteNumber || quote.id.slice(0, 8).toUpperCase()}</Text>
                </View>

                {/* Client Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información del Cliente</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Nombre:</Text>
                        <Text style={styles.value}>
                            {quote.client
                                ? `${quote.client.firstName} ${quote.client.lastName}`
                                : quote.prospectName || "N/A"}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>RUT:</Text>
                        <Text style={styles.value}>
                            {quote.client?.rut || "N/A"}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Email:</Text>
                        <Text style={styles.value}>
                            {quote.client?.email || "N/A"}
                        </Text>
                    </View>
                </View>

                {/* Insurance Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detalles del Seguro</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Compañía:</Text>
                        <Text style={styles.value}>{quote.company?.name || "Pendiente"}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Ramo:</Text>
                        <Text style={styles.value}>{quote.policyType}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Vigencia:</Text>
                        <Text style={styles.value}>
                            {quote.validFrom ? format(new Date(quote.validFrom), "dd/MM/yyyy") : "A definir"}
                            {" - "}
                            {format(new Date(quote.validUntil), "dd/MM/yyyy")}
                        </Text>
                    </View>
                </View>

                {/* Property Details (Dynamic based on type) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Materia Asegurada</Text>
                    {Object.entries(propertyDetails).map(([key, value]) => (
                        <View style={styles.row} key={key}>
                            <Text style={styles.label}>
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                            </Text>
                            <Text style={styles.value}>{String(value)}</Text>
                        </View>
                    ))}
                </View>

                {/* Coverages Table */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Coberturas y Montos</Text>
                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <View style={styles.tableColHeader}>
                                <Text style={styles.tableCellHeader}>Cobertura</Text>
                            </View>
                            <View style={styles.tableColHeader}>
                                <Text style={styles.tableCellHeader}>Monto Asegurado</Text>
                            </View>
                        </View>
                        {coverages.map((cov: any, index: number) => (
                            <View style={styles.tableRow} key={index}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>{cov.name || cov.coverageId}</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        {cov.amount ? `${cov.amount} UF` : "Según Póliza"}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Totals */}
                <View style={styles.totalSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Prima Neta:</Text>
                        <Text style={styles.totalValue}>
                            {Number(quote.totalPremium).toFixed(2)} {quote.currency}
                        </Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>IVA (19%):</Text>
                        <Text style={styles.totalValue}>
                            {(Number(quote.totalPremium) * 0.19).toFixed(2)} {quote.currency}
                        </Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total a Pagar:</Text>
                        <Text style={[styles.totalValue, { color: "#2563EB" }]}>
                            {(Number(quote.totalPremium) * 1.19).toFixed(2)} {quote.currency}
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Esta cotización tiene una validez de 10 días. Sujeta a inspección y aprobación por parte de la compañía aseguradora.
                    Generado por Antigravity Platform.
                </Text>
            </Page>
        </Document>
    )
}
