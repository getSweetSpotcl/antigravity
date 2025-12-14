import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import type { Quote, Client, InsuranceCompany, Tenant } from "@prisma/client"
import { format } from "date-fns"

// Extended tenant type with branding fields
interface TenantWithBranding extends Tenant {
    primaryColor: string | null
    secondaryColor: string | null
    signatureUrl: string | null
    footerText: string | null
    legalName: string | null
    fantasyName: string | null
    cmfRegistration: string | null
    phone: string | null
    email: string | null
    address: string | null
    website: string | null
}

interface QuoteDocumentProps {
    quote: Quote & {
        Client: Client | null
        InsuranceCompany: InsuranceCompany | null
        Tenant: TenantWithBranding
    }
    agent?: {
        name: string | null
        email: string | null
    }
}

// Create dynamic styles based on tenant branding
const createStyles = (primaryColor: string, secondaryColor: string) =>
    StyleSheet.create({
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
            borderBottomWidth: 2,
            borderBottomColor: primaryColor,
            paddingBottom: 10,
        },
        logo: {
            width: 120,
            height: 50,
            objectFit: "contain",
        },
        logoPlaceholder: {
            fontSize: 20,
            fontWeight: "bold",
            color: primaryColor,
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
            marginTop: 2,
        },
        titleSection: {
            marginBottom: 20,
            backgroundColor: primaryColor,
            padding: 10,
            borderRadius: 4,
        },
        title: {
            fontSize: 18,
            fontWeight: "bold",
            color: "#FFFFFF",
            marginBottom: 2,
        },
        subtitle: {
            fontSize: 10,
            color: "#FFFFFF",
            opacity: 0.9,
        },
        section: {
            marginBottom: 15,
        },
        sectionTitle: {
            fontSize: 11,
            fontWeight: "bold",
            color: "#FFFFFF",
            backgroundColor: secondaryColor,
            padding: 5,
            marginBottom: 8,
        },
        row: {
            flexDirection: "row",
            marginBottom: 4,
            paddingLeft: 5,
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
            backgroundColor: primaryColor,
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
            color: "#FFFFFF",
        },
        tableCell: {
            margin: "auto",
            fontSize: 9,
            color: "#334155",
        },
        totalSection: {
            marginTop: 20,
            borderTopWidth: 2,
            borderTopColor: primaryColor,
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
        signatureSection: {
            marginTop: 40,
            flexDirection: "row",
            justifyContent: "space-between",
        },
        signatureBox: {
            width: "45%",
            alignItems: "center",
        },
        signatureImage: {
            width: 100,
            height: 40,
            objectFit: "contain",
        },
        signatureLine: {
            borderTopWidth: 1,
            borderTopColor: "#94A3B8",
            width: "100%",
            marginTop: 5,
            paddingTop: 5,
        },
        signatureLabel: {
            fontSize: 9,
            color: "#64748B",
            textAlign: "center",
        },
        footer: {
            position: "absolute",
            bottom: 30,
            left: 30,
            right: 30,
            fontSize: 8,
            color: "#94A3B8",
            borderTopWidth: 1,
            borderTopColor: "#E2E8F0",
            paddingTop: 10,
        },
        footerText: {
            textAlign: "center",
            marginBottom: 5,
        },
        footerContact: {
            textAlign: "center",
            fontSize: 7,
        },
    })

