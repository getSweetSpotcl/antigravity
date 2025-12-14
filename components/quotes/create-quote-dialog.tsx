"use client"

import * as z from "zod"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, ArrowLeft, ArrowRight, Check } from "lucide-react"

import { QuoteSchema } from "@/schemas/quote"
import { createQuote } from "@/actions/quote"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { Client, InsuranceCompany } from "@prisma/client"
import { Progress } from "@/components/ui/progress"
import { INSURANCE_LINES } from "@/lib/insurance-constants"

// Importar pasos del formulario
import { Step1ClientInfo } from "./quote-steps/step1-client-info"
import { Step2InsuranceInfo } from "./quote-steps/step2-insurance-info"
import { Step3PropertyDetails } from "./quote-steps/step3-property-details"
import { Step4Coverages } from "./quote-steps/step4-coverages"
import { Step5Review } from "./quote-steps/step5-review"

interface CreateQuoteDialogProps {
    clients: Client[]
    companies: InsuranceCompany[]
}

const STEPS = [
    { id: 1, title: "Cliente", description: "Información del cliente y partes" },
    { id: 2, title: "Seguro", description: "Compañía y tipo de seguro" },
    { id: 3, title: "Bien Asegurado", description: "Detalles del bien" },
    { id: 4, title: "Coberturas", description: "Coberturas y primas" },
    { id: 5, title: "Revisión", description: "Confirmar y crear" },
]

