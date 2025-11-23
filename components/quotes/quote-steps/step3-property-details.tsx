"use client"

import { UseFormReturn } from "react-hook-form"
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { INSURANCE_LINES, PROPERTY_TYPES, CONSTRUCTION_TYPES } from "@/lib/insurance-constants"

interface Step3Props {
    form: UseFormReturn<any>
}

export const Step3PropertyDetails = ({ form }: Step3Props) => {
    const insuranceLine = form.watch("insuranceLine")
    const lineConfig = INSURANCE_LINES[insuranceLine as keyof typeof INSURANCE_LINES]
    const useCustomDetails = form.watch("useCustomPropertyDetails")

    if (!lineConfig) return null

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <FormField
                    control={form.control}
                    name="useCustomPropertyDetails"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                    Usar descripción libre del bien asegurado
                                </FormLabel>
                                <FormDescription>
                                    Marca esta opción si prefieres escribir una descripción libre en lugar de usar el formulario estructurado.
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />
            </div>

            {useCustomDetails ? (
                <FormField
                    control={form.control}
                    name="customPropertyDetails"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descripción del Bien Asegurado</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Describe detalladamente el bien, ubicación, características, etc."
                                    className="min-h-[200px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            ) : (
                <>
                    {renderSpecificForm(insuranceLine, lineConfig, form)}
                </>
            )}
        </div>
    )
}

const renderSpecificForm = (insuranceLine: string, lineConfig: any, form: UseFormReturn<any>) => {
    // Renderizado condicional según la categoría del rubro
    if (lineConfig.category === "AUTO") {
        return <VehicleDetailsForm form={form} />
    }

    if (lineConfig.category === "LIFE") {
        return <LifeDetailsForm form={form} />
    }

    if (lineConfig.category === "GUARANTEE") {
        return <GuaranteeDetailsForm form={form} />
    }

    // Formularios específicos por rubro dentro de GENERAL
    if (insuranceLine === "RESPONSABILIDAD_CIVIL") {
        return <LiabilityDetailsForm form={form} />
    }

    if (insuranceLine === "TRANSPORTE") {
        return <TransportDetailsForm form={form} />
    }

    if (insuranceLine === "TODO_RIESGO_CONSTRUCCION") {
        return <EngineeringDetailsForm form={form} />
    }

    // Por defecto, mostrar formulario de propiedad (Generales: Incendio, Robo, etc.)
    return <PropertyDetailsForm form={form} />
}

