import test from 'node:test';
import assert from 'node:assert/strict';
import { createReturnRouter } from '../src/routes/returns.js';
import { requestJson, startRouterTestServer } from './helpers/httpTestServer.js';

const ORDER_ID = '22222222-2222-2222-2222-222222222222';
const TRACKING_TOKEN = '33333333-3333-3333-3333-333333333333';

function optionalAuthStub(req, _res, next) {
    const userId = req.headers['x-user-id'];
    req.user = userId ? { userId } : null;
    next();
}

function createPrismaMock({ existingOrder, orderInTx, updateCount = 1 }) {
    return {
        order: {
            findUnique: async () => existingOrder,
        },
        $transaction: async (callback) => {
            const tx = {
                order: {
                    findUnique: async () => orderInTx,
                    updateMany: async () => ({ count: updateCount }),
                },
                returnRequest: {
                    create: async ({ data }) => ({
                        id: 'ret-1',
                        status: 'AWAITING_APPROVAL',
                        type: data.type,
                    }),
                },
                orderHistory: {
                    create: async () => ({}),
                },
            };
            return callback(tx);
        },
    };
}

test('POST /returns rejects registered order when requester is not authenticated owner', async () => {
    const prismaMock = createPrismaMock({
        existingOrder: {
            id: ORDER_ID,
            userId: 'owner-1',
            trackingToken: TRACKING_TOKEN,
        },
        orderInTx: null,
    });

    const router = createReturnRouter({
        prismaClient: prismaMock,
        emailServiceClient: { sendReturnRequestReceived: () => {} },
        optionalAuthMiddleware: optionalAuthStub,
    });

    const server = await startRouterTestServer(router);
    try {
        const { status, data } = await requestJson(server.baseUrl, '/', {
            method: 'POST',
            body: {
                orderId: ORDER_ID,
                type: 'CHANGE_OF_MIND',
                description: 'Quiero devolver este producto por talla.',
            },
        });

        assert.equal(status, 401);
        assert.match(data.error.message, /iniciar sesión/i);
    } finally {
        await server.close();
    }
});

test('POST /returns rejects guest order with invalid tracking token', async () => {
    const prismaMock = createPrismaMock({
        existingOrder: {
            id: ORDER_ID,
            userId: null,
            trackingToken: TRACKING_TOKEN,
        },
        orderInTx: null,
    });

    const router = createReturnRouter({
        prismaClient: prismaMock,
        emailServiceClient: { sendReturnRequestReceived: () => {} },
        optionalAuthMiddleware: optionalAuthStub,
    });

    const server = await startRouterTestServer(router);
    try {
        const { status, data } = await requestJson(server.baseUrl, '/', {
            method: 'POST',
            body: {
                orderId: ORDER_ID,
                trackingToken: '44444444-4444-4444-4444-444444444444',
                type: 'CHANGE_OF_MIND',
                description: 'Solicitud de devolución para pedido invitado.',
            },
        });

        assert.equal(status, 403);
        assert.match(data.error.message, /token/i);
    } finally {
        await server.close();
    }
});

test('POST /returns allows guest order with valid tracking token and creates return', async () => {
    let emailsSent = 0;
    const prismaMock = createPrismaMock({
        existingOrder: {
            id: ORDER_ID,
            userId: null,
            trackingToken: TRACKING_TOKEN,
        },
        orderInTx: {
            id: ORDER_ID,
            status: 'DELIVERED',
            returnRequest: null,
            email: 'guest@example.com',
            firstName: 'Guest',
            orderNumber: 'SUP-TEST-001',
        },
    });

    const router = createReturnRouter({
        prismaClient: prismaMock,
        emailServiceClient: {
            sendReturnRequestReceived: () => { emailsSent += 1; },
        },
        optionalAuthMiddleware: optionalAuthStub,
    });

    const server = await startRouterTestServer(router);
    try {
        const { status, data } = await requestJson(server.baseUrl, '/', {
            method: 'POST',
            body: {
                orderId: ORDER_ID,
                trackingToken: TRACKING_TOKEN,
                type: 'WRONG_PRODUCT',
                description: 'Me llegó un sabor distinto al solicitado.',
            },
        });

        assert.equal(status, 201);
        assert.equal(data.returnRequest.type, 'WRONG_PRODUCT');
        assert.equal(emailsSent, 1);
    } finally {
        await server.close();
    }
});