export const CreateQuoteDialog = ({ clients, companies }: CreateQuoteDialogProps) => {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)
    const [isPending, startTransition] = useTransition()
    const [attachedFiles, setAttachedFiles] = useState<File[]>([])

    const form = useForm<any>({
        resolver: zodResolver(QuoteSchema),
        defaultValues: {
            contractorName: "",
            contractorRut: "",
            contractorEmail: "",
            contractorPhone: "",
            sameAsContractor: true,
            beneficiaryName: "",
            beneficiaryRut: "",
            beneficiaryType: undefined,
            currency: "UF",
            paymentInstallments: "1",
            commissionPercentage: "0",
            coverages: [],
            policyDuration: "12",
            polNumber: "",
            particularConditions: "",
            customCompanyName: "",
            useCustomPropertyDetails: false,
            customPropertyDetails: "",
            // Inicializar objetos anidados para evitar errores de uncontrolled/controlled
            vehicleDetails: {
                plate: "",
                year: "",
                brand: "",
                model: "",
                vehicleValue: "",
                usage: "",
                chassis: "",
                engine: "",
            },
            propertyDetails: {
                propertyType: "",
                constructionType: "",
                address: "",
                commune: "",
                city: "",
                buildingValue: "",
                contentsValue: "",
                yearBuilt: "",
            },
            lifeInsuranceDetails: {
                insuredAge: "",
                occupation: "",
                coverageAmount: "",
                monthlyContribution: "",
                healthDeclaration: false,
                smoker: false,
            },
            guaranteeDetails: {
                contractType: "",
                contractAmount: "",
                projectDescription: "",
                beneficiaryName: "",
                duration: "",
            },
            liabilityDetails: {
                activityType: "",
                coverageLimit: "",
                numberOfEmployees: "",
                annualRevenue: "",
                location: "",
            },
            transportDetails: {
                cargoType: "",
                transportMode: "",
                route: "",
                insuredValue: "",
                tripFrequency: "",
            },
            engineeringDetails: {
                projectType: "",
                projectValue: "",
                constructionPeriod: "",
                location: "",
            },
        },
        mode: "onChange",
    })

    const onSubmit = (values: z.infer<typeof QuoteSchema>) => {
        startTransition(() => {
            createQuote(values)
                .then((data) => {
                    if (data.error) {
                        toast.error(data.error)
                    }

                    if (data.success) {
                        toast.success(data.success)
                        setOpen(false)
                        form.reset()
                        setCurrentStep(1)
                        router.refresh()
                    }
                })
        })
    }

    const nextStep = async () => {
        let fieldsToValidate: any[] = []

        switch (currentStep) {
            case 1:
                fieldsToValidate = ["clientId", "prospectName", "contractorName", "contractorRut", "contractorEmail", "contractorPhone", "sameAsContractor"]
                if (!form.getValues("sameAsContractor")) {
                    fieldsToValidate.push("insuredName", "insuredRut")
                }

                // Validar que se haya seleccionado cliente o prospecto
                const clientId = form.getValues("clientId")
                const prospectName = form.getValues("prospectName")

                if (!clientId && !prospectName) {
                    form.setError("clientId", {
                        type: "manual",
                        message: "Debes seleccionar un cliente o ingresar un prospecto"
                    })
                    return
                }
                break
            case 2:
                fieldsToValidate = ["companyId", "insuranceLine", "policyType", "validFrom", "validUntil", "policyDuration"]
                if (form.getValues("companyId") === "OTHER") {
                    fieldsToValidate.push("customCompanyName")
                }
                break
            case 3:
                const useCustomDetails = form.getValues("useCustomPropertyDetails")

                // Limpiar error de customPropertyDetails si no se está usando
                if (!useCustomDetails) {
                    form.clearErrors("customPropertyDetails")
                }

                if (useCustomDetails) {
                    const customDetails = form.getValues("customPropertyDetails")
                    if (!customDetails || customDetails.trim().length < 10) {
                        form.setError("customPropertyDetails", {
                            type: "manual",
                            message: `La descripción debe tener al menos 10 caracteres (actual: ${customDetails?.length || 0})`
                        })
                        toast.error("La descripción del bien asegurado es muy corta. Mínimo 10 caracteres.")
                        return
                    }
                    // Si la descripción es válida, limpiar cualquier error previo
                    form.clearErrors("customPropertyDetails")
                } else {
                    const insuranceLine = form.getValues("insuranceLine")
                    const lineConfig = INSURANCE_LINES[insuranceLine as keyof typeof INSURANCE_LINES]

                    if (lineConfig) {
                        if (lineConfig.category === "AUTO") {
                            fieldsToValidate = ["vehicleDetails.plate", "vehicleDetails.brand", "vehicleDetails.model", "vehicleDetails.year", "vehicleDetails.usage"]
                        } else if (lineConfig.category === "LIFE") {
                            fieldsToValidate = ["lifeInsuranceDetails.insuredAge", "lifeInsuranceDetails.occupation", "lifeInsuranceDetails.coverageAmount"]
                        } else if (lineConfig.category === "GUARANTEE") {
                            fieldsToValidate = ["guaranteeDetails.contractType", "guaranteeDetails.contractAmount", "guaranteeDetails.projectDescription", "guaranteeDetails.duration"]
                        } else if (insuranceLine === "RESPONSABILIDAD_CIVIL") {
                            fieldsToValidate = ["liabilityDetails.activityType", "liabilityDetails.coverageLimit", "liabilityDetails.annualRevenue", "liabilityDetails.location"]
                        } else if (insuranceLine === "TRANSPORTE") {
                            fieldsToValidate = ["transportDetails.cargoType", "transportDetails.transportMode", "transportDetails.route", "transportDetails.insuredValue"]
                        } else if (insuranceLine === "TODO_RIESGO_CONSTRUCCION") {
                            fieldsToValidate = ["engineeringDetails.projectType", "engineeringDetails.projectValue", "engineeringDetails.constructionPeriod", "engineeringDetails.location"]
                        } else {
                            // Default Property
                            fieldsToValidate = ["propertyDetails.propertyType", "propertyDetails.constructionType", "propertyDetails.address", "propertyDetails.commune", "propertyDetails.city", "propertyDetails.buildingValue"]
                        }
                    }
                }
                break
            case 4:
                fieldsToValidate = ["coverages", "currency", "totalPremium"]
                break
        }

        if (fieldsToValidate.length > 0) {
            const isValid = await form.trigger(fieldsToValidate)
            if (!isValid) {
                toast.error("Por favor completa los campos requeridos antes de continuar.")
                return
            }
        }

        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1)
        }
    }

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const progress = (currentStep / STEPS.length) * 100

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Cotización
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        Nueva Cotización - {STEPS[currentStep - 1].title}
                    </DialogTitle>
                    <DialogDescription>
                        {STEPS[currentStep - 1].description}
                    </DialogDescription>
                </DialogHeader>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        {STEPS.map((step) => (
                            <button
                                key={step.id}
                                type="button"
                                onClick={() => setCurrentStep(step.id)}
                                className={`flex items-center gap-1 transition-colors hover:text-blue-500 cursor-pointer ${step.id === currentStep ? "text-blue-600 font-semibold" : ""
                                    } ${step.id < currentStep ? "text-emerald-600" : ""}`}
                            >
                                {step.id < currentStep && <Check className="h-3 w-3" />}
                                <span>{step.title}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, () => {
                        toast.error("Por favor revisa los campos requeridos. Hay errores en el formulario.")
                    })} className="flex-1 overflow-y-auto">
                        <div className="py-4 px-1">
                            {currentStep === 1 && <Step1ClientInfo form={form} clients={clients} />}
                            {currentStep === 2 && <Step2InsuranceInfo form={form} companies={companies} />}
                            {currentStep === 3 && <Step3PropertyDetails form={form} />}
                            {currentStep === 4 && <Step4Coverages form={form} />}
                            {currentStep === 5 && (
                                <Step5Review
                                    form={form}
                                    companies={companies}
                                    attachedFiles={attachedFiles}
                                    onFilesChange={setAttachedFiles}
                                />
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t mt-auto">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={prevStep}
                                disabled={currentStep === 1 || isPending}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Anterior
                            </Button>

                            {currentStep < STEPS.length ? (
                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={isPending}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Siguiente
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <Check className="mr-2 h-4 w-4" />
                                    Crear Cotización
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
