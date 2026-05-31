import { config } from '../config.js';

const BRAND_NAME = 'STF';

function trim(value) {
    return String(value || '').trim();
}

function stripTrailingSlash(url) {
    return trim(url).replace(/\/+$/, '');
}

export function getFrontendBaseUrl() {
    return (
        stripTrailingSlash(config.frontendUrl)
        || stripTrailingSlash(config.corsOrigin)
        || 'http://localhost:5173'
    );
}

export function buildFrontendUrl(path = '') {
    const base = getFrontendBaseUrl();
    if (!path) return base;
    return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}

export function formatMXN(amount) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(amount || 0));
}

export function formatDateEsMx(dateLike) {
    if (!dateLike) return '';
    return new Date(dateLike).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export function renderBrandHeader({ subtitle = '' } = {}) {
    const logoUrl = trim(config.emailLogoUrl);
    const brandNode = logoUrl
        ? `<img src="${logoUrl}" alt="${BRAND_NAME}" style="display:block;max-width:180px;max-height:56px;margin:0 auto;" />`
        : `<span style="display:inline-block;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:1px;">${BRAND_NAME}</span>`;

    return `
      <tr>
        <td style="background:#111827;padding:24px 32px;text-align:center;">
          ${brandNode}
          ${subtitle ? `<p style="margin:10px 0 0;color:#d1d5db;font-size:13px;">${subtitle}</p>` : ''}
        </td>
      </tr>
    `;
}

export function renderBrandFooter({ note = '' } = {}) {
    return `
      <tr>
        <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            ${BRAND_NAME}${note ? ` &bull; ${note}` : ''}
          </p>
        </td>
      </tr>
    `;
}
