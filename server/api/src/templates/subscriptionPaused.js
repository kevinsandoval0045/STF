import { renderBrandFooter, renderBrandHeader } from './emailTheme.js';

/**
 * Template: Subscription Paused
 * Sent when MP pauses an active subscription.
 */
export function subscriptionPausedTemplate({ firstName, productName, subscriptionId }) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Suscripcion en pausa</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        ${renderBrandHeader({ subtitle: 'Suscripcion pausada' })}

        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hola, <strong>${firstName}</strong></p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
              Detectamos que tu suscripcion a <strong style="color:#111827;">${productName}</strong> quedo en estado <strong>PAUSED</strong>.
              Esto suele ocurrir por un problema temporal en el metodo de pago.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;color:#92400e;font-size:14px;line-height:1.6;">
                  Revisa tu medio de pago en Mercado Pago para reactivar tus cobros automaticos.
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
              Id de suscripcion: <strong>${subscriptionId}</strong>
            </p>
          </td>
        </tr>

        ${renderBrandFooter({ note: 'Si necesitas ayuda, responde este correo.' })}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
