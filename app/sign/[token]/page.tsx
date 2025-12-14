import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { SignatureClientPage } from "./client-page"

interface SignPageProps {
    params: Promise<{
        token: string
    }>
}

export default async function SignPage({ params }: SignPageProps) {
    const { token } = await params

    // Find the signature request
    const signatureRequest = await prisma.documentSignature.findUnique({
        where: {
            verificationToken: token,
        },
        include: {
            Tenant: {
                select: {
                    name: true,
                    logoUrl: true,
                    primaryColor: true,
                    legalName: true,
                    fantasyName: true,
                },
            },
        },
    })

    if (!signatureRequest) {
        notFound()
    }

    // Get document details based on type
    let documentDetails: {
        title: string
        type: string
        number?: string
    } | null = null

    switch (signatureRequest.documentType) {
        case "QUOTE":
            const quote = await prisma.quote.findUnique({
                where: { id: signatureRequest.documentId },
                select: { quoteNumber: true, policyType: true },
            })
            if (quote) {
                documentDetails = {
                    title: `Cotización ${quote.quoteNumber || signatureRequest.documentId.slice(0, 8)}`,
                    type: quote.policyType,
                    number: quote.quoteNumber || undefined,
                }
            }
            break
        case "POLICY":
            const policy = await prisma.policy.findUnique({
                where: { id: signatureRequest.documentId },
                select: { number: true, type: true },
            })
            if (policy) {
                documentDetails = {
                    title: `Póliza ${policy.number}`,
                    type: policy.type,
                    number: policy.number,
                }
            }
            break
        case "ENDORSEMENT":
            const endorsement = await prisma.endorsement.findUnique({
                where: { id: signatureRequest.documentId },
                select: { number: true, type: true },
            })
            if (endorsement) {
                documentDetails = {
                    title: `Endoso ${endorsement.number || signatureRequest.documentId.slice(0, 8)}`,
                    type: endorsement.type,
                    number: endorsement.number || undefined,
                }
            }
            break
        case "CLAIM":
            const claim = await prisma.claim.findUnique({
                where: { id: signatureRequest.documentId },
                select: { number: true },
            })
            if (claim) {
                documentDetails = {
                    title: `Siniestro ${claim.number || signatureRequest.documentId.slice(0, 8)}`,
                    type: "Siniestro",
                    number: claim.number || undefined,
                }
            }
            break
    }

    return (
        <SignatureClientPage
            signatureRequest={{
                id: signatureRequest.id,
                token: signatureRequest.verificationToken,
                signerName: signatureRequest.signerName,
                signerRut: signatureRequest.signerRut,
                signerEmail: signatureRequest.signerEmail,
                acceptedTerms: signatureRequest.acceptedTerms,
                acceptedAt: signatureRequest.acceptedAt,
                signatureData: signatureRequest.signatureData,
            }}
            tenant={{
                name: signatureRequest.Tenant.fantasyName || signatureRequest.Tenant.name,
                legalName: signatureRequest.Tenant.legalName || signatureRequest.Tenant.name,
                logoUrl: signatureRequest.Tenant.logoUrl,
                primaryColor: signatureRequest.Tenant.primaryColor || "#3b82f6",
            }}
            documentDetails={documentDetails}
        />
    )
}
