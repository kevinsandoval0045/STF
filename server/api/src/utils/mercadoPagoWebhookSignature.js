import crypto from 'crypto';

/**
 * Verify Mercado Pago webhook signature (x-signature).
 *
 * @param {import('express').Request} req
 * @param {string} secret
 * @param {Object} [options]
 * @param {string} [options.label]
 * @param {string} [options.nodeEnv]
 * @param {{ warn?: Function, error?: Function }} [options.logger]
 * @returns {boolean}
 */
export function verifyMpSignature(req, secret, options = {}) {
    const {
        label = 'webhook',
        nodeEnv = process.env.NODE_ENV || 'development',
        logger = console,
    } = options;

    // If no secret configured — skip in dev, reject in production
    if (!secret) {
        if (nodeEnv === 'production') {
            logger.error?.(`❌ [Webhook/${label}] Secret not configured in production — rejecting request`);
            return false;
        }
        logger.warn?.(`⚠️  [Webhook/${label}] Secret not configured — skipping signature verification (dev only)`);
        return true;
    }

    const xSignatureHeader = req.headers['x-signature'];
    const xRequestIdHeader = req.headers['x-request-id'];
    const queryDataIdRaw = req.query['data.id'];
    const xSignature = Array.isArray(xSignatureHeader) ? xSignatureHeader[0] : xSignatureHeader;
    const xRequestId = Array.isArray(xRequestIdHeader) ? xRequestIdHeader[0] : xRequestIdHeader;
    const queryDataId = Array.isArray(queryDataIdRaw) ? queryDataIdRaw[0] : queryDataIdRaw;

    if (!xSignature) {
        logger.warn?.(`⚠️  [Webhook/${label}] Missing x-signature header`);
        return false;
    }

    // Parse ts and v1 from x-signature header
    const parts = String(xSignature).split(',');
    let ts = '';
    let hash = '';

    parts.forEach((part) => {
        const [key, ...valueParts] = part.split('=');
        const value = valueParts.join('=');
        if (key?.trim() === 'ts') ts = value?.trim() || '';
        if (key?.trim() === 'v1') hash = value?.trim() || '';
    });

    if (!ts || !hash) {
        logger.warn?.(`⚠️  [Webhook/${label}] Could not parse ts/v1 from x-signature`);
        return false;
    }

    // Build the manifest string per MP docs.
    const dataId = typeof queryDataId === 'string' ? queryDataId.trim().toLowerCase() : '';
    const requestId = typeof xRequestId === 'string' ? xRequestId.trim() : '';
    const manifestParts = [];
    if (dataId) manifestParts.push(`id:${dataId}`);
    if (requestId) manifestParts.push(`request-id:${requestId}`);
    if (ts) manifestParts.push(`ts:${ts}`);

    if (manifestParts.length === 0) {
        logger.warn?.(`⚠️  [Webhook/${label}] Could not build manifest (missing id/request-id/ts)`);
        return false;
    }

    const manifest = `${manifestParts.join(';')};`;
    const computed = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
    const computedBuf = Buffer.from(computed, 'hex');
    const hashBuf = Buffer.from(hash, 'hex');
    const valid = computedBuf.length === hashBuf.length && crypto.timingSafeEqual(computedBuf, hashBuf);

    if (!valid) {
        logger.warn?.(`⚠️  [Webhook/${label}] HMAC verification failed`);
        logger.warn?.(`   Manifest: ${manifest}`);
    }

    return valid;
}