export const QuoteDocument = ({ quote, agent }: QuoteDocumentProps) => {
    const coverages = (quote.coverages as Array<{ name: string; insuredAmount?: string; cadNumber?: string }>) || []
    const propertyDetails = (quote.insuredProperty as Record<string, unknown>) || {}

    // Get branding colors with fallbacks
    const primaryColor = quote.Tenant.primaryColor || "#3b82f6"
    const secondaryColor = quote.Tenant.secondaryColor || "#1e40af"

    const styles = createStyles(primaryColor, secondaryColor)

    // Company display name
    const displayName = quote.Tenant.fantasyName || quote.Tenant.name

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        {quote.Tenant.logoUrl ? (
                            <Image src={quote.Tenant.logoUrl} style={styles.logo} />
                        ) : (
                            <Text style={styles.logoPlaceholder}>{displayName}</Text>
                        )}
                    </View>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>
                            {quote.Tenant.legalName || quote.Tenant.name}
                        </Text>
                        <Text style={styles.companyDetails}>RUT: {quote.Tenant.rut}</Text>
                        {quote.Tenant.cmfRegistration && (
                            <Text style={styles.companyDetails}>
                                Registro CMF: {quote.Tenant.cmfRegistration}
                            </Text>
                        )}
                        {quote.Tenant.phone && (
                            <Text style={styles.companyDetails}>Tel: {quote.Tenant.phone}</Text>
                        )}
                    </View>
                </View>

                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>Cotización de Seguro</Text>
                    <Text style={styles.subtitle}>
                        N° {quote.quoteNumber || quote.id.slice(0, 8).toUpperCase()} | Fecha:{" "}
                        {format(new Date(), "dd/MM/yyyy")}
                    </Text>
                </View>

                {/* Client Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información del Cliente</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Nombre:</Text>
                        <Text style={styles.value}>
                            {quote.Client
                                ? `${quote.Client.firstName} ${quote.Client.lastName}`
                                : quote.prospectName || "N/A"}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>RUT:</Text>
                        <Text style={styles.value}>{quote.Client?.rut || quote.insuredRut || "N/A"}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Email:</Text>
                        <Text style={styles.value}>{quote.Client?.email || quote.contractorEmail || "N/A"}</Text>
                    </View>
                    {quote.Client?.phone && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Teléfono:</Text>
                            <Text style={styles.value}>{quote.Client.phone}</Text>
                        </View>
                    )}
                </View>

                {/* Insurance Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detalles del Seguro</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Compañía:</Text>
                        <Text style={styles.value}>{quote.InsuranceCompany?.name || "Pendiente"}</Text>
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
                    {quote.policyDuration && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Duración:</Text>
                            <Text style={styles.value}>{quote.policyDuration} meses</Text>
                        </View>
                    )}
                </View>

                {/* Property Details */}
                {Object.keys(propertyDetails).length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Materia Asegurada</Text>
                        {Object.entries(propertyDetails).map(([key, value]) => (
                            <View style={styles.row} key={key}>
                                <Text style={styles.label}>
                                    {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}:
                                </Text>
                                <Text style={styles.value}>{String(value)}</Text>
                            </View>
                        ))}
                    </View>
                )}

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
                        {coverages.map((cov, index: number) => (
                            <View style={styles.tableRow} key={index}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        {cov.name}
                                        {cov.cadNumber ? ` (CAD: ${cov.cadNumber})` : ""}
                                    </Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>{cov.insuredAmount || "N/A"}</Text>
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
                            {Number(quote.totalPremium).toLocaleString("es-CL", { minimumFractionDigits: 2 })}{" "}
                            {quote.currency}
                        </Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>IVA (19%):</Text>
                        <Text style={styles.totalValue}>
                            {(Number(quote.totalPremium) * 0.19).toLocaleString("es-CL", { minimumFractionDigits: 2 })}{" "}
                            {quote.currency}
                        </Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total a Pagar:</Text>
                        <Text style={[styles.totalValue, { color: primaryColor }]}>
                            {(Number(quote.totalPremium) * 1.19).toLocaleString("es-CL", { minimumFractionDigits: 2 })}{" "}
                            {quote.currency}
                        </Text>
                    </View>
                    {quote.paymentInstallments > 1 && (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Cuotas:</Text>
                            <Text style={styles.totalValue}>{quote.paymentInstallments}</Text>
                        </View>
                    )}
                </View>

                {/* Signature Section */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        {quote.Tenant.signatureUrl && (
                            <Image src={quote.Tenant.signatureUrl} style={styles.signatureImage} />
                        )}
                        <View style={styles.signatureLine}>
                            <Text style={styles.signatureLabel}>
                                {agent?.name || "Ejecutivo Comercial"}
                            </Text>
                            {agent?.email && (
                                <Text style={[styles.signatureLabel, { fontSize: 8, marginTop: 2 }]}>
                                    {agent.email}
                                </Text>
                            )}
                        </View>
                    </View>
                    <View style={styles.signatureBox}>
                        <View style={{ height: 40 }} />
                        <View style={styles.signatureLine}>
                            <Text style={styles.signatureLabel}>Firma del Cliente</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        {quote.Tenant.footerText ||
                            "Esta cotización tiene una validez de 10 días. Sujeta a inspección y aprobación por parte de la compañía aseguradora."}
                    </Text>
                    <Text style={styles.footerContact}>
                        {[
                            quote.Tenant.address,
                            quote.Tenant.phone && `Tel: ${quote.Tenant.phone}`,
                            quote.Tenant.email,
                            quote.Tenant.website,
                        ]
                            .filter(Boolean)
                            .join(" | ")}
                    </Text>
                </View>
            </Page>
        </Document>
    )
}
