import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import type { Commission, Policy, Client, InsuranceCompany, Tenant, CommissionPayment } from "@prisma/client"
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

interface CommissionStatementProps {
    commission: Commission & {
        Policy: Policy & {
            Client: Client
            InsuranceCompany: InsuranceCompany | null
        }
        CommissionPayment: CommissionPayment[]
    }
    tenant: TenantWithBranding
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
        statementTitle: {
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
        statusPending: {
            backgroundColor: "#FEF3C7",
            color: "#92400E",
        },
        statusPartial: {
            backgroundColor: "#DBEAFE",
            color: "#1E40AF",
        },
        statusPaid: {
            backgroundColor: "#D1FAE5",
            color: "#065F46",
        },
        summaryBox: {
            marginTop: 15,
            marginBottom: 20,
            padding: 20,
            backgroundColor: "#F8FAFC",
            borderRadius: 8,
            borderWidth: 2,
            borderColor: primaryColor,
        },
        summaryRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 12,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: "#E2E8F0",
        },
        summaryLabel: {
            fontSize: 11,
            color: "#64748B",
        },
        summaryValue: {
            fontSize: 13,
            fontWeight: "bold",
            color: "#0F172A",
        },
        totalRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 5,
        },
        totalLabel: {
            fontSize: 12,
            fontWeight: "bold",
            color: "#334155",
        },
        totalValue: {
            fontSize: 16,
            fontWeight: "bold",
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
            borderStyle: "solid",
            borderWidth: 1,
            borderColor: "#E2E8F0",
            borderLeftWidth: 0,
            borderTopWidth: 0,
            backgroundColor: primaryColor,
            padding: 6,
        },
        tableCol: {
            borderStyle: "solid",
            borderWidth: 1,
            borderColor: "#E2E8F0",
            borderLeftWidth: 0,
            borderTopWidth: 0,
            padding: 6,
        },
        tableCellHeader: {
            fontSize: 8,
            fontWeight: "bold",
            color: "#FFFFFF",
            textAlign: "center",
        },
        tableCell: {
            fontSize: 8,
            color: "#334155",
            textAlign: "center",
        },
        colDate: { width: "20%" },
        colAmount: { width: "25%" },
        colMethod: { width: "25%" },
        colRef: { width: "30%" },
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
        infoBox: {
            padding: 10,
            backgroundColor: "#EFF6FF",
            borderRadius: 4,
            borderLeftWidth: 4,
            borderLeftColor: primaryColor,
            marginTop: 10,
        },
        infoText: {
            fontSize: 8,
            color: "#1E40AF",
            lineHeight: 1.4,
        },
    })

const getStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
        PENDING: "Pendiente",
        PARTIAL: "Pago Parcial",
        PAID: "Pagado",
    }
    return statuses[status] || status
}

const getStatusStyle = (status: string, styles: ReturnType<typeof createStyles>) => {
    switch (status) {
        case "PENDING":
            return styles.statusPending
        case "PARTIAL":
            return styles.statusPartial
        case "PAID":
            return styles.statusPaid
        default:
            return styles.statusPending
    }
}

const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
        TRANSFER: "Transferencia",
        CHECK: "Cheque",
        CASH: "Efectivo",
        CREDIT_CARD: "Tarjeta de Crédito",
    }
    return methods[method] || method
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