const PropertyDetailsForm = ({ form }: { form: UseFormReturn<any> }) => {
    return (
        <div className="space-y-6 animate-in fade-in">
            <h3 className="text-lg font-medium">Detalles de la Propiedad / Bien Asegurado</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="propertyDetails.propertyType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de Propiedad</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione tipo" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Object.entries(PROPERTY_TYPES).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>
                                            {value}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="propertyDetails.constructionType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Material de Construcción</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione material" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Object.entries(CONSTRUCTION_TYPES).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>
                                            {value}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="propertyDetails.address"
                    render={({ field }) => (
                        <FormItem className="col-span-2">
                            <FormLabel>Dirección del Riesgo</FormLabel>
                            <FormControl>
                                <Input placeholder="Calle, número, depto" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="propertyDetails.commune"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Comuna</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Providencia" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="propertyDetails.city"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ciudad</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Santiago" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="propertyDetails.buildingValue"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor Edificación (UF)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="propertyDetails.contentsValue"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor Contenidos (UF)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="propertyDetails.yearBuilt"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Año de Construcción</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Ej: 2010" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    )
}

const VehicleDetailsForm = ({ form }: { form: UseFormReturn<any> }) => {
    return (
        <div className="space-y-6 animate-in fade-in">
            <h3 className="text-lg font-medium">Detalles del Vehículo</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="vehicleDetails.plate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Patente</FormLabel>
                            <FormControl>
                                <Input placeholder="ABCD-12" className="uppercase" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="vehicleDetails.year"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Año</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="2024" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="vehicleDetails.brand"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Marca</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Toyota" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="vehicleDetails.model"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Modelo</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: RAV4" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="vehicleDetails.vehicleValue"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor Comercial (UF)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="vehicleDetails.usage"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Uso</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione uso" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="PARTICULAR">Particular</SelectItem>
                                    <SelectItem value="COMERCIAL">Comercial</SelectItem>
                                    <SelectItem value="TAXI">Taxi</SelectItem>
                                    <SelectItem value="COLECTIVO">Colectivo</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="vehicleDetails.chassis"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>N° Chasis (Opcional)</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="vehicleDetails.engine"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>N° Motor (Opcional)</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    )
}

const LifeDetailsForm = ({ form }: { form: UseFormReturn<any> }) => {
    return (
        <div className="space-y-6 animate-in fade-in">
            <h3 className="text-lg font-medium">Detalles del Asegurado (Vida/Salud)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="lifeInsuranceDetails.insuredAge"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Edad Actual</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Años" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="lifeInsuranceDetails.occupation"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ocupación / Profesión</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Ingeniero" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="lifeInsuranceDetails.coverageAmount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Capital Asegurado (UF)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="lifeInsuranceDetails.monthlyContribution"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Aporte Mensual (Si aplica)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="lifeInsuranceDetails.healthDeclaration"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                    Declaración de Salud (DPS)
                                </FormLabel>
                                <p className="text-sm text-muted-foreground">
                                    El asegurado declara buen estado de salud.
                                </p>
                            </div>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="lifeInsuranceDetails.smoker"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                    Fumador
                                </FormLabel>
                            </div>
                        </FormItem>
                    )}
                />
            </div>
        </div>
    )
}

const GuaranteeDetailsForm = ({ form }: { form: UseFormReturn<any> }) => {
    return (
        <div className="space-y-6 animate-in fade-in">
            <h3 className="text-lg font-medium">Detalles de la Garantía</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="guaranteeDetails.contractType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de Contrato</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Obra Pública, Suministro" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="guaranteeDetails.contractAmount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Monto del Contrato (UF)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="guaranteeDetails.projectDescription"
                    render={({ field }) => (
                        <FormItem className="col-span-2">
                            <FormLabel>Descripción del Proyecto / Obra</FormLabel>
                            <FormControl>
                                <Input placeholder="Nombre y descripción breve del proyecto" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="guaranteeDetails.beneficiaryName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Beneficiario de la Garantía (Si difiere)</FormLabel>
                            <FormControl>
                                <Input placeholder="Nombre del mandante" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="guaranteeDetails.duration"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Plazo de Ejecución</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: 12 meses" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    )
}

const LiabilityDetailsForm = ({ form }: { form: UseFormReturn<any> }) => {
    return (
        <div className="space-y-6 animate-in fade-in">
            <h3 className="text-lg font-medium">Detalles de Responsabilidad Civil</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="liabilityDetails.activityType"
                    render={({ field }) => (
                        <FormItem className="col-span-2">
                            <FormLabel>Giro o Actividad a Asegurar</FormLabel>
                            <FormControl>
                                <Input placeholder="Descripción detallada de la actividad" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="liabilityDetails.coverageLimit"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Límite de Cobertura (UF)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="liabilityDetails.numberOfEmployees"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>N° de Empleados</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="liabilityDetails.annualRevenue"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ingresos Anuales (Aprox)</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: 10.000 UF" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="liabilityDetails.location"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ubicación Principal</FormLabel>
                            <FormControl>
                                <Input placeholder="Dirección del riesgo" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    )
}

const TransportDetailsForm = ({ form }: { form: UseFormReturn<any> }) => {
    return (
        <div className="space-y-6 animate-in fade-in">
            <h3 className="text-lg font-medium">Detalles de Transporte</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="transportDetails.cargoType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de Carga</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Maquinaria, Alimentos, General" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="transportDetails.transportMode"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Medio de Transporte</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Camión propio, Terceros, Marítimo" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="transportDetails.route"
                    render={({ field }) => (
                        <FormItem className="col-span-2">
                            <FormLabel>Trayecto / Ruta</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Santiago a Antofagasta / Todo Chile" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="transportDetails.insuredValue"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Monto Asegurado por Embarque (UF)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="transportDetails.tripFrequency"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Frecuencia de Viajes</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: 4 viajes mensuales" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    )
}

const EngineeringDetailsForm = ({ form }: { form: UseFormReturn<any> }) => {
    return (
        <div className="space-y-6 animate-in fade-in">
            <h3 className="text-lg font-medium">Detalles de Ingeniería / Construcción</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="engineeringDetails.projectType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de Obra</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Edificio Habitacional, Puente, Camino" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="engineeringDetails.projectValue"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor del Proyecto (UF)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="engineeringDetails.constructionPeriod"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Periodo de Construcción</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: 18 meses" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="engineeringDetails.location"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ubicación de la Obra</FormLabel>
                            <FormControl>
                                <Input placeholder="Dirección exacta" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="engineeringDetails.contractorName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contratista Principal</FormLabel>
                            <FormControl>
                                <Input placeholder="Nombre de la constructora" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    )
}
