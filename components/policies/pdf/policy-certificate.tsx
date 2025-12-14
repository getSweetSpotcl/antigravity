import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import type { Policy, Client, InsuranceCompany, Tenant } from "@prisma/client"
import { format } from "date-fns"
import { es } from "date-fns/locale"

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

interface PolicyCertificateProps {
    policy: Policy & {
        Client: Client
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
            borderBottomWidth: 3,
            borderBottomColor: primaryColor,
            paddingBottom: 15,
        },
        logo: {
            width: 130,
            height: 55,
            objectFit: "contain",
        },
        logoPlaceholder: {
            fontSize: 22,
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
        certificateTitle: {
            textAlign: "center",
            marginBottom: 25,
            backgroundColor: primaryColor,
            padding: 15,
            borderRadius: 4,
        },
        title: {
            fontSize: 22,
            fontWeight: "bold",
            color: "#FFFFFF",
            letterSpacing: 1,
        },
        subtitle: {
            fontSize: 11,
            color: "#FFFFFF",
            opacity: 0.9,
            marginTop: 5,
        },
        section: {
            marginBottom: 15,
        },
        sectionTitle: {
            fontSize: 11,
            fontWeight: "bold",
            color: "#FFFFFF",
            backgroundColor: secondaryColor,
            padding: 6,
            marginBottom: 10,
            borderRadius: 2,
        },
        row: {
            flexDirection: "row",
            marginBottom: 5,
            paddingLeft: 5,
        },
        label: {
            width: "35%",
            fontSize: 9,
            color: "#64748B",
            fontWeight: "bold",
        },
        value: {
            width: "65%",
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
            padding: 6,
        },
        tableCol: {
            width: "50%",
            borderStyle: "solid",
            borderWidth: 1,
            borderColor: "#E2E8F0",
            borderLeftWidth: 0,
            borderTopWidth: 0,
            padding: 6,
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
        statusBadge: {
            backgroundColor: "#10B981",
            color: "#FFFFFF",
            padding: "4 10",
            borderRadius: 10,
            fontSize: 9,
            fontWeight: "bold",
            alignSelf: "flex-start",
        },
        inactiveBadge: {
            backgroundColor: "#EF4444",
        },
        premiumSection: {
            marginTop: 20,
            padding: 15,
            backgroundColor: "#F8FAFC",
            borderRadius: 4,
            borderLeftWidth: 4,
            borderLeftColor: primaryColor,
        },
        premiumRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 5,
        },
        premiumLabel: {
            fontSize: 10,
            color: "#64748B",
        },
        premiumValue: {
            fontSize: 12,
            fontWeight: "bold",
            color: "#0F172A",
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
        watermark: {
            position: "absolute",
            top: "40%",
            left: "20%",
            fontSize: 60,
            color: "#F1F5F9",
            transform: "rotate(-30deg)",
            opacity: 0.5,
        },
    })

const getPolicyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
        GENERAL: "Seguro General",
        LIFE: "Seguro de Vida",
        HEALTH: "Seguro de Salud",
        AUTO: "Seguro Automotriz",
        HOME: "Seguro de Hogar",
        GUARANTEE: "Seguro de Garantía",
    }
    return types[type] || type
}

const getStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
        ACTIVE: "Vigente",
        EXPIRED: "Expirada",
        CANCELLED: "Cancelada",
        RENEWED: "Renovada",
    }
    return statuses[status] || status
}

