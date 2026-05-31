import { buildFrontendUrl, renderBrandFooter, renderBrandHeader } from './emailTheme.js';

/**
 * Template: Order Delivered
 * Sent when an order status changes to DELIVERED.
 */
export function orderDeliveredTemplate({ firstName, orderNumber, trackingToken }) {
    const trackingUrl = buildFrontendUrl(`/order-tracking?token=${trackingToken}`);

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pedido entregado</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          ${renderBrandHeader({ subtitle: 'Pedido entregado' })}

          <tr>
            <td style="padding:32px;text-align:center;">
              <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Tu pedido fue entregado</h2>
              <p style="margin:0;color:#6b7280;font-size:15px;line-height:1.6;">
                Hola ${firstName}, confirmamos la entrega del pedido <strong style="color:#111827;">${orderNumber}</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 28px;text-align:center;">
              <a href="${trackingUrl}" style="display:inline-block;background:#E02424;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600;">
                Ver detalle del pedido
              </a>
            </td>
          </tr>

          ${renderBrandFooter({ note: 'Gracias por tu compra en STF.' })}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
