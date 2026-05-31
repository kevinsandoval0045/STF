import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import { Database, Resource, getModelByName } from '@adminjs/prisma';
import { PrismaClient } from '@prisma/client';
import Connect from 'connect-pg-simple';
import session from 'express-session';
import { config } from './config.js';
import { emailService } from './container.js';

// ─── 1. Register Prisma Adapter ───────────────────────────────────────────────
AdminJS.registerAdapter({ Database, Resource });

const prisma = new PrismaClient();

// ─── 2. Admin Credentials ─────────────────────────────────────────────────────
const DEFAULT_ADMIN = {
  email: config.adminEmail,
  password: config.adminPassword,
};

const authenticate = async (email, password) => {
  if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
    return Promise.resolve(DEFAULT_ADMIN);
  }
  return null;
};

/**
 * AdminJS sends String[] fields as a string like "[val1, val2]" or a plain
 * string like "val1" when there is only one item. This helper normalises the
 * value to a proper string array before it reaches Prisma.
 */
function parseFlavorsPayload(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  if (typeof raw === 'string') {
    const cleaned = raw.trim().replace(/^\[|\]$/g, '');
    if (!cleaned) return [];
    return cleaned.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Generate a URL-friendly slug from a product name.
 * e.g. "Whey Protein 2kg" → "whey-protein-2kg"
 */
function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')                      // decompose accented chars
    .replace(/[\u0300-\u036f]/g, '')       // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')         // keep alphanumeric, spaces, hyphens
    .trim()
    .replace(/\s+/g, '-')                  // spaces → hyphens
    .replace(/-+/g, '-');                  // collapse multiple hyphens
}

// ─── 3. AdminJS Instance ──────────────────────────────────────────────────────
const admin = new AdminJS({
  rootPath: '/admin',
  branding: {
    companyName: 'KAS Supplements',
    logo: false,
    withMadeWithLove: false,
    theme: {
      colors: {
        primary100: '#ef4444', // brand red
        primary80: '#dc2626',
        primary60: '#b91c1c',
        primary40: '#991b1b',
        primary20: '#fef2f2',
        accent: '#111827', // brand dark
        hoverBg: '#1f2937',
        border: '#e5e7eb',
      },
    },
  },
  locale: {
    language: 'es',
    translations: {
      es: {
        actions: {
          new: 'Crear nuevo',
          edit: 'Editar',
          show: 'Ver detalles',
          delete: 'Eliminar',
          bulkDelete: 'Eliminar seleccionados',
          list: 'Lista',
        },
        buttons: {
          save: 'Guardar',
          addNewItem: 'Agregar',
          filter: 'Filtrar',
          applyChanges: 'Aplicar cambios',
          resetFilter: 'Reiniciar',
          confirmRemovalMany: 'Confirma la eliminación de {{count}} elementos',
          confirmRemovalMany_plural: 'Confirma la eliminación de {{count}} elementos',
          logout: 'Cerrar Sesión',
          login: 'Iniciar Sesión',
        },
        labels: {
          navigation: 'Menú Principal',
          pages: 'Páginas',
          selectedRecords: 'Seleccionado ({{selected}})',
          filters: 'Filtros',
          loginWelcome: 'Bienvenido',
        },
        messages: {
          successfullyBulkDeleted: 'Se eliminó correctamente {{count}} elemento',
          successfullyBulkDeleted_plural: 'Se eliminaron correctamente {{count}} elementos',
          successfullyDeleted: 'Elemento eliminado correctamente',
          successfullySaved: 'Elemento guardado correctamente',
          successfullyCreated: 'Elemento creado correctamente',
          successfullyUpdated: 'Elemento actualizado correctamente',
          invalidCredentials: 'Email o contraseña inválidos',
          noRecordsInResource: 'No hay elementos en este recurso',
          noRecords: 'No hay elementos',
          confirmDelete: '¿Estás seguro de que quieres eliminar este elemento?',
          loginWelcome: 'Panel de Control - KAS Supplements',
        },
      },
    },
  },
  resources: [
    // ── Users ──────────────────────────────────────────────────────────────
    {
      resource: { model: getModelByName('User'), client: prisma },
      options: {
        navigation: { name: 'Clientes', icon: 'User' },
        properties: {
          password: { isVisible: { list: false, show: false, edit: false, filter: false } },
          createdAt: { isVisible: { list: true, show: true, edit: false, filter: false } },
          updatedAt: { isVisible: { list: false, show: true, edit: false, filter: false } },
        },
        listProperties: ['id', 'email', 'firstName', 'lastName', 'phone', 'city', 'createdAt'],
      },
    },

    // ── Products ───────────────────────────────────────────────────────────
    {
      resource: { model: getModelByName('Product'), client: prisma },
      options: {
        navigation: { name: 'Catálogo', icon: 'ShoppingBag' },
        properties: {
          description: { type: 'textarea' },
          flavors: {
            isVisible: { list: false, show: true, edit: true, filter: false },
            isRequired: false,
            type: 'string',
          },
          createdAt: { isVisible: { list: false, show: true, edit: false, filter: false } },
          updatedAt: { isVisible: { list: false, show: true, edit: false, filter: false } },
        },
        listProperties: ['name', 'price', 'discountPrice', 'stockQuantity', 'servingsPerContainer', 'active', 'featured', 'onSale'],
        actions: {
          new: {
            before: async (request) => {
              if (request.payload) {
                request.payload.flavors = parseFlavorsPayload(request.payload.flavors);
                // Auto-generate slug from name if not provided
                if (!request.payload.slug && request.payload.name) {
                  const base = slugify(request.payload.name);
                  const suffix = Math.random().toString(36).slice(2, 6);
                  request.payload.slug = `${base}-${suffix}`;
                }
              }
              return request;
            },
          },
          edit: {
            before: async (request) => {
              if (request.payload) {
                request.payload.flavors = parseFlavorsPayload(request.payload.flavors);
                // Auto-generate slug from name if slug was cleared
                if (!request.payload.slug && request.payload.name) {
                  request.payload.slug = slugify(request.payload.name);
                }
              }
              return request;
            },
          },
        },
      },
    },

    // ── ProductImages ──────────────────────────────────────────────────────
    {
      resource: { model: getModelByName('ProductImage'), client: prisma },
      options: {
        navigation: { name: 'Catálogo', icon: 'Image' },
        listProperties: ['id', 'url', 'sortOrder', 'productId'],
      },
    },

    // ── Brands ─────────────────────────────────────────────────────────
    {
      resource: { model: getModelByName('Brand'), client: prisma },
      options: {
        navigation: { name: 'Catálogo', icon: 'Tag' },
        properties: {
          createdAt: { isVisible: { list: false, show: true, edit: false, filter: false } },
          updatedAt: { isVisible: { list: false, show: true, edit: false, filter: false } },
        },
        listProperties: ['name', 'slug', 'active', 'sortOrder'],
      },
    },

    // ── Categories ─────────────────────────────────────────────────────────
    {
      resource: { model: getModelByName('Category'), client: prisma },
      options: {
        navigation: { name: 'Catálogo', icon: 'FolderOpen' },
        properties: {
          createdAt: { isVisible: { list: false, show: true, edit: false, filter: false } },
          updatedAt: { isVisible: { list: false, show: true, edit: false, filter: false } },
        },
        listProperties: ['name', 'slug', 'active', 'sortOrder', 'parentId'],
      },
    },

    // ── Orders ─────────────────────────────────────────────────────────────
    {
      resource: { model: getModelByName('Order'), client: prisma },
      options: {
        navigation: { name: 'Pedidos', icon: 'ShoppingCart' },
        properties: {
          status: {
            availableValues: [
              { label: 'Pendiente', value: 'PENDING' },
              { label: 'En proceso', value: 'PROCESSING' },
              { label: 'Enviado', value: 'SHIPPED' },
              { label: 'Entregado', value: 'DELIVERED' },
              { label: 'Completado', value: 'COMPLETED' },
              { label: 'Cancelado', value: 'CANCELLED' },
              { label: 'Devolución solicitada', value: 'RETURN_REQUESTED' },
              { label: 'Devuelto', value: 'RETURNED' },
            ],
          },
          invoiceStatus: {
            availableValues: [
              { label: 'No emitida', value: 'NOT_ISSUED' },
              { label: 'Emitida', value: 'ISSUED' },
              { label: 'Pagada', value: 'PAID' },
            ],
          },
          address: { type: 'textarea' },
          createdAt: { isVisible: { list: true, show: true, edit: false, filter: true } },
          updatedAt: { isVisible: { list: false, show: true, edit: false, filter: false } },
        },
        listProperties: ['orderNumber', 'status', 'email', 'firstName', 'lastName', 'totalAmount', 'createdAt'],
        actions: {
          list: {
            before: async (request) => {
              const { query = {} } = request;
              request.query = {
                ...query,
                ['filters.paymentStatus']: 'approved',
              };
              return request;
            },
          },
          edit: {
            before: async (request, context) => {
              if (request.method === 'post') {
                context.previousOrderStatus = context.record?.params?.status || null;
              }
              return request;
            },
            after: async (response, request, context) => {
              if (request.method !== 'post') return response;

              const oldStatus = context.previousOrderStatus;
              const newStatus = response?.record?.params?.status;
              const orderId = response?.record?.params?.id || context.record?.params?.id;

              if (!orderId || !oldStatus || oldStatus === newStatus) return response;
              if (!['SHIPPED', 'DELIVERED'].includes(newStatus)) return response;

              const order = await prisma.order.findUnique({ where: { id: String(orderId) } });
              if (!order) return response;

              if (newStatus === 'SHIPPED') {
                emailService.sendOrderShipped({
                  email: order.email,
                  firstName: order.firstName,
                  orderNumber: order.orderNumber,
                  trackingToken: order.trackingToken,
                  shippingTrackNo: order.shippingTrackNo,
                  shippingCarrier: order.shippingCarrier,
                });
              }

              if (newStatus === 'DELIVERED') {
                emailService.sendOrderDelivered({
                  email: order.email,
                  firstName: order.firstName,
                  orderNumber: order.orderNumber,
                  trackingToken: order.trackingToken,
                });
              }

              return response;
            },
          },
        },
      },
    },

    // ── OrderItems ─────────────────────────────────────────────────────────
    {
      resource: { model: getModelByName('OrderItem'), client: prisma },
      options: {
        navigation: { name: 'Pedidos', icon: 'List' },
        actions: {
          new: { isAccessible: false },
          edit: { isAccessible: false },
          delete: { isAccessible: false },
        },
        listProperties: ['orderId', 'productNameSnap', 'quantity', 'unitPrice', 'totalPrice'],
      },
    },

    // ── OrderHistory ───────────────────────────────────────────────────────
    {
      resource: { model: getModelByName('OrderHistory'), client: prisma },
      options: {
        navigation: { name: 'Pedidos', icon: 'Clock' },
        actions: {
          new: { isAccessible: false },
          edit: { isAccessible: false },
          delete: { isAccessible: false },
        },
        listProperties: ['orderId', 'oldStatus', 'newStatus', 'performedBy', 'note', 'createdAt'],
      },
    },

    // ── ReturnRequests ─────────────────────────────────────────────────────
    {
      resource: { model: getModelByName('ReturnRequest'), client: prisma },
      options: {
        navigation: { name: 'Devoluciones', icon: 'RotateCcw' },
        properties: {
          type: {
            availableValues: [
              { label: 'Producto defectuoso', value: 'DEFECTIVE_PRODUCT' },
              { label: 'Cambio de opinión', value: 'CHANGE_OF_MIND' },
              { label: 'Producto equivocado', value: 'WRONG_PRODUCT' },
              { label: 'Otro', value: 'OTHER' },
            ],
          },
          status: {
            availableValues: [
              { label: 'Esperando aprobación', value: 'AWAITING_APPROVAL' },
              { label: 'Aprobado', value: 'APPROVED' },
              { label: 'Rechazado', value: 'REJECTED' },
              { label: 'Esperando envío', value: 'AWAITING_SHIPMENT' },
              { label: 'Producto recibido', value: 'PRODUCT_RECEIVED' },
              { label: 'Reembolso recibido', value: 'REFUND_RECEIVED' },
              { label: 'Completado', value: 'COMPLETED' },
            ],
          },
          description: { type: 'textarea' },
          adminNote: { type: 'textarea' },
          createdAt: { isVisible: { list: true, show: true, edit: false, filter: true } },
          updatedAt: { isVisible: { list: false, show: true, edit: false, filter: false } },
        },
        listProperties: ['orderId', 'type', 'status', 'returnCode', 'carrier', 'createdAt'],
        actions: {
          edit: {
            before: async (request, context) => {
              if (request.method === 'post') {
                context.previousReturnStatus = context.record?.params?.status || null;
              }
              return request;
            },
            after: async (response, request, context) => {
              if (request.method !== 'post') return response;

              const oldStatus = context.previousReturnStatus;
              const newStatus = response?.record?.params?.status;
              const returnRequestId = response?.record?.params?.id || context.record?.params?.id;

              if (!returnRequestId || !oldStatus || oldStatus === newStatus) return response;

              const notifyStatuses = new Set(['APPROVED', 'REJECTED', 'REFUND_RECEIVED', 'COMPLETED']);
              if (!notifyStatuses.has(newStatus)) return response;

              const returnRequest = await prisma.returnRequest.findUnique({
                where: { id: String(returnRequestId) },
                include: { order: true },
              });

              if (!returnRequest?.order) return response;

              emailService.sendReturnStatusUpdated({
                email: returnRequest.order.email,
                firstName: returnRequest.order.firstName,
                orderNumber: returnRequest.order.orderNumber,
                status: newStatus,
                adminNote: returnRequest.adminNote,
                returnCode: returnRequest.returnCode,
                carrier: returnRequest.carrier,
              });

              return response;
            },
          },
        },
      },
    },

    // ── Subscriptions ──────────────────────────────────────────────────────
    {
      resource: { model: getModelByName('Subscription'), client: prisma },
      options: {
        navigation: { name: 'Suscripciones', icon: 'RefreshCw' },
        properties: {
          status: {
            availableValues: [
              { label: 'Pendiente', value: 'PENDING' },
              { label: 'Autorizada', value: 'AUTHORIZED' },
              { label: 'Pausada', value: 'PAUSED' },
              { label: 'Cancelada', value: 'CANCELLED' },
            ],
          },
          address: { type: 'textarea' },
          createdAt: { isVisible: { list: true, show: true, edit: false, filter: true } },
          updatedAt: { isVisible: { list: false, show: true, edit: false, filter: false } },
        },
        listProperties: ['productId', 'userId', 'status', 'quantity', 'billingDays', 'amount', 'nextBillingDate', 'createdAt'],
        actions: {
          new: { isAccessible: false },
          delete: { isAccessible: false },
        },
      },
    },

    // ── SubscriptionPayments ───────────────────────────────────────────────
    {
      resource: { model: getModelByName('SubscriptionPayment'), client: prisma },
      options: {
        navigation: { name: 'Suscripciones', icon: 'DollarSign' },
        actions: {
          new: { isAccessible: false },
          edit: { isAccessible: false },
          delete: { isAccessible: false },
        },
        listProperties: ['subscriptionId', 'mpPaymentId', 'status', 'amount', 'createdAt'],
      },
    },

    // ── SystemSettings ─────────────────────────────────────────────────────
    {
      resource: { model: getModelByName('SystemSettings'), client: prisma },
      options: {
        navigation: { name: 'Configuración', icon: 'Settings' },
        properties: {
          id: { isVisible: { list: false, show: false, edit: false, filter: false } },
          updatedAt: { isVisible: { list: false, show: true, edit: false, filter: false } },
        },
        actions: {
          new: { isAccessible: false },
          delete: { isAccessible: false },
        },
        listProperties: ['shippingWeightFactor', 'warehouseWeightLimit', 'freeShippingThreshold', 'maintenanceMode'],
      },
    },

    // ── Reviews ────────────────────────────────────────────────────────────
    {
      resource: { model: getModelByName('Review'), client: prisma },
      options: {
        navigation: { name: 'Reseñas', icon: 'Star' },
        actions: {
          new: { isAccessible: false },
          edit: { isAccessible: false },
        },
        properties: {
          content: { type: 'textarea' },
          createdAt: { isVisible: { list: true, show: true, edit: false, filter: true } },
        },
        listProperties: ['productId', 'userId', 'rating', 'content', 'createdAt'],
      },
    },
  ],
});

// ─── 4. Authenticated Router with Session Store ───────────────────────────────
const ConnectSession = Connect(session);

const sessionStore = new ConnectSession({
  conObject: {
    connectionString: config.databaseUrl,
    ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
  },
  tableName: 'session',
  createTableIfMissing: true,
});

const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  admin,
  {
    authenticate,
    cookieName: 'adminjs',
    cookiePassword: config.sessionSecret,
  },
  null,
  {
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    secret: config.sessionSecret,
    cookie: {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
    },
    name: 'adminjs',
  }
);

export { admin, adminRouter, prisma as adminPrisma };