export const CommissionStatement = ({ commission, tenant, agent }: CommissionStatementProps) => {
    const policy = commission.Policy
    const client = policy.Client
    const payments = commission.CommissionPayment || []

    // Get branding colors with fallbacks
    const primaryColor = tenant.primaryColor || "#3b82f6"
    const secondaryColor = tenant.secondaryColor || "#1e40af"

    const styles = createStyles(primaryColor, secondaryColor)

    // Company display name
    const displayName = tenant.fantasyName || tenant.name

    // Calculate paid percentage
    const paidPercentage = Number(commission.amount) > 0
        ? ((Number(commission.paidAmount) / Number(commission.amount)) * 100).toFixed(1)
        : "0"

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

                {/* Statement Title */}
                <View style={styles.statementTitle}>
                    <Text style={styles.title}>ESTADO DE COMISIÓN</Text>
                    <Text style={styles.subtitle}>
                        Generado: {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                    </Text>
                </View>

                {/* Status Badge */}
                <View style={styles.statusContainer}>
                    <Text style={[styles.statusBadge, getStatusStyle(commission.status, styles)]}>
                        {getStatusLabel(commission.status)} ({paidPercentage}%)
                    </Text>
                </View>

                {/* Commission Summary */}
                <View style={styles.summaryBox}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Comisión Total:</Text>
                        <Text style={styles.summaryValue}>
                            {Number(commission.amount).toLocaleString("es-CL", { minimumFractionDigits: 2 })}{" "}
                            {commission.currency}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Monto Pagado:</Text>
                        <Text style={[styles.summaryValue, { color: "#10B981" }]}>
                            {Number(commission.paidAmount).toLocaleString("es-CL", { minimumFractionDigits: 2 })}{" "}
                            {commission.currency}
                        </Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Saldo Pendiente:</Text>
                        <Text style={[styles.totalValue, { color: primaryColor }]}>
                            {Number(commission.pendingAmount).toLocaleString("es-CL", { minimumFractionDigits: 2 })}{" "}
                            {commission.currency}
                        </Text>
                    </View>
                </View>

                {/* Policy Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Datos de la Póliza</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>N° Póliza:</Text>
                        <Text style={styles.value}>{policy.number}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Cliente:</Text>
                        <Text style={styles.value}>{client.firstName} {client.lastName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>RUT Cliente:</Text>
                        <Text style={styles.value}>{client.rut}</Text>
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

                {/* Commission Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detalle de Comisión</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Prima Base:</Text>
                        <Text style={styles.value}>
                            {Number(commission.baseAmount).toLocaleString("es-CL", { minimumFractionDigits: 2 })}{" "}
                            {commission.currency}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Porcentaje:</Text>
                        <Text style={styles.value}>{Number(commission.percentage).toFixed(2)}%</Text>
                    </View>
                    {commission.dueDate && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Fecha Vencimiento:</Text>
                            <Text style={styles.value}>
                                {format(new Date(commission.dueDate), "dd/MM/yyyy")}
                            </Text>
                        </View>
                    )}
                    {commission.installment && commission.totalInstallments && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Cuota:</Text>
                            <Text style={styles.value}>
                                {commission.installment} de {commission.totalInstallments}
                            </Text>
                        </View>
                    )}
                    {commission.periodStart && commission.periodEnd && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Período:</Text>
                            <Text style={styles.value}>
                                {format(new Date(commission.periodStart), "dd/MM/yyyy")} al{" "}
                                {format(new Date(commission.periodEnd), "dd/MM/yyyy")}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Payment History */}
                {payments.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Historial de Pagos</Text>
                        <View style={styles.table}>
                            <View style={styles.tableRow}>
                                <View style={[styles.tableColHeader, styles.colDate]}>
                                    <Text style={styles.tableCellHeader}>Fecha</Text>
                                </View>
                                <View style={[styles.tableColHeader, styles.colAmount]}>
                                    <Text style={styles.tableCellHeader}>Monto</Text>
                                </View>
                                <View style={[styles.tableColHeader, styles.colMethod]}>
                                    <Text style={styles.tableCellHeader}>Método</Text>
                                </View>
                                <View style={[styles.tableColHeader, styles.colRef]}>
                                    <Text style={styles.tableCellHeader}>Referencia</Text>
                                </View>
                            </View>
                            {payments.map((payment, index) => (
                                <View style={styles.tableRow} key={index}>
                                    <View style={[styles.tableCol, styles.colDate]}>
                                        <Text style={styles.tableCell}>
                                            {format(new Date(payment.paymentDate), "dd/MM/yyyy")}
                                        </Text>
                                    </View>
                                    <View style={[styles.tableCol, styles.colAmount]}>
                                        <Text style={styles.tableCell}>
                                            {Number(payment.amount).toLocaleString("es-CL", { minimumFractionDigits: 2 })}{" "}
                                            {commission.currency}
                                        </Text>
                                    </View>
                                    <View style={[styles.tableCol, styles.colMethod]}>
                                        <Text style={styles.tableCell}>
                                            {getPaymentMethodLabel(payment.paymentMethod)}
                                        </Text>
                                    </View>
                                    <View style={[styles.tableCol, styles.colRef]}>
                                        <Text style={styles.tableCell}>
                                            {payment.reference || "-"}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Notes */}
                {commission.notes && (
                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>Notas: {commission.notes}</Text>
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
                                {agent?.name || "Administración"}
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
                            "Este documento es un estado de cuenta de las comisiones generadas. Para consultas, comuníquese con su ejecutivo."}
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
