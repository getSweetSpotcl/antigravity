import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import type { Claim, Policy, Client, InsuranceCompany, Tenant } from "@prisma/client"
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

interface ClaimReportProps {
    claim: Claim & {
        Policy: Policy & {
            Client: Client
            InsuranceCompany: InsuranceCompany | null
            Tenant: TenantWithBranding
        }
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
        reportTitle: {
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
        statusContainer: {
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: 20,
        },
        statusBadge: {
            padding: "6 15",
            borderRadius: 15,
            fontSize: 10,
            fontWeight: "bold",
        },
        statusReported: {
            backgroundColor: "#FEF3C7",
            color: "#92400E",
        },
        statusInProcess: {
            backgroundColor: "#DBEAFE",
            color: "#1E40AF",
        },
        statusApproved: {
            backgroundColor: "#D1FAE5",
            color: "#065F46",
        },
        statusRejected: {
            backgroundColor: "#FEE2E2",
            color: "#991B1B",
        },
        statusPaid: {
            backgroundColor: "#10B981",
            color: "#FFFFFF",
        },
        amountsBox: {
            marginTop: 15,
            padding: 15,
            backgroundColor: "#F8FAFC",
            borderRadius: 4,
            borderLeftWidth: 4,
            borderLeftColor: primaryColor,
        },
        amountRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 8,
            paddingBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: "#E2E8F0",
        },
        amountLabel: {
            fontSize: 10,
            color: "#64748B",
        },
        amountValue: {
            fontSize: 11,
            fontWeight: "bold",
            color: "#0F172A",
        },
        descriptionBox: {
            marginTop: 10,
            padding: 10,
            backgroundColor: "#F1F5F9",
            borderRadius: 4,
            borderWidth: 1,
            borderColor: "#E2E8F0",
        },
        descriptionText: {
            fontSize: 9,
            color: "#334155",
            lineHeight: 1.5,
        },
        timeline: {
            marginTop: 15,
            paddingLeft: 15,
            borderLeftWidth: 2,
            borderLeftColor: primaryColor,
        },
        timelineItem: {
            marginBottom: 12,
            position: "relative",
        },
        timelineDot: {
            position: "absolute",
            left: -19,
            top: 2,
            width: 8,
            height: 8,
            backgroundColor: primaryColor,
            borderRadius: 4,
        },
        timelineDate: {
            fontSize: 8,
            color: "#94A3B8",
            marginBottom: 2,
        },
        timelineTitle: {
            fontSize: 9,
            fontWeight: "bold",
            color: "#334155",
        },
        adjusterBox: {
            marginTop: 10,
            padding: 12,
            backgroundColor: "#EFF6FF",
            borderRadius: 4,
            borderWidth: 1,
            borderColor: "#BFDBFE",
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

const getStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
        REPORTED: "Denunciado",
        IN_PROCESS: "En Proceso",
        APPROVED: "Aprobado",
        REJECTED: "Rechazado",
        PAID: "Pagado",
    }
    return statuses[status] || status
}

const getStatusStyle = (status: string, styles: ReturnType<typeof createStyles>) => {
    switch (status) {
        case "REPORTED":
            return styles.statusReported
        case "IN_PROCESS":
            return styles.statusInProcess
        case "APPROVED":
            return styles.statusApproved
        case "REJECTED":
            return styles.statusRejected
        case "PAID":
            return styles.statusPaid
        default:
            return styles.statusReported
    }
}

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

export const ClaimReport = ({ claim, agent }: ClaimReportProps) => {
    const tenant = claim.Policy.Tenant
    const policy = claim.Policy
    const client = policy.Client

    // Get branding colors with fallbacks
    const primaryColor = tenant.primaryColor || "#3b82f6"
    const secondaryColor = tenant.secondaryColor || "#1e40af"

    const styles = createStyles(primaryColor, secondaryColor)

    // Company display name
    const displayName = tenant.fantasyName || tenant.name

    // Build timeline events
    const timelineEvents = [
        { date: claim.date, title: "Fecha del Siniestro" },
        claim.reportedToCompanyDate && { date: claim.reportedToCompanyDate, title: "Denuncia a Compañía" },
        claim.adjustmentDate && { date: claim.adjustmentDate, title: "Liquidación" },
        claim.resolutionDate && { date: claim.resolutionDate, title: "Resolución" },
    ].filter(Boolean) as Array<{ date: Date; title: string }>

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        {tenant.logoUrl ? (
                            <Image src={tenant.logoUrl} style={styles.logo} />
                        ) : (
                            <Text style={styles.logoPlaceholder}>{displayName}</Text>
                        )}
                    </View>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>
                            {tenant.legalName || tenant.name}
                        </Text>
                        <Text style={styles.companyDetails}>RUT: {tenant.rut}</Text>
                        {tenant.cmfRegistration && (
                            <Text style={styles.companyDetails}>
                                Registro CMF: {tenant.cmfRegistration}
                            </Text>
                        )}
                        {tenant.phone && (
                            <Text style={styles.companyDetails}>Tel: {tenant.phone}</Text>
                        )}
                    </View>
                </View>

                {/* Report Title */}
                <View style={styles.reportTitle}>
                    <Text style={styles.title}>INFORME DE SINIESTRO</Text>
                    <Text style={styles.subtitle}>
                        N° {claim.number || claim.id.slice(0, 8).toUpperCase()} | Emitido:{" "}
                        {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                    </Text>
                </View>

                {/* Status Badge */}
                <View style={styles.statusContainer}>
                    <Text style={[styles.statusBadge, getStatusStyle(claim.status, styles)]}>
                        Estado: {getStatusLabel(claim.status)}
                    </Text>
                </View>

                {/* Insured Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Datos del Asegurado</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Nombre:</Text>
                        <Text style={styles.value}>{client.firstName} {client.lastName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>RUT:</Text>
                        <Text style={styles.value}>{client.rut}</Text>
                    </View>
                    {client.email && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Email:</Text>
                            <Text style={styles.value}>{client.email}</Text>
                        </View>
                    )}
                    {client.phone && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Teléfono:</Text>
                            <Text style={styles.value}>{client.phone}</Text>
                        </View>
                    )}
                </View>

                {/* Policy Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Datos de la Póliza</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>N° Póliza:</Text>
                        <Text style={styles.value}>{policy.number}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Compañía:</Text>
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

                {/* Claim Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detalle del Siniestro</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Fecha del Siniestro:</Text>
                        <Text style={styles.value}>
                            {format(new Date(claim.date), "dd/MM/yyyy")}
                        </Text>
                    </View>
                    {claim.reportedToCompanyDate && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Fecha Denuncia:</Text>
                            <Text style={styles.value}>
                                {format(new Date(claim.reportedToCompanyDate), "dd/MM/yyyy")}
                            </Text>
                        </View>
                    )}
                    <View style={styles.descriptionBox}>
                        <Text style={styles.descriptionText}>{claim.description}</Text>
                    </View>
                </View>

                {/* Adjuster Info */}
                {(claim.adjusterName || claim.adjusterCompany) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Liquidador Asignado</Text>
                        <View style={styles.adjusterBox}>
                            {claim.adjusterName && (
                                <View style={styles.row}>
                                    <Text style={styles.label}>Nombre:</Text>
                                    <Text style={styles.value}>{claim.adjusterName}</Text>
                                </View>
                            )}
                            {claim.adjusterCompany && (
                                <View style={styles.row}>
                                    <Text style={styles.label}>Empresa:</Text>
                                    <Text style={styles.value}>{claim.adjusterCompany}</Text>
                                </View>
                            )}
                            {claim.adjusterPhone && (
                                <View style={styles.row}>
                                    <Text style={styles.label}>Teléfono:</Text>
                                    <Text style={styles.value}>{claim.adjusterPhone}</Text>
                                </View>
                            )}
                            {claim.adjusterEmail && (
                                <View style={styles.row}>
                                    <Text style={styles.label}>Email:</Text>
                                    <Text style={styles.value}>{claim.adjusterEmail}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Amounts */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Montos</Text>
                    <View style={styles.amountsBox}>
                        {claim.claimAmount && (
                            <View style={styles.amountRow}>
                                <Text style={styles.amountLabel}>Monto Reclamado:</Text>
                                <Text style={styles.amountValue}>
                                    {Number(claim.claimAmount).toLocaleString("es-CL", { minimumFractionDigits: 2 })}{" "}
                                    {claim.currency}
                                </Text>
                            </View>
                        )}
                        {claim.reserveAmount && (
                            <View style={styles.amountRow}>
                                <Text style={styles.amountLabel}>Reserva Técnica:</Text>
                                <Text style={styles.amountValue}>
                                    {Number(claim.reserveAmount).toLocaleString("es-CL", { minimumFractionDigits: 2 })}{" "}
                                    {claim.currency}
                                </Text>
                            </View>
                        )}
                        {claim.approvedAmount && (
                            <View style={styles.amountRow}>
                                <Text style={styles.amountLabel}>Monto Aprobado:</Text>
                                <Text style={styles.amountValue}>
                                    {Number(claim.approvedAmount).toLocaleString("es-CL", { minimumFractionDigits: 2 })}{" "}
                                    {claim.currency}
                                </Text>
                            </View>
                        )}
                        {claim.paidAmount && (
                            <View style={[styles.amountRow, { borderBottomWidth: 0 }]}>
                                <Text style={styles.amountLabel}>Monto Pagado:</Text>
                                <Text style={[styles.amountValue, { color: "#10B981" }]}>
                                    {Number(claim.paidAmount).toLocaleString("es-CL", { minimumFractionDigits: 2 })}{" "}
                                    {claim.currency}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Timeline */}
                {timelineEvents.length > 1 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Cronología</Text>
                        <View style={styles.timeline}>
                            {timelineEvents.map((event, index) => (
                                <View style={styles.timelineItem} key={index}>
                                    <View style={styles.timelineDot} />
                                    <Text style={styles.timelineDate}>
                                        {format(new Date(event.date), "dd/MM/yyyy")}
                                    </Text>
                                    <Text style={styles.timelineTitle}>{event.title}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Signature Section */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        {tenant.signatureUrl && (
                            <Image src={tenant.signatureUrl} style={styles.signatureImage} />
                        )}
                        <View style={styles.signatureLine}>
                            <Text style={styles.signatureLabel}>
                                {agent?.name || "Ejecutivo de Siniestros"}
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
                            <Text style={styles.signatureLabel}>Recibido Conforme</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        {tenant.footerText ||
                            "Este informe es un resumen del estado actual del siniestro. La resolución final está sujeta a la evaluación de la compañía aseguradora."}
                    </Text>
                    <Text style={styles.footerContact}>
                        {[
                            tenant.address,
                            tenant.phone && `Tel: ${tenant.phone}`,
                            tenant.email,
                            tenant.website,
                        ]
                            .filter(Boolean)
                            .join(" | ")}
                    </Text>
                </View>
            </Page>
        </Document>
    )
}
