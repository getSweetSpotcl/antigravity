---
name: email-templates
description: Templates de email transaccional con Resend. Usar cuando se necesite enviar notificaciones por email a clientes o usuarios.
---

# Skill: Email Templates

Este skill documenta el envío de emails transaccionales en GiCS usando Resend.

## Configuración

### Variables de Entorno

```env
RESEND_API_KEY=re_xxxxxxxxxx
EMAIL_FROM="GiCS <noreply@tudominio.com>"
```

### Cliente de Resend

```typescript
// lib/email.ts
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
    to,
    subject,
    html,
    from = process.env.EMAIL_FROM,
}: {
    to: string | string[]
    subject: string
    html: string
    from?: string
}) {
    try {
        const { data, error } = await resend.emails.send({
            from: from || "GiCS <noreply@gics.app>",
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
        })

        if (error) {
            console.error("Error sending email:", error)
            return { success: false, error }
        }

        return { success: true, data }
    } catch (error) {
        console.error("Error sending email:", error)
        return { success: false, error }
    }
}
```

## Estructura de Template HTML

### Template Base

```typescript
export function getBaseTemplate(content: string, tenant?: Tenant) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GiCS</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
            padding: 30px;
            text-align: center;
        }
        .header img {
            max-width: 150px;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .button {
            display: inline-block;
            background-color: #0891b2;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #0e7490;
        }
        .footer {
            background-color: #f1f5f9;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
        }
        .highlight {
            background-color: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
        }
        .warning {
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #e2e8f0;
            padding: 10px 0;
        }
        .info-label {
            color: #64748b;
        }
        .info-value {
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${tenant?.logoUrl ? `<img src="${tenant.logoUrl}" alt="${tenant.name}">` : ''}
            <h1>${tenant?.name || 'GiCS'}</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            ${tenant?.footerText || '© ' + new Date().getFullYear() + ' GiCS - Gestión Integral para Corredores de Seguros'}
            <br>
            ${tenant?.address || ''}
            ${tenant?.phone ? ` | ${tenant.phone}` : ''}
        </div>
    </div>
</body>
</html>
`
}
```

## Templates de Email

### 1. Alerta de Renovación

```typescript
export function getRenewalAlertTemplate(data: {
    clientName: string
    policyNumber: string
    endDate: string
    daysRemaining: number
    portalUrl: string
}, tenant?: Tenant) {
    const content = `
        <h2>Aviso de Renovación de Póliza</h2>
        <p>Estimado/a ${data.clientName},</p>
        <p>Le informamos que su póliza está próxima a vencer:</p>

        <div class="warning">
            <strong>¡Su póliza vence en ${data.daysRemaining} días!</strong>
        </div>

        <div class="info-row">
            <span class="info-label">Número de Póliza:</span>
            <span class="info-value">${data.policyNumber}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Fecha de Vencimiento:</span>
            <span class="info-value">${data.endDate}</span>
        </div>

        <p>Para renovar su póliza o consultar opciones, puede contactarnos o acceder a su portal:</p>

        <a href="${data.portalUrl}" class="button">Acceder al Portal</a>

        <p>Quedamos atentos a sus consultas.</p>
        <p>Saludos cordiales,<br>${tenant?.name || 'Su Corredor de Seguros'}</p>
    `
    return getBaseTemplate(content, tenant)
}
```

### 2. Cotización Enviada

```typescript
export function getQuoteSentTemplate(data: {
    clientName: string
    quoteNumber: string
    companyName: string
    policyType: string
    totalPremium: string
    currency: string
    validUntil: string
    viewUrl: string
}, tenant?: Tenant) {
    const content = `
        <h2>Nueva Cotización de Seguro</h2>
        <p>Estimado/a ${data.clientName},</p>
        <p>Hemos preparado una cotización de seguro para usted:</p>

        <div class="highlight">
            <strong>Cotización N° ${data.quoteNumber}</strong>
        </div>

        <div class="info-row">
            <span class="info-label">Compañía:</span>
            <span class="info-value">${data.companyName}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Tipo de Seguro:</span>
            <span class="info-value">${data.policyType}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Prima Total:</span>
            <span class="info-value">${data.totalPremium} ${data.currency}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Válida hasta:</span>
            <span class="info-value">${data.validUntil}</span>
        </div>

        <p>Puede revisar los detalles completos en el siguiente enlace:</p>

        <a href="${data.viewUrl}" class="button">Ver Cotización</a>

        <p>Si tiene alguna consulta, no dude en contactarnos.</p>
        <p>Saludos cordiales,<br>${tenant?.name || 'Su Corredor de Seguros'}</p>
    `
    return getBaseTemplate(content, tenant)
}
```

### 3. Confirmación de Póliza

```typescript
export function getPolicyConfirmationTemplate(data: {
    clientName: string
    policyNumber: string
    companyName: string
    startDate: string
    endDate: string
    portalUrl: string
}, tenant?: Tenant) {
    const content = `
        <h2>¡Su Póliza ha sido Emitida!</h2>
        <p>Estimado/a ${data.clientName},</p>
        <p>Nos complace informarle que su póliza de seguro ha sido emitida exitosamente:</p>

        <div class="highlight">
            <strong>Póliza N° ${data.policyNumber}</strong>
        </div>

        <div class="info-row">
            <span class="info-label">Compañía:</span>
            <span class="info-value">${data.companyName}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Vigencia:</span>
            <span class="info-value">${data.startDate} al ${data.endDate}</span>
        </div>

        <p>Puede acceder a su portal para descargar su certificado y revisar los detalles:</p>

        <a href="${data.portalUrl}" class="button">Acceder al Portal</a>

        <p>Gracias por confiar en nosotros.</p>
        <p>Saludos cordiales,<br>${tenant?.name || 'Su Corredor de Seguros'}</p>
    `
    return getBaseTemplate(content, tenant)
}
```

### 4. Notificación de Siniestro

```typescript
export function getClaimNotificationTemplate(data: {
    clientName: string
    claimNumber: string
    policyNumber: string
    status: string
    statusMessage: string
    portalUrl: string
}, tenant?: Tenant) {
    const content = `
        <h2>Actualización de Siniestro</h2>
        <p>Estimado/a ${data.clientName},</p>
        <p>Le informamos sobre una actualización en su siniestro:</p>

        <div class="info-row">
            <span class="info-label">N° Siniestro:</span>
            <span class="info-value">${data.claimNumber}</span>
        </div>
        <div class="info-row">
            <span class="info-label">N° Póliza:</span>
            <span class="info-value">${data.policyNumber}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Estado:</span>
            <span class="info-value">${data.status}</span>
        </div>

        <div class="highlight">
            ${data.statusMessage}
        </div>

        <p>Para más detalles, acceda a su portal:</p>

        <a href="${data.portalUrl}" class="button">Ver Siniestro</a>

        <p>Saludos cordiales,<br>${tenant?.name || 'Su Corredor de Seguros'}</p>
    `
    return getBaseTemplate(content, tenant)
}
```

## Uso en Server Actions

```typescript
// En una action o cron job
import { sendEmail } from "@/lib/email"
import { getRenewalAlertTemplate } from "@/lib/email-templates"

