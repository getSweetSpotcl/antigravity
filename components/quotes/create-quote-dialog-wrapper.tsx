"use client"

import dynamic from "next/dynamic"
// @ts-expect-error
import { Client, InsuranceCompany } from "@prisma/client"

const CreateQuoteDialog = dynamic(
    () => import("@/components/quotes/create-quote-dialog").then((mod) => mod.CreateQuoteDialog),
    { ssr: false }
)

interface CreateQuoteDialogWrapperProps {
    clients: Client[]
    companies: InsuranceCompany[]
}

export const CreateQuoteDialogWrapper = (props: CreateQuoteDialogWrapperProps) => {
    return <CreateQuoteDialog {...props} />
}
