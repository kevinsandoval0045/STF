import express from 'express';

export async function startRouterTestServer(router) {
    const app = express();
    app.use(express.json());
    app.use(router);
    app.use((err, _req, res, _next) => {
        const status = err?.statusCode || 500;
        res.status(status).json({
            error: {
                message: err?.message || 'Internal server error',
                details: err?.errors || undefined,
            },
        });
    });

    const server = await new Promise((resolve) => {
        const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });

    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    return {
        baseUrl,
        close: () => new Promise((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve()));
        }),
    };
}

export async function requestJson(baseUrl, path, { method = 'GET', body, headers = {} } = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
            ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
            ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let data = null;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    return { status: res.status, data };
}
