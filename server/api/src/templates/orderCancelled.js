import { renderBrandFooter, renderBrandHeader } from './emailTheme.js';

/**
 * Template: Order Cancelled
 * Sent when a customer cancels their own PENDING order.
 */
export function orderCancelledTemplate({ firstName, orderNumber, reason }) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pedido cancelado</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        ${renderBrandHeader({ subtitle: 'Pedido cancelado' })}

        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hola, <strong>${firstName}</strong></p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
              Tu pedido <strong style="color:#111827;">${orderNumber}</strong> fue cancelado exitosamente.
              Si realizaste un pago, el reembolso se procesa en los proximos dias habiles segun tu banco.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px;">Numero de pedido</td>
                      <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${orderNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px;">Estado</td>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px;font-weight:700;text-align:right;">Cancelado</td>
                    </tr>
                    ${reason ? `
                    <tr>
                      <td style="padding:6px 0;color:#6b7280;font-size:14px;">Motivo</td>
                      <td style="padding:6px 0;color:#374151;font-size:14px;text-align:right;">${reason}</td>
                    </tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
              Si fue un error, puedes hacer un nuevo pedido en cualquier momento.
            </p>
          </td>
        </tr>

        ${renderBrandFooter({ note: 'Gracias por confiar en nosotros.' })}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
