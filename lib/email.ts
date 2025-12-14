import { Resend } from "resend"

// Lazy initialization to avoid build errors when API key is not set
let resend: Resend | null = null

const getResend = () => {
    if (!resend) {
        resend = new Resend(process.env.RESEND_API_KEY || "")
    }
    return resend
}

interface SendEmailOptions {
    to: string | string[]
    subject: string
    html: string
    from?: string
}

export const sendEmail = async ({ to, subject, html, from }: SendEmailOptions) => {
    const fromEmail = from || process.env.RESEND_FROM_EMAIL || "noreply@example.com"

    try {
        const { data, error } = await getResend().emails.send({
            from: fromEmail,
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
        })

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch {
        return { success: false, error: "Error al enviar email" }
    }
}

// Email templates

export const generateRenewalAlertEmail = (data: {
    brokerageName: string
    clientName: string
    policyNumber: string
    company: string
    expirationDate: string
    daysRemaining: number
    dashboardUrl: string
}) => {
    const urgencyColor = data.daysRemaining <= 7 ? "#dc2626" : data.daysRemaining <= 15 ? "#f59e0b" : "#3b82f6"

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${data.brokerageName}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Alerta de Renovación</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none;">
            <div style="background: ${urgencyColor}; color: white; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px;">
                <strong style="font-size: 18px;">⚠️ Póliza próxima a vencer</strong>
                <p style="margin: 10px 0 0 0;">Quedan <strong>${data.daysRemaining} días</strong> para el vencimiento</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
                <h3 style="margin-top: 0; color: #4a5568;">Detalles de la Póliza</h3>

                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; color: #718096;">Cliente:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; font-weight: 600;">${data.clientName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; color: #718096;">Número de Póliza:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; font-weight: 600;">${data.policyNumber}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; color: #718096;">Compañía:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; font-weight: 600;">${data.company}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #718096;">Fecha de Vencimiento:</td>
                        <td style="padding: 10px 0; font-weight: 600; color: ${urgencyColor};">${data.expirationDate}</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center; margin-top: 25px;">
                <a href="${data.dashboardUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                    Ver en Dashboard
                </a>
            </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #718096; font-size: 12px;">
            <p>Este es un correo automático del sistema de gestión de pólizas.</p>
            <p>© ${new Date().getFullYear()} ${data.brokerageName}. Todos los derechos reservados.</p>
        </div>
    </body>
    </html>
    `
}

export const generateRenewalSummaryEmail = (data: {
    brokerageName: string
    totalPolicies: number
    criticalPolicies: Array<{
        clientName: string
        policyNumber: string
        company: string
        daysRemaining: number
    }>
    upcomingPolicies: Array<{
        clientName: string
        policyNumber: string
        company: string
        daysRemaining: number
    }>
    dashboardUrl: string
}) => {
    const renderPolicyRow = (policy: typeof data.criticalPolicies[0], isCritical: boolean) => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e9ecef;">${policy.clientName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e9ecef;">${policy.policyNumber}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e9ecef;">${policy.company}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e9ecef; text-align: center;">
                <span style="background: ${isCritical ? "#fef2f2" : "#fefce8"}; color: ${isCritical ? "#dc2626" : "#ca8a04"}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                    ${policy.daysRemaining} días
                </span>
            </td>
        </tr>
    `

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${data.brokerageName}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Resumen de Renovaciones Pendientes</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none;">
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #1a202c; font-size: 36px; text-align: center;">${data.totalPolicies}</h2>
                <p style="margin: 5px 0 0 0; text-align: center; color: #718096;">Pólizas próximas a vencer</p>
            </div>

            ${data.criticalPolicies.length > 0 ? `
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #dc2626;">⚠️ Críticas (15 días o menos)</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 12px; text-align: left; color: #718096; font-weight: 600;">Cliente</th>
                            <th style="padding: 12px; text-align: left; color: #718096; font-weight: 600;">Póliza</th>
                            <th style="padding: 12px; text-align: left; color: #718096; font-weight: 600;">Compañía</th>
                            <th style="padding: 12px; text-align: center; color: #718096; font-weight: 600;">Vence en</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.criticalPolicies.map(p => renderPolicyRow(p, true)).join("")}
                    </tbody>
                </table>
            </div>
            ` : ""}

            ${data.upcomingPolicies.length > 0 ? `
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
                <h3 style="margin-top: 0; color: #ca8a04;">📅 Próximas (16-60 días)</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 12px; text-align: left; color: #718096; font-weight: 600;">Cliente</th>
                            <th style="padding: 12px; text-align: left; color: #718096; font-weight: 600;">Póliza</th>
                            <th style="padding: 12px; text-align: left; color: #718096; font-weight: 600;">Compañía</th>
                            <th style="padding: 12px; text-align: center; color: #718096; font-weight: 600;">Vence en</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.upcomingPolicies.map(p => renderPolicyRow(p, false)).join("")}
                    </tbody>
                </table>
            </div>
            ` : ""}

            <div style="text-align: center; margin-top: 25px;">
                <a href="${data.dashboardUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                    Gestionar Renovaciones
                </a>
            </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #718096; font-size: 12px;">
            <p>Este es un correo automático del sistema de gestión de pólizas.</p>
            <p>© ${new Date().getFullYear()} ${data.brokerageName}. Todos los derechos reservados.</p>
        </div>
    </body>
    </html>
    `
}

// Portal email templates

export const generateVerificationEmail = (data: {
    clientName: string
    brokerageName: string
    verifyUrl: string
    expiresIn: string
}) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${data.brokerageName}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Portal de Clientes</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1a202c; margin-top: 0;">¡Bienvenido/a, ${data.clientName}!</h2>

            <p style="color: #4a5568;">
                Gracias por registrarte en el portal de clientes de <strong>${data.brokerageName}</strong>.
            </p>

            <p style="color: #4a5568;">
                Para completar tu registro y acceder a tu cuenta, por favor verifica tu correo electrónico haciendo clic en el siguiente botón:
            </p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Verificar mi Email
                </a>
            </div>

            <p style="color: #718096; font-size: 14px;">
                Este enlace expirará en <strong>${data.expiresIn}</strong>.
            </p>

            <p style="color: #718096; font-size: 14px;">
                Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:
            </p>
            <p style="color: #667eea; font-size: 12px; word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">
                ${data.verifyUrl}
            </p>

            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 25px 0;">

            <p style="color: #718096; font-size: 13px;">
                Si no solicitaste esta cuenta, puedes ignorar este correo de manera segura.
            </p>
        </div>

        <div style="text-align: center; padding: 20px; color: #718096; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${data.brokerageName}. Todos los derechos reservados.</p>
        </div>
    </body>
    </html>
    `
}

export const generatePasswordResetEmail = (data: {
    clientName: string
    brokerageName: string
    resetUrl: string
    expiresIn: string
}) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${data.brokerageName}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Recuperación de Contraseña</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1a202c; margin-top: 0;">Hola, ${data.clientName}</h2>

            <p style="color: #4a5568;">
                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el portal de clientes.
            </p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Restablecer Contraseña
                </a>
            </div>

            <p style="color: #718096; font-size: 14px;">
                Este enlace expirará en <strong>${data.expiresIn}</strong>.
            </p>

            <p style="color: #718096; font-size: 14px;">
                Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:
            </p>
            <p style="color: #667eea; font-size: 12px; word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">
                ${data.resetUrl}
            </p>

            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 25px 0;">

            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px;">
                <p style="color: #92400e; font-size: 13px; margin: 0;">
                    <strong>⚠️ Importante:</strong> Si no solicitaste este cambio de contraseña, ignora este correo. Tu contraseña actual permanecerá sin cambios.
                </p>
            </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #718096; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${data.brokerageName}. Todos los derechos reservados.</p>
        </div>
    </body>
    </html>
    `
}

export const generateBrokerMessageEmail = (data: {
    clientName: string
    brokerageName: string
    brokerName: string
    subject: string
    message: string
    portalUrl: string
}) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${data.brokerageName}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Nuevo Mensaje</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1a202c; margin-top: 0;">Hola, ${data.clientName}</h2>

            <p style="color: #4a5568;">
                <strong>${data.brokerName}</strong> de ${data.brokerageName} te ha enviado un mensaje:
            </p>

            <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #1a202c; margin: 0 0 10px 0; font-size: 16px;">${data.subject}</h3>
                <p style="color: #4a5568; margin: 0; white-space: pre-wrap;">${data.message}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Ver en el Portal
                </a>
            </div>

            <p style="color: #718096; font-size: 14px;">
                Puedes responder a este mensaje iniciando sesión en tu portal de clientes.
            </p>
        </div>

        <div style="text-align: center; padding: 20px; color: #718096; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${data.brokerageName}. Todos los derechos reservados.</p>
        </div>
    </body>
    </html>
    `
}

