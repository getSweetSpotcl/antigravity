import { z } from "zod"

// Validación de RUT chileno
const rutRegex = /^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9Kk]$/

export const RutSchema = z.string().regex(rutRegex, "Formato de RUT inválido (ej: 12.345.678-9)")

// Schema para detalles del bien asegurado - Incendio
export const PropertyDetailsSchema = z.object({
    propertyType: z.enum(["CASA", "DEPARTAMENTO", "OFICINA", "LOCAL_COMERCIAL", "BODEGA", "INDUSTRIA"]),
    constructionType: z.enum(["HORMIGON_ARMADO", "ALBANILERIA", "MADERA", "METALICA", "MIXTA"]),
    address: z.string().min(1, "La dirección es requerida"),
    commune: z.string().min(1, "La comuna es requerida"),
    city: z.string().min(1, "La ciudad es requerida"),
    buildingValue: z.string().min(1, "El valor de la edificación es requerido"),
    contentsValue: z.string().optional(),
    yearBuilt: z.string().optional(),
    totalArea: z.string().optional(),
})

// Schema para vehículo
export const VehicleDetailsSchema = z.object({
    plate: z.string().min(1, "La patente es requerida"),
    brand: z.string().min(1, "La marca es requerida"),
    model: z.string().min(1, "El modelo es requerido"),
    year: z.string().min(4, "El año es requerido"),
    vehicleValue: z.string().optional(),
    usage: z.enum(["PARTICULAR", "COMERCIAL", "TAXI", "COLECTIVO"]),
    chassis: z.string().optional(),
    engine: z.string().optional(),
})

// Schema para vida
export const LifeInsuranceDetailsSchema = z.object({
    insuredAge: z.string().min(1, "La edad del asegurado es requerida"),
    occupation: z.string().min(1, "La ocupación es requerida"),
    coverageAmount: z.string().min(1, "El monto de cobertura es requerido"),
    healthDeclaration: z.boolean(),
    smoker: z.boolean().optional(),
    monthlyContribution: z.string().optional(),
})

// Schema para garantía
export const GuaranteeDetailsSchema = z.object({
    contractType: z.string().min(1, "El tipo de contrato es requerido"),
    contractAmount: z.string().min(1, "El monto del contrato es requerido"),
    projectDescription: z.string().min(1, "La descripción del proyecto es requerida"),
    beneficiaryName: z.string().optional(), // Puede ser diferente al beneficiario de la póliza
    duration: z.string().min(1, "El plazo de ejecución es requerido"),
})

// Schema para Responsabilidad Civil
export const LiabilityDetailsSchema = z.object({
    activityType: z.string().min(1, "El tipo de actividad es requerido"),
    coverageLimit: z.string().min(1, "El límite de cobertura es requerido"),
    numberOfEmployees: z.string().optional(),
    annualRevenue: z.string().min(1, "Los ingresos anuales son requeridos"),
    location: z.string().min(1, "La ubicación es requerida"),
})

// Schema para Transporte
export const TransportDetailsSchema = z.object({
    cargoType: z.string().min(1, "El tipo de carga es requerido"),
    transportMode: z.string().min(1, "El medio de transporte es requerido"), // Terrestre, Marítimo, Aéreo
    route: z.string().min(1, "El trayecto es requerido"), // Nacional, Internacional, Específico
    insuredValue: z.string().min(1, "El monto asegurado es requerido"),
    tripFrequency: z.string().optional(), // Único, Anual
})

// Schema para Ingeniería / Todo Riesgo Construcción
export const EngineeringDetailsSchema = z.object({
    projectType: z.string().min(1, "El tipo de obra es requerido"),
    projectValue: z.string().min(1, "El valor de la obra es requerido"),
    constructionPeriod: z.string().min(1, "El periodo de construcción es requerido"),
    location: z.string().min(1, "La ubicación de la obra es requerida"),
    contractorName: z.string().optional(),
})

// Schema para cobertura individual
export const CoverageItemSchema = z.object({
    code: z.string().min(1, "El código de cobertura es requerido"),
    name: z.string().min(1, "El nombre de la cobertura es requerido"),
    insuredAmount: z.string().optional(),
    premium: z.string().min(1, "La prima es requerida").refine((val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0
    }, "La prima debe ser un número positivo o cero"),
    deductible: z.string().optional(),
    required: z.boolean().default(false),
    // CAD: Número de cláusula adicional (1 por cobertura)
    cadNumber: z.string().optional(),
})