export async function sendRenewalAlert(policy: Policy, tenant: Tenant) {
    const template = getRenewalAlertTemplate({
        clientName: `${policy.client.firstName} ${policy.client.lastName}`,
        policyNumber: policy.number,
        endDate: format(policy.endDate, "dd/MM/yyyy"),
        daysRemaining: differenceInDays(policy.endDate, new Date()),
        portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/portal`,
    }, tenant)

    await sendEmail({
        to: policy.client.email,
        subject: `Aviso de renovación - Póliza ${policy.number}`,
        html: template,
    })
}
```

## Cron Job para Alertas

```typescript
// app/api/cron/check-renewals/route.ts
export async function GET(req: Request) {
    // Verificar autorización
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Unauthorized", { status: 401 })
    }

    // Obtener todos los tenants activos
    const tenants = await prisma.tenant.findMany({
        where: { subscriptionStatus: "ACTIVE" },
    })

    for (const tenant of tenants) {
        // Pólizas que vencen en 30 días
        const expiringPolicies = await prisma.policy.findMany({
            where: {
                tenantId: tenant.id,
                status: "ACTIVE",
                endDate: {
                    gte: new Date(),
                    lte: addDays(new Date(), 30),
                },
            },
            include: { client: true },
        })

        for (const policy of expiringPolicies) {
            if (policy.client?.email) {
                await sendRenewalAlert(policy, tenant)
            }
        }
    }

    return new Response("OK")
}
```

## Consideraciones

- Siempre incluir el nombre del tenant en el remitente
- Usar HTML inline styles para compatibilidad
- Incluir versión texto plano para accesibilidad
- Respetar preferencias de comunicación del cliente
- Registrar envíos en log o audit

## Archivos de Referencia

- `lib/email.ts` - Cliente de Resend y función sendEmail
- `app/api/cron/check-renewals/route.ts` - Cron de renovaciones
