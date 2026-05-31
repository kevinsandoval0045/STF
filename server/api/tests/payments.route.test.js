import test from 'node:test';
import assert from 'node:assert/strict';
import { createPaymentRouter } from '../src/routes/payments.js';
import { requestJson, startRouterTestServer } from './helpers/httpTestServer.js';

const ORDER_ID = '11111111-1111-1111-1111-111111111111';

function authStub(req, _res, next) {
    req.user = { userId: req.headers['x-user-id'] || 'user-default' };
    next();
}

test('POST /process returns 403 when order belongs to another user', async () => {
    const orderServiceMock = {
        getOrderById: async () => ({
            id: ORDER_ID,
            userId: 'owner-1',
            status: 'PENDING',
            totalAmount: 120,
        }),
    };

    const paymentServiceMock = {
        processCardPayment: async () => ({ status: 'approved', paymentId: '123' }),
    };

    const router = createPaymentRouter({
        orderServiceClient: orderServiceMock,
        paymentServiceClient: paymentServiceMock,
        authenticateMiddleware: authStub,
    });

    const server = await startRouterTestServer(router);
    try {
        const { status, data } = await requestJson(server.baseUrl, '/process', {
            method: 'POST',
            headers: { 'x-user-id': 'intruder-user' },
            body: { orderId: ORDER_ID, formData: { token: 'abc' } },
        });

        assert.equal(status, 403);
        assert.match(data.error.message, /permiso/i);
    } finally {
        await server.close();
    }
});

test('POST /process returns 400 when order is not PENDING', async () => {
    const orderServiceMock = {
        getOrderById: async () => ({
            id: ORDER_ID,
            userId: 'user-1',
            status: 'PROCESSING',
            totalAmount: 120,
        }),
    };

    const paymentServiceMock = {
        processCardPayment: async () => ({ status: 'approved', paymentId: '123' }),
    };

    const router = createPaymentRouter({
        orderServiceClient: orderServiceMock,
        paymentServiceClient: paymentServiceMock,
        authenticateMiddleware: authStub,
    });

    const server = await startRouterTestServer(router);
    try {
        const { status, data } = await requestJson(server.baseUrl, '/process', {
            method: 'POST',
            headers: { 'x-user-id': 'user-1' },
            body: { orderId: ORDER_ID, formData: { token: 'abc' } },
        });

        assert.equal(status, 400);
        assert.match(data.error.message, /ya fue procesado/i);
    } finally {
        await server.close();
    }
});

test('POST /process approved payment registers attempt and confirms order', async () => {
    const calls = {
        registerPaymentAttempt: 0,
        confirmPaidOrder: 0,
    };

    const orderServiceMock = {
        getOrderById: async () => ({
            id: ORDER_ID,
            userId: 'user-1',
            status: 'PENDING',
            totalAmount: 120,
        }),
        registerPaymentAttempt: async () => {
            calls.registerPaymentAttempt += 1;
        },
        confirmPaidOrder: async () => {
            calls.confirmPaidOrder += 1;
            return { updated: true };
        },
    };

    const paymentServiceMock = {
        processCardPayment: async () => ({
            status: 'approved',
            paymentId: 999,
            statusDetail: 'accredited',
        }),
    };

    const router = createPaymentRouter({
        orderServiceClient: orderServiceMock,
        paymentServiceClient: paymentServiceMock,
        authenticateMiddleware: authStub,
    });

    const server = await startRouterTestServer(router);
    try {
        const { status, data } = await requestJson(server.baseUrl, '/process', {
            method: 'POST',
            headers: { 'x-user-id': 'user-1' },
            body: { orderId: ORDER_ID, formData: { token: 'abc' } },
        });

        assert.equal(status, 200);
        assert.equal(data.status, 'approved');
        assert.equal(calls.registerPaymentAttempt, 1);
        assert.equal(calls.confirmPaidOrder, 1);
    } finally {
        await server.close();
    }
});
