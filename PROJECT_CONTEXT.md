# PROJECT_CONTEXT.md
> **Instrucción para el asistente:** Lee este archivo ANTES de hacer cualquier cambio importante.
> Actualízalo cada vez que termines una tarea relevante, encuentres un error o tomes una decisión técnica.

---

## 1. Resumen general del proyecto

**KAS Supplements** es una tienda de e-commerce especializada en suplementos deportivos, orientada al mercado mexicano. El proyecto resuelve la venta online de productos de nutrición deportiva con soporte para:
- Compras únicas mediante Checkout Bricks de Mercado Pago.
- Suscripciones recurrentes mediante Preapproval de Mercado Pago.
- Panel de administración para gestionar productos, órdenes y devoluciones.
- Sistema de notificaciones por email al cliente en cada evento relevante.

**Nombre interno del repo:** STF  
**Rama principal:** `main`  
**Backend desplegado en:** Railway  
**Frontend desplegado en:** Vercel — `https://stf-two.vercel.app`

---

## 2. Stack tecnológico

| Área | Tecnología |
|---|---|
| **Frontend** | React 18, Vite 4, React Router v6, TailwindCSS 3 |
| **Componentes UI** | Lucide React (íconos), clsx |
| **HTTP Cliente** | Axios (instancia centralizada en `apiService.js`) |
| **SEO** | react-helmet-async |
| **Backend** | Node.js (ESM), Express 4 |
| **ORM / DB** | Prisma 5 + PostgreSQL |
| **Autenticación** | JWT (`jsonwebtoken`) + bcrypt |
| **Panel Admin** | AdminJS 7 + @adminjs/express + @adminjs/prisma |
| **Pagos únicos** | Mercado Pago SDK v2 (`mercadopago`) — Checkout Bricks / Payment Brick |
| **Suscripciones** | Mercado Pago Preapproval — REST directo (pendiente migrar a SDK) |
| **Webhooks MP** | HMAC-SHA256 con `crypto.timingSafeEqual` |
| **Email** | Resend SDK |
| **PDF** | PDFKit |
| **Seguridad** | Helmet, express-rate-limit, CORS |
| **Validación** | Zod |
| **Despliegue backend** | Railway |
| **Variables de entorno** | dotenv (local), panel de Railway (producción) |

---

## 3. Arquitectura del proyecto

```
STF/
├── client/                      # Frontend React + Vite
│   ├── src/
│   │   ├── App.jsx              # Routing principal
│   │   ├── pages/               # Una página por ruta
│   │   ├── components/          # Componentes reutilizables (Header, Footer, CartSidebar, etc.)
│   │   ├── context/             # Estado global: AuthContext, CartContext, ToastContext
│   │   ├── services/
│   │   │   └── apiService.js    # Instancia Axios centralizada + todas las llamadas API
│   │   ├── hooks/               # Custom hooks
│   │   └── utils/               # Utilidades (formatters, etc.)
│   └── .env                     # VITE_MERCADOPAGO_PUBLIC_KEY, VITE_API_URL
│
└── server/api/                  # Backend Express
    ├── src/
    │   ├── app.js               # Entry point: middlewares + registro de rutas
    │   ├── config.js            # Todas las env vars centralizadas + startup guard
    │   ├── container.js         # Inyección de dependencias (DI manual)
    │   ├── prisma.js            # Singleton de PrismaClient
    │   ├── admin.js             # Configuración de AdminJS
    │   ├── routes/              # Rutas Express (una por recurso)
    │   ├── controllers/         # Capa HTTP: valida con Zod, llama al servicio
    │   ├── services/            # Lógica de negocio
    │   ├── repositories/        # Acceso a DB vía Prisma
    │   ├── middlewares/         # authenticate, optionalAuth, asyncHandler, errorHandler, rateLimiter
    │   └── templates/           # Plantillas HTML para emails
    └── prisma/
        ├── schema.prisma        # Modelos de base de datos
        └── seed.js              # Datos iniciales
```

### Patrón de capas (Backend)
```
Request → Route → Controller (Zod) → Service (lógica) → Repository (Prisma) → DB
```

