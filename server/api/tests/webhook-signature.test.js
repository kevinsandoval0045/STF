import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { verifyMpSignature } from '../src/utils/mercadoPagoWebhookSignature.js';

test('verifyMpSignature returns true for valid HMAC signature', () => {
    const secret = 'test-secret';
    const ts = '1704908010';
    const requestId = 'req-123';
    const dataId = 'ABCDEF';
    const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
    const hash = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

    const req = {
        headers: {
            'x-signature': `ts=${ts},v1=${hash}`,
            'x-request-id': requestId,
        },
        query: {
            'data.id': dataId,
        },
    };

    const valid = verifyMpSignature(req, secret, { nodeEnv: 'production' });
    assert.equal(valid, true);
});

test('verifyMpSignature returns false when signature header is missing', () => {
    const req = {
        headers: {},
        query: {},
    };

    const valid = verifyMpSignature(req, 'test-secret', { nodeEnv: 'production' });
    assert.equal(valid, false);
});

test('verifyMpSignature allows missing secret in development', () => {
    const req = {
        headers: {},
        query: {},
    };

    const valid = verifyMpSignature(req, '', { nodeEnv: 'development' });
    assert.equal(valid, true);
});
