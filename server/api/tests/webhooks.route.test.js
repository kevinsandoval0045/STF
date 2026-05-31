import test from 'node:test';
import assert from 'node:assert/strict';
import { createWebhookRouter } from '../src/routes/webhooks.js';
import { requestJson, startRouterTestServer } from './helpers/httpTestServer.js';

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

test('POST /mp processes approved payment webhook and confirms order', async () => {
    let registerCalls = 0;
    let confirmCalls = 0;

    const orderServiceMock = {
        registerPaymentAttempt: async () => { registerCalls += 1; },
        confirmPaidOrder: async () => {
            confirmCalls += 1;
            return { updated: true, newStatus: 'PROCESSING' };
        },
    };

    const subscriptionServiceMock = {
        handleWebhookEvent: async () => {},
    };

    const fetchMock = async () => ({
        ok: true,
        status: 200,
        json: async () => ({
            status: 'approved',
            external_reference: 'order-123',
        }),
    });

    const router = createWebhookRouter({
        configValues: {
            mercadoPagoAccessToken: 'token',
            mpWebhookSecret: 'secret',
            mpSubscriptionWebhookSecret: 'sub-secret',
            nodeEnv: 'test',
        },
        orderServiceClient: orderServiceMock,
        subscriptionServiceClient: subscriptionServiceMock,
        fetchImpl: fetchMock,
        verifySignatureFn: () => true,
        logger: { log() {}, warn() {}, error() {} },
    });

    const server = await startRouterTestServer(router);
    try {
        const { status } = await requestJson(server.baseUrl, '/mp?data.id=987', {
            method: 'POST',
            body: { type: 'payment', action: 'updated' },
        });

        assert.equal(status, 200);
        await wait(20);
        assert.equal(registerCalls, 1);
        assert.equal(confirmCalls, 1);
    } finally {
        await server.close();
    }
});

test('POST /mp-subscriptions forwards supported event types to subscription service', async () => {
    const received = [];

    const router = createWebhookRouter({
        configValues: {
            mercadoPagoAccessToken: 'token',
            mpWebhookSecret: 'secret',
            mpSubscriptionWebhookSecret: 'sub-secret',
            nodeEnv: 'test',
        },
        orderServiceClient: {
            registerPaymentAttempt: async () => {},
            confirmPaidOrder: async () => ({ updated: false }),
        },
        subscriptionServiceClient: {
            handleWebhookEvent: async (type, id) => {
                received.push({ type, id });
            },
        },
        fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({}) }),
        verifySignatureFn: () => true,
        logger: { log() {}, warn() {}, error() {} },
    });

    const server = await startRouterTestServer(router);
    try {
        const { status } = await requestJson(server.baseUrl, '/mp-subscriptions?data.id=sub-789', {
            method: 'POST',
            body: { type: 'subscription_preapproval', action: 'updated' },
        });

        assert.equal(status, 200);
        await wait(20);
        assert.deepEqual(received, [{ type: 'subscription_preapproval', id: 'sub-789' }]);
    } finally {
        await server.close();
    }
});