### Inyección de dependencias
Toda instanciación ocurre en `container.js`. Las clases reciben sus dependencias por constructor. Nunca instanciar servicios directamente en rutas.

### Flujo de datos general
1. **Frontend** llama a `/api/v1/*` vía `apiService.js`.
2. **Backend** valida JWT en middleware, valida body con Zod en controller.
3. **Service** ejecuta la lógica de negocio y llama al Repository.
4. **Repository** consulta PostgreSQL vía Prisma.
5. **Respuesta JSON** regresa al frontend.

---

## 4. Funcionalidades principales

| Funcionalidad | Descripción |
|---|---|
| **Catálogo de productos** | Listado por categoría/marca, filtros, búsqueda (`/buscar`), detalle de producto con slug |
| **Carrito de compras** | Estado global en `CartContext`, sidebar animado, persistencia en localStorage |
| **Autenticación** | Registro/login con JWT, modal global, perfil de usuario, rutas protegidas |
| **Checkout (pago único)** | Flujo 2 pasos: dirección → Payment Brick. Orden se crea en DB antes del pago |
| **Payment Brick** | Tarjeta: `onSubmit` → `POST /api/v1/payments/process` → MP SDK. Oxxo/transferencia: back_urls redirect |
| **Webhooks** | `/api/v1/webhooks/mp` (pagos) y `/api/v1/webhooks/mp-subscriptions` (suscripciones). HMAC-SHA256 con `timingSafeEqual`. Idempotencia implementada |
| **Suscripciones recurrentes** | `/subscribe/:productId` → Preapproval MP → redirect init_point → back_url → webhook activa suscripción |
| **Frecuencia de suscripción** | `billingDays = servingsPerContainer - 3` (envío 3 días antes de que se acabe el producto) |
| **Descuento de lealtad** | 5% de descuento automático si el usuario ya tuvo una suscripción previa del mismo producto |
| **Tracking de órdenes** | Por `trackingToken` (UUID público). Historial de estados en `OrderHistory` |
| **Devoluciones** | El cliente solicita devolución; admin gestiona el proceso |
| **Panel AdminJS** | Gestión de productos, órdenes, categorías, marcas, suscripciones, devoluciones |
| **Emails transaccionales** | Confirmación de orden, envío, cancelación, activación de suscripción, cobro recurrente, etc. |
| **PDF de comprobante** | Descargable desde `/api/v1/orders/receipt/:token` via PDFKit |
| **Reseñas** | Solo compradores verificados. Una reseña por usuario por producto |
| **Cálculo de envío** | Por peso o subtotal mínimo para envío gratis. Configurable en AdminJS (SystemSettings) |
| **SEO** | Cada página tiene `<title>` y `<meta description>` via react-helmet-async |

---

## 5. Funcionalidades pendientes

- [ ] Migrar `createPreapproval`, `cancelPreapproval`, `getPreapproval` del REST directo al SDK oficial de Mercado Pago (hallazgo C1 de auditoría).
- [x] ~~Agregar `idempotencyKey` en `createPreference`~~ ✅ Hecho 2026-05-26
- [x] ~~Configurar `MP_SUBSCRIPTION_WEBHOOK_SECRET` en Railway~~ ✅ Hecho 2026-05-26
- [x] ~~Registrar `/api/v1/webhooks/mp-subscriptions` en la app de suscripciones de MP~~ ✅ Hecho 2026-05-26
- [ ] Validar flujo completo de tarjeta sin redirect en ambiente de pruebas (con tarjetas de prueba oficiales de MP).
- [x] ~~URL de despliegue del frontend~~ ✅ `https://stf-two.vercel.app` (Vercel)

---

## 6. Reglas importantes del proyecto

