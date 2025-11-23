// Tipos de póliza en español según normativa chilena
export const POLICY_TYPES_ES = {
    GENERAL: 'Seguros Generales',
    LIFE: 'Seguros de Vida',
    HEALTH: 'Seguros de Salud',
    AUTO: 'Seguros de Automóviles',
    HOME: 'Seguros de Hogar',
    GUARANTEE: 'Seguros de Garantía',
} as const

// Rubros específicos de seguros en Chile
export const INSURANCE_LINES = {
    // Seguros Generales
    INCENDIO: {
        label: 'Incendio',
        category: 'GENERAL',
        requiredFields: ['propertyType', 'constructionType', 'address', 'buildingValue', 'contentsValue'],
    },
    ROBO_CRISTALES: {
        label: 'Robo y Cristales',
        category: 'GENERAL',
        requiredFields: ['propertyType', 'address', 'securityMeasures', 'insuredValue'],
    },
    RESPONSABILIDAD_CIVIL: {
        label: 'Responsabilidad Civil',
        category: 'GENERAL',
        requiredFields: ['activityType', 'coverageLimit', 'numberOfEmployees'],
    },
    GARANTIA: {
        label: 'Garantía (Fiel Cumplimiento)',
        category: 'GUARANTEE',
        requiredFields: ['contractType', 'contractAmount', 'beneficiaryName', 'projectDescription'],
    },
    TRANSPORTE: {
        label: 'Seguro de Transporte',
        category: 'GENERAL',
        requiredFields: ['cargoType', 'route', 'transportMode', 'insuredValue'],
    },
    TODO_RIESGO_CONSTRUCCION: {
        label: 'Todo Riesgo Construcción',
        category: 'GENERAL',
        requiredFields: ['projectType', 'projectValue', 'constructionPeriod', 'location'],
    },

    // Seguros de Vehículos
    AUTO_OBLIGATORIO: {
        label: 'SOAP (Seguro Obligatorio)',
        category: 'AUTO',
        requiredFields: ['vehiclePlate', 'vehicleBrand', 'vehicleModel', 'vehicleYear'],
    },
    AUTO_TOTAL: {
        label: 'Seguro Automotriz Total',
        category: 'AUTO',
        requiredFields: ['vehiclePlate', 'vehicleBrand', 'vehicleModel', 'vehicleYear', 'vehicleValue', 'usage'],
    },

    // Seguros de Vida
    VIDA_INDIVIDUAL: {
        label: 'Seguro de Vida Individual',
        category: 'LIFE',
        requiredFields: ['insuredAge', 'coverageAmount', 'beneficiaries', 'healthDeclaration'],
    },
    VIDA_CON_AHORRO: {
        label: 'Seguro de Vida con Ahorro (APV)',
        category: 'LIFE',
        requiredFields: ['insuredAge', 'monthlyContribution', 'beneficiaries', 'investmentProfile'],
    },
    VIDA_DESGRAVAMEN: {
        label: 'Seguro de Desgravamen Hipotecario',
        category: 'LIFE',
        requiredFields: ['loanAmount', 'loanTerm', 'bankName', 'propertyAddress'],
    },
} as const

// Estados de cotización
export const QUOTE_STATUS_ES = {
    DRAFT: 'Borrador',
    SENT_TO_COMPANY: 'Enviada a Compañía',
    COMPANY_RESPONSE: 'Respuesta de Compañía',
    SENT_TO_CLIENT: 'Enviada a Cliente',
    ACCEPTED: 'Aceptada por Cliente',
    REJECTED: 'Rechazada por Cliente',
    EXPIRED: 'Vencida',
    CONVERTED_TO_POLICY: 'Convertida en Póliza',
} as const

// Tipos de comunicación
export const COMMUNICATION_TYPES = {
    CALL: 'Llamada Telefónica',
    EMAIL: 'Correo Electrónico',
    MEETING: 'Reunión Presencial',
    WHATSAPP: 'WhatsApp',
    NOTE: 'Nota Interna',
    COMPANY_RESPONSE: 'Respuesta Compañía',
} as const

