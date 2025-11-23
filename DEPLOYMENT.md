# Guía de Despliegue y Configuración

Este documento detalla las configuraciones necesarias para desplegar la aplicación en Vercel, específicamente para habilitar las funcionalidades de **Cron Jobs** (Facturación Automática) y **Blob Storage** (Subida de Archivos).

## 1. Configuración de Cron Jobs (Facturación Automática)

La aplicación utiliza Vercel Cron Jobs para ejecutar tareas programadas, específicamente la generación automática de cobros mensuales para los tenants.

### Archivo de Configuración
La configuración del cron se encuentra en `vercel.json` en la raíz del proyecto:

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-invoices",
      "schedule": "0 10 * * *"
    }
  ]
}
```

Esto programa la ejecución del endpoint `/api/cron/generate-invoices` todos los días a las 10:00 AM UTC.

### Variables de Entorno Requeridas

Para asegurar que solo Vercel (o un administrador autorizado) pueda ejecutar este endpoint, se utiliza una clave secreta.

*   **`CRON_SECRET`**: Debes generar una cadena de texto larga y aleatoria y configurarla como variable de entorno en tu proyecto de Vercel.

**Pasos en Vercel:**
1.  Ve a tu proyecto en el Dashboard de Vercel.
2.  Entra a **Settings** > **Environment Variables**.
3.  Agrega una nueva variable llamada `CRON_SECRET` con tu valor secreto.
4.  (Opcional) Vercel inyecta automáticamente esta variable en las ejecuciones de cron si usas la integración nativa, pero es buena práctica tenerla definida para pruebas manuales o seguridad adicional.

### Pruebas Locales
Para probar el cron job localmente:
1.  Asegúrate de tener `CRON_SECRET` definido en tu archivo `.env`.
2.  Haz una petición GET a tu endpoint local:
    ```bash
    curl -H "Authorization: Bearer TU_CRON_SECRET" http://localhost:3000/api/cron/generate-invoices
    ```

## 2. Configuración de Vercel Blob (Subida de Archivos)

La aplicación utiliza `@vercel/blob` para almacenar archivos adjuntos (imágenes, PDFs, documentos) asociados a cotizaciones y otros registros.

### Variables de Entorno Requeridas

*   **`BLOB_READ_WRITE_TOKEN`**: Token necesario para autenticar las operaciones de lectura y escritura en el almacenamiento Blob.

**Pasos en Vercel:**
1.  Ve a la pestaña **Storage** en tu Dashboard de Vercel.
2.  Haz clic en **Create Database** y selecciona **Blob**.
3.  Sigue los pasos para crear el store y vincularlo a tu proyecto.
4.  Una vez creado, Vercel agregará automáticamente la variable `BLOB_READ_WRITE_TOKEN` a tu entorno de despliegue.
5.  Para desarrollo local, ve a la sección **Settings** del Blob store, copia el token y agrégalo a tu archivo `.env` local.

## Resumen de Variables de Entorno (.env)

Asegúrate de tener las siguientes variables configuradas en tu entorno de producción y local:

```env
# Base de Datos
DATABASE_URL="postgresql://..."

# Autenticación (NextAuth)
AUTH_SECRET="tu_secreto_generado"
AUTH_URL="http://localhost:3000" # O tu dominio en producción

# Cron Jobs
CRON_SECRET="tu_secreto_para_cron"

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```