// Schema principal para cotización
export const QuoteSchema = z.object({
    // Información básica
    quoteNumber: z.string().optional(),

    // Cliente o Prospecto
    clientId: z.string().optional(),
    prospectName: z.string().optional(),

    // Vendedor asignado (opcional)
    agentId: z.string().optional(),

    // Tomador (Contratante)
    contractorName: z.string().min(1, "El nombre del tomador es requerido"),
    contractorRut: RutSchema,
    contractorEmail: z.string().email("Email inválido").optional(),
    contractorPhone: z.string().optional(),

    // Asegurado (puede ser el mismo que el tomador)
    sameAsContractor: z.boolean().default(false),
    insuredName: z.string().optional(),
    insuredRut: z.string().optional(),
    insuredAddress: z.string().optional(),

    // Beneficiario (completamente opcional)
    beneficiaryName: z.string().optional(),
    beneficiaryRut: z.string().optional(),
    beneficiaryType: z.enum(["ASEGURADO", "BANCO", "TERCERO"]).or(z.literal("")).optional(),

    // Información de la póliza
    companyId: z.string().min(1, "Debes seleccionar una compañía"),
    customCompanyName: z.string().optional(),
    insuranceLine: z.string().min(1, "Debes seleccionar un rubro"),
    policyType: z.enum(["GENERAL", "LIFE", "HEALTH", "AUTO", "HOME", "GUARANTEE"]),

    // Detalles del bien asegurado (según tipo) - TODOS OPCIONALES
    propertyDetails: z.any().optional(),
    vehicleDetails: z.any().optional(),
    lifeInsuranceDetails: z.any().optional(),
    guaranteeDetails: z.any().optional(),
    liabilityDetails: z.any().optional(),
    transportDetails: z.any().optional(),
    engineeringDetails: z.any().optional(),

    // Opción de texto libre para el bien asegurado
    useCustomPropertyDetails: z.boolean().default(false),
    customPropertyDetails: z.string().optional(),

    // Coberturas
    coverages: z.array(CoverageItemSchema).min(1, "Debes agregar al menos una cobertura"),
    totalInsuredAmount: z.string().optional(),
    totalPremium: z.string().min(1, "La prima total es requerida"),
    currency: z.enum(["UF", "CLP", "USD"]).default("UF"),
    paymentInstallments: z.string().default("1"), // Número de cuotas
    commissionPercentage: z.string().optional().default("0"), // Comisión corredor %

    // Vigencia
    validFrom: z.date().optional(),
    validUntil: z.date({
        message: "La fecha de validez es requerida",
    }),
    policyDuration: z.string().optional(), // En meses

    // Campos de póliza chilena (nivel global)
    polNumber: z.string().optional(), // N° POL (Condiciones Generales) - 1 por póliza
    particularConditions: z.string().optional(), // Condiciones Particulares - 1 por póliza

    // Notas
    notes: z.string().optional(),
    internalNotes: z.string().optional(),
}).refine((data) => {
    // Si no es el mismo que el tomador, requiere datos del asegurado
    if (!data.sameAsContractor) {
        return data.insuredName && data.insuredRut
    }
    return true
}, {
    message: "Debes completar los datos del asegurado",
    path: ["insuredName"],
}).refine((data) => data.clientId || data.prospectName, {
    message: "Debes seleccionar un cliente o ingresar el nombre de un prospecto",
    path: ["clientId"],
})

export type QuoteFormValues = z.infer<typeof QuoteSchema>
export type CoverageItem = z.infer<typeof CoverageItemSchema>
export type PropertyDetails = z.infer<typeof PropertyDetailsSchema>
export type VehicleDetails = z.infer<typeof VehicleDetailsSchema>
export type LifeInsuranceDetails = z.infer<typeof LifeInsuranceDetailsSchema>
export type GuaranteeDetails = z.infer<typeof GuaranteeDetailsSchema>
export type LiabilityDetails = z.infer<typeof LiabilityDetailsSchema>
export type TransportDetails = z.infer<typeof TransportDetailsSchema>
export type EngineeringDetails = z.infer<typeof EngineeringDetailsSchema>

// Schema para comunicación
export const CommunicationSchema = z.object({
    quoteId: z.string().min(1),
    type: z.enum(["CALL", "EMAIL", "MEETING", "WHATSAPP", "NOTE", "COMPANY_RESPONSE"]),
    subject: z.string().optional(),
    content: z.string().min(1, "El contenido es requerido"),
    contactPerson: z.string().optional(),
})

export type CommunicationFormValues = z.infer<typeof CommunicationSchema>