// Tipos de archivo
export const ATTACHMENT_TYPES = {
    QUOTE_REQUEST: 'Solicitud de Cotización',
    COMPANY_QUOTE: 'Cotización de Compañía',
    CLIENT_EMAIL: 'Email Cliente',
    INSPECTION_PHOTO: 'Foto Inspección',
    PROPERTY_PHOTO: 'Foto Propiedad',
    VEHICLE_PHOTO: 'Foto Vehículo',
    DOCUMENT: 'Documento',
    OTHER: 'Otro',
} as const

// Tipos de propiedad (para seguros de incendio/hogar)
export const PROPERTY_TYPES = {
    CASA: 'Casa',
    DEPARTAMENTO: 'Departamento',
    OFICINA: 'Oficina',
    LOCAL_COMERCIAL: 'Local Comercial',
    BODEGA: 'Bodega',
    INDUSTRIA: 'Industria',
} as const

// Tipos de construcción
export const CONSTRUCTION_TYPES = {
    HORMIGON_ARMADO: 'Hormigón Armado',
    ALBANILERIA: 'Albañilería',
    MADERA: 'Madera',
    METALICA: 'Metálica',
    MIXTA: 'Mixta',
} as const

// Coberturas comunes por tipo de seguro
export const COMMON_COVERAGES = {
    INCENDIO: [
        { code: 'INCENDIO_BASICO', name: 'Incendio Básico', required: true },
        { code: 'SISMO', name: 'Sismo', required: false },
        { code: 'ROTURA_CANERIAS', name: 'Rotura de Cañerías', required: false },
        { code: 'INUNDACION', name: 'Inundación y Desbordamiento', required: false },
        { code: 'REMOCION_ESCOMBROS', name: 'Remoción de Escombros', required: false },
        { code: 'GASTOS_EXTINCION', name: 'Gastos de Extinción', required: false },
    ],
    AUTO: [
        { code: 'RESPONSABILIDAD_CIVIL', name: 'Responsabilidad Civil', required: true },
        { code: 'DANOS_PROPIOS', name: 'Daños Propios', required: false },
        { code: 'ROBO_TOTAL', name: 'Robo Total', required: false },
        { code: 'ACCESORIOS', name: 'Accesorios', required: false },
    ],
    VIDA: [
        { code: 'MUERTE', name: 'Muerte Natural', required: true },
        { code: 'MUERTE_ACCIDENTAL', name: 'Muerte Accidental', required: false },
        { code: 'INVALIDEZ', name: 'Invalidez Total y Permanente', required: false },
        { code: 'ENFERMEDADES_GRAVES', name: 'Enfermedades Graves', required: false },
    ],
    RESPONSABILIDAD_CIVIL: [
        { code: 'RC_EMPRESA', name: 'RC Empresa / Operaciones', required: true },
        { code: 'RC_PATRONAL', name: 'RC Patronal', required: false },
        { code: 'RC_VEHICULAR', name: 'RC Vehicular Exceso', required: false },
        { code: 'RC_PRODUCTOS', name: 'RC Productos', required: false },
        { code: 'DEFENSA_PENAL', name: 'Defensa Penal', required: false },
    ],
    TRANSPORTE: [
        { code: 'TRANS_TERRESTRE', name: 'Transporte Terrestre Nacional', required: true },
        { code: 'ROBO', name: 'Robo con Fuerza en las Cosas', required: false },
        { code: 'ACCIDENTE', name: 'Choque, Volcadura, Desbarrancamiento', required: false },
        { code: 'CARGA_DESCARGA', name: 'Carga y Descarga', required: false },
        { code: 'HUELGA', name: 'Huelga y Motín', required: false },
    ],
    INGENIERIA: [
        { code: 'TRC', name: 'Todo Riesgo Construcción', required: true },
        { code: 'RC_CRUZADA', name: 'RC Cruzada', required: false },
        { code: 'MANTENIMIENTO', name: 'Periodo de Mantenimiento', required: false },
        { code: 'EQUIPO_CONTRATISTA', name: 'Equipo de Contratista', required: false },
    ],
    GARANTIA: [
        { code: 'FIEL_CUMPLIMIENTO', name: 'Fiel Cumplimiento de Contrato', required: true },
        { code: 'SERIEDAD_OFERTA', name: 'Seriedad de la Oferta', required: false },
        { code: 'CORRECTO_USO_ANTICIPO', name: 'Correcto Uso de Anticipo', required: false },
        { code: 'BUENA_EJECUCION', name: 'Buena Ejecución de Obra', required: false },
    ],
} as const
