/**
 * Template: Order Confirmation Email
 * Sent immediately after a successful checkout.
 *
 * @param {Object} params
 * @param {string} params.firstName
 * @param {string} params.orderNumber
 * @param {string} params.trackingToken
 * @param {number} params.totalAmount
 * @param {number} params.shippingCost
 * @param {Array}  params.items  - [{ productName, quantity, unitPrice, totalPrice }]
 * @returns {string} HTML string
 */
export function orderConfirmationTemplate({ firstName, orderNumber, trackingToken, totalAmount, shippingCost, items }) {
    const formatPrice = (n) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

    const itemRows = items
        .map(
            (item) => `
            <tr>
                <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:14px;">
                    ${item.productName} <span style="color:#9ca3af;">× ${item.quantity}</span>
                </td>
                <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;text-align:right;font-weight:600;">
                    ${formatPrice(item.totalPrice)}
                </td>
            </tr>`
        )
        .join('');

    const trackingUrl = `http://localhost:5173/order-tracking?token=${trackingToken}`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmación de pedido</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:#111827;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                Tienda de Suplementos
              </h1>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:32px 32px 0;text-align:center;">
              <div style="width:56px;height:56px;background:#fef2f2;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;">✅</span>
              </div>
              <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">¡Pedido confirmado!</h2>
              <p style="margin:0;color:#6b7280;font-size:15px;">Gracias, ${firstName}. Tu pedido está siendo preparado.</p>
            </td>
          </tr>

          <!-- Order number badge -->
          <tr>
            <td style="padding:24px 32px;">
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;text-align:center;">
                <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;font-weight:600;">Número de pedido</p>
                <p style="margin:0;font-size:20px;font-weight:700;color:#111827;">${orderNumber}</p>
              </div>
            </td>
          </tr>

          <!-- Items table -->
          <tr>
            <td style="padding:0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                <thead>
                  <tr style="background:#f9fafb;">
                    <th style="padding:10px 16px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;text-align:left;font-weight:600;">Producto</th>
                    <th style="padding:10px 16px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;text-align:right;font-weight:600;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
                <tfoot>
                  <tr>
                    <td style="padding:10px 16px;font-size:13px;color:#6b7280;">Envío</td>
                    <td style="padding:10px 16px;font-size:13px;color:#6b7280;text-align:right;">
                      ${shippingCost === 0 ? '<span style="color:#16a34a;font-weight:600;">Gratis</span>' : formatPrice(shippingCost)}
                    </td>
                  </tr>
                  <tr style="background:#fef2f2;">
                    <td style="padding:12px 16px;font-size:15px;font-weight:700;color:#111827;">Total</td>
                    <td style="padding:12px 16px;font-size:18px;font-weight:700;color:#E02424;text-align:right;">${formatPrice(totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:28px 32px;text-align:center;">
              <a href="${trackingUrl}"
                 style="display:inline-block;background:#E02424;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600;">
                Rastrear mi pedido
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Tienda de Suplementos &bull; Si tienes dudas responde este correo.<br/>
                <span style="color:#d1d5db;">Código de seguimiento: ${trackingToken}</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