export const generateWelcomeEmail = (data: {
    clientName: string
    brokerageName: string
    portalUrl: string
}) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${data.brokerageName}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Portal de Clientes</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 10px 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">🎉</span>
            </div>

            <h2 style="color: #1a202c; margin-top: 0; text-align: center;">¡Bienvenido/a al Portal!</h2>

            <p style="color: #4a5568; text-align: center;">
                Hola <strong>${data.clientName}</strong>, tu cuenta ha sido verificada exitosamente.
            </p>

            <p style="color: #4a5568;">
                Ahora puedes acceder a tu portal de clientes donde podrás:
            </p>

            <ul style="color: #4a5568; padding-left: 20px;">
                <li style="margin-bottom: 10px;">📋 Ver todas tus pólizas de seguro</li>
                <li style="margin-bottom: 10px;">📝 Reportar y seguir tus siniestros</li>
                <li style="margin-bottom: 10px;">💬 Comunicarte con tu corredor</li>
                <li style="margin-bottom: 10px;">📄 Descargar documentos importantes</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Ir al Portal
                </a>
            </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #718096; font-size: 12px;">
            <p>¿Necesitas ayuda? Contacta a tu corredor de seguros.</p>
            <p>© ${new Date().getFullYear()} ${data.brokerageName}. Todos los derechos reservados.</p>
        </div>
    </body>
    </html>
    `
}