1. **No modificar archivos sensibles** (`config.js`, `prisma.js`, `container.js`, `schema.prisma`) sin explicar el motivo antes.
2. **No borrar código funcional** sin justificación explícita.
3. **No cambiar la arquitectura de capas** (route → controller → service → repository) sin avisar.
4. **No inventar** endpoints, campos de BD, variables de entorno ni nombres de archivos.
5. **No hardcodear credenciales** — siempre usar `config.js` que lee de env vars.
6. **Antes de crear algo nuevo**, verificar si ya existe en: `services/`, `components/`, `routes/`, `apiService.js`.
7. **Mantener el patrón de DI**: toda instanciación va en `container.js`.
8. **No modificar migraciones de Prisma existentes**. Para cambios de schema, siempre crear una nueva migración.
9. **No instalar paquetes sin justificarlo** — el proyecto ya tiene todas las librerías necesarias para las funcionalidades actuales.
10. **Respetar el estilo visual existente**: colores (`brand-red`, `kas-text`, `kas-muted`), componentes y estructura de CSS de TailwindCSS.
11. **Si algo no está claro, preguntar antes de improvisar.**

---

## 7. Errores cometidos y cómo evitarlos

| Fecha | Error cometido | Causa probable | Solución aplicada | Cómo evitar repetirlo |
|---|---|---|---|---|
| 2026-05-22 | `onPaymentSubmit` del Payment Brick estaba vacío (no-op) | Se asumió que el brick maneja el pago internamente para tarjetas | Se implementó `POST /api/v1/payments/process` y el handler real en `onPaymentSubmit` | El brick llama `onSubmit` para tarjetas; solo redirige para Oxxo/transferencia |
| 2026-05-22 | `#handleAuthorizedPayment` usaba `mercadoPagoAccessToken` para pagos de suscripciones | Copy-paste del token incorrecto | Cambiado a `mercadoPagoSubscriptionToken` | Pagos de suscripción son generados por la app de suscripciones; usar su token |
| 2026-05-22 | Webhook de pagos sin idempotencia | No se verificaba si la orden ya estaba en PROCESSING antes de actualizarla | Se agregó `getOrderById` + check de `order.status !== 'PENDING'` | Siempre verificar estado actual antes de hacer transiciones de estado |
| 2026-05-22 | Import `authMiddleware` incorrecto en nueva ruta | El middleware se exporta como `authenticate`, no `authMiddleware` | Corregido a `import { authenticate }` | Siempre verificar el nombre exacto del export antes de importar |
| 2026-05-23 | Un solo webhook secret para dos apps de MP distintas | Se asumió que un endpoint era suficiente | Se crearon dos endpoints separados: `/mp` y `/mp-subscriptions` con sus propios secrets | Cada app de MP genera su propio Webhook Secret — nunca compartir un solo endpoint |
| 2026-05-xx | `discountPrice` de Prisma es siempre truthy como objeto Decimal | No se convirtió a `Number()` antes de comparar con `> 0` | Se usa `Number(product.discountPrice) > 0` en todos los servicios | Siempre convertir campos `Decimal` de Prisma con `Number()` antes de operar |

---

## 8. Decisiones técnicas tomadas

| Decisión | Razón | Alternativas descartadas |
|---|---|---|
| **DI manual con `container.js`** | Claridad y control total sin overhead de frameworks de DI | NestJS (demasiado opinionado), tsyringe (requiere TypeScript) |
| **Zod para validación en controllers** | Type-safe, excelente DX, integración natural con Express | Joi (sintaxis más verbosa), class-validator (requiere decorators) |
| **Dos apps separadas en MP** (pagos + suscripciones) | Mercado Pago recomienda apps distintas por producto; secrets de webhook son independientes | Una sola app (conflicto de secrets en webhooks) |
| **Dos endpoints de webhook separados** (`/mp` y `/mp-subscriptions`) | Cada app de MP tiene su propio Webhook Secret; compartir uno causa fallos de validación HMAC | Un solo endpoint con lógica interna para detectar la app origen (no fiable) |
| **`billingDays = servingsPerContainer - 3`** | Se envía 3 días antes de que el cliente se quede sin producto | Otras fórmulas (ej. fecha fija mensual) — menos personalizado |
| **`external_reference` = orderId** | Permite vincular el pago de MP con la orden interna sin estado adicional | Guardar el `paymentId` de MP en la orden antes de confirmación (race condition) |
| **`crypto.timingSafeEqual` para HMAC** | Previene timing attacks en comparación de firmas | `===` simple (vulnerable) |
| **`asyncHandler` wrapper** | Propaga errores de promesas al error handler de Express sin try/catch en cada ruta | try/catch manual en cada handler (repetitivo) |
| **Preapproval vía REST directo** | El SDK de MP v2 no expuso `PreApproval` en el momento de implementación | SDK oficial — **pendiente migrar cuando se confirme disponibilidad** |
| **`orderId` guardado en `orderSummary` del frontend** | Necesario para que `onPaymentSubmit` envíe el ID correcto al backend | Inferir el ID desde `preferenceId` (no confiable) |