export const PolicyCertificate = ({ policy, agent }: PolicyCertificateProps) => {
    const coverages = (policy.coverages as Array<{ name: string; insuredAmount?: string; cadNumber?: string }>) || []
    const deductibles = (policy.deductibles as Array<{ name: string; amount?: string }>) || []
    const propertyDetails = (policy.insuredProperty as Record<string, unknown>) || {}

    // Get branding colors with fallbacks
    const primaryColor = policy.Tenant.primaryColor || "#3b82f6"
    const secondaryColor = policy.Tenant.secondaryColor || "#1e40af"

    const styles = createStyles(primaryColor, secondaryColor)

    // Company display name
    const displayName = policy.Tenant.fantasyName || policy.Tenant.name

    const isActive = policy.status === "ACTIVE"

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Watermark for inactive policies */}
                {!isActive && (
                    <Text style={styles.watermark}>{getStatusLabel(policy.status)}</Text>
                )}

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        {policy.Tenant.logoUrl ? (
                            <Image src={policy.Tenant.logoUrl} style={styles.logo} />
                        ) : (
                            <Text style={styles.logoPlaceholder}>{displayName}</Text>
                        )}
                    </View>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>
                            {policy.Tenant.legalName || policy.Tenant.name}
                        </Text>
                        <Text style={styles.companyDetails}>RUT: {policy.Tenant.rut}</Text>
                        {policy.Tenant.cmfRegistration && (
                            <Text style={styles.companyDetails}>
                                Registro CMF: {policy.Tenant.cmfRegistration}
                            </Text>
                        )}
                        {policy.Tenant.phone && (
                            <Text style={styles.companyDetails}>Tel: {policy.Tenant.phone}</Text>
                        )}
                    </View>
                </View>

                {/* Certificate Title */}
                <View style={styles.certificateTitle}>
                    <Text style={styles.title}>CERTIFICADO DE PÓLIZA</Text>
                    <Text style={styles.subtitle}>
                        N° {policy.number} | Emitido: {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                    </Text>
                </View>

                {/* Policy Status */}
                <View style={{ marginBottom: 15, alignItems: "center" }}>
                    <Text style={isActive ? styles.statusBadge : [styles.statusBadge, styles.inactiveBadge]}>
                        Estado: {getStatusLabel(policy.status)}
                    </Text>
                </View>

                {/* Insured Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Datos del Asegurado</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Nombre:</Text>
                        <Text style={styles.value}>
                            {policy.Client.firstName} {policy.Client.lastName}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>RUT:</Text>
                        <Text style={styles.value}>{policy.Client.rut}</Text>
                    </View>
                    {policy.Client.email && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Email:</Text>
                            <Text style={styles.value}>{policy.Client.email}</Text>
                        </View>
                    )}
                    {policy.Client.phone && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Teléfono:</Text>
                            <Text style={styles.value}>{policy.Client.phone}</Text>
                        </View>
                    )}
                    {policy.Client.address && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Dirección:</Text>
                            <Text style={styles.value}>{policy.Client.address}</Text>
                        </View>
                    )}
                </View>

                {/* Policy Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Datos de la Póliza</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Compañía Aseguradora:</Text>
                        <Text style={styles.value}>
                            {policy.InsuranceCompany?.name || policy.company}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Ramo:</Text>
                        <Text style={styles.value}>{getPolicyTypeLabel(policy.type)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Vigencia:</Text>
                        <Text style={styles.value}>
                            {format(new Date(policy.startDate), "dd/MM/yyyy")} al{" "}
                            {format(new Date(policy.endDate), "dd/MM/yyyy")}
                        </Text>
                    </View>
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
                {coverages.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Coberturas Contratadas</Text>
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
                )}

                {/* Deductibles */}
                {deductibles.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Deducibles</Text>
                        {deductibles.map((ded, index: number) => (
                            <View style={styles.row} key={index}>
                                <Text style={styles.label}>{ded.name}:</Text>
                                <Text style={styles.value}>{ded.amount || "Según condiciones particulares"}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Premium Info */}
                <View style={styles.premiumSection}>
                    <View style={styles.premiumRow}>
                        <Text style={styles.premiumLabel}>Prima Anual:</Text>
                        <Text style={styles.premiumValue}>
                            {Number(policy.premium).toLocaleString("es-CL", { minimumFractionDigits: 2 })}{" "}
                            {policy.currency}
                        </Text>
                    </View>
                </View>

                {/* Signature Section */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        {policy.Tenant.signatureUrl && (
                            <Image src={policy.Tenant.signatureUrl} style={styles.signatureImage} />
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
                            <Text style={styles.signatureLabel}>Firma del Asegurado</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        {policy.Tenant.footerText ||
                            "Este certificado es un resumen de la póliza contratada. Las condiciones completas están contenidas en las Condiciones Generales, Particulares y Especiales de la póliza."}
                    </Text>
                    <Text style={styles.footerContact}>
                        {[
                            policy.Tenant.address,
                            policy.Tenant.phone && `Tel: ${policy.Tenant.phone}`,
                            policy.Tenant.email,
                            policy.Tenant.website,
                        ]
                            .filter(Boolean)
                            .join(" | ")}
                    </Text>
                </View>
            </Page>
        </Document>
    )
}
