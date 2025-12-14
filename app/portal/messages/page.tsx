import { getPortalSession } from "@/actions/portal-auth"
import { redirect } from "next/navigation"
import { getPortalMessages } from "@/actions/portal-message"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Plus, User, Building2, Briefcase } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { NewMessageDialog } from "@/components/portal/new-message-dialog"
import type { PortalMessage, MessageAttachment } from "@prisma/client"

type MessageWithAttachments = PortalMessage & {
    attachments: MessageAttachment[]
    tenantName: string
}

export default async function PortalMessagesPage() {
    const session = await getPortalSession()

    if (!session) {
        redirect("/portal/login")
    }

    const messages = await getPortalMessages()

    return (
        <div className="container py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Mensajes</h1>
                    <p className="text-muted-foreground mt-1">
                        Comunicación con sus corredores de seguros
                    </p>
                    {session.tenants.length > 1 && (
                        <p className="text-sm text-primary mt-2">
                            Mostrando mensajes de {session.tenants.length} corredores
                        </p>
                    )}
                </div>
                <NewMessageDialog tenants={session.tenants} />
            </div>

            {messages.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No hay mensajes</h3>
                        <p className="text-muted-foreground mt-2 mb-4">
                            Envíe un mensaje para comunicarse con su corredor
                        </p>
                        <NewMessageDialog tenants={session.tenants} />
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {messages.map((message: MessageWithAttachments) => (
                        <Card
                            key={message.id}
                            className={`${
                                !message.isRead && !message.isFromClient
                                    ? "border-blue-200 bg-blue-50/50"
                                    : ""
                            }`}
                        >
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`rounded-full p-2 ${
                                            message.isFromClient
                                                ? "bg-primary/10 text-primary"
                                                : "bg-green-100 text-green-600"
                                        }`}
                                    >
                                        {message.isFromClient ? (
                                            <User className="h-5 w-5" />
                                        ) : (
                                            <Building2 className="h-5 w-5" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium">
                                                {message.isFromClient
                                                    ? "Usted"
                                                    : message.agentUserName || "Su Corredor"}
                                            </span>
                                            {session.tenants.length > 1 && (
                                                <Badge variant="outline" className="text-xs">
                                                    <Briefcase className="h-3 w-3 mr-1" />
                                                    {message.tenantName}
                                                </Badge>
                                            )}
                                            {!message.isRead && !message.isFromClient && (
                                                <Badge variant="default" className="text-xs">
                                                    Nuevo
                                                </Badge>
                                            )}
                                            <span className="text-xs text-muted-foreground ml-auto">
                                                {format(
                                                    new Date(message.createdAt),
                                                    "PPP 'a las' p",
                                                    { locale: es }
                                                )}
                                            </span>
                                        </div>
                                        <h3 className="font-medium mt-1">{message.subject}</h3>
                                        <p className="text-muted-foreground mt-2 whitespace-pre-wrap">
                                            {message.content}
                                        </p>
                                        {message.attachments.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {message.attachments.map((attachment) => (
                                                    <a
                                                        key={attachment.id}
                                                        href={attachment.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                                    >
                                                        📎 {attachment.fileName}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