---

## 9. Comandos útiles

### Backend (`server/api/`)
```bash
# Instalar dependencias
npm install

# Desarrollo (nodemon con hot reload, delay 1500ms)
npm run dev

# Producción (migra BD + genera cliente Prisma + inicia servidor)
npm start

# Ejecutar seed (datos iniciales)
npm run seed

# Crear nueva migración (después de cambiar schema.prisma)
npx prisma migrate dev --name nombre_de_la_migracion

# Aplicar migraciones en producción
npx prisma migrate deploy

# Generar cliente Prisma
npx prisma generate

# Ver BD con Prisma Studio
npx prisma studio
```

### Frontend (`client/`)
```bash
# Instalar dependencias
npm install

# Desarrollo (Vite dev server, puerto 5173)
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

### Git
```bash
# Ver estado
git status

# Commit y push en un comando
git add . && git commit -m "mensaje" && git push
```

---

## 10. Variables de entorno necesarias

### Backend (`server/api/.env`)

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default: 8080) |
| `NODE_ENV` | `development` o `production` |
| `DATABASE_URL` | Cadena de conexión PostgreSQL (Prisma) |
| `CORS_ORIGIN` | URL del frontend permitida en CORS |
| `FRONTEND_URL` | URL pública del frontend (para construir back_urls de MP) |
| `PUBLIC_URL` | URL pública del backend (para construir back_url de preapproval de suscripciones) |
| `JWT_SECRET` | Secreto para firmar y verificar tokens JWT |
| `ADMIN_EMAIL` | Email de acceso al panel AdminJS |
| `ADMIN_PASSWORD` | Contraseña del panel AdminJS |
| `SESSION_SECRET` | Secreto para la sesión de AdminJS |
| `MERCADOPAGO_ACCESS_TOKEN` | Access Token de la app MP de **pagos únicos** |
| `MP_SUBSCRIPTION_TOKEN` | Access Token de la app MP de **suscripciones** (fallback al principal si no está) |
| `MP_WEBHOOK_SECRET` | Webhook Secret de la app MP de **pagos únicos** |
| `MP_SUBSCRIPTION_WEBHOOK_SECRET` | Webhook Secret de la app MP de **suscripciones** |
| `RESEND_API_KEY` | API Key de Resend para envío de emails |
| `RESEND_FROM` | Dirección remitente (ej: `KAS Supplements <noreply@kassupplements.com>`) |
| `RESEND_DEV_TO` | En desarrollo: todos los emails se redirigen a este correo |

### Frontend (`client/.env`)

| Variable | Descripción |
|---|---|
| `VITE_MERCADOPAGO_PUBLIC_KEY` | Public Key de la app MP de pagos únicos (se usa en el Payment Brick) |
| `VITE_API_URL` | URL base de la API (en dev: vacío para usar el proxy de Vite `/api/v1`) |

> ⚠️ **Nunca subir archivos `.env` al repositorio.** Están en `.gitignore`.

---

## 11. Problemas conocidos

- **Preapproval vía REST directo**: Las operaciones de suscripción (`createPreapproval`, `cancelPreapproval`, `getPreapproval`) usan `fetch` nativo en lugar del SDK oficial de Mercado Pago. Esto incumple el criterio de calidad de MP. Pendiente migrar cuando se confirme que `PreApproval` está disponible en el SDK v2.
- **`idempotencyKey` faltante en `createPreference`**: Si hay doble clic o reintento de red al crear la orden, se pueden generar preferencias duplicadas para el mismo `orderId`. Pendiente agregar `requestOptions.idempotencyKey`.
- **`MP_SUBSCRIPTION_WEBHOOK_SECRET`**: Nueva variable añadida al `config.js` y referenciada en el webhook. Debe configurarse en Railway con el secret correcto de la app de suscripciones de MP para que la validación HMAC funcione en producción.

---

## 12. Checklist antes de modificar código

- [ ] ¿Qué archivos están relacionados con la tarea? (rutas, servicios, repositorios, componentes, tipos)
- [ ] ¿Ya existe lógica similar en `services/`, `components/` o `apiService.js`?
- [ ] ¿El cambio afecta frontend, backend o base de datos?
- [ ] ¿Requiere nueva migración de Prisma?
- [ ] ¿Requiere nueva variable de entorno?
- [ ] ¿Puede romper otra funcionalidad (ej. webhook, carrito, autenticación)?
- [ ] ¿Hay que actualizar `container.js`?

---

## 13. Checklist después de modificar código

- [ ] ¿Hay errors de sintaxis o imports rotos?
- [ ] ¿El backend inicia sin errores (`npm run dev`)?
- [ ] ¿El frontend compila sin errores (`npm run dev`)?
- [ ] ¿La funcionalidad solicitada funciona en flujo completo?
- [ ] ¿Se hizo commit y push a `main`?
- [ ] ¿Se actualizó este archivo si el cambio fue relevante?

---

## 14. Seguridad y precauciones

- **No mostrar ni loggear** Access Tokens, JWT Secrets, Webhook Secrets ni contraseñas.
- **No subir `.env`** al repositorio — está en `.gitignore`.
- **No ejecutar comandos destructivos** (`DROP TABLE`, `prisma db push --force-reset`, `rm -rf`) sin confirmación explícita del usuario.
- **No hacer cambios en el schema de Prisma** sin crear una migración y advertir el impacto.
- **No instalar paquetes nuevos** sin justificación clara. Verificar primero si la funcionalidad ya existe con las librerías actuales.
- **No exponer el `orderId` o `userId` en URLs públicas** — usar `trackingToken` (UUID) para acceso público a órdenes.
- **El `MP_WEBHOOK_SECRET`** debe ser diferente al de suscripciones — cada app de MP genera el suyo.
- El `Access Token` de MP **nunca** debe estar en el frontend — solo en el backend vía `config.js`.

---

## 15. Notas para futuras sesiones

- **Dos aplicaciones en Mercado Pago**: una para pagos únicos (Checkout Bricks) y otra para suscripciones (Preapproval). Cada una tiene su propio `Access Token` y `Webhook Secret`. Los tokens están en Railway como `MERCADOPAGO_ACCESS_TOKEN` y `MP_SUBSCRIPTION_TOKEN`.
- **Dos endpoints de webhook**: `/api/v1/webhooks/mp` (pagos) y `/api/v1/webhooks/mp-subscriptions` (suscripciones). Registrar cada URL en su respectiva app de MP.
- **Flujo de pago con tarjeta**: El Payment Brick llama `onSubmit` → frontend POST a `/api/v1/payments/process` → backend crea el pago con MP SDK → navega a `/payment-success`. El webhook también llega y tiene guardia de idempotencia.
- **Flujo de suscripción**: Frontend POST a `/api/v1/subscriptions` → backend crea Preapproval en MP → devuelve `init_point` → `window.location.href = init_point` → usuario autoriza en MP → webhook `subscription_preapproval` activa la suscripción.
- **Frecuencia de facturación**: `billingDays = product.servingsPerContainer - 3`.
- **Descuento de lealtad**: 5% si el usuario ya tuvo una suscripción previa del mismo producto.
- **AdminJS** está disponible en `/admin` del backend. Las credenciales vienen de `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
- **Prisma Decimal**: Siempre convertir con `Number()` antes de operar matemáticamente con precios.
- **El startup guard en `config.js`** hace que el servidor falle rápido en producción si faltan variables de entorno críticas.
