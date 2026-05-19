/**
 * Template: Order Shipped Email
 * Sent when an order status changes to SHIPPED.
 *
 * @param {Object} params
 * @param {string} params.firstName
 * @param {string} params.orderNumber
 * @param {string} params.trackingToken
 * @param {string} [params.shippingTrackNo]  - Carrier tracking number
 * @param {string} [params.shippingCarrier]  - Carrier name (e.g. "DHL", "FedEx")
 * @returns {string} HTML string
 */
export function orderShippedTemplate({ firstName, orderNumber, trackingToken, shippingTrackNo, shippingCarrier }) {
    const trackingUrl = `http://localhost:5173/order-tracking?token=${trackingToken}`;

    const carrierSection = shippingTrackNo
        ? `<tr>
            <td style="padding:0 32px 24px;">
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;">
                <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#16a34a;font-weight:600;">Número de guía</p>
                <p style="margin:0;font-size:18px;font-weight:700;color:#111827;font-family:monospace;">${shippingTrackNo}</p>
                ${shippingCarrier ? `<p style="margin:6px 0 0;font-size:13px;color:#6b7280;">Transportista: <strong>${shippingCarrier}</strong></p>` : ''}
              </div>
            </td>
          </tr>`
        : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu pedido fue enviado</title>
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
                <span style="color:#E02424;">KAS</span> Supplements
              </h1>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;">
              <span style="font-size:48px;">🚚</span>
              <h2 style="margin:16px 0 8px;color:#111827;font-size:22px;font-weight:700;">¡Tu pedido está en camino!</h2>
              <p style="margin:0;color:#6b7280;font-size:15px;">
                Hola ${firstName}, tu pedido <strong style="color:#111827;">${orderNumber}</strong> ha sido enviado.
              </p>
            </td>
          </tr>

          <!-- Carrier info -->
          ${carrierSection}

          <!-- CTA -->
          <tr>
            <td style="padding:${shippingTrackNo ? '0' : '0 32px'} 32px;text-align:center;padding-left:32px;padding-right:32px;">
              <a href="${trackingUrl}"
                 style="display:inline-block;background:#E02424;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600;">
                Ver estado de mi pedido
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                KAS Supplements &bull; Si tienes dudas responde este correo.
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
